# Red-team: 2026-11-08-engine-comment-and-duplication-tidy

- **Plan:** `docs/plans/2026-11-08-engine-comment-and-duplication-tidy.md`
- **Verdict:** ADJUDICATED (round 1: every blocker patched in place, AI-declared, one row under the operator's 2026-11-09 byte-budget ruling)
**Rounds:** 1
- **Artifact kind:** impl-plan
- **Base:** `da790a9a` (origin/master after the engine-findings and model-routing plans merged). Sandbox clone at that sha.
- **Probes:** 10 (6 spine, 4 bespoke), 3 executed, 7 analyzed, all on target, none dropped. Escape guard exit 0 for the clone and the main checkout.
- **Gate:** first pass BLOCKED (17 blocker rows, 7 needsDecision rows, 25 minors, many the same defect seen by several probes). After the patches, 18 findings were stamped adjudicated. The gate returned ADJUDICATED at rounds 1 with no route upstream.
- **Lead drift-guard checks:** all four pass or are vacuous. The plan adds no inline mirror without a registry row, flips no default, splits no guard from its fact, and its doc edits are comments only.

## Measured at base

| Surface | Size | Hard line | Room |
|---|---|---|---|
| Workflow prompt-literal share | 171,885 B | 172,032 B | 147 B |
| `agents/war-worker.md` | 13,291 B | 13,312 B | 21 B |

## Patched in place (Lead, AI-declared)

- **#2223 is already fixed (Critical).** #2803 gave the terminal-pass merged arm the `unlandedBy` touched-file gate. The planned comment ("no touched-file gate") would now be false, and End state 16's terminal sub-check could pass only on that false comment. Task 2.1 now records #2223 as already-fixed under A14. End state 16 drops the sub-check.
- **End state 16 could never pass (Major).** `filedKeys` and `queuedKeys` are now `keyRegistry()` calls, so the `new Set` range matched nothing. The range now anchors on `keyRegistry()` (15 lines at base) and the grep is case-insensitive.
- **Rule 1 discriminator (Major).** Every dispatched prompt opens with `AUTHORITY_LINE`, so "the clause the prompt opens with" is false. Rule 1, the card and D8 now say "the task text opens with, after the authority line". The #2317 test reads `unprefixed(prompt)`. The card wording stays no longer than today's (21 B of room).
- **Literal-share room (Major).** At 147 B of room, Task 1.1 measures first, dedups, and takes a cited `Budget-Raise: ADR-0042 skills/war/assets/workflow-template.js +<bytes>` only if its net change still crosses the line. This applies the operator's 2026-11-09 ruling that byte caps force a cited reason and never forbid a raise.
- **#2246 readers (Major).** `drainCauseOf` has new readers since the plan was drafted. The comment now names every reader at the rebased tip, re-derived live.
- **Evidence consumed (Major).** Added the #2782 row.
- **Release-baseline gate on synthetic tasks (needsDecision).** A late-fix task carries `manifestTask` but no `files`, so `isReleaseTask(task)` would drop the clause from a late fix of the release task. The gate now reads `task.manifestTask || task`, a sweep in a release phase counts as release, and End state 24 gains a third row.
- **Minor fixes.** End state 15 is case-insensitive. End state 17 red-at-base now reads `over:4` at da790a9a. End state 12's `wc -l` count strips whitespace. Zero-count `grep -c` rows are judged by the printed value.

## Adjudications

| Value | Supersedes | Provenance |
|---|---|---|
| #2223 retired as already-fixed (A14); End state 16 drops its terminal sub-check | a comment saying the arm has no touched-file gate | AI-declared |
| Task 1.1 may raise the literal share with a cited trailer after dedup | no budget is raised | AI-declared, applying the operator ruling of 2026-11-09 |
| End state 24 counts 3 rows (adds the late-fix row) | 2 rows | AI-declared |

## Residual risk (minors not patched)

- Constraint 2 omits #2198 from its code-item list, and Constraint 9 cites "Its PIN-12" where the args-floor plan's PIN-12 is meant. Both are wording only.
- D15 does not repeat the two gated clauses that the guardrail list already names.
- A17's note points at the refiner card section; the "absent ⇒ that arm skips" line now lives in `refiner-recovery.md` § Evidence phase diff.
- D9's exhaustion-tail parameter should name the full suffix. The worker reads both copies at the tip.
