# Snipe report

## Scope

- Committed scope: merge-base 668e4ff990f1c689fcf9710768c3d73c2601920c...aa08f21a1f81a65d2520d3da03abde1dad39e49c
- Revision: `aa08f21a1f81a65d2520d3da03abde1dad39e49c` (base `668e4ff990f1c689fcf9710768c3d73c2601920c`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence high
- Seat 2 · cascading-impact: completed — validated; verdict request_changes; confidence high
- Seat 3 · test-fidelity: completed — validated; verdict approve; confidence high
- Seat 4 · security: completed — validated; verdict request_changes; confidence high

## Findings

### Major · Missing run IDs collapse fresh gate artifacts into a reusable namespace — would block in a phase

- Seats: 4 (security)
- Location: `skills/war/assets/workflow-template.js:2550`
- Evidence: The new artifact namespace derives from `encodeURIComponent(runId)`, but entry validation still explicitly permits `runId` to be absent when tasks provide explicit branch and worktree paths, as preserved by the carry-forward tests. Such launches all receive the literal epoch `undefined-p<phase>`. This is reachable with an actual repository path for submodule tasks. Because `admitGateResult` accepts any returned path under the expected prefix with a six-character mktemp-shaped suffix, a later launch with the same phase/task coordinates can admit a prior run's stamped gate log. An injected or erroneous refiner can therefore substitute stale green execution evidence, defeating the change's fresh-run trust boundary and potentially allowing code to land without its current gate result.
- Proposed correction: Ensure every gate-producing launch has a nonempty string identity that is unique across fresh runs. Either require and validate `runId` unconditionally before dispatch, including explicit-path launches, or thread a separate required launch identifier into `gateEpoch`. Add a regression for the supported explicit-path/submodule shape proving that two fresh launches cannot share an admissible artifact prefix.
### Major · Supported explicit-path launches share the same gate-artifact namespace — would block in a phase

- Seats: 2 (cascading-impact)
- Location: `skills/war/assets/workflow-template.js:2550`
- Evidence: The new gateEpoch derives from runId and phase.id, but entry validation deliberately permits both fields to be omitted when every task supplies an explicit branch and worktree; that compatibility contract is pinned by the #71 and run-lifecycle explicit-path tests. encodeURIComponent(undefined) silently yields "undefined", and gateAttempt restarts at zero on each launch. Consequently, two such launches targeting the same repository/task receive identical capture prefixes. admitGateResult accepts any six-character mktemp suffix under that prefix, so a producer can return a prior launch's path and have it forwarded as authoritative execution evidence to the gate-audit consumer. This breaks the documented old-attempt rejection invariant and can let stale test evidence influence land gating.
- Proposed correction: Make every capture-producing launch carry validated, nonempty runId and phase.id, including the explicit branch/worktree compatibility path, or thread an equivalent required per-run namespace. Add a regression for the explicit-path caller showing that separate launches cannot admit each other's gate-log paths.

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.

