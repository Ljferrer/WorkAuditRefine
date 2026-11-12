# The late-fix pass

The late-fix pass fixes a late defect before the phase lands. A late defect is a real behavior defect that a seat finds after the task's own audit approved. Plan `2026-11-04-late-defects-fixed-in-run` (D5, D8, D13, D20, D25) sets the rules. The engine home is the `LATE-FIX PASS` block in [`../assets/workflow-template.js`](../assets/workflow-template.js).

## When it runs

The pass runs after every post-merge gate-audit seat and before the engine computes `hardEscalation` and `landDecision`. A fixed defect lands with the phase, and a spent one holds or carries.

Its queue holds late defects. A gate-audit-family seat feeds it. The seats are the per-task seat, the integrated-tip seat and the end-state-only seat. Each sends a Critical or Major with a non-blank `suggested_fix` to the queue. A fix-less blocker, or an `escalate` verdict, keeps the `gate-evidence` hold. The behavior-row sort (PIN-21) also sends each `behavior` phaseCloseQueue row on a stacked-owned or unowned file to the queue. See the `sweepExclude` row in [schemas.md](schemas.md). The wave-side pre-ace probe sends each ace re-audit blocker it answers `yes` or `unknown` (PIN-3, PIN-11). A per-task baseline-proceed merge sends one `baseline` row per run that names every recorded failing id (PIN-12). The `baseline` row's late-fix merge never proceeds over the debt it fixes. See the GateCheck and PreAceProbe rows in [schemas.md](schemas.md).

One defect gets one late fix. If several seats raise the same file and title, the queue keeps the first row and logs each dropped copy. The dropped copy's seat is corroborated onto the kept row. The late-fix worker prompt carries each copy whose rationale or `suggested_fix` differs. A row with no file never dedups, because a bare title cannot show that two tasks' rows are one defect.

If another hard escalation already holds the phase, the pass does not run. Each queued defect then rides a `late-defect` hold to the Lead, so it is never dropped.

## The origin task

A row whose own task did not merge this phase (a wave-side pre-ace probe row) charges no task. It demotes `demote:exclusion-set`, like the behavior-row sort's unmerged-owner arm, and the task's relaunch re-audits it.

Each other defect charges one origin task:

1. the row's own merged task (the per-task seat);
2. else the merged task whose `Files:` hold the defect's file;
3. else the lowest-id merged task of the phase.

The origin task lends its roster and its `fixRounds` budget under `run.roundLimit`.

## One defect, round by round

1. The refiner cuts a late-fix worktree at the integrated tip (`dispatchKind: late-fix-worktree`, labelled `late-fix-worktree:p<phase>-latefix-<k>`). It runs the same steps as the polish worktree: one `ensure-worktree`, then the `run.provision` steps and the marker. It returns the env-outcome JSON. The late-fix branch name carries the first 8 characters of the run id between the plan slug and the late-fix id. So two launches of one phase never cut the same branch. Without a run id the name has no run segment.
2. A `spawnWorker('fix')` worker makes one commit. The commit message ends with the trailer `Late-Fix: <task id>:<n>`. `n` is the origin task's `fixRounds` after this round's charge. Each round charges one `fixRounds` slot, so the budget is the one the task's fix and floor rounds share. The worker's fence lists the sweep exclusion set, the files of every task that did not merge, and the release slot. It also lists the owned files of every merged task except the origin's own.
   - **Already fixed at the tip.** If the tip already fixes the row, the worker makes no commit. It returns `blocked` with a `blocked_reason` that starts `ALREADY-FIXED:` and `head_sha` the unchanged tip. A diff probe must show an empty range. Then the origin roster re-audits that tip once. If any seat returns `escalate`, the defect stops at this round, as in step 3, and its `escalate_reason` rides the stop. An approval drops the row. The round's `fixRounds` charge is given back, and the pass logs it. The row is recorded on `lateFixed` with `atTip: true`, so the handoff `endState` reads it as late-fixed. A rejection keeps the charged round and the next round sees why (D42, #2773).
3. The origin task's roster re-audits the new sha. Approval is unanimous. If any seat returns `escalate`, the defect stops at this round. The joined `escalate_reason` text is the stop reason, so it reaches the `carriedTasks[]` row or the `late-defect` hold detail. An evidence seat reads the origin task's manifest, which the late-fix worker writes. The round's Minor and Nit rows walk the shared disposition ladder under the origin task's id. Each round runs its own diff probe in the late-fix worktree. A row is in-diff if its file is in the origin task's probe or this round's probe. If the round's probe fails, the origin's probe alone judges (#2622). This holds on the approve arm and on the reject arm. An `ask` parks for the Checkpoint, a `follow-up` files, and a `note` notes. A cosmetic or classless `absorb` rides the phase-close sweep. A `behavior` absorb carries on `carriedTasks[]` (non-final) or files "raised after the late-fix pass" (final), PIN-21. A row a later round raises again corroborates the first record.
4. On approval the refiner runs the gate in the late-fix worktree and fast-forwards the branch in `_refinery` with `git merge --ff-only`. A non-fast-forward returns `conflict`. Before the fast-forward, the refiner reads the `Late-Fix` trailer of every commit in `<integration>..<late-fix branch>`. A commit with no `<origin id>:<n>` value returns `conflict`, so a relaunch never meets a bare commit. This is the empty-range conflict: when that range prints no line at all, the refiner returns `conflict` ("empty late-fix branch"). An empty branch is never recorded fixed. It skips the three task-field floors and runs the submodule floor and the Budget-Raise floor. A red gate takes another round. Any other merge outcome stops the defect.

The loop ends on a merge, an approved at-tip re-audit, a stop, or `fixRounds >= run.roundLimit`.

A merged late fix moves the integration tip. The engine records its `integration_sha` as the last landed tip, so a held phase's handoff `tipSha` names it. The handoff `endState` reads a condition whose only blockers the pass fixed as `unverified` with a note, because no seat re-attests after the late fix.

## A spent or stopped defect

A late defect with no merged origin task never enters a round: it keeps the `gate-evidence` hold.

The branch stays unmerged and the pre-fix tip lands. No branch is force-moved. The defect then routes:

- on a non-final phase that no other hard reason holds, to one row of the top-level `carriedTasks[]` return. The Lead threads that row as the next launch's `args.seededTasks`.
- on the final phase, or on a phase another hard escalation already holds, to `escalated.push({ task, reason: 'late-defect', fixRounds, detail })`, which holds the land as `held:escalation`.

`late-defect` is a member of `HARD_ESCALATION_REASONS` in [`../assets/land-decision.mjs`](../assets/land-decision.mjs).

## A relaunch

On a sanctioned recovery relaunch the barrier reads the `Late-Fix` trailers on the first-parent, single-parent commits after each preMerged task's merge commit. It returns the highest index as `lateFixCharges`, which seeds that task's `fixRounds`. `task-integrated.sh` accepts such a commit on an owned path when its trailer names the task. See [refiner-recovery.md](refiner-recovery.md) § Recovery task provenance.
