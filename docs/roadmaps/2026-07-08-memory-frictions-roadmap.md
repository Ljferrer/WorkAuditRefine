# Memory-frictions hardening campaign — 9 plans

Source survey: `.claude/aot/2026-07-08-memory-frictions-survey.json` (69 memory lessons mined into 9 specs, 2026-07-08). Interactive `/war-machine` conversion, operator-ratified per plan. Baseline **v0.14.14**; every `Ver` is the **next free patch above the live integration base at land time** — never a pre-resolved literal (plan-6 doctrine, practiced here).

| # | Plan | Files owned (distinctive family) | Ver | Depends on |
|---|------|----------------------------------|-----|------------|
| 1 | [land-path-integrity-and-status-enum-discipline](../plans/2026-07-08-land-path-integrity-and-status-enum-discipline.md) | `provision-worktrees.*` (land path), `land-decision.test.mjs`, `skills/war/SKILL.md`, ADR 0023 | next-free @ land | — |
| 2 | [audit-gate-verdict-fidelity](../plans/2026-07-08-audit-gate-verdict-fidelity.md) | `gate-pin-status.*` (new), `assert-guard-specificity-in-diff.*` (new), `land-decision.mjs` header, `schemas.md`, ADR 0024 | next-free @ land | 1 (contention) |
| 3 | [drift-guards-for-mirrored-and-asserted-facts](../plans/2026-07-08-drift-guards-for-mirrored-and-asserted-facts.md) | `version-slots.test.mjs` (new), `doc-cli-consistency.test.mjs` (new), `skill-doc-contracts.test.mjs` (new), `.tours/*`, ADR 0025 | next-free @ land | 1, 2 (contention) |
| 4 | [github-issue-lifecycle-and-run-bookkeeping-mechanization](../plans/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization.md) | `gh-preflight.*` (new), `assert-issues-filed.*` (new), `known-stranded.tsv` (new), aftermath/war-room SKILLs, ADR 0026+0027 | next-free @ land | **1 (hard — landed status vocabulary)** |
| 5 | [memory-and-lessons-learned-hygiene](../plans/2026-07-08-memory-and-lessons-learned-hygiene.md) | `war-memory.*`, `safe-swap.test.sh`, lessons-learned SKILL + doc-contract test, `war-servitor.md`, ADR 0028+0029 | next-free @ land | **2 (hard — audit_sha pin machinery)** |
| 6 | [plan-and-prompt-literal-brittleness-and-auditor-calibration](../plans/2026-07-08-plan-and-prompt-literal-brittleness-and-auditor-calibration.md) | `plan-literal-lint.*` (new), war-strategy/war-machine/survey-corps SKILLs, ADR 0030 | next-free @ land | **2, 3 (hard — auditor surfaces; version-test ownership)** |
| 7 | [guard-floor-and-scope-hook-coverage-completeness](../plans/2026-07-08-guard-floor-and-scope-hook-coverage-completeness.md) | `validate-worktree-scope.*`, `guard-conventions.test.sh` (new), `refinery-surface.test.sh`, `war-pipeline-structure.test.sh`, `assert-test/packaging-in-diff.*`, ADR 0031 + 0017 addendum | next-free @ land | — (contention only) |
| 8 | [red-team-plan-vs-state-grading-and-probe-sandboxing](../plans/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing.md) | `red-team-gate.*`, `assert-no-repo-escape.*` (new), red-team SKILL + lenses, ADR 0032+0033 | next-free @ land | 6 (contention — scaffold pair) |
| 9 | [war-execution-engine-input-and-lifecycle-hardening](../plans/2026-07-08-war-execution-engine-input-and-lifecycle-hardening.md) | `inject-campaign-state.*`, provision exit-code catalogue + reclaim, dispatch()/dispatchKind, ADR 0034 + 0013 addendum | next-free @ land | **2 (hard — evidence dispatch gains dispatchKind)** |

## Dependency spine (strict landing order)

```
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
```

Strict serial (stack-and-plow, ADR 0011): the hard edges (4→1, 5→2, 6→2+3, 9→2) and the hottest shared pair (`workflow-template.js`/`.test.mjs` — touched by every plan but 4) leave no safe parallel window; each plan bases on its predecessor's tip and rebases at land. Plans 7 and 8 have no hard edges and could in principle float, but both touch the hot pair and the auditor/red-team surfaces — keeping them in slot costs nothing and avoids a three-way rebase.

## Shared-file contention

| File | Plans | Risk |
|------|-------|------|
| `skills/war/assets/workflow-template.js` + `.test.mjs` | 1, 2, 3, 5, 6, 7, 8, 9 | **Hottest pair.** Serial landing only; every task that touches it rebases onto the prior plan's landed content. Auditor-clause additions (2's escalate rule, 6's calibration, 8's adjudicationClause, 9's dispatch wrapper) compose — each appends at a distinct construct. |
| `agents/war-auditor.md` | 2, 3, 5, 6, 8, 9 | Additive sections (reserved-lens checklist, doc-honesty duties, calibration, version-precedence, unwired marker). Serial; append-only discipline stated in each plan. |
| `agents/war-refiner.md` | 1, 2, 7, 9 | Additive (reland budget, evidence dispatch, marker rule, ensure-exclude note). Serial. |
| `skills/war/assets/war-config.mjs` + `.test.mjs` | 3, 4, 7, 9 | Distinct constructs (matrix export / ghUser / testPattern validation / overrides guard) in the same `validate()` — highest textual-merge risk after the hot pair; serial + region-scoped edits. |
| `skills/red-team/assets/workflow-scaffold.js` + `.test.mjs` | 6, 8, 9 | 6 tightens executable-proof; 8 rewrites preconditionRule→futureWorkRule; 9 adds the args guard. 8 must compose with 6's landed gist (noted in plan 8 Task 1.1). |
| `skills/red-team/SKILL.md` + `references/lenses.md` | 3, 8 | 3 adds spine probes; 8 adds artifactKind/guard wiring/Adjudications. Append-only. |
| `skills/war-strategy/SKILL.md` + structure test | 3, 6 | Both add locked convention lines; 6 appends after 3 (hard edge). |
| `skills/war/assets/provision-worktrees.sh` + `.test.sh` | 1, 9 | Different subcommands (`land-advance` vs catalogue/exclude/reclaim). Serial. |
| `skills/war/SKILL.md` | 1, 4 | 1 rewrites Checkpoint recovery; 4 adds preflight/floor wiring at Decompose+Checkpoint. 4 lands after 1 (hard edge anyway). |
| `land-decision.mjs` / `land-decision.test.mjs` | 2 (header) / 1 (tests) | Adjacent, not colliding — different files. |
| `CONTEXT.md`, `docs/adr/` | all 9 | Append-only terms + new ADR files (0023–0034 allocated; two addenda: 0017 by plan 7, 0013 by plan 9). Trivial rebases. |
| `.claude-plugin/plugin.json`, `marketplace.json`, `README.md` | all 9 (trailing release phases) | Four-slot lockstep per plan; plan 3's `version-slots.test.mjs` mechanically enforces it from plan 3 onward. |

**Campaign notes:** every plan is red-teamed by `/war-campaign` before execution (reports at `docs/red-team/2026-07-08-<plan-slug>.md`). ADR numbers and version literals are non-authoritative — re-resolve against `docs/adr/` and the four release slots at each land. The roadmap is authoring input + a committable snapshot; the live queue is the campaign ledger.
