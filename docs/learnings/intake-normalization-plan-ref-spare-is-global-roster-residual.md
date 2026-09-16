---
name: intake-normalization-plan-ref-spare-is-global-roster-residual
description: "normalizeSeat spares a plan_ref-carrying finding from empty-content demotion globally, so a ROSTER seat's plan_ref-only blocking finding can still escalate a phase fix-less"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - plan_ref
    - normalizeSeat
    - gateFindings
    - endState
    - PIN-29
    - ROSTER seat
    - intake normalization
    - fix-less escalation
    - gate-audit family
  provenance: code-verified
  slug: intake-normalization-plan-ref-spare-is-global-roster-residual
  phase: 2026-09-06-engine-and-audit-verdict-integrity/phase-2 (Task 2.1)
  tags: 
    - engine-design
    - workflow-template
    - audit-findings
    - known-limitation
    - PIN-29
  created: 2026-09-07
  originSessionId: a2a576b1-d8af-4c79-ad1a-af3d3e5c5c91
  modified: 2026-09-07T14:41:41.243Z
---

# The plan_ref spare in intake normalization protects gate-audit reads globally, not scoped

## What

`normalizeSeat` (PIN-6, D2, landed phase `2026-09-06-engine-and-audit-verdict-integrity` Task 2.1,
tip `1a30b56ecda78e7ccf829e947c54df95b3128f7c`) demotes an empty-content finding to a note UNLESS
it carries a non-blank `plan_ref` — the spare exists because the handoff `endState` projection's
`gateFindings` reader keys on `severity` + `plan_ref` only, and demoting a `plan_ref`-carrying
blocking finding would silently downgrade a `.cmd` condition from `unmet` to `unverified` instead
of a visible demotion.

Verified live at the landed tip: `skills/war/assets/workflow-template.js`, the block comment
directly above `normalizeSeat` (2026-09-07) states this explicitly:

> "...yet the spare is global: a ROSTER seat's plan_ref-only blocking finding has no endState
> reader to pay for, is spared all the same (the pre-task behavior, unchanged here), and can
> still ride a fix-less PIN-29 escalation; narrowing the spare to the gate-audit sites is a
> behavior change beyond this slice."

`gateFindings` (the only reader that needs the spare) is built only from the three gate-audit
family seats' `gateEvidence` entries — `post-merge`, `integrated-tip`, `end-state-only`. A regular
ROSTER (per-task worker-panel) seat has no such reader. So a ROSTER seat's Critical/Major finding
carrying only a `plan_ref` and nothing else (no title, rationale, `suggested_fix`, or ask
question) survives intake unchanged, and under PIN-29's fix-less-survivor rule it can still
escalate the whole phase with nothing a fix round could act on.

## Why durable

This is a **documented, intentional, narrow residual** of the PIN-6 slice — not a bug to file, but
a known boundary condition future work on the audit-boundary redesign (this plan's own later
phase, per its Method) or on `gateFindings`/PIN-29 must know about before assuming the D2 intake
pass fully neutralizes fix-less blocking findings.

## How to apply

If you touch `gateFindings`, the `endState` `rel` filter, or PIN-29's escalation path: check
whether the `plan_ref` spare in `normalizeSeat` should narrow to gate-audit-family seats only
(a `taskId` shape check, since gate-audit `taskId` values are synthesized as
`'phase-' + ph.id + '-{integrated-tip,end-state}'` or the task id for post-merge — narrowing is a
behavior change, so treat it as its own task, not a drive-by fix.

## Related

[[handoff-endstate-met-default-hinges-on-verbatim-planref-match]] — the `plan_ref`-keyed
`endState` reader this spare protects; a different, earlier fact about the same matching path.

[[intake-normalization-notes-push-bypasses-demote-no-dedup]] — another documented residual landed
in the same task.
