---
name: audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals
description: "Audit tree fingerprint hook: rev-parse, worktree list and check-ignore are now bounded, but a failed mktemp still falls back to /dev/null"
metadata:
  node_type: memory
  type: project
  keywords:
    - audit-tree-fingerprint
    - AUDIT-TAMPER
    - residual
    - fail-open
    - hook timeout
    - fsmonitor
    - unreadable blob
    - D22
    - assume-unchanged
    - skip-worktree
    - flagged paths
    - core.untrackedCache
    - core.checkStat
    - ls-files -v
    - grep walk-down
    - check-ignore
    - tilde-minus
    - OLDPWD
    - ripgrep
    - PostToolUse
    - seat_mark
    - audit-no-agent-id
  provenance: code-verified
  slug: audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.2, updated at phase-7 task 7.2, p7-polish, phase-8 (tasks 8.1, 8.2, p8-polish) and 2026-10-26-fingerprint-hook-followups/phase-1 task 1.1, phase-2 task 2.1 (read at the phase-3 release)
  tags:
    - war
    - hooks
    - audit
    - residuals
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-27T09:56:08.116Z
---

# Read this list before you touch `hooks/audit-tree-fingerprint.sh` or call it fail-closed

The hook is the D22 compensating control for the D21 `git grep -F -e <token>` admission. It landed with gaps. Phase 8 of 2026-10-20-rea-artifact-evidence and plan 2026-10-26-fingerprint-hook-followups closed most of them. Items 1, 2, 9, 11 and 13 were re-read on 2026-11-10, when the hook last changed in 71cbc73f (#2724). Verify each item before acting.

The phase-8 slice and rulings A and B are not in `docs/plans/2026-10-20-rea-artifact-evidence.md`, which ends at Phase 7. The hook's header comments are the surviving record.

## Still open

Item numbers stay stable, so older notes that cite an item still resolve.

1. **Closed** (see below).
2. **A failed `mktemp` hashes every path as `unreadable`.** `hfnew` and the batch-input temp in `blob_lines` fall back to `/dev/null`. Each path then reads `unreadable` at both ends, so a content-only edit to an already-dirty file leaves the fingerprint unchanged. Narrow window: the first `mktemp` must succeed and a later one fail. Raised as a Minor absorb and never landed.
3. **A file that cannot be hashed at either end hides an edit.** A path whose `hash-object` fails gets `unreadable` at start and at verdict. A worker can set mode 000 around both hash times and change the content.
4. **Closed** (see below).
5. **Closed for Grep, pinned open for Glob.** A Grep `path` that names a directory touches the task worktrees below it that ripgrep enters. A Glob `path` walks up only, by ruling (D5). Item 15 keeps the Grep walk open at one edge.
6. **Closed** (see below).
7. **The timeout marker, the marks and the tamper record are forgeable.** A worker's Bash can plant or delete a `!` line in `touched`, a `bash-open.*` file or `audit-no-agent-id`. A forged keyless file holds each seat started at or before it. The verdict arm prints only a cause `seat_mark` can write, so a forged mark reads `unrecognized mark`, but a forged line still prints in two shapes: one that starts with `/` in `no start record for <line>`, and one that starts with `~` in `unresolved Bash path <line>`. `main_find` reads a worktree's gitfile when git fails, so a planted gitfile can send a mark to the wrong place. `$STATE/timeout` and `$MAIN/.claude/war/audit-tamper/<agent_id>.json` sit where a worker's Bash can write. For the record, `skills/war/references/resume-and-recovery.md` now tells the Lead to cross-check `seat_verdict` against the `; seat verdict <v>` suffix on the escalated reason, which rides the engine's audit log, and to fail closed on a mismatch. That check is Lead prose, not code, and `$STATE/timeout` has no such cross-check. Narrow: a worker who can write there can already rewrite `$STATE/start`.
8. **Touched-set writes fail open.** `touch_line` returns 0 when `mkdir -p` fails and does not check the append, and a `seat_mark` write fails the same way. `compare` returns clean when `$STATE/touched` is missing.
9. **Closed** (see below).
10. **Cost grows with marked worktrees and tracked files.** SubagentStart runs `git status -uall`, one `ls-files -v -z` and one `hash-object` batch in every marked worktree for every seat. `fingerprint` runs `expired` and a case test on every `ls-files` record, so the added cost scales with tracked-file count, not flagged-path count. A Grep with a directory root adds one `check-ignore` spawn per folder on the path down to each marked worktree, cached per walk.
11. **`skills/war/assets/assert-no-submodule-mutation.sh` splits `.gitmodules` paths on whitespace.** Its `submod_paths` collection uses `awk '{print $2}'`, so a submodule path with a space breaks. `reuse_hygiene` in `provision-worktrees.sh` no longer has this bug for a single space, because it blanks `$1` and keeps the rest, but a run of spaces still collapses to one. The hook itself reads with `git config -z`.
12. **Hypothesis, not executed: `status` still trusts stat data under `core.checkStat` and `core.trustctime`.** The status call pins only `core.fsmonitor=false` and `core.untrackedCache=false`. With `core.checkStat=minimal` and `core.trustctime=false`, git would compare only whole-second mtime and size, so a same-size edit with a restored mtime would stay out of the status list, and the hook would never hash it. Pinning both keys trades coverage against extra content reads on stat-noisy filesystems, so the operator decides. Nit, disposition `note`, agent-unverified.
13. **Closed** (see below).
14. **Two backstops have no recorded discharge.** Both are in `docs/plans/2026-10-26-fingerprint-hook-followups.md`. B3 in the same plan ran on 2026-11-02. B1 re-reads the Grep and Glob ripgrep flags from the installed Claude Code binary, because the walk rule was read from 2.1.311. B2 is a live `/war` run showing no AUDIT-TAMPER caused by a sibling worktree. I found no commit that discharges either, but a backstop run may leave no commit, so that is unproven. Run them before you call the walk rule current.
15. **A glob-bearing Grep can read a worktree the walk leaves untouched.** The Grep tool's `glob` becomes a ripgrep `--glob`, and a glob override wins over ignore rules. `grep_walk` models ignore rules only, so a glob that matches an ignored folder's name reads sibling worktrees with no fingerprint compare. The operator ruled to keep the git-pattern rule (#2476, fork 2), because touching every worktree on a glob would let sibling churn raise a false AUDIT-TAMPER. Row "a glob-bearing Grep keeps the git-pattern rule" pins it, and backstop B1 rechecks it.
16. **A post payload with neither `agent_id` nor `agent_type` passes through.** It reads as the main session, so a seat's touch would be lost. The 2.1.316 bundle builds both post events through the PreToolUse field builder, so a local subagent call carries both keys. Backstop B3 proved it for real `war-auditor` seats on 2.1.316. Recheck it after a Claude Code upgrade.
17. **A Bash-arm failure with no repository leaves no mark.** With no git answer and no `.git` entry above the payload cwd, `seat_mark` only prints to stderr. A submodule worktree's gitfile names no main checkout, so that walk ends the same way. The verdict arm still escalates `no git common dir` if its own cwd fails too.
18. **The keyless mark binds sibling seats.** `$MAIN/.claude/war/audit-no-agent-id` carries no seat key, so each seat that started at or before it escalates, not only the seat that raised it. A fresh round's seats start after it and pass.
19. **A task worktree or marker removed before the touch records nothing.** `touch_path` finds a root by its `.war-task` marker, so a worker's Bash can delete the marker and the worktree stays readable and uncompared. Read, Glob and Grep share this hole. The move adds one narrow case: a worktree removed during a Bash call now records nothing at the post event. Fix shape if it matters: match the path against the worktrees in `$STATE/start` too.
20. **A failed `.gitmodules` read on a walk leaves no mark.** `task_worktrees` pipes `git config` into a loop and drops its status, so a malformed file makes a directory walk skip every submodule task worktree. A direct path touch still finds its marker.
21. **A directory link in the middle of a path touches only the target's worktree.** `link_roots` tests the whole path, so a Read of `wtA/lnk/f` with `lnk -> ../wtB/sub` touches wtB and not wtA. A hop through such a link in a middle worktree goes the same way. This needs a planted link, and a seat normally touches wtA through other calls.

## Issues filed from phase 2 of the 2026-10-26 plan

Only #2472 is still OPEN (`grep_walk` cache hits run in no row). #2470, #2471, #2473, #2474, #2475, #2476, #2477 and #2438 to #2441 are CLOSED.

## Known, fail-closed, and pinned by rows (do not file as holes)

- A Glob `path` at the run dir touches no nested worktree. Row "Glob path walks no nested worktree" pins D5. A walk would touch every sibling worktree on each Glob from the main checkout. Glob returns names only, and a later Read or Grep of a listed file touches its worktree.
- ripgrep honors more ignore files than git (`.ignore`, `.rgignore`, global excludes). The hook asks git only, so it can mark a worktree ripgrep never enters, and a sibling worker's normal edit can trip a false AUDIT-TAMPER. The plan accepts the over-touch (A2).
- A `check-ignore` error reads as not ignored, so the walk marks (PIN-6). Row "a check-ignore error inside a work tree marks the worktree below (over-touch)" pins it.
- `git diff . /dev/null` reads only `./null`, but the hook walks every nested task worktree (implied `--no-index`, rows t37, t38, t40, t43). A sibling worker's normal edit can falsely trip a seat that ran this rare form.
- A SIGTERM on `hash-object` before the deadline hashes the path `unreadable`, so the verdict reads "changed during the audit round", not `git error`. It never offers the fail-open question. No row covers it. Row d6d covers the same SIGTERM on `status` only, which reads as a git error.
- A `-C ~<name>` base or `~<name>` operand stays literal in the touched set and escalates (rows t14, t27).
- The per-record `expired` check inside `blob_lines` has no discriminating row. The plan's optional row was declined: the watchdog kills the slow call first.
- A cancel TERM in the watchdog's fork window can leave one idle `sleep` with stdio on `/dev/null`. The `bounded` header names it. A pid-reuse race at the exact deadline edge is the same kind of rare window.
- `validate-auditor-git.sh` still admits attached `-O<file>` and `-X<file>` on `git diff`. The hook touches them. Narrowing the guard was out of scope.
- A failing `ls-files` call is a git error (`fingerprint` returns 1), never an empty flagged set.

## Closed

Fixed in phase 8 (rulings of 2026-10-24) and in plan 2026-10-26-fingerprint-hook-followups, phases 1 and 2 (#2438 ruling; #2463).

- **Per-call deadline.** `bounded` kills `status`, `ls-files` and both `hash-object` calls at the remaining deadline. Rows d6 to d8. See [[bash-per-call-watchdog-under-command-substitution-needs-detached-stdio-and-an-expired-gate-on-sigterm]] and [[self-deadline-polled-between-steps-cannot-bound-one-long-blocking-call]].
- **Start-arm timeout masking a later mismatch.** `compare` holds it as pending, so any mismatch, git error or verdict-arm timeout returns first.
- **`-C` after the subcommand.** `-C` and `-C<n>` count as global only before the subcommand word.
- **A directory operand that holds task worktrees.** `implied_noindex` and `touch_operand` walk it. See [[a-path-resolver-standing-in-for-a-reader-must-follow-that-readers-rule-and-take-both-when-readers-disagree]].
- **Item 4: git's own change detection.** `fingerprint` runs `status` and `ls-files` with `core.fsmonitor=false`, and `status` also with `core.untrackedCache=false`. Each `-c` stands before `-C <wt>`. Paths with an assume-unchanged or skip-worktree tag from `ls-files -v` join the hashed data as `~<tag> <path>` records. See [[each-branch-and-per-call-override-of-a-git-bypass-guard-needs-its-own-red-row]].
- **Item 5, Grep half.** `grep_walk` touches each marked worktree below the root unless a folder strictly below the root, on the path down to it, is ignored by the repo that holds it (D4). When the root is at or under an ignored dir, every worktree below it is touched. So a no-path Grep from the main checkout meets the excluded `.claude/` first and touches no task worktree under it. See [[plain-git-check-ignore-reads-the-index-so-a-walk-that-mirrors-ripgrep-skips-must-use-no-index]].
- **Item 6: `~-`.** `tilde` returns 1 for any `~` form it cannot compute, and the verdict escalates `AUDIT-TAMPER: unverifiable fingerprint (unresolved Bash path …)`. It resolves only `~`, `~/x`, `~+` and `~+/x`. The operator ruled against reading the hook's own OLDPWD (#2440). Rows t13, t27b.
- **Header comments.** The `lexical_dir` header names a missing or non-directory component (#2441).
- **Bash records after the call runs (#2477).** Bash left the PreToolUse matcher and moved to PostToolUse and PostToolUseFailure, so a call another guard denied records nothing. A post event cannot stop the call, so a recording failure leaves a mark that the verdict arm escalates as unverifiable: a `!<cause>` line in `touched`, a `bash-open.<pid>` file a killed hook leaves behind, or the keyless file of item 18.
- **Item 1: `rev-parse` and `worktree list`.** `fingerprint` runs `git -C "$1" rev-parse HEAD` under `bounded`, and `marked_worktrees_of` runs `worktree list --porcelain` under `bcap`.
- **Item 9: pruning.** The `--prune <name>...` and `--prune --stale` argument modes remove record dirs under `$MAIN/.claude/war/audit-fingerprints/`, behind a `cd -P` real-record-tree guard.
- **Item 13: `check-ignore`.** `ignored_dir` runs `check-ignore -q --no-index` under `bounded`.
- **`grep_walk` takes both readings of the root (#2475).** The canon reading and the folded reading each walk if they name a directory. A missing root walks nothing, because its nearest ancestor would touch sibling worktrees.

## Why they shipped

Items 1 and 2 are absorb findings that fell out of the phase-7 and phase-8 fix ladder, where each round found the next neighbor of the last fix. See [[an-ask-finding-re-raised-as-major-absorb-keeps-the-ace-ladder-from-converging]], [[in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] and [[fix-round-uncommitted-leftover-is-stashed-by-pin-transfer-and-never-lands]]. The phase-3 gate audit attested the backstops `unverified`, a shape recorded in [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]].

**How to apply:** Before you call the hook fail-closed, grep the named constructs in item 2: `hfnew` and `blob_lines` hold the `/dev/null` fallback. Then read the rest of the Still open list.

Related: [[submodule-task-worktrees-are-invisible-to-a-superproject-worktree-list]], [[dirty-worktree-fingerprint-needs-blob-hashes-z-status-and-link-text-not-a-bare-status-hash]], [[git-status-in-a-live-sibling-worktree-needs-optional-locks-off]].
