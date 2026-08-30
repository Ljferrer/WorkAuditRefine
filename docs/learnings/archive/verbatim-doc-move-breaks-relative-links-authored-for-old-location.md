---
name: verbatim-doc-move-breaks-relative-links-authored-for-old-location
description: "Verbatim doc moves break relative links authored for the old location; fix with a header caveat"
metadata: 
  node_type: memory
  type: project
  promoted: dev/2026-07-28-prompt-surface-simplification@phase-2
  provenance: code-verified
  slug: verbatim-doc-move-breaks-relative-links-authored-for-old-location
  phase: prompt-surface-simplification/2.1
  keywords: 
    - byte-identical move
    - verbatim eviction
    - relative link
    - dangling reference
    - references/ directory
    - doc cascade
    - trigger pointer
    - prompt-surface-budgets
    - SKILL.md shrink
    - auditor-teach.md
    - co-source-of-truth
    - phase-close revert
  tags: 
    - war
    - doc-prose-drift
    - plan-faithfulness
    - prompt-surface
  created: 2026-07-28
  originSessionId: 15ea107f-a540-466b-bb69-7ce45fb6e5a4
  modified: 2026-07-29T03:11:40.758Z
---

# Verbatim doc-block moves break relative links/citations authored for the old location

**Found (code-verified — verified at landed tip `d845fa834f65c7a21b260c329f7532e20fdbdad4` via the
`_refinery` worktree, `skills/war/references/resume-and-recovery.md` lines 1-12):** Task 2.1 moved
tier-≥2 blocks byte-identically out of `skills/war/SKILL.md` into per-topic
`skills/war/references/*.md` files, one directory deeper. Every relative link/citation inside a
moved block was authored relative to `SKILL.md`'s own directory and now resolves wrong from the
new, deeper location: `[references/design.md](references/design.md)` resolves to
`skills/war/references/references/design.md` (self-referential, doesn't exist), and
`../../docs/adr/0023-…` resolves to `skills/docs/adr/…` instead of `docs/adr/…`. Same for prose
citations like "specified in SKILL.md" when the cited content itself moved — a Lead following the
citation gets a 404 or a stale referent. The plan's own End state 2 ("every evicted block appears
byte-identical in its `references/` destination") **forbids fixing this by editing the links** —
that would be a rewrite, not a move.

**The sanctioned fix is a header caveat, not a link/citation rewrite.** The landed mitigation
(confirmed present at the pin) is a preamble note at the top of each destination file:
> "Relative link paths inside the moved blocks are likewise written relative to
> `skills/war/SKILL.md` — read `references/<x>.md` as a sibling of this file, and `../../docs/…`
> as `../../../docs/…` from here."

This preserves byte-identity of every moved byte while telling the reader how to translate the
path offset. It does **not** fully close the gap — a reader who follows a link without reading the
header still 404s — but it is the only fix available inside a byte-identity constraint, and
multiple independent audit passes on this phase confirmed no better option exists (no link-checker
suite exists in this repo to gate it either).

**Two failure classes to check for, both caused by the SAME depth shift:**
1. Markdown link syntax inside the moved block (`[label](relative/path.md)`).
2. Prose citations naming the OLD file as the content's home (`"see SKILL.md"`, `"per SKILL.md
   §4.3"`) when the destination is now the content's new home — these need retargeting at the
   **citing** surface (not byte-identity-protected, since the citing file wasn't itself moved),
   and a partial sweep is easy: this phase's audit found 3 more same-class stale citations
   surviving in `skills/war/references/schemas.md` (lines 40, 275, 327) after the queued finding
   fixed only one sibling citation in the same file — the phase-close polish worker's charter
   ("fix ONLY the queued findings, no ad-hoc seam hunting") deliberately does not authorize
   sweeping siblings in-phase, so they were filed as `follow-up`, not fixed.

**How to apply on a future eviction task (this plan has more shrink phases coming — Phases 3-5
repeat the exact same move mechanism):** before moving a block, grep it for `](` and for
citations naming the origin file; after the move, add/extend the destination file's header caveat
rather than touching the moved bytes; separately sweep the **origin file's own surviving prose**
(and sibling files across the repo) for citations pointing at content that just left — that sweep
is NOT byte-identity-protected and should be fixed at the citing site in the same task (ADR 0025
comment-lag duty).

**Confirmed recurrence, phase 3 (code-verified at landed tip `53ef8a7b1eed93a55a7a30dbc9137228f31e5d7b`,
`skills/war/references/auditor-teach.md` line 38):** exactly the predicted instance. Task 3.1
verbatim-moved the auditor card's gitlink-bump pin-validity arm into `auditor-teach.md`; the moved
block still cites `` `SKILL.md`, submodule co-source-of-truth `` for content phase 2 (`b6ee5a2`)
had already relocated to `skills/war/references/submodule-flows.md` § "Resume — submodule remote
as co-source-of-truth". The fix landed once (`c6015c4`, a header-caveat addition matching this
lesson's sanctioned shape) but a **whole-commit revert** (`7e21867`, no rationale recorded)
undid it; the phase-close polish redo (`39afb54`, task `p3-polish`) re-derived its own two-item
queue from the *then-current* open findings and happened to drain a **different** pair (a tour
line-anchor Nit + a qualifier-lock comment-lag Minor) — so the `auditor-teach.md` caveat is still
missing at the landed tip. **New gotcha layered on the base lesson:** when a phase-close polish
commit that fixes N findings gets reverted wholesale, do not assume a later polish pass restores
all N — it re-scopes to whatever is queued *at redo time*, which can silently orphan a subset
forever unless the orphaned finding is re-filed. See [[phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings]].

> archived 2026-08-30: resolved — moved to archive
