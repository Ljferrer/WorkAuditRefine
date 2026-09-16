# Snipe report

## Scope

- Committed scope: merge-base ba08a77f812fe3e00fdf21aa5114a3f00f90df4b...c86a771e070817f9961253805a89d842ceaa7c46
- Revision: `c86a771e070817f9961253805a89d842ceaa7c46` (base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · cascading-impact: completed — validated; verdict request_changes; confidence high
- Seat 4 · test-fidelity: completed — validated; verdict request_changes; confidence high

## Findings

### Major · Normal failure tests miss source-only mutation before a trusted retry — would block in a phase

- Seats: 4 (test-fidelity)
- Location: `skills/war/assets/workflow-template.test.mjs:18714`
- Evidence: The matrix exercises whitespace drift when the merge target has already advanced, but not when the merge dispatch rebases or otherwise changes the task source, leaves the target unchanged, and returns a known non-success such as baseline/environment `gate_failed`. In `workflow-template.js`, `confirmMerge` accepts every known non-success solely when the target refs equal the snapshot; it does not require `source_tip`, `patch_id`, or `content_id` to remain consistent with that snapshot. The workflow can therefore accept the failure, enter baseline-proceed or environment-proceed, snapshot the already-modified source as its new expected content, and merge it under the original audit approval. The existing `wrong source` confirmation case starts from a reported successful merge, while `false-failure-whitespace` advances the target, so both remain green if this source-only approval bypass survives.
- Proposed correction: Add a real-Git regression where the initial normal merge rebases the task into a whitespace-sensitive exact-content change, leaves local and remote integration unchanged, and reports baseline or environment `gate_failed`. Assert that no proceed retry can merge under the old approval. Make non-success confirmation require independently recomputed source patch/content evidence to match the pre-dispatch snapshot, or otherwise enter reconciliation and hold/re-audit.
### Major · Relative submodule paths can escape into the wrong Git repository — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `skills/war/assets/workflow-template.js:914`
- Evidence: The new normalizer accepts every nonempty relative targetRepo and collapses `..` by popping path components without enforcing containment beneath mainCheckout. Consequently `targetRepo: "."` becomes the superproject itself, while `targetRepo: "../sibling"` becomes a sibling path. The normalized value then feeds the recovery proof repository, worker context, task merge snapshots/reconciliation, gate-artifact allocation, and phase land. An accepted configuration can therefore make refiners rebase, gate, push, or land the superproject or an unrelated repository instead of the declared submodule. This contradicts the documented contract that a relative targetRepo is a submodule checkout path relative to mainCheckout and defeats the entry-validation promise that invalid path context refuses before any dispatch. The inspected tests cover internal dot-segment normalization and malformed types/NULs, but not equality with or escape from mainCheckout.
- Proposed correction: For relative targetRepo values, normalize mainCheckout and the resolved path, then require the result to be a strict path-segment descendant of mainCheckout. Refuse `.` and any `..` traversal that resolves equal to or outside it before dispatch. Add zero-dispatch regression cases for `.` and `../sibling`, while retaining the existing internal `./vendor/../vendor/lib` alias case.
### Minor · Holder-aware worktree failure handling remains triplicated

- Seats: 2 (simplicity)
- Location: `skills/war/assets/provision-worktrees.sh`
- Evidence: The publication repair adds a third hand-copy of the branch_holder_path lookup, fallback-message construction, conditional holder diagnostic, and die sequence already present in the ordinary and refinery arms. The base-to-head change demonstrates the maintenance cost: the publication copy required repair because it alone omitted the holder path. All three behaviors are independently tested, so separate implementations preserve the demonstrated drift source without providing distinct behavior.
- Proposed correction: Extract one small holder-aware add-failure helper parameterized by branch and diagnostic wording, call it from all three failed-add arms, retain the existing behavioral assertions, and remove the commentary tracking the now-closed divergence.
- Disposition: absorb (classification only)
### Minor · The documented pinTransfers shape omits the new exact-content fields

- Seats: 3 (cascading-impact)
- Location: `skills/war/references/schemas.md:444`
- Evidence: The runtime's merge receipt now emits `preContentId` and `postContentId`, and the following schema commentary plus ADR 0049 describe those fields as the evidence used to re-verify approval transfer. However, the actual JSONC shape declaration still lists only `prePatchId` and `postPatchId`. Downstream readers using the declared shape therefore receive an incomplete interface contract despite the adjacent prose describing a wider object.
- Proposed correction: Add optional `preContentId` and `postContentId` members beside the patch-ID fields in the pinTransfers JSONC declaration, and bind that declaration to the runtime receipt fields in the existing schema-contract coverage.
- Disposition: absorb (classification only)
### Minor · The uncertain-merge dispatch duplicates its canonical recovery procedure

- Seats: 2 (simplicity)
- Location: `skills/war/assets/workflow-template.js`
- Evidence: The dispatch directs the refiner to read refiner-recovery.md section Uncertain merge reconciliation, then repeats that section's task-recovery, land-recovery, safety, and result-shape obligations inline. agents/war-refiner.md already supplies the resolvable canonical pointer, while MERGE_RECONCILIATION and the engine validation enforce the returned evidence. Maintaining both normative copies enlarges every recovery prompt and creates avoidable drift; the inspected tests currently pin inline details such as LAND RECOVERY and the second-phase-commit prohibition.
- Proposed correction: Keep the dynamic context, immutable snapshot, prior-response cause, canonical-section pointer, original operation, gate-capture clause, schema, and engine validation; remove the duplicated static recovery procedure and retarget prompt assertions to the canonical pointer and dynamic inputs.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
