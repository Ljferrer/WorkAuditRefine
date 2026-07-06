---
name: held-workflow-error-infra-death-prose-mismatch
description: "Class example lists must match routing predicates"
metadata: 
  node_type: memory
  type: project
  keywords: [terminal vs retryable, example list drift, timeout kill routing, unparseable landDecision, hard halt class, phase-incomplete]
  phase: dead-phase-halt/t2
  date: 2026-06-29
  tags: 
    - skill-md
    - landDecision
    - held:workflow-error
    - held:phase-incomplete
    - classifier
  originSessionId: fa4a98d9-e917-4fc2-8838-f98e4a473a1a
---

# held:workflow-error prose attributed infra-death to the wrong class

Rule: in a multi-case classifier with terminal and retryable branches, each class's inline example list must match its routing predicate exactly:

- `status !== 'completed'` (timeout / kill / infra death) → `held:phase-incomplete` (retryable)
- missing / unparseable `landDecision` (garbage return) → `held:workflow-error` (terminal, HARD-halts)

Fixed in SKILL.md: the §4.3 `held:workflow-error` bullet now reads "garbage / unparseable return" only; infra-death lives solely under §4.2 phase-incomplete (audited Nit, resolved).

**Why:** a loose parenthetical silently mis-attributes a retryable predicate to the terminal class.
**How to apply:** auditor reflex — read each class's example list against its predicate, not just the predicate itself.

Related: [[run-provision-config-not-yet-mirrored-into-template]] (multi-class enum docs that lag routing code).
