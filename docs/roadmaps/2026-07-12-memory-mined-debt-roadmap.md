# Survey 2026-07-12 memory-mined + backlog debt — 9 plans

Source manifest: `.claude/aot/2026-07-12-survey.json` (main checkout). Every plan cites its
source spec (`docs/specs/2026-07-12-<slug>-design.md`) and carries its own trailing release
phase — version resolved as the next free patch above the live integration base at land time,
never a literal authored here.

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [war-launch-entry-validation](../plans/2026-07-12-war-launch-entry-validation.md) | `workflow-template.js`/`.test.mjs`, `agents/war-worker.md`, `schemas.md` | next free | — |
| 2 | [audit-gate-evidence-fidelity](../plans/2026-07-12-audit-gate-evidence-fidelity.md) | `workflow-template.js`/`.test.mjs`, `agents/war-refiner.md`, one learning | next free | 1 |
| 3 | [floor-script-correctness](../plans/2026-07-12-floor-script-correctness.md) | `assert-packaging/-no-submodule/-guard-specificity` floors + tests, `workflow-template.js`/`.test.mjs`, ADR 0017 | next free | 2 |
| 4 | [confinement-scope-hooks](../plans/2026-07-12-confinement-scope-hooks.md) | `hooks/*.sh` + tests, `guard-conventions.test.sh`, ADR 0002, `agents/war-servitor.md`, one learning | next free | 2 |
| 5 | [campaign-ledger-ingestion-contract](../plans/2026-07-12-campaign-ledger-ingestion-contract.md) | `campaign-ledger.mjs`/`.test.mjs`, `plan-literal-lint.mjs`/`.test.mjs`, war-strategy/war-machine SKILL.md + structure tests, `skills/war/SKILL.md`, `CONTEXT.md` | next free | — |
| 6 | [red-team-enforcement-hygiene](../plans/2026-07-12-red-team-enforcement-hygiene.md) | `skills/red-team/*` (gate, scaffold, lenses, escape floor + tests), one learning, `CONTEXT.md` | next free | 5 (CONTEXT.md) |
| 7 | [land-path-verification-hygiene](../plans/2026-07-12-land-path-verification-hygiene.md) | `provision-worktrees.sh`/`.test.sh`, `land-decision.test.mjs`, one learning | next free | — |
| 8 | [memory-tooling-frictions](../plans/2026-07-12-memory-tooling-frictions.md) | `war-memory.mjs`/`.test.mjs`, survey-corps/lessons-learned SKILL.md + doc-contract test, `docs/learnings/` (diet + archives) | next free | 2, 4, 6, 7 (learning-file edits) |
| 9 | [prose-drift-corrections](../plans/2026-07-12-prose-drift-corrections.md) | `skills/war/SKILL.md`, `skill-doc-contracts.test.mjs`, land-isolation spec §5.3 | next free | 5 (war SKILL.md), 7 (header cite) |

## Dependency spine (strict landing order)

```
1 → 2 → 3
     2 → 4
5 → 6
5 → 9        7 → 9 (soft: §5.3 supersession pointer cites cmd_land_advance header)
{2,4,6,7} → 8 (learning-file edits land before the description diet sweeps them)
```

Serialized (stack-and-plow, ADR 0011): **1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9**. The campaign
queue is serial anyway; the spine records which orderings are load-bearing (rebase-conflict or
sweep-correctness) versus incidental.

## Shared-file contention

| File | Plans | Risk |
|------|-------|------|
| `skills/war/assets/workflow-template.js` + `.test.mjs` | 1, 2, 3 | High — three stacked edit sets; anchors verified disjoint at plan time (plan 2 reconciliation; plan 3 Q2), workers re-verify by named construct at rebase |
| Release slots (`plugin.json`, `marketplace.json` ×2, README `## Status`) | all 9 | By design — every plan's trailing release phase resolves the next free patch at land time; a version literal authored early always lags (stacked-release lesson) |
| `docs/learnings/*` | 2, 4, 6, 7 edit named lessons; 8 diets descriptions + archives | Medium — 8 lands after all four and is barred from archiving campaign-touched slugs (plan 8 Q3) |
| `skills/war/SKILL.md` | 5 (lint-invocation prose), 9 (Setup bullet + `bash`-not-`node` sweep) | Medium — 9 lands after 5 and re-runs its sweeps against the dispatch base (plan 9 Q2) |
| `CONTEXT.md` | 5 (Plan-index table term), 6 (env-gap finding term) | Low — different sections; 6 after 5 |
| `skills/war/references/schemas.md` | 1 (edits), 2 (sweep-3 grep scope only) | Low — 2 edits it only if EVIDENCE_RESULT is documented there by then |
| `agents/war-refiner.md` | 2 (edits), 3 (one-clause survey-derived correction, kept out of its `Files:`) | Low — pre-adjudicated in plan 3 (Q7) |
| `skills/war/assets/provision-worktrees.sh` | 7 (edits incl. `cmd_land_advance` header area), 9 (cites the construct, no edit) | Info — 9's supersession pointer anchors the subcommand name, surviving 7's rewrite (plan 9 Q9) |
