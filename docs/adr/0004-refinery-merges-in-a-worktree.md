# Refinery merges run in a run-scoped worktree, never the main checkout

**Status:** accepted

Every `war-refiner` merge — both the integration-side of merge-task and the working-branch land —
runs inside a **run-scoped refinery worktree** (`<worktreeRoot>/<runId>/_refinery`). The refiner
never runs `git merge`, `git checkout`, `git update-ref`, or `git push` against the Lead's main
checkout. A future reader will ask why the refiner can't just operate in the main checkout as it did
before v0.6.0; this records why.

## Context

WAR already partitions branch refs by plan slug (ADR-0003) and worktree directories by run id, but
before v0.6.0 the Refinery performed all its merges in the Lead's **main checkout** — one working
tree, one HEAD. Two simultaneous WAR runs in the same repository both had their refineries
targeting that same shared checkout. One run's `git checkout <integration>` could corrupt the other
run's in-flight `git merge`, making the "single git-topology owner" invariant hold only within a
single run, not across runs.

The specific failure mode: both runs legitimately use different integration branches (ADR-0003
namespacing keeps those safe), but they both try to land into the same main-checkout working tree
when merging onto their respective working branches. A second `git checkout` over a live `merge`
destroys the first run's merge state with no error.

## Decision

Move every Refinery merge into a dedicated, **run-scoped refinery worktree** at
`<worktreeRoot>/<runId>/_refinery`. Provisioned in the Provision barrier (alongside task
worktrees, extending ADR-0001's explicitly-managed lifecycle), reaped by a path-based step in
`teardown-phase`.

**The land mechanism is push-first.** The working branch is already checked out in the Lead's
session cwd (a run starts on the working branch); git refuses a second checkout of a checked-out
branch, so `_refinery` **cannot** check out the working branch. Instead, the land runs in a
**detached** `_refinery` at the working tip, performs a `--no-ff` merge, then pushes immediately —
no `--force`. The remote's non-fast-forward rejection is the atomic compare-and-swap (CAS) against
shared truth. The local `refs/heads/<working>` is advanced as a follower, only on push success.
This ordering was verified in a throwaway sandbox: a local `git update-ref` CAS keyed on the local
ref is insufficient because a second run never moves the local ref — only the remote ref is shared.

**Same-branch contention** (two runs targeting the same working branch) is handled by bounded
auto-reland: on push rejection the loser re-fetches `origin/<working>`, re-merges, re-gates, and
re-pushes, up to `roundLimit` times. Exhaustion yields `land_stale` — a hard-escalation status
distinct from a content `conflict` (CAS-topology failure vs. merge-text failure; mixing them would
make the Lead unable to tell the two apart).

## Considered options

- **Status quo (main checkout for all merges).** Rejected — two concurrent runs provably corrupt
  each other's merge state.

- **Land-only move to a worktree.** Considered; rejected. Moving only the land leaves the
  integration-side of merge-task still running in the main checkout — two runs would still collide
  one merge-queue commit at a time. The fix must cover the full refiner surface.

- **A repo-wide merge lock.** Rejected as disproportionate. WAR already partitions branch refs
  per run (ADR-0003); giving each run its own worktree partitions the working-tree writes too, so
  different-branch runs require **no serialization** at all. A lock would serialize them
  unnecessarily.

- **`git rebase --onto` in `_refinery` for the merge-task rebase.** Rejected — sandbox-verified to
  be blocked by the same "already used by worktree" rule as a plain `git rebase`. The task branch
  stays checked out in its live task worktree for fix-in-place, so the rebase must run there. A
  no-checkout `update-ref` replay was also rejected: it desyncs the task worktree and blocks the
  next fix-rebase. merge-task is inherently split: rebase in the task worktree, merge in
  `_refinery`.

## Enforcement caveat

This isolation is **prompt-enforced, not hook-enforced.** The worktree-scope hook
(`hooks/validate-worktree-scope.sh`) fail-opens for `war-refiner` (the `*` case), so nothing in
the hook keeps a misbehaving refiner out of the main checkout. The actual backstop is the agent
obeying its prompt plus the grep-able clean-surface gate (validation criterion 3 in the spec). This
matches the model before this change — the refiner was already unrestricted — but reviewers should
not assume hook-level enforcement. Confining `war-refiner` writes to `_refinery` paths in the scope
hook is a separate, stronger guarantee deferred to a future change.

## References

- [ADR-0001](0001-explicitly-managed-worktrees.md) — explicitly-managed worktrees lifecycle; this
  ADR extends that lifecycle with `ensure-refinery-worktree` and path-based teardown.
- [ADR-0003](0003-plan-namespaced-branches.md) — plan-namespaced branch refs; the refinery
  worktree completes the isolation that ADR-0003 started (refs safe, now working-tree safe too).
- Design spec: `docs/specs/2026-06-25-concurrent-run-land-isolation-design.md`, §3–§6.

## Consequences

- Two WAR runs on **different** working branches land concurrently with zero cross-run content bleed
  and no serialization required.
- Two runs on the **same** working branch never force-push; the loser relands or escalates
  `land_stale`.
- The refiner's main-checkout-targeting instructions (`war-refiner.md`) are rewritten to route all
  merges through `_refinery`.
- `provision-worktrees.sh` gains two new primitives: `ensure-refinery-worktree` (create + re-attach
  on resume) and `land-advance` (push-first CAS + local-follower update).
- `teardown-phase` gains a path-based `_refinery` reap before the integration-branch delete, and
  the delete is now verified (non-zero exit propagated, not swallowed).
- `land_stale` joins the hard-escalation set in `land-decision.mjs` and `workflow-template.js`.
