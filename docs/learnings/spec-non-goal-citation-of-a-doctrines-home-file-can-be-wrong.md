---
name: spec-non-goal-citation-of-a-doctrines-home-file-can-be-wrong
description: "A spec's non-goal citing 'the existing doctrine at file Y' can misattribute the doctrine's real (sole) home, and a verbatim glossary rewrite then retires it with no surviving anchor"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: spec-non-goal-citation-of-a-doctrines-home-file-can-be-wrong
  phase: audit-adjudication-threading/1.3
  created: 2026-07-22
  tags: 
    - spec-fidelity
    - CONTEXT.md
    - glossary
    - doctrine-provenance
    - doc-drift
  keywords: 
    - spec misattributes doctrine home
    - never mined from arbitrary prose
    - lenses.md doctrine citation
    - glossary rewrite retires phrase
    - non-goal source citation
    - git log -G verify citation
    - sole operative anchor lost
    - CONTEXT.md term widening
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-23T00:45:54.837Z
---

# A spec's non-goal citation of a doctrine's home file can be wrong — verify before trusting it

**What happened (code-verified — `git log -Gmined.from.arbitrary.prose` at the audit-adjudication-
threading phase-1 task-1.3 worktree; confirmed absent from every operative surface at the landed
tip: `skills/`, `agents/`, `CONTEXT.md`, only present in `docs/specs/*-design.md`):** the design
spec's §9 non-goals section justifies dropping the CONTEXT.md `Adjudication` term's `_Avoid_` clause
("... never mined from arbitrary prose") by citing "the existing `lenses.md` 'never mined from
arbitrary prose' doctrine" as the doctrine's other/fallback home. But `skills/red-team/references/
lenses.md` never carried that phrase — `git log -G` over the pinned sha shows the phrase existed at
exactly **one** live surface in the whole repo before this diff: the CONTEXT.md `Adjudication` term
itself (added in an earlier commit). The task's own diff (spec §6 verbatim, fully plan-faithful) then
overwrote that one surface, so after landing, the doctrine has **zero** operative anchors anywhere —
the spec's own stated fallback home was never real.

**Not a worker deviation:** the replacement text is the plan slice's literal spec §6 content: the
worker applied it verbatim. The defect is upstream, in the spec's own citation — nobody verified the
citation before writing the non-goal that justified the removal.

**The rule:** when a spec removes or retires a doctrine/clause and justifies the removal by citing
"the existing doctrine already lives at file Y" (a stated fallback/duplicate home), **verify that
citation** (`git log -G<phrase>` / `git log -S<phrase>` over the phrase, or a direct Read of file Y)
before trusting it — a spec author's belief that a doctrine is duplicated elsewhere can be wrong, and
because the diff executing the spec is by definition plan-faithful, nothing downstream (worker
fidelity checks, plan-vs-code review) will catch the resulting total loss of the doctrine's only
anchor. This is a spec-authoring-time gap, not a red-team/plan-conversion gap — `/red-team` proves
plan claims about the **target repo state**, not the truth of a **citation about a third file** used
only as removal justification in spec prose.

**Substance-survives note (not a full mitigation):** the phase's own concurrent Task 1.2 diff adds a
partially-overlapping sentence to `SKILL.md` ("the Lead never synthesizes a row to smooth over an
unruled delta"), and the new CONTEXT.md `_Avoid_` line keeps "a row records a ruling already made and
routed" — so the *spirit* of the doctrine is not entirely lost, but the specific "never mined from
arbitrary prose" framing (grep-able, unambiguous) is gone from every standing surface.

Related: [[doc-prose-verbatim-claim-overstates-token-anchor-drift-guard]] — a sibling class where a
standing-doc sentence overclaims what a backing mechanism actually enforces.
[[spec-context-band-statement-of-drift-survives-code-changes-uncorrected]] (repo) — a related but
distinct spec-provenance-rot pattern (a spec's dated Context statement going stale, not a citation
being wrong at authoring time).
