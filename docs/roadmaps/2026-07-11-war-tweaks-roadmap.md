# WAR tweaks campaign — 3 plans

Source: interactive grill session 2026-07-11 (no survey manifest — specs authored via
`grill-with-docs`, converted per-plan by `/war-strategy`). Baseline **v0.14.23**; every `Ver` is
the **next free patch above the live integration base at land time** — never a pre-resolved
literal. None of the three plans is red-teamed yet: run `/red-team` per plan before
`/war-campaign` consumes this roadmap.

| # | Plan | Files owned (distinctive family) | Ver | Depends on |
|---|------|----------------------------------|-----|------------|
| 1 | [war-room-config-expansion](../plans/2026-07-11-war-room-config-expansion.md) | `war-config.mjs`+`.test.mjs` (flip + redteam + worker tiers + doc-claim guard), `workflow-template.js`+`.test.mjs` (tier dispatch), red-team scaffold+`.test.mjs` (model args), war-room / lessons-learned / red-team SKILLs, `schemas.md` (run-config §), README+CLAUDE.md commitLearnings claims | next-free @ land | — |
| 2 | [war-review-run-telemetry](../plans/2026-07-11-war-review-run-telemetry.md) | `skills/war-review/` (new), `skills/war/SKILL.md` (run manifest), `plugin.json` skills array, `schemas.md` (run-manifest §), README pipeline mentions | next-free @ land | 1 (contention) |
| 3 | [survey-corps-memory-mining](../plans/2026-07-11-survey-corps-memory-mining.md) | `skills/survey-corps/SKILL.md` (Step 0 Mine), README survey blurb | next-free @ land | 2 (contention) |

## Dependency spine (strict landing order)

```
1 → 2 → 3
```

Strict serial (stack-and-plow, ADR 0011). **No hard edges** — no plan imports another's symbols;
the order is contention- and risk-driven: plan 1 is the only engine-touching plan and its
Phase-3 OLD-absent sweep + permanent doc-claim guard should be on the base before plans 2 and 3
add README prose (their additions are then audited against the landed guard instead of racing
it); plan 3 is the lightest and floats last. All three collide on the release slot files, which
alone forces serial landing.

## Shared-file contention

| File | Plans | Risk |
|------|-------|------|
| `README.md` | 1, 2, 3 | Hottest file. Distinct constructs per plan — 1 rewrites the commitLearnings claims (incl. one section retitle), 2 adds `/war-review` pipeline mentions, 3 extends the survey blurb — plus every release phase's `## Status` slot. Serial landing; each plan's README task names its sections by construct, and the stacked-PR doc-conflict recipe (merge master, `--theirs`, ff) covers the residual. |
| `.claude-plugin/plugin.json` + `marketplace.json` | 1, 2, 3 (trailing release phases); 2 also Phase 1 (`skills` array) | Four-slot lockstep per plan, mechanically enforced by `version-slots.test.mjs`; versions resolve next-free at land. 2's skills-array append is a disjoint key from the version slot. |
| `skills/war/references/schemas.md` | 1, 2 | Append-only, disjoint sections: 1 updates run-config § rows; 2 adds a new run-manifest §. Trivial rebase. |
| `skills/red-team/SKILL.md` + scaffold pair | 1 only | No cross-plan contention — 2 deliberately leaves the engine and red-team surfaces untouched (rescope notes in plan 2). |
| `CONTEXT.md` | — | New terms already landed with the specs (grill-session edits); no plan task re-touches them. |

**Rev 1 note:** this roadmap is authoring input + a committable snapshot — never the live queue
(the campaign ledger owns execution state).
