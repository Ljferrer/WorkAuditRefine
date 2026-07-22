# Merge/land resilience — bounded environment-proceed retries at both gate sites, and a wrong-HEAD precheck in `land-advance`

**Source issues: #984, #986** (group `merge-land-resilience`, survey 2026-07-22). Both issues are
addressed in full; the sole rejected sub-proposal (#984's `held:phase-incomplete` Workflow emission)
is resolved as an explicit design-tree decision, not silently dropped.

## 1. Context — the gap / problem

Run `war-game-benchmark-harness-2026-07-21` hit one target-repo test flake (an ENOTEMPTY race) across
four consecutive phases. The refiner's gate-failure classification protocol worked every time — base
green + fresh-env tip re-run green ⇒ `gate_failure_class: 'environment'` — but the Workflow template
throws that proof away:

- **LAND gate (#984, 3 events).** In `workflow-template.js`, the land-site arm
  `landResult.status === 'gate_failed' && classOf(landResult) === 'environment'` soft-escalates
  straight to `held:land-failed` — its own comment states "an environmental failure passes on retry"
  — yet no retry is attempted. Only the `baseline` class gets an in-workflow re-land (the
  `land:phase-<id>:baseline-proceed` dispatch). Each event cost a full Lead escalation-completion
  land; every manual re-run went green within two attempts.
- **MERGE gate (#984, 1 event — the worse shape).** The merge-site arm `cls === 'environment'`
  soft-escalates as reason `env-blocked` with zero fix rounds while siblings proceed. An **approved**
  task is silently excluded from the merged set and the phase completes *minus its headline
  deliverable*. Only the last-resort End-state gate-audit seat caught it (condition provably UNMET,
  Critical). "Task approved, merge flaked, phase reports done anyway" surviving to the final backstop
  is a design gap, not bad luck.
- **`land-advance` wrong-cwd trap (#986).** `cmd_land_advance` in `provision-worktrees.sh` pushes
  `HEAD:refs/heads/<working>` — HEAD resolves from the invocation cwd, and the `<merge-sha>` argument
  the caller passes is never compared against what is about to be pushed. A phase-3 manual land ran
  it from the main checkout: the push attempted the main checkout's `master` HEAD, got a non-ff
  `[rejected]`, and exited 2 — the CAS-reject code. Harmless by design (nothing forced), but the
  diagnostic reads "CAS contention — reland" when the truth is "wrong worktree", so exit 2 no longer
  means only what it documents.

One coherent landing-path reliability change: (a) mirror the existing `baseline-proceed` pattern with
a bounded **environment-proceed** re-run at both gate sites, holding the phase when a merge-site
retry exhausts; (b) a pre-push `HEAD == <merge-sha>` precheck in `cmd_land_advance` so exit 2 means
only real CAS contention.

## 2. Pivotal constraints

1. **Both-prompt-surface split (cluster rule 1).** Refiner behavior changes must edit
   `agents/war-refiner.md` **and** the string-built prompts in `workflow-template.js` in the same
   commit. The D3 both-surfaces directive registry in `workflow-template.test.mjs` has an exact
   no-slack row-count floor (#693): a new both-surfaces directive lands its registry row **and** the
   floor bump in the same task (the `/war-strategy` new-mirror rule; the registry grows by row, never
   by scanner).
2. **Hand-mirrored enums (cluster rule 3).** `HARD_ESCALATION_REASONS` / `KNOWN_LAND_DECISIONS` are
   canonical in `land-decision.mjs` and hand-mirrored in `workflow-template.js`; any member change
   updates both copies plus the drift-guard tests in `land-decision.test.mjs`. `held:workflow-error`
   must never enter `HARD_ESCALATION_REASONS` (ADR 0005). **This design changes neither set** — see
   design decisions 2 and 3, which exist precisely to keep both mirrors byte-untouched. Two ratified
   guards it must therefore leave green: the `behavioral ⊆` test pinning the Workflow-emitted
   landDecision set at exactly 6, and the intentional-gap test `held:phase-incomplete is ∈
   KNOWN_LAND_DECISIONS but ∉ the Workflow-emitted set (Lead-classified)`.
3. **Land-truth guard (ADR 0023).** A `landed` result is never self-reported; the push-first CAS with
   origin readback is the ground truth. The wrong-HEAD precheck extends this family — it must not
   weaken any existing guard arm (first-land, phantom, already-landed reconciliation).
4. **Red-team-verified push form.** `cmd_land_advance` pushes the **named source `HEAD:`**, never a
   bare-SHA refspec — a bare-SHA push can spuriously report "src refspec does not match any"
   (recorded in the subcommand's step-1 comment). #986's "push `<merge-sha>:` explicitly" alternative
   would reverse this; resolved in the design tree (rejected).
5. **Exit-code discipline.** `provision-worktrees.sh` has a named exit-code catalogue and a test
   forbidding uncatalogued numeric-literal exits; a git error never collapses into a named route
   (the floor-script 0/1/2 discipline, mirrored in `cmd_land_advance`'s ls-remote rc guard). The new
   precheck die must be a catalogued constant and must never surface as exit 2.
6. **macOS bash 3.2.57** for all `provision-worktrees.sh` edits; shell tests bash-3.2-safe and
   cwd-independent.
7. **Anchor by named construct, never line number** — every locator in this spec and the derived plan
   names the enclosing construct (the serial merge queue rots line numbers).

## 3. Resolved design tree

| # | Decision | Options considered | Resolution + why |
|---|----------|--------------------|------------------|
| 1 | Environment-class MERGE gate failure recovery | (a) status quo — zero retries, soft `env-blocked`; (b) ONE Workflow-dispatched re-merge, mirroring `baseline-proceed`; (c) retries up to `run.roundLimit` | **(b) ONE bounded `environment-proceed` re-merge** (fresh TMPDIR/shell). The class definition itself predicts a pass — the classifier already re-ran the tip green in a fresh env; in the observed run the retry would have gone 4-for-4. `roundLimit` retries buy little over one and break the symmetry with `baseline-proceed`'s single-dispatch bound. |
| 2 | MERGE retry exhaustion — what holds the phase | (a) stay soft (`env-blocked`, siblings land, phase completes minus the approved task); (b) Workflow emits `held:phase-incomplete` (#984 proposal 2); (c) HARD escalation reusing the existing reason `'escalate'` → `held:escalation` via the normal `decideLand` mirror | **(c).** (a) is the defect being fixed. (b) is **explicitly rejected** — it reverses the ratified intentional-gap drift guard (`held:phase-incomplete` is canonical-but-NOT-Workflow-emitted, Lead-classified on a non-`completed` notification), forces edits to both hand-mirrored enum comment blocks + two drift-guard tests, contradicts the CONTEXT.md gloss (phase-incomplete = the Workflow *did not run to completion*), and poisons the `held:phase-incomplete` recovery contract: SKILL.md routes it to `resumeFromRunId` auto-resume under `--afk`, and a journal replay re-runs merged tasks' gates and the push-first CAS **live** (the recorded `never-follow-resumefromrunid-hint-after-a-land-failure` hazard). (c) reuses existing machinery end-to-end: `'escalate'` ∈ `HARD_ESCALATION_REASONS` (the same reused-reason idiom as the submodule-surfaced-on-baseline-proceed arm), `decideLand` routes `held:escalation`, `handoff` stays present (degraded), and the Lead's recovery is the existing §4.3 escalation-completion land — exactly what the operator did manually in the observed run. |
| 3 | Environment-class LAND gate failure recovery | (a) status quo — immediate `held:land-failed`; (b) ONE `environment-proceed` re-land before holding | **(b).** Mirror the `land:phase-<id>:baseline-proceed` dispatch shape (re-detach at `origin/<working>`, re-merge `--no-ff`, fresh-TMPDIR gate, `land-advance`, `relandDiscrimination` clause). Exhaustion (a second `environment` classification) falls back to today's `held:land-failed` — the root-cause-branched auto-recover in SKILL.md §4.3 remains the backstop, now reached only after an in-workflow retry was actually spent. No landDecision value outside the existing emitted set is ever assigned. |
| 4 | Retry chaining | (a) recovery dispatches may cascade (baseline-proceed → environment-proceed, or env-proceed → baseline-proceed); (b) at most ONE recovery re-dispatch per gate site per task/land | **(b).** A `baseline-proceed` re-merge/re-land that fails environmentally keeps today's routing (soft `env-blocked` / `held:land-failed`); an `environment-proceed` whose second failure classifies `baseline` is treated as `introduced` (the same bounded rule `baseline-proceed` already applies to its own second failure). Unbounded cascades are how retry loops eat runs. |
| 5 | Environment-proceed gate discipline | (a) proceed over the previously-failing identifiers (baseline-proceed's shape); (b) full green required | **(b).** `environment-proceed` is a *re-run*, not a *proceed-over*: nothing is pre-existing debt, so the gate must pass outright, no `gate_failing_ids` carve-out, no `source:'auto'` backstop, no debt recording. The refiner card's "Narrow baseline carve-out" sentence is **not** widened. |
| 6 | #986 mechanism | (a) docs-only ("run it from `_refinery`"); (b) push `<merge-sha>:refs/heads/<working>` explicitly; (c) precheck `HEAD == <merge-sha>` before the push, loud die on mismatch | **(c).** (a) already failed — the trap is a published lesson and still cost a diagnostic loop; the fix belongs in the script. (b) reverses the red-team-verified named-source-push finding (pivotal constraint 4). (c) keeps the push form byte-identical and converts the misleading exit-2 into a self-explaining precondition failure. |
| 7 | Precheck exit code | (a) new catalogued constant (e.g. `EX_WRONG_HEAD=9`); (b) reuse catalogued `EX_WRONG_BRANCH` (6) | **(b).** The catalogue's own rule blesses overloading where halt-semantics are identical — "the worktree is not in the state the operation requires; fix the topology and re-run" is exactly `EX_WRONG_BRANCH`'s family. It is distinct from 0/2/3 (satisfying #986's requirement that exit 2 keep a single meaning) and adds no new constant to the catalogue or its guard test. The catalogue comment gains the new site. |
| 8 | Precheck placement | (a) top of `cmd_land_advance`, before the land-truth guard; (b) after the guard's early-return arms (first-land fall-through, phantom die, already-landed reconciliation), immediately before the push | **(b).** The already-landed arm reconciles the follower **without pushing** — it is correct from any cwd and must stay idempotent (ADR 0008 repair-toward-git). The precheck gates exactly the code path that can emit the misleading exit 2: the push. |
| 9 | In-workflow prompt changes for #986 | (a) add a wrong-HEAD arm to the land prompts' exit-route enumeration; (b) no prompt change — a non-0/non-2 exit already routes the refiner's `status: 'error'` arm | **(b).** The refiner lands from `_refinery` detached at the merge sha, so the precheck cannot fire in-workflow; it protects the *manual* recipes. The existing "escalate exit code (any non-rejection push error) → `error`" route absorbs the new die unchanged. Only SKILL.md's manual-land recipes gain one explanatory sentence. |
| 10 | Doc-drift guard for the rewritten environment arm | (a) prose only; (b) a new `skill-doc-contracts.test.mjs` row (presence + assert-OLD-absent) | **(b)**, per the §3 default-flip authoring rule and ADR 0025: the change retires the gate-time zero-retry doctrine from three doc surfaces; asserting only the new value present is the recorded failure mode, so the row asserts the OLD claim absent and the new mechanism present. |

## 4. Mechanics

### 4.1 Workflow template — merge site (`workflow-template.js`, gate-failure classification routing block)

In the serial-merge routing under `mr.status === 'gate_failed'`, the `cls === 'environment'` arm
(currently a bare `escalated.push({ reason: 'env-blocked', detail: mr })`) becomes a bounded
recovery, structurally mirroring the adjacent `cls === 'baseline'` arm:

1. Dispatch **ONE** refiner re-merge, label `merge:<taskId>:environment-proceed`, schema
   `MERGE_RESULT`, built like the `baseline-proceed` re-merge prompt (including `reattachClause`,
   the rebase-in-task-worktree step, the `_refinery` merge step, and the same
   `assert-no-submodule-mutation.sh` / `assert-test-in-diff.sh` / `assert-packaging-in-diff.sh` floor
   clauses keyed on `requiresTest`/`requiresPackaging`) with two substitutions: the prior failure is
   named as classified `environment` (transient, proven non-reproducing in a fresh env), and the gate
   **must go fully green** — run with a freshly-created `.war-task`-free TMPDIR and a fresh shell;
   there is no proceed-over set, no debt recording, no `source:'auto'` backstop.
2. Route the result:
   - `merged` → `landMerged(r.task, ep)` (no baseline-debt argument).
   - `gate_failed` with `classOf(ep) === 'environment'` → **HARD** escalation:
     `escalated.push({ task, reason: 'escalate', detail })` where the detail names the mechanism
     ("environment-class gate failure persisted through the bounded environment-proceed re-merge —
     approved task unmerged; the phase must not complete without it") and carries the MergeResult.
     `decideLand`'s mirror then yields `held:escalation` even with merged siblings.
   - `gate_failed` otherwise (`introduced`, or `baseline` treated as `introduced` — bounded, decision
     4) → today's soft escalation (`reason: mr.status`, detail).
   - `submodule-blocked` → HARD `'escalate'` (byte-mirror of the baseline-proceed arm's rule: a soft
     escalation must never let a submodule touch ride a land).
   - floor statuses / null / anything else → the same fallback the baseline-proceed arm uses
     (`reason: ep ? ep.status : 'merge_failed'`).
3. Provision-time `env-blocked` (worker never spawned) and stale-remote `env-blocked` are untouched —
   the zero-round soft doctrine remains correct where no approved artifact exists yet.

### 4.2 Workflow template — land site (same file, the land dispatch routing chain)

The arm `landResult.status === 'gate_failed' && classOf(landResult) === 'environment'` (currently
`escalated.push` + `landDecision = 'held:land-failed'`) becomes:

1. Dispatch **ONE** re-land, label `land:phase-<id>:environment-proceed`, mirroring the
   `baseline-proceed` re-land prompt: `reattachClause`, detach at `origin/<workingBranch>`, merge
   `--no-ff`, gate with fresh TMPDIR **required green** (no proceed-over clause), push-first CAS via
   `provision-worktrees.sh land-advance`, reland loop up to `roundLimit`, plus the shared
   `relandDiscrimination(ph.workingBranch)` clause.
2. Route the result exactly as the baseline-proceed re-land routes its own: `landed` →
   `landResult = reLand; landDecision = 'landed'` (the servitor wrap-up gate fires automatically);
   a status ∈ `HARD_ESCALATION_REASONS` → `held:escalation`; `gate_failed` classified `environment`
   again → `reason: 'env-blocked'`, `landDecision = 'held:land-failed'` (today's terminal state, now
   with the retry provably spent); anything else → `held:land-failed`.
3. The `baseline-proceed` re-land's own environment arm keeps routing `held:land-failed` directly
   (decision 4 — no chaining), and the primary-land `baseline` arm is untouched.
4. Every `landDecision` literal assigned by the new code is already in the emitted set
   (`landed` / `held:escalation` / `held:land-failed`), and all insertions stay inside the block the
   `workflowEmitted()` extraction in `land-decision.test.mjs` slices (between the
   `// landDecision mirrors land-decision.mjs` comment and the catch's `held:workflow-error`
   literal), so the behavioral drift guards remain green **untouched** — that is a validation
   criterion, not a hope.

### 4.3 Refiner standing card (`agents/war-refiner.md`) — same commit as 4.1/4.2

- The merge-task step-3 class-routing sentence rewrites its environment clause: from "a zero-round
  env-blocked escalation" to "ONE Workflow-dispatched `environment-proceed` re-run (fresh
  TMPDIR/shell, gate must go fully green — never a proceed-over); a second environment-class failure
  hard-escalates at the merge site (the phase holds rather than completing without an approved task)
  and holds `held:land-failed` at the land site".
- The Gate-failure classification section gains one short paragraph naming both `*-proceed` dispatch
  flavors and their asymmetry: `baseline-proceed` proceeds over named pre-existing failures with debt
  recorded; `environment-proceed` re-runs and must be green. The "Narrow baseline carve-out" sentence
  is not widened.
- A new **D3 both-surfaces registry row** in `workflow-template.test.mjs` binds the discipline to
  both surfaces (standing card + the dispatched `environment-proceed` prompts), token-anchored
  (e.g. `/environment-proceed/i`, `/fresh TMPDIR/i`, a bounded/one-re-run anchor, and a
  green-required anchor), and the registry floor assertion bumps from 10 to 11 with its enumerating
  message updated (exact, no slack — #693).

### 4.4 `cmd_land_advance` wrong-HEAD precheck (`provision-worktrees.sh`)

Immediately after the land-truth guard's early-return arms and before the `git push origin
"HEAD:refs/heads/$working"` step:

- Resolve `head_sha="$(git rev-parse HEAD^{commit})"` and `want="$(git rev-parse
  "$new_sha^{commit}")"`; an unresolvable `<new-sha>` dies escalate-class (`EX_FOREIGN`), never the
  reland code (pivotal constraint 5).
- On `head_sha != want`: `die` with `EX_WRONG_BRANCH`, message naming **both SHAs** and the expected
  cwd ("run land-advance from the worktree whose HEAD is the merge sha — normally the detached
  `_refinery`"). No ref is read or written after the die; local and origin refs are untouched.
- The subcommand's header comment gains the precheck as a numbered step and its exit-code block gains
  the arm; the exit-code catalogue comment for `EX_WRONG_BRANCH` gains the land-advance wrong-HEAD
  site. The step-3 post-push readback ("a no-op push from the wrong cwd also exits 0") stays as
  defense in depth.
- SKILL.md's manual-land recipes (the `held:land-failed` auto-recover arms and the
  escalation-completion land under `## Checkpoint`) gain one sentence: `land-advance` refuses with a
  self-explaining die when invoked from a worktree whose HEAD is not the merge sha, so a `[rejected]`
  exit 2 now always means a real concurrent advance.

### 4.5 Retired-claim sweep (token sweep — survey note mandatory)

The change retires the gate-time zero-retry doctrine. Sweep: `grep -rn "zero-round\|0 FIX
rounds\|passes on retry\|env-blocked doctrine applied at gate time" skills/war/ agents/` and handle
every match — provision-scoped claims (the `env-blocked` task-outcome bullet in SKILL.md, the
schemas.md Lead-handling line, the provision-failure comment in the template) remain **true and
unchanged**; gate-time-scoped claims (the SKILL.md `gate_failed`-routing environment arm, the
refiner card step-3 sentence, the template's merge-site and land-site environment-arm comments)
rewrite to the bounded-retry mechanics. **Grep is a floor, not a ceiling — mandatory manual
same-scope survey:** after the grep, hand-scan SKILL.md's Checkpoint outcome bullets
(`env-blocked`, `gate_failed` routing by class, `held:land-failed`, `held:escalation`),
`agents/war-refiner.md` merge-task steps 1–3 plus the Gate-failure classification and land-phase
sections, both gate-site comment blocks in `workflow-template.js`, and
`skills/war/references/schemas.md`'s MergeResult / `gate_failure_class` prose for same-meaning
siblings that encode zero-retry in different words ("soft-escalate", "siblings proceed", "the Lead
re-runs the land", "same handling as a provision env-blocked") and survive the token grep silently;
list each straggler found as a survey-derived correction in the implementing task's report.

## 5. Surface changes

- `skills/war/assets/workflow-template.js` — merge-site environment arm → environment-proceed
  dispatch + routing (§4.1); land-site environment arm → environment-proceed re-land + routing
  (§4.2); comment rewrites at both sites. The hand-mirrored `HARD_ESCALATION_REASONS` array and the
  emitted-superset comment stay byte-untouched.
- `skills/war/assets/workflow-template.test.mjs` — behavior tests for both sites + bounds; new D3
  registry row; registry floor 10 → 11.
- `agents/war-refiner.md` — §4.3 rewrites (same commit as the template edits; both-surfaces rule).
- `skills/war/SKILL.md` — `gate_failed`-routing environment arm rewrite; one-sentence retry note in
  the `held:land-failed` bullet (the Lead manual re-run is now the *second* line of defense); the
  §4.4 precheck sentence in the manual-land recipes.
- `skills/war/assets/provision-worktrees.sh` — `cmd_land_advance` precheck + header/catalogue
  comment updates (bash 3.2).
- `skills/war/assets/provision-worktrees.test.sh` — new wrong-HEAD case; existing CAS-race and
  guard cases unchanged.
- `skills/war/assets/skill-doc-contracts.test.mjs` — new row guarding the rewritten SKILL.md
  environment arm (decision 10).
- `skills/war/assets/land-decision.mjs`, `skills/war/assets/land-decision.test.mjs` —
  **deliberately untouched** (decisions 2/3); staying green is criterion 5.
- `CONTEXT.md` — new term (§6).
- `docs/adr/` — §7.

## 6. New domain terms (CONTEXT.md)

- **environment-proceed** — the bounded (exactly one per gate site) Workflow-dispatched fresh-env
  re-run of a gate-failed merge or land whose failure classified `environment`. Sibling of
  baseline-proceed with the opposite gate discipline: baseline-proceed *proceeds over* named
  pre-existing failures with debt recorded; environment-proceed *re-runs and must be green*.
  _Avoid_: any new `MergeResult` status or escalation-reason enum member for it (the existing
  `merged`/`gate_failed`/`landed` statuses and the reused `'escalate'`/`'env-blocked'` reasons carry
  it end-to-end).

## 7. Recommended ADRs

1. **New ADR — environment-class gate failures earn one in-workflow retry; merge-site exhaustion
   holds the phase.** Records decisions 1–5: the one-dispatch bound, the no-chaining rule, the
   green-required asymmetry vs. baseline-proceed, and the explicit rejection of Workflow-emitted
   `held:phase-incomplete` (the intentional-gap guard stays ratified).
2. **Amend ADR 0023 (land asserts git ground truth)** with the wrong-HEAD precheck: the push's
   precondition (`HEAD == <merge-sha>`) is part of land truth, so the CAS-reject exit means only a
   real concurrent advance. Originating specs (e.g. the 2026-06-25 §5.3 CAS prose guarded by the
   D15 doc-contract row) stay uncorrected per convention.

## 8. Open risks / implementation notes

- **Shared-surface contention.** `workflow-template.js`, `workflow-template.test.mjs`, and
  `agents/war-refiner.md` are edited by other groups in this survey cluster, and the D3 registry's
  exact floor makes concurrent edits collide by construction. `/war-machine` must serialize this
  group's registry/drift-test edits into the existing dependsOn chain
  (`auditor-guard-ergonomics → audit-adjudication-threading → servitor-wrapup-landed-tip`).
- **Extraction-anchor safety.** All land-site insertions must stay between the
  `// landDecision mirrors land-decision.mjs` comment and the catch's `held:workflow-error` literal,
  and must not move the `let landDecision = …` ternary away from its `const refineryLandPath`
  terminator — `workflowEmitted()` in `land-decision.test.mjs` slices on those constructs. The D3
  `sliceSrc` anchors (`POST-MERGE GATE-AUDIT`, `END-STATE-ONLY GATE-AUDIT`) are downstream of both
  gate sites and unaffected, but verify by running the suite, not by inspection.
- **Precondition-marker residual.** The `REL_GUARD_PRECONDITION_FAILED` short-circuit classifies
  `environment` *without* a fresh-env tip re-run, so an environment-proceed retry there has weaker
  pass-prediction; it is still bounded at one and its exhaustion routes are identical.
- **`--afk` behavior shift.** A merge-site exhaustion now yields `held:escalation` where the phase
  previously "completed": under `--afk` the Lead self-adjudicates (the recorded
  afk-self-adjudicate doctrine) via the escalation-completion land. This is the intended trade —
  a held phase with a self-explaining detail over a silent deliverable skip.
- The new environment-proceed prompts must thread `gateCaptureClause`/`gate_log_path` and
  `integration_sha` the way the primary merge prompt does, so the post-merge gate-audit pass keeps
  its evidence chain on a retried merge.
- The published lesson `land-advance-push-first-cas-rejected-token` (local memory) records the bare
  0/2/3 contract; the next retired-token sweep / `/lessons-learned` pass adjudicates it — not this
  change.

## 9. Non-goals / deferred

- **No retry for `introduced`-class failures** at either site — a reproducing regression is real;
  today's soft escalation stands. (#984 scopes to the class the classifier proved transient.)
- **No change to provision-time or stale-remote `env-blocked`** (worker never spawned): zero rounds,
  soft, siblings proceed, worktree kept.
- **No Workflow emission of `held:phase-incomplete`** — explicitly rejected (decision 2), so no
  edits to either hand-mirrored enum copy or their drift guards.
- **No change to the push form or the `[rejected]` classification** in `cmd_land_advance` (pivotal
  constraint 4); no new exit-code constant (decision 7).
- **No retry-count knob.** The bound is a structural ONE per gate site, not a config field —
  deferred until evidence shows one bounded retry under-recovers.
- **No in-run auto-correction of memory-lesson recipe prose** (§8 last note).

## 10. Validation criteria

1. `workflow-template.test.mjs`: a merge-task `gate_failed` MergeResult with
   `gate_failure_class: 'environment'` dispatches exactly one refiner agent labeled
   `merge:<taskId>:environment-proceed`; a `merged` result from it puts the task in `landed` and the
   phase lands (delete-the-feature: reverting §4.1 restores the immediate `env-blocked` escalation
   and zero environment-proceed dispatches, redding this test).
2. `workflow-template.test.mjs`: an environment-proceed re-merge returning `gate_failed` classified
   `environment` again produces an escalation with `reason: 'escalate'` and
   `landDecision: 'held:escalation'` **with merged siblings present** — the phase no longer reports
   `landed` minus an approved task.
3. `workflow-template.test.mjs`: a land-phase `gate_failed` classified `environment` dispatches
   exactly one `land:phase-<id>:environment-proceed` re-land; its `landed` result yields
   `landDecision: 'landed'` and the servitor wrap-up dispatch fires; a second `environment`
   classification yields `held:land-failed` with reason `env-blocked`.
4. `workflow-template.test.mjs` bound tests: a `baseline-proceed` re-merge/re-land returning an
   environment-class `gate_failed` dispatches **no** environment-proceed (dispatch-count assertion),
   and an environment-proceed second failure classified `baseline` routes as `introduced` (no
   baseline-proceed dispatch).
5. `node --test skills/war/assets/land-decision.test.mjs` passes with the file **unmodified**: the
   `behavioral ⊆` test still extracts exactly the 6 emitted landDecision values, and the
   intentional-gap test (`held:phase-incomplete` ∉ Workflow-emitted) still passes.
6. The D3 both-surfaces registry contains an `environment-proceed` row whose anchors hit
   `agents/war-refiner.md` **and** the dispatched environment-proceed prompt(s), and the registry
   floor assertion reads 11 with its enumerating message updated (per-surface delete-the-feature:
   reverting either surface's sentence reds the row).
7. `bash skills/war/assets/provision-worktrees.test.sh`: a new case invokes `land-advance` from a
   clone whose HEAD is **not** `<new-sha>` while `origin/<working>` sits at an older tip, and
   asserts exit code equals `EX_WRONG_BRANCH` (6) — **not** 2 — the combined output names both SHAs
   and the expected-cwd guidance, and `refs/heads/<working>` local **and** origin are byte-unchanged
   after the call.
8. The existing CAS-race case (two clones, loser gets `[rejected]`) still exits 2, and the
   already-landed reconciliation case still exits 0 from an arbitrary cwd — proving the precheck
   placement (decision 8) left the guard's early-return arms untouched.
9. `skill-doc-contracts.test.mjs`: a new row extracts SKILL.md's `gate_failed`-routing environment
   arm by construct and asserts the bounded environment-proceed mechanics present **and** the
   gate-time zero-retry claim absent (assert-OLD-absent: the arm no longer pairs the environment
   class with an unconditional soft-escalate/"0 FIX rounds" gate-time doctrine), with a non-vacuous
   presence companion.
10. Repo-wide greps return zero hits for the retired phrases "zero-round env-blocked escalation"
    (in `agents/war-refiner.md`) and "an environmental failure passes on retry" (in
    `workflow-template.js`) — **survey note (grep is a floor):** the implementing task then
    hand-scans the §4.5 same-scope surfaces and lists every same-meaning straggler it corrects.
