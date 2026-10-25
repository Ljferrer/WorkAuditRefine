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
    - relative operand
    - no-index
    - subcommand -C
    - over-touch
  provenance: code-verified
  slug: touched-set-resolver-must-cover-every-path-form-the-admitting-guard-passes
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.2, updated at phase-7 task 7.2 and p7-polish
  tags:
    - war
    - hooks
    - audit
    - guard-design
    - fail-open
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-25T00:57:07.751Z
---

# Derive a resolver's coverage from the guard's grammar, not from the call shapes you pictured

**Rule.** A control that compares only "the worktrees this call reached" is only as closed as its resolver. Build the resolver from what the admitting guard passes. A path form the guard admits and the resolver skips is a fail-open hole. Over-touching is safe, because an extra touched worktree only adds a comparison. Under-touching is not.

**Evidence from tasks 6.2, 7.2 and p7-polish.** The fingerprint hook's Bash arm started with `git -C <path>` and the cwd fallback. Audit rounds then found one more admitted form each time:
- Absolute operands (`git diff /abs/wtB/f /abs/wtB/g`, `git diff --no-index`, `git blame --contents`). Fixed in 6.2.
- A Glob call with an absolute `pattern` and an empty `path`. Fixed in 6.2: the arm touches the pattern's prefix up to the first glob metacharacter.
- A relative operand that escapes the cwd (`../wtB/f`). Fixed in 7.2: the slice named `../*|./*`, and the landed arm resolves relative operands against a running base that each `-C` moves, as git applies `-C`.
- An unquoted word-initial `~/` operand. The guard admits `~` for `HEAD~1`, and the seat's shell expands `~/` before git runs. Fixed in polish. A `~<name>` form goes into the touched set literal, and the verdict arm escalates it as unresolved.
- A `--opt=<path>` value (`git blame --contents=<path>`). Fixed in polish.
- A slashless operand after a `-C` into a run directory (`git -C <run dir> diff --no-index T1 T2`). A bare `<task>` there names a whole task worktree. Fixed in polish.

**The cheapest closure.** Resolve EVERY non-flag token against the running base. A token that names no directory (`diff`, `HEAD~1`) resolves to the base, which the `-C` arm or the cwd fallback already touched, and `touch_line` dedupes. Over-touch costs one `canon` subshell per token. A `*/*` filter plus a justification comment bought nothing and hid the slashless hole.

**Still open at the phase-7 tip.**
- A `-C` after the subcommand. Git reads `-C` as a global option only before the subcommand word. After `diff`, `log` or `blame` it is copy detection (`-C`, `-C50%`). The hook treats every `-C` as global and moves the base onto the next token, so `git -C <run dir> diff -C --no-index T1 T2` leaves the touched set empty. The fix is a `_sub` flag set on the first token that is not `git`, `-C` or a `-C` value, with the `-C` arms live only while it is unset. Raised in at least four audit rounds. Every fix attempt was forward-reverted or ran out of rounds.
- A directory operand that contains task worktrees (the run directory itself) reaches all of them through `diff --no-index` recursion and is not resolved to them. The Bash arm comment names it.

**Why the guard permits these.** `hooks/validate-auditor-git.sh` permits the character set `[A-Za-z0-9 ./_=:,@^~%+-]`, so `.`, `/`, `=` and `~` pass. It peels one leading `-C <path>`, allows `diff` and `blame`, and polices no diff or blame flag. By the audit seats' account of git behavior (not executed here), git implies `--no-index` for a path outside the cwd repository's work tree, so the command reads a sibling worktree without any `-C` token.

**Process trap, seen twice.** A fix-round or polish worker declined a resolver finding on a false fact about what the guard or the layout allows.
- Task 6.2: the worker said the git guard admits neither relative form. The security seat showed that false at the pin.
- p7-polish: the worker declined "route any remaining relative token" because "a task worktree sits two levels under the main checkout". The layout is `.claude/war-worktrees/<run>/<task>`, four levels below the main checkout. A `-C` also moves the base, so a bare `<task>` can name a whole worktree. Four seats refuted it with a traced command, and the next polish round fixed it.

Before you accept a decline that rests on a guard or layout fact, read the guard's character class and verb list, and read the layout from `skills/war/assets/provision-worktrees.sh`. Then ask whether the resolver's base can move.

**Locate-cue (verify still present before acting).** In `hooks/audit-tree-fingerprint.sh`, the Bash token loop's operand branch has `/*`, `-*` and base-relative arms. The `-C)` and `-C?*)` arms have no subcommand gate. Found at landed tip 218012434004 on `dev/2026-10-20-rea-artifact-evidence`. The character class is the `tr -d` residue rule in `hooks/validate-auditor-git.sh`.

Related: [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]], [[compound-check-closed-operator-enumeration-drops-one-site-restates-the-dead-operator]], [[scope-hook-blind-to-bash-write-path]].
