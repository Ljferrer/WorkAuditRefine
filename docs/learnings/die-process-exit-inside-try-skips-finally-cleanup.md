---
name: die-process-exit-inside-try-skips-finally-cleanup
description: "A die()/process.exit() helper called from inside a try block terminates the process without unwinding the stack, so the enclosing try/finally cleanup never runs — scratch dirs leak on every error path"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - process.exit
    - finally not called
    - try finally skipped
    - die helper
    - scratch dir leak
    - mkdtempSync
    - fail-fast CLI
    - cleanup skipped
    - os.tmpdir leak
    - error path hygiene
  provenance: code-verified
  slug: die-process-exit-inside-try-skips-finally-cleanup
  phase: lessons-learned-seed/phase-1 task 1.1 (landed dev/2026-07-22-lessons-learned-seed)
  tags: 
    - node
    - cli-tooling
    - process-exit
    - cleanup
    - temp-files
  created: 2026-07-22
  originSessionId: 8a3e4cd6-492f-43ba-b10c-46e460a457b9
  modified: 2026-07-22T20:07:02.113Z
---

# `process.exit()` inside a `try` body never runs the enclosing `finally`

**What (code-verified — found at `skills/lessons-learned/assets/seed-pack.mjs`, `die()` @ line 59
`process.exit(code)`; verify still present before acting):** a shared `die(code, msg)` helper that
calls `process.exit(code)` terminates the process immediately — it does not unwind the call stack,
so any `try { ... } finally { fs.rmSync(scratchDir, ...) }` block the failing code is nested inside
is **skipped entirely**. In this file three such regions exist: `cmdPack`'s staging dir (~line 327),
`verifyTier`'s extraction tmp dir (~line 356), `cmdEvict`'s seed/archive tmp dirs (~line 456) — every
one of them calls `die()` (directly, or via `runTar`/`readManifest`/lint checks) from *inside* the
guarded try, so any error path that fires mid-operation (a failing verify, a mid-op tar failure, a
redaction-lint hit) leaves an `os.mkdtempSync` scratch dir under `os.tmpdir()`. Exit codes and
already-written artifacts are unaffected — this is temp-file hygiene only, not an output-correctness
defect, and the OS eventually reaps `/tmp`.

**Why it's easy to miss:** the try/finally *looks* like it guarantees cleanup, and it does for every
in-band `throw`/return path — it's specifically the `process.exit()` escape hatch that breaks the
contract, because `process.exit()` bypasses stack unwinding (and any `finally`) by design, unlike a
thrown `Error`.

**How to apply:** before trusting a `try { ... } finally { cleanup }` region as leak-proof, check
whether any function reachable inside the try (including transitively, via a shared "fail fast"
helper) can call `process.exit()` directly — if so, the `finally` is dead code on that path. Fix
options: (1) have the fail helper `throw` a tagged Error instead of exiting, and exit once at the
outermost catch after cleanup runs; or (2) wrap the exit call itself so it deletes any registered
scratch dirs first. Low-value to fix in a re-runnable, author-time CLI tool (accepted as-is here,
disposition `note`) — but load-bearing to know before reusing the same `die()`-into-`process.exit()`
shape in a long-running or automated context where leaked temp dirs actually accumulate.
