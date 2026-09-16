# Snipe report

## Scope

- Committed scope: merge-base ba08a77f812fe3e00fdf21aa5114a3f00f90df4b...fbb9d048f13458aade491c2ceb5124c5ccb5c08f
- Revision: `fbb9d048f13458aade491c2ceb5124c5ccb5c08f` (base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence medium
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · cascading-impact: completed — validated; verdict request_changes; confidence high
- Seat 4 · test-fidelity: completed — validated; verdict approve; confidence high

## Findings

### Major · Relative submodule roots discard valid absolute gate artifacts — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `skills/war/assets/workflow-template.js:2526`
- Evidence: The documented task contract permits `targetRepo` as a superproject-relative path (`skills/war/references/schemas.md`, targetRepo row), while the gate contract requires the refiner to return an absolute `gate_log_path`. For submodule task merges and phase land, the new code passes `task.targetRepo` directly as `context.repo`; `newGateCapture` therefore builds a relative prefix such as `vendor/lib/.war/gate-…`, but `admitGateResult` accepts only paths starting byte-for-byte with that prefix. A compliant absolute result such as `/repo/vendor/lib/.war/gate-…/gate.log` is consequently replaced with `undefined`. The downstream per-task gate-audit receives an unthreaded artifact and is explicitly required to downgrade the missing authoritative evidence to SOFT cannot-confirm, so a submodule task can still land without the hard mapped-test/provably-unrun check the capture boundary is meant to preserve. Segmented continuations also lose the returned path and cannot reconnect to their original writer. Existing submodule Git-certainty tests use absolute synthetic `targetRepo` values, while the relative-path fixture does not assert artifact admission, so this contract combination is uncovered.
- Proposed correction: Resolve each submodule repository to one canonical absolute path before constructing merge/land contexts and gate-capture prefixes (for example, join a relative targetRepo to the validated main checkout while preserving an already-absolute value). Use that same canonical path across snapshot, reconciliation, capture, and downstream artifact threading. Add a submodule regression with a relative targetRepo whose refiner returns the required absolute gate path, and verify the path reaches both a segmented continuation and the post-merge gate-audit.
### Minor · Holder-aware worktree failure handling remains triplicated

- Seats: 2 (simplicity)
- Location: `skills/war/assets/provision-worktrees.sh:1668`
- Evidence: The publication-worktree repair adds a third copy of the same branch_holder_path lookup, fallback-message construction, conditional holder diagnostic, and die sequence already present in the ordinary and refinery worktree arms. The reviewed change itself demonstrates the maintenance cost: the publication copy had drifted by omitting the holder path. All three behavioral cases are independently covered, so one small shared renderer can preserve their command-specific prefixes while removing the repeated mechanism.
- Proposed correction: Extract one holder-aware add-failure helper parameterized by branch, base message, and holder-present remediation text; call it from all three failed git-worktree-add arms and retain the existing three behavioral assertions.
- Disposition: absorb (classification only)
### Minor · The uncertain-merge dispatch duplicates its canonical recovery procedure

- Seats: 2 (simplicity)
- Location: `skills/war/assets/workflow-template.js:2202`
- Evidence: reconcileMerge tells the refiner to read refiner-recovery.md § Uncertain merge reconciliation, then repeats the task-recovery, land-recovery, safety, and result-shape rules inline. The referenced section already owns those obligations, while MERGE_RECONCILIATION and the engine's subsequent checks enforce the returned evidence. Keeping both normative copies enlarges every recovery prompt and creates a drift surface; the inspected prompt test currently pins an inline detail rather than checking the canonical pointer.
- Proposed correction: Keep the dynamic context, immutable snapshot, prior response, canonical-section pointer, original operation, gate-capture clause, schema, and engine-side validation; remove the duplicated static recovery procedure and adjust the prompt test to require the canonical pointer and dynamic inputs.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
