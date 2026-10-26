---
name: auditor-grep-tool-unrestricted-by-git-verb-bash-guard
description: "The WAR auditor's read-only git-verb Bash guard denies shell-level `grep`/`git grep`, but the auditor's own Grep tool capability is a separate, unrestricted channel — a false 'I could not grep the repo' self-report is a calibration miss, not a real capability ceiling"
metadata:
  node_type: memory
  type: project
  keywords:
    - auditor grep
    - git grep denied
    - validate-auditor-git.sh
    - read-only allowlist
    - repo-wide carrier sweep
    - Bash fail-closed
    - Grep tool vs shell grep
    - auditor tool capability
    - false I cannot
  provenance: code-verified
  slug: auditor-grep-tool-unrestricted-by-git-verb-bash-guard
  phase: campaign-anchor-comment-truth/phase-1 task 1.1 (audit finding, disposition note)
  tags:
    - auditor
    - guard
    - calibration
    - hooks
    - self-limiting-misconception
  created: 2026-07-19
  originSessionId: unknown
  modified: 2026-10-23T09:44:52.529Z
---

# The auditor's git-verb Bash guard blocks shell `grep`/`git grep` — it never blocks the auditor's own Grep tool

**What happened:** an auditor seat, asked to independently re-run a plan's repo-wide "not a
repo" / "bare" carrier sweep (its own End state 10), reported it "could not" — stating
"`git grep`/`grep` are denied to the read-only auditor" — and recorded the gap as a Nit
`disposition: note` finding instead of running the sweep.

**Why the claimed limitation does not bind:** `agents/war-auditor.md`'s frontmatter lists
`tools: Read, Grep, Glob, Bash` — verify still present before acting (found at
`agents/war-auditor.md` line 5 @ phase campaign-anchor-comment-truth/1.1). The auditor's
`hooks/validate-auditor-git.sh` guard fail-closes **Bash** to a read-only git-subcommand
allowlist (`diff/log/show/merge-base/rev-parse/status/ls-files/ls-tree/cat-file/blame/branch` —
quoted from the guard's allowlist-miss deny message, the "git subcommand '...' is not in the
read-only allowlist" construct) — `grep` is not in that list, so
both a shell `grep` invocation and `git grep` (a git subcommand) are correctly denied **through
Bash**. But the auditor's separate **Grep tool** (ripgrep-backed, one of its four listed
capabilities) is not a Bash invocation at all — the git-verb guard has no hook on it, and nothing
else in the auditor's confinement restricts it. A repo-wide token/pattern sweep is achievable via
the Grep tool directly; the Bash git-verb denial is orthogonal to it. The deny message itself now
ends "for repo-wide search use the Grep tool" (and the not-a-git-command arm points at
Read/Grep/Glob), so the original miscalibration is partially self-correcting.

**The rule:** before recording "I could not do X" as an audit finding or gate-audit disposition,
check which concrete tool call was actually attempted and denied, not just "X sounds like it
needs a shell command that's probably blocked." A guard scoped to one tool (here: Bash) does not
transitively restrict a differently-named tool (here: Grep) that achieves the same practical
outcome. This mirrors the user's standing instruction to verify a limitation binds to the current
case before asserting it — a recorded/assumed constraint is scoped to its origin mechanism, not a
blanket rule across every tool that could serve the same purpose.

**Scope note:** this does not widen the auditor's Bash allowlist or argue for adding `grep`/`git
grep` to it (H3/verb-set discipline is unrelated and untouched) — it only corrects which tool an
auditor should reach for when it wants a repo-wide text sweep. See
[[scope-guard-needs-agent-type]] and [[guard-c-peel-resolves-pin-blocker-but-scoped-to-read-verbs-only]]
for the git-verb guard's own (unrelated, narrower) scope decisions.

## Superseded in part (2026-10-23, plan 2026-10-20-rea-artifact-evidence, phase 6, code-verified)

Two claims above no longer hold. ADR 0029 Amendment 2026-10-22 (plan D21) admits one form of `git grep` through Bash: `git grep -F -e <token>`. Every other grep form still denies, `-O` by name. The "correctly denied through Bash" and "`git grep` is not in the allowlist" statements are true only for the other forms. Also, the premise that the auditor always holds a Grep tool failed: audit seats in this phase again reported no Grep tool, and the ADR cites Claude Code 2.1.304 as the reason for the reversal. The "calibration miss" framing still applies when a seat does hold the Grep tool and claims it cannot search. Check the tool list first. See [[admitting-a-risky-verb-to-a-read-only-guard-needs-default-deny-by-token-shape-with-cluster-expansion]]. Verify still present: the NARROW-FORM grep block in `hooks/validate-auditor-git.sh`, found at landed tip d66961d9 on `dev/2026-10-20-rea-artifact-evidence`.

> archived 2026-08-15: resolved — moved to archive
