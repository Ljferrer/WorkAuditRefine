#!/usr/bin/env bash
# Tests for the WAR worktree-scope guard (hooks/validate-worktree-scope.sh).
# Plain-bash assertion runner: pipes crafted PreToolUse payloads into the hook
# and asserts the exit code. No bats, no package.json — runs under macOS bash
# 3.2.57 (no globstar, no associative arrays, no ${,,}).
#
# Exit 0 (this script) = all cases passed; non-zero = at least one failed.
set -u

# Resolve the hook next to this test file, so the gate can run us from any cwd.
HERE="$(cd "$(dirname "$0")" && pwd)"
HOOK="$HERE/validate-worktree-scope.sh"

fails=0
n=0

# run <payload-json> -> echoes the hook's exit code
run() { printf '%s' "$1" | bash "$HOOK" >/dev/null 2>&1; echo $?; }

# mk <agent_type-json> <file_path-string> -> a PreToolUse payload.
# $1 is already JSON (a quoted string like '"war-worker"', or 'null' to omit a
# meaningful agent_type). $2 is a raw path placed inside tool_input.file_path.
mk() { printf '{"agent_type":%s,"tool_input":{"file_path":"%s"}}' "$1" "$2"; }

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

# ---------------------------------------------------------------------------
# Fixtures: a throwaway tree where one branch carries a .war-task marker.
#   $WT/wt/<task>/...   has an ancestor (.../wt/<task>) holding .war-task
#   $WT/plain/...       has no .war-task ancestor (stands in for main checkout)
# ---------------------------------------------------------------------------
WT="$(mktemp -d 2>/dev/null || mktemp -d -t warscope)"
cleanup() { rm -rf "$WT"; }
trap cleanup EXIT

mkdir -p "$WT/wt/task-1/sub/deep"
: > "$WT/wt/task-1/.war-task"
mkdir -p "$WT/plain/sub"

INSIDE_WT="$WT/wt/task-1/sub/deep/file.txt"   # ancestor has .war-task
OUTSIDE_WT="$WT/plain/sub/file.txt"           # no .war-task ancestor

# Servitor targets (path-pattern based; dirs need not exist for the hook).
SERV_MEM="$WT/repo/.claude/projects/myproj/memory/x.md"
SERV_LEARN="$WT/repo/docs/learnings/phase-1.md"
SERV_RANDOM="$WT/repo/src/whatever.md"

# ---------------------------------------------------------------------------
# Cases (mirror the plan's 9 acceptance cases for Task 1).
# ---------------------------------------------------------------------------

# 1: war-worker writing inside a dir whose ancestor has .war-task -> 0
expect "war-worker inside .war-task ancestor allowed" \
  0 "$(run "$(mk '"war-worker"' "$INSIDE_WT")")"

# 2: war-worker with no .war-task ancestor -> 2 (deny)
expect "war-worker outside any worktree denied" \
  2 "$(run "$(mk '"war-worker"' "$OUTSIDE_WT")")"

# 3: war-auditor anywhere -> 2 (hard-deny, read-only)
expect "war-auditor write denied (read-only)" \
  2 "$(run "$(mk '"war-auditor"' "$INSIDE_WT")")"

# 4a: war-servitor under .../.claude/projects/<p>/memory/x.md -> 0
expect "war-servitor memory path allowed" \
  0 "$(run "$(mk '"war-servitor"' "$SERV_MEM")")"

# 4b: war-servitor under a random path -> 2 (deny)
expect "war-servitor random path denied" \
  2 "$(run "$(mk '"war-servitor"' "$SERV_RANDOM")")"

# 5: war-servitor under .../docs/learnings/phase-1.md -> 0
expect "war-servitor learnings path allowed" \
  0 "$(run "$(mk '"war-servitor"' "$SERV_LEARN")")"

# 6: war-refiner anywhere -> 0 (unrestricted)
expect "war-refiner unrestricted" \
  0 "$(run "$(mk '"war-refiner"' "$OUTSIDE_WT")")"

# 7: no agent_type (main session) -> 0 (fail-open)
# Payload carries no agent_type key at all.
expect "main session (no agent_type) fail-open" \
  0 "$(run "$(printf '{"tool_input":{"file_path":"%s"}}' "$OUTSIDE_WT")")"

# 8: unknown agent_type 'some-other-agent' -> 0 (fail-open / back-compat)
expect "unknown agent_type fail-open" \
  0 "$(run "$(mk '"some-other-agent"' "$OUTSIDE_WT")")"

# 9: no file_path (e.g. a Bash tool) -> 0
# A war-worker with an empty tool_input: even the strictest role must not deny
# a tool that writes no file.
expect "no file_path -> allowed" \
  0 "$(run '{"agent_type":"war-worker","tool_input":{}}')"

# Regression guard (not in the 9 acceptance cases, but load-bearing): a
# war-worker given a *relative* path with no .war-task ancestor must DENY and
# TERMINATE. The ancestor walk uses `dirname`, which converges to "." for a
# relative path and `dirname .` == "." — without a progress guard the loop
# spins forever and hangs the PreToolUse hook. We bound the call so a
# regression surfaces as a timeout instead of hanging this suite.
#
# Implementation: use `timeout` when available (Linux/brew coreutils); fall
# back to a background-watchdog approach that works on macOS bash 3.2.57 where
# `perl -e 'alarm N; exec @ARGV'` does not propagate the child's exit code.
# rel_guard <payload>: runs the hook from a clean temp dir (no .war-task
# ancestor) to prevent the CWD's own .war-task from satisfying the walk.
# Uses `timeout` when available; falls back to a background-watchdog pattern
# that works on macOS bash 3.2.57 (perl alarm+exec does not propagate exit codes
# reliably on macOS).
rel_guard() {
  _rg_clean="$(mktemp -d 2>/dev/null || mktemp -d -t rg_clean)"
  if command -v timeout >/dev/null 2>&1; then
    _rg_rc=0
    ( cd "$_rg_clean" && printf '%s' "$1" | timeout 10 bash "$HOOK" >/dev/null 2>&1 ) || _rg_rc=$?
    rm -rf "$_rg_clean"
    echo "$_rg_rc"
    return
  fi
  # MacOS fallback: run hook in background from a clean dir; kill if too slow.
  ( cd "$_rg_clean" && printf '%s' "$1" | bash "$HOOK" >/dev/null 2>&1 ) &
  _rg_pid=$!
  ( sleep 10 2>/dev/null && kill "$_rg_pid" 2>/dev/null ) &
  _rg_wdog=$!
  wait "$_rg_pid" 2>/dev/null; _rg_rc=$?
  kill "$_rg_wdog" 2>/dev/null; wait "$_rg_wdog" 2>/dev/null || true
  rm -rf "$_rg_clean"
  echo "$_rg_rc"
}
expect "war-worker relative path denies (no infinite loop)" \
  2 "$(rel_guard '{"agent_type":"war-worker","tool_input":{"file_path":"relative/sub/file.txt"}}')"

# ---------------------------------------------------------------------------
# Structural assertion: war-servitor.md frontmatter tools allowlist (F01 D1)
#
# The servitor must have a `tools:` line in its YAML frontmatter that explicitly
# lists exactly Read, Grep, Glob, Write, Edit — and must NOT grant Bash.
# This pins the capability-allowlist contract so the harness can enforce it.
# ---------------------------------------------------------------------------
SERVITOR_MD="$HERE/../agents/war-servitor.md"

# Extract the YAML frontmatter (between the first two --- delimiters).
# Use awk for portability (no perl, no python) — works on macOS bash 3.2.57.
frontmatter="$(awk '/^---/{if(++c==2) exit} c==1{print}' "$SERVITOR_MD")"

# Check: tools: line exists in frontmatter
tools_line="$(printf '%s\n' "$frontmatter" | grep '^tools:')"
n=$((n + 1))
if [ -n "$tools_line" ]; then
  printf 'ok %d - war-servitor.md frontmatter contains tools: line\n' "$n"
else
  printf 'FAIL %d - war-servitor.md frontmatter missing tools: line\n' "$n"
  fails=$((fails + 1))
fi

# Check: tools line contains Read
n=$((n + 1))
if printf '%s\n' "$tools_line" | grep -q 'Read'; then
  printf 'ok %d - war-servitor.md tools: grants Read\n' "$n"
else
  printf 'FAIL %d - war-servitor.md tools: does not grant Read\n' "$n"
  fails=$((fails + 1))
fi

# Check: tools line contains Grep
n=$((n + 1))
if printf '%s\n' "$tools_line" | grep -q 'Grep'; then
  printf 'ok %d - war-servitor.md tools: grants Grep\n' "$n"
else
  printf 'FAIL %d - war-servitor.md tools: does not grant Grep\n' "$n"
  fails=$((fails + 1))
fi

# Check: tools line contains Glob
n=$((n + 1))
if printf '%s\n' "$tools_line" | grep -q 'Glob'; then
  printf 'ok %d - war-servitor.md tools: grants Glob\n' "$n"
else
  printf 'FAIL %d - war-servitor.md tools: does not grant Glob\n' "$n"
  fails=$((fails + 1))
fi

# Check: tools line contains Write
n=$((n + 1))
if printf '%s\n' "$tools_line" | grep -q 'Write'; then
  printf 'ok %d - war-servitor.md tools: grants Write\n' "$n"
else
  printf 'FAIL %d - war-servitor.md tools: does not grant Write\n' "$n"
  fails=$((fails + 1))
fi

# Check: tools line contains Edit
n=$((n + 1))
if printf '%s\n' "$tools_line" | grep -q 'Edit'; then
  printf 'ok %d - war-servitor.md tools: grants Edit\n' "$n"
else
  printf 'FAIL %d - war-servitor.md tools: does not grant Edit\n' "$n"
  fails=$((fails + 1))
fi

# Check: tools line does NOT contain Bash (the key confinement property)
n=$((n + 1))
if printf '%s\n' "$tools_line" | grep -qv 'Bash'; then
  printf 'ok %d - war-servitor.md tools: does NOT grant Bash (confinement real)\n' "$n"
else
  printf 'FAIL %d - war-servitor.md tools: grants Bash — confinement is broken\n' "$n"
  fails=$((fails + 1))
fi

# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "validate-worktree-scope.test.sh: PASS"
