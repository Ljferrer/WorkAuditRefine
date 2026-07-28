# Audit doctrine & prompt-surface simplification — 2 plans

Campaign roadmap, 2026-07-28. Mode: `stack` (stack-and-plow, ADR 0011) — plan 2 cuts from plan
1's tip. Both runs launch under the **`thorough` preset with the operator's docs-tier override**
(`agents.worker.docs: { model: 'fable', effort: 'high' }`) — each plan's Notes carries the full
directive. Version literals below are non-authoritative — each release resolves the next free
patch from the live slots at land time.

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [2026-07-28-audit-evidence-precedence](../plans/2026-07-28-audit-evidence-precedence.md) | auditor doctrine family — `agents/war-auditor.md`, `workflow-template.js`+`.test.mjs` (skeleton + row), `skills/war/SKILL.md` Lead bindings + `skill-doc-contracts.test.mjs` row, `agents/war-servitor.md` cross-ref, `CONTEXT.md` terms, new ADR, release slots | next free (≈0.14.68) | — |
| 2 | [2026-07-28-prompt-surface-simplification](../plans/2026-07-28-prompt-surface-simplification.md) | every prompt-bearing prose surface — `skills/war/SKILL.md` + `references/`, all four `agents/*.md`, `workflow-template.js` literals, `skills/lessons-learned/SKILL.md`, `CLAUDE.md`/`CONTEXT.md`, new `prompt-surface-budgets.test.mjs`, new ADR, release slots | next free above plan 1 (≈0.14.69) | 1 |

## Dependency spine (strict landing order)

```
1 → 2
```

The order is content-forced, not ceremonial: plan 2 tier-classifies and shrinks the very surfaces
plan 1 adds doctrine to (the auditor card, the dispatched prompts, the SKILL.md bullets, the
servitor line). Landing 2 first would shrink text that 1 then re-fattens — the ratchet this
campaign exists to stop, performed on itself. The ADR numbering also rides the spine: plan 1
resolves the next free number, plan 2 resolves next-free-after-that (each re-resolves from the
live `docs/adr/` listing at its own base; the plans' literals are annotated non-authoritative).

**Tiering covenant across the spine:** plan 1's D4 decision (full ladders inline on the auditor
card, skeletons in dispatched prompts) **is itself a hot/cold placement** — plan 2's shrink treats
those placements as already-classified tier-1 card content and skeleton prompt content, not as
fresh eviction candidates. Plan 2's survival lens verifies against plan 1's landed tip.

## Shared-file contention

| File | Plans | Risk & mitigation |
|------|-------|-------------------|
| `agents/war-auditor.md` | 1, 2 | 1 adds the full-ladders section; 2 tier-classifies the whole card. Serialized by the spine; the ladders stay inline per the tiering covenant. |
| `skills/war/assets/workflow-template.js` | 1, 2 | 1 appends the skeleton to two prompt literals; 2 tiers every role's literals. Same-file law holds within each plan (once per phase); across plans the stack serializes. |
| `skills/war/assets/workflow-template.test.mjs` | 1, 2 | 1 adds a both-surfaces row; 2 re-anchors rows whose pinned text moves. Zero rows deleted/loosened in either plan — the suites are the meaning floor. |
| `skills/war/SKILL.md` | 1, 2 | 1 adds Lead-binding skeletons; 2 is the centerpiece shrink (≤ 60% target). 2's shrink must keep 1's skeletons inline (they are tier-1 pointers by construction). |
| `skills/war/assets/skill-doc-contracts.test.mjs` | 1, 2 | 1 adds a row; 2 re-anchors moved regions. Same floor rule. |
| `agents/war-servitor.md` | 1, 2 | 1 appends one cross-ref line; 2 shrinks the card in the worker+servitor phase. The line survives as tier-1 (it is already a pointer). |
| `CONTEXT.md` | 1, 2 | 1 adds three glossary terms, 2 adds three more + dedup pass. Glossary entries are CONTEXT.md's job — dedup removes restated *procedure*, never definitions. |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` | 1, 2 | Two sequential releases; four slots re-read at each land tip (stacked-release lag absorbed by construction; `version-slots.test.mjs` monotonic floor is the arbiter). |

Files owned by exactly one plan (plan 2's `references/`, `prompt-surface-budgets.test.mjs`,
`skills/lessons-learned/*`, `CLAUDE.md`, `agents/war-refiner.md`, `agents/war-worker.md`) carry
no cross-plan risk.

## Execution

```
/war-campaign docs/roadmaps/2026-07-28-audit-doctrine-and-prompt-simplification-roadmap.md
```

Each plan is red-teamed at its selection (plan 2's red-team therefore sees plan 1 landed — its
open decisions include the ≤ 60% target and the D5 multiplier, both best judged against the real
post-plan-1 surface). Both plans' open decisions are enumerated in their own `## Open decisions`
sections; nothing here overrides them.
