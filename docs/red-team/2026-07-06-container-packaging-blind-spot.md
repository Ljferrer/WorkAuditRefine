# Red-team — Container-packaging blind spot (packaging floor, opt-in docker gate, ratified backstops)

**Plan:** `docs/plans/2026-07-06-container-packaging-blind-spot.md`
**Date:** 2026-07-06 · **Repo baseline:** `claude/awesome-diffie-1a8e6e` @ `1929bc4` (v0.14.3; plan committed on PR #519)
**Source spec:** `docs/specs/2026-07-06-container-packaging-blind-spot-design.md` (ADR 0017)
**Verdict: CLEARED** — 8/8 probes on-target and passing, zero blockers; the plan's two self-declared open decisions were resolved and patched in.

## Attack surface

8 probes, all on-target, none dropped, none off-target. **5 spine** (claims-vs-reality, coverage-vs-source, consistency-placeholders, dependency-feasibility, intent-vs-plan) + **3 bespoke** precondition probes derived from the plan's highest-risk baseline claims. `executable-proof` dropped: this is a war-shaped *implementation* plan — it ships no runnable code/test/command blocks with a stated Expected; every artifact it names (`assert-packaging-in-diff.sh`, the workflow-template/land-decision edits, the version bump) is a proposed **deliverable**, not a provable plan artifact. All probes were therefore analyzed (read-only), so no provisioning applied.

## Verified baseline claims (analyzed — a `pass` means no drift on exactly these checks)

The three bespoke probes exist to confirm the *existing-code* preconditions the design leans on. Each passed with `findings:[]`:

- **subloop-baseline** → the load-bearing premise of the combined floor-retry sub-loop (Task 2c / spec §4.2) holds: today's no-test retry-merge handler **does** hard-escalate an unexpected retry status verbatim, the template **does** dispatch more than one merge prompt (main + floor-retry), and the polish/phase-close merge prompt **does** explicitly skip `assert-test-in-diff.sh`. The "don't blind-copy the no-test loop" reasoning is grounded in the real code, and Task 2(e)'s polish-skip has a genuine anchor.
- **enum-mirrors** → Task 2(d)'s three coupled targets are all real today: `HARD_ESCALATION_REASONS` exists in **both** `skills/war/assets/workflow-template.js` and `skills/war/assets/land-decision.mjs`, and the drift guard that asserts the two mirrors stay in sync is present. Adding `unpackaged` to all three in one commit is correctly specified.
- **slots-and-suites** → the four canonical version slots (`plugin.json` ×1, `marketplace.json` ×2, `README.md` `## Status`) are consistent at v0.14.3, and every "extend X" target the plan names already exists: `assert-test-in-diff.sh` (Task 1 mold), `workflow-template.test.mjs` + `land-decision.test.mjs` (Task 2), `war-strategy-structure.test.sh` (Task 5), `campaign-ledger.mjs` + its test (Task 9). No task points at a missing target.

Spine lenses corroborated: coverage-vs-source mapped every spec requirement to a plan task; intent-vs-plan found all 7 End-state conditions individually checkable and each claimed by ≥1 phase, collectively sufficient for the Purpose; consistency and dependency-feasibility found no placeholders, name/signature drift, contradictions, or out-of-order steps.

## Executed proof

None — all-analyzed surface (the plan has no runnable artifacts to sandbox). Verification rests on the precondition checks above and the spine coverage/consistency/feasibility/intent lenses.

## Findings & resolutions

No probe found a defect (`blockers: []`, `needsDecision: []`, `minors: []`). The only open items were the plan's own `## Open decisions (resolved by /red-team)` — neither a blocker (each order-independent / safe-defaulted), so both were resolved directly rather than grilled:

- **Packaging-floor step ordering** (relative to `assert-no-submodule-mutation.sh`) → **RESOLVED, patched.** Pinned in Task 3: the floor runs immediately after the step-4 test-floor check and before the step-5 submodule check, keeping the two `assert-*-in-diff.sh` coverage floors adjacent; step 5's order-independent note extends to name all three. Order is semantically free (any failing exit blocks the step-6 merge) — the pin is purely for readable, grouped floors.
- **`campaign-ledger.mjs` schema-version note** → **RESOLVED: not needed, patched.** Task 9's absent-field tolerance is the established pattern for in-flight ledgers predating a new field; an explicit schema-version marker adds surface for no behavioral gain. Recorded in the plan's Open-decisions section.

## Residual risk

None blocking. The plan inherits the spec's four **deliberate, documented ceilings** (spec §8) — a floor `pass` is not proof the image builds; the `.dockerignore` support is a fail-closed subset; the build-context = Dockerfile-dir assumption mis-scopes `-f`-from-foreign-root pipelines; and a docker daemon that dies *after* provision still reads `gate_failed`. All are named as accepted residuals, each with the docker gate or a declared backstop as the fuller check — not plan defects. The plan also correctly dogfoods the new backstop section (one entry: incident replay on a real Dockerfile repo, deferred because this repo ships no Dockerfile), and holds itself to `requiresTest` only since `requiresPackaging` cannot govern the run that introduces it.
