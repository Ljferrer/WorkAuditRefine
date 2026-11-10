---
name: new-marker-emitter-must-widen-every-capture-surface-in-one-commit
description: "Adding a new emitter to an existing marker mechanism is not done until the dispatched clause, the standing card and schemas.md capture prose are widened in one commit"
metadata:
  node_type: memory
  type: project
  keywords:
    - marker emitter
    - WORKTREE_HYGIENE
    - capture surface
    - worktreeHygieneClause
    - schemas.md
    - standing card
    - dispatched prompt
    - one commit
  provenance: code-verified
  slug: new-marker-emitter-must-widen-every-capture-surface-in-one-commit
  phase: "2026-08-25-engine-reliability-and-filing-fidelity/phase-8, task 8.1"
  tags:
    - plan-code-mismatch
    - contract-drift
  created: 2026-08-26
---

When a second site emits an existing marker (here `WORKTREE_HYGIENE` from `_refinery`),
re-grep and widen every capture surface together, or the marker is dropped or mis-attributed.

**What happened (#1476 gap 4):** Phase 8 Task 1 extended `reuse_hygiene` to run on
`cmd_ensure_refinery_worktree`'s reuse arms (b) and (c) in
`skills/war/assets/provision-worktrees.sh`, so the run-scoped `_refinery` worktree — which has
**no owning task id** — can now itself emit `WORKTREE_HYGIENE` marker lines. Every downstream
capture surface was left describing the original, single emitter only, confirmed live at the
landed tip:
- `skills/war/assets/workflow-template.js`'s `worktreeHygieneClause`: "an ensure-worktree REUSE
  may emit `WORKTREE_HYGIENE` marker lines ... Capture each as
  `{ task: "<that task's id>", ... }`" — no task id exists for the refinery worktree.
- `agents/war-refiner.md` provision flavor 1 (`## provision`, bullet 1): "capture
  `WORKTREE_HYGIENE` marker lines an `ensure-worktree` reuse emits into an optional
  `worktreeHygiene` array" — same ensure-worktree-only attribution.
- `skills/war/references/schemas.md`'s `worktreeHygiene` bullet: "captured from the
  `WORKTREE_HYGIENE` marker lines an `ensure-worktree` **reuse** emits" — same.

**Why it matters:** a refinery-worktree hygiene repair or detection is either dropped by the
capturing refiner or captured with a fabricated `task` field. It fails open (markers ride exit
0, no routing or halt impact), but the Lead-visible phase-report line this mechanism exists to
deliver is silently missing for this emitter. It was filed as a `follow-up` (Minor) at
gate-audit, not absorbed: the fix needs `workflow-template.js` + `agents/war-refiner.md` in ONE
commit per the standing/dispatched split, plus the `schemas.md` contract line, and the byte
surface for `workflow-template.js`'s prompt literals was already at a funded ceiling.

**How to apply:** adding a new emitter to an existing marker/event mechanism is not complete
until EVERY documented capture surface (dispatched prompt clause + its standing-card mirror +
the schema contract) is re-grepped and widened in the same commit. Producer-side "same hygiene
arm" work reliably outruns consumer-side capture prose; this was the third distinct instance of
that gap on this codebase.

**Related:** [[floor-script-header-can-claim-unbacked-downstream-capture]] — the parent lesson
this was split from (trusting a header's claim about a consumer).
