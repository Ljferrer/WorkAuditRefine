---
name: prose-cross-ref-direction-contradicts-physical-layout
description: "Prefer named-section refs over 'above/below' in prose; SKILL.md instance now fixed"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: prose-cross-ref-direction-contradicts-physical-layout
  phase: submodule-inc2/T3
  tags: 
    - plan-mismatch
    - doc-completeness
    - prose
    - cross-reference
  created: 2026-06-30
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
---

# Prose cross-reference direction contradicts physical document layout

**Rule:** prefer named-section pointers over directional words in plan/doc prose — "see the
Resume section", not "the sub-procedure below". A directional word bakes in an assumption
about section order; if the layout differs (or is later reordered), the direction is wrong or
becomes right by accident. When reviewing: a directional mismatch is Nit (non-blocking) iff
the construct is uniquely named; if the direction is the only locator, it is at least Minor.

**Fixed:** the SKILL.md `held:submodule-pr` instance now uses the named-section form ("the
`held:submodule-pr` sub-procedure in `## Resume`") — directional wording gone from landed prose.

**Why:** plans that write "below" get copied verbatim by workers; the error propagates to every copy site.
**How to apply:** before landing plan prose, confirm any above/below against actual document order — or drop the direction and name the section.

Related: [[plan-named-comment-location-must-be-exact-target]], [[plan-line-number-refs-stale-use-construct-locator]].

> archived 2026-07-04: resolved — moved to archive
