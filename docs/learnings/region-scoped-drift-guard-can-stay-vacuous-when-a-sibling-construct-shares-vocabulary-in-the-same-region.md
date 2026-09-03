---
name: region-scoped-drift-guard-can-stay-vacuous-when-a-sibling-construct-shares-vocabulary-in-the-same-region
description: "Region-scoping a drift-guard key is not enough when a sibling bullet in the region shares its vocabulary; extract the specific construct."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: region-scoped-drift-guard-can-stay-vacuous-when-a-sibling-construct-shares-vocabulary-in-the-same-region
  phase: ask-disposition/phase-2 (Task 2.3 gate-audit finding + phase-close polish sweep finding)
  keywords: 
    - region scoping
    - drift guard pin
    - Checkpoint region
    - sibling bullet vocabulary collision
    - construct-level extraction
    - skill-doc-contracts.test.mjs
    - D37
    - D41
    - vacuous key
  tags: 
    - test-design
    - drift-guard
    - guard-architecture
  created: 2026-08-25
  originSessionId: 351f8fc5-4d48-4ee9-8beb-5d257d9bcf6f
  modified: 2026-08-26T03:02:37.405Z
---

# Region-scoping a drift-guard pin does not de-vacuify a key whose term also appears in a sibling construct inside that same region

**Fixed in #1705 (landed in `45a66a8`).** D37 in `skills/war/assets/skill-doc-contracts.test.mjs`
now asserts its two SKILL.md-homed canonical halves against the single `**Ask ruling gate` line
extracted from the `## Checkpoint` region (`askGate`, uniqueness asserted), not the region. The
row's comment now states the region "is not enough" and names the sibling bullet.

**What happened:** D37's `Never-filed-unruled` / `Strike-list ruling gate` keys were first scoped
to the whole `skillMd`, then narrowed to the `## Checkpoint` region extraction D41 already uses.
That cured `/absolute/i` (its only in-region match became the gate bullet). But
`/consolidation/i` and `` /file-followups`?\s+dispatch/i `` stayed non-discriminating: the
adjacent **Follow-up filing floor** bullet in `skills/war/SKILL.md` sits in the same region and
carries `**consolidation precedes filing**` and the `file-followups` dispatch token. Deleting
the ask-ruling-gate clause left both keys green. The fix comment overclaimed, citing
`/consolidation/i` as cured by the region scoping.

**The durable rule:** when scoping a drift-guard key to a section or region, check whether ANY
other construct (bullet, paragraph) inside that region shares the key's vocabulary. If so, the
region fix is necessary but not sufficient. Extract the specific construct (the single bullet by
its own lead-in marker) or tighten the regex to a phrase unique to the target. Prove it by
scratch deletion of the target clause, not by reading the fix comment.

**Why:** a `## Heading` region in a doc like the SKILL.md Checkpoint holds several adjacent
bullets on related topics, and generic words ("consolidation", "dispatch", "absolute") recur
across siblings. Region scoping catches a whole-region deletion; it does not catch a rewrite of
one bullet's clause when a neighbor shares the words. No test asserts comment content, so an
overclaiming comment survives.

**Locate-cue:** the D37 test and its `askGate` extraction in
`skills/war/assets/skill-doc-contracts.test.mjs`; the adjacent **Follow-up filing floor** and
**Ask ruling gate** bullets in the `## Checkpoint` section of `skills/war/SKILL.md`.

## Related

[[new-drift-guard-pin-skips-established-region-scoping-idiom-in-same-file]] is the prior tier
(skipping region scoping entirely); this lesson is the residual once that fix is applied.
[[guard-rationale-comment-can-cite-a-different-scanned-surface-than-the-pin-it-justifies]] is
the sibling comment-accuracy class: a fix's own comment overclaims what the change cures.
