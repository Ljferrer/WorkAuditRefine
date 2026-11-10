# Red-team: 2026-11-08-model-routing-and-prompt-byte-budgets

- **Plan:** `docs/plans/2026-11-08-model-routing-and-prompt-byte-budgets.md`
- **Verdict:** ADJUDICATED (round 1: every blocker patched in place, three operator rulings plus AI-declared patches)
**Rounds:** 1
- **Artifact kind:** impl-plan
- **Base:** `4dd30aab` (origin/master after the predecessor plan, engine-findings-ace-and-late-fix, merged as PR #2811). Sandbox clone at that sha.
- **Probes:** 12 (6 spine, 6 bespoke), 5 executed, 7 analyzed, all on target, none dropped. Escape guard exit 0 against the snapshot, for the clone and for the main checkout.
- **Gate:** first pass BLOCKED (24 blocker rows, 12 needsDecision rows, 26 minors, many of them the same defect seen by several probes). After the patches, 27 findings were stamped adjudicated. The gate returned ADJUDICATED at rounds 1 with no route upstream.
- **Lead drift-guard checks:** `unguarded-new-mirror` passes (the inline `validateRoster` mirror already has a behavioral registry row in `workflow-template.engine-1.test.mjs`). `guard-split-deps-edge` passes (3.2 on 3.1, 4.2 on 4.1, 5.3 on 5.2 and now 5.1). `touched-doc-fact-coverage` passes through the de-mirrors and backstop rows 4, 5 and 8. `default-flip-old-absent` found gaps, patched below.

## Measured at base

| Surface | Size | Hard line | Room |
|---|---|---|---|
| Workflow prompt-literal share | 170,730 B | 172,032 B | 1,302 B |
| Stripped staged template, arm (p) | | | 69,719 B |
| `GLOSSARY.md` | 131,055 B | 131,072 B | 17 B |
| `agents/war-worker.md` | 13,287 B | 13,312 B | 25 B |
| `agents/war-refiner.md` | 38,776 B | 38,912 B | 136 B |

The predecessor plan used about 7.2 KB of literal share after `ed183b08`. Phase 2's cut frees about 268 B, which does not fund Tasks 3.1, 4.1 and 5.3.

## Operator rulings (2026-11-10)

1. **Literal-share funding.** Tasks 3.1, 4.1 and 5.3 may raise `WORKFLOW_LITERAL_BUDGET` with a `Budget-Raise: ADR-0042 skills/war/assets/workflow-template.js +<bytes>` trailer, after a dedup pass in the task's footprint. End state 19 now names that surface. The three tasks gain `prompt-surface-budgets.test.mjs` in Files, and Task 5.3 now waits on Task 5.1, which owns that file in wave 1.
2. **`git cherry`.** The `pin-confirm` relay runs `git cherry`, which the PIN-26 policy did not admit. `cherry` joins the helper verb set, with an eleventh End state 25 row, `cherry of two revs is allowed`.
3. **Telemetry lens.** The `dispatchModels` record gains an optional `lens` key on auditor rows. Depth stays out.

## Patched in place (Lead, AI-declared)

- **End state 27 was vacuous (Major, 8 probes).** ADR 0057 wraps "Snapshot / and confirm dispatches also stay there" across two lines. So the old grep printed 0 at base. The check and Task 5.3 Done when now grep `confirm dispatches also stay there`, which prints 1 at base.
- **Binding guardrail contradiction (Major).** "No byte is added to `agents/war-refiner.md`" now reads "no task but Task 5.1 adds a byte". The PLAN-DEFECT guardrail now says "never raises outside the ruled raises".
- **PIN-27 gaps (Major).** A `<rev>^{tree}` read becomes `git show -s --format=%T <rev>`. `MERGE_FACTS_RULE` is rewritten once in admitted forms, with no fork. The inlined Exact Git diff identity command is the reference command with revs filled in and `set -o pipefail` dropped, and a `fatal:` on stderr is a `git_error`.
- **Same-lens seat label (Major).** A paired or sampled seat carries a `<lens>:opus` label, so retry, transfer and verdict keys tell the two seats apart. Task 4.1 gains the row `sampled review — a same-lens seat gets a distinct label`.
- **`charge-probe` home (Major).** The predecessor plan added `charge-probe`. It stays on `spawn('refiner')`, joins no tier, and does not move to the helper.
- **Tip-probe re-ask (Major).** The #2704 D36 re-ask is a repeat attempt and keeps today's spawn options. The repeat-attempt row gets a tip-probe case.
- **Rename guard (Major, default-flip probe).** End state 28 now also greps ADR 0056 and checks that `.claude/war/config.effective-by-phase.json` holds no `"docs": {` key (9 at base). The refusal text never spells the dotted old key. ADR 0050's tier list and the README preset sentence join the rename list.
- **Evidence consumed.** Added the missing issue #2706 row.
- **Stale figures (Minor).** End state 5 and 29 red-at-base values and the headroom constraint now carry the `4dd30aab` numbers. The stripped-template Open decision is settled as moot.

## Adjudications

| Value | Supersedes | Provenance |
|---|---|---|
| Literal-share raise allowed in Tasks 3.1, 4.1, 5.3 | raise only in Task 5.1 | operator-ratified (2026-11-10) |
| Helper verb set adds `cherry`; End state 25 counts 11 | 10 rows, no `cherry` | operator-ratified (2026-11-10) |
| `dispatchModels` adds optional `lens` | no seat keys | operator-ratified (2026-11-10) |
| Task 5.3 deps `[5.1, 5.2]` | `[5.2]` | AI-declared |
| End state 27 grep fragment `confirm dispatches also stay there` | `Snapshot and confirm dispatches also stay there` | AI-declared |
| End state 29 red at base `2` | `3` or more | AI-declared |

## Residual risk (minors not patched)

- End state 18 says "four glossary terms" but its regex counts three. The gate-audit seat judges the fourth.
- Task 3.1 has no `evidence tier — absent keeps spawn('refiner')` row. PIN-14's byte-identical rows cover the absent arm in general.
- Several absence greps (End states 6 and 7) are case-sensitive and line-bound. They are red at base and pass only after the edit. A reworded survivor would slip through, and the plan-faithfulness seat reads the diff.
- The literal lint reports PIN-20 and PIN-21 as uncited in their landing sections. Both are advisory.
- A25 (deferred REA schemas with `ToolSearch`) was not re-proven here. Backstop row 2 measures first-turn context on the first run after land.
