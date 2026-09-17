# Snipe report

## Scope

- Committed scope: merge-base 668e4ff990f1c689fcf9710768c3d73c2601920c...313f105b3315ee10b935e7177295626ede1e7fa8
- Revision: `313f105b3315ee10b935e7177295626ede1e7fa8` (base `668e4ff990f1c689fcf9710768c3d73c2601920c`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
  Seat-reported tests: adapters/codex/planning-verifier.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/package-planning.test.mjs, adapters/codex/skills/snipe/assets/snipe-request.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, tests/parity/oracle.test.mjs.
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/planning-contract.test.mjs, adapters/codex/planning-host-contract.test.mjs, adapters/codex/planning-verifier.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, adapters/codex/skills/snipe/snipe-structure.test.mjs, scripts/ci/check-war-ci.test.mjs, scripts/ci/collect.test.mjs, skills/_shared/doc-cli-consistency.test.mjs, skills/war/assets/war-config.test.mjs, tests/parity/git-fixture.test.mjs, tests/parity/oracle.test.mjs.
- Seat 3 · cascading-impact: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-snipe.test.mjs, adapters/codex/package-planning.test.mjs, adapters/codex/planning-verifier.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, scripts/ci/collect.test.mjs, scripts/ci/check-war-ci.test.mjs, tests/parity/oracle.test.mjs, skills/_shared/doc-cli-consistency.test.mjs, skills/war-strategy/war-strategy-structure.test.sh, skills/war/assets/war-config.test.mjs.
- Seat 4 · test-fidelity: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/planning-actual-host.test.mjs, adapters/codex/planning-contract.test.mjs, adapters/codex/planning-host-contract.test.mjs, adapters/codex/planning-verifier.test.mjs, adapters/codex/skills/snipe/assets/snipe-files.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, scripts/ci/check-war-ci.test.mjs, scripts/ci/collect.test.mjs, skills/_shared/doc-cli-consistency.test.mjs, skills/war-strategy/war-strategy-structure.test.sh, skills/war/assets/war-config.test.mjs, tests/parity/git-fixture.test.mjs, tests/parity/oracle.test.mjs.

## Findings

### Major · An unchanged refuted recommendation can be retried and returned as verified — would block in a phase

- Seats: 1 (correctness)
- Location: `adapters/codex/skills/war-strategy/assets/strategy-verifier.mjs:30`
- Evidence: The shared charter requires refutation to proceed through dispatch → amend → re-arm → fork. After validating one prior result, however, a request with nonempty arms falls through to dispatch without comparing input.recommendation with history[0].recommendation. Calling the verifier again with the identical recommendation and arms is therefore accepted; if the second verifier returns refuted:false, the function returns status "verified" for text that the first verifier already refuted, rather than preserving the disagreement as an operator fork. This is separate from the disclosed lack of authenticated history: even a genuine first result does not enforce the required amendment. planning-verifier.test.mjs always supplies changed text for attempt two and has no unchanged-recommendation rejection case.
- Proposed correction: After validating a single prior result, require a substantive represented amendment before dispatch—at minimum, normalized recommendation text must differ from the prior recommendation. If it does not, return the existing operator-fork outcome without invoking dispatch. Add a regression whose second dispatcher would approve the unchanged text and assert that it is never called and the prior refutation cannot become verified.
### Minor · The documented usability lens cannot be selected as a one-seat Snipe request

- Seats: 1 (correctness)
- Location: `adapters/codex/skills/snipe/assets/snipe-request.mjs:423`
- Evidence: The packaged auditor role defines usability as a supported lens, while the shared SNIPE_LENS_CATALOG omits it. parseSnipeArgs therefore interprets bare "usability" as legacy target text, and the Codex boundary rejects it with AMBIGUOUS_TARGET because targets must use the structured envelope. Prefixing a seat count does not help, and adding ",auto" forces a two-seat panel, so the documented one-seat lens is unreachable through the normal request syntax. Existing request tests cover a two-item custom lens list but not this standard bare lens.
- Proposed correction: Recognize usability as a bare lens while retaining the shared parser—preferably by adding it to SNIPE_LENS_CATALOG—and add a request test proving rawArgs "usability" produces one named usability seat with no target ambiguity.
- Disposition: absorb (classification only)
### Minor · The integration ledger retains multiple conflicting progress authorities

- Seats: 2 (simplicity)
- Location: `docs/port/2026-09-10-codex-engine-integration-ledger.md:3`
- Evidence: The header still says Phase 2 validation is pending, the checklist leaves reconciliation and census unchecked, and the first live-looking Next action says to launch the initial panel. Later sections record that panel, the repairs, candidate-1 validation, and the subsequent package-source repair. The plan's resume rule tells a new operator to resume the first unchecked item, so these parallel state markers require reconstructing chronology and can cause completed work to be repeated. The final appended paragraph is current, but nothing marks the earlier status and Next action entries as historical.
- Proposed correction: Keep one canonical status/checklist/next-action block at the top and update it when appending evidence. Relabel earlier Next action lines as historical checkpoints or remove them after their outcomes are recorded.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
