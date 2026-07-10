# Red-team report — plan-and-prompt-literal-brittleness-and-auditor-calibration

**Plan:** `docs/plans/2026-07-08-plan-and-prompt-literal-brittleness-and-auditor-calibration.md`
**Source spec:** `docs/specs/2026-07-08-plan-and-prompt-literal-brittleness-and-auditor-calibration-design.md`
**Repo baseline:** `dev/2026-07-08-plan-and-prompt-literal-brittleness-and-auditor-calibration` @ `533ad5a` (stacked on plans 1–5)
**Run:** `wf_227e3df8-737` · **Date:** 2026-07-09

## Verdict: **CLEARED-WITH-NOTES**

One `needsDecision` (Minor) surfaced and was resolved by an in-place plan patch; one duplicate coverage-Minor auto-resolved by the same patch. No blockers survived.

## Attack surface

14 probes — 6 spine lenses + 8 bespoke (7 anchor/baseline/drift-guard + backstop-legitimacy). **13 pass, 1 warn.** Executed: 1 (`executable-proof`, clean, sandbox `cp -R`, target never mutated). Analyzed: 13. On-target: 14/14. Off-target/dropped: 0.

## Executed proof

- `executable-proof` (spine, executed): plan ships no runnable-with-expected artifacts (the `plan-literal-lint.mjs` fixtures are the plan's deliverable, correctly absent) → pass.
- All anchor/baseline probes confirmed Task edit-targets exist at the tip: `executable-proof` spine entry + spine-name test (Task 1.5); `## Latitude and disposition (ADR 0013)` block + `auditPrompt()` + both-surfaces latitude test (Task 1.4); war-strategy §2 template + `war-strategy-structure.test.sh` verbatim-line-lock (Task 1.1); `war-machine/SKILL.md` genuinely has zero release/version/bump prose (Task 1.3 delta 3 baseline holds); `version-slots.test.mjs` present (Task 1.7/2.1); `war-memory.mjs` `LINT_PATTERNS`/`lint()` model present (Task 1.2).
- Drift-guard spine probes: `unguarded-new-mirror` → pass (Task 1.4 ships the both-surfaces drift test in the SAME task); `default-flip-old-absent` → vacuous (no default-flip/scope-narrow task in this plan).

## Findings & resolutions applied

**F1 — Minor / needsDecision (backstop-legitimacy, coverage-vs-source; probe status warn/pass).** Backstop entry 3 ("Matrix row-count completeness") named as a runner *"the auditor's test-fidelity lens + the enumerate-all-cells convention in the war-strategy template."* The `test-fidelity` lens is real (`agents/war-auditor.md:51`), but **no enumerate-all-cells convention exists** in `skills/war-strategy/` and no Phase-1 task (1.1–1.7) authors one — Task 1.1's rule set is the six named rules + the defined-but-not-yet-emitted annotation, and the spec's §10 validation criteria never require authoring it. Half the cited runner pointed at a convention neither present nor delivered → the backstop was partly unaccountable. Inherited from source §9, which frames the convention as already "ratified."

**Resolution (operator-directive AFK, option B — leave the spec alone, prefer landing, no scope creep).** Corrected entry 3 in place: the `runner` now names only the delivered runner — the auditor's `test-fidelity` lens at audit time; the `why deferred` clause now states honestly that the enumerate-all-cells discipline remains spec-ratified doctrine **not** authored into the war-strategy template by this plan. The rejected alternative (add an enumerate-all-cells convention to Task 1.1) was declined: it expands Task 1.1 beyond the spec's §10 criteria and the ratified task set. Re-verified by inspection — the patched runner references only artifacts that exist at the tip; the duplicate coverage-vs-source Minor is resolved by the same edit.

## Residual risk

- The enumerate-all-cells matrix-completeness discipline stays a **convention/doctrine**, backstopped by the `test-fidelity` lens at audit time, not a mechanical check (spec §9 non-goal — unchanged, now accurately reflected in the backstop runner).
- The four ratified backstops (live calibration obedience; lint precision burn-in; matrix row-count completeness; grep-sweep sibling survival) remain legitimate deferrals — each names a concrete why-deferred + a real runner post-patch; carried into the `/war` handoff aggregate.

## Backstops (post-patch, threaded to /war)

1. Live calibration obedience · drift test proves clauses on both surfaces, not live obedience · first /war run after landing + /red-team.
2. Lint precision burn-in · advisory until observed precision · /war-strategy conversion reports + /red-team spine over next plans.
3. Matrix row-count completeness · rows×cols parsing is a spec §9 non-goal; discipline stays doctrine · auditor `test-fidelity` lens at audit time.
4. Grep-sweep sibling survival · same-meaning siblings not mechanically detectable · survey-corps + war-strategy grep-floor notes + calibration rule 4.
