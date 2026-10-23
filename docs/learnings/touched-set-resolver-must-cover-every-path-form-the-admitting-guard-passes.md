---
name: touched-set-resolver-must-cover-every-path-form-the-admitting-guard-passes
description: A tool-call resolver feeding a compare-on-exit control must parse every path form its admitting guard lets through
metadata:
  node_type: memory
  type: project
  keywords:
    - touched set
    - path resolver
    - fail-open
    - auditor git guard
    - absolute operand
    - relative operand
    - no-index
    - compensating control
    - fingerprint hook
    - over-touch
  provenance: code-verified
  slug: touched-set-resolver-must-cover-every-path-form-the-admitting-guard-passes
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.2
  tags:
    - war
    - hooks
    - audit
    - guard-design
    - fail-open
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-23T09:43:55.078Z
---

# Derive a resolver's coverage from the guard's grammar, not from the call shapes you pictured

**Rule.** A control that compares only "the worktrees this call reached" is only as closed as its resolver. Build the resolver from what the admitting guard passes. A path form the guard admits and the resolver skips is a fail-open hole. Over-touching is safe, because an extra touched worktree only adds a comparison. Under-touching is not.

**Evidence from task 6.2.** The fingerprint hook's Bash arm started with `git -C <path>` and the cwd fallback. Audit rounds then found one more admitted form each time:
- Absolute operands (`git diff /abs/wtB/f /abs/wtB/g`, `git diff --no-index`, `git blame --contents`). Fixed: the arm now touches every `/`-initial token.
- A Glob call with an absolute `pattern` and an empty `path`. Fixed: the arm touches the pattern's prefix up to the first glob metacharacter.
- A relative operand that escapes the cwd (`../wtB/f`). NOT fixed at land (see the residuals lesson).

**Why the guard permits these.** `hooks/validate-auditor-git.sh` permits the character set `[A-Za-z0-9 ./_=:,@^~%+-]`, so `.` and `/` pass. The `diff` and `blame` verbs are allowed. By the audit seat's account of git behavior (not executed here), git implies `--no-index` for a path outside the cwd repository, so the command reads a sibling worktree without any `-C` token.

**Process trap.** The fix-round worker dropped the relative-operand case on its Ignore-for-now list, with the reason that the git guard admits neither form. The security seat showed that premise false at the pin. Before accepting an Ignore-list claim about what a guard admits, read the guard's character class and verb list.

**Locate-cue (verify still present before acting).** The Bash arm's second `case "$_tok"` in `hooks/audit-tree-fingerprint.sh` holds the `/*` arm and no `../*` or `./*` arm (found at landed tip d66961d9 on `dev/2026-10-20-rea-artifact-evidence`). The character class is the `tr -d` residue rule in `hooks/validate-auditor-git.sh`.

Related: [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]], [[compound-check-closed-operator-enumeration-drops-one-site-restates-the-dead-operator]], [[scope-hook-blind-to-bash-write-path]].
