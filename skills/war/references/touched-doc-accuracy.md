# Touched-doc accuracy — the guard / de-mirror / defer trichotomy

**The duty.** A task whose slice rewrites a doc owns the factual accuracy of what it renders
authoritative. Every fact in that doc derivable from a **machine-readable in-repo source** — a config
default, a manifest field, an enum member, a version slot — takes exactly one of three lawful
treatments. Silence (restating the fact with none of the three) is a plan defect, never a follow-up.
General prose claims are out of scope — the duty binds only what a machine-readable source can
re-derive; prose claims stay governed by the evidence-tag discipline (D4).

## The trichotomy

1. **Guard** — a drift test binds the doc value to its canonical source by **extraction + equality**
   (never presence). Exemplars: `skills/war/assets/version-slots.test.mjs` (the four release slots in
   lock-step, README `## Status` included) and `skills/war/assets/war-config.test.mjs`'s frontmatter
   guard (doc-stated defaults extracted and compared against the live `DEFAULTS` export). The guard
   lands in the **same task** as the doc rewrite, or takes a `deps` edge onto it when file-disjointness
   forces a split (authoring rule 7).
2. **De-mirror** — rewrite the doc to **point at the canonical source** instead of restating its value
   ("the default is `run.roundLimit` in `war-config.mjs`", never "the default is 3"). A pointed-at fact
   cannot rot; prefer this wherever the reader does not need the literal value inline.
3. **Explicitly defer** — a **legitimacy-complete** row in the plan's
   `## Deferred validations (backstops)` section: the check, a named runner, and the timing. This is
   ADR 0017's vehicle — a validation in neither the gate, a floor, nor the backstops section may not be
   waived in prose.

## Who enforces it

- **Authoring:** `/war-strategy` §3's authoring rule 8 (`skills/war-strategy/SKILL.md` — the canonical
  statement); `/war-machine`'s drafter consumes it by reference.
- **Validation:** `/red-team`'s `touched-doc-fact-coverage` drift-guard spine probe — Lead-run prose
  like its three siblings — flags a silent restatement as a plan defect (`needsDecision`).
- **Execution backstop:** `/war`'s decompose step carries the pointer to this file, so a Lead staging a
  doc-rewriting task can check the choice was made before dispatch.
- **Audit:** a doc fact deterministically re-derivable from a machine-readable in-repo source is
  mechanical for absorb-eligibility purposes (the auditor's standing card carries the clarification).

Canonical record: the 2026-08-19 touched-doc scope-widening amendment to
[ADR 0025](../../../docs/adr/0025-drift-guard-discipline.md).
