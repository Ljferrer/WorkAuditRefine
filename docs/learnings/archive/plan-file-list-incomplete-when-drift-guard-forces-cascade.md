---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [scope creep false positive, canonical export, deepEqual, faithful deviation, mirror sync, extra touched files]
  slug: plan-file-list-incomplete-when-drift-guard-forces-cascade
  phase: audit-scheduler-integrity/t4
  date: 2026-06-26
  tags: 
    - plan-deviation
    - drift-guard
    - mirror-discipline
    - file-list
  related: "[[drift-guard-pin-for-task-split-intermediate-state]], [[plan-array-literal-lags-canonical-export]]"
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# A plan's stated file list is incomplete when a drift guard forces a mirror-discipline cascade

## What happened

Task 4's plan enumerated five files:
`war-auditor.md, war-refiner.md, workflow-template.js, schemas.md, workflow-template.test.mjs`.

To add `gate-evidence` to `workflow-template.js`'s inline `HARD_ESCALATION_REASONS`
array, the worker **also had to** touch:

- `skills/war/assets/land-decision.mjs` — add `'gate-evidence'` to the canonical export
- `skills/war/assets/land-decision.test.mjs` — add a test case for it
- `skills/war/assets/war-config.test.mjs` — the drift guard asserts `deepEqual(inline, canonical)`

Omitting any of these would have red-failed the existing drift guard.  The worker's
cascade was **correct and required**, not scope-creep.

## Why it happens

The WAR "Mirror discipline" note (plan lines 242-244, 266) mandates that every
`HARD_ESCALATION_REASONS` change keeps BOTH copies (inline in template + canonical export)
and the drift guard in sync.  The plan's file list predates the worker knowing exactly
which files must move; the drift guard is the enforcer, not the file list.

## Durable pattern

**The drift guard is the ground truth for what must be touched, not the plan's file list.**
When a plan adds a constant to an array that is already guarded by a `deepEqual` drift
test, treat the canonical export + drift guard + any existing test case as MANDATORY
additional touched files even if they are absent from the plan's file enumeration.

Auditors should classify such cascade touches as "faithful, necessary deviation" rather
than scope-creep, and note them in the PR/commit body for traceability.

> archived 2026-07-21: resolved — moved to archive
