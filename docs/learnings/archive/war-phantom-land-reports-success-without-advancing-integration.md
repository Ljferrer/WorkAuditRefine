---
name: war-phantom-land-reports-success-without-advancing-integration
description: "landed w/ unchanged working_sha = phantom; verify sha"
metadata: 
  node_type: memory
  type: project
  keywords: [unchanged sha, empty merge, silent drop, landDecision, false success, stale integration branch, manual re-land, git ground truth]
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

A WAR per-phase Workflow returned `landDecision:"landed"`, `landed:["t2"]`, and `landResult.status:"landed"` — but
`landResult.working_sha` was **identical to the PRIOR phase's land sha** (the working branch had not moved). On
inspection: the task branch (`war/<slug>/p1b-t2`) DID hold the audited + gate-green work (the worker committed it),
but `integration/<slug>/phase-1b` was never advanced past the working tip, so the land step "merged" an EMPTY
integration branch into the working branch — a **phantom land** that reports success while landing nothing.

**Why it matters:** trusting the `landed`/`landDecision` fields at face value would silently DROP the task's work
(and a stacked dependent would then build on a tip lacking it). Same family as
land-decision-not-demoted-on-land-step-failure and [[scope-hook-test-nonhermetic-inside-war-task-worktree]]:
**git state is ground truth, not the Workflow's self-report.**

**How to apply (Lead):** after EVERY phase land, verify `landResult.working_sha` is **NEW** (≠ the prior phase tip)
AND that `git log master..dev/<slug>` actually contains the task's commit / the integration branch advanced. If a
`landed` result shows an unchanged sha: the task branch usually still holds the work — gate-check it
(`git worktree add --detach … <taskBranch>`; run the full gate), then **manually re-land** it (`--no-ff` merge of
the task branch into the working branch + push), and clean up the phantom integration branch. Recovery used on
`servitor-confinement-memory` T2: re-landed `990bc01` → dev `034744f`.

> archived 2026-07-15: resolved — moved to archive
