---
name: phase-1-markdown-heading-hierarchy
description: "Plan must state heading position AND level; 'in or near' yields H3 under wrong H2"
metadata: 
  node_type: memory
  type: project
  slug: phase-1-markdown-heading-hierarchy
  phase: 1
  title: "Plan 'in or near' wording leaves heading nesting ambiguous"
  tags: 
    - markdown
    - docs
    - plan-wording
    - audit-nit
  date: 2026-06-22
  originSessionId: dbb14f38-933a-47d8-9200-aa55ddc43c4f
---

# Plan wording must specify heading position AND level

Rule: when a plan places a new doc section, state both **position** (before/after/inside
which heading) and **level** (H2/H3). "Place it in or near `## Status`" invites an H3
inserted before the target H2 — spatially "near" but nested under the wrong parent H2,
so TOC/outline tooling files it in the wrong place.

Good: "Add an `## Releasing` heading directly above `## Status`" or "Add a `### Releasing`
subsection as the first child under `## Status`".

**Why:** renderers derive navigation from heading levels, not raw-text position.
**How to apply:** reviewing a doc-task plan → reject placement wording that omits the
heading level.

> archived 2026-07-04: resolved — moved to archive
