---
name: own-token-floor-source-auto-exemption-is-a-refusal-bypass-for-foreign-auto-rows
description: "workflow-template.js's #1413 own-token args-provenance floor exempts any backstops/adjudications row carrying source:'auto' from the foreign-docs/plans-id refusal scan (row.source === 'auto' => exempt: true) — since args.backstops rows are Lead-assembled at Setup (plan-declared + Setup auto-recorded entries merged Lead-side), a wholesale foreign args blob (plan-A launch carrying plan-B's assembled args, the #1413 incident shape) carries plan-B's auto rows verbatim and those rows are never scanned for foreign ids; ratified D6 base-template behavior (task 3.1), ADR-worthy narrowing deferred as a follow-up, not fixed"
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

**Code-verified at the landed tip** (`73120000ff9fb694292b1b892a56c507a9308d7b` on
`dev/2026-08-25-engine-reliability-and-filing-fidelity`, read via the still-live `p3-polish` task
worktree, branch tip `24480ebc54a41a7ba6f601ce46cf7833fe72f835` — `skills/war/assets/workflow-template.js`
line ~722): the `#1413` own-token args-provenance floor's `rowText` helper does
`if (row.source === 'auto') return { text, exempt: true }` — a `source:'auto'` backstop/adjudication
row is never scanned by the foreign-`docs/plans`-identifier refusal arm. Per the template's own
backstops-intake comment, `args.backstops` rows are **Lead-assembled at Setup**: "plan-declared entries
+ Setup auto-recorded entries are merged Lead-side" — the engine's own self-authored auto rows
(`autoBaselineBackstops`) are appended only at **land**, never ride the `args` channel, and never pass
through entry validation at all. So at entry, **every** `source:'auto'` row is Lead-supplied, and the
exemption is a bypass keyed on a Lead-stamped flag on exactly the surface the floor exists to police.

**Concrete blast radius:** the `#1413` incident shape is a wholesale foreign-args blob — a plan-A
launch accidentally carrying plan-B's fully-assembled args. Such a blob carries plan-B's `source:'auto'`
rows verbatim, and those rows are **never** checked for foreign-plan `docs/plans` ids under this
exemption. Scope is bounded: `intent` (the highest-value surface) is never exempt, and a foreign
`planFile` stamp still refuses directly regardless of `source`.

**Why not fixed in-phase:** the exemption predicate is base-template behavior from a prior task
(3.1, commit `0ee9612`), ratified under this plan's D6 recalibration decision. Narrowing it needs a
plan-level decision on how the engine distinguishes an engine-authored auto row from a Lead-stamped
one (e.g. requiring an exempt row to also carry own-token evidence, or moving auto rows off the args
channel entirely) — not a mechanical single-file fix. Filed `disposition: follow-up` against the D6
exemption: require a `source:'auto'` row to still pass the foreign-id check, exempting it only from
the *own-token* floor (the actual false-refusal direction the exemption was introduced to fix).

**Pattern to remember when reviewing an EXEMPT-list on an entry-validation floor:** an exemption keyed
on a flag the same input channel controls is a bypass, not a hardening — trace who sets the flag
(engine-only vs. Lead-assembled) before trusting "exempt because self-authored."

**Related:** [[own-token-provenance-floor-vacuous-or-false-refusal-both-directions]] (archived — the
same #1413 floor's two earlier documented mis-calibration classes: vacuous JSON.stringify key-name
matches, and false refusal on generic/citation rows; this is a third, distinct class found one plan
later).
