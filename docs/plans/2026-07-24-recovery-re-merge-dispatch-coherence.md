# Recovery re-merge dispatch coherence — thread submodule scoping into every retry merge, repair the 0019↔0040 record, rot-proof the gate-capture comment

Source spec: `docs/specs/2026-07-24-recovery-re-merge-dispatch-coherence-design.md` (survey
2026-07-24, group `recovery-re-merge-dispatch-coherence`, issues #1032 #1033 #1034 — all
`war-followup` findings from plan 4/9 of the 2026-07-22 run-resilience-and-hardening campaign,
merge-land-resilience).

## Commander's Intent

- **Purpose:** after plan 4 rebuilt merge-time gate-failure recovery, three coherence gaps remain —
  one per layer of the record. A `taskType:'submodule'` task whose first merge trips a recoverable
  route is re-dispatched **unscoped** (the `SUBMODULE TASK` targetRepo/targetBase paragraph rides
  only the initial merge-task prompt — the environment-proceed re-merge, the baseline-proceed
  re-merge, and a survey-derived third site #1032 never named, the floor-retry re-merge, all omit
  it); ADR 0019 still teaches the retired 0-fix-round `env-blocked` route that ADR 0040 replaced,
  and neither record points at the other; and the `gateCaptureClause` header comment enumerates 2
  of its 3 consumer sites. Close all three so *every* merge-task dispatch for a submodule task
  carries the same scoping, a reader of either ADR reaches the live routing in one hop, and the
  capture-clause comment can never rot its site list again.
- **Method:** minimal-append threading — reuse the in-scope `submodMergeNote` const (already `''`
  for non-submodule tasks) and append it as the final prompt segment at each of the three retry
  dispatches, mirroring the initial prompt's trailing placement; no helper extraction, no routing,
  enum, schema, or dispatch-option change anywhere. Prove it behaviorally: dispatch-capture
  regression tests keyed by dispatch label against the captured prompt text — never a source-regex
  occurrence count (the recorded prompt-value-identity and row-scoped-grep lessons). Rot-proof the
  `gateCaptureClause` comment by dropping the site enumeration: state the **evidence-contract**
  invariant count-free — the clause rides the merge-task prompts whose contract requires a
  captured fully-green gate for the post-merge gate-audit (ADR 0024), which is deliberately *not*
  all merge-task prompts — and name the `captureUses` drift guard as the arbiter of the site list
  (the treatment the GATE COMPOSITION POINT comment already has). Repair the decision record without retro-editing: a
  dated amendment appended to ADR 0019 (the ADR 0023 amendment precedent) plus one Supersedes
  bullet in ADR 0040's `## Relationship to prior ADRs`. Every grep in the plan is a completeness
  floor backed by the spec's §4.5 hand-survey; every edit site anchors by named construct — the
  issue bodies' line numbers have already rotted.
- **End state:**
  1. **Threading completeness:** `grep -c "submodMergeNote" skills/war/assets/workflow-template.js`
     returns exactly 5 (1 definition + 4 uses: initial merge-task, floor-retry re-merge,
     environment-proceed re-merge, baseline-proceed re-merge) — grep anchored to the file, never
     repo-root (stale duplicates under `.claude/worktrees/`, the known trap). This count is a
     **sweep floor only** — the regression evidence is End state 2's dispatch-capture assertions,
     never this source-occurrence count.
  2. **Behavioral dispatch-capture proof:** `node --test skills/war/assets/workflow-template.test.mjs`
     is green with new test(s) that drive a `taskType:'submodule'` fixture carrying
     `targetRepo`/`targetBase` (the T4 #297 fixture shape) through each of the three retry routes
     and assert the captured prompt located by its dispatch label —
     `merge:<taskId>:floor-retry:r<round>`, `merge:<taskId>:environment-proceed`,
     `merge:<taskId>:baseline-proceed` — contains **both** the `SUBMODULE TASK` marker and the
     fixture's `targetRepo` value.
  3. **Discrimination proof (done-report evidence):** the worker's done report records the RED
     probe verbatim — with each route's `+ submodMergeNote` append individually removed, exactly
     that route's assertion fails; restored, green. (A deliberately uncommitted probe; gate-audit
     treats the resulting cannot-confirm as SOFT, never a hold, per the recorded doctrine.)
  4. **Non-submodule byte-identity:** `submodMergeNote` is `''` off the submodule path, so the full
     existing suite passes with **zero modifications** to existing prompt-content tests —
     `node --test 'skills/**/*.test.mjs'` green; any churn in an existing non-submodule prompt test
     is a defect in the change, not the test.
  5. **Drift-guard stability:** the `captureUses` assertion still counts exactly 3
     `gateCaptureClause(refineryPath, r.task.id)` call sites (the comment fix is prose-only; no
     capture site is added or removed — baseline-proceed deliberately stays clause-less, spec §3
     row 6), the packaging-floor "exactly four dispatched packaging-floor invocation literals"
     census still passes, and the #1046 floor-site discovery guard still finds all four
     `assert-test-in-diff.sh` sites with every per-site arm assertion green (it is a >= 3
     **non-vacuity floor** plus per-site content assertions — deliberately not an exact count;
     never "harden" it to one). Traced at drafting: `FLOOR_SITE_RE`'s lazy span runs from the
     floor invocation to the first `: pt` false-arm terminator after it, and the append point —
     after the requiresPackaging ternary — lies outside every captured arm, so both the match set
     and the captured arm content are byte-unchanged.
  6. **Comment rot-proofing:** the `gateCaptureClause` (D5) header comment contains **no**
     consumer-site enumeration, states the invariant count-free **as the evidence-contract
     property** — threaded into the dispatched merge-task prompts whose evidence contract requires
     the captured fully-green gate for the post-merge gate-audit (ADR 0024) — and names the
     `captureUses` drift guard in `workflow-template.test.mjs` as the arbiter of the site list.
     The invariant must NOT universally quantify over merge-task prompts or over "gate must come
     back green": two live merge-task prompts legitimately carry no clause (the baseline-proceed
     re-merge — proceed-over evidence contract, ADR 0040; the class-exempt phase-close polish
     merge — fail-open discard, its result feeds no gate-audit seat), so a universal wording would
     be false at birth, the same rot class as the enumeration it replaces. The comment's accurate
     remainder
     (both-surfaces rule / `agents/war-refiner.md` step 7 standing mirror / anti-excerpt
     replacement rationale / `.war/` exclusion) is retained. Checked by **reading the comment
     block**, never a single-line full-sentence grep — the stale phrase wraps a line break (the
     recorded wrap trap).
  7. **ADR coherence, both directions:** ADR 0019 ends with a dated
     `## Amendment (2026-07-24)` heading naming ADR 0040 and superseding exactly the `environment`
     class-route row (original Decision/Scope prose byte-intact; `introduced` and `baseline` routes
     and the target-derived execution values explicitly unchanged); ADR 0040's
     `## Relationship to prior ADRs` gains one **Supersedes one row of ADR 0019** bullet. A reader
     landing on either record reaches the live routing in one hop. The §4.5 `env-blocked` grep over
     the two ADRs shows every 0019 hit sitting either inside byte-intact original text covered by
     the amendment or inside the amendment itself.
  8. **Enum/routing discipline untouched:** the phase diff shows no edit to
     `skills/war/assets/land-decision.mjs`, no new `MergeResult` status, no
     `HARD_ESCALATION_REASONS` / `KNOWN_LAND_DECISIONS` member, no `agents/*.md` edit (deliberate —
     see Notes), and no change to any dispatch label, schema, option, or routing branch — prompt
     prose appends and record repairs only.
  9. **Release lands last:** all four version slots bump in lock-step to the next free patch above
     the live integration base at land time; `version-slots.test.mjs` green.

## Build order (for /war)

1. **Phase 1 — Retry-dispatch scoping + record coherence** (waves: 1.1 ∥ 1.2 — file-disjoint)
2. **Phase 2 — Release** (trailing, own phase)

## Phase 1 — Retry-dispatch scoping + record coherence

### Task 1.1: Thread `submodMergeNote` into all three retry re-merges, rot-proof the `gateCaptureClause` comment, prove it by dispatch capture (#1032, #1034)

- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: **Threading (spec §4.1).** In the Refine loop of `workflow-template.js`, append
  `+ submodMergeNote` as the **final prompt segment** — after the requiresPackaging ternary,
  mirroring the initial merge-task prompt's trailing placement — at each of the three retry
  dispatches, identified by their dispatch labels (never line numbers):
  (1) the floor-retry re-merge (label `merge:<taskId>:floor-retry:r<round>`),
  (2) the environment-proceed re-merge (label `merge:<taskId>:environment-proceed`),
  (3) the baseline-proceed re-merge (label `merge:<taskId>:baseline-proceed`).
  The const is already defined once per task iteration and in scope at all four sites; appending is
  the entire code fix — no helper, no re-derivation, no dispatch-option or routing change.
  `submodMergeNote` is `''` for non-submodule tasks, so every existing non-submodule prompt stays
  byte-identical (End state 4).
  **Comment rot-proofing (spec §4.3, wording corrected at grill).** Rewrite only the stale
  enumeration lines of the `gateCaptureClause` (D5) header comment — the "mirrored into the
  initial merge-task prompt AND the floor-retry re-merge prompt" sentence — to state the
  invariant count-free and name the arbiter, in the spirit of (final wording is worker latitude):
  the merge-task gate-output capture directive, threaded into the dispatched merge-task prompts
  whose evidence contract requires the captured fully-green gate for the post-merge gate-audit
  (ADR 0024); the `captureUses` drift guard in `workflow-template.test.mjs` is the arbiter of the
  site list (never enumerate it here). Do NOT write a universal quantifier over merge-task
  prompts or over green gates — End state 6 records the two live counterexamples that would make
  it false at birth. The comment's remainder (both-surfaces rule, `agents/war-refiner.md` step 7
  standing mirror, anti-excerpt replacement rationale, `.war/` exclusion) is accurate and stays.
  No `gateCaptureClause` call site is added or removed — `captureUses` must stay green at
  exactly 3.
  **Regression tests (spec §4.2 — shape pinned at grill: new SIBLING test(s) only, never an
  extension of the T4 #297 threading test).** The spec leaves the shape to the implementer; this
  plan pins the sibling form so the T4 test's header-comment enumeration ("merge-task, land,
  worker, and Provision prompts") stays accurate untouched and the auditor's duty footprint is
  single-shaped — spec §4.5 survey item 2's conditional same-commit comment duty is thereby
  vacated by construction. One new test (or one per route, worker's choice) in
  `workflow-template.test.mjs` using the existing agent-stub capture harness (record
  `{ prompt, opts }` per call, filter by label — the capture reads the prompt at dispatch time,
  so the stub harnesses' default `merged` recovery results are fine). Fixture a
  `taskType:'submodule'` task carrying `targetRepo`/`targetBase` (the T4 #297 fixture shape),
  with the per-route stub sequencing spelled out: (a) **floor-retry** — the fixture must be
  `requiresTest:true`; the initial merge stub returns `status:'no-test'`, an add-test fix-worker
  round and a unanimous re-audit are stubbed, and only then does the engine dispatch
  `merge:<taskId>:floor-retry:r<round>` (the bare no-test capture harness — initial +
  floor-retry disambiguated by label — is the exact precedent, `firstMerge` override included);
  (b) **environment-proceed** and (c) **baseline-proceed** — the initial merge stub returns
  `gate_failed` with `gate_failure_class` `'environment'` / `'baseline'` respectively (the #598
  environment-class stub harness fabricates both first results and label-filters the recovery
  dispatches, defaulting them to `merged`). Assert each captured retry prompt contains the
  `SUBMODULE TASK` marker **and** the fixture's `targetRepo` value (End state 2). Record the End
  state 3 RED probe in the done report.
  **Same-scope survey (spec §4.5 — this task owns the two code files' share).** Run the file-anchored
  greps — `grep -n "submodMergeNote" skills/war/assets/workflow-template.js` (expect exactly 5
  post-change) and `grep -n "floor-retry\|ALL THREE\|all three\|initial merge"` over both Files —
  then hand-scan same-scope comments and test titles, reading every hit in context (the #1034
  phrase itself wraps a line break; full-sentence single-line greps are blind here). Re-confirm the
  spec's survey dispositions at implementation time: the `classificationClause` header comment's
  enumeration (initial merge, floor-retry, THE LAND PROMPT, `agents/war-refiner.md`) is accurate
  for its own three call sites — legitimate survivor, no edit; the packaging-floor four-literal
  census and the `FLOOR_SITE_RE` "(four at this base: …)" comment are unaffected — no edit
  (`FLOOR_SITE_RE` hardening is owned by sibling issue #1050, not this group); the `captureUses`
  assertion's own message enumeration is bound to the count it asserts — survivor, no edit; the
  T4 #297 threading test and its header comment stay byte-untouched (the sibling-shape pin
  above); and two additions beyond the spec's §4.5 list: (i) the `landMerged` header comment's
  four-site funnel enumeration ("initial merge, floor-retry re-merge, the baseline-proceed
  re-merge, and the environment-proceed re-merge all funnel through it") is accurate and
  unaffected by this change — legitimate survivor, no edit; (ii) the **phase-close polish merge**
  (label `merge:p<phaseId>-polish`, mode=merge-task — the fifth `merge:*` refiner dispatch, which
  the spec's survey never names) is NOT a fourth omitting site for this plan: it merges the
  phase-level polish branch, not a re-dispatch of any task's merge; the per-task
  `submodMergeNote` const is lexically out of scope there (it is declared inside the per-task
  Refine iteration; the polish merge sits outside it, keyed to `polishBranch`/`polishWorktree`
  with no `r.task`); it explicitly skips both floors, is class-exempt, fail-open DISCARDS on any
  failure, and its result feeds no gate-audit seat — legitimate survivor, no edit; its
  phase-level submodule-awareness question routes to the Lead-filed follow-up (Notes). Any *new*
  straggler found at implementation time: fix it in this task if it is inside these two Files and
  stale for exactly this change's reason; otherwise report it in the done report as a named
  `war-followup`, never edited (footprint discipline).
  **Commit-body duty (auditor-visible surface for the no-mirror call).** The task's commit body
  must record the no-standing-edit rationale where the auditor adjudicates it: quote
  `agents/war-refiner.md`'s submodule-phase scope sentence ("All merge-task and land-phase steps
  below run with `<taskWorktree>` and `<_refinery>` rooted in the submodule checkout") and state
  that the dispatched surface is being brought up to the standing claim, so no same-commit
  standing mirror edit exists to miss (spec §2).
- requiresTest: true — the deliverable includes the dispatch-capture regression tests; the diff
  touches `workflow-template.test.mjs`, satisfying the test floor
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: ADR 0019 dated amendment + ADR 0040 Supersedes bullet — the environment class-route record points both ways (#1033)

- Files: `docs/adr/0019-target-derived-execution-values.md`, `docs/adr/0040-environment-class-gate-failures-earn-one-retry.md`
- Plan slice: **ADR 0019 (spec §4.4).** Append a dated section
  `## Amendment (2026-07-24): the environment class-route is superseded by ADR 0040` — the ADR
  0023 amendment shape (same plan-4 precedent the spec cites). Body: the class-routes doctrine's
  `environment` row in `## Decision` ("soft-escalate reusing the `env-blocked` reason with
  **zero** fix rounds") and the `## Scope` supersession paragraph's "routes as `env-blocked`"
  restatement are superseded — an `environment`-classified gate failure now earns exactly one
  bounded `environment-proceed` re-run per gate site, with merge-site exhaustion HARD via the
  existing reason `'escalate'`; cite
  `docs/adr/0040-environment-class-gate-failures-earn-one-retry.md`. State explicitly that the
  original Decision text is not retro-edited and that the `introduced` and `baseline` routes and
  the target-derived execution values stand unchanged. Anchor by heading names (`## Decision`,
  `## Scope`), never line numbers; the original prose above the amendment stays byte-intact.
  **ADR 0040 (spec §4.4).** Add one bullet to `## Relationship to prior ADRs`:
  **Supersedes one row of ADR 0019** — the class-routes doctrine's `environment` →
  0-fix-round `env-blocked` route; 0019 carries the matching dated amendment; every other 0019
  route (`introduced`, `baseline`, the target-derived execution values) stands. Existing bullets
  (0005, 0025, 0017, 0023, 0024) are untouched.
  **Same-scope survey (spec §4.5 — this task owns the two ADRs' share).** Run
  `grep -n "env-blocked"` over both Files and adjudicate every 0019 hit: each must sit either
  inside byte-intact original text covered by the new amendment or inside the amendment itself
  (End state 7); 0040's own `env-blocked` mentions (its Relationship bullet to 0005 legitimately
  names the reason) are accurate — no edit. Hand-scan both ADRs' headings and the amendment for
  stragglers beyond the grep.
- requiresTest: false — docs-tier (ADR record repair; no doc-contract test pins this prose)
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: This plan changes a shipped engine asset (`skills/war/assets/workflow-template.js`)
  and its test — users receive the fix only via a release. Bump all four release slots together to
  the **next free patch above the live integration base at land time** (never a resolved semver
  literal; version literals in plans are non-authoritative): `plugin.json` `version`,
  `marketplace.json` `metadata.version` **and** `plugins[0].version`, and the `README.md`
  `## Status` line (replace-in-place, never emptied, no badge).
  `skills/war/assets/version-slots.test.mjs` is the lock-step arbiter — a partial bump is a red
  test (End state 9). Expected integration base: the campaign working branch tip after this plan's
  Phase 1 lands — this is plan 3 of the campaign, stacking after the land-advance-exit-contract-truth
  and runbook-and-standing-record-coherence plans, each carrying its own trailing release bump, so
  the slot baseline at land time reflects however many of those releases have landed (stacked
  releases lag cumulatively — resolve the next free patch from the four slots **as they stand at
  land**, never from any plan's literal). Standalone fallback: a run through plain `/war` outside
  the campaign resolves the next free patch from the four slots itself. Release blurb describes
  the change precisely: submodule targetRepo scoping now rides every retry merge dispatch
  (floor-retry, environment-proceed, baseline-proceed), ADR 0019/0040 cross-reference the live
  environment routing, and the gate-capture comment defers its site list to the drift guard —
  never a claim that any recovery route, status enum, or escalation reason changed.
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Integrated-tip sweep re-check — re-run the three §4.5 greps (`submodMergeNote` count = 5 on
  `skills/war/assets/workflow-template.js`; `env-blocked` over the two ADRs; the
  `floor-retry|ALL THREE|all three|initial merge` token hunt over the two code files) on the landed
  Phase-1 tip · why deferred: the two Phase-1 tasks adjudicate at their own frozen bases; the
  coherence claims (End states 1, 7) are properties of the integrated tip after the serial merge
  queue, and an audit-time finding can be stale by land time · runner: the Lead at Phase-1 land,
  before dispatching Phase 2.

## Notes / conscious deviations

- **Decomposition:** #1032 and #1034 both edit `workflow-template.js`, so they are one task (same
  file → same task, never a dep-wave dodge), and the regression tests travel with the change in the
  same task (`workflow-template.test.mjs` is the same task's second file, not a sibling task —
  splitting them would ship the appends a wave naked). #1033 is docs-only and file-disjoint —
  parallel wave. Release is its own trailing phase per the rule.
- **No `agents/war-refiner.md` mirror edit — deliberate, auditor take note.** The both-surfaces
  rule requires a same-commit standing edit only when standing prose diverges. Checked at spec time
  (spec §2): the standing refiner doc's submodule section is deliberately generic — "All merge-task
  and land-phase steps below run with `<taskWorktree>` and `<_refinery>` rooted in the submodule
  checkout" — which already covers retries; this change makes the dispatched surface match the
  standing claim. An auditor must not hold Task 1.1 for a missing mirror.
- **No mirrored-constant dance:** nothing here nears `HARD_ESCALATION_REASONS` /
  `KNOWN_LAND_DECISIONS` — no enum member, no `land-decision.mjs` edit, so the hand-mirrored-pair
  rule is satisfied vacuously (End state 8 makes it checkable as absence).
- **Placement is load-bearing for two guards:** the append goes *after* each site's
  requiresTest/requiresPackaging ternaries as the final segment (the initial prompt's trailing
  placement). Traced at drafting: `FLOOR_SITE_RE`'s lazy span runs from the
  `assert-test-in-diff.sh` invocation to the first requiresTest-ternary `: pt` false-arm
  terminator (the recorded terminator-shape fragility), so the append point lies outside every
  matched span and captured arm — the #1046 guard (a >= 3 non-vacuity floor + per-site arm
  assertions, deliberately not an exact count) keeps discovering all four sites with unchanged
  arm content; and the append adds no packaging-floor invocation literal, so the four-literal
  census stays green unmodified (End state 5).
- **Scope of `submodMergeNote` at the three retry sites — traced, not assumed:** the const is
  declared at the top of the per-task Refine iteration body, and all three retry dispatches (the
  floor-retry sub-loop and both recovery arms of the gate_failed routing) sit inside that same
  iteration with no function boundary between. Proof already in the source: `advisePackagingVacuous`,
  declared four lines above `submodMergeNote` in the same block, is interpolated at all three
  retry sites today — identical lexical visibility.
- **Two verified live omissions are deliberately deferred, with a filing vehicle (grill-derived):**
  (i) `submodLandNote` — the phase-level submodule note built inside the land block — rides only
  the initial land prompt; both re-land dispatches (`land:phase-<id>:environment-proceed`,
  `land:phase-<id>:baseline-proceed`) omit it — the same defect class as #1032 one layer up,
  excluded by spec §9 ("No change to any land-phase prompt, the re-land path"); (ii) whether the
  class-exempt phase-close polish merge should be submodule-aware at all (a phase-level design
  question — no per-task const reaches it). Neither is fixed here (footprint discipline; spec
  non-goals). So the deferral cannot vanish: at Phase-1 close the **Lead files ONE `war-followup`
  issue** naming both sites and citing this plan and spec §9 — the same phase-close filing route
  the survey's war-followup debt came in on.
- **The dispatch-capture tests are engine-contract tests (grill Q8):** stub-driven assertions on
  the engine's dispatch contract — what prompt the Workflow emits per label — independent of how
  narrow the route is for a real submodule task in production (floors run refiner-side; the
  test-floor-target-repo design owns that question, and its landed-or-pending status changes
  nothing asserted here). Spec §8 and §3 row 1 already resolved that reachability does not shrink
  the three-site fix; the same holds for its tests.
- **The retry prompts are not self-contradictory (grill Q9, for auditors):** after the append,
  each retry prompt carries both the superproject-shaped `assert-no-submodule-mutation.sh`
  invocation and the submodule cwd-scoping note — exactly the combination the initial merge-task
  prompt ships today and the T4 #297 test asserts. The standing resolution is already recorded:
  `agents/war-refiner.md` step 6's note — a submodule task's merge-task runs inside the submodule
  worktree, where no superproject gitlink is in view, so the check is a no-op there and always
  exits 0. Byte-parallel to a ratified shape; not a hold.
- **baseline-proceed stays `gateCaptureClause`-less** (spec §3 row 6, §9): its proceed-over
  evidence contract is ADR 0040's documented design; `captureUses` stays 3. Revisiting needs its
  own issue — not this group.
- **Tests assert dispatched-prompt content, never source shape** (spec §2): the captured prompt
  per dispatch label, both the `SUBMODULE TASK` marker and the `targetRepo` value. The End state 1
  source grep is a validation-criteria sweep, never the test.
- **Floor-retry reachability for submodule tasks is narrow today** (spec §8) — the append is
  harmless when the route is unreached and correct when it is; reachability is not a reason to
  shrink the three-site resolution (spec §3 row 1 resolved this).
- **Discrimination RED proof is done-report evidence** (End state 3): a deliberately uncommitted
  probe; gate-audit treats the cannot-confirm as SOFT, never a hold (recorded doctrine).
- **Campaign contention (for the roadmap table):** this plan's Phase-1 footprint
  (`skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`,
  `docs/adr/0019-target-derived-execution-values.md`,
  `docs/adr/0040-environment-class-gate-failures-earn-one-retry.md`) is disjoint from plans 1 and
  2. The only shared files are the three release-slot files (`.claude-plugin/plugin.json`,
  `.claude-plugin/marketplace.json`, `README.md`) in every plan's trailing release phase — the
  later lander re-resolves the next free patch on rebase and owns the rebase-by-named-anchor
  burden (ADR 0011 stack-and-plow). The sibling drift-guard spec
  (`docs/specs/2026-07-24-drift-guard-and-floor-diagnostic-hardening-design.md`) orders itself
  *after* this plan because both touch `skills/war/assets/workflow-template.test.mjs` — the
  roadmap MUST encode that as a Depends-on edge on the drift-guard plan's row (surface
  contention), never as prose alone; nothing here depends on it. Verified disjoint from plan 2's
  environment-routing prose work: its #1039 edit targets the `held:land-failed` environment
  bullet in `skills/war/SKILL.md` — a file this plan never touches (record layer vs code layer).
- **Anchors:** every edit site is named by construct — dispatch label, const name, comment
  lead-in phrase, ADR heading — never line numbers; the issue bodies' `:1202`/`:1239`/`:718-719`
  references have already drifted on the live tree (spec §1, §8).
- **Redaction:** no absolute home paths, emails, or handles in this plan, the new tests (the T4
  fixture's `targetRepo` literal is a synthetic path), the ADR amendment, or the release blurb.

## Open decisions

None — the spec's design tree resolved all six rows, and the grill round resolved the one
open shape choice the spec left (sibling test(s) pinned; extending T4 #297 is off the table).
Remaining latitude (one capture test vs one per route; exact comment and amendment wording within
the End state 6 property constraint) is the worker's within the checkable floors stated per task.
