# CLI main-guard normalization — adopt the realpathSync idiom in the three unnormalized run-as-CLI guards

**Source issues:** #988 (Bare-equality CLI main guard silently no-ops under relative invocation in stage-workflow.mjs and war-config.mjs).
**Source lesson:** `docs/learnings/cli-main-guard-equality-check-silently-noops-under-relative-invocation.md`.

## 1. Context — the gap / problem

Six live CLIs in this repo end with an ESM "run as CLI only when invoked directly" guard. Three
already use the canonical normalized form (`fileURLToPath(import.meta.url) ===
fs.realpathSync(process.argv[1])`): `skills/_shared/war-memory.mjs`,
`skills/war-strategy/assets/plan-literal-lint.mjs`, and (as a try/catch-wrapped `invokedDirectly`
boolean) `skills/red-team/assets/red-team-gate.mjs`. Three do not:

- `skills/war/assets/stage-workflow.mjs` — bare equality: `fileURLToPath(import.meta.url) === process.argv[1]`
- `skills/war/assets/war-config.mjs` — same bare equality
- `skills/war-campaign/assets/campaign-ledger.mjs` — string concat: `import.meta.url === `file://${process.argv[1]}``, with no `process.argv[1] &&` guard

When the guard's comparison silently mismatches, `main()` never runs and the process exits 0 with
no output — the single silent exception to these tools' otherwise fail-loud contract
(stage-workflow's header prose ratifies fail-loud: "a missing OR duplicated meta anchor exits
NON-ZERO with a named error (never a silent fork)").

**Mechanism correction (verified against the live runtime, Node v24.17.0).** The issue and lesson
name *relative invocation* as the trigger. That does not reproduce: Node resolves
`process.argv[1]` to an absolute path itself, so `node ./war-config.mjs`, `node
stage-workflow.mjs` etc. all run `main()` today (verified: all three print their usage error, exit
1). The live triggers are:

1. **Symlink invocation** (all three guards): Node's ESM loader realpaths the main module
   (`import.meta.url` names the symlink *target*) but `process.argv[1]` is resolved-not-realpathed
   (names the symlink). Reproduced on the real `stage-workflow.mjs` via a symlink: silent exit 0,
   zero output. The same invocation of `war-memory.mjs` (realpathSync idiom) correctly runs
   `main()` — the canonical idiom is immune.
2. **Percent-encodable checkout paths** (campaign-ledger only): `import.meta.url` percent-encodes
   (a space becomes `%20`); the `` `file://${process.argv[1]}` `` concat does not. Reproduced: a
   checkout path containing a space makes the ledger guard silently no-op even under absolute
   invocation.

The defect class in #988 is real and the fix is the one the group ratified (adopt the existing
realpathSync idiom); only the recorded trigger was wrong, and the lesson's RESOLVED note must
correct it (see §4.3) — otherwise the regression tests would be authored against a
non-discriminating trigger (§3 row 4).

## 2. Pivotal constraints

- **Fail-loud contract.** The guard must never silently swallow a genuine direct invocation. The
  fix direction is "run main() in more legitimate cases", never "exit quietly in more".
- **One idiom, already in-repo.** The codebase has a working normalized guard at three sites.
  This change converges on that byte-shape; it must not introduce a fourth variant (the issue
  body's `path.resolve` proposal is resolved against in §3 row 1).
- **Node ≥ 24 runtime** (repo baseline, CLAUDE.md). argv[1] auto-resolution to absolute is why
  relative invocation is not a live trigger and why the regression tests must use the symlink
  trigger to discriminate.
- **Tests must discriminate** (lesson `weak-test-assertion-passes-without-feature-being-exercised`):
  a relative-invocation test passes even with the bare guard — vacuous. Each regression test must
  go RED against the pre-change guard.
- **Per-file import surfaces differ.** `war-config.mjs` has no static `node:fs` import (only a
  dynamic one inside `main`); `campaign-ledger.mjs` has no `node:url` import. The change adds only
  the named imports each guard needs, adjacent to the existing guard-side imports.
- **Repo-root lesson edit.** The lesson file lives in `docs/learnings/`; the edit must pass the
  fail-closed redaction lint (`war-memory.mjs lint`, the only CI check) and keep the
  `description` tight — projection bytes are driven by descriptions, not bodies (lesson
  `projection-byte-budget-driven-by-descriptions-not-bodies`).
- **Cluster-wide binding constraints (1)–(4)** — none bind this group: no auditor/refiner/servitor
  behavior changes (no `agents/*.md` / `workflow-template.js` prompt surface), the three guards are
  not hand-mirrored into `workflow-template.js`, no auditor-allowlist or effectiveDate logic is
  touched. Stated here so the absence is explicit, not overlooked.

## 3. Resolved design tree

| # | Decision | Options considered | Resolution + why |
|---|----------|--------------------|-------------------|
| 1 | Normalization primitive | (a) `path.resolve(process.argv[1])` (issue body's proposal); (b) `fs.realpathSync(process.argv[1])` (existing idiom); (c) URL-side compare via `pathToFileURL` | **(b) realpathSync.** It is the only option that fixes the *actually reproduced* trigger: under symlink invocation, `path.resolve` still yields the symlink path while `import.meta.url` names the realpathed target — (a) fixes only the trigger that doesn't exist on Node ≥ 24. (b) also matches the two live plain-guard sites byte-for-byte. |
| 2 | Bare vs try/catch-wrapped realpathSync | (a) bare, guarded by `process.argv[1] &&` (war-memory.mjs / plan-literal-lint.mjs form); (b) try/catch (red-team-gate.mjs form) | **(a) bare.** Two of three existing sites are bare; the throw path requires argv[1] to name a nonexistent file while the module still loads (no live invocation shape), and a loud throw there satisfies the fail-loud contract anyway. |
| 3 | campaign-ledger scope | (a) minimal patch of its `file://` concat; (b) full replacement with the canonical guard | **(b) full replacement.** The concat form has two defects (symlink + percent-encoding, both reproduced) and lacks the `process.argv[1] &&` undefined-guard; converging all three files on one idiom is the point of the sweep. `main()`'s zero-arg call shape is preserved. |
| 4 | Regression-test trigger | (a) relative invocation (per issue text); (b) symlink invocation | **(b) symlink.** (a) is non-discriminating on the repo's Node baseline (verified: all three CLIs run `main()` relatively-invoked today); (b) reproduces the silent exit-0 against the current guards and goes green with the fix. This supersedes the issue's literal test spec under the latitude rule (lesson `plan-literal-test-spec-can-be-vacuous-strengthen-under-latitude-rule`). |
| 5 | Shared helper vs inline idiom | (a) `isMainModule()` in `skills/_shared/`; (b) keep the idiom inline per file | **(b) inline.** The pattern already lives inline at three sites; a helper means import churn in six files plus a coupling surface for a one-line idiom, and `_shared/` imports are not available to every consumer context. |
| 6 | Touch the three already-correct sites? | (a) rewrite red-team-gate's try/catch variant for uniformity; (b) leave all three untouched | **(b) untouched.** They are correct. red-team-gate's variant computes a reusable boolean and is a deliberate local shape, not drift. |
| 7 | Lesson disposition | (a) archive the lesson; (b) RESOLVED note in place + mechanism correction | **(b).** Precedent: `war-memory-archive-cross-root-dupe-mutates-repo-root` carries a `RESOLVED (<fix>, <date>):` description prefix in place. Archiving is `/lessons-learned`'s operator-gated call, not this change's. The note must also correct the recorded trigger (§1), since the lesson's `code-verified` provenance covered the code *shape*, not an executed repro. |

## 4. Mechanics

### 4.1 Guard replacement (three files)

Each file's trailing run-as-CLI guard becomes the canonical form live in `war-memory.mjs`:

```js
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  main(...)   // each file's existing call shape, unchanged
}
```

- `stage-workflow.mjs`: already imports `fs` and `fileURLToPath` — condition-only change at the
  guard under the "Run as CLI only when invoked directly" comment.
- `war-config.mjs`: add `import { realpathSync } from 'node:fs'` beside the existing guard-adjacent
  `import { fileURLToPath } from 'node:url'`; use `realpathSync(process.argv[1])` (named-import
  style, matching that file's guard-side imports).
- `campaign-ledger.mjs`: add `import { fileURLToPath } from 'node:url'` to the header imports; the
  guard uses the existing default `fs` import (`fs.realpathSync`). Keep the zero-arg `main()` call.

Existing guard comments ("Run as CLI only when invoked directly…") remain accurate and stay.

### 4.2 Regression tests (one per CLI, in the existing suites)

Each of `stage-workflow.test.mjs`, `war-config.test.mjs`, `campaign-ledger.test.mjs` gains one
test: create a symlink (in a `fs.mkdtempSync` dir) pointing at the suite's existing absolute CLI
constant (`STAGER` / the war-config path / `CLI`), spawn `process.execPath` on the *symlink* with
no CLI args, and assert the fail-loud surface fires: non-zero exit **and** the usage string on the
error stream (`usage: war-config.mjs …`, `usage: node stage-workflow.mjs …`,
`usage: campaign-ledger.mjs …` — all verified live). Against the pre-change guards this test sees
exit 0 with empty output and fails RED; that RED run is the discrimination proof (§10.2). Reuse
each suite's existing spawn helper where one exists (`campaign-ledger.test.mjs`'s `cli`/`cliIn`
use `execFileSync`, which throws on non-zero — assert via the thrown error's status/stderr).

### 4.3 Lesson RESOLVED note

Edit `docs/learnings/cli-main-guard-equality-check-silently-noops-under-relative-invocation.md`:

- Prefix `description` with `RESOLVED (realpathSync normalization + symlink-invocation regression
  tests, <land date>): ` — keep the total description short (it is a MEMORY.md projection row).
- Add a body section recording both the resolution and the mechanism correction: on Node ≥ 24,
  `process.argv[1]` arrives pre-resolved to an absolute path, so relative invocation never
  triggered the no-op; the live triggers were symlink invocation (all bare guards) and
  percent-encodable checkout paths (the `` file://${argv[1]} `` concat form found in
  `campaign-ledger.mjs`, an instance the original lesson missed). Add `symlink invocation` to
  `metadata.keywords`. Provenance stays `code-verified` (now execution-verified).

### 4.4 Post-change sweep (token sweep + mandatory same-scope survey)

Sweep step: `grep -rn "=== process.argv\[1\]" skills/ hooks/` and
`grep -rn 'file://\${process.argv' skills/ hooks/` (anchored to `skills/` and `hooks/` — a
repo-root find/grep picks up stale duplicates under `.claude/worktrees/`, a known trap). Expected
survivors: none for the second pattern; for the first, only lines that also contain
`realpathSync(process.argv[1])`.

**Manual same-scope survey (grep is a floor, not a ceiling)** — hand-scan performed at spec time;
stragglers found and their dispositions:

1. `skills/red-team/assets/red-team-gate.mjs` — the try/catch `invokedDirectly` realpathSync
   variant. Same concept, different words; already normalized; deliberately untouched (§3 row 6).
2. `skills/war-campaign/assets/campaign-ledger.mjs` — the `` `file://${process.argv[1]}` `` form
   is exactly a same-meaning sibling that a sweep for `=== process.argv[1]` misses (token order
   differs). In scope here; the second grep pattern above exists to catch this shape, and the
   survey is what found it.
3. `docs/learnings/cli-main-guard-equality-check-silently-noops-under-relative-invocation.md` —
   quotes the bare idiom as history; legitimate survivor (enumerated-docs exemption, lesson
   `enumerated-file-list-absence-guard-for-rename-with-legitimate-history`), and it gains the
   RESOLVED note rather than a rewrite of its quoted history.
4. Guard-adjacent comments in `stage-workflow.mjs` / `war-config.mjs` ("Run as CLI only when
   invoked directly (not when imported by the test)") — describe intent, not the comparison
   mechanism; still accurate post-change; no edit.
5. Stale copies under `.claude/worktrees/` — out of the sweep's anchored scope by design; never
   edited.

## 5. Surface changes

- `skills/war/assets/stage-workflow.mjs` — guard condition (one line)
- `skills/war/assets/war-config.mjs` — guard condition + one named import
- `skills/war-campaign/assets/campaign-ledger.mjs` — guard replacement + one named import
- `skills/war/assets/stage-workflow.test.mjs` — one symlink-invocation regression test
- `skills/war/assets/war-config.test.mjs` — one symlink-invocation regression test
- `skills/war-campaign/assets/campaign-ledger.test.mjs` — one symlink-invocation regression test
- `docs/learnings/cli-main-guard-equality-check-silently-noops-under-relative-invocation.md` —
  RESOLVED prefix + mechanism-correction body note + one keyword

No agents/, hooks/, or workflow-template.js surface. No file overlap with any other survey group.

## 6. New domain terms (CONTEXT.md)

None. "Main guard" / "run-as-CLI guard" is existing informal vocabulary; no glossary entry needed.

## 7. Recommended ADRs

None — mechanical convergence on an existing in-repo idiom; no architectural decision crosses
this change's boundary.

## 8. Open risks / implementation notes

- `realpathSync` throws if `process.argv[1]` names a nonexistent path. Reachable only from exotic
  embeddings (argv rewritten while the module still loads); the throw is loud, which is the
  contract. Accepted at the two existing bare sites for months.
- `node --preserve-symlinks-main` inverts the symlink behavior (loader stops realpathing) and
  would flip the regression tests; nothing in this repo passes that flag. Not guarded.
- The regression tests create symlinks; `fs.symlinkSync` on darwin/linux needs no privilege. The
  suites already use `mkdtempSync` scratch dirs — follow the local pattern.
- Issue #988 names only two files; `campaign-ledger.mjs` is the survey-derived third instance
  (§4.4 item 2), included per the group's ratified scope. Nothing in #988 is deferred.

## 9. Non-goals / deferred

- No shared `isMainModule()` helper (§3 row 5).
- No edits to the three already-normalized guards (`war-memory.mjs`, `plan-literal-lint.mjs`,
  `red-team-gate.mjs`) (§3 row 6).
- No CommonJS `require.main === module` sweep — no live instances exist under `skills/`/`hooks/`.
- Lesson archiving (vs the in-place RESOLVED note) is deferred to a future `/lessons-learned`
  pass (§3 row 7).
- Percent-encoding regression coverage beyond the symlink test: once all three guards share the
  realpathSync idiom, the encoding trigger (unique to the removed concat form) is structurally
  gone; a dedicated space-in-path test is not required.

## 10. Validation criteria

1. **Idiom convergence:** `grep -n 'realpathSync(process.argv\[1\])'` matches exactly once in
   each of `skills/war/assets/stage-workflow.mjs`, `skills/war/assets/war-config.mjs`,
   `skills/war-campaign/assets/campaign-ledger.mjs`; the sweep patterns in §4.4 report no
   unnormalized guard under `skills/` or `hooks/`.
2. **Discrimination proof:** each new regression test, run against the pre-change guard (feature
   mentally deleted), fails — the symlinked invocation exits 0 with empty output; with the fix it
   asserts non-zero exit plus the CLI's `usage:` line.
3. **Suites green:** `node --test skills/war/assets/stage-workflow.test.mjs
   skills/war/assets/war-config.test.mjs skills/war-campaign/assets/campaign-ledger.test.mjs`
   passes, and the full `node --test 'skills/**/*.test.mjs'` run stays green.
4. **Import hygiene:** `war-config.mjs` gains only `realpathSync` (from `node:fs`);
   `campaign-ledger.mjs` gains only `fileURLToPath` (from `node:url`); `stage-workflow.mjs` gains
   no imports.
5. **Lesson integrity:** the lesson's `description` begins `RESOLVED (`; its body names the
   Node ≥ 24 argv[1] auto-resolution and the symlink trigger; `node skills/_shared/war-memory.mjs
   lint docs/learnings/` (the exact CI check) passes; `render-index --local "$CLAUDE_MEMORY_LOCAL"
   --repo docs/learnings` still renders under the 200-line / 24,400-byte hard budget.
6. **Behavior preservation:** importing each of the three modules (as every test suite does) still
   never invokes `main()` — the existing import-based suites passing is the check.
