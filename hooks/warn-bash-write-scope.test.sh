#!/usr/bin/env bash
# Tests for the WAR worker Bash-write advisory warn-hook (F01 D4).
# hooks/warn-bash-write-scope.sh
#
# The hook is ADVISORY ONLY — it always exits 0 (never blocks); it emits a
# warning to stderr when a war-worker's Bash command appears to write outside
# any provisioned worktree (no .war-task ancestor on the resolved target).
#
# It is a best-effort, low-false-positive detector — opaque write forms like
# `python -c "open(...)"` are accepted misses; benign edge-cases like a
# comparison operator inside quotes are accepted false-negatives. Document it
# as advisory, not a guarantee (ADR 0002).
#
# Plain-bash assertion runner.  No bats, no package.json.
# Runs under macOS bash 3.2.57 (no globstar, no assoc-arrays, no ${,,}).
#
# Exit 0 (this script) = all cases passed; non-zero = at least one failed.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
HOOK="$HERE/warn-bash-write-scope.sh"

fails=0
n=0

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# run_full <payload-json> -> prints "RC:<exit-code> STDERR:<stderr-content>"
run_full() {
  _out=""
  _err=""
  _rc=0
  _err="$(printf '%s' "$1" | bash "$HOOK" 2>&1 1>/dev/null)" || _rc=$?
  printf 'RC:%d STDERR:%s' "$_rc" "$_err"
}

# run <payload-json> -> exit code only (via bash, capturing stderr)
run() { printf '%s' "$1" | bash "$HOOK" >/dev/null 2>&1; echo $?; }

# stderr_of <payload-json> -> stderr text (exit code ignored)
stderr_of() { printf '%s' "$1" | bash "$HOOK" 2>&1 >/dev/null || true; }

# expect <description> <expected-code> <actual-code>
expect() {
  n=$((n + 1))
  if [ "$2" = "$3" ]; then
    printf 'ok %d - %s (exit %s)\n' "$n" "$1" "$3"
  else
    printf 'FAIL %d - %s (expected %s, got %s)\n' "$n" "$1" "$2" "$3"
    fails=$((fails + 1))
  fi
}

# expect_warn <description> <payload-json>
# Asserts: exit 0 AND stderr non-empty (a warning was emitted).
expect_warn() {
  n=$((n + 1))
  _rc=0
  _stderr="$(stderr_of "$2")" || true
  _rc="$(run "$2")"
  if [ "$_rc" = "0" ] && [ -n "$_stderr" ]; then
    printf 'ok %d - %s (exit 0, stderr non-empty)\n' "$n" "$1"
  else
    printf 'FAIL %d - %s (rc=%s stderr=%s)\n' "$n" "$1" "$_rc" "$_stderr"
    fails=$((fails + 1))
  fi
}

# expect_silent <description> <payload-json>
# Asserts: exit 0 AND stderr empty (no warning emitted).
expect_silent() {
  n=$((n + 1))
  _rc=0
  _stderr="$(stderr_of "$2")" || true
  _rc="$(run "$2")"
  if [ "$_rc" = "0" ] && [ -z "$_stderr" ]; then
    printf 'ok %d - %s (exit 0, no warning)\n' "$n" "$1"
  else
    printf 'FAIL %d - %s (rc=%s stderr=|%s|)\n' "$n" "$1" "$_rc" "$_stderr"
    fails=$((fails + 1))
  fi
}

# ---------------------------------------------------------------------------
# Fixtures: a temp tree where one branch has a .war-task marker.
#   $WT/task-1/   has a .war-task marker (= a provisioned worktree)
#   $WT/outside/  has no .war-task ancestor
# ---------------------------------------------------------------------------
WT="$(mktemp -d 2>/dev/null || mktemp -d -t warnbash)"
cleanup() { rm -rf "$WT"; }
trap cleanup EXIT

mkdir -p "$WT/task-1/sub/deep"
: > "$WT/task-1/.war-task"
mkdir -p "$WT/outside/sub"

INSIDE="$WT/task-1/sub/deep/file.txt"
OUTSIDE="$WT/outside/sub/file.txt"
OUTSIDE_DIR="$WT/outside/"

# Payload builder: worker issuing a Bash command.
worker_cmd() { printf '{"agent_type":"war-worker","tool_input":{"command":"%s"}}' "$1"; }
typed_cmd() { printf '{"agent_type":"%s","tool_input":{"command":"%s"}}' "$1" "$2"; }

# ---------------------------------------------------------------------------
# CASE GROUP A: war-worker commands that target paths OUTSIDE any .war-task
# → must WARN (stderr non-empty) AND exit 0
# ---------------------------------------------------------------------------

# A1: sed -i in-place edit of a file outside the worktree
expect_warn "A1: sed -i outside .war-task → warn+exit0" \
  "$(worker_cmd "sed -i '' 's/foo/bar/' $OUTSIDE")"

# A2: echo redirection > outside
expect_warn "A2: echo > outside → warn+exit0" \
  "$(worker_cmd "echo hello > $OUTSIDE")"

# A3: echo redirection >> outside (append)
expect_warn "A3: echo >> outside → warn+exit0" \
  "$(worker_cmd "echo hello >> $OUTSIDE")"

# A4: tee writing to an outside path
expect_warn "A4: tee outside → warn+exit0" \
  "$(worker_cmd "echo hello | tee $OUTSIDE")"

# A5: git -C pointing at a directory that has no .war-task ancestor
expect_warn "A5: git -C outside → warn+exit0" \
  "$(worker_cmd "git -C $OUTSIDE_DIR status")"

# A6: cp destination outside
expect_warn "A6: cp dest outside → warn+exit0" \
  "$(worker_cmd "cp /some/src $OUTSIDE")"

# A7: mv destination outside
expect_warn "A7: mv dest outside → warn+exit0" \
  "$(worker_cmd "mv /some/src $OUTSIDE")"

# ---------------------------------------------------------------------------
# CASE GROUP B: war-worker commands that target paths INSIDE a .war-task dir
# → must be SILENT (no warning) and exit 0
# ---------------------------------------------------------------------------

# B1: sed -i inside the worktree
expect_silent "B1: sed -i inside .war-task → silent" \
  "$(worker_cmd "sed -i '' 's/foo/bar/' $INSIDE")"

# B2: echo > inside
expect_silent "B2: echo > inside → silent" \
  "$(worker_cmd "echo hello > $INSIDE")"

# B3: tee inside
expect_silent "B3: tee inside → silent" \
  "$(worker_cmd "echo hello | tee $INSIDE")"

# B4: git -C inside worktree directory
expect_silent "B4: git -C inside .war-task → silent" \
  "$(worker_cmd "git -C $WT/task-1/sub status")"

# B5: cp destination inside worktree
expect_silent "B5: cp dest inside .war-task → silent" \
  "$(worker_cmd "cp /some/src $INSIDE")"

# ---------------------------------------------------------------------------
# CASE GROUP C: non-write commands (read-only)
# → must be SILENT (no warning) and exit 0
# ---------------------------------------------------------------------------

# C1: ls (pure read)
expect_silent "C1: ls → silent" \
  "$(worker_cmd "ls /some/path")"

# C2: git status (read-only git)
expect_silent "C2: git status → silent" \
  "$(worker_cmd "git status")"

# C3: node --test (test runner, not a write operation)
expect_silent "C3: node --test → silent" \
  "$(worker_cmd "node --test 'skills/**/*.test.mjs'")"

# C4: cat (read-only)
expect_silent "C4: cat → silent" \
  "$(worker_cmd "cat /some/file.txt")"

# C5: echo with a > inside a string comparison (false-positive guard)
# The '>' here is inside single quotes, not a real shell redirection.
# The hook may still flag it — but must NOT exit non-zero (always exit 0).
# This verifies the advisory exit-0 guarantee even for a quoted comparison.
expect "C5: echo with quoted '>' comparison → exit 0 always" \
  "0" "$(run "$(worker_cmd "[ \"\$x\" = \">\" ] && echo match")")"

# ---------------------------------------------------------------------------
# CASE GROUP D: non-worker agent_type → SILENT exit 0 (advisory is worker-only)
# ---------------------------------------------------------------------------

# D1: war-refiner
expect_silent "D1: war-refiner → silent" \
  "$(typed_cmd "war-refiner" "echo hello > $OUTSIDE")"

# D2: war-servitor
expect_silent "D2: war-servitor → silent" \
  "$(typed_cmd "war-servitor" "echo hello > $OUTSIDE")"

# D3: main session (no agent_type key in payload)
expect_silent "D3: no agent_type → silent" \
  "$(printf '{"tool_input":{"command":"echo hello > %s"}}' "$OUTSIDE")"

# D4: war-auditor (auditor should also be silent — hook is worker-only)
expect_silent "D4: war-auditor → silent" \
  "$(typed_cmd "war-auditor" "echo hello > $OUTSIDE")"

# D5: unknown agent type
expect_silent "D5: unknown agent_type → silent" \
  "$(typed_cmd "some-other-agent" "echo hello > $OUTSIDE")"

# ---------------------------------------------------------------------------
# CASE GROUP E: always-exit-0 guarantee (even when warning is emitted)
# ---------------------------------------------------------------------------

# E1: Confirm the exit code is ALWAYS 0 for an outside-write worker command
expect "E1: exit code is always 0 (never blocks)" \
  "0" "$(run "$(worker_cmd "echo x > $OUTSIDE")")"

# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "warn-bash-write-scope.test.sh: PASS"
