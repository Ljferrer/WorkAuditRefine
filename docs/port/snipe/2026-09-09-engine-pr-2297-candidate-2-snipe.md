# Snipe report

## Scope

- Committed scope: merge-base ba08a77f812fe3e00fdf21aa5114a3f00f90df4b...3bc79603381c84d952bb40d9ecc9727ff5bc53b0
- Revision: `3bc79603381c84d952bb40d9ecc9727ff5bc53b0` (base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · cascading-impact: completed — validated; verdict request_changes; confidence high
- Seat 4 · test-fidelity: completed — validated; verdict request_changes; confidence high

## Findings

### Major · Audit-pin reconciliation death has no acceptance test — would block in a phase

- Seats: 4 (test-fidelity)
- Location: `skills/war/assets/workflow-template.test.mjs`
- Evidence: The final repair adds a distinct read-only `audit-pin` dispatch and an explicit `deathOf(resolved)` branch in `auditRound`, preserving D21's site-named `env-died` classification. The missing-pin tests exercise absent, malformed, valid, and repeatedly invalid reconciliation responses, but never make the `audit-pin` dispatch throw an infrastructure error. The existing “D21 alternate read-only consumer” table covers pin-transfer re-audit, floor re-audit, and integrated-tip audit—not `dispatchKind: 'audit-pin'`. Deleting `if (deathOf(resolved)) return ... died: deathOf(resolved)` would therefore leave these tests green: the DEAD record would fail `fullSha`, return an empty panel with no death, and the wave caller would classify the incident as `audit-blocked` rather than the required SOFT environment event. This is an evidence gap, not an observed runtime failure, but it leaves the declared every-dispatch classification invariant unprotected.
- Proposed correction: Add a behavioral missing-pin case whose `audit-pin` handler throws an `INFRA_DEATH_RE`-matching error. Assert the dispatch is reached, the result records `env-died` with the `audit-pin:<task>` site and original cause, never records `audit-blocked` or a generic hard escalation, dispatches no merge for that task, and permits an independent sibling task to land.
### Major · Equal but unverified SHA strings remain merge-eligible — would block in a phase

- Seats: 1 (correctness)
- Location: `skills/war/assets/workflow-template.js:2641`
- Evidence: `isSha` accepts any 7–40 hexadecimal characters, and `pinMismatch` treats prefix-related values as the same commit without resolving either through Git. `auditRound` invokes read-only reconciliation only when the worker pin is malformed or a seat differs syntactically. Therefore a worker and every auditor can return the same nonexistent value such as `deadbeef`, or distinct commits sharing an abbreviated prefix, and proceed directly to `allApprove` without establishing that the pin names the task branch tip. The pinned test harness preserves this path: `defaultImpl` reports worker `head_sha: 'deadbeef'`, `completeAuditFixture` copies that prompt value into `audit_sha`, and the normal success fixtures merge without an `audit-pin` lookup. This contradicts the changed schema contract that the consumer independently verifies every seat pin and re-runs at a Git-confirmed full SHA, leaving unverified content merge-eligible.
- Proposed correction: Resolve the task branch to a full Git commit before accepting the initial task audit, or perform that read-only resolution after every panel and require each seat pin to equal the confirmed full SHA before approval. Do not infer commit identity from prefix containment alone. Add a regression proving equal syntactically valid but nonexistent pins cannot merge, plus an abbreviated-prefix case resolved against real Git.
### Major · Gate-artifact consumers trust any absolute refiner-supplied path — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `skills/war/assets/workflow-template.js:2439`
- Evidence: The producer contract requires a fresh `<refinery>/.war/gate-<task>.<unique>/gate.log`, but `gateLogPathOf` accepts every string beginning with `/` that lacks NUL. A stale same-tip artifact elsewhere, an unrelated readable file, or a newline-bearing prompt payload therefore survives normalization. The value is subsequently presented to evidence/refiner and auditor consumers as the authoritative artifact, and the same weak predicate satisfies `reconcileMerge`'s success evidence check. A previous same-tip gate log can consequently be substituted for the current logical attempt, reopening the stale-alias class the unique-directory repair claims to close; an arbitrary path can also make read-only auditors inspect unrelated local data. The inspected tests cover missing paths and the intended absolute path but do not reject an absolute path outside the allocated gate directory.
- Proposed correction: Validate each returned gate path against the expected refinery root, task/phase-specific `gate-<id>.<suffix>/gate.log` shape, and a single-line path grammar before threading it to any continuation, evidence prompt, auditor, end-state projection, or reconciliation check. Treat every nonconforming path as unthreaded evidence, and add negative fixtures for outside-root, traversal, stale same-tip, and newline-bearing paths.
### Major · Rejected re-audits still emit success-shaped approval-transfer receipts — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `skills/war/assets/workflow-template.js:3172`
- Evidence: `pinTransfers` is documented as the ledger of accounted transfers where unanimity survives at the destination SHA, but all three re-audit families write rows before approval is established. `aceReaudit` calls `recordAceTransfer` before its callers evaluate `allApprove`; the merge-slot mismatch arm pushes `probeRow('mismatch', rbSeats)` before its approval branch; and the terminal pass pushes its `re-ran`/`transferred` row before checking `tApproved`. If any panel returns `request_changes`, a blocking finding, a shortfall, or an unusable repeated pin, the candidate is rejected or forward-reverted while the top-level result still contains a row claiming every seat re-ran or transferred at that SHA. Because the schema carries no failed outcome and downstream documentation says the ledger is re-verifiable approval evidence, consumers cannot distinguish these false receipts from valid unanimity.
- Proposed correction: Append each receipt only inside the corresponding successful `allApprove` branch, after pin reconciliation has completed. Emit no success-shaped row for rejected, short, dead, or repeatedly pin-invalid panels. Add negative tests for failed full/subset ace re-audits, failed mismatch re-audits, and rejected or missing terminal seats, asserting that none leaves a `pinTransfers` receipt for the rejected SHA.

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
