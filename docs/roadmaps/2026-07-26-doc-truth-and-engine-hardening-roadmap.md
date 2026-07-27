# Doc truth & engine hardening — 4 plans

Campaign roadmap for the 2026-07-26 survey (`.claude/aot/2026-07-26-survey.json`). Converted by
`/war-machine`; contention computed post-hoc from the four ratified plans' real `Files:`
footprints (operator-waived serial conversion, parallel drafter+grill pairs).

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [dispatch-args-and-floor-coverage](../plans/2026-07-26-dispatch-args-and-floor-coverage.md) | `skills/war/assets/workflow-template.js` + `.test.mjs`, `skills/war/assets/stage-workflow.mjs` + `.test.mjs`, `skills/war/SKILL.md`, `docs/adr/0037-run-scoped-staged-phase-scripts.md`, `CONTEXT.md` | next-free patch at land | — |
| 2 | [war-memory-cli-correctness](../plans/2026-07-26-war-memory-cli-correctness.md) | `skills/_shared/war-memory.mjs` + `.test.mjs`, `docs/learnings/tighten-target-flag-has-three-independent-silent-degradation-paths.md`, `docs/learnings/cmdquery-topk-budget-share-tighten-targets-pre-fix-truthy-ternary-shape.md` | next-free patch at land | — |
| 3 | [auditor-guard-policy-and-mirror-truth](../plans/2026-07-26-auditor-guard-policy-and-mirror-truth.md) | `hooks/validate-auditor-git.sh` + `.test.sh`, `agents/war-auditor.md`, `docs/adr/0029-capture-grounds-on-committed-tip.md`, `skills/war/assets/workflow-template.js` (guard-contract clause) + `.test.mjs` (registry row, D6 test) | next-free patch at land | 1 |
| 4 | [standing-doc-and-remedy-truth-sweep](../plans/2026-07-26-standing-doc-and-remedy-truth-sweep.md) | `README.md`, `skills/war/assets/version-slots.test.mjs`, `docs/adr/0019-target-derived-execution-values.md`, `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`, `skills/war/assets/provision-worktrees.test.sh`, `skills/war-review/SKILL.md`, `skills/war/SKILL.md` (Gate-2 remedy), `skills/war/assets/skill-doc-contracts.test.mjs`, `agents/war-worker.md` | next-free patch at land | 1 |

Every plan also owns the three release-slot files (`.claude-plugin/plugin.json`,
`.claude-plugin/marketplace.json`, `README.md` `## Status`) in its trailing release phase —
serialized by the landing order below, each resolving the next free patch above its own live
integration base (version literals here are deliberately absent; they are non-authoritative in
roadmaps).

## Dependency spine (strict landing order)

```
1 → 2 → 3 → 4
```

Plan 2 is file-independent of plan 1 (only release slots shared) and could convert/execute in
either slot; it lands second to keep the stack shallow. Plans 3 and 4 carry hard `dependsOn`
edges to plan 1 via shared non-release files (below) — their specs and plans both state the
land-after-plan-1 constraint. Plan 3's Notes record the standalone fallback: if plan 1 holds,
plan 3 may land directly off master (its constructs are disjoint at both drafted tips) — the
Lead re-verifies at dispatch.

## Issue → spec → plan chain

| Issues | Spec | Plan |
|--------|------|------|
| #1134, #1114, #1151 | [dispatch-args-and-floor-coverage-design](../specs/2026-07-26-dispatch-args-and-floor-coverage-design.md) | plan 1 |
| #1145, #1135, #1154, #1147 | [war-memory-cli-correctness-design](../specs/2026-07-26-war-memory-cli-correctness-design.md) | plan 2 |
| #1138, #1025, #1124 | [auditor-guard-policy-and-mirror-truth-design](../specs/2026-07-26-auditor-guard-policy-and-mirror-truth-design.md) | plan 3 |
| #1153, #1115, #1146, #1152, #1107, #1136, #1096 | [standing-doc-and-remedy-truth-sweep-design](../specs/2026-07-26-standing-doc-and-remedy-truth-sweep-design.md) | plan 4 |

Deferred by the survey (closed with rationale, no plan): #1085 (fixed at tip `c25e5c8`),
#1098 (overtaken; harness-owned residue).

## Shared-file contention

| File | Plans | Risk / resolution |
|------|-------|-------------------|
| `skills/war/assets/workflow-template.js` + `.test.mjs` | 1, 3 | High-traffic engine pair. Plan 3 touches only the `auditPrompt()` guard-contract clause + registry row/D6 test; plan 1 touches dispatch prompts, `classificationClause`, anchors. Constructs disjoint at draft tips, but same-file ⇒ hard ordering edge: plan 3 lands after plan 1 (or falls back per its Notes if plan 1 holds). |
| `skills/war/SKILL.md` | 1, 4 | Plan 1 adds the `--args` launch prose; plan 4 rewrites the Gate-2 remedy bullet. Different sections; same-file ⇒ plan 4 lands after plan 1. |
| `README.md` `## Status` + `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json` | all 4 (release phases) | Serial stack-and-plow: each release phase re-resolves the next free patch at its own land tip; an intervening external release surfaces as a rebase conflict on the slot lines — re-resolve from the rebased tip, never the stale worktree copy. |
| `skills/war/assets/version-slots.test.mjs` | 4 (edits) · 1–3 (release gates run it) | Plan 4 adds the checklist presence lock + negative helper; plans 1–3 only execute the suite. Edit-vs-run is safe in any order; plan 4's own release phase must satisfy the lock it just landed. |
| `README.md` (prose beyond `## Status`) | 4 | Plan 4's #1153 blurb corrections + `## Releasing` checklist live outside the Status slot; the slot rewrite in every release phase replaces the Status paragraph only. |

## Campaign notes

- The campaign runs `/red-team` per plan before executing it (expected reports at
  `docs/red-team/2026-07-26-<plan-slug>.md`); anyone running a plan through standalone `/war`
  must red-team it manually.
- Plan-literal-lint at conversion: plans 1 and 4 clean; plans 2 and 3 each carry two advisory
  `literal-suite-list` hits naming their own paired shell suites (`war-memory-lint.test.sh`,
  `validate-auditor-git.test.sh`) — deliberate, the suites are named as byte-unchanged /
  paired-move constraints, not as gate lists.
- Operator rulings folded in at conversion: plan 3 Task 1.1 carries the dated ADR 0029 status
  note; plan 4's two new locks ship inline unwired negative-reference helpers.
