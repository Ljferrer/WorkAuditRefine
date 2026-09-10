# Codex engine integration ledger

Status: Candidate-3 repairs complete; delivery acceptance pending refreshed baseline and final packaged panel. This top block is the sole current resume authority; sections below are historical evidence. Owner: Codex task `01a08d29-9d5a-7d02-8c90-f8a4abee937c`.

## Pins and isolation

- Authoritative plan: `docs/plans/2026-09-10-codex-engine-integration.md` fetched from origin/codex-port.
- ENGINE_BASE: `668e4ff990f1c689fcf9710768c3d73c2601920c`.
- PORT_BASE / plan revision: `6f4604719ca3bc72fdec67c59a14fb887c84d0c2`.
- Common base: `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`.
- Candidate branch: `codex/engine-integration`; existing unused branch created at PORT_BASE, no commits beyond port, no ledger, no assigned worktree and no open integration PR. Attached this task's clean isolated worktree without moving the branch.
- Worktree: `/Users/ljf/.codex/worktrees/21ae/WorkAuditRefine`.
- Raw evidence: `/private/tmp/war-integration-01a08d29/evidence`; authoritative plan copy and temporary runner requests in parent directory.
- Protected ref snapshot: `protected-refs-before.txt` in raw evidence. Local master differs from origin/master; preserve both exactly. Existing red-team PRs #2292, #2293, #2296 are separate. Tracking PR #2152 is not this delivery PR.
- Installed initial Snipe: `/Users/ljf/.codex/plugins/cache/war-snipe-local/work-audit-refine-snipe/0.21.12+codex.20260908.8fd30f3`; full SHA-256 file inventory retained as `initial-package-inventory.json`. No installed files modified.
- Profile: explicitly requested `gpt-5.6-sol/high`; request `4 correctness,simplicity,auto`.

## Commands and progress

- [x] Fetch origin (required host permission for shared Git metadata); inspect plan, branch reflog, worktree ownership and open PRs.
- [x] Apply user-provided global AGENTS instructions; no tracked AGENTS.md in port tree.
- [x] Read relevant gate-evidence learning excerpts; historical recipes do not override merged engine or plan. Preserve exact command logs and exits.
- [x] Initial installed-package panel on common-base...PORT_BASE.
- [x] Dependency/path inventory and normal merge of ENGINE_BASE.
- [x] Reconcile observed compatibility defects with discriminating tests; later findings and disposition recorded below.
- [x] Census reviewed; candidate-1 and candidate-2 clean-source collectors passed.
- [ ] Current candidate full baseline and final evidence acceptance.
- [ ] Fresh moved packages and final packaged panel.
- [ ] Final evidence commit, push and PR into codex-port.

Node v24.17.0; complete prerequisite identities recorded below.
Next action: run the candidate-3 full baseline from a clean commit, rebuild packages, and obtain the final packaged panel; then record final evidence, push and open PR. Prior baseline/panel runs are complete evidence, not instructions to repeat unchanged work. User authorization covers in-scope repairs outside the report-only audit.

## Backstops

B1: hosted Linux/macOS and GitHub gate behavior deferred; CI remains inert.
B2: fresh installed discovery and combined planning WP15 write-action/denial observation deferred under existing ruling.
B3: full engine runtime parity/recovery mapping/live phases/release not established by this integration.
B4: frozen red-team comparison remains separate and incomplete; do not rerun or alter it.

## Pre-merge dependency survey

Reviewed full path lists in raw `path-inventory.json`. Intersection remains exactly CONTEXT.md, skills/_shared/doc-cli-consistency.test.mjs, skills/war-review/SKILL.md, skills/war/assets/war-config.test.mjs. Port adds host-reference scan and baseline-census assertion; upstream adds fix-doctrine placement, recovery configuration and review attempt identity. Preserve both sides.

| Consumer | Transitive source / upstream change | Required combined contract |
| --- | --- | --- |
| Snipe request/runner | snipe-args → war-config → provision; only war-config changed | Keep refiner.recovery tier and maxParallel null-as-unset. Snipe selects Codex model through explicit/discovered profile, not Claude defaults. Provision has only built-in fs/path dependencies. |
| Planning package | shared strategy, interview, verifier doctrine, plan-literal-lint, ADR 0025 | All unchanged from common base on engine side. Preserve byte-identical doctrine and existing host substitution/reference closure. |
| Shared test consumers | war-config tests and doc CLI placement | Retain upstream engine assertions and port census/host coverage. Update reviewed census only after comparing discovered suites. |

Host prerequisites: Node v24.17.0; Apple Git 2.50.1; system Bash 3.2.57 arm64-apple-darwin25; jq 1.7.1-apple. Default Python lacks PyYAML; existing dedicated `/Users/ljf/miniconda3/envs/codex-snipe-port/bin/python3` is Python 3.12.13 with PyYAML 6.0.3. Use its bin directory on PATH for tests; no environment installs or changes.

Baseline skip policy currently permits five named opt-in tests across planning-actual-host, snipe-actual-host and snipe-discovery-host. Preserve these as skips, not host passes. Parity README explicitly keeps synthetic contract records and physical fixture drivers separate from production binding.

## Initial panel and merge

Initial installed panel exited 0: stable scope, complete coverage, all four seats validated. Correctness request_changes; simplicity approve; cascading-impact request_changes; test-fidelity request_changes. Full report/raw transport retained as initial-snipe.md/json. Coordinator-owned post-audit-fixes guidance consumed in full. No changed gitlinks in initial scope.
Normal merge of ENGINE_BASE auto-merged all four common paths without conflicts; stopped before merge commit for inspection. Both sets of doc CLI placements, port census assertion, upstream recovery tier and war-review attempt handling survive. No wholesale side replacement.

### Finding intake / authorized additional paths before edits

- Verdict coherence: `adapters/codex/skills/snipe/assets/snipe-result.mjs`, its `.test.mjs`, runner `.test.mjs`, and `references/codex-auditor.md`. Verify inverse request_changes rule and escalate semantics before changing. Same result module owns missing user-facing tests_verified projection.
- Parity Major disposition: `tests/parity/fixtures.mjs`, `oracle.mjs`, `oracle.test.mjs` (already plan-listed). Confirmed schema mismatch: canonical Snipe rejects disposition on Major; P02 fixture and oracle require it. Repair both independently and retain negative controls for missing Major and invented disposition.
- SHA-256 support: pre-existing object-format limitation spanning request, result and submodule modules. No merge-induced change. Investigate scope/contract before expanding format support.
- Verifier history: pre-existing coordinator-supplied history validation; inspect charter and legitimate amended recommendation semantics before imposing identity rules that could forbid amendment.
- Claimed inspected-test existence: schema validation cannot prove actual inspection; assess claimed evidence boundary separately from report omission.

## Repair class closure

1. **Verdict coherence**: confirmed against the Snipe role (which uses request_changes for blocking findings). Result intake previously rejected blocker-bearing approval only, allowing empty request_changes and blocker-bearing escalation. Changed the shared intake predicate in both directions; kept nonblocking operator escalation. The role text and runner regression mirror it. Full severity × verdict matrix fails before repair; disposable removed-guard witnesses fail assertions for both inverse cases. These are Snipe semantics, not changes to engine escalation routing.
2. **P02 schema fidelity**: fixture and oracle independently encoded an invalid Major disposition. Removed it from both; preserved id/severity/current pin and causal audit assertions. New regression failed before repair. Existing removed-initial-finding oracle mutation fails; invented disposition and missing blocking finding remain negative controls. No production parity claim.
3. **Test evidence projection**: renderer omitted validated tests_verified. Added explicitly labeled seat-reported paths/absence/uninspected states. Three independent cases failed before repair; projection-removal mutant fails. The validator remains a schema validator, not proof of model inspection or filesystem provenance. Initial Minor about nonexistent paths is retained as prior evidence-hardening debt; checking blob existence would not prove actual inspection and requires dirty/submodule policy. No independent inspection claim is made.
4. **Verifier retry records**: status-only records could skip dispatch. Validate refuted result shape, sequential attempt, transition, nonempty recommendation/arms and preserved evidence line. Sibling sweep included dispatched result validation (shared predicate), packaged tests and `adapters/codex/skills/war-strategy/references/host.md`. Invalid/reordered records fail; legitimate amendments may change recommendation and arms. Negative controls failed before repair; removed/inverted status, attempt, recommendation, arms, transition and result guards fail independent mutation oracles. Coordinator history is not authenticated; unrelated but well-shaped histories cannot be cryptographically distinguished without new persistent identity machinery. Explicitly documented, not claimed solved by shape checks.
5. **SHA-256 Git repositories**: prior Major limitation remains outside this bounded integration. The request/result/submodule parsers support SHA-1 object IDs only. Optional scope question offered; no expansion presumed. Hold SHA-256 compatibility and record as operator-visible prior debt. This repository and all audited refs use SHA-1. No failure is hidden by a skip.

Additional edited paths beyond plan list are the Snipe intake/renderer/tests/role and planning verifier/tests/host listed above; no runtime engine code or CI policy changed.

## Baseline and regression evidence

- Normal merge commit: `1c889d694c8d56c489f66435b827a31781102c6d`; parents PORT_BASE then ENGINE_BASE. Git auto-merge preserved both behaviors, confirmed by source diffs.
- Complete 70-suite merge baseline exited 1 with unchanged clean source. 64 passed, 3 allowed-skip suites (five named host skips), 3 failed: submodule loopback fixtures, collector ps checks, physical parity fixtures. Host sandbox denies loopback/ps; retain logs. No timeouts or unconfirmed cleanup reported. The large workflow suite passed; a temporary output pause was not a hang. Isolated concurrency test also passed (diagnostic only).
- `repair-before.log` contains all three intended regression failures; `history-before.log` contains malformed-history failure.
- Result + parity suites passed (`repair-after.log`); verifier + runner passed 38 tests (`verifier-runner-after.log`). Result/verifier mutation suites passed 21 tests (`repair-mutations.log`); shared verifier-predicate follow-up passed (`history-final.log`). Final collector will cover current complete source.
- Census is byte-equal to discovery: 70 suites; no update or exclusions needed. Redaction, version monotonicity/coherence, hard budgets, reference/CLI suites are in census. No applicable external gate identified.

## Follow-on production binding matrix (B3)

| Future scenario | Existing engine regression / independent assertion | Remaining gap |
| --- | --- | --- |
| Sibling-only recovery | workflow-template.test.mjs recovery owned footprint and current-content proof; real Git task-integrated.sh tests require owned surviving content, ancestry and stable refs | Bind Codex runtime decisions, not fixture driver |
| Matching patch ID with changed content | upstream content proof / exact pin content refusal; real commits distinguish whitespace and lost/reverted task content | Actual Codex approval-transfer behavior |
| Changed source after uncertain failure | known failure source boundary crosses task/land × baseline/environment × normal/lost reply × changed/unchanged; asserts retries and remote tips | Live lost-response and recovery-role observation |
| Stale gate-artifact selection | gate artifact isolation and dispatch-owned gate evidence; exact returned paths and same-tip retry rejection | Live dispatch/log binding |

Frozen red-team receipt read at artifacts ref `0ea5d4bce168034b0856fa9db8c406a9f9ebf5e0`: original target `46aef4a25b68874bff7b3b3fed14f9058c270da7`, plan hash `159b6de7bcfb7075e7ffd5c4bc5f133ef84a3a5276f5cde5a731b4f990f73b57`, installed version `0.1.0+codex.77d91df9fa50.5dc9e2b31180`, INCOMPLETE report. No installed/experiment mutation.

Historical candidate-1 checkpoint: commit repairs/evidence, run full collector with host permission for loopback/process inspection; build fresh packages and run final four-seat packaged panel at frozen candidate. Evidence-only commits afterward must preserve executable/package-source identities.

## Candidate 1 validation and final-panel finding

At `d4f0fef04c196d04ed6987a3889f7cb5234f546b`, the host-permitted collector passed all 70 suites (67 passed, 3 allowed-skip suites), 3,933 passing records and five authorized skips, clean source unchanged. Fresh Snipe/planning packages at inherited 0.21.13 built and imported outside checkout. Package digests: Snipe `3437dc8fd9acb2f952edeeda054c942a97557f8498ef51ae955ef14f2b3f4c77`, planning `9a3a313f826dbe533c8ed693006b298a622f1e06a6ecb0f52c1b3697cd3c9019`. Initial package-import diagnostic incorrectly asserted .ok; corrected to actual .valid API and passed, with the mistake retained in its log.

Candidate-1 packaged panel: all four validated, stable/complete. Correctness, simplicity and test-fidelity approved; cascading-impact requested changes for Snipe source-symlink ancestor validation. Report/raw at `final-snipe.md/json` in evidence (retained as candidate-1, not overwritten). Post-audit repair discipline consumed in full.

Before repair, affected paths: `adapters/codex/package-snipe.mjs`, `package-snipe.test.mjs`, `package-planning.mjs`, `package-planning.test.mjs`, new `adapters/codex/package-source.mjs`. Root cause: Snipe validates leaves only, whereas planning walks ancestors. Share the existing planning regularSource check between builders, covering root, ancestor, leaf and version-source paths before output creation. Generated package contents must remain unchanged. Regression must fail on unmodified Snipe, assert no output on refusal, and mutant removal of ancestor guard must fail the oracle. Follow-on full baseline and newly built packaged panel required after this production builder change.


Package-source class closure: both builders now import one `regularSource` implementation extracted from planning and extended to reject a symlinked source root. Snipe applies it to every FILES entry and the version manifest before output creation; planning also uses it for ADR reference validation. Regression failed on old Snipe; both-builder root/ancestor/leaf/version cases now pass and assert absent output. Root, ancestor and nonregular-leaf mutations each fail an independent oracle. Existing missing-input, component inventory, filesystem CLI alias, moved-package lint/reference and invocation tests remain green. Read-time races during a concurrent source mutation remain outside this static preflight check; builds use this dedicated clean checkout. This repair adds no authentication claim and no generated package file.

Candidate-1 panel is preserved in `snipe/2026-09-10-codex-integration-candidate-1-snipe.md`; candidate-1 baseline/packages/validated seat results are in the validation manifest. Historical candidate-2 checkpoint: refreshed evidence was then pending after the builder repair.


## Candidate-2 panel and next repair footprint

Candidate-2 baseline passed all 70 suites at `313f105b3315ee10b935e7177295626ede1e7fa8` (3,935 passes, five authorized skips, unchanged source). Final packaged panel: stable/complete and four validated seats; correctness request_changes, simplicity/cascading-impact/test-fidelity approve. Package-source class approved. New Major: a genuine refutation can be retried without amendment. New Minors: documented usability lens missing from shared bare-lens catalog, stale top-level ledger progress. Full report/raw retained in `final-snipe-2.md/json`.

Affected paths before edits: planning verifier/host/test already in repair footprint; `skills/snipe/assets/snipe-args.mjs`, `skills/snipe/assets/snipe-args.test.mjs`, and `adapters/codex/skills/snipe/assets/snipe-request.test.mjs` for shared catalog and packaged request mirrors. Rule: one refutation requires represented amendment before redispatch; unchanged text including whitespace-only changes stays operator-fork even if a fresh seat would approve. Text comparison is a mechanical minimum, not proof of semantic amendment. Sweep all history-bearing tests so genuine amended retries remain exercised. The bare-lens catalog must cover documented standard lenses while preserving structured targets and custom comma-list grammar. Ledger top status/checklist/next action is canonical; historical checkpoints are labeled.


## Candidate-3 class closure

- Unchanged-refutation retry: normalized recommendation comparison now preserves the prior refutation and operator-fork without dispatch. The same shared normalization is applied to prior and current text. Exact-repeat and whitespace-only before-source controls failed; after repair, both input orders and removal of guard/trim/whitespace folding fail mutation oracles. Old unarmed and two-attempt fixtures now use actual changed recommendations so the new guard cannot mask their own removals. A represented text change is a minimum, not semantic proof; the interviewer still owes the charter's substantive amendment. Empty/malformed history validation remains before branching, no-history unarmed behavior is unchanged, and second-refutation history still forks before any third dispatch.
- Documented standard-lens reachability: shared catalog now includes usability; Claude and Codex consumers use the same parser. One-seat raw forms and every documented Codex standard lens are checked; a moved package with usability removed fails the independent request oracle. Custom comma lists, reserved lenses and structured targets retain their existing suites. No Codex-specific parser fork.
- Progress authority: one top status/checklist/next action governs resume. Lower sections retain historical checkpoints with labels. Final evidence-only commit will close the remaining acceptance boxes.
- Targeted current checks: 54 tests passed (`candidate-3-targeted-final.log`); updated moved-package mutation assertion passed (`candidate-3-lens-mutation.log`). `candidate-3-before.log` retains all three intended failures. Intermediate mutation failures exposed masking by the new unchanged-text guard and a nonunique mutation anchor; fixtures were corrected, not relaxed.
