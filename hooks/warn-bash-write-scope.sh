#!/usr/bin/env bash
# WAR worker Bash-write advisory warn-hook (PreToolUse: Bash).
# F01 D4 — advisory, non-blocking, best-effort.
#
# PURPOSE
#   Detects when a war-worker's Bash command appears to write to a path
#   outside any provisioned worktree (no .war-task ancestor), and emits a
#   warning to stderr.  ALWAYS exits 0 — this hook is advisory only and
#   never blocks execution.
#
# SCOPE
#   Active ONLY for agent_type matching *war-worker*.  All other agents
#   (refiner, servitor, auditor, main session, unknown) → silent exit 0.
#
# DETECTION (conservative, low-false-positive)
#   Scans .tool_input.command for patterns that imply a write:
#     - Shell redirections:  > PATH  or  >> PATH
#     - tee TARGET
#     - sed -i … FILE
#     - perl -i … FILE
#     - git -C DIR
#     - cp SRC DEST  (last non-flag arg)
#     - mv SRC DEST  (last non-flag arg)
#     - install … DEST
#     - dd of=PATH
#   Resolves the obvious write target(s).  For each resolved target, walks
#   its ancestors: if none holds a .war-task marker → emit a warning on
#   stderr and continue (exit 0).
#
# LIMITATIONS (accepted per ADR 0002 / plan notes)
#   - Opaque writes (python -c "open(...)", here-doc targets, etc.) are
#     missed.  This is a best-effort detector, not a guarantee.
#   - A '>' inside a quoted string like '[ "$x" = ">" ]' may be detected
#     as a redirect target — exit 0 is still guaranteed.
#   - git -C into a sibling worktree (which has a .war-task) is silently
#     allowed, consistent with the ratified sibling-write residual.
#   See docs/adr/0002-scope-by-agent-type.md.
#
# CONSTRAINTS
#   Must run on macOS bash 3.2.57 — no globstar, no associative arrays,
#   no ${,,}.  Reads payload via jq (already a hook dependency).
set -euo pipefail

input="$(cat)"
get() { printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null || true; }

atype="$(get '.agent_type')"
cmd="$(get '.tool_input.command')"

# --- Only warn for war-worker agents ---
case "$atype" in
  *war-worker*) ;;
  *) exit 0 ;;
esac

# --- If no command, nothing to inspect ---
[ -z "$cmd" ] && exit 0

# has_war_task <path>: walk path ancestors; return 0 if any holds .war-task.
has_war_task() {
  _p="$1"
  _d="$(dirname "$_p")"
  _prev=""
  while [ -n "$_d" ] && [ "$_d" != "$_prev" ]; do
    [ -e "$_d/.war-task" ] && return 0
    [ "$_d" = "/" ] && break
    _prev="$_d"
    _d="$(dirname "$_d")"
  done
  # Also check the path itself if it's a directory
  [ -e "$_p/.war-task" ] && return 0
  return 1
}

# warn_if_outside <target-path>: emit advisory if target has no .war-task ancestor.
warn_if_outside() {
  _t="$1"
  # Skip empty targets, relative paths (can't resolve reliably), and non-paths.
  [ -z "$_t" ] && return
  case "$_t" in
    /*) ;;  # absolute path — proceed
    *)  return ;;  # relative path: skip (can't determine if inside worktree)
  esac
  if ! has_war_task "$_t"; then
    echo "WAR [advisory]: war-worker Bash command appears to write to '$_t' which has no .war-task ancestor. Verify this is intentional. (This is advisory only — F01 D4, ADR 0002)" >&2
  fi
}

warned=0

# ---------------------------------------------------------------------------
# 1. Shell redirections: > PATH and >> PATH
#    Extract the token after > or >> that looks like an absolute path.
#    Use a simple sed that finds '>>' or '>' followed by optional space and a
#    /…path.  We strip off '>>' first (so '>>' doesn't match as '>').
#    Then we check the single '>' case.
#    MacOS sed doesn't support \s; use a character class instead.
# ---------------------------------------------------------------------------
# Extract targets from >> (append) redirections
redir_targets="$(printf '%s' "$cmd" | sed -n 's/.*>>[[:space:]]*\(\/[^[:space:]>|;&]\{1,\}\).*/\1/p')"
# Extract targets from > (write) redirections (skip >>)
# Replace >> with a placeholder to avoid double-matching, then find >
redir_targets2="$(printf '%s' "$cmd" | sed 's/>>//g' | sed -n 's/.*>[[:space:]]*\(\/[^[:space:]>|;&]\{1,\}\).*/\1/p')"

for _t in $redir_targets $redir_targets2; do
  warn_if_outside "$_t"
  warned=1
done

# ---------------------------------------------------------------------------
# 2. tee TARGET — the target follows 'tee' (last non-flag word typically)
# ---------------------------------------------------------------------------
case "$cmd" in
  *tee\ /*)
    # Extract path after 'tee '
    _tee_target="$(printf '%s' "$cmd" | sed -n 's/.*[[:space:]]tee[[:space:]]\{1,\}\(\/[^[:space:]|;&]\{1,\}\).*/\1/p')"
    [ -n "$_tee_target" ] && warn_if_outside "$_tee_target"
    ;;
  *" tee "*)
    ;;
esac

# ---------------------------------------------------------------------------
# 3. sed -i (in-place edit) — last absolute path arg
# ---------------------------------------------------------------------------
case "$cmd" in
  *sed\ -i*)
    # Extract the last /path after sed -i flags/script
    _sed_target="$(printf '%s' "$cmd" | sed -n "s/.*[[:space:]]\(\/[^[:space:]'\"]\{1,\}\)[[:space:]]*$/\1/p")"
    [ -n "$_sed_target" ] && warn_if_outside "$_sed_target"
    ;;
esac

# ---------------------------------------------------------------------------
# 4. perl -i (in-place edit) — last absolute path arg
# ---------------------------------------------------------------------------
case "$cmd" in
  *perl\ -i*)
    _perl_target="$(printf '%s' "$cmd" | sed -n "s/.*[[:space:]]\(\/[^[:space:]'\"]\{1,\}\)[[:space:]]*$/\1/p")"
    [ -n "$_perl_target" ] && warn_if_outside "$_perl_target"
    ;;
esac

# ---------------------------------------------------------------------------
# 5. git -C DIR — the directory following -C
# ---------------------------------------------------------------------------
case "$cmd" in
  *git\ -C\ /*)
    _git_dir="$(printf '%s' "$cmd" | sed -n 's/.*git[[:space:]]\{1,\}-C[[:space:]]\{1,\}\(\/[^[:space:]]\{1,\}\).*/\1/p')"
    [ -n "$_git_dir" ] && warn_if_outside "$_git_dir"
    ;;
esac

# ---------------------------------------------------------------------------
# 6. cp SRC DEST — the destination (last absolute path)
# ---------------------------------------------------------------------------
case "$cmd" in
  cp\ /*)
    _cp_last="$(printf '%s' "$cmd" | awk '{for(i=1;i<=NF;i++) if($i~/^\//){last=$i} } END{print last}')"
    # cp writes to the last path; but also make sure there are at least 2 args
    _cp_count="$(printf '%s' "$cmd" | awk '{c=0; for(i=1;i<=NF;i++) if($i~/^\//){c++} print c}')"
    if [ -n "$_cp_last" ] && [ "$_cp_count" -ge 2 ] 2>/dev/null; then
      warn_if_outside "$_cp_last"
    fi
    ;;
  *\ cp\ /*)
    _cp_last="$(printf '%s' "$cmd" | awk '{for(i=1;i<=NF;i++) if($i~/^\//){last=$i} } END{print last}')"
    _cp_count="$(printf '%s' "$cmd" | awk '{c=0; for(i=1;i<=NF;i++) if($i~/^\//){c++} print c}')"
    if [ -n "$_cp_last" ] && [ "$_cp_count" -ge 2 ] 2>/dev/null; then
      warn_if_outside "$_cp_last"
    fi
    ;;
esac

# ---------------------------------------------------------------------------
# 7. mv SRC DEST — the destination (last absolute path)
# ---------------------------------------------------------------------------
case "$cmd" in
  mv\ /*)
    _mv_last="$(printf '%s' "$cmd" | awk '{for(i=1;i<=NF;i++) if($i~/^\//){last=$i} } END{print last}')"
    _mv_count="$(printf '%s' "$cmd" | awk '{c=0; for(i=1;i<=NF;i++) if($i~/^\//){c++} print c}')"
    if [ -n "$_mv_last" ] && [ "$_mv_count" -ge 2 ] 2>/dev/null; then
      warn_if_outside "$_mv_last"
    fi
    ;;
  *\ mv\ /*)
    _mv_last="$(printf '%s' "$cmd" | awk '{for(i=1;i<=NF;i++) if($i~/^\//){last=$i} } END{print last}')"
    _mv_count="$(printf '%s' "$cmd" | awk '{c=0; for(i=1;i<=NF;i++) if($i~/^\//){c++} print c}')"
    if [ -n "$_mv_last" ] && [ "$_mv_count" -ge 2 ] 2>/dev/null; then
      warn_if_outside "$_mv_last"
    fi
    ;;
esac

# ---------------------------------------------------------------------------
# 8. install DEST — last absolute path argument (GNU/BSD install writes files)
# ---------------------------------------------------------------------------
case "$cmd" in
  install\ *|*\ install\ *)
    case "$cmd" in
      *install\ *)
        _inst_last="$(printf '%s' "$cmd" | awk '{for(i=1;i<=NF;i++) if($i~/^\//){last=$i} } END{print last}')"
        [ -n "$_inst_last" ] && warn_if_outside "$_inst_last"
        ;;
    esac
    ;;
esac

# ---------------------------------------------------------------------------
# 9. dd of=PATH
# ---------------------------------------------------------------------------
case "$cmd" in
  *dd\ *of=/*|*\ dd\ *of=/*)
    _dd_target="$(printf '%s' "$cmd" | sed -n 's/.*of=\(\/[^[:space:]]\{1,\}\).*/\1/p')"
    [ -n "$_dd_target" ] && warn_if_outside "$_dd_target"
    ;;
esac

# ALWAYS exit 0 — this hook is advisory only and must never block execution.
exit 0
