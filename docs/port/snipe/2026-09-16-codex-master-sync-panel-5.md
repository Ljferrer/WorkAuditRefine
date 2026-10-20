# Snipe report

## Scope

- Committed scope: merge-base 287405fc56ee54c3a46f94f0449a83c30008a8bf...7a9fe4d3f239a5ee89ab37795957c3094bf99662
- Revision: `7a9fe4d3f239a5ee89ab37795957c3094bf99662` (base `287405fc56ee54c3a46f94f0449a83c30008a8bf`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `medium` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/planning-verifier.test.mjs, adapters/codex/skills/snipe/assets/snipe-request.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, adapters/codex/skills/snipe/assets/snipe-submodules.test.mjs, scripts/ci/check-war-ci.test.mjs, scripts/ci/collect.test.mjs.
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, skills/_shared/doc-cli-consistency.test.mjs, skills/war-strategy/war-strategy-structure.test.sh, skills/war/assets/war-config.test.mjs, tests/parity/oracle.test.mjs.
- Seat 3 · cascading-impact: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, scripts/ci/check-war-ci.test.mjs, scripts/ci/collect.test.mjs.
- Seat 4 · test-fidelity: completed — validated; verdict request_changes; confidence high
  Seat-reported tests: scripts/ci/collect.test.mjs, scripts/ci/check-war-ci.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/package-planning.test.mjs, adapters/codex/planning-actual-host.test.mjs, adapters/codex/planning-contract.test.mjs, adapters/codex/planning-host-contract.test.mjs, adapters/codex/planning-verifier.test.mjs, adapters/codex/snipe-discovery-host.test.mjs, adapters/codex/skills/snipe/assets/snipe-actual-host.test.mjs, adapters/codex/skills/snipe/assets/snipe-request.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, adapters/codex/skills/snipe/assets/snipe-submodules.test.mjs.

## Findings

### Major · Summary-shaped diagnostics let an empty Node suite pass the baseline collector — would block in a phase

- Seats: 4 (test-fidelity)
- Location: `scripts/ci/collect.mjs:70`
- Evidence: The collector obtains each Node count with the first regex match for `^# <key> <number>$`. Under Node's TAP reporter, a test file can emit summary-shaped diagnostics such as `console.log('tests 1')`, `console.log('pass 1')`, and zeroes for the remaining keys before the runner emits its genuine zero-test summary. The first-match parser then records one passing test, while the process exits zero and the empty-suite guard sees `tests === 1`; lines 72–73 consequently classify the suite as passed. The existing regression at `scripts/ci/collect.test.mjs` lines 32–41 covers empty files and skips but does not exercise duplicate or spoofed summary rows. This defeats the declared invariant that empty/no-op JavaScript suites cannot masquerade as executed tests and makes baseline acceptance evidence false-green.
- Proposed correction: Parse one coherent authoritative final TAP summary trailer and reject duplicate or out-of-place summary keys. Add a zero-test `.test.mjs` fixture that prints a complete passing summary-shaped diagnostic set and assert that collection fails.

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.

