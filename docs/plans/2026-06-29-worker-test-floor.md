# Worker test-floor — a deterministic "this task added a test" guard Implementation Plan (audit finding M2)

**Goal:** add a **single deterministic floor** so test-presence is not "every auditor must independently notice the
diff has no test." Today a worker can write **zero tests**, leave the inherited suite green, pass the refiner's gate
(which proves the *suite* is green, not that *this slice* added a test), and the only floor is N parallel auditors
each catching the omission. The fix is WAR's own idiom: a **tested shell guard** (`assert-test-in-diff.sh`, like
`validate-auditor-git.sh` / `provision-worktrees.sh`) the **refiner runs at merge-task, pre-merge**; a `no-test`
result routes a **bounded fix-worker + full re-audit** (the coarse floor can't tell a real test from a vacuous one,
the panel can) and escalates only on `roundLimit` exhaustion.

**Source spec:** [`docs/specs/2026-06-29-worker-test-floor-design.md`](../specs/2026-06-29-worker-test-floor-design.md).
**ADR:** [`0006-deterministic-test-floor.md`](../adr/0006-deterministic-test-floor.md) (**already written +
accepted**). **CONTEXT.md** terms (Test floor / `requiresTest` / `no-test`) are **already landed** (verified present in CONTEXT.md
§ glossary — the spec §4 "add on ratification" row is stale, not a missing surface) — not in scope.

**Floor vs ceiling** is the organizing idea: the script is the deterministic *floor* (a test file exists in the
diff); the auditor panel is the semantic *ceiling* (right test, exercises the slice, not weakened/skipped). M2 adds
the floor and leaves the ceiling where it is.

**Position in the stack:** M2 is **second** (after M1, on M1's tip), owns **v0.7.4** off the v0.7.3 baseline. M2
touches `workflow-template.js` (the REFINE sub-loop + inline `HARD_ESCALATION_REASONS` mirror), so it re-anchors on
M1's tip by named construct (memory `plan-line-number-refs-stale-use-construct-locator`). **M2 must land before L3** —
M2's §3.3 no-test fix-worker is a dispatch site L3's shared `blockedReason` predicate will retrofit.

## Build order (for `/war`)

- **Phase 1 — the floor:** T1 (the tested shell script — independent, no shared-file touch).
- **Phase 2 — the integration:** T2 (ALL `workflow-template.js` edits + the atomic mirrored-constant cascade +
  tests). Depends on T1 (the refiner invokes the script).
- **Phase 3 — the contract prose:** T3 (`war-refiner.md` + SKILL.md + schemas.md — disjoint files). Mirrors T2's
  final behavior; depends on T2.
- **Phase 4 — release:** T4 (v0.7.4).

One-task-per-phase for the shared-file work (memory
`war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`): T2 is the only task touching
`workflow-template.js`, so the atomic cascade + sub-loop land in one diff with no intra-plan contention.

## Operator decisions — RESOLVED (2026-06-29, grill-with-docs)

- **DP1 — Decomposition: three tasks (script / code / prose).** Forced by two constraints: (a) **same-file
  serialization** — the sub-loop, `MERGE_RESULT.status`, and the inline `HARD_ESCALATION_REASONS` mirror all touch
  `workflow-template.js`, so they cannot be split across parallel tasks; (b) **the mirrored-constant cascade** — `no-test`
  must atomically hit `land-decision.mjs` + the inline mirror + the `war-config.test.mjs` drift-guard, or the
  drift-guard goes red between commits (memory `plan-file-list-incomplete-when-drift-guard-forces-cascade`,
  `plan-array-literal-lags-canonical-export`). So all `workflow-template.js`/mirror/drift-guard work is **one task
  (T2)**; the script is independent (T1); the contract prose is disjoint files (T3). *Rejected:* two tasks (a 7-file
  audit unit); four+ (same-file rebase conflicts + a transiently-red drift-guard).
- **DP2 — Release: +0.0.1 → v0.7.4, implemented in order** (after M1's v0.7.3). Take next free patch by construct if
  the stack order shifts (memory `stacked-per-branch-releases-make-main-lag-cumulative`).

---

## Phase 1 — The tested floor script

### Task 1 — `assert-test-in-diff.sh` + its `.test.sh` (M2, shell guard)

**Files:**
- new `skills/war/assets/assert-test-in-diff.sh` — `assert-test-in-diff.sh <integration-base> <task-branch>
  [--repo <git-dir>] [--pattern <glob-set>]` (spec §3.1): compute `git diff --name-only <base>...<branch>` (three-dot = exactly what
  the task added); exit **0** if ≥1 changed path matches the test pattern, **non-zero** (with matched/empty summary
  on stdout) otherwise. **Default pattern** = EXACTLY the resolved gate's test-discovery set (**operator decision
  2026-06-29** — supersedes the spec §3.1 broad union, which red-team proved over-counts): `skills/**/*.test.mjs`
  (the node `--test` glob, **path-scoped to `skills/`**) **and** `**/*.test.sh` (the repo-wide bash-suite `find`). The
  floor **mirrors the gate** so it can never be satisfied by a test the gate ignores (no over-count); the gate's
  discovery is `war-config.mjs` `resolveGate` (the declared `node --test 'skills/**/*.test.mjs'` base + the appended
  `*.test.sh` find). Overridable via `run.testPattern` for repos whose gate runs other types (`.test.js`/pytest).
  macOS bash 3.2.57-compatible (like the other guards).
- new `skills/war/assets/assert-test-in-diff.test.sh` — discovered by the gate's `*.test.sh` find.

**`requiresTest`: true** — the `.test.sh` is the script's mapped test (and satisfies the floor for this very task).

- [ ] **Step 1 — Write `assert-test-in-diff.test.sh` (failing first).** Cases (spec §8.6): test present in diff →
  exit 0; diff with no test → non-zero + empty-summary on stdout; **exempt path never invoked** (covered at the
  refiner layer, but assert the script itself is a pure present/absent check); `..`/empty-diff safety (no traversal,
  empty diff → non-zero, not a crash). **Pattern-alignment case (an EQUALITY, per the narrowed default):** assert the
  default pattern is **exactly** the gate's discovery set — `skills/x/foo.test.mjs` → match, `**/bar.test.sh` → match;
  and the **over-count guards**: a root `foo.test.mjs` (outside `skills/`), a `foo.test.js`, a `test_foo.py` → **NO
  match** (the gate would not run them, so the floor must not either). This closes the over-count hole (memory
  `node-breadth-assertion-test-js-overclaims` — the floor mirrors the gate, neither under- nor over-count; that fix
  narrowed the node walk to the gate's glob and this floor follows suit). Use a temp git repo fixture (memory
  `relative-path-test-needs-clean-cwd` — `cd $(mktemp -d)` before running, so a relative-path case can't false-allow
  from a dirty cwd).
- [ ] **Step 2 — Run `bash assert-test-in-diff.test.sh` → fail** (script absent).
- [ ] **Step 3 — Implement the script** (minimal, bash 3.2). Three-dot diff; glob-match loop; non-zero + summary on
  miss. `// ponytail:`-style comment naming the default-pattern/gate-alignment ceiling and the `run.testPattern`
  override path.
- [ ] **Step 4 — Run the full self-discovering gate → green.**
- [ ] **Step 5 — Commit** — `feat(war): tested assert-test-in-diff.sh floor guard — diff must touch ≥1 test file (M2)`
- **Closes:** the floor mechanism (spec §3.1). T2 wires the refiner to run it.

---

## Phase 2 — The Workflow / refiner integration + atomic cascade

### Task 2 — `no-test` REFINE sub-loop + `HARD_ESCALATION_REASONS += no-test` (both mirrors + drift-guard) (M2, code)

**Files (one atomic diff — same-file serialization + the mirrored-constant cascade):**
- modify `skills/war/assets/workflow-template.js` — (a) `MERGE_RESULT.status` enum gains `no-test`; (b) the REFINE
  section gains the §3.3 **localized sub-loop** (on a merge-task `no-test`: if `task.fixRounds < roundLimit` →
  fix-worker adds the mapped test in the same worktree, `task.fixRounds++`, **re-run the FULL audit panel** for this
  task, on approve re-attempt the serial merge, else escalate its verdict; on budget exhaustion → escalate
  `{ reason:'no-test' }`); (c) **carry the audit-loop `round` onto the task object as `task.fixRounds`** so the serial
  refine sub-loop continues the **shared** budget (a fresh counter would double the allowance). **The audit phase's
  `round` is currently a LOCAL variable that is NOT returned** (the audit closure returns `{ task, verdict, seats,
  expected }`); add `round` to that return object and set `r.task.fixRounds = r.round ?? 0` in the REFINE section
  before the no-test sub-loop — without this the carry has **no source value** (red-team-confirmed). Also **expose
  `task.fixRounds` on each task's `auditLog` entry** (`auditLog.push({ …, fixRounds })`) so the shared-budget carry is
  test-observable (the harness `out`/`auditLog` is the only test-visible surface; an internal counter is invisible);
  (d) the **inline `HARD_ESCALATION_REASONS` mirror** gains `no-test`; (e) thread `requiresTest` into the merge-task
  dispatch so the refiner knows whether to run the script.
- modify `skills/war/assets/land-decision.mjs` — the **canonical `HARD_ESCALATION_REASONS`** gains `no-test`.
- modify `skills/war/assets/war-config.test.mjs` — the **drift-guard** (deepEqual of the two mirrors) updated to the
  new member set (memory `plan-array-literal-lags-canonical-export` — the canonical export is ground truth; the
  inline literal must match or the deepEqual goes red).
- test `skills/war/assets/workflow-template.test.mjs` — the no-test sub-loop behavior (criteria §8.1,4,5) via the
  `runPhase`/`buildSeqImpl` harness (memory `buildseqimpl-harness-for-multi-call-lens-tests`).

**`requiresTest`: true.** **deps:** T1 (the refiner invokes `assert-test-in-diff.sh`).

- [ ] **Step 1 — Write failing tests.**
  - *Test 1 — zero-test catch routes a fix + re-audit (§8.1,4).* Drive a task whose refiner merge-task returns
    `status:'no-test'`; assert the Workflow dispatches a **fix-worker** then **re-runs the full audit panel** for that
    task (assert the panel seats re-spawn), then re-attempts merge. Assert a **vacuous** added test (re-audit returns
    a finding) does **not** merge — it escalates. Assert on unique tokens (memory
    `weak-test-assertion-passes-without-feature-being-exercised`).
  - *Test 2 — shared budget (§8.5).* Audit-phase fixes + no-test fixes together ≤ `roundLimit`; exhaustion →
    escalate `{ reason:'no-test' }`, phase holds (`landDecision` reflects the hard escalation). Prove `task.fixRounds`
    carries from the audit loop (a task that used its budget in audit has none left for no-test) — **observe the carry
    via the `auditLog[].fixRounds` field exposed in Files (c)** (it is not otherwise visible in the harness `out`).
  - *Test 2b — `requiresTest:false` bypass.* A `requiresTest:false` task routes straight to merge — the refiner
    **never returns `no-test`** and the sub-loop never fires (assert no fix-worker / re-audit re-spawn for that task).
  - *Test 3 — drift-guard.* Extend the `war-config.test.mjs` assertion so the two `HARD_ESCALATION_REASONS` mirrors
    are equal **including `no-test`** (memory `relaxed-assertion-test-title-must-update-together` — if the assertion
    semantics change, rename the test title in the same commit).
- [ ] **Step 2 — Run gate → fail.** No `no-test` status/sub-loop exists; the drift-guard fails once the canonical
  export gains `no-test` and the inline mirror lags (proving the cascade is load-bearing).
- [ ] **Step 3 — Implement (one atomic diff).** Add `no-test` to **both** `HARD_ESCALATION_REASONS` mirrors **and**
  update the drift-guard in the **same commit** (never leave the deepEqual red between commits). Add the sub-loop +
  `MERGE_RESULT.status` + the `task.fixRounds` carry + the `requiresTest` thread. Re-anchor by **named construct**
  (the REFINE section, the `MERGE_RESULT` object, the `HARD_ESCALATION_REASONS` array literal), not line numbers.
- [ ] **Step 4 — Run gate → pass.** New tests green; the whole node suite + every `*.test.sh` stay green.
- [ ] **Step 5 — Commit** — `feat(war): no-test merge outcome → bounded fix + full re-audit; HARD_ESCALATION_REASONS += no-test (both mirrors + drift-guard) (M2)`
- **Closes:** the floor enforcement + routing (spec §3.3). The serial merge queue is preserved — the re-audit is a
  localized sub-loop, **not** folded back into the parallel work wave.

---

## Phase 3 — Contract prose

### Task 3 — refiner merge-task step order + `requiresTest` decompose + schemas (M2, docs/prose)

**Files (disjoint from T2 — no shared-code touch):**
- modify `agents/war-refiner.md` — merge-task step order (spec §3.2): after rebase + gate, **before** the `_refinery`
  merge, if `requiresTest` run `assert-test-in-diff.sh <integrationBranch> <taskBranch>`; non-zero → return
  `status:'no-test'` (do **not** merge); zero or exempt → merge as today.
- modify `skills/war/SKILL.md` — Decompose step: set `requiresTest` per task (default `true`; `false` for
  docs/config/VERIFY-no-op). Invariants: note the deterministic test-floor as the **refiner's** responsibility
  (standing-instruction surface; memory `standing-instruction-vs-dispatched-prompt-coverage-split` — this `.md` is
  independent of the dispatched merge-task prompt threaded in T2).
- modify `skills/war/references/schemas.md` — Task shape gains `requiresTest:bool`; `MergeResult.status` gains
  `no-test`.

**`requiresTest`: false** — prose/contract only; no executable surface. **deps:** T2 (mirrors the final behavior).

- [ ] **Step 1 — (no behavioral test — prose; YAGNI on tests for `.md`/schemas prose.)**
- [ ] **Step 2 — Implement (prose).** Add the refiner step order, the decompose rule, and the schema fields. Anchor
  by named construct.
- [ ] **Step 3 — Run the full self-discovering gate → green** (no executable surface touched).
- [ ] **Step 4 — Commit** — `docs(war): refiner merge-task test-floor step + requiresTest decompose + schemas (no-test, requiresTest) (M2)`
- **Closes:** the contract surface (spec §3.2, §4 prose rows).

---

## Phase 4 — Release

### Task 4 — Version bump v0.7.4 + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version` **and**
`plugins[0].version`); `README.md` `## Status` (REPLACE-in-place; "Builds on v0.7.3"). **No badge.**

- [ ] **Step 1 — Bump all four slots `0.7.3` → `0.7.4`** (memory `release-bump-slots-canonical-no-badge`,
  `release-status-is-replace-slot-not-empty-field`, `version-slots-no-cross-slot-consistency-test` — verify all four
  by hand). Take next free patch by construct if the stack order shifts. Status copy: deterministic worker test-floor
  — `assert-test-in-diff.sh` at merge-task + `no-test` bounded fix + full re-audit.
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.7.4 — deterministic worker test-floor (M2)`

---

## Test plan

**Gate** = the self-discovering multi-runner:
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

| Task | Test | Key assertion | Notes |
|---|---|---|---|
| T1 | `assert-test-in-diff.test.sh` | present→exit 0; absent→non-zero+summary; `..`/empty-diff safe; default pattern **equals** the gate's globs (`skills/**/*.test.mjs` + `**/*.test.sh`), and over-count cases (`.test.js`, root `.test.mjs`, pytest) do **NOT** match | new `*.test.sh`; temp-repo fixture, clean cwd |
| T2 #1 | no-test → fix + full re-audit | refiner `no-test` → fix-worker + panel re-spawn → re-merge; vacuous test → escalate, no merge | unique tokens |
| T2 #2 | shared budget | audit + no-test fixes ≤ `roundLimit`; exhaustion → `{reason:'no-test'}` hold; `task.fixRounds` carries | proves carry, not fresh counter |
| T2 #3 | drift-guard | both `HARD_ESCALATION_REASONS` mirrors equal **incl. `no-test`** | rename test title with the semantics change |
| T3 | (no test — prose) | full gate green | criteria verified by review |

**Validation criteria (spec §8):** #1 zero-test caught (T2#1) · #2 exempt passes, script never invoked (T1 + T3
prose) · #3 floor is git-truth not self-report (T1 — script reads the real diff) · #4 fix-then-full-re-audit, vacuous
test caught (T2#1) · #5 shared budget, exhaustion holds (T2#2) · #6 script independently tested (T1).

**Regression guard:** the existing `workflow-template.test.mjs` + `war-config.test.mjs` + every `*.test.sh` stay
green. The cascade commit (T2 Step 3) keeps the drift-guard green by updating both mirrors **and** the deepEqual in
one commit.

## Recommended ADRs

**None new.** [`ADR-0006 — deterministic test-floor`](../adr/0006-deterministic-test-floor.md) is **already written +
accepted**, ratifying decisions 1/2/3/4/6 (coarse floor, tested-script enforcement, refiner placement, fail-closed
exemption, full-re-audit). This plan implements it.

## Out of scope / Deferred

- **L3's `blockedReason` retrofit of the no-test fix-worker** — M2 builds the no-test fix-worker dispatch (T2 §3.3);
  **binding its result via the shared `blockedReason` predicate is L3's scope** (L3 lands after M2 and unifies all
  worker-dispatch sites — spec L3 §3 table, §4). M2's dispatch is written so L3 can cleanly bind the result; M2 does
  **not** pre-build the predicate.
- **Precise per-task test mapping (`mappedTests`)** — rejected (decision 1); coarse floor + auditor ceiling instead.
- **Test strength / non-vacuity in code** — not code-gateable; stays the auditor's semantic ceiling (the full
  re-audit in decision 6 guards it).
- **Trusting the worker's self-reported `files_changed`** — rejected (constraint 1, circular). `WORKER_RESULT.tests`
  / `acceptance_criteria_covered` stay advisory; the floor reads the real git diff. (A rename so they don't read as
  verified is the audit's residual, not this plan.)
- **A pre-audit dedicated check-seat** — rejected (decision 3); the refiner runs the floor, no spawn per task.
- **Same-file serialization with M1 (landed) / L3 (later)** — only T2 touches `workflow-template.js`; it re-anchors
  on M1's tip by named construct; L3 re-anchors on M2's.
- **No GitHub issue filed** — plan-docs only; finding id is the audit's **M2**.

## Coverage

| Finding | Coverage |
|---|---|
| **M2** | **full** — tested `assert-test-in-diff.sh` floor (T1) + refiner runs it at merge-task → `no-test` bounded fix + full re-audit + `HARD_ESCALATION_REASONS += no-test` (both mirrors + drift-guard) on exhaustion (T2) + `requiresTest` decompose / refiner step-order / schemas (T3). ADR-0006 + CONTEXT terms already landed. |
