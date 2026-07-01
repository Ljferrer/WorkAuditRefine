# Red-team report — `--ace` opt-in pre-merge nit auto-fix (feature)

**Plan:** [`docs/plans/2026-06-30-ace-nit-autofix.md`](../plans/2026-06-30-ace-nit-autofix.md)
**Source spec:** [`docs/specs/2026-06-30-ace-nit-autofix-design.md`](../specs/2026-06-30-ace-nit-autofix-design.md)
**Date:** 2026-07-01 · **Target:** v0.8.7 (net-new feature) · **Stacked base:** Plan 6 tip `f462f04` (v0.8.6)

## Verdict: **CLEARED** (one remediation round; 2 real blockers found + fixed)

This is a **control-flow-critical** feature — it inserts a fix + re-audit + conditional forward-revert between the approve verdict and the merge. The red-team found **two real blockers** and both were fixed and re-verified. The gate's mechanical `BLOCKED` on the re-verify run is the `claims-vs-reality` **not-yet-implemented misfire** (memory `redteam-claims-vs-reality-misfires-on-impl-plans`; the exact false-positive class #311/Plan 9 fixes) — Lead-adjudicated as non-blocking (see below).

## Real blockers (round 1, `w2cnuyqe5`) — FIXED @ `a848b21`

| # | Probe | Sev | Finding | Fix |
|---|-------|-----|---------|-----|
| 1 | `executable-proof` | **Major** (CONFIRMED, reproduced) | Step-4 pseudocode read `ace.sha`, but `WORKER_RESULT`'s commit field is **`head_sha`** (no `.sha` on any worker result). `aceSha` → `undefined` → `r.aceReverted` falsy → the forward-revert clause **never fires** → a regressing ace commit lands anyway, **silently defeating D2's never-blocks-a-land invariant**. Provenance `sha` also null. | `ace.sha` → `ace.head_sha` + a `typeof ace.head_sha === 'string' && ace.head_sha` guard so a falsy sha can't emit a bare `git revert --no-edit ` or a falsy `r.aceReverted`. |
| 2 | `never-blocks-a-land-invariant` | **Critical** (needsDecision, PLAUSIBLE) | Undocumented revert-failure handling: if `git revert` fails, the merge returns non-merged → `escalated.push` → violates the invariant. | Documented (Step 5 + D2) that `aceSha` is the task-branch **tip** (single ace commit) and the revert runs **before** the rebase — `git revert --no-edit <HEAD>` is a clean inverse that **cannot conflict**; the reverted tip is functionally the approved tip, so the merge behaves identically to the no-ace case. Ace introduces **no new escalate**. |

**Re-verify (`wpref89g6`):** `reverify-head-sha-fix` **pass**, `reverify-never-blocks-land` **pass**, `executable-proof` **pass** (sandbox gate green at `a848b21`).

## Findings adjudicated non-blocking

- **`claims-vs-reality` (re-run) — 8 not-yet-implemented false-alarms.** "`run.ace` absent," "ace sub-loop absent," "`autoFixable` absent," "`aced` return absent," version "still 0.8.6" — every one describes a deliverable T1/T2/T3/T5 **adds**; the probe itself labels the version ones "intentional pre-implementation." This spine lens grades an impl plan's TODO list as "missing code" (`redteam-claims-vs-reality-misfires-on-impl-plans`; #311). **Not defects** — Lead-adjudicated.
- **Minors (round 1, fixed):** stale `v0.8.2` grounding → re-grounded to v0.8.6 (T5 bumps 0.8.6→0.8.7, Builds on v0.8.6); T1 Step-1 test-model pointed at a non-existent `run.afk` test → repointed to the `provisionAuto` reject case.
- **`allApprove` arity** (consistency): the plan's `allApprove(reSeats, reExpected)` (2-arg) is **correct** against the codebase; the spec's 1-arg sketch is the stale one. No plan change.

## Grounding (all constructs verified present at `f462f04`)

`if (r.verdict === 'approve')`, the merge dispatch, `minorsFiled.push`, `blockingOf`/`minorsOf`/`allApprove(seats,expected)`/`blockedReason`/`auditRound(task,peers,workerTests)`, the no-test sub-loop, the return shapes, `MERGE_RESULT`, `HARD_ESCALATION_REASONS` (D6), `DEFAULTS.run` literal, the `run.afk` validator, and the `war-config.test.mjs` D6 drift-guard import — all present. `no-enum-leak-D6`, `anchor-config-constructs`, `baseline-gate-green`, `coverage-vs-source`, `dependency-feasibility` all **pass**.

## Coverage summary

Round 1: `{ probes: 11, onTarget: 11, offTarget: [], dropped: [] }`. Re-verify: both target probes pass; residual gate `BLOCKED` is the claims-vs-reality not-yet-implemented misfire, Lead-adjudicated to **CLEARED**. Both real blockers reproduced, fixed, and re-verified.
