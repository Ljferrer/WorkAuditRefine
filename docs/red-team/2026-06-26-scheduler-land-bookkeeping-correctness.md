# Red-Team Report — Scheduler & Land Bookkeeping Correctness (#99 · #113 · #115)

**Plan:** `docs/plans/2026-06-26-scheduler-land-bookkeeping-correctness.md` · **Date:** 2026-06-26
**Verdict:** **CLEARED-WITH-NOTES** (1 Critical found → patched; 1 Major-needsDecision → adjudicated)

## Attack surface
6 probes, all on-target (expected 6 / on-target 6). All 8 cited `workflow-template.js` anchors re-verified exactly
(env-blocked :253, worker-blocked :265, auditLog.push :305, nextWave :150, while :230, HARD_ESCALATION_REASONS :375,
post-land :398-401, wrap-up guard :418); current-state claims all confirmed (the two early-returns lack `expected`;
the array excludes error/gate_failed and lacks unrunnable-deps; no else-if for error/gate_failed; no post-loop sweep).

## Findings & resolutions applied
- **[Critical — RESOLVED] Task 3's `'unrunnable-deps'` addition breaks two drift-guards the plan never lists.**
  `executable-proof` applied the plan's verbatim Task 3 in a sandbox → the plan's own gate exits 1 (229 tests, 2 fail).
  `war-config.test.mjs` hard-pins the inline `HARD_ESCALATION_REASONS` to the **6-member canonical** `land-decision.mjs`
  export via `deepStrictEqual` (~:343) and `=== 6` (~:833); the 7th member breaks both, and the `&&`-chained gate then
  skips all bash suites → red.
  **Resolution:** patched Task 3 to add `war-config.test.mjs` to the file set and **relax both guards to superset
  semantics** — every canonical member present + the only extra is exactly `'unrunnable-deps'` (`length === canonical+1`).
  `land-decision.mjs` stays unchanged (scheduler-local member; D2 mirror invariant preserved as "canonical ⊆ inline").
  This is the established drift-guard-cascade pattern (memory `plan-file-list-incomplete-when-drift-guard-forces-cascade`).

## Residual risk (notes)
- **[Major-needsDecision → adjudicated] version v0.6.6 vs v0.6.7.** The plan targets **v0.6.7**; the spec says v0.6.6.
  Adjudicated: **v0.6.7 is authoritative** — plan 1 already shipped v0.6.6 on `dev`, and the roadmap assigns plan 2 →
  v0.6.7 (stacked +0.0.1). The spec's v0.6.6 is the superseded standalone proposal (memory
  `redteam-adjudication-is-authoritative-version-source`, `stacked-per-branch-releases-make-main-lag-cumulative`). No
  plan change; the "internal contradiction" the probe flagged at plan:235 is a correct baseline note ("on plan 1's v0.6.6").

**Terminal verdict: CLEARED-WITH-NOTES.** Ready for `/war`.
