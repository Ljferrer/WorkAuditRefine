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
#       route; not an error). Diagnostic on stderr names which.
#   2 — git/env error (HARD error; NEVER collapses into the floor status):
#       usage error, missing/non-git worktree, missing/unreadable/empty
#       command file, invalid --timeout, `..` path segment, mktemp failure.
#
# TIMEOUT (A3): default 600s, override via --timeout <secs> (positive integer;
# --timeout is also the test knob). A hung command fails THIS DISPATCH ONLY —
# exit 1, the done-unmet route — never the merge queue. Enforced by a 1s-poll
# watchdog (macOS has no coreutils `timeout`): TERM at the budget, KILL 2s
# later as insurance. Residual: a child the command spawned (e.g. an in-flight
# `sleep`) may briefly outlive the kill; it cannot change the exit code.
#
# STDOUT belongs to the executed command — the refiner captures it as the
# done-when evidence artifact. This floor writes its own diagnostics to
# stderr only, prefixed "assert-done-when:".
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
# Style mirrors assert-test-in-diff.sh / assert-packaging-in-diff.sh.
set -euo pipefail

PROG="assert-done-when"
unset CDPATH # a set CDPATH would redirect a relative-path `cd` and echo the resolved dir to stdout (which belongs to the executed command)
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
# Execute the done-when command in the worktree, under the watchdog.
# ---------------------------------------------------------------------------
tmpdir="$(mktemp -d 2>/dev/null || mktemp -d -t donewhen)" \
  || die "could not create a temp dir for the timeout marker" 2
trap 'rm -rf "$tmpdir"' EXIT
marker="$tmpdir/timed-out"

printf '%s: running done-when from %s in %s (timeout %ss)\n' \
  "$PROG" "$cmd_file_abs" "$worktree" "$timeout_secs" >&2

# exec so the child PID IS the bash interpreting the command file — the
# watchdog's TERM reaches the command, not a wrapper subshell.
( cd -- "$worktree" && exec bash "$cmd_file_abs" ) &
cmd_pid=$!

# Watchdog: poll at 1s granularity; at the budget, write the marker (the
# timeout signal the parent reads — a command exiting 143 on its own is NOT
# a timeout), then TERM, then KILL 2s later for a TERM-trapping command.
(
  waited=0
  while [ "$waited" -lt "$timeout_secs" ]; do
    sleep 1
    kill -0 "$cmd_pid" 2>/dev/null || exit 0
    waited=$((waited + 1))
  done
  : > "$marker"
  kill -TERM "$cmd_pid" 2>/dev/null || true
  sleep 2
  kill -KILL "$cmd_pid" 2>/dev/null || true
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
exit 1
