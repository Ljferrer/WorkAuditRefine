---
name: war-campaign
description: Run a queue of WAR plans unattended — the hopper. Seeds a campaign ledger from an explicit plan list or a roadmap file, then loops sweep+select, stack-and-plow provisioning, /red-team hardening, /war execution, and atomic record-keeping until the queue drains or a plan halt-and-holds. Explicitly-invoked-only; never auto-triggers.
disable-model-invocation: true
---

# /war-campaign — the hopper

You run a **campaign**: a queue of WAR plans executed one at a time, unattended, each landing as a stacked branch/PR on top of the last. State lives in the **campaign ledger** (uncommitted, single-writer, atomic) plus an **inbox** (uncommitted, multi-writer, maildir-style) — never in git. The core CRUD + contention check is [`assets/campaign-ledger.mjs`](assets/campaign-ledger.mjs) (Node stdlib only, tested by [`assets/campaign-ledger.test.mjs`](assets/campaign-ledger.test.mjs)) — shell out to it, don't reinvent the ledger shape. Full design: [`../../docs/specs/2026-07-01-war-companion-skills-design.md`](../../docs/specs/2026-07-01-war-companion-skills-design.md) §7. Branch model: [ADR 0011](../../docs/adr/0011-campaign-stack-and-plow-branch-model.md).

## Invocation

```
/war-campaign <plan…|roadmap-path> [--wait-for-merge]   # start — seed the ledger from plans or a roadmap
/war-campaign                                           # resume the latest unfinished campaign
/war-campaign add <plan-path> [<ref>]                  # from any chat — drop a plan into inbox/ only (ref defaults origin/master, consulted only when the local path is missing)
```

- **Start** seeds the ledger via `campaign-ledger.mjs init` from an explicit plan-file list or a roadmap file. Default mode is `stack` (each plan's branch is cut from the previous plan's tip); `--wait-for-merge` waits for the prior PR to merge and rebases off fresh `origin/master` instead.
- **Bare resume** re-reads the latest unfinished campaign's ledger + inbox and continues where it stopped.
- **`add`** only ever appends one file to `inbox/` — it never touches the ledger. Any chat (or a human, or a cron) can drop a plan mid-run; it is picked up at the next plan boundary. The optional `[<ref>]` (default `origin/master`) is consulted **only when the local path is missing** — it lets a plan authored on another branch and PR'd onto master be added to a running campaign.

**Add-resolution protocol** — `add` may run from any chat, in any directory, so resolve carefully:

0. **Anchor to the repo toplevel, never the add-chat cwd.** Resolve the argument to a single repo-relative token `rel` = the argument made relative to `git rev-parse --show-toplevel`, and use `rel` for every git call below. The drop's line-1 absolute is `toplevel/rel`. This closes the foreign-cwd hole: a `path.resolve` against a stray cwd could store a path that never maps onto the ref, whereas `rel` is the one `<repo-relative-path>` token reused verbatim by the materialize step (`git show <ref>:<rel>`).
1. **Local path exists** → drop as today (`campaign-ledger.mjs add`, no `--ref`; line-1 absolute `toplevel/rel`, byte-identical legacy single-line shape). Local always wins; the fallback never fires over a present file.
2. **Local path missing** → `git fetch origin <branch>` then probe `git cat-file -e <ref>:<rel>`. Present → `campaign-ledger.mjs add --ref <ref>` (the two-line drop records the ref as provenance). Absent → **fail loudly at add time**, naming both locations tried (`<toplevel/rel>` on disk and `<ref>:<rel>`) — not at 3am in the Lead's sweep.

The user-facing invocation is *positional* (`add <plan> [<ref>]`); the Lead translates the positional `[<ref>]` into the helper's `--ref <ref>` flag when it shells out to `campaign-ledger.mjs add`. Same ref, two layers.

Passes `--afk --ace` to `/war` by default for every plan in the queue.

## Lifecycle (per plan, in queue order) — spec §7.1

1. **Materialize, then sweep + select.** Ordering is forced: `sweep` reads each drop's plan file (`extractFilesFromPlanFile`), so materialization runs **first** — the lifecycle within this step is `[Materialize → sweep() → next]`.
   - **Materialize (before `sweep`).** Read the inbox drops. For each whose line-1 path is missing locally **and** whose drop carries a `ref:` line (line 2), `git fetch` the ref's branch, then `git show <ref>:<repo-relative-path> > <path>` into the Lead checkout (untracked at this point). Then scan each materialized file for referenced repo paths — backticked path-shaped tokens and markdown link targets that resolve inside the repo (same `isPathShaped` precision as the footprint parser; `[[wikilinks]]` excluded) — and materialize any that are missing locally and present on the ref, **transitively** (each newly materialized file gets the same scan; terminates because a file materializes at most once). Report every materialized path loudly in this step's report. Never merge or rebase master into the stack — identical-content files merge clean when the stack lands.
   - **Sweep + select.** `campaign-ledger.mjs sweep` — contention-checks every dropped `inbox/` plan against the existing queue and against each other, inserts in dependency-safe (deterministic) order, deletes the consumed inbox files. Then `next` to pick the plan to run. The **fail-loud backstop** stays: a drop whose line-1 path is still missing at `sweep` time throws ENOENT (a skipped materialization can never pass silently) — the executable owner of End-state #3, without moving git I/O into the stdlib helper.
2. **Provision the branch — stack-and-plow ([ADR 0011](../../docs/adr/0011-campaign-stack-and-plow-branch-model.md)).** Plan 1: `dev/<slug-1>` cut from fresh `origin/master`. Plan N: `dev/<slug-N>` cut from `dev/<slug-(N-1)>`'s tip. `--wait-for-merge` mode: wait for PR N-1 to merge, then cut from fresh `origin/master` instead. Immediately after `dev/<slug>` is created and **before** `/war` runs, `git add` + commit the files materialized in step 1 (the plan file and its pulled references) onto `dev/<slug>`. This is the load-bearing handoff: `/war`'s worker worktrees branch off `dev/<slug>` and only see the plan if it is committed there, never as an untracked file in the Lead checkout. Never merge or rebase master into the stack — identical-content files merge clean when the stack lands, so ADR 0011 is untouched.
3. **Harden.** Run `/red-team <plan>`, self-adjudicating under AFK. Unresolvable → halt-and-hold (below).
4. **Execute.** Run `/war <plan> --working dev/<slug-N> --landing dev/<slug-(N-1)> --afk --ace` (plan 1 lands to `master`).
5. **Record.** `campaign-ledger.mjs record --campaign <dir> --plan <path> --status landed --branch <b> --pr <n> --sha <sha> --stopPoint <token> --backstops <json>` — atomic temp+rename, so a laptop-close mid-write never corrupts the queue. Omitted flags leave the entry's existing values untouched (`--stopPoint` is set on halt-and-hold, not on a clean land). `--backstops` carries that plan's `/war` handoff `backstops[]` (the validations its run deferred, schemas.md) as a JSON array string, stamped onto the plan's ledger entry for the wrap-up aggregate; omit it for a plan that deferred nothing.
6. **Context hygiene.** Rewrite the **write-ahead checkpoint** (`CAMPAIGN-STATE.md`, see State & resume) at the plan boundary — mandatory, not best-effort. Compaction itself stays with the harness (user-invoked or auto; the model cannot trigger it), and whenever it fires the `SessionStart(compact|clear|resume)` hook re-injects the checkpoint into the fresh window. Lead thrift is the only real lever on window growth in between: offload verbose verification to subagents and keep notification handling terse.
7. **Loop** to the next queued plan.

## State & resume — spec §7.2

- **Campaign ledger** (`.claude/campaigns/<id>/ledger.json`) — the plan queue + per-plan status/branch/PR/SHA/stop-point. Single-writer (only the campaign Lead's `sweep`/`record` touch it); every write atomic.
- **Inbox** (`.claude/campaigns/<id>/inbox/`) — the multi-writer add path, one file per plan, maildir-style (atomic by construction, no locks). Only `sweep` drains it.
- **Roadmap** — authoring input + on-demand snapshot (Rev 1), never the live feed. `init` ingests one. *"I'm switching machines"* → render the ledger out as a committable roadmap, then `init` from it on the new machine. Render/ingest beyond `init` is agent prose using the helper's read surface, not helper code.
- **Resume** re-reads ledger + inbox + `CAMPAIGN-STATE.md` — the real guarantee. Before trusting the ledger, **reconcile it toward git** (`git ls-remote`, `gh pr view`) — the ADR 0008 discipline. A machine switch is just: render ledger → committable roadmap → `init` on the new machine.

### Checkpoint — CAMPAIGN-STATE.md

Path `.claude/campaigns/<id>/CAMPAIGN-STATE.md` — sibling of `ledger.json`, uncommitted, single-writer (the Lead), plain markdown. It is the Lead's curated resume brief: the human-readable NOW of the campaign, distinct from the machine-readable ledger.

**Write-ahead protocol** — rewrite the file *before* each of:

- launching `/red-team` on a plan,
- launching each `/war` phase,
- entering a `--wait-for-merge` wait,

and at **every plan boundary**. The point of write-ahead is that the brief is already fresh *before* you dispatch the thing you'll wait on — so its freshness never depends on when compaction fires, which nobody controls.

**Invariant** — the file must always let a fresh context resume from NOW: current queue status, in-flight run/task ids, the continuation sequence (what to do next), and any gotchas a resumer would otherwise rediscover the hard way.

**Brief, not authority** — resume still reconciles toward git (`git ls-remote`, `gh pr view`) before trusting anything; the checkpoint is a brief toward git truth, never the source of truth, and it is not the ledger. This is the ADR 0008 discipline.

**Honest boundary** — the write-ahead half is a prompt directive: nothing forces the Lead to rewrite the file on time. The code-enforced half is [`hooks/inject-campaign-state.sh`](../../hooks/inject-campaign-state.sh) — a campaign-gated `SessionStart(compact|clear|resume)` hook that deterministically re-injects this file after compaction. See [ADR 0016](../../docs/adr/0016-campaign-compaction-survival.md).

## Failure — spec §7.3

**Halt-and-hold** when a plan can't `CLEAR` `/red-team` (truly unresolvable under AFK) or `/war` hard-halts (`audit-blocked`, `conflict`, dead phase, `land_stale`, `held:submodule-pr`): checkpoint → record the stop point → `PushNotification` → stop. Nothing above the failed plan starts; everything below it has already landed as stacked PRs.

The final report **always** states the bottom-up merge order — the stacked PRs must be merged in the order they were stacked, lowest first.

## Campaign wrap-up — Unexecuted backstops

At the end of a campaign (queue drained or halt-and-hold), the final report renders the **aggregate of every validation the whole campaign deferred** — the union of each landed plan's handoff `backstops[]`. The Lead's wrap-up render calls the module's `aggregateBackstops(campaignDir)` export (it is a module export, not a CLI subcommand): it flattens each plan's recorded `backstops`, tags every entry with its origin plan slug, and tolerates plans that predate the field (a `null`/absent `backstops` contributes nothing — an in-flight or pre-ratified-backstop plan is not an error). Render each entry as *plan · check · why deferred · runner*; entries carrying `aiDeclared: true` render their **AI-declared** marker (ADR 0014 provenance — an AI-declared waiver is never surfaced as operator-ratified). An empty aggregate renders literal `None`.

<!-- bundled-routine note: step 6 above is our own write-ahead checkpoint rewrite, not an external ecc:strategic-compact invocation and not a compaction trigger — the model cannot invoke /compact; compaction stays with the harness and the SessionStart hook re-injects the checkpoint afterward. -->
