# Task-class routing, the ace edit class and sampled review

**Status:** accepted (2026-11-10; plan `docs/plans/2026-11-08-model-routing-and-prompt-byte-budgets.md`,
D11 to D13, D22, D30 to D33 and D36; issue #2534; refines
[ADR 0056](0056-default-seat-models-follow-the-2497-routing.md))

## Context

ADR 0056 moved the default seats down a model tier and left three items to issue #2534: routing by
task class, a sampled opus review of clean below-opus approvals, and per-model telemetry. The
telemetry landed first, as the handoff's `dispatchModels` rows, so a routing trial has a baseline.

Issue #2534 binds three constraints. An absent routing config keeps every dispatch byte-identical
to today (first ruled on #2519, 2026-10-28). A trial changes one variable at a time. A clean sonnet
approval is never the sole reason to skip review.

The hand-set policy this formalizes was ruled on 2026-10-30, after 0.21.30: every code task's
correctness seat runs opus, boundary-heavy seats run opus on a high effort, and docs-only and
config-only tasks stay on sonnet. The 2026-11-03 ruling on #2534 made the Lead pick each seat's model
like its lens and depth, with the boundary rule as the floor.

## Decision

**The Lead stamps a task class.** Each task may carry `class: routine | boundary`, stamped at
Decompose. The engine never derives it: the #2497 replay rejected the file extension as a risk
classifier. An optional `routing` config key maps each class and role (worker, fix, ace, auditor) to
a tier. A `boundary` task's seats never resolve below opus. A boundary-signal task stamped `routine`
warns at launch and never refuses.

**The engine derives an ace edit class.** An absorb row with a file, a line and a suggested fix is
exact. A batch of only exact rows runs on its own optional tier. Any other batch is broad and keeps
today's ace tier. Ace charges 5 and 6 stay on the fix tier.

**Sampled review only adds a seat.** A configured share of clean approvals whose seats all resolve
below opus gains one opus seat at the same `audit_sha`. A stable hash of the plan slug and task id
picks the tasks, so a replay samples the same ones. The seat's Critical or Major finding blocks.

**One lens pair is allowed (#2706).** A roster may repeat a lens once, when both seats carry an
explicit model and the later ranks strictly above the earlier. The sampled seat passes that rule.
The rebuttal round stays split-only.

**The Lead picks the lite worker (2026-11-09).** A task stamped `workerTier: 'lite'` runs its first
worker on `agents.worker.lite`; the all-`*.md` file test no longer routes a task. A lite task keeps
one seat on the high tier, and a failed first audit takes the fix or ace path as for any task.

**The opus seat floor is a switch, off by default (2026-11-09).** The operator ruled the #2544 ask
the same day: "Go with the switch design, floor off by default". When on, the args floor refuses a
task with no high-tier seat and no explicit seat model at or above opus. The #2544 replay of Aligned
plan 1 (8 tasks, 16 seats) found that a panel with one opus seat caught all 4 Minors both blind
judges confirmed, and an all-sonnet panel caught 1. Sampled review stays beside the switch: with the
floor off, every all-below-opus panel stays reachable, so sampling gathers the data, and the operator
turns the floor on from it.

No preset sets a routing value. The doctrine, with every rule above in full, lives in
[`skills/war/references/model-routing.md`](../../skills/war/references/model-routing.md). The key set
lives in `validate()` in `skills/war/assets/war-config.mjs`. Neither is restated here.

## Consequences

- A config with no `routing` key runs as before. The `routing absent — byte-identical` row proves it
  against the pre-existing spawn path. The one stated exception is the lite worker: an all-`*.md`
  task with no stamp now runs the base worker.
- A routing trial reads its result from `dispatchModels` and the `/war-review` per-model and
  per-class rows.
- A boundary task stamped `routine` is the main risk. The launch warning on a boundary signal bounds
  it, and the operator sees each seat's resolved model at the approval gate.

## Decision log

- 2026-11-10 · Accepted with the routing engine (Task 4.1) and this doctrine (Task 4.2) · plan
  `docs/plans/2026-11-08-model-routing-and-prompt-byte-budgets.md`.
