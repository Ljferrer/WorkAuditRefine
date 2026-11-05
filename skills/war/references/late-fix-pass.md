# The late-fix pass

The late-fix pass fixes a late defect before the phase lands. A late defect is a real behavior defect that a seat finds after the task's own audit approved. Plan `2026-11-04-late-defects-fixed-in-run` (D5, D8, D13, D20, D25) sets the rules. The engine home is the `LATE-FIX PASS` block in [`../assets/workflow-template.js`](../assets/workflow-template.js).

## When it runs

The pass runs after every post-merge gate-audit seat and before the engine computes `hardEscalation` and `landDecision`. A fixed defect lands with the phase, and a spent one holds or carries.

Its queue holds late defects. A gate-audit-family seat (the per-task seat, the integrated-tip seat or the end-state-only seat) sends a Critical or Major with a non-blank `suggested_fix` to the queue. A fix-less blocker, or an `escalate` verdict, keeps the `gate-evidence` hold.

If another hard escalation already holds the phase, the pass does not run. Each queued defect then rides a `late-defect` hold to the Lead, so it is never dropped.

## The origin task

Each defect charges one origin task:

1. the row's own merged task (the per-task seat);
2. else the merged task whose `Files:` hold the defect's file;
3. else the lowest-id merged task of the phase.

The origin task lends its roster and its `fixRounds` budget under `run.roundLimit`.

## One defect, round by round

1. The refiner cuts a late-fix worktree at the integrated tip (`dispatchKind: late-fix-worktree`, labelled `late-fix-worktree:p<phase>-latefix-<k>`). It runs the same steps as the polish worktree: one `ensure-worktree`, then the `run.provision` steps and the marker. It returns the env-outcome JSON.
2. A `spawnWorker('fix')` worker makes one commit. The commit message ends with the trailer `Late-Fix: <task id>:<n>`. `n` is the origin task's `fixRounds` after this round's charge. Each round charges one `fixRounds` slot, so the budget is the one the task's fix and floor rounds share.
3. The origin task's roster re-audits the new sha. Approval is unanimous.
4. On approval the refiner runs the gate in the late-fix worktree and fast-forwards the branch in `_refinery`. It skips the three task-field floors and runs the submodule floor and the Budget-Raise floor. A red gate takes another round. Any other merge outcome stops the defect.

The loop ends on a merge, a stop, or `fixRounds >= run.roundLimit`.

## A spent or stopped defect

The branch stays unmerged and the pre-fix tip lands. No branch is force-moved. The defect then routes:

- on a non-final phase, to one row of the top-level `carriedTasks[]` return, which the Lead threads as the next launch's `args.seededTasks`;
- on the final phase, to `escalated.push({ task, reason: 'late-defect', fixRounds, detail })`, which holds the land as `held:escalation`.

`late-defect` is a member of `HARD_ESCALATION_REASONS` in [`../assets/land-decision.mjs`](../assets/land-decision.mjs).

## A relaunch

On a sanctioned recovery relaunch the barrier reads the `Late-Fix` trailers on the first-parent, single-parent commits after each preMerged task's merge commit. It returns the highest index as `lateFixCharges`, which seeds that task's `fixRounds`. `task-integrated.sh` accepts such a commit on an owned path when its trailer names the task. See [refiner-recovery.md](refiner-recovery.md) § Recovery task provenance.
