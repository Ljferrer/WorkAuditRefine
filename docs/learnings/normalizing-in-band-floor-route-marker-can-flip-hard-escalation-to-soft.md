---
name: normalizing-in-band-floor-route-marker-can-flip-hard-escalation-to-soft
description: "Do not normalize an in-band floor route marker at a dispatch site where the raw status is HARD but the normalized name is not; comment why."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - routedMr
    - HARD_ESCALATION_REASONS
    - floor_route
    - in-band route marker
    - budget-uncited
    - no-test
    - environment-proceed
    - baseline-proceed
    - escalation severity
    - ponytail comment
    - workflow-template.js
    - wire status normalization
  provenance: code-verified
  slug: normalizing-in-band-floor-route-marker-can-flip-hard-escalation-to-soft
  phase: 2026-08-25-engine-reliability-and-filing-fidelity/2.2
  tags: 
    - war
    - engine
    - workflow-template.js
    - escalation
    - gotcha
  created: 2026-08-26
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-26T10:19:41.265Z
---

# Normalizing a floor's in-band route marker at every dispatch site can silently soften a HARD hold

**Code-verified** in `skills/war/assets/workflow-template.js`: the `environment-proceed` (`ep`)
and `baseline-proceed` (`bp`) re-merge dispatch blocks each carry a comment reading
`// ponytail: routedMr is deliberately NOT applied to ep — the un-normalized 'no-test' IS a ...`
(and the `bp` mirror). The pattern below was deliberately fixed and annotated, not left as a gap.

Phase 2 Task 1 wired a new merge-path floor (`assert-budget-raise-cited.sh`) whose exit-1 route
is signaled **in-band**: the refiner returns `status: 'no-test'` (an existing wire status, shared
with the test floor) plus a NEW field `floor_route: 'budget-uncited'` that tells the two producers
apart. The `routedMr()` helper normalizes this pair into an internal status named
`'budget-uncited'` at two dispatch sites (the primary merge and the floor-retry re-merge) so the
floor-retry sub-loop's routing, log, and prompt surfaces name the real tripped floor. Two OTHER
re-merge sites, `environment-proceed` and `baseline-proceed` recovery, **deliberately do not**
apply `routedMr`. The reason: `'no-test'` **is** a member of `HARD_ESCALATION_REASONS`
(`skills/war/assets/land-decision.mjs`), so an un-normalized result at those sites falls through
a generic `else escalated.push({ reason: ep.status })` arm and holds HARD, correctly. If
`routedMr` were applied there too, the reason would become `'budget-uncited'`, **not** a
`HARD_ESCALATION_REASONS` member, and the same `else` arm would push a SOFT escalation instead,
landing the phase minus the offending task silently. The diagnostic cost of leaving it
un-normalized is minor (`detail: ep` still carries `floor_route`), so the correct fix was to leave
the two sites alone and document *why* inline, rather than "fix" the apparent inconsistency.

**Pattern to watch for:** when a new floor's wire status rides an EXISTING status value via a new
discriminator field (rather than widening the status enum, which ADR 0005 forbids for
`HARD_ESCALATION_REASONS`/`KNOWN_LAND_DECISIONS` members), any helper that normalizes that
discriminator into a new internal-only status name changes which `HARD_ESCALATION_REASONS`
membership test applies. Before wrapping every dispatch site's result in such a helper for
"consistency", check whether the un-normalized status is HARD while the normalized name is not.
If so, the asymmetry across dispatch sites is load-bearing, not an oversight. Mark it with a
comment (this repo's convention: an inline `// ponytail: ... deliberately NOT applied ...`
explaining which HARD membership would flip) rather than "fixing" it.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`,
the `routedMr` helper, the `environment-proceed`/`baseline-proceed` re-merge dispatch blocks, and
the two `// ponytail: routedMr is deliberately NOT applied` comments; `HARD_ESCALATION_REASONS` in
`skills/war/assets/land-decision.mjs` is the canonical membership test (hand-mirrored into
`workflow-template.js` per ADR 0005; change both copies together).
