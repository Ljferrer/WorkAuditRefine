# Red Team — spec/doc prose-drift reconciliation plan (2026-07-01)

**Verdict:** CLEARED — one Major and two needsDecision findings grilled and patched (two bounded re-verify rounds); final gate 8/8 pass, zero outstanding.

Plan: [`docs/plans/2026-07-01-spec-and-doc-prose-drift-reconciliation.md`](../plans/2026-07-01-spec-and-doc-prose-drift-reconciliation.md) (spec 14, issues #368 #385 #392, v0.8.14).
Source spec: [`docs/specs/2026-07-01-spec-and-doc-prose-drift-reconciliation-design.md`](../specs/2026-07-01-spec-and-doc-prose-drift-reconciliation-design.md).
Verified against a worktree pinned at the **spec-13 landed tip (v0.8.13, `5d5e77e`)** — the tip this plan stacks on.

## Attack surface

Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility.
Bespoke: snippet-fidelity (both doc anchors + authorities + #392 premises), edits-compose (apply both edits, doc-parity inertness, full gate), baseline-repro (gate + slots + #392 evidences).
Executed in sandbox: 3 of 8. Coverage whole: 8/8 on-target, 0 dropped.

## Executed proof

- **Baseline:** full gate green at the spec-13 tip (321/321 node + 13/13 `*.test.sh`); all four version slots read 0.8.13.
- **#368 inertness PROVEN, not asserted:** `land-decision.test.mjs` 21/21 green both pre- and post-`aced` insert; the doc-parity extractor regex confirmed to match only backticked `landed|held:*` enum tokens.
- **Both edits compose:** full gate green with both prose edits applied in sandbox.
- **#392 evidences reproduce:** `'8 cases'` grep → 0 at HEAD **and at all three historical revisions** of the hygiene-sweep plan; case-11 rationale present in the `assert-no-submodule-mutation.test.sh` header (lines 10–31).

## Findings

### Major (1 — patched, re-verified clean in round 1)
- [Major, CONFIRMED by execution] *Plan cited "(§5.5)" for the refiner's unreachable-pin refusal, but §5.5 contains only the 2A/2B landing procedures* — the refusal lives in the §4.1 Refiner bullet (`:119`) and §12 criterion 3 (`:268`). Task 2 would have shipped a fresh wrong attribution inside the very sentence being fixed for wrong attribution. Resolution: plan decision (#385) + Task 2 Step 2 reworded to cite **§4.1** (exercised under §5.5's landing authority), with an explicit "do NOT cite §5.5" note. `executable-proof` re-ran clean.

### needsDecision (2 — resolved by the same patches, re-verified clean in round 2)
- claims-vs-reality's duplicate of the §5.5 misattribution — resolved by the round-1 patch.
- *"One-sentence swap" mislabels a two-sentence replacement* (the spec's blockquote is two sentences). Resolution: plan reworded to "single-passage swap — the replacement reads as two sentences". (The spec's own line 47 phrasing is left as-is — red-team writes only the plan + report; noted as harmless.)

### Minor (1 — auto-fixed in round 1)
- *"committed once at `75d4d72`, never edited"* was false (the file has three commits: `75d4d72` → `3f4f3d5` → `c6882a7`); the load-bearing '8 cases' absence holds at every revision. Resolution: evidence reworded to per-revision absence.

## Resolutions applied (grill decisions)

- §5.5 → §4.1 citation correction (decision #385 + Task 2 Step 2).
- "One-sentence" → "single-passage (two sentences)" phrasing.
- #392 evidence strengthened to per-revision grep.

## Residual risk

- The source spec retains its own "(§5.5)" citation and "one-sentence" phrasing (spec file not writable by red-team); the plan now explicitly overrides both, and the plan is what workers execute.
- Version literal 0.8.14 subject to the plan's next-free-patch fallback.
