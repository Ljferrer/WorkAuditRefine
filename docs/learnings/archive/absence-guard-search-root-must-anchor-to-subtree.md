---
name: absence-guard-search-root-must-anchor-to-subtree
description: "Anchor guard grep to subtree; root scans worktrees"
metadata: 
  node_type: memory
  type: project
  keywords: [false FAIL, stale checkout scan, SCRIPT_DIR path depth, exclude-dir=worktrees, environment-dependent false positive, .claude/worktrees]
  originSessionId: 95da24cf-ce2f-4b43-b90f-2ba274398e5b
---

**Rule:** anchor absence/presence-guard search roots to the narrowest intended subtree, never the
repo root — in a repo keeping `.claude/worktrees/**`, a root-anchored grep scans stale checkouts of
the very file under test. F08's guard in `provision-worktrees.test.sh` used `$SCRIPT_DIR/../../..`
(repo root) instead of `../..` (`skills/`) and false-FAILed on stale WAR-run worktrees.

Fixed in f08-scope-fix: `SKILLS_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"`.

**Why:** the false positive is environment-dependent — it reproduces in the MAIN checkout but
PASSES inside a task worktree; a green run inside a worktree does not prove the guard is correct.
**How to apply:** verify the anchor level empirically (`cd ... && pwd`), don't trust a path-count
in prose; `--exclude-dir=worktrees` is redundant once the root is a clean subtree.

Related: [[scope-hook-test-nonhermetic-inside-war-task-worktree]],
[[relative-path-test-needs-clean-cwd]], [[retire-token-needs-clean-surface-gate-test]].

> archived 2026-07-11: resolved — moved to archive
