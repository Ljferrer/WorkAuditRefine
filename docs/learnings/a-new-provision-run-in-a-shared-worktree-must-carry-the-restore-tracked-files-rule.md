---
name: a-new-provision-run-in-a-shared-worktree-must-carry-the-restore-tracked-files-rule
description: "Every new site that runs run.provision must interpolate PROVISION_CLEAN_LINE, except depClause"
metadata:
  node_type: memory
  type: project
  keywords:
    - PROVISION_CLEAN_LINE
    - provision re-run
    - _refinery dirty
    - git checkout -- .
    - lockfile rewrite
    - topology barrier
    - provision_tree marker
    - env-blocked refinery
  provenance: code-verified
  slug: a-new-provision-run-in-a-shared-worktree-must-carry-the-restore-tracked-files-rule
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-4 (task 4.1)
  tags:
    - war
    - provision
    - refinery
    - workflow-template
    - prompt-surface
  created: 2026-10-30
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-10-30T10:18:25.516Z
---

# A new provision run must carry the restore-tracked-files rule

**The rule.** A provision step can rewrite a tracked file, for example an install that rewrites a lockfile.
In the shared `_refinery` worktree that dirt breaks later work.
The next `git merge --no-ff --no-commit` can refuse on overlapping paths.
The gate then runs on a tree that differs from HEAD.
The next phase's topology barrier dies on the dirty detached-holder arm of `cmd_ensure_refinery_worktree` in `skills/war/assets/provision-worktrees.sh`.
The #1395 relaunch fix first stated the rule, inside `endstateProvisionClause`.

**What happened in phase 4.** Task 4.1 widened provisioning to five new `_refinery` sites and the polish worktree.
Its first commit reused `provisionStep` and `PROVISION_RERUN_CLAUSE`, and neither carried the restore rule.
Two audit seats raised it as Major in round 1.
A fix round closed it before land, so the gap is not live.
The pattern is general: when you widen where a step runs, copy the invariant clauses of the old site too.

**Where the rule lives at the landed tip.** One shared constant, `PROVISION_CLEAN_LINE`, in `skills/war/assets/workflow-template.js`.
It is interpolated by `provisionStep` (task worktrees and `_refinery`), by the polish-worktree provision and by `PROVISION_RERUN_CLAUSE`.
`endstateProvisionClause` keeps its own older `git -C` spelling.
`depClause` omits the rule on purpose, because the dep-wave worker's uncommitted edits live in that worktree.
The refiner card's merge-task step 1 in `agents/war-refiner.md` carries the sentence byte-equal, and an ES13 row binds the pair.
The sentence also says to write the marker only after the restore.

**How to apply.** If you add a site that runs `run.provision`, interpolate `PROVISION_CLEAN_LINE` and add a census row.
If the site runs in a worktree that holds a worker's uncommitted edits, do not add it, and say why in a comment.
See [[a-shared-write-clause-inside-a-read-only-prompt-contradicts-its-opener]] for the sibling prompt hazard.

**Operator note: a red `_refinery` provision step.** The engine escalates env-blocked under the pseudo-task id `phase-<id>-refinery` and keeps the worktree.
The merges still proceed, and each later `_refinery` gate re-runs the steps by the tree rule.
The soft-env summary log then says to re-run the escalated rows "via the Recovery-relaunch runbook".
That runbook retries tasks, and `phase-<id>-refinery` is not a task, so fix the environment and treat the row as phase-level.
The `phase-<id>-land` id follows the same precedent.

Locate-cue: verify still present before acting. Found at `skills/war/assets/workflow-template.js` (constants `PROVISION_CLEAN_LINE`, `PROVISION_RERUN_CLAUSE`, function `provisionStep`, the `refineryId` block) @ phase 4, landed tip 426c70a8.

Related: [[provision-barrier-refiner-owned-not-worker-self-create]], [[standing-instruction-vs-dispatched-prompt-coverage-split]].
