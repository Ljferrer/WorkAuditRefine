---
name: segmented-land-in-band-marker-consumed-without-its-contracted-status-pairing
description: "Consume an in-band marker with its contracted status pairing, and wire it onto every dispatch site the docs claim it covers."
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

# A new in-band marker's consumer can trust the field alone and skip the status it's contracted to ride

**Code-verified** on `dev/2026-08-25-engine-reliability-and-filing-fidelity` (phase 6, task 6.1)
and re-confirmed against the live tree.

Task 6.1 added a segmented-land mechanism: when a land dispatch's gate outruns the tool
timeout, the refiner returns an in-band `land_segment: 'incomplete'` marker riding
`status: 'error'`. The contract is stated verbatim on four surfaces: the `MergeResult`
`land_segment` field comment, `agents/war-refiner.md`'s segmented-land bullet,
`skills/war/references/schemas.md`'s row, and the dispatched `segmentedLandClause` itself. The
engine then performs a bounded re-dispatch loop.

**Gap 1: the consumer doesn't check the status half of the pair.** In
`skills/war/assets/workflow-template.js` the segmented-land loop reads:
```
while (landResult && landResult.land_segment === 'incomplete' && landSegments < roundLimit) {
```
There is no `landResult.status === 'error'` conjunct. A refiner that emits the marker beside any
other status (e.g. `status: 'landed'` after actually completing, a plausible LLM slip when it
copies the segmented-land template post-hoc) makes the engine discard a genuinely successful
land result and re-dispatch a full land, up to `roundLimit` times, whose CAS push already
succeeded.

**Gap 2: the marker is wired onto only ONE of three land dispatch sites.** `segmentedLandClause`
is appended to the *initial* `landPrompt` only. The `ENVIRONMENT-PROCEED re-land` and
`BASELINE-PROCEED re-land` dispatches build their own prompts with no segmented-land clause and
never test their results for `land_segment`, despite running the SAME full gate under the SAME
tool-timeout envelope. They are the more timeout-exposed sites, since a re-land already consumed
one full gate cycle before it runs. Degradation there is safe (a marker-bearing error result
falls to the existing terminal `held:land-failed` arm), just silently unprotected rather than
segmented-land-surviving.

**Why this matters beyond this instance:** this is the *sibling* pattern to
[[normalizing-in-band-floor-route-marker-can-flip-hard-escalation-to-soft]] from the same phase.
That lesson is about a marker's *status* being load-bearing when a helper normalizes it away.
This one is about a marker's *presence* being trusted without its contracted status co-occurring,
and about a new dispatch-site marker being wired onto the first call site touched, not audited
against every site the doc prose claims to cover. Both are instances of: **when a new field rides
an existing status as an in-band discriminator, grep every consumer of that field for whether it
also checks the status half, and grep every doc-claimed dispatch site for whether the producing
code actually reaches it.**

**Disposition at land:** both gaps were filed as Minor/Nit `follow-up` / `note` findings, not
fixed. They are still present in the live engine.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`,
the `while (landResult && landResult.land_segment === 'incomplete' ...)` loop, the
`segmentedLandClause` build and its single append onto `landPrompt`; the `ENVIRONMENT-PROCEED
re-land` and `BASELINE-PROCEED re-land` prompt builders carry no equivalent clause.

**Related:** [[normalizing-in-band-floor-route-marker-can-flip-hard-escalation-to-soft]], the
merge-family sibling of this land-family gap, same campaign.
