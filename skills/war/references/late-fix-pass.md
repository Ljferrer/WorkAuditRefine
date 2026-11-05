# The late-fix pass

The late-fix pass fixes a late defect before the phase lands. A late defect is a real behavior defect that a seat finds after the task's own audit approved. Plan `2026-11-04-late-defects-fixed-in-run` (D5, D8, D13, D20, D25) sets the rules. The engine home is the `LATE-FIX PASS` block in [`../assets/workflow-template.js`](../assets/workflow-template.js).

## When it runs

The pass runs after every post-merge gate-audit seat and before the engine computes `hardEscalation` and `landDecision`. A fixed defect lands with the phase, and a spent one holds or carries.

Its queue holds late defects. A gate-audit-family seat (the per-task seat, the integrated-tip seat or the end-state-only seat) sends a Critical or Major with a non-blank `suggested_fix` to the queue. A fix-less blocker, or an `escalate` verdict, keeps the `gate-evidence` hold.

One defect gets one late fix. If several seats raise the same file and title, the queue keeps the first row and logs each dropped copy. The dropped copy's seat is corroborated onto the kept row. The late-fix worker prompt carries each copy whose rationale or `suggested_fix` differs. A row with no file never dedups, because a bare title cannot show that two tasks' rows are one defect.

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
3. The origin task's roster re-audits the new sha. Approval is unanimous. An evidence seat reads the origin task's manifest, which the late-fix worker writes. The round's Minor and Nit rows walk the shared disposition ladder under the origin task's id. This holds on the approve arm and on the reject arm. An `ask` parks for the Checkpoint, a `follow-up` files, a `note` notes, and an `absorb` rides the phase-close sweep. A row a later round raises again corroborates the first record.
4. On approval the refiner runs the gate in the late-fix worktree and fast-forwards the branch in `_refinery` with `git merge --ff-only`. A non-fast-forward returns `conflict`. Before the fast-forward, the refiner reads the `Late-Fix` trailer of every commit in `<integration>..<late-fix branch>`. A commit with no `<origin id>:<n>` value returns `conflict`, so a relaunch never meets a bare commit. It skips the three task-field floors and runs the submodule floor and the Budget-Raise floor. A red gate takes another round. Any other merge outcome stops the defect.

The loop ends on a merge, a stop, or `fixRounds >= run.roundLimit`.

A merged late fix moves the integration tip. The engine records its `integration_sha` as the last landed tip, so a held phase's handoff `tipSha` names it. The handoff `endState` reads a condition whose only blockers the pass fixed as `unverified` with a note, because no seat re-attests after the late fix.

## A spent or stopped defect

A late defect with no merged origin task never enters a round: it keeps the `gate-evidence` hold.

The branch stays unmerged and the pre-fix tip lands. No branch is force-moved. The defect then routes:

- on a non-final phase that no other hard reason holds, to one row of the top-level `carriedTasks[]` return, which the Lead threads as the next launch's `args.seededTasks`;
- on the final phase, or on a phase another hard escalation already holds, to `escalated.push({ task, reason: 'late-defect', fixRounds, detail })`, which holds the land as `held:escalation`.

`late-defect` is a member of `HARD_ESCALATION_REASONS` in [`../assets/land-decision.mjs`](../assets/land-decision.mjs).

## A relaunch

On a sanctioned recovery relaunch the barrier reads the `Late-Fix` trailers on the first-parent, single-parent commits after each preMerged task's merge commit. It returns the highest index as `lateFixCharges`, which seeds that task's `fixRounds`. `task-integrated.sh` accepts such a commit on an owned path when its trailer names the task. See [refiner-recovery.md](refiner-recovery.md) § Recovery task provenance.
