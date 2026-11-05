---
name: a-sort-that-demotes-before-a-later-hold-is-known-breaks-the-held-phase-carry
description: A queue sort that demotes rows before a later pass adds a hold files rows the held arm must carry
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
  provenance: code-verified
  slug: a-sort-that-demotes-before-a-later-hold-is-known-breaks-the-held-phase-carry
  phase: 2026-11-04-late-defects-fixed-in-run/phase-4 (task 4.1)
  tags:
    - workflow-template
    - land-decision
    - phase-close
    - ordering
  created: 2026-11-05
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-05T16:17:35.815Z
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

Locate-cue: verify still present before acting. Found `const sortOwned = new Map()` in the BEHAVIOR-ROW SORT block, the `sortOwned.get(f)` arm in the sweep-time drain, and the `late hold` test, @ phase 4 landed tip 28e74359 (read in the run's `_refinery` worktree at that HEAD).
