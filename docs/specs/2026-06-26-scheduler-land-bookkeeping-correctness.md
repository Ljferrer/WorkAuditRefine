# WAR Scheduler & Land Bookkeeping Correctness (#99 · #113 · #115)

**Goal:** make the WAR per-phase scheduler honest about three bookkeeping facts: every task either runs and is recorded or fails loud; the `auditLog.requested` column is always numeric; and `landDecision` never reports `landed` when the land STEP itself failed. Three small, independent correctness fixes to `skills/war/assets/workflow-template.js`, each TDD-paired with a test in `workflow-template.test.mjs`.

**Closes:**
- **#99** — `landDecision` stays `landed` when the land STEP returns `error`/`gate_failed`.
- **#113** — `auditLog.requested` is `undefined` for the env-blocked / worker-blocked early-returns.
- **#115** — a phantom / out-of-phase dep silently prevents a task from ever running (no escalation, phase lands APPROVED with a never-run task).

**Scope (v0.6.6 — scheduler/land bookkeeping, no behavior change for the happy path):** all three are defects in the *failure / edge* accounting of the per-phase loop in `workflow-template.js`. None changes the happy-path land flow; each closes a silent-wrong-or-undefined hole so the phase terminates **loud** instead of lying. Subsystem is one file (`workflow-template.js`) + its test (`workflow-template.test.mjs`); patch release.

> **Baseline-drift note (2026-06-26):** the issue bodies cite line numbers (#99 ~398-409, #113 ~230/242/281, #115 ~334) that have **drifted** under the audit-scheduler-integrity + provisioning-lifecycle landings. The live anchors are re-derived below by **construct** (the `while` loop, the `auditLog.push`, the post-land `if (landResult && HARD_ESCALATION_REASONS…)` condition, the two early-return objects). Every task re-anchors by named construct, never by literal line number. Live repo is **v0.6.5**; this plan bumps to **v0.6.6** (patch).

**Architecture:** all three sites live in the single per-phase `while` loop and its post-loop land/wrap-up tail in `workflow-template.js`. The file is executed in a sandbox via `new AsyncFunction('agent','parallel','pipeline','log','phase','args','budget', src)` (see `workflow-template.test.mjs` `build()`), so the tests drive it with a mock `agent` and assert on both the returned `{ landDecision, escalated, auditLog }` object and on the source text. There is no import surface — the constants (`HARD_ESCALATION_REASONS`) are inline mirrors of `land-decision.mjs`; we must **not** widen that mirror (see Decision Record).

**Tech stack:** ESM `workflow-template.js`; `node --test` over `skills/**/*.test.mjs`; behavioral harness `runPhase(args, agentImpl)` already present in `workflow-template.test.mjs`.

**Gate (for `/war`):** the repo's self-discovering multi-runner gate (F12 lesson — quote the node glob; discover bash suites so nothing under-covers):
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Memory:** `land-decision-not-demoted-on-land-step-failure` (#99), `auditlog-requested-undefined-for-early-returns` (#113), `phantom-dep-silently-prevents-task-from-running` (#115), `done-add-on-soft-failure-unblocks-true-dependents` (the F02 sibling these fixes compose with).

---

## Problem statement

### #113 — `auditLog.requested` is `undefined` for the two early-return paths *(trivial, nit)*

The work-wave `parallel(...)` map returns a per-task result object. Two early-return paths omit the `expected` field that the audit path supplies:

- **env-blocked** (provision failure), at the `if (!env.ok) { return { task, verdict: 'env-blocked', seats: [], envOutcome: {…} } }` construct — the returned object has **no `expected`** key.
- **worker-blocked** (worker returned no result / `status === 'blocked'`), at the `if (!impl || impl.status === 'blocked') { return { task, verdict: 'escalate', seats: [], blocked: … } }` construct — likewise **no `expected`** key.

Every result is then logged unconditionally by the merge-queue loop:

```js
auditLog.push({ task: r.task.id, verdict: r.verdict, findings: …, blocked: r.blocked, requested: r.expected, returned: (r.seats || []).length })
```

`requested: r.expected` is `undefined` for those two paths (the normal audit path sets `expected` from `auditRound`'s `{ seats, expected }`). **Root cause (verified):** the two early-return objects don't carry `expected`. **Evidence:** `workflow-template.js` — the env-blocked return (`verdict: 'env-blocked'`) and the worker-blocked return (`verdict: 'escalate', blocked: …`) inside the work-wave `parallel` map; consumed by the `auditLog.push({ …, requested: r.expected, … })` in the REFINE serial loop. Issue explicitly classifies this **non-blocking / cosmetic** (no audit ran, so `0` is the honest count). Prior-art for the assertion shape: `workflow-template.test.mjs` "Task 2 — auditLog records requested and returned on a persistent drop" asserts `entry.requested === 3`.

### #99 — `landDecision` stays `landed` when the land STEP returns `error`/`gate_failed` *(small, major)*

After `decideLand`-equivalent logic sets `landDecision = 'landed'`, the template spawns the land refiner and inspects its result:

```js
if (landResult && HARD_ESCALATION_REASONS.includes(landResult.status)) {
  escalated.push({ task: `phase-${ph.id}-land`, reason: landResult.status, detail: landResult })
  landDecision = 'held:escalation'
} else if (landResult && landResult.status === 'landed') {
  …opportunistic resync…
}
```

`HARD_ESCALATION_REASONS = ['escalate', 'audit-blocked', 'conflict', 'land_stale', 'dep-failed', 'gate-evidence']` — it deliberately **excludes** `'error'` and `'gate_failed'`. That exclusion is correct for the **pre-land** `decideLand()` path (task-level merges that fail gate/error must surface as `held:nothing-merged`, per `land-decision.test.mjs` design), but **post-land** the land refiner can itself return `status: 'gate_failed'` (land-step gate failure, MERGE_RESULT enum line 46) or `status: 'error'` (escalate exit from `land-advance`, per the land prompt). When it does, **neither branch fires**: not the demotion (status not in `HARD_ESCALATION_REASONS`) and not the success branch (status ≠ `'landed'`). `landDecision` stays the optimistic `'landed'` it was set to before the land ran, and the wrap-up guard (`if (landResult && landResult.status === 'landed' …)`) also won't fire — so the servitor won't run, but the **returned `landDecision` lies**. The Lead reads `landDecision` to choose wrap-up behavior; a false `'landed'` makes the Lead think the land succeeded. **Root cause (verified):** the post-land condition has no handler for `landResult.status` ∈ {`'error'`,`'gate_failed'`}. **Evidence:** `workflow-template.js` — the `let landDecision = (landed.length && !hardEscalation) ? 'landed' : …` assignment and the immediately-following `if (landResult && HARD_ESCALATION_REASONS.includes(landResult.status))` block in the LAND section. Prior-art: `workflow-template.test.mjs` "Task 5 — land_stale holds the land (hard escalation)" asserts `out.landDecision === 'held:escalation'` for a `land_stale` land result.

### #115 — phantom / out-of-phase dep silently prevents a task from ever running *(small, major)*

`nextWave()` is `tasks.filter(t => !done.has(t.id) && (t.deps || []).every(d => succeeded.has(d)))`. If a task's `deps[]` names an id **not present in this phase's `tasks[]`** (a phantom or cross-phase reference), that id is **never** added to `succeeded` **and never added to `done`** — so:

- the task never satisfies `nextWave()` (the phantom dep is never `succeeded`), so it never runs;
- the **dep-block pre-check** — `if (!done.has(t.id) && deps.length && deps.every(d => done.has(d)) && !deps.every(d => succeeded.has(d)))` — never fires either, because a phantom dep is never in `done`, so `deps.every(d => done.has(d))` is false.

The task is silently skipped across all waves, never added to `escalated`, `done`, or `auditLog`. The `while` loop's break guard (`if (!wave.length) … break`) eventually exits, and a phase can land **APPROVED** despite a task that was never attempted. **Root cause (verified):** there is no post-loop sweep for tasks still `!done.has(t.id)`. **Evidence:** `workflow-template.js` — the `while (done.size < tasks.length && guard++ < tasks.length + 2)` loop, its dep-block pre-check, and the final `return { phase: ph.id, landed, escalated, … }` with no sweep between the loop's closing brace and the LAND section. This is **distinct** from the F02 hazard (`done-add-on-soft-failure-unblocks-true-dependents`) already fixed via the `succeeded` set + dep-block pre-check: that pre-check catches deps that ARE in `done` but NOT in `succeeded`; it does **not** catch phantom deps that never enter `done` at all.

---

## Design / approach

Three independent edits, each behind its own failing test. None touches the happy path.

### #113 — add `expected: 0` to both early-return objects

Add `expected: 0` to the **env-blocked** return object and to the **worker-blocked** return object. The audit path already populates `expected` from `auditRound`; these two paths never entered audit, so `0` is the honest "no audit requested" count. The downstream `auditLog.push({ …, requested: r.expected, … })` is **unchanged** — it now reads `0` instead of `undefined`. One key per object. No rejected alternatives (the issue notes the fix is a one-line addition per object); we keep the change minimal rather than guarding at the `push` site, because the defect is the producers omitting the field, and a `?? 0` at the consumer would mask future omissions silently.

### #99 — demote `landDecision` after a failed land STEP

Add an explicit handler for the land-step failure statuses. After the existing `if (landResult && HARD_ESCALATION_REASONS.includes(landResult.status)) { … held:escalation }`, add an **`else if`** that fires when `landResult.status` is `'error'` or `'gate_failed'`:

```js
} else if (landResult && (landResult.status === 'error' || landResult.status === 'gate_failed')) {
  escalated.push({ task: `phase-${ph.id}-land`, reason: landResult.status, detail: landResult })
  landDecision = 'held:land-failed'
}
```

This demotes the optimistic `'landed'` to a distinct **`held:land-failed`** token and records the failure in `escalated`, so the Lead sees the land did not succeed. It sits **between** the existing `HARD_ESCALATION_REASONS` branch and the `else if (landResult.status === 'landed')` success branch, so the success/resync path is untouched.

**Rejected alternative (from the issue):** adding `'error'`/`'gate_failed'` to the `HARD_ESCALATION_REASONS` array. **Rejected** because that array is an **inline mirror of `land-decision.mjs`'s export** and is consumed by the **pre-land** `hardEscalation` computation (`escalated.some(e => HARD_ESCALATION_REASONS.includes(e.reason))`). Widening it would change pre-land semantics — a task-merge that returned `gate_failed`/`error` would flip from the intentional `held:nothing-merged` to `held:escalation`, contradicting `land-decision.test.mjs`'s design and the existing "held:nothing-merged" test. The post-land condition must be **separate** from the mirror. Using the distinct `held:land-failed` token (rather than reusing `held:escalation`) lets the Lead distinguish "the land step itself failed" from "we held because of an open task escalation."

### #115 — post-loop unrunnable-deps sweep

After the `while` loop closes and **before** the LAND section, add a sweep:

```js
for (const t of tasks) {
  if (!done.has(t.id)) {
    const deps = t.deps || []
    const missing = deps.filter(d => !tasks.some(x => x.id === d))
    escalated.push({ task: t.id, reason: 'unrunnable-deps', missingDeps: missing, deps })
    auditLog.push({ task: t.id, verdict: 'unrunnable-deps', missingDeps: missing, findings: [], requested: 0, returned: 0 })
    done.add(t.id)
  }
}
```

Any task still not in `done` after the loop is, by construction, unrunnable (it never ran and was never dep-blocked). We surface it as a **hard `unrunnable-deps` escalation**, push an `auditLog` entry (with `requested: 0`/`returned: 0`, consistent with #113), and add it to `done` so accounting is complete. The `missingDeps` field names the dep ids absent from `tasks[]` (the phantom/cross-phase culprits) for the Lead to act on.

**Making it land-blocking:** `'unrunnable-deps'` must hold the land. The cleanest seam is to add `'unrunnable-deps'` to `HARD_ESCALATION_REASONS` — and this is safe (unlike #99) because `'unrunnable-deps'` is a **scheduler-only** reason that the pre-land `decideLand`/`land-decision.mjs` mirror never produces, so widening the array here does not alter any task-merge semantics. The sweep runs **before** the `const hardEscalation = escalated.some(…)` line, so a swept task correctly forces `held:escalation`. **Placement is load-bearing:** the sweep must run after the `while` loop and before the `hardEscalation` computation in the LAND section.

---

## Decision record

- **D1 — Three serialized TDD tasks on one base.** Smallest-blast-radius ordering: #113 (trivial) lands first, then #99 (post-land demotion), then #115 (post-loop sweep). All three touch the same file; serializing avoids rebase conflicts (memory: `war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`). One task per issue.
- **D2 — `HARD_ESCALATION_REASONS` stays a faithful mirror for the pre-land path.** #99 does **not** widen it (would corrupt `held:nothing-merged` semantics); #115 **does** add `'unrunnable-deps'` (a scheduler-only reason the mirror's source never emits, so the mirror invariant is preserved). The inline comment on `HARD_ESCALATION_REASONS` ("mirrors land-decision.mjs export — keep in sync") is updated to note `'unrunnable-deps'` is a scheduler-local addition not present in `land-decision.mjs`.
- **D3 — Distinct `held:land-failed` token for #99.** Lets the Lead distinguish a failed LAND step from a pre-land escalation hold. Back-compat: the Lead's wrap-up keys on the `held:` prefix today, so a new `held:` token is non-breaking; the wrap-up servitor guard already requires `landResult.status === 'landed'`, so a demoted decision correctly skips wrap-up. (Flagged in open questions if SKILL.md exact-string-matches.)
- **D4 — Honest-zero, not consumer-side defaulting.** #113 fixes the producers (the two early-return objects), not the `auditLog.push` consumer, so future omissions surface rather than being silently masked by a `?? 0`.
- **D5 — Fail loud, don't diagnose.** #115's sweep treats every unrunnable task identically as a hard escalation; it does not try to distinguish a within-phase dep typo from a genuine cross-phase reference (it just reports `missingDeps`). Intentional: the phase terminates loud and the Lead/human adjudicates.
- **D6 — Happy path unchanged.** None of the three edits alters a phase with all tasks runnable, all merges clean, and a `landed` land result. Existing happy-path tests (`defaultImpl` / `runPhase`) must stay green.
- **D7 — Patch release v0.6.6.** Bookkeeping/correctness, no API change.

---

## Phase → task decomposition

One base branch; three serialized TDD tasks (each: failing test → fix → green). Re-anchor by construct in every task — line numbers in the issue bodies are stale.

### Phase 1 — Scheduler & land bookkeeping correctness

#### Task 1 — `expected: 0` on both blocked early-returns (#113)

**Files:** Modify `skills/war/assets/workflow-template.js` (the env-blocked and worker-blocked early-return objects in the work-wave `parallel` map); Test `skills/war/assets/workflow-template.test.mjs`.

- [ ] **Step 1 — Write failing tests (behavioral, via `runPhase`).**
  - *env-blocked path:* drive a phase where the provision-run refiner seat returns `{ ok: false, … }` for a task (mirror the existing "a failing provision step → env-blocked outcome" test setup). Assert the `auditLog` entry for that task has `requested === 0` (today it is `undefined`).
  - *worker-blocked path:* drive a phase where the `war-worker` seat returns `{ task_id, status: 'blocked', blocked_reason: … }`. Assert the `auditLog` entry for that task has `requested === 0`.
  - Mirror the assertion shape of the existing "Task 2 — auditLog records requested and returned on a persistent drop" test (`entry.requested === 3`).
- [ ] **Step 2 — Run gate → fail** (`requested` is `undefined` on both paths; `assert.equal(entry.requested, 0)` fails).
- [ ] **Step 3 — Implement.** Add `expected: 0` to the env-blocked return object (`{ task, verdict: 'env-blocked', seats: [], envOutcome: {…} }`) and to the worker-blocked return object (`{ task, verdict: 'escalate', seats: [], blocked: … }`). Leave the `auditLog.push({ …, requested: r.expected, … })` untouched.
- [ ] **Step 4 — Run gate → pass.**
- [ ] **Step 5 — Commit** — `fix(war): record requested:0 (not undefined) for env-blocked and worker-blocked tasks (#113)`

#### Task 2 — Demote `landDecision` on a failed land STEP (#99)

**Files:** Modify `skills/war/assets/workflow-template.js` (the post-land `if (landResult && HARD_ESCALATION_REASONS.includes(landResult.status)) { … }` block in the LAND section); Test `skills/war/assets/workflow-template.test.mjs`.

- [ ] **Step 1 — Write failing tests (behavioral).** Two tests, mirroring "Task 5 — land_stale holds the land":
  - land STEP returns `{ mode: 'land-phase', status: 'gate_failed' }` (worker/auditor/merge all green; only the Land seat fails). Assert `out.landDecision === 'held:land-failed'` and that `out.escalated` contains an entry with `task === 'phase-3-land'` and `reason === 'gate_failed'`.
  - land STEP returns `{ mode: 'land-phase', status: 'error' }`. Assert `out.landDecision === 'held:land-failed'` and an `escalated` entry with `reason === 'error'`.
  - (Optionally) a source-text assertion that the post-land block contains an `else if` matching `gate_failed`/`error` → `held:land-failed`, for drift resistance.
- [ ] **Step 2 — Run gate → fail** (today `landDecision` stays `'landed'`; neither branch fires).
- [ ] **Step 3 — Implement.** Insert an `else if (landResult && (landResult.status === 'error' || landResult.status === 'gate_failed')) { escalated.push({ task: \`phase-${ph.id}-land\`, reason: landResult.status, detail: landResult }); landDecision = 'held:land-failed' }` between the existing `HARD_ESCALATION_REASONS` branch and the `else if (… === 'landed')` success branch. Do **not** modify `HARD_ESCALATION_REASONS`.
- [ ] **Step 4 — Run gate → pass.** Confirm the existing `land_stale` test (still `held:escalation`) and all happy-path land tests stay green.
- [ ] **Step 5 — Commit** — `fix(war): demote landDecision to held:land-failed when the land STEP errors/gate-fails (#99)`

#### Task 3 — Post-loop unrunnable-deps sweep (#115)

**Files:** Modify `skills/war/assets/workflow-template.js` (after the `while` loop close, before the LAND `const hardEscalation = …`; and the `HARD_ESCALATION_REASONS` declaration to add `'unrunnable-deps'` + comment); Test `skills/war/assets/workflow-template.test.mjs`.

- [ ] **Step 1 — Write failing tests (behavioral).**
  - Drive a phase whose task `t2` has `deps: ['ghost']` where `ghost` is **not** in `tasks[]`, and `t1` runs and merges normally. Assert: `out.escalated` contains an entry with `task === 't2'`, `reason === 'unrunnable-deps'`, and `missingDeps` including `'ghost'`; `out.auditLog` contains a `t2` row with `verdict === 'unrunnable-deps'` and `requested === 0`; and `out.landDecision === 'held:escalation'` (the phantom-dep task holds the land — phase fails loud rather than landing APPROVED with a never-run task).
  - Negative/back-compat: a normal two-task phase with valid `deps` (the existing dep-failed and happy-path tests) still produces no spurious `unrunnable-deps` entries.
- [ ] **Step 2 — Run gate → fail** (today `t2` is silently skipped; no `unrunnable-deps` entry; loop exits and the phase can land).
- [ ] **Step 3 — Implement.**
  - Add the post-loop sweep: `for (const t of tasks) if (!done.has(t.id)) { const deps = t.deps || []; const missing = deps.filter(d => !tasks.some(x => x.id === d)); escalated.push({ task: t.id, reason: 'unrunnable-deps', missingDeps: missing, deps }); auditLog.push({ task: t.id, verdict: 'unrunnable-deps', missingDeps: missing, findings: [], requested: 0, returned: 0 }); done.add(t.id) }` — placed **after** the `while` loop's closing brace and **before** the LAND section's `hardEscalation` computation.
  - Add `'unrunnable-deps'` to `HARD_ESCALATION_REASONS`; update its inline comment to note this entry is a scheduler-local addition not present in `land-decision.mjs`'s export.
- [ ] **Step 4 — Run gate → pass.**
- [ ] **Step 5 — Commit** — `fix(war): post-loop sweep surfaces unrunnable phantom-dep tasks as hard escalations (#115)`

### Phase 2 — Release

#### Task 4 — Version bump v0.6.6 + full gate green

**Files:** `.claude-plugin/plugin.json` (`version`), `.claude-plugin/marketplace.json` (`metadata.version` AND `plugins[0].version` — both slots; stale = silent no-op release), `README.md` `## Status` (REPLACE-in-place; lineage "Builds on v0.6.5" ok).

- [ ] **Step 1 — Bump all four slots to `0.6.6`.** Per memory `release-bump-slots-canonical-no-badge`: plugin.json + marketplace.json ×2 + README `## Status` (no version badge exists). Status copy summarizes the three fixes (land-step demotion, requested:0 on blocked paths, phantom-dep sweep).
- [ ] **Step 2 — Run the full self-discovering gate** (`node --test 'skills/**/*.test.mjs'` + all `*.test.sh`) → green.
- [ ] **Step 3 — Commit** — `chore(release): v0.6.6 — scheduler & land bookkeeping correctness (#99 #113 #115)`

---

## Test plan

**Gate command (run at every Step 2/4):**
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Harness:** all new tests use the existing `runPhase(args, agentImpl)` behavioral harness in `workflow-template.test.mjs` (builds the template via `new AsyncFunction(...)`, drives it with a recording mock `agent` + faithful `parallel`, returns `{ out, calls, logs }`). Reuse `PROVISION_ARGS()` / `defaultImpl` / `seatOf` and the `isLand` predicate already defined there.

**Assertions per task:**

| Sub-item | New/strengthened test | Key assertions | Prior-art mirrored |
|---|---|---|---|
| #113 env-blocked | "requested:0 on the env-blocked path" | `auditLog` entry for the env-blocked task has `requested === 0` | "Task 2 — auditLog records requested and returned on a persistent drop" (`entry.requested === 3`); existing env-blocked test setup |
| #113 worker-blocked | "requested:0 on the worker-blocked path" | `auditLog` entry for the blocked-worker task has `requested === 0` | same |
| #99 gate_failed | "land STEP gate_failed → held:land-failed" | `out.landDecision === 'held:land-failed'`; `escalated` has `{ task:'phase-3-land', reason:'gate_failed' }` | "Task 5 — land_stale holds the land" (`landDecision === 'held:escalation'`) |
| #99 error | "land STEP error → held:land-failed" | `out.landDecision === 'held:land-failed'`; `escalated` has `reason:'error'` | same |
| #99 (drift) | source-text `else if` check (optional) | src contains the post-land `gate_failed`/`error` → `held:land-failed` branch | "Task 5 — HARD_ESCALATION_REASONS inline includes land_stale" (source `match`) |
| #115 phantom | "phantom dep → unrunnable-deps hard escalation" | `escalated` has `{ task:'t2', reason:'unrunnable-deps', missingDeps:['ghost'] }`; `auditLog` has a `t2` `unrunnable-deps` row with `requested===0`; `landDecision === 'held:escalation'` | "Task 3 — env-blocked predecessor blocks true dependent" + the dep-failed `held:escalation` tests |
| #115 back-compat | re-run existing dep-failed + happy-path tests | no spurious `unrunnable-deps` entries; happy path still `landed` | existing suite |

Regression guard: the full existing `workflow-template.test.mjs` suite (happy-path land, `land_stale`, dep-failed, env-blocked, gate-audit) must stay green after every task — these encode the semantics #99/#115 must NOT disturb (especially the `held:nothing-merged` and pre-land `held:escalation` paths the `HARD_ESCALATION_REASONS` mirror governs).

---

## Out of scope

- The F02 hazard `done-add-on-soft-failure-unblocks-true-dependents` — already fixed by the `succeeded` set + dep-block pre-check; #115 is the **complementary** phantom-dep case and does not re-open F02.
- Any change to `land-decision.mjs` or its test — the pre-land `decideLand` semantics (`held:nothing-merged` for `gate_failed`/`error` task merges) are correct and untouched. #99 is strictly post-land.
- The Lead's `SKILL.md` wrap-up consumer — no code change here; the new `held:land-failed` / `unrunnable-deps` tokens are designed to be prefix-compatible (`held:`) and additive. A SKILL.md doc note may be a follow-up (see open questions).
- Diagnosing *why* a phantom dep exists (typo vs cross-phase) — the sweep reports `missingDeps` and fails loud; root-causing is the Lead/human's job.
- Issue #112 / #114 (related issues cited in the inspections) — sibling audits, not in this group.

---

## Open questions

1. **#115 auditLog row shape** — the sweep emits both an `escalated` entry and an `auditLog` row (verdict `'unrunnable-deps'`, `requested:0`/`returned:0`). Confirm the Lead's wrap-up tolerates the new verdict string (it iterates `auditLog` for the servitor prompt).
2. **#99 token choice** — `held:land-failed` (new) vs reusing `held:escalation`. Chosen new token for Lead distinguishability; harmless if SKILL.md keys on the `held:` prefix, needs a one-line SKILL.md add if it exact-string-matches.
3. **#115 hard vs soft** — the sweep makes `unrunnable-deps` land-blocking (added to `HARD_ESCALATION_REASONS`). Confirmed safe because the pre-land `land-decision.mjs` mirror never emits it; flagged in case a future re-import of that export is contemplated.

---

## Coverage table

| Issue | Sub-item | Closed by |
|---|---|---|
| #113 | `expected:0` on env-blocked early-return → `requested:0` not `undefined` | Phase 1 · Task 1 |
| #113 | `expected:0` on worker-blocked early-return → `requested:0` not `undefined` | Phase 1 · Task 1 |
| #99 | Post-land demotion of `landDecision` to `held:land-failed` when land STEP status is `error`/`gate_failed` (distinct from pre-land `decideLand`) | Phase 1 · Task 2 |
| #115 | Post-loop sweep: any `!done.has(t.id)` task → `unrunnable-deps` hard escalation + `auditLog` entry + added to `done`; phase fails loud instead of landing APPROVED | Phase 1 · Task 3 |
| — | Patch release v0.6.6 (four canonical slots) + full gate green | Phase 2 · Task 4 |
