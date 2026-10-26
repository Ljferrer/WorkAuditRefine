# Audit tree fingerprint hook — four operator-ruled follow-ups (#2438, #2439, #2440, #2441)

**Evidence consumed** — one row per linked artifact:
- issues #2438, #2439, #2440, #2441 (bodies and the 2026-10-26 operator ruling in each last comment) · read
- each issue's `## Evidence artifacts` row (pinned sha `81763a5e` for #2438 to #2440, `5b5f4dc5` for #2441; file `hooks/audit-tree-fingerprint.sh`) · read at `76a8b6fb`, a descendant of both pins
- `hooks/audit-tree-fingerprint.sh` (header PURPOSE, DEADLINE, NON-INTERFERENCE; `lexical_dir`, `bounded`, `blob_lines`, `fingerprint`, `task_worktrees`, `task_worktree_of`, `touch_operand`, `tilde`, `compare`, the `Glob|Grep` and `Bash` arms) at `76a8b6fb` · read
- `hooks/audit-tree-fingerprint.test.sh` (fixture layout, the tilde rows t9 to t14, t26, t27, t33, the Grep and Glob rows t1, t2, t16) at `76a8b6fb` · read; the suite ran 143/143 green there
- `skills/war/references/resume-and-recovery.md` (the AUDIT-TAMPER bullet) at `76a8b6fb` · read
- `docs/adr/0029-capture-grounds-on-committed-tip.md` (the 2026-10-22 amendment) at `76a8b6fb` · read
- `docs/learnings/audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals.md` and `docs/learnings/touched-set-resolver-must-cover-every-path-form-the-admitting-guard-passes.md` at `76a8b6fb` · read
- `docs/learnings/a-path-resolver-standing-in-for-a-reader-must-follow-that-readers-rule-and-take-both-when-readers-disagree.md` · grep-read only (its `~-` line), because the two lessons above carry its rule
- `docs/plans/2026-10-20-rea-artifact-evidence.md` Task 3.1 (the release Done-when shape) at `76a8b6fb` · read
- the four version slots and the `CHANGELOG.md` head on `origin/master` at `76a8b6fb` · read
- the installed Claude Code 2.1.311 binary: the Grep tool and Glob tool ripgrep argument builders, read from its strings · read
- probes this interview ran (the ripgrep probe, the `ls-files -v` and `core.fsmonitor` probe), in throwaway repos outside any work tree · read (run here, recipe under Context)
- run manifests under `.claude/war/runs/` and the epic #2433 phase report · unread, because the four issues carry the run evidence each ruling needs
- target artifacts block · unread — no artifact path is named by the invocation or by any cited issue's `## Evidence artifacts` row, so the artifact recon lane did not fire

## Context — the gap / problem

PR #2411 merged on 2026-10-26 as `76a8b6fb` and shipped `hooks/audit-tree-fingerprint.sh` (user). The hook fingerprints every `.war-task` worktree at SubagentStart, records the worktrees an auditor seat touches through Read, Bash, Glob and Grep, and rewrites a verdict to `escalate` with an `AUDIT-TAMPER:` reason on a mismatch (verified: the hook's PURPOSE header at `76a8b6fb`). The final audit left four residuals, and the operator ruled each on 2026-10-26 with "a separate follow-up plan" as the route (verified: issues #2438 to #2441 (2026-10-26)).

**#2438, flagged files and git's change detection.** `fingerprint` hashes only the paths that `git status --porcelain=v1 -z -uall` lists, and that status call carries no `-c` override (verified: `fingerprint` at `76a8b6fb`). `git ls-files -v` tags an assume-unchanged path `h` and a skip-worktree path `S`, and `git status` lists neither after an edit to it (verified: scratch repo, git 2.54.0, 2026-10-26). A `core.fsmonitor` hook command runs under a plain `git status` even with `GIT_OPTIONAL_LOCKS=0`, and does not run under `-c core.fsmonitor=false` (verified: same scratch repo, a sentinel-writing hook script). So a writer can flag a file, edit it during the round and leave the fingerprint unchanged, and a worker-set fsmonitor command runs inside the hook process at SubagentStart (verified: issue #2438 (2026-10-26)). The ruling: run the status scan with `core.fsmonitor` and `core.untrackedCache` off, and hash every path `git ls-files -v` flags as assume-unchanged or skip-worktree as if it were dirty (verified: issue #2438 ruling (2026-10-26)).

**#2439, a Grep or Glob path that holds task worktrees.** The `Glob|Grep` arm calls `touch_path` only, and `task_worktree_of` walks up from a path, never down (verified: the `Glob|Grep` arm at `76a8b6fb`). The ruling: probe first, then mark nested task worktrees in that arm only when ripgrep really recurses into them, so busy sibling worktrees cause no false AUDIT-TAMPER halts (verified: issue #2439 ruling (2026-10-26)). The probe ran during this interview:

- The Grep tool runs ripgrep with `--hidden`, `--glob !.git` (and `.svn`, `.hg`, `.bzr`, `.jj`, `.sl`) and `--max-columns 500`, and with no `--no-ignore` (verified: Claude Code 2.1.311 binary strings, 2026-10-26).
- The Glob tool runs `rg --files --null --glob <pattern> --sort=modified`, plus `--no-ignore` and `--hidden` unless `CLAUDE_CODE_GLOB_NO_IGNORE` or `CLAUDE_CODE_GLOB_HIDDEN` is set false; both default to `"true"` (verified: same binary strings).
- Fixture: a repo with `.claude/` in its `info/exclude` (what `provision-worktrees.sh ensure-exclude` writes) and a real `git worktree add` at `.claude/war-worktrees/r/T1` carrying `.war-task`. Binary: the ripgrep 14.1.1 embedded in Claude Code 2.1.311, run with each tool's flags (verified: scratch probe, 2026-10-26).
- With the Grep flags, ripgrep does not enter `.claude/` from a no-path call in the main checkout, from `path` = the main checkout, or from `path` = the main checkout's parent dir. Given an explicit `path` at or below the excluded dir (`.claude`, `.claude/war-worktrees/r`), it recurses into T1, because the exclude does not apply below an explicit path. Given a plain non-repo dir that holds a worktree, it recurses (verified: scratch probe, 2026-10-26).
- With the Glob flags (default env), ripgrep recurses into T1 from every path, the no-path call in the main checkout included (verified: scratch probe, 2026-10-26).
- `git check-ignore` reports a path below an excluded dir as ignored, T1 itself included (verified: scratch repo, 2026-10-26).
- Probe recipe, for `/red-team` to replay: build the fixture above, then run `ARGV0=rg <claude binary> <tool flags> -l <token> [<path>] </dev/null` from the main checkout for each path. `</dev/null` matters: with no path and a non-terminal stdin, ripgrep searches stdin.
- Red-team replay, 2026-10-26 (verified: `docs/red-team/2026-10-26-fingerprint-hook-followups.md`): every claim above reproduced. With `path` = the main checkout's parent dir, Grep-flag ripgrep finds only the worktree under a plain dir, never T1, because it applies the main checkout's exclude on the way down. With `path` = T1 or a cwd inside T1, it reads T1 only.
- `git check-ignore` and `git ls-files -v` each run a configured `core.fsmonitor` command, as `git status` does. `GIT_OPTIONAL_LOCKS=0` does not stop them, and `-c core.fsmonitor=false` does. `rev-parse`, `worktree list` and `hash-object` never run it (verified: red-team sentinel probe, git 2.54.0, 2026-10-26).
- Once any file under the excluded `.claude/` is tracked, plain `git check-ignore` reports `.claude` itself as not ignored. `git check-ignore --no-index` still reports it ignored, and ripgrep still skips it. This repo tracks `.claude/war/config.json` (verified: red-team probe and `git ls-files .claude` at `1a1a92f4`).

**#2440, a `~-` operand.** `tilde` maps `~-` and `~-/x` to the payload cwd, while the seat's shell expands `~-` from OLDPWD, which the payload does not carry (verified: `tilde` at `76a8b6fb`; issue #2440 (2026-10-26)). The ruling: fail closed, treat `~-` and `~-/...` as unresolved like `~<name>`, and add a test row beside the existing tilde rows (verified: issue #2440 ruling (2026-10-26)). Row t13 today asserts the old reading: `git -C ~-/../wtB log` touches wtB (verified: `audit-tree-fingerprint.test.sh` at `76a8b6fb`).

**#2441, one comment word.** The `lexical_dir` header says the two readings disagree only across a `..` after a planted link or after a missing component, and omits a `..` after a non-directory component, which the code already handles (verified: the header above `canon` and `lexical_dir` at `76a8b6fb`; issue #2441 (2026-10-26)). The ruling: the one-word fix, "a missing or non-directory component" (verified: issue #2441 ruling (2026-10-26)).

**Release.** The four version slots read `0.21.17` on `origin/master` at `76a8b6fb` (verified: `plugin.json`, both `marketplace.json` slots, the `README.md` `## Status` line). The `README.md` `## Status` blurb and the `CHANGELOG.md` head entry list `~-/x` among the operand forms the hook resolves (verified: both files at `76a8b6fb`).

**Critical path** — one line per End state, chained to the base:
- End states 1 to 5 ← T1.1
- End states 6 to 9 and 18 to 20 ← T2.1 ← Phase 1 landed
- End states 10 and 11 ← T2.1
- End state 12 ← T2.1
- End state 13 ← gate ← T1.1, T2.1
- End states 14 and 15 ← T3.1 ← Phase 2 landed
- End state 16 ← backstop B1
- End state 17 ← backstop B2

## Pivotal constraints

- One file pair: all four issues touch `hooks/audit-tree-fingerprint.sh` and `hooks/audit-tree-fingerprint.test.sh`, so no two tasks may share a phase (verified: issues #2438 to #2441 (2026-10-26)).
- macOS bash 3.2.57: no globstar, no associative arrays, no `${,,}` (verified: the hook's CONSTRAINTS header at `76a8b6fb`).
- No arm writes git state in any worktree: `GIT_OPTIONAL_LOCKS=0` stays exported, and the index-bytes rows stay green (verified: the NON-INTERFERENCE header at `76a8b6fb`).
- The deadline regime holds: every `git status` and `git hash-object` call runs under `bounded` (verified: the DEADLINE header at `76a8b6fb`).
- Over-touch is safe, under-touch is a fail-open hole: an extra touched worktree only adds a comparison (verified: `docs/learnings/touched-set-resolver-must-cover-every-path-form-the-admitting-guard-passes.md` at `76a8b6fb`).
- The release bump updates all four slots in lock-step (verified: `CLAUDE.md` Releasing paragraph at `76a8b6fb`).

## Resolved design tree

| # | Decision | Resolution | Source | Landing class |
|---|----------|------------|--------|---------------|
| D1 | fsmonitor and untracked cache (#2438) | the status scan runs with `-c core.fsmonitor=false -c core.untrackedCache=false`, and every other git call the hook adds that can read an index (the new `ls-files -v` call, any `check-ignore` in the Grep walk) runs with `-c core.fsmonitor=false` | PIN-1 · (verified: issue #2438 ruling (2026-10-26); red-team sentinel probe 2026-10-26) | slice (T1.1, T2.1) |
| D2 | flagged paths (#2438) | every path `git ls-files -v` tags assume-unchanged (lowercase tag) or skip-worktree (`S`, `s`) is hashed as if dirty, and the flagged set is part of the hashed data | PIN-2 · (verified: issue #2438 ruling (2026-10-26)) | slice (T1.1) |
| D3 | the new `ls-files` call | runs under `bounded`, like `status` and `hash-object` | PIN-3 · (user) | guardrail ‡ |
| D4 | Grep walk-down (#2439) | the per-folder rule: the Grep arm marks a marked task worktree W below the search root R unless a folder strictly below R, on the path down to W, is ignored by the repo that holds that folder. When R is at or under an ignored dir, every W below R is marked. "Ignored" is decided the way ripgrep decides it, by pattern, never by the index (`check-ignore --no-index`, not plain `check-ignore`). A folder that no work tree holds, or that is itself a repo root, is not ignored and is no error: ripgrep enters it | PIN-4 · (verified: issue #2439 ruling (2026-10-26); scratch probe and red-team replay 2026-10-26) · (user: operator ruling at red-team 2026-10-26, "Per-folder rule") | slice (T2.1) ‡ |
| D5 | Glob walk-down (#2439) | the Glob arm stays walk-up only. With default env flags ripgrep recurses from every path, so a walk would mark every sibling worktree on each Glob from the main checkout; Glob returns names only, and a later Read or Grep of a listed file touches its worktree. A row pins the non-walk | PIN-5 · (user: operator ruling 2026-10-26, "Walk up only") | slice (T2.1) |
| D6 | uncertain recursion | when the hook cannot tell whether ripgrep recurses (a git error on the ignore test for a folder inside a work tree), it marks: over-touch, never under-touch. A "not a git repository" exit for a folder no work tree holds is not such an error (D4) | PIN-6 · (user) | guardrail |
| D7 | `~-` (#2440) | `~-` and `~-/...` are unresolved like `~<name>`: recorded literal, the verdict escalates `unverifiable fingerprint (unresolved Bash path …)`. `~+` keeps the payload-cwd reading | PIN-7 · (verified: issue #2440 ruling (2026-10-26)) | slice (T2.1) |
| D8 | `lexical_dir` header (#2441) | "a missing or non-directory component" | PIN-8 · (verified: issue #2441 ruling (2026-10-26)) | slice (T2.1) |
| D9 | carving | Phase 1 = the fingerprint side (#2438), Phase 2 = the touch side (#2439, #2440, #2441), Phase 3 = release. Same files, so sequential phases, never waves | PIN-9 · (user: operator ruling 2026-10-26, "Three phases") | context |
| D10 | release | its own trailing phase, the next free patch above `origin/master` | PIN-10 · (user) | slice (T3.1) |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | An auditor seat's payload cwd is the main checkout | issue #2439 names "a Grep from a $MAIN cwd" as the false-halt case | none for correctness: from a task-worktree cwd a no-path Grep stays inside that worktree | End state 8's row covers the main-checkout cwd |
| A2 | The ignore test the realization uses never calls a folder ignored where Grep-flag ripgrep recurses into it | the scratch probe and the red-team replay; plain `check-ignore` fails this once a file under `.claude/` is tracked, so D4 requires `--no-index`; ripgrep honors more ignore files (`.ignore`, `.rgignore`) than git, which errs toward over-touch | an under-touch: a Grep read of a sibling worktree goes uncompared | End states 6, 7 and 18 rows |
| A3 | The Grep and Glob tool flags stay as read from 2.1.311 | binary strings, 2026-10-26 | the walk-down rule mis-models ripgrep after an upgrade | backstop B1 |
| A4 | A structural row is the expected way to pin End state 4 | the red-team replay could not show a hide with a new file and a restored dir mtime on APFS; a hide needs `status.showUntrackedFiles=all`, `core.trustctime=false`, `core.checkStat=minimal` and a rename of an already-cached untracked file | none: End state 4 accepts a behavior row or a structural row | End state 4 |
| A5 | Hashing flagged paths changes the fingerprint for every flagged-but-clean worktree at both ends alike | start and verdict run the same code | none within one round | End state 2 rows plus the existing match rows |

## Non-goals / deferred

- The other residuals in the lesson's list (bare `rev-parse` and `worktree list`, the `mktemp` fallback, mode-000 files, forgeable markers, fail-open touch writes, state pruning, cost, sibling `.gitmodules` readers) stay out of scope.
- Narrowing `validate-auditor-git.sh` to deny `~-` stays out of scope: the hook fails closed instead.
- Reading OLDPWD from the hook's own environment is rejected by the #2440 ruling.
- Mirroring ripgrep's full ignore semantics (`.ignore`, `.rgignore`, global excludes) is not required; the over-touch direction covers the gap.

## New domain terms · Recommended ADRs

None. No new term enters `CONTEXT.md`, and no decision passes the ADR triad: each one tightens an existing control under a standing ruling.

## Commander's Intent

- **Purpose:** close the four ruled fail-open and wording gaps in the audit tree fingerprint hook, so a seat's verdict over a changed tree escalates and a busy sibling worktree never halts a seat it did not touch.
- **Method:** harden the fingerprint side first (git's own change detection off, flagged paths hashed), then the touch side (a Grep walk-down that follows ripgrep's real recursion, `~-` fail-closed, one comment word), each phase pinned by test rows in the hook's own suite; then release.
- **Mechanism latitude:** how flagged paths join the hashed data (synthesized records into `blob_lines`, a second hashed list, or another shape); how the Grep arm applies the D4 per-folder rule (`git -c core.fsmonitor=false check-ignore --no-index` per folder, a layout rule over the excluded dir, or another test with the same answers on every End-state row); the walk primitive (reuse `task_worktrees` as `touch_operand` does, or another listing of marked worktrees); the untracked-cache row (behavior or structural); and fixture shape (a separate fixture repo for the nested-worktree rows, or the shared one with a registered worktree added and removed in a window, as the wtQ rows do). Substituting any of these mechanisms while the End states and binding guardrails hold is not a plan deviation and warrants no issue.
- **Binding guardrails:** every new git call on the fingerprint path runs under `bounded` (PIN-3 ‡) · every git call any arm adds that can read an index runs with `-c core.fsmonitor=false` (PIN-1) · no arm writes git state (`GIT_OPTIONAL_LOCKS=0` stays) · bash 3.2 · when unsure, over-touch (PIN-6) · no false AUDIT-TAMPER from a no-path Grep in the main checkout (PIN-4 ‡) · `~-` fails closed, never reads OLDPWD (PIN-7) · the existing rows stay green except row t13, which flips to the ruled reading.
- **End state:**
  1. A `core.fsmonitor` hook configured in a marked worktree never runs during the start or verdict arm, with a flagged path present and an index that carries an fsmonitor extension · check: `bash hooks/audit-tree-fingerprint.test.sh` prints an `ok` row whose title contains `fsmonitor hook never runs`.
  2. An edit to an assume-unchanged file during the round escalates as changed during the audit round · check: an `ok` row whose title contains `assume-unchanged edit escalates`.
  3. An edit to a skip-worktree file during the round escalates as changed during the audit round · check: an `ok` row whose title contains `skip-worktree edit escalates`.
  4. The status scan runs with the untracked cache off · check: an `ok` row whose title contains `untracked cache` (behavior row, or a structural row on the status call).
  5. The new `ls-files` call runs under `bounded`: a `git ls-files` slowed past the deadline by a shim escalates with the `fingerprint timeout` reason · check: an `ok` row whose title contains `ls-files watchdog`.
  6. A Grep `path` at the run dir under the excluded `.claude/` touches every marked task worktree below it · check: an `ok` row whose title contains `Grep path under the excluded dir walks down`.
  7. A Grep `path` at a plain non-repo dir that holds marked worktrees touches each of them · check: an `ok` row whose title contains `Grep path at a plain dir walks down`.
  8. A Grep with no `path` from the main checkout cwd, and a Grep with `path` = the main checkout, touch no task worktree under the excluded `.claude/` · check: an `ok` row whose title contains `Grep from the main checkout walks no excluded worktree`.
  9. A Glob `path` at the run dir touches no nested task worktree (the D5 non-walk, pinned) · check: an `ok` row whose title contains `Glob path walks no nested worktree`.
  10. A `-C ~-/<path>` token and a `~-/<path>` operand are each recorded literal and escalate `AUDIT-TAMPER: unverifiable fingerprint (unresolved Bash path …)` · check: `ok` rows whose titles contain `tilde-minus -C escalates as unresolved` and `tilde-minus operand escalates as unresolved`, and no row title contains `~-/<path> resolves from the payload cwd`.
  11. No comment in the hook or its test suite says `~-` resolves from the payload cwd or from OLDPWD's nearest reading, and no comment names `~<name>` as the only unresolved tilde form · HARD at audit_sha (observable: the PURPOSE header (2) and (3), the STATE touched-file note, the `implied_noindex` header, the `tilde` header, the Bash-arm tokenizer comments and the test comment above t12; judge seat: correctness). Judged, not checked: a grep cannot tell whether a comment's claim is true.
  12. The `lexical_dir` header names a missing or non-directory component · check: `sed -n '/^# lexical_dir </,/^canon()/p' hooks/audit-tree-fingerprint.sh | sed 's/^# *//' | tr '\n' ' ' | tr -s ' ' | grep -Fqi 'a missing or non-directory component' && echo LEXICAL_DIR_OK`.
  13. Every suite the gate discovers stays green · gate: the self-discovery gate (`resolveGate` in `war-config.mjs`).
  14. The four version slots carry the next free patch above `origin/master`'s version (same major and minor), and the first `## ` heading of `CHANGELOG.md` names it · check: T3.1's `Done when`.
  15. The `README.md` `## Status` blurb no longer lists `~-/x` among the forms the hook resolves · check: T3.1's `Done when`.
  16. The walk-down rule still matches the Grep tool's ripgrep flags on the Claude Code version a run uses · backstop: row B1.
  17. A live `/war` run on this release shows no false AUDIT-TAMPER halt from a seat's no-path Grep · backstop: row B2.
  18. With a file under the excluded `.claude/` tracked, a Grep `path` at `.claude` itself touches every marked task worktree below it · check: an `ok` row whose title contains `Grep path at the excluded dir with tracked content walks down`.
  19. A Grep `path` at the main checkout's parent dir touches no task worktree under the excluded `.claude/` · check: an `ok` row whose title contains `Grep path at the main checkout's parent walks no excluded worktree`.
  20. Every `check-ignore` call in the hook runs with `--no-index` and `-c core.fsmonitor=false`, so the Grep walk never reads an index or runs a fsmonitor command · check: an `ok` row whose title contains `check-ignore calls are pattern-only` (a structural row: `--no-index` never reads the index, so no behavior row can fail).

## Build order (for /war)

Phase 1 (the fingerprint side) → Phase 2 (the touch side) → Phase 3 (release). Each phase lands before the next: Phases 1 and 2 share both files, so neither can be a wave of the other.

## Phase 1 — The fingerprint side: git's change detection off, flagged paths hashed

### Task 1.1: fsmonitor and untracked cache off; hash assume-unchanged and skip-worktree paths
- Files: `hooks/audit-tree-fingerprint.sh`, `hooks/audit-tree-fingerprint.test.sh`
- Plan slice: in `fingerprint`, run the bounded status scan with `-c core.fsmonitor=false -c core.untrackedCache=false` (PIN-1). Put each `-c` before `-C "$1"`: the suite's git shim picks the call to slow, fail or kill by matching `<worktree> status` in its argv, so `-C <worktree>` must stay next to the subcommand word, or rows d6, d7 and the SHIM_TERM and SHIM_FAIL rows go red. Add one bounded `git -c core.fsmonitor=false -C "$1" ls-files -v -z` call per worktree (PIN-3, PIN-1: `ls-files` runs a configured fsmonitor command too), and hash every path tagged assume-unchanged (a lowercase tag) or skip-worktree (`S` or `s`) as if dirty, with the flagged set inside the hashed data so a flag set mid-round also changes the fingerprint (PIN-2). A deadline hit in the new call returns 3, like the others. Add no temp file on a clean worktree: row d9 ("a clean worktree's fingerprint makes one temp file") pins one `mktemp` per clean fingerprint, so reuse the status temp file or hold the flagged paths in a bash array. Update the PURPOSE (1) text and the DEADLINE header to name the override and the new call. Add rows for End states 1 to 5: a fixture fsmonitor hook that writes a sentinel, with a flagged path present and the index carrying an fsmonitor extension (run one fixture `git status` with fsmonitor on and optional locks allowed), so the row reaches the `ls-files` call too; `git update-index --assume-unchanged` and `--skip-worktree`, then an edit between the start and verdict arms; the untracked cache (a structural row is the expected form, see A4); a shim that slows `git ls-files` past a short deadline, beside the existing watchdog rows (the shim's `case` gains an ` ls-files ` arm). If a row needs a hook script, keep it inside the fixture's mktemp dir. Keep every existing row green, the index-bytes rows, the deadline rows and d9 included.
- Done when: `out=$(bash hooks/audit-tree-fingerprint.test.sh) && for k in 'fsmonitor hook never runs' 'assume-unchanged edit escalates' 'skip-worktree edit escalates' 'untracked cache' 'ls-files watchdog'; do printf '%s\n' "$out" | grep -q "^ok [0-9]* - .*$k" || { echo "MISSING: $k"; exit 1; }; done && echo T11_OK`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — The touch side: Grep walk-down, `~-` fail-closed, the `lexical_dir` word

### Task 2.1: Walk down for Grep where ripgrep recurses; pin the Glob non-walk; `~-` unresolved; one comment word
- Files: `hooks/audit-tree-fingerprint.sh`, `hooks/audit-tree-fingerprint.test.sh`
- Plan slice: in the `Glob|Grep` arm, after `touch_path`, a Grep whose search root R (its `path`, else the payload cwd) is a directory also marks each marked task worktree W below R by the D4 per-folder rule (PIN-4): mark W unless a folder strictly below R, on the path down to W, is ignored by the repo that holds it; when R is at or under an ignored dir, mark every W below R. Decide "ignored" by pattern, as ripgrep does: `check-ignore --no-index`, never plain `check-ignore`, which reads the index and flips once a file under `.claude/` is tracked. Run every such git call with `-c core.fsmonitor=false` (PIN-1), and pin both flags with a structural row (End state 20). Ask each folder's question from the repo that holds it. A folder that no work tree holds, or that is itself a repo root, is not ignored: the "not a git repository" exit there is no error. When the ignore test errors for a folder inside a work tree, mark (PIN-6). The Glob branch stays walk-up only, and a row pins it (PIN-5). In `tilde`, `~-` and `~-/...` return 1 like `~<name>` (PIN-7): flip row t13 to the literal-and-escalate reading, and add the operand row beside t26 and t27. Reword every comment that says `~-` resolves from the payload cwd, or names `~<name>` as the only unresolved tilde form: the PURPOSE header (2) and (3), the STATE touched-file note, the `implied_noindex` header, the `tilde` header, the Bash-arm tokenizer comments and the test comment above t12. Change the `lexical_dir` header to "a missing or non-directory component" (PIN-8). Fixture for End states 6, 8, 9, 18 and 19: append `.claude/` to the fixture's `$MAIN/.git/info/exclude`, as `provision-worktrees.sh ensure-exclude` does. Register a marked worktree with `git worktree add` under `$MAIN/.claude/war-worktrees/r`. Add and remove it in a window, as the wtQ rows do, so rows a1, s1, t34, t37 to t43 and d7 keep their exact content. Each negative row first asserts that this worktree is in the seat's start record, so the row can fail. End state 18 also needs a committed file under `.claude/`, placed off the walk path (for example `$MAIN/.claude/war/config.json`, as this repo has), never under `.claude/war-worktrees/`: there it would make plain `check-ignore` call every folder on the path not ignored, and the row would pass under the regression it exists to catch.
- Done when: `out=$(bash hooks/audit-tree-fingerprint.test.sh) && for k in 'Grep path under the excluded dir walks down' 'Grep path at a plain dir walks down' 'Grep from the main checkout walks no excluded worktree' 'Glob path walks no nested worktree' 'tilde-minus -C escalates as unresolved' 'tilde-minus operand escalates as unresolved' 'Grep path at the excluded dir with tracked content walks down' "Grep path at the main checkout's parent walks no excluded worktree" 'check-ignore calls are pattern-only'; do printf '%s\n' "$out" | grep -q "^ok [0-9]* - .*$k" || { echo "MISSING: $k"; exit 1; }; done && ! printf '%s\n' "$out" | grep -Fqi '~-/<path> resolves from the payload cwd' && sed -n '/^# lexical_dir </,/^canon()/p' hooks/audit-tree-fingerprint.sh | sed 's/^# *//' | tr '\n' ' ' | tr -s ' ' | grep -Fqi 'a missing or non-directory component' && echo T21_OK`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Release

### Task 3.1: Version bump
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`
- Plan slice: bump the four slots in lock-step to the next free patch above the live `origin/master` version (PIN-10). Replace the `README.md` `## Status` blurb in place and add its twin as the new `CHANGELOG.md` head entry: the fsmonitor and untracked-cache override, flagged paths hashed, the Grep walk-down and the pinned Glob non-walk, `~-` fail-closed, the comment fix. The new blurb lists `~-` with the unresolved forms, never with the resolved ones: every clause that names `~-` also says "unresolved", with no comma or semicolon between them. Leave the previous `CHANGELOG.md` head entry as shipped: it was true at its release.
- Done when: `V=$(node -p "require('./.claude-plugin/plugin.json').version") && B=$(git show origin/master:.claude-plugin/plugin.json | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).version") && node -e "const a=process.argv[1].split('.').map(Number),b=process.argv[2].split('.').map(Number);process.exit(a[0]==b[0]&&a[1]==b[1]&&a[2]>b[2]?0:1)" "$V" "$B" && grep -m1 '^## ' CHANGELOG.md | grep -Fq "## $V " && ! sed -n '/^## Status/,/^## [^S]/p' README.md | perl -e 'local $/; $_ = <STDIN>; s/\n/ /g; for (split /(?<!e\.g)(?<!i\.e)[.;]\s/) { $f=1 if /~-/ && !/~-[^,;]*unresolved|unresolved[^,;]*~-/i } exit($f?0:1)' && node --test skills/war/assets/version-slots.test.mjs && echo RELEASE_OK`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- B1: re-read the Grep and Glob tool ripgrep flags from the installed Claude Code binary and replay the Context probe recipe · why deferred: the flags are bound to the Claude Code version (2.1.311 at this interview), which no CI job installs · runner: the operator, at the first Claude Code upgrade after this release, before the next `/war` run.
- B2: a live `/war` run on this release, whose seats use the Grep tool from the main checkout while sibling workers commit, shows no AUDIT-TAMPER record caused by a sibling worktree · why deferred: needs a real multi-task run with the Grep tool present (seats on 2.1.304 had none) · runner: the Lead, at that run's first Checkpoint, reading `$MAIN/.claude/war/audit-tamper/`.

## Notes / conscious deviations

- Row t13 flips on purpose: it asserted the reading the #2440 ruling rejects.
- On land, the two lessons in Evidence consumed still list items 4 to 6 (fsmonitor and flags, the Grep and Glob walk, `~-`) as open. The servitor and the Lead's Gate-2 learnings pass update them; no task here edits `docs/learnings/`.
- The probe scripts lived in a session scratchpad; the Context recipe is the durable record.

## Open decisions

None. The operator ratified PIN-5 (Glob walk-up only), PIN-9 (three phases) and the Commander's Intent as drafted on 2026-10-26. At `/red-team` the same day, the operator ruled the D4 per-folder rule and End state 5 as a test row; the report at `docs/red-team/2026-10-26-fingerprint-hook-followups.md` records each patch.
