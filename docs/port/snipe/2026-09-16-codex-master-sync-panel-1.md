# Snipe report

## Scope

- Committed scope: merge-base 287405fc56ee54c3a46f94f0449a83c30008a8bf...75364c3e7a98ec81870d8fca120b2c8c2201810c
- Revision: `75364c3e7a98ec81870d8fca120b2c8c2201810c` (base `287405fc56ee54c3a46f94f0449a83c30008a8bf`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `medium` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/skills/snipe/assets/snipe-request.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, adapters/codex/skills/snipe/assets/snipe-submodules.test.mjs, scripts/ci/collect.test.mjs, tests/parity/oracle.test.mjs.
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs.
- Seat 3 · cascading-impact: completed — validated; verdict request_changes; confidence high
  Seat-reported tests: adapters/codex/package-snipe.test.mjs, adapters/codex/package-planning.test.mjs, scripts/ci/check-war-ci.test.mjs.
- Seat 4 · test-fidelity: completed — validated; verdict request_changes; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/planning-actual-host.test.mjs, adapters/codex/skills/snipe/assets/snipe-actual-host.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/snipe-discovery-host.test.mjs, scripts/ci/check-war-ci.test.mjs, tests/parity/oracle.test.mjs, skills/war/assets/backward-chain.test.mjs.

## Findings

### Major · Snipe package tests permit privileged manifest drift — would block in a phase

- Seats: 4 (test-fidelity)
- Location: `adapters/codex/package-snipe.mjs`
- Evidence: The Snipe package presents read-only capability as a core contract, but verifySnipePlugin validates only the skills path, absence of hooks, and file inventory. It does not compare the manifest with manifest(version), validate the version, or reject additional executable surfaces. The package test likewise checks only skills, hooks, prompts, and inventory. Consequently, changing the generated manifest to advertise Write capability or adding mcpServers/apps can leave the complete deterministic suite green and still be accepted by verifySnipePlugin. This is a discriminating-test failure around the package's authority boundary; the sibling planning verifier already demonstrates the stronger exact-manifest pattern.
- Proposed correction: Validate the complete Snipe manifest against the canonical manifest generated from a validated version, rejecting unknown fields and altered capabilities. Add negative package tests that mutate capabilities and add mcpServers, apps, or other action-bearing fields and require verification to fail.
### Major · Snipe package verification ignores manifest capability drift — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `adapters/codex/package-snipe.mjs:72`
- Evidence: The Snipe producer declares a read-only manifest with a fixed interface, but its downstream verifier checks only `skills` and the absence of `hooks`. It therefore accepts a package whose manifest adds `mcpServers` or `apps`, changes the advertised capabilities to include writes, corrupts invocation metadata, or carries an invalid version, while returning the package as verified. This breaks the verifier’s role as the post-build and reusable package boundary documented in scripts/ci/package-inventory-policy.md. The sibling planning verifier closes the same class by comparing the entire parsed manifest with `manifest(config.version)`, and package-planning.test.mjs exercises added capabilities, changed interface capabilities, and invalid versions; package-snipe.test.mjs has no corresponding negative cases. Downstream validation can consequently bless a Snipe package with surfaces that contradict its read-only contract.
- Proposed correction: Validate the complete Snipe manifest against `manifest(config.version)` (including a valid version) rather than checking selected fields, and add package-snipe negative cases for MCP/app surfaces, altered capabilities or invocation metadata, unknown keys, and invalid versions.
### Minor · Unreachable repair state remains in the seat result model

- Seats: 2 (simplicity)
- Location: `adapters/codex/skills/snipe/assets/snipe-runner.mjs`
- Evidence: Every return path sets repair.attempted to false, consistent with the auditor contract forbidding automatic follow-up. Nevertheless, renderSnipeReport contains branches for successful and failed repairs, and snipe-result.test.mjs constructs attempted:true states that production cannot produce. This preserves obsolete state, report behavior, and test fixtures without supporting any reachable contract.
- Proposed correction: Remove the repair property from runValidatedSeat results, delete the repair-status rendering branch, and simplify the associated tests to establish single-attempt behavior through invocation counts and validation status.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
