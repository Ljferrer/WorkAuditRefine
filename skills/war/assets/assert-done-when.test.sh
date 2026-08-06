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
#   5.  missing worktree dir -> exit 2 (without validation the subshell cd
#       fails -> a spurious exit-1 done-unmet: the never-collapses law).
#   6.  worktree exists but is NOT a git worktree -> exit 2 (without the git
#       check a green command would exit 0 outside any worktree).
#   7.  missing --cmd-file target -> exit 2 (without the check bash exits 127
#       -> spurious done-unmet).
#   8.  whitespace-only command file -> exit 2 (without the check bash runs a
#       green no-op -> silent skip).
#   9.  invalid --timeout (`0`, `abc`) -> exit 2 each.
#   10. --cmd-file flag absent entirely -> exit 2 + usage on stderr.
#   11. `..` segment in the worktree arg -> exit 2 + refusing message (the
#       path RESOLVES to a valid worktree, so without the guard the run would
#       be green exit 0 — the guard is what fires).
#   12. relative --cmd-file resolves against the INVOKING cwd -> exit 0 (without
#       the pre-cd resolution bash can't find the file after cd -> 127 -> 1).
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/assert-done-when.sh"

PASS=0
FAIL=0
TMPFILES=""

pass() { printf 'ok - %s\n' "$1"; PASS=$((PASS + 1)); }
fail() { printf 'FAIL - %s\n' "$1" >&2; FAIL=$((FAIL + 1)); }

cleanup() {
  for d in $TMPFILES; do
    rm -rf "$d"
  done
}
trap cleanup EXIT

# setup_wt: fresh git repo with a seed commit (stands in for a task worktree);
# echo its path.
setup_wt() {
  T="$(mktemp -d 2>/dev/null || mktemp -d -t dwtest)"
  TMPFILES="$TMPFILES $T"
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
  D="$(mktemp -d 2>/dev/null || mktemp -d -t dwtest)"
  TMPFILES="$TMPFILES $D"
  printf '%s\n' "$D"
}

# run_floor <worktree> [args...] -> sets RC, OUT (stdout), ERR (stderr).
# Always run from an UNRELATED clean cwd (memory: relative-path-test-needs-
# clean-cwd) — that is what makes case 1's worktree-confinement assert bite.
run_floor() {
  rf_wt="$1"; shift
  cwd="$(tmp_dir)"
  RC=0
  OUT="$( ( cd "$cwd" && bash "$SCRIPT" "$rf_wt" "$@" ) 2>/tmp/dw_err_$$ )" || RC=$?
  ERR="$(cat /tmp/dw_err_$$ 2>/dev/null)"; rm -f /tmp/dw_err_$$
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
# The hang is a pure-bash loop with 1s sleeps so TERM lands promptly and any
# straggler child dies within 1s. WITHOUT the watchdog this case never
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
# Case 5: missing worktree dir -> exit 2. WITHOUT validation the subshell cd
# fails -> exit 1 -> a spurious done-unmet (the never-collapses law broken).
# ---------------------------------------------------------------------------
CF5="$(tmp_dir)/green5.cmd"
printf 'exit 0\n' > "$CF5"

run_floor "/nonexistent-war-worktree-$$" --cmd-file "$CF5"
if [ "$RC" -eq 2 ]; then
  pass "case 5: missing worktree -> exit 2 (env error, never the floor status)"
else
  fail "case 5: missing worktree -> expected exit 2, got $RC (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 6: worktree exists but is NOT a git worktree -> exit 2. WITHOUT the
# git check the green command would run to exit 0 outside any worktree.
# ---------------------------------------------------------------------------
NOGIT6="$(tmp_dir)"
CF6="$(tmp_dir)/green6.cmd"
printf 'exit 0\n' > "$CF6"

run_floor "$NOGIT6" --cmd-file "$CF6"
if [ "$RC" -eq 2 ]; then
  pass "case 6: non-git worktree dir -> exit 2 (git error, not a green run)"
else
  fail "case 6: non-git worktree -> expected exit 2, got $RC (git check missing; err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 7: missing command file -> exit 2. WITHOUT the check bash exits 127
# -> spurious exit-1 done-unmet.
# ---------------------------------------------------------------------------
WT7="$(setup_wt)"

run_floor "$WT7" --cmd-file "/nonexistent-done-when-$$.cmd"
if [ "$RC" -eq 2 ]; then
  pass "case 7: missing command file -> exit 2 (env error, not done-unmet)"
else
  fail "case 7: missing command file -> expected exit 2, got $RC (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 8: whitespace-only command file -> exit 2. WITHOUT the check bash runs
# a green no-op -> exit 0, a silent done-when skip.
# ---------------------------------------------------------------------------
WT8="$(setup_wt)"
CF8="$(tmp_dir)/empty.cmd"
printf '\n  \n' > "$CF8"

run_floor "$WT8" --cmd-file "$CF8"
if [ "$RC" -eq 2 ]; then
  pass "case 8: whitespace-only command file -> exit 2 (refuses the vacuous green)"
else
  fail "case 8: whitespace-only command file -> expected exit 2, got $RC (silent skip; err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 9: invalid --timeout -> exit 2 (both the zero and the non-numeric arm).
# ---------------------------------------------------------------------------
WT9="$(setup_wt)"
CF9="$(tmp_dir)/green9.cmd"
printf 'exit 0\n' > "$CF9"

run_floor "$WT9" --cmd-file "$CF9" --timeout 0
RC9A=$RC
run_floor "$WT9" --cmd-file "$CF9" --timeout abc
RC9B=$RC
if [ "$RC9A" -eq 2 ] && [ "$RC9B" -eq 2 ]; then
  pass "case 9: --timeout 0 and --timeout abc -> exit 2 each"
else
  fail "case 9: invalid --timeout -> expected exit 2/2, got $RC9A/$RC9B"
fi

# ---------------------------------------------------------------------------
# Case 10: --cmd-file absent entirely -> exit 2 + usage on stderr.
# ---------------------------------------------------------------------------
WT10="$(setup_wt)"

run_floor "$WT10"
if [ "$RC" -eq 2 ] && printf '%s' "$ERR" | grep -qF 'usage:'; then
  pass "case 10: no --cmd-file -> exit 2 + usage"
else
  fail "case 10: no --cmd-file -> expected exit 2 + usage, got $RC (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Case 11: `..` segment in the worktree arg -> exit 2 + refusing message.
# LOAD-BEARING: the path RESOLVES to a real worktree and the command is green,
# so without the guard this run exits 0 — only the guard produces the 2.
# ---------------------------------------------------------------------------
WT11="$(setup_wt)"
CF11="$(tmp_dir)/green11.cmd"
printf 'exit 0\n' > "$CF11"

run_floor "$WT11/../$(basename "$WT11")" --cmd-file "$CF11"
if [ "$RC" -eq 2 ] && printf '%s' "$ERR" | grep -qF "refusing to use potentially unsafe path"; then
  pass "case 11: '..' segment in worktree arg -> exit 2 + guard message"
elif [ "$RC" -ne 2 ]; then
  fail "case 11: '..' segment -> expected exit 2, got $RC (guard missing/bypassed; err: $ERR)"
else
  fail "case 11: '..' segment exit 2 but guard message absent (err: $ERR)"
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
( cd "$CWD12" && bash "$SCRIPT" "$WT12" --cmd-file rel.cmd ) >/dev/null 2>/tmp/dw_err_$$ || RC=$?
ERR="$(cat /tmp/dw_err_$$ 2>/dev/null)"; rm -f /tmp/dw_err_$$
if [ "$RC" -eq 0 ] && [ -f "$WT12/rel-ran.txt" ]; then
  pass "case 12: relative --cmd-file resolved against invoking cwd -> exit 0, ran in worktree"
else
  fail "case 12: relative --cmd-file -> RC=$RC, marker in worktree: $([ -f "$WT12/rel-ran.txt" ] && echo yes || echo no) (err: $ERR)"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\nassert-done-when: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
