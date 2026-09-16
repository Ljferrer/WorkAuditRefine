# Snipe report

## Scope

- Committed scope: merge-base 668e4ff990f1c689fcf9710768c3d73c2601920c...a874bd6b366166b4eb6da99564347dc7909ac9ac
- Revision: `a874bd6b366166b4eb6da99564347dc7909ac9ac` (base `668e4ff990f1c689fcf9710768c3d73c2601920c`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · cascading-impact: completed — validated; verdict request_changes; confidence high
- Seat 3 · test-fidelity: completed — validated; verdict approve; confidence high
- Seat 4 · security: completed — validated; verdict approve; confidence high

## Findings

### Major · Canonical launch callers can still reuse a fresh launch's gate-artifact namespace — would block in a phase

- Seats: 2 (cascading-impact)
- Location: `skills/war/assets/workflow-template.js:2555`
- Evidence: The new namespace at gateEpoch is deterministic from [runId, phase.id], and gateAttempt restarts at 0 on every script evaluation. However, skills/war/SKILL.md still defines runId as <plan-slug>-<YYYY-MM-DD> and retains an explicit-path exception for missing runId, while docs/adr/0037-run-scoped-staged-phase-scripts.md explicitly says the same runId may recur during a same-day recovery relaunch. Missing identity now hard-stops that documented explicit-path caller, and a same-day recovery following the recurrence contract receives the same prefix as its prior attempt. admitGateResult accepts any six-character mktemp-shaped suffix beneath that prefix, so a stale gate_log_path from the earlier launch remains admissible and can be forwarded as authoritative evidence. The new stale-log regression only compares launch-one with launch-two and therefore does not exercise the documented repeated-runId caller.
- Proposed correction: Make the canonical Lead/recovery flow mint and persist a genuinely unique top-level runId for every non-journal-replay attempt, updating the SKILL, staged-script, manifest, and explicit-path guidance consistently; alternatively introduce a separately persisted attempt identity into gateEpoch. Add a stale-path regression using the same runId, phase, task, and shared submodule repository across two fresh evaluations.
### Major · Canonical same-day relaunches still share a gate-artifact namespace — would block in a phase

- Seats: 1 (correctness)
- Location: `skills/war/assets/workflow-template.js:2555`
- Evidence: The replacement namespace is determined solely by `[runId, phase.id]` plus `gateAttempt`, which restarts from zero for each Workflow evaluation. However, `skills/war/references/run-manifest.md` still defines `runId` as `<plan-slug>-<YYYY-MM-DD>`, and the pinned land-failure plan explicitly records that this value recurs for same-day recovery relaunches and plain reruns. A fresh Workflow for the same phase on the same day can therefore recreate the exact prior prefix. `admitGateResult` accepts any path under that prefix with a six-character mktemp-shaped suffix, so an erroneous refiner can return a previous launch's path and have stale authoritative gate evidence forwarded. The added stale-path regression avoids this real caller shape by supplying `launch-one` and `launch-two`; it proves separation only after the caller already provides distinct identities. Thus the prior Major's uniqueness requirement is not closed.
- Proposed correction: Introduce an attempt identity that is guaranteed to change for every fresh Workflow launch while remaining stable for journal replay. Either make the threaded `runId` genuinely unique and update its canonical format and relaunch callers, or add a separately required launch-attempt identifier. Add a regression where the canonical logical run ID and phase are unchanged across two fresh attempts and verify that the first attempt's gate path is rejected.
### Major · The new phase identity contract accepts values rejected by its provisioning consumer — would block in a phase

- Seats: 2 (cascading-impact)
- Location: `skills/war/assets/workflow-template.js:863`
- Evidence: hasPhaseIdentity accepts every nonblank string and every safe integer, including "4b" and -1. Every tasks-bearing launch then interpolates ph.id into provision-worktrees.sh ensure-integration, whose numeric-only guard rejects non-digit values; ADR 0021 explicitly preserves that numeric-only contract and rejects letter-suffixed phase IDs. Thus inputs now declared valid by the entry guard proceed to the Provision dispatch and fail before any worker runs instead of being rejected at entry. The delimiter-encoding test even exercises a gate-producing launch with string phase ID "y" through a mocked provision result, so it masks the real downstream refusal.
- Proposed correction: Align entry validation and schemas.md with the numeric phase-ID contract consumed by ensure-integration and teardown-phase, then test the rejected string/negative cases before dispatch. If arbitrary string identities are required for zero-task shapes, separate artifact identity from the numeric provisioning phase coordinate rather than declaring the same field valid for all launches.
### Minor · Phase identity validation accepts values rejected by live provisioning

- Seats: 1 (correctness)
- Location: `skills/war/assets/workflow-template.js:863`
- Evidence: The new guard accepts every safe integer, including negatives, and every nonblank string. Every task-bearing phase subsequently dispatches `provision-worktrees.sh ensure-integration ... <phase.id>`, whose pinned implementation rejects any value containing a non-digit; `resume-and-recovery.md` also states that letter-suffixed IDs are rejected by design. Values such as `-1` or `4b` therefore pass the advertised entry guard, dispatch the refiner, and can run `ensure-exclude` before provisioning fails. This contradicts the repair's claim that invalid launch identity is refused before dispatch or Git mutation. The new string-phase namespace test mocks the provision barrier as successful, so it cannot detect the incompatibility.
- Proposed correction: Align the task-bearing phase identity predicate with the provision script's digits-only grammar and test rejected negative and nonnumeric IDs before dispatch. If string IDs are intentionally supported only for zero-task launches, encode that conditional contract explicitly and test both arms.
- Disposition: absorb (classification only)
### Minor · Primary launch instructions retain the now-invalid explicit-path exception

- Seats: 1 (correctness)
- Location: `skills/war/SKILL.md:70`
- Evidence: The engine now requires `runId` and `phase.id` unconditionally, but the primary Lead runbook still says a launch missing the derivation trio or phase ID is allowed when every task carries an explicit branch and worktree. A Lead following that documented hand-patched-DAG escape hatch now receives a terminal `held:workflow-error` before dispatch. The changed tests removed the old carry-forward behavior, but no corresponding update was made to this controlling launch surface.
- Proposed correction: Update the launch paragraph so explicit paths waive only path-derivation inputs such as `planSlug` and `worktreeRoot`, never launch identity, and pin that wording with the existing documentation-contract tests.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.

