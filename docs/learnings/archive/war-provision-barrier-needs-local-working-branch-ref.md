---
name: war-provision-barrier-needs-local-working-branch-ref
description: "/war provision barrier needs a LOCAL working-branch ref, not origin-only"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - war provision barrier
    - working branch local ref
    - held:workflow-error
    - not a valid object name
    - integration branch base
    - stack-and-plow branch cut
    - campaign provisioning
    - git branch vs push refs/heads
    - origin-only branch
  provenance: code-verified
  slug: war-provision-barrier-needs-local-working-branch-ref
  phase: campaign-2026-07-08-memory-frictions/plan-6
  tags: 
    - war
    - provisioning
    - campaign
    - stack-and-plow
  created: 2026-07-09
  relates: 
    - "[[absent-origin-working-branch-baseline-also-forces-manual-land]]"
    - "[[provision-barrier-refiner-owned-not-worker-self-create]]"
    - "[[war-launch-worktree-with-working-branch-checked-out-forces-manual-land]]"
    - "[[provision-nonidempotent-orphan-integration-branch-blocks-relaunch]]"
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# The /war provision barrier resolves the working-branch base as a bare LOCAL ref — cut the branch with `git branch`, not an origin-only push

**Symptom.** `/war` phase 1 returns `held:workflow-error` at the provision:phase-1 git-topology
barrier: *"provision-worktrees: failed to create branch 'integration/<slug>/phase-1' at base
'<workingBranch>': fatal: not a valid object name: '<workingBranch>'"*. Fails before any worker
spawns (1 agent, no worktrees/commits) — nothing to clean up.

**Cause (self-inflicted, verified).** The barrier runs `git branch integration/<slug>/phase-1
<workingBranch>` where `<workingBranch>` is the bare branch name (e.g.
`dev/2026-07-08-<slug>`). If that branch exists only on **origin** — created with
`git push origin <sha>:refs/heads/<workingBranch>` — there is **no local ref** by that name, so
`git branch … <workingBranch>` cannot resolve the base. `git rev-parse --verify <workingBranch>`
returns `fatal: Needed a single revision`, confirming the missing local ref. (Plans 1–5 in the same
campaign provisioned fine because each had a local `dev/2026-07-08-*` ref.)

**Fix.** Create the local ref at the intended base tip, then re-launch the phase fresh (no resume):
```
git branch <workingBranch> <base-tip-sha>     # e.g. git branch dev/2026-07-08-<slug> c6cabeb
git rev-parse --verify <workingBranch>        # now resolves
```
Keep it **checked out nowhere** (a checked-out working branch forces manual Lead lands — see
[[war-launch-worktree-with-working-branch-checked-out-forces-manual-land]]).

**How to apply (stack-and-plow campaigns).** When cutting `dev/slug-N` from `dev/slug-(N-1)`'s tip,
use `git branch dev/slug-N <tip-sha>` (creates the local ref) **then** `git push origin dev/slug-N`
— get BOTH a local ref (for the provision barrier) and the origin branch (for the refiner's
push-first CAS land). A direct `git push origin <sha>:refs/heads/dev/slug-N` gives you only the
origin half and strands provision. This is distinct from
[[absent-origin-working-branch-baseline-also-forces-manual-land]] (that one is about the *origin*
side being absent at land; this is the *local* side being absent at provision).

> archived 2026-07-15: resolved — moved to archive
