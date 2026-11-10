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
    - assert old value absent
    - PRESETS
    - default is X prose callout
    - tool allowlist enumeration
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

**Surface types.** A default (or guardrail statement) lives on at least these surfaces: the
authoritative preset/config table, field-reference prose ("the current default is X"), illustrative
JSON/schema examples, consuming skill files that copy-annotate it, and inbound cross-references in
sibling sections of the same doc. Scope narrowing counts too: a carved exception strands the flat
statement elsewhere, just like a value flip. A gate that only asserts the NEW value's presence in the
authoritative table passes while the rest go stale; it must also assert the OLD value is absent.

**Instance (fixed, #1990):** a roster fix in the architect tour left README.md's roster narration and
auditor model stale against `DEFAULTS.audit.roster` and `DEFAULTS.agents.auditor`.

**Recurrence (2026-10-28-blocked-ace-and-merge-provenance/phase-2, live at landed tip 9bcc4fa6):**
plan #2485 D2 changed the ace failed-attempt list, because a dead ace worker with a moved tip is now re-audited.
The phase-close polish fixed the list in `GLOSSARY.md` (Demote reason prefix entry), and the phase also fixed `skills/war/references/schemas.md`.
`docs/adr/0013-commanders-intent-and-disposition-routing.md` (the `DEMOTE_REASONS` bullet) still says, as of 2026-11-10, "(an untouched file, a dead ace worker, a red gate at the ace tip)".
The auditor finding named only the glossary sentence, so the polish never looked at the ADR.
The plan's Phase 5 ADR 0013 amendment line covers the residuals, not this list. Treat the ADR text as a candidate fix, unless the Lead rules it historical.
Verify still present before acting.

**Instance (allowlist):** adding the memory query tool to an agent's `tools:` line left 8 prose copies
of the allowlist stale. Grep both spellings (`Read/Grep/Glob/Write/Edit` and `Read, Grep, Glob, Write, Edit`).
Dated ADRs keep the old wording by design.

**Instance (presets):** `DEFAULTS.agents` and each `PRESETS[name].agents` partial are two truth sources;
a defaults sweep must diff both.

**How to apply:** route a same-fact instance found outside the task's own slice to a follow-up issue,
per [[dont-leave-work-on-the-table]]'s carve-out. When a default flips, grep the OLD VALUE in
justification phrasing ("default is X") across `skills/**`, not only the key name, and prefer a
mechanical doc-claim guard bound to `DEFAULTS` over a manual sweep (instance, fixed: the `commitLearnings`
flip once left three "the default is `true`" callouts in lessons-learned prose). Same family:
[[release-blurb-categorical-scope-enumeration-omits-a-window-class-despite-a-dedicated-checklist-item]].
