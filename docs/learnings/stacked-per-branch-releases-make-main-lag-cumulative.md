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

**RESOLVED (audit prompts) — kept as concept anchor.** The Release-baseline rule in `agents/war-auditor.md` and the mirrored `RELEASE-BASELINE RULE` in `skills/war/assets/workflow-template.js` now tell auditors to judge a release diff against the three-dot `${integrationBranch}...${task.branch}` set, never a main checkout.

When N stacked plans each release on their own branch and none has landed on main, a main-checkout baseline lags by N versions, so a correct 1-step bump reads as an N+1-step leap (first instance: audit-fidelity/p3, 0.6.0 → 0.6.5 was 4 steps of lag plus one patch).
Do not flag such a jump as a scope error.
To diagnose, count the stacked plans before this one; if that count + 1 equals the observed step, the lag is all in the baseline.
ADR 0011 stack-and-plow keeps this situation live.

Compounding variant of [[audit-baseline-must-pin-integration-branch-not-main-checkout]]; see also [[stacked-release-plan-version-literal-lags-operator-target]].
