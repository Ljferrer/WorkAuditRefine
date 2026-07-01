# Red-team report — No-test sub-loop: exit-2 mis-routing, enum hygiene, and gate-evidence reporting

**Plan:** [`docs/plans/2026-06-30-no-test-routing-enum-gate-evidence.md`](../plans/2026-06-30-no-test-routing-enum-gate-evidence.md)
**Source spec:** [`docs/specs/2026-06-30-no-test-routing-enum-gate-evidence-design.md`](../specs/2026-06-30-no-test-routing-enum-gate-evidence-design.md)
**Date:** 2026-06-30 · **Target:** v0.8.2 (landOrder 2, stacked on Spec 1's landed tip `51677446`)

## Verdict: **CLEARED-WITH-NOTES**

All blockers resolved by in-place plan patches; re-verified against the patched plan and the live post-Spec-1 repo state (slots=`0.8.1`, README="Builds on v0.8.0"). Two residual Minor notes carried forward (no fix required to build).

## Attack surface

8 probes, **all on-target** (coverage whole — no off-target, no dropped): 5 spine + 3 bespoke.

- **Executed (throwaway sandboxes):** 3 — `executable-proof`, `tdd-237`, `tdd-268`.
- **Analyzed (read-only):** 5 — `claims-vs-reality`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`, `snippet-anchor-fidelity`.
- **Outcomes:** pass 5 · fail 2 · warn 1. Each fail was adversarially confirmed before counting.

## Findings & resolutions applied

Three CONFIRMED issues gated the plan (2 `needsDecision` blockers + 1 warn-Minor). All three are the *plan-describes-a-stale-precondition* class ([#311](https://github.com/Ljferrer/WorkAuditRefine/issues/311)) — single-outcome doc corrections, patched autonomously under `--afk`:

| # | Probe | Severity | Issue | Resolution |
|---|-------|----------|-------|------------|
| A | claims-vs-reality | Major (needsDecision) | Phase 6 / Coordination described the "at HEAD" base as slots=`0.8.0` / README="Builds on v0.7.8" — false for the stacked base (v0.8.1). | Phase 6 Step 1 now states the integration-base reality (slots=`0.8.1`, README="Builds on v0.8.0"); the `0.8.0`/`v0.7.8` case is explicitly re-scoped to the *standalone-off-master fallback*. Target (v0.8.2, "Builds on v0.8.1") unchanged. |
| B | consistency-placeholders | needsDecision | Phase 5 Step 1 header said "Write the test (RED first)" while the body said the test PASSES against current code (a regression guard) — contradictory. | Header renamed to "regression guard — RED is proven via transient Site-3 deletion, NOT against unwritten code", consistent with the body. |
| C | executable-proof | Minor (warn) | Phase 4 Step 3 + test-plan row used case-sensitive `grep -rn 'do NOT curate'`, which fails to match the capitalized example clause `Do NOT curate…`. | Verify greps changed to case-insensitive `-rin`/`-in` on the casing-robust token `curate or excerpt`. |

**Re-verify:** an independent adversarial agent re-read the patched plan + the live `plugin.json` / `marketplace.json` (×2) / README `## Status` and returned `findingA_resolved: true, findingB_resolved: true, findingC_resolved: true` — repo facts `plugin.json:0.8.1, marketplace.json metadata.version:0.8.1, plugins[0].version:0.8.1, README "Builds on v0.8.0"`.

## Residual risk (notes, non-blocking)

- **`~:NNN` approximate line anchors** (consistency-placeholders, `needsDecision:false`): the plan pairs "anchor by construct, not line" with `~:NNN` hints throughout. This is the deliberate `~:` "approximate, drifts — locate by construct" belt-and-suspenders style used across the entire remediation stack (Spec 1 included); the construct name is always the authority. Left as-is.
- The **value target is untouched** by every patch: v0.8.2, "Builds on v0.8.1", four canonical slots. Only stale *starting-state* descriptions were corrected.

## Coverage summary

`{ probes: 8, executed: 3, analyzed: 5, pass: 5, fail: 2, warn: 1, expected: 8, onTarget: 8, offTarget: [], dropped: [] }` — coverage whole; no `INCOMPLETE` condition.
