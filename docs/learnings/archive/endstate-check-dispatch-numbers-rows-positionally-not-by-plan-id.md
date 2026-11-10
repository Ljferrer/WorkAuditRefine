---
name: endstate-check-dispatch-numbers-rows-positionally-not-by-plan-id
description: "The END-STATE CHECK dispatch numbers conditions by array position, not plan id, so on a subset phase cross-check claimed ids by condition text"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: endstate-check-dispatch-numbers-rows-positionally-not-by-plan-id
  phase: 2026-08-06-verdict-adjudication-integrity/1.7
  keywords:
    - endStateRows
    - acceptance_criteria_covered
    - END-STATE CHECK
    - endStateAttestations
    - positional numbering
    - plan id offset
    - phase-scoped subset
    - workflow-template.js
    - claimed End-state ids
  tags:
    - war
    - workflow-template
    - end-state
    - gate-audit
    - plan-authoring
  created: 2026-08-16
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-16T08:22:27.420Z
---

# The dispatched END-STATE CHECK list is numbered by array position, not by the plan's own End-state id

**Fact:** in `skills/war/assets/workflow-template.js`:
- `endStateRows` is derived straight from `ph.endState` — the **phase's own** End-state array,
  already whatever subset the plan/phase object carries. Each row keeps only
  `{ condition, tag, check }` — no `id` field survives normalization.
- The dispatched prompt block (`endStateBlock`) renders each row as
  `` `  ${i + 1}. ${r.condition}...` `` — a purely positional 1-based index over `endStateRows`,
  recomputed fresh every dispatch.

A worker's `acceptance_criteria_covered` (A1) is just an integer array claiming these same positional
ids (`ACCEPTANCE_IDS_RULE`: "the numbered End-state conditions from the plan's Commander's Intent that
this task claims to satisfy").

**Why it matters:** when a phase's `endState` array drops a condition another phase owns, every
condition after the gap is renumbered at dispatch. A worker that reports the plan's own id then names
a different condition under the dispatched numbering. In one instance a gate-audit seat caught it only
by matching claimed ids against condition **text**, not the bare integer.

**How to apply:** never trust a worker's or auditor's bare `acceptance_criteria_covered` / claimed-id
integer as authoritative on its own when the phase's `ph.endState` array is a dropped-item subset of the
plan's full numbering — cross-check by condition **text** (verbatim, per `plan_ref`), the same discipline
`endStateBlock`'s own prompt already recommends ("Cross-check any worker-claimed End-state ids threaded
on this prompt (A1) against your rows"). When authoring a phase's `endState` array in a plan/roadmap, be
aware there is no engine mechanism to preserve original plan ids across a dropped out-of-phase
condition — the array position *is* the id at dispatch time, full stop.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js` —
`const endStateRows = Array.isArray(ph && ph.endState)` (no id field kept) and
`+ endStateRows.map((r, i) => pt`  ${i + 1}. ${r.condition}` (positional render).

Related: [[plan-decision-id-and-end-state-id-can-share-a-numeral-and-get-conflated-in-worker-self-reports]]

> archived 2026-08-25: resolved — moved to archive
