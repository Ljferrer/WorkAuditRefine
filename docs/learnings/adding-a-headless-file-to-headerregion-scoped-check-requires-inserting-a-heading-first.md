---
name: adding-a-headless-file-to-headerregion-scoped-check-requires-inserting-a-heading-first
description: "Before adding a file to a headerRegion()-scoped check, grep it for `## ` headings; a headless file needs one inserted."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: adding-a-headless-file-to-headerregion-scoped-check-requires-inserting-a-heading-first
  phase: "2026-08-25-doc-truth-and-drift-guard-debt/phase-2 task 2.1 (plan-faithfulness lens, disposition note)"
  keywords: 
    - headerRegion
    - QUALIFIED_HEADERS
    - fail-closed heading check
    - docker-gate.md
    - Evicted heading
    - reference-link-integrity.test.mjs
    - single-topic file
    - eviction destination
    - heading-less document
  tags: 
    - war
    - doc-guard
    - drift-guard
    - reference-link-integrity
  created: 2026-09-03
  originSessionId: ffad230a-d9ac-4d86-8988-75714445b989
  modified: 2026-09-03T19:13:04.168Z
---

# Widening a `headerRegion()`-scoped check onto a headless file forces a heading insertion

**Rule:** before adding a file to a `headerRegion()`-scoped check (or any fail-closed,
heading-delimited check), grep that file for `## ` headings. `headerRegion()` in
`skills/war/assets/reference-link-integrity.test.mjs` returns `null` for a document with no `## `
heading, so a header-scoped check cannot run over it at all. A single-topic reference file often
has no headings. The required edit is then "author a new heading to create the region", not "edit
existing header text". A plan that budgets only text edits for such a file undercounts the diff.
This is a plan-silent mechanical requirement, not a deviation to escalate.

**Instance:** widening `QUALIFIED_HEADERS` onto `skills/war/references/docker-gate.md`, which had
zero `## ` headings. The worker added `## Evicted: § Setup step 3 — the opt-in docker gate block`
(still its only `## ` heading), matching the `## Evicted: § ...` idiom of the other eviction files.

**Locate-cue:** `reference-link-integrity.test.mjs`: the `headerRegion()` function, the synthetic
test "headerRegion fails closed on a heading-less document", and the `QUALIFIED_HEADERS` array.

## Related

[[new-drift-guard-pin-skips-established-region-scoping-idiom-in-same-file]] is about region-scoping
idioms; this file is about a file that has no region at all yet.
