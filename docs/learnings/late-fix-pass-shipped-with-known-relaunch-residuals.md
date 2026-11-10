---
name: late-fix-pass-shipped-with-known-relaunch-residuals
description: The late-fix pass shipped with known recovery-relaunch residuals that auditors raised as notes or asks
metadata:
  node_type: memory
  type: project
  keywords:
    - late-fix pass
    - lateFixPass residual
    - task-integrated.sh
    - NO_TASK_PROOF sibling
    - Late-Fix trailer
    - lateFixSeq branch reuse
    - recovery relaunch
    - empty late-fix branch
    - carryLate fix-less row
    - lateOriginOf unmerged raiser
    - seededTasks env-died
    - seed fixRounds reset
    - lfFence sibling fence
    - teardown-phase latefix
    - roundLimit seed clamp
  provenance: code-verified
  slug: late-fix-pass-shipped-with-known-relaunch-residuals
  phase: 2026-11-04-late-defects-fixed-in-run/phase-3 (task 3.1) + phase-4 (task 4.1) + phase-6 (task 6.1) + 2026-11-08-engine-findings-ace-and-late-fix/phase-4 (task 4.1)
  tags:
    - late-fix
    - recovery
    - residual
    - task-integrated
  created: 2026-11-05
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-10T05:34:36.201Z
---

# The late-fix pass shipped with known relaunch residuals

Read this before you change `lateFixPass` in `skills/war/assets/workflow-template.js` or the owned-path walk in `skills/war/assets/task-integrated.sh`.

**Mostly RESOLVED.** Of the eleven residuals auditors raised across three plans, these are closed: run-scoped `lfBranch` (2), the empty-branch merge (3), `lfEscStop` for escalate seats (4), `parkFixless` (5, #2624), the seed stamp on env-died seeds (7, #2641), the seed `fixRounds` carry (8), `lfOpen` keeps the defect's own file out of `lfFence` (9), the `Math.min(spentOf(task.fixRounds), roundLimit)` seed clamp (10), and the `lf_seg` latefix arm in `provision-worktrees.sh` `cmd_teardown_phase` (11).

## Still live

- **Item 1, narrowed.** `task-integrated.sh` accepts a one-parent commit on an owned path only when its `Late-Fix:` trailer names this task. `lfFence` now fences merged siblings' files, so this cost is mostly closed. A late fix that still edits a path another task owns costs that task its recovery proof: on a relaunch it reads `NO_TASK_PROOF` and re-runs work/audit. It fails safe. `skills/war/references/refiner-recovery.md` states the rule ("a late-fix commit naming another task ... is no proof").
- **Item 5's split.** The sweep filter reads the raw `disposition`, but `routeTerminalMinors` reads `dispositionOf(f, null)`. So a fileless behavior Minor with no disposition parks at the sweep and files as a follow-up at the terminal seat. Neither route drops it.
- **Item 6, ruled keep (#2624).** A behavior row from a task that did not merge can join the late-fix pass. `lateOriginOf` charges the file owner and uses its roster. If the defect depends on the unmerged task's code, a fix at the integrated tip cannot satisfy it, and on the final phase a spent budget becomes a `late-defect` hold.

By design: a final-phase seed hold names the seed id (`seed-1`). A carried row keeps its first origin task through `carryTaskOf`, so a seed of a seed never re-keys onto an unrelated `seed-1`.

**General rule (from item 11):** a branch rename must update every prefix matcher, shell scripts included, not just the engine.

Locate-cue: verify still present before acting — `const lateFixPass`, `const lfFence`, `const lfOpen`, `const parkFixless` and `const lateOriginOf` in `skills/war/assets/workflow-template.js`; the Late-Fix trailer arm in `skills/war/assets/task-integrated.sh`.

Also see [[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]] and [[zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged]].
