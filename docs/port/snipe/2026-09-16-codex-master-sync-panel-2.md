# Snipe report

## Scope

- Committed scope: merge-base 287405fc56ee54c3a46f94f0449a83c30008a8bf...2ba894a8d6af024868e42ba94d4c358bbc4e6489
- Revision: `2ba894a8d6af024868e42ba94d4c358bbc4e6489` (base `287405fc56ee54c3a46f94f0449a83c30008a8bf`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `medium` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-snipe.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, scripts/ci/check-war-ci.test.mjs, scripts/ci/collect.test.mjs.
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs.
- Seat 3 · cascading-impact: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/planning-actual-host.test.mjs, adapters/codex/planning-host-contract.test.mjs, adapters/codex/skills/snipe/assets/snipe-actual-host.test.mjs, adapters/codex/skills/snipe/assets/snipe-request.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, adapters/codex/skills/snipe/assets/snipe-submodules.test.mjs.
- Seat 4 · test-fidelity: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-snipe.test.mjs, adapters/codex/skills/snipe/assets/snipe-actual-host.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, adapters/codex/snipe-discovery-host.test.mjs, adapters/codex/planning-actual-host.test.mjs, scripts/ci/check-war-ci.test.mjs, scripts/ci/collect.test.mjs, tests/parity/git-fixture.test.mjs, tests/parity/oracle.test.mjs.

## Findings

### Minor · Dead repair-state removal has no regression oracle

- Seats: 4 (test-fidelity)
- Location: `adapters/codex/skills/snipe/assets/snipe-runner.test.mjs`
- Evidence: The repair removes the unreachable `repair` property from every `runValidatedSeat` result and removes its report rendering, but the corresponding tests only delete their former assertions and fixtures. The success, transport-failure, and invalid-result tests never assert that the property is absent, and the report test never rejects repair-status output. Reintroducing `{ attempted: false, succeeded: false }` on every production return path would therefore leave the changed suite green, so the test evidence cannot fail for the cleanup regression that the ledger declares closed.
- Proposed correction: Assert that representative completed, failed, and invalid seat results do not own a `repair` property, and assert that rendered reports contain no repair-status clause.
- Disposition: absorb (classification only)
### Minor · Package version validation accepts malformed semantic versions

- Seats: 1 (correctness)
- Location: `adapters/codex/package-source.mjs:6`
- Evidence: The shared validator permits dots anywhere in prerelease and build suffixes, so malformed values such as `1.2.3-..`, `1.2.3-a.`, and `1.2.3+x..y` pass. It also accepts numeric prerelease identifiers with leading zeroes such as `1.2.3-01`. Both package builders and verifiers therefore accept version strings outside the semantic-version contract their validation claims to enforce. The new tests cover malformed core versions but omit these suffix boundaries, allowing this defect to survive.
- Proposed correction: Validate dot-separated prerelease and build identifiers individually, including nonempty identifiers and the prerelease numeric-leading-zero rule, and add these malformed suffix cases to both builder and verifier tests.
- Disposition: absorb (classification only)
### Nit · Actual-host diagnostic still projects the removed repair state

- Seats: 3 (cascading-impact)
- Location: `adapters/codex/skills/snipe/assets/snipe-actual-host.test.mjs:103`
- Evidence: The repair commit removes `seat.repair` from every `runValidatedSeat` result and removes its report/test consumers, but the incomplete-result diagnostic in `snipe-actual-host.test.mjs` still maps `repair: seat.repair`. JSON serialization silently omits the now-undefined field, so this does not affect runtime behavior, but it is a stale downstream mirror and contradicts the ledger's statement that no other consumers remained.
- Proposed correction: Remove `repair: seat.repair` from the diagnostic projection.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
