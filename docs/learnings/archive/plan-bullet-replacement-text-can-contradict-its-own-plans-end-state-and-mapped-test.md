---
name: plan-bullet-replacement-text-can-contradict-its-own-plans-end-state-and-mapped-test
description: "A plan task-bullet's literal replacement text can byte-diverge from its own End state and mapped test — resolve toward the checkable pair, not the bullet"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: plan-bullet-replacement-text-can-contradict-its-own-plans-end-state-and-mapped-test
  phase: audit-gate-evidence-fidelity/1.1 (2026-07-12) + aftermath-class1-gate-evidence/1.1 (recurrence 2, 2026-07-16)
  keywords:
    - plan self-contradiction
    - backticks
    - End state grep
    - mapped durable test
    - intent is the ceiling
    - plan slice is the floor
    - plan authoring defect
    - land-cwd noun
    - Build order bullet
    - block comment rationale
    - source-comment-overclaims
    - "#815"
  tags:
    - plan-pattern
    - auditor-warning
    - red-team
    - plan-fidelity
  created: 2026-07-12
  updated: 2026-07-16
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
---

# A plan's own task-bullet text can literally contradict its own End state and mapped test

**Rule:** a plan task-bullet's literal replacement text can byte-diverge from the same plan's
checkable End state and mapped test. Resolve toward the checkable pair (End state + test), not the
bullet.

**Instance:** `docs/plans/2026-07-12-audit-gate-evidence-fidelity.md`'s task-1.1 bullet for the
#815 land-cwd fix said to replace the clause with `"the gate's cwd stays the `_refinery` land
worktree"` **(exact bytes, backticks included)**. But the same plan's End state #8 checked
`grep -n "cwd stays the _refinery land worktree"` — **no backticks** — and required a durable test
asserting that exact source-count. A backtick-including implementation would fail both. The worker
resolved toward the checkable pair, and two auditor seats graded the bullet-vs-End-state
disagreement a non-blocking Nit/note, per "intent is the ceiling, plan slice is the floor".

**Why durable — distinct from the routine floor-vs-ceiling latitude case:** this is not Purpose
prose being broader than a literal End state. It is a **plan self-contradiction within the same
document**. A plan author copying a bullet's literal text without cross-checking it against the
End-state grep can ship an inconsistent plan, and a worker who implements the bullet literally
fails its own phase's gate.

**How to apply:**
- When authoring or reviewing a plan bullet that gives an exact-bytes replacement string, grep that
  same plan's Commander's Intent End state for any checkable condition (a `grep`/count) naming the
  same clause, and confirm the two are byte-identical before publishing.
- When auditing an implementation that diverges from a plan bullet's literal text: check whether
  the divergence is FAITHFUL to that plan's own End state and mapped test before flagging it as a
  defect — if the live durable test confirms the candidate, the bullet (not the code) is the stale
  artifact, and the finding is at most a Nit/note.
- A sweep for one restatement of a corrected literal is a floor, not a ceiling. When the plan was
  later corrected (#893), the same backticked form also sat in a second, unparenthesized Tests-list
  sub-bullet that a grep for the parenthetical never reached. Hand-scan the same scope for siblings
  phrased without the grepped token.
- Grade by what the stale bullet describes. If it describes a CHECKABLE condition the candidate must
  satisfy, it is worth a plan-correction task if the plan is ever re-touched. If it only
  pre-scripts block-comment prose that the worker correctly overrode (a second instance, where a
  Build-order bullet scripted a rationale the red-team-corrected End state banned), an
  informational Nit is enough: the code is already the source of truth and carries no false claim.
  Either way it is never a hold.

> archived 2026-07-27: resolved — moved to archive
