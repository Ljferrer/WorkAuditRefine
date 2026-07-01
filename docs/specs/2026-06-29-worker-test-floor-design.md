# Worker test-floor — a deterministic "this task added a test" guard

**Status:** proposed (design) — from the 2026-06-29 agent-architecture audit (finding M2), resolved by grilling

A worker returns a `WorkerResult` and the Workflow accepts it on `if (!impl || impl.status === 'blocked')` ([`workflow-template.js:264`](../../skills/war/assets/workflow-template.js#L264)) — a *status enum*, with no check that a test was written. `WORKER_RESULT` requires only `task_id`+`status`; `tests` is an optional object with no non-empty constraint ([`:30-34`](../../skills/war/assets/workflow-template.js#L30)). So a worker can write **zero tests**, leave the inherited suite green (the refiner's gate proves the *suite* is green, not that *this slice* added a test), pass the gate, and the **only** floor is N parallel auditors each independently noticing the diff has no test ([`war-auditor.md:25`](../../agents/war-auditor.md#L25)). M2 asks for a **single deterministic floor** so test-presence is not "every auditor must catch it."

## 1. Context — two hard constraints

1. **The Workflow sandbox has no shell/fs** ([`:18`](../../skills/war/assets/workflow-template.js#L18)) — it cannot run `git diff`. Any check against the real diff must run inside an agent with shell. The only thing the Workflow inspects directly is the worker's **self-reported** `files_changed`, which is exactly the field a test-skipping worker would get wrong — so a Workflow-side self-report check is circular and not load-bearing.
2. **Some tasks legitimately have no test** — docs, config, and the VERIFY-no-op case (memory: `verify-task-no-op-is-correct-when-already-covered`). The floor must not false-positive on those.

The resolution to constraint 1 is WAR's own idiom: a **tested shell guard** (like [`validate-auditor-git.sh`](../../hooks/validate-auditor-git.sh) and [`provision-worktrees.sh`](../../skills/war/assets/provision-worktrees.sh), each with a `.test.sh`). The *script* is the code-enforcement; the agent that invokes it is a thin runner. This sidesteps the trap that "an LLM instructed to check is still prompt-deep."

## 2. Resolved design tree

| # | Decision | Choice | Rejected alternative |
|---|---|---|---|
| 1 | Granularity | **Coarse** — assert the diff touches ≥1 test file. The floor catches "zero tests"; the auditor keeps the semantic ceiling (right test, strong enough, un-skipped) | Precise (the specific mapped test) — needs a structured per-task `mappedTests` field; plans name test paths only as free-text |
| 2 | Enforcement | **A tested `assert-test-in-diff.sh`** (deterministic code + its own `.test.sh`) | A prompt instruction to "check for a test" (still prompt-deep); a Workflow-side self-report check (circular — constraint 1) |
| 3 | Placement | **Refiner runs it at merge-task**, alongside the gate, pre-merge. Reuses the existing shell-capable agent; no new agent type, no extra spawn | A dedicated pre-audit seat (one spawn per task per round); the worker self-checking (same trust gap as the omission) |
| 4 | Exemption | **New per-task `requiresTest` boolean, default `true` (fail-closed)**; the Lead sets it `false` at decompose for docs/config/verify-no-op, threaded to the refiner → the script | Infer exemption from diff paths (fragile, implicit); no exemption (false-positives the VERIFY-no-op + docs tasks) |
| 5 | Failure routing | **Bounded fix-worker, then escalate** — `no-test` routes a fix, not an immediate hard halt | Immediate hard-escalate (simpler, but halts on a trivially-fixable omission) |
| 6 | Re-verify scope | **Full audit panel re-runs** after the fix (the coarse floor can't tell a real test from a vacuous one; the panel can), shared `roundLimit` budget, escalate on exhaustion | Re-run only floor + gate (re-opens green-by-weak-test — a worker adds `test_nothing(): pass` to satisfy the coarse floor) |

**Floor vs ceiling is the organizing idea:** the script is a deterministic *floor* (a test file exists in the diff); the auditor panel is the semantic *ceiling* (it is the right test, exercises the slice, is not weakened/skipped). M2 is a floor gap; this spec adds the floor and leaves the ceiling where it is.

## 3. Mechanics

### 3.1 The assertion script

`assets/assert-test-in-diff.sh <integration-base> <task-branch> [--repo <git-dir>] [--pattern <glob-set>]`:
- Computes the task's change set: `git diff --name-only <integration-base>...<task-branch>` (three-dot = exactly what the task added).
- Exits **0** if ≥1 changed path matches the test pattern; exits **non-zero** (with the matched/empty summary on stdout) otherwise.
- The refiner **skips** invocation entirely when the task is `requiresTest:false` (exempt) — the script itself is only ever run for tasks that require a test.
- **Pattern** defaults to the repo's gate notion of a test — the union of `*.test.mjs`, `*.test.js`, `*.test.sh`, and pytest `test_*.py` / `*_test.py`. It **must stay aligned with what the resolved gate actually runs** (else a task could add a "test" the gate ignores, or vice versa); the default is documented, overridable via `run.testPattern` only if a repo's convention differs (no new *required* mirror — it is a default, not a hand-copied constant).
- macOS bash 3.2.57-compatible, like the other guards.

### 3.2 Refiner merge-task change ([`war-refiner.md`](../../agents/war-refiner.md), step order)

After the rebase + gate, **before** the `_refinery` merge: if `requiresTest`, run `assert-test-in-diff.sh <integrationBranch> <taskBranch>`. On non-zero → return `status: "no-test"` (do **not** merge). On zero (or exempt) → proceed to merge as today.

### 3.3 Workflow control flow ([`workflow-template.js`](../../skills/war/assets/workflow-template.js) REFINE section, ~`:303-335`)

The serial merge queue is load-bearing (one merge at a time), so the re-audit does **not** fold refine back into the parallel work wave. The `no-test` handling is a **localized sub-loop** inside the refiner's per-task handling:

```
on merge-task result for an approved task:
  merged   → landed (as today)
  no-test  → if task.fixRounds < roundLimit:
               fix-worker(add the mapped test, same worktree); task.fixRounds++
               re-run the FULL audit panel for THIS task (auditRound)
               if approved → re-attempt merge-task (still serial)
               else        → escalate (its audit verdict)
             else → escalate { reason: 'no-test' }      // budget exhausted
  gate_failed / conflict / error → escalate (as today)
```

- `task.fixRounds` is a **per-task counter shared** with the audit-phase fix-loop (`:270-297`) — total fixes across audit and no-test ≤ `roundLimit`. (Carry the existing audit-loop `round` onto the task object so refine can continue counting.)
- `no-test` joins `HARD_ESCALATION_REASONS` (both mirrors + the drift-guard) for the exhaustion case, so a never-tested task **holds the phase**.

## 4. Surface changes

| File | Change |
|---|---|
| `skills/war/assets/assert-test-in-diff.sh` (new) | The tested floor script (§3.1). |
| `skills/war/assets/assert-test-in-diff.test.sh` (new) | Cases: test present → exit 0; diff with no test → non-zero; exempt path never invoked; pattern variants; `..`/empty-diff safety. |
| [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) | `MERGE_RESULT.status` enum gains `no-test`; REFINE section gains the §3.3 sub-loop; carry per-task `fixRounds`; `HARD_ESCALATION_REASONS` gains `no-test`. |
| [`skills/war/assets/land-decision.mjs`](../../skills/war/assets/land-decision.mjs) | `HARD_ESCALATION_REASONS` mirror gains `no-test` (+ the `war-config.test.mjs` drift-guard updated). |
| [`agents/war-refiner.md`](../../agents/war-refiner.md) | merge-task step order gains the assert + `no-test` status (§3.2). |
| [`skills/war/SKILL.md`](../../skills/war/SKILL.md) | Decompose step: set `requiresTest` per task (default true; false for docs/config/verify-no-op). Invariants: note the deterministic test-floor as the refiner's responsibility. |
| [`skills/war/references/schemas.md`](../../skills/war/references/schemas.md) | Task shape gains `requiresTest:bool`; `MergeResult.status` gains `no-test`. |
| [`CONTEXT.md`](../../CONTEXT.md) | On ratification, add the §5 terms. |
| [`docs/adr/0006-deterministic-test-floor.md`](../adr/0006-deterministic-test-floor.md) | **Written** (accepted) — ratifies decisions 1/2/3/4/6 (coarse floor, tested-script enforcement, refiner placement, fail-closed exemption, full-re-audit). |

## 5. New domain terms (for CONTEXT.md)

**Test floor**:
The deterministic guarantee that a task which *requires* a test changed at least one test file in its diff, enforced by a tested shell assertion at merge-task. The coarse *floor* (a test exists) is distinct from the auditor's semantic *ceiling* (it is the right test, exercises the slice, is not weakened or skipped).
_Avoid_: test coverage, test gate (the gate runs the suite; the floor inspects the diff).

**`requiresTest`** (task field):
Whether a task must change a test file to be mergeable. Defaults `true`; the Lead sets it `false` at decompose for tasks that legitimately add no test (docs, config, a VERIFY-no-op whose scenario the base already covers).
_Avoid_: hasTests, testExempt (state the requirement positively, default-on).

**`no-test`** (merge outcome):
The refiner's merge-task result when a `requiresTest` task's diff contains no test file. It is not a failing gate — it routes a bounded fix-worker + full re-audit, and escalates only on budget exhaustion.
_Avoid_: gate-failed (the suite is green; the *diff* lacks a test).

## 6. Open risks / implementation notes

- **Floor/gate pattern drift.** If `assert-test-in-diff.sh`'s pattern and the resolved gate's test discovery diverge, a task could add a file the floor counts but the gate never runs (or vice versa). Keep the default pattern aligned with the gate; a `.test.sh` case should assert the union matches the gate's known globs.
- **Coarse floor is deliberately weak.** It only proves *a* test file changed, not that it tests *this* slice. That residual is the auditor panel's job (the §2 ceiling), now backed by a deterministic floor instead of being the sole check. This is the same floor/ceiling split as the gate-evidence pass.
- **Per-task budget carry.** The shared `fixRounds` counter must persist from the parallel audit loop onto the task object so the serial refine sub-loop continues the same budget; a fresh counter would double a task's fix allowance.
- **Re-audit cost.** A `no-test` catch re-runs the full panel for that one task. This fires only when the panel *already* missed the absent test (rare), so the cost is bounded and signal-worthy.
- **Self-report stays advisory.** `WORKER_RESULT.tests` / `acceptance_criteria_covered` remain unverified advisory fields (threaded into the audit prompt as claims); the floor does not trust them. Consider renaming per the audit's residual so they don't read as verified.

## 7. Non-goals / deferred

- Precise per-task test mapping (`mappedTests`) — rejected (decision 1); coarse floor + auditor ceiling instead.
- Asserting test *strength* / non-vacuity in code — not code-gateable; stays the auditor's semantic job (the re-audit in decision 6 is what guards it).
- Trusting the worker's self-reported `files_changed` — rejected (constraint 1).
- A pre-audit dedicated check-seat — rejected (decision 3) to avoid a spawn per task.

## 8. Validation criteria

1. **Zero-test task is caught.** A `requiresTest` task whose diff has no test file → refiner returns `no-test`; the task does not merge.
2. **Exempt task passes.** A `requiresTest:false` docs/config/VERIFY-no-op task merges with no test and the script is never invoked.
3. **Floor is git-truth, not self-report.** A worker that mis-reports `files_changed` (claims a test it didn't write) is still caught — the script reads the real diff.
4. **Fix-then-re-audit.** A `no-test` catch routes a fix-worker, re-runs the FULL panel on the new diff, then re-merges; a vacuous added test is caught by the re-audit, not merged.
5. **Shared budget.** Audit-phase fixes + no-test fixes together ≤ `roundLimit`; exhaustion → `no-test` hard escalation, phase holds.
6. **Script is independently tested.** `assert-test-in-diff.test.sh` covers present/absent/exempt/pattern/`..`-safety and runs under the gate's `*.test.sh` discovery.
