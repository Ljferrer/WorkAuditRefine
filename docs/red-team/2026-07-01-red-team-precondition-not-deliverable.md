# Red-team report — /red-team verifies preconditions, not deliverables (#311)

**Plan:** [`docs/plans/2026-07-01-red-team-precondition-not-deliverable.md`](../plans/2026-07-01-red-team-precondition-not-deliverable.md)
**Source spec:** [`docs/specs/2026-07-01-red-team-precondition-not-deliverable-design.md`](../specs/2026-07-01-red-team-precondition-not-deliverable-design.md)
**Date:** 2026-07-01 · **Target:** v0.8.9 (landOrder 9) · **Stacked base:** Plan 8 tip `25cba1c` (v0.8.8) · **Closes:** #311

## Verdict: **CLEARED** (one remediation round)

A **meta-change** to the red-team's own scaffold + gate. Both bespoke construct probes + the dedicated **not-blunting-meta-safety** probe pass. The gate's mechanical `BLOCKED` is — fittingly — **the #311 misfire itself**, plus one real clarity `needsDecision` (fixed).

## The ironic misfire (adjudicated non-blocking)

The `anchor-gate-constructs-and-gap` probe fired a **Critical** ("`classify()` doesn't route severity-less findings to `needsDecision`") and a **Major** ("dedup key lacks the `file|line|summary` fallback"). Both describe the **current #311 gap that T2 fixes** — i.e., the plan's *deliverable*, reported as a defect. This is exactly the not-yet-implemented / claims-vs-reality misfire this plan exists to eliminate (`redteam-claims-vs-reality-misfires-on-impl-plans`). My probe *confirming the gap exists* validates the plan's premise; it is not a defect. Lead-adjudicated non-blocking.

## Real finding & resolution

| Probe | Finding | Resolution |
|-------|---------|------------|
| `consistency-placeholders` | ND (PLAUSIBLE) + CONFIRMED: is the not-blunting carve-out **automatically asserted** (Step 1) or only **manually** checked (Step 4)? Spec Validation #2 requires "asserted present." | **FIXED @ `dabb59c`** — Step 1 split into 1a/1b/1c; **1b** is an explicit automated `assert.match` on a stable carve-out phrase (`false claim about EXISTING code`), so blunting the rule fails Step 1 RED. Step 4 reframed to document *why* 1b is load-bearing (no manual gate). |

## Passing probes

`claims-vs-reality`, `coverage-vs-source`, `dependency-feasibility`, `executable-proof`, `baseline-gate-green`, `anchor-scaffold-constructs` (scopeLock L92 + composition site L127 + `technique` markers + both test files exist), `not-blunting-meta-safety` (the rule preserves real findings — missing anchor / false-claim-about-existing-code / wrong-signature / drifted-line / contradiction — while suppressing only the plan's own not-yet-applied deliverable; the carve-out is load-bearing).

## Coverage summary

`{ probes: 9, executed: 2, analyzed: 7, pass: 7, fail: 2, onTarget: 9, offTarget: [], dropped: [] }` — coverage whole. The 2 gate-side "blockers" are the #311 gap (T2's deliverable, not-yet-implemented misfire); the 1 `needsDecision` (test-rigor ambiguity) fixed. Lead-adjudicated to **CLEARED**.
