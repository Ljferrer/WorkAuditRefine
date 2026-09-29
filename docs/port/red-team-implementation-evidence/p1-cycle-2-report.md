# Snipe report

## Scope

- Committed scope: range 5b442a28..abf06d76e421e67d257ad812ee45ac6e53daa45a
- Revision: `abf06d76e421e67d257ad812ee45ac6e53daa45a` (base `5b442a28f4063b8f947a582c749842dd0808d4b2`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `medium` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · plan-faithfulness: completed — validated; verdict request_changes; confidence high
- Seat 4 · cascading-impact: completed — validated; verdict request_changes; confidence high

## Findings

### Major · Aggregate evidence overflow discards already-fetched raw issue evidence — would block in a phase

- Seats: 1 (correctness)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:173`
- Evidence: `collectIssueEvidence` permits up to 16 MiB of retained source bytes, but the runner then bounds `JSON.stringify(issues)`, which includes both parsed fields and the duplicated raw `pages`. Individually valid issue and comment responses can therefore exceed the runner's representation bound even when the prompt projection (which removes `pages`) is within bounds. The assertion occurs inside the collection loop and before `issue-evidence.json` is written; the outer catch converts it to a generic incomplete runtime gap, so all raw pages already fetched in that run disappear from the evidence directory. This violates the Phase 1 requirement to preserve source identities and raw evidence on failure paths. The inspected aggregate-bound test exercises only `collectIssueEvidence`, not this downstream runner consumer.
- Proposed correction: Always persist collected raw issue evidence before handling an aggregate projection limit. Apply the bound to the exact role-prompt projection rather than the raw-plus-parsed representation, account across issues using a remaining budget, and record an explicit source-intake gap for excluded content without discarding prior pages. Add a runner-level test with individually valid pages whose raw representation exceeds the prompt projection bound and assert the pages remain in `issue-evidence.json`.
### Major · Durable anchor normalization leaks the live target back into confirmation prompts — would block in a phase

- Seats: 4 (cascading-impact)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:199`
- Evidence: `attempt()` rewrites every accepted probe result's `read_anchor.resolved_path` from the isolated clone to the original `planFile` before returning it. The per-candidate loop then passes that result as `prior`, and the next `attempt()` serializes it into the independent confirmer's prompt alongside the new clone-local `scope`. The confirmer therefore receives two conflicting plan paths: the fresh isolated scope and the mutable live checkout embedded in `prior.read_anchor`. Copying the prior anchor makes confirmation fail validation and turns coverage INCOMPLETE; reading source from the disclosed live checkout while returning the required clone anchor can be accepted because validation attests only the plan anchor, contaminating supposedly fresh-state confirmation. The operative-scope test checks `ctx.scope` but never checks `ctx.prior` or the serialized prompt, so this downstream projection survives the cycle-1 repair.
- Proposed correction: Keep the durable normalized result separate from the clone-local confirmation projection. Before serializing `prior`, replace its anchor with the current isolated plan identity, or defer normalization until all confirmations finish. Add a confirmation-prompt regression asserting that neither `prior` nor the serialized operative prompt contains the original checkout path, while retained evidence still records the original target identity.
### Major · Target inspection and provisioning can execute repository-configured commands outside the probe sandbox — would block in a phase

- Seats: 3 (plan-faithfulness)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:18`
- Evidence: The Phase 1 contract requires actual authority-boundary validation and confines executed proofs to disposable isolated environments without outward actions. However, red-team-runner.mjs constructs gitEnv by deleting every GIT_* variable, including any inherited safety settings, and its git helper disables only hooks. snapshotTarget then invokes `git status` without disabling `core.fsmonitor`; a target repository can configure that setting as an executable, which Git may run before the initial snapshot while the coordinator has the elevated host access prescribed by host.md. Such a command can write outside the target or act outwardly, and an external write is invisible to the before/after target comparison. Provisioning also performs checkout with user/system Git configuration still active, leaving configured external filters in the pre-sandbox path. This is not merely hypothetical project style: the pinned Snipe consumer explicitly sets `core.fsmonitor=false`, and its inspected regression test verifies that scope capture does not execute a repository-configured fsmonitor command. The new runner neither reuses that containment nor tests the equivalent boundary.
- Proposed correction: Run every coordinator-owned Git operation under a purpose-built fail-closed Git environment that preserves or establishes the repository-inspection protections, including disabling fsmonitor, hooks, prompts, lazy fetching, optional locks, recursive submodules, and unsafe protocols as applicable. Isolate user/system configuration for provisioning so checkout cannot invoke configured external filters. Add a red-team regression using a repository-configured fsmonitor marker and applicable checkout-filter control, asserting no command executes and no outward state changes.
### Minor · A rejected oversized artifact incorrectly consumes the budget for later artifacts

- Seats: 1 (correctness)
- Location: `adapters/codex/skills/red-team/assets/red-team-evidence.mjs:177`
- Evidence: The linked-artifact loop increments `retainedBytes` before checking the total bound. When one artifact exceeds the remaining budget, it is marked unread but its bytes remain charged; every later artifact is then also marked unread even when it would fit. The run remains incomplete, but its evidence status is factually wrong and usable later evidence is withheld from probes.
- Proposed correction: Compute the candidate artifact size first, reject it without changing `retainedBytes` when it does not fit, and increment the counter only after retaining it. Test an oversized artifact followed by a small valid artifact.
- Disposition: absorb (classification only)
### Minor · Aggregate prompt bound measures evidence that is deliberately excluded from prompts

- Seats: 2 (simplicity)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:173`
- Evidence: runRedTeam rejects when JSON.stringify(issues) exceeds MAX_PROMPT_BYTES, but that representation contains both parsed evidence and the retained raw pages. Prompt construction subsequently removes pages before transport. A valid intake can therefore be rejected solely because the same source text exists in both representations, even when the actual role payload is within the transport bound. The retained mutation proves that some aggregate bound exists, but not that it measures the transported projection.
- Proposed correction: Construct the page-free role projection once, apply MAX_PROMPT_BYTES to that projection, and reuse it when building prompts. Keep the evidence module's independent retained-raw-byte bound for archival intake.
- Disposition: absorb (classification only)
### Minor · Host instructions simultaneously forbid and advertise a capacity option

- Seats: 2 (simplicity)
- Location: `adapters/codex/skills/red-team/references/host.md:11`
- Evidence: The same request-description paragraph says capacity is recorded rather than configurable, then lists capacity among optional settings. The runner explicitly rejects every request containing capacity before forcing settings.capacity to 1. An operator following the latter instruction receives an avoidable initialization refusal. Existing structure tests inspect other host-guidance phrases but do not bind this repaired interface.
- Proposed correction: Remove capacity from the optional request fields and state that the runner records the fixed sequential value automatically.
- Disposition: absorb (classification only)
### Minor · Host instructions still advertise a capacity option that the repaired runner rejects

- Seats: 1 (correctness)
- Location: `adapters/codex/skills/red-team/references/host.md:10`
- Evidence: The repaired host reference first says probes are fixed sequentially and capacity is not configurable, but the same paragraph still lists `capacity` among optional request fields. The runner asserts that `request.capacity` must be absent, so a request constructed according to the latter instruction fails before creating run evidence.
- Proposed correction: Remove `capacity` from the optional request fields and state that the emitted run settings record the fixed capacity of one.
- Disposition: absorb (classification only)
### Minor · Host request documentation still advertises the removed capacity option

- Seats: 4 (cascading-impact)
- Location: `adapters/codex/skills/red-team/references/host.md:11`
- Evidence: The repaired runner rejects every request containing `capacity` with `capacity is fixed sequentially; omit capacity`, but `references/host.md` first says capacity is not configurable and then lists `capacity` among optional request fields that set bounded runtime behavior. A downstream caller following that list receives a hard assertion before the evidence directory and guarded runtime record are created. This is residue from the accepted cycle-1 capacity correction, which explicitly required removing the no-op request option and its documentation.
- Proposed correction: Remove `capacity` from the optional request-field list; retain only the statement that execution is sequential and capacity is recorded internally.
- Disposition: absorb (classification only)
### Minor · The accepted capacity cleanup left contradictory request guidance

- Seats: 3 (plan-faithfulness)
- Location: `adapters/codex/skills/red-team/references/host.md:11`
- Evidence: The repair ledger says capacity is fixed sequentially and the no-op request option was removed. The runner now rejects every request containing `capacity`, but host.md first says capacity is not configurable and then lists `capacity` among optional request fields. A user following the latter sentence receives a hard validation refusal before any run or evidence directory is created. This is same-class residue from the accepted clarity cleanup and contradicts the Phase 1 requirement to expose capacity visibly without offering a no-op setting.
- Proposed correction: Remove `capacity` from the optional request-field list and keep the single statement that sequential capacity is recorded but not configurable.
- Disposition: absorb (classification only)
### Minor · Untrusted confirmation fields can overwrite the runner-assigned candidate identity

- Seats: 2 (simplicity)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:220`
- Evidence: validateResult permits extra confirmation fields, and the saved artifact is assembled as {candidateId: finding.candidateId, ...confirmed}. If a confirmation returns its own candidateId, the spread overwrites the runner's stable identity in confirmation-*.json. Gate projection still follows the loop index, so the evidence artifact can identify a different candidate than the finding actually transformed. The mixed-finding test checks identities delivered to dispatch but never inspects the saved artifact or supplies a conflicting returned identity.
- Proposed correction: Make the runner-owned identity authoritative by spreading confirmed first and assigning candidateId last, or reject candidateId in confirmation output; add an artifact assertion with a conflicting returned value.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
