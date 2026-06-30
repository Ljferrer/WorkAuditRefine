# Bind the fix-worker result — escalate a blocked worker early via a shared `blockedReason` predicate Implementation Plan (audit finding L3)

**Goal:** the audit/fix loop dispatches a fix-worker **fire-and-forget** (`await agent(…FIX_NEEDED…)` then `round++`),
**never binding the result** — so a fix-worker that finishes `status:'blocked'` is treated identically to a clean fix:
the loop re-audits, the auditors re-flag the still-broken code, and after `roundLimit` rounds it falls through to a
generic `audit-blocked`. **This is not a correctness bug** (the loop always terminates; no silent land); it is a
**deferred escalation** — the Lead waits out up to `roundLimit − 1` wasted rounds and gets a generic `audit-blocked`
instead of the worker's actual `blocked_reason`. L3 **binds the result and escalates a blocked worker immediately**,
and factors the check into **one shared `blockedReason` predicate** used at every worker-dispatch site so a new site
cannot re-introduce the bug.

**Source spec:** [`docs/specs/2026-06-29-fix-worker-result-binding-design.md`](../specs/2026-06-29-fix-worker-result-binding-design.md).
**No ADR** (spec §6 — after the change the two dispatch sites are symmetric; trivially reversible; no surprising
trade-off left). **CONTEXT.md** term (Worker block) is **already landed** — not in scope.

**The predicate** (spec §3) — a pure helper beside `allApprove`/`isSplit`:
```js
// → reason string if the worker did not deliver (null/dead or self-reported blocked), else null
const blockedReason = r => !r ? 'worker returned no result'
  : (r.status === 'blocked' ? (r.blocked_reason || 'worker returned no result') : null)
```

**Position in the stack:** L3 is **fifth / last** (after L2, on L2's tip), owns **v0.7.7** off the v0.7.6 baseline.
**L3 lands after M2** (mandatory — M2's §3.3 no-test fixer is a worker-dispatch site L3's predicate must cover). L3
touches `workflow-template.js` (+ its test), which M1/M2/M3 also edit earlier, so it re-anchors by named construct
(memory `plan-line-number-refs-stale-use-construct-locator`). **It deliberately does NOT touch
`HARD_ESCALATION_REASONS`** — `escalate` is already a member, so no mirrored-constant cascade (spec §2.2).

## Build order (for `/war`)

- **Phase 1 — predicate foundation:** T1 (add `blockedReason` + `let blocked` + the loop-return field + a predicate
  unit test). The predicate is **applied at the dispatch sites in T2** — not dead code (memory
  `defined-but-not-yet-emitted-plan-slice-pattern`).
- **Phase 2 — apply at every dispatch site:** T2 (rewrite initial-worker guard, bind the fix-worker result + escalate,
  retrofit M2's no-test fixer, loop-level behavioral test). **deps T1.** Separate phase from T1 because both touch
  `workflow-template.js` (one-task-per-phase for the shared file).
- **Phase 3 — release:** T3 (v0.7.7).

## Operator decisions — RESOLVED (2026-06-29, grill-with-docs)

- **DP1 — Decomposition: three tasks (predicate foundation / apply-at-sites / release).** The operator chose to split
  the predicate's introduction from its application. Because **all of L3 is in `workflow-template.js`**, T1 and T2 are
  **separate phases** (one-task-per-phase, memory `war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`)
  so the shared-file work does not rebase-conflict. T1's unused-until-T2 predicate is **not dead code** — its unit
  test exercises it directly, and the auditor is told it is "applied at dispatch sites in T2" (memory
  `defined-but-not-yet-emitted-plan-slice-pattern`). *Rejected:* one task (simplest, but the operator preferred the
  foundation/application split); two tasks.
- **DP2 — `HARD_ESCALATION_REASONS` is UNCHANGED** (spec §2.2). `escalate` is already a member, so a blocked worker
  yields the existing `held:escalation`; no `land-decision.mjs` / inline-mirror / drift-guard / land-decision-test
  cascade. The `blocked` field distinguishes it from a round-exhaustion `audit-blocked`.
- **DP3 — Release: +0.0.1 → v0.7.7, implemented in order** (after L2's v0.7.6 — last in the stack). Next free patch
  by construct if the stack order shifts (memory `stacked-per-branch-releases-make-main-lag-cumulative`).

---

## Phase 1 — Predicate foundation

### Task 1 — Add the `blockedReason` predicate + loop scaffolding + predicate unit test (L3, code)

**Files:**
- modify `skills/war/assets/workflow-template.js` — (a) add `const blockedReason = r => …` **beside `allApprove` /
  `isSplit`** (the existing loop predicates, ~`:148`); (b) declare `let blocked = null` in the audit/fix loop's outer
  scope (alongside `round, verdict, seats, expected`, ~`:268`); (c) add `blocked` to the **loop return** object
  (~`:299`) so the reason flows into the `auditLog` entry that already reads `r.blocked` (~`:305`). **No dispatch-site
  application yet** — that is T2.
- test `skills/war/assets/workflow-template.test.mjs` — a **unit test of `blockedReason`** (spec §7.3, "predicate is
  total").

**`requiresTest`: true.**

- [ ] **Step 1 — Write the failing unit test.** `blockedReason(null) === 'worker returned no result'`;
  `blockedReason({status:'blocked', blocked_reason:'x'}) === 'x'`; `blockedReason({status:'blocked'}) === 'worker
  returned no result'`; `blockedReason({status:'implemented'}) === null`. **Test-exposure mechanism (concrete):** the
  predicate is an internal `const` inside the script the harness compiles via `new AsyncFunction(...src)` — it is NOT
  a module export, and the existing convention (source-pattern `assert.match` on `allApprove`/`isSplit`) only proves a
  predicate is *present*, not that it is *total*. To assert **behavior/totality**, **extract-and-eval**: the test
  already reads the `workflow-template.js` source string (the same `src` it feeds to `new AsyncFunction`); regex-extract
  the `const blockedReason = r => …` arrow definition from that source, `eval`/`new Function` it into a callable, and run
  the four cases against it (executes the real predicate, no production-side export needed). This is the "thin wrapper"
  — feasible because the test file already operates on the source string; it does NOT require refactoring `allApprove`
  or adding a production export. (A source-`assert.match` presence check MAY accompany it but does NOT satisfy "predicate
  is total" on its own — execution does.)
- [ ] **Step 2 — Run gate → fail** (predicate absent).
- [ ] **Step 3 — Implement (additive).** Add the predicate, `let blocked = null`, and `blocked` in the loop return.
  Re-anchor by **named construct** (`allApprove`/`isSplit`; the loop's `let round = 0, …`; the loop `return { task,
  verdict, seats, expected }`), not line numbers. `// ponytail:` note that the predicate is **applied at the
  worker-dispatch sites in T2** (not dead code — `defined-but-not-yet-emitted-plan-slice-pattern`).
- [ ] **Step 4 — Run gate → pass.** Unit test green; the whole node suite + every `*.test.sh` stay green
  (`blocked:null` in the return is harmless — the auditLog already reads `r.blocked`, and no existing test asserts the
  loop-return shape excludes `blocked`).
- [ ] **Step 5 — Commit** — `refactor(war): add shared blockedReason predicate + loop scaffolding for fix-worker result binding (L3)`
- **Closes:** the predicate + scaffolding (spec §3). T2 applies it.

---

## Phase 2 — Apply at every worker-dispatch site

### Task 2 — Rewrite the initial-worker guard, bind the fix-worker result, retrofit M2's no-test fixer (L3, code — the fix)

**Files:**
- modify `skills/war/assets/workflow-template.js` — apply `blockedReason` at **every** worker-dispatch site (spec §3
  table):
  - **Initial worker** (~`:264`, behavior-preserving): `const why = blockedReason(impl); if (why) return { task,
    verdict:'escalate', seats:[], expected:0, blocked: why }`.
  - **Audit-fix-loop fixer** (~`:291`, *the bug*): `const fix = await agent(…FIX_NEEDED…); const why =
    blockedReason(fix); if (why) { verdict = 'escalate'; blocked = why; break } round++` — bind the result, escalate
    **on that round** with the reason, **break** (no extra re-audit, no `round++`).
  - **M2 no-test fixer** (retrofit — M2 lands first, so the dispatch exists): apply the same `blockedReason(fix)` →
    escalate-with-reason. **If the stack order shifted and M2's no-test fixer is absent**, apply only at the live
    sites and note M2's site is covered when present (do not invent it).
- test `skills/war/assets/workflow-template.test.mjs` — a **loop-level behavioral test** via the `buildSeqImpl`
  harness (memory `buildseqimpl-harness-for-multi-call-lens-tests` — fresh instance per test; label→results map,
  `.shift()` per call).

**`requiresTest`: true.** **deps:** T1 (the predicate must exist).

- [ ] **Step 1 — Write failing tests.**
  - *Test 1 — blocked fix escalates early (§7.1,2).* A fix-worker returning `{status:'blocked', blocked_reason:'X'}`
    on round *r* < `roundLimit` → `verdict:'escalate'`, `blocked:'X'` set on round *r*, and the task's `auditLog`
    entry carries `blocked:'X'` — **not** after `roundLimit` rounds (assert the loop ran exactly *r*+1 fix dispatches,
    not `roundLimit`). Assert on the unique reason token `'X'`.
  - *Test 2 — initial-worker behavior preserved (§7.4).* A blocked/dead **initial** worker still escalates with
    `expected:0`, `seats:[]`, and the reason (the `:264` rewrite is behavior-preserving).
- [ ] **Step 2 — Run gate → fail** (fix-worker result currently discarded; the loop reaches `audit-blocked`, not an
  early `escalate` with `blocked`).
- [ ] **Step 3 — Implement.** Apply `blockedReason` at the three sites; the fix-worker site escalates-and-breaks
  before `round++`. Re-anchor by named construct (the initial-worker guard, the `FIX_NEEDED` dispatch, M2's no-test
  fixer dispatch).
- [ ] **Step 4 — Run gate → pass.** New tests green; **land semantics unchanged (§7.5)** — a blocked fix yields
  `held:escalation` via the existing `escalate ∈ HARD_ESCALATION_REASONS`; **no `land-decision.mjs` change, no
  drift-guard change** (verify the land-decision suite is untouched and green).
- [ ] **Step 5 — Commit** — `fix(war): bind the fix-worker result — escalate a blocked worker early via blockedReason at every dispatch site (L3)`
- **Closes:** the fix (spec §2/§3) + the M2 no-test-fixer retrofit (the no-test dispatch now binds its result too).

---

## Phase 3 — Release

### Task 3 — Version bump v0.7.7 + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version` **and**
`plugins[0].version`); `README.md` `## Status` (REPLACE-in-place; "Builds on v0.7.6"). **No badge.**

- [ ] **Step 1 — Bump all four slots `0.7.6` → `0.7.7`** (memory `release-bump-slots-canonical-no-badge`,
  `release-status-is-replace-slot-not-empty-field`, `version-slots-no-cross-slot-consistency-test` — verify all four
  by hand). Next free patch by construct if the stack order shifts. Status copy: fix-worker result bound — a blocked
  worker escalates immediately with its reason via the shared `blockedReason` predicate at every dispatch site.
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.7.7 — bind the fix-worker result, escalate a blocked worker early (L3)`

---

## Test plan

**Gate** = the self-discovering multi-runner:
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

| Task | Test | Key assertion | Notes |
|---|---|---|---|
| T1 | `blockedReason` unit (§7.3) | total over null / blocked(+/− reason) / implemented | predicate is total |
| T2 #1 | blocked fix escalates early (§7.1,2) | fix returns `{status:'blocked',blocked_reason:'X'}` on round *r* → `verdict:'escalate'`, `blocked:'X'`, `auditLog[].blocked:'X'`, **not** after `roundLimit` | `buildSeqImpl`, fresh per test; unique token `'X'` |
| T2 #2 | initial-worker preserved (§7.4) | blocked/dead initial worker → escalate, `expected:0`, `seats:[]`, reason | rewrite is behavior-preserving |

**Validation criteria (spec §7):** #1 blocked fix escalates early (T2#1) · #2 reason reaches the Lead via
`auditLog[].blocked` (T2#1) · #3 predicate total (T1) · #4 initial-worker preserved (T2#2) · #5 land semantics
unchanged — `held:escalation`, no `land-decision.mjs` change (T2 Step 4) · #6 full gate green (all).

**Regression guard:** the existing `workflow-template.test.mjs` + `land-decision.test.mjs` + every `*.test.sh` stay
green — T1 is additive scaffolding, T2 changes loop behavior only on the blocked-worker path (clean fixes still
`round++` and re-audit as today), and `HARD_ESCALATION_REASONS` / `land-decision.mjs` are untouched.

## Recommended ADRs

**None** (spec §6). After the change the worker-dispatch sites are symmetric (all bind + check); the diff is trivially
reversible (one predicate + one branch); the only sub-choice (escalate now vs one more audit) is decided by the
finding itself (a blocked worker means findings remain, so an extra round is pure waste). The reasoning lives in the
spec + the commit message. Per the domain-modeling bar: not hard-to-reverse, not surprising-in-result.

## Out of scope / Deferred

- **`HARD_ESCALATION_REASONS` / `land-decision.mjs` unchanged** (DP2, spec §2.2) — `escalate` is already a member; a
  new `fix-blocked` verdict was **rejected** precisely to avoid the L1-unified constant's cascade. The `blocked` field
  carries the distinction instead.
- **`WORKER_RESULT.tests` / self-report fields** — untouched; L3 only binds the `status` + `blocked_reason` the
  worker already returns.
- **Same-file serialization** — T1 and T2 are separate phases (both touch `workflow-template.js`); L3 re-anchors on
  L2's tip (post-M1/M2/M3) by named construct. M2 **must** have landed first (its no-test fixer is a dispatch site T2
  retrofits).
- **No GitHub issue filed** — plan-docs only; finding id is the audit's **L3**.

## Coverage

| Finding | Coverage |
|---|---|
| **L3** | **full** — shared `blockedReason` predicate (T1, unit-tested total) applied at every worker-dispatch site — initial-worker guard (behavior-preserving), the audit-fix-loop fixer (the fix: bind + escalate-on-block + break), and M2's no-test fixer (retrofit) — with `blocked` flowing into the loop return + `auditLog` (T2, behavioral test). `held:escalation` via the existing `escalate` member; no mirrored-constant cascade. CONTEXT term already landed; no ADR by design (§6). |
