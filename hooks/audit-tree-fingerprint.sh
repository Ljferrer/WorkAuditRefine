#!/usr/bin/env bash
# WAR audit tree fingerprint (SubagentStart, PreToolUse, SubagentStop).
# Plan 2026-10-20-rea-artifact-evidence Task 6.2 (D22; the compensating
# control for the D21 `git grep -F -e <token>` admission, ADR 0029 amendment).
#
# PURPOSE
#   A hook, never the seat, proves that no `.war-task` worktree an audit seat
#   read changed while the seat judged it. One script, three entry arms, all
#   keyed on the payload's `hook_event_name` and `tool_name`:
#     (1) SubagentStart: record the fingerprint of every `.war-task` worktree
#         (`git worktree list --porcelain`, marker present) of the payload
#         cwd's repository and of every initialized submodule that
#         `$MAIN/.gitmodules` declares (a submodule task's worktree is
#         registered in the submodule's own git dir and never appears in the
#         superproject's list): HEAD sha plus the sha256 of `git status
#         --porcelain=v1 -z -uall`, run with `-c core.fsmonitor=false -c
#         core.untrackedCache=false` (git's own change detection off: a
#         configured fsmonitor command would run inside the hook, and either
#         cache could hide a change), joined with one `~<tag> <path>` record
#         per path that `git -c core.fsmonitor=false ls-files -v -z` flags
#         assume-unchanged (a lowercase tag) or skip-worktree (`S`, `s`), and
#         with the blob hash (`git hash-object --no-filters`, no write, no
#         clean filter) of every path that status lists or ls-files flags.
#         Status never lists a flagged path, even after an edit, so each one
#         is hashed as if dirty, and the flagged set itself is hashed data: a
#         flag set mid-round changes the fingerprint (see fingerprint).
#         The blob hashes make the fingerprint content-sensitive: a status line
#         is the same before and after a second edit to an already-dirty file.
#         The -z form carries every path raw; the newline form C-quotes a path
#         with a space, a double quote, a backslash or a control byte (even
#         under core.quotePath=false), and such a path could not be hashed.
#         The hash-object batch reader has line rules of its own (see
#         blob_lines): a path that reader would rewrite gets its own call.
#     (2) PreToolUse on Read, Bash, Glob, Grep: resolve every `.war-task`
#         worktree the call reaches (a `..` after a symlink read both
#         physically and lexically, see task_worktree_of) through its path
#         (a Read file_path, a Glob or Grep path, an
#         absolute Glob pattern, a Bash `git -C <path>` before the subcommand
#         word, an absolute Bash operand, any relative Bash operand (`../x`,
#         `./x`, `a/../x`, a bare `x`), an unquoted `~`, `~/x`, `~+/x` or
#         `~-/x` operand, the value after `=` of a Bash `--<opt>=<path>` token,
#         the text after the option letter of an attached short-option value
#         (`-O<file>`, `-X<file>`), or after the first file-valued letter (O,
#         X, S) of a short-option cluster (`-pO<file>`), or the next token of
#         a space-form file-valued flag, else the payload cwd) and add each
#         to the seat's touched set. A directory
#         operand that holds task worktrees adds each of them when the
#         command reads them (see touch_operand).
#     (3) PreToolUse on StructuredOutput: recompute every touched worktree's
#         fingerprint and compare it with the start record. A match exits 0
#         with no output. A mismatch, or a fingerprint it cannot compute (no
#         or an unsafe agent_id, no git common dir, a missing start record, a
#         git error, an unresolved Bash `~<name>` token),
#         ALLOWS the call with an `updatedInput` that keeps the seat's verdict
#         JSON but sets `verdict` to `escalate` and `escalate_reason` to
#         `AUDIT-TAMPER: <worktree> changed during the audit round (<start> -> <now>)`
#         or `AUDIT-TAMPER: unverifiable fingerprint (<cause>)`, and writes a
#         record to `$MAIN/.claude/war/audit-tamper/<agent_id>.json`. The
#         record keeps the seat's own `verdict` and `escalate_reason` as
#         `seat_verdict` and `seat_escalate_reason` (null on the Subagent
#         arms, which carry no tool input): the rewrite replaces both in the
#         tool input, and a fail-open ruling on a timeout accepts them.
#     (4) SubagentStop: the same comparison, record only, never a block, and
#         never over a record the StructuredOutput arm wrote for the seat.
#   A worktree the seat never touched is never compared, so concurrent workers
#   in sibling worktrees cannot trip it.
#
# DEADLINE (Task 7.2, ruling 2026-10-24)
#   Claude Code kills a hook at its hooks.json `timeout` (600 s on every entry
#   for this hook) and the verdict then passes unchecked. The hook keeps its
#   own shorter deadline, 540 s by default or WAR_FINGERPRINT_DEADLINE_SECONDS
#   when that is a non-negative integer below 600 (tests use 0). Any other
#   value, 600 or more included, falls back to 540: the override is clamped
#   under the hooks.json timeout, so the deadline itself always falls before
#   Claude Code's kill. The deadline is measured on bash's SECONDS from the
#   hook's start and checked per worktree in the start and compare loops, per
#   ls-files record in fingerprint and per path in blob_lines. Each `git
#   status`, `git ls-files` and `git hash-object` call runs under a watchdog
#   (see bounded) that kills it when the remaining deadline runs out, so one
#   slow call cannot carry the hook past the deadline (Task 8.1, ruling A); a
#   deadline hit in any of them returns 3, the timeout. The status and
#   ls-files calls run with the `-c core.fsmonitor=false` override (status
#   with `-c core.untrackedCache=false` too), so no configured fsmonitor
#   command runs inside a bounded call. Past the deadline the hook stops
#   hashing: the StructuredOutput arm escalates with `AUDIT-TAMPER:
#   fingerprint timeout (<worktree> ... after <N>s, deadline <D>s; seat
#   verdict <v>)` (<v> is the
#   seat's own verdict when it is one of the schema's three, else `unparsed`:
#   the reason rides the engine's audit log, which no worker can write, so
#   the Lead can cross-check the tamper record's `seat_verdict`) and writes
#   the tamper record with `"timeout": true`; the SubagentStop arm records the
#   same; the SubagentStart arm writes `$STATE/timeout` (`<N> <D> <worktree>`:
#   the elapsed seconds, the start arm's own deadline and the first worktree
#   left unrecorded) and `$STATE/timeout-skipped` (that worktree and every
#   one after it in the list, one per line), so a verdict that touched a
#   listed worktree escalates with the timeout reason, naming that stored
#   deadline (the verdict arm may run under another). A worktree with no
#   start line that is NOT listed (skipped on a git error, or created after
#   the start) keeps `no start record`. The start-arm timeout is pending
#   while compare runs: a mismatch, a git error, an unresolved path or a
#   verdict-arm timeout on any touched worktree wins over it, so a round that
#   proved a change never offers the fail-open question. The Lead's question
#   on the timeout reason (fail closed or fail open) is in
#   resume-and-recovery.md.
#
# NON-INTERFERENCE
#   Every git call runs with GIT_OPTIONAL_LOCKS=0 (git(1) --no-optional-locks,
#   exported once below). Without it, `git status` refreshes each worktree's
#   index and writes it back under <gitdir>/index.lock, and the SubagentStart
#   arm runs status in EVERY marked worktree, live sibling workers' and the
#   refiner's included: a `git add`, `git commit` or `git rebase` there during
#   that window dies on `index.lock: File exists`. With the opt-out, status
#   reads the index and never locks or writes it, so the hook writes no git
#   state in any worktree (an audit seat writes nothing, ADR 0002). The status
#   output is the same either way. Pinned by the test row `every
#   fingerprinting arm leaves the worktree index unwritten (no optional lock)`.
#
# SCOPE
#   Acts only for agent types ending `war-auditor` or `war-evidence-auditor`
#   (suffix-anchored arms, `*war-<role>`, never `*war-<role>*`). Every other
#   agent type passes through with exit 0 and no output, before any git call.
#
# STATE
#   `$MAIN/.claude/war/audit-fingerprints/<agent_id>/{start,touched}` plus the
#   start arm's `timeout` and `timeout-skipped` markers (DEADLINE above), where
#   `$MAIN` is the main checkout: dirname of `git rev-parse --git-common-dir`
#   on the payload `cwd`, in the two-step failure-distinguishable form (a
#   composed `dirname "$(git ...)"` yields "." on a failed probe). `.claude/`
#   is already excluded from status by provision-worktrees.sh ensure-exclude.
#   `start` lines are `<head> <status-sha256> <worktree>`; `touched` holds one
#   canonical worktree path per line, or a literal `~<name>` Bash `-C` token
#   the hook cannot expand (the verdict arm reports it as unresolved). Worktree
#   paths are canonical (`pwd -P`) on both sides, so a symlinked temp dir
#   compares equal to its real path.
#
# PAYLOAD CONTRACT
#   `agent_id` and `agent_type` ride SubagentStart and SubagentStop (confirmed
#   on Claude Code 2.1.251, hooks/reply-standard/subagent-start.py). The plan
#   assumes PreToolUse inside a subagent carries them too and honors
#   `updatedInput` on StructuredOutput; backstop B5 probes it live. If a
#   PreToolUse payload carries no agent_id, the verdict arm escalates as
#   unverifiable: fail-closed, never a silent pass.
#
# EXIT CONTRACT
#   0 = pass-through, recorded, allowed (with or without updatedInput).
#   2 = a parse or infra error: payload not JSON, or jq missing on an auditor
#   payload (without jq the agent type is read by a key-anchored grep, so a
#   jq-less host blocks only the two seat types, never the main session's
#   every Read).
#   Never any other code.
#
# CONSTRAINTS
#   Runs on macOS bash 3.2.57: no globstar, no associative arrays, no ${,,}.
#   Reads the payload via jq (already a hook dependency). sha256 via
#   `sha256sum` or `shasum -a 256`, whichever is present.
set -u
# No pathname expansion: the Bash arm word-splits the payload command, and a
# glob token there must never be expanded against this hook's filesystem.
# (`case` patterns are unaffected; the script uses no globs of its own.)
set -f
# No optional locks on any git call below (see NON-INTERFERENCE above).
export GIT_OPTIONAL_LOCKS=0
NL='
'
CR="$(printf '\r')"

# The hook's own deadline in seconds (see DEADLINE above). SECONDS is bash's
# seconds-since-start counter: no spawn per check, so blob_lines can test it
# per path. The override is clamped under the 600 s hooks.json timeout: 600
# or more falls back to 540 (`[` fails on an oversized value, so that falls
# back too). The digit check and `[` read decimal, so `08` passes both, but
# bounded's `$((DEADLINE - SECONDS))` would read a leading 0 as octal and
# fail on 8 or 9. The `10#` line strips the leading zeros once, here.
DEADLINE="${WAR_FINGERPRINT_DEADLINE_SECONDS-}"
case "$DEADLINE" in ''|*[!0-9]*) DEADLINE=540 ;; esac
[ "$DEADLINE" -lt 600 ] 2>/dev/null || DEADLINE=540
DEADLINE=$((10#$DEADLINE))
expired() { [ "$SECONDS" -ge "$DEADLINE" ]; }

infra() { echo "WAR: audit tree fingerprint: $1" >&2; exit 2; }

input="$(cat)"

# Without jq the agent type is read by a key-anchored grep on the raw payload
# (an `agent_type` key whose string value ends war-auditor or
# war-evidence-auditor), so the two seat types fail closed and every other
# caller passes through, a main-session Read of a path ending war-auditor
# included.
if ! command -v jq >/dev/null 2>&1; then
  if printf '%s' "$input" | grep -q '"agent_type"[[:space:]]*:[[:space:]]*"[^"]*war-\(evidence-\)\{0,1\}auditor"'; then
    infra "jq is not installed; an audit seat cannot be fingerprinted (fail-closed)"
  fi
  exit 0
fi
get() { printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null; }

# One jq pass both validates the payload (a parse error is the exit-2 arm) and
# reads the agent type, so a pass-through call costs one spawn, not two.
atype="$(printf '%s' "$input" | jq -r '.agent_type? // empty' 2>/dev/null)" || infra "payload is not JSON"
case "$atype" in
  *war-auditor|*war-evidence-auditor) ;;
  *) exit 0 ;;
esac

event="$(get '.hook_event_name')"
tool="$(get '.tool_name')"
cwd="$(get '.cwd')"
[ -n "$cwd" ] && [ -d "$cwd" ] || cwd="$PWD"

# agent_id keys the state dir: one path segment, no separators or traversal.
# aid_raw keeps the payload value so the verdict arm can tell a rejected id
# from an absent one.
aid_raw="$(get '.agent_id')"
aid="$aid_raw"
case "$aid" in
  ''|*[!A-Za-z0-9._-]*|.|..) aid="" ;;
esac

# $MAIN: two-step form (see STATE above). Empty when the cwd is not a git tree.
MAIN=""
common="$(git -C "$cwd" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" \
  && [ -n "$common" ] && MAIN="$(dirname "$common")"
STATE=""
[ -n "$MAIN" ] && [ -n "$aid" ] && STATE="$MAIN/.claude/war/audit-fingerprints/$aid"

# --- helpers ---------------------------------------------------------------

sha256_of_stdin() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum | cut -d' ' -f1
  elif command -v shasum >/dev/null 2>&1; then shasum -a 256 | cut -d' ' -f1
  else return 1
  fi
}

# canon <dir> -> the physical path of an existing dir. `cd -P` resolves a
# `..` after a symlink physically (`lnk/..` is the parent of the link TARGET),
# as the kernel reads it and as git opens a `--no-index` operand.
# lexical_dir <absolute path> -> the physical path of the nearest existing
# directory on the LEXICAL reading of <path>. The Read tool resolves `..`
# lexically (`/var/../private/etc/hosts` opens; the physical
# `/private/private/...` does not exist), and git's in-repo operand rule
# (path_inside_repo, normalize_path_copy) is lexical too: `.` and `..`
# segments are folded as text before any component is opened, so
# `<wt>/lnk/..` is <wt> itself, `<wt>/lnk/../../<other>/f` is <other>/f,
# and `<wt>/nosuch/../../<other>/f` is <other>/f although `nosuch` does
# not exist. The fold here is a parameter-expansion loop (no spawn, bash
# 3.2); only then is the folded path walked up to its nearest existing
# directory and canon'd, so a symlink not followed by `..` is still
# followed forward, as the reader follows it. The two readings disagree
# only across a `..` after a worktree-planted `lnk -> <other worktree>/sub`
# or a `..` after a missing component; every resolver that stands in for a
# reader takes BOTH (task_worktree_of, outside_top), so neither shape can
# point the touch away from the worktree either reader reaches. The
# walk-down of touch_operand reads only canon: it runs for the `--no-index`
# forms, which git opens physically.
canon() { (cd -P -- "$1" 2>/dev/null && pwd -P); }
lexical_dir() {
  _lr="$1"; _lo=""
  while [ -n "$_lr" ]; do
    _lr="${_lr#/}"
    _lseg="${_lr%%/*}"
    case "$_lr" in */*) _lr="${_lr#*/}" ;; *) _lr="" ;; esac
    case "$_lseg" in
      ''|.) ;;
      ..) _lo="${_lo%/*}" ;;
      *) _lo="$_lo/$_lseg" ;;
    esac
  done
  [ -n "$_lo" ] || _lo=/
  while [ ! -d "$_lo" ]; do
    _ln="${_lo%/*}"; [ -n "$_ln" ] || _ln=/
    [ "$_ln" = "$_lo" ] && return 0
    _lo="$_ln"
  done
  canon "$_lo"
}

# bounded <outfile> <infile> <cmd...>: runs <cmd> as a background child with
# stdin from <infile> and stdout to <outfile>, under a watchdog that kills it
# (SIGTERM) when the remaining deadline runs out, and waits on it. Returns the
# child's exit code, or 3 when the deadline passed before the call or the
# watchdog killed it: wait reports 143 for SIGTERM, and a 143 counts as the
# watchdog's kill only when the deadline has passed (the sleep is the whole
# remaining deadline in whole seconds, so SECONDS >= DEADLINE at the kill). A
# SIGTERM from elsewhere before the deadline (any process outside the
# watchdog; a worker-set core.fsmonitor helper never runs here, since status
# and ls-files carry the fsmonitor override) returns 143, which fingerprint
# reads as a git error and blob_lines as an `unreadable` blob (a later
# mismatch), never as the timeout reason the Lead may rule fail-open. The
# watchdog is a subshell whose own `sleep` is a background child it kills
# from a TERM trap, so cancelling the watchdog after a fast call leaves no
# orphan sleep. The sleep
# length is the whole remaining deadline, so a call that ends in time costs one
# sleep spawn and one kill. No job control (`set -m`) on bash 3.2: the child
# pid is the command itself (a simple command backgrounded is forked directly),
# so the kill reaches git, never a wrapper shell. A grandchild a killed git
# spawned (a submodule `status`) is not killed, but it
# writes only to the killed git's pipe, never to the hook's, so the hook never
# waits on it. The watchdog and its sleep run with stdout AND stderr on
# /dev/null: every bounded call sits inside a `$(...)` of the caller, and a
# sleep left on that pipe (the cancel TERM landing between `sleep &` and
# `_s=$!`) would hold the substitution open until the deadline. `_s` starts
# empty so that early TERM kills nothing instead of failing under `set -u`.
# Stderr of the git child is dropped too: a killed child's exit is read from
# `wait`, never from bash's job report, which a non-interactive shell does
# not print.
bounded() {
  _bo="$1"; _bi="$2"; shift 2
  _left=$((DEADLINE - SECONDS))
  [ "$_left" -gt 0 ] || return 3
  "$@" < "$_bi" > "$_bo" 2>/dev/null &
  _cpid=$!
  ( _s=""; trap 'kill "$_s" 2>/dev/null; exit 0' TERM; sleep "$_left" & _s=$!; wait "$_s"; kill -TERM "$_cpid" 2>/dev/null ) >/dev/null 2>&1 &
  _kpid=$!
  wait "$_cpid" 2>/dev/null; _crc=$?
  kill -TERM "$_kpid" 2>/dev/null
  wait "$_kpid" 2>/dev/null
  [ "$_crc" = 143 ] && expired && return 3
  return "$_crc"
}

# blob_lines <worktree> (the `status --porcelain=v1 -z -uall` records, then
# fingerprint's synthesized `~<tag> <path>` flagged-path records, on stdin)
# -> one `<blob> <path>` line per listed path, in record order
# (`absent` for a deleted path, `unreadable` when hash-object fails). A rename
# or copy record (R or C in either status column) carries its source path as
# an extra NUL field, skipped here; the line names the new path. Every present
# path goes to ONE `git hash-object --stdin-paths` call per worktree, never one
# spawn per path. That reader (builtin/hash-object.c hash_stdin_paths) reads a
# line with strbuf_getline, which ends a path at a newline and strips a
# trailing CR, and C-unquotes a line whose first byte is a double quote (it
# dies on a raw name). A path with a newline, a path ending in CR and a path
# starting with a double quote therefore get their own `git hash-object --
# <path>` call, which takes the name raw. If the batch fails or returns the
# wrong line count, every batched path is `unreadable`. A symlink is hashed
# as `link-<sha256 of its target text>` and never given to hash-object: that
# call follows the link and reads the target (a file outside the worktree, a
# slow target, or a same-content file a retarget would hide), while git
# itself stores a symlink as its link text. The `-L` test comes before `-f`
# because `-f` follows the link too. Its own function, not an inline loop:
# bash 3.2 misparses a `case` arm's `)` inside `$(...)`. Every hash-object
# call runs under the deadline watchdog (bounded). Returns 3 when the deadline
# passes mid-list or kills a hash-object call (the caller stops hashing),
# else 0.
# hfnew: make blob_lines' hash-output temp file on the first hash-object
# call, so a clean worktree (empty status and no flagged path, no call)
# spawns no mktemp and no rm. hfrm: drop that file (a no-op when none was
# made, or on the /dev/null fallback).
hfnew() { [ -n "$_hf" ] || { _hf="$(mktemp 2>/dev/null)"; [ -n "$_hf" ] || _hf=/dev/null; }; }
hfrm() { [ -z "$_hf" ] || [ "$_hf" = /dev/null ] || rm -f "$_hf"; }
blob_lines() {
  _P=(); _O=(); _n=0; _nb=0; _skip=0; _batch=""; _hf=""
  while IFS= read -r -d '' _l; do
    expired && { hfrm; return 3; }
    if [ "$_skip" = 1 ]; then _skip=0; continue; fi
    case "$_l" in [RC]?*|?[RC]*) _skip=1 ;; esac
    _p="${_l#???}"
    _P[$_n]="$_p"
    if [ -L "$1/$_p" ]; then
      _O[$_n]="link-$(readlink "$1/$_p" | sha256_of_stdin)"
    elif [ ! -f "$1/$_p" ]; then
      _O[$_n]="absent"
    else
      case "$_p" in
        *"$NL"*|\"*|*"$CR")
           hfnew
           bounded "$_hf" /dev/null git -C "$1" hash-object --no-filters -- "$_p"; _brc=$?
           if [ "$_brc" = 3 ]; then hfrm; return 3; fi
           _o=""; [ "$_brc" = 0 ] && _o="$(head -n 1 "$_hf" 2>/dev/null)"
           [ -n "$_o" ] || _o="unreadable"
           _O[$_n]="$_o" ;;
        *) _O[$_n]=""; _batch="$_batch$_p$NL"; _nb=$((_nb + 1)) ;;
      esac
    fi
    _n=$((_n + 1))
  done
  _hashes=""
  if [ "$_nb" -gt 0 ]; then
    _bf="$(mktemp 2>/dev/null)"; [ -n "$_bf" ] || _bf=/dev/null
    printf '%s' "$_batch" > "$_bf" 2>/dev/null
    hfnew
    bounded "$_hf" "$_bf" git -C "$1" hash-object --no-filters --stdin-paths; _brc=$?
    [ "$_bf" = /dev/null ] || rm -f "$_bf"
    if [ "$_brc" = 3 ]; then hfrm; return 3; fi
    [ "$_brc" = 0 ] && _hashes="$(cat "$_hf" 2>/dev/null)"
  fi
  hfrm
  # set -f is on, so this split is on whitespace only (hashes are hex).
  set -- $_hashes
  [ "$#" = "$_nb" ] || set --
  _i=0
  while [ "$_i" -lt "$_n" ]; do
    _o="${_O[$_i]}"
    if [ -z "$_o" ]; then
      if [ "$#" -gt 0 ]; then _o="$1"; shift; else _o="unreadable"; fi
    fi
    printf '%s %s\n' "$_o" "${_P[$_i]}"
    _i=$((_i + 1))
  done
  return 0
}

# fingerprint <worktree> -> prints "<head> <status-sha256>", returns 1 on a
# git error, or returns 3 when the deadline passed before or during hashing.
# The sha256 covers the raw -z status output, one synthesized `~<tag> <path>`
# record per flagged path, and the blob_lines of both. A flagged path is one
# `git ls-files -v -z` tags assume-unchanged (a lowercase tag) or
# skip-worktree (`S`; `s` is both): git status never lists such a path, even
# after an edit, so it is hashed as if dirty, and its record puts the flagged
# set itself in the hashed data (a flag set mid-round changes the
# fingerprint). `~` is never a status column, so a synthesized record cannot
# collide with a status record, and blob_lines strips its three leading bytes
# like any other. Both git calls run with `-c core.fsmonitor=false` (a
# configured fsmonitor command runs under a plain status or ls-files, inside
# the hook process, GIT_OPTIONAL_LOCKS=0 or not), and status runs with `-c
# core.untrackedCache=false` too: git's own change detection is off, so every
# path is read by stat and content. Each `-c` stands before `-C <worktree>`,
# so `-C <worktree>` stays next to the subcommand word. Both calls write ONE
# temp file (a bash variable cannot hold NUL): ls-files first, its flagged
# records kept in a bash array, then status over the same file, with the
# synthesized records appended, so the file feeds both the parse and the hash
# and a clean worktree costs one mktemp. Both run under the deadline watchdog
# (bounded: a call killed at the deadline is 3), and the deadline is checked
# per ls-files record. Read-only on the worktree: both run under the exported
# GIT_OPTIONAL_LOCKS=0, and hash-object runs with --no-filters, so it hashes
# raw bytes and never runs a clean filter (a git-lfs filter writes under
# .git/lfs; an eol filter would hide a line-ending-only edit).
fingerprint() {
  expired && return 3
  _h="$(git -C "$1" rev-parse HEAD 2>/dev/null)" || return 1
  [ -n "$_h" ] || return 1
  _z="$(mktemp 2>/dev/null)" && [ -n "$_z" ] || return 1
  bounded "$_z" /dev/null git -c core.fsmonitor=false -C "$1" ls-files -v -z; _rc=$?
  if [ "$_rc" = 3 ]; then rm -f "$_z"; return 3; fi
  if [ "$_rc" != 0 ]; then rm -f "$_z"; return 1; fi
  _F=(); _nf=0
  while IFS= read -r -d '' _fl; do
    expired && { rm -f "$_z"; return 3; }
    case "$_fl" in [[:lower:]]\ *|S\ *) _F[$_nf]="$_fl"; _nf=$((_nf + 1)) ;; esac
  done < "$_z"
  bounded "$_z" /dev/null git -c core.fsmonitor=false -c core.untrackedCache=false -C "$1" status --porcelain=v1 -z -uall; _rc=$?
  if [ "$_rc" = 3 ]; then rm -f "$_z"; return 3; fi
  if [ "$_rc" != 0 ]; then rm -f "$_z"; return 1; fi
  if [ "$_nf" -gt 0 ]; then
    _fi=0
    while [ "$_fi" -lt "$_nf" ]; do
      printf '~%s\0' "${_F[$_fi]}"
      _fi=$((_fi + 1))
    done >> "$_z"
  fi
  _ch="$(blob_lines "$1" < "$_z")"; _rc=$?
  if [ "$_rc" = 3 ]; then rm -f "$_z"; return 3; fi
  _s="$({ cat "$_z"; printf '\n%s' "$_ch"; } | sha256_of_stdin)"; _rc=$?
  rm -f "$_z"
  [ "$_rc" = 0 ] && [ -n "$_s" ] || return 1
  printf '%s %s\n' "$_h" "$_s"
}

# marked_worktrees_of <repo-dir> -> every worktree of that repository that
# carries a .war-task marker, one canonical path per line.
marked_worktrees_of() {
  git -C "$1" worktree list --porcelain 2>/dev/null | while IFS= read -r _line; do
    case "$_line" in
      "worktree "*)
        _wt="${_line#worktree }"
        [ -e "$_wt/.war-task" ] || continue
        _c="$(canon "$_wt")" && [ -n "$_c" ] && printf '%s\n' "$_c" ;;
    esac
  done
}

# task_worktrees -> the marked worktrees of the payload cwd's repository, then
# those of every initialized submodule `$MAIN/.gitmodules` declares. The
# provision barrier cuts a submodule task's worktree cwd-scoped to the
# submodule path, so it is registered under that submodule's git dir and the
# superproject's `worktree list` never shows it; without this pass every
# seat of a submodule task escalates `no start record`. The path is read from
# `$MAIN`, not the cwd: a superproject worktree carries no initialized
# submodule. A declared path with no `.git` entry (the empty dir a plain
# clone leaves) is skipped: `git -C` there would walk up and list the
# superproject's worktrees a second time. The config record is
# `submodule.<name>.path`, a newline, the path, NUL (the -z form): the
# default name IS the path, so a space-separated read would split
# `submodule.sub dir.path sub dir` at the wrong space. A missing .gitmodules
# is an empty read (stderr dropped), not an error.
task_worktrees() {
  marked_worktrees_of "$cwd"
  git config -z -f "$MAIN/.gitmodules" --get-regexp '^submodule\..*\.path$' 2>/dev/null \
  | while IFS= read -r -d '' _rec; do
      _sp="${_rec#*"$NL"}"
      [ -n "$_sp" ] && [ -e "$MAIN/$_sp/.git" ] || continue
      marked_worktrees_of "$MAIN/$_sp"
    done
}

# marker_root_of <canonical dir> -> the .war-task worktree root that holds
# the dir, or nothing. The parent step is a parameter expansion, not a
# dirname spawn per level.
marker_root_of() {
  _d="$1"
  while :; do
    if [ -e "$_d/.war-task" ]; then printf '%s\n' "$_d"; return 0; fi
    _nd="${_d%/*}"; [ -n "$_nd" ] || _nd=/
    [ "$_nd" = "$_d" ] && return 0
    _d="$_nd"
  done
}

# task_worktree_of <path> -> every canonical .war-task worktree root that
# holds <path>, one per line, or nothing. A relative path resolves against
# the payload cwd. Two readings, each at its own nearest existing ancestor:
# the physical one walks the raw path up by kernel existence and canon's it
# (`..` after a planted `lnk -> <other worktree>/sub` lands in the other
# worktree, as git opens a `--no-index` operand); the lexical one folds the
# `..` as text first (lexical_dir: that same `lnk/..` is the link's own
# parent, and `nosuch/../../x` is `x` although nosuch is missing), as the
# Read tool and git's in-repo rule read it. The reader the hook stands in
# for may follow either rule, so both roots are printed, physical first
# (deduped when the two ancestors agree; touch_line dedupes a shared root).
task_worktree_of() {
  _p="$1"
  case "$_p" in /*) ;; *) _p="$cwd/$_p" ;; esac
  _d="$_p"
  while [ ! -d "$_d" ]; do
    _nd="${_d%/*}"; [ -n "$_nd" ] || _nd=/
    [ "$_nd" = "$_d" ] && break
    _d="$_nd"
  done
  _dp=""; [ -d "$_d" ] && { _dp="$(canon "$_d")" || _dp=""; }
  _dl="$(lexical_dir "$_p")" || _dl=""
  [ -n "$_dp" ] && marker_root_of "$_dp"
  [ -n "$_dl" ] && [ "$_dl" != "$_dp" ] && marker_root_of "$_dl"
  return 0
}

# touch_line <line>: add one line to the touched set (deduped).
touch_line() {
  [ -n "$STATE" ] || return 0
  mkdir -p "$STATE" 2>/dev/null || return 0
  [ -f "$STATE/touched" ] && grep -Fxq -- "$1" "$STATE/touched" 2>/dev/null && return 0
  printf '%s\n' "$1" >> "$STATE/touched"
}

# touch_path <path>: add every worktree <path> reaches (task_worktree_of:
# the physical and the lexical reading) to the touched set.
touch_path() {
  [ -n "$STATE" ] || return 0
  task_worktree_of "$1" | while IFS= read -r _wt; do
    [ -n "$_wt" ] && touch_line "$_wt"
  done
  return 0
}

# base_top: sets _top once per Bash call to the canonical work tree of the
# running base `_base` (`git rev-parse --show-toplevel`), or empty when the
# base is outside any work tree (then every operand is outside it too).
_top=""; _top_set=0
base_top() {
  [ "$_top_set" = 1 ] && return 0
  _top_set=1
  _top="$(git -C "$_base" rev-parse --show-toplevel 2>/dev/null)" || _top=""
  [ -n "$_top" ] && _top="$(canon "$_top")"
}

# outside_top <path>: returns 0 when <path>, absolute or relative to the
# running base `_base`, lies outside the base's work tree, or the base is in
# no work tree. The path is resolved at its nearest existing directory
# ancestor, since git normalizes an operand before it reads it (`/dev/null`
# resolves at `/dev`, `a/missing` at `a`). git's own rule is lexical
# (normalize_path_copy); the path is resolved both ways (the raw path's
# existing ancestor through canon, the folded path's through lexical_dir)
# and either resolution outside the top reports outside, so a divergence
# over a planted link or a missing component fails closed (an over-implied
# --no-index only widens the walk-down). Costs a canon and a lexical_dir
# subshell.
outside_top() {
  base_top
  [ -n "$_top" ] || return 0
  case "$1" in /*) _od="$1" ;; *) _od="$_base/$1" ;; esac
  _oraw="$_od"
  while [ ! -d "$_od" ]; do
    _on="${_od%/*}"; [ -n "$_on" ] || _on=/
    [ "$_on" = "$_od" ] && return 0
    _od="$_on"
  done
  _odp="$(canon "$_od")" && [ -n "$_odp" ] || return 0
  _odl="$(lexical_dir "$_oraw")" && [ -n "$_odl" ] || return 0
  case "$_odp/" in "$_top/"*) ;; *) return 0 ;; esac
  case "$_odl/" in "$_top/"*) ;; *) return 0 ;; esac
  return 1
}

# implied_noindex: returns 0 when git implies --no-index for the Bash command
# `_cmd`, by git's own rule (builtin/diff.c): exactly two tokens follow the
# subcommand word's leading `-` options (a `--` ends them and is skipped), and
# either token is outside the base's work tree (outside_top). The caller
# checks that the subcommand word is `diff` and calls once the global `-C`
# tokens have settled `_base`. Each of the two tokens is shell-expanded like
# any operand (quotes stripped, `~` expanded); a `~<name>` token cannot be
# resolved, so nothing is implied (its literal touched line already escalates
# the verdict). The two tokens are collected first and resolved only when
# the count is exactly two: a one-token `diff A...B` or a third token
# returns before any canon subshell (or base_top's rev-parse) runs.
implied_noindex() {
  [ -n "$_base" ] || return 1
  _ip=1; _ic=0; _iw=0; _il=1; _in=0; _i1=""; _i2=""
  for _ia in $_cmd; do
    if [ "$_ip" = 1 ]; then _ip=0; continue; fi
    if [ "$_ic" = 1 ]; then _ic=0; continue; fi
    if [ "$_iw" = 0 ]; then
      case "$_ia" in -C) _ic=1; continue ;; -C?*) continue ;; esac
      _iw=1; continue
    fi
    case "$_ia" in \"*|\'*) unquote "$_ia" ;; *) tilde "$_ia" || return 1 ;; esac
    if [ "$_il" = 1 ]; then
      case "$_t" in --) _il=0; continue ;; -*) continue ;; esac
      _il=0
    fi
    _in=$((_in + 1))
    case "$_in" in 1) _i1="$_t" ;; 2) _i2="$_t" ;; *) return 1 ;; esac
  done
  [ "$_in" = 2 ] || return 1
  outside_top "$_i1" || outside_top "$_i2"
}

# touch_operand <path>: touch_path, then, when <path> is a directory the
# command reads recursively, every marked worktree below it. `git diff
# --no-index <dir> <x>`, and a two-path `git diff <dir> <x>` with either path
# outside the base's work tree (git implies --no-index: implied_noindex sets
# `_noindex` before any operand is touched), recurse into every task worktree
# under <dir>, which touch_path alone never names (the run directory under
# $MAIN, diffed against a path outside $MAIN, is the live case). An in-repo
# directory operand with neither form of --no-index reads the repository's own
# tree only, so it is not walked (git ignores a nested worktree's content).
# Costs one `git worktree list` per walked directory.
touch_operand() {
  touch_path "$1"
  [ -d "$1" ] || return 0
  _cd="$(canon "$1")" && [ -n "$_cd" ] || return 0
  if [ "$_noindex" != 1 ]; then
    base_top
    case "$_cd/" in "$_top/"*) [ -n "$_top" ] && return 0 ;; esac
  fi
  task_worktrees | while IFS= read -r _w; do
    case "$_w/" in "$_cd/"*) touch_line "$_w" ;; esac
  done
}

# unquote <token>: sets _t to the token with one pair of outer quotes
# (double or single) stripped.
unquote() { _t="$1"; _t="${_t#\"}"; _t="${_t%\"}"; _t="${_t#\'}"; _t="${_t%\'}"; }

# tilde <token>: sets _t to the token with an unquoted word-initial `~`
# expanded as the seat's shell expands it before git runs: `~` and `~/x`
# from HOME, `~+` and `~-` (`+` and `-` are admitted too) from the payload
# cwd (the nearest reading of PWD and OLDPWD the payload offers). Returns 1
# on a `~<name>` form, which only getpwnam can resolve: the caller records
# the token literal so the verdict arm escalates it as unresolved instead of
# comparing nothing.
tilde() {
  _t="$1"
  case "$_t" in
    "~"|"~/"*) [ -n "${HOME-}" ] && _t="$HOME${_t#\~}" ;;
    "~+"|"~+/"*) _t="$cwd${_t#\~+}" ;;
    "~-"|"~-/"*) _t="$cwd${_t#\~-}" ;;
    "~"*) return 1 ;;
  esac
  return 0
}

# touch_c <path>: a resolved global Bash `-C` token (one before the subcommand
# word). Relative to the running base `_base` (git applies each `-C` from the
# previous one), it moves the base and touches the worktree it reaches.
touch_c() {
  case "$1" in /*) _base="$1" ;; *) _base="$_base/$1" ;; esac
  touch_path "$_base"
}

# timeout_reason <worktree> <what>: sets REASON, T_WT and T_TIMEOUT for a
# deadline hit on <worktree> (<what> says which step was cut short).
timeout_reason() {
  T_WT="$1"; T_TIMEOUT=1
  REASON="AUDIT-TAMPER: fingerprint timeout ($1 $2 after ${SECONDS}s, deadline ${DEADLINE}s)"
}

# compare: sets REASON (empty on a clean pass) plus T_WT, T_START, T_NOW and
# T_TIMEOUT. The first failing worktree wins, and T_START and T_NOW are reset
# per worktree so a failing record never carries the previous worktree's
# values. A seat that touched nothing passes only when its start record
# exists: a missing record means the start arm never ran, which is
# unverifiable, not clean. A touched worktree with no start line after a start
# arm that hit the deadline is a PENDING timeout when `$STATE/timeout-skipped`
# lists it: the loop goes on, a mismatch, git error, unresolved path or
# verdict-arm timeout on any touched worktree returns first, and the pending
# timeout applies only when nothing else failed. An unlisted worktree with no
# start line (skipped on a git error, or created after the start) is `no
# start record`; a worktree the start arm did record is compared as usual.
REASON=""; T_WT=""; T_START=""; T_NOW=""; T_TIMEOUT=0
P_REASON=""; P_WT=""
compare() {
  if [ -z "$aid" ]; then
    if [ -n "$aid_raw" ]; then REASON="AUDIT-TAMPER: unverifiable fingerprint (unsafe agent_id in the hook payload)"
    else REASON="AUDIT-TAMPER: unverifiable fingerprint (no agent_id in the hook payload)"; fi
    return 0
  fi
  if [ -z "$MAIN" ]; then REASON="AUDIT-TAMPER: unverifiable fingerprint (no git common dir from cwd '$cwd')"; return 0; fi
  if [ ! -f "$STATE/start" ]; then REASON="AUDIT-TAMPER: unverifiable fingerprint (no start record for agent $aid)"; return 0; fi
  [ -f "$STATE/touched" ] || return 0
  while IFS= read -r _wt || [ -n "$_wt" ]; do
    [ -n "$_wt" ] || continue
    T_START=""; T_NOW=""
    case "$_wt" in /*) ;; *)
      T_WT="$_wt"; REASON="AUDIT-TAMPER: unverifiable fingerprint (unresolved Bash path $_wt)"; return 0 ;;
    esac
    _rec="$(while IFS= read -r _l; do
              _p="${_l#* }"; _p="${_p#* }"
              [ "$_p" = "$_wt" ] && { printf '%s\n' "$_l"; break; }
            done < "$STATE/start")"
    if [ -z "$_rec" ]; then
      if [ -f "$STATE/timeout" ] && grep -Fxq -- "$_wt" "$STATE/timeout-skipped" 2>/dev/null; then
        # The marker is `<N> <D> <worktree>` (see DEADLINE above): the start
        # arm's own deadline is printed, never this run's. Pending: a later
        # touched worktree may still prove a change.
        if [ -z "$P_REASON" ]; then
          _m="$(head -n 1 "$STATE/timeout" 2>/dev/null)"
          _mn="${_m%% *}"; _m="${_m#* }"; _md="${_m%% *}"
          P_WT="$_wt"
          P_REASON="AUDIT-TAMPER: fingerprint timeout (SubagentStart stopped at ${_m#* } after ${_mn}s, deadline ${_md}s; $_wt has no start fingerprint)"
        fi
        continue
      fi
      T_WT="$_wt"; REASON="AUDIT-TAMPER: unverifiable fingerprint (no start record for $_wt)"; return 0
    fi
    _sh="${_rec%% *}"; _rest="${_rec#* }"; _ss="${_rest%% *}"
    T_START="$_sh:$_ss"
    if expired; then timeout_reason "$_wt" "not yet hashed"; return 0; fi
    _now="$(fingerprint "$_wt")"; _frc=$?
    if [ "$_frc" = 3 ]; then timeout_reason "$_wt" "still hashing"; return 0; fi
    if [ "$_frc" != 0 ]; then
      T_WT="$_wt"; REASON="AUDIT-TAMPER: unverifiable fingerprint (git error on $_wt)"; return 0
    fi
    _nh="${_now%% *}"; _ns="${_now#* }"
    T_NOW="$_nh:$_ns"
    if [ "$T_START" != "$T_NOW" ]; then
      T_WT="$_wt"; REASON="AUDIT-TAMPER: $_wt changed during the audit round ($T_START -> $T_NOW)"; return 0
    fi
  done < "$STATE/touched"
  T_WT=""; T_START=""; T_NOW=""
  if [ -n "$P_REASON" ]; then T_WT="$P_WT"; T_TIMEOUT=1; REASON="$P_REASON"; fi
}

# write_tamper_record <event>: `$MAIN/.claude/war/audit-tamper/<agent_id>.json`.
# `seat_verdict` and `seat_escalate_reason` are the seat's own values from the
# StructuredOutput tool input, kept here because the rewrite replaces both
# (null on a SubagentStop record, which carries no tool input): a fail-open
# ruling on a fingerprint timeout accepts `seat_verdict` as the round's verdict
# (resume-and-recovery.md, the AUDIT-TAMPER bullet).
write_tamper_record() {
  [ -n "$MAIN" ] && [ -n "$aid" ] || return 0
  _dir="$MAIN/.claude/war/audit-tamper"
  mkdir -p "$_dir" 2>/dev/null || return 0
  jq -nc --arg aid "$aid" --arg at "$atype" --arg ev "$1" --arg wt "$T_WT" \
    --arg s "$T_START" --arg n "$T_NOW" --arg r "$REASON" --arg to "$T_TIMEOUT" \
    --arg sv "$(get '.tool_input.verdict')" --arg sr "$(get '.tool_input.escalate_reason')" \
    --arg when "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{agent_id:$aid, agent_type:$at, event:$ev, worktree:$wt, start:$s, now:$n, reason:$r, timeout:($to == "1"),
      seat_verdict:(if $sv == "" then null else $sv end), seat_escalate_reason:(if $sr == "" then null else $sr end),
      recorded_at:$when}' \
    > "$_dir/$aid.json" 2>/dev/null || true
}

# --- arms --------------------------------------------------------------------

case "$event" in
  SubagentStart)
    [ -n "$STATE" ] || exit 0
    mkdir -p "$STATE" 2>/dev/null || exit 0
    : > "$STATE/start"
    : > "$STATE/touched"
    rm -f "$STATE/timeout" "$STATE/timeout-skipped"
    # Past the deadline the loop stops: `timeout` names the elapsed seconds,
    # this arm's deadline and the first worktree left unrecorded, and
    # `timeout-skipped` lists that worktree plus every one still unread on
    # the pipe (drained with cat), so compare can tell a deadline skip from a
    # git-error skip (see DEADLINE above).
    task_worktrees | while IFS= read -r _wt; do
      [ -n "$_wt" ] || continue
      _frc=0
      if expired; then _frc=3; else _fp="$(fingerprint "$_wt")"; _frc=$?; fi
      if [ "$_frc" = 3 ]; then
        printf '%s %s %s\n' "$SECONDS" "$DEADLINE" "$_wt" > "$STATE/timeout"
        { printf '%s\n' "$_wt"; cat; } > "$STATE/timeout-skipped"
        break
      fi
      [ "$_frc" = 0 ] || continue
      printf '%s %s\n' "$_fp" "$_wt" >> "$STATE/start"
    done
    exit 0 ;;

  PreToolUse)
    case "$tool" in
      Read)
        _p="$(get '.tool_input.file_path')"
        [ -n "$_p" ] && touch_path "$_p"
        exit 0 ;;
      Glob|Grep)
        _p="$(get '.tool_input.path')"
        [ -n "$_p" ] || _p="$cwd"
        touch_path "$_p"
        # An absolute Glob pattern reaches its own tree whatever `path` says:
        # touch the prefix up to the first glob metacharacter (`*`, `?`, `[`,
        # `{`), the literal directory the pattern walks.
        if [ "$tool" = Glob ]; then
          _pat="$(get '.tool_input.pattern')"
          case "$_pat" in /*) touch_path "${_pat%%[*?\[{]*}" ;; esac
        fi
        exit 0 ;;
      Bash)
        # Every global `-C <path>` (or `-C<path>`) token names a worktree the
        # command reaches; with none, the command runs in the payload cwd.
        # Global means BEFORE the subcommand word: `_sub` is set on the first
        # token that is not `-C`, a `-C` value or an attached `-C<path>` (the
        # guard admits no other global option), and after it a `-C` or `-C<n>`
        # token is git's copy-detection flag (diff, log, blame), classified as
        # a flag like any `-*` token, so `git diff -C ../wtB/f ../wtD/f` keeps
        # its operand base. Tokens are whitespace-split only (set -f above: a
        # glob token stays literal); a quoted path has its quotes stripped.
        # An unquoted word-initial `~` (admitted by validate-auditor-git.sh
        # for HEAD~1) is expanded by the seat's shell before git sees it, so
        # the hook expands that form too (see tilde above), on a `-C` value
        # and on an operand alike; a `~<name>` form goes into the touched set
        # literal. A quoted `'~/x'` or an attached `-C~/x` reaches git literal
        # and stays literal here. Every other token, quotes stripped, is
        # classified as a path: an absolute one (`/...`) is touched as is, a
        # `--<opt>=<value>` token is classified by the value after its first
        # `=` (`--contents=/abs/f`, `--contents=../wtB/f`, `--contents=a/f`),
        # an attached short-option value (`-O<orderfile>`, `-X<exclude-file>`:
        # git reads those files) is classified by the text after its option
        # letter (a non-path value such as `-n5` or `-M50%` resolves to the
        # base, already touched), and when that token is a short-option
        # cluster (git's parse_options reads a cluster letter by letter, so
        # `-pO<orderfile>` and `-tX<exclude-file>` read the file too) the
        # text after the first file-valued letter in the cluster (`O`
        # orderfile, `X` exclude file, `S` blame revs file) is classified as
        # a path as well; the cluster arm is skipped when the first letter is
        # itself file-valued, since the plain arm has that token (a non-path
        # tail resolves to the base), any other token that starts with `-` is
        # a flag and costs no spawn, and EVERY other token (`../wtB/f`,
        # `./x/f`, `a/../b/f`, `a/b/f`, `wtB`, `diff`,
        # `HEAD~1`, the value of a space-form `--contents <f>`) resolves
        # against the running base: the payload cwd, moved by each resolved
        # global `-C` in order. validate-auditor-git.sh admits `git diff
        # /abs/wtB/f /abs/wtB/g`, `git diff ../wtB/f ../wtB/g`, `git diff
        # --no-index .claude/war-worktrees/R/T/f /dev/null` and `git -C <run
        # dir> diff --no-index T1 T2` alike (`.`, `/` and `=` are in its
        # character allowlist, it peels one `-C <path>`, and it polices no
        # diff or blame flag), and git implies --no-index for a two-path
        # `diff` with either path outside the base's work tree (the payload
        # cwd, moved by each global -C), so the command reads a worktree the
        # `-C` scan and the cwd fallback never name. A slashless operand is
        # NOT skipped: after a `-C` into a run directory
        # (`$MAIN/.claude/war-worktrees/<run>`) a bare `<task>` names a whole
        # task worktree. A token that names no directory (`diff`, `HEAD~1`)
        # resolves to the base, which the `-C` arm or the cwd fallback
        # touched already (touch_line dedupes), so over-touch costs
        # task_worktree_of's canon and lexical_dir subshells and under-touch
        # would leave a read worktree uncompared.
        # Every operand goes through touch_operand: a directory operand that
        # holds task worktrees (the run directory, `$TMP`, `.` under
        # --no-index) adds each of them when the command recurses into them.
        # `_noindex` is pre-scanned over the whole command, since git reads
        # the flag wherever it stands, and set again at the subcommand word
        # when git implies the flag (implied_noindex: a two-path `diff` with
        # either path outside the base's work tree). The first token is the program name
        # (`git`, the only one the guard admits) and names no path, so it is
        # skipped: resolved against the payload cwd it would touch a worktree
        # a `-C` command never reads. After an unresolved `~<name>` -C the
        # base is unknown, so a later relative operand is not resolved; the
        # literal line already makes the verdict arm escalate, so nothing is
        # lost. The cwd fallback is unchanged by an operand token: the
        # command still runs in the payload cwd, and the fallback never walks
        # down into nested worktrees (touch_path, not touch_operand).
        _cmd="$(get '.tool_input.command')"
        _found=0; _want=0; _base="$cwd"; _first=1; _sub=0; _noindex=0
        for _tok in $_cmd; do
          [ "$_tok" = --no-index ] && _noindex=1
        done
        for _tok in $_cmd; do
          if [ "$_first" = 1 ]; then _first=0; continue; fi
          if [ "$_want" = 1 ]; then
            _want=0; _found=1
            case "$_tok" in
              \"*|\'*) unquote "$_tok"; _tok="$_t" ;;
              *) if tilde "$_tok"; then _tok="$_t"; else touch_line "$_tok"; _base=""; continue; fi ;;
            esac
            [ -n "$_tok" ] && touch_c "$_tok"
            continue
          fi
          if [ "$_sub" = 0 ]; then
            case "$_tok" in
              -C) _want=1; continue ;;
              -C?*) _found=1; unquote "${_tok#-C}"; touch_c "$_t"; continue ;;
            esac
            _sub=1
            # The subcommand word is known and every global `-C` has moved
            # `_base`, so git's implied --no-index is decided here.
            if [ "$_noindex" != 1 ]; then
              unquote "$_tok"
              [ "$_t" = diff ] && implied_noindex && _noindex=1
            fi
          fi
          case "$_tok" in
            \"*|\'*) unquote "$_tok" ;;
            *) if tilde "$_tok"; then :; else touch_line "$_tok"; continue; fi ;;
          esac
          case "$_t" in --*=*) _t="${_t#*=}" ;; esac
          case "$_t" in
            /*) touch_operand "$_t" ;;
            -[!-]?*) _v="${_t#-?}"
               case "$_v" in /*) touch_path "$_v" ;; *) [ -n "$_base" ] && touch_path "$_base/$_v" ;; esac
               case "$_t" in -[!OXS]*[OXS]?*) _v2="${_t#-*[OXS]}"
                 case "$_v2" in /*) touch_path "$_v2" ;; *) [ -n "$_base" ] && touch_path "$_base/$_v2" ;; esac ;;
               esac ;;
            -*) ;;
            *) [ -n "$_base" ] && touch_operand "$_base/$_t" ;;
          esac
        done
        [ "$_found" = 0 ] && touch_path "$cwd"
        exit 0 ;;
      StructuredOutput)
        compare
        [ -n "$REASON" ] || exit 0
        # A timeout reason carries the seat's own verdict, sanitized to the
        # schema enum (any other value prints `unparsed`), so the Lead can
        # cross-check the worker-writable record against the audit log.
        if [ "$T_TIMEOUT" = 1 ]; then
          _sv="$(get '.tool_input.verdict')"
          case "$_sv" in approve|request_changes|escalate) ;; *) _sv=unparsed ;; esac
          REASON="${REASON%)}; seat verdict $_sv)"
        fi
        write_tamper_record "PreToolUse:StructuredOutput"
        echo "WAR: audit tree fingerprint: $REASON" >&2
        printf '%s' "$input" | jq -c --arg r "$REASON" \
          '{hookSpecificOutput:{hookEventName:"PreToolUse", permissionDecision:"allow",
            updatedInput:(((.tool_input // {}) | if type=="object" then . else {} end)
                          | .verdict="escalate" | .escalate_reason=$r)}}' \
          || infra "could not build the updatedInput payload"
        exit 0 ;;
      *) exit 0 ;;
    esac ;;

  SubagentStop)
    compare
    [ -n "$REASON" ] || exit 0
    # A verdict-time record outranks the stop-time one: the Lead reads a
    # SubagentStop record as informational (the verdict stood), so the stop
    # arm never overwrites the record that documents a rewritten verdict.
    _prev="$MAIN/.claude/war/audit-tamper/$aid.json"
    if [ -n "$aid" ] && [ -f "$_prev" ] \
       && [ "$(jq -r '.event // empty' "$_prev" 2>/dev/null)" = "PreToolUse:StructuredOutput" ]; then :
    else write_tamper_record "SubagentStop"; fi
    echo "WAR: audit tree fingerprint: $REASON" >&2
    exit 0 ;;

  *) exit 0 ;;
esac
