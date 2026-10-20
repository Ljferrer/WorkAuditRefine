# Snipe report

## Scope

- Committed scope: merge-base 668e4ff990f1c689fcf9710768c3d73c2601920c...d4f0fef04c196d04ed6987a3889f7cb5234f546b
- Revision: `d4f0fef04c196d04ed6987a3889f7cb5234f546b` (base `668e4ff990f1c689fcf9710768c3d73c2601920c`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, adapters/codex/planning-verifier.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/package-planning.test.mjs, tests/parity/oracle.test.mjs, scripts/ci/collect.test.mjs, skills/war/assets/war-config.test.mjs, adapters/codex/planning-contract.test.mjs, adapters/codex/planning-host-contract.test.mjs.
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/planning-verifier.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, skills/war/assets/war-config.test.mjs, tests/parity/oracle.test.mjs.
- Seat 3 · cascading-impact: completed — validated; verdict request_changes; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/planning-contract.test.mjs, adapters/codex/planning-host-contract.test.mjs, adapters/codex/planning-verifier.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, skills/war/assets/war-config.test.mjs, tests/parity/oracle.test.mjs.
- Seat 4 · test-fidelity: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/planning-actual-host.test.mjs, adapters/codex/planning-contract.test.mjs, adapters/codex/planning-host-contract.test.mjs, adapters/codex/planning-verifier.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, scripts/ci/collect.test.mjs, skills/_shared/doc-cli-consistency.test.mjs, skills/war-strategy/war-strategy-structure.test.sh, skills/war/assets/war-config.test.mjs, tests/parity/oracle.test.mjs.

## Findings

### Major · Snipe packaging leaves the repaired source-symlink class open — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `adapters/codex/package-snipe.mjs:88`
- Evidence: The Snipe builder checks only each final source path with lstatSync(sourcePath).isFile(), which follows any symlink in an ancestor directory. A caller can therefore supply a source root whose adapters, skills, or .claude-plugin directory is a symlink and the builder will copy external bytes into a regular-looking package. The sibling planning builder closes this exact class by checking every path component in regularSource(), and package-planning.test.mjs has a source-symlink-ancestor regression; package-snipe.test.mjs has no equivalent. This leaves downstream Snipe builds able to diverge from the Git tree while still receiving its manifest version and passing verifySnipePlugin(). The supplied package hashes for the current candidate match the key pinned blobs inspected, but that one artifact does not repair the shipped builder or make its sourceSha assertion self-verifying.
- Proposed correction: Apply component-by-component regular-source validation to every Snipe FILES input and .claude-plugin/plugin.json before creating the output, then add the planning builder's symlink-ancestor negative case to package-snipe.test.mjs and assert that refusal leaves no output.

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
