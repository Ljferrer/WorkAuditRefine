---
name: scope-hook-blind-to-bash-write-path
description: "Hook gates Write/Edit only; Bash write path ungated"
metadata: 
  node_type: memory
  type: project
  keywords: [shell redirect, tee escape, sed -i, advisory warn, capability allowlist, PreToolUse gap, ungated write, confinement residual]
  originSessionId: e7523bdc-9e44-4a06-803d-587632bc5e63
---

The structured-edit scope hook (`validate-worktree-scope.sh`, the `Write|Edit|NotebookEdit` matcher in `hooks/hooks.json`) gates only Write/Edit — its own comment concedes "a write with no file_path is always allowed." So `agent_type` write-scoping is **enforced for structured edits, prose-deep on the Bash path** (any `echo >`, `sed -i`, `tee`, `cp`, `git -C`, `python -c "open()"`).

**Servitor: FIXED (F01 D1).** The servitor now carries a capability allowlist `tools: Read, Grep, Glob, Write, Edit` — **no Bash** — so its sole write path is Write/Edit, which the scope hook then gates by `agent_type` to the learnings path. Allowlist + hook are now jointly airtight; the docs no longer over-claim "physically confined."

**Auditor correction.** The auditor is no longer Read/Grep/Glob-only — it now holds `tools: Read, Grep, Glob, Bash` (needs read-only `git diff`). Its read-only guarantee is real because a dedicated Bash PreToolUse guard (`validate-auditor-git.sh`) **denies any non-read git/shell**, not because Bash is absent.

**Worker: residual remains.** The worker genuinely needs Bash (git), so its Bash write path can't be allowlisted away. It is now covered by an **advisory** hook (`warn-bash-write-scope.sh`, F01 D4): for `*war-worker*` agents it detects writes (`>`, `tee`, `sed -i`, `git -C`, `cp`, `mv`, `dd`, …) outside any `.war-task` ancestor and warns to stderr — but **always exits 0 and never blocks**, and opaque writes (`python -c "open()"`, here-docs) are missed. So the worker's confinement on Bash is best-effort warn, not enforcement.

**Why:** writes-scoping is the headline ADR-0002 safety property; on Bash it was prose-deep for every agent. Same family as [[red-team-env-gap-warn-is-agent-directive-not-code-enforced]] — a guarantee no code checks. The servitor fix closed the dangerous case (it touches memory); the worker residual is accepted and advisory-flagged. Relates to [[scope-hook-servitor-pattern-residuals]] and [[scope-guard-needs-agent-type]].
