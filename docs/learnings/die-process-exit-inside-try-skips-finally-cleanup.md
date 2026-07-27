---
name: die-process-exit-inside-try-skips-finally-cleanup
description: "RESOLVED (memory-tooling-hardening/1.3, #1079, landed 2026-07-26): die() now throws a tagged Error and main() alone calls process.exit after every finally has unwound. Was: a die()/process.exit() helper called from inside a try block terminates the process without unwinding the stack, so the enclosing try/finally cleanup never runs — scratch dirs leaked on every error path"
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
    - RESOLVED
    - tagged Error throw
    - single exit point
  provenance: code-verified
  promoted: dev/2026-07-22-lessons-learned-seed@phase-1
  slug: die-process-exit-inside-try-skips-finally-cleanup
  phase: "lessons-learned-seed/phase-1 task 1.1 (landed dev/2026-07-22-lessons-learned-seed); RESOLVED memory-tooling-hardening/phase-1 task 1.3 (landed dev/2026-07-24-memory-tooling-hardening, 2026-07-26)"
  tags: 
    - node
    - cli-tooling
    - process-exit
    - cleanup
    - temp-files
  created: 2026-07-22
  updated: 2026-07-26
  originSessionId: 8a3e4cd6-492f-43ba-b10c-46e460a457b9
  modified: 2026-07-27T03:52:08.384Z
---

**Local recurrence copy** of the repo-root lesson at
`docs/learnings/die-process-exit-inside-try-skips-finally-cleanup.md` (same slug) — the repo copy is
not directly editable by a servitor (D1), so this file carries the original content plus the
`## RESOLVED` section below; a future Gate-2 promotion of this file overwrites the same-slug repo
file.

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
scratch dirs first. Option (1) is what actually landed — see `## RESOLVED` below; the "low-value to
fix... accepted as-is" framing that used to close this paragraph no longer applies.

## RESOLVED (memory-tooling-hardening/1.3, #1079, landed dev/2026-07-24-memory-tooling-hardening 2026-07-26)

**Code-verified — found at `skills/lessons-learned/assets/seed-pack.mjs`; verify still present
before acting.** Option (1) above is what shipped: `die(code, msg)` (now at the `die helper` comment
block starting line 59, function body at line 66) no longer calls `process.exit` — it throws
`Object.assign(new Error(msg), { exitCode: code })`. `main()` (module-scope, no enclosing try around
itself) wraps the single dispatch call in one try/catch: an untagged error (`typeof e?.exitCode !==
'number'`) rethrows unchanged (never masquerades as a contract exit); a tagged error writes
`e.message` to stderr and is the **only** `process.exit()` call left in the file, reached only after
every `finally` in the call chain (`cmdPack`'s staging dir, `verifyTier`'s extraction tmp dir,
`cmdEvict`'s seed/archive tmp dirs) has already unwound and `fs.rmSync(..., {recursive:true,
force:true})`'d its scratch dir. Observable subprocess contract (every exit status 1/3/4/5, every
stderr fragment) is byte-identical — proven by the full pre-existing `seed-pack.test.mjs` suite
passing unmodified, plus a new TMPDIR-scoped subprocess test asserting zero `seed-pack-*` entries
survive a `verify` failure.

**New narrow divergence this refactor introduces (not closed, recorded as a residual):** because the
three `finally` blocks now actually run during a die-triggered unwind (they never did under the old
`process.exit()`-inside-try shape), a `finally` body that itself throws — e.g.
`fs.rmSync(scratchDir, {recursive:true, force:true})` hitting EACCES/EBUSY on the self-created temp
dir — REPLACES the tagged error. `main()`'s catch then sees `typeof e?.exitCode !== 'number'`,
rethrows, and the process exits 1 with a raw stack trace instead of the intended 3/4/5 contract exit.
Likelihood is low (`force:true` absorbs ENOENT, dirs are self-created under `os.tmpdir()`, seed
tarballs carry only flat `*.md` members) and deliberately left unguarded — wrapping every cleanup
`finally` in a bare `try {} catch {}` was scoped out of the fix ("no new cleanup beyond what the
existing finally blocks already do"). Know this before copying the throw-based `die()` pattern
elsewhere: a `finally`-cleanup-failure-masks-the-real-error class of bug becomes reachable the moment
`process.exit()`-in-try becomes `throw`-in-try, where it wasn't reachable before.

**Also newly implicit:** `main()`'s single try/catch design is silently coupled to every verb
(`cmdPack`/`cmdVerify`/`cmdEvict`) staying fully synchronous — a future `async` verb whose tagged
`die()` throw happens inside a Promise becomes an unhandled rejection that skips the catch entirely
(stack trace + exit 1, not the contract code). No guard exists for this today since no async verb
exists; note it before adding one.
