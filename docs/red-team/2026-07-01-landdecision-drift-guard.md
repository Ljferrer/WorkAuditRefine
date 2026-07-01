# Red-team report — landDecision known-set drift-guard (#271)

**Plan:** [`docs/plans/2026-07-01-landdecision-drift-guard.md`](../plans/2026-07-01-landdecision-drift-guard.md)
**Source spec:** [`docs/specs/2026-07-01-landdecision-drift-guard-design.md`](../specs/2026-07-01-landdecision-drift-guard-design.md)
**Date:** 2026-07-01 · **Target:** v0.8.8 (landOrder 8) · **Stacked base:** Plan 7 tip `3df0b78` (v0.8.7) · **Closes:** #271

## Verdict: **CLEARED** (one remediation round)

Low-risk behavioral+doc-parity guard. All four **bespoke** anchor probes pass — the plan's core claims are verified at HEAD. The gate's mechanical `BLOCKED` came from 2 `needsDecision` findings, both resolved (one refuted, one fixed).

## Attack surface: 9 probes (5 spine + 4 bespoke), all on-target

- **anchor-4-doc-surface-parity** (pass): all 4 doc surfaces (SKILL.md return-contract, SKILL.md §4.2 classifier, schemas.md enum union, schemas.md per-value bullets) carry exactly the canonical 7 — the guard's `deepEqual` assertions hold at HEAD.
- **anchor-workflow-emitted-and-decideland** (pass): the Workflow's `landDecision` block emits exactly **6** (the 7 minus `held:phase-incomplete`), all ⊆ the 7; `decideLand`'s 3 outputs ⊆ the 7; `HARD_ESCALATION_REASONS` present (export placement) and `KNOWN_LAND_DECISIONS` correctly absent (T1 adds it).
- **anchor-non-emitted-gap** (pass): `held:phase-incomplete` ∈ the 7 and ∉ the Workflow-emitted set (Lead-classified) — the intentional gap the plan pins.
- **baseline-gate-green** (pass): clean-sandbox `node --test` green.
- Spine: executable-proof, coverage-vs-source, consistency-placeholders (all pass), dependency-feasibility (see below).

## Findings & resolutions

| Probe | Finding | Resolution |
|-------|---------|------------|
| `claims-vs-reality` | Minor (ND): "Workflow emits 5, not 6" | **REFUTED** by adversarial-confirm — the finding missed `held:workflow-error` in the catch block (line 713); the Workflow emits 6. The plan's "superset (6 vs 3)" comment reword is correct as written. No change. |
| `dependency-feasibility` | ND: "roadmap doesn't define v0.8.8" | **FIXED** — the Plan-8 branch carried the stale #347 roadmap (specs 1–7 only); the plan+spec were stack-synced but the roadmap was not. Synced the #348 roadmap (defines spec 8 = v0.8.8) @ `06e720f`; the "authoritative version source" ref now resolves. |
| `dependency-feasibility` | Minor (non-ND): "`--test-name-pattern` may not exist in node:test" | **FALSE ALARM** — Node's built-in test runner supports `--test-name-pattern` (v18.1+); Plans 1–7 all used it successfully in-run. Non-blocking; no change. |
| `claims-vs-reality` | Minor: line numbers `~L553` stale | Non-actionable — the plan mandates construct-anchoring (memory `plan-line-number-refs-stale-use-construct-locator`); the constructs resolve (comment at L616, block L615–679). |

## Residual risk

None blocking. The 4 doc surfaces + the Workflow-emitted set + `decideLand` all agree with the canonical 7 at HEAD, so the guard suite is green-from-start; Step 6's temp-break-and-revert cases confirm each assertion is load-bearing. `land-decision.mjs`/`.test.mjs` are an isolated lane; the only shared surfaces are the four version slots and a 1-line comment.

## Coverage summary

`{ probes: 9, executed: 2, analyzed: 7, pass: 7, fail: 1, warn: 1, onTarget: 9, offTarget: [], dropped: [] }` — coverage whole. The 2 `needsDecision` blockers resolved (1 refuted, 1 fixed by roadmap sync); Lead-adjudicated to **CLEARED**.
