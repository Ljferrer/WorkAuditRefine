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

When the Lead inserts a phase mid-run and leaves the plan's phase list alone, run task ids and plan-file task ids stop matching.

Example: in `docs/plans/2026-10-20-rea-artifact-evidence.md`, Phase 3 is `## Phase 3 — Release` with one task, `### Task 3.1: Version bump`. The run inserted a ruling phase as phase 3 (tasks 3.1 and 3.2 carried the operator rulings), so Release ran as phase 4, task 4.1. The plan file has no heading for the ruling phase. A later commit added only an "As executed" sentence to its build-order line.

`docs/adr/0053-rea-artifact-evidence-source.md` (Decision log, the 2026-10-21 row) cites "plan 2026-10-20-rea-artifact-evidence task 3.1" for those rulings. Resolved against the plan file, that citation lands on the version bump. The two lessons that say "phase-3 task 3.1 ruling" use the run id too.

## Cause

The Lead threaded the extra phase into the run and left the phase list alone. The plan's own "As executed" sentence calls the phase Lead-inserted.

## How to apply

- Do not treat a run task id as a plan-file anchor. Resolve it through the `war/<slug>/pN-N.M` branch names and the handoff. Those branches can be deleted later, so also read the plan's build-order line.
- When you cite a task from a run that inserted a phase, write "run task N.M" or name the branch. Add the plan task title.
- If the plan file must stay readable after the run, amend its phase list when the phase is inserted. Do it in a Lead or Checkpoint commit, not in a task. Recording the insert only in the build-order line, after the fact, is the weak form.
- When an audit seat finds an ADR "task N.M" that does not match the plan file, check the run's branch names before filing a citation defect.
- No end-state check is affected: the check text travels with the threaded plan.

Related: [[plan-decision-id-and-end-state-id-can-share-a-numeral-and-get-conflated-in-worker-self-reports]] (a different id mix-up, same reader trap).

## Locate-cue (verify still present before acting)

`docs/plans/2026-10-20-rea-artifact-evidence.md`, search `## Phase 3 — Release` and `As executed`. `docs/adr/0053-rea-artifact-evidence-source.md`, search `task 3.1` under `## Decision log`.

> archived 2026-10-30: resolved — moved to archive
