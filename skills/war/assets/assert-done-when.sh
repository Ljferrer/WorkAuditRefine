#!/usr/bin/env bash
# assert-done-when.sh — WAR done-when floor (D1/D11, plan 2026-08-05 Task 2.1).
#
# Usage: assert-done-when.sh <worktree> --cmd-file <f> [--timeout <secs>]
#
# Runs the task's `Done when:` acceptance command IN THE TASK WORKTREE, after
# the gate (Task 2.3 wires this into the refiner merge-task dispatch). The
# command text is FILE-THREADED: it is executed from <f> via `bash <f>` —
# never interpolated into another script, never eval'd through a quoting
# layer — so metacharacters (`&&`, quotes, `=`, anything) run verbatim.
#
# NO CHARSET VALIDATION (F6, operator-ratified 2026-08-05): a `Done when:` is
# operator-ratified, red-teamed plan content in the same trust class as
# `plan.gate`, which the floor family has always executed unvalidated. The
# hygiene posture is file-threading + the timeout + running the command with
# the task worktree as its cwd (D11/A3).
#
# Exit codes (load-bearing contract, mirrors assert-test-in-diff.sh /
# assert-packaging-in-diff.sh):
#   0 — the done-when command exited 0 (green)
#   1 — the done-when command exited non-zero OR timed out (the "done-unmet"
#       route; not an error). Diagnostic on stderr names which. On exit 127
#       (command not found) a second line prints the command file's first
#       token and names `overrides.doneWhenPreamble`: a prose first token
#       means the Done-when threading broke upstream, and a missing
#       interpreter is fixed by the preamble (PIN-9).
#       Also exit 1, BEFORE the command runs: a `node --test` at command
#       position names a file absent from the worktree (PIN-26, #2718). Node
#       skips a missing listed file and exits 0 when another listed file
#       runs, so the floor probes the list itself. See NODE --TEST PROBE.
#   2 — git/env error (HARD error; NEVER collapses into the floor status):
#       usage error, missing/non-git worktree, missing/unreadable/empty
#       command file, invalid --timeout, `..` path segment, mktemp failure,
#       a failed command-file scan, and a worktree whose submodules are not
#       ready: the sibling `provision-worktrees.sh assert-submodules-ready
#       <worktree>` exited non-zero (its SUBMODULES_UNINITIALIZED marker is
#       re-printed on stderr). Submodule readiness is env, so it is exit 2,
#       never 1 (PIN-8). The verb is a silent no-op without `.gitmodules`.
#
# NODE --TEST PROBE (PIN-26): before the command runs, an awk scanner reads
# the cmd file with shell quoting. It probes only a `node --test` at command
# position: line start, or right after `$(`, `(`, `&&`, `||`, `;`, `|` or a
# lone `&`. Quoted text is never a command (`grep 'node --test x'` is text).
# The tokens after `--test` up to `)`, `&&`, `||`, `|`, `;` or a newline are
# candidates, quotes stripped. Skipped: a `-` flag (and the next token after
# a value-taking node flag written without `=`); a token holding `*`, `?`,
# `[` or `$` (globs and variables resolve at run time); a bare redirect
# operator with an optional fd number (`>`, `1>`, `2>>`, `&>>`, `<`, `<<`,
# `>&`) with the token after it; and a token that starts with a redirect
# operator (`>/dev/null`, `1>log`, `2>&1`, `<<EOF`). Once a command-position
# `cd` or `pushd` is seen, no later `node --test` is probed: paths then
# resolve against a run-time directory, so the probe fails open. Each other
# token that is not a file under the worktree is printed as missing. A cmd
# file with no such `node --test` call keeps today's output byte-for-byte.
#
# TIMEOUT (A3): default 600s, override via --timeout <secs> (positive integer;
# --timeout is also the test knob). A hung command fails THIS DISPATCH ONLY —
# exit 1, the done-unmet route — never the merge queue. Enforced by a 1s-poll
# watchdog (macOS has no coreutils `timeout`): TERM at the budget, KILL 2s
# later as insurance, each delivered to the command's own process group
# (`set -m` around the launch) with a single-PID fallback. Residual: the
# group kill cannot reach a grandchild that escaped into a NEW
# session/process group (true daemonization) — bash 3.2 has no setsid; and
# the KILL insurance only fires while the watchdog is still alive — when
# the group TERM kills the direct command itself, the parent's `wait`
# returns and it TERMs the watchdog mid-`sleep 2`, before the KILL line
# runs, so a TERM-ignoring descendant that never left the command's group
# can outlive the teardown. Neither survivor, nor the watchdog's own
# in-flight `sleep`, can change the exit code, though each can hold an
# inherited stdout fd after the floor exits (the `sleep` for at most ~2s,
# a survivor for its lifetime).
#
# STDOUT belongs to the executed command — the refiner tees the floor run's
# combined stdout+stderr to the done-when evidence artifact
# <_refinery>/.war/done-when-<taskId>.log, reads the floor's OWN exit status
# across that tee (done-when-floor-wiring D14: redirect-then-read `$?`, or
# `${PIPESTATUS[0]}` when piping — never the tee pipeline's status), and on
# exit 1 returns the artifact's path in `done_when_log_path`. This floor
# writes its own diagnostics to stderr only, prefixed "assert-done-when:".
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
# Style mirrors assert-test-in-diff.sh / assert-packaging-in-diff.sh.
set -euo pipefail

PROG="assert-done-when"
unset CDPATH # a set CDPATH would redirect a relative-path `cd` and echo the resolved dir to stdout (which belongs to the executed command)
HERE="$(cd -- "$(dirname -- "$0")" && pwd)" # the sibling provision-worktrees.sh lives here
# Multi-code contract: every callsite passes the exit code EXPLICITLY (the
# default 2 is belt-and-braces in the safe direction — a forgotten arg can
# never collapse into the floor status 1).
die() { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-2}"; }

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
[ $# -ge 1 ] || die "usage: $PROG <worktree> --cmd-file <f> [--timeout <secs>]" 2

worktree="$1"
shift

cmd_file=""
timeout_secs=600

while [ $# -gt 0 ]; do
  case "$1" in
    --cmd-file)
      [ $# -ge 2 ] || die "--cmd-file requires a path" 2
      cmd_file="$2"; shift 2 ;;
    --timeout)
      [ $# -ge 2 ] || die "--timeout requires a positive integer (seconds)" 2
      timeout_secs="$2"; shift 2 ;;
    --) shift; break ;;
    -*) die "unknown argument '$1'" 2 ;;
    *)  die "unexpected positional argument '$1'" 2 ;;
  esac
done

[ -n "$cmd_file" ] || die "usage: $PROG <worktree> --cmd-file <f> [--timeout <secs>]" 2

case "$timeout_secs" in
  ''|*[!0-9]*) die "--timeout must be a positive integer (seconds), got '$timeout_secs'" 2 ;;
esac
[ "$timeout_secs" -ge 1 ] || die "--timeout must be >= 1 second, got '$timeout_secs'" 2

# ---------------------------------------------------------------------------
# Safety: reject a `..` PATH SEGMENT in either path argument (family
# precedent; segment match, not substring — `a..b` in a filename is fine).
# ---------------------------------------------------------------------------
has_dotdot_segment() {
  case "$1" in
    ..|../*|*/..|*/../*) return 0 ;;
  esac
  return 1
}
if has_dotdot_segment "$worktree"; then
  die "worktree argument contains a '..' segment; refusing to use potentially unsafe path: $worktree" 2
fi
if has_dotdot_segment "$cmd_file"; then
  die "--cmd-file argument contains a '..' segment; refusing to use potentially unsafe path: $cmd_file" 2
fi

# ---------------------------------------------------------------------------
# Env validation — every failure here is exit 2, never the floor status.
# ---------------------------------------------------------------------------
[ -d "$worktree" ] || die "worktree '$worktree' is not a directory" 2
git -C "$worktree" rev-parse --git-dir >/dev/null 2>&1 \
  || die "worktree '$worktree' is not a git worktree" 2

# Resolve the command file against the INVOKING cwd before we cd into the
# worktree (standard CLI semantics; the refiner may pass a relative path).
case "$cmd_file" in
  /*) cmd_file_abs="$cmd_file" ;;
  *)
    cmd_dir="$(cd -- "$(dirname "$cmd_file")" 2>/dev/null && pwd)" \
      || die "command file '$cmd_file' has no resolvable parent directory" 2
    cmd_file_abs="$cmd_dir/$(basename "$cmd_file")" ;;
esac
[ -f "$cmd_file_abs" ] || die "command file '$cmd_file_abs' does not exist" 2
[ -r "$cmd_file_abs" ] || die "command file '$cmd_file_abs' is not readable" 2
# An empty (or whitespace-only) command file means the done-when threading
# broke upstream — bash would run it as a green no-op, a silent skip. Refuse.
grep -q '[^[:space:]]' "$cmd_file_abs" \
  || die "command file '$cmd_file_abs' is empty — refusing a vacuous done-when (threading defect upstream)" 2

# ---------------------------------------------------------------------------
# Submodule readiness (PIN-8): a worktree with uninitialized submodules is an
# env defect, so it is exit 2, never the done-unmet route. The verb prints
# nothing and exits 0 without `.gitmodules`, so that path keeps today's bytes.
# ---------------------------------------------------------------------------
sm_rc=0
sm_err="$(bash "$HERE/provision-worktrees.sh" assert-submodules-ready "$worktree" 2>&1 >/dev/null)" || sm_rc=$?
if [ "$sm_rc" -ne 0 ]; then
  [ -z "$sm_err" ] || printf '%s\n' "$sm_err" >&2
  die "worktree '$worktree' is not submodule-ready (provision-worktrees.sh assert-submodules-ready exited $sm_rc) — an env error, not the done-unmet route" 2
fi

# ---------------------------------------------------------------------------
# NODE --TEST PROBE (PIN-26; rules in the header). The awk scanner prints one
# candidate path per line; the shell checks each against the worktree.
# ---------------------------------------------------------------------------
probe_out="$(awk '
function flush() {
  if (!inword) return
  emit(word)
  word = ""; inword = 0
}
function boundary() { flush(); nw = 0; isnode = 0; probing = 0; skipnext = 0 }
function emit(w) {
  if (nw == 0) { isnode = (w == "node"); if (w == "cd" || w == "pushd") cdseen = 1 }
  else if (nw == 1) probing = (isnode && w == "--test" && !cdseen)
  else if (probing) {
    if (skipnext) skipnext = 0
    else if (w ~ /^[0-9]*(>>?|<<?<?|>&|<&|&>>?)$/) skipnext = 1
    else if (w ~ /^[0-9]*(>|<|&>)/) { }
    else if (substr(w, 1, 1) == "-") { if (w in valflag) skipnext = 1 }
    else if (w == "" || index(w, "*") || index(w, "?") || index(w, "[") || index(w, "$") || index(w, "\n")) { }
    else print w
  }
  nw++
}
BEGIN {
  split("--test-reporter --test-reporter-destination --test-name-pattern --test-skip-pattern --test-concurrency --test-timeout --test-shard --test-coverage-include --test-coverage-exclude --import --require -r --loader --experimental-loader", vf, " ")
  for (k in vf) valflag[vf[k]] = 1
}
{ s = s $0 "\n" }
END {
  n = length(s); i = 1; q = ""; word = ""; inword = 0
  boundary()
  while (i <= n) {
    c = substr(s, i, 1); d = substr(s, i + 1, 1)
    if (q == "\047") { if (c == "\047") q = ""; else word = word c; i++; continue }
    if (q == "\"") {
      if (c == "\\" && (d == "$" || d == "`" || d == "\"" || d == "\\")) { word = word d; i += 2; continue }
      if (c == "\\" && d == "\n") { i += 2; continue }
      if (c == "\"") q = ""; else word = word c
      i++; continue
    }
    if (c == "\\") { if (d != "\n") { word = word d; inword = 1 }; i += 2; continue }
    if (c == "\047" || c == "\"") { q = c; inword = 1; i++; continue }
    if (c == "#" && !inword) { while (i <= n && substr(s, i, 1) != "\n") i++; continue }
    if (c == "\n" || c == ";" || c == "(" || c == ")") { boundary(); i++; continue }
    if (c == "|") { boundary(); i += (d == "|") ? 2 : 1; continue }
    if (c == "$" && d == "(") { boundary(); i += 2; continue }
    if (c == "&") {
      if (d == "&") { boundary(); i += 2; continue }
      if ((inword && word ~ /[<>]$/) || d == ">") { word = word c; inword = 1; i++; continue }
      boundary(); i++; continue
    }
    if (c == " " || c == "\t") { flush(); i++; continue }
    if ((c == ">" || c == "<") && inword && word !~ /^([0-9]+|&)$/ && word !~ /[<>]$/) flush()
    word = word c; inword = 1; i++
  }
  flush()
}' "$cmd_file_abs")" || die "could not scan command file '$cmd_file_abs' for node --test paths" 2
if [ -n "$probe_out" ]; then
  probe_missing=0
  while IFS= read -r probe_tok; do
    case "$probe_tok" in
      /*) probe_path="$probe_tok" ;;
      *)  probe_path="$worktree/$probe_tok" ;;
    esac
    if [ ! -f "$probe_path" ]; then
      printf '%s: node --test names a missing file: %s (node skips it silently and exits 0; the done-unmet route)\n' \
        "$PROG" "$probe_tok" >&2
      probe_missing=1
    fi
  done <<EOF
$probe_out
EOF
  [ "$probe_missing" -eq 0 ] || exit 1
fi

# ---------------------------------------------------------------------------
# Execute the done-when command in the worktree, under the watchdog.
# ---------------------------------------------------------------------------
tmpdir="$(mktemp -d 2>/dev/null || mktemp -d -t donewhen)" \
  || die "could not create a temp dir for the timeout marker" 2
trap 'rm -rf "$tmpdir"' EXIT
marker="$tmpdir/timed-out"

printf '%s: running done-when from %s in %s (timeout %ss)\n' \
  "$PROG" "$cmd_file_abs" "$worktree" "$timeout_secs" >&2

# exec so the child PID IS the bash interpreting the command file — the
# watchdog's TERM reaches the command, not a wrapper subshell. `set -m`
# around the launch gives the command tree its OWN process group (pgid
# $cmd_pid), so the watchdog's group kill reaches backgrounded grandchildren
# too; the watchdog subshell launches after `set +m` and stays in the
# script's own group.
#
# STDIN is redirected from /dev/null EXPLICITLY, and that is load-bearing under
# `set -m`: bash gives an asynchronous command /dev/null on stdin only while job
# control is NOT in effect. Without this redirect the `set -m` above would hand
# the acceptance command the floor's inherited stdin — so a command that reads
# stdin would block to the full budget and be reported as a false `done-unmet`
# (and, with a controlling terminal, would take SIGTTIN in its new background
# group). The redirect restores the pre-job-control guarantee and is
# job-control-independent. Case 22 pins it.
set -m
( cd -- "$worktree" && exec bash "$cmd_file_abs" ) < /dev/null &
cmd_pid=$!
set +m

# Watchdog: poll at 1s granularity; at the budget, write the marker (the
# timeout signal the parent reads — a command exiting 143 on its own is NOT
# a timeout), then TERM, then KILL 2s later for a TERM-trapping command —
# each group-first (-"$cmd_pid" signals every process in the command's
# group) with the single-PID form as fallback.
(
  waited=0
  while [ "$waited" -lt "$timeout_secs" ]; do
    sleep 1
    kill -0 "$cmd_pid" 2>/dev/null || exit 0
    waited=$((waited + 1))
  done
  : > "$marker"
  kill -TERM -"$cmd_pid" 2>/dev/null || kill -TERM "$cmd_pid" 2>/dev/null || true
  sleep 2
  kill -KILL -"$cmd_pid" 2>/dev/null || kill -KILL "$cmd_pid" 2>/dev/null || true
) &
watchdog_pid=$!

cmd_status=0
wait "$cmd_pid" || cmd_status=$?

kill "$watchdog_pid" 2>/dev/null || true
wait "$watchdog_pid" 2>/dev/null || true

# ---------------------------------------------------------------------------
# Result — marker takes precedence (a killed command's 143/137 is a timeout,
# not a plain red).
# ---------------------------------------------------------------------------
if [ -f "$marker" ]; then
  printf '%s: done-when command timed out after %ss (the done-unmet route)\n' \
    "$PROG" "$timeout_secs" >&2
  exit 1
fi

if [ "$cmd_status" -eq 0 ]; then
  exit 0
fi

printf '%s: done-when command exited %s (the done-unmet route)\n' \
  "$PROG" "$cmd_status" >&2
if [ "$cmd_status" -eq 127 ]; then
  first_tok="$(awk 'NF { print $1; exit }' "$cmd_file_abs" 2>/dev/null)" || first_tok=""
  printf "%s: exit 127 is command not found; the command file's first token is '%s'. If that token is prose, not a command, the Done-when threading broke upstream. If it names an interpreter missing from PATH, set overrides.doneWhenPreamble to a line that puts it there.\n" \
    "$PROG" "$first_tok" >&2
fi
exit 1
