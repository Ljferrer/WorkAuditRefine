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
/war-campaign add <plan-path>                           # from any chat — drop a plan into inbox/ only
```

- **Start** seeds the ledger via `campaign-ledger.mjs init` from an explicit plan-file list or a roadmap file. Default mode is `stack` (each plan's branch is cut from the previous plan's tip); `--wait-for-merge` waits for the prior PR to merge and rebases off fresh `origin/master` instead.
- **Bare resume** re-reads the latest unfinished campaign's ledger + inbox and continues where it stopped.
- **`add`** only ever appends one file to `inbox/` — it never touches the ledger. Any chat (or a human, or a cron) can drop a plan mid-run; it is picked up at the next plan boundary.

Passes `--afk --ace` to `/war` by default for every plan in the queue.

## Lifecycle (per plan, in queue order) — spec §7.1

1. **Sweep + select.** `campaign-ledger.mjs sweep` — contention-checks every dropped `inbox/` plan against the existing queue and against each other, inserts in dependency-safe (deterministic) order, deletes the consumed inbox files. Then `next` to pick the plan to run.
2. **Provision the branch — stack-and-plow ([ADR 0011](../../docs/adr/0011-campaign-stack-and-plow-branch-model.md)).** Plan 1: `dev/<slug-1>` cut from fresh `origin/master`. Plan N: `dev/<slug-N>` cut from `dev/<slug-(N-1)>`'s tip. `--wait-for-merge` mode: wait for PR N-1 to merge, then cut from fresh `origin/master` instead.
3. **Harden.** Run `/red-team <plan>`, self-adjudicating under AFK. Unresolvable → halt-and-hold (below).
4. **Execute.** Run `/war <plan> --working dev/<slug-N> --landing dev/<slug-(N-1)> --afk --ace` (plan 1 lands to `master`).
5. **Record.** `campaign-ledger.mjs record --status landed --branch <b> --pr <n> --sha <sha>` — atomic temp+rename, so a laptop-close mid-write never corrupts the queue.
6. **Context hygiene.** Bundled checkpoint-and-compact at the plan boundary: the ledger is already durable, so this is a built-in `/compact` — best-effort, not the guarantee.
7. **Loop** to the next queued plan.

## State & resume — spec §7.2

- **Campaign ledger** (`.claude/campaigns/<id>/ledger.json`) — the plan queue + per-plan status/branch/PR/SHA/stop-point. Single-writer (only the campaign Lead's `sweep`/`record` touch it); every write atomic.
- **Inbox** (`.claude/campaigns/<id>/inbox/`) — the multi-writer add path, one file per plan, maildir-style (atomic by construction, no locks). Only `sweep` drains it.
- **Roadmap** — authoring input + on-demand snapshot (Rev 1), never the live feed. `init` ingests one. *"I'm switching machines"* → render the ledger out as a committable roadmap, then `init` from it on the new machine. Render/ingest beyond `init` is agent prose using the helper's read surface, not helper code.
- **Resume** re-reads ledger + inbox — the real guarantee. Before trusting the ledger, **reconcile it toward git** (`git ls-remote`, `gh pr view`) — the ADR 0008 discipline. A machine switch is just: render ledger → committable roadmap → `init` on the new machine.

## Failure — spec §7.3

**Halt-and-hold** when a plan can't `CLEAR` `/red-team` (truly unresolvable under AFK) or `/war` hard-halts (`audit-blocked`, `conflict`, dead phase, `land_stale`, `held:submodule-pr`): checkpoint → record the stop point → `PushNotification` → stop. Nothing above the failed plan starts; everything below it has already landed as stacked PRs.

The final report **always** states the bottom-up merge order — the stacked PRs must be merged in the order they were stacked, lowest first.

<!-- bundled-routine note: checkpoint-and-compact above is our own bundled built-in /compact step — not an external ecc:strategic-compact invocation. -->
