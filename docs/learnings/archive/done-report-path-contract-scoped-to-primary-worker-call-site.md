---
name: done-report-path-contract-scoped-to-primary-worker-call-site
description: "A new done-report path-contract assertion wired at one WORKER_RESULT call site (primary worker) leaves sibling call sites returning the same result shape (fix-worker, ace-worker, phase-close polish) unchecked"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: done-report-path-contract-scoped-to-primary-worker-call-site
  phase: guard-floor-and-scope-hook-coverage-completeness/t1.8 + Engine-routes-contract-surfaces/1.1 (2026-07-12)
  tags: 
    - workflow-template
    - coverage-gap
    - worker-report
    - scope-hook
    - path-contract
  created: 2026-07-10
  updated: 2026-07-12
  provenance_note: "renamed referent verified code-verified at phase Engine-routes-contract-surfaces/1.1, 2026-07-12 — see body update below"
  absence_note: "superseded 2026-07-12 — the function was renamed assertReportedPathsInWorktree -> normalizeReportedPaths in phase 'Engine routes + contract surfaces' task 1.1 (End-state 10: the old token must appear nowhere). Confirmed PRESENT (code-verified) at skills/war/assets/workflow-template.js — verify still present before acting."
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
    - normalizeReportedPaths
    - FILES_CHANGED_RULE
    - held:escalation
  relates: 
    - "[[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]]"
    - "[[standing-instruction-vs-dispatched-prompt-coverage-split]]"
    - "[[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]]"
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# A new done-report assertion wired at one WORKER_RESULT call site doesn't cover sibling call sites returning the same shape

**2026-07-12 update (phase "Engine routes + contract surfaces", task 1.1):** the function this
lesson names was deliberately renamed `assertReportedPathsInWorktree` → `normalizeReportedPaths`
(plan End-state 10: the old token must appear nowhere in `workflow-template.js` or any test
title — verified absent; the new name confirmed present, single call site, at
`skills/war/assets/workflow-template.js`, in the primary worker's done-report handling
right after `blockedReason(impl)`). It also stopped being assert-only: it now *normalizes* a
`mainCheckout`-rooted absolute path back to worktree-relative (warn-logged) and still throws
(→ escalates, see [[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]]) on any other
absolute path, including a sibling task's worktree. **The scope finding below still holds
verbatim post-rename**: re-checked 2026-07-12, `normalizeReportedPaths` is wired at exactly one
call site (the primary worker) — the fix-worker result (`fix` object, same file) still is not
passed through it. Same judgment applies: plan-scoped to "one call site," other worker types are
independently confined by the scope hook (ADR 0002).

**The finding (two independent auditor cross-checks, t1.8, disposition note — Nit each):**
`workflow-template.js` gained a path-contract assertion (`assertReportedPathsInWorktree`, now
`normalizeReportedPaths`) that injects the absolute worktree root and asserts every path in a
worker's `files_changed` contains the `.claude/worktrees/<name>/` segment. It is wired ONLY at the
primary/initial worker's done-report handling site, checking `impl.files_changed`. Fix-worker,
ace-worker, and phase-close polish-worker re-work also return `WORKER_RESULT` objects carrying
`files_changed`, but none of those call sites run the same assertion.

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
