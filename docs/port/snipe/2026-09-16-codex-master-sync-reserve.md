# Snipe report

## Scope

- Committed scope: merge-base 287405fc56ee54c3a46f94f0449a83c30008a8bf...d2f4a3324075f53e7db47d8ebf7eb66af837b51e
- Revision: `d2f4a3324075f53e7db47d8ebf7eb66af837b51e` (base `287405fc56ee54c3a46f94f0449a83c30008a8bf`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `medium` (actual model identity not independently verified)

> INCOMPLETE — do not interpret this panel as clean.

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence high
  Seat-reported tests: scripts/ci/collect.test.mjs, scripts/ci/check-war-ci.test.mjs.
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
  Seat-reported tests: scripts/ci/collect.test.mjs, tests/parity/oracle.test.mjs, adapters/codex/planning-verifier.test.mjs.
- Seat 3 · cascading-impact: completed — validated; verdict approve; confidence high
  Seat-reported tests: scripts/ci/collect.test.mjs, scripts/ci/check-war-ci.test.mjs.
- Seat 4 · test-fidelity: failed — transport status: failed

## Limitations

- Seat 4 (test-fidelity): transport status: failed

## Findings

### Minor · Indented approved skip rows remain unrecognizable

- Seats: 1 (correctness)
- Location: `scripts/ci/collect.mjs:66`
- Evidence: Skip detection explicitly accepts leading whitespace, and the repaired pass/failure classifiers now do likewise, but the subsequent skip-name extraction still requires `ok` in column zero. Thus an otherwise approved line such as ` ok 1 - <approved name> # SKIP` is recorded with a null reason and makes collection fail. The final gate repeats the column-zero extraction in scripts/ci/check-war-ci.mjs, so even a correctly collected indented skip would be rejected there. This is a false-negative edge case in the same row-indentation invariant addressed by the final repair; existing tests cover indented pass and failure rows but not indented approved skips.
- Proposed correction: Allow leading whitespace in both skip-name extraction expressions and add an approved indented-skip case spanning collection and final-gate validation.
- Disposition: absorb (classification only)
### Minor · Shell skip accounting disagrees between collector and final gate

- Seats: 3 (cascading-impact)
- Location: `scripts/ci/collect.mjs:64`
- Evidence: The collector recognizes shell TAP skip rows with optional leading whitespace, but its downstream consumers do not preserve that contract. The skip-name extraction still uses `^ok`, and `scripts/ci/check-war-ci.mjs` repeats the same column-zero-only extraction, so an indented otherwise-approved skip is recorded with no policy reason and rejected. Separately, the shell `passed` matcher counts every `ok ... # SKIP` row as a pass while also incrementing `skipped`; this can let `collect()` report `ok: true` with counts such as tests=1, pass=1, skipped=1, which the final gate then rejects because it requires tests=pass+skipped. Thus the collector CLI and the gate can give contradictory outcomes for the same approved shell skip, and the new indentation repair did not reach these mirrored readers. The inspected tests cover approved Node skips and unapproved shell skips, but no approved shell skip is passed from collector output through the gate.
- Proposed correction: Parse shell TAP rows once with the same optional-indentation rule, extract the normalized test name from that parse, and exclude `# SKIP` rows from the pass count. Apply the same indentation-tolerant name extraction in `checkWarCI`, then add an end-to-end approved shell-skip fixture, including an indented row, whose collector report is accepted by the gate with tests=1, pass=0, skipped=1.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
