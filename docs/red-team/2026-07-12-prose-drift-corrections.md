# Red-team report — prose-drift-corrections

**Plan:** `docs/plans/2026-07-12-prose-drift-corrections.md`
**Source spec:** `docs/specs/2026-07-12-prose-drift-corrections-design.md`
**Run:** Workflow `wf_e7a094a1-760` (session-opus). Base: `b3238aa` (detached worktree `redteam-p9`).
**Artifact kind:** impl-plan

## Verdict: **CLEARED-WITH-NOTES**

- Blockers **0** · needsDecision **0** · Minors **1** (AI-intent note only). Coverage whole (7/7 on-target, **0 fail / 7 pass**, 0 warn, 0 dropped). Escape guard clean. No plan patch required.

## Baseline-repro (executed) — PASS

All three prose drifts real and unstarted at `b3238aa`:
1. **#741** `skills/war/SKILL.md` invokes the bash script `provision-worktrees.sh` with a `node` prefix — 10 lines / 15 occurrences, all a bash-shebang script (must be `bash`). `skill-doc-contracts.test.mjs` carries only D10/D12 (no node-`.sh` guard yet); the 7 legit `.mjs` node-invocations are correctly retained.
2. **#799** SKILL.md Setup step-3 "Daemon reachable" bullet contains verbatim "This same signature list is what the gate-time classifier keys on" + all three platform signatures — the over-broad attribution the plan narrows.
3. **#804** `docs/specs/2026-06-25-concurrent-run-land-isolation-design.md` §5.3 (line 127) pseudocode shows a bare-SHA push (`<merge-sha>:refs/heads/<working>`) + `non-fast-forward` classification with no `cmd_land_advance` pointer — drifted from the real push-first CAS (`provision-worktrees.sh:987+` uses `HEAD:refs/heads` + the `[rejected]` token, notes non-ff unreliable).

## Executable-proof (executed) — PASS

The probe built the two described guards as a standalone script and ran them against pre-fix SKILL.md (reds), a node→bash + reworded corrected copy (green), and an **UPPERCASED / re-positioned** misattribution-clause copy (still caught) — confirming the paired guards are case-tolerant and position-independent, and that End-state 4's `Red-proof:` block holds (guards RED without the fix).

## Spine lenses

claims-vs-reality · executable-proof · coverage-vs-source · consistency-placeholders · dependency-feasibility · intent-vs-plan — **all pass**. The one Minor: AI-Commander's Intent is machine-authored (8 End-states individually checkable + each task-mapped; all live code/doc anchors verified present). Human upgrade `/war-strategy`.

## Drift-guards (Lead-run)

- `default-flip-old-absent` — **self-guarded**. Task 1.1 is a reword/scope-narrow whose End-state 3 ships **two paired guards** in `skill-doc-contracts.test.mjs` asserting the OLD forms *absent* (no node-prefixed `.sh` invocation; no gate-classifier over-attribution sentence), and End-state 4's `Red-proof:` block proves they RED without the fix — exactly the OLD-absent discipline. Verified case-tolerant + position-independent by executable-proof.
- `unguarded-new-mirror` — vacuous (no new `workflow-template.js`/canonical-export mirror; End-state 5 confirms `workflow-template.js` and `agents/*.md` have zero node-`.sh` matches).
- `ff-topology` — N/A (no per-task merge-commit topology anchors).

## Backstops (3 — AI-declared, all legitimate)

- Spec VC5 (JS suite green + lint unaffected) · covered by the per-task resolveGate gate + campaign CI redaction lint.
- **Land-isolation §5.3 re-rot (unguarded)** · no doc-contract test covers `docs/specs/`; the supersession pointer is the reader-safety backstop · runner: **the Lead files ONE follow-up issue at phase close** proposing the general spec-truth sweep (ADR 0017 named-owner, not a prose waiver).
- **#799 replacement sentence's new code-facts unguarded** (`classOf`, classification-base re-run, `'introduced'` fallthrough) · the guard locks the OLD clause's absence by design; presence-coupling the new prose to `classOf` would open a new cross-file drift-guard class this doc-only plan does not open (adjudicated option b) · runner: the same Lead-filed follow-up (candidate list names this sentence).

Each carries its AI-declared operator-attention marker (ADR 0014). **Lead action at phase close: file the single doc-truth-sweep follow-up issue** naming §5.3 and the #799 replacement sentence as candidates.

## Residual risk

AI-Commander's Intent un-ratified by operator (human upgrade: `/war-strategy <plan>`).
