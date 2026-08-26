---
name: plan-line-number-refs-stale-use-construct-locator
description: "Plan :N-M line refs go stale under integration churn; anchor by construct locator (enclosing…"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
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

## Instance (compressed)
An F05/p3 plan cited the Wrap-up servitor prompt by raw line ranges; intervening
phases landing into the integration base drifted every cited range before the
task ran. The worker succeeded by locating the construct structurally — the
`war-servitor` spawn under the `// ---- WRAP-UP — capture durable learnings`
comment in `workflow-template.js` — and the auditor correctly classified the
plan/diff line mismatch as a benign Nit, not scope creep. The plan's original
line citations have since drifted again, proving the rule.

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

Absorbed into doctrine: CLAUDE.md Known traps — "Anchor references by named
construct, not line number — line numbers rot across the serial merge queue."

## Implication for plan authors
When writing a plan slice that edits a specific code location inside a long
file, prefer: file + enclosing symbol name + brief description of the change.
Reserve `:N-M` ranges for files where no named construct exists (e.g., flat
config files). If you must cite lines, qualify them with "approximately" and
note which base commit they were measured against.
