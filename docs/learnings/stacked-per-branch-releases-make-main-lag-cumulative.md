---
name: stacked-per-branch-releases-make-main-lag-cumulative
description: "N stacked unlanded releases = N-step baseline lag"
metadata:
  node_type: memory
  type: project
  keywords: [version jump, merge-base pin, integration base, baseline drift, false positive, semver leap, unlanded branches]
  slug: stacked-per-branch-releases-make-main-lag-cumulative
  phase: audit-fidelity/p3
  tags:
    - audit-mechanism
    - baseline
    - stacking
    - release
    - false-positive
    - diff-scoping
  related: "[[audit-baseline-must-pin-integration-branch-not-main-checkout]], [[stacked-release-plan-version-literal-lags-operator-target]]"
  created: 2026-06-26
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Stacked per-branch releases make the main-checkout baseline lag cumulatively

When N stacked plans each release on their own branch and none have landed on main, a
main-checkout audit baseline lags by N versions — a candidate's bump then reads as an N+1-step
leap. (First instance: audit-fidelity/p3, 0.6.0 → 0.6.5 looked like a 5-step jump; it was
baseline lag of 4 plus one legitimate patch.)

## Durable rule

**A multi-step version jump in the candidate diff, against a main-checkout baseline, is the
expected signal when N stacked plans have not all landed on main.** Auditors must not flag this
as scope error without first checking whether the increment collapses to a 1-step patch when
diffed against the correct integration base.

## How to diagnose

1. Count the stacked plans preceding the current one in docs/plans/ and their release tasks —
   each represents one version not yet on main.
2. If prior_stacks + 1 == observed step size, the candidate is correct; the lag is entirely in
   the baseline.
3. Pin the audit diff to the integration-branch baseline (merge-base SHA of the task branch vs.
   the integration branch tip) to see the true 1-step delta.

Compounding variant of [[audit-baseline-must-pin-integration-branch-not-main-checkout]] (the
general 1-step baseline-lag case); see also
[[stacked-release-plan-version-literal-lags-operator-target]].
