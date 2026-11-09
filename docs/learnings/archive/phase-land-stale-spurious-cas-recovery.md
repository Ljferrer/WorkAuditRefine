---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [transient rejection, false divergence, rev-list left-right, manual reland, no-ff merge, servitor null, ground truth]
  slug: phase-land-stale-spurious-cas-recovery
  phase: audit-scheduler-integrity/phase-5
  tasks: t5
  date: 2026-06-26
  tags: 
    - land_stale
    - CAS
    - phase-land
    - release
    - manual-recovery
  related: 
    - land-advance-push-first-cas-rejected-token
    - drift-guard-pin-for-task-split-intermediate-state
  originSessionId: war-servitor-audit-scheduler-integrity-p5
---

# Phase-level `land_stale` can be a spurious transient CAS rejection; use git state as ground truth

A `land_stale` from the Workflow's land-phase step (reland loop exhausted) is NOT necessarily a
real divergence: it can fire from a single transient CAS window with NO active contender —
especially on a release phase merging a single commit. Distinct from task/refinery-level
`land_stale` ([[land-advance-push-first-cas-rejected-token]],
[[drift-guard-pin-for-task-split-intermediate-state]]), which implies an active parallel run
contending on the same working branch.

## Recovery protocol

Do NOT re-run the full phase Workflow — that re-implements already-merged work and re-runs the
coven. Instead:

1. **Ground-truth check**: `git fetch origin && git rev-list --left-right --count dev/<plan>...origin/dev/<plan>` — `0 0` means the integration base is clean and origin never moved.
2. **Gate re-verify on the integration tip**: run ALL gate runners (`node --test` + every `*.test.sh`) on `integration/<plan>/<phase>`, not the task branch alone.
3. **Manual land**: `git checkout dev/<plan> && git merge --no-ff integration/<plan>/<phase>`, then push-first CAS: `git push origin HEAD:refs/heads/dev/<plan>`. A clean push (no `[rejected]`) confirms origin was not ahead.
4. **Wrap up after the manual land** (SUPERSEDED in part by #2702): since #2702 the in-flow Wrap-up also runs on `held:escalation` (where a land-phase `land_stale` routes, via HARD_ESCALATION_REASONS) and `held:land-failed` when `memoryLocalRoot` was threaded, so a land-phase `land_stale` usually returns a populated `servitorResult`. The Lead still runs one resolution-fed `war-servitor` pass after the manual land, because the hold-time Wrap-up never saw the resolution. When the return carries `servitorResult: null` (no `memoryLocalRoot`, or a dead servitor dispatch), that same Lead pass is the phase's only Wrap-up, so pass it the phase context directly.

## Rule

> A `land_stale` on a phase land is NOT necessarily a real divergence. Check git state
> as ground truth (`left/right 0/0` on dev vs origin). If clean: re-verify the full gate
> on the integration tip, then re-land manually (`--no-ff` merge + push-first). Do NOT
> re-implement the phase's tasks.

> archived 2026-07-15: resolved — moved to archive
