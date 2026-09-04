---
name: git-log-telemetry-counter-scoped-to-integration-branch-misses-unmerged-task-branch-commits
description: "A git-log-derived telemetry counter that reads only the integration or working branch renders n/a for a never-merged task's own commits, honest but under-reporting, because those commits stay on a task branch the row never reads"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: git-log-telemetry-counter-scoped-to-integration-branch-misses-unmerged-task-branch-commits
  phase: 2026-09-03-in-band-absorb-default/phase-6 task 6.2
  keywords: 
    - telemetry counter scope
    - absorbRounds row
    - Ace-Charge trailer
    - unmerged task branch
    - never-merged task
    - integration branch read
    - working branch read
    - honest n/a under-report
    - war-review SKILL.md
    - git log ref scope
  tags: 
    - war
    - telemetry
    - git
    - gotcha
    - review
  created: 2026-09-04
  originSessionId: 1db2f526-d0af-4dc0-b9c7-311770b477a8
  modified: 2026-09-04T21:48:54.148Z
---

# A git-log-derived telemetry counter scoped to the integration/working branch cannot see a still-open task branch's own commits

**Code-verified** at landed tip `d4793b14eae512c69c55c9fe9990f89b559baed3` on
`dev/2026-09-03-2026-09-03-in-band-absorb-default`, read via the `_refinery45` worktree (`gitdir`
names this plan's slug; `HEAD` byte-equals the landed tip).

## What happened

`skills/war-review/SKILL.md`'s `absorbRounds spent per task` telemetry row (D5) resolves the counter
by reading `git log ... <workingBranch>` or the phase's `integrationBranch` for the highest
`Ace-Charge: <task>:<n>` trailer carrying that task's id. The row states this explicitly: "a deleted
task branch does not matter: the read never targets the task branch" (verbatim, confirmed at the
landed tip). For a task whose terminal status is `escalated`, `blocked`, or otherwise never merged,
its own `ace:<task>:a<n>` commits stay on its own task branch (`war/<slug>/p<N>-<task id>`) and never
reach either ref this row reads. The row renders `n/a` for such a task even when its own branch's
`absorb-budget:` log lines and `Ace-Charge` trailers show real charges — an under-report, not a
fabrication, but a real telemetry blind spot.

The polish pseudo-task got an explicit carve-out for the analogous case (read its own
`war/<slug>/p<N>-polish` branch when the terminal pass forward-reverted or the task never merged) —
the same carve-out was not extended to a regular never-merged task.

## The durable rule

When a telemetry or counter row is scoped to read only a fixed set of refs (an integration branch, a
working branch), audit whether every terminal status the surrounding status enum allows can still
leave the counted evidence on a different ref the row never reads. A counter that "never fabricates,
renders n/a instead" is honest but still incomplete — note the gap explicitly rather than assuming
honesty implies completeness. This generalizes beyond WAR: a git-log-scoped counter is only as
complete as its ref list, and an unmerged or abandoned branch is a common silent exclusion.

## Locate-cue (verify still present before acting)

`skills/war-review/SKILL.md`, the `absorbRounds spent per task (D5)` telemetry row — search "a
deleted task branch does not matter".
