---
name: never-follow-resumefromrunid-hint-after-a-land-failure
description: "The Workflow harness's generic resumeFromRunId hint is exactly wrong after a held:land-failed phase"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-07-16-land-failure-recovery@phase-1
  slug: never-follow-resumefromrunid-hint-after-a-land-failure
  phase: land-failure-recovery/phase-1 task 1.2 (landed dev/2026-07-16-land-failure-recovery)
  keywords: 
    - resumeFromRunId
    - held:land-failed
    - journal replay
    - dead land agent
    - anti-resumeFromRunId warning
    - transient API window
    - push-first CAS re-run
    - recovery relaunch vs resume
    - generic harness hint
  tags: 
    - workflow-template
    - land
    - recovery
    - skill-prose
  created: 2026-07-16
  originSessionId: 655475be-a01b-4702-b846-b2c53bbde3d3
  modified: 2026-08-25T08:17:54.886Z
---

# The harness's generic `resumeFromRunId` hint is the wrong recovery for a land failure — it replays merges + CAS live

**What happened (code-verified — now in `skills/war/references/resume-and-recovery.md`, the "Resume vs. recovery relaunch" paragraph and the `held:land-failed` "(c) Dead land agent" bullet):** the Workflow harness prints an unconditional `resumeFromRunId` hint on any interrupted run, whatever the cause. That hint is correct only for `held:phase-incomplete`. A `held:land-failed` phase is a completed workflow whose land dispatch died or returned an unrouted result; its tasks already merged and the gate is green. Following the hint triggers a live journal replay: it re-dispatches the merged tasks' `merge:*` agents, re-running the gate and the push-first CAS, during the same transient-API window that killed the land.

**The fix pattern:** gate recovery on the specific `held:*` reason, never on whether the harness printed a resume hint. `resumeFromRunId` is legitimate only for `held:phase-incomplete`. Every other `held:*` reason uses the Recovery relaunch: a fresh run (new `runId`) over reused git state. For `held:land-failed`, first run the step-0 already-landed probe: `git -C <_refinery> fetch origin <working>` then `git merge-base --is-ancestor <integration-tip> origin/<working>`. If it holds, the land already happened: record it, never re-merge (a second `--no-ff` merge mints an empty phantom phase commit).

**Why this is a generic pattern:** any harness that prints one generic "resume" affordance invites the wrong recovery when the failure happened after the harness's own idea of "done". Do not edit the harness text. Counter it in the runbook prose at the decision point.

**Recurrence 1 (2026-08-24, plan `authoring-side-verification`, phase 3):** a land dispatch died mid-gate and routed to `held:land-failed`. The Lead recovered fully by hand with this recipe: no re-merge, no journal replay, one `land-advance` plus follower sync.

## Related

[[null-or-unrouted-land-result-routes-held-land-failed-via-terminal-else]] — the companion routing fix that makes `held:land-failed` reachable for this failure class.
[[reland-loop-contender-less-transient-vs-real-divergence]] — land-retry discrimination (transient CAS contention vs. real divergence).
[[merge-task-dispatch-forced-early-return-mid-gate-is-incomplete-not-gate-failed]] — Recurrence 3 records the dispatch-death shape behind Recurrence 1.
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] — why the first verification read the phase's `_refinery` worktree.
