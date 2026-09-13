---
name: full-dag-relaunch-of-already-merged-task-content-escalates-empty-unmatched
description: A relaunched task whose content already merged in a prior attempt trips the pin-transfer empty-unmatched fail-closed arm
metadata: 
  node_type: memory
  type: project
  keywords: 
    - pin-transfer
    - empty-unmatched
    - task-integrated.sh
    - full-dag relaunch
    - derive-and-skip
    - resume
    - escalation
    - already_upstream
    - fast-forward
    - WAR-Task trailer
  provenance: code-verified
  slug: full-dag-relaunch-of-already-merged-task-content-escalates-empty-unmatched
  phase: 2026-09-11-backward-chain-doctrine/phase-2 (task 2.2)
  tags: 
    - engine
    - refine
    - merge
    - pin-transfer
    - resume
  created: 2026-09-12
  originSessionId: 5a652d85-60d8-4ec9-9cbf-3333802c7056
  modified: 2026-09-12T23:40:53.562Z
---

When a phase attempt fails partway (e.g. a sibling task's worker dies at a usage limit), a sanctioned
full-DAG relaunch can resume a task whose content already landed on the integration branch in the
failed attempt. If that task's branch gets rebased/fast-forwarded straight onto the current
integration tip, it now carries **zero commits beyond the merge-base** with integration. The
pin-transfer probe (`skills/war/assets/workflow-template.js`, `probeStatus === 'empty-unmatched'`
arm) then refuses to record it merged and escalates, even though the task's work is genuinely
already upstream — this is the intended fail-closed behavior (#1895: a zero-commit branch is
vacuously an ancestor, so silently recording it "merged" would hide a never-started task).

The refusal is legitimate, not a bug: the probe cannot distinguish "genuinely never started" from
"already fast-forwarded because attempt 1 already merged this exact content." Resolving it requires
a human/Lead-side ancestry check (was this task's content already integrated under its own
WAR-Task-trailer commits, forward of the current phase base?) before manually completing the land.
Related: [[zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged]]
(the underlying #1895 fix this arm implements) and
[[merge-dispatch-death-after-its-own-push-lands-commits-with-the-task-recorded-unmerged]] (a sibling
resume-shape gotcha).

Locate-cue: verify still present before acting — `probeStatus === 'empty-unmatched'` arm at
`skills/war/assets/workflow-template.js` (verifyPinTransfer / merge-task pin-transfer dispatch
region); the underlying provenance probe is `skills/war/assets/task-integrated.sh`.
