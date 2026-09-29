# Snipe report

## Scope

- Committed scope: range 5b442a28..8ccd4e8bfb38613d15bc0fbc422cd0936654a004
- Revision: `8ccd4e8bfb38613d15bc0fbc422cd0936654a004` (base `5b442a28f4063b8f947a582c749842dd0808d4b2`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `medium` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict request_changes; confidence high
- Seat 2 · simplicity: completed — validated; verdict approve; confidence high
- Seat 3 · plan-faithfulness: completed — validated; verdict request_changes; confidence high
- Seat 4 · cascading-impact: completed — validated; verdict request_changes; confidence high

## Findings

### Major · Escape guard still misses target object-database mutations — would block in a phase

- Seats: 1 (correctness)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:37`
- Evidence: The repaired snapshot hashes worktree contents and most Git metadata, but metadataIdentity explicitly omits the entire top-level objects directory. A probe or other action can therefore add an unreferenced object with git hash-object -w, or change mutable objects/info state such as alternates, without changing HEAD, status, refs, contentSha256, or metadataSha256. The before/after snapshots remain equal, no target-state-changed gap is emitted, and an otherwise valid passing probe can produce CLEARED despite an unauthorized target mutation. This is same-class residue from the prior target-state guard repair and contradicts Phase 1 Task 1's requirement that target mutations remain visible and incomplete. The target-guard tests cover configuration, another ref, and ignored-file contents, but not the deliberately excluded object-store branch.
- Proposed correction: Include object-database state in the before/after identity, including loose-object additions and mutable objects/info and pack metadata, while avoiding execution of repository-configured commands. Add discriminating tests that write a dangling object and alter objects/info/alternates, and require both cases to emit target-state-changed and finish INCOMPLETE.
### Major · Model-controlled provenance can hide a confirmed blocker from the canonical gate — would block in a phase

- Seats: 4 (cascading-impact)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:217`
- Evidence: The runner validates required finding fields but permits arbitrary additional fields, and after confirmation it removes only `adjudicated` before forwarding each finding. The unchanged canonical consumer `allFindings()` constructs `{ probe: r.probe, probeStatus: r.status, ...f }`, so a finding-supplied `probeStatus` overwrites the gate-owned status. A probe can therefore return a valid `status: "fail"` Major finding containing `probeStatus: "pass"`; the runner independently confirms it, but `classify()` then excludes it from blockers because its projected `probeStatus` is `pass`. With no other findings or gaps, the downstream verdict becomes `CLEARED`, silently losing an independently reproduced Major defect. The inspected seeded-defect and mixed-confirmation tests use only expected finding keys and cannot reject this projection collision.
- Proposed correction: Make gate-owned provenance authoritative. Either whitelist the allowed model finding fields before storing them, rejecting unexpected keys such as `probe` and `probeStatus`, or change the canonical projection so runner-derived `probe` and `probeStatus` are assigned after spreading the finding. Add a runner-level regression with a confirmed Major finding carrying `probeStatus: "pass"` and require the final verdict to remain `BLOCKED`.
### Major · Retries run before later probes and confirmations receive their mandatory initial attempts — would block in a phase

- Seats: 3 (plan-faithfulness)
- Location: `adapters/codex/skills/red-team/assets/red-team-runner.mjs:197`
- Evidence: The original plan requires every selected probe and each applicable confirmation to receive its initial attempt before retries. However, attempt() exhausts retry=0 through settings.retries for one probe or confirmation before returning. The outer probe loop therefore produces an order such as probe-A initial, probe-A retry, probe-B initial; the per-finding confirmation loop similarly retries candidate A before candidate B's initial confirmation. A slow or failed retry can delay later mandatory coverage and cancellation can prevent it entirely. The mapped test named "initial attempts do not consume optional retries; all selected probes attempted" verifies only aggregate counts and the first transport result, so it remains green under this depth-first ordering and cannot reject the contract violation.
- Proposed correction: Schedule retry-zero attempts across all selected probes before scheduling any probe retry. Once candidates are known, likewise schedule every applicable candidate's retry-zero confirmation before confirmation retries. Preserve stable candidate identities and existing raw-attempt ordering, and strengthen the regression to assert the exact dispatch sequence for multiple probes and multiple confirmation candidates.
### Minor · Role evidence has an unused, contradictory formatting path

- Seats: 2 (simplicity)
- Location: `adapters/codex/skills/red-team/assets/red-team-evidence.mjs:194`
- Evidence: `formatIssueEvidence` is exported as a role-prompt formatter and serializes the entire evidence object, including `pages[].raw`. The repaired runner deliberately avoids that representation, independently constructs a page-free projection, measures it repeatedly during intake, then constructs it again for dispatch. Pinned-tree search shows the formatter has no production consumer and is exercised only by a phrase-presence assertion. This leaves two representations claiming the same responsibility, one of which would reintroduce the raw-page duplication that the cycle-2 repair removed.
- Proposed correction: Keep one role-evidence projection. Either remove the unused formatter and its self-referential test, or make a single page-free projection helper authoritative and reuse it for both the aggregate bound and prompt construction.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
