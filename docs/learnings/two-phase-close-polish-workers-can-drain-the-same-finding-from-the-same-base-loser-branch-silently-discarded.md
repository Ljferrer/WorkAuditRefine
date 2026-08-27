---
name: two-phase-close-polish-workers-can-drain-the-same-finding-from-the-same-base-loser-branch-silently-discarded
description: "Two phase-close polish dispatches cut from the same pre-drain base can independently fix the SAME comment-lag/absorb finding; one lands directly on integration first, and the other — even when it contains a strict superset fix and is itself audit-approved — can be discarded wholesale at Refine (a conflict on the identical lines) rather than merged forward. Verify the fact the discarded branch additionally fixed is actually present at the landed tip before assuming it landed."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - phase-close polish
    - polish-discarded
    - duplicate finding drain
    - rebase conflict
    - comment-lag
    - absorb finding lost
    - coherence sweep
    - serial merge queue
    - superset fix discarded
  provenance: code-verified
  slug: two-phase-close-polish-workers-can-drain-the-same-finding-from-the-same-base-loser-branch-silently-discarded
  phase: 2026-08-25-engine-reliability-and-filing-fidelity/phase-8 (task p8-polish)
  tags: 
    - phase-close
    - refine
    - race-condition
    - plan-code-mismatch
  created: 2026-08-26
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
  modified: 2026-08-27T02:41:52.705Z
---

Phase 8's Task 1 (`skills/war/assets/provision-worktrees.sh`, `cmd_ensure_refinery_worktree`
gains the reuse-hygiene arm, #1476 gap 4) landed a comment-lag defect: the sibling
`cmd_ensure_publication_worktree` header claimed a byte-for-byte mirror "EXCEPT behavior (b)"
that no longer enumerated all divergences. The phase-close coherence sweep spawned (at
least) two independent polish dispatches from the **same** merge-base commit (`dec883b`) to
fix this exact same finding:

- `f25f511` — landed directly on the integration branch, narrower fix: one added `EXCEPT`
  clause (the `reuse_hygiene` divergence only).
- `bdc5c39` (task `p8-polish`) — a **strict superset**: the same clause plus a second
  `EXCEPT` for the `#1712` fix-1 holder-naming divergence the narrower fix omitted. This
  branch was gate-audited `approve` (findings were all `note`/informational, correctly
  flagging the imminent same-line conflict against `f25f511`).

At Refine, `p8-polish`'s rebase onto the (already-advanced) integration tip hit a textual
conflict on the identical header lines — both commits rewrote the same base line. The
run's actual outcome (confirmed at the landed tip
`31ac70a72b09231cbfab3a106d28afdc29442a4f`, read via the `_refinery` worktree whose `gitdir`
physical path names this plan's slug, HEAD == the confirmed tip) is that **`p8-polish` was
discarded wholesale** (`verdict: "polish-discarded"`) rather than merged with the conflict
resolved toward its superset text: `skills/war/assets/provision-worktrees.sh`'s
`cmd_ensure_publication_worktree` header at the landed tip carries only the narrower
two-clause form (`f25f511`'s text) — the `#1712` fix-1 holder-naming carve-out `bdc5c39`
added is **not present**. `ensure-publication-worktree`'s `git worktree add` failure path
still names no holder, exactly the gap `bdc5c39` recorded but did not get to fix.

**Pattern:** a phase-close coherence sweep can fan out more than one polish dispatch against
the *same* pre-sweep base, and when two of them independently touch the same lines, the one
that lands second (whether via a merge-queue conflict or an explicit discard decision) can be
dropped entirely — even when gate-audited clean and even when it strictly improves on the
one that landed first. The audit trail for the discarded branch is not a proxy for "this fix
is now in the codebase": always re-verify at the landed tip before recording a finding from a
`polish-discarded` (or any non-`approve`-terminal) audit-log entry as a landed fact. When a
polish worker's own findings flag "a divergent fix for this same finding already landed on
the integration tip" (as `bdc5c39`'s did, correctly, twice), that is a live signal the
refiner/Lead needs to route the conflict resolution deliberately — dropping the whole branch
is one valid resolution, but it silently orphans every improvement the discarded branch made
beyond the finding both branches shared.
