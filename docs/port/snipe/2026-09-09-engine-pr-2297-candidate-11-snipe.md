# Snipe report

## Scope

- Committed scope: merge-base ba08a77f812fe3e00fdf21aa5114a3f00f90df4b...cf04f4c7199ecad10d386cc57d116d60e325f622
- Revision: `cf04f4c7199ecad10d386cc57d116d60e325f622` (base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · cascading-impact: completed — validated; verdict approve; confidence high
- Seat 4 · test-fidelity: completed — validated; verdict request_changes; confidence high

## Findings

### Major · Non-ancestor recovery fixture can pass without the ancestry guard — would block in a phase

- Seats: 4 (test-fidelity)
- Location: `skills/war/assets/workflow-template.test.mjs:17955`
- Evidence: D9/PIN-13 requires integration ancestry before a recovery skip, enforced by task-integrated.sh's `merge-base --is-ancestor` block. The behavioral case labelled `own work not integrated` creates a task-only `deliverable`; if that ancestry block is deleted, the later task-vs-integration path comparison still detects the missing deliverable and returns exit 1, so the test remains green. The separate `ancestry-error` fixture covers only Git returning an error, not the ordinary non-ancestor result. With the guard absent, parallel task and integration commits producing identical content on every owned path would satisfy all remaining checks and emit `TASK_INTEGRATED`, causing a false recovery completion that the current suite does not reject.
- Proposed correction: Add a real-Git negative fixture where task and integration diverge from a common base, the task has a nonempty correctly owned commit, and an independent integration commit produces identical content and modes on every owned path. Assert exit 1 with `NO_TASK_PROOF ... is not integrated`, then feed it through Workflow and assert `work:t1` is dispatched and no recovered-completion receipt is emitted. Deleting or inverting the ancestry check must make this fixture fail.
### Major · Stable patch IDs can certify an unaudited source tree — would block in a phase

- Seats: 1 (correctness)
- Location: `skills/war/assets/workflow-template.js:2128`
- Evidence: The new Git-verification boundary treats equality of `git patch-id --stable` values as exact preservation of task content. Git patch IDs intentionally ignore whitespace, so two different trees can share one patch ID; whitespace is behaviorally significant in inputs such as template literals, YAML, Makefiles, and indentation-sensitive source. `verifyPinTransfer` reads `head_tree` but validates only `approved_tree === content_tree`, and the transferred arm checks only equal non-empty patch IDs. `mergeGitMatches` likewise confirms a task merge from ancestry, ref equality, and patch-ID equality without comparing the current source tree to a whitespace-sensitive expected identity. A rebase or refiner mutation that changes only significant whitespace can therefore transfer the old panel approvals, pass merge confirmation, and record the different tree as completed. The inspected real-Git tests reject a deliberately different patch ID but contain no equal-patch-ID/different-tree negative case.
- Proposed correction: Use a whitespace-sensitive Git identity for preservation checks, such as an exact binary/full-index diff digest or an independently derived expected tree, and validate the post-rebase/current source against it in both pin transfer and merge confirmation. Add a real-Git regression where the source tree changes in significant whitespace while `git patch-id --stable` remains equal; it must trigger full re-audit or hold rather than transfer approval.
### Minor · Holder-aware worktree failure handling remains triplicated

- Seats: 2 (simplicity)
- Location: `skills/war/assets/provision-worktrees.sh:1668`
- Evidence: The publication-worktree repair adds a third hand-copy of the branch_holder_path lookup, fallback-message construction, conditional holder diagnostic, and die sequence already present in the ordinary and refinery arms. The reviewed change demonstrates the maintenance cost: the publication copy required repair because it alone omitted the holder path. All three behavioral cases are independently tested, so separate implementations add drift surface without distinct behavior.
- Proposed correction: Extract one small holder-aware worktree-add failure helper parameterized by branch and diagnostic wording, call it from all three failed-add arms, retain the three behavioral assertions, and remove the commentary tracking the now-closed divergence.
- Disposition: absorb (classification only)
### Minor · The uncertain-merge prompt duplicates its canonical recovery procedure

- Seats: 2 (simplicity)
- Location: `skills/war/assets/workflow-template.js:2220`
- Evidence: The dispatch tells the refiner to read refiner-recovery.md section Uncertain merge reconciliation, then repeats that section's task recovery, land recovery, safety, and result-shape obligations inline. agents/war-refiner.md already provides the resolvable canonical pointer, while MERGE_RECONCILIATION and the engine checks enforce the response evidence. Maintaining both normative copies enlarges every recovery prompt and creates avoidable drift; the mapped prompt assertions currently pin duplicated inline details.
- Proposed correction: Keep the dynamic context, immutable snapshot, prior-response cause, canonical-section pointer, original operation, gate-capture clause, schema, and engine validation; remove the duplicated static recovery procedure and retarget prompt assertions to the canonical pointer and dynamic inputs.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
