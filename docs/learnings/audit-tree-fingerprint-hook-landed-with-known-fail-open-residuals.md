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

The hook is the D22 compensating control for the D21 `git grep -F -e <token>` admission. Phase 6 landed it with gaps. Phase 8 (tasks 8.1, 8.2 and p8-polish, built on the operator rulings of 2026-10-24) closed six of the seven phase-7 items. Plan 2026-10-26-fingerprint-hook-followups phase 1 then closed item 4, and its phase 2 closed items 5 and 6. Items 1 and 2 were re-read at the phase-3 (release) tip of that plan, `dev/2026-10-26-fingerprint-hook-followups` at 1f7eff5d9411. The read went through the run-scoped `_refinery` worktree. Its HEAD was 875c5f1d14e2, the audited release commit and the second parent of the landed merge. The merge's first parent is an ancestor of that commit, so the trees should match, but I did not compare them. Items 3 and 7 to 11 were last read at c01f2b9022b2 on `dev/2026-10-20-rea-artifact-evidence`. The session checkout was on an unrelated branch every time. Verify each item before acting.

The phase-8 slice and rulings A and B are not in `docs/plans/2026-10-20-rea-artifact-evidence.md` at the tip, which ends at Phase 7. The hook's header comments and the `CHANGELOG.md` head entry are the surviving record.

## Still open at the phase-3 tip of the 2026-10-26 plan

1. **`git rev-parse HEAD` and `git worktree list` are outside the watchdog.** `bounded` wraps `git status`, `git ls-files` and both `hash-object` calls. `fingerprint` still runs `git -C "$1" rev-parse HEAD` bare, and `marked_worktrees_of` runs `worktree list --porcelain` bare. A seat's trigger: a worker makes a worktree gitdir's HEAD a FIFO (worker Bash writes are advisory only, ADR 0002), so `rev-parse` never returns and the 600 s kill lands. Not executed here. The plan slice's operative clause names only `status` and `hash-object`, so audit seats rated it a note. The DEADLINE header still says "one slow call cannot carry the hook past the deadline", which reads wider than that. The security seat's absorb finding for it never landed. The 2026-10-26 plan's PIN-3 covers only NEW git calls, so it did not reach these two.
2. **A failed `mktemp` hashes every path as `unreadable`.** `hfnew` and the batch-input temp in `blob_lines` fall back to `/dev/null` when `mktemp` fails. Each path then reads `unreadable` at both ends, so a content-only edit to an already-dirty file leaves the fingerprint unchanged. `fingerprint` maps only a `blob_lines` return of 3, and returns 1 only on its own earlier `mktemp` failure. The window is narrow: the first `mktemp` must succeed and a later one fail. Raised as a Minor absorb in round 1 and never landed.
3. **A file that cannot be hashed at either end hides an edit.** A path whose `hash-object` fails gets `unreadable` at start and at verdict. A worker can set mode 000 around both hash times and change the content. This rule dates from phase 6.
4. **Closed.** The fingerprint no longer trusts git's own change detection for fsmonitor, the untracked cache, assume-unchanged or skip-worktree. See the closed section below. Item numbers stay stable so older notes that cite "item 5" or "item 6" still resolve.
5. **Closed for Grep, pinned open for Glob.** A Grep `path` that names a directory now touches the task worktrees below it that ripgrep enters. See the phase-2 closed section below. A Glob `path` still walks up only, by ruling (D5): see the pinned rows section.
6. **Closed.** `~-` and `~-/x` are unresolved now, like `~<name>`. See the phase-2 closed section below.
7. **The timeout marker and the seat verdict on the tamper record are forgeable.** `$STATE/timeout` and `$MAIN/.claude/war/audit-tamper/<agent_id>.json` sit where a worker's Bash can write. The fail-open branch in `skills/war/references/resume-and-recovery.md` accepts the record's `seat_verdict` with no cross-check, though the timeout reason now carries the seat verdict into the engine's audit log, which no worker can write, so the Lead can cross-check it. Narrow: a worker who can write there can already rewrite `$STATE/start`.
8. **Touched-set writes fail open.** `touch_line` returns 0 when `mkdir -p` fails and does not check the append. `compare` returns clean when `$STATE/touched` is missing.
9. **State dirs are never pruned.** No `rm -rf` of `$MAIN/.claude/war/audit-fingerprints/<agent_id>/` appears in the file. About 8 KB per seat run.
10. **Cost grows with marked worktrees.** SubagentStart runs `git status -uall`, one `git ls-files -v -z` and one `hash-object` batch in every marked worktree for every seat. Each bounded call adds a `sleep` spawn and a kill, and each touched path costs about four forks. `ls-files -v -z` lists every tracked path, and `fingerprint` runs `expired` and a case test on each record, so the added cost scales with tracked-file count, not with flagged-path count. A Grep with a directory root adds one `check-ignore` spawn per folder on the path down to each marked worktree. `grep_walk` caches each answer for the call, and the worktrees under one ignored dir cost one spawn.
11. **Sibling `.gitmodules` readers split on whitespace.** `reuse_hygiene` in `skills/war/assets/provision-worktrees.sh` and `skills/war/assets/assert-no-submodule-mutation.sh` break on a submodule path with a space. Not re-read at the phase-8 tip. The hook itself reads with `git config -z`.
12. **Hypothesis, not executed: `status` still trusts stat data under `core.checkStat` and `core.trustctime`.** The status call pins only `core.fsmonitor=false` and `core.untrackedCache=false`. The correctness seat read git's stat-match rule and did not run it. With `core.checkStat=minimal` and `core.trustctime=false`, git would compare only whole-second mtime and size, so a same-size edit with a restored mtime would stay out of the status list. The hook hashes only status-listed and flagged paths, so it would never hash that edit. The plan and the #2438 ruling name fsmonitor, the untracked cache and flagged paths only. Pinning both keys trades coverage against extra content reads on stat-noisy filesystems, so the operator decides. Disposition `note`, Nit. Agent-unverified.
13. **Hypothesis, not executed: the Grep arm's `check-ignore` calls run outside `bounded`.** `ignored_dir` runs `git -c core.fsmonitor=false -C <dir> check-ignore -q --no-index` bare, with no watchdog. Plan decision D3 (PIN-3) names only the new `ls-files` call. The Commander's Intent guardrail reads wider ("every new git call on the fingerprint path"). I read "fingerprint path" as the start and verdict arms, so I do not call this a plan deviation. If such a call hung (a FIFO planted as an ignore file in a folder on the walk), the PreToolUse arm would run to the hook timeout. The root's own `touch_path` already ran, but the walk-down touches not yet recorded would be lost. That outcome is my reading of the arm's shape. No audit seat raised it in the logs I saw, and nothing ran it. Fix shape if it matters: route the call through `bounded`, and treat a deadline hit as not ignored, which marks.
14. **Two backstops stay unread at the release.** B1 re-reads the Grep and Glob ripgrep flags at the first Claude Code upgrade after 0.21.19, because the walk rule was read from the 2.1.311 binary. B2 reads `$MAIN/.claude/war/audit-tamper/` at the first live `/war` Checkpoint, for a false AUDIT-TAMPER from a sibling worktree. The phase-3 gate audit attested both `unverified`. No artifact at the tip can discharge a backstop. Run them before you call the walk rule current.

## Known, fail-closed, and pinned by rows (do not file as holes)

- A Glob `path` at the run dir touches no nested worktree. Row "Glob path walks no nested worktree" pins the ruling (D5). With default flags ripgrep recurses from every path, so a walk would touch every sibling worktree on each Glob from the main checkout. Glob returns names only, and a later Read or Grep of a listed file touches its worktree.
- ripgrep honors more ignore files than git does (`.ignore`, `.rgignore`, global excludes). The hook asks git only, so it can call a folder not ignored where ripgrep skips it. That marks a worktree ripgrep never enters. A sibling worker's normal edit can then trip a false AUDIT-TAMPER. The plan accepts the gap on the over-touch side (A2).
- A `check-ignore` error reads as not ignored, so the walk marks (PIN-6). Row "a check-ignore error inside a work tree marks the worktree below (over-touch)" pins it with a git shim that exits 128. Git's own "not a git repository" exit for a folder no work tree holds takes the same branch.
- `git diff . /dev/null` reads only `./null`, but the hook walks every nested task worktree (implied `--no-index`, rows t37, t38, t40, t43). A sibling worker's normal edit can falsely trip a seat that ran this rare form.
- A SIGTERM on `hash-object` before the deadline hashes the path `unreadable`, so the verdict reads "changed during the audit round" and not `git error`. It never offers the fail-open question. No row covers it.
- A `-C ~<name>` base leaves `_base` empty. The literal touched line already escalates the verdict (row t27).
- The per-record `expired` check inside `blob_lines` has no discriminating row. The plan's optional third-dirty-path row was declined: the watchdog kills the slow call first.
- A cancel TERM landing in the watchdog's fork window can leave one idle `sleep`. Its stdio is on `/dev/null`, so it holds no pipe. The `bounded` header names it. A pid-reuse race at the exact deadline edge is the same kind of rare window.
- `validate-auditor-git.sh` still admits attached `-O<file>` and `-X<file>`. The hook touches them now. Narrowing the guard was out of scope.
- A failing `ls-files` call is a git error (`fingerprint` returns 1), never an empty flagged set. A shim row pins it (see the closed section).

## Closed in phase 8

- **One git call outrunning the deadline.** `bounded` kills `status` and both `hash-object` calls at the remaining deadline. See [[bash-per-call-watchdog-under-command-substitution-needs-detached-stdio-and-an-expired-gate-on-sigterm]] and [[self-deadline-polled-between-steps-cannot-bound-one-long-blocking-call]]. Rows d6, d6b (batch), d6c (single path), d6d (SIGTERM before the deadline), d7 and d8 now reach the mid-hash arms the phase-7 list said no row reached.
- **A start-arm timeout masking a later mismatch.** `compare` now holds the start-arm timeout as pending (`P_REASON`). A mismatch, git error, unresolved path or verdict-arm timeout on any touched worktree returns first. The start arm writes `$STATE/timeout-skipped`, so a worktree skipped on a git error or created after the start keeps `no start record`.
- **A `-C` after the subcommand moving the base.** The Bash token loop has a `_sub` flag. `-C` and `-C<n>` are global only before the subcommand word.
- **A directory operand that holds task worktrees.** `implied_noindex` and `touch_operand` walk it. See [[a-path-resolver-standing-in-for-a-reader-must-follow-that-readers-rule-and-take-both-when-readers-disagree]].
- **Two overclaiming comments.** The test comment above the `hooks.json` timeout row is gone. The DEADLINE header now says the clamp bounds the deadline value.
- **Also landed:** attached short-option file values (`-O<f>`, cluster `-pO<f>`), the `10#` deadline normalization, and the physical plus lexical path readings.

## Closed in plan 2026-10-26-fingerprint-hook-followups, phase 1 (task 1.1, issue #2438 ruling)

- **Git's own change detection is off on the fingerprint path.** `fingerprint` runs `git -c core.fsmonitor=false -C <wt> ls-files -v -z` and `git -c core.fsmonitor=false -c core.untrackedCache=false -C <wt> status --porcelain=v1 -z -uall`. A `core.fsmonitor` command in a worktree config no longer runs inside the hook. Each `-c` stands before `-C <wt>`, so `-C` stays next to the subcommand word.
- **Flagged paths are hashed as if dirty.** A path whose `ls-files -v` tag is a lowercase letter (assume-unchanged) or `S` (skip-worktree) joins the hashed data. Both flags on one path give the tag `s`, which the lowercase class covers. `fingerprint` appends one synthesized `~<tag> <path>` record per flagged path to the status temp file, and `blob_lines` hashes it like a status record. `~` is never a status column, so the two cannot collide. The flagged set itself is hashed data, so a flag set mid-round changes the fingerprint.
- **The `ls-files` call runs under `bounded`.** A deadline hit returns 3 (the timeout reason). Any other non-zero exit returns 1 (a git error), never an empty flagged set. The test shim's `ls-files` arm honors `SHIM_SLOW` and `SHIM_FAIL`.
- **Status still lists a staged change to a flagged path.** The two flags suppress only the worktree-versus-index comparison. Three comments first said status never lists a flagged path. A round-2 audit fix reworded them to "never reports a worktree edit". This is the correctness seat's reading of git's diff-index behavior and was not executed.
- **How it landed.** One task, four commits, and the approve verdict records `fixRounds` 0. Four audit pins ran in turn. Round 1 raised ten findings, and all four seats independently flagged the same DEADLINE-header wording. The fourth pin raised none. The comment findings from rounds 1 and 2 were reworded before land. See [[each-branch-and-per-call-override-of-a-git-bypass-guard-needs-its-own-red-row]] for the test gaps the seats found.

## Closed in plan 2026-10-26-fingerprint-hook-followups, phase 2 (task 2.1, issues #2439, #2440, #2441)

I read these at the phase-3 tip. I did not see the phase-2 audit log, so I record what the code and the suite hold, not how the audit ran.

- **A Grep `path` that is a directory now walks down.** `grep_walk` touches each marked task worktree below the search root that ripgrep enters. Decision D4 is a per-folder rule. A worktree is touched unless a folder strictly below the root, on the path down to it, is ignored by the repo that holds that folder. When the root is at or under an ignored dir, every worktree below it is touched. The Grep tool runs ripgrep with `--hidden` and no `--no-ignore`, and an explicit search root is never subject to an ignore rule at or below it. The plan read those flags from the Claude Code 2.1.311 binary. See [[plain-git-check-ignore-reads-the-index-so-a-walk-that-mirrors-ripgrep-skips-must-use-no-index]] for how `ignored_dir` asks git.
- **The live false-halt case is closed.** A no-path Grep from the main checkout, a Grep with `path` = the main checkout, and a Grep at its parent dir meet the excluded `.claude/` first and touch no task worktree under it. Busy sibling workers cause no false AUDIT-TAMPER from a seat's Grep. Backstop B2 is still unread (item 14).
- **`~-` and `~-/x` fail closed.** `tilde` returns 1 for any word-initial `~` form it cannot compute, and the caller records the token literal. The verdict arm escalates `AUDIT-TAMPER: unverifiable fingerprint (unresolved Bash path …)`. The shell expands `~-` from OLDPWD, and the payload carries only the cwd. The resolved forms are `~`, `~/x`, `~+` and `~+/x`. Row t13 asserted the rejected reading and flipped to the `-C ~-/<path>` literal-and-escalate reading. A new row, t27b, covers the `~-/<path>` operand. The operator ruled to reject reading the hook's own OLDPWD (#2440).
- **The comment sweep was a named End state.** Seven comment sites said `~-` resolves from the payload cwd, or named `~<name>` as the only unresolved tilde form. The plan listed them: the PURPOSE header (2) and (3), the STATE touched-file note, the `implied_noindex` header, the `tilde` header, the Bash-arm tokenizer comments and the test comment above t12. The check for this End state is judged, not run, because a grep cannot tell whether a comment's claim is true.
- **The `lexical_dir` header names a missing or non-directory component.** One word fix (#2441). The code already handled the case. The header also says `grep_walk` reads only the physical form, because ripgrep opens its search root through the kernel.
- **Release.** Phase 3 bumped 0.21.18 to 0.21.19 in one task with no fix round. Two audit seats approved with no findings. The gate audit attested End states 14 and 15 met, and 13, 16 and 17 `unverified`. State 13 is gate-only and no gate artifact reached that dispatch. States 16 and 17 are backstops. See [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]] for that recurring shape.

## Why they shipped

Items 1 to 3 of the phase-7 list were audit findings that the phase-7 fix rounds never closed. See [[an-ask-finding-re-raised-as-major-absorb-keeps-the-ace-ladder-from-converging]]. The operator ruled the fork on 2026-10-24, and phase 8 built on the rulings. Task 8.1 still took eight commits on one branch, because each round found the next neighbor of the last fix. Then p8-polish drained the last absorb findings in two rounds. Items 1 and 2 above are absorb-disposition findings that fell out of that ladder. See also [[in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] and [[fix-round-uncommitted-leftover-is-stashed-by-pin-transfer-and-never-lands]].

**Locate-cue (verify still present before acting).** In `hooks/audit-tree-fingerprint.sh`: `fingerprint` runs `git -C "$1" rev-parse HEAD` with no `bounded`. `marked_worktrees_of` runs `git -C "$1" worktree list --porcelain` bare. `hfnew` has the `_hf=/dev/null` fallback, and so does the batch temp in `blob_lines`. `ignored_dir` runs `git -c core.fsmonitor=false -C <dir> check-ignore -q --no-index` with no `bounded`. All found at the phase-3 tip, through the `_refinery` worktree at 875c5f1d14e2. Also found there: both `fingerprint` git calls carry `-c core.fsmonitor=false`, the case arm `[[:lower:]]\ *|S\ *` filters the flagged tags, and the status call carries `-c core.untrackedCache=false`. The Glob and Grep arm calls `touch_path`, then `grep_walk` for Grep only. `tilde` returns 1 on any `~` form it does not resolve. Gone since 06ef13c17545: the `touch_path`-only Glob and Grep arm and the `~-` to `$cwd` mapping.

Related: [[submodule-task-worktrees-are-invisible-to-a-superproject-worktree-list]], [[dirty-worktree-fingerprint-needs-blob-hashes-z-status-and-link-text-not-a-bare-status-hash]], [[git-status-in-a-live-sibling-worktree-needs-optional-locks-off]].
