---
name: submodule-task-worktrees-are-invisible-to-a-superproject-worktree-list
description: "A submodule task's worktree registers under the submodule's git dir, so a superproject git worktree list never shows it"
metadata:
  node_type: memory
  type: project
  keywords:
    - submodule task
    - worktree list
    - war-task marker
    - task_worktrees
    - gitmodules
    - AUDIT-TAMPER
    - no start record
    - enumerate worktrees
    - marked_worktrees_of
  provenance: code-verified
  slug: submodule-task-worktrees-are-invisible-to-a-superproject-worktree-list
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.2
  tags:
    - war
    - hooks
    - submodule
    - worktree
    - audit
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-23T09:43:47.657Z
---

# Code that finds `.war-task` worktrees with `git worktree list` misses every submodule task

**Rule.** If code enumerates task worktrees with `git worktree list` run from the superproject (or from a superproject worktree), it never sees a submodule task's worktree.

**Why.** The Provision barrier cuts a submodule task's worktree cwd-scoped to the submodule path. The prompt line reads "Run ensure-integration and ensure-worktree cwd-scoped to each submodule task's targetRepo path (not the superproject)". Git registers that worktree in the submodule's own registry. `write_marker` in `skills/war/assets/provision-worktrees.sh` still drops a `.war-task` file at its root.

**Instance (fixed in a fix round before land, recorded as pattern, not live defect).** The first audit of task 6.2 raised a Major from the correctness seat. The fingerprint hook's SubagentStart arm listed only the payload cwd's repo. Every seat of every submodule task would then escalate `AUDIT-TAMPER: unverifiable fingerprint (no start record for <wt>)`. That fails closed, but the documented remedy (a fresh-round re-audit) hits the same path every time, so no submodule task could pass an audit. The security seat concurred at Minor. The plan-faithfulness seat noted the slice names the mechanism, and judged the gap latitude, not a deviation. No plan decision was needed.

**Fix shape at the landed tip.** `task_worktrees` in `hooks/audit-tree-fingerprint.sh` runs `marked_worktrees_of` on the cwd repo, then once per initialized path in `$MAIN/.gitmodules`. Three details matter:
- It reads `.gitmodules` from `$MAIN`, not the cwd. A superproject worktree carries no initialized submodule.
- It skips a declared path with no `.git` entry. Without that, `git -C` walks up and lists the superproject's worktrees a second time.
- It reads paths with `git config -z --get-regexp`. The default submodule name is the path, so a whitespace split breaks on a path with a space.

The hook recurses one level only. A nested submodule is not enumerated (read from `task_worktrees`, not executed).

**Test insight.** The four fixture rows in `hooks/audit-tree-fingerprint.test.sh` carry an independent oracle row: the superproject list lacks the submodule worktree and the submodule list has it. The start-record row pins an exact line count of 4, so dropping the `.git` guard (which adds duplicate lines) turns it red. A fixture built from one repo cannot show this gap.

**Locate-cue (verify still present before acting).** `task_worktrees` and `marked_worktrees_of` in `hooks/audit-tree-fingerprint.sh`, found at landed tip d66961d9 on `dev/2026-10-20-rea-artifact-evidence`. The provision prompt sits in `skills/war/assets/workflow-template.js`.

Related: [[provision-barrier-refiner-owned-not-worker-self-create]], [[submodule-phase-repo-derived-from-task-targetrepo]], [[audit-log-finding-can-be-stale-by-land-time]], [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]].
