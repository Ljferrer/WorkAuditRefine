---
name: ""
metadata:
  node_type: memory
  type: project
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

## What happened (audit-fidelity Phase 3 / Task 4)

The plan body (docs/plans/2026-06-25-audit-fidelity.md, Task 4 Step 1 and commit message) was drafted saying "Bump to v0.7.0". The red-team report (docs/red-team/2026-06-25-audit-fidelity.md, the Version adjudication rows) adjudicated this DOWN to v0.6.5, calling it a patch over the stacked v0.6.4 base. The task instruction (spawn prompt) then confirmed v0.6.5. The worker bumped to v0.6.5. The auditor rated this plan-faithful, not a deviation. (The plan's Task 4 Step 1 literal has since been patched to v0.6.5; only the plan's top-of-file "Baseline-drift + ratification note" still records that it was drafted at v0.7.0.)

## Adjudication chain

Plan body → red-team adjudication → task instruction, each potentially specifying a different version. The priority is: **task instruction > red-team adjudication > plan body literal**. When the red-team report overrides the plan's version, the adjudicated version is what the worker must implement, and the task instruction reflects that adjudication.

## Why it is a Nit, not a defect

The plan body's stale literal is documentation drift, not a work error. The auditor should:
1. Locate the red-team report for the same plan slug.
2. Check for version override language ("patch over", "v0.X.Y as base", "adjudicated to").
3. If the worker matches the adjudicated (not literal) version, mark as Nit only.
4. If the worker matches neither the literal NOR the adjudication, escalate as a defect.

## Durable rule

**In a stacked-release pipeline: plan literal < red-team adjudication < task instruction.** A worker following the task instruction (or red-team adjudication) rather than the plan body's hardcoded version string is correct. Auditors must consult `docs/red-team/<plan-slug>.md` before scoring version mismatches as defects.

See also [[stacked-release-plan-version-literal-lags-operator-target]] for the general case where only the task instruction differs (no red-team intermediate). This note covers the three-level chain.
