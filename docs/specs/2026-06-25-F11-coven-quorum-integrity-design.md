# F11 — Coven quorum integrity (dropped seats) — Design

**Status:** proposed — targets **v0.5.1** (correctness). **Severity: HIGH.**
**Source:** memory `dropped-coven-seat-silently-shrinks-quorum` (surfaced post-audit, B5).

## Problem — a dead seat silently shrinks the quorum

`auditRound` returns `(await parallel(lenses.map(...))).filter(Boolean)`
([workflow-template.js:166-170](../../skills/war/assets/workflow-template.js)) — a seat that dies (terminal API
error → `null`) is **silently dropped**. `allApprove` is
`seats.length > 0 && seats.every(approve)` ([:141](../../skills/war/assets/workflow-template.js)). So a 3-seat
coven with **2 dead + 1 approve** → `allApprove` true → **merge on a single approval**. The unanimity guarantee
silently degrades exactly when seats are failing. (A fully-dropped single seat falls through to `audit-blocked`,
which is safe-ish; the dangerous case is a *partially* dropped panel.)

## Decisions

- **D1 — Know the expected seat count.** `auditRound` must thread the number of lenses it requested (`expected`)
  alongside the returned non-null `seats`.
- **D2 — Never judge a shrunk panel.** If `seats.length < expected`, **re-run the dropped seats** (bounded
  retries, e.g. 1–2) before judging. If still short → a hard outcome (`audit-blocked` / escalate with reason
  `seat-dropped`); **never `approve` on a shrunk panel.**
- **D3 — Tighten `allApprove`.** Require `seats.length === expected` (full panel present) **and** every seat
  `approve` — not "the survivors approve."
- **D4 — Surface, don't rely on the Lead.** Record requested-vs-returned in the `auditLog` and escalate
  `seat-dropped` so the integrity check is **in code**, not a Lead-must-remember step.
- **D5 — Covers rebuttal rounds too** (a split panel that loses a seat mid-rebuttal must not collapse to approve).

## Solution shape

Thread `expected` through `auditRound`; retry-or-fail on shortfall; tighten `allApprove`; log requested-vs-returned;
add `seat-dropped` to escalation reasons (hold the land — mirror in `land-decision.mjs` + drift guard, F07).

## Schema & contract changes

- New escalation reason `seat-dropped` (add to `HARD_ESCALATION_REASONS`).
- `auditLog` entry records `{ requested, returned }` seat counts.

## Affected files

`skills/war/assets/workflow-template.js` (`auditRound`, `allApprove`, the round loop, the auditLog) ·
[`land-decision.mjs`](../../skills/war/assets/land-decision.mjs) (`HARD_ESCALATION_REASONS += 'seat-dropped'`) ·
`war-config.test.mjs` (drift) · `workflow-template.test.mjs` (behavioral: a null seat → no approve-on-shrink).

## Alternatives considered

- **Keep `filter(Boolean)` and approve on survivors** — the current silent bug; rejected.
- **Retry indefinitely** — rejected: could hang; bound the retries then fail to a hard outcome.

## Validation criteria

- A stubbed coven where 1 of 3 seats returns `null` → the round retries that seat; if it stays `null` →
  `audit-blocked` / `seat-dropped`, **not** merged.
- A full panel present + unanimous → `approve`.
- The `auditLog` shows `requested: 3, returned: 2` when a seat is dropped.

## Open decisions

1. Retry budget for a dropped seat (recommend 1–2) and whether a single persistent drop escalates vs blocks.
