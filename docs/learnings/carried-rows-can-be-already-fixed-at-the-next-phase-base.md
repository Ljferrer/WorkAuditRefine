---
name: carried-rows-can-be-already-fixed-at-the-next-phase-base
description: "A finding row carried into the next phase can be fixed already by a late fix, so the task escalates with nothing to commit"
metadata:
  promoted: dev/2026-11-08-engine-recovery-relaunch-and-land@phase-3
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

**What happened.** Phase 3 had seed tasks for rows carried from phase 2 (seed-2 and seed-3).
Phase 2 late fix 6a166f54 had already fixed both rows at the phase base.
Each worker found nothing to commit and escalated.

**Rule.** When you carry a row to a later phase, check the row against the new phase base first.
If a late fix already landed it, drop the seed task.
A seed task with no diff escalates, and it costs a worker round.

## Second instance: the late-fix pass re-dispatches fixed rows (phase 5)

**What happened.** The final phase of this plan held as `held:escalation` on 14 late defects.
It had spent fixRounds 6 of run.roundLimit 6.
Seven doc rows were already fixed at the integration tip.
They were the capture-learnings bullet, archived lesson step 4, the tour and the servitor card.
The late-fix rounds kept dispatching those rows until the budget ran out.
The round 6 worker found no diff and rightly refused an empty commit.

**Why (code-verified).** `lateFixPass` in `skills/war/assets/workflow-template.js` takes each queued row.
It cuts a worktree at the integrated tip and dispatches a worker.
The loop never checks the row against the tip first.
Each round charges `origin.fixRounds`.
If a worker reports no commit, the loop sets `lfPrior` and runs the next round.
So one already-fixed row burns the origin task budget with no diff.
Verify still present before acting: found at `skills/war/assets/workflow-template.js` (construct `lateFixPass`) @ phase 5.

**Rule.** Before you seed or re-queue a late row, re-read the named construct at the current tip.
Drop the row if the tip already fixes it.
A hold that lists doc rows may be mostly stale, so check each row before you rule on the hold.

**Also.** Seven engine rows on `workflow-template.js` were accepted with a written reason.
They were filed as #2770, #2771 and #2772 for the next campaign plan.
Late-fix commit 2677cc81 held part of a fix and was forward-reverted.
These are run facts, not code referents.

Related: [[audit-log-finding-can-be-stale-by-land-time]], [[late-fix-pass-shipped-with-known-relaunch-residuals]].
