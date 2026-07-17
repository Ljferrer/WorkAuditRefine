---
name: aftermath
description: Evidence-gated cleanup after WAR work lands — delete stray WAR branches, reap orphaned run worktrees, close done bookkeeping issues and survey-swept issues, each only behind a checkable evidence chain with git as the source of truth; --scorched-earth widens to every local branch and worktree behind a non-negotiable protected core. Explicitly-invoked-only (a deleting verb must never fire because a sentence pattern-matched); never auto-triggers.
disable-model-invocation: true
---

# /aftermath — evidence-gated cleanup

You sweep the debris WAR campaigns leave behind — branches, worktrees, bookkeeping issues, survey-swept issues — and you delete or close **only what a checkable evidence chain proves is safe**. Git is the source of truth at every gate: ancestry and reachability are checked against `git ls-remote` truth, never a possibly-lagging local follower ref, and never a ledger claim alone (the ledger is the weakest authority). Anything without a complete chain is **reported, never touched**. Design: [`../../docs/specs/2026-07-02-war-pipeline-skills-design.md`](../../docs/specs/2026-07-02-war-pipeline-skills-design.md) §4.3.

This skill carries `disable-model-invocation: true` deliberately: a deleting verb must never fire because a sentence pattern-matched.

## Invocation

```
/aftermath [--afk] [--scorched-earth]
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
| 1. Stray WAR branches | `integration/<plan-slug>/phase-N`, task branches; working branches with merged PRs | Tip reachable from the working/landing branch (`git merge-base --is-ancestor` against `git ls-remote` truth); `gh pr view` = `MERGED`; the gate is derived against the **exact ref being removed** — a remote delete (`git push origin --delete`) gates on the remote (`ls-remote`) SHA, a local delete (`git branch -d`) on the local SHA, never mixed |
| 2. Orphaned run worktrees | `<worktreeRoot>/<runId>/` dirs incl. `_refinery`, `_polish` — **landed runs only** | Run ledger says landed **and** the landed SHA is reachable on the working/landing branch (`git ls-remote` truth — the ledger alone is the weakest authority); reaped **by path before** any branch delete |
| 3. WAR bookkeeping issues | Phase epics `status:done` still open; task sub-issues of landed phases | Label state + the phase's landed SHA reachable |
| 4. Survey-swept issues | Issues mapped in a survey manifest whose spec's plan's PR **merged** | Chain: issue → spec (manifest) → plan (its source-spec line) → PR (campaign ledger PR#, or `gh pr list --search`) = `MERGED`; close with a comment linking the landing PR |

**Dead runs are needs-human, never safe.** A run held at `held:phase-incomplete` or `held:workflow-error` is a **needs-human row — never in the safe list, never touched under `--afk`**: WAR doctrine preserves a dead phase's git state for resume or inspection. Only `--scorched-earth` may burn a dead run's branches and worktrees, and even then each such row is ⚠-flagged in the report.

### Class-1 acknowledged-stranded bucket

Some remote branches never pass the Class-1 deletion gate because their content **landed under a rewritten SHA** — the original ref is stranded, not un-landed, so it permanently fails tip-reachability and would otherwise reappear as a needs-human row in every future run. `docs/aftermath/known-stranded.tsv` is the committed allowlist that acknowledges these once and for all (ADR 0027).

**The stranding is structural, not an accident.** The /war refiner rebases each task branch locally in the serial merge queue and **never force-pushes**, so the remote ref keeps the worker's pre-rebase SHA forever while the local ref advances to the rebased tip that actually landed. **"Stranded" is therefore a property of the specific SHA probed, not of the branch**: the same branch reads STRANDED via its remote SHA and REACHABLE via its local SHA — which is why the gate is derived per ref (Class-1's evidence gate above), and why a stranded remote ref implies nothing about the local branch of the same name.

**Two populations, two routes — the two remote-delete sentences in this skill are not in tension.** A Class-1 remote ref that **passes** the evidence gate is deleted in-run by `git push origin --delete` under the default scope; that population is what `--scorched-earth`'s "remote deletion stays in the default evidence-gated scope" refers to (scorched-earth widens *local* candidates only). A remote ref that **fails** the gate and lands in this bucket is cleared **only** by the deliberate manual push-delete named in the C3 paragraph below, outside aftermath's gates — never in-run, under any flag.

After deriving the Class-1 candidate set from `git ls-remote` truth, check each candidate against the allowlist:

- **Match by exact `refs/heads/<ref>` name — never substring** (so `…/p1-task1` never shadows `…/p1-task10`). The tsv's `remote_ref` column carries the short ref with no `refs/heads/` prefix; compare against the candidate's short ref.
- A matched candidate routes to the **acknowledged-stranded** bucket: **printed for the record, excluded from needs-human, and never entering any delete list** — under any flag, including `--afk` and `--scorched-earth`.
- A candidate that fails the deletion gate and matches **no** allowlist row still reports **needs-human**, exactly as before.

**The comparator is always the freshly-fetched landing ref.** `git merge-base --is-ancestor <candidate-sha> origin/<working|landing>` takes that ref as its comparator — fetch it first, so the comparison matches `git ls-remote` truth and not a lagging local follower — while the candidate side is the exact ref being removed: the remote SHA for a remote delete, the local SHA for a local delete.

**`git cherry` is the patch-equivalence probe the tip-reachability gate cannot produce.** Run `git cherry <landing-ref> <candidate-sha>` — **landing/upstream ref first, candidate second**; on a gate-failing ref the healthy result is **non-empty with every line `-`-prefixed**, and zero `+` lines among ≥1 `-` lines means every patch on the candidate is already in the landing branch by patch-id: the retroactive confirmation that its content landed under a rewritten SHA. **Empty output is a suspect result, never a PASS** — it means the probe compared nothing, so re-check the argument order and that both refs resolved before reading anything into it.

**A zero-`+` result is evidence for a row, never a deletion license (C3).** It justifies acknowledging the ref in `docs/aftermath/known-stranded.tsv`; it deletes nothing and lowers no bar — the deletion gate stays byte-unchanged, exactly as the C3 paragraph below states.

**The probe substantiates the row's justification, and the operator writes the row.** A zero-`+` result locates or confirms the `landed_pr` the row needs, or substantiates the `note` on a genuinely PR-less stranded ref, in the shape of the tsv's own commented reference rows — e.g. `0-unmerged via git cherry vs <landing>, <date>`. **Adding the row is a reviewed operator commit, never an in-run Lead write**, and the tsv's header and schema are untouched by this probe.

**Any `+` line means patch-equivalence is NOT PROVEN — never that the work is un-merged.** Squash merges, conflict-resolved rebases, and split or joined commits all legitimately change patch-ids, so a `+` line proves nothing in either direction: the candidate stays **needs-human** and gets no row. Fail-closed, as everywhere else in this skill.

**Probe hygiene: fetch the landing ref first, and leave no new refs behind.** Fetch `origin/<working|landing>` before probing so the comparison matches `git ls-remote` truth; if the candidate SHA's objects are not local, fetch them with **`git fetch --refmap= origin <ref>`**. The empty `--refmap=` is load-bearing, not decoration: a bare `git fetch origin <ref>` in a normal clone matches the command-line refspec against `remote.origin.fetch`, whose `+refs/heads/*:refs/remotes/origin/*` wildcard matches every branch, so it **does create `refs/remotes/origin/<ref>`** — only `--refmap=` suppresses that and leaves `FETCH_HEAD` alone with **zero refs created** (fetching a raw SHA instead of a ref name is server-config-dependent). A sweep's probes are objects-only: they must add no refs at all, not merely no refs under a scratch namespace.

A gate-failing **remote** ref says nothing about the local branch of the same name — the local ref usually passes the gate on its own local SHA, and deleting it has its own procedure and its own confounder: see **Class-1 local branches — the stranded-upstream `-d` refusal** below.

**The allowlist is an acknowledgement, never a deletion license (C3).** The deletion gate (tip-reachable + PR-merged) is byte-unchanged; a row never lowers the bar. Clearing a stranded ref stays a deliberate manual `git push origin --delete <ref>` outside aftermath's gates. Adding an allowlist row requires `landed_pr` populated **or** a `note` documenting a genuinely PR-less stranded ref (e.g. a `claude/*` session remote with no per-branch merged PR) — never a blank justification. The tsv's own header carries the schema and this invariant.

### Class-1 local branches — the stranded-upstream `-d` refusal

**`git branch -d` is the default-mode delete verb for a local branch — and with an upstream set it checks merged-into-*upstream*, not merged-into-HEAD.** Every WAR task branch tracks its own stranded pre-rebase remote tip (the mechanism above), so the safe verb refuses on branches whose content is provably in master. The upstream is the confounder; the refusal is not evidence about the work.

**The recovery, in order — the gate first, always.** (1) The Class-1 evidence gate passes **on the local SHA** (the per-ref rule: a local delete gates on the ref being removed). For a task or integration branch with no per-branch PR, the PR-merged half is evidenced by the **plan's landing PR** — the campaign ledger's PR#, or `gh pr list --search "<plan filename>"` per the Class-4 join rule's fallback below; tip-reachability on the exact ref stays the load-bearing half and is never substituted by it. (2) `git branch --unset-upstream <branch>` removes the confounder — a config mutation that is harmless and restorable, with the restore below as the mandated form of that restorability. (3) `git branch -d <branch>` deletes it, run **from a checkout whose HEAD carries the landing content** (fetch first; the main checkout on an up-to-date default branch is the normal home). With a stale HEAD the failure mode is refusal noise — fail-closed, never a wrong delete.

**`-d` after the unset is git's own second opinion, and that is precisely the point.** Post-unset it independently re-verifies merged-into-HEAD, which is the check `-D` would discard — so **`-D` is never the default-mode answer here**; that escalation belongs to `--scorched-earth` alone.

**Refusal taxonomy after the unset — classify on the string git actually prints:**

- `error: the branch '<b>' is not fully merged` — the genuine un-merged signal ⇒ **needs-human**.
- `error: cannot delete branch '<b>' used by worktree at '<path>'` — a **worktree-ordering** signal, not an un-merged one. Teardown ordering normally reaps worktrees by path before their branches are deleted, so a worktree surviving to this point *is* the gap (typically a needs-human worktree that was never reaped). Report the branch and the worktree as **one needs-human row**. The same string also fires when the candidate is the sweep checkout's own HEAD branch — under the checkout precondition above that can never be a task branch, so the worktree-ordering reading holds.

Neither refusal is ever answered with `-D` in default mode.

**Restore tracking on every needs-human route after an unset:** `git branch -u origin/<ref> <branch>`. A sweep must not leave mutated config behind on a row it reports and never touches.

**The one-sweep asymmetry, stated once:** the local branch deletes via the safe `-d` while the remote ref it tracked stays acknowledged-stranded/needs-human on the remote side — allowlisted per ADR 0027 and cleared only by the deliberate manual push-delete. One sweep reaches two verdicts on one branch name; that is the per-ref rule working, not an inconsistency.

### Class-4 join rule

The campaign ledger records plan paths as **absolute** paths resolved against the campaign Lead's cwd — routinely a session worktree that may no longer exist — while the survey manifest records repo-relative paths. So the manifest→ledger join matches by plan **basename/slug, never full path**. When no ledger entry matches, `gh pr list --search "<plan filename>"` is the sanctioned fallback for locating the landing PR.

**Issue-close comments are outward-facing.** Closing a swept issue posts a comment linking the landing PR; under `--afk` these comments post unattended. That is accepted (every close is evidence-gated), but know that closes are visible to issue watchers with no human having reviewed the wording.

## Interaction model

1. **Always produce the categorized dry-run report first**: safe-to-delete rows, each with its evidence chain spelled out, vs. needs-human rows with the reason they failed the gate.
2. **Interactive:** one confirm, then execute the safe list only. No row-by-row negotiation, no second pass in the same invocation.
3. **`--afk`:** skip the confirm; execute **only the provably-safe class**; report the rest for the next human to read.

**Run `gh-preflight.sh` before the issue-close batch.** Closing Class-3 bookkeeping issues and Class-4 survey-swept issues are gh writes; before that batch fires, the Lead runs `skills/_shared/gh-preflight.sh "<overrides.ghUser>"` so a mid-run active-account flip never silently drops an aftermath close onto the wrong account (empty/unset `ghUser` ⇒ no-op, exit 0). Prose-enforced Lead discipline; no confined-agent gains any gh verb (C2, ADR 0002).

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
