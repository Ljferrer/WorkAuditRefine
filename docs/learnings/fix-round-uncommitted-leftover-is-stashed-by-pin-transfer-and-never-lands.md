---
name: fix-round-uncommitted-leftover-is-stashed-by-pin-transfer-and-never-lands
description: "A fix-round worker's uncommitted edits get stashed at pin-transfer and dropped, recorded only in free text"
metadata:
  promoted: dev/2026-10-20-rea-artifact-evidence@phase-6
  node_type: memory
  type: project
  keywords:
    - pin-transfer
    - uncommitted
    - ace leftover
    - stash
    - dirty worktree
    - rebase refused
    - fix round
    - refiner
    - lost work
    - shared stash stack
  provenance: agent-unverified
  slug: fix-round-uncommitted-leftover-is-stashed-by-pin-transfer-and-never-lands
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.2
  tags:
    - war
    - refiner
    - pin-transfer
    - fix-round
    - process
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-27T13:45:48.566Z
---

# Uncommitted work left by an ace fixer never reaches the pin or the land

**What happened.** At task 6.2's pin-transfer, the refiner found uncommitted edits to `hooks/audit-tree-fingerprint.sh` and `hooks/audit-tree-fingerprint.test.sh` in the task worktree. Git refuses a rebase over a dirty tree. The refiner stashed the edits with the message `refiner-p6-6.2-uncommitted-ace-leftover-pintransfer` and did not apply them back. The verdict was still `pin-transfer:git-verified` with equal pre and post patch-id and content-id, because the audited pin was committed.

**What is confirmed.** The stash entry exists in the shared stash reflog of the main checkout (found at phase 6 wrap-up). Its contents were not inspected, since the servitor has no Bash. The leftover edits are unaudited, so dropping them is fail-safe for content integrity.

**What is lost.** The work itself. The only record is the refiner's free-text `reported.detail`. No structured field names it, so no gate or handoff row surfaces it.

**Hypothesis, unverified.** The leftover may hold the unfinished fix for the last absorb Minor (the relative-operand gap), which is still live at the landed tip. See [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]]. Nothing in the audit log ties the two.

**How to apply.** If a task's last fix round leaves an absorb finding open at land, list the shared stash for `uncommitted-ace-leftover` entries before you re-derive the fix. The stash stack is shared across every worktree and session. Never pop. Capture the entry SHA, inspect with `git stash show -p <sha>`, restore with `git stash apply <sha>`, then drop the entry by re-finding its index.

**Recurrence (2026-10-27-memory-query-mcp-tool/phase-1 task 1.4).** The refiner again found uncommitted edits in the task worktree at pin-transfer, this time to `CLAUDE.md` (the Guard architecture paragraph). It stashed them as `refiner-p1-1.4-uncommitted-CLAUDE.md-pintransfer`, again recorded only in the free-text `reported.detail`. The rebase of three audited commits was clean and the verdict was `pin-transfer:git-verified`. The landed `CLAUDE.md` already carries the corrected paragraph from an audited ace commit, so the loss is probably benign here. The stash contents were not inspected (servitor has no Bash), and this is a hypothesis. Two sightings make the free-text-only record a repeat pattern.

Related: [[in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]].
