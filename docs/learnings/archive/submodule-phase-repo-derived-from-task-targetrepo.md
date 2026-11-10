---
name: submodule-phase-repo-derived-from-task-targetrepo
description: "targetRepo? is a per-task field; the phase's submodule repo identity is derived from its tasks' targetRepo, not a separate phase-level field"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: submodule-phase-repo-derived-from-task-targetrepo
  phase: submodule-inc2/phase-5-T9
  tags: 
    - schema-design
    - submodule
    - ledger
    - auditor-nit
  created: 2026-06-30
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
---

# submodule phase repo is derived from its tasks' targetRepo

## What happened

T9 (Phase 5, schemas.md) added `targetRepo?: "path/to/submodule"` to the **task shape** in `skills/war/references/schemas.md` (line 72 — verify still present before acting — found at `skills/war/references/schemas.md` @ submodule-inc2 integration branch).

The auditor raised a Nit: the schemas.md comment says the field is "present only on submodule tasks + their paired gitlink-bump tasks" but does not note that a submodule **phase**'s target repo is derived from its tasks' `targetRepo` (the per-task tag is the canonical persisted form; the phase has no separate `targetRepo` field).

The plan and SKILL.md (§Per-phase, §T4 threading) both speak of a submodule *phase* as the unit routed to a submodule repo. That language makes readers expect a phase-level field, but there isn't one.

## The resolution

The canonical answer is: **a submodule phase is the set of tasks sharing a `targetRepo`**. The phase's repo is emergent — the engine derives it from the tasks, not from a top-level ledger slot. This is the correct design; the schemas.md comment is faithful to the task-instruction scope. The ambiguity is real (reader trap) but non-blocking.

Optional one-line fix when updating schemas.md: append to the `targetRepo?` comment `"— a submodule phase is the set of tasks sharing a targetRepo"`.

## When this trips an auditor

Any future auditor who reads SKILL.md §Per-phase prose (which uses "submodule phase" as a first-class concept) and then looks for a phase-level `targetRepo` in the ledger schema will be confused. The correct look-up: scan the `tasks[]` array for `targetRepo` to identify which submodule repo the phase targets.

## D3 provenance

`targetRepo?` confirmed at `skills/war/references/schemas.md` line 72 in the integration `_refinery` worktree (`<repo-root>/.claude/worktrees/submod-inc2-d5ed42f/_refinery/skills/war/references/schemas.md`). Field is `targetRepo?: "path/to/submodule"` with the comment "present only on submodule tasks + their paired gitlink-bump tasks; the submodule checkout path (relative to the superproject); absent on superproject tasks."

> archived 2026-07-04: resolved — moved to archive
