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
#   Active ONLY for an agent_type ending in `war-worker` (suffix-anchored, so
#   any operator agentPrefix is tolerated while trailing-junk types are not
#   captured).  All other agents (refiner, servitor, auditor, main session,
#   unknown) → silent exit 0.
#
# DETECTION (conservative, low-false-positive)
#   Scans .tool_input.command for patterns that imply a write:
#     - Shell redirections:  > PATH  or  >> PATH  (absolute, or relative
#       resolved against the payload's .cwd)
#     - tee TARGET
#     - sed -i … FILE
#     - perl -i … FILE
#     - git -C DIR
#     - cp SRC DEST  (last non-flag arg)
#     - mv SRC DEST  (last non-flag arg)
#     - install … DEST
#     - dd of=PATH
#     - Interpreter -c/-e payloads (python/python3/perl/ruby/node) that also
#       contain a write-indicative token (open(, write, writeFile)
#   Resolves the obvious write target(s).  For each resolved target, walks
#   its ancestors: if none holds a .war-task marker → emit a warning on
#   stderr and continue (exit 0).
#
# COVERAGE (widened 2026-07-12, #809)
#   - Relative redirect targets (> foo, >> foo, a>b) are now resolved against
#     the payload's .cwd and checked; previously every relative target was
#     skipped.  Only the redirect extractor is widened — all other extractors
#     resolve absolute targets only.
#   - Interpreter payloads (python/python3/perl/ruby/node -c/-e) that also
#     carry a write-indicative token have their absolute-path-shaped tokens
#     extracted and checked.
#
# LIMITATIONS (accepted per ADR 0002 / plan notes)
#   - Interpreter payloads that build paths dynamically (concatenation, vars)
#     are missed — the scan is a token match, not payload parsing.  Best-effort,
#     not a guarantee.
#   - Non-redirect extractors (tee, sed -i, perl -i, git -C, cp/mv/install,
#     dd of=) resolve absolute targets only; a relative target to them is
#     skipped.
#   - Quoted-string false positives: a relative token after '>' inside a quoted
#     string now resolves against .cwd and may warn where it previously
#     skipped; exit 0 is still guaranteed, so the noise is harmless.
#   - Unresolvable redirect targets ($var, ~user) are skipped, not guessed.
#   - sh -c / bash -c / zsh -c payloads are NOT in the interpreter list: their
#     redirect/cp/tee tokens live in the same command string and are already
#     scanned by the extractors above (a `bash -c "echo x > /abs"` warn case in
#     the test suite proves this string-level rescan).
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
cwd="$(get '.cwd')"

# --- Only warn for war-worker agents (suffix-anchored; prefix-agnostic) ---
case "$atype" in
  *war-worker) ;;
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
# A relative target is resolved against the payload's .cwd when .cwd is a
# non-empty absolute path (workers run with cwd inside their worktree, so a
# cd-prefixed relative write resolves inside .war-task and stays silent); when
# .cwd is absent or itself relative, the old best-effort skip is kept.
warn_if_outside() {
  _t="$1"
  # NB: return an explicit 0 on every skip — this runs in a `set -e` for-loop
  # body, so a bare `return` would leak the preceding test's non-zero status
  # and abort the (always-exit-0) hook.
  [ -z "$_t" ] && return 0
  case "$_t" in
    /*) ;;  # absolute path — proceed
    *)
      case "$cwd" in
        /*) _t="$cwd/$_t" ;;   # resolve relative target against absolute .cwd
        *)  return 0 ;;        # .cwd absent/relative: keep the best-effort skip
      esac
      ;;
  esac
  if ! has_war_task "$_t"; then
    echo "WAR [advisory]: war-worker Bash command appears to write to '$_t' which has no .war-task ancestor. Verify this is intentional. (This is advisory only — F01 D4, ADR 0002)" >&2
  fi
}

# ---------------------------------------------------------------------------
# 1. Shell redirections: > PATH and >> PATH
#    Extract the token after > or >>: an absolute /…path (redir_targets*) or a
#    relative token (redir_rel*, resolved against .cwd by warn_if_outside).
#    Use a simple sed that finds '>>' or '>' followed by optional space and the
#    target.  We strip off '>>' first (so '>>' doesn't match as '>').
#    Then we check the single '>' case.
#    MacOS sed doesn't support \s; use a character class instead.
# ---------------------------------------------------------------------------
# Extract targets from >> (append) redirections
redir_targets="$(printf '%s' "$cmd" | sed -n 's/.*>>[[:space:]]*\(\/[^[:space:]>|;&]\{1,\}\).*/\1/p')"
# Extract targets from > (write) redirections (skip >>)
# Replace >> with a placeholder to avoid double-matching, then find >
redir_targets2="$(printf '%s' "$cmd" | sed 's/>>//g' | sed -n 's/.*>[[:space:]]*\(\/[^[:space:]>|;&]\{1,\}\).*/\1/p')"
# Relative redirect targets (the ONLY extractor widened to relative paths).
# First-char class excludes '/' (absolute — captured above), '&' (fd
# duplication: 2>&1, >&2), whitespace, the redirect/pipe operators >|;<, and
# '$'/'~' (unresolvable variable/tilde targets — skip, don't guess).  The
# continuation reuses the redirect char-class discipline.  warn_if_outside
# resolves each against the payload's .cwd.
redir_rel="$(printf '%s' "$cmd" | sed -n 's/.*>>[[:space:]]*\([^/&[:space:]>|;<$~][^[:space:]>|;&]*\).*/\1/p')"
redir_rel2="$(printf '%s' "$cmd" | sed 's/>>//g' | sed -n 's/.*>[[:space:]]*\([^/&[:space:]>|;<$~][^[:space:]>|;&]*\).*/\1/p')"

for _t in $redir_targets $redir_targets2 $redir_rel $redir_rel2; do
  warn_if_outside "$_t"
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

# ---------------------------------------------------------------------------
# 10. Interpreter payloads: python/python3/perl/ruby/node invoked with -c/-e
#     AND a write-indicative token (open(, write, writeFile).  Extract each
#     absolute-path-shaped token (same char-class discipline as the redirect
#     sed, plus quote/paren/comma stops for the payload syntax) and check it.
#     Heuristic + conservative — a token scan, not payload parsing; interpreter
#     payloads that build paths dynamically are a documented ceiling.
#     sh -c / bash -c / zsh -c are DELIBERATELY excluded: their redirect/cp/tee
#     tokens sit in the same command string and are already scanned above.
# ---------------------------------------------------------------------------
case "$cmd" in
  *python*\ -c\ *|*python*\ -e\ *|*perl*\ -c\ *|*perl*\ -e\ *|*ruby*\ -c\ *|*ruby*\ -e\ *|*node*\ -c\ *|*node*\ -e\ *)
    case "$cmd" in
      *open\(*|*write*|*writeFile*)
        _interp_targets="$(printf '%s' "$cmd" | grep -oE "/[^[:space:]>|;&'\"(),]+" 2>/dev/null || true)"
        for _t in $_interp_targets; do
          warn_if_outside "$_t"
        done
        ;;
    esac
    ;;
esac

# ALWAYS exit 0 — this hook is advisory only and must never block execution.
exit 0
