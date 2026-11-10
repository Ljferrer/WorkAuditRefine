---
name: merge-task-dispatch-forced-early-return-mid-gate-is-incomplete-not-gate-failed
description: "A merge-task dispatch forced to return before its spawned gate (node --test + the *.test.sh discovery loop) finishes is INCOMPLETE, not gate_failed/introduced — the rebase it already completed is idempotent and safe to leave alone; re-dispatch the same branch to let the gate run to completion, never treat the partial run as a real classification"
metadata:
  type: project
  provenance: agent-unverified
  slug: merge-task-dispatch-forced-early-return-mid-gate-is-incomplete-not-gate-failed
  phase: 2026-08-06-gate-audit-finding-routing/phase-1 task 1.4 merge-task escalation (dev/2026-08-06-gate-audit-finding-routing)
  keywords:
    - merge-task
    - forced early return
    - INCOMPLETE
    - not gate_failed
    - rebase idempotent
    - re-dispatch
    - GATE_EXIT marker
    - self-misclassifying error MergeResult
  tags:
    - refine
    - land
    - escalation
    - gate
  created: 2026-08-15
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-25T08:17:39.476Z
---

# A merge-task dispatch cut off mid-gate is INCOMPLETE, not a real gate_failed/introduced verdict

**What happened (agent-unverified — the refiner's own escalation report, task 1.4,
`2026-08-06-gate-audit-finding-routing` phase 1):** a `merge-task` dispatch completed hygiene
re-attach, the submodule-mutation check, and a clean `git rebase` onto the integration tip with
**no conflicts**. It then ran the composed gate (`node --test 'skills/**/*.test.mjs' && for f in
$(find . -type f -name '*.test.sh' ... | sort); do bash "$f" || exit 1; done`). The node half
passed and the shell-test loop was mid-run, with zero failures seen, when the dispatch was
**forced to return before the gate finished**. No merge or push had been attempted; `_refinery`
was untouched; the rebased task branch sat rebased-but-unmerged in the task worktree.

**The rule:** a forced-early-return escalation of this shape — clean rebase already completed,
gate dispatched and observed passing so far but not yet exited — carries **no real gate_failed or
introduced classification**. Nothing failed; the run simply did not finish before the dispatch's
own return deadline. The correct handling is: (1) do **not** score this as a gate failure or a
regression the task introduced; (2) a follow-up `merge-task` dispatch for the same branch should
**re-run the gate to completion** rather than trust the truncated partial output; (3) the
already-succeeded rebase does **not** need to be repeated — re-running `git rebase` on an
already-rebased, conflict-free branch is a safe no-op (nothing to replay), so the follow-up
dispatch can skip straight to (re-)running the gate and, if green, proceeding to the merge.

**Why it matters:** a Lead or automated retry logic that pattern-matches on "escalation reason:
error" without reading the escalation `detail` payload risks either (a) wrongly demoting the task's
gate status to failed/introduced when nothing actually failed, or (b) wastefully re-running the
rebase step when it already succeeded and rebasing an up-to-date branch is a guaranteed no-op. The
escalation payload's own prose ("NO merge or push has been performed... nothing here should be
treated as a real gate_failed/introduced classification: this is an incomplete run, not a
failure") is the authoritative signal to trust over any downstream status inference.

**Locate cue:** the gate's shell-test discovery loop is `resolveGate`'s bash half in
`skills/war/assets/war-config.mjs`.

## Recurrences

The same shape recurred on later plans as the full gate grew past one dispatch's time budget.
Re-dispatching the same branch with the gate backgrounded fixed it. That remedy is now its own
lesson: [[a-new-refiner-gate-dispatch-needs-the-backgrounded-gate-route-or-a-long-gate-falls-to-its-red-arm]].

**Land-side twin (2026-08-24, agent-unverified — the Lead's recovery account):** a **land**
dispatch hit the same wall. Its gate outlived the dispatch tool timeout, so it backgrounded the gate
and had to emit `StructuredOutput` before any `GATE_EXIT` line existed. A land dispatch's schema has
no "still running" verdict, so it emitted `MergeResult` `status: "error"` with a narrative saying
"incomplete/interrupted, not a genuine error". The engine routes on the bare `status`, so the phase
went to `held:land-failed`. The `status` field of such a payload is self-misclassifying: read
`gate_output` and the escalation detail before treating `status: "error"` as a real failure.

The merge commit a dead land dispatch leaves in `_refinery` can be correct and reusable. For how to
recover without minting a duplicate merge, see
[[never-follow-resumefromrunid-hint-after-a-land-failure]].

## Related

[[never-follow-resumefromrunid-hint-after-a-land-failure]] — same family of "gate recovery choice
must be driven by the specific failure/incompleteness reason, not a generic status label".
[[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]] — a related dispatch-robustness
concern in the same Refine/merge machinery.

> archived 2026-10-27: resolved — moved to archive
