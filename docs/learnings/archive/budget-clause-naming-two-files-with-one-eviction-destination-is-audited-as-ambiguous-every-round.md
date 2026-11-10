---
name: budget-clause-naming-two-files-with-one-eviction-destination-is-audited-as-ambiguous-every-round
description: "A plan slice's budget-funding clause naming two files together, but only one eviction destination, gets independently re-litigated by nearly every audit seat, never resolved"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: budget-clause-naming-two-files-with-one-eviction-destination-is-audited-as-ambiguous-every-round
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-12 (task 12.2)"
  keywords: 
    - budget clause
    - PIN-3
    - net-positive edit funds itself
    - ADR 0042 eviction
    - byte-identical eviction
    - ambiguous plan slice
    - CONTEXT.md over advisory
    - prompt-surface-budgets
    - re-litigated finding
    - audit seat disagreement
    - funding duty scope
    - eviction destination plausibility
    - repeated Nit
  tags: 
    - war
    - plan-authoring
    - audit-findings
    - budget
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-08T23:57:43.410Z
---

# A budget clause naming two files, with only one plausible eviction destination, gets re-litigated every round, never resolved

**Found (code-verified at the phase-12 landed tip of
`dev/2026-09-06-engine-and-audit-verdict-integrity`).**

Task 12.2's plan slice (Budget clause, PIN-3) reads: `skills/war/SKILL.md` ... and `CONTEXT.md`
(over advisory) are measured at the task base; dropping the `--ace` bullet's file-based sentence is
net-negative on `SKILL.md`, and any net-positive edit funds itself by a byte-identical ADR 0042
eviction into `disposition-eligibility.md` (owned here) with a `when <trigger>, read
references/<file>` pointer. (`docs/plans/2026-09-06-engine-and-audit-verdict-integrity.md`, Task
12.2 Plan slice.)

`SKILL.md` shrank as predicted (net -27 B). `CONTEXT.md` grew by 878 B with no eviction landed,
still under its `FILE_BUDGETS['CONTEXT.md']` hard line in `prompt-surface-budgets.test.mjs`, so the
gate stayed green.

**Why this is a durable pattern, not a one-off:** at least ten independent audit-seat findings
across five different SHAs in this one task's audit history (`correctness`, `plan-faithfulness`,
`cascading-impact` lenses) all flagged the SAME CONTEXT.md +878 B/no-eviction fact, and each seat
independently reasoned through whether the clause's "any net-positive edit funds itself" duty binds
CONTEXT.md's own edit or only `SKILL.md`'s. No two seats cited the exact same textual anchor for
their reading, and none ever resolved it definitively — every single one landed on
`disposition: note` (informational, never blocking) rather than treating it as a slice breach,
because the eviction destination named in the clause (`disposition-eligibility.md`, a
`skills/war/references/` file) is only a plausible home for a `SKILL.md`-relative
`references/<file>` pointer, not for repo-root `CONTEXT.md` glossary prose — but the clause's own
prose measures BOTH files "at the task base" in the same sentence, which is what keeps inviting the
re-read.

**Pattern to watch for:** when a plan slice's budget clause names two files in one sentence but
gives only one file a workable eviction destination, expect every audit seat to independently
re-derive the same ambiguity and spend a `note`-disposed finding on it, round after round, without
the clause ever getting corrected (a `note` finding never triggers a fix). The instruction-clarity
class of `RESUBMIT` doctrine is precisely this: **write the funding duty against ONE named file's
edit, not against a bare "any net-positive edit" that could resolve to any file in the same
sentence's measurement list.** If two files are both budget-relevant, give each its own funding
clause naming its own destination, or explicitly state "this duty binds only `<file>`."

**Locate-cue (verify still present before acting):**
`skills/war/assets/prompt-surface-budgets.test.mjs`, search `FILE_BUDGETS` and `'CONTEXT.md'`;
`docs/plans/2026-09-06-engine-and-audit-verdict-integrity.md`, Task 12.2's `Budget clause (PIN-3)`
sentence.

> archived 2026-10-27: resolved — moved to archive
