---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [stale comment, nearby-but-wrong, declaration comment, target locator, forward reference, doc surface miss]
  slug: plan-named-comment-location-must-be-exact-target
  phase: sched-land-bookkeeping/t3b
  date: 2026-06-26
  tags: 
    - plan-mismatch
    - inline-comment
    - doc-completeness
    - drift-guard
  related: 
    - source-comment-lags-emitted-prompt-after-rewrite
    - default-flip-must-audit-all-doc-surfaces
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
---

# When the plan names a specific line for a comment update, hit that exact location

## What happened

A plan step named a specific symbol's inline comment to update (the
`HARD_ESCALATION_REASONS` declaration comment in `skills/war/assets/workflow-template.js`
— the `// HARD_ESCALATION_REASONS mirrors land-decision.mjs export ...` line just above the
`const HARD_ESCALATION_REASONS = [...]` declaration). The worker documented the required
fact correctly but in a *nearby* comment, leaving the plan-named declaration comment stale
and contradictory. Auditor graded it Minor: intent satisfied, named location missed.

## Why it matters

"Document it somewhere near here" is not the same as "update the comment at line X".
When a plan names a specific symbol or line for a comment change, a nearby-but-wrong
location leaves the named location stale and contradictory — which is exactly what a
future reader consulting that specific declaration will see.

## Rule

If the plan text says "update the comment at <location>", treat that as a target
locator, not a suggestion. Documenting the same fact elsewhere does not satisfy the
plan directive. When you add divergence documentation somewhere other than the named
location, also update the named location — even if only to add a forward-reference
(`# see post-loop sweep comment above for scheduler-local extras`).

## Cross-links

Related: [[source-comment-lags-emitted-prompt-after-rewrite]] (comments lagging code
changes), [[default-flip-must-audit-all-doc-surfaces]] (all named surfaces must be hit).
