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
    - tilde-minus
    - OLDPWD
    - grep walk-down
  provenance: code-verified
  slug: touched-set-resolver-must-cover-every-path-form-the-admitting-guard-passes
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.2, updated at phase-7 task 7.2, p7-polish and phase-8 (task 8.1, p8-polish), then 2026-10-26-fingerprint-hook-followups/phase-2 task 2.1 (read at the phase-3 release)
  tags:
    - war
    - hooks
    - audit
    - guard-design
    - fail-open
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-27T09:55:44.433Z
---

# Derive a resolver's coverage from the guard's grammar, not from the call shapes you pictured

**Rule.** A control that compares only "the worktrees this call reached" is only as closed as its resolver. Build the resolver from what the admitting guard passes. A path form the guard admits and the resolver skips is a fail-open hole. Over-touching is safe, because an extra touched worktree only adds a comparison. Under-touching is not.

**Forms the fingerprint hook had to learn.** The hook started with `git -C <path>` and the cwd fallback. Audit rounds found these one at a time. All are handled now:
- Absolute operands, including `git diff --no-index` and `git blame --contents`.
- A Glob with an absolute `pattern` and an empty `path`: touch the prefix up to the first glob metacharacter.
- A relative operand that escapes the cwd (`../wtB/f`): resolve it against a running base that each global `-C` moves.
- A slashless operand after a `-C` into a run directory: a bare `<task>` names a whole worktree.
- A word-initial `~/` operand. The guard admits `~` for `HEAD~1`, and the seat's shell expands `~/` before git runs.
- A `--opt=<path>` value, and an attached short-option value (`-O<file>`, cluster `-pO<file>`).
- A `-C` after the subcommand word. Git reads it as copy detection there (`-C`, `-C50%`), not as a global option. The `_sub` flag now gates the `-C` arms. This one was raised in at least four audit rounds before it landed.
- A directory operand that holds task worktrees, when git implies `--no-index` (`implied_noindex`).
- A `..` after a symlink or a missing component: take both the physical and the lexical reading.
- A Grep `path` that names a directory holding task worktrees: `grep_walk` touches those ripgrep enters. The Glob arm stays walk-up only, by ruling, and a row pins it.
- `~-`, `~-/x` and `~<name>`: see the next rule.

The directory operand, the attached short option and the `..` forms are written up in [[a-path-resolver-standing-in-for-a-reader-must-follow-that-readers-rule-and-take-both-when-readers-disagree]]. The Grep walk asks git how ripgrep ignores a folder, see [[plain-git-check-ignore-reads-the-index-so-a-walk-that-mirrors-ripgrep-skips-must-use-no-index]].

**Rule for a form the payload cannot carry.** When the seat's shell expands a token from state the hook never receives (`~-` from OLDPWD, `~<name>` from getpwnam), do not map it to the nearest reading. Record the token literal and escalate it as unresolved. A row that asserted the nearest reading must flip, not stay green. Then sweep every comment that states the old reading.

**The cheapest closure.** Resolve EVERY non-flag token against the running base. A token that names no directory (`diff`, `HEAD~1`) resolves to the base, which the `-C` arm or the cwd fallback already touched, and `touch_line` dedupes. Over-touch costs a few subshells per token. A `*/*` filter plus a justification comment bought nothing and hid the slashless hole.

**Still open.** Backstops B1 and B2 of plan 2026-10-26-fingerprint-hook-followups have no record of a run, and `ignored_dir` runs `check-ignore` outside the watchdog. See [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]], items 13 and 14.

**Why the guard permits these.** `hooks/validate-auditor-git.sh` permits the character set `[A-Za-z0-9 ./_=:,@^~%+-]`, so `.`, `/`, `=` and `~` pass. It peels one leading `-C <path>` and allows `diff` and `blame`. On those two verbs its only flag check is the post-subcommand scan that denies `--output` and `-o`. Git implies `--no-index` for a path outside the work tree, so a command can read a sibling worktree without any `-C` token.

**Process trap, seen three times.** A fix-round or polish worker declined or narrowed a resolver finding on a false fact.
- The worker said the git guard admits neither relative form. A seat showed that false at the pin.
- The worker said a task worktree sits two levels under the main checkout. It sits four levels under when the root is `<repo>/.claude/worktrees`, and a `-C` also moves the base.
- The worker said no caller of `canon` needs logical resolution. The Read, Glob and Grep arms reach `canon` too, so the fix moved the hole to the lexical reader.

**How to apply.** Before you accept a decline or a narrowing that rests on a guard or layout fact, read the guard's character class and verb list. Read the layout from the `taskWorktree` declaration in `skills/war/assets/workflow-template.js` (`<worktreeRoot>/<runId>/p<phase>-<task>`). `worktreeRoot` is a launch arg, and `skills/war/assets/provision-worktrees.sh` does not fix it. Grep every caller of a shared helper before you change its rule. Then ask whether the resolver's base can move.

**Locate-cue (verify still present before acting).** In `hooks/audit-tree-fingerprint.sh`: the Bash token loop with the `_sub` flag, the `-C)` and `-C?*)` arms gated on `_sub = 0`, the `-[!-]?*` attached-option arm, and the base-relative operand arm that calls `touch_operand`. Also `grep_walk`, which the Glob and Grep arm calls for Grep only, and `tilde`, which returns 1 on `~-` and `~<name>`. The character class is the `tr -d` residue rule in `hooks/validate-auditor-git.sh`.

Related: [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]], [[compound-check-closed-operator-enumeration-drops-one-site-restates-the-dead-operator]], [[scope-hook-blind-to-bash-write-path]].
