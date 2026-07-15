---
name: ""
description: "Gate-evidence HARD/SOFT keys on severity, not the verdict field"
metadata: 
  node_type: memory
  type: project
  keywords: [escalate ignored, finding-less escalate, hold-land decision, isHardGateEvidence, soft by design, mergedTasksForGateAudit]
  slug: gate-evidence-severity-not-verdict-gates-hard-path
  phase: audit-scheduler-integrity/t4
  date: 2026-06-26
  tags: 
    - gate-evidence
    - hard-escalation
    - auditor
    - workflow-template
  related: 
    - - land-decision-not-demoted-on-land-step-failure
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

**RESOLVED (instance) — kept as concept anchor.** In `mergedTasksForGateAudit`, `isHardGateEvidence` keys the hold-land decision on finding severity (`Critical`/`Major` = provably-unrun, per Open decision #1), never on the gate-audit seat's `verdict` field — a finding-less `escalate` is SOFT by design.

> archived 2026-07-15: resolved — moved to archive
