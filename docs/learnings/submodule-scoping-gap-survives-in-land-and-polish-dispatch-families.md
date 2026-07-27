---
name: submodule-scoping-gap-survives-in-land-and-polish-dispatch-families
description: "RESOLVED (2026-07-26-dispatch-args-and-floor-coverage/1.1): all three residual gaps below are now closed — submodLandNote rides both re-land dispatches, the polish merge carries a bare submodule-floor invocation, and the floor-retry re-merge now invokes assert-no-submodule-mutation.sh for real. Phase 1 of recovery-re-merge-dispatch-coherence closed the submodMergeNote gap at the three MERGE-side retry dispatches, but two sibling gaps in the same submodule-scoping family remain open by design: the LAND-side submodLandNote never rides the environment-proceed/baseline-proceed re-land dispatches, and the class-exempt phase-close polish merge has no per-task lexical scope to carry a submodule note at all — plus a separate, still-live pre-existing bug: the floor-retry re-merge's own comment claims it re-instructs the submodule floor script but does not"
metadata: 
  node_type: memory
  type: project
  promoted: dev/2026-07-24-recovery-re-merge-dispatch-coherence@phase-1
  provenance: code-verified
  slug: submodule-scoping-gap-survives-in-land-and-polish-dispatch-families
  phase: "recovery-re-merge-dispatch-coherence/phase-1 (tasks 1.1, 1.2)"
  keywords: 
    - submodLandNote
    - submodMergeNote
    - assert-no-submodule-mutation.sh
    - floor-retry
    - polish merge
    - merge:p-polish
    - land re-dispatch
    - environment-proceed
    - baseline-proceed
    - submodule scoping
    - targetRepo
    - war-followup
    - workflow-template.js
    - --declared arg order
    - war-refiner.md step 6
    - assert-no-submodule-mutation exit 2
  tags: 
    - war
    - workflow-template
    - dispatch-prompt
    - submodule
    - recovery-dispatch
  created: 2026-07-25
  originSessionId: 4eee3466-8bcc-44f9-a6c2-754d46624537
  modified: 2026-07-27T20:38:28.571Z
---

# Three residual submodule-scoping gaps in the merge/land/polish dispatch families (one pre-existing bug, two by-design deferrals)

**Context:** phase 1 of `2026-07-24-recovery-re-merge-dispatch-coherence` (landed tip
`43a6dc4e712146a3bdbd8ef3e3c8c7e1d5bb98ba`, verified via the `_refinery2`/`p1-polish` task
worktree — `gitdir` resolving under
`.claude/worktrees/2026-07-24-recovery-re-merge-dispatch-coherence-2026-07-25/`) closed the
`submodMergeNote` gap recorded in
[[prompt-mirror-shape-inherits-donor-prompts-latent-omission]] for the three MERGE-side retry
dispatches in `skills/war/assets/workflow-template.js`: `submodMergeNote` is now appended at the
floor-retry re-merge (`merge:<taskId>:floor-retry:r<round>`), the `environment-proceed` re-merge,
and the `baseline-proceed` re-merge. Three siblings in the same family were traced during this
phase's own audits and are NOT fixed — two deliberately (plan non-goals), one a genuine unfixed
pre-existing bug:

**1. LAND-side `submodLandNote` (by-design deferral, still open).** `submodLandNote` is built once
(`const submodLandNote = submodLandTask && submodLandTask.targetRepo ? ... : ''`) and threaded into
exactly one dispatch: the initial `land:phase-<id>` prompt. The recovery re-land dispatches —
`land:phase-<id>:environment-proceed` and `land:phase-<id>:baseline-proceed` — never reference it.
Verified: `grep -n submodLandNote skills/war/assets/workflow-template.js` returns only the build
line and the one initial-dispatch append; both re-land dispatch prompt builders were read end to
end and contain no `submodLandNote` reference. Explicit spec §9 non-goal for this plan (Commander's
Intent Purpose scoped Task 1.1 to merge-task dispatches only).

**2. Phase-close polish merge (by-design deferral, still open).** The class-exempt polish-sweep
merge dispatch (`merge:p<phaseId>-polish`) is phase-scoped, not task-scoped — there is no per-task
`const` in lexical scope at that call site to carry any submodule-targeting note into, so the
question of "should a phase-close polish commit touching a submodule task's files be scoped" has no
current mechanism to answer at all. Also an explicit non-goal, not a slip.

**3. Floor-retry omits the submodule floor script itself (a real, unfixed, pre-existing bug — NOT
the same fact as #1/#2 above).** The floor-retry re-merge dispatch (`merge:<taskId>:floor-retry:r<round>`,
`skills/war/assets/workflow-template.js`, the "Re-attempt the serial merge" prompt inside the
combined floor-retry sub-loop) carries TWO comments both claiming it re-instructs all three floor
scripts — the sub-loop-level comment ("Every dispatched retry-merge re-instructs ALL floor
invocations (test + packaging + submodule), keeping the dispatched prompts in sync with the
standing war-refiner.md steps") and the dispatch-level comment ("Re-attempt the serial merge —
re-instructs ALL floor invocations (test + packaging + submodule)"). Neither is true: the actual
prompt body invokes `assert-test-in-diff.sh` (gated by `requiresTest`) and
`assert-packaging-in-diff.sh` (gated by `requiresPackaging`), then appends `submodMergeNote` (the
prose scoping note this phase added) — but never invokes `assert-no-submodule-mutation.sh`, the
actual floor script that blocks a submodule mutation. Both sibling recovery re-merges
(`environment-proceed`, `baseline-proceed`) DO invoke it explicitly
(`pt` Before the merge, run assert-no-submodule-mutation.sh ...`), so the omission at floor-retry
reads as an oversight, not a design choice: a floor fix-worker (add-test/package-it) that
introduces a gitlink/submodule mutation between the initial merge and the floor-retry can ride the
retry merge unchecked. `git blame` puts both comments and the prompt shape at `3b07815c`
(2026-07-06, the combined floor sub-loop) — predates this phase entirely; this phase's diff only
appended the (unrelated) trailing `submodMergeNote`. Filed by this phase's own audit as a Minor
follow-up, NOT absorbed (adding a floor invocation to a dispatched prompt is a behavior change
beyond the plan's minimal-append slice, and needs its own dispatch-capture regression test plus a
both-surfaces check against `agents/war-refiner.md` step 6).

**The pattern:** a phase whose Method is "close gap X at sites A/B/C" can legitimately leave
sibling sites D/E in the same code family open — check whether the deferral is a stated plan
non-goal (durable, expected — nothing to fix) versus an unstated comment/behavior mismatch
discovered as a side effect of tracing the same subject area (a real bug, needs its own
follow-up). Both shapes surfaced in the SAME phase here; only #3 needs action.

**RESOLUTION (phase `2026-07-26-dispatch-args-and-floor-coverage/1.1`, landed tip
`0250694ea5c69e77e2fa2f0543f81c6ccf111978`, verified in the phase's `_refinery` worktree):** all
three items above are now closed in the same commit.
- **#1 (submodLandNote at re-land dispatches):** `submodLandNote` (built once at
  `skills/war/assets/workflow-template.js`, around the `const submodLandNote = ...` line) now
  appears at exactly 4 sites total — the build line plus the initial `land:phase-<id>` prompt,
  `land:phase-<id>:environment-proceed`, and `land:phase-<id>:baseline-proceed` — confirmed via
  `grep -n submodLandNote workflow-template.js`.
- **#2 (polish merge submodule floor):** the `merge:p<phaseId>-polish` dispatch now runs
  `assert-no-submodule-mutation.sh` **bare** (never `--declared` — a coherence sweep is never a
  declared gitlink bump), with an explicit comment stating why the relax-flag never threads there.
- **#3 (floor-retry omission):** the `merge:<taskId>:floor-retry:r<round>` dispatch now actually
  invokes `assert-no-submodule-mutation.sh` (with the `--declared` conditional for a gitlink-bump
  task), matching what its own header comment always claimed. Total dispatched-prompt sites for
  `assert-no-submodule-mutation.sh` across the file: exactly 5 (initial merge, floor-retry,
  environment-proceed re-merge, baseline-proceed re-merge, polish).

**Still-live sibling gotcha surfaced by the SAME phase, NOT fixed (out of scope — see
End state 10's "no `agents/*.md` edit"):** `agents/war-refiner.md` step 6's declared-gitlink-bump
example writes the flag BEFORE the positionals — `assert-no-submodule-mutation.sh --declared
<integrationBranch> <taskBranch>`. The script
(`skills/war/assets/assert-no-submodule-mutation.sh`) parses unconditionally with
`base="$1"; branch="$2"; shift 2` before its flag loop, so that invocation order binds
`base='--declared'`, `branch='<integrationBranch>'`, and the leftover `<taskBranch>` hits the
`*) die "unexpected positional argument"` arm — **exit 2**, which the refiner contract maps to
`status:'error'`, not a clean pass. All 5 dispatched-prompt sites use the correct trailing-flag
form (`<base> <branch> --declared`), so only the standing doc card is wrong. Verified still present
at the same landed tip. Fix (when a future task touches `agents/war-refiner.md`): reorder step 6
to `assert-no-submodule-mutation.sh <integrationBranch> <taskBranch> --declared`.

**How to apply:** when auditing (or extending) any of `submodMergeNote`/`submodLandNote`-style
scoping notes or floor-script re-instruction comments in `workflow-template.js`, grep all
call sites of the specific const/script name — not just the ones a plan's slice names — before
concluding coverage is complete. A comment claiming "ALL floor invocations" or "the same scoping"
is a promise to verify per-site, not to trust.

Related: [[prompt-mirror-shape-inherits-donor-prompts-latent-omission]] (the resolved half of this
same submodule-scoping family — MERGE-side `submodMergeNote`).
