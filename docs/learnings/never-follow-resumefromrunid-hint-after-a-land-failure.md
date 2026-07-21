---
name: never-follow-resumefromrunid-hint-after-a-land-failure
description: "After held:land-failed the generic resumeFromRunId hint is exactly wrong — replaying the journal re-runs the already-green gate and push-first CAS live"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
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
---

# The harness's generic `resumeFromRunId` hint is the wrong recovery for a land failure — it replays merges + CAS live

**What happened (code-verified — found at `skills/war/SKILL.md`, the "Resume vs. recovery
relaunch" paragraph and the §4.3 `held:land-failed` root-cause-(c) bullet; verified via the
phase's own `_refinery` worktree since the main checkout lagged this phase — see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]):** the Workflow harness prints an
unconditional `resumeFromRunId` hint on any interrupted/incomplete run, regardless of *why* the
run ended. That hint is correct for exactly one case (`held:phase-incomplete` — the Workflow timed
out or was killed before finishing). But a `held:land-failed` phase is a **completed** workflow
(`status: 'completed'`) whose land dispatch died or returned an unrouted result — the DAG's other
tasks already merged cleanly to the integration branch, and the gate is already green there.
Following the printed hint anyway triggers a **live journal replay**: the off-ladder journal
re-dispatches the already-merged tasks' `merge:*` agents, which re-runs the gate and the
push-first CAS — exactly the wrong move during the transient-API window that killed the land
dispatch in the first place (the observed case: the same 529 overload condition would likely
still be live).

**The fix pattern:** never gate recovery choice on "did the harness print a resume hint" — gate it
on the **specific `held:*` reason**. `resumeFromRunId` is legitimate **only** for
`held:phase-incomplete`; every other `held:*` reason (`held:workflow-error`,
`held:land-failed`, an escalated/`env-blocked` task) uses the **Recovery relaunch** path instead —
a **fresh** Workflow run (new `runId`) over **reused git state**, never a journal replay of the
dead run. For `held:land-failed` specifically, the correct first move is a **step-0
already-landed probe** before any re-merge: `git fetch origin <working>` then
`git merge-base --is-ancestor <integration-tip> origin/<working>` — if it holds, the land dispatch
died *after* its CAS push succeeded, so the land already happened and must be **recorded**, never
re-merged (a second `--no-ff` merge mints an empty phantom phase commit).

**Why this is a generic pattern, not a one-off:** any orchestration harness that prints a single
generic "resume" affordance regardless of failure class invites the wrong recovery whenever the
failure happened *after* the harness's own definition of "done" (a completed run that nonetheless
needs manual follow-up). The fix is never to suppress or edit the harness's hint text (it's
harness-owned) — it's to counter it in the standing skill/runbook prose exactly at the decision
point where an operator or `--afk` Lead would otherwise reach for it.

## Related

[[null-or-unrouted-land-result-routes-held-land-failed-via-terminal-else]] — the companion routing
fix in the same phase that makes `held:land-failed` reachable at all for this failure class.
[[reland-loop-contender-less-transient-vs-real-divergence]] — a related land-retry discrimination
lesson (transient CAS contention vs. real divergence) in the same subsystem.
