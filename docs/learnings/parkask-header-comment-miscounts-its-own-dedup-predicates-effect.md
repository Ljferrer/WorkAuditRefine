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

`skills/war/assets/workflow-template.js` (landed phase `2026-09-06-engine-and-audit-verdict-integrity`
Task 3.1, tip `83cd4e7cfe0619c576d4301413eccae2fc5f1be9`, read via the `_refinery` worktree whose
`gitdir` physical path names this plan's slug and whose `HEAD` equals the threaded tip). The
`parkAsk` header comment (line 1358-1360) reads:

> The survivor's own raiser is part of that skip test ... never lands on its own corroborators list,
> so the handoff row counts distinct seats.

The skip predicate two lines below (`same = c => c.seat === e.seat && c.file === e.file && c.title
=== e.title`) keys on seat **and** file **and** title. A seat that re-raises the same title on a
**second file** is not skipped — it lands on `corroborators` — so the same seat can appear both as
the record's own `seat` field and inside its own `corroborators` list. The "counts distinct seats"
claim is false: the record can double-count one seat across two files.

Three auditor seats (three separate Nits, same task, same audit round) caught this independently and
all three suggested near-identical rewordings scoping the claim to "seat+file+title," not "seats."

## Why durable

This landed with disposition `absorb` (not `phaseClose`) — it is inside the task's own diff — yet
survived to the landed tip unfixed (Nits do not force a fix round; only Critical/Major block). It is
also ironic in a way worth naming: this same phase's Task 2.1 was explicitly ordered to de-mirror
false "count" claims from engine header comments (rule 7 of D24, the Adjudications-header fix), and
a fresh instance of the identical failure class — a comment asserting a count/uniqueness property the
code does not actually guarantee — was introduced one task later, in the same file, by the very same
kind of change. A header comment's claimed *consequence* of a new predicate needs the same scrutiny
as an explicit count word: verify the claim against the predicate's actual key, not the author's
intent for it.

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

`skills/war/assets/workflow-template.js`, `parkAsk`'s header comment, line ~1360 ("so the handoff row
counts distinct seats"), and the `same` predicate two lines below it.
