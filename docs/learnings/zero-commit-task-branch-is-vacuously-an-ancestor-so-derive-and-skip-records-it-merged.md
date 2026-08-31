---
name: zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged
description: "A recovery relaunch's derive-and-skip marks a NEVER-STARTED task (zero-commit branch at the phase base) as preMerged — the handoff reports it landed, the ledger records merged, and the phase lands without its deliverable"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged
  phase: "2026-08-27-in-run-finding-resolution/phases 1-3 (landed dev/2026-08-27-in-run-finding-resolution, tip ec0b920); addendum 2026-08-30-engine-concurrency-and-pin-transfer/phase-2 task 2.2 (landed dev/2026-08-30-engine-concurrency-and-pin-transfer, tip ad440fc0); engine bug #1895"
  keywords: 
    - derive-and-skip
    - preMerged
    - recovery relaunch
    - zero-commit branch
    - merge-base --is-ancestor
    - vacuous ancestor
    - phantom merged task
    - reconcile toward git
    - silent no-op release
    - recovered pre-merged
    - missing ADR
    - task 2.2
    - End-state unverified not unmet
    - rev-list --count guard absent
    - sanctioned recovery relaunch
  originSessionId: fddd64d3-2c2c-400e-b891-9b7b75dcd158
  modified: 2026-08-30T14:48:17.863Z
---

`git merge-base --is-ancestor <task-branch> "$TIP"` is **vacuously true for a branch sitting at
the phase base with no commits**. A task that dep-failed (or never dispatched) in an earlier
attempt leaves exactly that branch, so a sanctioned recovery relaunch's derive-and-skip clause
reports it `preMerged`, the workflow's `landed[]` includes it, the ledger records `merged`, and
the Lead closes its issue — **while its deliverable does not exist anywhere in the window**.

Observed three times in ONE run (2026-08-27-in-run-finding-resolution, plugin 0.20.1):
phase-1 tasks 1.2/1.3 in relaunch `-r2`, and phase-2 task 2.1 (the release bump) in `-r3`.
The 2.1 case landed a phase claiming a release while
`git diff --stat <base> <tip> -- .claude-plugin/plugin.json .claude-plugin/marketplace.json README.md CHANGELOG.md`
was **empty** — the CLAUDE.md-named silent-no-op release, in its degenerate zero-slot form.

**It also defeats a gate-audit.** Phase 1's gate-audit passed because every needle it checked
belonged to task 1.1, which really had landed; 1.2/1.3's End states had no owning artifact to
contradict. Detection in all three cases came only from the Lead's Checkpoint
**reconcile-toward-git** (ADR 0008) — the ledger claimed work git could not corroborate.

**Fix shape (filed, #1895):** derive-and-skip must additionally require
`git rev-list --count <base>..<branch>` > 0 before deriving `preMerged`; a zero-commit branch
takes the fresh-run path. Pair it with a phase-level assertion that every task the handoff
reports `landed` contributed at least one commit to the integration range.

**Operator-side rule until that lands:** before trusting any relaunch's `preMerged` set, diff the
window for each skipped task's `Files:` — and delete stale zero-commit branches before relaunching,
which removes the vacuous input entirely.

## Recurrence — third distinct manifestation, the #1895 fix confirmed STILL absent from code,
## `2026-08-30-engine-concurrency-and-pin-transfer`/phase-2 task 2.2 (landed
## `dev/2026-08-30-engine-concurrency-and-pin-transfer` @ `ad440fc0b65dfbfdf797b8f8b83f44b0d4531b50`,
## 2026-08-30)

**Code-verified** — landed-tip grounding reached rung 2 (worktree lookup): the `_refinery38`
worktree's `gitdir` physical path is
`<repo-root>/.claude/war-worktrees/engine-concurrency-and-pin-transfer-2026-08-30-r3/_refinery/.git`
(contains the plan slug's components, title-then-date order) and its `HEAD` reads
`ad440fc0b65dfbfdf797b8f8b83f44b0d4531b50`, exactly the threaded landed tip — a direct Read there
is `code-verified`-capable.

This phase's audit log records task 2.2 — the sole owner of the plan's one new ADR (PIN-9,
Commander's Intent End-state 7) — with `verdict: "recovered:pre-merged"`, note "recovered:
pre-merged on adopted integration branch": the derive-and-skip signature exactly. Independently
confirmed at the landed tip: `docs/adr/` contains only `0001-*.md` through `0048-*.md` (48 files,
Glob-confirmed) — no `0049-*` or `00NN-*` ADR exists anywhere. Independently confirmed via
`.git/refs/heads/war/2026-08-30-engine-concurrency-and-pin-transfer/p2-2.2` = commit
`fb185988820aee1fdbc8fd0ca4db5f59b38ba0f3` — the SAME sha the phase's own `p2-polish` audit cited
as the shared phase-2 dispatch base (`git merge-base` of the two sibling task branches) — task
2.2's branch carries **zero commits**, never dispatched to a worker.

**The #1895 fix shape is still absent from the code at this landed tip.** Read directly:
`skills/war/assets/workflow-template.js`'s `deriveSkipClause` (search for "SANCTIONED RECOVERY
RELAUNCH — derive-then-cut") still gates purely on
`` `git merge-base --is-ancestor <that task's branch> "$TIP"` holds ``, with no
`git rev-list --count <base>..<branch> > 0` guard anywhere in the clause or its surrounding
comment block (lines ~1776-1784) — byte-shape-identical to the pre-#1895 code this lesson's
original entry describes. This is the THIRD distinct run this bug has manifested in (after the
two `2026-08-27-in-run-finding-resolution` instances), and the first observed case where it
swallowed an entire deliverable task (an ADR-authoring task, not a release-bump or doc-only task)
into a false `preMerged`.

**Sharper twist this time:** a phase-close polish audit (`p2-polish`) DID independently detect the
gap — its own gate-audit raised an `ask`-dispositioned Minor finding naming task 2.2's zero-commit
branch and the missing ADR, with a fork offering "land now, file follow-up" vs. "hold and
re-dispatch task 2.2." But the polish round's fix diff was itself rejected on unrelated grounds
(`verdict: "polish-rejected"`, citing a stale/incorrect budget-raise citation comment), the
re-audit outcome was `verdict: "polish-discarded"`, and — per
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] — a discarded
terminal polish round drains no queue. The `ask` was never surfaced to an operator for a ruling;
phase 2 landed with task 2.2's entire deliverable absent and End-state 7 unmet (the gate-audit
recorded it `status: "unverified"`, not `"unmet"`, only because the check was scoped out of task
2.1's own attestation — not because the artifact was confirmed present).

**Pattern to watch for, extended:** this bug is not merely unfixed — a `recovered:pre-merged`
verdict on any task in a sanctioned-recovery-relaunch run is now confirmed to warrant an explicit
zero-commit check (`git rev-list --count <base>..<branch>`) by the Lead/servitor before trusting
the task's deliverable exists, regardless of how many runs pass without the engine bug being hit.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`, the
`deriveSkipClause` definition — search `SANCTIONED RECOVERY RELAUNCH — derive-then-cut` — for the
absence of any `rev-list --count` / commit-count guard alongside the `merge-base --is-ancestor`
check.
