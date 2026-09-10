# Snipe report

## Scope

- Committed scope: merge-base ba08a77f812fe3e00fdf21aa5114a3f00f90df4b...81b16050fafb6eea5dcad11ef223216b5b378fd0
- Revision: `81b16050fafb6eea5dcad11ef223216b5b378fd0` (base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · cascading-impact: completed — validated; verdict request_changes; confidence high
- Seat 4 · test-fidelity: completed — validated; verdict request_changes; confidence high

## Findings

### Major · Exhausted merge-snapshot death classification is untested — would block in a phase

- Seats: 4 (test-fidelity)
- Location: `skills/war/assets/workflow-template.test.mjs`
- Evidence: The only snapshot-death fixture makes the first `merge-snapshot` dispatch throw and the recovery-tier attempt succeed. It therefore never reaches `mergeSnapshot`'s terminal `if (deathOf(before)) return before` branch. Removing that branch would leave the inspected tests green while changing repeated infrastructure deaths from a site-named, soft `env-died` result into the generic `Git merge snapshot unavailable` exception and `held:workflow-error`. That violates the declared every-dispatch classification invariant and can prevent an independent sibling task from landing even though no mutation began.
- Proposed correction: Add a behavioral case in which every bounded `merge-snapshot` attempt throws an infrastructure-death error. Assert that no merge for the affected task is dispatched, the escalation is soft `env-died` and names `git-snapshot:<task>` with the original cause, the result is not `held:workflow-error`, and an independent sibling task still lands.
### Major · Pin-transfer mutations still bypass independent Git verification — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `skills/war/assets/workflow-template.js`
- Evidence: The pin-transfer dispatch rebases the task before reconciledMerge takes its snapshot. Its success consumers then trust internally consistent agent-supplied fields: transferred accepts equal reported patch IDs without recomputing either side, while already_upstream accepts syntactically valid SHAs and immediately calls landMerged. The later merge confirmation sees only the post-rebase branch, so it cannot detect that a false transferred report suppressed the required re-audit; already_upstream bypasses the merge/confirmation path entirely. The inspected positive test demonstrates this acceptance boundary with fabricated values (rebased_tip facade01, patch p1, commits c0ffee1/c0ffee2) and asserts that the task lands without a merge dispatch. Downstream, an erroneous but plausible probe can therefore merge rebased content no auditor approved, emit a false approval-transfer receipt, or record a task merged when its claimed Git objects do not exist. This also contradicts the finalization amendment's claim that Git confirms every mutation result.
- Proposed correction: Put the pin-transfer rebase behind an equivalent pre/post Git evidence boundary. Independently resolve the approved source tip, dispatch base, rebased branch tip, and patch identities from Git before accepting transferred; independently verify the integration tip and cherry/upstream evidence before already_upstream can call landMerged. Add real-Git negative cases where plausible returned fields are fabricated or disagree with the actual rebase.
### Major · Task confirmation can publish pre-existing local-only integration commits — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `skills/war/assets/workflow-template.js`
- Evidence: mergeSnapshot accepts a task snapshot when base_sha and remote_sha are different, and the task arm of mergeGitMatches never relates those two pre-dispatch targets. If the owned local integration branch is ahead of origin with an unaccounted commit, the pin-transfer rebase places that commit beneath the task, the task merge pushes the combined history, and confirmation passes: post local, remote, and source are equal; base_sha is an ancestor; and the task patch from base_sha is unchanged. The downstream landMerged path consequently attributes success to the current task while also publishing content that was neither part of its audited patch nor reconciled as a prior mutation. This state is reachable on an owned integration-branch reuse because provisioning does not re-cut or synchronize that branch. The inspected confirmation tests keep base_sha equal to remote_sha and do not exercise this pre-existing divergence.
- Proposed correction: Before a task mutation, require the local integration target to equal its remote snapshot, or explicitly reconcile and attribute any local-only history before rebasing the current task. Do not let the current task's success proof absorb a pre-snapshot target divergence. Add a real-Git regression with origin at I0, local integration at I1, and the task based on I0, asserting that I1 cannot piggyback through the task confirmation.
### Minor · Release blurb still describes three superseded behaviors

- Seats: 1 (correctness)
- Location: `README.md:436`
- Evidence: The release blurb says a scope-split panel leaves the phase unheld, an unthreaded gate path renders a conventional path, and recovery skipping requires ancestry plus a nonzero commit count. The pinned implementation and tests establish the opposite/current contracts: `seatConflictsOf` preserves the ask while setting `verdict = 'escalate'`, with the scope-conflict fixture asserting `held:escalation`; `gateArtifactLine` emits an unthreaded marker and explicitly forbids guessing a conventional path; and `task-integrated.sh` additionally requires a nonempty commit carrying the exact `WAR-Task` trailer. The same stale paragraph is duplicated in `CHANGELOG.md` by the release-twin contract. `version-slots.test.mjs` checks byte equality and version placement, so it preserves these incorrect claims rather than detecting them.
- Proposed correction: Update the README Status paragraph and its byte-identical CHANGELOG lead entry to say scope conflicts hold pending ruling and re-audit, missing gate paths never fall back to conventional paths, and recovery skips require the task-owned nonempty `WAR-Task` commit proof.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.

