---
name: a-held-land-wrap-up-runs-before-the-resolution-so-the-lead-skip-rule-drops-resolution-learnings
description: "On a held phase the servitor's Landed tip names the integration branch; ground there, and take the gate-audit rung when nothing merged"
metadata:
  node_type: memory
  type: project
  keywords:
    - held-land wrap-up
    - servitorResult already set
    - resolution capture
    - manual land servitor
    - wrapUpDecision
    - held:escalation learnings
    - integration branch anchor
    - unruled ask
  provenance: code-verified
  slug: a-held-land-wrap-up-runs-before-the-resolution-so-the-lead-skip-rule-drops-resolution-learnings
  phase: 2026-11-08-engine-recovery-relaunch-and-land/phase-2 (task 2.1)
  tags:
    - war
    - servitor
    - lead
    - recovery
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T16:11:28.455Z
---

# On a held phase, the servitor grounds on the integration branch

Since #2702 the engine runs the Wrap-up on `landed`, `held:escalation` and `held:land-failed` (`wrapUpDecision` in `skills/war/assets/workflow-template.js`).
On a hold, the servitor runs at the hold, before the operator rules or the Lead lands by hand.

**RESOLVED (policy half):** the Lead skip rule no longer drops resolution learnings. The `skills/war/SKILL.md` Invariants bullet now runs one more resolution-fed `war-servitor` pass after a manual or recovery land of a held phase, even when `servitorResult` is set (1eeaf6fd).

**For the servitor itself.** On a hold, the `Landed tip:` line carries the last merge tip and names `ph.integrationBranch`, not the working branch.
Ground on that integration branch.
On `held:escalation` with nothing merged, the anchor is the "landed tip unrecorded" placeholder (`landedTipAnchor`), so take the gate-audit fallback rung.

Related: [[held-escalation-lead-manual-completion]], [[turning-an-always-hold-signal-into-a-fix-route-stales-every-reader-that-assumed-it-held]].

Locate-cue: verify still present before acting. `wrapUpDecision`, `landedTipAnchor` and the `Landed tip:` line (it picks `ph.workingBranch` only when `landDecision === 'landed'`) in `skills/war/assets/workflow-template.js`; the "Every landed phase captures learnings once, plus one resolution-fed pass after a held phase lands" bullet in `skills/war/SKILL.md`.
