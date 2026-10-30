---
name: tree-keyed-provision-skip-never-fires-at-task-worktree-gates
description: "The provision_tree marker skip almost never fires at merge or ace-gate sites, by design"
metadata:
  node_type: memory
  type: project
  keywords:
    - provision_tree marker
    - provision cost
    - tree-keyed re-run
    - PIN-15
    - slow phase
    - extra provision runs
    - merge step (a)
  provenance: code-verified
  slug: tree-keyed-provision-skip-never-fires-at-task-worktree-gates
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-4 (task 4.1)
  tags:
    - war
    - provision
    - performance
    - workflow-template
  created: 2026-10-30
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-10-30T10:18:39.667Z
---

# The tree-keyed provision skip almost never fires at task-worktree gates

**The fact.** `provisionStep` writes the `.war/provision_tree` marker at the worktree's creation tree, before the worker runs.
The worker's commits then change the HEAD tree.
So at each merge step (a) copy and at the ace-gate check, the marker does not match, and `PROVISION_RERUN_CLAUSE` re-runs the full `run.provision` list.
Each land re-runs once more in `_refinery`, because `merge --no-ff` always makes a new tree.
The cost is about one extra provision run per task merge, per ace gate and per land.

**Why it stays.** PIN-15 and the operator-ratified D15 row of the `2026-10-28-blocked-ace-and-merge-provenance` plan require it.
No gate may run on a tree the provision steps have not seen, and the worker's commits make such a tree.
The skip mainly saves runs at `_refinery` sites, not at task-worktree sites.

**How to apply.** If a provisioned run feels slow, count provision runs before you suspect a loop.
Do not "fix" the re-run by trusting the creation-time marker, because that breaks PIN-15.
A possible later design refreshes the marker after the worker's last commit, and it needs a plan of its own.

Locate-cue: verify still present before acting. Found at `skills/war/assets/workflow-template.js` (`PROVISION_TREE_LINE`, `PROVISION_RERUN_CLAUSE`, `provisionStep`) @ phase 4, landed tip 426c70a8.

Related: [[a-new-provision-run-in-a-shared-worktree-must-carry-the-restore-tracked-files-rule]].
