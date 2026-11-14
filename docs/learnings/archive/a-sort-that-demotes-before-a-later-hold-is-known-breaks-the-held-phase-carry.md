---
name: a-sort-that-demotes-before-a-later-hold-is-known-breaks-the-held-phase-carry
description: "A queue sort that demotes before a later hold files rows the held arm must carry"
metadata:
  node_type: memory
  type: project
  keywords:
    - behavior-row sort
    - sortOwned
    - held arm carry
    - carriedPhaseClose
    - late-defect hold
    - demote ordering
    - D3b
    - decide early apply late
    - seedCapped
    - hold producer order
  provenance: code-verified
  slug: a-sort-that-demotes-before-a-later-hold-is-known-breaks-the-held-phase-carry
  phase: 2026-11-04-late-defects-fixed-in-run/phase-4 (task 4.1) + phase-6 (task 6.1, recurrence)
  tags:
    - workflow-template
    - land-decision
    - phase-close
    - ordering
  created: 2026-11-05
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-06T04:26:14.754Z
---

# A sort that demotes before a later hold is known breaks the held-phase carry

**Invariant.** On a held phase, the held arm carries the whole phase-close queue on `carriedPhaseClose` and demotes nothing (D3b).
The relaunch then judges each row again.

**What went wrong.** Task 4.1 added the behavior-row sort before `lateFixPass` in `skills/war/assets/workflow-template.js`.
The first version demoted owned behavior rows inline, inside the sort.
The sort skipped only when a hard escalation already held.
But `lateFixPass` runs after the sort, and it can add a `late-defect` hold.
On that path, rows the sort had already demoted were filed as follow-ups.
The held arm never saw them, so they lost the carry.
A cascading-impact seat caught it as a Minor `absorb`, and a fix round closed it before land.

**Fix that landed.** The sort only records the decision: `sortOwned` maps each owned row to its owner text, and the row stays on `phaseCloseQueue`.
The demote happens later, at the sweep-time drain, where the land decision is final.
A held phase never reaches that drain, so the held arm carries the row.

**Rule.** If a routing step runs before every hold producer has run, record the decision and apply it later.
Apply a terminal action (demote, file) only at a point where the land decision is known.
Comments like "the held arm carries the whole queue" are true only for holds that exist before your step.

**Test.** `late-defect: exclusion late hold` in `skills/war/assets/workflow-template.late-defect-3.test.mjs` proves the carry on a late hold.

Related: [[turning-an-always-hold-signal-into-a-fix-route-stales-every-reader-that-assumed-it-held]], [[late-fix-pass-shipped-with-known-relaunch-residuals]].

## Recurrence: the inverse order, phase 6 (task 6.1)

Phase 4 broke because a step acted before a later hold existed.
Phase 6 broke the other way: a hold producer ran after the steps that read holds.

Task 6.1 added the seeded-task cap rule (`seedCapped`).
Its first version pushed the final-phase `late-defect` hold after `await lateFixPass()`.
The sort's `holds` and the pass's `holding` snapshot both read `escalated` before that push.
So on a final phase with a capped seed, the pass still dispatched late-fix workers and merged fixes.
Then the seed loop held the phase anyway.
No defect was lost, but up to `run.roundLimit` rounds (worker, audit seats, gated merge) were spent for nothing.
A correctness seat caught it as a Minor `absorb`, and a fix round moved the loop before land.

**Fix that landed.** The `for (const { task: t, why } of seedCapped)` loop now sits directly above `const sortOwned = new Map()`.
A final-phase seed hold reaches both snapshots, so the sort skips and the pass never dispatches.

**Rule, both halves.**
- A hold producer that does not depend on a pass must run before every step that snapshots holds.
- A terminal action (demote, file) must run only after every hold producer has run.
- If you add a hold producer, list every `escalated.some(... HARD ...)` snapshot and check which side of it you land on.

**Test.** `late-defect: carry cap` in `skills/war/assets/workflow-template.late-defect-5.test.mjs` asserts no `late-fix:` label on the held final phase. A mutant that dispatches proves the row red.

Locate-cue (verify still present before acting). In `skills/war/assets/workflow-template.js`: the `for (const { task: t, why } of seedCapped)` loop directly above `const sortOwned = new Map()` in the BEHAVIOR-ROW SORT block, and the `sortOwned.get(f)` arm in the sweep-time drain. Tests: `late-defect: exclusion late hold` (late-defect-3) and `late-defect: carry cap` (late-defect-5, with the "no late-fix worker is dispatched on a phase that holds" assert).

> archived 2026-11-14: resolved — moved to archive
