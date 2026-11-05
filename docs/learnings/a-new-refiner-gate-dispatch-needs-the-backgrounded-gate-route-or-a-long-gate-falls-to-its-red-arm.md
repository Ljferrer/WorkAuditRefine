---
name: a-new-refiner-gate-dispatch-needs-the-backgrounded-gate-route-or-a-long-gate-falls-to-its-red-arm
description: "A new refiner gate dispatch needs backgroundGateRule and a segment loop, or its feature works only on fixtures"
metadata:
  node_type: memory
  type: project
  keywords:
    - backgroundGateRule
    - segmentLoop
    - gate_segment incomplete
    - backgrounded gate
    - gate outruns the turn
    - ace-base-gate
    - new gate dispatch site
    - fails closed in the field
  provenance: code-verified
  slug: a-new-refiner-gate-dispatch-needs-the-backgrounded-gate-route-or-a-long-gate-falls-to-its-red-arm
  phase: 2026-11-04-late-defects-fixed-in-run/phase-5 (task 5.1)
  tags:
    - war
    - workflow-template
    - refiner
    - gate
    - dispatch-site
  created: 2026-11-05
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-05T23:49:09.305Z
---

# A new refiner gate dispatch needs the backgrounded-gate route

**What happened.** Task 5.1 added a new gate dispatch, the ACE BASE GATE CHECK (`aceBaseIds`).
It runs the full `plan.gate` at the pre-ace tip.
The first version had no `backgroundGateRule` and no segment loop.
This repo's gate outlasts a refiner turn, so the refiner returns nothing or backgrounds with no contract.
The `.then` guard then reads no base ids, and the ace tip forward-reverts.

**Why it hid.** The failure is fail-closed, so nothing looks broken.
The proceed-over feature (PIN-10) passed every fixture, because fixtures answer at once.
In the field it would never fire for a repo whose gate needs backgrounding.
A cascading-impact seat found it by comparing the new dispatch with the ace gate check beside it.

**The fix at the landed tip.** `aceBaseIds` appends `aceBgRule` to its prompt and dispatches through `aceSegments`, the segment loop the ace gate check uses.
A segment reply, even a spent one, names no base ids.
A late-defect-4 row proves a backgrounded base gate re-dispatches and then proceeds over.

**How to apply.**
- If you add a dispatch that runs `plan.gate`, copy the full gate contract from a sibling site: `backgroundGateRule` with the site's return pair, the gate capture clause, and a `segmentLoop` with the same segment predicate.
- Add a fixture whose first reply is the segment pair. A fixture that answers at once cannot show the gap.
- At the landed tip, a grep of the test files found only per-site `run_in_background` checks. No census fails when a new gate site omits the rule.

Locate-cue: verify still present before acting. `backgroundGateRule`, `aceBgRule`, `aceSegments` and `aceBaseIds` in `skills/war/assets/workflow-template.js`, and the "a backgrounded base gate re-dispatches on the segment pair" row in `skills/war/assets/workflow-template.late-defect-4.test.mjs`, found @ phase 5 landed tip 86335b32.

Related: [[a-new-provision-run-in-a-shared-worktree-must-carry-the-restore-tracked-files-rule]], [[a-shared-write-clause-inside-a-read-only-prompt-contradicts-its-opener]], [[segmented-land-in-band-marker-consumed-without-its-contracted-status-pairing]].
