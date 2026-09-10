# Snipe report

## Scope

- Committed scope: merge-base ba08a77f812fe3e00fdf21aa5114a3f00f90df4b...2fb21d096fdb7162d495bc748de1d77627165b8b
- Revision: `2fb21d096fdb7162d495bc748de1d77627165b8b` (base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · cascading-impact: completed — validated; verdict approve; confidence high
- Seat 4 · test-fidelity: completed — validated; verdict approve; confidence high

## Findings

### Major · already_upstream can silently discard merge-commit-only content — would block in a phase

- Seats: 1 (correctness)
- Location: `skills/war/assets/workflow-template.js:4187`
- Evidence: The verifier computes both task_count from rev-list --count and cherry from git cherry, but the acceptance guard only requires task_count >= 1; it never requires the cherry rows to cover that complete count. Git's implementation limits git cherry to commits with at most one parent, so merge commits are omitted ([Git source](https://raw.githubusercontent.com/git/git/master/builtin/log.c)). Consequently, a task history can contain a merge commit whose resolution contributes approved content while every non-merge commit cherry-matches upstream. The ordinary rebase can drop that merge-only result and finish with the task head equal to integration; post_empty, the exact claimed/cherry set, and every current guard then pass, and line 4197 records the task merged without its approved merge-resolution content. The tests do not reject this shape: the synthetic reordered-positive case constructs two cherry rows with the fixture's task_count still equal to one and explicitly expects the task to land, while the real-Git upstream case contains only one linear task commit.
- Proposed correction: Require proof.task_count === cherry.length before accepting already_upstream, in addition to the existing exact resolved-claim/cherry-set checks, so any merge or otherwise omitted commit fails closed. Add a real-Git regression with a task merge commit whose non-merge commits all cherry-match upstream but whose merge result adds unique content; assert that no already_upstream receipt or landed task is emitted.
### Minor · Holder-aware worktree failure handling remains triplicated

- Seats: 2 (simplicity)
- Location: `skills/war/assets/provision-worktrees.sh:1668`
- Evidence: The publication repair copies the existing branch_holder_path lookup, fallback-message construction, conditional holder message, and die sequence for a third time. The pinned base shows why this duplication matters: the publication copy had already drifted by omitting the holder diagnostic while its two siblings retained it. The repair restores current behavior but preserves the demonstrated source of drift and adds extensive commentary to track what is now identical behavior.
- Proposed correction: Extract one small holder-aware worktree-add failure helper used by all three arms, parameterized only by the command-specific prefix and remediation wording; retain the existing behavioral assertions for each command and remove the now-closed divergence commentary.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
