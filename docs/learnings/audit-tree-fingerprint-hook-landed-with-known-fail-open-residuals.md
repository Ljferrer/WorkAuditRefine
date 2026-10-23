---
name: audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals
description: "The audit tree fingerprint hook landed with known fail-open gaps: relative operands, no hook timeout, an unchecked touched-set write"
metadata:
  node_type: memory
  type: project
  keywords:
    - audit-tree-fingerprint
    - AUDIT-TAMPER
    - residual
    - fail-open
    - hook timeout
    - touched file
    - state dir prune
    - gitmodules parser
    - relative operand
    - D22
  provenance: code-verified
  slug: audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.2
  tags:
    - war
    - hooks
    - audit
    - residuals
    - ask-unruled
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-23T09:44:06.904Z
---

# Read this list before you touch `hooks/audit-tree-fingerprint.sh` or call it fail-closed

The hook is the D22 compensating control for the D21 `git grep -F -e <token>` admission. It landed approved, with these gaps still present at the landed tip (found at d66961d9 on `dev/2026-10-20-rea-artifact-evidence`, read via the run-scoped `_refinery` worktree). Verify each before acting.

1. **Relative operands.** The Bash arm touches only `-C` paths, `/`-initial tokens and the cwd. A call like `git diff ../wtB/f ../wtB/g` from an unmarked cwd never touches `wtB`, so a change there passes. Final-round Minor, disposition absorb, never drained. See [[touched-set-resolver-must-cover-every-path-form-the-admitting-guard-passes]].
2. **No `timeout` on the four hook entries.** The SubagentStart, SubagentStop and two PreToolUse entries in `hooks/hooks.json` carry no `timeout`. The reply-standard entries beside them set `timeout: 10`. Hashing a huge untracked file could outrun the host default. The security seat's claim that a harness kill is a non-blocking error, so the verdict passes unmodified, is UNVERIFIED host behavior. The seat raised an `ask` (size cap that fails closed, or full hashing with a larger timeout). The audit log shows no ruling.
3. **Touched-set writes fail open.** `touch_line` returns 0 when `mkdir -p` fails and does not check the append. `compare` returns clean when `$STATE/touched` is missing. Both lose a read silently. Needs out-of-band deletion or a full disk, so the risk is narrow.
4. **State dirs are never pruned.** `$MAIN/.claude/war/audit-fingerprints/<agent_id>/` has no removal in any arm. About 8 KB per seat run.
5. **Cost grows with marked worktrees.** SubagentStart runs `git status -uall` plus one `hash-object` batch in every marked worktree for every seat. The slice mandates it. It is O(seats x worktrees).
6. **Sibling `.gitmodules` readers split on whitespace.** The hook reads paths with `git config -z`. `reuse_hygiene` in `skills/war/assets/provision-worktrees.sh` pipes `--get-regexp` through an awk that drops field 1. `skills/war/assets/assert-no-submodule-mutation.sh` keeps awk field 2. By reading the awk (not executed), a submodule path or name with a space breaks both. Both files sit outside the task's Files list.

Why they shipped: items 1 and 3 were absorb findings. The fix round closed other findings, and the phase-close polish worker returned no result (`polish-discarded`). See [[in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round]] and [[fix-round-uncommitted-leftover-is-stashed-by-pin-transfer-and-never-lands]].

Related: [[submodule-task-worktrees-are-invisible-to-a-superproject-worktree-list]], [[dirty-worktree-fingerprint-needs-blob-hashes-z-status-and-link-text-not-a-bare-status-hash]].
