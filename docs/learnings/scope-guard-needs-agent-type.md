---
name: scope-guard-needs-agent-type
description: "WAR_WORKTREE hook = NO-OP; scope by agent_type"
metadata: 
  node_type: memory
  type: project
  keywords: [PreToolUse hook, env var not persisted, subagent identity, session_id identical, write confinement, hook stdin payload, per-worker registry infeasible]
  originSessionId: 72677b5c-68d3-4a44-91d8-2ed9424737af
---

Runtime probe (2026-06-25, worktree-provisioning design) of the Claude Code PreToolUse hook. ADR 0002 records these facts in full; this lesson is the pointer.

- The hook payload carries `agent_type` and `agent_id` only for subagents. The spawner sets `agent_type`, so it reliably names the writer's role.
- A subagent's `session_id` and `cwd` equal the parent's, so they cannot identify a worker.
- A subagent's `export VAR=...` does not survive to its next Bash call, so the old `WAR_WORKTREE` env-var guard was a no-op. (Since fixed: `hooks/validate-worktree-scope.sh` enforces by `agent_type`.)
- A worker cannot read its own `agent_id`, and the spawner learns it only after return, so an `agent_id` to worktree registry is infeasible. Exact per-worktree confinement is out of reach.

**Why:** this finding drove ADR 0002 and the worktree-provisioning redesign.

**How to apply:** enforce write scope by `agent_type`, never by env vars: `war-worker` must write under a `.war-task`-marked worktree; `war-auditor` gets no writes; `war-servitor` writes only the current user's local project memory dir and has no Bash; others and main fail open. See `docs/adr/0002-scope-by-agent-type.md` and `docs/specs/2026-06-25-worktree-provisioning-design.md` (E1).
Related: [[phase-1-markdown-heading-hierarchy]].
