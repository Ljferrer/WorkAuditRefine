---
name: api-outage-storm-audit-seat-deaths-never-merge-unaudited
description: "On a sustained provider outage, back off on a timer, keep evidence current with API-free checks, and never merge work whose audit seats died"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - 529 Overloaded
    - provider outage
    - audit-blocked
    - env-died
    - dispatchAgent
    - pushed but unmerged
    - never merge unaudited
    - API-free verification
    - local gate run
    - checkpoint evidence
    - backoff
    - sustained outage
    - fail-closed
  provenance: agent-unverified
  slug: api-outage-storm-audit-seat-deaths-never-merge-unaudited
  phase: 2026-08-06-references-pointer-integrity/phase-2
  tags: 
    - war
    - engine
    - resilience
    - escalation
    - infra-death
    - release
  relates: 
    - "[[env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return]]"
    - "[[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]]"
  created: 2026-08-18
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-08-18T18:30:55.189Z
---

# On a provider-API outage, back off, use API-free evidence, and never merge unaudited

**Rule:** on a sustained provider outage (repeated `529`/`Overloaded` across multiple dispatch
attempts), back off on a timer rather than immediately re-dispatching. Lean on API-free evidence
channels (local gate runs, direct git reads/greps) to keep run evidence current while seats are
unavailable. Never merge work whose audit has not run.

**Why:** in one outage, the worker committed and pushed, but every audit seat died. The task was
left pushed to its task branch but unmerged: Work+Audit runs before the Refine serial-merge step,
and a task-branch push is not a merge. The engine never merged un-audited work, and the land
happened only after real audit evidence existed. A dead audit seat can never silently downgrade to
"approved".

**How the engine classifies it now:** a dead audit seat reads `env-died` SOFT, with the site named,
never `audit-blocked` — the seat judged nothing. `audit-blocked` (a HARD escalation reason) is only a
seat shortfall without a death: fewer usable seat results than expected after retries. Either way
the task does not merge.

**How to apply:** while seats are unavailable, run the full gate locally in a clean detached
worktree to establish gate-log / `pin_status` evidence independent of any agent dispatch, so the
checkpoint's evidence stays complete without waiting on the provider. Relaunch on a timer, not in a
tight loop.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`, the
audit loop's `if (died) { verdict = 'env-died' ...` line, read BEFORE the
`seats.length < expected` → `audit-blocked` shortfall check; `SOFT_ENV_REASONS` and
`HARD_ESCALATION_REASONS` in `skills/war/assets/land-decision.mjs`.

Related:
[[env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return]];
[[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]] (the `parallel`/null mechanics
audit-seat deaths ride).

> archived 2026-08-30: resolved — moved to archive
