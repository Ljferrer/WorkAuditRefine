---
name: a-path-handed-to-git-after-double-dash-is-a-glob-pathspec-so-set-git-literal-pathspecs
description: A path after -- is a git glob pathspec. Set GIT_LITERAL_PATHSPECS=1
metadata:
  node_type: memory
  type: project
  keywords:
    - GIT_LITERAL_PATHSPECS
    - pathspec glob
    - submodule update sibling moved
    - lib* matches libx
    - ":(literal)"
    - git status porcelain path
    - nested submodule pathspec
    - provision-worktrees
  provenance: code-verified
  slug: a-path-handed-to-git-after-double-dash-is-a-glob-pathspec-so-set-git-literal-pathspecs
  phase: 2026-11-08-shell-floors-tests-and-lint/phase-1 (task 1.6)
  tags:
    - git
    - shell
    - provisioning
    - submodules
  created: 2026-11-13
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-13T19:00:42.130Z
---

# A path after `--` is a pathspec, not a literal path

Git reads every operand after `--` as a pathspec.
In a pathspec, `*`, `?`, `[` and a leading `:` are live.
So `git submodule update --init -- 'lib*'` also matches an initialized sibling `libx`.
That moves `libx` to its recorded commit, and `--force` would also discard its changes.
`git status --porcelain -- "$p"` widens the same way and can report a sibling's dirt.

**Fix.** Prefix each such call with `GIT_LITERAL_PATHSPECS=1`, or write the operand as `:(literal)<path>`.
Sweep every call that passes the same variable, not only the one a finding names.
In task 1.6 the first fix patched one update call, and the next audit round found four siblings in `reuse_hygiene_one`.

**Second trap.** A superproject pathspec cannot name a nested submodule under an initialized parent.
Run that update from inside the deepest initialized ancestor, with the path relative to it.

**Also.** A git call inside a `while read ... done <<EOF` loop inherits the heredoc as stdin.
A child that reads stdin (a hook, a `!command` update, a credential helper) eats the remaining loop lines.
Add `</dev/null` to that call.

Locate-cue: verify still present before acting. `submodules_ready` and `reuse_hygiene_one` in `skills/war/assets/provision-worktrees.sh` carry the `GIT_LITERAL_PATHSPECS=1` and `</dev/null` prefixes @ phase 1, landed tip d2fafed7.

Related: [[fix-the-finding-class-not-the-site-and-prove-every-new-guard-red-before-commit]], [[a-git-config-bang-update-command-fixtures-the-env-and-stdin-of-a-git-child]].
