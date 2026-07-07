# WAR working-branch checkout guard — stop `held:land-failed` when launched from the working branch's own worktree

Source: the 2026-07-06 `/war` doc-rot-remediation run (launched from `.claude/worktrees/loving-solomon-f4350c`); design tree resolved via `/war-strategy` gap-driven grilling (A–F). Not yet a plan — convert with `/war-strategy` then validate with `/red-team`.

## 1. Context — the gap / problem

`/war` defaults the **working branch** to the current branch. When the run is launched from a git worktree whose checked-out branch *is* that working branch, the refiner's per-phase land — which advances the working branch via a **push-first CAS** (`provision-worktrees.sh land-advance`: merge `integration/*` → working, push) — fails with `landDecision: held:land-failed`. Two independent causes stack:

1. **Checked out elsewhere.** The working branch is checked out in the Lead's worktree, so the run-scoped `_refinery` worktree cannot advance that ref (git refuses to move a branch checked out in another worktree).
2. **Absent on origin.** On the first phase the working branch had no remote ref, so the push-first CAS had no baseline.

Observed blast radius in that run: **every** phase land failed and required a manual Lead land (clean `--no-ff` merge in the Lead worktree + gate + push); additionally a post-land **stale-worktree desync** appeared (the Lead worktree's checkout lagged the advanced ref — files showed the pre-land version while `HEAD` had moved). Cross-refs: `[[war-launch-worktree-with-working-branch-checked-out-forces-manual-land]]`, `[[land-local-follower-ref-can-lag-sync-before-next-phase]]`.

## 2. Pivotal constraints

- The refiner lands by **push-first CAS and never `--force`es a shared branch** (ADR 0004 & 0012); a ref checked out in any worktree cannot be advanced by the refinery merge.
- WAR must remain **`--afk`-autonomous** for the common case — the fix cannot introduce a mandatory human step on the normal path.
- **`provision-worktrees.sh` is the single tested owner of git-topology mutation** (branch/worktree lifecycle), macOS bash 3.2-safe; new git-state logic belongs there, called from the Lead's Setup prose.
- **Prompt-surface split** (CLAUDE.md): any change to refiner behavior must update both the standing instructions (`agents/war-refiner.md`) and the dispatched prompt (`workflow-template.js`).
- **Enum discipline:** `held:land-failed` is an existing `KNOWN_LAND_DECISIONS` value; ADR 0005 forbids adding new hard-escalation reasons casually. The auto-recover path reuses the existing decision, it does not add an enum.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| **A. Prevent vs tolerate** | **Prevent at Setup**, *and* keep a narrow defense-in-depth recover (F). |
| **B. Collision mechanism** | **Auto-create a dedicated working branch** cut from the desired branch's tip; never run with a working branch that is checked out in a worktree. |
| **C. Origin bootstrap** | **Setup pushes the resolved working branch to origin** before Phase 1, so `land-advance`'s CAS always has a baseline. |
| **D. Where the fix lives** | Detection + branch creation + origin ensure → a new `provision-worktrees.sh` subcommand called from the Lead's `## Setup`; the auto-recover → Lead `## Checkpoint` outcome-handling in `SKILL.md`. |
| **E. Stale-worktree desync** | **Moot — resolved by B**: if the working branch is never checked out in the Lead worktree, the post-land desync cannot occur. |
| **F. Land fallback (`--afk`)** | **Add** a narrow auto-recover: a `held:land-failed` that is provably a checkout-collision on a clean fast-forward-superset integration auto-performs the manual `--no-ff` land (gate-green, push) under `--afk`; interactively it is offered. |

## 4. Mechanics (per component/role)

### Lead — Setup (`skills/war/SKILL.md`, `## Setup`)
1. Resolve the *desired* working branch (default = current branch; else `--working` / `overrides.workingBranch`).
2. Call a new `provision-worktrees.sh resolve-working-branch <desired> <slug> <date>` which:
   - checks whether `<desired>` is checked out in **any** worktree (`git worktree list --porcelain`);
   - **no collision** → echoes `<desired>` unchanged;
   - **collision** → creates a **dedicated** branch `dev/<date>-<slug>` (matching the repo's existing `dev/<date>-<slug>` convention) at `<desired>`'s tip and echoes *that*; reuse-if-ours on resume (ADR 0003 ownership seam), suffix on a foreign pre-existing name.
3. **Origin bootstrap (C):** ensure the resolved working branch exists on origin (`git push -u origin <resolved>`), so the first land's CAS has a baseline.
4. Record the resolved working branch in the ledger and **announce it** (`using working branch <resolved> (auto-created: <desired> was checked out in <worktree>)`).

### Refiner — land (common path, unchanged behaviorally)
With B + C in force, `land-advance` always sees a working branch that is **not checked out anywhere** and **present on origin**, so the push-first CAS succeeds on Phase 1 exactly as on later phases. No change to the land algorithm itself.

### Lead — outcome-handling (F, `skills/war/SKILL.md`, `## Checkpoint`)
On a `held:land-failed`, classify the cause:
- **Checkout-collision + clean superset** — the working branch is checked out in the Lead worktree **and** `git merge-base --is-ancestor <working> <integration>` holds (integration is a conflict-free fast-forward superset): under `--afk`, the Lead **auto-performs the manual land** (merge `integration/*` → working `--no-ff` in the Lead worktree, run the resolved gate, push); interactively, offer it. This is the exact procedure used to recover the doc-rot run.
- **Any other cause** (real conflict, gate failure, ambiguous divergence) — unchanged: it stays a hold and escalates.
The recover **must gate-green before pushing** and is scoped to the clean-superset case only — it never force-lands a divergent or gate-failing branch.

## 5. Surface changes (files)

- `skills/war/SKILL.md` — `## Setup` (working-branch resolution + origin bootstrap) and `## Checkpoint` (the narrow `held:land-failed` auto-recover).
- `skills/war/assets/provision-worktrees.sh` — new `resolve-working-branch` subcommand (+ origin ensure); **`provision-worktrees.test.sh`** — coverage for collision / no-collision / origin-ensure / resume-reuse.
- `CONTEXT.md` — new terms (§6).
- `docs/adr/` — new ADR (§7).
- **Deferred / optional:** `skills/war/assets/workflow-template.js` + `agents/war-refiner.md` — a `land-advance` create-if-absent-on-origin tolerance (belt for C); only if we decide Setup-push isn't sufficient. If taken, both surfaces move together (prompt-surface split).

## 6. New domain terms (CONTEXT.md)

- **launch-worktree collision** — the desired working branch is checked out in the worktree `/war` is launched from (or any sibling worktree), so the refinery cannot advance it.
- **dedicated working branch** — a Setup-resolved working branch (`dev/<date>-<slug>`) auto-created when the desired branch is under a launch-worktree collision, guaranteeing the working ref is checked out nowhere.

## 7. Recommended ADRs

- **New ADR (next free number):** *"WAR resolves a dedicated working branch when the desired one is checked out in the launching worktree, and bootstraps it on origin at Setup."* Extends ADR 0003 (plan-namespaced branches) and ADR 0004 & 0012 (push-first CAS land). Records the prevention-first + narrow-recover posture and why tolerating the collision in `land-advance` was rejected (a ref checked out elsewhere is un-advanceable by design, not a bug to work around).

## 8. Open risks / implementation notes

- **Guard scope:** guard against the branch being checked out in **any** worktree, not just the Lead's — the refinery merge is blocked by a checkout anywhere. `git worktree list --porcelain` is the detection surface.
- **Resume/rerun naming:** `dev/<date>-<slug>` may already exist on a resume — reuse-if-ours (ledger-owned, ADR 0003), suffix/fail-loud on a foreign pre-existing branch.
- **Early origin push:** the Setup origin-bootstrap creates a remote branch **before any phase lands** — acceptable (WAR pushes by design) but it is a slightly earlier outward-facing action than today; note it in the phase-0 report.
- **Recover scoping (F):** the clean-superset predicate must be strict — never auto-land across a real conflict or a red gate; always gate-green before push.

## 9. Non-goals / deferred

- No change to normal working-branch selection when there is **no** collision (default = current branch stands).
- **E** (stale-worktree desync) is folded into B, not separately remediated.
- `land-advance` create-if-absent-on-origin tolerance is **deferred** (C's Setup push covers the baseline); revisit only if a belt is wanted.

## 10. Validation criteria (concrete, testable)

1. **`provision-worktrees.test.sh` — collision:** with `<desired>` checked out in a worktree, `resolve-working-branch <desired> <slug> <date>` echoes a branch `≠ <desired>` (matching `dev/<date>-<slug>`), created at `<desired>`'s tip, checked out **nowhere**.
2. **No-collision:** with `<desired>` checked out nowhere, the subcommand echoes `<desired>` unchanged (byte-identical to today's behavior).
3. **Origin ensure:** after Setup, `git ls-remote origin <resolved>` returns a ref (mock/local remote in the test).
4. **Resume-reuse:** a second call with the same slug/date reuses the run-owned dedicated branch, never re-cuts or errors.
5. **Setup announcement + ledger:** the resolved working branch is announced and recorded.
6. **(Deferred validation — backstop):** a full `--afk` run launched from a worktree sitting on the would-be working branch completes with **auto-landed** phases (no manual Lead land) and no stale-worktree desync. Runner: the first `/war` run exercising this guard on a real repo (needs a live multi-phase run; not unit-testable).
