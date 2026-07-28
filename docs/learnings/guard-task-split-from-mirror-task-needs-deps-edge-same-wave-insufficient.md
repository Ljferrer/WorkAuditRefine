---
name: guard-task-split-from-mirror-task-needs-deps-edge-same-wave-insufficient
description: "A drift guard assigned to a different task than the mirror clause it guards is RED at the frozen phase base by construction — 'same wave' is not a substitute for a deps edge."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - deps edge
    - same wave
    - frozen phase base
    - ADR 0025
    - drift guard
    - cross-ADR mirror
    - file-disjointness
    - PLAN-DEFECT
    - within-phase dependency
    - skill-doc-contracts
  provenance: agent-unverified
  slug: guard-task-split-from-mirror-task-needs-deps-edge-same-wave-insufficient
  phase: 1
  tags: 
    - war-execution
    - plan-decomposition
    - drift-guard
    - adr-0025
  created: 2026-07-27
  originSessionId: 0ad881e1-4bbc-43c6-8e45-8597d9cec1cf
  modified: 2026-07-28T05:44:15.147Z
---

# A guard task split from its mirror-authoring task needs a `deps` edge — "same wave" is not enough

**The rule:** when ADR 0025's "mirror and guard land as one task" collides with the
file-disjointness rule (the guard file is already owned by a different task), the resolution is
a `deps` edge from the guard task onto the mirror-authoring task — not "same phase, same wave, so
they land together." Every task worktree in a wave is cut from ONE **frozen phase base**; waves
order *when* workers run, never *what base they see*. A guard task in the same wave as (but not
`deps`-linked to) the task that authors the fact it guards implements and audits against a base
that does **not** yet contain that fact — its own new guard row is RED by construction, through no
fault of the guard's own diff.

This is confirmed architecture, not speculation: see `CLAUDE.md`'s "Execution architecture"
section — "Every task worktree is cut from one frozen phase base... waves order when workers run,
never what base they see" — and the decomposition rule "(2) dependency ⇒ `deps` wave edge in the
same phase (worker's first act is a rebase onto the integration tip), phase edges only for what
must be landed first." A `deps` edge is the sanctioned way to give a downstream task a base that
includes an upstream sibling's *content* — it is explicitly **not** the forbidden "use deps/waves
to dodge a same-file collision" (the guard task and the mirror task remain genuinely
file-disjoint; the deps edge encodes a content dependency, not a file dodge).

## This phase's instance — verify before treating as a live fix

At phase 1 of `2026-07-26-standing-doc-and-remedy-truth-sweep`, red-team's finding 5 (Major,
`needsDecision`) caught Task 1.2 shipping a new unguarded cross-ADR prose mirror (ADR 0019's
Amendment restating a fact ADR 0040 §B already carries — ADR 0025 binds). Red-team's own
resolution assigned the guard to Task 1.6 (which already owned
`skills/war/assets/skill-doc-contracts.test.mjs`) with the explicit reasoning "the two tasks are
in the same phase and the same wave, so the mirror and its guard still land together" — **and
shipped it that way**: at the landed tip (5c46597, verified via the plan's own Build order line
"one wave, no deps" and the red-team doc's finding 5 resolution), Task 1.2 and Task 1.6 both carry
`deps: []`. Neither the plan nor the red-team doc records a `deps` edge between them.

This servitor's spawn narrative asserted that a live escalation during Work+Audit caught exactly
the base-mismatch this pattern predicts (Task 1.6's guard reding against a base still carrying
ADR 0019's old one-site clause; worker returns `PLAN-DEFECT` after a self-confound pass; Lead
fixes it with `deps: ["1.2"]`) — **but this could not be confirmed at the landed tip**: the
checked-in plan/red-team artifacts still show the "same wave, no deps" design as shipped, with no
back-ported deps edge. Either (a) the live fix was applied only at the run/dispatch level and was
never reflected back into the versioned plan doc, or (b) the escalation narrative doesn't match
this phase's actual history as literally as described. Do not cite this phase's task numbers as a
confirmed instance of the deps-edge fix without independently re-checking the run's actual
escalation/audit log (not available to this servitor — no ledger/journal artifact was found under
the phase's worktree tree at land time). The **general rule above is architecture-verified and
durable regardless** of whether this specific incident's resolution is confirmed.

## If you hit this

- Guard test lives at `skills/war/assets/skill-doc-contracts.test.mjs` (verify still present
  before acting — the D25 cross-ADR mirror-registry test naming ADR 0019 and ADR 0040 §B was
  found there at the landed tip, phase 1 of this plan).
- Proof method for a genuine instance: temp-apply the sibling task's (not-yet-landed) wording
  locally, confirm the guard goes green, then restore — this discriminates "guard is broken" from
  "guard's base is stale."
- Self-confound gate before filing `PLAN-DEFECT`: rule out your own edits, a bad rebase, a partial
  run, and an over-pinned regex first.

Related: [[within-phase-dep-gate-must-rerun-on-integrated-tip]] (the mirror-image case — a gate
that must re-run on the *integrated* tip after dependent tasks land, rather than trusting a
per-branch result).
