---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [stale spec value, deepEqual, mirrored constant, append not replace, drift test, HARD_ESCALATION_REASONS]
  slug: plan-array-literal-lags-canonical-export
  phase: audit-scheduler-integrity/p1
  date: 2026-06-26
  tags: 
    - plan-mismatch
    - drift-guard
    - TDD
  related: 
    - - drift-guard-pin-for-task-split-intermediate-state
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Plan array literal lags the canonical export

## What happened

The plan's Step 3 listed the expected final value of `HARD_ESCALATION_REASONS` as
`['escalate','audit-blocked','conflict','dep-failed']` — omitting `'land_stale'`, which had
already been appended to the canonical export at v0.6.0 (clandiso phase work).

The worker had to reconcile: appending `'dep-failed'` to the CURRENT array (which already
contained `'land_stale'`) rather than replacing with the plan's stale literal.

## Why it matters

The drift guard's `deepEqual` assertion in `war-config.test.mjs` is the ground truth —
it extracts the inline mirror from `workflow-template.js` and deep-equals it against the
canonical export. Any plan-stated literal is advisory; the test is authoritative.

**Rule:** when a plan enumerates the expected final state of a mirrored constant, treat it as
*approximate* and defer to the drift guard. Never replace the live array with the plan's literal;
always append to (or remove from) the current value.

## Cross-links

Companion to [[drift-guard-pin-for-task-split-intermediate-state]] — same family: plan text
diverges from live code during multi-phase work; the drift guard is the arbiter.
