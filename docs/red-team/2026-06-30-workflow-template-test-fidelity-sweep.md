# Red-team report — workflow-template.test.mjs fidelity sweep (#266/#267/#250/#221/#317/#326)

**Plan:** [`docs/plans/2026-06-30-workflow-template-test-fidelity-sweep.md`](../plans/2026-06-30-workflow-template-test-fidelity-sweep.md)
**Source spec:** [`docs/specs/2026-06-30-workflow-template-test-fidelity-sweep-design.md`](../specs/2026-06-30-workflow-template-test-fidelity-sweep-design.md)
**Date:** 2026-07-01 · **Target:** v0.8.6 (landOrder 6) · **Stacked base:** Spec 5 tip `29fda48` (v0.8.5) · **Closes:** #266, #267, #250, #221, #317, #326

## Verdict: **CLEARED** (gate: CLEARED-WITH-NOTES)

Gate summary: `{ probes: 12, executed: 3, analyzed: 9, pass: 10, fail: 0, warn: 2, expected: 12, onTarget: 12, offTarget: [], dropped: [] }` — coverage whole, **0 blockers, 0 needsDecision**, 3 Minors (2 fixed, 1 noted).

The lowest-risk plan in the stack: a **zero-production-change, test-prose-only** sweep over a single file (`skills/war/assets/workflow-template.test.mjs`). All six target constructs were verified **present and matching** at the v0.8.5 stacked base despite the plan being authored against v0.8.0.

## Attack surface

12 probes, all on-target: 5 spine + 7 bespoke (6 anchor + 1 executed baseline).
- **Executed (throwaway sandboxes):** `executable-proof` (warn), `anchor-317-dead-alternate` (pass), `baseline-gate-green` (pass).
- **Analyzed:** `claims-vs-reality` (pass), `coverage-vs-source` (pass), `consistency-placeholders` (warn), `dependency-feasibility` (pass), `anchor-266` / `anchor-267` / `anchor-250` / `anchor-221` / `anchor-326` (all pass).

### Anchor probes (all six constructs grounded at the stacked base)
- **#266** — the `const blockedReason\s*=\s*(r\s*=>[\s\S]+?null\))` extract regex is the sole extract site (L2001); production arrow has exactly one `null)` today → the `:\s*null\)` tighten is behavior-preserving. **pass.**
- **#267** — dead `t1Log` local present ×1; the "reach audit-blocked" comment still mispredicts; the three token-`'X'` assertions are load-bearing. **pass.**
- **#250** — `grep -cE 'CORRECTION PRIORITY|VERIFY-CUE'` = **6**; the 3 `assert.match` semantic patterns key on tokens, not label words → rename is inert. **pass.**
- **#221** — the `injected-auditor-throw-after-worker` throw + M1-criterion-#6 test present (L1797), catch non-vacuous (`workerRan===true`). **pass.**
- **#317** — the two-alternate land-advance assertion (L401) confirmed; alternate 1 `cd ${refineryLandPath}` is genuinely dead (literal never in the rendered prompt), alternate 2 `_refinery` load-bearing. **pass (executed).**
- **#326** — Prompt A/B slices confirmed; the proposed re-anchors `to verify the task diff contains` (A) and `now contains` (B) are **mutually disjoint** (B inserts "now" between "diff" and "contains"), both present in production. **pass.**
- **baseline-gate-green** (executed, clean git-worktree sandbox) — `node --test 'skills/**/*.test.mjs'` green; F05 tests green. **pass.**

## Findings & resolutions applied

| # | Probe | Severity | Finding | Resolution |
|---|-------|----------|---------|------------|
| 1 | `executable-proof` | Minor (CONFIRMED) | Coordination prose ("At master HEAD all four read `0.8.0`" + standalone-fallback to v0.8.1) is stale — the tree/stack base reads **0.8.5** in all four slots. The bump instruction `0.8.5 → 0.8.6` itself is correct. | **FIXED** — re-grounded Coordination lines 13/15/16 to v0.8.5; the primary path and the (now-converged) fallback both target 0.8.6. |
| 2 | `executable-proof` | Minor (CONFIRMED) | Task 1 Step 3's post-condition grep `':\s\*null\\)'` is over-escaped and matches nothing even after the edit lands. | **FIXED** — dropped the fragile shell-escaped grep; the load-bearing proof is `L3 T1` staying green (a truncated capture fails the `new Function` eval), and the tightened terminator is visible in the diff. |
| 3 | `consistency-placeholders` | Minor | Task 4 cites `~L1783` for the auditor throw; actual line is **L1797**. | **NOTED** (no edit) — expected drift; plan line 9 mandates construct-anchoring and the throw string `injected-auditor-throw-after-worker` is the correct, unambiguous anchor. |

Two further `consistency-placeholders` findings (a `land-advance` test-name-pattern "phantom" flagged `needsDecision`, and a comment-precision nit) were **REFUTED by adversarial-confirm** (the pattern resolves and the comment spec is precise) — unreproduced, non-blocking, dropped by the gate.

## Residual risk

None blocking. Zero production change (`workflow-template.js` / `war-servitor.md` untouched); every edit is test-prose / robustness on one file; all six constructs verified present at the stacked base; the executed baseline is green in a clean sandbox. The only real-world gotcha is the **nested-worktree breadth artifact** (`node-test breadth` fails from a Lead checkout containing `.claude/war-wt/**`) — env-only, gitignored, CI-green; the WAR refiner gates in a clean worktree.

## Coverage summary

`{ probes: 12, executed: 3, analyzed: 9, pass: 10, fail: 0, warn: 2, expected: 12, onTarget: 12, offTarget: [], dropped: [] }` — coverage whole. No `INCOMPLETE` condition; no `fail`; no surviving blocker or `needsDecision`.
