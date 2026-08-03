---
name: plan-literal-false-fact-frozen-by-own-diff-census-end-state
description: "A plan's own End-state literal can be code-traceably false about a live subject's byte sequence, and stay false in the plan document forever within the phase — because a HARD end-state that pins the phase's cumulative diff to an exact file set forbids touching the plan doc itself to fix it. The corrected fact then lives only in the code comment; the plan is a frozen record of the wrong claim."
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

**What happened (code-verified at the landed tip `224c4d3425fac760a061a795dc978b8784e5df8b` on
`dev/2026-08-02-structural-test-nonvacuity`, read via the `_refinery` worktree whose `gitdir`
physical path contains this plan's slug and whose HEAD matches the tip exactly):** plan
`2026-08-02-structural-test-nonvacuity`'s End state 5 asserts, as calibration support for a new
derivation-comment guard, "in every live block the byte count is followed by ` →`, not ` (`, so
the optional group is skipped and both variants RED together." This is false against the live
subjects at the base: nine of ten `FILE_BUDGETS` derivation comments in
`skills/war/assets/prompt-surface-budgets.test.mjs` put ` @ <sha>` directly after the byte count
(the ` →` comes *after* the SHA, not after the byte count), and the tenth
(`WORKFLOW_LITERAL_BUDGET`) is followed by ` (`, the exact shape the sentence claims never
occurs. The same false clause was transcribed into the guard's own code comment at conversion
time, went through **two** absorb-fix rounds (`801cb08`, then a `p1-polish` commit) before a
worker finally re-measured all ten live subjects with the guard's own scan and landed the
byte-accurate wording — confirmed at the landed tip, lines ~227-235 of the file now read "nine of
the ten live blocks put ` @ <sha>` directly after the byte count... the sentinel's aside opens
right after the byte count AND closes on the same comment line, with the SHA after the close."

**Why the plan document itself was never corrected:** the same plan's End state 10 is a HARD,
mechanically-checked phase diff census — `git diff --name-only <phase-base>..<tip>` must touch
*exactly* the plan's five-file Files footprint. `docs/plans/2026-08-02-structural-test-nonvacuity.md`
is not one of those five files, so editing the plan to fix its own false literal would itself RED
End state 10. The phase-close polish task's audit explicitly reasoned through this and routed the
plan-doc falsehood `note`, never `absorb` — plan literals are non-authoritative by repo doctrine
in any case (see CLAUDE.md "Known traps"), so this is not a hold, but the false sentence remains
live in the plan file at the landed tip.

**The pattern — two lessons in one:**
1. A calibration/comment fix for a "claim is false at one subject" finding cannot be trusted from
   reasoning about the finding text alone — it must re-run the *actual* survey against **every**
   live subject the guard claims to bind, or the fix itself lands wrong (twice, here). The
   guard's own scan (`ROW_SHAPE`/`SENTINEL_DECL` + `commentBlockAbove`) is the only trustworthy
   oracle for "what does every live block actually look like."
2. When a phase's End state operationalizes "zero behavioral diff" as an exact-file diff census,
   that census also **freezes any false literal already written into the plan document** —
   the plan cannot self-correct within the phase without violating its own HARD condition. A
   false plan literal discovered mid-phase is not fixable there; it is a permanent (if
   non-authoritative) blemish on that plan revision.

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
