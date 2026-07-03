# Red-team — WAR pipeline skills (/war-survey-corps, /war-machine, /war-aftermath)

**Plan:** `docs/plans/2026-07-02-war-pipeline-skills.md`
**Source spec:** `docs/specs/2026-07-02-war-pipeline-skills-design.md`
**Date:** 2026-07-02 · **Verdict:** **CLEARED** · **Mode:** campaign AFK self-adjudication
**Base tip:** `59b68226` (stacked on plan-1 `dev/2026-07-02-war-followup-444-endstate-residuals`)

## Attack surface
10 probes (6 spine + 4 bespoke), each adversarially confirmed. Coverage whole: 10/10 on-target, 0 off-target, 0 dropped. Executed: 1 · Analyzed: 9. Result: 9 pass, 1 fail (adjudicated — see below).

## Executed proof
- **`executable-proof` (spine, executed) — PASS.** Ran the plan's runnable artifacts in a throwaway worktree of the frozen tip; no mismatch.

## Passed verification
- **`coverage-vs-source` — PASS.** Every spec §10 validation criterion (1–14) maps to at least one plan task (coverage map, plan lines 68–71).
- **`anchor-intent-heading-surfaces` (bespoke) — PASS.** All five §4.4 intent-heading surfaces (war/SKILL.md, schemas.md, design.md, workflow-template.js comments, red-team scaffold) exist and carry the single-heading anchor T4/T5 will amend — **preconditions hold.**
- **`plugin-and-version-slots` (bespoke) — PASS.** T11 targets `.claude-plugin/plugin.json` (correct path, has a registration structure); T12's four canonical slots exist; current version 0.11.1 (+0.1.0 → 0.12.0).
- **`spec-criteria-coverage-map` (bespoke) — PASS.** No unmapped spec §10 criterion.
- **`frontmatter-disable-model-invocation` (bespoke) — PASS.** Plan's per-skill frontmatter (only war-aftermath `disable-model-invocation:true`) matches the spec.
- **`consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan` — PASS.** Wave-2 (T10/T11) deps on wave-1 are sound; no name/signature drift; End-state conditions individually checkable.

## Adjudicated findings (no patch — plan is correct)
1. **[claims-vs-reality Major → adjudicated non-blocker]** `workflow-scaffold.js:140` recognizes only `## Commander's Intent`.
   - **Adjudication:** This is precisely **Task 5's deliverable** (amend the scaffold to recognize both headings). The plan does not claim it is already done. Classic `claims-vs-reality`-misfires-on-NYI-deliverables pattern; the `anchor-intent-heading-surfaces` bespoke probe confirms the single-heading anchor exists for T5 to amend. **Not a defect.**
2. **[claims-vs-reality Major → adjudicated non-blocker]** war-strategy §5 closing offer still narrates the manual workflow pattern.
   - **Adjudication:** This is **Task 9's deliverable** (repoint §5 at `/war-survey-corps`). Same misfire pattern; the current manual-pattern narration is the anchor T9 repoints. **Not a defect.**

## Residual risk (non-blocking, auto-noted)
- **[Minor]** End-state 3 "exactly the four-command sequence" is mildly ambiguous (contains-the-four vs contains-only-them). Spec **criterion 6** already clarifies (none of the three old prose blocks may survive), and the coverage map ties End-state 3 → criterion 6, so workers have the disambiguation. Noted; no patch.

## Verdict
**CLEARED.** All preconditions verified present; the only fail-probe findings are the documented claims-vs-reality misfire on the plan's own not-yet-implemented deliverables (T5/T9), adjudicated non-blocking under Lead authority. Cleared for `/war`.
