# Refiner recovery — submodule-as-repo provisioning, reland discrimination, submodule land arms, gate-classification base re-run

Verbatim evictions from `agents/war-refiner.md` (prompt-surface simplification, Task 4.1, plus
the § Base re-run + re-attach block from references-pointer-integrity Task 1.2 — an ADR 0042
budget eviction; each moved block was byte-identical to its pre-eviction card text at eviction
time). Positional words inside the moved blocks ("below", "above") refer to their original card
positions — "All merge-task and land-phase steps below" means the card's own
merge-task/land-phase sections, and the reland-discrimination block sat as step 3 of the card's
superproject land loop (the card's on-push-success return — the old step 4 — was evicted to
budget-raise-floor.md § Evicted: § land-phase / Superproject phase, alongside the CAS loop). The dispatched land
prompts in `skills/war/assets/workflow-template.js` still carry the full discrimination text
(registry-pinned, `relandDiscrimination`); this file is the standing copy the grep-parity
suite reads.

## Submodule-as-repo provisioning

Trigger: a phase's `target repo` is a submodule (not the superproject).

When a phase's `target repo` is a submodule (not the superproject), the **entire cwd-scoped toolchain runs from the initialized submodule checkout** — the same scripts, no changes to `provision-worktrees.sh`, only the cwd changes.

Before invoking any toolchain steps for a submodule phase:

1. **Initialize the submodule checkout** in the superproject worktree: `git -C <superWorktree> submodule update --init --recursive`. This materializes the submodule's `.git` at `<superWorktree>/<submodulePath>/`.
2. The **submodule checkout** is `<superWorktree>/<submodulePath>/` — this becomes the cwd for all subsequent toolchain steps for this phase.
3. **Cut the integration branch off the submodule's resolved base**: `git -C <submoduleCheckout> checkout -b integration/<slug>/phase-N <resolvedBase>`. The resolved base is the explicit signal from run config, the `branch` field in `.gitmodules`, or a value raised to the human at launch (never silently the remote default).
4. **Create task worktrees under `<worktreeRoot>/<runId>/`** using `git -C <submoduleCheckout> worktree add <worktreeRoot>/<runId>/p<phase>-<taskId> <taskBranch>` (the worktree path is phase-scoped — `p<phase>-<taskId>` mirrors the task branch shape). All task and `_refinery` worktrees for a submodule phase live under the same `<worktreeRoot>/<runId>/` root, with cwd resolved relative to the submodule checkout.

All merge-task and land-phase steps below run with `<taskWorktree>` and `<_refinery>` rooted in the submodule checkout. The submodule's own `.git`, remote, and branches are the authority — the superproject is not consulted.

Evicted verbatim from the `agents/war-refiner.md` § Submodule-as-repo provisioning paragraph (ADR 0042; the card keeps the trigger pointer):

> All merge-task and land-phase steps below then run with `<taskWorktree>` and `<_refinery>` rooted in the submodule checkout; the submodule's own `.git`, remote, and branches are the authority. Your dispatched provision-barrier prompt's `submodNote` (built in `workflow-template.js`) is the carrier of the submodule targetRepo/targetBase and the `git submodule update --init --recursive` step.

## Reland discrimination — superproject land-phase step 3

Trigger: the final failed CAS attempt of a land (after `roundLimit` rejected pushes), before returning `land_stale`. Identical discrimination, scoped to the submodule checkout/remote, applies at 2A step 3 below.

**Before surrendering to `land_stale`, discriminate a contender-less transient from a real divergence** (D4). On the final failed CAS attempt (after `roundLimit` rejected pushes), do NOT return `land_stale` yet — run `git fetch origin <working>` then `git rev-list --left-right --count <merge-sha>...origin/<working>`: the merge sha the loop just tried to push vs. the freshly-fetched origin tip, NEVER the local follower `refs/heads/<working>` (it lags; operator decision 2d). Right count 0 (contender-less transient: every commit on the fetched origin tip is already contained in the merge sha, so no competing commit exists and the rejection cannot be a lost CAS) buys exactly one extra push-first attempt beyond roundLimit exhaustion (an explicit +1, once — not a slot inside `roundLimit`): re-fetch, re-detach at `origin/<working>`, re-merge `--no-ff`, re-gate, `land-advance`; if that extra attempt also fails, return `status: "land_stale"`. Otherwise a nonzero right count (real contender commits on origin) is a real divergence: return `status: "land_stale"` immediately, with no extra attempt. `land_stale` is a hard escalation distinct from a content `conflict` (no merge-text contradictions, only topology contention); held for the Lead. The retry branch is live, not dead code — right count 0 is reachable when the prior push actually landed but the client saw a transient error (the retry's `land-advance` then exits 0 via Task 1.1's already-landed reconciliation) or when a remote hiccup produced a spurious rejection; a transient that resolves returns `status: "landed"` (**no new status**), so the Workflow's landed path spawns the servitor wrap-up automatically.

## Submodule land arms (2A / 2B)

Trigger: a land-phase (or 2A merge) dispatch whose phase's `target repo` is a submodule.

### Submodule phase — 2A (WAR-owned submodule)

When `target repo` is a submodule **and** the run config declares the submodule as WAR-owned, WAR authors the submodule merge directly (no hold). All cwd below refers to the **submodule checkout** (`<superWorktree>/<submodulePath>/`).

1. Verify all of the submodule phase's task branches are merged into the submodule integration branch.
2. In the submodule's `_refinery`, run the same push-first CAS loop as the superproject land (≤ `roundLimit` attempts), scoped to the submodule checkout:
   ```
   git -C <submodule-_refinery> fetch
   git -C <submodule-_refinery> switch --detach origin/<submodule-working>
   git -C <submodule-_refinery> merge --no-ff integration/<slug>/phase-N
   <run the gate>                                                              # green required (submodule's gate)
   provision-worktrees.sh land-advance <submodule-working> <merge-sha>        # cwd = submodule checkout
   ```
   - Same push-first CAS semantics as above. `land-advance` runs with cwd = submodule checkout, pushing to the submodule remote only.
   - On push success → record the landed SHA; proceed to step 3.
   - On push rejection → re-fetch, re-detach, re-merge, re-gate (same reland loop).
   - On any other push error → return `status: "error"`.
3. **Same transient-vs-divergence discrimination before surrendering** (D4), scoped to the submodule checkout/remote: on the final failed CAS attempt run `git fetch origin <submodule-working>` then `git rev-list --left-right --count <merge-sha>...origin/<submodule-working>` — the merge sha the loop just tried to push vs. the freshly-fetched submodule origin tip, NEVER the local follower. Right count 0 (contender-less transient) buys exactly one extra push-first attempt beyond roundLimit exhaustion (an explicit +1, once — not a slot inside `roundLimit`): re-fetch, re-detach, re-merge `--no-ff`, re-gate, `land-advance`; if that extra attempt also fails, return `status: "land_stale"`. Otherwise a nonzero right count (real contender commits on origin) is a real divergence: return `status: "land_stale"` immediately, with no extra attempt.
4. On push success → return `status: "landed"` with the **submodule's** new working SHA. The Workflow threads this SHA to the dependent gitlink-bump task via the ledger — no hold, no resume required.

### Submodule phase — 2B (PR-and-hold, default)

When `target repo` is a submodule **and** it is **not** declared WAR-owned, WAR pushes the submodule task branch and opens a PR. The run holds until the human merges.

1. Verify all of the submodule phase's task branches are merged into the submodule integration branch.
2. Push the submodule integration branch to the submodule remote: `git -C <submoduleCheckout> push origin integration/<slug>/phase-N`.
3. Open a PR in the submodule repo: `gh pr create --repo <pr_remote> --head integration/<slug>/phase-N --base <submodule-base> --title <...> --body <...>`. Capture the PR number.
4. Return `status: "submodule-pr"` with the PR number and the submodule remote (`pr_number`, `pr_remote`). **Do NOT** author the merge commit. The Workflow maps this to `landDecision: "held:submodule-pr"` and records the PR number/remote in the ledger.
5. The run is now held. It resumes only when a human re-triggers `/war` after merging the PR (the Lead's resume procedure checks `gh pr view <pr_number> --json state,mergeCommit -R <pr_remote>` and takes `mergeCommit.oid` as the submodule phase's landed SHA).

## Base re-run + re-attach (gate classification)

Trigger: a gate-failure classification requires the base re-run (merge-task or land-phase). "That base" below is the per-site classification base the card's § Gate-failure classification names.

- **Base re-run + re-attach:** detach `_refinery` at that base (`git -C <_refinery> checkout --detach <base>`), re-run ONLY the failing gate there, then **RE-ATTACH `_refinery` to the integration branch before you return** (`git -C <_refinery> checkout <integrationBranch>`). Every merge/land dispatch also **begins** with that same idempotent re-attach (the re-attached-by-default `_refinery`), so a dispatch that died mid-classification cannot strand the queue detached.

## Pin-transfer arms

The merge slot's pin-transfer probe (see `agents/war-refiner.md` § pin-transfer probe for steps 1-3, which produce `BASE`, `N`, `PRE`, `CHERRY`, `TIP`, `POST`). Take the arms in this order:

4. **`already_upstream` first.** Post-rebase diff empty **and** `N > 0` **and** every `CHERRY` line starting `-` **and** `PRE` non-empty → `status: "already_upstream"` with `rebased_tip`, both patch-ids, `already_upstream_commits` (the SHAs `CHERRY` listed). Already upstream: nothing to merge, no panel.
5. **Fail closed.** Post-rebase diff EMPTY **and** (`N` is 0, **or** any `CHERRY` line starts `+`, **or** `PRE` is empty) — the empty post-rebase diff is the shared precondition for all three legs, so this is never an unscoped 3-way OR → `status: "empty-unmatched"`, `detail` naming the failing leg. Never `already_upstream`, never a transfer: empty-equals-empty is not equality, and a zero-commit branch is vacuously an ancestor.
6. **Otherwise compare patch-ids**, returning `rebased_tip` and both ids either way: `PRE` non-empty and `PRE == POST` → `status: "transferred"` (the rebase carried the task's own diff unchanged, so the pin transfers); `PRE != POST` → `status: "mismatch"` (the Workflow re-audits the rebased tip full-panel, in the lock, before the merge).
7. Any unclassifiable git/env error → `status: "error"` with `detail`; merge-task then runs unchanged — the probe is fail-open.
