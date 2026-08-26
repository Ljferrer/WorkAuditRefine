---
name: endstate-check-dispatch-numbers-rows-positionally-not-by-plan-id
description: "Endstate-check dispatch numbers conditions by array position, not plan id — subset phases silently diverge from plan numbering"
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

**Code-verified** at landed tip `10ab150911e7425e16d0944931129593e1410e1` on
`dev/2026-08-06-verdict-adjudication-integrity`, read via the run-scoped `_refinery` worktree
(`<repo-root>/.claude/war-worktrees/2026-08-06-verdict-adjudication-integrity-2026-08-16/_refinery/`).

`skills/war/assets/workflow-template.js`:
- `endStateRows` (built ~line 395) is derived straight from `ph.endState` — the **phase's own**
  End-state array, already whatever subset the plan/phase object carries. Each row keeps only
  `{ condition, tag, check }` — no `id` field survives normalization.
- The dispatched prompt block (`endStateBlock`, ~line 1768) renders each row as
  `` `  ${i + 1}. ${r.condition}...` `` — a purely positional 1-based index over `endStateRows`,
  recomputed fresh every dispatch.

A worker's `acceptance_criteria_covered` (A1) is just an integer array claiming these same positional
ids (`ACCEPTANCE_IDS_RULE`, ~line 795: "the numbered End-state conditions from the plan's Commander's
Intent that this task claims to satisfy").

**Observed mismatch:** the plan's own Commander's Intent numbers 16 End states, with #14 the trailing
release-phase condition and #15/#16 later amendments. Phase 1's `ph.endState` array correctly excludes
the release condition (owned by a later phase) but — because the array is authored as a straight subset
rather than a sparse/id-preserving list — the phase-1 dispatch renumbers everything after the gap:
plan id 15 (the zero-form `out.rounds` amendment) arrives to the phase-1 dispatch as position 14, and
plan id 16 (the D30/D32 pointer-pair guard) arrives as position 15. A worker in this phase reported
`acceptance_criteria_covered: [15]` meaning the plan's own id 15 (the zero-form condition it actually
implemented, correctly) — but under the *dispatched* numbering, 15 names the pointer-pair guard
condition instead, a condition that task's slice never touches. The gate-audit seat caught this only by
matching claimed ids against condition **text**, not the bare integer.

**How to apply:** never trust a worker's or auditor's bare `acceptance_criteria_covered` / claimed-id
integer as authoritative on its own when the phase's `ph.endState` array is a dropped-item subset of the
plan's full numbering — cross-check by condition **text** (verbatim, per `plan_ref`), the same discipline
`endStateBlock`'s own prompt already recommends ("Cross-check any worker-claimed End-state ids threaded
on this prompt (A1) against your rows"). When authoring a phase's `endState` array in a plan/roadmap, be
aware there is no engine mechanism to preserve original plan ids across a dropped out-of-phase
condition — the array position *is* the id at dispatch time, full stop.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js` —
`const endStateRows = Array.isArray(ph && ph.endState)` (~line 395, no id field kept) and
`+ endStateRows.map((r, i) => pt`  ${i + 1}. ${r.condition}` (~line 1768, positional render).

> archived 2026-08-25: resolved — moved to archive
