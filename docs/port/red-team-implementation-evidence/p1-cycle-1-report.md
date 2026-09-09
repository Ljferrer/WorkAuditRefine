# Snipe report

## Scope

- Committed scope: range 5b442a28..616933755e5425f35018c94551ac6e7511924c29
- Revision: `616933755e5425f35018c94551ac6e7511924c29` (base `5b442a28f4063b8f947a582c749842dd0808d4b2`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `medium` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict request_changes; confidence high
- Seat 3 · plan-faithfulness: completed — validated; verdict approve; confidence high
- Seat 4 · cascading-impact: completed — validated; verdict request_changes; confidence high

## Findings

### Major · Complete issue evidence is passed through an argv-sized prompt — would block in a phase

- Seats: 1 (correctness)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:87`
- Evidence: collectIssueEvidence permits individual responses up to 8 MiB, as many as 100 pages, and unbounded caller-supplied linked-artifact content. runRedTeam embeds the complete resulting object—including duplicated raw pages—into the prompt, and dispatchCodex passes that prompt as one command-line argument. The inspected host's ARG_MAX is 1 MiB, so inputs explicitly accepted by the evidence API can make spawn fail with E2BIG before any probe runs. This prevents the required full-body/comment/artifact review for sufficiently large but valid evidence. Existing transport tests use only tiny prompts.
- Proposed correction: Transport the prompt/evidence through a non-argv channel supported by the runner, such as stdin or a scoped immutable evidence file in the isolated environment. Establish an explicit total evidence bound that fails visibly rather than relying on OS argv limits, and add a regression whose evidence exceeds argv capacity.
### Major · Confirmation is all-or-nothing for a probe containing multiple findings — would block in a phase

- Seats: 1 (correctness)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:68`
- Evidence: The initial result schema permits multiple findings, and the confirmation prompt requires each candidate to be tested, but validateResult accepts only one reproduced boolean for the entire probe. runRedTeam then either retains every finding or demotes every finding to Minor. If a confirmer reproduces one blocker but refutes another, no truthful result is representable: reproduced=false hides the real blocker, while reproduced=true preserves the false positive. The tests exercise only one finding per probe, so this mixed-outcome path is uncovered.
- Proposed correction: Give each candidate finding a stable identity and require a separate confirmation outcome for each one. Apply reproduction, refutation, and missing-confirmation handling per finding; any absent or unusable required outcome must keep coverage incomplete. Add a regression with one reproduced and one refuted finding.
### Major · Confirmation is all-or-nothing for a probe containing multiple findings — would block in a phase

- Seats: 4 (cascading-impact)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:68`
- Evidence: A probe result may contain multiple findings, but validateResult and the confirmation prompt accept only one reproduced boolean and one note. The consumer then applies that scalar outcome to the entire findings array: reproduced=true retains every candidate as confirmed, while reproduced=false demotes every candidate to Minor. Mixed confirmation outcomes therefore cannot be represented. A confirmer reproducing one finding can leave unrelated false blockers in the canonical gate, while refuting one finding can demote a separately reproduced Critical/Major defect and permit a false cleared result. The inspected confirmation tests contain only one finding and do not exercise this downstream projection.
- Proposed correction: Give every candidate a stable identifier and require a per-finding confirmation result, or dispatch one independent confirmation per finding. Project reproduced/refuted status individually and treat missing candidate coverage as INCOMPLETE. Add a mixed two-finding regression covering both directions.
### Major · Every known-operator comment is promoted to an operator ruling — would block in a phase

- Seats: 4 (cascading-impact)
- Location: `adapters/codex/skills/red-team/assets/red-team-evidence.mjs:152`
- Evidence: collectIssueEvidence filters comments solely by author login and stores every match under operatorRulings with precedence over conflicting body text. This contradicts the adjacent contract that a ruling must not be inferred from authorship alone. The runner passes this named structure directly to probes and confirmers, whose guidance says to preserve operator rulings. The retained #2097 sample demonstrates the impact is not hypothetical: several comments from a known operator are measurement reports and narrative updates rather than explicit decisions, yet this projection would label all of them rulings. A downstream reviewer can consequently treat commentary or suggestions as binding authority and reverse the plan incorrectly. Existing tests cover an explicitly worded ruling and unknown-author association, but not a non-ruling comment from a configured operator.
- Proposed correction: Preserve matching comments as operator-authored evidence or ruling candidates without granting precedence. Require the Lead to identify an explicit decision with cited text before representing it as a ruling. Add a known-operator suggestion or measurement comment as the negative control.
### Major · Raw issue responses are redundantly embedded in every subprocess argument — would block in a phase

- Seats: 2 (simplicity)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:87`
- Evidence: `collectIssueEvidence` retains each response twice: as parsed body/comments and as `pages[].raw`. `runRedTeam.attempt` then serializes the entire issue object into every probe and confirmation prompt, and `dispatchCodex` passes that prompt as one argv element. The accepted limits permit an individual response up to 8 MiB and up to 100 comment pages, while the inspected host reports an aggregate `ARG_MAX` of 1,048,576 bytes. A valid complete intake can therefore make `spawn` fail with an argument-size error before any probe runs. The raw pages are necessary as retained evidence, but duplicating them in every role prompt is not; it makes the simplest H2 path unusable for sufficiently large issues.
- Proposed correction: Persist the full raw intake in `issue-evidence.json`, but build a bounded prompt projection containing the parsed body/comments, rulings, link statuses, identities/checksums, and gaps without `pages[].raw`. Use a prompt transport that is not constrained by one command-line argument for the remaining complete content, after verifying the supported Codex CLI interface. Add a fixture whose accepted intake exceeds the host argv limit and proves an initial attempt is still dispatched.
### Major · Target-state guard misses prohibited changes and can still return CLEARED — would block in a phase

- Seats: 1 (correctness)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:21`
- Evidence: snapshotTarget records worktree content, status, HEAD, the index, and only refs/heads plus refs/tags. It does not cover Git config, remote/stash/notes or other refs, worktree metadata, or content changes to an existing ignored file. For example, adding a remote changes the target's Git configuration without changing any recorded field; changing the contents of an existing ignored file also leaves the snapshot unchanged. Consequently the before/after equality check can miss an unauthorized target mutation and emit a clean verdict, contrary to the explicit state-preservation and escape-detection invariant. The existing foreign-mutation test changes refs/heads only and cannot reject these cases.
- Proposed correction: Extend the target identity to cover relevant common/worktree Git metadata, all refs, configuration, and hashed ignored-file state without exposing contents. Add discriminating mutations such as git remote configuration, a non-head ref, and an existing ignored file, and require each to force INCOMPLETE.
### Major · The isolated probe scope still names the mutable target repository — would block in a phase

- Seats: 4 (cascading-impact)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:170`
- Evidence: After provisioning an independent clone, localScope replaces planFile but retains scope.repository from the original target. The actual prompt therefore gives the probe two conflicting roots: it says to work in the isolated clone while structured scope.repository points at the live repository. The read anchor validates only the isolated plan path, so a result can attest that plan while deriving source observations from ignored files or other material in the original checkout that is absent from the pinned clone. Such a result is accepted and fed to confirmation and the canonical gate. Current isolation tests inspect ctx.work but never assert the repository value delivered in scope.
- Proposed correction: Set localScope.repository to isolated.work as well as setting the isolated plan path, and retain the original target identity only in separately labelled provenance. Assert in tests that both probe and confirmation prompts contain no original checkout path in their operative scope.
### Minor · Incompleteness has two competing encodings

- Seats: 2 (simplicity)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:56`
- Evidence: Each runtime gap is converted into a dropped diagnostic marker in the canonical gate input, but the `gate(input, gaps)` wrapper independently overrides `verdict` and `routeUpstream` from the separate `gaps` array. Initial computation supplies both representations, while later re-piping relies on markers alone. This leaves two call conventions capable of disagreeing and tests preserve both instead of one invariant. The repair that introduced diagnostic markers already provides the durable, re-pipe-safe encoding.
- Proposed correction: Make diagnostic dropped markers the sole input affecting canonical coverage and verdict. Retain the detailed `gaps` array only as report metadata, and remove the independent gaps-based verdict and routing branches plus their duplicate test expectation.
- Disposition: absorb (classification only)
### Minor · Recorded code identity covers only the coordinator file

- Seats: 3 (plan-faithfulness)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:140`
- Evidence: `runRedTeam` records `codeSha256` from `red-team-runner.mjs` alone. Run behavior also depends on the canonical gate, evidence-intake module, Codex profile/process helpers, and the probing guidance injected into every role. Those dependencies can change without changing the recorded hash, so the evidence does not fully satisfy Task 1's requirement to retain the code identity responsible for a run.
- Proposed correction: Record a source revision or a small manifest of hashes covering the runner's behavioral imports and delivered probing guidance; Phase 2 may replace this with the packaged artifact identity.
- Disposition: absorb (classification only)
### Minor · The implementation ledger retains contradictory acceptance status

- Seats: 3 (plan-faithfulness)
- Location: `docs/port/2026-09-08-red-team-implementation-ledger.md:37`
- Evidence: The pinned ledger says “All acceptance, package and host observations pending” under Panel accounting, but its later Phase 1 coding-wave entry records 47 passing acceptance tests with preserved evidence. The associated metadata also names `2026-09-08-issue-2097.json` as its snapshot while the committed evidence file is `issue-2097.json`. The hashes and test log themselves check out, but these stale mirrors make the required contemporaneous ledger and source identity internally inconsistent.
- Proposed correction: Mark Phase 1 acceptance as recorded while leaving Phase 2/package/host observations pending, and change the metadata snapshot field to the committed filename.
- Disposition: absorb (classification only)
### Nit · Capacity is exposed as a configurable setting although it can only be one

- Seats: 2 (simplicity)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:13`
- Evidence: `capacity` is accepted from the request, documented as optional, validated, and persisted, but the maximum is hard-coded to 1 and the probe loop never reads it. This creates a public configuration surface with no possible behavioral variation. The ledger's requirement that sequential capacity be visible does not require a no-op request knob.
- Proposed correction: Keep sequential capacity as an internal recorded constant for Phase 1 and remove `request.capacity` plus its optional-setting documentation until concurrency is actually implemented.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
