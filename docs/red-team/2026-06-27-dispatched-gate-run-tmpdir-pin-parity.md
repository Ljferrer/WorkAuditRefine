# Red Team — Dispatched Gate-Run TMPDIR `.war-task`-free Pin Parity (#184) (2026-06-27)

**Verdict:** CLEARED-WITH-NOTES — plan proven implementable at the G1 tip; all findings are pre-G1-baseline staleness the plan already self-handles. Verified against **G1's tip `0b24dd0`** (the stack base), not master.

Plan: [`docs/plans/2026-06-27-dispatched-gate-run-tmpdir-pin-parity.md`](../plans/2026-06-27-dispatched-gate-run-tmpdir-pin-parity.md) (#184, v0.7.2)

## Attack surface
Spine (5) + bespoke `baseline-repro` (executed), `red-state-claims` (analyzed). 7 expected; **1 probe dropped** (subagent didn't return) — coverage note, not downgraded to a pass; the executable-proof + 6 others cover the key claims.

## Executed proof
- **executable-proof** → in a sandbox at `0b24dd0`, applied the plan's exact TDD slice: extended PRESENCE CHECK 4 with the `WORKFLOW_FILE` `>=2` assertion, mirrored the merge-task + land-phase TMPDIR clauses verbatim, ran `refinery-surface.test.sh` + the full self-discovering gate at each step. **The slice works** — RED before, GREEN after. Strongest evidence: the plan is directly implementable on the G1 tip.
- **baseline-repro** → the G1-tip base gate is green (G1 landed; `integration_sha` present).
- **red-state** → `grep -cF 'TMPDIR=' workflow-template.js` == 0 at the G1 tip (RED-state holds); `war-refiner.md:24` carries the clause to mirror.

## Findings (all NON-blocking — pre-accounted-for by the plan)
- **[Major→note] Stale line numbers.** The plan's Baseline-drift note cites the land-phase clause at `:394-408`/`:400`; on the G1 tip it's at `:416-430`/`:422` (G1's `integration_sha` edit shifted lines). **Already handled:** the plan's own Baseline-drift note says "G2 lands on the landed G1 tip, which shifts these line numbers — every task re-anchors by named construct, NEVER by a literal line number," and Step 3 anchors on the sentence text. The literal numbers are pre-G1 reference only.
- **[Major needsDecision→resolved] Version premise.** The plan says "every slot reads 0.7.0 at HEAD now"; on the G1 tip all four slots read **0.7.1** (G1 landed). **Already handled:** DP6's operative instruction is "do NOT hardcode the from-version; read the live slot value at land time (expected 0.7.1 after G1) → 0.7.2." Adjudication: G1 has landed; from-version is 0.7.1 → bump to 0.7.2. Worker prompt threads this explicitly.
- **[Minor] DP6 descriptive parenthetical** ("currently holds the 0.7.0 paragraph") is stale doc-freshness; operative instruction is correct.

## Resolutions applied
No plan edits required — the plan's Baseline-drift note + DP6 already prescribe construct-anchoring and read-live-version, which match the G1-tip reality exactly. The G1-tip specifics (re-anchor the land-phase clause by its sentence; bump 0.7.1 → 0.7.2) are threaded into the WAR worker prompts at dispatch.

## Residual risk
- One dropped probe (coverage gap) — accepted given the executable-proof directly validated implementability.
- G2 stacks on G1 (PR #207, unmerged): G2's working branch is cut from G1's tip; its PR to master will show G1+G2 until G1 merges, then only the G2 delta.
