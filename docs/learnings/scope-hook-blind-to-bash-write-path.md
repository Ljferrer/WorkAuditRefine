---
name: scope-hook-blind-to-bash-write-path
description: "Hook gates Write/Edit only; Bash write path ungated"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: [shell redirect, tee escape, sed -i, advisory warn, capability allowlist, PreToolUse gap, ungated write, confinement residual]
  originSessionId: e7523bdc-9e44-4a06-803d-587632bc5e63
---

The structured-edit scope hook (`validate-worktree-scope.sh`, on the `Write|Edit|NotebookEdit` matcher in `hooks/hooks.json`) gates only structured edits. Its own comment says a write with no file_path is always allowed. So `agent_type` write-scoping is **enforced for structured edits and prose-deep on the Bash path** (`echo >`, `sed -i`, `tee`, `cp`, `git -C`, `python -c "open()"`).

**Servitor: FIXED (F01 D1).** Its card allowlist is `tools: Read, Grep, Glob, Write, Edit, mcp__plugin_work-audit-refine_war-memory__memory_query`, with **no Bash**. Its only write path is Write/Edit, which the scope hook gates by `agent_type`.

**Auditor.** Its allowlist is `tools: Read, Grep, Glob, Bash, mcp__plugin_work-audit-refine_war-memory__memory_query`. It is read-only because `validate-auditor-git.sh` holds Bash fail-closed to an allowlisted read-only git verb set, not because Bash is absent.

**Worker: residual remains.** The worker needs Bash, so its Bash write path cannot be allowlisted away. `warn-bash-write-scope.sh` (F01 D4) detects writes outside any `.war-task` ancestor for suffix-anchored `*war-worker` agents and warns to stderr, but **always exits 0 and never blocks**. #809 (2026-07-12) widened detection (relative redirects resolved against `.cwd`, interpreter `-c`/`-e` payloads) without making it blocking; here-docs and dynamic paths stay uncaught.

**Why:** write-scoping is the headline ADR-0002 safety property. On Bash it is a guarantee no code enforces for the worker. Same family as [[red-team-env-gap-warn-is-agent-directive-not-code-enforced]]. Relates to [[scope-hook-servitor-pattern-residuals]] and [[scope-guard-needs-agent-type]].
