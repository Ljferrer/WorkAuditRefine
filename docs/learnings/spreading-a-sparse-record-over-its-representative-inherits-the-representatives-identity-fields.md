---
name: spreading-a-sparse-record-over-its-representative-inherits-the-representatives-identity-fields
description: "A row built as { ...rep, ...x } from a sparse x silently takes rep's seat, class and line"
metadata:
  node_type: memory
  type: project
  keywords:
    - object spread
    - unfold merged rows
    - sparse record inherits
    - wrong attribution
    - corroborateSurvivor
    - siblingTouch VERIFY FIRST
    - seats corroboration
  provenance: code-verified
  slug: spreading-a-sparse-record-over-its-representative-inherits-the-representatives-identity-fields
  phase: 2026-11-08-engine-findings-ace-and-late-fix/phase-4 (late fix p4-latefix-1 on task 4.1)
  tags:
    - workflow-template
    - finding-records
    - attribution
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-10T05:34:52.758Z
---

# Spreading a sparse record over its representative inherits the representative's identity fields

A late fix in phase 4 unfolds `merged[]` rows out of a VERIFY FIRST representative at the filing stamp.
It builds each new row as `{ ...rep, ...x, seats: [ref] }`.
`rep` strips only `merged` and `suggested_fix`.
A D25 `merged[]` element (written by `corroborateSurvivor`) carries only seat, title and rationale.
So every field `x` lacks comes from the representative: `seat`, `findingClass`, `line`, `severity`, `demoteReason`, `drainCause`.
The representative's own `seats` list also still holds the unfolded raiser, so one seat backs two rows.
Nothing is dropped, but attribution and class can be wrong on the surfaces the Checkpoint reads.

Two auditors raised it as an `absorb` Minor. The late-fix worker listed it under "Ignore for now", and the late-fix re-audit still approved.

Rule: when you mint a row from a sparse record, list the fields it may inherit, and strip identity fields from the base.
Also remove the minted row's seat from the base's corroboration list.
A fixture that checks only the new row's title cannot see this, so assert the seats cell and the class too.

Locate-cue: verify still present before acting — `const { merged: _rest, suggested_fix: _fix, ...rep } = m` and `unfolded.push({ ...rep, ...x, seats:` in `skills/war/assets/workflow-template.js`, found @ landed tip 0b53a8ac (the run's `_refinery` worktree, HEAD equal to the tip).

Also see [[new-record-signal-computed-but-dropped-by-a-pre-existing-explicit-key-projection]].
