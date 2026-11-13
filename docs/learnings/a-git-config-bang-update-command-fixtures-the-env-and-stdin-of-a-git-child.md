---
name: a-git-config-bang-update-command-fixtures-the-env-and-stdin-of-a-git-child
description: A submodule.<name>.update !command fixture proves a stdin or env guard on a git call
metadata:
  node_type: memory
  type: project
  keywords:
    - unfixturable guard
    - stdin guard test
    - GIT_TERMINAL_PROMPT test
    - submodule.update bang command
    - "</dev/null row"
    - mutation proof
    - file-URL fixture
    - cannot be built claim
  provenance: code-verified
  slug: a-git-config-bang-update-command-fixtures-the-env-and-stdin-of-a-git-child
  phase: 2026-11-08-shell-floors-tests-and-lint/phase-1 (task 1.6)
  tags:
    - testing
    - shell-tests
    - git
    - submodules
  created: 2026-11-13
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-13T19:00:52.056Z
---

# A `!command` submodule update makes a git child observable

A worker twice called a `</dev/null` guard unfixturable with local file-URL repos.
The claim was wrong.
`git config submodule.<name>.update '!<cmd>'` makes `git submodule update` run `<cmd>` inside the submodule.
That child inherits git's stdin and environment, and it needs no remote.

**Stdin guard.** Set the update to `!cat >/dev/null; :`.
Without `</dev/null`, `cat` eats the loop's heredoc, and a later submodule stays uninitialized.
The trailing `; :` absorbs the SHA argument git appends.

**Env guard.** Set the update to write `${GIT_TERMINAL_PROMPT-unset}` to a file, then assert the file reads `0`.
Run the script under `env -u GIT_TERMINAL_PROMPT`, so a host export cannot mask a dropped prefix.

**Also.** A Done-when `grep -q 'GIT_TERMINAL_PROMPT=0'` passed on the header comment alone.
A token grep proves nothing about the call site, see [[a-phrase-grep-end-state-passes-on-a-sentence-that-negates-the-phrase]].

**How to apply.** Before you write "cannot be built" in a commit body, look for a config hook that runs a command in the child.

Locate-cue: verify still present before acting. The `HYG.stdin` row and the `reuse-gap(submodules-ready): the init runs with GIT_TERMINAL_PROMPT=0` row in `skills/war/assets/provision-worktrees.core.test.sh` @ phase 1, landed tip d2fafed7.

Related: [[fix-the-finding-class-not-the-site-and-prove-every-new-guard-red-before-commit]], [[weak-test-assertion-passes-without-feature-being-exercised]], [[a-path-handed-to-git-after-double-dash-is-a-glob-pathspec-so-set-git-literal-pathspecs]].
