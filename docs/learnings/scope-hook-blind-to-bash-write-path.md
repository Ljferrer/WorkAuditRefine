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

**Worker: residual remains.** The worker genuinely needs Bash (git), so its Bash write path can't be allowlisted away. It is now covered by an **advisory** hook (`warn-bash-write-scope.sh`, F01 D4): for `*war-worker` (suffix-anchored) agents it detects writes (`>`, `tee`, `sed -i`, `git -C`, `cp`, `mv`, `dd`, …) outside any `.war-task` ancestor and warns to stderr — but **always exits 0 and never blocks**. So the worker's confinement on Bash is best-effort warn, not enforcement.

**Narrowing (2026-07-12, #809) — coverage widened, posture unchanged.** The detector gained two capture paths without becoming blocking: (1) relative redirect targets (`> foo`, `a>b`) now resolve against the payload's `.cwd` instead of being skipped outright (workers run with cwd inside their worktree, so a cd-prefixed relative write resolves inside `.war-task` and stays silent; `.cwd` absent/relative keeps the old skip); (2) interpreter payloads (`python`/`python3`/`perl`/`ruby`/`node` with `-c`/`-e`) that also carry a write-indicative token (`open(`, `write`, `writeFile`) have their absolute-path tokens extracted and warned — so `python -c "open('/outside/x','w')"`, formerly a canonical miss, now warns. Remaining ceilings (documented, still best-effort): here-docs; interpreter payloads that build paths dynamically; and every non-redirect extractor (tee/sed/perl/cp/mv/install/dd) stays absolute-only. The hook still **exits 0 always** — enforcement lives in the Write/Edit scope hook and the capability allowlists, never here.

**Why:** writes-scoping is the headline ADR-0002 safety property; on Bash it was prose-deep for every agent. Same family as [[red-team-env-gap-warn-is-agent-directive-not-code-enforced]] — a guarantee no code checks. The servitor fix closed the dangerous case (it touches memory); the worker residual is accepted and advisory-flagged. Relates to [[scope-hook-servitor-pattern-residuals]] and [[scope-guard-needs-agent-type]].
