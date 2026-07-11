---
name: done-report-path-contract-scoped-to-primary-worker-call-site
description: "done-report path assertion wired at only the primary WORKER_RESULT site skips sibling sites"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: done-report-path-contract-scoped-to-primary-worker-call-site
  phase: guard-floor-and-scope-hook-coverage-completeness/t1.8
  keywords: 
    - path contract
    - done-report validation
    - fix-worker coverage gap
    - ace worker
    - phase-close polish worker
    - files_changed
    - worktree root injection
    - WORKER_RESULT
    - single call site
  tags: 
    - workflow-template
    - coverage-gap
    - worker-report
    - scope-hook
    - path-contract
  created: 2026-07-10
  absence_note: "assertReportedPathsInWorktree not found in this cwd's skills/war/assets/workflow-template.js (phase-1 addition, t1.8) — servitor's worktree checkout may lag the landed branch; see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]. Verify present near the primary worker-done handling site before acting on line numbers."
  relates: 
    - "[[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]]"
    - "[[standing-instruction-vs-dispatched-prompt-coverage-split]]"
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# A new done-report assertion wired at one WORKER_RESULT call site doesn't cover sibling call sites returning the same shape

**The finding (two independent auditor cross-checks, t1.8, disposition note — Nit each):**
`workflow-template.js` gained a path-contract assertion (`assertReportedPathsInWorktree`) that
injects the absolute worktree root and asserts every path in a worker's `files_changed` contains
the `.claude/worktrees/<name>/` segment. It is wired ONLY at the primary/initial worker's
done-report handling site, checking `impl.files_changed`. Fix-worker, ace-worker, and phase-close
polish-worker re-work also return `WORKER_RESULT` objects carrying `files_changed`, but none of
those call sites run the same assertion.

**Judged intent-consistent, not a defect:** the plan slice explicitly scoped this to "one
assertion, not a new hook," and every one of those worker types is itself a `war-worker` already
mechanically confined to writes-under-worktree-ancestor by the scope hook (ADR 0002) — so the risk
this assertion exists to catch is already independently bounded for the uncovered call sites. This
is a completeness observation, not a plan deviation.

**The durable, reusable rule:** when you wire a new invariant-assertion at one "done"/result
handling site to close a specific defect class, grep every call site that constructs or receives
the same result shape (here: `WORKER_RESULT` with a `files_changed` field — same search shape as
[[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]]'s "same agent type,
different prompt-builder call site" pattern) before considering the class closed. Either wire each
sibling site too, or explicitly record which ones are left uncovered and why (as this task's audit
did) — an assertion added at a single call site reads as "this class is now guarded" to a future
reader unless the scope is stated.

> archived 2026-07-11: resolved — moved to archive
