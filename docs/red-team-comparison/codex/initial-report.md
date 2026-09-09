# Initial independent Codex review — INCOMPLETE

Preserved before plan repair or Lead adjudication on 2026-09-09. This report concerns the original plan at commit `46aef4a25b68874bff7b3b3fed14f9058c270da7`, SHA-256 `159b6de7bcfb7075e7ffd5c4bc5f133ef84a3a5276f5cde5a731b4f990f73b57`. The inherited baseline is `9bc8f676fac1794838f556ed74f2c0d1a9b7bac5`.

Installed invocation: `$work-audit-refine-red-team:red-team`. Package version `0.1.0+codex.77d91df9fa50.5dc9e2b31180`, source revision `77d91df9fa50ef65b92863e09e9662c1c23bd397`, declared artifact SHA-256 `bb16803fe1c2e91cf8df03c25704a90bfc2a4c9500e903e83e95abd704cf1cc5`. All 12 installed inventory file hashes matched build-info.json. See [package identity](package-identity.json). The installed package was used without modifications or a development substitute.

Configured probes and confirmer: `gpt-5.6-sol` / `medium`, explicitly selected by the operator and accepted by the live catalog. Independent backend model identity and billed cost are not verified. Capacity 1, timeout 600000 ms per attempt, retries 0, round limit 3. Gate rounds: 0. See [selection](coverage-selection.md), [request](initial-run/request.json), and [raw run](initial-run/run.json).

| Probe | Technique | Initial outcome |
|---|---|---|
| baseline-and-executable-contracts | executed | Launched and completed, exit 0; unusable schema (`evidence` object instead of required string). Raw result claimed pass/no findings. Does not satisfy coverage. |
| decision-coverage-and-backstops | analyzed | Valid pass; no findings. |
| isolation-package-evidence-failure-paths | analyzed | Valid fail; one Major candidate. |
| Independent confirmation of candidate #1 | analyzed | Valid; reproduced true, exact-identity and wrong-title controls retained. |

All 3 selected initial probes were attempted; 2 returned valid results. All 1 applicable confirmations were attempted and returned valid results. There were no coordinator retries. Child-local test setup failures and reruns are retained in the first raw transcript; they are not coordinator retries. No target-state-change or cleanup gap was emitted by the runner.

The exact initial gate verdict is **INCOMPLETE**, not a clean review. Its summary counts 2 on-target results out of expected 8: 3 selected probes plus 5 source-intake diagnostic markers. Dropped coverage consists of the unusable executed probe and the five source markers. `routeUpstream=false`; this is not permission to disregard missing evidence. See [initial gate input](initial-run/initial-gate-input.json) and [output](initial-run/initial-gate-output.json).

## Initial finding

**Major — isolation-package-evidence-failure-paths#1: make content/revision attestation binding explicit.** The baseline canonical gate accepts an otherwise valid result with the correct path/title but a false plan hash and repository revision. The independent confirmer reproduced CLEARED for stale identity and the exact-identity control, and INCOMPLETE for the wrong-title control. The plan records hashes/revisions and forbids off-target success, but its reuse instruction does not explicitly require validating each result's identities or the stale-same-title regression. The proposed resolution is to clarify those requirements in the existing Task 1 and related obligations, preserving implementation latitude about where validation occurs.

This is a reproduced baseline mechanism and an explicitness finding about the plan, not a claim that the installed migration has this runtime defect. The future migration is absent from the frozen target as intended. Raw candidate: [attempt 3](initial-run/attempt-3-raw.json). Independent confirmation: [confirmation](initial-run/confirmation-3-1.json), with [raw attempt 4](initial-run/attempt-4-raw.json). No Lead adjudication has been applied in this initial report.

## Evidence and independence limits

The five cited issue bodies/comments were fetched, but 62 linked-evidence gap entries remain (not necessarily distinct URLs). No complete historical replay is claimed. The live #2097 snapshot has 15 comments rather than the original plan's 13. The first request omitted known historical operator alias SQPferrer. Prior installed-diagnostic status was not supplied; renewed explicit skill invocation triggered this attempt with that gap declared.

An initial broad branch listing exposed unrelated branch/commit titles to the Lead. Excluded peer-review, migration ledger, implementation PR and comparison-research contents were not opened by the Lead; isolated probes did not inherit its conversation. Exact historical source parity and perfect blinding are not claimed. See [full limitations](lead-intake-limitations.md) and [questions/directions](questions-and-decisions.md).

The first probe's raw transcript demonstrates real commands, including failed temporary-fixture setup, a command rejection, and successful local reruns. Its pass text is not accepted schema coverage. Available usage counters remain in raw attempts; they are reported counters, not verified billing. The original target plan bytes, package identity, raw role prompts/results, confirmations, and initial/working/final runner outputs are retained separately. No plan change, merge, migration implementation, or Post-Implementation Phase 3 occurred before this initial preservation.
