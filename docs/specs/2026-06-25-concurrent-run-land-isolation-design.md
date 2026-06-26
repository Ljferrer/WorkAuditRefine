# Refiner-owned merge/land worktree — isolating concurrent runs in one repo

**Status:** proposed (design)

Two simultaneous WAR runs in the same repo overwrite each other when the Refinery mutates shared
git state. WAR already partitions the *branch refs* (ADR-0003, plan-namespaced
`integration/<slug>/phase-N`) and the *worktree directories* (run-scoped under
`.claude/teams/<run-id>/`), but the **Refinery still does its merges in the Lead's main checkout** —
the one working tree + HEAD a repo has. This spec moves every `war-refiner` merge into a
**run-scoped refinery worktree** so the Refinery never touches the shared checkout, making the
"single git-topology owner" invariant hold *per repo*, not just *per run*.

This realizes Candidate 1 from the 2026-06-25 architecture review (land in a run-scoped worktree),
widened during grilling to the Refinery's whole working surface.

## 1. Context — what is and isn't partitioned

| Shared resource | Today | Across two concurrent runs |
|---|---|---|
| Branch refs (`integration/<slug>/phase-N`, `war/<slug>/p<N>-<task>`) | Plan-namespaced (ADR-0003) + ownership ledger | **Safe** — different plans → different refs; same-plan foreign collision fails loud (exit 3) |
| Worktree directories | Run-scoped `.claude/teams/<run-id>/worktrees/` | **Safe** — teardown refuses any path outside its `--run-dir` |
| Git object store | Loose objects / packs | **Safe** — git writes are concurrency-safe |
| Remote branches | `git push` per ref | **Safe for different branches**; same ref serialized by non-ff rejection |
| **Main checkout (working tree + HEAD)** | The Refinery runs `git checkout … && git merge …` here for **both** merge-task and land-phase | **UNSAFE** — one working tree, one HEAD; a second run's `checkout` corrupts the first's `merge` |

The Refinery is, by CONTEXT.md, the repo's **git-topology owner** — "the single role responsible for
every mutation of *shared* git state." WAR enforces that invariant *within* a run (the serial merge
queue). With two runs there are two Refineries and the invariant breaks at exactly the resource
namespacing cannot split: the main checkout's working tree and HEAD.

`design.md §12` defers "multiple concurrent phases · multi-repo." Two *separate runs* in one repo on
different working branches is on neither list — it is unspecified territory that has already bitten
the project twice (ADR-0003's cross-plan branch collision "actually happened"; the auditor-baseline
learning notes parallel runs leave `main` on another war's branch).

## 2. Two refiner steps mutate the main checkout — both move

Grilled scope: **the full refiner surface**, not the land alone. The land is one instance of the
real unit — *the Refinery never operates in the shared checkout*.

- **merge-task** (`mode: merge-task`, design.md §4.5): rebase the approved task branch onto the
  integration tip, re-run the gate, merge `war/<slug>/p<N>-<task>` → `integration/<slug>/phase-N`,
  push integration. Runs in the Lead's cwd today.
- **land-phase** (`mode: land-phase`, design.md §4.6): merge `integration/<slug>/phase-N` → working
  `--no-ff`, run the gate, push working. Runs in the Lead's cwd today.

A land-only fix would close the integration→working door while leaving task→integration wide open;
two concurrent runs would still collide one merge-queue commit at a time. Both move into the
refinery worktree.

## 3. The pivotal git constraint — the land must be detached

The working branch is **already checked out in the Lead's session cwd** (a run starts on the working
branch and cuts integration from it; the Lead stays there). Git refuses a second checkout of one
branch, so the refinery worktree **cannot check out the working branch**.

- **merge-task** checks out the **integration branch** normally — integration branches are per-run
  namespaced and checked out nowhere else, so a plain checkout-and-merge in a private worktree is
  safe, and the ref move is git's own (no CAS needed; cross-run safety comes from namespacing).
- **land-phase** runs in a **detached** worktree at the working tip, merges integration `--no-ff`,
  runs the gate, then advances `refs/heads/<working>` with an explicit **compare-and-swap** and
  pushes without force. Detached = no branch checkout = no conflict with the Lead's checkout and no
  contention with any other run's worktree.

## 4. Resolved design tree

| # | Decision | Resolution | Rationale |
|---|---|---|---|
| 1 | Scope | Full refiner surface: merge-task **and** land-phase run in the refinery worktree | Land alone leaves task→integration colliding |
| 2 | Land mechanism | Detached worktree at working tip → merge `--no-ff` → gate → CAS-advance `refs/heads/<working>` → no-force push | Working branch is checked out in the Lead's cwd; can't double-check-out |
| 3 | Lead's checkout after land | **Opportunistic resync**: `git -C <cwd> merge --ff-only <new-tip>` *iff* the cwd is on the working branch and clean; else skip silently. Never force, never block | Keeps "checkout reflects the landed phase"; the guard makes it concurrency-safe (a run whose branch isn't current just skips) |
| 4 | Same-working-branch land collision | **Bounded auto-reland** (≤ `roundLimit`, default 3): on CAS/push rejection re-fetch, re-merge onto the new tip, re-gate, retry; then escalate (`conflict`) | Graceful under the rare same-branch case; never force, never clobber |
| 5 | Refinery worktree lifecycle | **Persistent per-phase**: provisioned in the existing Provision barrier on the integration branch, reused for all merge-task, detached for the land, reaped at teardown-phase | Reuses the refiner-owned provisioning lifecycle; one worktree per phase |
| 6 | Where the logic lives | **`provision-worktrees.sh`** owns worktree create/teardown + the CAS-advance-and-push primitive (tested); the `war-refiner` agent does the merge + gate *inside* the worktree | ADR-0001: the single tested shell asset owns all shared git-state mutation |

## 5. Mechanics

### 5.1 Provisioning (Provision barrier, before workers fan out)

After `ensure-integration` cuts/​reuses `integration/<slug>/phase-N`, provision a refinery worktree:

```
provision-worktrees.sh ensure-refinery-worktree <worktreeRoot>/<runId>/_refinery integration/<slug>/phase-N
```

- Path is run-scoped under `<worktreeRoot>/<runId>/` (inherits the `.claude/` exclude from
  `ensure-exclude` and the teardown run-scope). The leading `_` avoids colliding with any task id.
- Checks out the integration branch (it is not checked out elsewhere). Idempotent "ensure" with the
  same conservative-heal discipline as `ensure-worktree` (reuse if present; re-checkout on stale
  registry; fail loud on a non-empty unregistered dir).
- Drops a `.war-task`-style marker for humans/auditors.

### 5.2 merge-task (per approved task, serial — the queue)

In the refinery worktree (on the integration branch):

1. `git fetch`.
2. Rebase the task branch onto the integration tip. **Constraint:** the task branch is still checked
   out in the task worktree (it persists until the task lands, for fix-in-place), so the rebase is
   performed *against the task worktree*, not by checking the task branch out in the refinery
   worktree. (See §9 risk.)
3. Re-run the gate.
4. On conflict → `status: "conflict"`; on gate failure → `status: "gate_failed"` (routes a fresh
   fix-worker). Otherwise merge the task branch into integration (no force), push integration,
   return `status: "merged"` + the new integration SHA.

Cross-run safety: the integration ref is per-run namespaced, so this never contends with another
run. The refinery worktree is run-private, so the merge's working-tree writes never touch the shared
checkout.

### 5.3 land-phase (after all phase tasks merged, no hard escalation open)

In the refinery worktree, detached:

```
# attempt, retry <= roundLimit
git fetch
git switch --detach <working-tip>          # detached: never checks out <working>
git merge --no-ff integration/<slug>/phase-N
<run the gate>                              # green required
provision-worktrees.sh land-advance <working> <merge-sha> <expected-old=working-tip>
  # = git update-ref refs/heads/<working> <merge-sha> <expected-old>   (CAS)
  #   git push origin <merge-sha>:refs/heads/<working>                 (no --force)
  # CAS or push REJECTED (another run advanced <working>) -> loop: re-fetch, re-merge, re-gate
```

- On success → `status: "landed"` + the new working SHA; then **opportunistic resync** of the Lead's
  cwd (decision 3).
- After `roundLimit` failures → `status: "conflict"` (hard escalation; held for the Lead).
- `--no-ff` preserved → one phase commit, unchanged from today.

### 5.4 Opportunistic resync (decision 3)

After a successful land, the Lead (not the refiner) runs, against its own cwd:

```
if [ "$(git -C <cwd> symbolic-ref --short HEAD)" = "<working>" ] && git -C <cwd> diff --quiet && git -C <cwd> diff --cached --quiet; then
  git -C <cwd> merge --ff-only <new-working-tip>   # advances the Lead's tree to the landed phase
fi
# else: skip. Truth = refs/heads/<working> + origin/<working>; the human syncs when convenient.
```

Concurrency-safe by construction: a repo has one cwd-per-Lead and one HEAD; a run whose working
branch is not the cwd's current branch simply skips. Never `--force`, never blocks the run.

### 5.5 Teardown

`teardown-phase` removes the phase's task worktrees + the integration branch. It must **also** reap
the refinery worktree. Today its filter matches only `war/<slug>/p<N>-*` task branches; the refinery
worktree is on `integration/<slug>/phase-N`, so teardown-phase is extended to remove
`<worktreeRoot>/<runId>/_refinery` (run-scoped: only if it lives under `--run-dir`) **before**
deleting the integration branch (a checked-out branch can't be deleted). On a held/escalated phase
the worktree is preserved for inspection, consistent with `--keep`.

## 6. Concurrency-safety argument

- **Different working branches (the asked-about case):** each run gets its own
  `<runId>/_refinery` worktree (run-scoped path) and advances its own `refs/heads/<workingA>` vs
  `refs/heads/<workingB>` (per-ref `.lock`, independent). No shared working tree, no shared ref, no
  lock. They meet only at the object store and the remote — both already safe. **Cannot overwrite.**
- **Same working branch (rare):** both detached land worktrees coexist; the CAS-advance + no-force
  push serialize them — the loser re-lands onto the new tip (≤3) or escalates. **Never clobbers.**
- **Same plan, concurrent (rarer still):** the integration ref foreign-collision already fails loud
  at `ensure-integration` (exit 3) before any worktree is built.

The land **partitions** the contention away rather than **serializing** it with a lock — different
branches never contend, so there is nothing to serialize. A lock would serialize independent lands
and add a stale-lock failure mode; the deletion test favors the worktree (delete the worktree
isolation and the contention returns; delete a hypothetical lock and the worktree model still holds).

## 7. Surface changes

| File | Change |
|---|---|
| `skills/war/assets/provision-worktrees.sh` | New `ensure-refinery-worktree <path> <integration-branch>`; new `land-advance <working-ref> <new-sha> <expected-old>` (CAS update-ref + no-force push); `teardown-phase` extended to reap `_refinery` |
| `skills/war/assets/provision-worktrees.test.sh` | Tests: refinery-worktree ensure/idempotency/heal; CAS rejects on moved tip; push non-ff rejected; teardown reaps `_refinery`; run-scope still refuses out-of-run paths |
| `skills/war/assets/workflow-template.js` | Provision barrier also provisions `_refinery`; merge-task + land prompts target the refinery worktree; land prompt carries the reland loop + CAS; Lead opportunistic-resync after a `landed` result |
| `agents/war-refiner.md` | Inputs gain the refinery-worktree path; merge-task/land-phase run *inside* it; land is detached + CAS-advance + reland-≤N; never touch the Lead's checkout |
| `skills/war/references/schemas.md` | `MergeResult.status` notes the same-branch `conflict` (land-stale) path; Provisioning args document the refinery worktree path derivation |
| `CONTEXT.md` | New term **Refinery worktree** (§8) |
| `docs/adr/` | New ADR: "Refinery merges run in a run-scoped worktree, never the main checkout" — records why (concurrent-run isolation) and the detached-land + CAS choice |

## 8. New domain term (for CONTEXT.md)

**Refinery worktree**: the one run-scoped git worktree the Refinery performs all of a phase's merges
in — checked out on the integration branch for merge-task, detached at the working tip for the land.
Provisioned in the Provision barrier, reaped at phase teardown. It is the Refinery's *container*; it
exists so the Refinery never mutates the Lead's main checkout, which a second concurrent run could
share. _Avoid_: refiner checkout, merge sandbox.

## 9. Open risks / implementation notes

- **merge-task rebase vs the live task worktree.** The task branch is checked out in the task
  worktree until the task lands. `git rebase <integration-tip> <task-branch>` would check out the
  task branch and fail if it is checked out elsewhere. This constraint **pre-exists** this spec (the
  current main-checkout refiner has the same problem); relocating merge-task to the refinery worktree
  must not paper over it. The implementation performs the rebase against the task worktree (or uses a
  no-checkout strategy), then merges the rebased task branch into integration from the refinery
  worktree. A test must pin this.
- **Resume idempotency.** A resumed run must reuse an existing `_refinery` worktree (ensure =
  no-op), exactly like task worktrees. The ownership ledger already distinguishes resume from
  foreign collision for the integration branch.
- **Gate side-effects in parallel.** Two runs now run their gates in two separate worktrees at the
  same time. If a gate touches a *shared external* resource (a fixed port, a shared DB), they can
  collide there — independent of git. This is the one place the user's original "global lock"
  instinct is correct, scoped tightly to gate resources (§10).
- **A detached HEAD worktree** left around (crash mid-land) is reaped by teardown's run-scoped
  prune; the working ref is never advanced unless the CAS succeeds, so a crash leaves no partial
  land.

## 10. Non-goals / deferred

- **A narrow gate-resource lock.** Serializing the *gate's* shared side-effects (not the merge) is
  the legitimate residual of the user's land-lock idea. Deferred; surfaced here so it isn't lost.
- **Auditor baseline pinning (review Candidate 3).** Auditors read their baseline from the main
  checkout, whose HEAD a parallel run can move — the same root cause as the land bug, fixed by the
  same rule ("never depend on the main checkout's HEAD; pin an explicit ref"). Tracked separately;
  this spec covers only the Refinery's write surface.
- **Multi-repo, multiple concurrent phases** (design.md §12) — unchanged.

## 11. Validation criteria

- Two runs on different working branches land concurrently with zero `git` errors and zero
  cross-run content bleed (each working branch contains only its own phase commits).
- Two runs on the same working branch never produce a non-ff force-push; the loser re-lands or
  escalates `conflict`.
- The Refinery issues no `git checkout`/`merge`/`update-ref`/`push` against the Lead's main checkout
  for any merge (grep-able clean-surface gate, mirroring the WAR_WORKTREE retirement test).
- A resumed run reuses `_refinery` (no re-cut, no foreign-collision error).
- After a land, the Lead's cwd is either fast-forwarded (on-branch + clean) or untouched — never
  force-reset, never left mid-merge.
