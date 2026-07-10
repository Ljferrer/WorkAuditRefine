# Red-team report — Drift-guard discipline

**Plan:** `docs/plans/2026-07-08-drift-guards-for-mirrored-and-asserted-facts.md`
**Source spec:** `docs/specs/2026-07-08-drift-guards-for-mirrored-and-asserted-facts-design.md`
**Baseline:** `dev/2026-07-08-drift-guards-for-mirrored-and-asserted-facts` (campaign 3/9, stacked on plans 1+2 — ADR 0023/0024, v0.14.16).
**Verdict: CLEARED** (self-adjudicated under AFK; 4 verify rounds).

## Attack surface

Round 1 ran **16 probes** — the 6 universal spine lenses + 10 bespoke analysis probes targeting this plan's repo-fact premises (the three operator-ratified rescopes rest on "X already exists / X doesn't exist" claims) and the backstop-legitimacy check. Executed proof: the `executable-proof` spine ran the full JS gate + `war-strategy-structure.test.sh` + redaction lint in a throwaway sandbox (616 pass / 0 fail). Two premises were pre-verified by the Lead before the run (ADR 0025 free; next version 0.14.17). Coverage was whole every round (0 off-target, 0 dropped).

## Findings and resolutions applied

Every finding was a plan-authoring premise defect — the drift-guard plan itself carried drift between its claims and repo/spec reality. All patched in place; none was an architectural flaw (the guards, registries, and doctrine are sound).

**Round 1 (BLOCKED → patched):**
1. *Major/needsDecision* — Task 1.5 (D8/D12) attached duties to a **`doc-honesty` lens that does not exist** (the catalog is correctness / cascading-impact / plan-faithfulness / test-fidelity). → Rerouted to the **cascading-impact** lens + `auditPrompt()` dispatched surface (coherent with D9's sibling comment-lag duty).
2. *needsDecision* — the `landDecision` mirror row specified `deepEqual` against `KNOWN_LAND_DECISIONS`, but the template emits a documented **6-of-7 subset** with no inline array. → Changed to a **subset (⊆)** assertion; `HARD_ESCALATION_REASONS` stays `deepEqual`.
   *Minors:* the `spawnOpts` inline mirror is the curried `spawn` (different arity, `ROLE_MODEL` fallback) → row targets `spawn` with input-adaptation; softened an overstated "badge absent" claim (one benign test-fixture match).

**Round 2 (BLOCKED → patched):**
3. *Major* — the rescope over-dropped spec decision #7(b): `README.md:316` genuinely undersells ("ALL **three** version-of-truth files" — there are four slots across three files; the learning `release-bump-slots-canonical-no-badge.md` names it as the grep-cue). → **Task 1.1** now rewords `README.md:316` **and** guards it (undersell phrase must stay absent), reword+guard in the same Phase-1 task (avoids the phase-ordering trap); criterion 2 restored; End-state #1 extended.
4. *Major* — the D6-residual backstop still named a nonexistent `doc-honesty` auditor. → cascading-impact.
5. *Major/needsDecision* — Task 1.7 "spine probes" edit only SKILL.md prose, but the executable spine is the hardcoded `const SPINE` array. → Clarified these are spine-**doctrine** probes the Lead runs each red-team (the backstop-legitimacy precedent), **not** scaffold-array entries (plan 8 owns that engine); End-state #10 retargeted.
   *Minors:* D9 now **adds** the comment-lag standing duty to cascading-impact (it was not present); D8 wording "already hosts" → "same lens D9 extends"; Notes bullet (a) narrowed.

**Round 3 (1 Major → patched):**
6. *Major* — Task 1.2 builds the preset matrix but **no task consumed it**, though spec §4.5/§8 want an auditor lens to consult it (and the D6-residual backstop named a consumer duty no task authored). → Added the **D6 matrix-consumption duty** to Task 1.5's cascading-impact lens (both surfaces) as the matrix's landed reader; backstop runner + End-state #5 updated.

**Round 4:** all probes pass — **CLEARED**.

## Residual risk (the plan's 4 declared backstops — legitimacy check passed)

1. **Registry-row absence for future mirrors** — a new mirror without a registry row is not mechanically detectable (auto-detection is the rejected AST scanner) · runner: the Task 1.6 `/war-strategy` rule + Task 1.7 red-team probe, every conversion/red-team onward.
2. **Default-flip OLD-absent rule (D5)** — per-change, no standing test possible · runner: `/war-strategy` shape + red-team spine probe.
3. **Comment-lag directive is prompt-enforced (D9)** · runner: the cascading-impact lens each run; first live `/war` exercises the worker directive.
4. **Preset matrix ≠ prose correctness (D6 residual)** — the consumer duty ships (Task 1.5); what remains is whether the auditor's judgment catches a given prose drift (a judgment act) · runner: the Task 1.5 cascading-impact matrix-consumption duty each run.

## Notes

Patches committed on `dev/2026-07-08-drift-guards-for-mirrored-and-asserted-facts`. Next free ADR **0025**, next version **0.14.17** (resolved against the stacked baseline). Verified in a `dev/slug-3` sandbox worktree (plans-1+2-landed baseline), removed after CLEARED.
