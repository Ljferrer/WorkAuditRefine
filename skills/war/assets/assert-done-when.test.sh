#!/usr/bin/env bash
# Tests for assert-done-when.sh — the WAR done-when floor (plan 2026-08-05
# Task 2.1). Plain-bash over throwaway mktemp git worktrees; one fresh fixture
# per case. macOS bash 3.2.57 compatible; cwd-independent (every floor run
# happens from an UNRELATED clean cwd).
#
# Exit 0 = all cases passed; non-zero = at least one failed.
#
# Every case written so it FAILS WITHOUT the feature (delete-it-mentally):
#   1.  green command -> exit 0; the command's marker file lands IN THE
#       WORKTREE (run from a clean cwd — without the cd the marker lands
#       elsewhere and the assert fails: worktree confinement, D11).
#   2.  red command (`exit 3`) -> floor exit 1 EXACTLY (never the command's
#       own 3 passed through) + stderr names `exited 3` and the done-unmet
#       route.
#   3.  timeout arm (A3): hung command + --timeout 1 -> exit 1 (not 2, no
#       hang), stderr names `timed out after 1s` + done-unmet; wall-clock
#       bounded.
#   4.  metacharacter command (`&&`, single+double quotes, `=`) runs VERBATIM
#       (file-threaded, F6 no-charset) -> exit 0 + exact output bytes.
#   5.  missing worktree dir -> exit 2 + this arm's own message (without the
#       -d check the git-worktree check is the independent fallback — still
#       exit 2 — so the message grep is what pins THIS arm).
#   6.  worktree exists but is NOT a git worktree -> exit 2 + message (without
#       the git check a green command would exit 0 outside any worktree).
#   7.  missing --cmd-file target -> exit 2 + this arm's own message (without
#       the -f check the -r check is the independent fallback — still exit 2
#       — so the message grep is what pins THIS arm).
#   8.  whitespace-only command file -> exit 2 + message (without the check
#       bash runs a green no-op -> silent skip).
#   9.  invalid --timeout (`0`, `abc`) -> exit 2 each + each arm's message.
#   10. --cmd-file flag absent entirely -> exit 2 + the full usage message.
#   11. `..` segment in the worktree arg -> exit 2 + refusing message (the
#       path RESOLVES to a valid worktree, so without the guard the run would
#       be green exit 0 — the guard is what fires).
#   12. relative --cmd-file resolves against the INVOKING cwd -> exit 0 (without
#       the pre-cd resolution bash can't find the file after cd -> 127 -> 1).
#   13. stdout belongs to the executed command: OUT equals the command's own
#       bytes EXACTLY on the green AND the red path (a floor diagnostic
#       leaking onto stdout would masquerade as command output inside the
#       teed done-when-<taskId>.log artifact the refiner captures).
#   14. a command that exits 143 ON ITS OWN is NOT a timeout (marker
#       precedence): stderr names `exited 143`, never `timed out`.
#   15. argument guards: trailing --cmd-file / trailing --timeout / unknown
#       flag / stray positional -> exit 2 each + the exact die literal.
#   16. `..` segment in the --cmd-file arg -> exit 2 + refusing message.
#   17. relative --cmd-file with an unresolvable parent dir -> exit 2.
#   18. unreadable command file -> exit 2 (distinct from the missing-file arm).
#   19. mktemp failure (PATH-stubbed) -> exit 2, never the done-unmet route.
#   20. CDPATH neutralization: CDPATH exported + a RELATIVE worktree arg ->
#       the command still runs in the REAL worktree (not the same-named decoy
#       under the CDPATH entry) and stdout stays exactly the command's bytes
#       (without `unset CDPATH`, bash's cd searches CDPATH first and echoes
#       the resolved dir onto stdout — both asserts fail).
#   21. grandchild containment (group kill): `sleep 60 & wait` + --timeout 1
#       -> exit 1 + the timed-out diagnostic AND the command-substitution
#       stdout capture returns within the 15s wall bound (without the group
#       kill the orphaned sleep survives the single-PID kill, holds the
#       inherited stdout fd, and the capture blocks until it dies); stdout
#       stays byte-empty — the timeout path is the only one where a
#       `set -m` job notice could leak, so it carries case 13's stdout pin.
#   22. stdin is /dev/null: a command that reads stdin (`cat`) exits 0 promptly
#       instead of burning the budget. Load-bearing under case 21's `set -m`:
#       bash gives an async command /dev/null on stdin only while job control
#       is NOT in effect, so the group-kill change silently removed that
#       guarantee until the launch got an explicit `< /dev/null`. Without it
#       `cat` inherits the floor's stdin, never sees EOF, and times out into a
#       false `done-unmet`.
#
# The env-arm greps quote the floor's die literals VERBATIM (embedded $vars
# included) inside double quotes: the test binds each variable to the runtime
# value first, so the expanded pattern matches live stderr while the SOURCE
# line carries the exact literal assert-guard-specificity-in-diff.sh records.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/assert-done-when.sh"

PASS=0
FAIL=0

pass() { printf 'ok - %s\n' "$1"; PASS=$((PASS + 1)); }
fail() { printf 'FAIL - %s\n' "$1" >&2; FAIL=$((FAIL + 1)); }

# ONE root for every fixture: setup_wt/tmp_dir mktemp INSIDE it, so this
# parent-shell trap reaps everything. (An accumulator var appended inside the
# helpers would mutate only the $(...) subshell's copy and leak every dir.)
TMPROOT="$(mktemp -d 2>/dev/null || mktemp -d -t dwtest)"
trap 'rm -rf "$TMPROOT"' EXIT

# setup_wt: fresh git repo with a seed commit (stands in for a task worktree);
# echo its path.
setup_wt() {
  T="$(mktemp -d "$TMPROOT/wt.XXXXXX")"
  git -C "$T" init -q
  git -C "$T" config user.email war@test.local
  git -C "$T" config user.name "WAR Test"
  git -C "$T" config commit.gpgsign false
  printf 'seed\n' > "$T/seed.txt"
  git -C "$T" add seed.txt
  git -C "$T" commit -qm "seed"
  printf '%s\n' "$T"
}

# tmp_dir: plain throwaway dir (for cmd files / clean cwds); echo its path.
tmp_dir() {
  D="$(mktemp -d "$TMPROOT/d.XXXXXX")"
  printf '%s\n' "$D"
}

# run_floor <worktree> [args...] -> sets RC, OUT (stdout), ERR (stderr).
# Always run from an UNRELATED clean cwd (memory: relative-path-test-needs-
# clean-cwd) — that is what makes case 1's worktree-confinement assert bite.
run_floor() {
  rf_wt="$1"; shift
  cwd="$(tmp_dir)"
  RC=0
  OUT="$( ( cd "$cwd" && bash "$SCRIPT" "$rf_wt" "$@" ) 2>"$cwd/err.txt" )" || RC=$?
  ERR="$(cat "$cwd/err.txt" 2>/dev/null)"
}

# ---------------------------------------------------------------------------
# Case 1: green command -> exit 0, and it ran IN THE WORKTREE.
# The cmd file lives OUTSIDE the worktree (the refiner threads it from its own
# scratch space); the command drops a marker via a relative path, so the
# marker's location proves the cwd. WITHOUT the cd-to-worktree the marker
# lands in the clean invoking cwd -> the worktree assert fails.
# ---------------------------------------------------------------------------
WT1="$(setup_wt)"
CF1="$(tmp_dir)/green.cmd"
printf 'printf ran > done-when-ran.txt\n' > "$CF1"

run_floor "$WT1" --cmd-file "$CF1"
if [ "$RC" -eq 0 ] && [ -f "$WT1/done-when-ran.txt" ]; then
  pass "case 1: green command -> exit 0, marker written in the worktree (cwd confinement)"
elif [ "$RC" -ne 0 ]; then
  fail "case 1: green command -> expected exit 0, got $RC (err: $ERR)"
else
  fail "case 1: green command exit 0 but marker NOT in the worktree — command did not run with worktree cwd"
fi

# ---------------------------------------------------------------------------
# Case 2: red command (`exit 3`) -> floor exit 1 EXACTLY, never a pass-through
# of the command's own code; stderr names the code and the done-unmet route.
# WITHOUT the mapping (e.g. `exec bash file` as the floor's last command) the
# floor would exit 3 -> the RC==1 assert catches it.
# ---------------------------------------------------------------------------
WT2="$(setup_wt)"
CF2="$(tmp_dir)/red.cmd"
printf 'exit 3\n' > "$CF2"

run_floor "$WT2" --cmd-file "$CF2"
if [ "$RC" -eq 1 ] \
   && printf '%s' "$ERR" | grep -qF 'exited 3' \
   && printf '%s' "$ERR" | grep -qF 'done-unmet'; then
  pass "case 2: red command (exit 3) -> floor exit 1 + stderr 'exited 3' + done-unmet route"
elif [ "$RC" -ne 1 ]; then
  fail "case 2: red command -> expected floor exit 1, got $RC (pass-through/misclassification; err: $ERR)"
else
  fail "case 2: red command exit 1 but diagnostic wrong (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 3: timeout arm (A3) — a hung command + --timeout 1 -> exit 1 (the
# done-unmet route, NOT exit 2, NOT a hang), stderr names the timeout.
# The hang is a pure-bash loop with 1s sleeps so TERM lands promptly, and
# the watchdog's group kill reaps the in-flight `sleep 1` with it (case 21
# pins the long-lived-grandchild class). WITHOUT the watchdog this case never
# returns — the suite reddens by hanging, and the wall-clock bound keeps the
# diagnostic sharp when it does return.
# ---------------------------------------------------------------------------
WT3="$(setup_wt)"
CF3="$(tmp_dir)/hang.cmd"
printf 'while :; do sleep 1; done\n' > "$CF3"

T3_START="$(date +%s)"
run_floor "$WT3" --cmd-file "$CF3" --timeout 1
T3_END="$(date +%s)"
T3_ELAPSED=$((T3_END - T3_START))
if [ "$RC" -eq 1 ] \
   && printf '%s' "$ERR" | grep -qF 'timed out after 1s' \
   && printf '%s' "$ERR" | grep -qF 'done-unmet' \
   && [ "$T3_ELAPSED" -le 15 ]; then
  pass "case 3: hung command + --timeout 1 -> exit 1, 'timed out after 1s' + done-unmet, ${T3_ELAPSED}s wall"
elif [ "$RC" -ne 1 ]; then
  fail "case 3: timeout -> expected exit 1, got $RC after ${T3_ELAPSED}s (err: $ERR)"
elif [ "$T3_ELAPSED" -gt 15 ]; then
  fail "case 3: timeout returned exit 1 but took ${T3_ELAPSED}s (watchdog budget not honored)"
else
  fail "case 3: timeout exit 1 but diagnostic wrong (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 4: metacharacters run VERBATIM (F6 — no charset validation; file-
# threaded execution). The command carries `&&`, single AND double quotes,
# and `=`; it writes two lines whose bytes we compare exactly. WITHOUT
# file-threading (an interpolating/quoting implementation) the bytes mangle
# or the command errors.
# ---------------------------------------------------------------------------
WT4="$(setup_wt)"
CF4="$(tmp_dir)/meta.cmd"
cat > "$CF4" <<'CMD'
printf '%s\n' 'a && b' > meta-out.txt && echo "x=y" >> meta-out.txt
CMD

run_floor "$WT4" --cmd-file "$CF4"
EXPECTED4="$(printf 'a && b\nx=y\n')"
ACTUAL4="$(cat "$WT4/meta-out.txt" 2>/dev/null)"
if [ "$RC" -eq 0 ] && [ "$ACTUAL4" = "$EXPECTED4" ]; then
  pass "case 4: metacharacter command (&&, quotes, =) ran verbatim -> exit 0 + exact bytes"
else
  fail "case 4: metacharacter command -> RC=$RC, expected [$EXPECTED4] got [$ACTUAL4] (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 5: missing worktree dir -> exit 2 + this arm's own message. WITHOUT the
# -d check the git-worktree check is an independent fallback (git -C on a
# missing dir also dies exit 2), so the exit code alone cannot discriminate —
# the 'is not a directory' grep is what pins THIS arm.
# ---------------------------------------------------------------------------
CF5="$(tmp_dir)/green5.cmd"
printf 'exit 0\n' > "$CF5"

worktree="/nonexistent-war-worktree-$$"
run_floor "$worktree" --cmd-file "$CF5"
if [ "$RC" -eq 2 ] \
   && printf '%s' "$ERR" | grep -qF "worktree '$worktree' is not a directory"; then
  pass "case 5: missing worktree -> exit 2 + 'is not a directory' (env error, never the floor status)"
else
  fail "case 5: missing worktree -> expected exit 2 + 'is not a directory', got $RC (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 6: worktree exists but is NOT a git worktree -> exit 2. WITHOUT the
# git check the green command would run to exit 0 outside any worktree.
# ---------------------------------------------------------------------------
NOGIT6="$(tmp_dir)"
CF6="$(tmp_dir)/green6.cmd"
printf 'exit 0\n' > "$CF6"

worktree="$NOGIT6"
run_floor "$worktree" --cmd-file "$CF6"
if [ "$RC" -eq 2 ] \
   && printf '%s' "$ERR" | grep -qF "worktree '$worktree' is not a git worktree"; then
  pass "case 6: non-git worktree dir -> exit 2 + 'is not a git worktree' (git error, not a green run)"
else
  fail "case 6: non-git worktree -> expected exit 2 + 'is not a git worktree', got $RC (git check missing; err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 7: missing command file -> exit 2 + this arm's own message. WITHOUT the
# -f check the -r check is an independent fallback (a nonexistent path is also
# unreadable -> still exit 2), so the exit code alone cannot discriminate —
# the 'does not exist' grep is what pins THIS arm.
# ---------------------------------------------------------------------------
WT7="$(setup_wt)"

cmd_file_abs="/nonexistent-done-when-$$.cmd"
run_floor "$WT7" --cmd-file "$cmd_file_abs"
if [ "$RC" -eq 2 ] \
   && printf '%s' "$ERR" | grep -qF "command file '$cmd_file_abs' does not exist"; then
  pass "case 7: missing command file -> exit 2 + 'does not exist' (env error, not done-unmet)"
else
  fail "case 7: missing command file -> expected exit 2 + 'does not exist', got $RC (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 8: whitespace-only command file -> exit 2. WITHOUT the check bash runs
# a green no-op -> exit 0, a silent done-when skip.
# ---------------------------------------------------------------------------
WT8="$(setup_wt)"
CF8="$(tmp_dir)/empty.cmd"
printf '\n  \n' > "$CF8"

cmd_file_abs="$CF8"
run_floor "$WT8" --cmd-file "$cmd_file_abs"
if [ "$RC" -eq 2 ] \
   && printf '%s' "$ERR" | grep -qF "command file '$cmd_file_abs' is empty — refusing a vacuous done-when (threading defect upstream)"; then
  pass "case 8: whitespace-only command file -> exit 2 + refusing message (refuses the vacuous green)"
else
  fail "case 8: whitespace-only command file -> expected exit 2 + refusing message, got $RC (silent skip; err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 9: invalid --timeout -> exit 2, each arm pinned by ITS OWN message (the
# zero arm and the non-numeric arm die through different guards).
# ---------------------------------------------------------------------------
WT9="$(setup_wt)"
CF9="$(tmp_dir)/green9.cmd"
printf 'exit 0\n' > "$CF9"

timeout_secs=0
run_floor "$WT9" --cmd-file "$CF9" --timeout "$timeout_secs"
RC9A=$RC; M9A=0
printf '%s' "$ERR" | grep -qF -- "--timeout must be >= 1 second, got '$timeout_secs'" && M9A=1
timeout_secs=abc
run_floor "$WT9" --cmd-file "$CF9" --timeout "$timeout_secs"
RC9B=$RC; M9B=0
printf '%s' "$ERR" | grep -qF -- "--timeout must be a positive integer (seconds), got '$timeout_secs'" && M9B=1
if [ "$RC9A" -eq 2 ] && [ "$M9A" -eq 1 ] && [ "$RC9B" -eq 2 ] && [ "$M9B" -eq 1 ]; then
  pass "case 9: --timeout 0 and --timeout abc -> exit 2 each, each arm's own message"
else
  fail "case 9: invalid --timeout -> expected exit 2/2 + messages, got $RC9A(msg=$M9A)/$RC9B(msg=$M9B)"
fi

# ---------------------------------------------------------------------------
# Case 10: --cmd-file absent entirely -> exit 2 + the FULL usage message on
# stderr ($PROG bound so the verbatim-literal grep expands to the live name).
# ---------------------------------------------------------------------------
WT10="$(setup_wt)"

PROG="assert-done-when"
run_floor "$WT10"
if [ "$RC" -eq 2 ] \
   && printf '%s' "$ERR" | grep -qF "usage: $PROG <worktree> --cmd-file <f> [--timeout <secs>]"; then
  pass "case 10: no --cmd-file -> exit 2 + full usage message"
else
  fail "case 10: no --cmd-file -> expected exit 2 + full usage message, got $RC (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 11: `..` segment in the worktree arg -> exit 2 + refusing message.
# LOAD-BEARING: the path RESOLVES to a real worktree and the command is green,
# so without the guard this run exits 0 — only the guard produces the 2.
# ---------------------------------------------------------------------------
WT11="$(setup_wt)"
CF11="$(tmp_dir)/green11.cmd"
printf 'exit 0\n' > "$CF11"

worktree="$WT11/../$(basename "$WT11")"
run_floor "$worktree" --cmd-file "$CF11"
if [ "$RC" -eq 2 ] \
   && printf '%s' "$ERR" | grep -qF "worktree argument contains a '..' segment; refusing to use potentially unsafe path: $worktree"; then
  pass "case 11: '..' segment in worktree arg -> exit 2 + full guard message"
elif [ "$RC" -ne 2 ]; then
  fail "case 11: '..' segment -> expected exit 2, got $RC (guard missing/bypassed; err: $ERR)"
else
  fail "case 11: '..' segment exit 2 but full guard message absent (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 12: relative --cmd-file resolves against the INVOKING cwd -> exit 0.
# WITHOUT the pre-cd resolution, bash looks for the file AFTER cd-ing into the
# worktree -> 127 -> a spurious exit-1 done-unmet.
# ---------------------------------------------------------------------------
WT12="$(setup_wt)"
CWD12="$(tmp_dir)"
printf 'printf ok > rel-ran.txt\n' > "$CWD12/rel.cmd"

RC=0
( cd "$CWD12" && bash "$SCRIPT" "$WT12" --cmd-file rel.cmd ) >/dev/null 2>"$CWD12/err.txt" || RC=$?
ERR="$(cat "$CWD12/err.txt" 2>/dev/null)"
if [ "$RC" -eq 0 ] && [ -f "$WT12/rel-ran.txt" ]; then
  pass "case 12: relative --cmd-file resolved against invoking cwd -> exit 0, ran in worktree"
else
  fail "case 12: relative --cmd-file -> RC=$RC, marker in worktree: $([ -f "$WT12/rel-ran.txt" ] && echo yes || echo no) (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 13: stdout evidence contract — STDOUT belongs to the executed command;
# the floor's own diagnostics are stderr-only. EXACT equality (not substring)
# proves the floor contributed zero bytes of its own, on the green path AND on
# the red path (where the 'exited N' diagnostic must stay off stdout) —
# otherwise the floor's own noise masquerades as command output inside the
# teed done-when-<taskId>.log artifact the refiner captures (reading the
# floor's OWN exit status across that tee, done-when-floor-wiring D14).
# ---------------------------------------------------------------------------
WT13="$(setup_wt)"
CF13G="$(tmp_dir)/stdout-green.cmd"
printf 'printf DONE-WHEN-STDOUT-TOKEN\n' > "$CF13G"
CF13R="$(tmp_dir)/stdout-red.cmd"
printf 'printf DONE-WHEN-STDOUT-TOKEN\nexit 3\n' > "$CF13R"

run_floor "$WT13" --cmd-file "$CF13G"
RC13G=$RC; OUT13G=$OUT
run_floor "$WT13" --cmd-file "$CF13R"
RC13R=$RC; OUT13R=$OUT
if [ "$RC13G" -eq 0 ] && [ "$OUT13G" = "DONE-WHEN-STDOUT-TOKEN" ] \
   && [ "$RC13R" -eq 1 ] && [ "$OUT13R" = "DONE-WHEN-STDOUT-TOKEN" ]; then
  pass "case 13: stdout is EXACTLY the command's bytes on green and red paths (floor diagnostics stderr-only)"
else
  fail "case 13: stdout contract -> green RC=$RC13G OUT=[$OUT13G], red RC=$RC13R OUT=[$OUT13R]"
fi

# ---------------------------------------------------------------------------
# Case 14: marker precedence — a command that exits 143 ON ITS OWN is NOT a
# timeout. WITHOUT the marker file (an exit-code test instead) this run would
# be misreported 'timed out' — the negative grep is what pins the precedence.
# ---------------------------------------------------------------------------
WT14="$(setup_wt)"
CF14="$(tmp_dir)/self143.cmd"
printf 'exit 143\n' > "$CF14"

run_floor "$WT14" --cmd-file "$CF14"
if [ "$RC" -eq 1 ] \
   && printf '%s' "$ERR" | grep -qF 'exited 143' \
   && ! printf '%s' "$ERR" | grep -qF 'timed out'; then
  pass "case 14: self-exiting 143 -> exit 1 + 'exited 143', NOT reported as a timeout (marker precedence)"
else
  fail "case 14: self-exiting 143 -> expected exit 1 + 'exited 143' and no 'timed out', got $RC (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 15: argument guards -> exit 2 each + the exact die literal. The
# unknown/positional greps bind $1 via `set --` so the verbatim literal
# expands to the offending token at runtime.
# ---------------------------------------------------------------------------
WT15="$(setup_wt)"
CF15="$(tmp_dir)/green15.cmd"
printf 'exit 0\n' > "$CF15"

run_floor "$WT15" --cmd-file
RC15A=$RC; M15A=0
printf '%s' "$ERR" | grep -qF -- "--cmd-file requires a path" && M15A=1
run_floor "$WT15" --cmd-file "$CF15" --timeout
RC15B=$RC; M15B=0
printf '%s' "$ERR" | grep -qF -- "--timeout requires a positive integer (seconds)" && M15B=1
run_floor "$WT15" --cmd-file "$CF15" --bogus
RC15C=$RC; M15C=0
set -- '--bogus'
printf '%s' "$ERR" | grep -qF -- "unknown argument '$1'" && M15C=1
run_floor "$WT15" --cmd-file "$CF15" stray
RC15D=$RC; M15D=0
set -- 'stray'
printf '%s' "$ERR" | grep -qF "unexpected positional argument '$1'" && M15D=1
if [ "$RC15A" -eq 2 ] && [ "$M15A" -eq 1 ] \
   && [ "$RC15B" -eq 2 ] && [ "$M15B" -eq 1 ] \
   && [ "$RC15C" -eq 2 ] && [ "$M15C" -eq 1 ] \
   && [ "$RC15D" -eq 2 ] && [ "$M15D" -eq 1 ]; then
  pass "case 15: trailing --cmd-file / trailing --timeout / unknown flag / stray positional -> exit 2 each + exact literals"
else
  fail "case 15: argument guards -> got $RC15A(msg=$M15A)/$RC15B(msg=$M15B)/$RC15C(msg=$M15C)/$RC15D(msg=$M15D)"
fi

# ---------------------------------------------------------------------------
# Case 16: `..` segment in the --cmd-file arg -> exit 2 + refusing message.
# LOAD-BEARING like case 11: the path RESOLVES to a real green cmd file, so
# without the guard this run exits 0 — the guard is what fires.
# ---------------------------------------------------------------------------
WT16="$(setup_wt)"
D16="$(tmp_dir)"
printf 'exit 0\n' > "$D16/green16.cmd"

cmd_file="$D16/../$(basename "$D16")/green16.cmd"
run_floor "$WT16" --cmd-file "$cmd_file"
if [ "$RC" -eq 2 ] \
   && printf '%s' "$ERR" | grep -qF -- "--cmd-file argument contains a '..' segment; refusing to use potentially unsafe path: $cmd_file"; then
  pass "case 16: '..' segment in --cmd-file arg -> exit 2 + full guard message"
else
  fail "case 16: '..' segment in --cmd-file arg -> expected exit 2 + guard message, got $RC (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 17: relative --cmd-file whose parent dir does not exist in the invoking
# cwd -> exit 2 (the pre-cd resolution itself fails; env error, never 127->1).
# ---------------------------------------------------------------------------
WT17="$(setup_wt)"

cmd_file="no-such-dir-$$/x.cmd"
run_floor "$WT17" --cmd-file "$cmd_file"
if [ "$RC" -eq 2 ] \
   && printf '%s' "$ERR" | grep -qF "command file '$cmd_file' has no resolvable parent directory"; then
  pass "case 17: relative --cmd-file with unresolvable parent -> exit 2 + message"
else
  fail "case 17: unresolvable parent -> expected exit 2 + message, got $RC (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 18: unreadable command file -> exit 2 (the -r arm, distinct from case
# 7's does-not-exist arm). Skipped when the fixture cannot be made unreadable
# (running as root reads everything).
# ---------------------------------------------------------------------------
WT18="$(setup_wt)"
cmd_file_abs="$(tmp_dir)/noread.cmd"
printf 'exit 0\n' > "$cmd_file_abs"
chmod 000 "$cmd_file_abs"

if [ -r "$cmd_file_abs" ]; then
  pass "case 18: skipped — cannot fixture an unreadable file (running as root)"
else
  run_floor "$WT18" --cmd-file "$cmd_file_abs"
  if [ "$RC" -eq 2 ] \
     && printf '%s' "$ERR" | grep -qF "command file '$cmd_file_abs' is not readable"; then
    pass "case 18: unreadable command file -> exit 2 + 'is not readable'"
  else
    fail "case 18: unreadable command file -> expected exit 2 + 'is not readable', got $RC (err: $ERR)"
  fi
fi

# ---------------------------------------------------------------------------
# Case 19: mktemp failure -> exit 2, never the done-unmet route (the
# never-collapses law on the one pre-trap env step). TMPDIR cannot force this
# on macOS (mktemp falls back to the confstr temp dir), so a PATH stub shadows
# mktemp with a failing stand-in for the floor invocation only.
# ---------------------------------------------------------------------------
WT19="$(setup_wt)"
CF19="$(tmp_dir)/green19.cmd"
printf 'exit 0\n' > "$CF19"
STUB19="$(tmp_dir)"
printf '#!/bin/sh\nexit 1\n' > "$STUB19/mktemp"
chmod +x "$STUB19/mktemp"
CWD19="$(tmp_dir)"

RC=0
( cd "$CWD19" && PATH="$STUB19:$PATH" bash "$SCRIPT" "$WT19" --cmd-file "$CF19" ) \
  >/dev/null 2>"$CWD19/err.txt" || RC=$?
ERR="$(cat "$CWD19/err.txt" 2>/dev/null)"
if [ "$RC" -eq 2 ] \
   && printf '%s' "$ERR" | grep -qF "could not create a temp dir for the timeout marker"; then
  pass "case 19: mktemp failure -> exit 2 + message (env error, never the done-unmet route)"
else
  fail "case 19: mktemp failure -> expected exit 2 + message, got $RC (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 20: CDPATH neutralization — CDPATH exported + a RELATIVE worktree arg.
# The invoking cwd holds the REAL git worktree (bare name wt20); the CDPATH
# entry holds a same-named DECOY dir. The floor's env checks ([ -d ], git -C)
# are cwd-relative — CDPATH never applies to them — so they pass against the
# real worktree either way; only the confinement `cd -- "$worktree"` is
# CDPATH-sensitive. WITHOUT `unset CDPATH`, bash resolves that cd against the
# CDPATH entry first: the command runs in the decoy (marker lands there — a
# false-green against the wrong tree) AND cd echoes the resolved dir onto
# stdout (masquerading as command output inside the teed done-when-<taskId>.log
# artifact whose stdout half case 13 pins) -> the real-marker
# assert and the exact-OUT assert both fail while RC stays 0.
# (setup_wt mktemps its own path; this fixture needs a KNOWN bare name inside
# the invoking cwd, so the repo init is inlined.)
# ---------------------------------------------------------------------------
CWD20="$(tmp_dir)"
WT20="$CWD20/wt20"
mkdir "$WT20"
git -C "$WT20" init -q
git -C "$WT20" config user.email war@test.local
git -C "$WT20" config user.name "WAR Test"
git -C "$WT20" config commit.gpgsign false
printf 'seed\n' > "$WT20/seed.txt"
git -C "$WT20" add seed.txt
git -C "$WT20" commit -qm "seed"
DECOY20="$(tmp_dir)"
mkdir "$DECOY20/wt20"
CF20="$(tmp_dir)/green20.cmd"
printf 'printf ran > cdpath-ran.txt\nprintf DONE-WHEN-CDPATH-TOKEN\n' > "$CF20"

RC=0
OUT="$( ( cd "$CWD20" && CDPATH="$DECOY20" bash "$SCRIPT" wt20 --cmd-file "$CF20" ) 2>"$CWD20/err.txt" )" || RC=$?
ERR="$(cat "$CWD20/err.txt" 2>/dev/null)"
if [ "$RC" -eq 0 ] && [ -f "$WT20/cdpath-ran.txt" ] \
   && [ ! -f "$DECOY20/wt20/cdpath-ran.txt" ] \
   && [ "$OUT" = "DONE-WHEN-CDPATH-TOKEN" ]; then
  pass "case 20: CDPATH set + relative worktree -> ran in the REAL worktree, stdout exactly the command's bytes (CDPATH neutralized)"
else
  fail "case 20: CDPATH neutralization -> RC=$RC, real marker: $([ -f "$WT20/cdpath-ran.txt" ] && echo yes || echo no), decoy marker: $([ -f "$DECOY20/wt20/cdpath-ran.txt" ] && echo yes || echo no), OUT=[$OUT] (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 21: grandchild containment (the group kill) — the command backgrounds a
# long-lived grandchild (`sleep 60 & wait`) and times out under --timeout 1.
# Assert (a): floor exit 1 + the timed-out diagnostic (the done-unmet route).
# Assert (b): run_floor's command-substitution stdout capture RETURNS within
# the suite's 15s wall-clock idiom. Assert (c): stdout stays byte-empty —
# the timeout path is the only path where a `set -m` job-status notice can
# materialize (a job is signalled only here; bash writes job notices to
# stderr, and this assert keeps the channel byte-watched, matching case 13's
# green/red stdout pin). DELETE-THE-FEATURE (traced pre-commit,
# recorded in the task's done report): with the group kill reverted to the
# single-PID form, the watchdog signals only $cmd_pid — the orphaned sleep
# survives TERM and KILL, keeps holding the inherited stdout fd, and the
# command substitution blocks reading until it dies (~60s) -> assert (b)
# reds, proving the fixture is load-bearing. Containment ceiling (the floor
# header's residual note): a grandchild that escapes into a NEW
# session/process group (true daemonization) is beyond the group kill on
# bash 3.2 (no setsid) — this case pins the reachable class only.
# ---------------------------------------------------------------------------
WT21="$(setup_wt)"
CF21="$(tmp_dir)/grandchild.cmd"
printf 'sleep 60 & wait\n' > "$CF21"

T21_START="$(date +%s)"
run_floor "$WT21" --cmd-file "$CF21" --timeout 1
T21_END="$(date +%s)"
T21_ELAPSED=$((T21_END - T21_START))
if [ "$RC" -eq 1 ] \
   && printf '%s' "$ERR" | grep -qF 'timed out after 1s' \
   && printf '%s' "$ERR" | grep -qF 'done-unmet' \
   && [ "$T21_ELAPSED" -le 15 ] \
   && [ -z "$OUT" ]; then
  pass "case 21: grandchild (sleep 60 & wait) + --timeout 1 -> exit 1 + timed-out diagnostic, empty stdout, capture returned in ${T21_ELAPSED}s (group kill reaped the orphan)"
elif [ "$RC" -ne 1 ]; then
  fail "case 21: grandchild timeout -> expected exit 1, got $RC after ${T21_ELAPSED}s (err: $ERR)"
elif [ "$T21_ELAPSED" -gt 15 ]; then
  fail "case 21: exit 1 but the capture took ${T21_ELAPSED}s — the orphaned grandchild held the inherited stdout fd (group kill missing/ineffective)"
elif [ -n "$OUT" ]; then
  fail "case 21: stdout was not empty — a set -m job notice leaked onto the command's stdout channel (OUT=[$OUT])"
else
  fail "case 21: grandchild timeout exit 1 but diagnostic wrong (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 22: stdin is /dev/null — the acceptance command gets immediate EOF and
# must NOT block. This pins the explicit `< /dev/null` at the launch, which is
# load-bearing UNDER `set -m`: bash redirects an asynchronous command's stdin
# from /dev/null only while job control is NOT in effect, so the case-21 group
# kill (`set -m`) silently removed that guarantee. A stdin-reading acceptance
# command would then inherit the floor's stdin, block to the full budget, and
# be reported as a false `done-unmet` — fail-closed, but a 600s lie that spins
# run.roundLimit make-this-command-pass rounds against a command that was never
# red. DELETE-THE-FEATURE: drop the `< /dev/null` from the launch and this case
# reds — `cat` inherits the suite's stdin, never sees EOF, and burns the whole
# --timeout budget to exit 1 instead of exiting 0 promptly. Measured both ways
# (2026-08-15): mutated + a held-open fifo on the suite's stdin -> exit 1 after
# 8s; redirect restored -> exit 0 in 1s.
#
# DISCRIMINATION CEILING, stated so this pin is not over-trusted: the case can
# only red when the SUITE's own stdin does not EOF. Under a stdin that is
# already /dev/null or closed (a bare CI shell), `cat` sees EOF either way and
# the case passes even with the redirect deleted. It is a real pin in an
# interactive or fd-inheriting context and a vacuous one otherwise — which is
# exactly why the redirect is written explicitly at the launch instead of being
# left to the ambient job-control default.
# ---------------------------------------------------------------------------
WT22="$(setup_wt)"
CF22="$(tmp_dir)/reads-stdin.cmd"
printf 'cat\n' > "$CF22"

T22_START="$(date +%s)"
run_floor "$WT22" --cmd-file "$CF22" --timeout 5
T22_END="$(date +%s)"
T22_ELAPSED=$((T22_END - T22_START))
if [ "$RC" -eq 0 ] && [ "$T22_ELAPSED" -le 3 ]; then
  pass "case 22: a stdin-reading command (cat) gets /dev/null -> exit 0 in ${T22_ELAPSED}s (stdin EOF guaranteed under set -m)"
elif [ "$RC" -ne 0 ]; then
  fail "case 22: expected exit 0 (cat sees immediate EOF), got $RC after ${T22_ELAPSED}s — stdin is not /dev/null under set -m (err: $ERR)"
else
  fail "case 22: exit 0 but took ${T22_ELAPSED}s — cat blocked on an inherited stdin instead of seeing EOF"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\nassert-done-when: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
