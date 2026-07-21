---
name: spec-prose-must-cite-the-section-that-defines-a-mechanism-not-one-that-merely-exercises-it
description: Cite section that DEFINES mechanism; grep it first
metadata: 
  node_type: memory
  type: project
  keywords: [wrong citation target, cross-reference drift, section ownership, defines vs operates, doc anchor, reattribution, narrative flow trap]
  provenance: code-verified
  slug: spec-prose-must-cite-the-section-that-defines-a-mechanism-not-one-that-merely-exercises-it
  phase: spec-and-doc-prose-drift-reconciliation/p1-t2
  tags: 
    - plan-authoring
    - cross-reference
    - red-team
    - spec-prose
    - submodule-support
  created: 2026-07-01
  originSessionId: a93dac89-a784-477a-aa74-27e8c599ca83
---

# Cite the section that DEFINES a mechanism, not the one that merely operates under it

**Durable rule:** when writing a cross-reference that names "which section owns mechanism X," distinguish *defines-X* from *operates-under-a-process-gated-by-X*. A section that performs an action gated by a check is a plausible-looking but wrong citation target — narrative flow tempts citing it. Before finalizing any spec cross-reference, grep the candidate section's own text for the mechanism's name; if it doesn't appear there, the citation is wrong regardless of how naturally the narrative reads.

Instance (landed in v0.8.14, #368/#385): the submodule-support spec's reachability reattribution nearly cited §5.5 (which holds only the 2A/2B landing procedures) instead of §4.1 (the Refiner bullet that actually defines refusal-to-push-an-unreachable-gitlink-pin). Red-team caught it pre-dispatch. Anchor: the "Step 2 — Swap the sentence" checklist item under Task 2 of `docs/plans/2026-07-01-spec-and-doc-prose-drift-reconciliation.md` instructs "cite §4.1, NOT §5.5, which contains only the 2A/2B procedures" (anchor on that quoted instruction, not a line number).

**Why:** distinct from [[plan-line-number-refs-stale-use-construct-locator]] (stale line numbers) and [[prose-cross-ref-direction-contradicts-physical-layout]] (wrong direction to a right section) — here the section itself is the wrong target.
**How to apply:** any "reattribute this claim to the section that really does X" edit should grep for X (here: "reachab") inside the candidate section before citing it as the definer.

> archived 2026-07-21: resolved — moved to archive
