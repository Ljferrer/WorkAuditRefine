# F02 — Gate dependents on success, not completion — Design

**Status:** proposed — targets **v0.5.1** (correctness). **Severity: HIGH.**
**Source:** agent-architecture-audit F2 · memory `done-add-on-soft-failure-unblocks-true-dependents`.

## Problem — a failed predecessor silently unblocks its dependents

[workflow-template.js:268](../../skills/war/assets/workflow-template.js) runs `done.add(r.task.id)`
**unconditionally** for every result, and `nextWave()`
([:143](../../skills/war/assets/workflow-template.js)) gates dependents on `done`, not on success:

```js
const nextWave = () => tasks.filter(t => !done.has(t.id) && (t.deps || []).every(d => done.has(d)))
// ...
done.add(r.task.id)   // runs for escalate / audit-blocked / blocked / env-blocked / dep-failed too
```

So a dependency that `escalate`d / was `audit-blocked` / `blocked` / `env-blocked` (provision failed, worker never
spawned) — its work **never reached the integration branch** — still satisfies a dependent's `deps`. The dependent fans out and can merge onto an integration tip
**missing the predecessor entirely**. The phase *land* is correctly held on the open escalation (a human catches
it at the phase boundary), but within the phase the dependent already ran and possibly merged on an incomplete
base. "Siblings in a wave proceed" is by design; **unblocking true dependents of a failed predecessor is the bug.**

## Decisions

- **D1 — Track `succeeded` distinct from `done`.** Add a `succeeded` Set. `succeeded.add(id)` **only** when the
  task's verdict is `approve` **and** its merge returns `status: 'merged'`. `done` keeps its current meaning
  (terminal accounting + loop termination).
- **D2 — `nextWave` gates on `succeeded`.** A task is runnable only when every dep is in `succeeded`:
  `(t.deps || []).every(d => succeeded.has(d))`. A task with any failed dep is **not** runnable.
- **D3 — Mark dep-blocked tasks explicitly, don't strand them.** When a task's deps are all `done` but not all
  `succeeded`, record it as `escalated` with reason `dep-failed` (naming the failed dep) and add it to `done`
  with a terminal, non-success verdict so the loop still terminates.
- **D4 — Siblings still proceed.** Only **true dependents** of a failed predecessor are gated; independent tasks
  in the same/next wave run normally (preserves the parallelism the design values).
- **D5 — Loop termination.** `while (done.size < tasks.length ...)` must count dep-blocked tasks as terminal
  (they enter `done`, never `succeeded`) so the loop cannot spin.
- **D6 — Land decision.** `dep-failed` should **hold** the land. The predecessor's own
  `escalate`/`audit-blocked`/`conflict` already triggers `held:escalation`; add `dep-failed` to
  `HARD_ESCALATION_REASONS` so a dependent-skip independently holds too (mirror in `land-decision.mjs` + template,
  with the drift guard from F07).

## Solution shape

Introduce `succeeded`; switch `nextWave` to it; detect dep-blocked tasks at wave selection and emit a
`dep-failed` escalation + terminal `done` entry; extend `HARD_ESCALATION_REASONS`.

## Schema & contract changes

- New escalation reason `dep-failed` (internal `escalated[].reason`; add to `HARD_ESCALATION_REASONS`).
- No external JSON envelope changes (WorkerResult/AuditVerdict/MergeResult unchanged).

## Affected files

`skills/war/assets/workflow-template.js` (`succeeded` set, `nextWave`, dep-block detection, termination) ·
[`land-decision.mjs`](../../skills/war/assets/land-decision.mjs) (`HARD_ESCALATION_REASONS += 'dep-failed'`) ·
`war-config.test.mjs` (drift guard for the constant) · `workflow-template.test.mjs` (behavioral test, below).

## Alternatives considered

- **Pause the whole phase on the first failure** — rejected: kills the sibling parallelism the design exists for.
- **Re-cut dependent worktrees off the partial integration** — N/A: the predecessor never merged, so there is no
  partial integration to cut from.
- **Leave it (land is held anyway)** — rejected: the dependent still ran/merged on a wrong base, wasting work and
  leaving messy state for the Lead to untangle on resume.

## Validation criteria

- DAG `t2` deps `t1`; `t1` escalates → `t2` **never spawns a worker**, appears in `escalated` as `dep-failed`
  naming `t1`; the phase land is held; an independent `t3` still runs and can merge.
- `done.size` reaches `tasks.length` (loop terminates; no spin).
- Behavioral test in `workflow-template.test.mjs` asserts the dependent is not run and the reason is `dep-failed`.

## Open decisions

1. Should a `dep-failed` task be **retried automatically** once the Lead resolves the predecessor's escalation,
   or always require a fresh run? (Recommend: surface for the Lead; no auto-retry within the held phase.)
