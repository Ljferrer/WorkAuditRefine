---
name: adr-consequences-member-count-goes-stale-when-a-same-plan-task-adds-a-rule-to-the-block-it-counts
description: "An ADR's Consequences bullet can enumerate/count the members of a convention block it introduced, and a later task in the SAME plan can add a new member to that block on the operative surface (e.g. SKILL.md) without any task being assigned to update the ADR's own list/count — invisible to a name-grep because the new member's own pins live on the operative surface, not the ADR"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: adr-consequences-member-count-goes-stale-when-a-same-plan-task-adds-a-rule-to-the-block-it-counts
  phase: 2026-08-04-interview-and-authoring-contract/1
  keywords: 
    - ADR under-attribution
    - Consequences bullet
    - member count stale
    - convention block
    - doc-cascade check
    - ADR 0025
    - ADR 0030
    - grep-invisible
    - follow-up disposition
    - plan task ownership gap
  tags: 
    - adr
    - doc-honesty
    - phase-close
    - plan-authoring
  created: 2026-08-05
  originSessionId: 67745971-e7bc-4d1f-87e7-038430dd13ab
  modified: 2026-08-05T12:38:44.579Z
---

# An ADR's own Consequences count can go stale mid-plan when a later task adds a member to the block it enumerates — and no task owns the fix

## What happened (code-verified at landed tip)

Phase 1 of `2026-08-04-interview-and-authoring-contract` (Task 1) added a new "Dated snapshots
(D12 staleness rule)" convention bullet to `skills/war-strategy/SKILL.md` §2's "Reference the live
artifact, never a stack-fragile literal" block — confirmed present at the landed tip
(`378b868a5bab995f86c74ec8aad0d50d11516199` on
`dev/2026-08-05-2026-08-04-interview-and-authoring-contract`, read via the `_refinery` worktree
whose `gitdir` physical path contains this plan's slug): `skills/war-strategy/SKILL.md` carries
`literals are dated snapshots at a stated base` and `re-measure at the task's rebased base`, and
`war-strategy-structure.test.sh` pins both.

`docs/adr/0030-live-artifacts-over-stack-fragile-literals.md` is the ADR that **introduced** and
**owns** this exact block: its Decision section enumerates the block's members as a bullet list,
and its Consequences section separately states a member-count claim about the same block
(`skills/war-strategy/SKILL.md` §2 gains the "reference the live artifact" convention block —
[N] rules + the defined-but-not-yet-emitted annotation"). Confirmed at the same landed tip: the
Decision list has **no** "Dated snapshots" bullet, and the Consequences count is unchanged from
before this diff — so the ADR's own list and its own count both now undercount the live block by
one member. No task in this plan is assigned to fix it: the plan's Task 9 (a later, not-yet-landed
task) owns a *different* ADR — 0044, ratifying the contract itself — and its slice enumerates a
named subset of decision letters (D2, D4-D6, D15-D16, D18-D19) that does not include D12.

## Why this is invisible to a name-grep sweep

A repo-wide `grep` for the new convention's own teeth phrases (`literals are dated snapshots`,
`re-measure at the task's rebased base`) finds only the operative surface (`SKILL.md`) — the ADR
never quotes those teeth phrases, because its own prose is a summary list ("Construct locators",
"Dotted paths", etc.) and a bare count word ("six rules"). The ADR's staleness is legible only by
counting Decision bullets by eye and diffing against the Consequences sentence's claimed count —
exactly the ADR 0025 doc-cascade check discipline (`under-attribution is invisible to a name-grep`)
this repo already names for canonical-source/mirror-site pairs, generalized here to a
list-plus-count self-description.

## How to apply

When a task adds a new member to a convention/rule block that some **other** ADR both **enumerates
as a list** and **states a count for** in its Consequences section:
1. Grep the block's own home file (not the ADR) for the new member's teeth phrase to confirm it
   landed — that check passes trivially and proves nothing about the ADR.
2. Separately open the owning ADR and manually recount its Decision-section bullet list against
   its own Consequences count sentence — a name-grep will not catch drift here because the two
   surfaces do not share vocabulary.
3. If no task in the plan is assigned to update the owning ADR, this is either (a) an intentional
   scoping choice the plan should state explicitly (ADRs are append-only; an amendment note is the
   correct repair, never editing the ratified bullet list), or (b) a genuine gap worth a `follow-up`
   disposition at audit time rather than `absorb` — the fix is cross-file (SKILL.md's block plus the
   ADR's own amendment) and not mechanical/single-surface.

## Related

[[absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction]] — a sibling ADR
under-attribution class where the *fix itself* got a canonical-source/mirror-site direction
backwards; this lesson is about the *count claim never being touched at all*, a step earlier in the
same family. Both trace to the ADR 0025 doc-cascade discipline of re-deriving attribution from the
live artifact rather than trusting either surface's prose.

> archived 2026-08-15: resolved — moved to archive
