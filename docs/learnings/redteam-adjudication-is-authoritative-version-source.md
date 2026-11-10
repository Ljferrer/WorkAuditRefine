---
name: redteam-adjudication-is-authoritative-version-source
description: "Version precedence: task instruction > red-team adjudication > plan literal"
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

**Status.** The rule is now standing doctrine: the Version-precedence rule in `agents/war-auditor.md`. This lesson is its origin story.

**What happened.** In audit-fidelity phase 3, the plan said "Bump to v0.7.0". The red-team report (`docs/red-team/2026-06-25-audit-fidelity.md`, Version adjudication row) cut it to v0.6.5 over the stacked v0.6.4 base, and the worker bumped to v0.6.5. That was plan-faithful.

## Durable rule

**In a stacked-release pipeline: plan literal < red-team adjudication < task instruction.**
A stale plan literal is documentation drift, a Nit at most.
Before scoring a version mismatch as a defect, read `docs/red-team/<plan-slug>.md` for override language ("patch over", "adjudicated to").
A worker that matches the adjudicated version is correct.
A worker that matches neither the literal nor the adjudication is a defect.

See also [[stacked-release-plan-version-literal-lags-operator-target]] for the case where only the task instruction differs. Related: [[release-status-is-replace-slot-not-empty-field]], [[release-bump-slots-canonical-no-badge]].
