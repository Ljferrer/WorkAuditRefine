# WAR resolves a dedicated working branch when the desired one is checked out, and bootstraps it on origin at Setup

**Status:** accepted

When the working branch `/war` wants to land onto is already checked out in the worktree the run is
launched from (or any sibling worktree), WAR does **not** try to land onto it. At Setup it resolves a
**dedicated working branch** (`dev/<date>-<slug>`) cut at the desired branch's tip, checked out
nowhere, and bootstraps it on origin before Phase 1. A future reader will ask why the land can't just
tolerate the collision; this records why it can't, and why prevention-at-Setup is the fix.

## Context

WAR lands each phase push-first: the working branch is advanced by pushing a `--no-ff` merge from a
**detached** `_refinery` worktree, and the remote's non-fast-forward rejection is the compare-and-swap
([ADR 0004](0004-refinery-merges-in-a-worktree.md)). That land assumes the working ref is advanceable.

But git refuses to advance (or check out) a branch that is **already checked out in another worktree**.
WAR is routinely launched from a session worktree that has the run's own working branch checked out —
the `launch-worktree collision`. In that state every phase's land fails with `held:land-failed`, forcing
a manual Lead land per phase. This was observed in practice (the
`war-launch-worktree-with-working-branch-checked-out-forces-manual-land` learning) and is the footgun
this ADR closes.

The collision is a **topology** fact, not a bug in the land: a ref checked out elsewhere is
un-advanceable by design. The only durable fixes are to (a) stop launching from such a worktree — not
something WAR can enforce — or (b) resolve the working branch to one that is checked out nowhere. This
ADR takes (b), at Setup, before any phase runs.

## Decision

**Prevention-first, at Setup.** After resolving the *desired* working branch (default current branch /
`--working` / `overrides.workingBranch`), Setup calls `provision-worktrees.sh resolve-working-branch
<desired> <slug> <date>`:

- **No collision** — the desired branch is checked out nowhere → echo `<desired>` unchanged
  (byte-identical to today's default; the common case is untouched).
- **Collision** — the desired branch is checked out in any worktree (`git worktree list --porcelain`) →
  create a **dedicated working branch** `dev/<date>-<slug>` at the desired branch's tip, checked out
  nowhere, and echo it. The name is run-owned via the ADR 0003 ledger seam: reuse-if-ours on resume,
  suffix-or-fail-loud on a foreign pre-existing name.

Setup then calls `provision-worktrees.sh ensure-origin <resolved>` to **bootstrap the resolved branch on
origin before Phase 1**, so the push-first CAS land has a remote baseline to compare against from the
first phase. The push is idempotent — a branch already on origin is a no-op, never a force. The resolved
branch is announced and recorded in the ledger.

**Narrow `--afk` auto-recover (belt, not the mechanism).** For a `held:land-failed` that is a
checkout-collision on a clean fast-forward superset — the working branch is checked out in the Lead
worktree **and** `git merge-base --is-ancestor <working> <integration>` holds — under `--afk` WAR
auto-performs the manual land (merge `integration/*` → working `--no-ff` in the Lead worktree, run the
resolved gate, push). The recover **must gate-green before any push** and **must not fire on a real
conflict or a red gate**; every other `held:land-failed` cause remains a hold. This is Lead standing
instruction only — the refiner's `land-advance` algorithm is unchanged, so it never weakens the
push-first-CAS / never-force invariants of ADR 0004.

`resolve-working-branch` and `ensure-origin` live in `provision-worktrees.sh` — the single tested owner
of git-topology mutation — never as raw `git` in SKILL.md prose.

## Considered options

- **Tolerate the collision inside `land-advance` (status quo land, patched).** Rejected. A ref checked
  out in another worktree is un-advanceable by git design; there is no CAS-safe way to advance it in
  place. Working around it in `land-advance` would mean either force-moving the ref (violates the
  never-force invariant of [ADR 0004](0004-refinery-merges-in-a-worktree.md)) or a second checkout (which
  git refuses). The collision must be prevented, not absorbed.
- **Prevention at Setup via a dedicated working branch (chosen).** Resolves the working ref to one
  checked out nowhere before any phase lands, so every phase's push-first land works unchanged. Cheap,
  confined to the tested `provision-worktrees.sh`, and leaves the no-collision path byte-identical.
- **Refuse to launch from a worktree on the working branch.** Rejected as too blunt — WAR is
  *routinely* launched that way in this repo; blocking it would remove the primary workflow instead of
  supporting it.
- **`land-advance` create-if-absent-on-origin belt.** Deferred, not chosen now: the Setup origin
  bootstrap already establishes the CAS baseline, so `land-advance` needs no change. Revisit only if a
  belt is later wanted.

## References

- [ADR 0003](0003-plan-namespaced-branches.md) — plan-namespaced branches; the dedicated working
  branch reuses its ledger ownership seam (reuse-if-ours on resume vs. fail-loud on a foreign name).
- [ADR 0004](0004-refinery-merges-in-a-worktree.md) — refinery worktree + push-first CAS land; this ADR
  keeps that land unchanged by resolving the working ref at Setup rather than patching the land.
- Design spec: `docs/specs/2026-07-06-war-working-branch-checkout-guard-design.md`.
- Implementation plan: `docs/plans/2026-07-06-war-working-branch-checkout-guard.md`.

## Consequences

- `/war` launched from a worktree sitting on the desired working branch lands every phase autonomously
  — no per-phase manual Lead land.
- `provision-worktrees.sh` gains `resolve-working-branch` and `ensure-origin`; Setup calls both.
- The Setup origin bootstrap creates a remote branch **before any phase lands** — a slightly earlier
  outward-facing action than before (WAR pushes by design; noted in the phase-0 report).
- With no collision, working-branch selection is unchanged (the desired branch stands).
