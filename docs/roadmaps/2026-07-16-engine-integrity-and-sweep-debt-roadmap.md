# Survey 2026-07-16 engine integrity + sweep debt — 5 plans

Source manifest: `.claude/aot/2026-07-16-survey.json` (main checkout). Every plan cites its
source spec (`docs/specs/2026-07-16-<slug>-design.md`) and carries its own trailing release
phase — version resolved as the next free patch above the live integration base at land time,
never a literal authored here. Provenance: all five plans were converted interactively
(operator-ratified `## Commander's Intent`, 2026-07-16 volleys; ratifications and survivors
recorded in each plan's `## Open decisions`).

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [land-failure-recovery](../plans/2026-07-16-land-failure-recovery.md) | `skills/war/assets/stage-workflow.mjs`/`.test.mjs` (new), `workflow-template.js`/`.test.mjs`, `land-decision.test.mjs`, `skills/war/SKILL.md`, `skills/war/references/schemas.md`, `skills/war-campaign/SKILL.md`, new ADR 0037, `CONTEXT.md` | next free | — |
| 2 | [structural-test-integrity](../plans/2026-07-16-structural-test-integrity.md) | `workflow-template.test.mjs`/`.js` (census + scanner), `skills/red-team/assets/workflow-scaffold.test.mjs`, two learnings | next free | 1 (shared `workflow-template.js`/`.test.mjs`) |
| 3 | [learnings-recipe-drift-sweep](../plans/2026-07-16-learnings-recipe-drift-sweep.md) | `skills/war/SKILL.md`, `skills/war/assets/war-config.test.mjs`, `CONTEXT.md`, one learning | next free | 1 (shared `skills/war/SKILL.md`, `CONTEXT.md`) |
| 4 | [aftermath-class1-gate-evidence](../plans/2026-07-16-aftermath-class1-gate-evidence.md) | `skills/aftermath/SKILL.md`, `skills/war-machine/war-pipeline-structure.test.sh`, `CONTEXT.md`, one learning | next free | — (stack order only) |
| 5 | [campaign-anchor-comment-truth](../plans/2026-07-16-campaign-anchor-comment-truth.md) | `hooks/inject-campaign-state.sh`/`.test.sh`, `skills/war-campaign/assets/campaign-ledger.mjs`, `docs/adr/0016` (in-place amendment fix), two learnings | next free | — (stack order only) |

## Issue → spec → plan chain

| Issue | Spec | Plan |
|-------|------|------|
| #925 | [land-failure-recovery-design](../specs/2026-07-16-land-failure-recovery-design.md) | 1 |
| #929 | [structural-test-integrity-design](../specs/2026-07-16-structural-test-integrity-design.md) | 2 (constraint-only reference in plan 1) |
| #931 | [structural-test-integrity-design](../specs/2026-07-16-structural-test-integrity-design.md) | 2 |
| #930 | [learnings-recipe-drift-sweep-design](../specs/2026-07-16-learnings-recipe-drift-sweep-design.md) | 3 |
| #926 | [aftermath-class1-gate-evidence-design](../specs/2026-07-16-aftermath-class1-gate-evidence-design.md) | 4 |
| #932 | [aftermath-class1-gate-evidence-design](../specs/2026-07-16-aftermath-class1-gate-evidence-design.md) | 4 |
| #927 | [campaign-anchor-comment-truth-design](../specs/2026-07-16-campaign-anchor-comment-truth-design.md) | 5 |
| #928 | [campaign-anchor-comment-truth-design](../specs/2026-07-16-campaign-anchor-comment-truth-design.md) | 5 |

## Dependency spine (strict landing order)

```
1 → 2 → 3 → 4 → 5
└─ load-bearing file edges: 1→2 (workflow-template.js/.test.mjs), 1→3 (skills/war/SKILL.md);
   CONTEXT.md is appended by 1, 3, 4 at different named anchors (serial by stack);
   4 and 5 carry no load-bearing cross-plan edges — stack-and-plow serialization only.
```

Serialized (stack-and-plow, ADR 0011): **1 → 2 → 3 → 4 → 5**. Plans 1–3 form the engine/SKILL
family and must land in order (real same-file overlap, resolved by each successor rebasing over
the predecessor's landed edits at its own named constructs). Plans 4 and 5 are independent lanes
(no file overlap with any predecessor beyond the release slots) — their queue positions exist
for release-slot serialization and reviewer bandwidth, not file safety. Plan 5's structure-test
run consumes plan 4's edited suite read-only.

## Shared-file contention

| File | Plans | Risk |
|------|-------|------|
| Release slots (`plugin.json`, `marketplace.json` ×2, README `## Status`) | all 5 | By design — every plan's trailing release phase resolves the next free patch from the live slots at land time; a version literal authored early always lags (stacked-release lesson); `version-slots.test.mjs` is the arbiter |
| `skills/war/assets/workflow-template.js` + `.test.mjs` | 1, 2 | Real ordering edge — plan 1 rewrites engine dispatch/land surfaces, plan 2 adds the census/scanner to the same files; plan 2 lands after 1 and rebases over its edits (its header records the expected overlap) |
| `skills/war/SKILL.md` | 1, 3 | Real ordering edge — plan 1 adds runbook/launch prose, plan 3 adds the retired-token sweep clause after the gh-write batch paragraph; different named constructs, rebase by construct never by offset |
| `CONTEXT.md` | 1, 3, 4 | Serial appends at different named anchors (plan 1: **Staged phase script** + **Dead-agent land failure**; plan 3: **Retired-token sweep** after the **Phase-close coherence sweep** entry; plan 4: **patch-equivalence probe** + **stranded upstream** after the **acknowledged-stranded** entry). Plan 1's own header under-lists this contention — plans 3 and 4 headers carry the correcting roadmap-author notes |
| `skills/war-machine/war-pipeline-structure.test.sh` | 4 (edits), 5 (runs) | Info — plan 5 is a read-only consumer of the post-plan-4 suite; no edit overlap |
| `skills/war-campaign/SKILL.md` | 1 only | Plan 1's header speculated overlap with plan 5; plan 5's header resolves it **disjoint** (spec §9 excludes the composed one-liner illustration from its scope) |
| `docs/learnings/*` | 2 (two), 3 (one), 4 (one), 5 (two) | Low — six distinct lesson files, disjointness verified in each plan's contention header |
