# Survey 2026-07-22 run resilience + guard ergonomics + memory hardening — 9 plans

Source manifest: `.claude/aot/2026-07-22-survey.json` (main checkout). Every plan cites its
source spec (`docs/specs/2026-07-22-<slug>-design.md`) and — except plan 9, which ships no
runtime behavior and logged the deviation — carries its own trailing release phase, version
resolved as the next free patch above the live integration base at land time, never a literal
authored here. Provenance: all nine plans were converted by `/war-machine --afk` on 2026-07-22
(ADR 0014 — `## AI-Commander's Intent` and `## Deferred validations (backstops — AI-declared)`
headings are the provenance markers; one drafter + one independent adversarial grill per spec,
grill findings reconciled into each plan; self-adjudications recorded in each plan's
`## Notes / conscious deviations`). No operator ratification has occurred — the campaign runs
`/red-team` per plan before executing it.

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [auditor-guard-ergonomics](../plans/2026-07-22-auditor-guard-ergonomics.md) | `hooks/validate-auditor-git.sh`, `hooks/validate-auditor-git.test.sh`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-auditor.md` | next free | — |
| 2 | [audit-adjudication-threading](../plans/2026-07-22-audit-adjudication-threading.md) | `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-auditor.md`, `skills/war/SKILL.md`, `skills/war/references/schemas.md`, `skills/red-team/SKILL.md`, `CONTEXT.md`, `docs/adr/0013-commanders-intent-and-disposition-routing.md` | next free | 1 (shared `workflow-template.js`/`.test.mjs`, `war-auditor.md`) |
| 3 | [servitor-wrapup-landed-tip](../plans/2026-07-22-servitor-wrapup-landed-tip.md) | `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-servitor.md`, `docs/adr/0029-capture-grounds-on-committed-tip.md`, `docs/learnings/servitor-verify-on-write-worktree-can-lag-just-landed-phase.md`, `CONTEXT.md` | next free | 2 (shared `workflow-template.js`/`.test.mjs`; D3 registry row after 1's) |
| 4 | [merge-land-resilience](../plans/2026-07-22-merge-land-resilience.md) | `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-refiner.md`, `skills/war/assets/provision-worktrees.sh`, `skills/war/assets/provision-worktrees.test.sh`, `skills/war/SKILL.md`, `skills/war/references/schemas.md`, `skills/war/assets/skill-doc-contracts.test.mjs`, `CONTEXT.md`, `docs/adr/0023-land-asserts-git-ground-truth.md`, new ADR (number at land) | next free | 3 (D3 registry row/floor after the 1→3 chain) |
| 5 | [test-floor-target-repo](../plans/2026-07-22-test-floor-target-repo.md) | `skills/war/assets/assert-test-in-diff.sh`, `skills/war/assets/assert-test-in-diff.test.sh`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-refiner.md`, `skills/war/SKILL.md`, `skills/war/references/schemas.md`, `skills/war/assets/war-config.mjs`, `skills/war-room/SKILL.md`, `skills/war/assets/assert-packaging-in-diff.sh`, `CONTEXT.md` | next free | 4 (manifest edge; shared engine + refiner + doc surfaces; its 4-site count assumes 4's env-proceed prompt landed) |
| 6 | [war-memory-hardening](../plans/2026-07-22-war-memory-hardening.md) | `skills/_shared/war-memory.mjs`, `skills/_shared/war-memory.test.mjs`, `skills/lessons-learned/SKILL.md`, `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`, two learnings | next free | — (stack order only) |
| 7 | [aftermath-class1-postdelete-verify](../plans/2026-07-22-aftermath-class1-postdelete-verify.md) | `skills/aftermath/SKILL.md`, `skills/war-machine/war-pipeline-structure.test.sh`, `docs/learnings/aftermath-remote-stranded-differs-from-local-tip-reachability.md`, `CONTEXT.md` | next free | — (stack order only) |
| 8 | [cli-main-guard-normalization](../plans/2026-07-22-cli-main-guard-normalization.md) | `skills/war/assets/stage-workflow.mjs`, `skills/war/assets/stage-workflow.test.mjs`, `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`, `skills/war-campaign/assets/campaign-ledger.mjs`, `skills/war-campaign/assets/campaign-ledger.test.mjs`, `docs/learnings/cli-main-guard-equality-check-silently-noops-under-relative-invocation.md` | next free | 5 (shared `war-config.mjs`, construct-disjoint: 5 comment-only, 8 main guard) |
| 9 | [war-strategy-structure-lock](../plans/2026-07-22-war-strategy-structure-lock.md) | `skills/war-strategy/war-strategy-structure.test.sh`, `docs/learnings/structure-test-check-f-locks-presence-anywhere-not-intended-location.md` | — (no release phase; rides the next sibling release) | — (stack order only) |

## Issue → spec → plan chain

| Issue | Spec | Plan |
|-------|------|------|
| #980 | [auditor-guard-ergonomics-design](../specs/2026-07-22-auditor-guard-ergonomics-design.md) | 1 |
| #982 | [auditor-guard-ergonomics-design](../specs/2026-07-22-auditor-guard-ergonomics-design.md) | 1 |
| #985 | [audit-adjudication-threading-design](../specs/2026-07-22-audit-adjudication-threading-design.md) | 2 |
| #990 | [servitor-wrapup-landed-tip-design](../specs/2026-07-22-servitor-wrapup-landed-tip-design.md) | 3 |
| #984 | [merge-land-resilience-design](../specs/2026-07-22-merge-land-resilience-design.md) | 4 |
| #986 | [merge-land-resilience-design](../specs/2026-07-22-merge-land-resilience-design.md) | 4 |
| #983 | [test-floor-target-repo-design](../specs/2026-07-22-test-floor-target-repo-design.md) | 5 |
| #989 | [war-memory-hardening-design](../specs/2026-07-22-war-memory-hardening-design.md) | 6 |
| #992 | [war-memory-hardening-design](../specs/2026-07-22-war-memory-hardening-design.md) | 6 |
| #987 | [aftermath-class1-postdelete-verify-design](../specs/2026-07-22-aftermath-class1-postdelete-verify-design.md) | 7 |
| #988 | [cli-main-guard-normalization-design](../specs/2026-07-22-cli-main-guard-normalization-design.md) | 8 |
| #991 | [war-strategy-structure-lock-design](../specs/2026-07-22-war-strategy-structure-lock-design.md) | 9 |

## Dependency spine (strict landing order)

```
1 → 2 → 3 → 4 → 5 → 8      (engine/hotspot chain)
6, 7, 9                    (independent lanes — queue position is release-slot
                            serialization + reviewer bandwidth, not file safety)
```

Serialized (stack-and-plow, ADR 0011): **1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9**. The load-bearing
edges: plans 1–5 all edit `workflow-template.js` + `workflow-template.test.mjs` at disjoint named
constructs and must land in order, rebasing over predecessors at those constructs, never by
offset. The D3 both-surfaces registry floor arithmetic across the chain (each plan words it as
"the current true row count", never a literal — the no-slack #693 rule): base 10 → plan 1 adds a
row (11) → plan 2 adds none (its plan pre-empts the "untouched = confirming the design" audit
call) → plan 3 adds a row (12) → plan 4 adds a row (13) → plan 5 abstains by design (D8).
Plan 8 queues after 5 for the construct-disjoint `war-config.mjs` contact. The manifest's
`dependsOn` edges (1→2→3, 4→5) are honored; the 3→4 edge is footprint-derived (registry
row/floor collision), recorded in plan 4's Notes.

## Shared-file contention

| File | Plans | Risk |
|------|-------|------|
| Release slots (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` ×2, `README.md` `## Status`) | 1–8 | By design — each trailing release phase resolves the next free patch from the live slots at land time (stacked-release lesson; `version-slots.test.mjs` arbiter). Plan 9 ships no release phase (logged deviation) — its changes ride the next sibling release |
| `skills/war/assets/workflow-template.js` + `.test.mjs` | 1, 2, 3, 4, 5 | Real ordering chain — disjoint named constructs per plan (1: `auditPrompt()` teach, entry parse, top-level catch; 2: `adjudicationClause` + three gate-audit blocks; 3: Wrap-up block + `tipSha` hoist; 4: merge/land env-proceed arms; 5: floor-retry sub-loop + `MERGE_RESULT.floor_diagnostic`); the `.test.mjs` D3 registry/floor edits by 1, 3, 4 are the hard rebase-contact points |
| `CONTEXT.md` | 2, 3, 4, 5, 7 | Serial appends/edits at distinct named anchors — each plan's Notes carries the rebase-by-named-anchor rule |
| `skills/war/SKILL.md` | 2, 4, 5 | Distinct sections (2: decompose-gate step insert + renumber 5–7→6–8; 4: env-proceed/land prose; 5: per-phase re-adoption prose). Plan 2's renumber lands first; 4 and 5 rebase over it |
| `skills/war/references/schemas.md` | 2, 4, 5 | Distinct blocks (2: args-contract `adjudications`; 4: `gate_failure_class` environment rewrite; 5: `floor_diagnostic` + per-phase testPattern) |
| `agents/war-auditor.md` | 1, 2 | Distinct sections (1: guard-contract teach; 2: adjudication-match bullet) |
| `agents/war-refiner.md` | 4, 5 | Distinct steps (4: env-proceed dispatch duty; 5: verbatim stderr capture in step 4) |
| `skills/war/assets/war-config.mjs` (+ `.test.mjs`) | 5 (comment-only), 8 (main guard) | Construct-disjoint, weak edge — 8 queued after 5; `war-config.test.mjs` touched only by 8 |
| `docs/learnings/*` | 3, 6 (×2), 7, 8, 9 | Low — six distinct lesson files, no collision |
| `docs/adr/*` | 2 (0013 amendment), 3 (0029 amendment), 4 (0023 amendment + new ADR at the next free number, resolved at land) | Distinct files; ADR-number literal deliberately unresolved in plan 4 |
