---
name: ""
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

# Gate-evidence hard/soft split keys on finding severity, not on the auditor's verdict field

## What happened

The `isHardGateEvidence` declaration in `skills/war/assets/workflow-template.js`
(inside the `mergedTasksForGateAudit` gate-audit results loop) is computed purely from
`findings.some(f => f.severity === 'Critical' || f.severity === 'Major')`.
The gate-audit seat's own `verdict` field (`'escalate'` / `'request_changes'`) is
**ignored** for the hold-land decision.

Edge case that slips through silently: a gate-audit seat that returns
`verdict: 'escalate'` with NO Critical/Major findings is treated as **SOFT** and
does NOT hold the land.

## Why it is defensible (by design)

The plan's Open decision #1 resolves: "HARD = provably unrun = Critical/Major finding;
default = SOFT."  The auditor prompt instructs the auditor to record a Critical/Major
finding **precisely** when a mapped test is provably unrun.  A finding-less escalate is
therefore intentionally soft — the verdict field is non-load-bearing here; the contract
relies on the auditor setting finding severity correctly.

## Why it is still a gotcha

Anyone reading the code and noticing the verdict field is never checked will expect it to
carry weight (consistent with the general WAR rule where any `escalate` halts).  It
doesn't here.  The coupling is intentional but undocumented in the inline comment.

## Recommendation

Partly satisfied: the block above `isHardGateEvidence` now carries a comment citing Open
decision #1 ("severity Critical/Major signals provably-unrun"). Still missing the explicit
"verdict field intentionally ignored" note, e.g.:
> "verdict field intentionally ignored — a finding-less escalate is SOFT by design
> (Open decision #1); only Critical/Major findings mean provably-unrun."

Alternatively, also treat `verdict === 'escalate'` as hard for defence-in-depth.
