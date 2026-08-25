---
name: guard-duty-authored-in-an-earlier-phase-cannot-bind-a-normative-home-landing-in-a-later-phase
description: "A drift-guard row for a glossary/duty entry whose real normative home spans MULTIPLE phases (not just multiple same-phase tasks) can only ever bind a proxy/consumption surface from the earlier phase's task — a deps edge, the fix for a same-phase guard/mirror split, cannot reach across a phase boundary (this repo's own decomposition rule scopes deps edges to the same phase), so the guard stays structurally thin until a later phase explicitly schedules a re-bind task, which a plan can silently omit"
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

# A guard row can never bind a normative home that lands in a later PHASE — deps edges don't cross phases

## What happened (code-verified at the landed tip)

Verified at `959d1fa1d69e5fea368ebc4be64d2eab833df15a` on `claude/authoring-side-verification-600a79`
(read via the `_refinery` worktree at `.claude/war-worktrees/authoring-side-verification-2026-08-24/_refinery`,
HEAD == the landed tip exactly).

`skills/war/assets/skill-doc-contracts.test.mjs`'s D36 test (~line 2116-2179) mirrors eight new
CONTEXT.md glossary terms against their canonical war-strategy-authoring-surface homes. Seven rows
bind cleanly. The **`Evidence-artifacts duty`** row (line 2175-2179) is the exception: it carries
exactly one generic key (`/Evidence\s+artifacts[`*_]{0,2}\s+section/i`) bound to
`skills/war-strategy/references/plan-interview.md` — the term's **consumption** side. The
glossary entry's own body (CONTEXT.md) names the term's real normative homes as "the `/survey-corps`
memory-mined issue template" (Task 2.2, same phase — reachable) and "`/war`'s clustered filing
prompt" plus "the ADR 0044 amendment" (Tasks 3.2 and 3.1 — **Phase 3**, a later phase entirely).

Task 2.3 carries `deps: []`. Per this repo's own decomposition rule (CLAUDE.md, "Code-boundary
decomposition": *"dependency ⇒ `deps` wave edge **in the same phase** … phase edges only for what
must be landed first"*), a `deps` edge from a Phase-2 task can never reach a Phase-3 task's content
— that mechanism is scoped to within-phase ordering only. So unlike the established
[[guard-task-split-from-mirror-task-needs-deps-edge-same-wave-insufficient]] class (same phase,
different wave — fixable with a `deps` edge) this is structurally unfixable from inside Task 2.3:
there is no edge that lets this task's guard see Phase 3's content at all. The worker correctly
bound the row to the nearest reachable surface (the consumption side) instead, leaving the row's
real substance — the two filing homes and the ADR 0044 decision-record note — completely unguarded
until Phase 3 lands, and this plan does not schedule any Phase-3 task to come back and strengthen
the row afterward.

## Why this is not a worker or plan defect

Both audit seats that caught this routed it `note`/`follow-up`, not `absorb` or a hold — the gap is
a genuine consequence of splitting one glossary entry's guard duty from its multi-phase-spanning
producing surfaces, not a mistake in Task 2.3's own diff. This is the sibling class to
[[count-mirror-guard-duty-split-across-tasks-can-leave-a-third-doc-surface-permanently-unguarded]]
(same-phase named-arm-forms enumeration gap) — same underlying failure mode (a guard row's binding
surface set doesn't match its full mirror set), different root cause (there the gap was an
enumeration omission within one phase; here it is a phase-boundary the `deps` mechanism cannot
cross at all).

## The durable rule

When a plan authors a glossary/guard-row entry in phase N for a mechanism whose real normative
home is split across phase N and a later phase M, the phase-N task's drift guard can **only** ever
bind the phase-N-reachable proxy/consumption surface — never the true home. This is not a latitude
choice the worker can fix by trying harder; it is enforced by the frozen-phase-base architecture
itself. If durability of the full binding matters, the plan must **explicitly schedule a follow-up
task in phase M (or later)** to widen the guard's key set against the newly landed normative
surface — absent that scheduled task, the thin binding is permanent, silently, because every named
End state and check still passes.

## Locate-cue (verify still present before acting)

`skills/war/assets/skill-doc-contracts.test.mjs`, the D36 test block (~line 2102-2200), specifically
the `Evidence-artifacts duty` entry (~line 2175-2179) versus its seven siblings in the same test.

## Related

[[guard-task-split-from-mirror-task-needs-deps-edge-same-wave-insufficient]] — the same-phase
sibling class where a `deps` edge IS the fix.
[[count-mirror-guard-duty-split-across-tasks-can-leave-a-third-doc-surface-permanently-unguarded]]
— the same-phase enumeration-gap sibling class.
