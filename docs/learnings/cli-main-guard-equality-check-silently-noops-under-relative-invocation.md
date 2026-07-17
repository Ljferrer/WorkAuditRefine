---
name: cli-main-guard-equality-check-silently-noops-under-relative-invocation
description: "fileURLToPath(import.meta.url) === process.argv[1] is always-absolute vs as-given — a relative CLI invocation makes them unequal, so main() silently never runs (exit 0, no output)"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: cli-main-guard-equality-check-silently-noops-under-relative-invocation
  phase: "land-failure-recovery/phase-1 task 1.1 (landed dev/2026-07-16-land-failure-recovery; audit finding, disposition note)"
  keywords: 
    - fileURLToPath import.meta.url
    - "process.argv[1]"
    - node CLI main guard
    - run as CLI only when invoked directly
    - relative invocation silent no-op
    - ESM entry point check
    - path.resolve argv
  tags: 
    - node
    - cli
    - footgun
    - fail-loud
  created: 2026-07-16
  originSessionId: 655475be-a01b-4702-b846-b2c53bbde3d3
---

# `fileURLToPath(import.meta.url) === process.argv[1]` silently no-ops under a relative CLI invocation

**What happened (code-verified — found at `skills/war/assets/stage-workflow.mjs`, the trailing
"Run as CLI only when invoked directly" guard: `if (process.argv[1] &&
fileURLToPath(import.meta.url) === process.argv[1]) { main(process.argv) }`; still present at land
— this was a Nit-severity audit finding with `disposition: 'note'`, informational only, not fixed
in this phase):** `fileURLToPath(import.meta.url)` is **always an absolute path**. `process.argv[1]`
is **whatever string the shell invoked the script with** — absolute when the caller wrote
`node /abs/path/to/script.mjs`, but a bare relative string (`node script.mjs` or
`node skills/war/assets/stage-workflow.mjs` from the repo root) when the caller didn't. When the
two disagree in absoluteness, the strict-equality guard is false, `main()` is never called, and
the process exits 0 having done **nothing** — no output, no error, no indication the invocation
was malformed. For a tool whose whole contract is fail-loud (missing/duplicated anchors throw a
named error), this one entry-point check is the single silent exception.

**Why it's low-risk here but still worth naming:** every *intended* invocation in this codebase
passes an absolute path (the launch prose dispatches `stage-workflow.mjs` via an absolute
`$MAIN`-anchored path; the test suite's `STAGER` constant is absolute) — so the footgun has no
live trigger today. It resurfaces the moment anyone runs the script by hand from a relative cwd,
or copies the same main-guard idiom into a new CLI script without checking invocation style.

**The fix, if ever hardened:** normalize both sides before comparing —
`path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)` — so a relative invocation
still resolves to the same absolute path and correctly triggers `main()`.

**Why this is a generic pattern, not a one-off:** this is the standard Node ESM
"run as CLI only when invoked directly" idiom (the CommonJS-era `require.main === module`
successor), and it is commonly copy-pasted **without** the `path.resolve` normalization. Any new
Node CLI script in this codebase that uses the bare-equality form inherits the same silent-no-op
footgun under relative invocation — worth a quick check whenever adding one.

## Related

[[uniform-shell-out-idiom-mislabels-export-only-function-as-cli-subcommand]] — a different
CLI-surface footgun in the same family (shell-invocation idiom assumptions), unrelated mechanism
but same "grep the idiom before trusting it" discipline.
