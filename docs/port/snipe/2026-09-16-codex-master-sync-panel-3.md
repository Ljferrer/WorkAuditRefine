# Snipe report

## Scope

- Committed scope: merge-base 287405fc56ee54c3a46f94f0449a83c30008a8bf...1eac9ac857a737fb5a095ed78c360c2529026fbd
- Revision: `1eac9ac857a737fb5a095ed78c360c2529026fbd` (base `287405fc56ee54c3a46f94f0449a83c30008a8bf`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `medium` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/skills/snipe/assets/snipe-request.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, adapters/codex/skills/snipe/assets/snipe-submodules.test.mjs, scripts/ci/check-war-ci.test.mjs, scripts/ci/collect.test.mjs, tests/parity/oracle.test.mjs.
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/skills/snipe/assets/snipe-request.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs.
- Seat 3 · cascading-impact: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/skills/snipe/assets/snipe-request.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, adapters/codex/skills/snipe/assets/snipe-submodules.test.mjs.
- Seat 4 · test-fidelity: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/planning-actual-host.test.mjs, adapters/codex/planning-contract.test.mjs, adapters/codex/planning-host-contract.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, scripts/ci/check-war-ci.test.mjs, scripts/ci/collect.test.mjs, skills/war/assets/war-config.test.mjs, tests/parity/oracle.test.mjs.

## Findings

### Minor · Indented shell failure rows can produce a false-green baseline

- Seats: 4 (test-fidelity)
- Location: `scripts/ci/collect.mjs:71`
- Evidence: The collector recognizes skips with optional leading whitespace, but counts failures only when `not ok` or `FAIL` begins in column zero. A zero-exit shell suite can therefore emit a passing row plus an indented TAP failure row and still be classified as passed. The regression test exercises only unindented failure rows, so this defect survives the intended swallowed-exit oracle.
- Proposed correction: Allow leading whitespace when recognizing shell pass/failure rows and add zero-exit fixtures containing indented `not ok` and `FAIL` rows on both stdout and stderr.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
