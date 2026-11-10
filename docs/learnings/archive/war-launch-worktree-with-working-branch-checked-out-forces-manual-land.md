---
name: war-launch-worktree-with-working-branch-checked-out-forces-manual-land
description: "held:land-failed has two triggers, a checked-out working branch and an absent origin/<working>; check git worktree list and git ls-remote, and recover by hand without --force"
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
    - ensure-origin
    - resolve-working-branch
    - origin baseline
    - ADR 0018
    - checkout guard
    - auto-recover
    - rejected
    - never-force
  provenance: agent-unverified
  slug: war-launch-worktree-with-working-branch-checked-out-forces-manual-land
  phase: doc-rot-remediation/phase-1 + checkout-guard/phase-1
  tags: 
    - doc-rot
    - land
    - worktrees
    - operational
    - provisioning
  created: 2026-07-06
  originSessionId: 07592cb8-18cb-48ae-ba5f-dc73f910f768
---

# `held:land-failed` has two triggers: a checked-out working branch, or no `origin/<working>` baseline

**RESOLVED (instance) — kept as concept anchor.** `held:land-failed` has two independent triggers:

- **(a) Checkout collision:** the run's working branch is checked out in a worktree (for example the
  `/war` launch worktree) that the refiner's push-first CAS must advance.
- **(b) Absent origin baseline:** `origin/<working>` does not exist yet, because the working branch
  was never pushed. The push-first CAS land (`cmd_land_advance` in
  `skills/war/assets/provision-worktrees.sh`) has no ref to CAS against, so it errors out rather than
  creating the branch on first push. This fires even when the branch is checked out nowhere.

**Diagnose:** run `git worktree list` **and** `git ls-remote origin <working>`. Do not assume (a).

**Fixed in:** ADR 0018 (`docs/adr/0018-war-working-branch-checkout-guard.md`). Setup's
`resolve-working-branch` prevents (a). For (b), Setup calls `provision-worktrees.sh ensure-origin
<resolved>` (`cmd_ensure_origin`) before Phase 1 runs; it does
`git push -u origin refs/heads/<resolved>:refs/heads/<resolved>`, which is idempotent and never a
force (a diverged remote is refused). The `/war` SKILL.md Checkpoint `held:land-failed` auto-recover
heals both root causes if they still fire.

**Manual recovery shape** (safe when the working branch is a strict ancestor of the integration
branch): in the run-scoped `_refinery` worktree, check out the working branch,
`git merge --no-ff integration/<run>/phase-<n>`, re-run the full resolved gate green, then
`git push -u origin <working>`. Never force. If that manual push comes back `[rejected]`, re-diagnose
it like any other `held:land-failed`; never retry with `--force`.

**Related:** [[land-local-follower-ref-can-lag-sync-before-next-phase]], [[war-phantom-land-reports-success-without-advancing-integration]], [[land-advance-push-first-cas-rejected-token]] (the CAS exit-code contract the baseline feeds), [[held-escalation-lead-manual-completion]] (manual-land-then-servitor procedure shape)

> archived 2026-07-15: resolved — moved to archive
