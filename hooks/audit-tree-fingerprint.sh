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
#         (`git worktree list --porcelain`, marker present): HEAD sha plus the
#         sha256 of `git status --porcelain=v1 -z -uall` joined with the blob
#         hash (`git hash-object`, no write) of every path that status lists.
#         The blob hashes make the fingerprint content-sensitive: a status line
#         is the same before and after a second edit to an already-dirty file.
#         The -z form carries every path raw; the newline form C-quotes a path
#         with a space, a double quote, a backslash or a control byte (even
#         under core.quotePath=false), and such a path could not be hashed.
#     (2) PreToolUse on Read, Bash, Glob, Grep: resolve the `.war-task`
#         worktree the call reaches (a Read file_path, a Glob or Grep path, a
#         Bash `git -C <path>`, else the payload cwd) and add it to the seat's
#         touched set.
#     (3) PreToolUse on StructuredOutput: recompute every touched worktree's
#         fingerprint and compare it with the start record. A match exits 0
#         with no output. A mismatch, or a fingerprint it cannot compute (no
#         agent_id, no git common dir, a missing start record, a git error),
#         ALLOWS the call with an `updatedInput` that keeps the seat's verdict
#         JSON but sets `verdict` to `escalate` and `escalate_reason` to
#         `AUDIT-TAMPER: <worktree> changed during the audit round (<start> -> <now>)`
#         or `AUDIT-TAMPER: unverifiable fingerprint (<cause>)`, and writes a
#         record to `$MAIN/.claude/war/audit-tamper/<agent_id>.json`.
#     (4) SubagentStop: the same comparison, record only, never a block.
#   A worktree the seat never touched is never compared, so concurrent workers
#   in sibling worktrees cannot trip it.
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
#   canonical worktree path per line. Worktree paths are canonical (`pwd -P`)
#   on both sides, so a symlinked temp dir compares equal to its real path.
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
#   payload (without jq the agent type is read by a value-anchored grep, so a
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

infra() { echo "WAR: audit tree fingerprint: $1" >&2; exit 2; }

input="$(cat)"

# Without jq the agent type is read by a value-anchored grep on the raw payload
# (a JSON string value ending war-auditor or war-evidence-auditor), so the two
# seat types fail closed and every other caller passes through.
if ! command -v jq >/dev/null 2>&1; then
  if printf '%s' "$input" | grep -q 'war-\(evidence-\)\{0,1\}auditor"'; then
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
aid="$(get '.agent_id')"
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
# spawn per path; a path with a newline, which that reader cannot carry, gets
# its own call. If the batch fails or returns the wrong line count, every
# batched path is `unreadable`. Its own function, not an inline loop: bash 3.2
# misparses a `case` arm's `)` inside `$(...)`.
blob_lines() {
  _P=(); _O=(); _n=0; _nb=0; _skip=0; _batch=""
  while IFS= read -r -d '' _l; do
    if [ "$_skip" = 1 ]; then _skip=0; continue; fi
    case "$_l" in [RC]?*|?[RC]*) _skip=1 ;; esac
    _p="${_l#???}"
    _P[$_n]="$_p"
    if [ ! -f "$1/$_p" ]; then
      _O[$_n]="absent"
    else
      case "$_p" in
        *"$NL"*) _o="$(git -C "$1" hash-object -- "$_p" 2>/dev/null)" && [ -n "$_o" ] || _o="unreadable"
                 _O[$_n]="$_o" ;;
        *) _O[$_n]=""; _batch="$_batch$_p$NL"; _nb=$((_nb + 1)) ;;
      esac
    fi
    _n=$((_n + 1))
  done
  _hashes=""
  if [ "$_nb" -gt 0 ]; then
    _hashes="$(printf '%s' "$_batch" | git -C "$1" hash-object --stdin-paths 2>/dev/null)" || _hashes=""
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
}

# fingerprint <worktree> -> prints "<head> <status-sha256>", or returns 1.
# The sha256 covers the raw -z status output plus its blob_lines. The status
# bytes land in a temp file (a bash variable cannot hold NUL) that feeds both
# the parse and the hash from ONE status run. Read-only on the worktree:
# status runs under the exported GIT_OPTIONAL_LOCKS=0, hash-object never
# writes.
fingerprint() {
  _h="$(git -C "$1" rev-parse HEAD 2>/dev/null)" || return 1
  [ -n "$_h" ] || return 1
  _z="$(mktemp 2>/dev/null)" && [ -n "$_z" ] || return 1
  if ! git -C "$1" status --porcelain=v1 -z -uall > "$_z" 2>/dev/null; then rm -f "$_z"; return 1; fi
  _ch="$(blob_lines "$1" < "$_z")"
  _s="$({ cat "$_z"; printf '\n%s' "$_ch"; } | sha256_of_stdin)"; _rc=$?
  rm -f "$_z"
  [ "$_rc" = 0 ] && [ -n "$_s" ] || return 1
  printf '%s %s\n' "$_h" "$_s"
}

# task_worktrees -> every worktree of this repo that carries a .war-task
# marker, one canonical path per line.
task_worktrees() {
  git -C "$cwd" worktree list --porcelain 2>/dev/null | while IFS= read -r _line; do
    case "$_line" in
      "worktree "*)
        _wt="${_line#worktree }"
        [ -e "$_wt/.war-task" ] || continue
        _c="$(canon "$_wt")" && [ -n "$_c" ] && printf '%s\n' "$_c" ;;
    esac
  done
}

# task_worktree_of <path> -> the canonical .war-task worktree root that holds
# <path>, or nothing. A relative path resolves against the payload cwd. The
# walk runs on the canonical path of the nearest existing ancestor, so a `..`
# segment or a symlink cannot name a different worktree than it reaches.
task_worktree_of() {
  _p="$1"
  case "$_p" in /*) ;; *) _p="$cwd/$_p" ;; esac
  _d="$_p"
  while [ ! -d "$_d" ]; do
    _nd="$(dirname "$_d")"
    [ "$_nd" = "$_d" ] && return 0
    _d="$_nd"
  done
  _d="$(canon "$_d")" || return 0
  while :; do
    if [ -e "$_d/.war-task" ]; then printf '%s\n' "$_d"; return 0; fi
    _nd="$(dirname "$_d")"
    [ "$_nd" = "$_d" ] && return 0
    _d="$_nd"
  done
}

# touch_path <path>: add the worktree <path> reaches to the touched set.
touch_path() {
  [ -n "$STATE" ] || return 0
  _wt="$(task_worktree_of "$1")"
  [ -n "$_wt" ] || return 0
  mkdir -p "$STATE" 2>/dev/null || return 0
  [ -f "$STATE/touched" ] && grep -Fxq -- "$_wt" "$STATE/touched" 2>/dev/null && return 0
  printf '%s\n' "$_wt" >> "$STATE/touched"
}

# compare: sets REASON (empty on a clean pass) plus T_WT, T_START, T_NOW.
# The first failing worktree wins. A seat that touched nothing passes only
# when its start record exists: a missing record means the start arm never
# ran, which is unverifiable, not clean.
REASON=""; T_WT=""; T_START=""; T_NOW=""
compare() {
  if [ -z "$aid" ]; then REASON="AUDIT-TAMPER: unverifiable fingerprint (no agent_id in the hook payload)"; return 0; fi
  if [ -z "$MAIN" ]; then REASON="AUDIT-TAMPER: unverifiable fingerprint (no git common dir from cwd '$cwd')"; return 0; fi
  if [ ! -f "$STATE/start" ]; then REASON="AUDIT-TAMPER: unverifiable fingerprint (no start record for agent $aid)"; return 0; fi
  [ -f "$STATE/touched" ] || return 0
  while IFS= read -r _wt || [ -n "$_wt" ]; do
    [ -n "$_wt" ] || continue
    _rec="$(while IFS= read -r _l; do
              _p="${_l#* }"; _p="${_p#* }"
              [ "$_p" = "$_wt" ] && { printf '%s\n' "$_l"; break; }
            done < "$STATE/start")"
    if [ -z "$_rec" ]; then
      T_WT="$_wt"; REASON="AUDIT-TAMPER: unverifiable fingerprint (no start record for $_wt)"; return 0
    fi
    _sh="${_rec%% *}"; _rest="${_rec#* }"; _ss="${_rest%% *}"
    T_START="$_sh:$_ss"
    if ! _now="$(fingerprint "$_wt")"; then
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
write_tamper_record() {
  [ -n "$MAIN" ] && [ -n "$aid" ] || return 0
  _dir="$MAIN/.claude/war/audit-tamper"
  mkdir -p "$_dir" 2>/dev/null || return 0
  jq -nc --arg aid "$aid" --arg at "$atype" --arg ev "$1" --arg wt "$T_WT" \
    --arg s "$T_START" --arg n "$T_NOW" --arg r "$REASON" \
    --arg when "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{agent_id:$aid, agent_type:$at, event:$ev, worktree:$wt, start:$s, now:$n, reason:$r, recorded_at:$when}' \
    > "$_dir/$aid.json" 2>/dev/null || true
}

# --- arms --------------------------------------------------------------------

case "$event" in
  SubagentStart)
    [ -n "$STATE" ] || exit 0
    mkdir -p "$STATE" 2>/dev/null || exit 0
    : > "$STATE/start"
    : > "$STATE/touched"
    task_worktrees | while IFS= read -r _wt; do
      [ -n "$_wt" ] || continue
      _fp="$(fingerprint "$_wt")" || continue
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
        exit 0 ;;
      Bash)
        # Every `-C <path>` (or `-C<path>`) token names a worktree the command
        # reaches; with none, the command runs in the payload cwd. Tokens are
        # whitespace-split only (set -f above: a glob token stays literal); a
        # quoted path has its quotes stripped.
        _cmd="$(get '.tool_input.command')"
        _found=0; _want=0
        for _tok in $_cmd; do
          if [ "$_want" = 1 ]; then
            _want=0; _found=1
            _tok="${_tok#\"}"; _tok="${_tok%\"}"; _tok="${_tok#\'}"; _tok="${_tok%\'}"
            [ -n "$_tok" ] && touch_path "$_tok"
            continue
          fi
          case "$_tok" in
            -C) _want=1 ;;
            -C?*) _found=1; _t="${_tok#-C}"; _t="${_t#\"}"; _t="${_t%\"}"; _t="${_t#\'}"; _t="${_t%\'}"; touch_path "$_t" ;;
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
    write_tamper_record "SubagentStop"
    echo "WAR: audit tree fingerprint: $REASON" >&2
    exit 0 ;;

  *) exit 0 ;;
esac
