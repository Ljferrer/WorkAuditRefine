---
name: run-task-ids-diverge-from-the-plan-file-when-a-ruling-phase-is-inserted-mid-run
description: A ruling phase inserted mid-run makes Release run task 4.1 while the committed plan still calls it Task 3.1
metadata:
  node_type: memory
  type: project
  keywords:
    - phase renumber
    - inserted phase
    - run task id
    - plan file task id
    - ADR task citation
    - decision log citation
    - task 3.1 ambiguity
    - release phase number
    - ruling phase
    - p3-3.1 branch
    - plan amendment not committed
  provenance: code-verified
  slug: run-task-ids-diverge-from-the-plan-file-when-a-ruling-phase-is-inserted-mid-run
  phase: "2026-10-20-rea-artifact-evidence/phase-4 (task 4.1, p4-polish, servitor)"
  tags:
    - war
    - plan-authoring
    - doc-truth
    - citation
  created: 2026-10-22
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-22T17:12:10.694Z
---

# Run task ids can diverge from the plan file after a mid-run phase insert

## Fact

The plan file `docs/plans/2026-10-20-rea-artifact-evidence.md` has headings for Phases 1, 2, 3, 5, 6 and 7, and none for Phase 4. Phase 3 is `## Phase 3 — Release`. Its only task is `### Task 3.1: Version bump`.

The run executed four phases before the post-release amendment.
- Phase 3 held tasks 3.1 and 3.2. They carried the operator rulings #2402 to #2406. Branch `war/2026-10-20-rea-artifact-evidence/p3-3.2` is on origin. `.../p3-3.1` is gone.
- Release ran as phase 4, task 4.1. Its branch `.../p4-4.1` is gone. It shipped 0.21.17.

The plan file still has no heading for the ruling phase, and a grep of it for the ruling numbers finds nothing. Commit c923a70c added an "As executed" sentence to its build-order line: Phase 3 ran the rulings, Lead-inserted, and the plan's Phase 3 ran as Phase 4 (Task 3.1 as Task 4.1).

`docs/adr/0053-rea-artifact-evidence-source.md` (Decision log, the 2026-10-21 row) cites "plan 2026-10-20-rea-artifact-evidence task 3.1" for those rulings. Resolved against the plan file, that citation lands on the version bump. The two lessons that say "phase-3 task 3.1 ruling" use the run id too.

## Cause

The Lead threaded the extra phase into the run and left the phase list alone. The plan's own "As executed" sentence calls the phase Lead-inserted.

## How to apply

- Do not treat a run task id as a plan-file anchor. Resolve it through the `war/<slug>/pN-N.M` branch names and the handoff. Those branches can be deleted later, so also read the plan's build-order line.
- When you cite a task from a run that inserted a phase, write "run task N.M" or name the branch. Add the plan task title.
- If the plan file must stay readable after the run, amend its phase list when the phase is inserted. Do it in a Lead or Checkpoint commit, not in a task. Commit c923a70c is a late example: it recorded the insert in the build-order line.
- When an audit seat finds an ADR "task N.M" that does not match the plan file, check the run's branch names before filing a citation defect.
- No end-state check is affected: the check text travels with the threaded plan.

Related: [[plan-decision-id-and-end-state-id-can-share-a-numeral-and-get-conflated-in-worker-self-reports]] (a different id mix-up, same reader trap).

## Locate-cue (verify still present before acting)

`docs/plans/2026-10-20-rea-artifact-evidence.md`, search `## Phase 3 — Release` and `As executed`. `docs/adr/0053-rea-artifact-evidence-source.md`, search `task 3.1` under `## Decision log`. Found at the phase-4 integration tip 6277998a, read through the run's `_refinery` worktree. That commit is the second parent of landed tip c2e4b1c5. The landing merge's first parent, 67526e8c, is the phase base and an ancestor of it, so the two trees match by ancestry (tree not read directly). The cwd checkout was on another branch, so the first grounding rung failed and the worktree rung held.

> archived 2026-10-30: resolved — moved to archive
