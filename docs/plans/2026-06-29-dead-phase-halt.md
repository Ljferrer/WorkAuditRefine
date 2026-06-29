# Dead-phase halt — never advance the DAG past a phase that didn't run Implementation Plan (audit finding M1)

**Goal:** close the one confirmed defect whose failure mode can ship un-audited code — a phase Workflow that
**throws, times out, or returns null/garbage** leaves no `landDecision`, and the lazy `--afk` reading of an empty
result is *"nothing landed, move on"*, **silently advancing the DAG past a phase that never ran its audit/merge
gates**. The fix is two complementary mechanisms over **disjoint** failure surfaces (spec §1): an **in-script
top-level `try/catch`** (catches an in-script throw / shape-invalid return) and a **Lead-side fail-closed envelope
check** (catches infra death / non-`completed` notifications + garbage returns), with a **completed-ness
discriminator** routing retryable (`held:phase-incomplete`) vs terminal (`held:workflow-error`) and **bounded
auto-resume** via `resumeFromRunId` under `--afk`.

**Source spec:** [`docs/specs/2026-06-29-dead-phase-halt-design.md`](../specs/2026-06-29-dead-phase-halt-design.md)
(design resolved by grilling). **ADR:** [`0005-dead-phase-halts-the-dag.md`](../adr/0005-dead-phase-halts-the-dag.md)
(**already written + accepted**). **CONTEXT.md** terms (Dead phase / `held:phase-incomplete` / `held:workflow-error`
/ Retry budget) are **already landed** — not in this plan's scope.

**Nature of the change — two distinct surfaces:**
- **Code** (T1): a top-level `try/catch` in `workflow-template.js` returning `held:workflow-error` + `workflowError`.
  Testable.
- **Lead-prose** (T2): SKILL.md fail-closed classifier (§4.2) + bounded-auto-resume handling (§4.3) + the
  return-contract `landDecision` set; schemas.md enum → the full 6 values. **Not code-enforced** — agent directives,
  like memory `red-team-env-gap-warn-is-agent-directive-not-code-enforced`. No deterministic test.

**Position in the stack:** M1 is **first** of five stacked audit-remediation plans (M1→M2→M3→L2→L3, implemented in
order, each +0.0.1). M1 owns **v0.7.3** off the v0.7.2 baseline. M2/M3/L3 also touch `workflow-template.js`, so they
land **after** M1 and re-anchor by named construct (memory `plan-line-number-refs-stale-use-construct-locator`).

## Build order (for `/war`)

- **Phase 1 — dead-phase halt:** T1 (code: in-script `try/catch`) ∥ T2 (prose: SKILL.md + schemas.md). The two
  tasks touch **disjoint files** (`workflow-template.js` vs `SKILL.md`/`schemas.md`), so there is **no same-file
  serialization** between them — they may run in parallel in one phase. No inter-task dependency.
- **Phase 2 — release:** T3 (v0.7.3).

## Operator decisions — RESOLVED (2026-06-29, grill-with-docs)

- **DP1 — Decomposition: two tasks, one phase.** T1 = the code `try/catch` + its test (`requiresTest:true`); T2 =
  the SKILL.md + schemas.md prose (`requiresTest:false` — prose, no deterministic test). Split by **file +
  testability**; disjoint files mean no merge contention between them. *Rejected:* one combined task (bundles
  untestable Lead-prose under the same audit as the code); three+ tasks (DAG overhead for a small change).
- **DP2 — Test floor: automate criteria #1 + #6, prose-verify #2-5,7.** T1 maps two tests — (#1) a forced throw →
  `held:workflow-error` + `workflowError`, and (#6) the catch returns **without running teardown** (git state
  preserved). Criteria #2-5,7 (Lead-side fail-closed classification, bounded auto-resume, terminal-halts-regardless-
  of-afk, no-fresh-re-run) are **prose-verified Lead directives** — no deterministic Lead-side harness (matches the
  env-gap precedent; harness deferred). *Rejected:* a full Lead-side simulation harness (the `resumeFromRunId`
  auto-resume path cannot be simulated without the Workflow runtime).
  - **Vacuity trap (criterion #6).** Do **NOT** drive #6 from the early `:94` derivation throw: teardown is
    structurally unreachable from the top of the phase body, so "teardown did not run" would be **vacuously true**
    (memory `weak-test-assertion-passes-without-feature-being-exercised`). Force the throw via a **mock agent that
    throws after at least one merge** (a point past which teardown would otherwise run), and assert **no teardown
    agent call is recorded** on the catch path. If the harness cannot observe a teardown call, #6 degrades to a
    structural assertion (the catch block contains no teardown invocation) — state which form was used.
- **DP3 — Release: +0.0.1 → v0.7.3, implemented in order.** Each stacked plan bumps one patch; M1 is first, so
  v0.7.2 → **v0.7.3**. Bump the four canonical slots; **take the next free patch by construct** if the stack order
  shifts (memory `stacked-per-branch-releases-make-main-lag-cumulative`).

---

## Phase 1 — Dead-phase halt (in-script catch + Lead-side fail-closed prose)

### Task 1 — Top-level `try/catch` in workflow-template.js returns `held:workflow-error` on a dead phase (M1, code)

**Files:**
- modify `skills/war/assets/workflow-template.js` — wrap the phase body, from the **task-branch/worktree derivation**
  (the construct around `:91`, so even the underivable-branch `throw` at `:94` is caught) through the **final phase
  `return`** (`:472`), in a single top-level `try/catch`. On catch, return directly (spec §4.1):
  ```js
  } catch (err) {
    // A dead phase that self-reports. landed/escalated are whatever accumulated before the throw;
    // teardown is NOT run (git state kept for resume/inspection).
    return { phase: ph.id, landed, escalated, minorsFiled, landResult: null,
             servitorResult: null, auditLog,
             landDecision: 'held:workflow-error',
             workflowError: { message: String(err && err.message || err), stack: err && err.stack } }
  }
  ```
- test `skills/war/assets/workflow-template.test.mjs` — new tests on the existing `runPhase`/`buildSeqImpl`/
  `new AsyncFunction` sandbox harness.

**`requiresTest`: true.**

- [ ] **Step 1 — Write failing tests (behavioral, via the existing harness).**
  - *Test 1 — in-script throw is caught (criterion #1, RED→GREEN).* Drive the phase with args that force the `:94`
    derivation throw (omit `planSlug` + `runId` + an explicit branch). Assert the call **returns**
    `{ landDecision: 'held:workflow-error', workflowError: { message, stack } }` with a non-empty `workflowError.message`
    — **not** an unhandled rejection. Assert `landDecision === 'held:workflow-error'` (unique token).
  - *Test 2 — catch skips teardown / preserves state (criterion #6, RED→GREEN; NON-vacuous).* Inject a throw via a
    **mock agent that throws after at least one merge** (see DP2 vacuity trap). Assert (a) the return is
    `held:workflow-error`, and (b) **no teardown agent call** is recorded on the catch path. If teardown is not an
    observable agent call in the harness, assert structurally that the catch block performs no teardown and state
    that form in the test name.
- [ ] **Step 2 — Run gate → fail.** Today the derivation throw is an **uncaught rejection** (no enclosing
  `try/catch`), so Test 1 fails (no returned envelope). Test 2 fails (no catch path exists to skip teardown).
- [ ] **Step 3 — Implement (minimal).** Add the single top-level `try` after the derivation construct and the `catch`
  before the function close, returning the §4.1 envelope. **No teardown in the catch.** Re-anchor the wrap boundaries
  by **named construct** (the derivation block start and the final `return`), not literal line numbers.
  - **`HARD_ESCALATION_REASONS` is UNCHANGED** (spec §4.1 note). `held:workflow-error` is set **directly** by the
    catch, **bypassing `decideLand()`** — it must **not** be added to `HARD_ESCALATION_REASONS` (that set governs the
    normal-completion hold computation; wiring `workflow-error` in would make `decideLand` return `held:escalation`
    and clobber the direct set). `land-decision.mjs` and its drift-guards in `war-config.test.mjs` are untouched — no
    mirrored-constant cascade.
- [ ] **Step 4 — Run gate → pass.** Tests 1-2 green; the whole `node --test 'skills/**/*.test.mjs'` suite + every
  `*.test.sh` runner stay green (the `try/catch` is additive; the happy-path `return` at `:472` is unchanged).
- [ ] **Step 5 — Commit** — `fix(war): top-level try/catch in the phase Workflow returns held:workflow-error on a dead phase (M1)`
- **Closes:** the in-script half of M1 (surfaces #1 in-script throw + #3 shape-invalid self-report). The Lead-side
  half (surfaces #2 infra death + #3 garbage return) is T2.

### Task 2 — Lead-side fail-closed classification + bounded auto-resume prose; schemas.md enum → 6 values (M1, docs/prose)

**Files:**
- modify `skills/war/SKILL.md` —
  - the **return-contract line** (`:39`): add `held:phase-incomplete` and `held:workflow-error` to the
    `landDecision` set.
  - the **Checkpoint section** (`:43-46`): add the §4.2 **fail-closed classification** (on each phase notification,
    before any land/hold/advance reasoning: `status != "completed"` → `held:phase-incomplete`; result missing /
    unparseable / `landDecision ∉ KNOWN_LAND_DECISIONS` → `held:workflow-error`; else `result.landDecision`) and the
    §4.3 **outcome handling** — terminal `held:workflow-error` HARD-halts **regardless of `--afk`**; retryable
    `held:phase-incomplete` auto-resumes via `Workflow({scriptPath, resumeFromRunId})` up to `run.roundLimit` total
    attempts under `--afk` (then HARD-halt as `held:phase-incomplete (retries-exhausted)`; **never** a fresh re-run),
    surfaces "resume?" interactively; a **dead phase never advances the DAG** and its git state is **preserved (no
    teardown)**.
- modify `skills/war/references/schemas.md` — extend the `landDecision` enum docs to the full **6-value** set
  (`landed`, `held:escalation`, `held:nothing-merged`, `held:land-failed`, `held:phase-incomplete`,
  `held:workflow-error`) — also closes the pre-existing `held:land-failed` doc-completeness gap noted in the audit's
  mirror residual.

**`requiresTest`: false** — prose only; no `.mjs/.js` change, no `*.test.sh` reads SKILL.md/schemas.md. Criteria
#2-5,7 are verified by review of the prose, not by the gate (DP2).

- [ ] **Step 1 — (no behavioral test — prose; YAGNI on tests for SKILL.md/schemas.md prose.)**
- [ ] **Step 2 — Implement (prose).** Add the §4.2 classifier + §4.3 handling to SKILL.md's Checkpoint section and
  the value to the return-contract line; extend the schemas.md enum to 6 values. Be explicit that terminal/exhausted
  halt **regardless of `--afk`** and a dead phase **never advances the DAG**. Anchor edits by **named construct**
  (the Checkpoint section / the return-contract sentence / the `landDecision` enum block), not literal line numbers.
- [ ] **Step 3 — Run gate → pass.** The full self-discovering gate stays green (no executable surface touched).
- [ ] **Step 4 — Commit** — `docs(war): fail-closed dead-phase classification + bounded auto-resume in SKILL.md; landDecision enum → 6 values (M1)`
- **Closes:** the Lead-side half of M1 (surfaces #2 + #3) + the schemas doc-completeness gap.

---

## Phase 2 — Release

### Task 3 — Version bump v0.7.3 + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version` **and**
`plugins[0].version` — both; a stale slot is a silent no-op release); `README.md` `## Status` (REPLACE-in-place the
prior block; "Builds on v0.7.2"). **No badge.**

- [ ] **Step 1 — Bump all four slots `0.7.2` → `0.7.3`** (memory `release-bump-slots-canonical-no-badge`,
  `release-status-is-replace-slot-not-empty-field`; `version-slots-no-cross-slot-consistency-test` — no automated
  cross-slot check, verify all four by hand). **Take the next free patch by construct** if M1 did not land first in
  the stack (memory `stacked-per-branch-releases-make-main-lag-cumulative`). Status copy: dead-phase halt — in-script
  `try/catch` → `held:workflow-error` + Lead-side fail-closed classification + bounded auto-resume.
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.7.3 — dead-phase halt never advances the DAG (M1)`

---

## Test plan

**Gate** = the self-discovering multi-runner (quote the node glob; discover bash suites). Run at every Step
fail/pass, final green required:
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

| Task | Test | Key assertion | Notes |
|---|---|---|---|
| T1 #1 | in-script throw is caught | forced `:94` throw → returns `{ landDecision:'held:workflow-error', workflowError }`, not a rejection | unique token `held:workflow-error` |
| T1 #6 | catch skips teardown | throw injected **after a merge** → no teardown agent call recorded on the catch path | NON-vacuous (DP2 trap); structural fallback if teardown not observable |
| T2 | (no test — prose) | full gate green | criteria #2-5,7 prose-verified by review |

**Prose-verified (no automated test, DP2):** #2 fail-closed on non-`completed` → `held:phase-incomplete`; #3
fail-closed on garbage `landDecision` → `held:workflow-error`; #4 bounded auto-resume ≤ `roundLimit` then halt, a
recovered resume does not notify; #5 terminal halts regardless of `--afk`; #7 recovery only ever uses
`resumeFromRunId`, resume-unavailable degrades to terminal halt.

**Regression guard:** the existing `workflow-template.test.mjs` suite + every `*.test.sh` runner stay green — T1 is
an additive wrap (happy-path `return` unchanged), T2 touches no executable surface.

## Recommended ADRs

**None new.** [`ADR-0005 — dead-phase halts the DAG`](../adr/0005-dead-phase-halts-the-dag.md) is **already written
and accepted**, ratifying decisions 2/3/5/6 (fail-closed allowlist, the two-term split, the completed-ness
discriminator, `roundLimit` as the canonical retry budget). This plan implements it; no further ADR.

## Out of scope / Deferred

- **`land-decision.mjs` / `HARD_ESCALATION_REASONS` unchanged** — `held:workflow-error` is set directly by the catch,
  a layer **above** the escalation machinery (spec §4.1 note). No mirrored-constant cascade, no `war-config.test.mjs`
  drift-guard change.
- **No Lead-side deterministic harness** (DP2) — criteria #2-5,7 are agent directives in SKILL.md prose; the
  `resumeFromRunId` auto-resume path cannot be simulated without the Workflow runtime. Harness deferred until a real
  dead-phase incident is observed to need it (matches `red-team-env-gap-warn-is-agent-directive-not-code-enforced`).
- **No schema gate on the Workflow return envelope** — the fail-closed allowlist (§4.2) is the Lead's prose floor;
  a typed envelope validator is deferred (spec §7/§8).
- **Killed-Lead (process death) resume** — `resumeFromRunId` is same-session only; if the Lead's own process died
  this mechanism is unavailable and the §4.3 "resume-unavailable → terminal halt" branch is the safe degradation.
  Cross-session resume stays with the existing ledger/open-issues replay (`design.md §6`), out of scope (spec §7/§8).
- **Same-file serialization with M2/L3** — M2 and L3 also touch `workflow-template.js`. They are **later** in the
  stack and land after M1; their workers re-anchor by named construct (memory
  `war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`,
  `plan-line-number-refs-stale-use-construct-locator`). M1's two tasks touch disjoint files, so there is no
  contention **within** this plan.
- **No GitHub issue filed** — plan-docs only (per the operator's `/loop`); the finding id is the audit's **M1**.

## Coverage

| Finding | Coverage |
|---|---|
| **M1** | **full** — in-script `try/catch` → `held:workflow-error` + `workflowError` over surfaces #1/#3 (T1, tested: criteria #1+#6) + Lead-side fail-closed classification and bounded auto-resume over surfaces #2/#3 (T2, prose: criteria #2-5,7) + schemas.md enum → 6 values. ADR-0005 + CONTEXT terms already landed. |
