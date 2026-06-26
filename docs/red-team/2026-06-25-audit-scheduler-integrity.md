# Red Team — Audit & Scheduler Integrity (F11 · F02 · F04) (2026-06-25)

**Verdict:** CLEARED-WITH-NOTES (adjudicated) — plan is sound and well-mapped to specs; 6 genuine defects patched in place. Mechanical gate returned **BLOCKED (37 blockers)**, but 30+ of those are the documented *claims-vs-reality misfire* — an implementation plan's not-yet-built tasks graded as "absent from the codebase." Adjudicated per the operator roadmap policy + memory `redteam-claims-vs-reality-misfires-on-impl-plans`. Ready for `/war`.

## Attack surface
Spine (5): claims-vs-reality, executable-proof, coverage-vs-source (F11), consistency-placeholders, dependency-feasibility.
Bespoke (5): `anchor-check`, `snippet-fidelity`, `gate-baseline` (executed), `f02-dag-soundness`, `coverage-f02-f04`.
Coverage: 10/10 probes on-target, 0 off-target, 0 dropped (verdict is a true BLOCKED, not INCOMPLETE). 2 executed in sandbox.

## Executed proof
- `gate-baseline`: ran the full gate in a throwaway sandbox. **Key finding:** unquoted `node --test skills/**/*.test.mjs` is shell-dependent — zsh expands all 6 files (138 tests), but macOS `/bin/bash` 3.2 (globstar off) under-covers. **Quoted** `node --test 'skills/**/*.test.mjs'` → `tests 138 / pass 138` regardless of shell. Baseline is GREEN.
- `anchor-check`/`snippet-fidelity`: every cited construct exists within ~0–4 lines of the plan's references; current-state snippets (`allApprove` shape, bare-array `auditRound`, unconditional `done.add`, `nextWave` gating on `done`, `MERGE_RESULT.gate_output?` optional, war-auditor.md "EXIST and PASS") all confirmed.
- `coverage-vs-source` + `coverage-f02-f04`: **every** F11/F02/F04 spec decision (D1–D6) maps to a plan task — coverage is complete.
- `f02-dag-soundness`: traced the succeeded-gate + dep-block pre-check — **validates** the design (pre-check is necessary and sufficient; placement "before nextWave()" is correct because the check reads `done`/`succeeded`, not `wave`; loop terminates, no deadlock/early-exit).

## Findings (genuine defects) & Resolutions applied
1. **[Major] Baseline drift — `land_stale`.** Plan authored at v0.5.1/f7191fb; live tip is v0.6.0 with `HARD_ESCALATION_REASONS` already = `['escalate','audit-blocked','conflict','land_stale']`. Task 1's drift-test literal dropped `land_stale`. → **Patched:** provenance baseline-drift note added; Task 1 Step 1 now states the drift test is value-agnostic (deepEquals the two files) and the post-change array is the 5-item `[…,'land_stale','dep-failed']`; Step 3 says append to the **end** of the existing 4-item array.
2. **[Major] Version regression.** v0.5.2 is *below* the live v0.6.0. → **Patched:** Task 5 / Notes / Open-decision-3 → **v0.6.1** (patch over 0.6.0; series 0.6.1, 0.6.2… in run order).
3. **[Major] Incomplete bump list.** Task 5 omitted `.claude-plugin/marketplace.json` (README mandates `metadata.version` AND `plugins[0].version`; stale = silent-no-op release). → **Patched:** added to Step 1.
4. **[Major] Gate glob unquoted** (shell-dependent under-coverage). → **Patched:** Gate block + Task 5 Step 2 now quote `'skills/**/*.test.mjs'`.
5. **[Major] F02 dep-retry policy unmapped** (F02 spec open decision). → **Patched:** added **R4** — no in-phase auto-retry; surface-for-Lead, re-evaluated via `nextWave()` after predecessor succeeds.
6. **[needsDecision] gate-evidence severity** (Task 4 Open decision #1). → **Resolved:** soft by default; hard only when a mapped test is *provably unrun* (present in pre-merge diff but absent / 0-count in the refiner's executed gate output).

## Resolutions applied (adjudicated decisions, `--afk` autonomous)
- Open decision #1 → soft-default + operational "provably unrun" definition (patched).
- Open decision #2 → F11 retry budget **2** confirmed (matches R2).
- Open decision #3 → **v0.6.1** standalone patch (patched).
- Minor clarifications folded in: explicit `const deps = t.deps || []` in Task 3 dep-block pseudo-code; placement rationale.

## Adjudicated as NON-defects (the misfire)
- `f02-dag-soundness` #20–25, `coverage-f02-f04` #27–37, several `claims-vs-reality`/`anchor-check` items: all "X not yet in the code" — **correct** for an implementation plan; these describe the work `/war` will build, and each maps to a spec decision. Snippet-fidelity Criticals #14/15/17/18 are positive confirmations mislabeled by the probe.
- F11 `seat-dropped` vs `dep-failed` (R2): an intentional, documented operator supersession (audit-blocked outcome, no new reason). Stands — not re-litigated.

## Residual risk
- **Baseline drift is systemic:** all five audit-remediation plans were drafted at v0.5.1 and likely share the same `land_stale`/version-regression skew. The next four `/red-team` runs should expect and patch the same class (version → 0.6.x patch series; acknowledge `land_stale`).
- Line numbers are approximate (tip moved f7191fb → live); the plan already instructs the worker to re-confirm by construct. Acceptable.
