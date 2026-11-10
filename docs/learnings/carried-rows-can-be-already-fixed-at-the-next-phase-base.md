---
name: carried-rows-can-be-already-fixed-at-the-next-phase-base
description: "A finding row carried into the next phase can be fixed already by a late fix, so the task escalates with nothing to commit"
metadata:
  promoted: dev/2026-11-08-engine-recovery-relaunch-and-land@phase-5
  node_type: memory
  type: project
  keywords:
    - carried rows
    - seed task nothing to commit
    - stale carry
    - late fix landed between phases
    - escalation no diff
    - phase carry verify at base
    - late-fix pass redispatch
    - fixRounds exhausted empty commit
    - held:escalation stale doc rows
  provenance: code-verified
  slug: carried-rows-can-be-already-fixed-at-the-next-phase-base
  phase: "2026-11-08-engine-recovery-relaunch-and-land/phase-3 (seed-2, seed-3) + phase-5 (late-fix pass, recurrence)"
  tags:
    - planning
    - carry
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T19:52:26.854Z
---

# Carried rows can be already fixed at the next phase base

**Rule.** When you carry a row to a later phase, check the row against the new phase base first.
If a late fix already landed it, drop the seed task.
A seed task with no diff escalates, and it costs a worker round.
Before you seed or re-queue a late row, re-read the named construct at the current tip.
A hold that lists doc rows may be mostly stale, so check each row before you rule on the hold.

**Instances.** Phase 3 seed tasks found their carried rows already fixed by a phase 2 late fix, and each worker escalated with nothing to commit.
In phase 5, the late-fix pass kept re-dispatching seven doc rows that the integration tip already fixed, until fixRounds hit run.roundLimit and the phase held as `held:escalation`.

**Engine status (D42, #2773).** `lateFixPass` in `skills/war/assets/workflow-template.js` now has an at-tip arm.
A worker that makes no commit and returns a `blocked_reason` starting with `LATE_FIX_AT_TIP` gets one re-audit of the tip, if `probeDiff` shows an empty range.
An approving re-audit drops the row, gives back the round's `origin.fixRounds` charge and records it on `lateFixed` with `atTip` (the `atTipFixed` flag).
Otherwise the round stays charged and `lfPrior` drives the next round.
There is still no pre-dispatch tip check, so each already-fixed row still spends one worker dispatch.
Locate: the `LATE_FIX_AT_TIP` constant and the `atTipFixed` flag in `lateFixPass`.

Related: [[audit-log-finding-can-be-stale-by-land-time]], [[late-fix-pass-shipped-with-known-relaunch-residuals]].
