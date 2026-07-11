---
name: scope-hook-servitor-pattern-residuals
description: "Servitor glob-only scope ratified #58; ..-hole closed"
metadata: 
  node_type: memory
  type: project
  keywords: [write confinement, path glob matching, parent directory traversal, memory root anchoring, validate-worktree-scope, accepted looseness]
  slug: scope-hook-servitor-pattern-residuals
  phase: 1
  title: "Servitor write-scope is glob-only: not anchored to cwd, .. slips through"
  tags: 
    - war
    - hooks
    - security
    - scope-guard
    - ratified-residual
    - bash
  date: 2026-06-25
  originSessionId: 53421d17-5351-48da-baf8-7d315d56c7b5
---

## Fact

The servitor arm of `hooks/validate-worktree-scope.sh` (the `*war-servitor*` case) confines writes by pure path-glob (now `*/.claude/projects/*/memory/*` — the `|*/docs/learnings/*` arm was subtracted per #58 RESOLVED, since the servitor no longer holds a legitimate repo-root write) — NOT anchored to the run's project root, so a matching path anywhere on disk is allowed. The `case "$atype"` arms use substring globs (`*war-servitor*` etc.); over-matching errs toward restriction, so that is fail-safe. Both are ratified residuals per ADR 0002 (consciously coarse) — do NOT "fix" them inside a task that ratified them. Issue #58 ("Harden servitor write-scope") is now CLOSED (completed 2026-06-26): the `..`-rejection landed in v0.6.4, and full memory-root anchoring was deferred per #58's Part-B framing — so the remaining glob-anchoring residual is **ratified-and-untracked** (no open issue tracks it).

The `..`-traversal hole originally recorded here is CLOSED: a phase-1b guard rejects `..` segments for ALL agent types before the per-agent case — see [[dotdot-guard-applies-to-all-agent-types]] and [[dotdot-pattern-misses-leading-relative-traversal]].

**Why:** keeps the accepted looseness on the record so a future security lens doesn't rediscover it as a surprise.
**How to apply:** if tightening is ever wanted, anchor the servitor glob to the run's memory root via a trusted payload/env value, and switch agent_type arms to exact strings.

Related: [[scope-guard-needs-agent-type]], [[scope-hook-relative-path-loop-hang]]
