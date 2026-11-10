---
name: spec-non-goal-citation-of-a-doctrines-home-file-can-be-wrong
description: "A spec's non-goal citing 'doctrine already lives at file Y' can misattribute its sole real home — verify via git log -G before trusting; orphaned phrase since restored (#1087)"
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

**RESTORED (runbook-and-standing-record-coherence, #1087):** the "never mined from arbitrary
prose" doctrine is live again in `skills/war/SKILL.md` and `CONTEXT.md` — the orphaned-state
claims below describe a since-repaired window, not the current tree.

**What happened (code-verified at the audit-adjudication-threading phase-1 landed tip):** the
design spec's §9 non-goal justified dropping the CONTEXT.md `Adjudication` term's `_Avoid_` clause
("... never mined from arbitrary prose") by citing "the existing `lenses.md` ... doctrine" as the
phrase's other home. `git log -G` showed `skills/red-team/references/lenses.md` never carried it —
the phrase's only live surface was the exact CONTEXT.md clause the plan-faithful diff then
overwrote, leaving the doctrine with zero operative anchors. Not a worker deviation: the defect
was upstream in the spec's own citation, and because the executing diff is by definition
plan-faithful, no downstream fidelity check (worker fidelity, plan-vs-code review) catches it.

**The rule:** when a spec removes or retires a doctrine/clause and justifies the removal by citing
"the existing doctrine already lives at file Y", **verify that citation** (`git log -G<phrase>` /
`git log -S<phrase>`, or a direct Read of file Y) before trusting it. This is a
spec-authoring-time gap — `/red-team` proves plan claims about the **target repo state**, not the
truth of a citation about a third file used only as removal justification in spec prose.

Related: [[gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity]] — a sibling class where a
standing-doc sentence overclaims what a backing mechanism actually enforces.
[[spec-context-band-statement-of-drift-survives-code-changes-uncorrected]] (repo) — a related but
distinct spec-provenance-rot pattern (a spec's dated Context statement going stale, not a citation
being wrong at authoring time).

> archived 2026-08-15: resolved — moved to archive
