---
name: a-held-land-wrap-up-runs-before-the-resolution-so-the-lead-skip-rule-drops-resolution-learnings
description: "A held-land Wrap-up sets servitorResult before the manual land, so the Lead's skip rule drops resolution learnings"
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

# A held-land Wrap-up runs before the resolution, so the Lead's skip rule drops resolution learnings

Since #2702 the engine runs the Wrap-up on `landed`, `held:escalation` and `held:land-failed` (`wrapUpDecision` in `skills/war/assets/workflow-template.js`).
On a hold, the servitor runs at the hold, before the operator rules or the Lead lands by hand.
So `servitorResult` is already set when the Lead finishes a manual land.

`skills/war/SKILL.md` § Invariants still says "Skip if `servitorResult` is already set."
The Lead therefore skips the post-manual-land servitor pass.
That pass was the only one fed the operator's resolution and the fix outcome.
Net effect: resolution learnings of a held phase are not captured.

A recovery relaunch that later lands also runs its own in-flow Wrap-up, so one phase can be captured twice.

**Open policy question.** Three audit rounds raised this as an `ask`. The plan (D34) widened the gate but made no ruling on the Lead pass. One later seat judged the skip correct ("keeps exactly-once").
The fork: keep the skip and lose the resolution, or run a resolution-only servitor pass after a manual land.
Until the operator rules, a Lead closing a held phase by hand should decide this deliberately, not by the skip rule's default.

**For the servitor itself.** On a hold, the `Landed tip:` line carries the last merge tip and names `ph.integrationBranch`, not the working branch.
Ground on that integration branch, not on the working branch.
On `held:escalation` with nothing merged, the anchor is the "landed tip unrecorded" placeholder, so take the gate-audit fallback rung.

Related: [[held-escalation-lead-manual-completion]], [[turning-an-always-hold-signal-into-a-fix-route-stales-every-reader-that-assumed-it-held]].

Locate-cue: verify still present before acting — `wrapUpDecision` and the `Landed tip:` line (it picks `ph.workingBranch` only when `landDecision === 'landed'`) in `skills/war/assets/workflow-template.js`, and the "Every landed phase captures learnings exactly once" bullet in `skills/war/SKILL.md`. Found @ integration tip 8501616b, the second parent of landed tip 15a7f598 (the run's `_refinery` worktree, HEAD on that integration branch). The policy consequence is an unruled ask, not code-verified.
