# Codex master sync — 2026-09-16

Status: HELD — bounded validation complete; draft PR publication pending. The final baseline passes, but the reserve panel is incomplete and a confirmed skip-recognition edge case remains. The audit allowance is exhausted: do not resume repairs or launch more panels without a new bounded authorization. Prior evidence and verdicts remain historical and unchanged.

## Pinned scope and authority

- Plan: `docs/plans/2026-09-10-codex-engine-integration.md`, follow-on section for #2301/#2319.
- Port: `43054e8beb484a261846121e99be328f2992c40a`; #2298 merged 2026-09-16T20:39:10Z.
- Master: `287405fc56ee54c3a46f94f0449a83c30008a8bf`; includes #2301 at `4cf4533ae9741ad0c4d3ed3739706e9c01368542` and #2319.
- Branch: `codex/sync-master-0.21.15`, isolated task-owned worktree. The provided f866 worktree contains unrelated modifications; untouched.
- Raw evidence root: `/private/tmp/war-sync-02115-20260916/evidence`; worktree sibling `repo`.
- Protected refs and installed Snipe/planning hashes recorded in `protected-refs-before.txt` and `installed-before.json`. No installed files or frozen comparison refs are editable scope.
- Audit budget: up to three four-seat panels, Sol/medium, two intervening fixes. Reserve only for a material panel-three finding after repair/validation. Regular panels used: 3; ordinary fix rounds used: 2; one reserve repair and one reserve panel used. No audit allowance remains.

## Progress

- [x] Verified PR merge, fetched refs, read original plan/completed ledger, created isolated branch.
- [x] Merged pinned master without conflicts; inspected automatic resolutions and shared dependency changes.
- [x] Reproduced missing planning resource using the existing package link test (`planning-before.log`).
- [x] Repair required reference closure and assess standalone Snipe doctrine.
- [x] Review census; prove targeted regressions/negative controls.
- [x] Commit stable candidates, run complete collectors and build/validate packages.
- [x] Run all authorized panels/fix rounds; preserve final incomplete result and remaining findings.
- [ ] Obtain a complete final four-seat qualification after the proposed follow-up (requires new authorization).
- [ ] Commit final evidence, verify protected state, push and open PR into codex-port.

Next action: publish the held draft PR into `codex-port`, then hand off the narrow skip-recognition follow-up below. No further audit, installation, release, CI activation or PR merge is authorized by this completed budget.

## Dependency and boundary assessment

- Full normal merge imports #2301 deterministic launch identity and pin schema compatibility, plus #2319 backward-chain engine/card/doctrine/tests. No custom engine rewrite or version bump is planned.
- Planning `plan-interview.md` now reads `backward-chain-plan.md`; its links require `backward-chain-fix.md`, `backward-chain-examples.md`, and `fix-round-doctrine.md`. These are retained shared references, not new Codex execution skills. The latter references contain WAR execution context; the planning host must keep its existing authoring-only authority explicit.
- Snipe already ships outcome/invariant, cause/consumer, independent-oracle and bounded-repair guidance. Relevant additions are independent backward chaining from supplied requirements and distinguishing the unmet cause from downstream symptoms. Phase-specific corrective-round counters, mandatory `relation:` lines/WorkerResult markers, fifth-round plan-defect routing and phase merge/escalation actions do not apply to the one-shot report contract.
- Lessons read: stale installed-template hypothesis and conditional-trigger leakage in mirrored rules. Both reinforce measuring actual package/source identity and not importing conditional phase triggers into standing Snipe instructions.

## Evidence and repair records

Baseline regression: existing `package resource links stay resolvable without pulling the development checkout into the archive` fails at `shared/skills/war-strategy/references/plan-interview.md` → `backward-chain-plan.md`. This is an observed assertion failure, not an inferred defect.

### Planning reference closure

Root cause: the explicit package allowlist predated the new interview dependency. Outcome: relocated authoring must retain every required link. Swept all packaged Markdown references; added the four missing resources byte-for-byte through the existing list. The host keeps shared execution doctrine as authoring background with no new execution authority.

Before evidence: `planning-before.log` reproduces the existing unresolved-link failure; `new-regressions-before.log` observes the new independent reference and Snipe-guidance assertions fail before production edits. After evidence: `targeted-after.log`, 51 passed, zero failed/skipped (planning and Snipe packaging, planning host contract, Snipe structure and runner). In a disposable source snapshot, omitting each of the four resources independently causes the named required-resource assertion to fail; four killed mutations are recorded in `package-mutations.json` and individual logs. Moved-package tests also remove each packaged file and require verification to reject it.

Consequences: the planning package now carries additional shared WAR reference text; its host boundary explicitly prevents this from becoming phase execution authority. No verifier/runner schema or engine semantics changed. Snipe's auditor and main-task references adopt independent outcome-to-cause reasoning while retaining existing finding, ask, repair and authority contracts. Actual prompt injection and packaged byte-identity remain covered by existing runner/package tests; prose assertions do not establish live reasoning quality.

### Census and environment

Reviewed discovery adds only `skills/war/assets/backward-chain.test.mjs`: 70 → 71 suites, no removals or changed skip policy (`discovered-inventory.json`). No CI activation. Environment: macOS arm64; Node v24.17.0; Git 2.54.0 (Apple Git-157); system Bash 3.2.57; jq 1.7.1-apple; dedicated `codex-snipe-port` Python 3.12.13 / PyYAML 6.0.3. Collector receives this Python through PATH, preserving its child credential isolation.

The normal merge commit is `3dc9ff84`. Its imported upstream reports/lessons contain pre-existing whitespace warnings (`upstream-whitespace.txt`); those artifacts remain byte-preserved. The sync's own edits pass `git diff --check`. A scratch mutation setup first failed because system Python lacks the tar extraction filter argument; the corrected run used the dedicated Python environment, before any mutation evidence was collected.

## Candidate 1 baseline and panel

Candidate `75364c3e7a98ec81870d8fca120b2c8c2201810c`: complete 71-suite collector passed on clean unchanged source, 4042 passing records and 5 named host skips, no failures. Workflow suite: 1,253 passed. Fresh packages inherit 0.21.15; Snipe 18 files (digest `d5f6dfe26a6eda8bf2f486f39dd6d28ecc0bc1021e4efe6c8c084a9c6998143a`), planning 18 files (digest `a0a356a003f99bf73bcfdf485fffd84e13da4b64a12dc8ff17bf9d1ac14383d2`). Hash algorithm: SHA-256 of sorted compact JSON path-to-SHA-256 map; full maps retained externally and in final manifest.

[Panel 1 report](snipe/2026-09-16-codex-master-sync-panel-1.md): four validated results, stable scope and complete coverage. Correctness and simplicity approved; cascading-impact and test-fidelity requested changes for the same Snipe manifest-verification defect. Simplicity also reported obsolete automatic-repair status. Full coordinator-owned repair guidance consumed. This panel covers candidate 1 only.

### Fix round 1: manifest boundary

Root cause: Snipe's verifier checked selected manifest fields, allowing unreviewed capabilities, connector surfaces and invalid versions. Swept both builders, verifiers, source-version reads and tests. Snipe now compares the whole parsed manifest with its canonical manifest. Both packages share the existing planning version rule through `assertPackageVersion`; Snipe validates the version before creating output, matching planning's behavior. Generated manifests and valid package contents remain unchanged by this repair.

Evidence: two new assertions failed against candidate 1 in a disposable source snapshot (`manifest-before.log`): accepting added MCP and accepting an absent source version. Sixteen package tests pass after repair (`manifest-after.log`). Independent tests pin allowed top-level keys/capabilities in both generated packages, then reject modified manifests (MCP/apps/hooks/unknown keys/capabilities/prompt/identity/author and invalid versions) and assert invalid-source refusal before output creation. Five mutations fail independent assertions: removing whole-manifest comparison; removing shared version validation; generating MCP in either package; generating Write capability in Snipe (`manifest-mutations.json`). Canonical comparison alone would miss producer drift, hence the independent generation checks.

Consequences: this hardens verification of the existing package contract, adds no package field or runtime authority, and leaves planning's accepted version grammar unchanged. Package-source preflight remains a static check, not protection against concurrent hostile source mutation. No real runtime parity claim.

### Fix round 1: unused repair status

Verified no runner path can return `repair.attempted: true`; the contract forbids replacement judgments. Removed the always-false property and unreachable report branches; removed fabricated successful/failed repair fixtures and assertions against the obsolete property. Existing invocation-count tests still prove one attempt per seat, preserve malformed original responses, retain valid peers and report incompleteness. Ten targeted runner/result tests pass (`repair-status-cleanup.log`). This simplifies the coordinator result shape without changing the auditor verdict schema or enabling repairs. The initial narrow search missed an actual-host diagnostic consumer; round 2 below corrects that sweep and the stale projection.

The first collector finished before copying these repairs into the integration worktree. Earlier regression and mutation work occurred only in a disposable snapshot; candidate-1 stability evidence remains valid.

## Candidate 2 baseline and panel

Candidate `2ba894a8d6af024868e42ba94d4c358bbc4e6489`: complete 71-suite collector passed on clean unchanged source, 4,045 passing records and five named skips. Snipe package digest `8b52225c6c5f573b8dbc6e2975202d6679c3b77ab4addc462d67569a3315864e`; planning remains byte-identical to candidate 1.

[Panel 2 report](snipe/2026-09-16-codex-master-sync-panel-2.md): complete/stable, all four validated high-confidence approvals. Correctness reported malformed version suffixes; test-fidelity reported missing absence assertions for the removed state; cascading-impact found a stale actual-host diagnostic projection. These are remaining defects in the same open repair classes, so they receive the second authorized fix round despite their nonblocking severity. No new scope or redesigned executor.

### Fix round 2: close version and cleanup boundaries

Version rule checked against [SemVer 2.0.0 clauses 9–10](https://semver.org/#spec-item-9): suffix identifiers must be nonempty ASCII alphanumeric/hyphen segments; only numeric prerelease identifiers prohibit leading zeroes. Shared validation now enforces that distinction. Independent invalid cases cover every core field, non-string inputs, empty/illegal suffix segments, leading/trailing separators and numeric prerelease zeroes; positive cases retain prerelease zero, alphanumeric `01a`, hyphens and build `001`, including existing Codex build suffixes. Both builders and both verifiers exercise these cases, including successful builds and refusal before output on invalid source versions.

`semver-before.log` proves the malformed-suffix regression on candidate-2 source. Final package checks pass 16 tests (`round-2-packages-final.log`). A first positive-build fixture exposed missing ADR-linked design/plan files; the fixture now includes those real reference roots rather than weakening the builder. An attempted full-match guard was redundant under Node's anchored non-multiline regex: its removal survived (`round-2-mutations-initial.json`). Removed that redundant condition and corrected the mistaken scratch comment. The retained prerelease, build, numeric-zero and type checks each fail independent mutation assertions.

For cleanup, representative completed, failed and invalid runner results now assert absence of the obsolete property; the report rejects a repair-status claim even if a historical diagnostic object carries that field. The existing one-attempt tests remain intact. A broader `seat.repair`/repair-property search found and removed the stale actual-host diagnostic projection; the live test itself stays explicitly skipped in the baseline. Restoring the field independently on each of the three runner return branches, or restoring its rendering, fails the new oracle. Eight final mutations are killed (`round-2-mutations.json`); targeted cleanup assertions pass (`round-2-cleanup-final.log`).

Consequences: malformed package versions are now rejected consistently; valid generated packages retain identical bytes. The tests and dormant host diagnostic change without changing the verdict schema or launching a live-host evaluation. Candidate 2's full collector completed before these repairs entered the integration worktree. Its approvals remain attributed only to its source SHA.

## Candidate 3 baseline and reserve trigger

Candidate `1eac9ac857a737fb5a095ed78c360c2529026fbd`: complete 71-suite collector passed, 4045 passing records and five named host skips, clean source unchanged. Both packages have the same bytes as candidate 2 but were freshly built for candidate 3. [Panel 3 report](snipe/2026-09-16-codex-master-sync-panel-3.md): stable/complete, four validated high-confidence approvals; test-fidelity reports one Minor collector false-green finding.

The reserve condition is satisfied by consequence, not severity label: the collector can report passed even when a shell test emits a real assertion failure. A disposable before-source regression proves `report.ok === true` for one passing row followed by an indented `FAIL` and exit zero (`collector-indent-before.log`). That compromises the test-evidence boundary being delivered, so it is a concrete material finding within this integration's scope. No additional ordinary panel or fix round is being authorized or inferred.

### Reserve repair: shell assertion indentation

Root cause: skip parsing allowed indentation, but shell assertion counters required column zero. Changed only the pass/failure row prefixes to accept leading whitespace. Swept both stdout/stderr and the pass/fail classification paths. Twelve failure combinations cover unindented/spaces/tabs × FAIL/not-ok × stdout/stderr; every fixture includes a passing row, preventing the empty-suite guard from hiding a missed failure. Four positive combinations cover spaces/tabs × both channels, with a diagnostic mention that must not count as a result. Skip policy, child exit/cleanup handling, Node TAP summary counts and inventory discovery remain unchanged.

The complete collector self-suite passes 25 tests, including the existing mutation harness extended with independent pass- and failure-indentation removals (`collector-indent-after.log`). Before-source failure and positive-indentation regressions both failed as expected. Related lessons read: compound TAP label/count discrimination and archived column-zero extraction limits. A scan of all shell stdout/stderr from candidates 1–3 finds no hidden indented failure rows (`prior-indented-failure-scan.json`); their recorded passes are not contradicted by this finding.

Consequences: inherited shell output is classified consistently regardless of indentation, and a swallowed nonzero exit can no longer hide these recognized failure rows. This remains the documented assertion-row classifier, not a parser for arbitrary colored/proprietary test output. CI remains inactive. Candidate 3's baseline finished before the repair entered the integration worktree. The reserve audit will cover the new SHA; earlier approvals do not transfer.

## Final checkpoint — HELD

- Final candidate/tested source: `d2f4a3324075f53e7db47d8ebf7eb66af837b51e`.
- Final baseline: all 71 discovered suites completed; 68 passed and three allowed-skip suites; 4,046 passing records and five named host skips. No failure, timeout, cleanup error, output limit or source drift. Source started clean and remained unchanged. Local macOS/Node evidence only.
- [Reserve report](snipe/2026-09-16-codex-master-sync-reserve.md): scope stable and file coverage complete, but panel **INCOMPLETE**. Correctness, simplicity and cascading-impact returned validated high-confidence approvals. Test-fidelity exited 1 with no valid judgment; its owned runner transcript records `Selected model is at capacity. Please try a different model.` No retry, replacement model, repaired judgment or imported earlier approval was used. Full packaged repair guidance consumed.
- Fresh final packages inherit 0.21.15, 18 files each. Snipe digest `8b52225c6c5f573b8dbc6e2975202d6679c3b77ab4addc462d67569a3315864e`; planning digest `a0a356a003f99bf73bcfdf485fffd84e13da4b64a12dc8ff17bf9d1ac14383d2`. Both are tied to the final source; the reserve actually executed this Snipe package. No installed acceptance is inferred.
- Exact per-file package hashes, baseline suite counts/commands/log hashes, all prior audit/source identities, mutation evidence, and preservation receipts: [validation manifest](2026-09-16-codex-master-sync-validation.json).
- Protected state verified: all 13 recorded local/tracking refs, six live remote protected heads and the installed Snipe/planning inventories unchanged. Original f866 worktree has the same dirty status; never edited by this task.
- Delivery changes after this SHA must be evidence-only under `docs/port/`. Non-evidence tree digest: `098586426bb187135395c75ee37a6d5d46ce5011f85febbe85daf38a7994520f` (algorithm in the manifest). This is not a complete final audit, and the earlier complete panels do not cover the collector repair.

### Remaining findings and next bounded scope

1. **Confirmed: indented approved skips fail closed in two readers.** A real Node test with an existing approved host-skip name nested under a wrapper emits indented TAP. Collection gives that skip `reason: null` and fails. A separate gate fixture supplies the same approved indented line and is also rejected. Reproductions are `reserve-triage-indented-approved-skip.log` and `reserve-triage-gate-indented-skip.log`. The five actual baseline skips remain accepted because they are unindented; no current baseline pass was fabricated.
2. **Conditional: approved shell-skip accounting.** A shell TAP skip row is counted as both pass and skipped, contrary to the final gate's arithmetic. However, the current policy lists only `.mjs` host suites, so no approved shell-skip green path exists today. This portion of the auditor's claim requires a future policy expansion; it is not a reproduced current false-green report. Preserve that distinction and do not silently broaden the allowlist.
3. **Missing qualification: test-fidelity on the final candidate.** The capacity failure is missing evidence, not a source-code finding or an approval. A complete new packaged panel requires new authorization beyond this budget.

Recommended next task: repair skip-name recognition consistently in `scripts/ci/collect.mjs` and `scripts/ci/check-war-ci.mjs`; keep the current skip policy intact; add independent collection-to-gate fixtures for approved indented Node skips and distinguish the conditional shell case. Check both consumers and their count invariants, retain fail-closed behavior for unknown/stderr skips, and prove the new guards fail. Run the full baseline on committed source and build fresh packages before a newly authorized complete four-seat Sol/medium panel. Keep the PR draft/held until that work has a complete qualifying result. No further source edits or audits were attempted after the reserve.

After this narrow hold is cleared: review/merge the sync into `codex-port`, run fresh installed Snipe/planning acceptance, and continue red-team on a new integration candidate while keeping frozen comparison refs/artifacts intact. Hosted CI rollout and the full executor remain separate work; #2152 should not be presented as full-runtime parity.

## Remaining backstops

B1 hosted Linux/macOS and GitHub gate behavior; B2 fresh installed acceptance and planning WP15 combined write-action/denial trace; B3 production runtime parity/full executor/recovery-role mapping; B4 independent red-team completion. Preserve prior SHA-1-only scope and other disclosed evidence limits from #2298. No simulated fixture or baseline skip is a live compatibility pass.
