---
name: plan-can-name-a-nonexistent-lens-even-in-an-anti-drift-plan
description: "Plans can name nonexistent constructs; reconcile vs the real catalog"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: plan-can-name-a-nonexistent-lens-even-in-an-anti-drift-plan
  phase: drift-guards-for-mirrored-and-asserted-facts/t1.5
  keywords: 
    - doc-honesty lens
    - cascading-impact lens
    - war-auditor catalog
    - plan vocabulary drift
    - self-referential irony
    - intent reconciliation
    - lens catalog
  tags: 
    - war
    - plan-faithfulness
    - auditor-lens
    - meta-lesson
  files: 
    - agents/war-auditor.md
  relates: 
    - "[[adr-policy-table-entry-vs-mechanism-attribution]]"
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# A plan can name a nonexistent construct even when the plan's whole purpose is preventing drift

**Found (code-verified — `agents/war-auditor.md` lens catalog under "## Review through your
lens", ~line 44-51; verify still present before acting):** the drift-guards plan's Task 1.5 slice
instructed attaching four new auditor duties (D8 ADR-policy-table under-attribution, D9
comment-lag, D12 mechanism-style-narrative, D6 preset-matrix consumption) to a **"doc-honesty
lens"**. No such lens exists, or ever existed, in the `war-auditor.md` catalog: `correctness`,
`cascading-impact`, `plan-faithfulness`, `security`, `performance`, `simplicity`, `usability`,
`test-fidelity` — eight lenses, none named `doc-honesty`. The worker (and the auditor, on review)
resolved this by placing all four duties under the **`cascading-impact`** lens bullet, which
already owned the closest-matching territory ("follow every caller/consumer… would this break
code it touches elsewhere" — generalized here into what the shipped code calls the "doc-and-mirror
cascade"). This placement is validated as correct: the Commander's Intent's own closing summary
line independently calls these "All 4 cascading-impact duties (D8/D9/D12/D6-consume)," confirming
the plan's own intent-writer already knew the true lens name even though an earlier plan-slice
sentence used the invented one.

**Why this is the irony worth recording:** this is a plan about **eliminating drift between a
plan's claims and the code that implements them** — and the plan's own prose drifted from the
actual construct catalog it was operating on. It shipped correctly only because (a) the target
catalog is small and enumerable (checkable by a quick Read of `war-auditor.md`), and (b) the
Commander's Intent summary line supplied an independent cross-check that happened to name the
right lens. Had the intent line also said "doc-honesty lens," a worker with less context might have
tried to literally *add* a new lens bullet to the catalog instead of routing into the existing one
— a bigger, unauthorized surface change.

**Behavioral consequence flagged by the audit (still true, not a defect):** because these four
duties now live under `cascading-impact` rather than a dedicated always-on lens, they are only
exercised when a `cascading-impact` seat is present on the roster (true for the default trio and
the `thorough` preset; **absent** under a bespoke/solo roster that drops that lens).

**How to apply:** when a plan task names a lens/construct/module that isn't found by a direct
Read/Grep against the real catalog, don't stall or fabricate the missing construct — check for a
higher-authority reconciling source in the same plan (a Commander's Intent summary line, an ADR,
a design spec) that may already resolve the naming to something real; if one exists and is
consistent, route there and record the reconciliation (as this lesson does) rather than silently
"fixing" the plan's wording without a note, and rather than inventing the named-but-nonexistent
construct from scratch.
