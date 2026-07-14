---
name: war-launch-worktree-with-working-branch-checked-out-forces-manual-land
description: "held:land-failed checkout guard resolved"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - held:land-failed
    - push-first CAS
    - working branch checked out
    - session worktree
    - manual land
    - refiner land
    - land-decision
    - phantom land
    - worktree launch
  provenance: agent-unverified
  slug: war-launch-worktree-with-working-branch-checked-out-forces-manual-land
  phase: doc-rot-remediation/phase-1
  tags: 
    - doc-rot
    - land
    - worktrees
    - operational
  created: 2026-07-06
  originSessionId: 07592cb8-18cb-48ae-ba5f-dc73f910f768
---

# `/war` launch worktree has the working branch checked out → `held:land-failed`

**RESOLVED (instance) — kept as concept anchor.** `held:land-failed` has two independent triggers: (a) the run's working branch checked out in a worktree the refiner's push-first CAS must advance, and (b) an absent `origin/<working>` baseline (fires even when checked out nowhere — repo-root lesson `absent-origin-working-branch-baseline-also-forces-manual-land`). Diagnose with `git worktree list` **and** `git ls-remote origin <working>`; don't assume (a).

**Fixed in:** ADR 0018 (`docs/adr/0018-war-working-branch-checkout-guard.md`) — Setup's `resolve-working-branch` + `ensure-origin` (`provision-worktrees.sh cmd_ensure_origin`) prevent both, and the `/war` SKILL.md Checkpoint `held:land-failed` auto-recover heals both root causes if they still fire.

**Related:** [[land-local-follower-ref-can-lag-sync-before-next-phase]], [[war-phantom-land-reports-success-without-advancing-integration]]
