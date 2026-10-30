---
name: a-shared-write-clause-inside-a-read-only-prompt-contradicts-its-opener
description: "A shared clause that orders writes, put into a READ-ONLY prompt, lets a literal agent skip it"
metadata:
  node_type: memory
  type: project
  keywords:
    - READ-ONLY opener
    - ace gate
    - aceGateGreen
    - prompt contradiction
    - interpolated clause
    - provision re-run skipped
    - PROVISION_RERUN_CLAUSE
  provenance: code-verified
  slug: a-shared-write-clause-inside-a-read-only-prompt-contradicts-its-opener
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-4 (task 4.1)
  tags:
    - war
    - prompt-surface
    - workflow-template
    - refiner
  created: 2026-10-30
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-10-30T10:18:32.766Z
---

# A shared write clause inside a READ-ONLY prompt contradicts its opener

**The pattern.** A dispatched prompt opened with "READ-ONLY: run the gate, change nothing".
Task 4.1 then interpolated `PROVISION_RERUN_CLAUSE`, which orders provision steps, a tracked-file restore and a marker write.
A refiner that obeys the opener literally can skip the re-run.
It then gates an unprovisioned tree, which is the exact risk the clause exists to close.
Three audit seats raised it in round 1, and a fix round reworded the opener before land.

**At the landed tip.** The `aceGateGreen` prompt in `skills/war/assets/workflow-template.js` now says "change nothing beyond the provision re-run and its restore".
A grep for `READ-ONLY:` across `skills/` and `agents/` found only this one site at the pin.

**How to apply.** If you interpolate a shared clause into a new prompt, read that prompt's opener and any restriction sentence.
If the clause orders a write the opener forbids, name the clause as the exception in the opener.
Search for every prompt that already carries the clause, since one constant can reach many openers.

Locate-cue: verify still present before acting. Found at `skills/war/assets/workflow-template.js` (`aceGateGreen`, dispatchKind `ace-gate`) @ phase 4, landed tip 426c70a8.

Related: [[a-new-provision-run-in-a-shared-worktree-must-carry-the-restore-tracked-files-rule]].
