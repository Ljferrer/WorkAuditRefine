---
name: war-task-marker-committed-by-git-add-a-blocks-refiner-merge
description: "Fixed: .war-task in common info/exclude (MX.1); marker-only conflict = untrack+amend"
metadata: 
  node_type: memory
  type: project
  originSessionId: 9c57c14a-92ed-4fc9-92d1-27be3d4dbad5
---

**Rule:** provisioning markers (`.war-task`) must stay invisible to the tracked tree; a worker's `git add -A` otherwise commits the marker and the refiner merge aborts pre-MERGE_HEAD ("untracked working tree files would be overwritten"), surfacing a **spurious** `conflict` escalation + UNMET end-state even though the task content is correct and audit-approved.

**Fixed:** `write_marker` in `skills/war/assets/provision-worktrees.sh` appends `.war-task` to the shared common-dir `info/exclude` (idempotent `exclude_line` helper, also used by `cmd_ensure_exclude`); one write hides the marker in every linked worktree. Regression test: case MX.1 in `provision-worktrees.core.test.sh`. `git add -A` in workers is now safe.

**How to apply:** a `conflict` escalation whose `conflict_files` is exactly a provisioning marker is NOT a code conflict — in the task worktree `git rm --cached .war-task && git commit --amend --no-edit`, `git push --force-with-lease`, re-run merge-task + land.

Related: [[edits-land-in-main-not-session-worktree]]

> archived 2026-07-04: resolved — moved to archive
