# Target-repo-aware test floor — per-phase re-evaluation of the `--afk` testPattern proposal + near-miss diagnostics on `no-test`

Source spec: `docs/specs/2026-07-22-test-floor-target-repo-design.md` (from issue #983; survey
2026-07-22). Stacks on `docs/plans/2026-07-22-merge-land-resilience.md`, which lands first per the
campaign roadmap — see Notes for the stacking assumptions taken against that group's spec.

## AI-Commander's Intent

*(AI-authored under `/war-machine --afk` — ADR 0014 provenance; drafted from the ratified spec.
Intent is the ceiling, the plan slice is the floor.)*

- **Purpose:** a cross-repo `/war` run never again burns relaunches on a test-floor false-negative
  the run itself could see — the `--afk` Setup proposal a docs-only tree rejected gets re-checked
  and adopted at phase launches as the target repo grows matching files, and the first `no-test`
  on a pattern mismatch says so out loud instead of three add-test rounds later.
- **Method:** three fail-open layers, none touching the floor's exit contract (0 = test found,
  1 = the `no-test` route, 2 = git error — never conflated; ADR 0006): a script-side near-miss
  diagnostic on stderr only, exit-1 path only (stdout stays the byte-empty refiner read contract);
  a new orthogonal optional `MERGE_RESULT.floor_diagnostic` field (the `gate_failure_class`
  precedent — never a status value, ADR 0005 enums byte-untouched) captured verbatim by the
  refiner on both prompt surfaces and interpolated pt-tagged into the ADD_TEST fixPrompt and the
  exhaustion escalation; and Lead-prose monotonic re-adoption of the recorded rejected Setup
  proposal at each phase launch (`null` → proposal, once; never a freshly minted pattern — D7's
  floor-time derivation stays rejected). The plugin-scoped null default stays byte-identical
  (ADR 0019).
- **End state:**
  1. `assert-test-in-diff.sh`: on the exit-1 path with a non-empty changed-file list, a near-miss
     scan against the fixed documented set (`*.test.*`, `*.spec.*`, basename `test_*`, `*_test.*`)
     prints a stderr block naming the active pattern set (the custom `--pattern` tokens when
     supplied, else the two defaults, plus a note that the `*.test.sh` union arm is always in
     force) and each near-miss path; stdout stays byte-empty; exit codes unchanged; no scan on
     exit 0 or on the exit-2 path.
  2. `assert-test-in-diff.test.sh` is green with the spec §10 1–4 cases: `runner/x.test.mjs` bare
     → exit 1 + stderr names the defaults and lists the path + stdout empty; same diff with
     `--pattern '*.test.mjs'` → exit 0 + empty stderr; a docs-only exit-1 diff → stderr
     byte-identical to today (empty); a bad-ref exit-2 → no near-miss block.
  3. `MERGE_RESULT` in `workflow-template.js` lists optional `floor_diagnostic` (string, fail-open
     advisory, never routed on); the `status` enum is byte-unchanged and the existing status-enum
     drift guards (`land-decision.test.mjs` + the mirrored copies) stay green unmodified.
  4. Every dispatched merge-task prompt site that renders the `assert-test-in-diff.sh` invocation
     (discovered from the live tree — expected four at this plan's base: initial merge,
     floor-retry re-merge, baseline-proceed, environment-proceed) instructs verbatim-stderr
     capture into `floor_diagnostic` on exit 1, and `agents/war-refiner.md` step 4 carries the
     same capture tokens — locked by the extended standalone testPattern both-surfaces drift-guard
     (validation-6 lineage): per-discovered-site token assertion over a ≥ 3 non-vacuity floor,
     never an exact hardcoded site count.
  5. The ADD_TEST fixPrompt, when `floor_diagnostic` is a non-empty string, quotes the diagnostic
     and instructs reconciling the diff's test files against the active pattern — including
     "report blocked naming the mismatch rather than adding a duplicate test"; with the field
     absent the fixPrompt is byte-identical to today (set-minus idiom) — both asserted in
     `workflow-template.test.mjs`.
  6. The `no-test` exhaustion path carries the last diagnostic as `detail` on both the `escalated`
     entry (reason `no-test`) and the `no-test:exhausted` auditLog entry when present; absent ⇒
     both entries shape-identical to today — asserted in `workflow-template.test.mjs`.
  7. `skills/war/SKILL.md`: the `--afk` sanity-floor bullet records the rejected proposal
     **verbatim** plus its zero-match tokens in the ledger note; the "Run one Workflow per phase"
     paragraph re-checks a pending rejected proposal when the threaded value is still `null`
     (same each-token-matches-≥ 1-file Glob rule against the current tree), adopts monotonically
     for this and subsequent phases with an adoption ledger note, and never re-asks interactively
     — and an adopted value passes the same glob-safe charset rule the config validator enforces
     before it is threaded — grep-checkable per spec §10 criterion 9.
  8. `skills/war/references/schemas.md` documents `floor_diagnostic` beside the other optional
     MergeResult fields and rewords `overrides.testPattern` threading as per-phase-resolved.
  9. The one-shot-prose sweep is applied: no live surface under `skills/war/` (SKILL.md,
     schemas.md, the `assert-test-in-diff.sh` header, the `workflow-template.js` args comment)
     still describes `overrides.testPattern` as decided once per run with no re-evaluation;
     survey-derived stragglers are corrected and listed in done reports.
  10. `CONTEXT.md` carries the two spec §6 terms (near-miss diagnostic; pending testPattern
      proposal).
  11. `node --test 'skills/**/*.test.mjs'` and the anchored shell-test loop over `hooks/` +
      `skills/` are green end-to-end.
  12. Release lands last: all four version slots in lock-step at the next free patch above the
      live base.

## Build order (for /war)

1. **Phase 1 — Near-miss diagnostic + engine threading + Lead re-evaluation + docs**
   (waves: 1.1 ∥ 1.2 ∥ 1.3 → 1.4)
2. **Phase 2 — Release** (trailing, own phase)

## Phase 1 — Near-miss diagnostic + engine threading + Lead re-evaluation + docs

### Task 1.1: `assert-test-in-diff.sh` near-miss stderr diagnostic + shell cases

- Files: `skills/war/assets/assert-test-in-diff.sh`, `skills/war/assets/assert-test-in-diff.test.sh`
- Plan slice: **Script (spec §4, D4/D5).** After the match loop, when `found` is 0 and the
  captured `changed_files` list is non-empty, scan the same list against the fixed near-miss set —
  `*.test.*`, `*.spec.*`, `*_test.*` (whole-path bash-3.2 `case` suffix matching, same idiom as
  `match_sh_suite`), and basename-prefix `test_*` (match on the basename, the prefix-shaped
  convention). If any path matches, print a short stderr block naming (a) the **active pattern
  set** — the custom `--pattern` tokens when `custom_pattern` is non-empty, else the two default
  patterns (`skills/**/*.test.mjs`, `**/*.test.sh`), plus one note that the `*.test.sh` union arm
  (`match_sh_suite`) is always in force — and (b) each near-miss path. Print the default set
  **from the existing `pattern_mjs`/`pattern_sh` variables** (defined at arg-parse, currently
  unread by the match logic), never fresh string literals — a third statement of the default set
  would drift from the header and the matcher independently. Then exit 1 exactly as
  today: the `printf ''` empty-summary **stdout** contract is byte-untouched (the refiner reads
  stdout; diagnostics ride stderr only). No scan on exit 0; no scan on the exit-2 `die … 2` path
  (a diff that could not be computed has no file list — the 0/1/2 contract, including
  exit-2-never-collapses-into-`no-test`, is byte-preserved). Header comment: document the
  near-miss set and its diagnostic-only nature (a false positive costs one stderr line, can never
  block or change an exit code), and apply this task's sweep half — reword the `--pattern`
  header note ("threaded per-run from the run's overrides.testPattern") to per-phase-resolved
  (pinned at Setup; the `--afk` rejected-proposal re-check can adopt the Setup proposal at a later
  phase launch). **Mapped test (same diff, spec §10 criteria 1–4).** New fixture cases in the
  existing per-case mktemp-repo style: (a) diff adds `runner/x.test.mjs`, bare invocation → exit
  1, stderr contains both default pattern strings and `runner/x.test.mjs`, stdout **byte-empty**;
  (b) same fixture with `--pattern '*.test.mjs'` → exit 0, stderr empty (no diagnostic on
  success); (c) a docs-only exit-1 diff (no near-miss files) → stderr byte-identical to today
  (empty); (d) the exit-2 bad-ref path → exit 2 and stderr carries no near-miss block (assert the
  diagnostic marker absent — row-scoped, not a whole-file count); (e) a custom-pattern near-miss
  (diff adds `src/foo.spec.ts`, `--pattern '*.test.ts'`) → exit 1, stderr names the custom token
  set and lists the spec file. Update the test-file header case index. All pre-existing cases
  (1–11, incl. the floor ⊆ gate parity family and case 11's FAIL-CLOSED FLOOR CLASSIFICATION
  (#732) — landed after this plan was authored; new near-miss cases append **after** case 11,
  never treating case 10 as the last existing family) stay unmodified and green. **Mandatory manual
  survey (grep is a floor):** hand-scan the script's header blocks and the test file's case
  comments for same-meaning one-shot/per-run phrasings; list stragglers as survey-derived
  corrections in the done report.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: `MERGE_RESULT.floor_diagnostic` + capture at every dispatched floor site + ADD_TEST interpolation + exhaustion detail (both prompt surfaces, one commit)

- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-refiner.md`
- Plan slice: **Schema (D6).** In the `MERGE_RESULT` literal, add optional
  `floor_diagnostic: { type: 'string' }` with a comment marking it fail-open advisory — the
  test-floor's near-miss stderr, carried verbatim; never routed on; no `status` enum value,
  `HARD_ESCALATION_REASONS` member, or `KNOWN_LAND_DECISIONS` member added or changed
  (`land-decision.mjs` and the hand-mirrored copies byte-untouched, ADR 0005; the
  `gate_failure_class` orthogonal-field precedent). **Dispatched capture (both-surfaces rule, same
  commit).** At **every** dispatched merge-task prompt site that renders the
  `assert-test-in-diff.sh` invocation via the `${testPatternArg}` interpolation — at this plan's
  base expected four: the initial merge-task prompt (label `merge:<taskId>`), the floor-retry
  re-merge (label `merge:<taskId>:floor-retry:r<n>`), the baseline-proceed re-merge (label
  `merge:<taskId>:baseline-proceed`), and merge-land-resilience's environment-proceed re-merge
  (label `merge:<taskId>:environment-proceed`; enumerate from the live tree, not this list —
  see Notes) — extend the requiresTest-true ternary arm with: on exit 1, additionally capture the
  script's **stderr verbatim** as `floor_diagnostic` in the returned MergeResult alongside
  `status: 'no-test'`; empty/absent stderr ⇒ omit the field. The requiresTest:false arm is
  byte-unchanged. Mirror the same instruction in `agents/war-refiner.md` "## merge-task" step 4's
  exit-1 bullet (standing surface, same commit), and apply that file's sweep half — step 4's "the
  run's pinned `overrides.testPattern`" rewords to per-phase-resolved, keeping the `--pattern` /
  `overrides.testPattern` tokens the existing validation-6 drift-guard anchors on. **ADD_TEST
  fixPrompt (D6).** In the floor-retry sub-loop, the `isNoTest` branch of `fixPrompt` appends —
  **only when `floorMr.floor_diagnostic` is a non-empty string** — a pt-tagged paragraph quoting
  the diagnostic verbatim and instructing the fix-worker to reconcile the diff's test files
  against the **active pattern**: the mapped test may already exist under a path the pattern
  misses; in that case the correct fix is often nothing the worker can do — report blocked naming
  the mismatch rather than adding a duplicate test. Absent ⇒ the fixPrompt is byte-identical to
  today (conditional append, `pt`-tagged so an undefined value can never render — the
  pt-tagged-prompt-value-identity discipline; any genuinely new untagged value-composition
  template literal must land its `LITERAL_REGISTRY` row in the same diff, but prefer pt-tagged
  prompt text and plain property reads so the census is untouched). **Exhaustion detail (D6).**
  The floor-retry budget-exhaustion site (the `escalated.push({ … reason: floorMr.status,
  fixRounds … })` + `auditLog.push({ … verdict: \`${floorMr.status}:exhausted\` … })` pair) gains
  `detail: floorMr.floor_diagnostic` on **both** entries when it is a non-empty string; absent ⇒
  both entries byte-shape-identical to today (no `detail` key). **Comment rewords (sweep half).**
  The top-of-file args comment ("testPattern = the run's pinned overrides.testPattern … at both
  merge-task sites") and the `testPatternArg` threading comment block ("BOTH merge-task invocation
  sites (initial + floor-retry)") reword to per-phase-resolved and to "every dispatched merge-task
  floor invocation site" — no enumerated site count in prose (the count is stack-fragile;
  the drift-guard discovers sites). **Mapped tests (same diff, spec §10 criteria 5–8).**
  (a) Extend the standalone testPattern both-surfaces drift-guard (the "testPattern drift-guard
  (validation 6, --pattern half)" test and its threading sibling): discover every dispatched-site
  occurrence of the `assert-test-in-diff.sh … ${testPatternArg}` invocation in the template
  **source**, assert the discovered count ≥ 3 (non-vacuity floor — never an exact count; the site
  set grows under stacking), and assert **each** discovered site's prompt text carries the capture
  tokens (`floor_diagnostic`, stderr-verbatim, exit-1-scoped); assert `agents/war-refiner.md`
  carries the same tokens (token-anchored, case-tolerant — the existing validation-6 idiom). This
  plan deliberately adds **no** D3 both-surfaces registry row (spec D8 — the diagnostic is
  fail-open advisory; the registry's exact no-slack row-count floor is contended by a serialized
  sibling chain). (b) fixPrompt pair via the existing `runNoTestLoop` driver: first Refine result
  `{ mode: 'merge-task', status: 'no-test', floor_diagnostic: '<unique token>' }` ⇒ the dispatched
  `add-test:` worker prompt contains the token and the reconcile-against-active-pattern
  instruction; the field-absent run's add-test prompt is **byte-identical** to today's (the
  set-minus-clause byte-identity idiom already used by the threading test). (c) Exhaustion detail:
  drive the loop to `no-test` exhaustion with the last no-test result carrying
  `floor_diagnostic`; assert the `escalated` entry (reason `no-test`) and the
  `no-test:exhausted` auditLog entry both carry it as `detail`; a diagnostic-less exhaustion run
  keeps both entries `detail`-free. (d) Schema lock: `MERGE_RESULT.properties.floor_diagnostic`
  exists and `MERGE_RESULT.properties.status.enum` is deep-equal to today's member list (criterion
  7's byte-unchanged half); the existing enum drift guards run unmodified. Existing tests
  (threading validation 2, #268 blocked-add-test, packaging site-count) must stay green —
  the capture sentence is additive inside the requiresTest-true arm only.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: Lead prose — rejected-proposal ledger record + per-phase re-check (`skills/war/SKILL.md`)

- Files: `skills/war/SKILL.md`
- Plan slice: **Two mechanics edits (D1/D2/D3) + this file's sweep half.** (1) In Setup step 3's
  "`--afk` sanity floor" sub-bullet (under the "Test-floor pattern" bullet): on fallback to
  `null`, the ledger note records the **rejected proposal verbatim** (the full proposed token
  set) plus **which tokens matched zero files** — the pending-proposal record the per-phase
  re-check reads. (2) In the "Run one Workflow per phase" paragraph (the construct where
  `overrides.testPattern` is threaded into `args.plan.testPattern`): before threading, when the
  ledger carries a pending rejected proposal **and** the value to thread is still `null`, re-run
  the **same** each-token-matches-≥ 1-file `Glob` check from the sanity floor against the
  *current* tree; every token now matching ⇒ adopt the proposal as this and subsequent phases'
  `plan.testPattern` and append an adoption ledger note; otherwise keep `null` and the proposal
  stays pending. **Charset re-assert before threading (grill-verified gap):** the rejected
  proposal never rode `overrides.testPattern`, so `war-config.mjs`'s `validate()` charset guard
  never saw it, and the threaded value is embedded single-quoted into agent shell lines — the
  exact surface the guard exists for; so the adoption step re-asserts the same glob-safe charset
  rule (the validator's `overrides.testPattern` check) on the value before threading. A
  charset-failing proposal is never adopted; the ledger note records the failure and closes the
  proposal (a charset violation cannot self-heal, so it never re-checks). Adoption is monotonic
  (`null` → the Setup proposal, once; never a freshly minted
  pattern, never a revocation, never a new interactive ask; scoped to the `--afk` sanity-floor
  fallback path — interactive Setup has no mechanical rejection). The ledger note is a lagging
  record, not a resume authority (git > labels > ledger, ADR 0008). (3) Sweep half: the
  "Test-floor pattern" bullet's "floor ⊆ gate is **one Setup decision**" stays true for the
  *confirmation* but is qualified so it no longer reads as the final word on the value; the
  launch paragraph's "the run's pinned `overrides.testPattern`" rewords to per-phase-resolved.
  Wording must keep the grep anchors of spec §10 criterion 9: the rejected-proposal-verbatim
  ledger instruction; the re-check tokens ("each token matches ≥ 1", adoption note). **Mandatory
  manual survey:** hand-scan Setup step 3 and the launch step for same-meaning one-shot phrasings
  ("pinned", "one Setup decision", "decided once") beyond the grep hits; list stragglers as
  survey-derived corrections. This task does not touch the Checkpoint outcome bullets or the
  manual-land recipes (merge-land-resilience's regions).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: Docs + comment sweep — schemas, config comment, war-room, packaging cross-ref, glossary

- Files: `skills/war/references/schemas.md`, `skills/war/assets/war-config.mjs`, `skills/war-room/SKILL.md`, `skills/war/assets/assert-packaging-in-diff.sh`, `CONTEXT.md`
- Plan slice: **schemas.md.** In the "MergeResult — `war-refiner`" section, add
  `floor_diagnostic?` to the jsonc block and a definition bullet beside the other optional fields
  (`gate_log_path` precedent): merge-task only, the verbatim stderr of an exit-1
  `assert-test-in-diff.sh` run (the near-miss diagnostic), fail-open advisory — never routed on;
  no status value or enum member added (ADR 0005). In the config-schema section's
  `overrides.testPattern` comment block: "the Lead threads the pinned value into the per-phase
  Workflow" rewords to per-phase-resolved (pinned at Setup; under `--afk` a sanity-floor-rejected
  Setup proposal is re-checked at each phase launch and can be adopted monotonically), and "at
  both merge-task invocation sites" rewords to "at every dispatched merge-task floor invocation
  site" (no site count — pre-existing two-site claim is already stale against the live tree).
  **war-config.mjs (comment-only).** The `DEFAULTS` comment "Floor ⊆ gate is ONE Setup decision
  (ADR 0006): testPattern is pinned TOGETHER with the gate" gains the same one-clause
  qualification (the confirmation is one Setup decision; under `--afk` a rejected proposal is
  re-checked per phase — the config field itself is unchanged and the validator is untouched).
  **war-room SKILL.md (comment-only prose).** The overrides line's "pinned **together with the
  gate**" gains the same clause. **assert-packaging-in-diff.sh (comment-only).** Adjudicate the
  target-repo-agnostic audit note's "gained a per-run `overrides.testPattern`" cross-reference:
  reword per-run → per-phase-resolved, or confirm-correct as a dated audit record — worker
  latitude, decision listed in the done report. **CONTEXT.md.** Add the two spec §6 terms:
  **near-miss diagnostic** (the advisory stderr block `assert-test-in-diff.sh` emits on exit 1
  when the diff contains test-shaped files the active pattern set does not match; never affects
  the exit code) and **pending testPattern proposal** (a Setup-proposed test-floor glob set the
  `--afk` sanity floor rejected — zero-match tokens — recorded in the ledger and re-checked at
  each phase launch until adopted). **Mandatory manual survey:** after the token grep
  (`sanity floor`, `testPattern`) across these files, hand-scan each target's same-scope prose for
  same-meaning one-shot siblings; list stragglers as survey-derived corrections.
- requiresTest: false
- requiresPackaging: false
- deps: [1.2]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: version bump, all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump all four slots to the next free patch above the live integration base at land
  time — `plugin.json` `version`, `marketplace.json` `metadata.version` and
  `plugins[0].version`, and the README `## Status` line (replace-in-place, no badge).
  `version-slots.test.mjs` is the arbiter — never a resolved v-literal from this plan (version
  literals in plans are non-authoritative). Expected integration base: branch
  `claude/work-audit-specs-plans-4304cd` — a stacked campaign base that will have advanced past
  the merge-land-resilience release by land time; resolve the patch from the four slots as they
  stand at land. Standalone fallback: a run through plain `/war` (outside the campaign) resolves
  the next free patch from the four slots itself. Release blurb describes the change additively
  and precisely: the test floor emits a near-miss stderr diagnostic on `no-test` (exit codes and
  stdout unchanged), the refiner threads it to the add-test worker and the exhaustion escalation
  as `floor_diagnostic`, and the `--afk` testPattern proposal is re-checked at each phase launch
  and adopted once every token matches — say "re-checks the Setup proposal per phase", never "the
  floor derives patterns from the target repo" (floor-time derivation is spec-rejected, D7). No
  rename; no absence-guard interactions expected.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- Incident-class end-to-end recovery — a real `--afk` run on a target repo that is docs-only at
  Setup (proposal rejected, ledger note written) and grows matching test files by a later phase:
  the phase-start re-check adopts the proposal, the run finishes without a test-floor relaunch
  · why deferred: the Lead re-check is SKILL.md prose executed by a live Lead against a live
  target tree — not fixture-able in the JS/shell suites (the engine and script halves are
  CI-covered in 1.1/1.2) · runner: operator, next `--afk` cross-repo run (e.g. a war-game
  benchmark re-run), read back via the ledger adoption note and `/war-review`.
- Live stderr survival — the live refiner (a model following prompt text) actually captures the
  script's stderr verbatim into `floor_diagnostic` at a real `no-test` event, and no invocation
  surface grows a `2>/dev/null` that eats it · why deferred: prompt-following is not
  unit-assertable; the both-surface instruction plus the drift-guard tokens are the in-repo guard
  (spec §8) · runner: operator inspection at the first live `no-test` event post-release
  (`/war-review` friction pass).
- Near-miss set adequacy — the fixed D5 set (`*.test.*`, `*.spec.*`, `test_*`, `*_test.*`)
  actually names the mismatch for the next real cross-repo convention encountered · why deferred:
  diagnostic-only heuristic; adequacy is observable only against real target repos, and a false
  negative costs only silence (today's behavior) · runner: operator via `/war-review` after
  cross-repo runs; widen the documented set in a follow-up if a real miss is recorded.
- Scaffolding-phase residual (spec §8, accepted): a phase whose own diff introduces the repo's
  **first** proposal-matching files still trips the floor — the phase-start re-check ran against
  the pre-diff tree; confirm the mitigations fire in order (the near-miss diagnostic lands in
  round 1's add-test prompt and in the exhaustion escalation detail; the post-hold relaunch's
  phase-start re-check then adopts) · why deferred: accepted residual by design — closing it
  fully needs diff-aware re-evaluation, rejected with D7 for the same determinism reasons;
  observable only on a live scaffold-shaped run · runner: operator on the next `--afk`
  scaffold-shaped run, read back via the escalation detail and the relaunch's adoption ledger
  note.

## Notes / conscious deviations

- **Stacking assumption (dependsOn, stated against the spec — the sibling plan is being drafted
  concurrently and cannot be read):** this plan stacks on
  `docs/plans/2026-07-22-merge-land-resilience.md`, which lands first (roadmap-enforced). Its
  spec (`docs/specs/2026-07-22-merge-land-resilience-design.md` §4.1) adds an
  **environment-proceed re-merge** dispatch built like baseline-proceed *including the
  assert-test-in-diff.sh floor clause*, so at this plan's integration base the template is
  expected to carry **four** dispatched sites rendering `${testPatternArg}`, not the three the
  spec text counts. Resolution rule taken from the spec's own definition ("every site that
  renders `testPatternArg`"): Task 1.2 edits every site found on the live tree, and the extended
  drift-guard asserts per-discovered-site tokens over a ≥ 3 non-vacuity floor — never an exact
  count (the packaging analog's exact-3 site-count test belongs to merge-land-resilience to bump;
  this plan adds no second exact count that would re-break on future site growth).
- **Shared-surface contention (campaign hotspot):** `workflow-template.js`,
  `workflow-template.test.mjs`, and `agents/war-refiner.md` are edited by auditor-guard-ergonomics
  (landed earlier in the campaign), merge-land-resilience (lands immediately before this plan),
  and the D3-registry chain plans. Mitigations baked in: this plan touches only the merge-task
  floor region, `MERGE_RESULT`, the floor-retry sub-loop, and war-refiner.md step 4 — disjoint
  constructs from the auditor-prompt, entry-parse/catch, environment-arm, and land-site regions;
  and per spec D8 it deliberately adds **no D3 both-surfaces registry row** (the registry's exact
  no-slack row-count floor is serialized through the auditor-guard-ergonomics →
  audit-adjudication-threading → servitor-wrapup-landed-tip chain), extending the standalone
  validation-6 testPattern drift-guard instead. If review later rules the capture directive
  correctness-critical, its registry row must serialize behind that chain (spec §8) — a campaign
  ordering concern, not this plan's task.
- **`skills/war/SKILL.md` and `CONTEXT.md` are also merge-land-resilience surfaces** — cross-plan
  same-file is landing-order-serialized (this plan rebases onto its landed tip); within this plan
  each file belongs to exactly one task. Task 1.3 deliberately avoids the Checkpoint
  `gate_failed`-routing and manual-land-recipe regions merge-land-resilience rewrites.
- **Sweep scope self-adjudication:** the spec's §4 sweep greps `skills/` and `docs/` excluding
  `docs/specs/` and `.claude/`. Historical/provenance-dated artifacts — `docs/plans/`,
  `docs/red-team/`, `docs/learnings/` lesson bodies, and `docs/adr/0019` (whose recorded decision
  this spec refines *within*, §7: no ADR changes) — are treated as records: confirmed, never
  edited (lesson-recipe prose is `/lessons-learned`'s jurisdiction per the recorded
  process-recipe-lesson-body lesson). Live-surface hits split along task file-ownership lines:
  script header → 1.1; template comments + refiner step 4 + template-test comment/message prose →
  1.2; SKILL.md → 1.3; schemas.md / war-config.mjs / war-room / packaging cross-ref → 1.4. No
  hit falls outside the four tasks' Files sets (verified against the live tree at plan time).
- **`deps: [1.2]` on Task 1.4 is a prose-coherence wave edge, not a symbol dependency:**
  schemas.md documents the `floor_diagnostic` contract; the wave edge means its worker and
  auditors read the merged field rather than a defined-but-not-yet-emitted forward reference.
  Files are disjoint — not a same-file-collision dodge.
- **`CONTEXT.md` terms are carried despite being absent from spec §5's file list** — spec §6 is
  titled "New domain terms (CONTEXT.md)" and defines both terms; treating §5's omission as an
  oversight is the faithful reading (precedent: the lessons-learned-tighten plan carries its §6
  terms as a task).
- **Byte-identity boundary made explicit (AI-resolved reading of D6):** the capture instruction
  at the dispatched floor sites and in war-refiner.md step 4 is an unconditional prompt change
  (standing behavior); the "absent ⇒ byte-identical" clause governs the *`floor_diagnostic`
  consumers* — the ADD_TEST fixPrompt append and the exhaustion `detail` — which are conditional
  on the field. The existing threading test's set-minus-arg equality is unaffected (both bare and
  patterned variants gain the same capture sentence).
- **Criteria 9–10 stay audit-time greps — no `skill-doc-contracts.test.mjs` row (grill-offered
  latitude, declined):** the sweep retires no crisp OLD token — "pinned" and "one Setup decision"
  legitimately **survive in qualified form** (the spec itself mandates "stays true for the
  confirmation"), so an assert-OLD-absent row has no stable anchor and would red on the mandated
  survivals, while a presence-only row is the weak form the default-flip lesson warns about. This
  change is a qualification, not a default flip, and the correctness-critical half (the capture
  directive on both prompt surfaces) is already mechanically guarded by Task 1.2's extended
  validation-6 drift-guard. `skill-doc-contracts.test.mjs` also gains a merge-land-resilience row
  one plan earlier — declining avoids widening that cross-plan contention surface for a fail-open
  advisory doctrine. Revisit trigger: add a presence row iff post-land prose rot is actually
  observed (a sweep-reworded sentence regressing to one-shot phrasing). Consequence kept:
  Tasks 1.3/1.4 stay `requiresTest: false` with the grep criteria as their audit-time proof.
- **requiresPackaging: false throughout** — no Dockerfile in this repo; the packaging floor would
  no-op regardless (recorded lesson).
- **No new inline mirror ⇒ no MIRROR_REGISTRY row.** `floor_diagnostic` is a schema property and
  prompt text, not a hand-copied canonical export; `land-decision.mjs` and both hand-mirrored
  enum blocks are byte-untouched by design.
- **AFK provenance divergence from the operator-authored exemplars:** intent and backstops carry
  the ADR 0014 AI-declared headings; tone and scope otherwise follow the
  2026-07-21-lessons-learned-tighten / 2026-07-22-lessons-learned-seed exemplars.

## Open decisions

None — the spec's design tree (D1–D8) resolved every fork, including rejecting floor-time
derivation (D7) and placing the drift guard outside the D3 registry (D8). The AI-resolved
plan-level readings (four-sites-after-stacking; sweep scope for historical artifacts; CONTEXT.md
inclusion; the D6 byte-identity boundary; the declined doc-contract row) are recorded under
Notes / conscious deviations rather than left open; the grill-verified adoption-time charset
re-assert is folded into Task 1.3's slice and End state 7. Exact diagnostic wording inside the
anchored tokens is worker latitude under the intent ceiling.
