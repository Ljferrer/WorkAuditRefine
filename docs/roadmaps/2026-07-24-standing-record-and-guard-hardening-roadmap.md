# Survey 2026-07-24 standing-record truth + guard/tooling hardening — 6 plans

Source manifest: `.claude/aot/2026-07-24-survey.json` (main checkout). Every plan cites its
source spec (`docs/specs/2026-07-24-<slug>-design.md`) and carries its own trailing release
phase, version resolved as the next free patch above the live integration base at land time,
never a literal authored here. Provenance: all six plans were converted interactively by
`/war-machine` on 2026-07-24 — one drafter + one independent adversarial grill per spec,
strictly serial so each successive plan saw its predecessors' real footprints; every
`## Commander's Intent` was operator-confirmed by echo-back (ADR 0013), grill findings
reconciled into each plan, and self-adjudications recorded in each plan's
`## Notes / conscious deviations` (ratified later by `/red-team`, which the campaign runs per
plan before executing it). `plan-literal-lint.mjs`: plans 1–4 and 6 clean; plan 5 carries one
justified advisory hit (`literal-suite-list: war-memory-lint.test.sh` — the new file is the
deliverable, its name is load-bearing).

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [land-advance-exit-contract-truth](../plans/2026-07-24-land-advance-exit-contract-truth.md) | `docs/learnings/land-advance-push-first-cas-rejected-token.md`, `docs/seed/seed-manifest.json`, `docs/seed/seed.tar.gz`, `skills/war/assets/provision-worktrees.test.sh`, `docs/adr/0023-land-asserts-git-ground-truth.md` | next free | — (front-loaded: the stale lesson is prefetched into every land-path seat and its twin ships in the plugin seed corpus) |
| 2 | [runbook-and-standing-record-coherence](../plans/2026-07-24-runbook-and-standing-record-coherence.md) | `skills/war/references/schemas.md`, `skills/war-review/SKILL.md`, `skills/war/SKILL.md`, `CONTEXT.md`, `docs/specs/2026-07-22-audit-adjudication-threading-design.md`, `skills/war/assets/skill-doc-contracts.test.mjs`, `docs/roadmaps/2026-07-22-run-resilience-and-hardening-roadmap.md`, `hooks/validate-auditor-git.sh`, `hooks/validate-auditor-git.test.sh` | next free | — (stack order only) |
| 3 | [recovery-re-merge-dispatch-coherence](../plans/2026-07-24-recovery-re-merge-dispatch-coherence.md) | `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `docs/adr/0019-target-derived-execution-values.md`, `docs/adr/0040-environment-class-gate-failures-earn-one-retry.md` | next free | — (stack order only) |
| 4 | [drift-guard-and-floor-diagnostic-hardening](../plans/2026-07-24-drift-guard-and-floor-diagnostic-hardening.md) | `skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war/assets/workflow-template.test.mjs`, `skills/war/assets/assert-test-in-diff.sh`, `skills/war/assets/assert-test-in-diff.test.sh`, `agents/war-auditor.md` | next free | 3 (manifest edge; shared `workflow-template.test.mjs` — FLOOR_SITE_RE re-anchor rebases over 3's dispatch-capture tests), 2 (shared `skill-doc-contracts.test.mjs` — D18 rework rebases over 2's two new locks) |
| 5 | [gate-evidence-and-release-integrity](../plans/2026-07-24-gate-evidence-and-release-integrity.md) | `skills/_shared/war-memory-lint.test.sh` (new), `skills/_shared/war-memory.test.mjs`, `.github/workflows/memory-audit.yml`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-auditor.md`, `skills/war/references/schemas.md`, `skills/war/assets/version-slots.test.mjs`, `CLAUDE.md`, `skills/war/SKILL.md`, `skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war/assets/provision-worktrees.sh`, `skills/war/assets/provision-worktrees.test.sh`, three `docs/learnings/` lessons | next free | 2, 3, 4 (manifest edges; shared `SKILL.md`/`schemas.md`, `workflow-template.js`/`.test.mjs`, `war-auditor.md`/`skill-doc-contracts.test.mjs`), 1 (shared `provision-worktrees.test.sh`, stack order) |
| 6 | [memory-tooling-hardening](../plans/2026-07-24-memory-tooling-hardening.md) | `skills/_shared/war-memory.mjs`, `skills/_shared/war-memory.test.mjs`, `skills/lessons-learned/SKILL.md`, `skills/lessons-learned/references/seeding.md`, `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`, `skills/lessons-learned/assets/seed-pack.mjs`, `skills/lessons-learned/assets/seed-pack.test.mjs` | next free | 5 (shared `war-memory.test.mjs` — new `--target` tests anchor beside the tighten-plan family by test name, after 5's wrapper meta-tests) |

## Issue → spec → plan chain

| Issue | Spec | Plan |
|-------|------|------|
| #1035 | [land-advance-exit-contract-truth-design](../specs/2026-07-24-land-advance-exit-contract-truth-design.md) | 1 |
| #1036 | [land-advance-exit-contract-truth-design](../specs/2026-07-24-land-advance-exit-contract-truth-design.md) | 1 |
| #1037 | [land-advance-exit-contract-truth-design](../specs/2026-07-24-land-advance-exit-contract-truth-design.md) | 1 |
| #1038 | [land-advance-exit-contract-truth-design](../specs/2026-07-24-land-advance-exit-contract-truth-design.md) | 1 |
| #1016 | [runbook-and-standing-record-coherence-design](../specs/2026-07-24-runbook-and-standing-record-coherence-design.md) | 2 |
| #1039 | [runbook-and-standing-record-coherence-design](../specs/2026-07-24-runbook-and-standing-record-coherence-design.md) | 2 |
| #1053 | [runbook-and-standing-record-coherence-design](../specs/2026-07-24-runbook-and-standing-record-coherence-design.md) | 2 |
| #1078 | [runbook-and-standing-record-coherence-design](../specs/2026-07-24-runbook-and-standing-record-coherence-design.md) | 2 |
| #1084 | [runbook-and-standing-record-coherence-design](../specs/2026-07-24-runbook-and-standing-record-coherence-design.md) | 2 |
| #1085 | [runbook-and-standing-record-coherence-design](../specs/2026-07-24-runbook-and-standing-record-coherence-design.md) | 2 |
| #1087 | [runbook-and-standing-record-coherence-design](../specs/2026-07-24-runbook-and-standing-record-coherence-design.md) | 2 |
| #1032 | [recovery-re-merge-dispatch-coherence-design](../specs/2026-07-24-recovery-re-merge-dispatch-coherence-design.md) | 3 |
| #1033 | [recovery-re-merge-dispatch-coherence-design](../specs/2026-07-24-recovery-re-merge-dispatch-coherence-design.md) | 3 |
| #1034 | [recovery-re-merge-dispatch-coherence-design](../specs/2026-07-24-recovery-re-merge-dispatch-coherence-design.md) | 3 |
| #1040 | [drift-guard-and-floor-diagnostic-hardening-design](../specs/2026-07-24-drift-guard-and-floor-diagnostic-hardening-design.md) | 4 |
| #1049 | [drift-guard-and-floor-diagnostic-hardening-design](../specs/2026-07-24-drift-guard-and-floor-diagnostic-hardening-design.md) | 4 |
| #1050 | [drift-guard-and-floor-diagnostic-hardening-design](../specs/2026-07-24-drift-guard-and-floor-diagnostic-hardening-design.md) | 4 |
| #1080 | [drift-guard-and-floor-diagnostic-hardening-design](../specs/2026-07-24-drift-guard-and-floor-diagnostic-hardening-design.md) | 4 |
| #1081 | [gate-evidence-and-release-integrity-design](../specs/2026-07-24-gate-evidence-and-release-integrity-design.md) | 5 |
| #1082 | [gate-evidence-and-release-integrity-design](../specs/2026-07-24-gate-evidence-and-release-integrity-design.md) | 5 |
| #1083 | [gate-evidence-and-release-integrity-design](../specs/2026-07-24-gate-evidence-and-release-integrity-design.md) | 5 |
| #1059 | [memory-tooling-hardening-design](../specs/2026-07-24-memory-tooling-hardening-design.md) | 6 |
| #1079 | [memory-tooling-hardening-design](../specs/2026-07-24-memory-tooling-hardening-design.md) | 6 |
| #1086 | [memory-tooling-hardening-design](../specs/2026-07-24-memory-tooling-hardening-design.md) | 6 |
| #1088 | [memory-tooling-hardening-design](../specs/2026-07-24-memory-tooling-hardening-design.md) | 6 |

Deferred (survey manifest): #1025 — overtaken by PR #1002 (landed 2026-07-22, shipped
v0.14.49); its residual telemetry angle is carried by #1078 inside plan 2.

## Dependency spine (strict landing order)

```
2 → 4 → 5 → 6      (doc-contract / test-file chain: skill-doc-contracts.test.mjs,
                    workflow-template.test.mjs, war-memory.test.mjs)
3 → 4              (manifest edge — workflow-template.test.mjs)
1 → 5              (provision-worktrees.test.sh, disjoint case families)
```

Serialized (stack-and-plow, ADR 0011): **1 → 2 → 3 → 4 → 5 → 6**. Plan 1 is front-loaded per
its own Commander's Intent urgency (stale-lesson prefetch + shipped seed corpus), never behind
unrelated work. The load-bearing edges: plans 3, 4, 5 edit `workflow-template.test.mjs` at
disjoint named constructs and must land in order, rebasing over predecessors at those
constructs, never by offset; plans 2, 4, 5 append to `skill-doc-contracts.test.mjs` with lock
numbers and D-rows resolved next-free at rebase time, never hardcoded; plan 6 lands its
`--target` CLI tests beside the tighten-plan family by test name after plan 5's wrapper
meta-tests. The manifest's `dependsOn` edges (3→4; 2,3,4→5) are honored; the 2→4, 1→5, and
5→6 edges are footprint-derived, recorded in the owning plans' Notes.

## Shared-file contention

| File | Plans | Risk / discipline |
|------|-------|-------------------|
| `skills/war/assets/workflow-template.test.mjs` | 3, 4, 5 | Disjoint constructs (3: dispatch-capture tests; 4: FLOOR_SITE_RE re-anchor + `mirrored verbatim` absence lock; 5: criterion-11 pins + behavioral case). Rebase by named construct. |
| `skills/war/assets/workflow-template.js` | 3, 5 | Disjoint constructs (3: three `submodMergeNote` appends + `gateCaptureClause` comment; 5: `endStateBlock` case (3) + two header comments). |
| `skills/war/assets/skill-doc-contracts.test.mjs` | 2, 4, 5 | Append-only rows/blocks; D-numbers and lock numbers resolved next-free at rebase; 4's D18 rework confined to the D18 block. |
| `agents/war-auditor.md` | 4, 5 | Different sections (4: guard-contract intro sentence; 5: execution-evidence checklist bullet). Plan 5 assumes nothing about plan-4 sentence bytes (operator-ratified byte-identity drop). |
| `skills/war/SKILL.md` | 2, 5 | Different sections (2: Outcome-handling / Recovery relaunch / Checkpoint; 5: Gate-2 promotion flow). |
| `skills/war/references/schemas.md` | 2, 5 | Different blocks (2: ledger.json + run-manifest contracts; 5: `intent`-paragraph parenthetical). |
| `skills/war/assets/provision-worktrees.test.sh` | 1, 5 | Different case families (1: T2.5d + T2.9 census; 5: new P-family refusal case). No content dependency — serial order only. |
| `skills/_shared/war-memory.test.mjs` | 5, 6 | Append-only (5: wrapper meta-tests; 6: `--target` refusal tests anchored by test name). |
| Release slots (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`) | all 6 | Every plan's trailing release phase, directive form — each lander re-resolves the next free patch from the slots at land time (N-step baseline-lag lesson). |
| Seed corpus (`docs/seed/*`) ↔ `seed-pack.mjs` | 1 (runs the CLI), 6 (edits the CLI) | **No ordering dependency in either direction** (verified both ways in plan 6's Notes) — do not infer a `dependsOn`, do not reorder into one. |

## Cross-plan deferral vehicles

- Plan 3, Phase-1 close: Lead files ONE `war-followup` naming the `submodLandNote` re-land
  omission (both re-land dispatches) and the phase-close polish merge's submodule-scoping
  question, citing spec §9.
- Plan 4, Phase-1 close: Lead files ONE `war-followup` naming the two surviving `=`-attached
  mirror surfaces (`agents/war-auditor.md` guard bullet; the `workflow-template.js` dispatched
  clause), citing #1085 and plan 2's hooks-only footprint.
