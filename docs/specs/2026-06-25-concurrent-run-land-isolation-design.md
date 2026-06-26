# Refiner-owned merge/land worktree — isolating concurrent runs in one repo

**Status:** proposed (design) — revised after adversarial verification (2026-06-25, see §12)

Two simultaneous WAR runs in the same repo overwrite each other when the Refinery mutates shared
git state. WAR already partitions the *branch refs* (ADR-0003, plan-namespaced
`integration/<slug>/phase-N`) and the *worktree directories* (run-scoped under
`.claude/teams/<run-id>/`), but the **Refinery still does its merges in the Lead's main checkout** —
the one working tree + HEAD a repo has. This spec moves every `war-refiner` merge into a
**run-scoped refinery worktree** so the Refinery never touches the shared checkout, making the
"single git-topology owner" invariant hold *per repo*, not just *per run*.

This realizes Candidate 1 from the 2026-06-25 architecture review (land in a run-scoped worktree),
widened during grilling to the Refinery's whole working surface, then hardened by a sandbox
verification that reproduced the git mechanics and corrected six design defects (§12).

## 1. Context — what is and isn't partitioned

| Shared resource | Today | Across two concurrent runs |
|---|---|---|
| Branch refs (`integration/<slug>/phase-N`, `war/<slug>/p<N>-<task>`) | Plan-namespaced (ADR-0003) + ownership ledger | **Safe** — different plans → different refs; same-plan foreign collision fails loud (exit 3) |
| Worktree directories | Run-scoped `.claude/teams/<run-id>/worktrees/` | **Safe** — teardown refuses any path outside its `--run-dir` |
| Git object store | Loose objects / packs | **Safe** — git writes are concurrency-safe |
| Remote branches | `git push` per ref | **Safe for different branches**; same ref serialized by non-ff rejection |
| **Main checkout (working tree + HEAD)** | The Refinery runs `git checkout … && git merge …` here for **both** merge-task and land-phase (confirmed: no `agent()` call passes a `cwd`/worktree — workflow-template.js merge/land spawns) | **UNSAFE** — one working tree, one HEAD; a second run's `checkout` corrupts the first's `merge` |

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

## 3. The pivotal git constraints

**(a) The land must be detached.** The working branch is **already checked out in the Lead's session
cwd** (a run starts on the working branch and cuts integration from it; the Lead stays there). Git
refuses a second checkout of one branch (verified: `git worktree add … <working>` → `fatal: already
used by worktree`), so the refinery worktree **cannot check out the working branch**. The land runs
in a **detached** worktree at the working tip (verified: `git switch --detach <tip>` from a worktree
on the integration branch is valid and leaves the integration ref unmoved).

**(b) The *push* is the cross-run CAS, not `update-ref`.** A local `git update-ref refs/heads/<working>
<new> <expected-old>` only compares against the *local* ref — which a second run never touches — so
it succeeds even when `origin/<working>` has moved, leaving local and origin **divergent** (verified
in a sandbox). Only the remote ref is shared, so the land advances the working branch by **pushing
first** (no `--force`); the remote's non-ff rejection is the atomic compare-and-swap against shared
truth. The local ref is advanced **only after** a successful push, as a follower.

**(c) `update-ref` under a checked-out branch desyncs that checkout.** Moving `refs/heads/<working>`
while it is checked out in the Lead's cwd leaves HEAD at the new commit but the index/tree stale, so
`git status` there shows the landed files as **staged deletions** (verified). This is why the
opportunistic resync (§5.4) requires a clean-tree guard and a fast-forward.

## 4. Resolved design tree

| # | Decision | Resolution | Rationale |
|---|---|---|---|
| 1 | Scope | Full refiner surface: merge-task **and** land-phase run via the refinery worktree | Land alone leaves task→integration colliding |
| 2 | Land mechanism | Detached worktree at the working tip → merge `--no-ff` → gate → **push (no-force) = the cross-run CAS** → on push success advance local `refs/heads/<working>` as a follower | The working branch is checked out in the Lead's cwd; only the remote ref is shared (§3) |
| 3 | Lead's checkout after land | **Opportunistic resync**: `git -C <cwd> merge --ff-only <new-tip>` *iff* the cwd is on the working branch and clean; else skip. Advances *only* when `<new-tip>` is a ff descendant; never force, never block | Keeps "checkout reflects the landed phase" when possible; ff-only is the load-bearing backstop (§5.4) |
| 4 | Same-working-branch land collision | **Bounded auto-reland** (≤ `roundLimit`, default 3): on push rejection, re-fetch, re-merge onto **`origin/<working>`**, re-gate, re-push; then escalate `land_stale` | Graceful under the rare same-branch case; the local ref never moved on a failed push, so there is nothing to rewind |
| 5 | Refinery worktree lifecycle | **Persistent per-phase**: provisioned in the Provision barrier on the integration branch, reused (ensure **+ re-attach**) for all merge-task, detached for the land, reaped by a **path-based** teardown-phase step | Reuses the refiner-owned provisioning lifecycle; one worktree per phase |
| 6 | Where the logic lives | **`provision-worktrees.sh`** owns worktree create/teardown + the `land-advance` push-first primitive (tested); the `war-refiner` agent does merges + gate *inside* the worktrees | ADR-0001: the single tested shell asset owns all shared git-state mutation |

## 5. Mechanics

### 5.1 Provisioning (Provision barrier, before workers fan out)

After `ensure-integration` cuts/​reuses `integration/<slug>/phase-N`, provision a refinery worktree:

```
provision-worktrees.sh ensure-refinery-worktree <worktreeRoot>/<runId>/_refinery integration/<slug>/phase-N
```

- Path is `<worktreeRoot>/<runId>/_refinery` — the same `<worktreeRoot>/<runId>/` prefix the template
  already derives task worktrees under (workflow-template.js). The leading `_` avoids colliding with
  any task id. **Root caveat (§9):** `worktreeRoot` (`<repo>/.claude/worktrees`) and the teardown
  `--run-dir` (`.claude/teams/<runId>`) are *distinct roots* today; teardown of `_refinery` must be
  scoped to `worktreeRoot`, not blindly inherit the `--run-dir` check.
- **ensure + re-attach** (NOT a pure no-op reuse like a task worktree). On reuse: if the worktree is
  registered and present but its HEAD is **detached or not on the integration branch** (the state a
  crash mid-land leaves) AND the tree is clean → `git -C <_refinery> switch <integration-branch>`
  before returning. Fail loud on a dirty tree (never reset). Otherwise, same conservative-heal
  discipline as `ensure-worktree` (re-checkout on stale registry; fail loud on a non-empty
  unregistered dir). Drops a `.war-task`-style marker.

### 5.2 merge-task (per approved task, serial — the queue)

merge-task is **inherently split across two worktrees** — the task branch stays checked out in its
live task worktree (it persists for fix-in-place until the task lands), and `git rebase` must check
out the branch it rebases, so the rebase cannot run in the refinery worktree (verified: `fatal:
already used by worktree`; `git rebase --onto` does **not** dodge this; a no-checkout `update-ref`
replay desyncs the task worktree and blocks the next fix-rebase — do **not** use it).

1. `git -C <taskWorktree> fetch`.
2. **Rebase in the task worktree:** `git -C <taskWorktree> rebase <integration-tip>` (the branch is
   already checked out there; leaves the task worktree in sync). On conflict → `status: "conflict"`.
3. Re-run the gate (in the task worktree, or in `_refinery` after the merge).
4. In the refinery worktree (on the integration branch): `git merge <task-branch>` (no force), push
   integration. On gate failure → `status: "gate_failed"` (routes a fresh fix-worker, which works in
   the **task** worktree exactly as today — unchanged). Otherwise `status: "merged"` + new
   integration SHA.

Cross-run safety: the integration ref is per-run namespaced, so this never contends with another
run; the merge's working-tree writes land only in `_refinery`. `<taskWorktree>` must be threaded into
the merge-task inputs (war-refiner.md, the workflow-template merge prompt, schemas.md).

### 5.3 land-phase (after all phase tasks merged, no hard escalation open)

In the refinery worktree, detached, **push-first** (§3b):

```
# attempt loop, retries <= roundLimit
git fetch
git switch --detach origin/<working>                 # re-base the land on the SHARED tip each iter
git merge --no-ff integration/<slug>/phase-N
<run the gate>                                        # green required
provision-worktrees.sh land-advance <working> <merge-sha>
  # 1) git push origin <merge-sha>:refs/heads/<working>   (NO --force)
  #      -> non-ff REJECTED (another run advanced origin/<working>) => loop (re-fetch, re-merge, re-gate)
  #      -> classify push output: 'non-fast-forward' => reland; any other error => escalate (never infer success)
  # 2) on push ACCEPTED only: git update-ref refs/heads/<working> <merge-sha> <old>   (local follower)
```

- On success → `status: "landed"` + the new working SHA; then **opportunistic resync** of the Lead's
  cwd (§5.4). The local ref only ever advances after a successful push, so a failed attempt leaves
  nothing to rewind.
- After `roundLimit` failed attempts → `status: "land_stale"` (a hard escalation distinct from a
  content `conflict`; see §7 schemas change). Held for the Lead.
- `--no-ff` preserved → one phase commit, unchanged from today.

### 5.4 Opportunistic resync (decision 3)

After a successful land, the Lead (not the refiner) runs, against its own cwd:

```
if [ "$(git -C <cwd> symbolic-ref --short HEAD 2>/dev/null)" = "<working>" ] \
   && git -C <cwd> diff --quiet && git -C <cwd> diff --cached --quiet; then
  git -C <cwd> merge --ff-only <new-working-tip> || log "resync skipped: <cwd> not a fast-forward of <new-tip>"
fi
# else: skip. Truth = refs/heads/<working> + origin/<working>; the human reconciles when convenient.
```

It advances **only** when `<new-working-tip>` is a fast-forward descendant of the cwd's current HEAD;
otherwise `--ff-only` fails closed and the cwd is left untouched (verified: ff-only refuses a
non-descendant sibling, so two interleaved resyncs cannot cross-contaminate). The clean-tree guard is
**essential** — a post-land cwd already shows the landed merge as staged deletions (§3c), which would
otherwise read as real local edits. Consequence: when multiple runs share one cwd, the tree may
legitimately end on a non-latest tip; this is safe and the human reconciles. Never `--force`, never
blocks the run.

### 5.5 Teardown

`teardown-phase` removes the phase's task worktrees + the integration branch. It must **also** reap
the refinery worktree — and its existing branch-prefix `awk` filter (matches only
`refs/heads/war/<slug>/p<N>-`) **cannot see `_refinery`**, which sits on `integration/<slug>/phase-N`
during merge-task and is **detached** (no `branch` porcelain line at all) after the land (verified:
both the worktree and the integration branch leak; `git branch -D integration/…` is refused while the
worktree holds it, and the current `|| warn` swallows the failure). Therefore:

- Reap `<worktreeRoot>/<runId>/_refinery` **by path**, run-scoped via its **own**
  `path_under`/`require_in_run` check (teardown-phase has no shared run-scope gate to inherit — unlike
  teardown-task — and the path is under `worktreeRoot`, not necessarily `--run-dir`; see §9). Works
  whether the worktree is on-integration or detached.
- Do this **before** `delete_branch`, then **verify** `git branch -D integration/<slug>/phase-N`
  actually succeeded — propagate the real exit code instead of swallowing it.
- On a held/escalated phase, preserve `_refinery` for inspection under the same `--keep` rule.

## 6. Concurrency-safety argument

- **Different working branches (the asked-about case):** each run gets its own
  `<runId>/_refinery` worktree and pushes its own `refs/heads/<workingA>` vs `refs/heads/<workingB>`
  (independent remote refs). No shared working tree, no shared ref, no lock. They meet only at the
  object store and the remote — both already safe. **Cannot overwrite.**
- **Same working branch (rare):** both detached land worktrees coexist; the **push** (no-force)
  serializes them — the loser re-lands onto `origin/<working>`'s new tip (≤3) or escalates
  `land_stale`. **Never clobbers.**
- **Same plan, concurrent (rarer still):** the integration ref foreign-collision already fails loud
  at `ensure-integration` (exit 3) before any worktree is built.

The land **partitions** the contention away rather than **serializing** it with a lock — different
branches never contend, so there is nothing to serialize.

**Enforcement caveat:** this isolation is **prompt + clean-surface-gate enforced, not hook-enforced.**
The worktree-scope hook (`hooks/validate-worktree-scope.sh`) **fail-opens for `war-refiner`** (the
`*` case), so nothing in the hook keeps a misbehaving refiner out of the main checkout. The actual
backstop is the agent obeying its prompt plus the grep-able clean-surface gate (validation criterion
3). This matches today's model (the refiner was already unrestricted) — not a regression — but
reviewers should not assume hook enforcement. Confining `war-refiner` writes to `_refinery` in the
scope hook is a separate, stronger guarantee (§10).

## 7. Surface changes

| File | Change |
|---|---|
| `skills/war/assets/provision-worktrees.sh` | New `ensure-refinery-worktree <path> <integration-branch>` (**ensure + re-attach** on reuse); new `land-advance <working-ref> <new-sha>` (**push-first** no-force CAS; advance local follower only on push success; classify push output); `teardown-phase` extended to reap `_refinery` **by path** (own run-scope check) and to **verify** the integration-branch delete |
| `skills/war/assets/provision-worktrees.test.sh` | Tests: refinery-worktree ensure/idempotency/heal **and resume-from-detached re-attach**; `land-advance` push rejected → **local ref unchanged**; ff push accepted → local follower set; teardown reaps a **detached** `_refinery` and an **on-integration** `_refinery`; integration delete **fails loud** if the worktree wasn't reaped first; run-scope refuses an out-of-run `_refinery` path; merge-task rebase of a branch checked out in a separate worktree leaves the task worktree **clean** |
| `skills/war/assets/workflow-template.js` | Provision barrier also provisions `_refinery`; merge-task prompt rebases in `<taskWorktree>` then merges in `_refinery`; land prompt carries the push-first reland loop; Lead opportunistic-resync after a `landed` result |
| `agents/war-refiner.md` | Inputs gain the refinery-worktree path **and the task worktree path**; merge-task rebases in the task worktree, merges in `_refinery`; land is detached + push-first + reland-≤N; never touch the Lead's checkout |
| `skills/war/references/schemas.md` | `MergeResult.status` gains **`land_stale`** (CAS-exhaustion, distinct from content `conflict`); `decideLand`/`HARD_ESCALATION_REASONS` treat it as a hard escalation; document the `_refinery` path + the worktreeRoot-vs-runDir scope note |
| `skills/war/assets/land-decision.mjs` | Add `land_stale` to `HARD_ESCALATION_REASONS` (mirrored inline in workflow-template.js — keep in sync) |
| `CONTEXT.md` | New term **Refinery worktree** (§8) |
| `docs/adr/` | New ADR: "Refinery merges run in a run-scoped worktree, never the main checkout" — records why (concurrent-run isolation), the detached-land + **push-first CAS** choice, and the prompt-vs-hook enforcement caveat |

## 8. New domain term (for CONTEXT.md)

**Refinery worktree**: the one run-scoped git worktree the Refinery performs a phase's merges in —
on the integration branch for the integration-side of merge-task, detached at the working tip for the
land. (The task-branch rebase of merge-task runs in the *task* worktree, not here — see §5.2.)
Provisioned in the Provision barrier, reaped by path at phase teardown. It is the Refinery's
*container*; it exists so the Refinery never mutates the Lead's main checkout, which a second
concurrent run could share. Isolation is prompt-enforced, not hook-enforced (§6). _Avoid_: refiner
checkout, merge sandbox.

## 9. Open risks / implementation notes

- **`worktreeRoot` vs `runDir` are distinct roots.** Task worktree *paths* are
  `<worktreeRoot>/<runId>/<task>` (worktreeRoot = `<repo>/.claude/worktrees`), while teardown's
  run-scope is `--run-dir = .claude/teams/<runId>` — a *sibling*, not an ancestor. So
  `<worktreeRoot>/<runId>/_refinery` is generally **not** under `--run-dir`, and a naïve
  `require_in_run` check would reject it. This pre-exists this spec. Reconcile explicitly: either reap
  `_refinery` scoped to `worktreeRoot/<runId>` (recommended), or make `worktreeRoot` nest under the
  run-dir as a tested precondition. The §7 teardown-phase change must state which root it scopes to.
- **merge-task rebase locus (resolved).** Pinned to `git -C <taskWorktree> rebase <integration-tip>`.
  `git rebase --onto` does **not** bypass the checked-out-branch rule; an `update-ref` replay desyncs
  the task worktree and blocks the next fix-rebase. A test asserts the task worktree is left clean.
- **Resume re-attach (resolved).** `ensure-refinery-worktree` re-attaches a detached/mismatched
  `_refinery` to the integration branch on reuse (§5.1); a pure no-op reuse would leave a resumed
  merge-task committing on a detached HEAD and orphaning the integration ref.
- **Crash mid-land.** With push-first ordering, the working ref advances only after the atomic remote
  push, so a crash leaves no partial land. The leftover live `_refinery` dir is reaped by the
  explicit **path-based** teardown step (§5.5) — **not** by `git worktree prune`, which only clears
  registry entries whose dir is already gone.
- **`land_stale` vs `conflict`.** Reusing `conflict` for CAS-exhaustion would make a Lead unable to
  tell a real merge conflict from same-branch contention; a distinct `land_stale` status carries the
  discriminator.
- **Gate side-effects in parallel.** Two runs now run their gates in two separate worktrees at once.
  A gate that touches a *shared external* resource (a fixed port, a shared DB) can collide there,
  independent of git — the one place the user's original "global lock" instinct is correct, scoped to
  gate resources (§10).

## 10. Non-goals / deferred

- **A narrow gate-resource lock.** Serializing the *gate's* shared side-effects (not the merge) is
  the legitimate residual of the user's land-lock idea. Deferred; surfaced here so it isn't lost.
- **Hook-enforced refiner confinement.** A scope-hook change to confine `war-refiner` writes to
  `_refinery`/integration paths (instead of fail-open) would make the isolation code-enforced rather
  than prompt-enforced (§6). Stronger guarantee, separate change.
- **Auditor baseline pinning (review Candidate 3).** Auditors read their baseline from the main
  checkout, whose HEAD a parallel run can move — the same root cause as the land bug, fixed by the
  same rule ("never depend on the main checkout's HEAD; pin an explicit ref"). Tracked separately.
- **Multi-repo, multiple concurrent phases** (design.md §12) — unchanged.

## 11. Validation criteria

- Two runs on different working branches land concurrently with zero `git` errors and zero
  cross-run content bleed (each working branch contains only its own phase commits).
- Two runs on the same working branch never produce a force-push; a rejected land leaves the **local**
  `refs/heads/<working>` unchanged, and the loser re-lands onto `origin/<working>` or escalates
  `land_stale`.
- The Refinery issues no `git checkout`/`merge`/`update-ref`/`push` against the Lead's main checkout
  for any merge (grep-able clean-surface gate, mirroring the WAR_WORKTREE retirement test).
- merge-task leaves the task worktree clean (`git -C <taskWorktree> status --porcelain` empty) so
  fix-in-place still works.
- A resumed run re-attaches a detached `_refinery` to the integration branch (no orphaned commits);
  no re-cut, no foreign-collision error.
- teardown reaps `_refinery` in both on-integration and detached states, and the integration-branch
  delete fails loud if the worktree was not reaped first.
- After a land, the Lead's cwd is either fast-forwarded (on-branch + clean + ff descendant) or
  untouched — never force-reset, never left mid-merge.

## 12. Adversarial verification (2026-06-25)

A verification Workflow (one git-mechanics prover in a throwaway sandbox, one consistency checker
against the live assets, one design-hole hunter) ran against this spec on v0.5.1 master.

**Confirmed git mechanics** (the design rests on these): a second checkout of a checked-out branch is
refused; a detached worktree can `merge --no-ff` and `update-ref` with correct/​wrong expected-old
(CAS semantics hold); a no-force push is rejected non-ff when origin moved; `switch --detach` leaves
the branch ref unmoved; `update-ref` under a checked-out branch surfaces as staged deletions.

**Corrected defects** (folded into the sections above):
1. *(critical)* land-advance CAS order was backwards → **push-first** (§3b, §5.3, decision 2).
2. *(critical)* merge-task rebase is impossible in `_refinery` → **rebase in the task worktree** (§5.2).
3. *(major)* teardown's branch filter can't see `_refinery`; integration delete silently failed →
   **path-based reap + verified delete** (§5.5).
4. *(major)* `worktreeRoot` ≠ `--run-dir` undercut the run-scope claim → **explicit root reconciliation** (§9).
5. *(major)* resume left `_refinery` detached → **ensure + re-attach** (§5.1).
6. *(minor)* overstated guarantees sharpened: opportunistic resync is ff-only/skip (§5.4); `prune`
   doesn't reap a live dir (§9); `land_stale` ≠ `conflict` (§7); isolation is prompt- not
   hook-enforced (§6).
