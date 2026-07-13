# Red-team report — land-path-verification-hygiene

**Plan:** `docs/plans/2026-07-12-land-path-verification-hygiene.md`
**Source spec:** `docs/specs/2026-07-12-land-path-verification-hygiene-design.md`
**Run:** Workflow `wf_17a1f581-1b7` (session-opus). Base: `2d7532c` (detached worktree `redteam-p7`).
**Artifact kind:** impl-plan

## Verdict: **CLEARED-WITH-NOTES**

- Blockers **0** · needsDecision **0** · Minors **1** (AI-intent note only). Coverage whole (7/7 on-target, **0 fail / 7 pass**, 0 warn, 0 dropped). Escape guard clean. No plan patch required.

## Baseline-repro (executed) — PASS

All three targeted fidelity gaps proven real and unstarted at `2d7532c`:
1. `cmd_ensure_origin`'s `git push -u origin …` redirects stderr to `/dev/null 2>&1` — push stderr swallowed, not captured into the die message (#801).
2. `land-decision.test.mjs` D9 `phase-token-in-status-equality` regex (~line 293) uses `\bstatus`, which matches after the `.` in `mr.status === 'landed'` (false-trip); no `NARRATION_RECEIVERS` allowlist (#813).
3. `grep -c 'T2.9\|pre-receive' provision-worktrees.test.sh` = 0 — no exerciser for the exit-3-without-`[rejected]` push-error branch (#814).

## Executable-proof (executed) — PASS

The probe implemented the proposed fixes in a sandbox and verified them: the reworked D9 pattern-1 (optional dotted receiver + `NARRATION_RECEIVERS` allowlist, lookbehind `(?<![\w$.])`) correctly stops flagging `mr.status === 'landed'` while still flagging bare/`task.status`/chained `result.mr.status`; a real-git `pre-receive`-hook push fixture produces `remote rejected` without the contiguous `[rejected]` token and classifies to bare `exit 3`; the broken-URL `ensure-origin` fixture surfaces git stderr alongside the never-force guidance. Baseline suites (`land-decision.test.mjs`, `provision-worktrees.test.sh`) green.

## Spine lenses

claims-vs-reality · coverage-vs-source · consistency-placeholders · dependency-feasibility · intent-vs-plan — **all pass**. The one Minor: AI-Commander's Intent is machine-authored (11 End-states individually checkable + each task-mapped; all cited code anchors verified present). Human upgrade path `/war-strategy`.

## Drift-guards (Lead-run)

- `unguarded-new-mirror` — **vacuous**. The plan makes no production land-path change: `land-decision.mjs` is untouched, no `HARD_ESCALATION_REASONS`/`KNOWN_LAND_DECISIONS`/`workflow-template.js` mirror, no registry row needed (plan Notes state this explicitly). `NARRATION_RECEIVERS` is a test-side const beside the test's own detector.
- `default-flip-old-absent` — N/A (no default flip / scope-narrow).
- `ff-topology` — N/A. Despite being a land-path plan, its evidence anchors are shell test fixtures (T2.9 pre-receive → exit 3) and regex assertions, not per-task merge-commit topology.

## Backstops (4 — AI-declared, all legitimate)

- Git-version portability of the `! [remote rejected]` vs `[rejected]` token distinctness · runner: anchored shell-test loop on each CI machine (T2.9 asserts the fact by name, fails loud).
- Unlisted/chained narration-receiver false-trips in future prose · runner: the D9 current-tree test red-flags on the spot (extend `NARRATION_RECEIVERS`, never loosen the equality match).
- Equality-phrased status prose without a literal operator (D9-blind by design, spec §9 non-goal) · runner: sweep-3 manual same-scope survey.
- `ensure-origin` diverged-remote composition · deliberate non-test (capture idiom is transport-agnostic, proven by the broken-URL fixture; divergence refusal is ADR-0004-locked, already exercised via land-advance T2.1).

Each carries its AI-declared operator-attention marker (ADR 0014).

## Residual risk

AI-Commander's Intent un-ratified by operator (human upgrade: `/war-strategy <plan>`).
