---
name: fix-round-uncommitted-leftover-is-stashed-by-pin-transfer-and-never-lands
description: "SUPERSEDED (#2617): a dirty task worktree at pin-transfer or merge-task now holds the task (escalate); stash entries exist only from older runs"
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
    - ace gate restore
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
  modified: 2026-10-30T10:18:51.561Z
---

# Uncommitted work left by an ace fixer never reaches the pin or the land

**RESOLVED (#2617, 2026-11-05) — kept as concept anchor.** The refiner no longer stashes a leftover. A pin-transfer probe or merge-task that finds uncommitted tracked edits returns `error` with `detail: "dirty task worktree: <paths>"`, and the engine holds the task with reason `escalate`. For the recovery, read the `dirty at pin-transfer` bullet in `skills/war/references/resume-and-recovery.md`.

**Rule.** Uncommitted edits a fix or ace worker leaves in its task worktree are unaudited and must never be silently stashed or dropped. Hold the task and let the Lead commit or restore them. Before #2617, two runs (phase 6 task 6.2 and a later task 1.4) stashed such edits at pin-transfer, recorded only in free text. The stash stack is shared, so an `uncommitted-ace-leftover` entry may still exist from an older run: capture its SHA, inspect with `git stash show -p <sha>`, apply by SHA, never pop.

In a provisioned run, the ace gate's `PROVISION_CLEAN_LINE` restore (via `PROVISION_RERUN_CLAUSE`) can discard tracked leftovers before pin-transfer, so an empty stash list proves nothing.

Related: [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]], [[in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]], [[a-new-provision-run-in-a-shared-worktree-must-carry-the-restore-tracked-files-rule]].
