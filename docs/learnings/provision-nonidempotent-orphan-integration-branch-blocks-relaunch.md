---
name: provision-nonidempotent-orphan-integration-branch-blocks-relaunch
description: "Half-run provision orphans branch → relaunch exit 3"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - provision-barrier
    - ensure-integration
    - foreign-branch
    - exit-3
    - ADR-0003
    - owned-refs
    - teams-dir
    - orphan-branch
    - non-idempotent
    - held-escalation
  provenance: code-verified
  slug: provision-nonidempotent-orphan-integration-branch-blocks-relaunch
  phase: memsub/p2
  originSessionId: 9c57c14a-92ed-4fc9-92d1-27be3d4dbad5
---

**Trigger fixed** in commit 22be2a6: `record_owned_file` in `skills/war/assets/provision-worktrees.sh` now does `mkdir -p "$(dirname "$ofile")"` before the append, so a missing `teams/<runId>/` dir can no longer kill `ensure-integration` after the branch was created but before ownership was recorded.

Durable residue:

- A phase returning `held:escalation` with **every** worker escalating on "Provision precondition violated: worktree/branch does not exist" is a **provision-barrier failure** — diagnose the provision refiner's transcript, not the workers'.
- The integration branch is `integration/<planSlug>/phase-N` — derived from slug+phase, **not** runId. A fresh runId does NOT dodge a collision with an orphan branch; the orphan must be cleared regardless.
- ADR 0003 still holds: `cmd_ensure_integration` refuses (exit 3) to reuse an integration branch it does not own. **Never delete an orphan integration branch without first proving it carries no unique commits** (`git log <working>..<orphan>` empty, absent from `git ls-remote origin`) — otherwise you discard landed work.

**Why:** unblocks a stuck relaunch without touching real work. **How to apply:** verify emptiness, `git branch -D` the orphan, re-launch the same Workflow args. Related: [[provision-ensure-exclude-cwd-contract]], [[provision-barrier-refiner-owned-not-worker-self-create]], [[held-escalation-lead-manual-completion]].
