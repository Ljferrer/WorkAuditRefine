# Red Team — Submodule support, Increment 1 (the fail-closed guard) (2026-06-30)

**Verdict:** CLEARED — one spec-vs-plan conflation found and resolved (criterion #3 → refuse-ALL superset); all 7
probes on-target, the executed gitlink-detection proof passed in a real submodule sandbox.

Plan: [`docs/plans/2026-06-30-submodule-support-increment-1-guard.md`](../plans/2026-06-30-submodule-support-increment-1-guard.md).
Source spec: [`docs/specs/2026-06-29-submodule-support-design.md`](../specs/2026-06-29-submodule-support-design.md) §4.1.
Gate: 7 expected · 7 on-target · 0 off-target · 0 dropped · 6 pass · 1 fail (resolved).

## Attack surface
Spine (4 of 5 — `executable-proof` dropped: the plan ships no runnable artifacts, scripts/tests are to-be-written):
claims-vs-reality, coverage-vs-source, consistency-placeholders, dependency-feasibility.
Bespoke (3): `escalate-no-cascade` (analyzed), `engine-anchors` (analyzed), `gitlink-detection` (executed).
Executed in sandbox: `gitlink-detection`.

## Executed proof
- **`gitlink-detection`** → in a throwaway temp setup (git 2.50.1 Apple, bash 3.2.57; a real `pyutils` submodule
  pinned into a `super` superproject, never touching the repo): `git diff --raw <base>...<branch>` **exposes a mode
  `160000` gitlink entry** distinguishable from an ordinary file change; `git config -f .gitmodules --get-regexp
  '\.path$'` yields the submodule path for the content cross-check; a clean superproject-only diff shows **no** `160000`
  entry (would exit 0); a bad ref makes git error (the exit-2 path). **Task 1's detection mechanism is feasible exactly
  as specced.**

## Findings

### Critical (resolved)
- **[Critical · needsDecision]** Plan validation criterion #3 ("refiner refuses an *unresolvable/any* submodule
  mutation") conflated **mutation-detection** with **SHA-reachability**, mapping to spec §4.1/§12 #3 ("refuse a gitlink
  bump whose new SHA is *unreachable* on the submodule remote"). → **Reality:** `assert-no-submodule-mutation.sh`
  detects mutations only (gitlink mode + `.gitmodules`-path content; exit 1/0/2) — **no reachability check**.
  **Evidence:** spec §4.1 refiner bullet vs Plan T1 ("Exit 1 if any mutation is present") / T1 step 3 ("no mention of
  remote reachability"). **Resolution:** operator chose **(a)** — Increment 1 refuses **ANY** gitlink/submodule
  mutation, a strict **superset** of refuse-unreachable (no dangling pin can slip through). Patched criterion #3 + added
  an Out-of-scope reconciliation bullet; reachability-*discrimination* deferred to Increment 2's pin-validity lens.
  **Re-verified RESOLVED** (no new inconsistency; Task 1/Task 2 carry no reachability logic).

### Confirmations (clean probes — no defect)
- **claims-vs-reality** — concrete claims (files, line-anchors, version state, constructs) check out against the live
  v0.7.7 repo.
- **coverage-vs-source** — spec §4.1 (Increment 1) maps fully to plan tasks T1–T4.
- **dependency-feasibility** — assumed interfaces/tools exist; phase ordering sound (script → engine → prose → release).
- **`escalate-no-cascade`** — `escalate` ∈ `HARD_ESCALATION_REASONS` (`land-decision.mjs`); the initial-worker-block
  dispatch already escalates via `verdict:'escalate'`; reusing it for the submodule refuse needs **no** cascade
  (DP3 confirmed).
- **`engine-anchors`** — `MERGE_RESULT.status` is a single enum (no drift-guard guards it — contrast
  `HARD_ESCALATION_REASONS`); the merge-task prompt runs `assert-test-in-diff.sh` (the insertion point); the test-floor
  is `requiresTest`-gated, so the plan's "guard runs regardless of `requiresTest`" is a **coherent distinction**, not a
  contradiction; `war-refiner.md` merge-task has a numbered test-floor step (the plan adds step 5).

## Resolutions applied (grill decisions)
- **Criterion #3 conflation** → operator chose **(a) refuse-ALL in Increment 1** (a superset of refuse-unreachable;
  reachability-discrimination is Increment 2). Option (b) — a reachability check inside Increment 1 — was rejected as a
  **safety regression** (it would *allow* a reachable but undeclared pin to merge, defeating the fail-closed goal).
  → Patched: plan §12 criterion #3 + a new "Out of scope / Deferred" bullet ("Reachability-discrimination is Increment 2,
  not here").

## Residual risk
- The merged **spec §4.1 refiner bullet** still reads "unreachable"; the plan now reconciles this as a superset (no real
  gap). **Tidy the spec prose in Increment 2's docs phase** — noted, non-blocking.
- Increment 1 refuses a *reachable, legitimate* manual pin bump too (the superset cost). Accepted and on-theme: WAR is
  single-repo until Increment 2; such a change is done by hand (the documented workaround) until first-class support lands.
