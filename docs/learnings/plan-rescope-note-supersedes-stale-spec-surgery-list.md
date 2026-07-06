---
name: ""
metadata:
  node_type: memory
  type: project
  keywords: [adjudication note, plan precedence, spec text lag, downgrade to nit, already landed elsewhere, scope deviation]
  provenance: code-verified
  slug: plan-rescope-note-supersedes-stale-spec-surgery-list
  phase: catalog-auto-roster-thorough-defaults/task1
  tags:
    - plan-faithfulness
    - spec-drift
    - auditor-adjudication
    - re-scope
  relates:
    - "[[redteam-adjudication-is-authoritative-version-source]]"
    - "[[spec-prose-must-cite-the-section-that-defines-a-mechanism-not-one-that-merely-exercises-it]]"
    - "[[adr-policy-table-entry-vs-mechanism-attribution]]"
  created: 2026-07-03
  originSessionId: 9c57c14a-92ed-4fc9-92d1-27be3d4dbad5
---

# A plan's explicit RE-SCOPE NOTE outranks stale spec surgery instructions — follow the plan, not the spec

## What happened

`docs/specs/2026-07-03-catalog-auto-roster-thorough-defaults.md` lines 115-118 instruct Task 1 to
flip `DEFAULTS`/`PRESETS` (the `rosterPolicy`/`thorough` worker-count knobs). But the plan
(`docs/plans/2026-07-03-catalog-auto-roster-thorough-defaults.md`, RE-SCOPE NOTE at lines 7-21)
explicitly adjudicates that D2/D3/D5 already landed via a prior PR (#472) and must be **kept as-is**;
Task 1 is re-scoped to be additive-only (`resolveWidenSource` + `RESERVED_LENSES` wiring). The worker
correctly left `DEFAULTS`/`PRESETS` untouched, matching the plan's re-scope, not the spec's original
surgery list. The auditor graded this a Nit ("spec text lags the ratified re-scope") rather than a
plan-faithfulness defect — the re-scoped work landed on master: the `RESERVED_LENSES` constant and
the `resolveWidenSource` function in `skills/war/assets/war-config.mjs` (verify still present before
acting).

## Durable rule

When a plan carries an explicit re-scope/adjudication note that says "spec says X, but X already
landed elsewhere / is out of scope here, so this task does Y instead" — **the plan's re-scope note is
authoritative over the spec's original instruction list**, and the implementation should follow the
plan. The auditor should not flag the deviation from spec text as a defect once it locates the plan's
adjudication; it is a documentation-lag Nit ("spec text should eventually be updated to reflect the
ratified re-scope") not a plan-faithfulness violation.

## How to apply

When a diff appears to skip spec-mandated surgery, before flagging as Critical/Major: grep the plan
for a RE-SCOPE / adjudication note near the task's header. If found and it explicitly excludes the
spec's instruction, downgrade to Nit (spec-doc-lag) and note it for a future doc-sync pass rather than
blocking the task. This is the spec-analogue of
[[redteam-adjudication-is-authoritative-version-source]] (which covers version-literal authority) —
here the same precedence rule applies to scope/surgery instructions, not version numbers.
