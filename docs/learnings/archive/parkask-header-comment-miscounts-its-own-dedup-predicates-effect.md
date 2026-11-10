---
name: parkask-header-comment-miscounts-its-own-dedup-predicates-effect
description: "parkAsk's own header comment claims the handoff row counts distinct seats, but the dedup predicate keys on seat+file+title, so one seat still appears twice across two files"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: parkask-header-comment-miscounts-its-own-dedup-predicates-effect
  phase: 2026-09-06-engine-and-audit-verdict-integrity/phase-3 (Task 3.1)
  keywords: 
    - parkAsk
    - corroborators
    - counts distinct seats
    - header comment wrong
    - own-raiser skip
    - dedup predicate
    - D24 rule 7
    - count word
    - self-contradicting comment
  tags: 
    - engine-design
    - workflow-template
    - doc-honesty
    - audit-findings
  created: 2026-09-07
  originSessionId: a2a576b1-d8af-4c79-ad1a-af3d3e5c5c91
  modified: 2026-09-07T17:39:49.022Z
---

# A new predicate's own header comment can misstate its effect from the same commit, not just go stale later

## What (code-verified at landed tip)

In `skills/war/assets/workflow-template.js` (landed in `2026-09-06-engine-and-audit-verdict-integrity`
Task 3.1), the `parkAsk` header comment reads:

> The survivor's own raiser is part of that skip test ... never lands on its own corroborators list,
> so the handoff row counts distinct seats.

The skip predicate two lines below (`same = c => c.seat === e.seat && c.file === e.file && c.title
=== e.title`) keys on seat **and** file **and** title. A seat that re-raises the same title on a
**second file** is not skipped — it lands on `corroborators` — so the same seat can appear both as
the record's own `seat` field and inside its own `corroborators` list. The "counts distinct seats"
claim is false: the record can double-count one seat across two files.

## Why

The finding was a Nit with disposition `absorb` inside the task's own diff, and it still reached
the landed tip unfixed, because Nits do not force a fix round. A header comment's claimed
*consequence* of a new predicate needs the same scrutiny as an explicit count word: verify the
claim against the predicate's actual key, not the author's intent for it.

## How to apply

When writing (or reviewing) a header comment that states what a new dedup/skip predicate
*guarantees downstream* (e.g., "so X counts distinct Y"), trace the predicate's actual key tuple and
confirm the claimed guarantee follows from it — a same-seat-different-file case is the concrete
counterexample class here, and applies to any predicate that keys on more than one field.

## Related

[[adr-consequences-member-count-goes-stale-when-a-same-plan-task-adds-a-rule-to-the-block-it-counts]]
— the sibling failure mode where a count claim goes stale from a LATER task's change; this lesson is
about the claim being wrong from the SAME commit that introduces both the predicate and the comment.

## Locate-cue (verify still present before acting)

`skills/war/assets/workflow-template.js`, `parkAsk`'s header comment ("so the handoff row counts
distinct seats"), and the `same` predicate two lines below it.

> archived 2026-10-27: resolved — moved to archive
