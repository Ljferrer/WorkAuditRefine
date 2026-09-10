# Snipe report

## Scope

- Committed scope: merge-base ba08a77f812fe3e00fdf21aa5114a3f00f90df4b...6f4604719ca3bc72fdec67c59a14fb887c84d0c2
- Revision: `6f4604719ca3bc72fdec67c59a14fb887c84d0c2` (base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · cascading-impact: completed — validated; verdict request_changes; confidence high
- Seat 4 · test-fidelity: completed — validated; verdict request_changes; confidence high

## Findings

### Major · Contradictory request-changes results are accepted as complete — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `adapters/codex/skills/snipe/assets/snipe-result.mjs:107`
- Evidence: Validation enforces only that approve cannot contain Critical/Major findings; it does not enforce the inverse relationship required by the auditor role. A seat can therefore return verdict "request_changes" with no findings or only nonblocking Minor/Nit findings and still validate. snipe-runner.mjs:244 then marks the panel complete, while renderSnipeReport emits the request-changes outcome and, for an empty array, "No validated findings." The sole user-facing report is internally contradictory and supplies no actionable blocking evidence.
- Proposed correction: Require request_changes to contain at least one Critical/Major finding and require any Critical/Major finding to use request_changes. Add result and runner regressions for empty/nonblocking request_changes and blocker-bearing approve/escalate results.
### Major · Parity repair scenario requires an audit finding rejected by both canonical result contracts — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `tests/parity/oracle.mjs:181`
- Evidence: P02's producer in tests/parity/fixtures.mjs:63 emits, and this oracle requires, a Major finding with disposition "absorb". The pinned WAR auditor contract assigns dispositions only to Minor/Nit findings, while adapters/codex/skills/snipe/assets/snipe-result.mjs:64-65 explicitly rejects disposition on Critical/Major. Consequently a future adapter consuming an actual validated WAR/Snipe blocking result cannot satisfy this parity oracle without inventing a field that the source contract forbids. This directly breaks the README's promise that severity/disposition remain literal assertions and leaves the advertised T5-T7 binding seam incompatible with its producers.
- Proposed correction: Remove disposition from the P02 Major finding in both the independent fixture and oracle. If repair-routing state must be compared, model it as a separate field grounded in the production adapter contract, and retain a negative test proving the blocking Major identity cannot disappear.
### Major · Snipe cannot audit SHA-256 Git repositories — would block in a phase

- Seats: 1 (correctness)
- Location: `adapters/codex/skills/snipe/assets/snipe-request.mjs:140`
- Evidence: The raw-diff parser requires both object IDs to contain exactly 40 hexadecimal characters. Git repositories using the supported SHA-256 object format emit 64-character IDs, so every changed raw-diff record fails this regex and scope preparation aborts with GIT_FAILED before any seat launches—even when the change contains no submodule. The same assumption is repeated by the committed-result SHA validator in snipe-result.mjs and the gitlink/object parsers in snipe-submodules.mjs. The inspected tests exclusively construct 40-character IDs and therefore do not exercise this failure.
- Proposed correction: Determine the repository object format and validate its native object-ID length consistently across request capture, result identity, and submodule preparation, then add a SHA-256 repository fixture covering an ordinary committed diff and gitlink handling.
### Major · Verifier retry history can be forged without exercising a verifier — would block in a phase

- Seats: 4 (test-fidelity)
- Location: `adapters/codex/skills/war-strategy/assets/strategy-verifier.mjs`
- Evidence: The verifier charter requires the bounded sequence dispatch → amend → re-arm → fork, and the Codex host instructions require passing the first returned verifier object into the amended call. The implementation validates only that history has at most two entries and every entry has status === 'refuted'. Two arbitrary objects such as [{status:'refuted'},{status:'refuted'}] therefore return operator-fork before any dispatch, while one such object combined with empty arms does the same. planning-verifier.test.mjs constructs history exclusively from genuine helper results, so its retry-bound assertions cannot detect forged, malformed, unrelated, or reordered history. An armed recommendation can consequently bypass the independent verifier while satisfying the tested transition.
- Proposed correction: Validate each history entry as an intact prior verifier result, including refuted result content, sequential attempt number, recommendation, and matching arm/beat context, before taking either early-return branch. Add negative tests proving status-only, unrelated, reordered, and malformed history is rejected rather than suppressing dispatch.
### Minor · Inspected-test evidence disappears from the user-facing report

- Seats: 3 (cascading-impact)
- Location: `adapters/codex/skills/snipe/assets/snipe-result.mjs:196`
- Evidence: The result producer validates and retains tests_verified, and the auditor role requires each seat to report inspected tests. The Snipe skill instructs its caller to present only the runner's report field, but renderSnipeReport never projects tests_verified in seat outcomes, findings, or limitations. Thus downstream operators cannot see whether a seat inspected named tests or reported that none exist, despite that evidence being mandatory in the seat result.
- Proposed correction: Render each validated seat's tests_verified state and inspected repository-relative paths, distinguishing no tests from tests that exist but were not inspected. Extend the report test with present, absent, and empty-inspected cases.
- Disposition: absorb (classification only)
### Minor · Result tests bless nonexistent inspected-test evidence

- Seats: 4 (test-fidelity)
- Location: `adapters/codex/skills/snipe/assets/snipe-result.test.mjs`
- Evidence: validateSnipeVerdict checks inspected test paths only for lexical safety. Its nominal valid fixture uses test/review.test.mjs without any repository or pinned blob establishing that the file exists, and no test rejects a syntactically valid nonexistent path. runValidatedSeat supplies the complete canonical scope, but the validator does not use its repository, baseSha, or headSha for this evidence. A seat can therefore report a mistyped or invented test as inspected and still produce a valid, complete panel, despite the auditor contract requiring mapped tests to exist and only actually inspected tests to be reported.
- Proposed correction: Use a pinned repository fixture for valid inspected-test cases and add a nonexistent-path rejection case. For committed scope, require every reported inspected path to resolve to a regular blob in the pinned base or head tree; apply the corresponding captured-scope check for dirty reviews.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
