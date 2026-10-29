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

**Evidence from tasks 6.2, 7.2, p7-polish and phase 8.** The fingerprint hook's Bash arm started with `git -C <path>` and the cwd fallback. Audit rounds then found one more admitted form each time:
- Absolute operands (`git diff /abs/wtB/f /abs/wtB/g`, `git diff --no-index`, `git blame --contents`). Fixed in 6.2.
- A Glob call with an absolute `pattern` and an empty `path`. Fixed in 6.2: the arm touches the pattern's prefix up to the first glob metacharacter.
- A relative operand that escapes the cwd (`../wtB/f`). Fixed in 7.2: the landed arm resolves relative operands against a running base that each `-C` moves, as git applies `-C`.
- An unquoted word-initial `~/` operand. The guard admits `~` for `HEAD~1`, and the seat's shell expands `~/` before git runs. Fixed in polish. A `~<name>` form goes into the touched set literal, and the verdict arm escalates it as unresolved.
- A `--opt=<path>` value (`git blame --contents=<path>`). Fixed in polish.
- A slashless operand after a `-C` into a run directory (`git -C <run dir> diff --no-index T1 T2`). A bare `<task>` there names a whole task worktree. Fixed in polish.
- A `-C` after the subcommand word. Git reads it as copy detection there (`-C`, `-C50%`), not as a global option. The hook moved its base onto the next token, so `git -C <run dir> diff -C --no-index T1 T2` touched nothing. Raised in at least four audit rounds of phase 7 and never landed there. Fixed in phase 8: a `_sub` flag is set on the first token that is not `-C` or a `-C` value.
- A directory operand that holds task worktrees (the run directory). Git implies `--no-index` per command when two path operands have either one outside the work tree. Fixed in phase 8 with `implied_noindex`.
- An attached short-option file value (`-O<file>`, cluster `-pO<file>`). Fixed in phase 8.
- A `..` after a symlink or a missing component, which the Read tool and git's in-repo test fold as text while the kernel resolves it physically. Fixed in p8-polish by taking both readings.

- A Grep `path` that names a directory holding task worktrees. The arm walked up only. Fixed in plan 2026-10-26-fingerprint-hook-followups phase 2: `grep_walk` touches the worktrees below the root that ripgrep enters. The Glob arm stays walk-up only, by ruling, and a row pins it.
- A `~-` or `~-/x` token. The seat's shell expands it from OLDPWD, and the payload carries only the cwd. The hook had mapped it to the cwd, which under-touches whenever the two differ. Fixed in the same phase: `tilde` returns 1, the token goes into the touched set literal, and the verdict arm escalates it as unresolved.

The directory operand, the attached short option and the `..` forms are written up in [[a-path-resolver-standing-in-for-a-reader-must-follow-that-readers-rule-and-take-both-when-readers-disagree]]. The Grep walk asks git how ripgrep ignores a folder, see [[plain-git-check-ignore-reads-the-index-so-a-walk-that-mirrors-ripgrep-skips-must-use-no-index]].

**Rule for a form the payload cannot carry.** When the seat's shell expands a token from state the hook never receives (`~-` from OLDPWD, `~<name>` from getpwnam), do not map it to the nearest reading. Record the token literal and escalate it as unresolved. A row that asserted the nearest reading must flip, not stay green. Then sweep every comment that states the old reading. The 2026-10-26 plan named seven comment sites, and its End state for that sweep is judged, not run.

**The cheapest closure.** Resolve EVERY non-flag token against the running base. A token that names no directory (`diff`, `HEAD~1`) resolves to the base, which the `-C` arm or the cwd fallback already touched, and `touch_line` dedupes. Over-touch costs a few `canon` subshells per token. A `*/*` filter plus a justification comment bought nothing and hid the slashless hole.

**Open at the phase-8 tip, closed since.** The Glob and Grep arm walked up from a `path` and never down, and `~-` mapped to the payload cwd. Both closed in phase 2 of the 2026-10-26 plan, as the bullets above say. Still open: backstops B1 and B2 of that plan, and the Grep arm's `check-ignore` calls run outside the watchdog. See [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]], items 13 and 14.

**Why the guard permits these.** `hooks/validate-auditor-git.sh` permits the character set `[A-Za-z0-9 ./_=:,@^~%+-]`, so `.`, `/`, `=` and `~` pass. It peels one leading `-C <path>`, allows `diff` and `blame`, and polices no diff or blame flag. A seat's read-only probe at phase 8 confirmed that git implies `--no-index` for a path outside the work tree, so the command reads a sibling worktree without any `-C` token.

**Process trap, seen three times.** A fix-round or polish worker declined or narrowed a resolver finding on a false fact.
- Task 6.2: the worker said the git guard admits neither relative form. The security seat showed that false at the pin.
- p7-polish: the worker declined "route any remaining relative token" because "a task worktree sits two levels under the main checkout". The layout is `<repo-root>/.claude/war-worktrees/<run>/<task>`, four levels below the main checkout. A `-C` also moves the base, so a bare `<task>` can name a whole worktree. Four seats refuted it with a traced command, and the next polish round fixed it.
- Task 8.1: the a6 ace commit said no caller of `canon` needs logical resolution. The Read arm and the Glob and Grep arm reach `canon` too, and a seat's later finding showed the fix flipped the hole to the lexical reader.

Before you accept a decline or a narrowing that rests on a guard or layout fact, read the guard's character class and verb list, and read the layout from `skills/war/assets/provision-worktrees.sh`. Grep every caller of a shared helper before you change its rule. Then ask whether the resolver's base can move.

**Locate-cue (verify still present before acting).** In `hooks/audit-tree-fingerprint.sh`, the Bash token loop has the `_sub` flag, the `-C)` and `-C?*)` arms gated on `_sub = 0`, the `-[!-]?*` attached-option arm and the base-relative operand arm that calls `touch_operand`. The character class is the `tr -d` residue rule in `hooks/validate-auditor-git.sh`. Found at landed tip c01f2b9022b2 on `dev/2026-10-20-rea-artifact-evidence`, read through the run-scoped `_refinery` worktree (its HEAD equaled the tip). At the phase-3 tip of `dev/2026-10-26-fingerprint-hook-followups` (1f7eff5d9411, read through that run's `_refinery` worktree at 875c5f1d14e2) the same file also holds `grep_walk`, which the Glob and Grep arm calls for Grep only, and a `tilde` that returns 1 on `~-`.

Related: [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]], [[compound-check-closed-operator-enumeration-drops-one-site-restates-the-dead-operator]], [[scope-hook-blind-to-bash-write-path]].
