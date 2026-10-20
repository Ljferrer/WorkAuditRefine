# Snipe report

## Scope

- Committed scope: merge-base 287405fc56ee54c3a46f94f0449a83c30008a8bf...89ed01dca54da7697c32940949c916de6c36d824
- Revision: `89ed01dca54da7697c32940949c916de6c36d824` (base `287405fc56ee54c3a46f94f0449a83c30008a8bf`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `medium` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/planning-actual-host.test.mjs, adapters/codex/planning-host-contract.test.mjs, adapters/codex/skills/snipe/assets/snipe-request.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, adapters/codex/skills/snipe/assets/snipe-submodules.test.mjs, scripts/ci/collect.test.mjs.
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/skills/snipe/assets/snipe-request.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, scripts/ci/collect.test.mjs, tests/parity/oracle.test.mjs.
- Seat 3 · cascading-impact: completed — validated; verdict approve; confidence high
  Seat-reported tests: adapters/codex/package-planning.test.mjs, adapters/codex/package-snipe.test.mjs, adapters/codex/planning-host-contract.test.mjs, adapters/codex/planning-verifier.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-runner.test.mjs, scripts/ci/check-war-ci.test.mjs, scripts/ci/collect.test.mjs, tests/parity/oracle.test.mjs.
- Seat 4 · test-fidelity: completed — validated; verdict approve; confidence high
  Seat-reported tests: scripts/ci/collect.test.mjs, scripts/ci/check-war-ci.test.mjs, adapters/codex/planning-actual-host.test.mjs, adapters/codex/planning-verifier.test.mjs, adapters/codex/skills/snipe/assets/snipe-result.test.mjs, adapters/codex/skills/snipe/assets/snipe-actual-host.test.mjs, adapters/codex/snipe-discovery-host.test.mjs, tests/parity/oracle.test.mjs, skills/war/assets/war-config.test.mjs, skills/snipe/assets/snipe-args.test.mjs, skills/war-strategy/war-strategy-structure.test.sh.

## Findings

### Minor · Rendered reports silently discard accepted finding metadata

- Seats: 3 (cascading-impact)
- Location: `adapters/codex/skills/snipe/assets/snipe-result.mjs:230`
- Evidence: normalizeFinding accepts and preserves locator, plan_ref, and barrier, and the runner explicitly advertises plan_ref to every seat. The downstream report renderer emits locator only when file is absent and never emits plan_ref or barrier. This loses actionable context in the report that the skill instructs the coordinator to present. The loss is observable in the pinned historical artifacts: docs/port/snipe/2026-09-09-engine-pr-2297-candidate-7-snipe.json contains both locator "deriveSkipClause" and plan_ref "Finalization recovery provenance amendment (#2196)", while its generated Markdown report retains only the file and line. The report test also supplies a follow-up barrier but asserts only the disposition, allowing that metadata loss to remain green.
- Proposed correction: Render every preserved metadata field, including plan_ref and barrier, and render locator independently of file; alternatively reject combinations or fields the report contract will not preserve. Add report assertions covering file plus locator, plan_ref, and a follow-up barrier.
- Disposition: absorb (classification only)
### Nit · Adapter retains a redundant auto-seat count

- Seats: 2 (simplicity)
- Location: `adapters/codex/skills/snipe/assets/snipe-request.mjs:435`
- Evidence: The returned panel stores seats, named, and autoCount, although autoCount is always derivable as seats minus named.length. The runner's assignLenses consumes only seats and named; no production consumer reads panel.autoCount. Adapter tests and persisted diagnostics therefore maintain a second representation of the same invariant without affecting behavior.
- Proposed correction: Omit autoCount from the adapter's panel projection and remove its adapter-specific assertions, while retaining it in the shared argument parser where the canonical skill consumes it.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.

