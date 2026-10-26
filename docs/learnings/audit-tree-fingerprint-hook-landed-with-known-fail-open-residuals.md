---
name: audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals
description: "Audit tree fingerprint hook after phase 8: git status is bounded, but rev-parse, the mktemp fallback and fsmonitor stay fail-open"
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
  provenance: code-verified
  slug: audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.2, updated at phase-7 task 7.2, p7-polish and phase-8 (tasks 8.1, 8.2, p8-polish)
  tags:
    - war
    - hooks
    - audit
    - residuals
    - ask-unruled
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-26T21:24:57.416Z
---

# Read this list before you touch `hooks/audit-tree-fingerprint.sh` or call it fail-closed

The hook is the D22 compensating control for the D21 `git grep -F -e <token>` admission. Phase 6 landed it with gaps. Phase 8 (tasks 8.1, 8.2 and p8-polish, built on the operator rulings of 2026-10-24) closed six of the seven phase-7 items. Everything below was read at landed tip c01f2b9022b2 on `dev/2026-10-20-rea-artifact-evidence`, through the run-scoped `_refinery` worktree (its HEAD equaled the tip). The session checkout was on an unrelated branch. Verify each item before acting.

The phase-8 slice and rulings A and B are not in `docs/plans/2026-10-20-rea-artifact-evidence.md` at the tip, which ends at Phase 7. The hook's header comments and the `CHANGELOG.md` head entry are the surviving record.

## Still open at the phase-8 tip

1. **`git rev-parse HEAD` and `git worktree list` are outside the watchdog.** `bounded` wraps `git status`, the batched `hash-object` and the single-path `hash-object`. `fingerprint` still runs `git -C "$1" rev-parse HEAD` bare, and `marked_worktrees_of` runs `worktree list --porcelain` bare. A seat's trigger: a worker makes a worktree gitdir's HEAD a FIFO (worker Bash writes are advisory only, ADR 0002), so `rev-parse` never returns and the 600 s kill lands. Not executed here. The plan slice's operative clause names only `status` and `hash-object`, so audit seats rated it a note. The DEADLINE header still says "one slow call cannot carry the hook past the deadline", which reads wider than that. The security seat's absorb finding for it never landed.
2. **A failed `mktemp` hashes every path as `unreadable`.** `hfnew` and the batch-input temp in `blob_lines` fall back to `/dev/null` when `mktemp` fails. Each path then reads `unreadable` at both ends, so a content-only edit to an already-dirty file leaves the fingerprint unchanged. `fingerprint` maps only a `blob_lines` return of 3, and returns 1 only on its own earlier `mktemp` failure. The window is narrow: the first `mktemp` must succeed and a later one fail. Raised as a Minor absorb in round 1 and never landed.
3. **A file that cannot be hashed at either end hides an edit.** A path whose `hash-object` fails gets `unreadable` at start and at verdict. A worker can set mode 000 around both hash times and change the content. This rule dates from phase 6.
4. **The fingerprint trusts git's own change detection.** `git status` skips a path marked `--assume-unchanged` or `--skip-worktree`, and a `core.fsmonitor` command in a worktree config can report no change. A configured fsmonitor command also runs inside the hook process in every marked worktree at SubagentStart. The status call carries no `-c core.fsmonitor=false`. This is the security seat's account from the git documentation and was not executed. Disposition `follow-up`, `barrier:underspecified`: the second half of the fix needs a policy choice.
5. **A Grep or Glob `path` naming a directory that holds task worktrees touches none of them.** The Glob and Grep arm calls `touch_path` only, which walks up and never down. Latent: the 2026-10-22 adjudication row records that auditor seats had no Grep tool on Claude Code 2.1.304. Disposition `follow-up`, `barrier:underspecified`. The right narrowing depends on how ripgrep treats the children of an explicit path under an excluded directory, which nobody measured.
6. **`~-` maps to the payload cwd, not to the shell's OLDPWD.** The payload carries no OLDPWD. `git diff --no-index ~-/<worktree path> /dev/null` can read a worktree the hook never touches if OLDPWD differs from the cwd. Disposition `follow-up`, `barrier:underspecified`: fail closed, or read the hook's own OLDPWD. Unverified whether the Bash tool's shell sets it.
7. **The timeout marker and the seat verdict on the tamper record are forgeable.** `$STATE/timeout` and `$MAIN/.claude/war/audit-tamper/<agent_id>.json` sit where a worker's Bash can write. The fail-open branch in `skills/war/references/resume-and-recovery.md` accepts the record's `seat_verdict` with no cross-check, though the timeout reason now carries the seat verdict into the engine's audit log, which no worker can write, so the Lead can cross-check it. Narrow: a worker who can write there can already rewrite `$STATE/start`.
8. **Touched-set writes fail open.** `touch_line` returns 0 when `mkdir -p` fails and does not check the append. `compare` returns clean when `$STATE/touched` is missing.
9. **State dirs are never pruned.** No `rm -rf` of `$MAIN/.claude/war/audit-fingerprints/<agent_id>/` appears in the file. About 8 KB per seat run.
10. **Cost grows with marked worktrees.** SubagentStart runs `git status -uall` plus one `hash-object` batch in every marked worktree for every seat. Each bounded call now adds a `sleep` spawn and a kill, and each touched path costs about four forks.
11. **Sibling `.gitmodules` readers split on whitespace.** `reuse_hygiene` in `skills/war/assets/provision-worktrees.sh` and `skills/war/assets/assert-no-submodule-mutation.sh` break on a submodule path with a space. Not re-read at the phase-8 tip. The hook itself reads with `git config -z`.

## Known, fail-closed, and pinned by rows (do not file as holes)

- `git diff . /dev/null` reads only `./null`, but the hook walks every nested task worktree (implied `--no-index`, rows t37, t38, t40, t43). A sibling worker's normal edit can falsely trip a seat that ran this rare form.
- A SIGTERM on `hash-object` before the deadline hashes the path `unreadable`, so the verdict reads "changed during the audit round" and not `git error`. It never offers the fail-open question. No row covers it.
- A `-C ~<name>` base leaves `_base` empty. The literal touched line already escalates the verdict (row t27).
- The per-record `expired` check inside `blob_lines` has no discriminating row. The plan's optional third-dirty-path row was declined: the watchdog kills the slow call first.
- A cancel TERM landing in the watchdog's fork window can leave one idle `sleep`. Its stdio is on `/dev/null`, so it holds no pipe. The `bounded` header names it. A pid-reuse race at the exact deadline edge is the same kind of rare window.
- `validate-auditor-git.sh` still admits attached `-O<file>` and `-X<file>`. The hook touches them now. Narrowing the guard was out of scope.

## Closed in phase 8

- **One git call outrunning the deadline.** `bounded` kills `status` and both `hash-object` calls at the remaining deadline. See [[bash-per-call-watchdog-under-command-substitution-needs-detached-stdio-and-an-expired-gate-on-sigterm]] and [[self-deadline-polled-between-steps-cannot-bound-one-long-blocking-call]]. Rows d6, d6b (batch), d6c (single path), d6d (SIGTERM before the deadline), d7 and d8 now reach the mid-hash arms the phase-7 list said no row reached.
- **A start-arm timeout masking a later mismatch.** `compare` now holds the start-arm timeout as pending (`P_REASON`). A mismatch, git error, unresolved path or verdict-arm timeout on any touched worktree returns first. The start arm writes `$STATE/timeout-skipped`, so a worktree skipped on a git error or created after the start keeps `no start record`.
- **A `-C` after the subcommand moving the base.** The Bash token loop has a `_sub` flag. `-C` and `-C<n>` are global only before the subcommand word.
- **A directory operand that holds task worktrees.** `implied_noindex` and `touch_operand` walk it. See [[a-path-resolver-standing-in-for-a-reader-must-follow-that-readers-rule-and-take-both-when-readers-disagree]].
- **Two overclaiming comments.** The test comment above the `hooks.json` timeout row is gone. The DEADLINE header now says the clamp bounds the deadline value.
- **Also landed:** attached short-option file values (`-O<f>`, cluster `-pO<f>`), the `10#` deadline normalization, and the physical plus lexical path readings.

## Why they shipped

Items 1 to 3 of the phase-7 list were audit findings that the phase-7 fix rounds never closed. See [[an-ask-finding-re-raised-as-major-absorb-keeps-the-ace-ladder-from-converging]]. The operator ruled the fork on 2026-10-24, and phase 8 built on the rulings. Task 8.1 still took eight commits on one branch, because each round found the next neighbor of the last fix. Then p8-polish drained the last absorb findings in two rounds. Items 1 and 2 above are absorb-disposition findings that fell out of that ladder. See also [[in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] and [[fix-round-uncommitted-leftover-is-stashed-by-pin-transfer-and-never-lands]].

**Locate-cue (verify still present before acting).** In `hooks/audit-tree-fingerprint.sh`: `fingerprint` runs `git -C "$1" rev-parse HEAD` with no `bounded`. `marked_worktrees_of` runs `git -C "$1" worktree list --porcelain` bare. `hfnew` has the `_hf=/dev/null` fallback. The status call has no `-c core.fsmonitor=false`. The Glob and Grep arm calls `touch_path` only. `tilde` maps `~-` to `$cwd`. Found at landed tip c01f2b9022b2.

Related: [[submodule-task-worktrees-are-invisible-to-a-superproject-worktree-list]], [[dirty-worktree-fingerprint-needs-blob-hashes-z-status-and-link-text-not-a-bare-status-hash]], [[git-status-in-a-live-sibling-worktree-needs-optional-locks-off]].
