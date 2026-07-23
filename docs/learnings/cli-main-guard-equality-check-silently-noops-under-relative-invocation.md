---
name: cli-main-guard-equality-check-silently-noops-under-relative-invocation
description: "RESOLVED (realpathSync normalization + symlink-invocation regression tests, 2026-07-23): all three run-as-CLI guards now realpath before comparing; the real trigger was symlink invocation, not relative paths"
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
    - symlink invocation
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

*(The four paragraphs above are the lesson's original incident record, preserved for provenance —
the specific trigger they name, relative invocation, is now known never to have been live. See the
mechanism correction below.)*

## RESOLVED — guards normalized to the realpathSync idiom (#1070, 2026-07-23)

**Resolution — code-verified in this task's rebased worktree** (Task 1.1 landed into the phase-1
integration tip before this task ran; confirmed at all three sites): the run-as-CLI guards in
`stage-workflow.mjs`, `war-config.mjs`, and `campaign-ledger.mjs` now use the canonical
`process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])` idiom
already live in `skills/_shared/war-memory.mjs`, each locked by a symlink-invocation regression
test (symlink a link to the CLI in a `mkdtempSync` scratch dir, spawn the symlink with no args,
assert non-zero exit plus the CLI's live `usage:` line on the stream it actually uses).

**Mechanism correction:** this lesson's originally recorded trigger — relative CLI invocation —
never actually fired the no-op. On Node ≥ 24, `process.argv[1]` arrives **pre-resolved to an
absolute path** before the script ever sees it, so a relative invocation string can't reach the
guard at all (confirmed live via red-team probe on Node v24.17.0); the relative-invocation framing
above was a vacuous, untested hypothesis. The two triggers that DO fire the no-op: **symlink
invocation**, on every bare-equality guard — the module loader realpaths the main module for
`import.meta.url`, but `process.argv[1]` keeps the symlink path the caller typed, so the two sides
disagree — and **percent-encodable checkout paths**, on `campaign-ledger.mjs`'s now-replaced
`` file://${process.argv[1]} `` string-concat guard (an instance this lesson originally missed:
string concatenation never percent-encodes, but `import.meta.url` does, so a checkout path
containing a reserved character broke the comparison even on an absolute, non-symlinked
invocation).

## Related

[[uniform-shell-out-idiom-mislabels-export-only-function-as-cli-subcommand]] — a different
CLI-surface footgun in the same family (shell-invocation idiom assumptions), unrelated mechanism
but same "grep the idiom before trusting it" discipline.
