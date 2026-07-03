---
name: war-aftermath
description: Evidence-gated cleanup after WAR work lands — delete stray WAR branches, reap orphaned run worktrees, close done bookkeeping issues and survey-swept issues, each only behind a checkable evidence chain with git as the source of truth; --scorched-earth widens to every local branch and worktree behind a non-negotiable protected core. Explicitly-invoked-only (a deleting verb must never fire because a sentence pattern-matched); never auto-triggers.
disable-model-invocation: true
---

# /war-aftermath — evidence-gated cleanup

You sweep the debris WAR campaigns leave behind — branches, worktrees, bookkeeping issues, survey-swept issues — and you delete or close **only what a checkable evidence chain proves is safe**. Git is the source of truth at every gate: ancestry and reachability are checked against `git ls-remote` truth, never a possibly-lagging local follower ref, and never a ledger claim alone (the ledger is the weakest authority). Anything without a complete chain is **reported, never touched**. Design: [`../../docs/specs/2026-07-02-war-pipeline-skills-design.md`](../../docs/specs/2026-07-02-war-pipeline-skills-design.md) §4.3.

This skill carries `disable-model-invocation: true` deliberately: a deleting verb must never fire because a sentence pattern-matched.

## Invocation

```
/war-aftermath [--afk] [--scorched-earth]
```

- **(no flags)** — categorized dry-run report, then **one confirm**, then execute the safe list only.
- **`--afk`** — skip the confirm; execute **only the provably-safe class**, report everything else.
- **`--scorched-earth`** — widen candidates to every local branch + worktree and lower the bar to force-delete (see below). Interactively still report → one confirm.
- **`--afk --scorched-earth`** — **dangerously destructive**; see the final section before ever running it.

## Pre-flight — the active check comes first

Before classifying anything, enumerate the live ledgers and compute what is *active*; everything an active ledger references is out of scope for this run.

**The active-campaign predicate is defined, not a vibe.** The campaign ledger (`.claude/campaigns/<id>/ledger.json`) has no campaign-level terminal marker, so: **a campaign ledger is active iff any plan entry is non-terminal (`status: "queued"`, or a recorded `stopPoint` with `status ≠ "landed"`), reconciled toward git before being trusted** — a `"queued"` entry whose branch/PR git shows landed is not evidence of life. Run ledgers (`.claude/teams/<run-id>/ledger.json`) are active iff their run is unfinished by the same git-reconciled reading.

**Out of scope by default:** anything referenced by an active run/campaign ledger (checked first, as above), unmerged branches (reported, never deleted), and issues with no evidence chain.

## Default scope — four classes, each with a checkable evidence chain

| Class | Candidates | Evidence gate |
|---|---|---|
| 1. Stray WAR branches | `integration/<plan-slug>/phase-N`, task branches; working branches with merged PRs | Tip reachable from the working/landing branch (`git merge-base --is-ancestor` against `git ls-remote` truth); `gh pr view` = `MERGED` |
| 2. Orphaned run worktrees | `<worktreeRoot>/<runId>/` dirs incl. `_refinery`, `_polish` — **landed runs only** | Run ledger says landed **and** the landed SHA is reachable on the working/landing branch (`git ls-remote` truth — the ledger alone is the weakest authority); reaped **by path before** any branch delete |
| 3. WAR bookkeeping issues | Phase epics `status:done` still open; task sub-issues of landed phases | Label state + the phase's landed SHA reachable |
| 4. Survey-swept issues | Issues mapped in a survey manifest whose spec's plan's PR **merged** | Chain: issue → spec (manifest) → plan (its source-spec line) → PR (campaign ledger PR#, or `gh pr list --search`) = `MERGED`; close with a comment linking the landing PR |

**Dead runs are needs-human, never safe.** A run held at `held:phase-incomplete` or `held:workflow-error` is a **needs-human row — never in the safe list, never touched under `--afk`**: WAR doctrine preserves a dead phase's git state for resume or inspection. Only `--scorched-earth` may burn a dead run's branches and worktrees, and even then each such row is ⚠-flagged in the report.

### Class-4 join rule

The campaign ledger records plan paths as **absolute** paths resolved against the campaign Lead's cwd — routinely a session worktree that may no longer exist — while the survey manifest records repo-relative paths. So the manifest→ledger join matches by plan **basename/slug, never full path**. When no ledger entry matches, `gh pr list --search "<plan filename>"` is the sanctioned fallback for locating the landing PR.

**Issue-close comments are outward-facing.** Closing a swept issue posts a comment linking the landing PR; under `--afk` these comments post unattended. That is accepted (every close is evidence-gated), but know that closes are visible to issue watchers with no human having reviewed the wording.

## Interaction model

1. **Always produce the categorized dry-run report first**: safe-to-delete rows, each with its evidence chain spelled out, vs. needs-human rows with the reason they failed the gate.
2. **Interactive:** one confirm, then execute the safe list only. No row-by-row negotiation, no second pass in the same invocation.
3. **`--afk`:** skip the confirm; execute **only the provably-safe class**; report the rest for the next human to read.

## `--scorched-earth` — widened candidates, lowered bar

- **Candidates widen to *every* local branch and worktree** — `claude/*` session branches, `feat/*`, stale `dev/*`, and their `.claude/worktrees/` directories — not just WAR namespaces.
- **The bar lowers to force-delete**: `git branch -D`, `git worktree remove --force`, even when the upstream is gone or commits are unmerged. Unmerged-commit rows are **⚠-flagged in the report, not skipped**.
- Interactively, scorched-earth still goes through report → one confirm.
- Remote branches are untouched: scorched-earth widens *local* candidates only; remote deletion stays in the default evidence-gated scope.

## Protected core — survives even `--scorched-earth --afk`

This list is correctness, not preference. Never deleted, under any flag combination:

- the **current branch and current worktree**;
- the **default branch**;
- any worktree belonging to a **running session** (heuristic below);
- anything referenced by an **active run/campaign ledger** (the pre-flight predicate);
- **survey manifests under `.claude/aot/` are never deleted** — the main-checkout anchor makes this structural (pipeline state never lives inside a removable session worktree's `.claude/`).

### Running-session heuristic

There is no clean disk signal for "a session is running here." Layer signals in descending trust:

1. **The process's own worktree** — the floor; you are always a running session.
2. **The per-worktree transcript project dir** (`~/.claude/projects/<munged-worktree-path>`) with **mtime within the last 24 h** — the primary liveness signal. Directory *existence* is no signal: transcript dirs outlive their worktrees.
3. **Uncommitted changes are not a liveness signal** (live session worktrees are routinely clean). They are an unmerged-**work** flag — data-loss protection, ⚠-flagged in the report regardless of liveness.

## Teardown ordering

Worktrees are reaped **by path before** their branches are deleted (`git worktree remove <path>`, then the branch delete). Deleting the branch first strands the worktree's checkout and turns a clean reap into a force-remove.

## ⚠ `--afk --scorched-earth` is dangerously destructive

```
╔══════════════════════════════════════════════════════════════════╗
║  ⚠  SCORCHED-EARTH + AFK: force-deleting local branches and       ║
║     worktrees — INCLUDING UNMERGED WORK — with no human review.   ║
║     Only the protected core survives. There is no undo.           ║
╚══════════════════════════════════════════════════════════════════╝
```

The combination executes force-deletes of unmerged work with no confirm and no human reading the report first. It is **dangerously destructive** and documented as such here and in the README. The skill prints the loud warning banner above before proceeding under this combination. If you are not certain every unmerged branch on this machine is disposable, run scorched-earth interactively instead.
