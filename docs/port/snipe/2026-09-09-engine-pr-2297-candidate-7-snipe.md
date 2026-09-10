# Snipe report

## Scope

- Committed scope: merge-base ba08a77f812fe3e00fdf21aa5114a3f00f90df4b...1a25c9e143f804358c4ec9a81b6a9561ff2513b4
- Revision: `1a25c9e143f804358c4ec9a81b6a9561ff2513b4` (base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · cascading-impact: completed — validated; verdict request_changes; confidence high
- Seat 4 · test-fidelity: completed — validated; verdict approve; confidence high

## Findings

### Major · Recovery provenance uses the superproject branch inside submodule repositories — would block in a phase

- Seats: 1 (correctness)
- Location: `skills/war/assets/workflow-template.js:2807`
- Evidence: The sanctioned-recovery prompt invokes `task-integrated.sh <task branch> <integration branch> ${ph.workingBranch}` for every task, including submodule tasks. Submodule phases instead use each task's `targetBase` as their repository-local working/base branch. The pinned submodule fixture demonstrates this distinction with `workingBranch: "super-only"`, `targetBase: "main"`, and no `super-only` ref in the submodule repository. `task-integrated.sh` requires its third argument to resolve locally and exits 2 when it does not; the same prompt mandates that exit 2 halt provisioning. Consequently, a sanctioned recovery relaunch of such a submodule phase stops at the topology barrier instead of recognizing integrated work or continuing through ordinary work/audit. The tests exercise provenance recovery only in an ordinary repository and submodule Git contexts only without `recovery`, so this interaction is not rejected.
- Proposed correction: Build the recovery provenance command per task: run it in `targetRepo` with `targetBase` as the third argument for submodule tasks, and retain `ph.workingBranch` for superproject tasks. Add a submodule recovery fixture whose superproject working branch is absent from the submodule while its `targetBase` exists, covering both an integrated-task skip and a no-proof ordinary-work path.
### Major · Recovery skips still treat historical ancestry as current-content proof — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `skills/war/assets/task-integrated.sh:25`
- Evidence: The helper returns success once the task tip is an ancestor of integration and any nonempty phase commit has the matching WAR-Task trailer. It never verifies that the task's final diff is nonempty or that its content remains present at the integration tip. A later commit can revert or delete the task's work while preserving both ancestry and the qualifying historical commit. The downstream preMerged loop in workflow-template.js then unconditionally adds the task to done, succeeded, and landed, dispatches no worker, and excludes it from mergedTasksForGateAudit. The phase can therefore land while the recovered task's required behavior is absent. This is the same downstream invariant addressed by the new already_upstream final-tree/content re-audit path, which explicitly recognizes that historical cherry evidence can match reverted content. The inspected real-Git recovery test covers sibling-only, legacy, empty, unmerged, rebased, reflog-free, and cloned histories, but no post-integration revert or same-file removal.
- Proposed correction: Require present-content evidence before emitting TASK_INTEGRATED. At minimum, require a nonempty final task diff and prove that the task's changed-file footprint is unchanged between the task tip and integration. If later commits touched that footprint or evidence is unavailable, do not auto-complete the task; route a content re-audit of the current integration tip against the task acceptance criteria.
### Minor · Recovery prompt duplicates its canonical procedure

- Seats: 2 (simplicity)
- Location: `skills/war/assets/workflow-template.js:2200`
- Evidence: The reconcileMerge prompt first directs the refiner to read refiner-recovery.md § Uncertain merge reconciliation, then restates the task-recovery, land-recovery, safety, and return-shape rules inline. The referenced section already contains those obligations, while the engine independently validates MERGE_RECONCILIATION. Maintaining both normative copies enlarges every recovery dispatch and creates an avoidable drift surface; this scope repeatedly updates both files together.
- Proposed correction: Keep the dynamic context, immutable snapshot, prior response, canonical section pointer, original operation, schema, and engine-side validation; remove the duplicated static recovery procedure from the dispatched prompt.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
