# CLI main-guard normalization — realpathSync idiom in the three unnormalized run-as-CLI guards

Source spec: `docs/specs/2026-07-22-cli-main-guard-normalization-design.md` (survey-corps
2026-07-22, from issue #988; converted by `/war-machine --afk` 2026-07-22).

## AI-Commander's Intent

*(AI-authored under ADR 0014 — `--afk` conversion; intent is the ceiling, the plan slice is the
floor)*

- **Purpose:** no invocation shape can make a live CLI in this repo silently do nothing — the three
  guards that exit 0 without running `main()` under symlink (and, for the ledger, percent-encodable
  path) invocation converge on the one normalized idiom already proven at three sites, restoring
  the fail-loud contract everywhere.
- **Method:** byte-converge the three unnormalized guards on the canonical `war-memory.mjs` form
  (`process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])`) — no
  new variant, no shared helper; prove each fix with a symlink-invocation regression test that goes
  RED against the pre-change guard (the issue's relative-invocation trigger is non-discriminating
  on Node ≥ 24); correct the origin lesson in place with a RESOLVED note carrying the true
  mechanism; release last.
- **End state:**
  1. `realpathSync(process.argv[1])` appears in the run-as-CLI guard of each of
     `skills/war/assets/stage-workflow.mjs`, `skills/war/assets/war-config.mjs`,
     `skills/war-campaign/assets/campaign-ledger.mjs` — exactly one match per file — and the
     anchored sweep greps (spec §4.4: `=== process.argv\[1\]` and `file://\${process.argv` over
     `skills/` and `hooks/`) report no unnormalized guard, only the enumerated survivors.
  2. Each of the three test suites gains one symlink-invocation regression test: symlink in a
     `mkdtempSync` scratch dir → spawn `process.execPath` on the symlink with no CLI args → assert
     non-zero exit **and** the CLI's live `usage:` line on the stream that CLI actually uses
     (stderr for stage-workflow and campaign-ledger; stdout for war-config — probed live). Each
     test was run RED against the pre-change guard (exit 0, both streams empty) before the fix;
     the worker's done report records that RED run.
  3. Import hygiene holds: `war-config.mjs` gains only `realpathSync` (named import from
     `node:fs`, beside its guard-adjacent `fileURLToPath` import); `campaign-ledger.mjs` gains
     only `fileURLToPath` (from `node:url`); `stage-workflow.mjs` gains no imports.
  4. `node --test 'skills/**/*.test.mjs'` is green — including the three suites' existing
     import-based tests, which is the check that importing the modules still never fires `main()`.
  5. The origin lesson's `description` begins `RESOLVED (`; its body records the mechanism
     correction (Node ≥ 24 pre-resolves `process.argv[1]`, so relative invocation never triggered;
     live triggers were symlink invocation on all bare guards plus percent-encodable paths on the
     ledger's `file://` concat); `symlink invocation` is added under `metadata.keywords`;
     `node skills/_shared/war-memory.mjs lint docs/learnings/` (the exact CI check) passes.
  6. All four version slots sit in lock-step at the next free patch above the live base at land
     time (`version-slots.test.mjs` is the arbiter).

## Build order (for /war)

1. **Phase 1 — Guard convergence + lesson correction** (waves: 1.1 → 1.2)
2. **Phase 2 — Release** (trailing, own phase)

## Phase 1 — Guard convergence + lesson correction

### Task 1.1: normalize the three guards + symlink-invocation regression tests

- Files: `skills/war/assets/stage-workflow.mjs`, `skills/war/assets/war-config.mjs`, `skills/war-campaign/assets/campaign-ledger.mjs`, `skills/war/assets/stage-workflow.test.mjs`, `skills/war/assets/war-config.test.mjs`, `skills/war-campaign/assets/campaign-ledger.test.mjs`
- Plan slice: One uniform idiom swap across the three trailing run-as-CLI guards (cross-cutting
  change ⇒ one task), converging on the canonical form live in `skills/_shared/war-memory.mjs`:
  `if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1]))`.
  Per file (spec §4.1): **stage-workflow.mjs** — condition-only edit at the guard under its
  "Run as CLI only when invoked directly" comment (`fs` and `fileURLToPath` already imported);
  existing `main(process.argv)` call shape unchanged. **war-config.mjs** — add
  `import { realpathSync } from 'node:fs'` beside the guard-adjacent
  `import { fileURLToPath } from 'node:url'` and use `realpathSync(process.argv[1])`
  (named-import style, matching that file's guard-side imports); `main(process.argv)` unchanged.
  **campaign-ledger.mjs** — full replacement of the `` import.meta.url === `file://${process.argv[1]}` ``
  concat guard (two reproduced defects: symlink + percent-encoding, and no `process.argv[1] &&`
  undefined-guard) with the canonical form using the file's existing default `fs` import
  (`fs.realpathSync`) plus a new `import { fileURLToPath } from 'node:url'` in the header imports;
  keep the zero-arg `main()` call. Guard comments stay — they describe intent, not the comparison
  mechanism. Do not touch the three already-normalized sites (`war-memory.mjs`,
  `plan-literal-lint.mjs`, `red-team-gate.mjs` — spec §3 row 6). Regression tests (spec §4.2), one
  per suite, authored RED-first: in a `mkdtempSync` scratch dir (each suite already has the
  pattern), `fs.symlinkSync` a link to the suite's absolute CLI path (`STAGER` in
  stage-workflow.test.mjs; `join(__dir, 'war-config.mjs')` as used by war-config.test.mjs's
  existing CLI test; the `CLI` constant in campaign-ledger.test.mjs), spawn `process.execPath` on
  the **symlink** with no CLI args, and assert non-zero exit plus the usage line on the stream
  each CLI actually emits it on — `usage: node stage-workflow.mjs …` on stderr,
  `usage: war-config.mjs …` on **stdout** (its no-args path writes usage to stdout and exits 1 —
  probed live; spec §4.2's "error stream" wording is corrected here), `usage:
  campaign-ledger.mjs …` on stderr. Reuse each suite's local spawn idiom — campaign-ledger's
  `cli` helper pins the real CLI path, so call `execFileSync` on the symlink directly there;
  `execFileSync` throws on non-zero, so assert via the thrown error's `status` and stream fields.
  Discrimination proof: run each new test against the pre-change guard first and record the RED
  result (symlinked invocation exits 0, both streams empty) in the done report, then apply the fix
  and show GREEN. Post-change sweep (spec §4.4): run both anchored greps over `skills/` and
  `hooks/` (never repo-root — stale worktree copies); report survivors against the spec's
  enumerated legitimate list (red-team-gate's try/catch variant; the lesson file's quoted history;
  intent-describing guard comments).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: origin-lesson RESOLVED note + mechanism correction

- Files: `docs/learnings/cli-main-guard-equality-check-silently-noops-under-relative-invocation.md`
- Plan slice: Edit the lesson in place (spec §4.3; in-place RESOLVED note, not archive — archiving
  is `/lessons-learned`'s operator-gated call). Prefix the frontmatter `description` with
  `RESOLVED (realpathSync normalization + symlink-invocation regression tests, <date task 1.2
  merges>): ` — keep the total description tight (it is a MEMORY.md projection row; projection
  bytes are driven by descriptions, not bodies). Add a body section recording the resolution and
  the mechanism correction: on Node ≥ 24 `process.argv[1]` arrives pre-resolved to an absolute
  path, so relative invocation (the lesson's recorded trigger) never fired the no-op; the live
  triggers were symlink invocation (all bare-equality guards — loader realpaths the main module,
  argv[1] keeps the symlink) and percent-encodable checkout paths (the `` file://${argv[1]} ``
  concat form in `campaign-ledger.mjs`, an instance the original lesson missed). Add
  `symlink invocation` to `metadata.keywords` (nested under `metadata:` — a top-level `keywords:`
  is silently not indexed). Provenance stays `code-verified`. Precedent for the in-place prefix:
  `war-memory-archive-cross-root-dupe-mutates-repo-root`. Validate with the exact CI check:
  `node skills/_shared/war-memory.mjs lint docs/learnings/` passes.
- requiresTest: false
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: version bump, all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump to the next free patch above the live base across all four version slots in
  lock-step — `plugin.json` version, `marketplace.json` `metadata.version` and
  `plugins[0].version`, and the README `## Status` line (replace-in-place, no badge);
  `version-slots.test.mjs` is the arbiter. Expected integration base: the campaign branch tip at
  this plan's land turn — the 2026-07-22 roadmap serializes landing, so predecessor plans'
  Release bumps may already occupy patches; resolve the next free patch from the live slots at
  land time, never from this plan's authoring base. Standalone fallback: if this plan runs outside
  the campaign, the base is current master — same rule, resolve from the live slots. Release
  blurb: one additive line describing the fix (guards normalized to the realpathSync idiom;
  symlink-invocation silent no-op fixed) — no rename is involved, so no absence-guard interaction
  is expected.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

Full suite green per phase: `node --test 'skills/**/*.test.mjs'` and the self-discovery shell-test
gate (reference `resolveGate` in `war-config.mjs`; never enumerate suites — the resolved gate
already runs every `*.test.sh`).

## Deferred validations (backstops — AI-declared)

- Live-local MEMORY.md render stays under the hard budget (200 lines / 24,400 bytes) after the
  lesson's `description` grows its `RESOLVED (` prefix (spec §10.5, second clause) · why
  deferred: depends on the operator's local memory corpus, not repo fixtures — the repo-side
  redaction lint runs in-phase · runner: operator,
  `node skills/_shared/war-memory.mjs render-index --local "$CLAUDE_MEMORY_LOCAL" --repo
  docs/learnings` after merge (pass `--repo` — while `docs/learnings/` rides an unmerged branch a
  `--local`-only render silently drops every `[repo]` row); also surfaced by Phase 0 of the next
  `/lessons-learned` pass.

## Notes / conscious deviations

- **ADR 0014 provenance:** authored by `/war-machine --afk` — intent heading is
  `## AI-Commander's Intent` and the backstops heading carries the AI-declared marker; no
  operator ratified either.
- **Spec §4.2 stream correction (drift found while grounding):** the spec says each regression
  test asserts the usage string "on the error stream"; probed live, `war-config.mjs`'s no-args
  path writes its usage line to **stdout** (exit 1) — its own header comment distinguishes the
  usage error from "errors on stderr". Task 1.1 asserts the stream each CLI actually uses.
  Discrimination is unaffected: against the pre-change guard the symlinked invocation exits 0
  with both streams empty.
- **Regression trigger diverges from issue #988's literal text** (relative invocation) by design:
  spec §1 mechanism correction + §3 row 4 — relative invocation is non-discriminating on the
  Node ≥ 24 baseline (argv[1] arrives pre-resolved), so a relative-invocation test passes even
  against the bare guard (vacuous). The symlink trigger is the reproduced one. Latitude-rule
  precedent: `plan-literal-test-spec-can-be-vacuous-strengthen-under-latitude-rule`.
- **1.1 → 1.2 wave edge is semantic, not import-based:** the lesson's `RESOLVED (` claim must be
  true of the tree it lands on, so 1.2's worker rebases onto the merged fix; self-adjudicated,
  the spec's `<land date>` placeholder resolves to the date task 1.2 merges.
- **Worker RED-run evidence is done-report-only (soft):** the pre-change guard no longer exists
  once the fix merges, so spec §10.2's discrimination proof is in-task probe evidence per
  `deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold` — gate-audit treats the
  resulting cannot-confirm as SOFT, never a hold.
- **Sibling shared-file contention: none in write sets.** The concurrent
  war-memory-hardening plan (spec `docs/specs/2026-07-22-war-memory-hardening-design.md`) edits
  `skills/_shared/war-memory.mjs` (tighten/effectiveDate constructs); this plan only *reads* that
  file as the reference idiom and *executes* its `lint`/`render-index` verbs for validation —
  no write, no construct overlap. war-strategy-structure-lock's surfaces (its structure test +
  its own lesson file) are fully disjoint; `plan-literal-lint.mjs` is untouched here (an
  already-normalized reference site, spec §3 row 6). Their touched lesson files are different
  files in `docs/learnings/`. The roadmap serializes landing regardless.
- **`node --preserve-symlinks-main` is accepted, unguarded** (spec §8): it inverts the loader's
  realpathing and would flip the regression tests; nothing in this repo passes the flag. Re-open
  only if the repo ever adopts it.
- **requiresPackaging false throughout:** prose/CLI-script change set; the packaging floor is a
  no-op without a Dockerfile in the diff path anyway.
- **`realpathSync` throw path accepted** (spec §8): argv[1] naming a nonexistent file while the
  module still loads has no live invocation shape, and a loud throw satisfies the fail-loud
  contract — same acceptance as the two existing bare sites.

## Open decisions

None — all forks were resolved in the spec's design tree (§3 rows 1–7). Two micro-adjudications
made here and recorded above: the `<land date>` stamp resolution and the 1.1 → 1.2 wave edge.
