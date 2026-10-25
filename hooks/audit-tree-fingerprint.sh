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
#         --porcelain=v1 -z -uall` joined with the blob hash (`git hash-object
#         --no-filters`, no write, no clean filter) of every path that status
#         lists.
#         The blob hashes make the fingerprint content-sensitive: a status line
#         is the same before and after a second edit to an already-dirty file.
#         The -z form carries every path raw; the newline form C-quotes a path
#         with a space, a double quote, a backslash or a control byte (even
#         under core.quotePath=false), and such a path could not be hashed.
#         The hash-object batch reader has line rules of its own (see
#         blob_lines): a path that reader would rewrite gets its own call.
#     (2) PreToolUse on Read, Bash, Glob, Grep: resolve the `.war-task`
#         worktree the call reaches (a Read file_path, a Glob or Grep path, an
#         absolute Glob pattern, a Bash `git -C <path>`, an absolute Bash
#         operand, any relative Bash operand, or the value after `=` of a
#         Bash `--<opt>=<path>` token, else the payload cwd) and add it to
#         the seat's touched set.
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
#   under the hooks.json timeout, so the hook always ends before Claude Code
#   kills it. The deadline is measured on bash's SECONDS from the hook's
#   start and checked per worktree in the start and compare loops and per
#   path in blob_lines. Past the deadline the hook stops
#   hashing: the StructuredOutput arm escalates with `AUDIT-TAMPER:
#   fingerprint timeout (<worktree> ... after <N>s, deadline <D>s)` and writes
#   the tamper record with `"timeout": true`; the SubagentStop arm records the
#   same; the SubagentStart arm writes `$STATE/timeout` (`<N> <D> <worktree>`:
#   the elapsed seconds, the start arm's own deadline and the first worktree
#   left unrecorded), so a verdict on a worktree it never recorded escalates
#   with the timeout reason, naming that stored deadline (the verdict arm may
#   run under another), and never with `no start record`. The Lead's question
#   on that reason (fail closed or fail open) is in resume-and-recovery.md.
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
#   `$MAIN/.claude/war/audit-fingerprints/<agent_id>/{start,touched}`, where
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
# per path. The override must stay under the 600 s hooks.json timeout
# (`[` fails on a non-numeric or oversized value, so that falls back too).
DEADLINE="${WAR_FINGERPRINT_DEADLINE_SECONDS-}"
case "$DEADLINE" in ''|*[!0-9]*) DEADLINE=540 ;; esac
[ "$DEADLINE" -lt 600 ] 2>/dev/null || DEADLINE=540
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

# canon <dir> -> the physical path of an existing dir.
canon() { (cd "$1" 2>/dev/null && pwd -P); }

# blob_lines <worktree> (the `status --porcelain=v1 -z -uall` records on
# stdin) -> one `<blob> <path>` line per listed path, in record order
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
# bash 3.2 misparses a `case` arm's `)` inside `$(...)`. Returns 3 when the
# deadline passes mid-list (the caller stops hashing), else 0.
blob_lines() {
  _P=(); _O=(); _n=0; _nb=0; _skip=0; _batch=""
  while IFS= read -r -d '' _l; do
    expired && return 3
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
           _o="$(git -C "$1" hash-object --no-filters -- "$_p" 2>/dev/null)" && [ -n "$_o" ] || _o="unreadable"
           _O[$_n]="$_o" ;;
        *) _O[$_n]=""; _batch="$_batch$_p$NL"; _nb=$((_nb + 1)) ;;
      esac
    fi
    _n=$((_n + 1))
  done
  _hashes=""
  if [ "$_nb" -gt 0 ]; then
    _hashes="$(printf '%s' "$_batch" | git -C "$1" hash-object --no-filters --stdin-paths 2>/dev/null)" || _hashes=""
  fi
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
# The sha256 covers the raw -z status output plus its blob_lines. The status
# bytes land in a temp file (a bash variable cannot hold NUL) that feeds both
# the parse and the hash from ONE status run. Read-only on the worktree:
# status runs under the exported GIT_OPTIONAL_LOCKS=0, and hash-object runs
# with --no-filters, so it hashes raw bytes and never runs a clean filter (a
# git-lfs filter writes under .git/lfs; an eol filter would hide a
# line-ending-only edit).
fingerprint() {
  expired && return 3
  _h="$(git -C "$1" rev-parse HEAD 2>/dev/null)" || return 1
  [ -n "$_h" ] || return 1
  _z="$(mktemp 2>/dev/null)" && [ -n "$_z" ] || return 1
  if ! git -C "$1" status --porcelain=v1 -z -uall > "$_z" 2>/dev/null; then rm -f "$_z"; return 1; fi
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

# task_worktree_of <path> -> the canonical .war-task worktree root that holds
# <path>, or nothing. A relative path resolves against the payload cwd. The
# walk runs on the canonical path of the nearest existing ancestor, so a `..`
# segment or a symlink cannot name a different worktree than it reaches. The
# parent step is a parameter expansion, not a dirname spawn per level.
task_worktree_of() {
  _p="$1"
  case "$_p" in /*) ;; *) _p="$cwd/$_p" ;; esac
  _d="$_p"
  while [ ! -d "$_d" ]; do
    _nd="${_d%/*}"; [ -n "$_nd" ] || _nd=/
    [ "$_nd" = "$_d" ] && return 0
    _d="$_nd"
  done
  _d="$(canon "$_d")" || return 0
  while :; do
    if [ -e "$_d/.war-task" ]; then printf '%s\n' "$_d"; return 0; fi
    _nd="${_d%/*}"; [ -n "$_nd" ] || _nd=/
    [ "$_nd" = "$_d" ] && return 0
    _d="$_nd"
  done
}

# touch_line <line>: add one line to the touched set (deduped).
touch_line() {
  [ -n "$STATE" ] || return 0
  mkdir -p "$STATE" 2>/dev/null || return 0
  [ -f "$STATE/touched" ] && grep -Fxq -- "$1" "$STATE/touched" 2>/dev/null && return 0
  printf '%s\n' "$1" >> "$STATE/touched"
}

# touch_path <path>: add the worktree <path> reaches to the touched set.
touch_path() {
  [ -n "$STATE" ] || return 0
  _wt="$(task_worktree_of "$1")"
  [ -n "$_wt" ] || return 0
  touch_line "$_wt"
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

# touch_c <path>: a resolved Bash `-C` token. Relative to the running base
# `_base` (git applies each `-C` from the previous one), it moves the base
# and touches the worktree it reaches.
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
# arm that hit the deadline (`$STATE/timeout` present) is a timeout, named as
# such, never `no start record`; a worktree the start arm did record before
# the deadline is compared as usual.
REASON=""; T_WT=""; T_START=""; T_NOW=""; T_TIMEOUT=0
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
      if [ -f "$STATE/timeout" ]; then
        # The marker is `<N> <D> <worktree>` (see DEADLINE above): the start
        # arm's own deadline is printed, never this run's.
        _m="$(head -n 1 "$STATE/timeout" 2>/dev/null)"
        _mn="${_m%% *}"; _m="${_m#* }"; _md="${_m%% *}"
        T_WT="$_wt"; T_TIMEOUT=1
        REASON="AUDIT-TAMPER: fingerprint timeout (SubagentStart stopped at ${_m#* } after ${_mn}s, deadline ${_md}s; $_wt has no start fingerprint)"
        return 0
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
    rm -f "$STATE/timeout"
    # Past the deadline the loop stops and `timeout` names the elapsed
    # seconds, this arm's deadline and the first worktree left unrecorded
    # (see DEADLINE above).
    task_worktrees | while IFS= read -r _wt; do
      [ -n "$_wt" ] || continue
      if expired; then printf '%s %s %s\n' "$SECONDS" "$DEADLINE" "$_wt" > "$STATE/timeout"; break; fi
      _fp="$(fingerprint "$_wt")"; _frc=$?
      if [ "$_frc" = 3 ]; then printf '%s %s %s\n' "$SECONDS" "$DEADLINE" "$_wt" > "$STATE/timeout"; break; fi
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
        # Every `-C <path>` (or `-C<path>`) token names a worktree the command
        # reaches; with none, the command runs in the payload cwd. Tokens are
        # whitespace-split only (set -f above: a glob token stays literal); a
        # quoted path has its quotes stripped. An unquoted word-initial `~`
        # (admitted by validate-auditor-git.sh for HEAD~1) is expanded by the
        # seat's shell before git sees it, so the hook expands that form too
        # (see tilde above), on a `-C` value and on an operand alike; a
        # `~<name>` form goes into the touched set literal. A quoted `'~/x'`
        # or an attached `-C~/x` reaches git literal and stays literal here.
        # Every other token, quotes stripped, is classified as a path: an
        # absolute one (`/...`) is touched as is, a `--<opt>=<value>` token
        # is classified by the value after its first `=` (`--contents=/abs/f`,
        # `--contents=../wtB/f`), a token that starts with `-` is a flag and
        # costs no spawn, and EVERY other token (`../wtB/f`, `./x/f`, `a/b/f`,
        # `wtB`, `diff`, `HEAD~1`) resolves against the running base: the
        # payload cwd, moved by each resolved `-C` in order, as git applies
        # `-C` itself. validate-auditor-git.sh admits `git diff /abs/wtB/f
        # /abs/wtB/g`, `git diff ../wtB/f ../wtB/g`, `git diff --no-index
        # .claude/war-worktrees/R/T/f /dev/null` and `git -C <run dir> diff
        # --no-index T1 T2` alike (`.`, `/` and `=` are in its character
        # allowlist, it peels one `-C <path>`, and it polices no diff or blame
        # flag), and git implies --no-index for a path outside the cwd
        # repository's work tree, so the command reads a worktree the `-C`
        # scan and the cwd fallback never name. A slashless operand is NOT
        # skipped: after a `-C` into a run directory
        # (`$MAIN/.claude/war-worktrees/<run>`) a bare `<task>` names a whole
        # task worktree. A token that names no directory (`diff`, `HEAD~1`)
        # resolves to the base, which the `-C` arm or the cwd fallback
        # touched already (touch_line dedupes), so over-touch costs one canon
        # subshell and under-touch would leave a read worktree uncompared.
        # The first token is the program name (`git`, the only one the guard
        # admits) and names no path, so it is skipped: resolved against the
        # payload cwd it would touch a worktree a `-C` command never reads.
        # After an unresolved `~<name>` -C the base is unknown, so a later
        # relative operand is not resolved; the literal line already makes
        # the verdict arm escalate, so nothing is lost.
        # Residual: an operand that names an ANCESTOR of task worktrees (the
        # run directory itself) reaches every worktree under it through
        # `diff --no-index` recursion and is not resolved to them. The cwd
        # fallback is unchanged by an operand token: the command still runs
        # in the payload cwd.
        _cmd="$(get '.tool_input.command')"
        _found=0; _want=0; _base="$cwd"; _first=1
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
          case "$_tok" in
            -C) _want=1 ;;
            -C?*) _found=1; unquote "${_tok#-C}"; touch_c "$_t" ;;
            *) case "$_tok" in
                 \"*|\'*) unquote "$_tok" ;;
                 *) if tilde "$_tok"; then :; else touch_line "$_tok"; continue; fi ;;
               esac
               case "$_t" in --*=*) _t="${_t#*=}" ;; esac
               case "$_t" in
                 /*) touch_path "$_t" ;;
                 -*) ;;
                 *) [ -n "$_base" ] && touch_path "$_base/$_t" ;;
               esac ;;
          esac
        done
        [ "$_found" = 0 ] && touch_path "$cwd"
        exit 0 ;;
      StructuredOutput)
        compare
        [ -n "$REASON" ] || exit 0
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
