# Snipe report

## Scope

- Committed scope: merge-base ba08a77f812fe3e00fdf21aa5114a3f00f90df4b...6497e0cefaff7cdd3f4d52006111500e793dbc10
- Revision: `6497e0cefaff7cdd3f4d52006111500e793dbc10` (base `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict request_changes; confidence high
- Seat 3 · cascading-impact: completed — validated; verdict request_changes; confidence high
- Seat 4 · test-fidelity: completed — validated; verdict request_changes; confidence high

## Findings

### Major · A post-push merge-dispatch death can silently land content recorded as unmerged — would block in a phase

- Seats: 1 (correctness)
- Location: `skills/war/assets/workflow-template.js:4092`
- Evidence: Each merge prompt instructs the refiner to merge and push the integration branch before returning. If the dispatch dies after that push, deathOf() routes directly to envDied or the polish/terminal discard arm without inspecting the integration ref. With another task already recorded landed, env-died remains soft and the phase land subsequently publishes the advanced integration branch, including the supposedly unmerged task. The ordinary task is omitted from landed and from its gate-audit bookkeeping; polish and terminal findings can be demoted or carried as if their approved commit never merged even though it lands. The new tests at workflow-template.test.mjs:11956 and :17522 only throw before simulating any integration-ref mutation, so their assertions that the task stayed unmerged or the polish was discarded cannot reject this post-push failure mode.
- Proposed correction: Before classifying a merge-site dispatch death, reconcile the serialized integration ref against the task, polish, or terminal branch. If the branch is already an ancestor of the integration tip, route through the corresponding successful-merge bookkeeping; if it is not, retain env-died/discard handling. If the state cannot be determined reliably, hold rather than soft-land an ambiguous integration tip.
### Major · D21 acceptance tests leave distinct dispatch-death consumers unexercised — would block in a phase

- Seats: 4 (test-fidelity)
- Location: `skills/war/assets/workflow-template.test.mjs:11836`
- Evidence: The pinned D21 fixtures exercise initial merge and land dispatches, selected gate-audit sites, and a generic source census, but they never inject an infrastructure death into the pin-mismatch in-lock re-audit, floor re-audit/re-merge, environment/baseline re-merge or re-land, integrated-tip gate-audit, or sweep/terminal merge consumers. The `auditRound census` only checks that `died` appears in each destructuring. Deleting the `if (rbDied)` branch after the pin-mismatch audit, for example, preserves that token and leaves the census green while converting the dead seat into a hard re-audit escalation; deleting the corresponding floor-re-audit branch similarly permits an infrastructure failure to be reported as a content failure. The suite therefore cannot reject violations of the declared “every dispatch is classified” invariant at these alternate paths.
- Proposed correction: Add table-driven `runPhase` cases for each semantically distinct untested death consumer. Inject an `INFRA_DEATH_RE`-matching throw at the in-lock and floor re-audits, floor/environment/baseline re-merges, both re-lands, integrated-tip gate audit, and phase-close merge paths; assert the exact site-named soft or held classification and explicitly reject `audit-blocked`, `done-unmet`, or generic hard escalation outcomes.
### Major · One valid seat conflict neutralizes unrelated finding-less blocking seats — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `skills/war/assets/workflow-template.js:1984`
- Evidence: `seatConflictsOf` verifies each Critical/Major finding it encounters but never requires every `request_changes` seat to contribute a paired blocker. Once any other seat supplies a valid conflict pair, the loop at the post-rebuttal consumer changes every request_changes verdict to approve, including unrelated seats with no Critical/Major finding. The pinned test at lines 17720-17745 explicitly demonstrates a three-seat panel where a finding-less cascading-impact seat still dissents, yet the task is recorded approved, merged, and landed. This lets one conflict erase independent unresolved dissent and breaks the declared unanimous-approval boundary.
- Proposed correction: Require every request_changes seat to have at least one blocking finding and require every such finding to be paired before classifying the panel as a seat conflict. Alternatively neutralize only participating seats and leave any unpaired or finding-less blocking seat on the existing escalation path.
### Major · Pin-transfer success modes are trusted without their required evidence — would block in a phase

- Seats: 3 (cascading-impact)
- Location: `skills/war/assets/workflow-template.js:312`
- Evidence: PIN_TRANSFER requires only `status`; every evidence field is optional. The `transferred` consumer accepts the status without proving that both patch IDs are non-empty and equal or that `rebased_tip` is usable, thereby skipping the in-lock full-panel re-audit. The `already_upstream` consumer checks only positive contradictions, so omitted `dispatch_base`, `rebased_tip`, or pre-rebase patch evidence does not cause refusal; it can call `landMerged` and skip the merge-task dispatch entirely. The pinned test at lines 14489-14503 even accepts an `already_upstream` result with no `dispatch_base`. A terse or incomplete refiner result can therefore record unmerged work as merged or transfer approval across an unverified rebase.
- Proposed correction: Conditionally require and validate the evidence for each success status at both schema and consumer boundaries. Accept `transferred` only with a usable rebased tip and non-empty equal patch IDs; accept `already_upstream` only with usable distinct rebased/base SHAs, a non-empty pre-patch ID, empty post-patch ID, and non-empty matched commits. Route missing or inconsistent evidence to a full re-audit or the existing fail-closed outcome.
### Major · The segmented wrapper does not own the gate-log contract it tells every prompt to read — would block in a phase

- Seats: 2 (simplicity)
- Location: `skills/war/assets/workflow-template.js:4344`
- Evidence: `segmentedMerge` appends `PARTIAL_LOG_RULE` to every merge dispatch, and that rule directs the continuation to read the stamped gate log "named above." Initial, floor-retry, and environment-proceed prompts supply that antecedent through `gateCaptureClause`; the baseline-proceed prompt at the named locator does not supply any gate-log path or stamp instruction before entering `segmentedMerge`. Consequently, a baseline-proceed gate that returns `gate_segment:'incomplete'` has no deterministic artifact from which its continuation can resume and can repeatedly rerun or exhaust `roundLimit` instead of completing. The existing build-loop test inspects the baseline-proceed prompt but asserts only `run_in_background`, the marker, and the generic read rule; the stamp test checks only the initial merge prompt. This is a demonstrated drift caused by distributing one protocol across duplicated prompt fragments. It would block in a phase because a supported baseline route does not satisfy the new timeout-survival contract.
- Proposed correction: Give the segmented-merge abstraction one shared gate-log path/stamp clause used by every segmented merge site, while keeping fully-green post-merge capture semantics separate. Extend the existing merge-build loop to require the deterministic `.war/gate-<task>.log` path and `GATE_LOG_STAMP` on baseline-proceed as well.
### Minor · Seeded phase-close rows bypass the queue registry and can be fixed twice

- Seats: 3 (cascading-impact)
- Location: `skills/war/assets/workflow-template.js:1199`
- Evidence: The seededPhaseClose loop pushes rows into phaseCloseQueue before queuedKeys is declared, and the later registry deliberately leaves those rows unstamped. If a re-audit re-raises a seeded finding, `routeReauditMinors` cannot see that it is already queued and may enqueue it for ace re-entry or file it. After a successful re-entry fix, the original seeded row still reaches the phase-close sweep, which can apply and record the same finding again. The direct initial-routing duplicate check does not cover this later re-audit path.
- Proposed correction: Register every pre-existing phaseCloseQueue row in queuedKeys immediately when the registry is created, or move registry initialization before the seeded drain. Add a fixture where a seeded row is re-raised by an ace re-audit and confirm it is corroborated onto the single queued survivor.
- Disposition: absorb (classification only)
### Minor · The empty-key identity adds a lossy custom hash where the serialized content is already the key

- Seats: 2 (simplicity)
- Location: `skills/war/assets/workflow-template.js:1415`
- Evidence: `remintKey` feeds an internal-only set key, yet it passes the distinguishing tuple through a hand-written 32-bit `contentHash`. This adds an algorithm and permits distinct fileless/titleless findings to collide and be treated as a re-mint, contrary to the stated content-distinct identity property. Appending the existing `JSON.stringify` result directly is shorter and collision-free for the represented tuple. The test already checks the behavioral equality and inequality properties, but additionally pins the `contentHash(` implementation, preventing that simpler representation.
- Proposed correction: Remove `contentHash` and append the serialized `contentTextOf`/locator tuple directly on the degenerate arm. Retain the behavioral key tests and remove assertions requiring the hash implementation.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
