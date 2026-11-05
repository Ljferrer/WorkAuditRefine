---
name: a-shared-write-clause-inside-a-read-only-prompt-contradicts-its-opener
description: "A shared clause that orders writes, put into a READ-ONLY prompt, lets a literal agent skip it"
metadata:
  promoted: dev/2026-10-28-blocked-ace-and-merge-provenance@phase-4
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
    - aceSegments continuation
    - segment_note removal
    - shared helper reaches every caller
  provenance: code-verified
  slug: a-shared-write-clause-inside-a-read-only-prompt-contradicts-its-opener
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-4 (task 4.1) + 2026-11-04-late-defects-fixed-in-run/phase-5 (p5-polish, recurrence)
  tags:
    - war
    - prompt-surface
    - workflow-template
    - refiner
  created: 2026-10-30
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-11-05T23:48:11.697Z
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

## Recurrence: a write order in a shared continuation (2026-11-04-late-defects-fixed-in-run, phase 5)

The phase-close polish put "Reuse any worktree it names, add none, and remove it once that log is complete" into the `aceSegments` continuation.
The ace base check needs it, because it gates in a throwaway worktree.
The READ-ONLY ace gate check (`aceGateGreen`) shares that continuation, and it gates in the task worktree.
`segment_note` is unfenced free text, so a note that named the task worktree would order its removal.
Two seats (cascading-impact and security) raised it, and a terminal polish round fixed it before land.

**The fix.** The removal order now sits only in the ACE BASE GATE CHECK body.
The shared continuation threads `Prior segment_note` and carries no write order.
A header comment above `aceBaseGates` records why.

**How to apply.** A shared continuation or helper reaches every caller, not only the one you are fixing.
Put a write order in the body of the one prompt that owns the write.
Never take a deletion target from free text such as `segment_note` without a path fence.

Locate-cue (phase 5): verify still present before acting. `aceSegments`, `aceBaseIds` and `aceGateGreen` in `skills/war/assets/workflow-template.js`, found @ phase 5 landed tip 86335b32.

Related: [[a-new-provision-run-in-a-shared-worktree-must-carry-the-restore-tracked-files-rule]], [[a-dispatch-context-key-that-names-an-action-must-ride-only-the-dispatches-that-run-it]].
