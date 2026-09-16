# Snipe report

## Scope

- Committed scope: merge-base ba08a77f812fe3e00fdf21aa5114a3f00f90df4b...1bd9474b7ea813d85976b8639f666df29b26fda3
- Revision: `1bd9474b7ea813d85976b8639f666df29b26fda3` (base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · cascading-impact: completed — validated; verdict request_changes; confidence high
- Seat 4 · test-fidelity: completed — validated; verdict approve; confidence high

## Findings

### Major · Missing or malformed audit pins still permit task approval — would block in a phase

- Seats: 1 (correctness)
- Location: `skills/war/assets/workflow-template.js:2641`
- Evidence: The new reconciliation runs only when `seats.some(s => pinMismatch(s.audit_sha, pin))`, but `pinMismatch` returns false whenever either value is absent or malformed, and `audit_sha` remains optional in `AUDIT_VERDICT`. An implemented worker's `head_sha` is optional as well. Consequently, an approving seat can omit `audit_sha`, or the worker can omit a usable pin, and `allApprove` can merge the task without establishing which Git tree was reviewed. The pinned test harness demonstrates the surviving path: its default worker returns `head_sha: 'deadbeef'`, its default approving auditor returns no `audit_sha`, and this is the suite's successful work-to-land default. This leaves the #2141 invariant open in the missing-proof direction even though the changed documentation says a verdict is pinned to `audit_sha` and missing proof prevents approval.
- Proposed correction: Before accepting a task audit, resolve an absent or malformed worker pin through the existing read-only `audit-pin` path. When a task audit has an expected pin, require every returned seat to provide a usable `audit_sha`; treat an absent, malformed, or unequal value as unresolved and re-audit at the confirmed full SHA, then hold on a second invalid response. Add negative fixtures for an approving seat without `audit_sha`, a malformed `audit_sha`, and an implemented worker without a usable `head_sha`.
### Major · Pinless or malformed approvals still bypass Git reconciliation and remain merge-eligible — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `skills/war/assets/workflow-template.js:121`
- Evidence: The repair requires task verdicts to converge on a Git-confirmed audit pin, but `audit_sha` remains absent from `AUDIT_VERDICT.required`, `pinMismatch` returns false when either value is missing or malformed, and `allApprove` checks only seat count, verdict labels, and blockers. Consequently `auditRound` enters reconciliation only for two usable but conflicting SHAs; an approve response without `audit_sha`, or an implemented worker result with a missing/malformed `head_sha`, bypasses the Git lookup and can flow through the wave's `allApprove` branch into merge and land. Multiple valid but different seat SHAs likewise pass when the worker pin is unusable. This contradicts the pinned schema documentation's merge rule requiring all approvals on the same `audit_sha`. The test suite's shared `defaultImpl` returns approve without `audit_sha`, while the malformed-worker-pin test explicitly preserves the no-pin fail-open path; the new #2141 regressions cover valid SHA mismatches and therefore cannot reject this downstream bypass.
- Proposed correction: At the `auditRound` boundary, treat every missing or malformed seat `audit_sha`, and every missing or malformed initial/fix worker pin, as unresolved pin evidence. Resolve the task branch through the existing read-only recovery path, re-run the roster at that confirmed SHA, and refuse approval if any second-pass seat lacks or disagrees with that pin. Keep the gate-audit family's separately documented SOFT missing-pin behavior outside this task-audit rule. Add regressions proving pinless, malformed, and mutually different approve responses cannot reach merge eligibility.
### Minor · The strengthened approval predicate remains duplicated at six callers

- Seats: 2 (simplicity)
- Location: `skills/war/assets/workflow-template.js:1971`
- Evidence: `allApprove` now centrally requires a complete all-approve panel with no Critical/Major findings, but six callers additionally repeat `blockingOf(...).length === 0`; the sweep and terminal callers also repeat `!died`, although persistent dead seats are removed while `expected` remains unchanged, making `allApprove` false already. These redundant conjuncts add repeated finding traversals and leave multiple apparent homes for the approval invariant, increasing future drift risk without changing behavior.
- Proposed correction: Reduce each of the six expressions to `allApprove(seats, expected)` and retain the existing centralized predicate and behavioral approval tests.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
