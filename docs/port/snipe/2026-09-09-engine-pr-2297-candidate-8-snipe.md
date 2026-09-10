# Snipe report

## Scope

- Committed scope: merge-base ba08a77f812fe3e00fdf21aa5114a3f00f90df4b...c27d7426d3417342cec3529da5b39f089b6787de
- Revision: `c27d7426d3417342cec3529da5b39f089b6787de` (base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · cascading-impact: completed — validated; verdict request_changes; confidence high
- Seat 4 · test-fidelity: completed — validated; verdict request_changes; confidence high

## Findings

### Major · Compound recovery history lets unrelated content satisfy the final-diff oracle — would block in a phase

- Seats: 4 (test-fidelity)
- Location: `skills/war/assets/task-integrated.sh:31`
- Evidence: The helper proves two independent facts: lines 31-43 accept any historical nonempty commit with the task's WAR-Task trailer, while lines 49-59 accept any nonempty final branch diff whose paths match integration. Those witnesses need not represent the same work. If task-owned commit A is later reverted while an unowned sibling or legacy change B remains on the task branch, A satisfies provenance and B keeps proof_paths nonempty and identical at integration, so the helper emits TASK_INTEGRATED even though none of the task-owned content survives. The Workflow then records preMerged and skips worker/audit. The real-Git tests do not reject this composition: the provenance sequence tests sibling/legacy content only before a nonempty owned commit exists, and the current-content matrix tests empty-final only where no unrelated final change remains. Thus the suite can stay green while violating ADR 0008's requirement that sibling-only or historically reverted work cannot establish completion.
- Proposed correction: Add a real-Git regression that creates task-owned change A, adds unrelated or differently owned change B, reverts A, integrates the branch, and asserts helper exit 1, worker dispatch, and no recovered:pre-merged receipt. Change the proof so the surviving nonempty footprint is demonstrably attributable to the matching-trailer task work; when that ownership cannot be established, conservatively return NO_TASK_PROOF rather than combining independent provenance and final-diff witnesses.
### Major · Recovery proof omits task-owned changes that net back to the phase base — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `skills/war/assets/task-integrated.sh:49`
- Evidence: The helper derives its comparison footprint from `git diff --name-only "$phase_base" "$task_tip"`, not from the task-owned commits. After a task is rebased over an earlier sibling, one of its required changes can restore a path to its phase-base state—for example, deleting a file introduced by that sibling—so that path disappears from this net diff. If the task changes another path, the final-diff nonempty guard still passes. A later integration commit can then reintroduce or alter the omitted path while every listed path remains identical to `task_tip`, causing `TASK_INTEGRATED` to be emitted despite missing current task behavior. The downstream `preMerged` consumer in `workflow-template.js` consequently marks the task done, succeeded, and landed, dispatches no worker or audit, and excludes it from per-task gate audit. The inspected `removed` regression only removes a task-added path, which remains visible in the phase-base-to-task-tip diff; it does not exercise a task-owned change that cancels preceding phase work.
- Proposed correction: Build the conservative footprint from the union of paths touched by every qualifying `WAR-Task: <task branch>` commit, preserving both sides of renames, Gitlinks, modes, and deletions, then compare the final task and integration trees across that union. Add a real-Git regression where a rebased task restores one sibling-touched path to the phase base while changing another path, and a later commit alters the restored path; the helper must return no proof and the workflow must dispatch ordinary work/audit.
### Minor · Holder-aware worktree failure handling remains triplicated

- Seats: 2 (simplicity)
- Location: `skills/war/assets/provision-worktrees.sh:1668`
- Evidence: The publication repair adds a third hand-copy of the branch_holder_path lookup, fallback-message construction, conditional holder message, and die sequence already present in the ordinary and refinery worktree arms. The base-to-head change itself demonstrates the maintenance risk: the publication copy had drifted by omitting the holder diagnostic. The head restores behavior but preserves the cause and adds commentary tracking a now-closed divergence.
- Proposed correction: Extract one small holder-aware add-failure renderer used after each failed git worktree add, parameterized by the command-specific prefix and remediation wording. Retain the existing behavioral assertions for all three commands and remove the closed divergence commentary.
- Disposition: absorb (classification only)
### Minor · Recovery prompt duplicates its canonical procedure

- Seats: 2 (simplicity)
- Location: `skills/war/assets/workflow-template.js:2202`
- Evidence: The prompt instructs the refiner to read refiner-recovery.md § Uncertain merge reconciliation, then restates the task-recovery, land-recovery, safety, and return-shape rules inline. The referenced section already contains those obligations, while MERGE_RECONCILIATION and the subsequent validation enforce the response shape. Maintaining both normative copies enlarges every recovery dispatch and creates a drift surface without adding behavior.
- Proposed correction: Keep the dynamic context, immutable snapshot, prior response, canonical-section pointer, original operation, schema, and engine-side validation; remove the duplicated static recovery procedure from the prompt.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
