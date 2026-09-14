# Snipe report

## Scope

- Committed scope: range 9bc8f676fac1794838f556ed74f2c0d1a9b7bac5..c960db55ccb770714daa457c2bbfe900c3c6a15b
- Revision: `c960db55ccb770714daa457c2bbfe900c3c6a15b` (base `9bc8f676fac1794838f556ed74f2c0d1a9b7bac5`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `medium` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · plan-faithfulness: completed — validated; verdict request_changes; confidence high
- Seat 4 · cascading-impact: completed — validated; verdict request_changes; confidence high

## Findings

### Major · Linked-worktree .git file is omitted from the shared target snapshot — would block in a phase

- Seats: 4 (cascading-impact)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:45`
- Evidence: directoryIdentity records only directories and skips the root .git directory, while snapshotTarget's Git file lists do not include Git's administrative .git entry. For a linked worktree, .git is a regular pointer file, so neither directoriesSha256 nor contentSha256 covers its bytes or mode. metadataSha256 covers the resolved common Git directory but does not include that resolved path or the worktree's .git pointer identity. Consequently, changing only the linked-worktree .git file mode—and potentially repointing it to equivalent metadata—can leave the complete snapshot unchanged. The runRedTeam before/after escape guard can therefore return a qualified verdict despite changed target state. This is the same omitted-state class as the final directory repair and contradicts the ledger's claim that snapshot closure spans file contents/modes. The shared helper also feeds the per-attempt diagnostic guard, although its generated fixtures currently use ordinary .git directories and do not expose this linked-worktree branch.
- Proposed correction: Include the repository-root .git entry's lstat identity in snapshotTarget regardless of whether it is a directory, file, or symlink, without traversing it from the worktree walk. Continue snapshotting the resolved Git directory/common directory separately. Add a linked-worktree regression that changes the .git pointer file's mode or bytes and proves the shared snapshot and runRedTeam escape guard report target-state-changed.
### Major · Linked-worktree `.git` file state is omitted from the target snapshot — would block in a phase

- Seats: 3 (plan-faithfulness)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:45`
- Evidence: `directoryIdentity` excludes the repository-root `.git` entry unconditionally and records only directories; `snapshotTarget` separately hashes the resolved common Git directory but neither records the linked worktree's `.git` control file nor the resolved Git-directory path. In a linked worktree, `.git` is a file, so changing its mode—and potentially redirecting it to equivalent metadata—can leave revision, status, refs, contentSha256, directoriesSha256, and metadataSha256 unchanged. The original-target consumer can therefore emit a clean verdict despite a target-state change, contrary to the binding requirement to cover linked-worktree Git metadata, preserve full target identity, and mark unresolved provenance incomplete. The final repair's tests cover a main checkout's `.git` directory mode and ordinary linked-worktree isolation, but no linked-worktree `.git` file identity mutation. The delivery documentation also overstates coverage by claiming file paths/modes and Git directory paths are included.
- Proposed correction: Include the root `.git` control entry when it is a file or symlink, and retain the resolved per-worktree Git-directory/common-directory paths alongside their path/mode/content identities. Add a linked-worktree regression that mutates the `.git` file mode or valid control-file target during `runRedTeam` and proves the original-target consumer returns `INCOMPLETE`; keep the diagnostic consumer using the same helper.
### Major · Target snapshot omits a linked worktree's .git control file — would block in a phase

- Seats: 1 (correctness)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:45`
- Evidence: The Phase 2 directory repair remains incomplete for the linked-worktree path explicitly required by Phase 1. `directoryIdentity` records only directories, while the content inventory comes from `git ls-files`; consequently, a linked worktree's repository-root `.git` file is included by neither identity. Rewriting that file from an absolute `gitdir:` path to an equivalent relative path leaves HEAD, status, refs, common-directory metadata, tracked contents, and directory identities unchanged, so `snapshotTarget` can compare equal despite a real target mutation. This affects the original-target guard in `runRedTeam`, which can therefore emit a qualified result without the required `target-state-changed` gap. The existing linked-worktree test checks isolation of probe-created refs/source edits but never mutates or asserts identity of the target's `.git` control file; the final directory tests use only an ordinary repository whose `.git` is a directory.
- Proposed correction: Include the repository-root `.git` entry's path, mode, type, and file bytes or symlink target in the snapshot independently of `git ls-files`, while retaining the existing common-Git-directory traversal. Add a linked-worktree regression that rewrites the `.git` control file to an equivalent valid representation and verifies both `snapshotTarget` inequality and `runRedTeam`'s target-state-changed outcome.

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
