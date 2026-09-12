# Snipe report

## Scope

- Committed scope: merge-base 668e4ff990f1c689fcf9710768c3d73c2601920c...3d1f218ba86f91d899c7800227c2ed061d892117
- Revision: `3d1f218ba86f91d899c7800227c2ed061d892117` (base `668e4ff990f1c689fcf9710768c3d73c2601920c`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence high
- Seat 2 · cascading-impact: completed — validated; verdict approve; confidence high
- Seat 3 · test-fidelity: completed — validated; verdict approve; confidence high
- Seat 4 · security: completed — validated; verdict approve; confidence high

## Findings

### Minor · Bare war-review selection still assumes run IDs contain dates

- Seats: 2 (cascading-impact)
- Location: `skills/war-review/SKILL.md:50`
- Evidence: The updated selector correctly says new run IDs are UUIDs, but its default-selection rule still breaks equal-mtime ties by the "runId date." UUID run IDs contain no date, and launch-identity.md now explicitly separates plan/date metadata from opaque identity. When manifest mtimes tie, the downstream reviewer therefore has no executable tie-break rule and may select the wrong run.
- Proposed correction: Replace the runId-date tie-break with a deterministic rule valid for both UUID and legacy IDs, such as parsed manifest startedAt followed by lexical runId/file-name ordering.
- Disposition: absorb (classification only)
### Minor · UUID migration test omits the review selector's date-dependent tie-breaker

- Seats: 3 (test-fidelity)
- Location: `skills/war/assets/skill-doc-contracts.test.mjs:4426`
- Evidence: The pinned `skills/war-review/SKILL.md` now says new run IDs are UUIDs, but its bare-run selection still breaks equal-mtime ties by the `runId` date, which a UUID does not contain. The new launch-surface contract test checks five WAR files but omits `skills/war-review/SKILL.md`, so this incompatible downstream behavior survives the acceptance suite. Equal-mtime manifests can therefore be selected using an undefined procedure.
- Proposed correction: Change the review selector to a format-independent deterministic tie-breaker, such as manifest `startedAt` followed by lexical `runId`, and include `skills/war-review/SKILL.md` in the UUID migration contract test with a negative assertion against date-derived run-ID ordering.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.
