---
name: a-path-resolver-standing-in-for-a-reader-must-follow-that-readers-rule-and-take-both-when-readers-disagree
description: "A resolver that stands in for several readers must take each reader's own path rule and union the results"
metadata:
  node_type: memory
  type: project
  keywords:
    - implied no-index
    - git diff two operands
    - physical vs lexical path
    - cd -P
    - symlink dotdot
    - touched set
    - task_worktree_of
    - attached short option
  provenance: code-verified
  slug: a-path-resolver-standing-in-for-a-reader-must-follow-that-readers-rule-and-take-both-when-readers-disagree
  phase: 2026-10-20-rea-artifact-evidence/phase-8 task 8.1 and p8-polish
  tags:
    - war
    - hooks
    - audit
    - guard-design
    - fail-open
  created: 2026-10-26
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-26T21:26:46.750Z
---

# Pick the reader's rule, not your own: one fix flipped the hole to the other reader

**Rule.** A touched-set resolver stands in for whatever reads the path: the Read tool, git's `--no-index` opener, git's in-repo test. These readers do not agree. Resolve each path under every reader's rule and union the roots. An extra touched worktree only adds a comparison. A missed one is a fail-open hole. This extends [[touched-set-resolver-must-cover-every-path-form-the-admitting-guard-passes]], which covers operand forms.

**1. Git implies `--no-index` per command, not per operand.** `git diff` with exactly two path operands after its options (a `--` ends the options and is not counted) implies `--no-index` when either path is outside the work tree. It then recurses into directories. The first task commit walked a directory only when that same operand was outside. So `git diff . /dev/null` from the main checkout read every task worktree and touched none. Four seats raised it as Major at the round-1 pin, each on its own. The fix is `implied_noindex`. It runs once at the subcommand word, after every global `-C` has moved the base. Rows t38 to t44 pin the cases. A seat's read-only probe showed `git diff -- . /dev/null` printing `Could not access './null'`: a directory against a file compares `<dir>/<basename>`. The hook still walks every nested worktree there. That over-touch fails closed, but a sibling worker's normal edit can trip a false AUDIT-TAMPER.

**2. A filed fix text can be narrower than the ruling.** The worker followed the fix text of a filed follow-up, which checked each operand alone. Operator ruling B said to touch every task worktree any guard-admitted operand resolves into, including a directory that holds worktrees. The seats held that the ruling outranks the fix text. That is the audit log's account. The phase-8 slice is not in `docs/plans/2026-10-20-rea-artifact-evidence.md` at the landed tip, which ends at Phase 7, so I could not read it here. When a slice folds a filed fix text and cites a ruling, build from the ruling's wording and test against the tool's own rule.

**3. Attached short options carry file values.** `git diff -O<orderfile>` and `git ls-files -X<exclude-file>` read a file. The Bash arm sent every `-*` token to a no-touch flag arm. git reads a cluster letter by letter, so `-pO<file>` reads the file too. The landed arm takes the text after the first file-valued letter (`O`, `X`, `S`) with a shortest-prefix cut. A non-path tail resolves to the base, which is already touched. Rows t31b to t31g pin it. Rows t31f and t31g exist to turn red under a longest-prefix mutant.

**4. Physical against lexical reading.** `canon` was `cd` in its default mode, which folds `lnk/..` as text. The kernel and git's `--no-index` open resolve `lnk/..` as the parent of the link's target. The a6 ace commit made `canon` use `cd -P`. That flipped the hole. The Read tool resolves `..` as text (`/var/../private/etc/hosts` opens), and git's in-repo test (`path_inside_repo`, `normalize_path_copy`) is lexical too. The fix commit's claim that no caller needs logical resolution was false, because the Read arm and the Glob and Grep arm also reach `canon`. Polish then added a text-fold reading. The nearest-existing-ancestor walk was itself physical, so a multi-`..` path through a planted link, and a `..` after a missing component, still escaped. The landed `lexical_dir` folds `.` and `..` as text first and walks up afterward. `task_worktree_of` and `outside_top` take both readings. The walk-down in `touch_operand` reads only the physical form, because git opens `--no-index` operands physically.

**5. A test oracle that runs the real tool.** Rows t38 and t41 run git in the fixture and assert on its stderr: two operands never print `outside repository`, three do. Those rows share no code with the hook. If a git release changes the rule, they go red.

**Pattern across the ladder.** Task 8.1 took eight commits. Each round found the next neighbor of the last fix. Reading the guard's grammar and each reader's rule up front ends that. The two-reading union ended it here.

**Not run.** Whether `git diff -pO<file>` accepts a cluster, and the `~-` against OLDPWD case, rest on seat reasoning. See [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]].

**Locate-cue (verify still present before acting).** In `hooks/audit-tree-fingerprint.sh`: `canon`, `lexical_dir`, `task_worktree_of`, `outside_top`, `implied_noindex`, `touch_operand`, and the `-[!OXS]*[OXS]?*` arm in the Bash token loop. In `hooks/audit-tree-fingerprint.test.sh`: rows t30b to t30e, t31b to t31g and t38 to t44. Found at landed tip c01f2b9022b2 on `dev/2026-10-20-rea-artifact-evidence`, read through the run-scoped `_refinery` worktree (its HEAD equaled the tip).
