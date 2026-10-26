---
name: git-status-in-a-live-sibling-worktree-needs-optional-locks-off
description: "git status refreshes a stale index under index.lock, so a read-only status loop over live worktrees needs GIT_OPTIONAL_LOCKS=0"
metadata:
  node_type: memory
  type: project
  keywords:
    - GIT_OPTIONAL_LOCKS
    - no-optional-locks
    - index.lock
    - git status
    - stale index
    - sibling worktree
    - read-only git
    - hook side effect
    - fingerprint
  provenance: code-verified
  slug: git-status-in-a-live-sibling-worktree-needs-optional-locks-off
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.2
  tags:
    - war
    - hooks
    - git
    - worktree
    - concurrency
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-23T09:44:12.763Z
---

# A "read-only" `git status` is not read-only: it can lock a live worker's index

**Rule.** When a hook or script runs `git status` in worktrees it does not own, export `GIT_OPTIONAL_LOCKS=0` (git's `--no-optional-locks`). Without it, `status` refreshes a stat-stale index and writes it back under `<gitdir>/index.lock`. A live worker's `git add`, `git commit` or the refiner's `git rebase` in that worktree then dies with `index.lock: File exists`.

**Why it bit here.** The fingerprint hook's SubagentStart arm runs `status` in every `.war-task` worktree, including live sibling workers' and the refiner's. The hook export sits near the top of `hooks/audit-tree-fingerprint.sh`. The status output is the same either way, so the opt-out costs nothing.

**Test insight (the oracle matters).** A pre-existing `index.lock` is NOT the oracle. `git status` skips the refresh silently when it cannot take the lock, in both modes, so that row never goes red. The working oracle in `hooks/audit-tree-fingerprint.test.sh`:
- Give a tracked file an old mtime (content unchanged) to stale the index.
- Run each fingerprinting arm.
- Compare `cksum` of the index before and after.
- Run a plain `git status` afterward as the sensitivity check: it must write the stale index, or the oracle is vacuous.

**Locate-cue (verify still present before acting).** The `export GIT_OPTIONAL_LOCKS=0` line in `hooks/audit-tree-fingerprint.sh`, and the row titled "every fingerprinting arm leaves the worktree index unwritten (no optional lock)" in its test, found at landed tip d66961d9 on `dev/2026-10-20-rea-artifact-evidence`.

Related: [[dirty-worktree-fingerprint-needs-blob-hashes-z-status-and-link-text-not-a-bare-status-hash]], [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]].
