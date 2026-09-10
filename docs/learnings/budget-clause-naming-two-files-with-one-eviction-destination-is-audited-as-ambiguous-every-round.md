---
name: budget-clause-naming-two-files-with-one-eviction-destination-is-audited-as-ambiguous-every-round
description: "A plan slice's budget-funding clause naming two files together, but only one eviction destination, gets independently re-litigated by nearly every audit seat, never resolved"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: budget-clause-naming-two-files-with-one-eviction-destination-is-audited-as-ambiguous-every-round
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-12 (task 12.2), landed 48a7120616627a35ecf2a05e76e34d15dcf985a3 on dev/2026-09-06-engine-and-audit-verdict-integrity"
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

**Found (code-verified — landed tip `48a7120616627a35ecf2a05e76e34d15dcf985a3` on
`dev/2026-09-06-engine-and-audit-verdict-integrity`, read via the run-scoped `_refinery` worktree
whose `HEAD` is directly on this tip:
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/`).**

Task 12.2's plan slice (Budget clause, PIN-3) reads: `skills/war/SKILL.md` ... and `CONTEXT.md`
(over advisory) are measured at the task base; dropping the `--ace` bullet's file-based sentence is
net-negative on `SKILL.md`, and any net-positive edit funds itself by a byte-identical ADR 0042
eviction into `disposition-eligibility.md` (owned here) with a `when <trigger>, read
references/<file>` pointer. (`docs/plans/2026-09-06-engine-and-audit-verdict-integrity.md`, Task
12.2 Plan slice.)

`SKILL.md` shrank as predicted (72,833 B to 72,806 B, net -27 B). `CONTEXT.md` grew from 123,236 B
to 124,114 B (net +878 B) with no eviction landed — confirmed via `prompt-surface-budgets.test.mjs`'s
`FILE_BUDGETS['CONTEXT.md']` row: `{ hard: 126976, advisory: 111616 }`, still green (2,862 B of
hard headroom), gate stays green.

**Why this is a durable pattern, not a one-off:** at least ten independent audit-seat findings
across five different SHAs in this one task's audit history (`correctness`, `plan-faithfulness`,
`cascading-impact` lenses, seats `abf138de`, `9c218a62`, `7ef44a1c`, `d151cb6a`, `92526509`, and
more) all flagged the SAME CONTEXT.md +878B/no-eviction fact, and each seat independently reasoned
through whether the clause's "any net-positive edit funds itself" duty binds CONTEXT.md's own edit
or only `SKILL.md`'s. No two seats cited the exact same textual anchor for their reading, and none
ever resolved it definitively — every single one landed on `disposition: note` (informational,
never blocking) rather than treating it as a slice breach, because the eviction destination named
in the clause (`disposition-eligibility.md`, a `skills/war/references/` file) is only a plausible
home for a `SKILL.md`-relative `references/<file>` pointer, not for repo-root `CONTEXT.md` glossary
prose — but the clause's own prose measures BOTH files "at the task base" in the same sentence,
which is what keeps inviting the re-read.

**Pattern to watch for:** when a plan slice's budget clause names two files in one sentence but
gives only one file a workable eviction destination, expect every audit seat to independently
re-derive the same ambiguity and spend a `note`-disposed finding on it, round after round, without
the clause ever getting corrected (a `note` finding never triggers a fix). The instruction-clarity
class of `RESUBMIT` doctrine is precisely this: **write the funding duty against ONE named file's
edit, not against a bare "any net-positive edit" that could resolve to any file in the same
sentence's measurement list.** If two files are both budget-relevant, give each its own funding
clause naming its own destination, or explicitly state "this duty binds only `<file>`."

**For a future CONTEXT.md editor in this plan:** at task 12.2's land, `CONTEXT.md` had 2,862 B of
hard headroom left under its 126,976 B ceiling (`skills/war/assets/prompt-surface-budgets.test.mjs`
`FILE_BUDGETS['CONTEXT.md']`). No later task in this plan (13.1, 13.2, 14.1) lists `CONTEXT.md` in
its Files, so no further growth from this plan is scheduled — but the file is already well above
its 111,616 B advisory line, so the NEXT plan phase to touch it should measure fresh and consider
an ADR 0042 eviction before adding.

**Locate-cue (verify still present before acting):**
`skills/war/assets/prompt-surface-budgets.test.mjs`, search `FILE_BUDGETS` and `'CONTEXT.md':
{ hard: 126976`; `docs/plans/2026-09-06-engine-and-audit-verdict-integrity.md`, Task 12.2's
`Budget clause (PIN-3)` sentence.
