---
name: own-token-floor-source-auto-exemption-is-a-refusal-bypass-for-foreign-auto-rows
description: "An entry-validation exemption keyed on a flag the same input channel sets is a bypass; trace who sets `source:'auto'` before trusting it."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - own-token floor
    - args provenance
    - source auto exemption
    - EXEMPT rows
    - foreign docs/plans identifier
    - workflow-template.js entry validation
    - D6 recalibration
    - refusal bypass
    - held:workflow-error
  provenance: code-verified
  slug: own-token-floor-source-auto-exemption-is-a-refusal-bypass-for-foreign-auto-rows
  phase: 2026-08-25-engine-reliability-and-filing-fidelity/3.2
  tags: 
    - war
    - engine
    - entry-validation
    - provenance
    - workflow-template
  created: 2026-08-26
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-26T13:46:32.966Z
---

# The own-token floor's `source:'auto'` exemption trusts a Lead-supplied flag on the surface it screens

**Code-verified** in `skills/war/assets/workflow-template.js`: the `#1413` own-token
args-provenance floor's `rowText` helper does
`if (row.source === 'auto') return { text, exempt: true }`. A `source:'auto'` backstop or
adjudication row is never scanned by the foreign-`docs/plans`-identifier refusal arm. Per the
template's own backstops-intake comment, `args.backstops` rows are **Lead-assembled at Setup**:
plan-declared entries plus Setup auto-recorded entries are merged Lead-side. The engine's own
self-authored auto rows (`autoBaselineBackstops`) are appended only at **land**, never ride the
`args` channel, and never pass through entry validation. So at entry, **every** `source:'auto'`
row is Lead-supplied, and the exemption is a bypass keyed on a Lead-stamped flag on exactly the
surface the floor exists to police.

**Concrete blast radius:** the `#1413` incident shape is a wholesale foreign-args blob, a plan-A
launch accidentally carrying plan-B's fully-assembled args. Such a blob carries plan-B's
`source:'auto'` rows verbatim, and those rows are **never** checked for foreign-plan `docs/plans`
ids. Scope is bounded: `intent` (the highest-value surface) is never exempt, and a foreign
`planFile` stamp still refuses directly regardless of `source`.

**Why not fixed in-phase:** the exemption predicate is base-template behavior from a prior task
(3.1, commit `0ee9612`), ratified under the plan's D6 recalibration decision. Narrowing it needs a
plan-level decision on how the engine tells an engine-authored auto row from a Lead-stamped one
(for example, requiring an exempt row to also carry own-token evidence, or moving auto rows off
the args channel). Proposed narrowing: require a `source:'auto'` row to still pass the foreign-id
check, exempting it only from the own-token floor (the false-refusal direction the exemption was
introduced to fix).

Still open: the exemption is unchanged at the current tip and no follow-up issue was found filed.

**Pattern to remember when reviewing an EXEMPT list on an entry-validation floor:** an exemption
keyed on a flag the same input channel controls is a bypass, not a hardening. Trace who sets the
flag (engine-only vs. Lead-assembled) before trusting "exempt because self-authored."

**Related:** [[own-token-provenance-floor-vacuous-or-false-refusal-both-directions]] (archived;
the same #1413 floor's two earlier mis-calibration classes: vacuous JSON.stringify key-name
matches, and false refusal on generic/citation rows; this is a third, distinct class).

> archived 2026-09-04: resolved — moved to archive
