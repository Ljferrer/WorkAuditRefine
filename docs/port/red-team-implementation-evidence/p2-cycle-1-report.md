# Snipe report

## Scope

- Committed scope: range 68c6705bfe9515a4f6be9f46f725e29e71cd085d..d5661d64abc47b3a2cc9648385213c8ff8daeafd
- Revision: `d5661d64abc47b3a2cc9648385213c8ff8daeafd` (base `68c6705bfe9515a4f6be9f46f725e29e71cd085d`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `medium` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · plan-faithfulness: completed — validated; verdict request_changes; confidence high
- Seat 4 · cascading-impact: completed — validated; verdict request_changes; confidence high

## Findings

### Major · Diagnostic can report OBSERVED without executing the required analysis or proof command — would block in a phase

- Seats: 1 (correctness)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:324`
- Evidence: runDiagnostic accepts any completed command event whose output contains the fixture marker; only the proof arm additionally applies a substring regex for `node proof.mjs`. Consequently, an analysis confirmation can echo a marker copied from the prior result, while a proof confirmation can use a command such as `echo node proof.mjs; echo <prior marker>; exit 1`: both satisfy the current predicate without rereading sum.txt or rerunning proof.mjs. The shared nonce also lets the analysis marker be synthesized from proof output. The offline success fixture exercises only honest `cat sum.txt` and `node proof.mjs` commands, while the vacuous fixture removes command events entirely, so neither test rejects this plausible false-positive transcript. This violates Phase 2's requirement to inspect whether the intended work occurred and can turn non-independent or fabricated tool evidence into an `OBSERVED` installed-host diagnostic.
- Proposed correction: Require exact allowlisted commands, including only explicitly supported shell-wrapper forms, for both analysis and proof attempts. Use distinct unpredictable markers so the sum.txt marker cannot be derived from proof.mjs or prior evidence. Add offline negative cases containing well-shaped command events with correct markers and exit codes but echo/substitution commands, including confirmation attempts, and assert the diagnostic remains INCOMPLETE.
### Major · Phase-2 delivery receipt lacks the artifact required for operator installation — would block in a phase

- Seats: 3 (plan-faithfulness)
- Location: `docs/port/2026-09-08-red-team-local-delivery.md:5`
- Evidence: The original Phase-2 contract requires the implementation to stop with a built local package and a receipt containing source/artifact identity, artifact location/version/digest, and the Phase-2 completion SHA. The pinned receipt instead says these values will be recorded later, leaves `$artifact` unresolved, and ends with “Final acceptance and delivery identities follow.” The ledger likewise says the receipt is awaiting committed artifact identity. Consequently the operator cannot identify or verify the audited package to install, so the required Phase-2 handoff is not complete even though deferring installation and live observation is correct.
- Proposed correction: After bounded fixes, build from the committed delivery source, verify the resulting directory, and finalize the receipt with its exact source/completion commit, filesystem location, generated version, artifact SHA-256, and relevant validation/audit outcomes. Make the installation command’s `$artifact` resolve to that retained artifact while continuing to mark installation, live observation, and Phase 3 pending.
### Major · The diagnostic can accept a replayed analysis confirmation as an observed source read — would block in a phase

- Seats: 3 (plan-faithfulness)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:324`
- Evidence: For confirmation attempts, `runRedTeam` includes the prior result—including its evidence—in the new prompt. `runDiagnostic` then accepts an analysis confirmation whenever any command-execution event outputs the already disclosed source marker with exit 0; unlike the proof branch, it places no constraint on the command. A confirmer can therefore echo the prior marker without reading `sum.txt`, return a valid-shaped confirmation, and still allow `OBSERVED`. This contradicts the Phase-2 requirement to inspect whether the intended work occurred and the receipt’s claim that `OBSERVED` requires analysis reads and applicable independent confirmations. The offline fake does not reject this path: its success mode always reads the file, while missing, unusable, and vacuous modes provide no shaped replay case.
- Proposed correction: Make the analysis action independently observable—for example, require an exact documented source-reading command for both initial and confirmation attempts—and add an offline fake mode that emits a valid result and the prior marker through a non-reading command. Assert that this replay remains INCOMPLETE.
### Major · The diagnostic can report OBSERVED without detecting the seeded defect — would block in a phase

- Seats: 4 (cascading-impact)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:313`
- Evidence: For the seeded fixture, runDiagnostic checks only that the aggregate verdict is BLOCKED, each probe has at least one confirmation, and every attempt emitted the expected command marker and exit status. It never verifies that the reported and confirmed blocker describes the seeded 5-versus-4 mismatch. Consequently, both probes may read or execute the fixtures but return independently confirmed, unrelated Major findings; the gate is still BLOCKED and lines 313-328 promote the observation to OBSERVED. That result flows directly to the operator checkpoint, where the receipt says OBSERVED means the diagnostic matched the known-clean and seeded fixtures. The offline fake always returns the intended mismatch, while its only well-shaped negative case removes command events, so the current tests cannot reject this false-positive path. This leaves the Phase-2 vacuity/intended-work diagnostic contract open and could send a semantically defective installed reviewer into the independent review.
- Proposed correction: Require each seeded probe to produce an independently reproduced blocker tied to the controlled oracle: the plan's required value, the fixture's actual value, and the probe-specific source/proof marker. Add an offline fake mode that emits valid command evidence and confirmed unrelated Major findings, and assert that the diagnostic remains INCOMPLETE.
### Minor · Phase 2 start identity is duplicated with contradictory status

- Seats: 2 (simplicity)
- Location: `docs/port/2026-09-08-red-team-implementation-ledger.md:115`
- Evidence: The newly added Phase 2 initialization records the exact starting commit as 68c6705bfe9515a4f6be9f46f725e29e71cd085d, while the ledger's summary still says "Phase 2 starting commit: pending." The local-delivery receipt also records the exact commit. This duplicated state forces handoff consumers to determine which occurrence is authoritative and leaves a required contemporaneous ledger field visibly stale.
- Proposed correction: Replace the summary's pending value with the recorded Phase 2 start SHA, or make the summary refer to the single authoritative initialization entry.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
