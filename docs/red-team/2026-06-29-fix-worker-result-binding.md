# Red Team — fix-worker-result-binding (L3) (2026-06-29)

**Verdict:** CLEARED-WITH-NOTES — the plan is **factually accurate against the live `workflow-template.js`** and its
coverage is **complete**. All five spine probes pass; the key bespoke probe **`dispatch-site-completeness` passes**
(the whole point of L3 — exactly three `war-worker` dispatch sites, all covered). The gate mechanically returned
`BLOCKED` on (a) **eight "Critical" findings that are entirely the claims-vs-reality impl-plan misfire** — the probe
graded the *before* state (`blockedReason` absent, fix-worker result discarded, …), which is **exactly what T1/T2
add** — adjudicated as "not yet implemented" per memory `redteam-claims-vs-reality-misfires-on-impl-plans` (the
adversarial-confirm itself concluded "the plan requires implementation through two phases"); and (b) **one genuine
`needsDecision`** — the predicate's unit-test exposure — **resolved** by specifying a concrete extract-and-eval
mechanism. Zero real plan defects remain.

## Attack surface
- **Spine (5):** claims-vs-reality, executable-proof (executed), coverage-vs-source, consistency-placeholders,
  dependency-feasibility — **all pass.**
- **Bespoke (6):** `dispatch-site-completeness` (pass), `predicate-correctness-and-testability` (warn → resolved),
  `result-binding-and-control-flow` (fail = impl-plan misfire), `hard-escalation-no-cascade` (pass),
  `m2-no-test-retrofit-and-237` (pass), `version-baseline` (pass).
- Coverage whole: expected 11 / on-target 11 / 0 off-target / 0 dropped. **Executed:** executable-proof ran the full
  gate green in a throwaway `cp -R` sandbox.

## Verified (the load-bearing claims all held)
- **Dispatch-site completeness** — exactly THREE `war-worker` dispatches in `workflow-template.js`: the initial worker
  (`:267`), the audit-fix-loop fixer (`:300`, FIX_NEEDED — *the bug*), and the no-test/ADD_TEST fixer (`:346`, M2's
  retrofit site). The plan's Phase-2 site list covers all three. No other `war-worker` dispatch exists; the
  refiner/auditor/servitor dispatches correctly out of scope (different result schema).
- **Predicate totality** — `WORKER_RESULT.status` enum is exactly `['implemented','blocked']`, so the predicate
  (`null → reason`, `blocked → reason`, `implemented → null`) is total; no leaked failure status (`no-test`/`env-blocked`
  are `MERGE_RESULT`/`ENV_OUTCOME`, not `WORKER_RESULT`). The four unit-test cases cover every branch.
- **No cascade (DP2)** — `escalate` is already a member of BOTH `HARD_ESCALATION_REASONS` mirrors (the inline one in
  `workflow-template.js` and the canonical `land-decision.mjs` export); a blocked worker yields the existing
  `held:escalation`, distinguished by the new `blocked` field. No `land-decision.mjs` / drift-guard change.
- **M2 no-test retrofit** — the `ADD_TEST` fixer (`:341-346`) currently discards its result (same pattern as the bug);
  T2 retrofits it. **Correctly distinct from issue #237** (the exit-1-vs-2 *detection* prompt) — L3 binds the
  *fixer's result*; it does not (and should not) touch #237's separate detection surface.
- **auditLog binding** — the auditLog push (`:313`) already reads `blocked: r.blocked`; T1 adds `blocked` to the loop
  return (`:304`) + `let blocked = null` so the reason flows worker → loop → `auditLog[].blocked` → Lead.
- **Version baseline** — all four slots at v0.7.6; T3 → v0.7.7.

## Findings
### Resolved (the one genuine finding)
- **[Major · needsDecision · RESOLVED] Predicate unit-test exposure under-specified.** `blockedReason` is an internal
  `const` inside the `new AsyncFunction(...src)` sandbox — not importable — and the existing convention (source-pattern
  `assert.match` on `allApprove`/`isSplit`) only proves *presence*, not *totality* (which needs execution). **Resolved:**
  patched T1 Step 1 to specify **extract-and-eval** — the test already reads the `workflow-template.js` source string
  (the same `src` fed to `new AsyncFunction`); it regex-extracts the `blockedReason` arrow and `eval`s it into a
  callable, running the four cases against the real predicate. Feasible (the test file already operates on the source),
  needs no production export and no refactor of `allApprove`.

### Adjudicated — claims-vs-reality impl-plan misfire (NOT defects)
- **[8× Critical/Major on `result-binding-and-control-flow`] "blockedReason absent / fix-worker result discarded /
  loop return lacks blocked / no-test fixer discards / initial-worker uses inline check / control-flow wastes the
  round".** Every one describes the **current before-state** — precisely the change T1 (predicate + `let blocked` +
  loop-return field) and T2 (bind + escalate-and-break at all three sites) implement. The plan specifies each
  correctly; the live code not yet having them is the BEFORE state a red-team of an implementation plan always sees.
  Adjudicated "not yet implemented" (memory `redteam-claims-vs-reality-misfires-on-impl-plans`); the adversarial-confirm
  agreed ("the plan requires implementation through two phases"). **No patch.**
- **[Minor · non-finding] The four unit-test cases are sufficient** — the probe itself concluded "None — the four test
  cases are sufficient" (predicate total over the 2-value enum).

## Residual risk
- **No ADR (by design, spec §6)** — after the change the three dispatch sites are symmetric (all bind + check); the
  diff is trivially reversible (one predicate + one branch); the only sub-choice (escalate now vs one more audit) is
  decided by the finding itself. Not hard-to-reverse, not surprising-in-result.
- **`HARD_ESCALATION_REASONS` / `land-decision.mjs` untouched** — verified `escalate` is already a member; the `blocked`
  field carries the distinction from a round-exhaustion `audit-blocked` without a new verdict or mirrored-constant cascade.
- **L3 lands after M2** (mandatory, honored) — M2's no-test fixer is a dispatch site T2 retrofits; M2 landed earlier in
  the stack (PR #238).
