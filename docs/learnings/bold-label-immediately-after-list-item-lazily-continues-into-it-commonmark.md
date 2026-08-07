---
name: bold-label-immediately-after-list-item-lazily-continues-into-it-commonmark
description: "A **Bold Label:** line placed directly beneath a Markdown list item with no blank line between them renders inside that list item per CommonMark lazy continuation, not as its own paragraph/line — cosmetic in a plain-text/substring reader but breaks structured rendering of handoff/report templates that get copied verbatim into other documents"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: bold-label-immediately-after-list-item-lazily-continues-into-it-commonmark
  phase: precision-chain-and-loop-breaker/4.2
  keywords: 
    - commonmark
    - lazy continuation
    - markdown list
    - bold label
    - blank line
    - report template
    - rendering gotcha
  tags: 
    - war
    - markdown
    - doc-authoring
    - gotcha
  created: 2026-08-06
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-06T21:23:10.740Z
---

# A bold label line right after a Markdown list item lazily continues into that item (CommonMark)

## The pattern

Per CommonMark's lazy-continuation rule, a line that immediately follows a list item with **no
blank line separating them** is treated as a continuation of that list item's paragraph, even if
the new line is itself formatted to look like its own standalone element (e.g. `**Label:**
text`). Visually, in raw source, the two lines look distinct; rendered, the second line nests
inside the preceding bullet instead of appearing as a sibling block.

Confirmed instance (verify still present before acting — found at
`skills/red-team/references/lenses.md`, the `## Route upstream` report-template block): the
`**Re-entry:** ...` line sits directly beneath the `- <the unsettled decision...>` agenda bullet
with no blank line, so it lazily continues into that bullet rather than rendering as its own
line. The same shape is duplicated byte-for-byte in the fenced template inside
`skills/red-team/references/loop-budget.md`.

## Why it matters here specifically

This is not merely cosmetic when the block in question is a **handoff/report template** that
gets copied verbatim into a different document — here, `/war-campaign`'s halt arm copies the
`## Route upstream` section into `CAMPAIGN-STATE.md`. A substring-matching reader (grep, an
agent doing a text search) is unaffected either way, but any renderer (GitHub, a Markdown
preview) shows the mis-nested structure to a human operator reading the state file.

## How to apply

When authoring or reviewing a Markdown template that mixes list items with subsequent
"**Label:** value" lines meant to stand alone, always insert a blank line before the label line.
This is especially worth a deliberate check on any block that is a copy/paste template destined
for another document (report templates, handoff blocks, CAMPAIGN-STATE.md sections) — a rendering
defect there propagates to every future copy, and a repo's own drift-guard tests (which typically
assert presence/content substrings) will not catch missing blank lines.
