# Snipe report

## Scope

- Committed scope: merge-base ba08a77f812fe3e00fdf21aa5114a3f00f90df4b...5db8cce7fac141a759b07432fff5f5e4a21a6b34
- Revision: `5db8cce7fac141a759b07432fff5f5e4a21a6b34` (base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

> INCOMPLETE — do not interpret this panel as clean.

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · cascading-impact: failed — transport status: failed
- Seat 4 · test-fidelity: failed — transport status: failed

## Limitations

- Seat 3 (cascading-impact): transport status: failed
- Seat 4 (test-fidelity): transport status: failed

## Findings

### Major · Success-shaped merge replies bypass Git reconciliation — would block in a phase

- Seats: 1 (correctness)
- Location: `skills/war/assets/workflow-template.js:2157`
- Evidence: MERGE_RESULT requires only mode and status, while uncertainMerge treats every recognized non-error status as certain. Consequently, `{ mode: 'merge-task', status: 'merged' }` and `{ mode: 'land-phase', status: 'landed' }` bypass reconcileMerge without an integration_sha/working_sha or any check that the local and remote target refs changed as claimed. landMerged immediately records such a task in landed/succeeded, and the land consumer records the phase as landed. The pinned test harness's defaultImpl returns exactly these minimal success shapes, confirming they are accepted rather than rejected by schema validation. A terse, mistaken, or corrupted success response can therefore create false task or phase completion even though the new pre-dispatch snapshot exists, violating D21's requirement to account success only with matching Git evidence.
- Proposed correction: Validate normal success responses against Git before accounting them: for merged, require a full integration_sha and a fresh read proving the local target, origin target, and post-rebase source resolve to it; for landed, require a full working_sha matching both target refs and the expected phase-commit parents. Treat missing or contradictory success evidence as uncertain and route it through the existing bounded reconciliation/hold path. Add negative fixtures for minimal and mismatched merged/landed responses.
### Minor · The ambiguity fixture mines SHA collisions dynamically

- Seats: 2 (simplicity)
- Location: `skills/war/assets/workflow-template.test.mjs:18525`
- Evidence: The `Git-backed audit approval: ambiguous` cases generate up to 250,000 commit bodies, hash each one, and retain them in a Map until two share a seven-hex prefix. Because the enclosing repair loop runs the ambiguous case for both `repair` values, this nondeterministic fixture-generation machinery executes twice. The behavior under test is Git's rejection of an actually ambiguous abbreviation, which does not require discovering a new collision during every test run. Two fixed commit-object payloads with a precomputed shared prefix would preserve the real-Git oracle while removing the search loop, unbounded-looking fixture state, and variable runtime.
- Proposed correction: Replace the collision-search loop with two fixed serialized commit objects whose known SHA-1 object IDs share a seven-character prefix; write both using `git hash-object -t commit -w --stdin`, verify the shared prefix in the fixture, and reuse that deterministic setup for both repair cases.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
