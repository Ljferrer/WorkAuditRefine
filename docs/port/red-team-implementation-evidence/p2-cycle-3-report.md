# Snipe report

## Scope

- Committed scope: range 68c6705bfe9515a4f6be9f46f725e29e71cd085d..5e5355d9d5ac921c7f070aca3a5804b89ed316e1
- Revision: `5e5355d9d5ac921c7f070aca3a5804b89ed316e1` (base `68c6705bfe9515a4f6be9f46f725e29e71cd085d`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `medium` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · plan-faithfulness: completed — validated; verdict approve; confidence high
- Seat 4 · cascading-impact: completed — validated; verdict approve; confidence high

## Findings

### Major · Fixture snapshots miss successful directory-only mutations — would block in a phase

- Seats: 1 (correctness)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:38`
- Evidence: The diagnostic wrapper decides whether a dispatch changed its fixture by comparing snapshotTarget results. That snapshot hashes Git-listed files and non-directory entries under Git metadata, but it records neither worktree directories nor directory metadata. Git status and ls-files also omit empty directories. Consequently, a child running in a silently unenforced read-only sandbox can create an empty directory, still emit the required valid cat/node observations, and leave identical before/after snapshots; the diagnostic can then report OBSERVED despite a successful fixture write. This violates the documented invariant that any per-attempt fixture change yields INCOMPLETE and weakens the repair's actual-host containment check. The tamper test modifies proof.mjs, so it does not reject this surviving branch.
- Proposed correction: Include worktree directory entries and their relevant metadata in snapshotTarget, excluding only the repository's .git entry, and include directory metadata in the Git-metadata identity. Add a diagnostic fake-host case that creates an empty directory while otherwise returning valid required command evidence, and require INCOMPLETE.

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
