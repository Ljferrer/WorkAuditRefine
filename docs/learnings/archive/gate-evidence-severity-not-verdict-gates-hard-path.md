---
name: gate-evidence-severity-not-verdict-gates-hard-path
description: "A gate-audit holds the land on an escalate verdict or a fix-less Critical/Major; a Critical/Major that names a fix joins the late-fix queue"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  keywords: [gateHardOf, isHardGateEvidence, escalate verdict, finding-less escalate, hold-land decision, late-fix queue, noFixText, gate-evidence, HARD_ESCALATION_REASONS, enum reuse, hand-mirrored enum, mergedTasksForGateAudit]
  slug: gate-evidence-severity-not-verdict-gates-hard-path
  phase: audit-scheduler-integrity/t4
  date: 2026-06-26
  tags:
    - gate-evidence
    - hard-escalation
    - auditor
    - workflow-template
  related:
    - land-decision-not-demoted-on-land-step-failure
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

**The rule.** `gateHardOf` in `skills/war/assets/workflow-template.js` decides whether a gate-audit or end-state verdict holds the land. It is HARD when the verdict is `escalate`, or when a Critical/Major finding has no fix text (`noFixText(f.suggested_fix)`). A Critical/Major that names a fix is not HARD there. It joins the late-fix queue instead.

**History.** The first cut keyed HARD on finding severity only, so a finding-less `escalate` was SOFT. Later work made `escalate` HARD too, with or without findings. That change reused the existing `gate-evidence` reason in `HARD_ESCALATION_REASONS`. No new member was added.

**Why reuse mattered.** `HARD_ESCALATION_REASONS` is hand-mirrored between `land-decision.mjs` and `workflow-template.js`. A new member means touching both copies and the drift-guard test in one commit (ADR 0005). Reusing an existing reason is a single-surface change.

**How to apply.**
- To find what holds a gate-audit land, read `gateHardOf`, not the verdict field alone and not severity alone.
- When a new condition must be HARD, first check whether it can ride an existing member of a hand-mirrored canonical enum before you add one.

Related: [[audit-gate-anti-cheat-spine-pin-equality-benign-advance-verdict-hard]].

> archived 2026-07-15: resolved — moved to archive
