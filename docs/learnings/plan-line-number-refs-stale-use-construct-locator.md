---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [line drift, integration churn, enclosing symbol, anchor by function name, benign mismatch, scope creep false alarm]
  slug: plan-line-number-refs-stale-use-construct-locator
  phase: F05/p3-t5
  tags: 
    - plan-drift
    - line-numbers
    - integration-churn
    - auditor-nit
  related: "[[plan-gate-enumeration-stale-after-stacking]], [[drift-guard-pin-for-task-split-intermediate-state]]"
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Plan line-number references go stale under integration churn; use construct-based locators

## What happened
Phase 3 (F05 memory admission) T5 plan cited the Wrap-up servitor prompt at
`workflow-template.js :310-317` (F05 spec) and `~lines 420-426` (Task 5 spawn
prompt). The four-discipline checklist actually landed at lines **427-431** — a
4-line drift caused by intervening phases landing into the integration base
between when the plan was drafted and when T5 ran.

The worker succeeded anyway because they located the construct structurally:
the `war-servitor agent()` call in the `// WRAP-UP` section of
`workflow-template.js`, not by scanning for the literal line numbers.

## Why it's a gotcha
An auditor checking "does the candidate change match the plan's stated location?"
sees `:420-426` in the plan and lines `427-431` in the diff — a mismatch that
looks like scope creep or wrong-section editing. It is benign line-number drift.
The auditor correctly classified this as Nit and did not block; the construct
locator was the right tiebreaker.

## Durable rule
**Inline `:N-M` line-number references in plan text and spec docs go stale as
soon as any earlier task in the same integration branch adds or removes lines
above the referenced section.** The safe reference form is a **construct
locator**: name the enclosing function, comment header, or export symbol rather
than a raw line range. Examples:

- Bad: `workflow-template.js :420-426`
- Good: `the war-servitor agent() call in the WRAP-UP section of workflow-template.js`

When a plan and candidate diverge on line numbers but the construct is clearly
the intended target, classify as Nit and note the drift. Do not block unless
the change is in the wrong construct entirely.

## Implication for plan authors
When writing a plan slice that edits a specific code location inside a long
file, prefer: file + enclosing symbol name + brief description of the change.
Reserve `:N-M` ranges for files where no named construct exists (e.g., flat
config files). If you must cite lines, qualify them with "approximately" and
note which base commit they were measured against.
