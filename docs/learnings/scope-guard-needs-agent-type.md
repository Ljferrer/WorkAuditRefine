---
name: scope-guard-needs-agent-type
description: "WAR_WORKTREE hook = NO-OP; scope by agent_type"
metadata: 
  node_type: memory
  type: project
  keywords: [PreToolUse hook, env var not persisted, subagent identity, session_id identical, write confinement, hook stdin payload, per-worker registry infeasible]
  originSessionId: 72677b5c-68d3-4a44-91d8-2ed9424737af
---

Runtime probe (2026-06-25, design of worktree provisioning) of the Claude Code PreToolUse hook:

- The hook payload (stdin JSON) carries `agent_type` and `agent_id` **only for subagents** — and
  `agent_type` is set by the spawner, so it reliably identifies the *role* of the writer.
- A subagent's `session_id` and `cwd` are **identical to the parent's** → useless as per-worker identity.
- A subagent's `export VAR=…` does **not** survive to its next Bash call → the original
  `WAR_WORKTREE` env-var guard was effectively a **NO-OP** in the agent flow. (Since fixed:
  `hooks/validate-worktree-scope.sh` now enforces by `agent_type` per ADR 0002.)
- A worker **cannot read its own `agent_id`** (absent from its env), and the spawner only learns it
  after the agent returns → an `agent_id → worktree` registry is infeasible. **Exact** per-worktree
  confinement is therefore unattainable in this harness.

**Why:** this was the load-bearing finding behind ADR 0002 (scope by agent_type) and the whole
worktree-provisioning redesign — it overturns the repo's documented claim that `WAR_WORKTREE` confines
writers.

**How to apply:** enforce write-scope by matching `agent_type` (`war-worker` → must be under a
`.war-task`-marked worktree; `war-auditor` → deny; `war-servitor` → learnings-target path pattern;
others/main → fail-open), not by env vars. Don't trust prose `export WAR_WORKTREE`. See
`docs/specs/2026-06-25-worktree-provisioning-design.md` (E1) and `docs/adr/0002-scope-by-agent-type.md`.
Related: [[phase-1-markdown-heading-hierarchy]].
