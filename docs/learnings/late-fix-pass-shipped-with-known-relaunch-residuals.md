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
  provenance: code-verified
  slug: late-fix-pass-shipped-with-known-relaunch-residuals
  phase: 2026-11-04-late-defects-fixed-in-run/phase-3 (task 3.1)
  tags:
    - late-fix
    - recovery
    - residual
    - task-integrated
  created: 2026-11-05
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-05T13:44:08.357Z
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

Also see [[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]] and [[zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged]].

Locate-cue: verify still present before acting — `let lateFixSeq = 0`, the `fence` and `lfBranch` lines in `lateFixPass`, the Late-Fix trailer arm in `skills/war/assets/task-integrated.sh`, and the refiner-recovery.md proof sentence found @ phase 3 landed tip c271332.
