---
name: guard-duty-authored-in-an-earlier-phase-cannot-bind-a-normative-home-landing-in-a-later-phase
description: "A phase-N drift guard cannot bind a normative home that lands in phase M; schedule an explicit phase-M task to re-bind the guard row."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - guard duty split
    - cross-phase deps edge
    - normative home
    - drift guard
    - skill-doc-contracts.test.mjs
    - D36
    - Evidence-artifacts duty
    - phase boundary
    - frozen phase base
    - proxy surface binding
  provenance: code-verified
  slug: guard-duty-authored-in-an-earlier-phase-cannot-bind-a-normative-home-landing-in-a-later-phase
  phase: "authoring-side-verification/phase-2 (Task 2.3 audit findings, D36 row)"
  tags: 
    - plan-decomposition
    - drift-guard
    - war-execution
    - guard-architecture
  created: 2026-08-25
  originSessionId: dcda690d-99d2-4fba-9d28-2a2a858d4676
  modified: 2026-08-25T07:01:40.480Z
---

# A guard row cannot bind a normative home that lands in a later PHASE; deps edges do not cross phases

**Rule:** when a plan authors a glossary or guard-row entry in phase N for a mechanism whose
real normative home lands in a later phase M, the phase-N task's drift guard can only bind the
phase-N-reachable proxy or consumption surface. A `deps` edge orders waves within one phase
(CLAUDE.md, "Code-boundary decomposition"); it never reaches a later phase's content, and the
frozen phase base means the later surface does not exist yet. The worker cannot fix this by
trying harder. If the full binding matters, the plan must schedule an explicit task in phase M
or later to widen the guard's key set against the landed surface. Without that task the thin
binding is permanent and silent, because every End state and check still passes.

**What happened:** the D36 test in `skills/war/assets/skill-doc-contracts.test.mjs` mirrors
CONTEXT.md glossary terms against their canonical authoring-surface homes. The
`Evidence-artifacts duty` row was authored in Phase 2 (Task 2.3, `deps: []`) on one generic
key bound to `skills/war-strategy/references/plan-interview.md`, the consumption side. Its real
homes (the `/survey-corps` issue template, `/war`'s clustered filing prompt, the ADR 0044
amendment) landed in Phase 3. Both audit seats routed it `note` / `follow-up`, not a hold: the
gap was a consequence of splitting one entry's guard duty across phases, not a defect in the
diff. The plan scheduled no Phase-3 task to come back and strengthen the row.

**Fixed in** commit `45a66a8` (PR #1992, re-bind #1652/#1676): the row in `D36_ROWS` now binds
all three homes (ADR 0044 `### Evidence-duty home`, `/survey-corps` Step 0.3, the
`workflow-template.js` filing emission clause) under a `(D36, re-bind #1652/#1676)` comment
that cites this lesson.

**Locate-cue:** `skills/war/assets/skill-doc-contracts.test.mjs`, the `D36_ROWS` constant and
its `Evidence-artifacts duty` entry, plus the `(D36, re-bind #1652/#1676)` header comment.

## Related

[[guard-task-split-from-mirror-task-needs-deps-edge-same-wave-insufficient]] (archived): the
same-phase sibling class where a `deps` edge IS the fix.
[[count-mirror-guard-duty-split-across-tasks-can-leave-a-third-doc-surface-permanently-unguarded]]
(archived): the same-phase enumeration-gap sibling class.
