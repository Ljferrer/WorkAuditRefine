---
name: audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals
description: "Audit tree fingerprint hook: git change detection is now off, but rev-parse, the mktemp fallback, the Grep walk-down and ~- stay open"
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
  provenance: code-verified
  slug: audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.2, updated at phase-7 task 7.2, p7-polish, phase-8 (tasks 8.1, 8.2, p8-polish) and 2026-10-26-fingerprint-hook-followups/phase-1 task 1.1
  tags:
    - war
    - hooks
    - audit
    - residuals
    - ask-unruled
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-27T07:19:01.012Z
---

# Read this list before you touch `hooks/audit-tree-fingerprint.sh` or call it fail-closed

The hook is the D22 compensating control for the D21 `git grep -F -e <token>` admission. Phase 6 landed it with gaps. Phase 8 (tasks 8.1, 8.2 and p8-polish, built on the operator rulings of 2026-10-24) closed six of the seven phase-7 items. Plan 2026-10-26-fingerprint-hook-followups phase 1 then closed item 4. Items 1, 2, 5 and 6 were re-read at landed tip 06ef13c17545 on `dev/2026-10-26-fingerprint-hook-followups`, through the run-scoped `_refinery` worktree (its HEAD equaled the tip). Items 3 and 7 to 11 were last read at c01f2b9022b2 on `dev/2026-10-20-rea-artifact-evidence`. The session checkout was on an unrelated branch both times. Verify each item before acting.

The phase-8 slice and rulings A and B are not in `docs/plans/2026-10-20-rea-artifact-evidence.md` at the tip, which ends at Phase 7. The hook's header comments and the `CHANGELOG.md` head entry are the surviving record.

## Still open at the phase-1 tip of the 2026-10-26 plan

1. **`git rev-parse HEAD` and `git worktree list` are outside the watchdog.** `bounded` wraps `git status`, `git ls-files` and both `hash-object` calls. `fingerprint` still runs `git -C "$1" rev-parse HEAD` bare, and `marked_worktrees_of` runs `worktree list --porcelain` bare. A seat's trigger: a worker makes a worktree gitdir's HEAD a FIFO (worker Bash writes are advisory only, ADR 0002), so `rev-parse` never returns and the 600 s kill lands. Not executed here. The plan slice's operative clause names only `status` and `hash-object`, so audit seats rated it a note. The DEADLINE header still says "one slow call cannot carry the hook past the deadline", which reads wider than that. The security seat's absorb finding for it never landed. The 2026-10-26 plan's PIN-3 covers only NEW git calls, so it did not reach these two.
2. **A failed `mktemp` hashes every path as `unreadable`.** `hfnew` and the batch-input temp in `blob_lines` fall back to `/dev/null` when `mktemp` fails. Each path then reads `unreadable` at both ends, so a content-only edit to an already-dirty file leaves the fingerprint unchanged. `fingerprint` maps only a `blob_lines` return of 3, and returns 1 only on its own earlier `mktemp` failure. The window is narrow: the first `mktemp` must succeed and a later one fail. Raised as a Minor absorb in round 1 and never landed.
3. **A file that cannot be hashed at either end hides an edit.** A path whose `hash-object` fails gets `unreadable` at start and at verdict. A worker can set mode 000 around both hash times and change the content. This rule dates from phase 6.
4. **Closed.** The fingerprint no longer trusts git's own change detection for fsmonitor, the untracked cache, assume-unchanged or skip-worktree. See the closed section below. Item numbers stay stable so older notes that cite "item 5" or "item 6" still resolve.
5. **A Grep or Glob `path` naming a directory that holds task worktrees touches none of them.** The Glob and Grep arm calls `touch_path` only, which walks up and never down. Latent: the 2026-10-22 adjudication row records that auditor seats had no Grep tool on Claude Code 2.1.304. Disposition `follow-up`, `barrier:underspecified`. The right narrowing depends on how ripgrep treats the children of an explicit path under an excluded directory, which nobody measured. Phase 2 of the 2026-10-26 plan targets this and item 6; it had not landed at the phase-1 tip.
6. **`~-` maps to the payload cwd, not to the shell's OLDPWD.** The payload carries no OLDPWD. `git diff --no-index ~-/<worktree path> /dev/null` can read a worktree the hook never touches if OLDPWD differs from the cwd. Disposition `follow-up`, `barrier:underspecified`: fail closed, or read the hook's own OLDPWD. Unverified whether the Bash tool's shell sets it. The `tilde` helper still holds the cwd mapping at the phase-1 tip.
7. **The timeout marker and the seat verdict on the tamper record are forgeable.** `$STATE/timeout` and `$MAIN/.claude/war/audit-tamper/<agent_id>.json` sit where a worker's Bash can write. The fail-open branch in `skills/war/references/resume-and-recovery.md` accepts the record's `seat_verdict` with no cross-check, though the timeout reason now carries the seat verdict into the engine's audit log, which no worker can write, so the Lead can cross-check it. Narrow: a worker who can write there can already rewrite `$STATE/start`.
8. **Touched-set writes fail open.** `touch_line` returns 0 when `mkdir -p` fails and does not check the append. `compare` returns clean when `$STATE/touched` is missing.
9. **State dirs are never pruned.** No `rm -rf` of `$MAIN/.claude/war/audit-fingerprints/<agent_id>/` appears in the file. About 8 KB per seat run.
10. **Cost grows with marked worktrees.** SubagentStart runs `git status -uall`, one `git ls-files -v -z` and one `hash-object` batch in every marked worktree for every seat. Each bounded call adds a `sleep` spawn and a kill, and each touched path costs about four forks. `ls-files -v -z` lists every tracked path, and `fingerprint` runs `expired` and a case test on each record, so the added cost scales with tracked-file count, not with flagged-path count.
11. **Sibling `.gitmodules` readers split on whitespace.** `reuse_hygiene` in `skills/war/assets/provision-worktrees.sh` and `skills/war/assets/assert-no-submodule-mutation.sh` break on a submodule path with a space. Not re-read at the phase-8 tip. The hook itself reads with `git config -z`.
12. **Hypothesis, not executed: `status` still trusts stat data under `core.checkStat` and `core.trustctime`.** The status call pins only `core.fsmonitor=false` and `core.untrackedCache=false`. The correctness seat read git's stat-match rule and did not run it. With `core.checkStat=minimal` and `core.trustctime=false`, git would compare only whole-second mtime and size, so a same-size edit with a restored mtime would stay out of the status list. The hook hashes only status-listed and flagged paths, so it would never hash that edit. The plan and the #2438 ruling name fsmonitor, the untracked cache and flagged paths only. Pinning both keys trades coverage against extra content reads on stat-noisy filesystems, so the operator decides. Disposition `note`, Nit. Agent-unverified.

## Known, fail-closed, and pinned by rows (do not file as holes)

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

## Why they shipped

Items 1 to 3 of the phase-7 list were audit findings that the phase-7 fix rounds never closed. See [[an-ask-finding-re-raised-as-major-absorb-keeps-the-ace-ladder-from-converging]]. The operator ruled the fork on 2026-10-24, and phase 8 built on the rulings. Task 8.1 still took eight commits on one branch, because each round found the next neighbor of the last fix. Then p8-polish drained the last absorb findings in two rounds. Items 1 and 2 above are absorb-disposition findings that fell out of that ladder. See also [[in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] and [[fix-round-uncommitted-leftover-is-stashed-by-pin-transfer-and-never-lands]].

**Locate-cue (verify still present before acting).** In `hooks/audit-tree-fingerprint.sh`: `fingerprint` runs `git -C "$1" rev-parse HEAD` with no `bounded`. `marked_worktrees_of` runs `git -C "$1" worktree list --porcelain` bare. `hfnew` has the `_hf=/dev/null` fallback. The Glob and Grep arm calls `touch_path` only. `tilde` maps `~-` to `$cwd`. All found at landed tip 06ef13c17545. Also found there: both `fingerprint` git calls carry `-c core.fsmonitor=false`, the case arm `[[:lower:]]\ *|S\ *` filters the flagged tags, and the status call carries `-c core.untrackedCache=false`.

Related: [[submodule-task-worktrees-are-invisible-to-a-superproject-worktree-list]], [[dirty-worktree-fingerprint-needs-blob-hashes-z-status-and-link-text-not-a-bare-status-hash]], [[git-status-in-a-live-sibling-worktree-needs-optional-locks-off]].
