---
name: redteam-adjudication-is-authoritative-version-source
description: "Version precedence: task instruction > red-team adjudication > plan literal; check the red-team report before scoring"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  keywords: [version bump precedence, stale plan literal, semver override, task instruction priority, stacked release base, false defect scoring]
  slug: redteam-adjudication-is-authoritative-version-source
  phase: audit-fidelity/p3
  tags:
    - release
    - stacking
    - red-team
    - plan-drift
    - adjudication
    - operator-override
  related: "[[stacked-release-plan-version-literal-lags-operator-target]], [[release-status-is-replace-slot-not-empty-field]], [[release-bump-slots-canonical-no-badge]]"
  created: 2026-06-26
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Red-team adjudication is the authoritative version source when it overrides the plan body

**What happened (audit-fidelity Phase 3 / Task 4):** the plan drafted "Bump to v0.7.0"; the red-team report (docs/red-team/2026-06-25-audit-fidelity.md, Version adjudication row) adjudicated it down to v0.6.5 over the stacked v0.6.4 base; the task instruction confirmed v0.6.5 and the worker bumped to v0.6.5 — rated plan-faithful. (The plan's Task 4 Step 1 literal has since been patched to v0.6.5; only its "Baseline-drift" note records the v0.7.0 draft.)

## Why a stale plan literal is a Nit, not a defect

The plan body's stale literal is documentation drift, not a work error. The auditor should:
1. Locate the red-team report for the same plan slug.
2. Check for version override language ("patch over", "v0.X.Y as base", "adjudicated to").
3. If the worker matches the adjudicated (not literal) version, mark as Nit only.
4. If the worker matches neither the literal NOR the adjudication, escalate as a defect.

## Durable rule

**In a stacked-release pipeline: plan literal < red-team adjudication < task instruction.** A worker following the task instruction (or red-team adjudication) rather than the plan body's hardcoded version string is correct. Auditors must consult `docs/red-team/<plan-slug>.md` before scoring version mismatches as defects.

See also [[stacked-release-plan-version-literal-lags-operator-target]] for the general case where only the task instruction differs (no red-team intermediate). This note covers the three-level chain.
