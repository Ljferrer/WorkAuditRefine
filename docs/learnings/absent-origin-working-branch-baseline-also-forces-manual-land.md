---
name: absent-origin-working-branch-baseline-also-forces-manual-land
description: "held:land-failed can fire from an absent origin working-branch baseline, not only a checked-out working branch"
metadata:
  type: project
  keywords:
    - held:land-failed
    - push-first CAS
    - ensure-origin
    - resolve-working-branch
    - origin baseline
    - manual land
    - ADR 0018
    - checkout guard
  provenance: code-verified
  slug: absent-origin-working-branch-baseline-also-forces-manual-land
  phase: checkout-guard/phase-1
  tags:
    - land
    - provisioning
    - worktrees
    - ADR
  created: 2026-07-06
---

# `held:land-failed` has a second root cause: no `origin/<working>` baseline yet, independent of any checkout collision

**Observed (checkout-guard, phase 1, tasks t1/#563 + t3/#564 + t2/#565):** phase 1 of *this very run* hit
`held:land-failed` and forced a manual Lead land — even though the working branch
(`dev/2026-07-06-war-working-branch-checkout-guard`) was checked out **nowhere**. The refiner's
push-first CAS land (`cmd_land_advance` in `skills/war/assets/provision-worktrees.sh`) has no
`origin/<working>` ref to CAS against when the working branch has never been pushed — there is no
baseline to advance, so the push-first land errors out rather than creating the branch on first push.

This is a **second, distinct** trigger for `held:land-failed`, orthogonal to the launch-worktree
checkout collision recorded in
[[war-launch-worktree-with-working-branch-checked-out-forces-manual-land]]: that lesson's title and
body describe the checked-out case specifically ("check whether the launch worktree's checked-out
branch *is* the run's configured working branch"). Do not assume checkout collision is the only cause —
an absent origin baseline reaches the same `held:land-failed` symptom with a different mechanism, and
needs the same manual-recovery shape but a different root fix.

**This exact phase is what motivated the fix**: Task 2 (#565, `skills/war/SKILL.md` Setup step 2, see
`docs/adr/0018-war-working-branch-checkout-guard.md`) now has Setup call
`provision-worktrees.sh ensure-origin <resolved>` to bootstrap the resolved working branch on origin
**before Phase 1 runs**, so every phase's push-first CAS has a baseline from the start. `ensure-origin`
(confirmed at `skills/war/assets/provision-worktrees.sh` lines 847-856) does
`git push -u origin refs/heads/<resolved>:refs/heads/<resolved>`, which is idempotent (no-op if already
on origin at the same tip) and never a force (a diverged remote is refused).

**Manual recovery used in this phase** (safe because the working branch was a strict ancestor of the
integration branch — a clean fast-forward superset, no divergent commits): in the run-scoped `_refinery`
worktree, checkout the working branch, `git merge --no-ff integration/<run>/phase-1`, re-run the full
resolved gate green (516 JS tests + 18 shell suites for this repo), then `git push -u origin <working>`
(creates the ref; never force). This is the same manual-land shape the Checkpoint auto-recover
procedure (`skills/war/SKILL.md` §"Checkpoint", the `held:land-failed` bullet) now automates for the
checkout-collision case under `--afk` — but note the auto-recover prose gates specifically on
"the working branch is checked out in the Lead worktree", so an absent-origin-only cause (branch
checked out nowhere) does **not** match that auto-recover precondition and still requires a manual or
interactively-confirmed land, even after this phase's fix ships for *future* runs' Phase 1.

**How to apply:** when `held:land-failed` fires, do not stop at "is the working branch checked out
somewhere" — also check whether `origin/<working>` exists at all (`git ls-remote origin <working>`). Two
independent preconditions gate the push-first CAS; both must hold for the automated land to succeed.

Related: [[war-launch-worktree-with-working-branch-checked-out-forces-manual-land]] (the checkout-collision
trigger), [[land-advance-push-first-cas-rejected-token]] (the CAS exit-code contract this baseline feeds
into), [[held-escalation-lead-manual-completion]] (manual-land-then-servitor procedure shape).
