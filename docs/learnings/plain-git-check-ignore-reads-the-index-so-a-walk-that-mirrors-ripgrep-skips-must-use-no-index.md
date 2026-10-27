---
name: plain-git-check-ignore-reads-the-index-so-a-walk-that-mirrors-ripgrep-skips-must-use-no-index
description: "Plain git check-ignore reads the index, so a hook walk that mirrors ripgrep skips must ask with --no-index"
metadata:
  node_type: memory
  type: project
  keywords:
    - check-ignore
    - "--no-index"
    - ripgrep
    - grep walk-down
    - excluded dir
    - tracked content
    - fsmonitor
    - vacuous fixture
  provenance: code-verified
  slug: plain-git-check-ignore-reads-the-index-so-a-walk-that-mirrors-ripgrep-skips-must-use-no-index
  phase: 2026-10-26-fingerprint-hook-followups/phase-2 task 2.1 (read at the phase-3 release)
  tags:
    - war
    - hooks
    - audit
    - git
    - testing
  created: 2026-10-27
  originSessionId: a0630eb5-4cbe-4285-9e36-47dec6a15717
  modified: 2026-10-27T09:55:04.493Z
---

# Ask git by pattern, not by index, when a hook predicts what ripgrep skips

**Rule.** A hook that must predict whether ripgrep enters a folder asks git with `check-ignore --no-index`. Plain `check-ignore` reads the index. Once any file under an excluded dir is tracked, the plain call says that dir is not ignored. ripgrep still skips it. A walk built on the plain call then under-touches, and an under-touch is a fail-open hole.

**The case.** The audit tree fingerprint hook's Grep arm touches the task worktrees that the Grep tool's ripgrep would enter. Task worktrees sit under `.claude/war-worktrees/`, and `provision-worktrees.sh ensure-exclude` excludes `.claude/`. This repo tracks `.claude/war/config.json`.

**Evidence.**
- The red-team probe ran on git 2.54.0 at plan time. I did not re-run it. Once a file under `.claude/` is tracked, plain `check-ignore` calls `.claude` not ignored. It still calls `.claude/war-worktrees` ignored. `--no-index` calls both ignored.
- The suite re-checks this on every run. An oracle row runs real git, independent of the hook, and goes red if the plain and `--no-index` answers agree. The phase-3 merge gate ran the discovered suites at 875c5f1d14e2 and exited 0, by the audit log's account.

**Companion traps, all pinned in the hook or its suite.**
1. **Run every `check-ignore` with `-c core.fsmonitor=false`.** The red-team sentinel probe showed that `check-ignore` and `ls-files -v` each run a configured `core.fsmonitor` command, as `status` does. `GIT_OPTIONAL_LOCKS=0` does not stop them. `rev-parse`, `worktree list` and `hash-object` never run it.
2. **Ask from the folder's parent with a `./<name>/` operand.** The `./` keeps a leading `:` from reading as pathspec magic. The trailing `/` lets a `dir/` pattern match. The repo that holds the folder answers, and git's leading-directory check makes a folder under an ignored dir ignored too.
3. **A folder with a `.git` entry is a repo root.** It is never ignored, and the hook spawns nothing for it. Any non-zero `check-ignore` exit reads as not ignored, so an error or a folder no work tree holds marks the worktree below. That is the over-touch direction.
4. **ripgrep applies no ignore rule at or below an explicit search root.** So the walk has two cases. A root at or under an ignored dir marks every worktree below it. Any other root marks a worktree unless a folder strictly below the root, on the path down, is ignored.
5. **Place the tracked fixture file off the walk path.** The suite commits `.claude/war/config.json`, never a file under `.claude/war-worktrees/`. A tracked file under the walk path makes plain `check-ignore` call every folder on that path not ignored. The row would then pass under the regression it exists to catch.
6. **Pin the flags with a structural row.** `--no-index` never reads the index, so no behavior row can fail on it. The row greps the hook's non-comment `check-ignore` lines and checks that each carries both flags.
7. **Make each negative row prove it can fail.** It first asserts the worktree is in the seat's start record. See [[negative-assert-on-a-fixture-that-cannot-carry-the-offender-is-vacuous-and-a-label-count-a-fix-round-also-satisfies]].

**Gaps the plan accepts.** ripgrep honors more ignore files than git does (`.ignore`, `.rgignore`, global excludes), so the hook can mark a worktree ripgrep never enters. That is the safe side, but a sibling worker's normal edit can then trip a false AUDIT-TAMPER. The Grep flags were read from the Claude Code 2.1.311 binary strings, so the rule is bound to that version. Backstop B1 re-reads them at the next upgrade.

**How to apply.** Before you add a hook arm that decides "would tool X enter folder F":
- Read X's ignore flags from the shipped binary.
- Ask git with `--no-index` and `-c core.fsmonitor=false`.
- Add an oracle row where plain and `--no-index` disagree.
- Put the tracked fixture file off the walk path.

**Locate-cue (verify still present before acting).** In `hooks/audit-tree-fingerprint.sh`: `ignored_dir` and `grep_walk`. In `hooks/audit-tree-fingerprint.test.sh`: the rows titled "oracle: with tracked content, plain check-ignore calls .claude not ignored and --no-index calls it ignored", "Grep path at the excluded dir with tracked content walks down" and "check-ignore calls are pattern-only". Found at the phase-3 tip of `dev/2026-10-26-fingerprint-hook-followups` (1f7eff5d9411), read through the run-scoped `_refinery` worktree at 875c5f1d14e2, the audited release commit and second parent of that merge.

Related: [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]], [[touched-set-resolver-must-cover-every-path-form-the-admitting-guard-passes]], [[a-path-resolver-standing-in-for-a-reader-must-follow-that-readers-rule-and-take-both-when-readers-disagree]], [[git-status-in-a-live-sibling-worktree-needs-optional-locks-off]].
