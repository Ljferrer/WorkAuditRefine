# Snipe report

## Scope

- Committed scope: merge-base ba08a77f812fe3e00fdf21aa5114a3f00f90df4b...f53c979c5b5338d9961ad35fd5f05fbf178a587f
- Revision: `f53c979c5b5338d9961ad35fd5f05fbf178a587f` (base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · cascading-impact: completed — validated; verdict request_changes; confidence high
- Seat 4 · test-fidelity: completed — validated; verdict request_changes; confidence high

## Findings

### Major · Duplicate-cherry regression tests the wrong collection — would block in a phase

- Seats: 4 (test-fidelity)
- Location: `skills/war/assets/workflow-template.test.mjs:19118`
- Evidence: The production guard in `workflow-template.js` requires the resolved `matched` pins to be unique, but only checks cherry rows in one direction with `cherry.every(c => matched.includes(c.sha))`. For two distinct resolved claims `[A, B]`, a forged proof containing duplicate cherry rows `[A, A]` has the same length, every row has sign `-`, every row appears in `matched`, and `matched` itself remains unique, so the guard accepts it and calls `landMerged` even though B was never independently shown as upstream. This can falsely complete a task after the mutator dropped approved content. The negative matrix covers missing, extra, malformed, and different cherry identities, while the named duplicate test duplicates `already_upstream_commits`; its derived `matched` list therefore fails the existing uniqueness check and never exercises duplicate rows in the independent `cherry` proof. The declared complete-and-unique-set invariant can consequently regress or remain broken while all inspected assertions stay green.
- Proposed correction: Require the cherry SHA list itself to be unique and require exact bidirectional set equality with the resolved reported commits. Add a behavioral negative case with distinct resolved claims A and B but proof rows `[{- A}, {- A}]`, asserting that the task is not landed and no `already_upstream` receipt is emitted.
### Major · Git reconciliation uses the superproject seed for submodule integration branches — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `skills/war/assets/workflow-template.js:2118`
- Evidence: For every target equal to ph.integrationBranch, mergeSnapshot derives the missing-remote seed from ph.workingBranch. A submodule phase instead creates its integration branch locally from task.targetBase inside targetRepo; ensure-integration does not publish that new branch. The ordinary submodule merge context targets ph.integrationBranch, so its fresh snapshot normally observes remote_sha=null, then queries the unrelated superproject working-branch name in the submodule remote. Unless that coincidental branch exists at the same commit, seed_sha !== base_sha, bounded maintenance cannot reconcile the state, and the workflow throws before merging any submodule task. The adjacent pin context compounds the mismatch by targeting targetBase rather than the submodule integration branch, so its pre-rebase alignment and post-rebase proof inspect a different ref from the later merge. The existing T4 submodule test masks this downstream failure with synthetic snapshot defaults where remote_sha always equals base_sha; the new real-Git reconciliation cases cover only the same-repository working/integration topology.
- Proposed correction: Give mergeSnapshot an explicit seed/base ref. For submodule task pin and merge operations, use target=ph.integrationBranch and seed=task.targetBase inside targetRepo; keep targetBase as the land target. Add a real-Git submodule regression where origin/main exists, the freshly cut integration branch is origin-absent, and the task reaches confirmed merge without requiring any superproject branch in the submodule repository.
### Major · Git snapshot reconciliation uses superproject refs for submodule task merges — would block in a phase

- Seats: 1 (correctness)
- Location: `skills/war/assets/workflow-template.js:2118`
- Evidence: For every task merge whose target is `ph.integrationBranch`, `mergeSnapshot` chooses `ph.workingBranch` as the seed used to validate an absent remote integration branch. In a submodule phase, however, the pinned `refiner-recovery.md` contract cuts the submodule integration branch locally from `task.targetBase`; the superproject working branch generally does not exist in the submodule repository. The first submodule task therefore presents the normal state `remote_sha: null`, but the snapshot asks for origin/<superproject-working> instead of origin/<targetBase>, cannot prove `seed_sha === base_sha`, retries, and ultimately throws before dispatching the merge. The adjacent pin-transfer setup has the inverse error: `pinContext.target` is set to `targetBase`, so its snapshot and unchanged-target verification observe the base branch rather than the submodule integration branch that the rebase is using. Existing submodule tests stub generic snapshot responses and inspect prompt presence only, so they do not exercise these Git identities.
- Proposed correction: Carry the submodule integration branch as the pin and merge target, and carry `task.targetBase` explicitly as that target's seed. Make `mergeSnapshot` use the context-provided seed instead of deriving every integration seed from `ph.workingBranch`. Add a Git-backed submodule fixture with an unpushed local integration branch cut from targetBase and verify the first task, a later task, and pin transfer all read the submodule integration/targetBase refs.
### Minor · Holder-aware worktree failure handling remains triplicated after repairing its third drift

- Seats: 2 (simplicity)
- Location: `skills/war/assets/provision-worktrees.sh:1670`
- Evidence: The repaired publication arm now hand-copies the same branch_holder_path lookup, fallback message, conditional holder message, and die sequence already present in the ordinary and refinery worktree arms. This duplication already caused the publication diagnostic to drift and require the present repair. The expanded divergence commentary then adds bookkeeping for a difference that no longer exists. All three paths are correct today, but retaining three implementations preserves the demonstrated source of drift and is larger than one shared holder-aware failure renderer.
- Proposed correction: Extract the branch-holder lookup and conditional add-failure message into one small shell helper used by all three worktree-add failure arms, then remove the closed third item from the publication divergence list.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
