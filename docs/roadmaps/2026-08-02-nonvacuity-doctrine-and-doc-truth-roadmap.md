# Test non-vacuity, red-team doctrine & doc truth — 4 plans

Campaign roadmap, 2026-08-02, authored by `/war-machine --afk` from the 2026-08-02 survey manifest
(`.claude/aot/2026-08-02-survey.json`). Mode: `stack` (stack-and-plow, ADR 0011) — each plan cuts
from its predecessor's landed tip. Version literals below are non-authoritative — each release
resolves the next free patch from the live slots at land time.

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [2026-08-02-structural-test-nonvacuity](../plans/2026-08-02-structural-test-nonvacuity.md) | the pin-suite family — `skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war/assets/prompt-surface-budgets.test.mjs`, `skills/war/assets/stage-workflow.test.mjs`, `skills/war/assets/workflow-template.test.mjs`, `hooks/validate-auditor-git.test.sh` (campaign-primary owner of the first, second and fourth) | — | — |
| 2 | [2026-08-02-redteam-doctrine-and-guards](../plans/2026-08-02-redteam-doctrine-and-guards.md) | red-team family + doc cascade — `skills/red-team/assets/*` (gate, escape guard, scaffold test), `skills/red-team/SKILL.md`, `skills/red-team/references/lenses.md`, new ADR (≈0043) + `docs/adr/0025-drift-guard-discipline.md` amendment, `skills/war-machine/SKILL.md`, `skills/war-strategy/SKILL.md`, `skills/war-machine/war-pipeline-structure.test.sh`, `CONTEXT.md`, `skills/war/references/design.md`, `skills/war-campaign/SKILL.md`, `README.md`, release slots | next free above live base (≈0.15.1) | 1 |
| 3 | [2026-08-02-references-pointer-link-truth](../plans/2026-08-02-references-pointer-link-truth.md) | agents/references prose family — `agents/war-auditor.md`, `skills/war/references/auditor-teach.md`, `skills/war/references/worker-servitor-edges.md`, `skills/war/references/resume-and-recovery.md`, `skills/war/references/submodule-flows.md`, new `skills/war/assets/reference-link-integrity.test.mjs` (+ additive rows in `workflow-template.test.mjs`, conditional touch of `skill-doc-contracts.test.mjs`, `war-config.test.mjs`, `land-decision.test.mjs`) | — | 1, 2 |
| 4 | [2026-08-02-war-engine-and-standing-doc-truth](../plans/2026-08-02-war-engine-and-standing-doc-truth.md) | engine + standing surfaces — `skills/war/assets/workflow-template.js`, `skills/war/SKILL.md` (Gate-2 bullet, trigger clause), `agents/war-refiner.md`, `skills/war/references/refiner-recovery.md`, `docs/adr/0037-run-scoped-staged-phase-scripts.md`, `docs/adr/0008-git-is-the-resume-source-of-truth.md`, `.tours/architect-war-system.tour` (+ D22/D15 rewrites in `skill-doc-contracts.test.mjs`, optional D6 pin in `workflow-template.test.mjs`) | — | 1, 3 |

## Dependency spine (strict landing order)

```
1 → 2 → 3 → 4
```

The order is content-forced, not ceremonial:

- **1 → {3, 4}:** plan 1 is the campaign-primary owner of `skill-doc-contracts.test.mjs` and
  `workflow-template.test.mjs`; plans 3 and 4 both edit those suites (additive rows / D22–D15
  rewrites) and must rebase onto the hardened suites, not race them. This firms up the edge the
  survey manifest missed for plan 3 (its manifest `dependsOn` was empty; the real footprint says
  otherwise — flagged independently by plan 1's and plan 4's conversions).
- **2 → 3:** plan 3's conversion pinned "land after the redteam-doctrine-and-guards release" —
  plan 2 carries the campaign's only release phase, and its ADR/doc cascade (new ADR ≈0043,
  `CONTEXT.md` terms, README wording) must be settled before plan 3's prose-truth sweeps re-read
  those surfaces.
- **3 → 4:** last-claimant rule on the two shared pin suites — plan 4 is the third claimant of
  both and lands last of the three.
- Plan 2's Task 6 (phase 1) and Task 7 (phase 2) both touch `README.md` across a phase edge —
  serial by construction; do **not** resequence them into one phase.

**Release note (operator decision, not a phase):** only plan 2 cuts a release. Plans 3–4 land
docs/tests plus two engine fixes (Gate-2 range probe, re-land `landResult` symmetry) after that
release; if the operator wants those shipped in a plugin version, cut a trailing release plan
resolving the next free patch above the campaign tip — plan 4's notes carry the expected-base
statement for it.

## Issue → spec → plan chain

| Issues | Spec | Plan |
|--------|------|------|
| #1233, #1241, #1163, #1246, #1180 | [structural-test-nonvacuity](../specs/2026-08-02-structural-test-nonvacuity-design.md) | plan 1 |
| #1207, #1224, #1242, #1244 | [redteam-doctrine-and-guards](../specs/2026-08-02-redteam-doctrine-and-guards-design.md) | plan 2 |
| #1215, #1212, #1216, #1243 | [references-pointer-link-truth](../specs/2026-08-02-references-pointer-link-truth-design.md) | plan 3 |
| #1192, #1245, #1219, #1161, #1221, #1240, #1225, #1211 | [war-engine-and-standing-doc-truth](../specs/2026-08-02-war-engine-and-standing-doc-truth-design.md) | plan 4 |
| #1179 | deferred by the survey — telemetry backstop, closes by measurement after the next multi-seat run, not by code | — |

## Shared-file contention

| File | Plans | Risk & mitigation |
|------|-------|-------------------|
| `skills/war/assets/skill-doc-contracts.test.mjs` | 1, 3, 4 | 1 rewords the self-matching D23/D24 banner + tightens D29 and adds the four-file census; 3's touch is conditional-ownership-only (expected untouched); 4 rewrites the D22 ordered-key pins for the range probe. Serialized by the spine; edits sit in disjoint constructs — expected clean rebases. |
| `skills/war/assets/workflow-template.test.mjs` | 1, 3, 4 | 1 fixes the two vacuous asserts (#1246); 3 extends the Task 5.1 pointer-shape guard to the auditor card; 4's arm-symmetry pin (D6) is optional. Additive edits in disjoint constructs; serial landing order required, no merges skipped. |
| `skills/war/assets/prompt-surface-budgets.test.mjs` | 1 | Single-owner (1 restores the per-row derivation guard and paraphrases the coupling comment in one merged unit — same-commit mandate in the file's own header). |
| `README.md`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | 2 | Single-owner: plan 2's doc sweep + the campaign's only release. Four slots re-read at its land tip; `version-slots.test.mjs` monotonic floor is the arbiter. |
| `CONTEXT.md`, `skills/war/references/design.md`, `skills/war-campaign/SKILL.md`, `skills/war-strategy/SKILL.md`, `skills/war-machine/SKILL.md` | 2 | Single-owner (verdict-cascade + doctrine surfaces; verified absent from every sibling footprint at conversion). |
| `agents/war-auditor.md`, `skills/war/references/{auditor-teach, worker-servitor-edges, resume-and-recovery, submodule-flows}.md` | 3 | Single-owner. The grill's claimed `resume-and-recovery.md` collision with plan 4's D14 was verified false at conversion (D14 edits ADR 0008's Consequences bullet, not that file). |
| `skills/war/assets/workflow-template.js`, `skills/war/SKILL.md`, `agents/war-refiner.md`, `skills/war/references/refiner-recovery.md`, ADRs 0008/0037, `.tours/architect-war-system.tour` | 4 | Single-owner. |

All remaining footprint files are owned by exactly one plan and carry no cross-plan risk.

## Execution

```
/war-campaign docs/roadmaps/2026-08-02-nonvacuity-doctrine-and-doc-truth-roadmap.md
```

Each plan is red-teamed at its selection (the campaign runs `/red-team` per plan before executing
it — plan 1's red-team should note the conversion-ratified split contains-shape for the
`WORKFLOW_LITERAL_BUDGET` comment, deviation 4 of that plan). Every plan here was authored
`--afk`: intents are `## AI-Commander's Intent` and backstops are AI-declared (ADR 0014) — the
red-team pass is where their self-adjudicated deviations get ratified. Anyone running a plan
through standalone `/war` must red-team it manually, and a standalone run resolves any release as
the next free patch from the four slots itself.
