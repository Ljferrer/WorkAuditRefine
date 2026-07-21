---
name: phase-vs-task-status-enum-leakage
description: "Task enum 'merged'; 'landed' is phase-level only"
metadata: 
  node_type: memory
  type: project
  keywords: [landed vs merged, landDecision, ledger schema, merge_sha gate, terminal state, blocked prose, wrong level token]
  provenance: code-verified
  slug: phase-vs-task-status-enum-leakage
  phase: submod-inc2/T7
  tags: 
    - status-enum
    - agent-contracts
    - schemas
    - war-worker
  created: 2026-06-30
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
---

# Phase-level `landed` must not appear in task-level status prose

## What happened

Task T7 added the gitlink-bump step 1 guard in `agents/war-worker.md`:

> "If merge_sha is absent or the dep task is not yet merged/landed, return blocked"

The operative gate (`merge_sha` presence) is correct. But the token `landed` is a
**phase-level** `landDecision` value — it belongs to the phase-outcome enum, not the
task-level ledger status enum.

**Task-level ledger status enum** (the `tasks[].status` field in the ledger schema block
of `skills/war/references/schemas.md`):
```
"todo" | "working" | "audited" | "merged" | "escalated" | "blocked"
```

**Phase-level `landDecision`** (the `landDecision` field in the aftermath schema block of
the same file):
```
"landed" | "held:escalation" | "held:nothing-merged" | "held:land-failed" |
"held:phase-incomplete" | "held:workflow-error" | "held:submodule-pr"
```

`landed` is valid at the phase level only. A worker checking whether a dep *task* is ready
should use `merged` (or check `merge_sha` presence), not `landed`.

## Why it matters

The stray token is cosmetic here because `merge_sha` presence is load-bearing — but it trains
readers to check for `landed` in the task-status ledger, where it will never appear. A future
worker that gates on task-level status string equality and uses `landed` will silently never
proceed.

## Rule

When writing blocked-condition prose for a worker:
- Check dep task status as `merged` (the task-level terminal success status).
- Do NOT write `merged/landed` as if they are equivalent levels of the same enum.
- The authoritative source is `skills/war/references/schemas.md` — task status vs.
  `landDecision` are defined in separate schema blocks; the `landDecision` enum has since
  grown (e.g. `held:submodule-pr`), so quote it fresh, never from memory.

## Code-verified referent

Both enums live in `skills/war/references/schemas.md`: task-level status inside the ledger
schema's `tasks[]` entry; `landDecision` in the aftermath schema block. Verified @ master
2fcc8cb (v0.14.2).

Relates to [[shared-status-enum-widening-silently-widens-land-path]] (different failure mode —
widening an enum rather than confusing level; same schema surface).

> archived 2026-07-21: resolved — moved to archive
