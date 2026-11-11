# Model routing

This file is the one doc home of the routing doctrine (issue #2534, [ADR 0062](../../../docs/adr/0062-task-class-routing-and-sampled-review.md)). It covers the task class, the ace edit class, sampled review, the opus seat floor, the lens pair and the worker tier.

The `routing` key set, each value's shape and each error text live in `validate()` in [`../assets/war-config.mjs`](../assets/war-config.mjs). This file names a key where a rule needs it, and never restates the key set. The engine side is `routeWorker`, `routeSeat`, `routeAce` and `sampledSeatOf` in [`../assets/workflow-template.js`](../assets/workflow-template.js). The args floor is `routingRefusals` and `boundaryWarnings` in [`../assets/assert-args-complete.mjs`](../assets/assert-args-complete.mjs).

## The #2534 constraints

These bind every routing change.

- An absent `routing` key keeps every prompt and every spawn option byte-identical to the plain `spawn(<role>)` path (PIN-14). The `routing absent — byte-identical` row in `workflow-template.routing-1.test.mjs` proves it against that pre-existing path, and its sibling row proves the comparison sees routing.
- Change one variable per trial. Never change the worker model, the auditor model, effort and seat count together.
- A clean approval with every seat below opus is never the sole reason to skip review. Sampling only adds a seat. It never removes a seat and never skips a round.
- No preset sets a `routing` value. Values wait for field data from the handoff's `dispatchModels` rows ([schemas.md](schemas.md)) and the `/war-review` per-model and per-class rows.

## Task class

You stamp a per-task `class` at Decompose: `routine` or `boundary`. The engine never derives it. A file extension is not a risk classifier: all 22 tasks of the #2497 replay that ran on sonnet were Markdown-only.

- Stamp `boundary` for a boundary-heavy task. The boundary rule is the Audit step's in [design.md](design.md) (§ 4, step 3). It is not restated here.
- Stamp `routine` for the rest.
- `routing.classes.<class>.<role>` maps the `worker`, `fix`, `ace` and `auditor` roles of that class to a `{ model, effort }` tier. A role with no entry keeps its own tier.
- An auditor class tier replaces the base tier of a seat with no `model` and no `tier: 'high'`. Your explicit seat pick wins.
- A `boundary` task's seats never resolve below opus. This is the ADR 0056 boundary floor, bound to the class.
- The args check refuses an unknown class. A task with a boundary signal stamped `routine` warns, and the warning never blocks dispatch.
- The stamped class rides each dispatch's `dispatchModels` row as `taskClass`.

## Ace edit class

The engine derives the ace edit class from the absorb rows. Nobody stamps it.

- An absorb row with a `file`, a `line` and a `suggested_fix` is `exact`. Any other row is `broad`.
- An ace batch whose rows are all `exact` runs on `routing.aceEdit.exact` when it is set. A batch with one `broad` row is broad and keeps the ace tier (the class ace tier when set).
- Ace charges 5 and 6 stay on the fix tier. The validator's rule that the fix model ranks at least the ace model still holds.

## Sampled review

- `routing.sampleOpusReview` is a share from 0 to 1. Absent means 0, so nothing is sampled.
- Only a clean approval is a candidate, and only when every seat resolves below opus.
- A stable hash of the plan slug and the task id picks the sampled tasks. The same inputs sample the same tasks on a replay.
- A sampled approval gains one opus seat at the same `audit_sha`. Its Critical or Major finding blocks like any seat's.
- The seat's lens and depth come from the Lens pair rule below.

## Opus seat floor

- `routing.opusFloor` is a switch, off by default. When it is on, the args floor refuses a task whose roster holds no seat on tier `high` and no seat with an explicit `model` at or above opus in `MODEL_RANK`. The refusal names the task and the key.
- It is off by default so sampled review can gather data on panels with every seat below opus. With the floor on, no panel is all below opus, and sampling never fires.
- The operator turns the floor on from that data (ruling 2026-11-09, #2544 replay evidence).

## Lens pair

The one exception to distinct lenses (#2706). The rule lives in both `validateRoster` copies.

- The explicit-`model` test: a roster may repeat a lens once, only when both seats on it carry an explicit `model`.
- The strict order: the later seat's model ranks strictly above the earlier seat's in `MODEL_RANK` (`war-config.mjs`), as with an opus seat over a sonnet seat.
- Every other repeat still reds with the duplicate-lens text. That covers a same-model pair, a seat with no `model`, a tier-only seat and a third seat on the lens.
- The sampled seat copies its lens and depth from the panel's first non-evidence seat, with `model: 'opus'`. The engine appends it to the round's seats, never to `task.roster`. It passes the pair rule against that seat's resolved model.
- The rebuttal round stays split-only. An agreeing panel has nothing to rebut. Its route to opus is the sampled seat, or a roster you pair by hand.

## Worker tier

You pick each task's first worker at the approval gate, the way you pick each seat's tier.

- Stamp `workerTier: 'lite'` for a leaf, docs-only or low-blast-radius task. Its first worker runs on `agents.worker.lite`. An unstamped task keeps the base worker.
- A boundary-heavy task (engine, floors, hooks) keeps the base worker. The boundary rule is the Audit step's in [design.md](design.md) (§ 4, step 3). It is not restated here.
- An all-`*.md` file list is one input to the pick, never the pick. The engine reads only the stamp.
- A lite task keeps at least one seat on tier `high` (or a seat with an explicit `model` at or above opus). The args floor refuses a lite task without one and refuses any other `workerTier` value. A boundary-signal task stamped lite warns.
- The stamp outranks `routing.classes.<class>.worker` when both are present.
- A lite task that fails its first audit takes the fix or ace path as any task does. There is no step up to the base worker. Fix rounds and ace commits keep their own tiers.
