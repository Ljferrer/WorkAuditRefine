---
name: byte-identical-eviction-can-legitimately-drop-a-list-marker-or-need-an-additive-heading
description: "A plan mandate that an evicted doc block be 'byte-identical' at its references/ destination governs the block's own bytes, not the surrounding outline — a moved numbered-list item legitimately drops its leading ordinal marker when it becomes a standalone section, and a moved block's original heading level can need an additive (not rewritten) parent heading to avoid a false sub-section reading"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: byte-identical-eviction-can-legitimately-drop-a-list-marker-or-need-an-additive-heading
  phase: prompt-surface-simplification/4.1
  keywords: 
    - byte-identical
    - verbatim eviction
    - ordered-list marker
    - list marker drop
    - heading nesting
    - references/ directory
    - trigger pointer
    - additive heading
    - outline drift
    - End state 2
  tags: 
    - war
    - doc-prose-drift
    - prompt-surface
    - plan-faithfulness
  created: 2026-07-29
  originSessionId: a505c140-d6ba-4279-a944-c3fcab124655
  modified: 2026-07-29T16:17:29.167Z
---

# Byte-identical eviction governs the moved block's bytes, not its outline context

**Found (code-verified — landed tip `cce668634ff6d566d1370e9502c08d317fea4e3c`, read via the
`_refinery` worktree at `.claude/war-worktrees/2026-07-28-prompt-surface-simplification-2026-07-28/_refinery/`,
`skills/war/references/refiner-recovery.md`):** Task 4.1 evicted three blocks verbatim from
`agents/war-refiner.md`'s land-phase step 3 into `refiner-recovery.md` under an End-state-2 mandate
("every evicted block appears byte-identical in its `references/` destination"). Two byte-level
deviations recurred across many independent audit findings for the same task, and both are
**correct-by-construction, not violations**, once checked against the live file:

1. **Leading ordered-list marker drop.** The card's step 3 read `3. **Before surrendering to
   `land_stale`...**` inside a numbered list; the destination (line 31) renders it as a standalone
   paragraph `**Before surrendering to `land_stale`...**` with the `3. ` prefix stripped. Every
   byte after the marker is identical. Restoring a bare `3.` at the top of a reference section
   with no preceding `1.`/`2.` would be actively misleading — the marker is a numbering artifact
   of the OLD list context, not part of the instruction. The destination's header explicitly
   discloses the provenance ("the reland-discrimination block sat as step 3 of the card's
   superproject land loop") so the deviation is visible, not silent.
2. **Heading-nesting false hierarchy, fixed by an additive heading.** The moved `### Submodule
   phase — 2A` / `2B` blocks kept their original `###` level (required — editing the heading text
   itself would violate byte-identity), but their new parent in the destination file was `##
   Reland discrimination — superproject land-phase step 3`, making the outline read the land arms
   as sub-parts of the reland discrimination. The audited/landed fix was **additive**: a new `##
   Submodule land arms (2A / 2B)` heading inserted immediately before `### Submodule phase — 2A`
   (confirmed present at line 33 of the landed file) — this repairs the outline without touching
   any byte of the moved `###` blocks.

**The rule for future eviction tasks (this plan has more shrink phases — 5, 6, 7 repeat the same
move mechanism):** a "byte-identical" / "verbatim" mandate binds the **moved block's own text**,
not the ambient list/heading structure it used to sit inside. When eviction breaks the outline:
- A stripped ordinal/bullet marker that no longer makes sense standalone is a legitimate,
  disclosable deviation — say so in the destination file's header, don't try to preserve it.
- A false sub-section reading from an unmatched heading level is fixed by **inserting a new,
  additive parent heading** before the moved block — never by editing the moved heading's own
  text or level, which the byte-identity mandate forbids.

Related: [[verbatim-doc-move-breaks-relative-links-authored-for-old-location]] (same eviction
mechanism, a different byte-preserved-but-context-broken failure mode — relative links instead of
list/heading structure).
