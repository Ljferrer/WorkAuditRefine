---
name: an-ace-commit-can-settle-an-unruled-ask-by-fixing-a-sibling-absorb-finding
description: "An ace commit can settle an unruled ask by fixing a sibling absorb finding"
metadata:
  node_type: memory
  type: project
  keywords:
    - ask disposition
    - absorb
    - ace commit
    - unruled ask
    - Checkpoint ruling
    - duplicate finding
    - fork settled
  provenance: code-verified
  slug: an-ace-commit-can-settle-an-unruled-ask-by-fixing-a-sibling-absorb-finding
  phase: 2026-11-08-model-routing-and-prompt-byte-budgets/phase-4
  tags:
    - audit
    - disposition
    - ace
    - checkpoint
  created: 2026-11-10
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T03:15:20.295Z
---

Two seats can raise one defect with different dispositions: one `ask`, one `absorb`.

The ace machinery drains the `absorb` row, so it ships one fork of the open `ask` before any ruling.

Phase 4 task 4.1: correctness raised the floor-retry tier as an `ask`, and cascading-impact raised it as an `absorb`.

The ace commit 3f214cfc moved the floor retry to `routeWorker(r.task, 'fix')`, which is the ask's "Yes" fork.

The next round re-raised the ask as unruled, so the Checkpoint had to rule against code that already landed.

When an `ask` and an `absorb` name the same site, the Checkpoint rules the ask against the landed code. If it rules the other fork, revert that one call site and its test assertion.

Do not treat the ask as settled only because the ace commit shipped.

Related: [[an-ask-finding-re-raised-as-major-absorb-keeps-the-ace-ladder-from-converging]].

Locate-cue: verify still present before acting. Found at `skills/war/assets/workflow-template.js` (the floor-family retry dispatch, `...routeWorker(r.task, 'fix')` under the #817 comment) @ phase 4 landed tip 7dfb8b69.
