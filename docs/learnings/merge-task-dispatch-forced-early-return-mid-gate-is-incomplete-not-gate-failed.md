---
name: merge-task-dispatch-forced-early-return-mid-gate-is-incomplete-not-gate-failed
description: "Merge-task forced early return mid-gate is INCOMPLETE, not gate_failed; re-dispatch the same branch"
metadata:
  type: project
  provenance: agent-unverified
  slug: merge-task-dispatch-forced-early-return-mid-gate-is-incomplete-not-gate-failed
  phase: 2026-08-06-gate-audit-finding-routing/phase-1 task 1.4 merge-task escalation (dev/2026-08-06-gate-audit-finding-routing)
  keywords:
    - merge-task
    - forced early return
    - gate still in progress
    - background process
    - INCOMPLETE
    - not gate_failed
    - rebase idempotent
    - re-dispatch
    - refiner escalation
    - land-decision classification
    - shell-test discovery loop
  tags:
    - refine
    - land
    - escalation
    - gate
  created: 2026-08-15
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-16T01:46:49.301Z
---

# A merge-task dispatch cut off mid-gate is INCOMPLETE, not a real gate_failed/introduced verdict

**What happened (agent-unverified — the refiner's own escalation report, task 1.4,
`2026-08-06-gate-audit-finding-routing` phase 1; the named gate-discovery construct is
code-verified present at the landed tip, see Locate cue):** a `merge-task` dispatch for
`war/2026-08-06-gate-audit-finding-routing/p1-1.4` completed hygiene re-attach, the
submodule-mutation check, and a clean `git rebase` onto the integration tip with **no
conflicts**. It then dispatched the composed gate (`node --test 'skills/**/*.test.mjs' && for f in
$(find . -type f -name '*.test.sh' ... | sort); do bash "$f" || exit 1; done`) — the node half
passed, and the shell-test discovery loop was mid-run (last observed:
`hooks/validate-worktree-scope.test.sh`, ~1405 lines of PASS output, zero failures seen) when the
dispatch was **forced to return before the gate finished** — the background gate process (a real
PID) was still running. No merge or push had been attempted; `_refinery` was untouched at the
integration tip; the rebased task branch sat rebased-but-unmerged in the task worktree.

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

## Locate cue

The gate's shell-test discovery loop (`for f in $(find . -type f -name '*.test.sh' ...) ... do
bash "$f" || exit 1; done`) is code-verified present in `skills/war/assets/war-config.mjs`
(`resolveGate`'s bash half) at the landed tip `20816fd0412788ba11412356f5471f6b1447d682`
(gitdir physical path containing this plan's slug:
`<repo-root>/.claude/war-worktrees/2026-08-06-gate-audit-finding-routing-2026-08-15/_refinery/`).
`hooks/validate-worktree-scope.test.sh` also exists at that tip.

## Related

[[never-follow-resumefromrunid-hint-after-a-land-failure]] — same family of "gate recovery choice
must be driven by the specific failure/incompleteness reason, not a generic status label."
[[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]] — a related dispatch-robustness
concern in the same Refine/merge machinery.
