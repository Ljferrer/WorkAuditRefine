# Submodule support, Increment 1 — the fail-closed guard (refuse-all) Implementation Plan

**Goal:** make WAR *honestly* single-repo and kill the live rubber-stamp. Today (v0.7.7) a diff that touches a
git submodule slips through three ways: the **auditor** reviews an empty/gitlink-only diff and can `approve` code it
never saw; the **worker** can edit a submodule working tree, go green, and return `completed` having committed
nothing auditable; the **refiner** can push a gitlink pointing at a commit nobody else can resolve. Increment 1 adds
a **tested shell floor** the refiner runs at merge-task (`assert-no-submodule-mutation.sh`, like
`assert-test-in-diff.sh`) plus **agent-prose ceilings** (auditor/worker/war-room), so **any** submodule touch is
**refused, loudly** — no submodule support yet. A **no-op on submodule-free repos** (no `.gitmodules`, no gitlink
ever in a diff).

**Source spec:** [`docs/specs/2026-06-29-submodule-support-design.md`](../specs/2026-06-29-submodule-support-design.md)
§4.1. **ADR:** [`0009-first-class-submodule-support.md`](../adr/0009-first-class-submodule-support.md) (the guard's
two modes; **already written + accepted**). **CONTEXT.md** terms (`Undeclared submodule touch`, `Pin-validity`,
…) are **already landed** — not in scope.

**Position in the stack:** **first of two** stacked submodule plans (Increment 1 → Increment 2), owns **v0.7.8** off
the **v0.7.7** baseline (post-L3, the landed `dev/fix-worker-result-binding` tip). Increment 2 stacks on this tip and
**relaxes** the same script from refuse-all to refuse-undeclared. Re-anchor by named construct, not line numbers
(memory `plan-line-number-refs-stale-use-construct-locator`).

## Build order (for `/war`)

- **Phase 1 — the tested floor:** T1 (`assert-no-submodule-mutation.sh` + its `.test.sh`). Independent file, no
  shared-file touch.
- **Phase 2 — the engine wiring:** T2 (`workflow-template.js` — `MERGE_RESULT.status` + merge-task prompt clause +
  refuse routing). deps T1. One-task-per-phase (shared file).
- **Phase 3 — contract prose:** T3 (`war-refiner.md` + `war-auditor.md` + `war-worker.md` + `war-room/SKILL.md` +
  `schemas.md` — disjoint files). Mirrors T2's behavior. deps T2.
- **Phase 4 — release:** T4 (v0.7.8).

## Operator decisions — RESOLVED (2026-06-30, grill-with-docs)

- **DP1 — Enforcement: a tested shell guard is the floor; agent prose is the ceiling.** The refiner runs
  `assert-no-submodule-mutation.sh` at merge-task (git-truth, deterministic, gives Plan 1 a real `.test.sh`); the
  auditor/worker prose are cheaper, earlier early-catches. *Rejected:* prose-only agent directives (zero tests; leans
  on every auditor noticing — exactly the failure mode M2's `assert-test-in-diff.sh` exists to replace).
- **DP2 — Decomposition: four tasks (script / code / prose / release), M2-shape.** One-task-per-phase for
  `workflow-template.js`.
- **DP3 — The refuse reuses the existing `escalate` HARD_ESCALATION_REASON.** Symmetric with the worker-block path
  (`workflow-template.js:273` already escalates a blocked worker via `verdict:'escalate'`, carrying the reason). So a
  submodule refuse escalates `{ reason:'escalate' }` with "submodule touch" in the detail — **no new
  `HARD_ESCALATION_REASONS` member, no `land-decision.mjs` / inline-mirror / `war-config.test.mjs` drift-guard
  cascade.** *Rejected:* a typed `submodule-touch` reason (pays the full M2 cascade for typing the detail text
  already carries). The new `MERGE_RESULT.status` is a single-enum edit (no drift-guard guards that enum).
- **DP4 — Release: +0.0.1 → v0.7.8 off v0.7.7;** four canonical slots, no badge. Next free patch by construct if the
  stack order shifts (memory `stacked-per-branch-releases-make-main-lag-cumulative`).

---

## Phase 1 — The tested floor script

### Task 1 — `assert-no-submodule-mutation.sh` + its `.test.sh` (Increment 1, shell guard)

**Files:**
- new `skills/war/assets/assert-no-submodule-mutation.sh` — `assert-no-submodule-mutation.sh <base> <branch>`:
  compute `git diff --name-status <base>...<branch>` (three-dot = exactly what the task added). Detect a **submodule
  mutation** = any **gitlink** change (a `git diff --raw` entry with mode `160000`, i.e. a `Subproject commit` move)
  **or** any changed path **under a `.gitmodules` submodule path** (cross-check via `git config -f .gitmodules
  --get-regexp '\.path$'`). Exit **1** if any mutation is present (refuse), **0** if clean, **2** on a git/ref error
  (bad ref, fatal git — mirror the exit-1-vs-2 discipline of `assert-test-in-diff.sh`, memory
  `floor-script-exit-codes-1-vs-2-route-differently`). macOS bash 3.2.57-compatible.
- new `skills/war/assets/assert-no-submodule-mutation.test.sh` — discovered by the gate's `*.test.sh` find.

**`requiresTest`: true** — the `.test.sh` is the script's mapped test (and satisfies the floor for this very task).

- [ ] **Step 1 — Write `assert-no-submodule-mutation.test.sh` (failing first).** Cases, in a temp git repo fixture
  with a real submodule (memory `relative-path-test-needs-clean-cwd` — `cd $(mktemp -d)` before each case so a
  relative-path case can't false-allow from a dirty cwd): **gitlink bump** in the diff → exit 1; a **content change
  under a `.gitmodules` path** → exit 1; a **clean superproject-only diff** → exit 0; a **bad ref** → exit 2 (not 1);
  an **empty diff** → exit 0; **`..`/traversal safe**. Assert the exit codes are distinct (1 vs 2 is the correctness
  boundary). A repo with **no `.gitmodules`** and a normal diff → exit 0 (the no-op case).
- [ ] **Step 2 — Run `bash assert-no-submodule-mutation.test.sh` → fail** (script absent).
- [ ] **Step 3 — Implement the script** (bash 3.2). Gitlink-mode detection (`git diff --raw`, field for mode
  `160000`) + `.gitmodules`-path cross-check; exit 1/0/2. `// ponytail:`-style comment naming the refuse-all stance
  and that Increment 2 relaxes it via a `--declared` flag (named, not built here).
- [ ] **Step 4 — Run the full self-discovering gate → green.**
- [ ] **Step 5 — Commit** — `feat(war): tested assert-no-submodule-mutation.sh floor — refuse any submodule mutation in a task diff (Increment 1)`
- **Closes:** the floor mechanism (spec §4.1). T2 wires the refiner to run it.

---

## Phase 2 — Engine wiring

### Task 2 — `workflow-template.js`: run the floor at merge-task, refuse → immediate escalate (Increment 1, code)

**Files:**
- modify `skills/war/assets/workflow-template.js` — (a) `MERGE_RESULT.status` enum (the construct at `:46`) gains a
  refuse status `submodule-blocked`; (b) the **merge-task prompt** (the construct around `:332`, beside the
  `assert-test-in-diff.sh` clause) gains: *before the `_refinery` merge, run `assert-no-submodule-mutation.sh
  <integrationBranch> <taskBranch>`; exit 1 → return `{ mode:'merge-task', status:'submodule-blocked' }` (do **not**
  merge); exit 2 → `status:'error'`*. This runs **regardless of `requiresTest`** (a submodule touch is refused whether
  or not the task needs a test — distinct from the test-floor, which is `requiresTest`-gated). (c) the **REFINE
  section** routes a `submodule-blocked` merge result to an **immediate hard escalate** `{ reason:'escalate',
  detail:'<task> touches a submodule; WAR is single-repo as of v0.7.8' }`, **0 fix rounds** (no fix in refuse-all
  mode — like `env-blocked`), **not** the no-test fix-loop.
- test `skills/war/assets/workflow-template.test.mjs` — behavioral test via the `buildSeqImpl` harness (memory
  `buildseqimpl-harness-for-multi-call-lens-tests` — fresh instance per test).

**`requiresTest`: true.** **deps:** T1 (the refiner invokes the script).

- [ ] **Step 1 — Write failing tests.** *Test 1 — submodule refuse escalates immediately (RED→GREEN).* Drive a task
  whose merge-task returns `status:'submodule-blocked'`; assert the phase **escalates on that round** with a reason
  carrying the submodule detail, **0 fix-worker dispatches** (assert the fix-loop did **not** run — memory
  `weak-test-assertion-passes-without-feature-being-exercised`, assert on a unique token). *Test 2 — `escalate` is
  the reason, no cascade.* Assert the escalation rides the existing `escalate` member and that
  `land-decision.mjs` / the `war-config.test.mjs:356` drift-guard are **untouched and green** (DP3).
- [ ] **Step 2 — Run gate → fail** (no `submodule-blocked` status / routing exists).
- [ ] **Step 3 — Implement (minimal).** Add the status enum value, the merge-task prompt clause, and the
  escalate-on-`submodule-blocked` routing. Re-anchor by **named construct** (the `MERGE_RESULT` object, the merge-task
  prompt string, the REFINE section), not line numbers. **Reuse `escalate`** — do **not** touch
  `HARD_ESCALATION_REASONS` / `land-decision.mjs` / the drift-guard.
- [ ] **Step 4 — Run gate → pass.** New tests green; the whole `node --test 'skills/**/*.test.mjs'` suite + every
  `*.test.sh` runner stay green (the change is additive; the no-test sub-loop and happy-path merge are unchanged).
- [ ] **Step 5 — Commit** — `feat(war): refuse a submodule-touching task at merge-task → immediate escalate (Increment 1)`
- **Closes:** the enforcement + routing (spec §4.1). The auditor/worker/war-room ceilings are T3.

---

## Phase 3 — Contract prose

### Task 3 — refiner step + auditor lens + worker block + war-room warning + schemas status (Increment 1, docs/prose)

**Files (disjoint from T2 — no shared-code touch):**
- modify `agents/war-refiner.md` — merge-task **step 5** (after the test-floor step 4): run
  `assert-no-submodule-mutation.sh <integrationBranch> <taskBranch>` in `<taskWorktree>`; **exit 1** →
  `status:"submodule-blocked"` (do **not** merge); **exit 2** → `status:"error"` (mirror the step-4 exit-1-vs-2
  wording).
- modify `agents/war-auditor.md` — the **gitlink-only-diff refuse** (early-catch ceiling): if the computed diff is
  empty-but-for, or contains a `Subproject commit` (gitlink) line, or shows submodule "modified content", emit a
  **Critical** finding → `request_changes` ("WAR cannot audit submodule contents; refuse"). Anchor by the lens /
  diff-computation construct.
- modify `agents/war-worker.md` — a **submodule-path pre-flight block**: before implementing, if the task's target
  path resolves under a `.gitmodules` submodule path, return `status:"blocked"` with a `blocked_reason` naming the
  submodule — **never** the empty/false-success commit. (Binds via L3's `blockedReason` at the dispatch site.)
- modify `skills/war-room/SKILL.md` — an **overlap warning**: at config time, if any plan target overlaps a
  `.gitmodules` submodule path, surface a setup warning ("task X targets inside submodule Y; WAR is single-repo as of
  v0.7.8 — do that change by hand, or wait for Increment 2").
- modify `skills/war/references/schemas.md` — document the new `MERGE_RESULT.status` value `submodule-blocked` in the
  Task-outcome union / `MergeResult.status` (mirror the `no-test` row).

**`requiresTest`: false** — prose/contract only; no executable surface (no `.mjs/.js`, no `*.test.sh` reads these).
**deps:** T2 (mirrors the final behavior).

- [ ] **Step 1 — (no behavioral test — prose; YAGNI on tests for `.md`/schemas prose.)**
- [ ] **Step 2 — Implement (prose).** Add the refiner step, auditor lens, worker block, war-room warning, schemas
  row. Anchor by named construct.
- [ ] **Step 3 — Run the full self-discovering gate → green** (no executable surface touched).
- [ ] **Step 4 — Commit** — `docs(war): refiner/auditor/worker/war-room submodule-refuse contracts + schemas status (Increment 1)`
- **Closes:** the contract surface (spec §4.1 ceilings).

---

## Phase 4 — Release

### Task 4 — Version bump v0.7.8 + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version` **and**
`plugins[0].version` — both; a stale slot is a silent no-op release); `README.md` `## Status` (REPLACE-in-place;
"Builds on v0.7.7"). **No badge.**

- [ ] **Step 1 — Bump all four slots `0.7.7` → `0.7.8`** (memory `release-bump-slots-canonical-no-badge`,
  `release-status-is-replace-slot-not-empty-field`, `version-slots-no-cross-slot-consistency-test` — no automated
  cross-slot check, verify all four by hand). Next free patch by construct if the stack order shifts. Status copy:
  fail-closed submodule guard — tested `assert-no-submodule-mutation.sh` floor + auditor/worker/refiner/war-room
  refuse; WAR honestly single-repo.
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.7.8 — fail-closed submodule guard (Increment 1)`

---

## Test plan

**Gate** = the self-discovering multi-runner. Run at every Step fail/pass, final green required:
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

| Task | Test | Key assertion | Notes |
|---|---|---|---|
| T1 | `assert-no-submodule-mutation.test.sh` | gitlink/submodule-path change → exit 1; clean → 0; bad ref → 2; no-`.gitmodules` repo → 0 | new `*.test.sh`; temp-repo + submodule fixture, clean cwd |
| T2 #1 | submodule refuse escalates | merge-task `submodule-blocked` → immediate escalate, **0 fix dispatches** | unique token; not the no-test loop |
| T2 #2 | reuse `escalate`, no cascade | escalation rides `escalate`; `land-decision.mjs` + drift-guard untouched & green | DP3 |
| T3 | (no test — prose) | full gate green | criteria verified by review |

**Validation criteria (spec §12, Increment 1):** #1 auditor refuses a gitlink-only diff (T3 prose) · #2 worker blocks
a submodule-path target (T3 prose) · #3 refiner refuses an unresolvable/any submodule mutation (T1 + T2) · #4 no-op
on a submodule-free repo (T1 no-`.gitmodules` case + gate green) · #5 war-room overlap warning (T3 prose).

**Regression guard:** the existing `workflow-template.test.mjs` + `war-config.test.mjs` + every `*.test.sh` stay
green — T2 is additive (status enum + a refuse branch), `HARD_ESCALATION_REASONS`/`land-decision.mjs` untouched,
T3 touches no executable surface.

## Recommended ADRs

**None new.** [`ADR-0009`](../adr/0009-first-class-submodule-support.md) (the guard's two modes — increment 1 =
refuse-all) is **already written + accepted**. This plan implements its first mode.

## Out of scope / Deferred

- **Increment 2 (first-class support)** — the relax to refuse-undeclared, submodule-as-repo phases, 2A/2B landing,
  `held:submodule-pr`, gh-resume — is the **next stacked plan** (`2026-06-30-submodule-support-increment-2-first-class.md`,
  v0.7.9 on this tip).
- **The landDecision prose-enum drift-guard** — tracked as a separate finding ([#271](https://github.com/Ljferrer/WorkAuditRefine/issues/271)); not this plan.
- **`HARD_ESCALATION_REASONS` / `land-decision.mjs` unchanged** (DP3) — the refuse reuses `escalate`; no
  mirrored-constant cascade.
- **No GitHub issue filed for the plan tasks** — `/war` files the phase epic + task sub-issues at decompose (memory
  `war-execution-must-file-issues`).

## Coverage

| Surface | Coverage |
|---|---|
| **Increment 1 (spec §4.1)** | **full** — tested `assert-no-submodule-mutation.sh` floor (T1) + refiner runs it at merge-task → `submodule-blocked` → immediate `escalate`, 0 fix rounds (T2, reuse `escalate`, no cascade) + auditor/worker/war-room ceilings + schemas status (T3). No-op on submodule-free repos. ADR-0009 + CONTEXT terms already landed. |
