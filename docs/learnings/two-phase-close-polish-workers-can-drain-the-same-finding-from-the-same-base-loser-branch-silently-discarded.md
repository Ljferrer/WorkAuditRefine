---
name: two-phase-close-polish-workers-can-drain-the-same-finding-from-the-same-base-loser-branch-silently-discarded
description: "Re-verify at the landed tip before recording a polish-discarded branch fix as landed; a superset fix can be dropped whole at Refine"
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

**Rule:** a phase-close coherence sweep can fan out more than one polish dispatch from the same pre-sweep
base. When two of them touch the same lines, the one that reaches Refine second hits a rebase conflict and
can be discarded wholesale (the `polish-discarded` arm in `workflow-template.js`), even when it was
gate-audited clean and strictly improves on the one that landed first. Its audit trail is not proof the fix
is in the codebase.

**How to apply:**
- Never record a fact from a `polish-discarded` (or any non-`approve`-terminal) audit-log entry as landed.
  Read the landed tip and confirm the change is there.
- When a polish worker's own findings say "a divergent fix for this same finding already landed on the
  integration tip", treat that as a live signal. The refiner or Lead must route the conflict deliberately.
  Dropping the whole branch is a valid resolution, but it silently orphans every improvement the discarded
  branch made beyond the shared finding.

**Why:** the serial merge queue resolves a same-line conflict by discarding, not by merging forward, so the
audit verdict and the landed content diverge without any error.

**Example (2026-08-25-engine-reliability-and-filing-fidelity, phase 8):** two polish dispatches fixed the
same comment-lag defect in the `cmd_ensure_publication_worktree` header of
`skills/war/assets/provision-worktrees.sh`. The narrower fix landed first; the superset fix (which also
named the `#1712` fix-1 holder-naming divergence) was discarded. The header has since been rewritten into a
numbered divergence list that names that divergence, but the publication `git worktree add` die still names
no holder.
