---
name: ""
metadata:
  node_type: memory
  slug: audit-baseline-must-pin-integration-branch-not-main-checkout
  phase: B2
  type: project
  keywords: [three-dot diff, merge-base, scope creep artifact, foreign branch history, inherited integration files, auditor diff leak]
  tags:
    - war
    - audit-mechanism
    - baseline
    - parallel-runs
    - diff-scoping
    - false-positive
    - template-obligation
  files:
    - skills/war/assets/workflow-template.js
    - skills/war/references/schemas.md
  relates:
    - "[[provision-barrier-refiner-owned-not-worker-self-create]]"
    - "[[run-provision-config-not-yet-mirrored-into-template]]"
  created: 2026-06-25
  originSessionId: 53421d17-5351-48da-baf8-7d315d56c7b5
---

# WAR audit baseline must be the stated integration branch, not the main-repo checkout

## The durable principle

An auditor's diff is only meaningful relative to its baseline. Pin it to the **integration tip the
task was built on** (`git diff <integrationBranch>...<task.branch>`, three-dot = merge-base..head),
never to the main-repo checkout. If the baseline is the main checkout, everything that landed on
the integration branch since main last moved leaks into every task's diff and masquerades as that
task's work — a systematic false-positive generator for the scope-creep and added-test lenses.

**Worse in parallel runs:** the main checkout may sit on a *completely different war's branch*, so
the baseline isn't just stale, it's unrelated — every audit diffs against foreign history.

Original finding (B2): the auditor nearly mis-scored T3 (#73)'s clean diff because files
legitimately inherited via the phase integration branch showed up inside the candidate diff and
read like scope creep / a forbidden added test.

**Codified:** `workflow-template.js` now emits the auditor prompt with self-served three-dot diff
(`git diff ${ph.integrationBranch}...${task.branch}`, re-run each round) and the header line "no
main-checkout baseline." The obligation has landed, not pending.

## How to apply

Any "inherited-from-integration" file in a candidate diff is a **baseline artifact to reconcile**,
not automatic scope-creep / smuggled-test evidence. Relates to the refiner-owned provisioning
barrier ([[provision-barrier-refiner-owned-not-worker-self-create]]) that establishes the
per-phase integration branch the baseline pins to.
