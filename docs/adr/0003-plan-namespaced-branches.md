# Integration and task branches are namespaced by plan slug

**Status:** accepted

WAR names its integration and task branches with a plan slug — `integration/<plan-slug>/phase-N`
(and task branches `<plan-slug>/phase-N/<task-id>`) — rather than the bare `integration/phase-N`.
A future reader will wonder why the extra segment; this records it.

## Context

Branch refs are global to a repository. Two WAR runs executing different plans (or different
versions of the same plan) in the same repo at the same time both try to cut `integration/phase-N`
and collide — this **actually happened** in the WAR repo between v0.4.1 and v0.4.2. Worktree
*directories* are already collision-free because they are run-scoped under
`.claude/teams/<run-id>/worktrees/`, but the refs were not.

## Decision

Prefix integration/task branches with a `plan-slug` derived from the plan filename, giving each
plan its own ref namespace. The idempotent "ensure" provisioning step consults the ledger to tell a
legitimate **resume** (this run already owns the branch → reuse) from a **foreign collision**
(branch exists but is not recorded as this run's → fail loud, do not reuse).

## Considered options

- **Bare `integration/phase-N` (status quo).** Rejected — collided in practice.
- **Plan-slug namespace (chosen).** Human-readable and prevents the observed cross-plan collision.
- **Run-id namespace (`integration/<run-id>/phase-N`).** Fully collision-proof even for concurrent
  *identical-plan* runs, but opaque. Not chosen as the default; the ledger-based foreign-branch
  fail-loud covers the rare same-plan-concurrent case while keeping names readable.
