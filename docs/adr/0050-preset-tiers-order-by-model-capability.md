# Preset tiers order by model capability; effort `default` defers to the session

**Status:** accepted (operator ruling of 2026-09-06 on PR #2081, release 0.21.11, after a
`/snipe` correctness seat filed the preset ordering as a Major; supersedes the retired
`war-config.mjs` comment "thorough must never be weaker than balanced on any axis")

A snipe seat read the 0.21.11 presets and concluded that `thorough` ships the weakest audit seat
and `economy` the priciest workers. Its evidence was an inferred ranking: fable is cheap because
the fix tier uses it, and `default` is the lowest effort because it heads the `EFFORTS` enum. The
repo stated no ranking of its own, so the seat supplied one. The shipped values follow a different
rule that lived only in the operator's head. This ADR writes that rule down and pins it.

## Decision

**Model capability is the first axis of every seat.** `MODEL_RANK` in `war-config.mjs` orders
the models ascending in capability and cost: haiku, sonnet, opus, fable. For every tier a preset
resolves (worker base, docs, fix, auditor, refiner, servitor, red-team, snipe), the model rank is
monotone across presets: `thorough` ≥ `balanced` ≥ `economy`. `war-config.test.mjs` asserts that
rule over the eight tiers of the three shipped presets, so an auditor reads the invariant from
the suite instead of inferring one.

**Effort `default` is not the lowest effort.** It means the seat inherits the effort knob of the
chat session that launched the run. A pinned effort (`low` … `max`) overrides that knob for the
one seat. Fable seats are pinned at `default` on purpose: the operator measured fable under a
forced high effort as costing more than it returns, so the session keeps that decision. Weaker
models carry a pinned effort as compensation (for example sonnet auditors on `xhigh`), which is
why the effort axis is deliberately *not* monotone across presets and is not an invariant.

**`economy` means cheaper models and a capped run shape, not a weaker rule set.** Every review
seat is sonnet, the first-pass workers are opus, and the fix tier inherits fable. Its run shape is
pinned: `rosterPolicy: all` over its four-lens roster, so every task convenes exactly four seats
(`auto` has no seat cap), `roundLimit: 4`, and `redteamRoundLimit: 2`. The ace ladder, the absorb
budget, memory and hooks inherit `DEFAULTS`.

**What an auditor checks.** The model-rank monotone test, the whole-literal `PRESETS` pins, and
the `/war-room` bullet parser are the machine record of these values. A preset name describes the
model tier it buys, never an effort ordering.

## Considered options

- **Restore opus/`max` auditors on `thorough` (rejected).** That reinstates a forced high effort
  on the strongest review seat, the exact cost the operator measured as not worth paying.
- **Rename the presets (rejected).** The names already describe the model tier each preset buys
  under `MODEL_RANK`, and a rename breaks every committed `.claude/war/config.json` that names one.
- **Add an `audit.maxSeats` cap under `rosterPolicy: auto` (deferred).** No such knob exists.
  `all` over a four-lens roster yields exactly four seats today with no engine change; a cap knob
  is its own change if a future preset needs "up to N" rather than "exactly N".
- **Keep the ordering rule as a code comment (rejected).** A comment stating "never weaker on any
  axis" was the prior form, was false on the effort axis, and was deleted; a test cannot rot the
  same way.

## Relationship to prior ADRs

- [ADR 0025](0025-drift-guard-discipline.md) — the model-rank test and the `/war-room` bullet
  parser are drift guards in that discipline: facts bound to their canonical source, never a
  hand-copied literal.
- [ADR 0045](0045-red-team-loop-budget-and-route-upstream.md) — `redteamRoundLimit` stays 3 by
  default and 2 on `economy`; this ADR changes no red-team budget.
