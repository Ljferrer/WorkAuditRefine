---
name: golden-fixture-heading-must-match-assertion-scope
description: "Fixture heading claims only what the unit test proves; 'beats/wins' overstates scope"
metadata: 
  node_type: memory
  slug: golden-fixture-heading-must-match-assertion-scope
  phase: readManifest-golden/t1
  type: project
  tags: 
    - golden-fixture
    - documentation
    - assertion-scope
    - heading
    - reader-layer
    - scout
  relates: 
    - "[[weak-test-assertion-passes-without-feature-being-exercised]]"
    - "[[plan-affected-file-list-doc-completeness-vs-correctness]]"
  created: 2026-06-26
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
---

# Golden fixture heading must match what the unit test can actually assert

**Rule:** a golden-fixture heading must describe only what the unit under test proves, not what a
downstream consumer will eventually prove. "Why manifest beats CI here" over a `readManifest`
reader test overstates scope — precedence is a scout-layer decision; the reader only returns the
committed manifest list.

Instance still live: the "Why manifest beats CI here" heading in
`skills/_shared/fixtures/provision/EXPECTED.md` (body prose and assertion anchor are correctly scoped).

**Why:** the heading is the first thing an auditor reads; an overstated heading triggers a
claims-vs-reality finding even when the assertion itself is tight.
**How to apply:** before writing "beats"/"wins"/"takes precedence"/"vs." in a fixture heading, ask:
can THIS test alone force the alternative path to fail? If not, narrow the heading to the layer tested.
Related: [[weak-test-assertion-passes-without-feature-being-exercised]],
[[plan-affected-file-list-doc-completeness-vs-correctness]].

> archived 2026-07-04: resolved — moved to archive
