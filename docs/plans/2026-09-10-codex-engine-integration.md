# Integrate the merged WAR engine into the existing Codex ports

**Status:** authoritative plan for the next Codex integration task, authored 2026-09-10. Implementation has not started. Execute through the operator's `/goal` handoff with `$snipe 4 correctness,simplicity,auto`; this document does not launch `/war` or the experimental red-team port.

This plan supersedes the **next-step sequencing and pre-campaign assumptions** in the [original port analysis](../port/2026-09-07-codex-port-analysis.md). The [parity roadmap](../port/2026-09-07-github-parity-testing-plan.md) remains the longer-term testing design; the [Snipe checklist](../port/2026-09-07-snipe-codex-port-plan.md) remains historical implementation/acceptance evidence. Neither is the execution checklist for this task.

## Context

The operator wants one WAR repository with Claude and Codex kept closely synchronized without breaking either runtime, and has requested this plan after the engine campaign merged. (user)

The engine's [PR #2297](https://github.com/Ljferrer/WorkAuditRefine/pull/2297) merged into `master` as `668e4ff990f1c689fcf9710768c3d73c2601920c`. Its finalization repaired verdict routing, recovery ownership, approval-transfer identity, uncertain mutation accounting, and gate-artifact selection. The full-suite/audit evidence belongs to the source revisions recorded by that PR, not to a future combined Codex candidate. (verified: PR #2297 and finalization ledger at `63639f5a43f28e5b7b6d30a80bfb54626e7ffc61`, read 2026-09-10)

Remote `codex-port` at `9bc8f676fac1794838f556ed74f2c0d1a9b7bac5` contains Snipe, WAR planning, a reviewed suite collector, an inert CI template, and parity foundations. Its test README explicitly distinguishes contract simulation from runtime compatibility. Its planning acceptance ledger retains the operator's WP15 combined-observation deferral. (verified: the source tree, `tests/parity/README.md`, `scripts/ci/README.md`, and `docs/port/war-planning-acceptance.md` at that commit)

The branches changed four common paths relative to their shared base: `CONTEXT.md`, `skills/_shared/doc-cli-consistency.test.mjs`, `skills/war-review/SKILL.md`, and `skills/war/assets/war-config.test.mjs`. This is a dated path-intersection observation, not a claim that the Git merge is conflict-free or that only those files need validation. Snipe and planning packagers consume shared sources that upstream changed. (verified: branch diffs and `adapters/codex/package-snipe.mjs` / `package-planning.mjs` at the pinned baselines)

The Codex red-team comparison uses frozen source/plan identities. Available local artifacts record an **INCOMPLETE** Codex review, while the open implementation PR still describes a Phase-2 checkpoint. These records do not establish completion of the comparison or authorize changing its targets. (verified: `codex/red-team-review-codex-artifacts` at `0ea5d4bce168034b0856fa9db8c406a9f9ebf5e0`, `docs/red-team-comparison/codex/final-report.md`; PRs #2292, #2293 and #2296 read 2026-09-10)

**Evidence consumed**

| Artifact | Read / unread status and use |
|---|---|
| [PR #2297](https://github.com/Ljferrer/WorkAuditRefine/pull/2297) | Read: merge identity, resulting contracts, final audit and disclosed limits. |
| `docs/port/2026-09-09-engine-pr-2297-finalization-ledger.md` at `63639f5a` | Read selected finalization sections: candidate 12/13 source-identity repairs, controls and validation. Earlier cycles not exhaustively re-audited. (verified: ledger excerpts at `63639f5a`) |
| Candidate-13 validation JSON and raw test/audit artifacts linked by #2297 | PR descriptions read; raw logs/hash chains not independently re-executed or exhaustively verified during plan authoring. Phase 2 obtains new combined-source evidence. |
| The three older port plans linked above | Read status/scope and relevant design sections; historical promises do not override current source or this task's acceptance boundary. |
| `scripts/ci/README.md`, `war-ci.yml`, `baseline-skips.json`; `tests/parity/README.md` | Read at port baseline: discovery, skip policy, inert activation and evidence levels. |
| Snipe/planning packagers and host tests; `docs/port/snipe-app-acceptance.md`, `war-planning-acceptance.md` | Read relevant package dependencies, entrypoints, host observations and WP15 ruling at port baseline. |
| Red-team review setup and final Codex report | Read for protected experiment scope and incomplete status; raw probes and peer findings not reviewed for this integration plan. |
| `docs/learnings/archive/gate-artifact-capture-repeatedly-node-only-despite-combined-gate-command.md` | Read: historical, explicitly unverified hypothesis, archived; motivates preserving complete command output, not a current defect claim. |
| `docs/learnings/archive/full-gates-green-end-state-soft-without-threaded-gate-log-artifact.md` | Excerpts read, including later recurrences; not independently reproduced. Do not substitute archived guidance for the newly merged engine. |
| `docs/learnings/archive/phase-land-stale-spurious-cas-recovery.md` | Read: archived Git-ground-truth lesson; its old manual recovery recipe is not prescribed here. |
| Raw campaign run manifests / complete epic phase reports | Unread — this plan integrates the already merged engine; #2297 and its durable ledger supply the relevant history. |
| Follow-up issue corpus | Read selected prioritized integrity issues in the prior chat and the current PR disposition table; no exhaustive fresh issue sweep. This task does not reopen the campaign backlog. |
| Ranked personal memory | Unread — no personal memory root inferred or created. |

The table records authoring access and its limits, not independent runtime verification. (verified: tool reads during this planning task at the source revisions named above)

## Pivotal constraints

- Preserve the single-repository architecture and existing Claude/Codex behavior. Integration is against the **merged** engine, not a copy of its earlier source. (user; verified: #2297)
- Prepare a separate candidate based on the current remote `codex-port`; merge an explicitly pinned `master` commit into it. Preserve published history and frozen red-team evidence. (accepted next-task direction; user request to author this plan)
- Keep compatibility claims proportional to evidence. Passing simulated records, mocked transports or historical audits does not certify a live Codex WAR phase. (verified: parity README and #2297 limitations)
- Do not use this task to activate GitHub workflows/protections, build a full WAR executor, install/replace global plugins, publish packages, or merge a PR. Those remain separate operator actions.
- Repair integration-induced regressions and their affected consumers. Do not weaken the merged engine's evidence checks to satisfy an older Codex test expectation.

## Resolved design tree

| Decision | Resolution | Source | Landing class |
|---|---|---|---|
| D1 | Keep one source repository and runtime-specific adapters. | PIN-1 · (user) | guardrail |
| D2 | Create a separate integration candidate from remote `codex-port`, preserving both parent histories with a normal merge of pinned `master`. | PIN-2 · accepted next-task direction | slice (Task 1) |
| D3 | Treat copied shared package dependencies as compatibility changes even without textual conflicts. | PIN-3 · verified packager dependency lists | slice (Task 1) |
| D4 | The current collector is the complete baseline runner; review its discovery census and preserve explicit host skips. | PIN-4 · verified collector README | slice (Task 2) |
| D5 | Preserve red-team branch/plan/package identities; no comparison rerun or consolidation here. | PIN-5 · existing experiment contract | guardrail |
| D6 | Run four-seat Snipe at a pinned initial scope and final combined candidate; preserve failures and fix evidence. | PIN-6 · operator-requested handoff pattern | end-state |
| D7 | Stop with an audited PR into `codex-port`; promotion and release are explicit operator checkpoints. | PIN-7 · [assumed: reviewable candidate is this task's delivery — if wrong: operator may authorize promotion separately] | guardrail |
| D8 | Carry existing host-evidence limits and identify production-parity work without implementing the whole roadmap. | PIN-8 · verified test/acceptance boundaries | backstop |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|---|---|---|---|---|
| A1 | The remote port tip has no unreviewed concurrent integration already in progress. | Observed at authoring; mutable. | Duplicate or competing candidate. | Task 1 refreshes refs, PRs and worktree ownership before edits. |
| A2 | Direct shared-source changes can be integrated without redesigning the Codex runtime. | Bounded current ports and additive shared dependencies. | Scope exceeds this plan. | Dependency survey and baseline failures; record a concrete design fork rather than weakening engine checks. |
| A3 | Node >=24 and documented collector prerequisites are available on the execution host. | Prior validation environment. | Baseline cannot complete. | Record executable versions and missing prerequisites; use an isolated environment, never mutate a global/base environment silently. |
| A4 | Candidate package execution is possible without replacing the user's installed plugins. | Existing packagers and explicit runner entrypoints. | Packaged functional evidence remains unavailable. | Task 3 launches the exact built Snipe runner against the isolated candidate checkout; no checkout-source substitution. |
| A5 | Linux plus new installed-planning observations can remain separately scheduled validation. | Existing baseline/host separation and WP15 operator ruling. | Delivery must be labeled source/local compatibility only. | Backstops B1/B2 remain visible; do not claim cross-platform or new installed acceptance. |

## Non-goals / deferred

- Implementing the full Codex WAR phase runner, role orchestration, recovery model mapping or campaign execution.
- Completing/redesigning red-team, replaying its initial comparison, or rewriting its old reports.
- Activating `scripts/ci/war-ci.yml` under `.github/workflows/`, changing required checks, secrets, billing or release automation.
- Solving every remaining engine follow-up, removing every duplication, shrinking all advisory prompt budgets, or relaxing a hard budget.
- Declaring full Claude–Codex parity from the foundation fixtures.
- Updating/replacing global installed plugins or assigning a new public release version.

## New domain terms · Recommended ADRs

None. Use existing repository vocabulary. This plan's **integration candidate** means an isolated branch/PR combining the pinned engine and port histories, not a second permanent product branch or source fork.

## Commander's Intent

- **Purpose:** keep the Claude and Codex releases closely synchronized in one repository without breaking either one. This is the operator's stated port objective.
- **Method:** integrate the completed engine into the existing Codex work, validate Snipe/planning and the test foundation, and keep red-team's independent evidence intact. This implements the next-step recommendation the operator requested as an authoritative plan.
- **Mechanism latitude:** choose temporary locations, test selection during diagnosis and minimal compatibility repairs using existing helpers. New abstraction layers, broad runtime redesigns and external release actions are outside this latitude.
- **Binding guardrails:** one repository (PIN-1); preserve engine evidence/confinement contracts; preserve experiment refs and historical artifacts (PIN-5); deliver a reviewable candidate without automatic promotion or release (PIN-7). Do not force-push, clean another task's worktree, or satisfy tests by suppressing meaningful assertions/skips.
- **End state:**
  1. The candidate records its engine and port parents, contains both histories and leaves protected refs untouched. · HARD at audit_sha: Git ancestry and before/after ref manifests, correctness seat.
  2. Shared-source conflicts and package dependencies are reconciled without weakening engine correctness or existing Codex behavior. · HARD at audit_sha: dependency matrix, combined diff and regression evidence, correctness/cascading-impact review.
  3. Every discovered baseline suite completes under the existing collector with reviewed inventory, allowed skips only, source stability, and retained logs. · gate: `scripts/ci/collect.mjs` full baseline collection.
  4. Fresh Snipe and planning packages pass their inventory/reference contracts outside the source tree; rebuilt package hashes bind the candidate source. · gate: existing package and moved-package suites discovered by the collector.
  5. The rebuilt Snipe package performs the final requested four-seat audit on the pinned combined candidate with complete stable coverage and valid results. · HARD at audit_sha: package identity plus panel manifest and all findings/dispositions (PIN-6).
  6. Every material integration finding is fixed and revalidated or explicitly held for an operator decision; Minor deferrals remain visible. · HARD at audit_sha: final review and ledger, correctness/simplicity seats.
  7. A committed ledger, exact-source evidence, and PR into `codex-port` make the candidate resumable and reviewable; neither `master` nor `codex-port` is advanced by this execution task. · HARD at audit_sha: remote candidate head, PR base and protected-ref comparison.
  8. Local baseline, packaged audit, cross-platform, installed-host and full runtime-parity claims are distinguished; existing planning WP15 remains deferred unless separately proved. · backstop: B1/B2/B3 (PIN-8).

## Build order

Execute sequentially as one `/goal` task: **Task 1 integration → Task 2 complete validation → Task 3 final packaged audit and delivery**. These are operational checkpoints, not parallel worker waves or instructions to auto-launch `/war`. Tasks share files and therefore must not run concurrently. A failed later checkpoint returns to the same candidate for an in-scope fix, targeted checks, and refreshed affected evidence.

## Phase 1 — Establish and reconcile the integration candidate

### Task 1: Preserve baselines, merge upstream, and resolve compatibility changes

- Files: `CONTEXT.md`, `skills/_shared/doc-cli-consistency.test.mjs`, `skills/war-review/SKILL.md`, `skills/war/assets/war-config.test.mjs`, `adapters/codex/package-snipe.mjs`, `adapters/codex/package-snipe.test.mjs`, `adapters/codex/package-planning.mjs`, `adapters/codex/package-planning.test.mjs`, `docs/port/2026-09-10-codex-engine-integration-ledger.md`
- Plan slice: execute PIN-2/PIN-3. Imported upstream changes are the whole pinned merge delta; this Files list names initially known manual reconciliation/record surfaces, not a path filter on the merge. Before editing any additional file, identify the failing consumer, enumerate its exact path in the ledger, and repair it with its tests/mirrors in the same coherent change. A redesign beyond compatibility is a scope decision, not automatic authority.
- Done when: None — Git ancestry/ref evidence, reviewed resolutions and targeted executable checks recorded in the ledger; the complete baseline runs at Task 2.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

Implementation checklist:

- [ ] Read this plan from Git and applicable AGENTS.md / relevant current learnings. Inspect any existing integration ledger before doing new work.
- [ ] Fetch relevant refs and inspect open PRs. Snapshot the full SHAs of `origin/master`, `origin/codex-port`, all `codex/red-team-*` refs and any active comparison/implementation branches; record installed experiment identity only through existing receipts, without modifying installs.
- [ ] Verify whether another integration candidate already exists. Resume task-owned work when supported by its ledger; do not overwrite another chat's work or start a duplicate PR.
- [ ] Record `ENGINE_BASE`, `PORT_BASE`, their merge-base and a reviewed path-intersection/dependency inventory. Expected authoring observations are engine `668e4ff990f1c689fcf9710768c3d73c2601920c`, port `9bc8f676fac1794838f556ed74f2c0d1a9b7bac5`, common base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`. The planning commit will advance the port tip without changing its implementation; distinguish that expected change from new runtime work.
- [ ] Create an isolated candidate branch from refreshed remote port, suggested `codex/engine-integration`. If that name exists, inspect ownership/history before reuse. Do not switch or update the stale main checkout or an existing port worktree.
- [ ] Initialize the ledger with status, refs, worktree/branch, environment and evidence directories, commands, completed checkboxes and next action. Keep raw logs in task-owned evidence storage; commit compact manifests and durable reports, never secrets or caches.
- [ ] Run the initial `$snipe 4 correctness,simplicity,auto` using an available installed Snipe package against the **pinned port delta** (`common base...PORT_BASE`). Retain package identity, profile, roster and coverage. Its purpose is to distinguish prior port debt from integration regressions, not to reopen the entire upstream campaign.
- [ ] Merge the pinned engine commit normally into the candidate. Do not rebase published histories. Preserve both intended behaviors in each resolution; neither `ours` nor `theirs` wholesale is an acceptable resolution strategy. Confirm both pinned parents remain ancestors afterward.
- [ ] Survey packager source lists/imports and reference closure. Follow transitive dependencies, especially shared `war-config.mjs`, provisioning helpers, planning doctrine/lint and any changed ADR extracts. Include unchanged consumers affected by new configuration fields or defaults. Do not copy Claude model defaults into Codex profile selection.
- [ ] Read the final engine contracts at the candidate: task-owned recovery and stable refs; exact content and approval pins; source identity on failed/lost mutation replies; dispatch-specific gate evidence; submodule root boundaries. Existing ports must tolerate the shared sources without claiming they implement full engine recovery. Preserve the dedicated refiner recovery configuration; Codex execution-role mapping is later work.
- [ ] For each discrepancy, record baseline behavior, desired combined behavior, reproduction, smallest repair, consumer/mirror coverage, and a test that fails for the defect. No speculative production changes just to satisfy a proposed source-text expectation.

## Phase 2 — Validate the complete combined source and package contracts

### Task 2: Reconcile test discovery and run the full baseline

- Files: `scripts/ci/test-inventory.json`, `scripts/ci/collect.mjs`, `scripts/ci/collect.test.mjs`, `scripts/ci/baseline-skips.json`, `scripts/ci/README.md`, `tests/parity/catalog.mjs`, `tests/parity/fixtures.mjs`, `tests/parity/oracle.mjs`, `tests/parity/oracle.test.mjs`, `tests/parity/README.md`, `adapters/codex/package-snipe.mjs`, `adapters/codex/package-snipe.test.mjs`, `adapters/codex/package-planning.mjs`, `adapters/codex/package-planning.test.mjs`, `docs/port/2026-09-10-codex-engine-integration-ledger.md`
- Plan slice: execute PIN-4. Update only discovery and contracts actually affected by integration. Existing test runners and package fixtures are the implementation starting point, not permission to replace them. Task 1's compatibility fixes must be committed before collecting source-stable evidence; further discovered repairs use the same consumer-led scope rule.
- Done when: `node scripts/ci/collect.mjs --run "$WAR_INTEGRATION_EVIDENCE/baseline"` where the ledger defines an existing task-owned evidence parent and the baseline output does not yet exist. Success requires the collector's evidence, not a directory-presence check.
- requiresTest: true
- requiresPackaging: true
- deps: []
- target repo: superproject

Implementation checklist:

- [ ] Inspect collector prerequisites and record Node/Git/Bash/Python/jq identities. Use fresh task-owned output directories. Preserve the collector's credential isolation, Git-local fixtures and bounded-process behavior.
- [ ] Run `node scripts/ci/collect.mjs --inventory`; review the diff against the tracked census. Account for every added/deleted suite. Do not drop an upstream test, rewrite the census blindly, or add skips to hide integration failures.
- [ ] Review existing parity fixtures against the new canonical semantics. Correct stale expectations only with independent evidence. Keep `contract-simulation` / `runtimeCompatibility: not-established` labels. Record production-binding gaps in the ledger; do not build the full adapter here.
- [ ] Retain a follow-on matrix for at least sibling-only recovery, changed content with matching patch IDs, changed source after an uncertain failure, and stale gate-artifact selection. Point at current engine regression tests and their independent assertions. These are inputs to later T5–T7 work, not newly certified cross-runtime cases.
- [ ] Run the complete collector from a clean, committed candidate with a stable source tree. Preserve its per-suite commands, output, exits, skips, timeouts and start/end identity. The collector must discover shared JS/shell, adapters, parity and CI self-tests. If an applicable gate is outside its census, run it explicitly and record why it is separate.
- [ ] Verify redaction, live version-slot coherence/monotonicity, hard prompt budgets and reference/CLI contracts through their actual suites. Resolve real failures without downgrading the engine version, increasing budgets casually or suppressing assertions. No release bump is planned.
- [ ] Build both packages into fresh locations outside the source checkout using `node adapters/codex/package-snipe.mjs OUTPUT` and `node adapters/codex/package-planning.mjs OUTPUT`. Record source SHA/content digest and package inventories/hashes. Exercise existing moved-package/negative-inventory/reference tests; never depend on the checkout or old cache to fill a missing packaged file.
- [ ] Preserve any known planning WP15 and installed-host gaps literally as gaps. Baseline opt-in skips are expected only when listed by the existing policy; they do not count as live-host passes.
- [ ] For a baseline failure, preserve the first failure and diagnose which parent/merge/repair introduced it. After fixing, rerun affected tests; rerun the complete baseline when changed production/test discovery can invalidate its earlier result. Do not repeat a full green suite without a new reason.

## Phase 3 — Audit the packaged candidate and deliver a reviewable PR

### Task 3: Obtain exact-candidate evidence and publish the integration branch

- Files: `docs/port/2026-09-10-codex-engine-integration-ledger.md`, `docs/port/2026-09-10-codex-engine-integration-validation.json`, `docs/port/2026-09-07-codex-port-analysis.md`, `docs/port/2026-09-07-snipe-codex-port-plan.md`, `docs/port/2026-09-07-github-parity-testing-plan.md`
- Plan slice: satisfy PIN-6 and deliver the PIN-7 review boundary. Evidence names above are suggested task-owned outputs; reuse established equivalents if already present. Keep older documents' original evidence intact; reconcile status only from linked implementation/acceptance records.
- Done when: None — exact package/panel/source/ref evidence and a reviewable remote PR, evaluated by End states 1–8.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

Implementation checklist:

- [ ] Select an explicit supported Snipe model/effort or a genuinely exposed invoking-task pair. If absent, discover supported profiles and ask once; do not infer settings from global configuration or transcripts. Preserve four distinct seats: correctness, simplicity and two automatically selected lenses; cascading-impact/test-fidelity are useful choices, not replacements for the skill's actual selection.
- [ ] Run the final `$snipe 4 correctness,simplicity,auto` through the **freshly built candidate package**, explicitly selecting its packaged skill/runner without global installation. Establish committed scope `ENGINE_BASE...CANDIDATE_SHA` so the panel assesses the combined port delta against the merged engine. Supply the dependency matrix and validation manifests as evidence, not instructions to approve. Also inspect conflict-resolution changes relative to `PORT_BASE`.
- [ ] Require complete stable scope, four validated results, pinned target SHA, actual package hashes and disclosed profile. The built-package run is a functional compatibility observation, not installed discovery or live WAR execution certification. Missing objects, failed cleanup, invalid schema or unavailable launch produce incomplete evidence, never a clean panel. Do not quietly substitute the older installed package.
- [ ] Apply authorized fixes outside Snipe under its packaged repair discipline. For every material finding, record root cause, affected consumers, discriminating test and final disposition. Following a behavior-changing fix, rebuild packages, rerun relevant/full checks as warranted and obtain a fresh final panel. Do not treat an earlier approval as covering a later source change.
- [ ] Leave independently confirmed out-of-scope debt visible with a link/reason. A design choice that would weaken a safety/compatibility contract or expand into full execution integration requires an operator ruling; keep working on independent items while it is pending.
- [ ] Complete the ledger and compact validation manifest with source/parent identities, commands/results, approved skips, package digests, mutation or before-source controls where used, panel coverage/findings and remaining limitations. Freeze a candidate before its final audit; evidence-only commits afterward must be identified separately, with executable/package-source hashes checked unchanged. Never attribute the earlier panel to a newer SHA.
- [ ] Commit/push the candidate normally and open a PR **into `codex-port`**, linking this plan and tracking PR #2152. Describe final behavior and validation rather than the conversation history. Do not merge it, retarget it to `master`, update protected source refs, or refresh installations.
- [ ] Refresh remote refs and compare with the recorded protected baseline. Concurrent movement by another task is not permission to reset/rebase their work; disclose the movement and reassess applicability. If the destination advanced, the PR requires renewed compatibility assessment before promotion.
- [ ] Report `ready for integration review` or `held`, exact audited/tested/remote SHAs, package identities, all material findings, explicit backstops and the next operator action. Do not mark the goal complete with a missing final packaged panel or failing required baseline.

## Deferred validations (backstops)

PIN-8 is carried by B1–B3; B4 preserves the independent experiment boundary.

| ID | Validation | Why deferred / permitted claim | Runner and timing |
|---|---|---|---|
| B1 | Linux and macOS hosted baseline plus GitHub final-gate behavior | CI template activation is separate scope. Local platform evidence must name its platform; passing here is not cross-platform certification. | T4 workflow activation task after candidate review, before enabling required checks or broad distribution. |
| B2 | Fresh installed Snipe/planning discovery and combined planning WP15 write-action/denial trace | This task does not replace installed plugins. The existing WP15 operator deferral permits source acceptance, not a fabricated host observation or relaxed oracle. | Explicit installation/acceptance task on the selected integrated source before claiming new installed compatibility; preserve prior WP15 ruling until separately closed. |
| B3 | Real Claude/Codex engine parity, recovery roles, live phase and release evidence | No full Codex WAR executor is implemented here; simulated contracts and a packaged Snipe panel cannot prove it. | Parity roadmap T5–T8 and a later execution-port plan, before any full-engine compatibility or dual-runtime release claim. |
| B4 | Final red-team comparison/host readiness | Frozen experiment continues separately; its present incomplete report is evidence to preserve. | Red-team implementation/comparison task, with explicit source/plan/package identities and its own acceptance checkpoint. |

## Notes / conscious deviations

This operator-requested `/goal` handoff uses the repository's merged-plan structure for durability. It was authored from the discussion and the instruction to make/commit the authoritative plan; it does not claim a newly completed formal two-gate interview, strategy-verifier run, or red-team clearance. Do not present it as an already cleared unattended `/war` dispatch artifact.

The three phases serialize one integration branch; they are not repeated engine provisioning/landing phases. The initial Files lists identify known edited surfaces, while upstream merge imports and evidence-led compatibility repair require the Task 1 path inventory. This is deliberately not a pretense that every conflict can be predicted before a merge. Any later conversion for `/war` must resolve that footprint and complete the applicable authoring/validation gates first.

Two falsifiers govern the work: (1) a clean textual merge with stale package dependencies can still break Snipe/planning; moved-package tests and a real packaged panel must detect it; (2) a green collector with an omitted suite or undisclosed host skip can overstate compatibility; discovery and skip evidence must remain fail-closed. A clean historical Snipe report cannot answer either for a new candidate.

## Open decisions

No prerequisite operator design decision is known for this bounded task. Runtime/profile availability is resolved at execution by actual discovery. Destination movement, a required new public release, or a repair requiring a full-runtime redesign must be surfaced with concrete alternatives, never silently absorbed.

## Resume after compaction

Read this plan from the branch containing it, then `docs/port/2026-09-10-codex-engine-integration-ledger.md` if present. Verify actual worktree/ref status before acting. Resume the first unchecked item whose prerequisites hold; do not repeat completed audits or create a duplicate candidate. Keep the ledger's source identities, evidence directory, unresolved findings and next command current.

Authoring source observations: repository `Ljferrer/WorkAuditRefine`; tracking PR [#2152](https://github.com/Ljferrer/WorkAuditRefine/pull/2152); engine merge `668e4ff990f1c689fcf9710768c3d73c2601920c`; pre-plan remote port `9bc8f676fac1794838f556ed74f2c0d1a9b7bac5`. These establish provenance, not permission to discard later work.

## Copyable execution prompt

```text
/goal Integrate the merged WAR engine into the existing Codex ports using docs/plans/2026-09-10-codex-engine-integration.md as the authoritative plan. Fetch remote refs and read that committed plan from codex-port; do not rely on a stale local checkout. Create or resume an isolated integration candidate from the current remote codex-port, merge the pinned current master normally, reconcile shared/package dependencies, and complete the plan's baseline and package acceptance checklist. Use $snipe 4 correctness,simplicity,auto initially and on the final candidate, selecting the freshly built candidate package for the final panel. Keep a durable progress/evidence ledger across compactions. Preserve codex-port, master, all red-team experiment refs and installed plugins. Commit and push the candidate and open a PR into codex-port; do not merge, release, activate CI or implement the full Codex WAR runner. Finish with exact source/package identities, complete test/audit evidence, disclosed backstops, and a ready-for-review or held verdict.
```
