# Survey 2026-07-14 memory-mined + backlog debt — 3 plans

Source manifest: `.claude/aot/2026-07-14-survey.json` (main checkout). Every plan cites its
source spec (`docs/specs/2026-07-14-<slug>-design.md`) and carries its own trailing release
phase — version resolved as the next free patch above the live integration base at land time,
never a literal authored here. Provenance: plan 1 was converted interactively (operator-ratified
`## Commander's Intent`, 2026-07-14 volley); plans 2–3 were converted `--afk`
(`## AI-Commander's Intent`, ADR 0014).

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [gate-evidence-and-prose-truth](../plans/2026-07-14-gate-evidence-and-prose-truth.md) | `war-config.mjs`/`.test.mjs`, `workflow-template.js`/`.test.mjs`, `agents/war-refiner.md`, `skills/war/SKILL.md`, `skill-doc-contracts.test.mjs`, `schemas.md`, docs/specs sweep hits, one landed plan doc, two learnings, new ADR, `CONTEXT.md` | next free | — |
| 2 | [red-team-fallback-and-anchor-hygiene](../plans/2026-07-14-red-team-fallback-and-anchor-hygiene.md) | `skills/red-team/**` (workflow-scaffold.js/.test.mjs, SKILL.md, lenses.md re-verify, red-team-gate.test.mjs) | next free | — |
| 3 | [lessons-learned-repo-projection-integrity](../plans/2026-07-14-lessons-learned-repo-projection-integrity.md) | `skills/lessons-learned/**` (safe-swap.sh/.test.sh, SKILL.md, lessons-learned-doc-contract.test.mjs), one learning | next free | — |

## Dependency spine (strict landing order)

```
1 → 2 → 3   (stack-and-plow serialization only — no load-bearing cross-plan edges)
```

Serialized (stack-and-plow, ADR 0011): **1 → 2 → 3**. No plan reads or edits another's files;
the only shared surface is the release slots, serialized by the stack itself. Plan 1's #887
docs/specs sweep runs against whatever spec set is committed at its dispatch base — plans 2–3's
source specs are decision records whose gap descriptions are historical once their plans land;
the sweep guards only claims that should stay true, so no ordering edge is needed.

## Shared-file contention

| File | Plans | Risk |
|------|-------|------|
| Release slots (`plugin.json`, `marketplace.json` ×2, README `## Status`) | all 3 | By design — every plan's trailing release phase resolves the next free patch at land time; a version literal authored early always lags (stacked-release lesson) |
| `docs/learnings/*` | 1 (two named lessons), 3 (one named lesson) | Low — disjoint files, verified at plan time |
| `docs/specs/*` | 1 (sweep may touch code-fact prose), 2–3 (source specs, read-only) | Info — plan 1 edits only sweep-corrected claims; plans 2–3 never edit specs |
