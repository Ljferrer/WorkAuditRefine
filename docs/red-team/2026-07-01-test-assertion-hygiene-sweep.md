# Red Team — test-assertion hygiene sweep plan (2026-07-01)

**Verdict:** CLEARED-WITH-NOTES — two Majors grilled and patched into the plan (re-verified clean); one Minor auto-fixed.

Plan: [`docs/plans/2026-07-01-test-assertion-hygiene-sweep.md`](../plans/2026-07-01-test-assertion-hygiene-sweep.md) (spec 13, issues #367 #373 #380, v0.8.13).
Source spec: [`docs/specs/2026-07-01-test-assertion-hygiene-sweep-design.md`](../specs/2026-07-01-test-assertion-hygiene-sweep-design.md).
Verified against a worktree pinned at the **spec-12 landed tip (v0.8.12, `0ec7632`)** — the tip this plan stacks on.

## Attack surface

Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility.
Bespoke: snippet-fidelity (construct anchors across the three test files + production guard), command-diff (regex mechanics + pre-state greps), edits-compose (all three edits applied + suites + both sanity proofs), baseline-repro (full gate at the spec-12 tip + #367 vacuity check).
Executed in sandbox: 4 of 9. Coverage whole after re-verify: 9/9 on-target, 0 dropped.

## Executed proof

- **Baseline:** full gate green at the spec-12 tip in a sandbox — 322/322 `node --test` + 13/13 `*.test.sh`; all four version slots read 0.8.12.
- **All anchors resolve by construct** at the new tip (line drift as predicted: #367 title now ~:2727, siblings :2674/:2724 — constructs intact; spec 12's `workflow-template.test.mjs` edit was +42/−10 as the plan's contention note claims).
- **Edits compose:** all three task edits applied together → target suites green (120/21/30) and the full gate green (322 node + 13 bash).
- **#373 sanity reproduces:** with the OLD regex, adding a `landDecision === 'held:phase-incomplete'` comparison to production false-REDs exactly the 2 predicted tests; with the tightened regex the same edit stays green — the latent trap is real and the fix closes it.
- **#380 sanity reproduces:** the plan's Step-2b snippet ran near-verbatim against the file's real fixtures (`baseArgs`/`runScaffold`/`passResult` all exist); rewriting the production guard to a name check turns ONLY the new bespoke-executed assertion RED (the old 1c test stays green — proving the name-scope gap the issue describes).
- **#367 vacuity confirmed** (audit-blocked short-circuit; deletion leaves single-attempt covered by the two sibling asserts).
- **`requiresTest` floor claim holds:** `assert-test-in-diff.sh` default pattern covers `skills/**/*.test.mjs`, so #380's `requiresTest:true` is a live precondition.

## Findings

### Major (2 — both resolved by plan patch, re-verified clean)
- [Major, needsDecision] *Plan targets v0.8.13 but the source spec says v0.8.12.* Adjudicated (AFK policy): the spec's literal is stale pre-stacking prose; the roadmap (the plan's declared authoritative version source) assigns spec 13 = v0.8.13, and spec 12 **landed v0.8.12 the same day** (PR #401 — tip `plugin.json` reads 0.8.12), so the plan's own next-free-patch fallback independently yields 0.8.13. Resolution: inline **Version authority** paragraph added to Coordination. `coverage-vs-source` re-ran clean.
- [Major] *Spec's 6 numbered validation gates unmapped in the plan.* Resolution: added **## Validation criteria (spec → plan mapping)** table (all 6 gates → concrete plan steps). Re-ran clean.

### Minor (1 — auto-fixed)
- [Minor] *Task 2 Step 4's `grep -n "=(?![=])"` can never match* — in BRE, `[=]` is a bracket expression matching bare `=`; reproduced failing on BSD grep and ugrep even after a correct edit. Resolution: post-condition switched to `grep -Fn '=(?![=])'` with an explanatory note.

## Resolutions applied (grill decisions)

- v0.8.13 vs spec v0.8.12 → roadmap + landed-baseline authority, baked inline → Coordination "Target version".
- Missing validation mapping → new "Validation criteria (spec → plan mapping)" section.
- BRE grep trap → `-F` fixed-string post-condition in Task 2 Step 4.

## Residual risk

- Plan line numbers (grounded at v0.8.11 master) have drifted at the spec-12 tip; the plan already mandates construct-anchoring, and all constructs verified present.
- The #380 snippet is illustrative — workers must adapt to the file's real fixtures (verified adaptable in sandbox).
