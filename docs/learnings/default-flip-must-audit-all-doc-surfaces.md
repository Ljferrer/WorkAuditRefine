---
name: default-flip-must-audit-all-doc-surfaces
description: A stale roster/config-default fact fixed in one doc surface can survive untouched in a sibling surface
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: 
    - roster drift
    - default audit roster
    - doc-truth sweep
    - quartet vs quintet
    - cross-surface staleness
    - README stale claim
    - DEFAULTS.audit.roster
    - auditor model mismatch
    - failed-attempt list
    - ADR sibling surface
  slug: default-flip-must-audit-all-doc-surfaces
  phase: 2026-08-25-doc-truth-and-drift-guard-debt/1.2
  tags: 
    - war
    - doc-truth
    - plan-faithfulness
    - roster
  created: 2026-09-03
  originSessionId: ffad230a-d9ac-4d86-8988-75714445b989
  modified: 2026-10-29T19:15:05.972Z
---

**Rule:** when a task fixes a stale enumerated or count fact (roster size, model name, version number)
in one file, grep the whole repo for the same fact-shape before closing, not just the task's `Files:`
list. README.md, tours, ADRs, and lesson files are the recurring drift homes; two surfaces that narrate
the same fact drift independently, and a single-file fix never discovers the sibling.

**Instance (fixed):** phase 2026-08-25-doc-truth-and-drift-guard-debt/1.2 corrected the default
audit roster in the architect tour but left README.md's roster narration ("quartet ... `security`")
and its lineage-table auditor model (`opus`) stale against `DEFAULTS.audit.roster` and
`DEFAULTS.agents.auditor` in war-config.mjs. Both README stragglers landed in #1990 (commit 100914d).

**Recurrence (2026-10-28-blocked-ace-and-merge-provenance/phase-2, live at landed tip 9bcc4fa6):**
plan #2485 D2 changed the ace failed-attempt list, because a dead ace worker with a moved tip is now re-audited.
The phase-close polish fixed the list in `CONTEXT.md` (DEMOTE_REASONS entry), and the phase also fixed `skills/war/references/schemas.md`.
`docs/adr/0013-commanders-intent-and-disposition-routing.md` (the `DEMOTE_REASONS` bullet) still says "(an untouched file, a dead ace worker, a red gate at the ace tip)".
The auditor finding named only the glossary sentence, so the polish never looked at the ADR.
The plan's Phase 5 ADR 0013 amendment line covers the residuals, not this list. Treat the ADR text as a candidate fix, unless the Lead rules it historical.
Verify still present before acting.

**How to apply:** route a same-fact instance found outside the task's own slice to a follow-up issue,
per [[dont-leave-work-on-the-table]]'s carve-out. Same family:
[[release-blurb-categorical-scope-enumeration-omits-a-window-class-despite-a-dedicated-checklist-item]].
