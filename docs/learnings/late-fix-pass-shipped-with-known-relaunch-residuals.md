---
name: late-fix-pass-shipped-with-known-relaunch-residuals
description: The late-fix pass shipped with known recovery-relaunch residuals that auditors raised as notes or asks
metadata:
  node_type: memory
  type: project
  keywords:
    - late-fix pass
    - lateFixPass residual
    - task-integrated.sh
    - NO_TASK_PROOF sibling
    - Late-Fix trailer
    - lateFixSeq branch reuse
    - recovery relaunch
    - empty late-fix branch
    - carryLate fix-less row
    - lateOriginOf unmerged raiser
    - seededTasks env-died
    - seed fixRounds reset
  provenance: code-verified
  slug: late-fix-pass-shipped-with-known-relaunch-residuals
  phase: 2026-11-04-late-defects-fixed-in-run/phase-3 (task 3.1) + phase-4 (task 4.1) + phase-6 (task 6.1)
  tags:
    - late-fix
    - recovery
    - residual
    - task-integrated
  created: 2026-11-05
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-06T04:26:42.451Z
---

# The late-fix pass shipped with known relaunch residuals

Read this before you change `lateFixPass` in `skills/war/assets/workflow-template.js` or the owned-path walk in `skills/war/assets/task-integrated.sh`.
Auditors raised each residual several times as a `note` or `ask`, and none was fixed in task 3.1.

1. **A late fix on a sibling's owned path costs that sibling its recovery proof.**
   `task-integrated.sh` accepts a one-parent commit on an owned path only when its `Late-Fix:` trailer names this task.
   The late-fix `fence` holds only unmerged tasks' files, `sweepExclude` files and release slots, not merged siblings' files.
   So a fix charged to task A can edit task B's path, and on a relaunch B reads `NO_TASK_PROOF` and re-runs work/audit.
   It fails safe. `skills/war/references/refiner-recovery.md` states the rule ("a late-fix commit naming another task … is no proof").
   Polish commits already break the proof the same way.
   Two `ask` rows (widen the rule versus document the re-run) went to the Checkpoint. Check the ruling before you change the rule.
2. **Late-fix branch names carry no runId.** `lfBranch` is `war/<slug>/p<N>-latefix-<k>`, and `lateFixSeq` restarts at 0 on each launch.
   A spent branch stays unmerged, so a relaunch can reuse it with its old rejected commits, or fail provision if another worktree holds it.
   The re-audit judges the full diff, so nothing lands unjudged. The `p<N>-polish` branch has the same shape.
3. **An empty late-fix branch can merge as "fixed".** Only `isSha(w.head_sha)` and unanimous roster approval gate it. No commit-count check exists.
4. **A late-fix re-audit `escalate` verdict loops like `request_changes`.** Its `escalate_reason` never reaches the hold or carry detail. The sweep panel behaves the same way.

Phase 4 (task 4.1, the behavior-row sort, PIN-21) added two residuals. Both went to the Checkpoint as unruled `ask` rows. #2624 ruled both: residual 5 is fixed, and residual 6 keeps its route.

5. **RESOLVED (#2624): a fix-less or fileless behavior row could carry with no fix text.** Now `parkFixless` parks it as an ask on both arms, before `carryLate` or the final-phase demote.
   One split is left: the sweep filter reads the raw `disposition`, but the terminal arm reads `dispositionOf(f, null)`. So a fileless behavior Minor with no disposition parks at the sweep and files as a follow-up at the terminal seat. Neither route drops it.
   The original text follows. The polish panel's `sweepMinors` filter and the terminal arm of `routeTerminalMinors` read raw seat findings, and intakeFloor never runs there.
   So a behavior row that is not an `ask` or `follow-up` goes to `carryLate` on a non-final phase, even with a blank `suggested_fix` or no file.
   On every other surface intakeFloor (PIN-2) parks that row as an ask.
   Task 6.1's seed check expects each seeded row to carry a defect, a fix and a file, so such a row may fail that check. Nothing is dropped today.
6. **Ruled keep (#2624): a behavior row from a task that did not merge can join the late-fix pass.** The sort keys only on the file owner, not on the raiser's merge status.
   `lateOriginOf` then charges a merged task and uses its roster.
   If the defect depends on the unmerged task's code, a fix at the integrated tip cannot satisfy it, and on the final phase a spent budget becomes a `late-defect` hold.
   The other fork: route such a row on `carriedPhaseClose` with its raiser's relaunch.

Locate-cue (phase 4): verify still present before acting — `const parkFixless` and its calls in the `sweepMinors = sweepMinors.filter(` block and `routeTerminalMinors` (#2624), and the owner-only `queueLateRow` call in the BEHAVIOR-ROW SORT block, found @ phase 4 landed tip 28e74359.

Phase 6 (task 6.1, `args.seededTasks`, PIN-9) added the carry intake and two more residuals.
Check the Checkpoint ruling before you change either route.

7. **RESOLVED (#2641): a seeded task that ended `env-died` or `env-blocked` dropped off the carry channel.** Now one stamp pass after the land decision sets `e.seed` on each soft record of a seeded task.
   The Lead re-threads that row into `args.seededTasks` at the recovery relaunch. It never re-carries on `carriedTasks`, so the relaunch cannot run it twice.
   The original text follows. Only the cap routes (`r.spent` at the audit loop, floor exhaustion) push to `seedCapped`.
   The soft escalation records are `{ task, reason, ... }` with no `seed` row.
   On a non-final phase the phase still lands, and `carriedTasks` holds nothing for that defect.
   The defect then lives only in the Lead's own launch args. A recovery relaunch must re-thread it by hand.
   An auditor raised this as an unruled `ask`: re-carry on `carriedTasks` (double-run risk) versus stamp the seed row on the escalation record.
8. **A seeded task's fix budget restarts each phase.** The seeded task gets no `fixRounds` from the carried row, so it starts at 0.
   The carried `fixRounds` is only stamped back onto the next carry. So a defect can spend a fresh `run.roundLimit` on every non-final phase.
   The final phase still holds it as `late-defect`, so it stays bounded by the phase count. An auditor flagged this as a possible Lead ruling.

By design: a final-phase seed hold names the seed id (`seed-1`), because the Lead rules on the task in this phase.
A carried row keeps the first origin task through `carryTaskOf`, so a seed of a seed never re-keys onto an unrelated `seed-1`.

Locate-cue (phase 6): verify still present before acting — the seed stamp loop `for (const e of escalated)` just above `const softEnvEscalated` (#2641), the seeded `tasks.push({ id, title: 'carried defect: '` line with no `fixRounds`, and `const carryTaskOf` in `skills/war/assets/workflow-template.js`, found @ phase 6 integration tip c43cebee, the second parent of landed tip 66c0f263 (the run's `_refinery` worktree).

Also see [[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]] and [[zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged]].

Locate-cue: verify still present before acting — `let lateFixSeq = 0`, the `fence` and `lfBranch` lines in `lateFixPass`, the Late-Fix trailer arm in `skills/war/assets/task-integrated.sh`, and the refiner-recovery.md proof sentence found @ phase 3 landed tip c271332.
