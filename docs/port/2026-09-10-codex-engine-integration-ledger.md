# Codex engine integration ledger

Status: Phase 1, initial audit pending. Owner: Codex task `01a08d29-9d5a-7d02-8c90-f8a4abee937c`.

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
- [ ] Initial installed-package panel on common-base...PORT_BASE.
- [ ] Dependency/path inventory and normal merge of ENGINE_BASE.
- [ ] Reconcile observed compatibility defects with discriminating tests.
- [ ] Census and complete clean-source collector.
- [ ] Fresh moved packages and final packaged panel.
- [ ] Final evidence commit, push and PR into codex-port.

Node currently available: v24.17.0. Remaining prerequisite identities to record before baseline.
Next action: launch installed Snipe coordinator with host permission; retain report and read packaged post-audit repair discipline. User's overarching integration instruction authorizes subsequent in-scope fixes outside the report-only audit.

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
