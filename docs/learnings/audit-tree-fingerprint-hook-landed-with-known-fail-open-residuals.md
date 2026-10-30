---
name: audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals
description: "Audit tree fingerprint hook: git change detection, the Grep walk-down and ~- are closed, but rev-parse, the mktemp fallback and check-ignore stay unbounded"
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
  provenance: code-verified
  slug: audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.2, updated at phase-7 task 7.2, p7-polish, phase-8 (tasks 8.1, 8.2, p8-polish) and 2026-10-26-fingerprint-hook-followups/phase-1 task 1.1, phase-2 task 2.1 (read at the phase-3 release)
  tags:
    - war
    - hooks
    - audit
    - residuals
    - ask-unruled
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-27T09:56:08.116Z
---

# Read this list before you touch `hooks/audit-tree-fingerprint.sh` or call it fail-closed

The hook is the D22 compensating control for the D21 `git grep -F -e <token>` admission. It landed with gaps. Phase 8 of 2026-10-20-rea-artifact-evidence and plan 2026-10-26-fingerprint-hook-followups closed most of them. Items 1 to 13 and the pinned rows below were re-read at master 6a5586ea (0.21.21). The hook's last change is 072e05b1 (#2463), so verify each item before acting if the hook has moved since.

The phase-8 slice and rulings A and B are not in `docs/plans/2026-10-20-rea-artifact-evidence.md`, which ends at Phase 7. The hook's header comments are the surviving record.

## Still open

Item numbers stay stable, so older notes that cite an item still resolve.

1. **`git rev-parse HEAD` and `git worktree list` are outside the watchdog.** `bounded` wraps `status`, `ls-files` and both `hash-object` calls. `fingerprint` runs `git -C "$1" rev-parse HEAD` bare, and `marked_worktrees_of` runs `worktree list --porcelain` bare. A seat's trigger: a worker makes a worktree gitdir's HEAD a FIFO (worker Bash writes are advisory only, ADR 0002), so `rev-parse` never returns and the 600 s kill lands. Not executed. The DEADLINE header scopes its "one slow call" claim to the three bounded verbs, so it does not overclaim, but the hole stays. The security seat's absorb finding never landed.
2. **A failed `mktemp` hashes every path as `unreadable`.** `hfnew` and the batch-input temp in `blob_lines` fall back to `/dev/null`. Each path then reads `unreadable` at both ends, so a content-only edit to an already-dirty file leaves the fingerprint unchanged. Narrow window: the first `mktemp` must succeed and a later one fail. Raised as a Minor absorb and never landed.
3. **A file that cannot be hashed at either end hides an edit.** A path whose `hash-object` fails gets `unreadable` at start and at verdict. A worker can set mode 000 around both hash times and change the content.
4. **Closed** (see below).
5. **Closed for Grep, pinned open for Glob.** A Grep `path` that names a directory touches the task worktrees below it that ripgrep enters. A Glob `path` walks up only, by ruling (D5). #2475 and #2476 keep the Grep walk open at its edges.
6. **Closed** (see below).
7. **The timeout marker and the tamper record are forgeable.** `$STATE/timeout` and `$MAIN/.claude/war/audit-tamper/<agent_id>.json` sit where a worker's Bash can write. For the record, `skills/war/references/resume-and-recovery.md` now tells the Lead to cross-check `seat_verdict` against the `; seat verdict <v>` suffix on the escalated reason, which rides the engine's audit log, and to fail closed on a mismatch. That check is Lead prose, not code, and `$STATE/timeout` has no such cross-check. Narrow: a worker who can write there can already rewrite `$STATE/start`.
8. **Touched-set writes fail open.** `touch_line` returns 0 when `mkdir -p` fails and does not check the append. `compare` returns clean when `$STATE/touched` is missing.
9. **State dirs are never pruned.** No `rm -rf` of `$MAIN/.claude/war/audit-fingerprints/<agent_id>/` appears in the file. About 8 KB per seat run.
10. **Cost grows with marked worktrees and tracked files.** SubagentStart runs `git status -uall`, one `ls-files -v -z` and one `hash-object` batch in every marked worktree for every seat. `fingerprint` runs `expired` and a case test on every `ls-files` record, so the added cost scales with tracked-file count, not flagged-path count. A Grep with a directory root adds one `check-ignore` spawn per folder on the path down to each marked worktree, cached for the call.
11. **`assert-no-submodule-mutation.sh` splits `.gitmodules` paths on whitespace.** Its path collection uses `awk '{print $2}'`, so a submodule path with a space breaks. `reuse_hygiene` in `provision-worktrees.sh` no longer has this bug for a single space, because it blanks `$1` and keeps the rest, but a run of spaces still collapses to one. The hook itself reads with `git config -z`.
12. **Hypothesis, not executed: `status` still trusts stat data under `core.checkStat` and `core.trustctime`.** The status call pins only `core.fsmonitor=false` and `core.untrackedCache=false`. With `core.checkStat=minimal` and `core.trustctime=false`, git would compare only whole-second mtime and size, so a same-size edit with a restored mtime would stay out of the status list, and the hook would never hash it. Pinning both keys trades coverage against extra content reads on stat-noisy filesystems, so the operator decides. Nit, disposition `note`, agent-unverified.
13. **Hypothesis, not executed: `ignored_dir`'s `check-ignore` runs outside `bounded`.** If it hung (a FIFO planted as an ignore file in a folder on the walk), the PreToolUse arm would run to the hook timeout and the walk-down touches not yet recorded would be lost. D3 (PIN-3) names only the `ls-files` call. Fix shape if it matters: route the call through `bounded`, and treat a deadline hit as not ignored, which marks.
14. **Two backstops have no recorded discharge.** Both are in `docs/plans/2026-10-26-fingerprint-hook-followups.md`. B1 re-reads the Grep and Glob ripgrep flags from the installed Claude Code binary, because the walk rule was read from 2.1.311. B2 is a live `/war` run showing no AUDIT-TAMPER caused by a sibling worktree. I found no commit that discharges either, but a backstop run may leave no commit, so that is unproven. Run them before you call the walk rule current.

## Open issues filed from phase 2 of the 2026-10-26 plan

All OPEN in gh at 0.21.21. The hook has not changed since, so none is fixed.

- #2475: `grep_walk` resolves the search root through `canon` only, while `touch_path` takes both readings.
- #2476: unruled ask. Should a glob-bearing Grep touch every worktree below the root?
- #2477: the hook records tokens of a Bash call that `validate-auditor-git.sh` denied, which raises a false AUDIT-TAMPER.
- #2470: the `grep_walk` header says ripgrep never applies an ignore rule below an explicit root, which contradicts its own next sentences and rows gw3 and gw5.
- #2474: the `outside_top` header still lists only a planted link or a missing component.
- #2471 and #2472: `grep_walk` cache hits and the relative-path branch run in no row.
- #2473: a worker report's row count differs from the pinned diff. Bookkeeping, not a hook gap.

#2438 to #2441 are also still OPEN in gh, though their code landed in phases 1 and 2. Read them as unclosed tickets, not open defects.

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

## Why they shipped

Items 1 and 2 are absorb findings that fell out of the phase-7 and phase-8 fix ladder, where each round found the next neighbor of the last fix. See [[an-ask-finding-re-raised-as-major-absorb-keeps-the-ace-ladder-from-converging]], [[in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] and [[fix-round-uncommitted-leftover-is-stashed-by-pin-transfer-and-never-lands]]. The phase-3 gate audit attested the backstops `unverified`, a shape recorded in [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]].

**How to apply:** Before you call the hook fail-closed, grep the named constructs in items 1, 2 and 13. `fingerprint` and `marked_worktrees_of` hold the bare calls, `hfnew` and `blob_lines` hold the `/dev/null` fallback, and `ignored_dir` holds the bare `check-ignore`.

Related: [[submodule-task-worktrees-are-invisible-to-a-superproject-worktree-list]], [[dirty-worktree-fingerprint-needs-blob-hashes-z-status-and-link-text-not-a-bare-status-hash]], [[git-status-in-a-live-sibling-worktree-needs-optional-locks-off]].
