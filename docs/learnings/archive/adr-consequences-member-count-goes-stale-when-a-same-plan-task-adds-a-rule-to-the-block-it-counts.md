---
name: adr-consequences-member-count-goes-stale-when-a-same-plan-task-adds-a-rule-to-the-block-it-counts
description: "When a task adds a member to a block an ADR lists and counts, recount the ADR by hand; a name-grep misses the drift and no task may own the fix"
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
    - ADR 0025 defining five terms
    - CONTEXT.md Drift-guard discipline subsection
    - touched-doc accuracy duty
    - amendment append compounds drift
    - schemas.md sibling row
    - de-mirrored rows
    - single-finding repair scope
    - merged corroboration key
    - frozen phase base
    - mechanism latitude
    - same-phase sibling task
    - own-raiser skip
    - parkAsk corroborators
    - IDENTITY + COLLISION row
    - schemas.md asks row
  tags:
    - adr
    - doc-honesty
    - phase-close
    - plan-authoring
  created: 2026-08-05
  originSessionId: 67745971-e7bc-4d1f-87e7-038430dd13ab
  modified: 2026-09-07T17:39:31.550Z
---

# An ADR's own Consequences count can go stale mid-plan when a later task adds a member to the block it enumerates — and no task owns the fix

An ADR can list the members of a convention block in its Decision section and state a count for
them in its Consequences section. A later task can add a member to that block on the operative
surface (e.g. `SKILL.md`) with no task assigned to update the ADR's list or count.

## What happened

Phase 1 of `2026-08-04-interview-and-authoring-contract` added a "Dated snapshots (D12 staleness
rule)" bullet to `skills/war-strategy/SKILL.md` §2's "Reference the live artifact, never a
stack-fragile literal" block. `war-strategy-structure.test.sh` pins its teeth phrases
(`literals are dated snapshots at a stated base`, `re-measure at the task's rebased base`).

`docs/adr/0030-live-artifacts-over-stack-fragile-literals.md` introduced and owns that block. Its
Decision list had no "Dated snapshots" bullet, and its Consequences count was unchanged. Both now
undercount the live block by one. No task in the plan owned that ADR.

## Why a name-grep misses it

A grep for the new member's teeth phrases finds only `SKILL.md`. The ADR never quotes them: its
prose is a summary list ("Construct locators", "Dotted paths", etc.) and a bare count word ("six
rules"). The drift shows only when you count Decision bullets by eye against the Consequences count.
This is the ADR 0025 doc-cascade check (`under-attribution is invisible to a name-grep`), applied
to a list-plus-count self-description.

## How to apply

When a task adds a member to a block that another ADR both **lists** and **counts**:
1. Grep the block's home file for the new member's teeth phrase. That check passes trivially and
   proves nothing about the ADR.
2. Open the owning ADR and recount its Decision bullets against its Consequences count.
3. If no task owns the ADR fix, either (a) the plan states the scoping choice (ADRs are
   append-only; an amendment note is the repair, never an edit to the ratified list), or (b) route
   the finding `follow-up`, not `absorb`. The fix is cross-file and not mechanical.

## Recurrences

- **The ADR that owns this discipline went stale by its own rule.** `docs/adr/0025-drift-guard-discipline.md`'s
  Consequences bullet says `CONTEXT.md` gains a `### Drift-guard discipline` subsection "defining
  five terms". An amendment added a sixth term, and `realized-absorb-rate` Task 3.1 added a seventh
  (**Touched-doc accuracy duty**). The bullet still read "five". The worker used the lawful channel,
  an appended amendment clause naming the new term, and audits routed it `note`. Each amendment
  compounds the drift (five → six → seven), because the append-only guardrail never corrects the
  frozen count.
- **Same file, sibling rows.** In `skills/war/references/schemas.md`, a polish fix updated the one
  `followUps` row a finding named, while two sibling rows describing the same object still named only
  `seats[]`. See [[fix-the-finding-class-not-the-site-and-prove-every-new-guard-red-before-commit]]:
  fix every row that describes the same key, not just the cited one.
- **Same phase, parallel sibling task.** Task 3.1 of `2026-09-06-engine-and-audit-verdict-integrity`
  added an own-raiser skip to `parkAsk`'s corroborator merge under the plan's mechanism-latitude
  clause. `schemas.md`'s "IDENTITY + COLLISION" row on `asks` still said a collision always merges
  onto `corroborators`. Task 3.2, which owned `schemas.md`, was cut from the same frozen phase base
  before 3.1's commit, and the plan never named the skip. So the doc-owning task was blind to it by
  design. It was filed as a follow-up.

## Related

[[absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction]] — a sibling ADR
under-attribution class where the *fix itself* got a canonical-source/mirror-site direction
backwards; this lesson is about the *count claim never being touched at all*. Both trace to the
ADR 0025 doc-cascade discipline. Also [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]].

> archived 2026-08-15: resolved — moved to archive
