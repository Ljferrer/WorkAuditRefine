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

A row built as `{ ...rep, ...x }` takes every field `x` lacks from `rep`.
When `x` is sparse (seat, title and rationale only), the new row silently inherits `rep`'s seat, class, line and severity.
If the base's corroboration list still holds the new row's seat, one seat backs two rows.
Nothing is dropped, but attribution and class go wrong on the surfaces the Checkpoint reads.

**Fixed (phase-4 instance, late fix on task 4.1, 0b53a8ac):** the VERIFY FIRST unfold in `skills/war/assets/workflow-template.js` now strips `seat`, `findingClass` and `drainCause` from `rep`, and removes the raiser from the representative's seats list. `demoteReason` still rides `...rep`. Before the fix, two auditors raised it as an `absorb` Minor, the late-fix worker listed it under "Ignore for now", and the re-audit still approved.

Rule: when you mint a row from a sparse record, list the fields it may inherit, and strip identity fields from the base.
Also remove the minted row's seat from the base's corroboration list.
A fixture that checks only the new row's title cannot see this, so assert the seats cell and the class too.

Locate-cue: verify still present before acting — `const { merged: _rest, suggested_fix: _fix, seat: _seat, findingClass: _fc, drainCause: _dc, ...rep } = m` and `unfolded.push({ ...rep, ...x, seats:` in `skills/war/assets/workflow-template.js`; the test comment "late defect of T4.1" in `skills/war/assets/workflow-template.engine-1.test.mjs`.

Also see [[new-record-signal-computed-but-dropped-by-a-pre-existing-explicit-key-projection]].
