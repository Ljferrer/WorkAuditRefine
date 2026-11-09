---
name: carried-rows-can-be-already-fixed-at-the-next-phase-base
description: "A finding row carried into the next phase can be fixed already by a late fix, so the task escalates with nothing to commit"
metadata:
  node_type: memory
  type: project
  keywords:
    - carried rows
    - seed task nothing to commit
    - stale carry
    - late fix landed between phases
    - escalation no diff
    - phase carry verify at base
  provenance: agent-unverified
  slug: carried-rows-can-be-already-fixed-at-the-next-phase-base
  phase: "2026-11-08-engine-recovery-relaunch-and-land/phase-3 (seed-2, seed-3)"
  tags:
    - planning
    - carry
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T17:39:18.469Z
---

# Carried rows can be already fixed at the next phase base

**What happened.** Phase 3 had seed tasks for rows carried from phase 2 (seed-2 and seed-3).
Phase 2 late fix 6a166f54 had already fixed both rows at the phase base.
Each worker found nothing to commit and escalated.

**Rule.** When you carry a row to a later phase, check the row against the new phase base first.
If a late fix already landed it, drop the seed task.
A seed task with no diff escalates, and it costs a worker round.

Not re-verified at the tip: this note records the run report, not a code referent.
Related: [[audit-log-finding-can-be-stale-by-land-time]].
