---
name: relaxed-assertion-test-title-must-update-together
description: "Changed assertion semantics → retitle test same commit"
metadata: 
  node_type: memory
  type: project
  keywords: [stale test name, superset guard, exact count drift, deepEqual canonical, contract label, out-of-scope nit]
  slug: relaxed-assertion-test-title-must-update-together
  phase: sched-land-bookkeeping/t3b
  date: 2026-06-26
  tags: 
    - drift-guard
    - test-calibration
    - test-title
    - superset-semantics
    - scope-lock
    - directive-rename
  related: 
    - drift-guard-pin-for-task-split-intermediate-state
    - plan-array-literal-lags-canonical-export
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
  updated: 2026-06-29
  updatedPhase: memory-provenance/t3
---

# Relaxed assertion semantics must update the test title in the same commit

**Rule:** when you change a test's assertion semantics (exact-count → superset, equality → range, …), rename the test title in the same commit. The title is the contract label; the body is its proof. A stale "exactly N members" title is worst on a drift-guard test — readers arrive there specifically to learn invariants, and a title contradicting the body invites reverting the correct body.

Instance (t3b): the `HARD_ESCALATION_REASONS` drift-guard body was relaxed to superset semantics while the title still read "has exactly 6 members matching canonical"; both auditors independently flagged the stale title as a Nit. Since resolved: the guard in `skills/war/assets/war-config.test.mjs` is titled by construct ('drift-guard: inline HARD_ESCALATION_REASONS in workflow-template.js matches canonical export in land-decision.mjs (#36)'), asserts exact `deepEqual` against the canonical `HARD_ESCALATION_REASONS` export in `land-decision.mjs`, and locates the inline array by regex extraction rather than line number. Do not pin the member count in prose — it has grown since; the export is the source of truth.

Suggested superset-guard title: `'inline X is canonical superset + exactly the <name> extra'`, not `'inline X has exactly N members matching canonical'`.

## Scope-lock corollary (memory-provenance/t3)

When a task is scope-locked to a single file and a rename inside it leaves a stale label in an out-of-scope test file, the auditor rates that a Nit, not a plan-faithfulness violation — the worker must NOT touch out-of-scope files to satisfy the rule. The follow-up task renames the test titles/section comments; document it in the audit finding rather than blocking the land. (The T3 instance — `TIER PRECEDENCE` / `VERIFY-ON-WRITE` labels in `workflow-template.test.mjs` — landed as prescribed; RESOLVED.)

Related family: [[drift-guard-pin-for-task-split-intermediate-state]], [[plan-array-literal-lags-canonical-export]], [[verbatim-mirror-directive-context-mismatch-at-destination]] (analogous cross-file lag when scope prevents correcting the mirror site).
