---
name: segmented-land-in-band-marker-consumed-without-its-contracted-status-pairing
description: "A consumer of an in-band marker must also check the status it is contracted to ride, and every dispatch site the docs claim must carry the marker clause"
metadata:
  node_type: memory
  type: project
  keywords:
    - land_segment
    - segmented-land
    - in-band marker
    - status pairing
    - FLOOR_STATUSES retry-loop idiom
    - land dispatch tool timeout
    - environment-proceed
    - baseline-proceed
    - re-land
    - workflow-template.js
    - unvalidated contract field
    - floor_route
  provenance: code-verified
  slug: segmented-land-in-band-marker-consumed-without-its-contracted-status-pairing
  phase: 2026-08-25-engine-reliability-and-filing-fidelity/phase-6 (task 6.1)
  tags:
    - war
    - engine
    - workflow-template.js
    - gotcha
    - contract-validation
  created: 2026-08-26
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-26T20:32:25.136Z
---

# An in-band marker's consumer must check its contracted status, and every claimed site must carry it

**Rule:** when a new field rides an existing status as an in-band discriminator, grep every
consumer of that field for whether it also checks the status half, and grep every doc-claimed
dispatch site for whether the producing code actually reaches it. A new marker tends to be trusted
on its own, and wired onto the first call site touched rather than every site the doc prose claims.

**Context:** task 6.1 of `2026-08-25-engine-reliability-and-filing-fidelity` added segmented land:
when a land dispatch's gate outruns the tool timeout, the refiner returns an in-band
`land_segment: 'incomplete'` marker riding `status: 'error'`. The contract is stated verbatim on
four surfaces: the `MergeResult` `land_segment` field comment, `agents/war-refiner.md`'s
segmented-land bullet, `skills/war/references/schemas.md`'s row, and the dispatched
`segmentedLandClause` itself. The engine then performs a bounded re-dispatch loop.

**Instance 1: the consumer didn't check the status half of the pair.** The loop read:
```
while (landResult && landResult.land_segment === 'incomplete' && landSegments < roundLimit) {
```
There was no `landResult.status === 'error'` conjunct. A refiner that emits the marker beside any
other status (e.g. `status: 'landed'` after actually completing, a plausible LLM slip when it
copies the segmented-land template post-hoc) makes the engine discard a genuinely successful
land result and re-dispatch a full land, up to `roundLimit` times, whose CAS push already
succeeded.

**Instance 2: the marker was wired onto only ONE of three land dispatch sites.**
`segmentedLandClause` was appended to the *initial* `landPrompt` only. The `ENVIRONMENT-PROCEED
re-land` and `BASELINE-PROCEED re-land` dispatches built their own prompts with no segmented-land
clause and never tested their results for `land_segment`, despite running the SAME full gate under
the SAME tool-timeout envelope. Degradation there was safe (a marker-bearing error result falls to
the terminal `held:land-failed` arm), just silently unprotected.

**Disposition at land:** both gaps were filed as Minor/Nit `follow-up` / `note` findings, not
fixed.

**RESOLVED (#1797/#1805):** `workflow-template.js` now routes every land dispatch site through one
`segmentedLand` helper, which re-dispatches only when `status === 'error'` and
`land_segment === 'incomplete'` both hold, and is applied to the initial land and both re-lands.

**Related:** [[normalizing-in-band-floor-route-marker-can-flip-hard-escalation-to-soft]], the
merge-family sibling from the same phase: there a marker's *status* was load-bearing when a helper
normalized it away; here the marker's *presence* was trusted without its status.

> archived 2026-09-04: resolved — moved to archive
