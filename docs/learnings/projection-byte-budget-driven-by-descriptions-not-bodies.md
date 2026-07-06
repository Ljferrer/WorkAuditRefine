---
name: projection-byte-budget-driven-by-descriptions-not-bodies
description: "Body compression does not shrink MEMORY.md — the projection is rendered from frontmatter (name/phase/description), so the byte axis only moves by archiving rows or tightening description lines."
metadata: 
  node_type: memory
  type: project
  keywords: [MEMORY.md size, render-index, index bloat, frontmatter rows, archive by slug, housekeeping pass]
  provenance: code-verified
  originSessionId: af73a82a-2798-4597-972a-4d5407fdb01d
---

In the 2026-07-06 housekeeping pass, 370 body lines were cut across 23 topic files, yet the rendered index **grew** (17,011 → 17,242 bytes) — `render-index` derives each row solely from frontmatter and also picked up a previously unindexed topic file.

**Why:** the budget axes (200 lines / 25,600 bytes) measure the *projection*, not the corpus. Keep-compress edits to bodies improve retrieval quality and disk, but cannot relieve index-budget pressure.

**How to apply:** when `MEMORY.md` nears the 17 KB advisory, plan row reduction — archive by **explicit slug** (never `--candidates`, per [[lessons-learned-tooling-traps]]) or tighten `description:` lines — instead of expecting body compression to move the number.
