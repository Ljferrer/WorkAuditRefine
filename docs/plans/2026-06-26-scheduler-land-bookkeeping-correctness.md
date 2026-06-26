# WAR Scheduler & Land Bookkeeping Correctness Implementation Plan (#99 · #113 · #115)

**Goal:** make the WAR per-phase scheduler honest about three bookkeeping facts — every task either runs and is
recorded or fails **loud**; the `auditLog.requested` column is always numeric; and `landDecision` never reports
`landed` when the land STEP itself failed. Three small, independent correctness fixes to
`skills/war/assets/workflow-template.js`, each TDD-paired with a test in `workflow-template.test.mjs`.

**Closes:**
- **#99** — `landDecision` stays `landed` when the land STEP returns `error`/`gate_failed`.
- **#113** — `auditLog.requested` is `undefined` for the env-blocked / worker-blocked early-returns.
- **#115** — a phantom / out-of-phase dep silently prevents a task from ever running (no escalation; phase lands
  APPROVED with a never-run task).

**Scope (v0.6.7 — scheduler/land bookkeeping, no happy-path behavior change; PLAN 2 of the [open-issue remediation stack](2026-06-26-open-issue-remediation-roadmap.md)):**
all three are defects in the *failure / edge* accounting of the per-phase loop. None changes the happy-path land
flow; each closes a silent-wrong-or-undefined hole so the phase terminates loud instead of lying. One file
(`workflow-template.js`) + its test (`workflow-template.test.mjs`) + a one-line SKILL.md doc enumeration update.

> **Baseline-drift note (2026-06-26):** the issue bodies cite line numbers (#99 ~398-409, #113 ~230/242/281,
> #115 ~334) that drifted under prior landings. The live anchors were **re-verified by construct** for this plan
> (confirmed at HEAD): env-blocked return `:253`, worker-blocked return `:265`, `auditLog.push` `:305`, `nextWave`
> `:150`, the `while` loop `:230` (closes `:369`), `HARD_ESCALATION_REASONS` `:375`, the post-land block `:398-401`,
> the wrap-up guard `:418`. Every task re-anchors by **named construct**, never by literal line number.

**Operator decisions (2026-06-26, grill-with-docs):**
The spec's three open questions were resolved by reading `workflow-template.js` + the Lead's consumer in
`skills/war/SKILL.md` — none was architectural:
- **OQ1 (#115 auditLog row tolerated)** → **yes.** The Lead passes the whole `auditLog` to `war-servitor`
  (`SKILL.md:45`, `workflow-template.js:423` `JSON.stringify(auditLog)`) without switching on any verdict string, so
  a new `verdict:'unrunnable-deps'` row is additive and tolerated.
- **OQ2 (#99 token `held:land-failed`)** → **safe, + one doc update.** The Lead exact-matches only
  `landDecision === 'landed'` for the in-flow wrap-up (`SKILL.md:45,56`) and treats every other value as a `held:*`
  decision (prefix). `held:land-failed` is non-`'landed'` (wrap-up correctly skips — and the wrap-up guard at
  `workflow-template.js:418` independently keys on `landResult.status === 'landed'`, so the servitor cannot
  mis-fire) and carries the `held:` prefix (manual-land/escalation path covers it). **Decision: also update the
  return-value enumeration at `SKILL.md:39`** (`landed | held:escalation | held:nothing-merged`) to add
  `held:land-failed` — pulled IN-SCOPE (the spec had deferred it) because a stale enumeration is exactly the
  doc-drift the sibling plans are cleaning up. No Lead *code* change.
- **OQ3 (#115 add `unrunnable-deps` to `HARD_ESCALATION_REASONS`)** → **safe.** At the post-loop site
  `hardEscalation = escalated.some(e => HARD_ESCALATION_REASONS.includes(e.reason))` (`:376`); `unrunnable-deps` is a
  scheduler-local reason the pre-land `land-decision.mjs` mirror never emits, so widening the array here does not
  alter any task-merge semantics.
- **#99 does NOT widen `HARD_ESCALATION_REASONS`** — that array mirrors `land-decision.mjs`'s export and drives the
  pre-land `hardEscalation`; adding `error`/`gate_failed` would flip an intentional `held:nothing-merged` to
  `held:escalation`. The post-land demotion is a **separate** `else if` with a distinct token.

**Architecture:** all three sites live in the single per-phase `while` loop (`:230`) and its post-loop land/wrap-up
tail. The file is executed in a sandbox via `new AsyncFunction('agent','parallel',…, src)` (see
`workflow-template.test.mjs` `build()`), so tests drive it with a mock `agent` + faithful `parallel` and assert on
both the returned `{ landDecision, escalated, auditLog }` and the source text. No import surface — the constants
(`HARD_ESCALATION_REASONS`) are inline mirrors of `land-decision.mjs`; the mirror invariant must be preserved
(Decision D2).

**Dependency / ordering:** **plan 2 in the stack.** Shares `workflow-template.js` with **plan 4** (audit-fidelity
sweep, which only rewords the `:26` header comment — disjoint region) — **land plan 2 before plan 4.** Lands on
plan 1's tip → **v0.6.7**.

**Tech stack:** ESM `workflow-template.js`; `node --test` over `skills/**/*.test.mjs`; behavioral harness
`runPhase(args, agentImpl)` already present in `workflow-template.test.mjs`.

**Gate (for `/war`):** the self-discovering multi-runner (quote the node glob; discover bash suites):
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Source of truth:** [spec](../specs/2026-06-26-scheduler-land-bookkeeping-correctness.md). Memory:
`land-decision-not-demoted-on-land-step-failure` (#99), `auditlog-requested-undefined-for-early-returns` (#113),
`phantom-dep-silently-prevents-task-from-running` (#115), `done-add-on-soft-failure-unblocks-true-dependents` (the
F02 sibling these compose with).

## Build order (for `/war`)

One base branch; three serialized TDD tasks (smallest blast radius first), then release:
- **Phase 1 — bookkeeping correctness:** T1 (#113 `expected:0`, trivial) → T2 (#99 post-land demotion + SKILL.md
  enumeration) → T3 (#115 post-loop sweep + `HARD_ESCALATION_REASONS`).
- **Phase 2 — release:** T4 (v0.6.7).

All three edit the same file; serialize to avoid rebase conflicts (memory:
`war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`).

---

## Phase 1 — Scheduler & land bookkeeping correctness

### Task 1 — `expected: 0` on both blocked early-returns (#113)

**Files:** modify `skills/war/assets/workflow-template.js` (the env-blocked return `:253` and worker-blocked return
`:265` inside the work-wave `parallel` map); test `skills/war/assets/workflow-template.test.mjs`.

- [ ] **Step 1 — Write failing tests (behavioral, via `runPhase`).**
  - *env-blocked:* drive a phase where the provision-run refiner seat returns `{ ok: false, … }` for a task (mirror
    the existing "a failing provision step → env-blocked outcome" setup). Assert the `auditLog` entry for that task
    has `requested === 0` (today `undefined`).
  - *worker-blocked:* drive a phase where the `war-worker` seat returns `{ task_id, status:'blocked', blocked_reason }`.
    Assert the `auditLog` entry has `requested === 0`.
  - Mirror the assertion shape of "Task 2 — auditLog records requested and returned on a persistent drop"
    (`entry.requested === 3`).
- [ ] **Step 2 — Run gate → fail** (`requested` is `undefined`; `assert.equal(entry.requested, 0)` fails).
- [ ] **Step 3 — Implement.** Add `expected: 0` to the env-blocked return object (`{ task, verdict:'env-blocked',
  seats:[], envOutcome:{…} }`) and the worker-blocked return object (`{ task, verdict:'escalate', seats:[],
  blocked:… }`). Leave `auditLog.push({ …, requested: r.expected, … })` (`:305`) untouched (D4 — fix producers, not
  the consumer, so future omissions surface rather than being masked by a `?? 0`).
- [ ] **Step 4 — Run gate → pass.**
- [ ] **Step 5 — Commit** — `fix(war): record requested:0 (not undefined) for env-blocked and worker-blocked tasks (#113)`
- **Closes:** #113 (both early-return paths).

### Task 2 — Demote `landDecision` on a failed land STEP (#99) + SKILL.md enumeration

**Files:** modify `skills/war/assets/workflow-template.js` (the post-land block `:398-401` in the LAND section) and
`skills/war/SKILL.md` (the return-value enumeration `:39`); test `skills/war/assets/workflow-template.test.mjs`.

- [ ] **Step 1 — Write failing tests (behavioral), mirroring "Task 5 — land_stale holds the land":**
  - land STEP returns `{ mode:'land-phase', status:'gate_failed' }` (worker/auditor/merge all green; only the Land
    seat fails) → assert `out.landDecision === 'held:land-failed'` and `out.escalated` contains
    `{ task:'phase-<id>-land', reason:'gate_failed' }`.
  - land STEP returns `{ mode:'land-phase', status:'error' }` → `out.landDecision === 'held:land-failed'`, escalated
    `reason:'error'`.
  - Source-text drift assertion: the post-land block contains an `else if` matching `gate_failed`/`error` →
    `held:land-failed` (mirror "HARD_ESCALATION_REASONS inline includes land_stale" source `match`).
- [ ] **Step 2 — Run gate → fail** (today neither branch fires; `landDecision` stays `'landed'`).
- [ ] **Step 3 — Implement.** Insert, **between** the existing `if (landResult && HARD_ESCALATION_REASONS.includes(
  landResult.status)) { … held:escalation }` (`:398-400`) and the `else if (landResult && landResult.status ===
  'landed')` success branch (`:401`):
  ```js
  } else if (landResult && (landResult.status === 'error' || landResult.status === 'gate_failed')) {
    escalated.push({ task: `phase-${ph.id}-land`, reason: landResult.status, detail: landResult })
    landDecision = 'held:land-failed'
  }
  ```
  Do **NOT** modify `HARD_ESCALATION_REASONS` (D2). Then update `SKILL.md:39` enumeration to read
  `landed | held:escalation | held:nothing-merged | held:land-failed` (one-line doc addition; the Lead's
  `=== 'landed'` / `held:*` handling is unchanged).
- [ ] **Step 4 — Run gate → pass.** Confirm the existing `land_stale` test (still `held:escalation`) and all
  happy-path land tests stay green; the wrap-up guard (`:418`, keys on `landResult.status === 'landed'`) correctly
  skips the servitor for a demoted decision.
- [ ] **Step 5 — Commit** — `fix(war): demote landDecision to held:land-failed when the land STEP errors/gate-fails (#99)`
- **Closes:** #99.

### Task 3 — Post-loop unrunnable-deps sweep (#115)

**Files:** modify `skills/war/assets/workflow-template.js` (after the `while`-close `:369`, before the LAND
`hardEscalation` `:376`; and the `HARD_ESCALATION_REASONS` declaration `:375` + its comment); test
`skills/war/assets/workflow-template.test.mjs`.

- [ ] **Step 1 — Write failing tests (behavioral).**
  - Drive a phase whose task `t2` has `deps:['ghost']` (`ghost` not in `tasks[]`) and `t1` runs+merges normally.
    Assert: `out.escalated` has `{ task:'t2', reason:'unrunnable-deps', missingDeps:['ghost'] }`; `out.auditLog` has
    a `t2` row with `verdict:'unrunnable-deps'` and `requested === 0`; and `out.landDecision === 'held:escalation'`
    (the phantom-dep task holds the land — fails loud rather than landing APPROVED with a never-run task).
  - Back-compat: a normal two-task phase with valid `deps` (existing dep-failed + happy-path tests) produces **no**
    spurious `unrunnable-deps` entries.
- [ ] **Step 2 — Run gate → fail** (today `t2` is silently skipped; loop exits; phase can land).
- [ ] **Step 3 — Implement.**
  - Insert the sweep **after** the `while`-loop closing brace (`:369`) and **before** the LAND `hardEscalation`
    computation (`:376`) — placement is load-bearing so a swept task is counted by `hardEscalation`:
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
  - Add `'unrunnable-deps'` to `HARD_ESCALATION_REASONS` (`:375`); update its inline comment to note this entry is a
    **scheduler-local** addition not present in `land-decision.mjs`'s export (preserves the mirror invariant, D2).
- [ ] **Step 4 — Run gate → pass.**
- [ ] **Step 5 — Commit** — `fix(war): post-loop sweep surfaces unrunnable phantom-dep tasks as hard escalations (#115)`
- **Closes:** #115.

---

## Phase 2 — Release

### Task 4 — Version bump v0.6.7 + full gate green

**Files:** `.claude-plugin/plugin.json` (`version`), `.claude-plugin/marketplace.json` (`metadata.version` AND
`plugins[0].version` — both; stale = silent no-op release), `README.md` `## Status` (REPLACE-in-place; lineage
"Builds on v0.6.6" ok).

- [ ] **Step 1 — Bump all four slots to `0.6.7`.** (Memory: `release-bump-slots-canonical-no-badge`,
  `release-status-is-replace-slot-not-empty-field`.) **Roadmap-assigned** (plan 2, on plan 1's v0.6.6); take the
  next free patch if the stack order shifts. Status copy summarizes the three fixes (land-step demotion,
  `requested:0` on blocked paths, phantom-dep sweep).
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.6.7 — scheduler & land bookkeeping correctness (#99 #113 #115)`

---

## Test plan

**Gate** = the self-discovering multi-runner above; run at every Step 2/4, final green required. **Harness:** all new
tests use the existing `runPhase(args, agentImpl)` behavioral harness in `workflow-template.test.mjs` (builds the
template via `new AsyncFunction(...)`, drives a recording mock `agent` + faithful `parallel`); reuse
`PROVISION_ARGS()` / `defaultImpl` / `seatOf` / `isLand`.

| Sub-item | New/strengthened test | Key assertions | Prior-art mirrored |
|---|---|---|---|
| #113 env-blocked | requested:0 on env-blocked path | `auditLog` entry `requested === 0` | "Task 2 — auditLog records requested/returned" |
| #113 worker-blocked | requested:0 on worker-blocked path | `auditLog` entry `requested === 0` | same |
| #99 gate_failed | land STEP gate_failed → held:land-failed | `landDecision === 'held:land-failed'`; escalated `{task:'phase-<id>-land', reason:'gate_failed'}` | "Task 5 — land_stale holds the land" |
| #99 error | land STEP error → held:land-failed | `landDecision === 'held:land-failed'`; escalated `reason:'error'` | same |
| #99 drift | source `else if` check | src has post-land `gate_failed`/`error` → `held:land-failed` | "HARD_ESCALATION_REASONS inline includes land_stale" |
| #115 phantom | phantom dep → unrunnable-deps hard escalation | escalated `{task:'t2',reason:'unrunnable-deps',missingDeps:['ghost']}`; `auditLog` `t2` row `requested===0`; `landDecision==='held:escalation'` | dep-failed `held:escalation` tests |
| #115 back-compat | re-run dep-failed + happy-path | no spurious `unrunnable-deps`; happy path still `landed` | existing suite |

**Regression guard:** the full existing `workflow-template.test.mjs` suite (happy-path land, `land_stale`,
dep-failed, env-blocked, gate-audit) must stay green — these encode the `held:nothing-merged` and pre-land
`held:escalation` semantics #99/#115 must NOT disturb.

## Out of scope
- `land-decision.mjs` and its test — pre-land `decideLand` semantics (`held:nothing-merged` for `gate_failed`/`error`
  task merges) are correct and untouched. #99 is strictly post-land.
- The F02 hazard `done-add-on-soft-failure-unblocks-true-dependents` — already fixed; #115 is the complementary
  phantom-dep case and does not re-open F02.
- Diagnosing *why* a phantom dep exists (typo vs cross-phase) — the sweep reports `missingDeps` and fails loud.
- Issues #112 / #114 (sibling audits cited in the inspections) — not in this group.

## Notes / conscious deviations (ratify in `/red-team`)
- **SKILL.md:39 enumeration update pulled in-scope** (spec deferred it to a follow-up). Rationale: it's a one-line
  doc-completeness fix and a stale enumeration is the exact drift the sibling plans are sweeping. The Lead's *code*
  paths (`=== 'landed'`, `held:*`) are unchanged.
- `held:land-failed` is a NEW `held:` token; it's prefix-compatible with the Lead's escalation handling and distinct
  from `held:escalation` so a failed LAND step is distinguishable from a task-escalation hold.

## Open decisions — RESOLVED (grill-with-docs, 2026-06-26)
1. **#115 auditLog `unrunnable-deps` row** is tolerated by the Lead (servitor gets the whole `auditLog`, no
   verdict-string switch).
2. **#99 token → `held:land-failed`** (safe; Lead keys on `=== 'landed'` + `held:*` prefix); SKILL.md:39 enumeration
   updated in Task 2.
3. **#115 → add `unrunnable-deps` to `HARD_ESCALATION_REASONS`** (scheduler-local; the pre-land mirror never emits it).
4. **Version** roadmap-assigned v0.6.7 (plan 2); Release task takes the next free patch if the order shifts.
