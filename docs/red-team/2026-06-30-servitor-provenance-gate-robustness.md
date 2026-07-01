# Red-team report — Servitor provenance gate robustness

**Plan:** [`docs/plans/2026-06-30-servitor-provenance-gate-robustness.md`](../plans/2026-06-30-servitor-provenance-gate-robustness.md)
**Source spec:** [`docs/specs/2026-06-30-servitor-provenance-gate-robustness-design.md`](../specs/2026-06-30-servitor-provenance-gate-robustness-design.md)
**Date:** 2026-06-30 · **Target:** v0.8.3 (landOrder 3) · **Base:** `origin/master` `d7e78f7` (v0.8.2)

## Verdict: **CLEARED**

Gate returned CLEARED (8/8 probes on-target, no blockers / needsDecision / minors). Two confirmed doc-accuracy findings (a plan→spec misattribution) were auto-fixed in place; they never rose to a blocker.

## Attack surface

8 probes, **all on-target** (coverage whole): 5 spine + 3 bespoke.

- **Executed (throwaway sandboxes):** 3 — `executable-proof`, `tdd-247`, `grep-249`.
- **Analyzed (read-only):** 5 — `claims-vs-reality`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`, `anchor-247-248`.
- **Outcomes:** pass 6 · fail 2 · warn 0.

### Bespoke probes — all pass
- **`anchor-247-248`** (analyzed): confirmed the extractor's awk line carries **both** indent-coupled tokens `/^  provenance:/` and `/^[^ ]/{exit}`, the `|| true` comment block over-claims a grep no-match rescue (no grep in the awk|sed pipeline), and the tier `case` empty-string `*)` deny arm exists. Anchors accurate.
- **`tdd-247`** (executed, sandbox `sbx-tdd247-…`): reproduced the Phase-1 TDD — 4-space + tab ACCEPT fixtures FAIL against the unchanged extractor (RED), then PASS after widening **both** tokens (`/^[[:space:]]+provenance:/` + `/^[^[:space:]]/{exit}`); DENY floor stays exit 2; **load-bearing confirmed** — reverting either token independently re-denies a case.
- **`grep-249`** (executed, detached worktree): `grep -n 'top-level' docs/plans/2026-06-29-memory-provenance.md` returns exactly the 4 disclaimer/context hits (lines 75, 90, 101, 220), none asserting the field IS top-level — #249 is safe to verify-and-close.

## Findings & resolutions applied

| Probe(s) | Finding | Resolution |
|----------|---------|------------|
| claims-vs-reality, consistency-placeholders (both `fail`, CONFIRMED) | The plan claimed the **spec** says the runner count is "12 = 6 hooks + 5 skills" and calls that spec gloss "stale" (plan lines 53-56, 181-182). In reality the spec already states the correct "13 at HEAD — six hooks, seven skills". The plan's own gate breakdown (13 = 6+7) is correct; only its *characterization of the spec* was wrong. | Reworded both spots: dropped the false "spec says 12=6+5 / stale" attribution, kept the authoritative 13 = 6+7 breakdown, and noted the spec already agrees. No behavioral impact. |

Both findings lacked `severity`/`needsDecision`, so the gate correctly classified them as non-blocking — CLEARED stands. Fixed anyway to keep the plan honest.

## Residual risk

None blocking. The plan is a tightly-scoped shell-gate sweep (#247 two-token widen + #248 comment reword in one task; #249 verify-and-close; release v0.8.3). The executed TDD proves the #247 relaxation red-then-green and load-bearing; #249's grep post-condition is confirmed.

## Coverage summary

`{ probes: 8, executed: 3, analyzed: 5, pass: 6, fail: 2, warn: 0, expected: 8, onTarget: 8, offTarget: [], dropped: [] }` — coverage whole; no `INCOMPLETE` condition.
