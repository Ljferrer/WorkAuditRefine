---
name: never-move-report-it-merged-sentence-resolves-to-a-hold-not-a-recorded-merge
description: "NEVER_MOVE_MERGED says report it merged, but the engine holds such a task instead"
metadata:
  node_type: memory
  type: project
  keywords:
    - NEVER_MOVE_MERGED
    - neverMoveStep
    - already merged
    - empty-unmatched
    - pin-transfer probe
    - taskMergeMatches
    - D11
    - ancestor of integration tip
  provenance: code-verified
  slug: never-move-report-it-merged-sentence-resolves-to-a-hold-not-a-recorded-merge
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-2 (task 2.1)
  tags:
    - war-engine
    - merge
    - pin-transfer
    - plan-faithfulness
  created: 2026-10-29
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-10-29T19:14:58.945Z
---

# The never-move "report it merged" sentence ends in a hold, not a recorded merge

**The sentence.** `NEVER_MOVE_MERGED` in `skills/war/assets/workflow-template.js` reads: "never rebase, move or re-merge it, and report it merged."
Plan #2485 D11 (PIN-11) places it at the pin-transfer probe step (2), all four merge step (a) copies and the refiner card step 1.
ES9 guards the verbatim text.

**What the engine does with it.**
- At the probe step (2), the prompt tells the refiner to return `empty-unmatched` with detail "already merged". The engine escalates that status. The probe status enum has no merged member.
- At a merge step (a) copy, a "merged" reply cannot pass `taskMergeMatches`. That predicate needs `parents[0]` equal to the snapshot `base_sha`, and for an already-merged branch the snapshot base is the current tip. `confirmMerge` refuses, and reconcile returns unmerged or uncertain, so the task holds.

**Why this is correct.** Recording a merge on the refiner's word alone would bring back the #1895 failure.
A zero-commit branch is also an ancestor of the tip, so ancestry alone cannot prove a merge.
The guardrail (never rebase, move or re-merge) holds at every site.

**What to expect.** An already-merged task surfaces as a hold whose `detail` says "already merged".
The escalation note of the `empty-unmatched` arm describes the already-upstream legs, not this case.
The main path for an already-merged task is the `task-integrated.sh` resume proof (plan Task 3.1), not this arm.
Do not "fix" the hold by landing on the probe's report.

Related: [[zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged]].

Locate-cue: verify still present before acting. Found `NEVER_MOVE_MERGED`, `neverMoveStep` and the probe step (2) `empty-unmatched` clause in `skills/war/assets/workflow-template.js` at landed tip 9bcc4fa6 (phase 2). Source: correctness, cascading-impact and plan-faithfulness note findings, no ruling needed.
