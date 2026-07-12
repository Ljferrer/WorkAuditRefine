---
name: plan-affected-file-list-doc-completeness-vs-correctness
description: "Plan Files list names untouched file; coverage lands elsewhere"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: plan-affected-file-list-doc-completeness-vs-correctness
  phase: F01-D2D3/p2 + packaging-floor-enum-wiring/p1-T2
  updated: 2026-07-06
  keywords:
    - plan file list wrong location
    - named file not touched
    - drift guard lives elsewhere
    - land-decision.test.mjs vs war-config.test.mjs
    - HARD_ESCALATION_REASONS mirror coverage
    - doc-completeness not a coverage gap
  tags:
    - plan-faithfulness
    - doc-honesty
    - auditor-lens
  related:
    - scope-hook-blind-to-bash-write-path
    - defined-but-not-yet-emitted-plan-slice-pattern
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Plan affected-file list: completeness gap ≠ correctness defect

**Instance (F01 D2/D3, phase 2):** the plan listed `agents/war-worker.md` as affected ("worker doc
states the accepted sibling-/parent-write residual"), but the candidate was byte-identical to
baseline — the residual prose was never added (and still hasn't been; only a servitor-confinement
note exists there). Flagged Minor, not blocking: the existing worker text ("Work only inside it",
still present) is an instruction, not a falsifiable capability claim, and ADR 0002
(`docs/adr/0002-scope-by-agent-type.md`, the "Accepted residual" bullet) already documents the
sibling-write residual honestly.

## The durable rule

When auditing plan-faithfulness, distinguish:
- **False claim present** → correctness defect, must block.
- **Honest prose absent that the plan asked for** → completeness/plan-faithfulness gap (Minor);
  only blocks if the absence leaves a misleading statement standing.

**Test to apply:** "Does the current text assert something demonstrably untrue?" If no, the gap
is Minor even if the plan step was skipped.

**Recurrence (packaging-floor-enum-wiring phase 1, T2, 2026-07-06) — the "wrong file, right guard"
variant:** the plan slice's file list named `skills/war/assets/land-decision.test.mjs` as a touched
test surface for adding `'unpackaged'` to `HARD_ESCALATION_REASONS`. The diff never touched that
file — the actual cross-mirror drift guard (inline `workflow-template.js` literal vs. the canonical
export in `land-decision.mjs`) lives in `war-config.test.mjs`, verified code-present at line
597-618 (`'drift-guard: inline HARD_ESCALATION_REASONS ... matches canonical export ...'`), which
WAS updated with an `.includes('unpackaged')` assertion plus the pre-existing exact-`deepEqual`
cross-mirror pin. `land-decision.test.mjs` only carries per-reason `decideLand` membership checks
(`dep-failed`/`gate-evidence`/`unrunnable-deps`) and never had one for the direct sibling precedent
`'no-test'` (M2) either — so omitting a dedicated `'unpackaged'` case there is consistent with
established convention, not an erosion. Flagged 5x across serial audit passes (worker + gate-audit),
always Nit/note, never a hold — this is the exact "completeness gap ≠ correctness defect" test
firing on file-list-location rather than content. **Generalized rule:** when a plan names file X for
a mirror/drift-guard assertion, confirm which file *actually owns* that guard historically (grep the
sibling/precedent reason's coverage first) before treating X's absence as a gap — the guard's real
home may differ from the plan's file list without any coverage loss.
