---
name: a-new-ask-the-operator-step-must-state-its-afk-arm
description: "A new ask-the-operator step needs an --afk arm, or an unattended drafter has no rule"
metadata:
  node_type: memory
  type: project
  keywords:
    - afk
    - unattended
    - ask the operator
    - budget check
    - fork trials
    - pair beats
    - war-machine --afk
    - alwaysAskAdvancedPlanning
  provenance: code-verified
  slug: a-new-ask-the-operator-step-must-state-its-afk-arm
  phase: 2026-11-08-pipeline-skills-and-memory-tooling/phase-1
  tags:
    - war-strategy
    - afk
    - doctrine
  created: 2026-11-12
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-13T04:26:40.552Z
---

**Fact.** Task 1.3 added a `## Budget check` section to `skills/war-strategy/references/fork-trials.md`.
Its step 2 says to ask the operator whether to run fork trials and pair beats.
The `## AFK` section of the same file says no pair beat is suppressed under `/war-machine --afk`.
The Budget check has no `--afk` arm, so an unattended drafter that meets a trigger has no rule.
Two audit seats raised this as an `ask`. It was not ruled before land.

**How to apply.**
- When doctrine adds an "ask the operator" step, also state what an `--afk` run does at that step.
- Check the step against the file's own AFK section and ADR 0044 Decision item 7.
- Until the ask is ruled, do not invent an arm in a later task.

**Locate-cue.** Verify still present before acting: `## Budget check` step 2 and `## AFK` in `skills/war-strategy/references/fork-trials.md`. Found @ phase 1, tip 759b2c9e.

Related: [[afk-self-adjudicate-escalate-only-if-unresolvable]].
