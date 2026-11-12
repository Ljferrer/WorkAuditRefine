# Red-team: 2026-11-08-doc-truth-drift-and-adr-hygiene

- **Plan:** `docs/plans/2026-11-08-doc-truth-drift-and-adr-hygiene.md`
- **Verdict:** ADJUDICATED (round 1: every blocker patched in place, AI-declared, two rows under the operator's 2026-11-09 byte-cap ruling)
**Rounds:** 1
- **Artifact kind:** impl-plan
- **Base:** `a3511c79` (origin/master after the engine-findings, model-routing and engine-comment plans merged). Sandbox clone at that sha.
- **Probes:** 12 (6 spine, 6 bespoke), 4 executed, 8 analyzed, all on target, none dropped. Escape guard exit 0 for the clone and the main checkout.
- **Gate:** first pass BLOCKED (22 blocker rows, 7 needsDecision rows, 22 minors, many the same defect seen by several probes). After the patches, 26 findings were stamped adjudicated. The gate returned ADJUDICATED at rounds 1 with no route upstream.

## Measured at base

| Surface | Size | Hard line | Room |
|---|---|---|---|
| Workflow prompt-literal share | | 172,032 B | 170 B |
| `agents/war-auditor.md` | 27,947 B | 28,672 B | 725 B |
| `agents/war-refiner.md` | 38,819 B | 38,912 B | 93 B |
| `agents/war-evidence-auditor.md` | 12,102 B | 13,312 B | 1,210 B |
| `GLOSSARY.md` | 109,405 B | 131,072 B | 21,667 B |
| Stripped staged template, arm (p) | | | 62,634 B |

## Patched in place (Lead, AI-declared)

- **End state 12 was vacuous (Major, 7 probes).** The "(absent ⇒ that arm skips)" clause left the refiner card. It now lives in `refiner-recovery.md` § Evidence phase diff step 3 and in the `schemas.md` `phase_diff_files` row. End state 12, D14, T3.2 (a) and its Done when now aim at those files: `arm skips` absent across both, `matches nothing` present in `refiner-recovery.md` (red at base 2 and 0). T3.5 fixes the `schemas.md` row.
- **End state 14 already held (Major).** The engine-findings plan added endstate-check step 4, Statement boundaries, with the per-command lines and the maximum rule. D16's step-2 rewrite is retired. T3.2 adds only the registry-row anchors. Its `Post-eviction edits:` list names steps 4 and 5, the net-zero paragraph and the File-followups filing eviction.
- **End state 36 missed indented run-ins (Major).** ADR 0037 holds seven indented `**Amendment (…)**` run-ins and one bulleted one. The check and the T2.1 guard row now allow leading space and a `- ` bullet. T2.1 re-anchors the `stage-workflow.test.mjs` row that extracts one of them.
- **Absent-half phrase checks (Major).** End states 5, 6, 17, 23, 37, 51, 52 and 53 now grep case-insensitively.
- **Budget rule contradiction (Major, needsDecision).** T3.2's slice planned a raise that Constraint 4 forbade, and the literal share has 170 B of room against about 550 B of twins. Under the operator ruling of 2026-11-09, Constraint 4 and the binding guardrail now allow T3.2 a cited raise of the literal share and `agents/war-auditor.md` after a compress pass. `prompt-surface-budgets.test.mjs` joins T3.2's Files.
- **D40 insertion point (Major).** `war-evidence-auditor.md` has no `## Verdict`. Its harness-text line goes under `## Return`.
- **PIN-33 glossary half (Major).** The **Promotion** body moved to `glossary-cold.md` on 2026-11-10. The test assertion and End state 40 aim at the cold body, a disclosed post-eviction edit.
- **Evidence consumed (Major).** Added a row for the 14 PIN-41 issues and extended the #2782 row.
- **Stale red-at-base values.** End state 4 (45), 36 (6), 43 (0 and 0, first half a green guard), 46 (3, 2 and 0, second half a green guard).
- **End state 31 census (needsDecision).** It also covers the model-routing seat-result `sampled` flag and the `<lens>:opus` seat key. `dispatchModels`, `routing`, `class` and `workerTier` are recorded as already documented.
- **#2660 D20 scope item (needsDecision).** It is the `skill-doc-contracts.test.mjs` test `D20 — release-slot eligibility by literal`, a T3.5 file.

## Adjudications

| Value | Supersedes | Provenance |
|---|---|---|
| Task 3.2 may raise the prompt-literal share and `agents/war-auditor.md` with a cited trailer after compress | no task plans a raise | AI-declared, applying the operator ruling of 2026-11-09 |
| End state 12 checks `refiner-recovery.md` and `schemas.md` | the refiner card | AI-declared |
| D16 step-2 rewrite retired, registry anchors only | step 2 gains the per-command lines | AI-declared |
| End state 36 and the guard row match indented and bulleted run-ins | column 0 only | AI-declared |

## Residual risk (minors not patched)

- Absent-half phrase checks are still line-bound. A reworded clause wrapped across two lines passes them. The plan-faithfulness seat reads the diff.
- The Phase 4 Vale census cites commit `365f3da2`, which is not in the repo. Each Vale task re-measures its own before and after counts, which is what End state 30 judges.
- A3 says Phase 3 touches two ADRs. It also edits ADRs 0022 and 0060. The phase edge still holds, because T2.1 lands first.
- The Context header's issue counts predate the 2026-11-10 claims.
