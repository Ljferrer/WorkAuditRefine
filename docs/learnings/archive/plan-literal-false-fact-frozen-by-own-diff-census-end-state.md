---
name: plan-literal-false-fact-frozen-by-own-diff-census-end-state
description: "A HARD End state that pins the phase diff to an exact file set also freezes any false literal in the plan doc, so route a plan-literal falsehood found mid-phase as note and let the code carry the corrected fact"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: plan-literal-false-fact-frozen-by-own-diff-census-end-state
  phase: "structural-test-nonvacuity/1.1 (+1.1 gate-audit, +p1-polish)"
  keywords:
    - phase diff census
    - exact file footprint end state
    - plan literal false fact
    - calibration comment
    - re-measurement not reasoning-from-finding-text
    - frozen plan record
    - absorb-fix can itself be wrong
    - derivation guard
  tags:
    - war
    - plan-fidelity
    - phase-close
    - non-vacuity
    - calibration
  created: 2026-08-02
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-03T02:46:01.600Z
---

# A plan's own End-state literal can be false, and the phase's own diff census can forbid ever fixing it

**The rule:** when a phase's End state operationalizes "zero behavioral diff" as an exact-file diff
census, that census also **freezes any false literal already written into the plan document** —
the plan cannot self-correct within the phase without violating its own HARD condition. A false
plan literal discovered mid-phase is not fixable there; it is a permanent (if non-authoritative)
blemish on that plan revision.

**What happened (code-verified at the landed tip of `dev/2026-08-02-structural-test-nonvacuity`):**
plan `2026-08-02-structural-test-nonvacuity`'s End state 5 asserts, as calibration support for a new
derivation-comment guard, "in every live block the byte count is followed by ` →`, not ` (`, so
the optional group is skipped and both variants RED together." This is false against the live
subjects at the base: nine of ten `FILE_BUDGETS` derivation comments in
`skills/war/assets/prompt-surface-budgets.test.mjs` put ` @ <sha>` directly after the byte count,
and the tenth (`WORKFLOW_LITERAL_BUDGET`) is followed by ` (`. The same false clause was
transcribed into the guard's own code comment and went through **two** absorb-fix rounds before a
worker re-measured all ten live subjects with the guard's own scan and landed the byte-accurate
wording.

**Why the plan document itself was never corrected:** the same plan's End state 10 is a HARD,
mechanically-checked phase diff census — `git diff --name-only <phase-base>..<tip>` must touch
*exactly* the plan's five-file Files footprint. `docs/plans/2026-08-02-structural-test-nonvacuity.md`
is not one of those five files, so editing the plan to fix its own false literal would itself RED
End state 10. The phase-close polish task's audit explicitly reasoned through this and routed the
plan-doc falsehood `note`, never `absorb` — plan literals are non-authoritative by repo doctrine
in any case (see CLAUDE.md "Known traps"), so this is not a hold, but the false sentence remains
live in the plan file at the landed tip.

**The fix itself landed wrong twice** because it reasoned from the finding text instead of
re-measuring every live subject. That half of the lesson is held by
[[fix-the-finding-class-not-the-site-and-prove-every-new-guard-red-before-commit]].

**How to apply:** when authoring or red-teaming a plan whose End state cites a specific byte
sequence, ordering, or count as calibration support, verify it against *all* named live subjects
before ratifying — not just the one subject a later finding happens to name. When a phase also
carries an exact-diff-census HARD end state, treat that as a signal that plan-doc corrections are
off the table for the duration of the phase; route any discovered plan-literal falsehood as
`note`, and let the *code* (not the plan) carry the corrected fact.

**Anchors (verify still present before acting):** the derivation-guard calibration comment in
`skills/war/assets/prompt-surface-budgets.test.mjs` (search "closes on the same comment line, with
the SHA after the close"); End state 5's uncorrected literal in
`docs/plans/2026-08-02-structural-test-nonvacuity.md` (search "not ` (`, so the optional group is
skipped"); the phase diff census, End state 10 of the same plan.

Related: [[plan-mandated-test-comment-uniqueness-claim-can-be-code-traceably-false]] (same family —
a plan-mandated literal can be code-traceably false; there the plan's own wording was mandated
verbatim onto the worker and could not be reworded without deviating, here the plan's wording is
merely *uncorrectable* by construction of a different HARD end state);
[[absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction]] (same "an absorb-fix for
a false-fact finding can itself be wrong" class — there it landed wrong and stayed wrong; here a
third pass finally re-measured correctly).

> archived 2026-08-15: resolved — moved to archive
