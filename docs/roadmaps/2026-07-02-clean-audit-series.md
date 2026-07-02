# Clean-audit series — 3 plans

Serial stack on `dev/art-of-war` (grilled + operator-ratified 2026-07-02). Versions are **increments over the
land-time base** — the operator is the version authority; resolve the four canonical slots at land time
([[stacked-release-plan-version-literal-lags-operator-target]], [[release-bump-slots-canonical-no-badge]]).
Every code reference in the plans anchors by construct name, never bare line numbers
([[plan-line-number-refs-stale-use-construct-locator]]).

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [issue-422 nit sweep](../plans/2026-07-02-issue-422-nit-sweep.md) | `skills/war-help/SKILL.md`, `skills/war-campaign/**` (ledger CLI + test + SKILL §7.1), `README.md` (campaign ¶), version slots | +patch | — |
| 2 | [variable audit roster](../plans/2026-07-02-variable-audit-roster.md) | `skills/war/assets/**` (`war-config.mjs`+test, `workflow-template.js`+test), `agents/war-auditor.md`, `skills/war/SKILL.md` + `references/{schemas,design}.md`, `.tours/architect-war-system.tour`, `README.md` (audit prose), version slots | +0.1.0 | 1 |
| 3 | [war clean handoff](../plans/2026-07-02-war-clean-handoff.md) | `workflow-template.js`+test, `agents/war-{auditor,worker}.md`, `skills/war-strategy/SKILL.md`+structure test, `skills/red-team/**` (scaffold + test + `references/lenses.md`), `skills/war/SKILL.md` + `references/{schemas,design}.md`, `CONTEXT.md`, ADR 0012+0013, version slots | +0.1.0 | 2 |

## Dependency spine (strict landing order)

```
1 → 2 → 3
```

Schema epoch: plans 1–2 RUN under the v0.9.0 template — their task audit annotations use the old
`lenses`/`coven:false` schema. Plan 3 is authored against POST-roster constructs and annotates with
`task.roster` (per-seat lens + depth).

## Shared-file contention

| File | Plans | Risk / handling |
|------|-------|-----------------|
| `skills/war/assets/workflow-template.js` + `.test.mjs` | 2, 3 | Heaviest overlap — strictly serial; plan 3 re-anchors its edits by construct against the post-roster file (collision inventory: `auditRound`, `auditPrompt`, mirror marker comment, both `mergedTasksForGateAudit.push` sites) |
| `agents/war-auditor.md` | 2, 3 | Different sections (2: D6 lens catalog; 3: latitude + disposition rules) — serial, low conflict |
| `skills/war/SKILL.md`, `references/schemas.md`, `references/design.md` | 2, 3 | Serial; plan 3 re-anchors by construct |
| `README.md` | 1, 2 | Disjoint sections (1: campaign paragraph flags; 2: Audits bullet, `--config` row, war-room intro) |
| `skills/war-strategy/SKILL.md` + structure test | 3 only | Plan 3 absorbs #422 item 3 (structure-test widening) — plan 1 deliberately won't-fixes it there |
| Four version slots (`plugin.json`, `marketplace.json` ×2, README `## Status`) | 1, 2, 3 | Strictly serial; each release phase bumps as an increment over the land-time base |

Rev 1 note: this roadmap is authoring input + a committable snapshot — **never the live queue**. The live
queue is `/war-campaign`'s campaign ledger (uncommitted, inbox drop-dir).
