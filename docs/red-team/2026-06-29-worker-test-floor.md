# Red Team — worker-test-floor (M2) (2026-06-29)
**Verdict:** CLEARED-WITH-NOTES — one architectural fork (floor pattern over-counts vs the gate) escalated to and
resolved by the operator; two real correctness sharpenings (the audit-loop `round` is never returned, so the
`task.fixRounds` carry had no source; `fixRounds` was not test-observable) patched into the plan; the cascade,
budget-shape, dependency, consistency, and version baselines all verified sound.

## Attack surface
- **Spine (5):** claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility.
- **Bespoke (5):** `cascade-state` (HARD_ESCALATION_REASONS dual-mirror + drift-guard), `refine-subloop-budget`
  (shared fixRounds carry), `floor-pattern-gate-alignment`, `harness-multicall` (buildSeqImpl observability),
  `version-baseline`.
- **Executed in sandbox:** executable-proof, floor-pattern-gate-alignment, version-baseline. Coverage whole: 10/10
  on-target, 0 off-target, 0 dropped. Gate BLOCKED → resolved.

## Executed proof
- **executable-proof (Opus):** in a throwaway copy, ran the full gate (274 `.mjs` + 10 `*.test.sh` green) and proved
  the floor/gate misalignment: created `foo.test.js`, `test_foo.py`, root `bar.test.mjs`, `skills/x/baz.test.mjs` →
  `node --test 'skills/**/*.test.mjs'` ran **only** `skills/x/baz.test.mjs`, while the plan's proposed floor union
  matched **all four**. The union is a strict superset of the gate ⇒ a worker can satisfy the floor with a test CI
  never runs.
- **cascade-state (pass):** the three cascade surfaces (canonical `HARD_ESCALATION_REASONS` in land-decision.mjs, the
  inline mirror in workflow-template.js, the `war-config.test.mjs` deepEqual drift-guard) all present, currently
  matching, no `no-test` — the atomic-cascade design is sound and necessary.
- **version-baseline (pass):** all four slots at v0.7.3 (M1's release is M2's baseline).

## Findings
### Major — escalated to operator (needsDecision)
- [Major · resolved by operator] **Floor pattern over-counts vs the gate.** Plan's default union
  {*.test.mjs, *.test.js, *.test.sh, pytest} ⊋ the gate's actual discovery {`skills/**/*.test.mjs`, `*.test.sh`}, so
  a worker could add `foo.test.js`, pass the floor, and the gate never runs it — the exact hole spec §3.1/§6 warns
  against; the plan's own "union matches the gate" assertion was unsatisfiable as a superset (and contradicted the
  resolved memory `node-breadth-assertion-test-js-overclaims`, which fixed the same class by *narrowing*).
  **Operator decision (2026-06-29): narrow the default to the gate's globs** `skills/**/*.test.mjs` (path-scoped) +
  `**/*.test.sh`, `run.testPattern` override for other repos. **Resolution:** T1 Files default-pattern rewritten;
  T1 alignment case turned into an **equality** assertion + explicit over-count guards (`.test.js`/root-`.mjs`/pytest
  → NO match); Test-plan T1 row updated. Supersedes the spec §3.1 broad union (spec now stale — see Residual).

### Major — real sharpenings (patched)
- [Major · patched] **`task.fixRounds` carry has no source value.** The audit-loop `round` is a LOCAL variable not
  included in the audit return (`{ task, verdict, seats, expected }`), so "carry the round onto `task.fixRounds`" had
  nothing to read. **Resolution:** T2 Files (c) now requires adding `round` to the audit return and
  `r.task.fixRounds = r.round ?? 0` in REFINE.
- [Major · patched] **`fixRounds` is not test-observable** (harness `out`/`auditLog` doesn't expose it), so Test 2's
  "prove the carry" would be vacuous. **Resolution:** T2 Files (c) now requires exposing `auditLog[].fixRounds`; Test
  2 observes the carry through it.

### needsDecision resolved by verification (not a fork)
- [Major · resolved] **CONTEXT.md "already landed?"** Plan header says the §5 terms are landed; spec §4 says "add on
  ratification." Verified: `CONTEXT.md` already defines **Test floor** (:104), **`requiresTest`** (:111), **`no-test`**
  (:117). Plan is correct; spec §4 row is stale. Plan header annotated "verified present."

### Minor (patched / adjudicated)
- [Minor · patched] T1 alignment case didn't name the gate's discovery location → now names `war-config.mjs`
  `resolveGate`.
- [Minor · patched] T2 lacked a `requiresTest:false` bypass test → added Test 2b (no script/sub-loop fires).
- [adjudicated · not-yet-implemented] coverage flagged schemas.md (`requiresTest`/`no-test`) and war-refiner.md
  (merge-task step) as "missing" — these are exactly what T3 implements; the plan names them. Non-defects.
- [adjudicated] MERGE_RESULT.status lacking `no-test` and the HARD cascade not yet containing `no-test` — TDD RED
  state the plan implements in T2. Non-defects.

## Residual risk
- **Spec hygiene (accepted, not patched):** spec §3.1/§6 still show the broad union (now superseded by the operator's
  narrow decision), and spec line 5 cites `workflow-template.js:264` for the worker status-check that is actually at
  `:269` (post-M1 drift). The plan is authoritative and re-anchors by construct; these are spec-doc Minors to clean
  up separately.
- The narrowed floor is **repo-specific** by design — a future Python/JS-gated repo must set `run.testPattern`. This
  is the correct trade (floor must mirror *this* repo's gate); documented in T1.
- Coverage was whole (no INCOMPLETE); cascade/budget/dependency/version all passed.
