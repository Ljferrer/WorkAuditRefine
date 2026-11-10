---
name: escalation-metadata-rides-top-level-escalated-not-nested-in-handoff
description: "defectClass and staleRemote escalation metadata ride the phase's top-level `escalated` array (a sibling of `handoff`, always returned), never a member of the `handoff` sub-object (which is null on held:nothing-merged)"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: escalation-metadata-rides-top-level-escalated-not-nested-in-handoff
  phase: partial-phase-recovery-and-branch-hygiene/t2
  keywords:
    - escalated array
    - handoff block
    - defectClass
    - staleRemote
    - PLAN-DEFECT sentinel
    - machine-readable return
    - workflow-template.js phase return
    - escalation record shape
    - held:nothing-merged handoff null
  tags:
    - war
    - engine
    - schema
    - doc-precision
  created: 2026-07-11
  relates:
    - "[[held-workflow-error-infra-death-prose-mismatch]]"
    - "[[gate-evidence-severity-not-verdict-gates-hard-path]]"
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# `defectClass` / `staleRemote` classification lives on `escalated`, a sibling of `handoff` — not inside `handoff`

**What.** `workflow-template.js`'s phase-return object is
`{ phase, landed, escalated, minorsFiled, aced, notes, landResult, servitorResult, auditLog,
landDecision, ...(handoff ? { handoff } : {}) }` (verified code-present, `skills/war/assets/
workflow-template.js`, the two `return {...}` statements around the phase-completion path — grep
`return { phase: phaseId, landed, escalated`). `escalated` is **always** returned as a top-level
array; `handoff` is conditionally spread in **only when truthy** — e.g. it is `null`/absent on
`held:nothing-merged`. The stale-remote classification (`escalated.push({ ..., staleRemote: true,
remoteSha, frozenTip, ... })`, ~line 800) and the `PLAN-DEFECT:` sentinel's `defectClass: 'plan'`
tag (via `defectClassOf`, spread at every worker-blocked escalation site, ~line 1094/1232) both
land directly on entries of this top-level `escalated` array — never inside `handoff`.

**Why this matters.** The Commander's Intent for this phase phrased both features as riding "the
`handoff` block" (criteria 12/22 in the plan's End state). The shipped code and
`skills/war/references/schemas.md` are correct ("the classification rides the machine-readable
return") and the audit flagged the Intent wording as imprecise (Nit, disposition `note`,
non-blocking — the code is correct-by-construction). A consumer (a downstream SKILL.md runbook, a
future engine change, a memory lesson) that reads Intent prose literally and looks for
`handoff.staleRemote` or `handoff.escalated[].defectClass` will not find it — read `escalated`
directly, and remember it is populated even when `handoff` is null.

**How to apply.** When writing or auditing prose that describes engine escalation-record shape,
verify against the actual `return {...}` statement, not against Commander's Intent phrasing alone
— Intent is the ceiling/purpose statement and can carry imprecise implementation-detail language
that the code and `schemas.md` get right independently.

> archived 2026-07-12: resolved — moved to archive
