# Snipe report

## Scope

- Committed scope: merge-base ba08a77f812fe3e00fdf21aa5114a3f00f90df4b...71a67bd58b1dfb55a0a002279fa2b0180bd6d400
- Revision: `71a67bd58b1dfb55a0a002279fa2b0180bd6d400` (base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence medium
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · cascading-impact: completed — validated; verdict approve; confidence high
- Seat 4 · test-fidelity: completed — validated; verdict request_changes; confidence high

## Findings

### Major · Invalid-branch recovery test can pass through the wrong guard — would block in a phase

- Seats: 4 (test-fidelity)
- Location: `skills/war/assets/workflow-template.test.mjs:17999`
- Evidence: The new task-integrated.sh contract classifies malformed branch names as usage errors via `git check-ref-format ... || die 'invalid branch name'` (exit 2). The mapped test invokes `bad..branch` before initializing its temporary directory as a Git repository and asserts only status 2. If the branch-name guard is removed or stops matching, execution reaches the next `not a Git repository` guard and the assertion remains green. In a real repository the same malformed name instead reaches the task-ref probe and returns `NO_TASK_PROOF` with exit 1, which the recovery protocol treats as ordinary work/audit rather than a malformed launch. No test in the pinned tree asserts the required `task-integrated: invalid branch name` stderr substring, contrary to the guard-specificity requirement, so the intended validation branch and exit classification are not independently protected.
- Proposed correction: Run the malformed-branch case inside an initialized Git repository and assert status 2, stderr containing the exact `task-integrated: invalid branch name` substring, and absence of `NO_TASK_PROOF`. Add corresponding exact-stderr assertions for the other newly introduced `die` guards so adjacent failures cannot satisfy their fixtures.
### Minor · Holder-aware worktree failure handling remains triplicated

- Seats: 2 (simplicity)
- Location: `skills/war/assets/provision-worktrees.sh:1668`
- Evidence: The publication-worktree repair adds a third copy of the same branch_holder_path lookup, fallback-message construction, conditional holder diagnostic, and die sequence already present at lines 631-637 and 1554-1559. This duplication has already produced drift: the publication arm required this repair because it alone omitted the holder path. The three paths differ only in diagnostic wording, so retaining separate implementations creates unnecessary maintenance surface.
- Proposed correction: Extract one small holder-aware worktree-add failure helper parameterized by branch and diagnostic wording, call it from all three add-failure arms, and retain the existing behavior checks for each command.
- Disposition: absorb (classification only)
### Minor · The uncertain-merge prompt duplicates its canonical recovery procedure

- Seats: 2 (simplicity)
- Location: `skills/war/assets/workflow-template.js:2220`
- Evidence: The recovery dispatch instructs the refiner to read refiner-recovery.md section Uncertain merge reconciliation and then repeats that section's task-recovery, land-recovery, safety, and result-shape obligations inline through the ORIGINAL OPERATION block. The refiner card already supplies the resolved canonical pointer, while MERGE_RECONCILIATION and the engine's checks enforce the returned evidence. Maintaining both normative copies enlarges every recovery prompt and creates a needless drift surface.
- Proposed correction: Keep the dynamic context, immutable snapshot, prior-response cause, canonical-section pointer, original operation, gate-capture clause, schema, and engine-side validation; remove the duplicated static recovery procedure from the dispatched prompt.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
