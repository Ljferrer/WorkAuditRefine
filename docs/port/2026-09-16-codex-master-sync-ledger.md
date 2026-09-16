# Codex master sync — 2026-09-16

Status: in progress. Owner: this synchronization task. Resume from the first unchecked step below; prior integration evidence is historical and unchanged.

## Pinned scope and authority

- Plan: `docs/plans/2026-09-10-codex-engine-integration.md`, follow-on section for #2301/#2319.
- Port: `43054e8beb484a261846121e99be328f2992c40a`; #2298 merged 2026-09-16T20:39:10Z.
- Master: `287405fc56ee54c3a46f94f0449a83c30008a8bf`; includes #2301 at `4cf4533ae9741ad0c4d3ed3739706e9c01368542` and #2319.
- Branch: `codex/sync-master-0.21.15`, isolated task-owned worktree. The provided f866 worktree contains unrelated modifications; untouched.
- Raw evidence root: `/private/tmp/war-sync-02115-20260916/evidence`; worktree sibling `repo`.
- Protected refs and installed Snipe/planning hashes recorded in `protected-refs-before.txt` and `installed-before.json`. No installed files or frozen comparison refs are editable scope.
- Audit budget: up to three four-seat panels, Sol/medium, two intervening fixes. Reserve only for a material panel-three finding after repair/validation. Panels used: 1; fix rounds used: 1; reserve unused.

## Progress

- [x] Verified PR merge, fetched refs, read original plan/completed ledger, created isolated branch.
- [x] Merged pinned master without conflicts; inspected automatic resolutions and shared dependency changes.
- [x] Reproduced missing planning resource using the existing package link test (`planning-before.log`).
- [x] Repair required reference closure and assess standalone Snipe doctrine.
- [x] Review census; prove targeted regressions/negative controls.
- [ ] Commit stable candidate, run complete collector and build/validate packages.
- [ ] Run candidate panel(s) within budget; resolve verified in-scope findings.
- [ ] Commit final evidence, verify protected state, push and open PR into codex-port.

Next action: commit the verified manifest repair and dead-state cleanup; rerun the complete collector on candidate 2, rebuild both packages and run panel 2 through that freshly built Snipe package. Audit scope is pinned master `287405fc56ee54c3a46f94f0449a83c30008a8bf...CANDIDATE_SHA`, with no path filter, matching the original final integration scope. Upstream imports are also inspected against the port parent and covered by the full baseline.

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

Verified no runner path can return `repair.attempted: true`; the contract forbids replacement judgments. Removed the always-false property and unreachable report branches; removed fabricated successful/failed repair fixtures and assertions against the obsolete property. Existing invocation-count tests still prove one attempt per seat, preserve malformed original responses, retain valid peers and report incompleteness. Ten targeted runner/result tests pass (`repair-status-cleanup.log`). This simplifies the coordinator result shape without changing the auditor verdict schema or enabling repairs. No other consumers found outside those runner/result/test files.

The first collector finished before copying these repairs into the integration worktree. Earlier regression and mutation work occurred only in a disposable snapshot; candidate-1 stability evidence remains valid.

## Remaining backstops

B1 hosted Linux/macOS and GitHub gate behavior; B2 fresh installed acceptance and planning WP15 combined write-action/denial trace; B3 production runtime parity/full executor/recovery-role mapping; B4 independent red-team completion. Preserve prior SHA-1-only scope and other disclosed evidence limits from #2298. No simulated fixture or baseline skip is a live compatibility pass.
