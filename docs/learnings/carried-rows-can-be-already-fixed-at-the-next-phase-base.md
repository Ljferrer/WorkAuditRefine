---
name: carried-rows-can-be-already-fixed-at-the-next-phase-base
description: "A carried row may already be fixed at the next phase base. Re-check it first"
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
    - late-fix:at-tip empty three-dot diff
  provenance: code-verified
  slug: carried-rows-can-be-already-fixed-at-the-next-phase-base
  phase: "2026-11-08-engine-recovery-relaunch-and-land/phase-3 (seed-2, seed-3) + phase-5 (late-fix pass, recurrence) + 2026-11-08-model-routing-and-prompt-byte-budgets/phase-5 (p5-latefix-4, -6, -7, recurrence)"
  tags:
    - planning
    - carry
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T06:32:08.650Z
---

# Carried rows can be already fixed at the next phase base

**Rule.** When you carry a row to a later phase, check the row against the new phase base first.
If a late fix already landed it, drop the seed task.
A seed task with no diff escalates, and it costs a worker round.
Before you seed or re-queue a late row, re-read the named construct at the current tip.
A hold that lists doc rows may be mostly stale, so check each row before you rule on the hold.

**Instances.** Phase 3 seed tasks found their carried rows already fixed by a phase 2 late fix, and each worker escalated with nothing to commit.
In phase 5, the late-fix pass kept re-dispatching seven doc rows that the integration tip already fixed, until fixRounds hit run.roundLimit and the phase held as `held:escalation`.

**Recurrence (model-routing plan, phase 5).** Several seats raised the same stale helper-scope prose as separate absorb rows.
The first late fix (Late-Fix 5.3:1) swept the sibling surfaces too: GLOSSARY.md, schemas.md and war-config.mjs.
A second late fix (5.3:2) fixed CLAUDE.md.
The later rows p5-latefix-4, -6 and -7 then had empty three-dot diffs and closed as `late-fix:at-tip`.
The at-tip arm worked: the phase landed and did not hold.
Each duplicate row still cost one worker dispatch plus a 3 to 4 seat re-audit.
A good sibling sweep in an early late fix makes the later rows for the same surface redundant.

**Engine status (D42, #2773).** `lateFixPass` in `skills/war/assets/workflow-template.js` now has an at-tip arm.
A worker that makes no commit and returns a `blocked_reason` starting with `LATE_FIX_AT_TIP` gets one re-audit of the tip, if `probeDiff` shows an empty range.
An approving re-audit drops the row, gives back the round's `origin.fixRounds` charge and records it on `lateFixed` with `atTip` (the `atTipFixed` flag).
Otherwise the round stays charged and `lfPrior` drives the next round.
There is still no pre-dispatch tip check, so each already-fixed row still spends one worker dispatch.
Locate: the `LATE_FIX_AT_TIP` constant and the `atTipFixed` flag in `lateFixPass` (verify still present before acting, found at the model-routing plan's phase 5 landed tip).

Related: [[audit-log-finding-can-be-stale-by-land-time]], [[late-fix-pass-shipped-with-known-relaunch-residuals]].
