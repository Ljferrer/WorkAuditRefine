# Audit & Scheduler Integrity Implementation Plan (F11 · F02 · F04)

**Goal:** Close three silent-failure gaps in WAR's audit/merge loop, all in
[`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) and its mirrored
decision module:
- **F11** — a coven that **approves on a shrunk quorum**: `auditRound`'s `parallel(...).filter(Boolean)`
  silently drops a dead seat and `allApprove` passes on the survivors, so a 3-seat coven can merge on 1 approval.
- **F02** — a **soft-failed predecessor that unblocks its true dependents**: `done.add` is unconditional and
  `nextWave` gates on `done`, so an `escalate`/`audit-blocked`/`blocked`/`env-blocked` dep still satisfies a
  dependent, which then fans out (and can merge) on an integration tip missing that work.
- **F04** — an **anti-cheat seat told to verify "PASS" it cannot execute**: the read-only auditor (`Read/Grep/Glob`)
  is asked to confirm tests "EXIST and PASS" but cannot run them.

**Scope:** F11 + F02 + F04 only — the audit/scheduler-integrity bundle. The other audit findings (F01, F03,
F05–F10, F12) are separate plans. This plan **resolves three open decisions** from those specs (see
*Resolved decisions* below) and supersedes the relevant spec text.

**Architecture:** Behavioral changes to the orchestration core — the WAR Workflow loop
(`skills/war/assets/workflow-template.js`), its mirrored pure-decision module
([`land-decision.mjs`](../../skills/war/assets/land-decision.mjs)), the auditor + refiner agent docs, and
`references/schemas.md`. **No new assets.** This mirrors the repo's tested-core / thin-template split: the
template re-implements `decideLand`/`spawnOpts`/`covenSeats` inline (the Workflow sandbox can't `import`), so
every constant/logic change is **paired with a drift guard** in `war-config.test.mjs`.

**Tech Stack:** plain ESM + the Workflow-sandbox template (compiled as an `AsyncFunction` with mocked Workflow
globals — the repo's existing pattern in `workflow-template.test.mjs`). Tests are `node --test`.

**Gate (for `/war`):** run **all** runners (this is finding F12 in miniature — a single `node --test` under-covers):
```
node --test skills/**/*.test.mjs && bash hooks/validate-worktree-scope.test.sh \
  && bash hooks/clean-surface-war-worktree.test.sh && bash skills/war/assets/provision-worktrees.test.sh
```

**Source of truth:** specs
[F11](../specs/2026-06-25-F11-coven-quorum-integrity-design.md),
[F02](../specs/2026-06-25-F02-scheduler-succeeded-gate-design.md),
[F04](../specs/2026-06-25-F04-auditor-anticheat-claim-design.md) (which derive from the agent-architecture-audit).
Memory: `dropped-coven-seat-silently-shrinks-quorum`, `done-add-on-soft-failure-unblocks-true-dependents`,
`auditor-cannot-execute-the-tests-it-must-verify-pass`.

> **Provenance:** this plan was adversarially verified against the v0.5.1 code (3-lens: code-fidelity,
> DAG-soundness, test-feasibility) and patched for the confirmed precision gaps — exact insertion points,
> the `auditRound` return-shape refactor, the parallel post-merge audit pass, and the test-harness extensions
> each task needs. Line numbers below are at tip f7191fb; a worker should re-confirm by construct.

**Resolved decisions (operator, 2026-06-25 — these OVERRIDE the specs' tentative choices):**
- **R1 (structure).** A **serial DAG** of small tasks. All three findings edit `workflow-template.js` and
  F02 extends `land-decision.mjs`; running them in parallel would hit the exact same-base rebase conflict F02
  is about — so each task depends on the prior.
- **R2 (F11 dropped-seat policy).** Retry a dropped seat **up to twice**; if still short of the expected panel,
  the round resolves to the **existing `audit-blocked`** outcome. **No new `seat-dropped` reason is added**
  (this supersedes the F11 spec's open decision). `allApprove` must require the **full expected panel present**.
- **R3 (F04 reach).** Include a **post-merge gate-audit pass** (the F04 spec's richest alternative): the refiner
  returns the **executed gate output on success**, and a read-only auditor reviews it as execution evidence —
  closing the "auditor can't verify PASS" gap with real execution, not just integrity-by-reading. It runs as a
  **parallel pass AFTER the serial merge queue** (so it never blocks merges).

## Build order (for `/war`)

- **Phase 1 — Foundation:** Task 1 — add `dep-failed` to `HARD_ESCALATION_REASONS` (module + inline mirror) and
  extend the drift guard. Independent; lands the shared constant F02 needs.
- **Phase 2 — Quorum integrity (F11):** Task 2 — depends on Task 1 (same file `workflow-template.js`; serialize).
- **Phase 3 — Scheduler succeeded-gate (F02):** Task 3 — depends on Task 2.
- **Phase 4 — Auditor anti-cheat + post-merge gate-audit (F04):** Task 4 — depends on Task 3.
- **Phase 5 — Release & verify:** Task 5 — depends on all.

**Back-compat:** `dep-failed` is added to the hard-escalation set in Task 1 but only **produced** in Task 3 —
an unused-but-defined constant is behaviorally inert (nothing emits it; `decideLand` only membership-tests the
array), so Task 1 stays green on its own. Task 1 updates the canonical export, the inline mirror, **and** the
drift guard together, so they agree after Step 3. Auditors: this is a plan slice spanning tasks — do not flag
Task 1's not-yet-emitted reason as dead code. Signature change alert: **Task 2 changes `allApprove`'s signature**
(adds `expected`) and **`auditRound`'s return shape** ({seats, expected}); Task 3/4 build on the changed code
(serial chain protects them) — do not revert these.

---

## Phase 1 — Foundation

### Task 1: Add `dep-failed` to `HARD_ESCALATION_REASONS` + drift guard

**Files:** Modify `skills/war/assets/land-decision.mjs` (canonical), `skills/war/assets/workflow-template.js`
(inline mirror near the Land section); Test `skills/war/assets/land-decision.test.mjs` + `war-config.test.mjs`.

- [ ] **Step 1: Write the failing tests** (TDD — these reference the desired post-change state and fail until Step 3)
  - `land-decision.test.mjs`: `decideLand({ landed:['t1'], escalated:[{reason:'dep-failed'}] }) === 'held:escalation'`;
    `assert.ok(HARD_ESCALATION_REASONS.includes('dep-failed'))`.
  - `war-config.test.mjs`: extend the existing `HARD_ESCALATION_REASONS` regex-extraction drift test (currently
    ~line 251–262) so the inline literal in `workflow-template.js` `deepEqual`s the canonical export, now
    `['escalate','audit-blocked','conflict','dep-failed']`.
- [ ] **Step 2: Run the gate → fail** (`dep-failed` absent from both copies; drift test mismatches).
- [ ] **Step 3: Implement** — append `'dep-failed'` to `HARD_ESCALATION_REASONS` in `land-decision.mjs` **and** to
  the inline mirror in `workflow-template.js` **in the same task** (so the drift guard passes).
- [ ] **Step 4: Run the gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "feat(war): add dep-failed hard-escalation reason + drift guard (F02 foundation)"`

---

## Phase 2 — Quorum integrity (F11)

### Task 2: A dropped audit seat must never shrink the quorum (R2)

**Files:** Modify `skills/war/assets/workflow-template.js` (`auditRound`, `allApprove`, the round loop, the
auditLog push); Test `skills/war/assets/workflow-template.test.mjs`.

- [ ] **Step 1: Write the failing tests** (behavioral, mocked-agent harness)
  - **Harness extension first:** the current stub can't return different values across successive calls to the
    *same* lens (the round counter is global, and lenses dispatch concurrently via `fakeParallel`). Add a
    **per-label call-sequence** capability to the test agent stub — e.g. a map `{ 'audit:t1:correctness': [null, verdict], … }`
    keyed by the agent `label`, popping one entry per call. This is a test-harness-only change.
  - **Transient drop recovers:** a 3-lens coven where one lens returns `null` on its first call and a verdict on
    retry → the round judges a **full panel of 3**.
  - **Persistent drop → audit-blocked:** a lens that returns `null` on all attempts (initial + 2 retries) →
    the round does **not** approve; final verdict is **`audit-blocked`**.
  - **`allApprove` requires the full panel:** `allApprove(seats, expected)` returns **false** when
    `seats.length < expected` even if every present seat approved.
  - **auditLog records the shortfall:** the task's audit-log entry carries `requested:3, returned:2` on a persistent drop.
- [ ] **Step 2: Run the gate → fail** (current `auditRound` returns `(await parallel(...)).filter(Boolean)` — a bare
  array — and `allApprove` (line ~141) is `seats => seats.length>0 && every(approve)`; survivors approve a shrunk panel).
- [ ] **Step 3: Implement**
  - **`auditRound` return shape:** compute `expected = lenses.length`; map each `null` result back to its lens and
    **re-run only the dropped lenses up to 2 times**; **return `{ seats, expected }`** (object, not a bare array).
  - **Unpack at both call sites:** in the round loop, change `seats = await auditRound(task, null)` to
    `;({ seats, expected } = await auditRound(task, null))` (declare `let expected` alongside `seats`); likewise the
    rebuttal call `seats = await auditRound(task, seats)`.
  - **`allApprove` signature:** `(seats, expected) => seats.length === expected && seats.every(s => s.verdict==='approve')`;
    update **both** call sites in the round loop (the two `allApprove(seats)` → `allApprove(seats, expected)`).
    `isSplit` is unaffected (it operates on present seats).
  - **Persistent shortfall:** if after retries `seats.length < expected`, set `verdict = 'audit-blocked'` and break.
  - **auditLog:** record `{ requested: expected, returned: seats.length }` in the task's audit-log push.
- [ ] **Step 4: Run the gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "fix(war): coven quorum integrity — retry dropped seats x2, never approve a shrunk panel (F11)"`

---

## Phase 3 — Scheduler succeeded-gate (F02)

### Task 3: Gate dependents on success, not completion

**Files:** Modify `skills/war/assets/workflow-template.js` (`succeeded` set, `nextWave`, the while loop's wave
selection, the refine loop, termination); Test `skills/war/assets/workflow-template.test.mjs`.

- [ ] **Step 1: Write the failing tests**
  - **Harness:** extend `defaultImpl` to drive a 3-task DAG (`t2` deps `t1`, `t3` independent) and let `t1` be
    forced to escalate; assert on `escalated[]` and `landed[]`.
  - **Failed predecessor blocks dependent:** `t1` escalates → `t2` **never spawns a worker**; `t2` is in
    `escalated` with reason `dep-failed` naming `t1`; `t3` still runs; the phase **land is held**.
  - **env-blocked is not success:** `t1` returns `env-blocked` → `t2` is `dep-failed`.
  - **Success unblocks:** `t1` approves **and merges** → `t2` runs normally.
  - **Termination:** `done.size` reaches `tasks.length` (no spin).
- [ ] **Step 2: Run the gate → fail** (`done.add` unconditional at ~line 268; `nextWave` gates on `done` at ~line 143).
- [ ] **Step 3: Implement**
  - **`succeeded` set:** add `const succeeded = new Set()` next to `done`. In the refine loop, inside the existing
    `if (mr && mr.status === 'merged')` block (alongside `landed.push(r.task.id)`), add `succeeded.add(r.task.id)`.
    Keep `done.add(r.task.id)` for ran tasks (accounting); **only `succeeded` gates dependents**.
  - **`nextWave`:** `tasks.filter(t => !done.has(t.id) && (t.deps||[]).every(d => succeeded.has(d)))`.
  - **Dep-block detection — placement is load-bearing.** At the **top of each `while` iteration, BEFORE the
    `nextWave()` call and BEFORE the `if (!wave.length) break` guard** (~line 209–210), find tasks that are
    terminal-but-failed-deps: `!done.has(t.id) && deps.length && deps.every(d => done.has(d)) && !deps.every(d => succeeded.has(d))`.
    For each, push `{ task: t.id, reason: 'dep-failed', failedDeps: deps.filter(d => !succeeded.has(d)) }` to
    `escalated`, add an `auditLog` entry, and `done.add(t.id)` — **without spawning a worker** (these bypass the
    `results` fork). This guarantees `done.size` keeps growing so the loop terminates, and the `if(!wave.length)
    break` only fires when nothing genuinely remains.
  - Siblings within a wave still proceed (by design). **Note:** the auto-escalate-to-coven mutation (~line 246)
    runs in the audit loop; with `nextWave` now gating on `succeeded`, a re-escalated dependent re-runs only after
    its deps *succeed* (one extra cycle of latency) — correct, just noted.
- [ ] **Step 4: Run the gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "fix(war): gate dependents on succeeded (not done); dep-failed blocks true dependents incl. env-blocked (F02)"`

---

## Phase 4 — Auditor anti-cheat + post-merge gate-audit (F04 · R3)

### Task 4: Honest anti-cheat wording + worker-test cross-check + post-merge gate-audit pass

**Files:** Modify `agents/war-auditor.md` (reword), `agents/war-refiner.md` (populate gate output on success),
`skills/war/assets/workflow-template.js` (`auditPrompt` threads worker tests; new **parallel** post-merge
gate-audit pass after the refine loop), `skills/war/references/schemas.md`; Test `workflow-template.test.mjs`.

- [ ] **Step 1: Write the failing tests**
  - **Harness:** update the mock worker in `defaultImpl` to return a `tests` field (e.g. `tests:{unit:5,integration:2}`)
    so `auditPrompt` threading is observable.
  - **Reworded claim:** `agents/war-auditor.md` no longer contains the literal "EXIST and PASS"; it states the
    auditor verifies tests **EXIST + are not weakened/skipped**, and that the **refiner runs the gate** (clean-surface
    grep + presence check). Update any existing test-case prose that embeds the old wording.
  - **Worker tests threaded:** the generated `auditPrompt` includes the worker's reported `tests` summary (grep the
    generated prompt).
  - **Post-merge gate-audit pass exists:** after the merge queue, a **parallel** set of read-only `war-auditor`
    agents (lens `execution-evidence`) is spawned over the merged tasks, each prompt referencing the **executed
    gate output** + the task's mapped acceptance criteria (assert these agent calls exist with the expected prompt).
  - **Schema:** confirm `MERGE_RESULT` already permits `gate_output` (it is optional at ~line 44–48) — assert a
    `{ mode, status:'merged', gate_output:'…' }` validates (no schema widening needed).
- [ ] **Step 2: Run the gate → fail.**
- [ ] **Step 3: Implement**
  - **Reword** `war-auditor.md` §"Always verify … EXIST and PASS" and the `auditPrompt` "Verify the mapped …
    EXIST and PASS" line to the integrity wording; clarify in `schemas.md` that `AuditVerdict.tests_verified` means
    "existence + integrity verified, not executed".
  - **Thread worker tests:** add a `workerTests` parameter to `auditPrompt` and pass `impl.tests` through
    `auditRound` (the worker has already run when `auditRound` is called, so `impl` is in scope) so the auditor
    cross-checks the claim vs the diff.
  - **Refiner returns gate output on success:** update `agents/war-refiner.md` + the merge prompt so a `merged`
    `MergeResult` populates `gate_output` with the executed gate output. **No `MERGE_RESULT` schema change** —
    `gate_output` is already optional; this is a behavioral/doc change about *when* it is populated.
  - **Post-merge gate-audit as a PARALLEL pass (not inline — the merge queue stays serial/unblocked).** During the
    refine loop, collect `{ taskId, gateOutput: mr.gate_output, acceptanceCriteria }` for each merged task. **After**
    the refine `for` loop completes and **before** the Land decision, run `parallel(...)` over the collected merged
    tasks, each spawning a read-only `war-auditor` (lens `execution-evidence`) given the gate output + mapped
    criteria. If a verdict shows the mapped tests did not actually run/pass (0 collected, a mapped test absent),
    record a `gate-evidence` finding. Default: **soft** note (does not hold the land) unless a mapped test is
    *provably unrun* → then hard (Open decision #1).
- [ ] **Step 4: Run the gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "feat(war): auditor verifies test integrity (not execution); refiner returns gate output; parallel post-merge gate-audit (F04)"`

---

## Phase 5 — Release & verify

### Task 5: Version bump + full multi-runner gate green

**Files:** the canonical version-bump file list (see README "Releasing") — propose **v0.5.2** (patch; confirm vs
batching with other audit-remediation plans).

- [ ] **Step 1:** Bump the version across the README-documented bump list (`.claude-plugin/plugin.json` `version`,
  README badge/status, any `vX.Y.Z` strings).
- [ ] **Step 2:** Run the **full** gate (all runners — the F12 lesson): `node --test skills/**/*.test.mjs` **and**
  all three `*.test.sh` suites → all green.
- [ ] **Step 3: Commit** — `git commit -am "chore(release): v0.5.2 — audit/scheduler integrity (coven quorum, succeeded-gate, post-merge gate-audit)"`

---

## Notes / conscious deviations (ratify in this plan's `/red-team`)

- **R2 supersedes the F11 spec:** persistent dropped seat → existing `audit-blocked` (retry x2 first), **not** a new
  `seat-dropped` reason. Back-port the resolution into the F11 spec.
- **R3 supersedes the F04 spec recommendation:** a **parallel post-merge gate-audit pass** (after the serial merge
  queue) is in scope; the refiner populates `gate_output` on success (no schema change — already optional). Back-port
  into the F04 spec.
- **`dep-failed` defined-before-used:** added in Task 1, produced in Task 3 (deliberate slice; not dead code).
- **Signature changes (Task 2):** `allApprove(seats, expected)` and `auditRound → {seats, expected}` are relied on by
  later tasks; the serial chain protects them.
- **Test-harness extensions are part of the plan:** Task 2 needs per-label call sequences; Task 3 needs a 3-task DAG
  in `defaultImpl`; Task 4 needs the mock worker to return a `tests` field. Each is called out in that task's Step 1.
- **Mirror discipline:** every change to `HARD_ESCALATION_REASONS` / `allApprove` / decision logic keeps the
  `workflow-template.js` inline copies in sync; Task 1 extends the drift guard. If F07's broader logic-drift guard
  lands first, fold into it.
- **Versioning:** v0.5.2 proposed; the Lead may batch with other audit-remediation plans.
- **Gate coverage:** this plan's gate already runs the bash suites (anticipating F12); F12's resolver/meta-test is a
  separate plan.

## Open decisions (for `/red-team`)

1. **`gate-evidence` outcome** (Task 4): hard escalation vs soft note when the post-merge gate-audit can't confirm a
   mapped test ran (recommend soft unless a mapped test is provably unrun).
2. **F11 retry budget** = 2 (R2) — confirm 2 vs 1/3.
3. **Release granularity:** ship v0.5.2 for this bundle vs batch with F01/F03/F05–F10/F12.
