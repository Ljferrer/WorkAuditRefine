---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [transient divergence, canonical export, inline literal, deepEqual mirror, TODO comment, temporary green gate]
  slug: drift-guard-pin-for-task-split-intermediate-state
  phase: clandiso/phase-2
  tasks: t4
  date: 2026-06-25
  tags: 
    - drift-guard
    - task-split
    - test-calibration
    - inline-mirror
  related: 
    - run-provision-config-not-yet-mirrored-into-template
  originSessionId: 4f3e4595-5aaa-40b5-9004-183f4bb53936
---

# Drift-guard: pin to intermediate value when a task-split creates a legitimate transient divergence

## Rule

When a drift-guard compares A == B (e.g. the inline `HARD_ESCALATION_REASONS`
literal in `workflow-template.js` vs its canonical export in `land-decision.mjs`,
pinned by the drift-guard test in `war-config.test.mjs`) and a planned task-split
means A and B **legitimately diverge** in an intermediate state:

1. Do NOT pre-empt the other task's surface — revert any accidental cross-surface touch.
2. Pin the drift-guard to the **current-correct intermediate value** (not the
   eventual target).
3. Leave a `TODO(<TaskN>)` comment in the test naming the exact task responsible
   for restoring the canonical `deepEqual` comparison.

This keeps the gate green across the intermediate state while making the
unfinished seam explicit and trackable. Applies to any cross-file mirror (inline
JSON, doc tables, schema enums).

Instance resolved: the `'land_stale'` split landed; the drift-guard now asserts
the canonical `deepEqual([...inline].sort(), [...HARD_ESCALATION_REASONS].sort())`
with no intermediate pin or TODO.

[[run-provision-config-not-yet-mirrored-into-template]]
