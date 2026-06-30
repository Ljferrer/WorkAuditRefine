#!/usr/bin/env bash
# Tests for assert-test-in-diff.sh — the WAR worker test-floor guard.
#
# Plain-bash over throwaway mktemp git repos; one fresh fixture per case.
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
#
# Exit 0 = all cases passed; non-zero = at least one failed.
#
# Cases:
#   1. test present in diff -> exit 0
#   2. diff with no test -> non-zero + empty-summary on stdout
#   3. PATTERN-ALIGNMENT (EQUALITY):
#      a. skills/x/foo.test.mjs -> MATCH
#      b. dir/bar.test.sh       -> MATCH
#      c. root foo.test.mjs (outside skills/) -> NO MATCH
#      d. foo.test.js           -> NO MATCH
#      e. test_foo.py           -> NO MATCH
#   4. .. traversal path -> non-zero (no crash)
#   5. empty diff -> non-zero (not a crash)
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/assert-test-in-diff.sh"

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

# setup_repo: create a fresh git repo with a seed commit; echo its path.
setup_repo() {
  T="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
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

# add_file_on_branch <repo> <branch> <relpath> [content]
# Create a new branch from HEAD, add a file, commit, echo the branch name.
add_file_on_branch() {
  repo="$1"; branch="$2"; relpath="$3"; content="${4:-content}"
  git -C "$repo" checkout -qb "$branch" 2>/dev/null
  # Create parent directories if needed
  parent="$(dirname "$repo/$relpath")"
  mkdir -p "$parent"
  printf '%s\n' "$content" > "$repo/$relpath"
  git -C "$repo" add "$relpath"
  git -C "$repo" commit -qm "add $relpath"
  git -C "$repo" checkout -q - 2>/dev/null
  printf '%s\n' "$branch"
}

# run_script <repo> [args...] -> exit code; all output discarded
run_script() {
  repo="$1"; shift
  cwd="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
  TMPFILES="$TMPFILES $cwd"
  # memory: relative-path-test-needs-clean-cwd — cd to unrelated mktemp dir
  # so no relative-path false-allow from a dirty cwd.
  rc=0
  ( cd "$cwd" && bash "$SCRIPT" "$@" ) >/dev/null 2>&1 || rc=$?
  printf '%s\n' "$rc"
}

# run_script_stdout <repo> [args...] -> stdout only (for summary assertions)
run_script_stdout() {
  repo="$1"; shift
  cwd="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
  TMPFILES="$TMPFILES $cwd"
  ( cd "$cwd" && bash "$SCRIPT" "$@" ) 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# Case 1: test present in diff -> exit 0
# A branch that adds skills/foo/bar.test.mjs should satisfy the default pattern.
# ---------------------------------------------------------------------------
R1="$(setup_repo)"
BASE1="$(git -C "$R1" rev-parse HEAD)"
git -C "$R1" checkout -qb task/with-test 2>/dev/null
mkdir -p "$R1/skills/foo"
printf 'test\n' > "$R1/skills/foo/bar.test.mjs"
git -C "$R1" add skills/foo/bar.test.mjs
git -C "$R1" commit -qm "add test"
TASK1="$(git -C "$R1" rev-parse HEAD)"
git -C "$R1" checkout -q - 2>/dev/null

cwd1="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd1"
rc1=0
( cd "$cwd1" && bash "$SCRIPT" "$BASE1" "$TASK1" --repo "$R1" ) >/dev/null 2>&1 || rc1=$?

if [ "$rc1" -eq 0 ]; then
  pass "case 1: test file in diff (skills/foo/bar.test.mjs) -> exit 0"
else
  fail "case 1: test file in diff (skills/foo/bar.test.mjs) -> expected exit 0, got $rc1"
fi

# ---------------------------------------------------------------------------
# Case 2: diff with no test -> non-zero + empty-summary on stdout
# A branch that adds only a source file, no test.
# ---------------------------------------------------------------------------
R2="$(setup_repo)"
BASE2="$(git -C "$R2" rev-parse HEAD)"
git -C "$R2" checkout -qb task/no-test 2>/dev/null
printf 'src\n' > "$R2/impl.js"
git -C "$R2" add impl.js
git -C "$R2" commit -qm "add impl, no test"
TASK2="$(git -C "$R2" rev-parse HEAD)"
git -C "$R2" checkout -q - 2>/dev/null

cwd2="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd2"
rc2=0
out2=""
out2="$( ( cd "$cwd2" && bash "$SCRIPT" "$BASE2" "$TASK2" --repo "$R2" ) 2>/dev/null )" || rc2=$?

if [ "$rc2" -ne 0 ]; then
  pass "case 2a: no test in diff -> non-zero exit"
else
  fail "case 2a: no test in diff -> expected non-zero, got 0"
fi

if [ -z "$out2" ]; then
  pass "case 2b: no test in diff -> empty stdout (empty summary)"
else
  fail "case 2b: no test in diff -> expected empty stdout, got: $out2"
fi

# ---------------------------------------------------------------------------
# Case 3a: skills/x/foo.test.mjs -> MATCH (node --test glob, path-scoped)
# ---------------------------------------------------------------------------
R3a="$(setup_repo)"
BASE3a="$(git -C "$R3a" rev-parse HEAD)"
git -C "$R3a" checkout -qb task/skills-mjs 2>/dev/null
mkdir -p "$R3a/skills/x"
printf 'test\n' > "$R3a/skills/x/foo.test.mjs"
git -C "$R3a" add skills/x/foo.test.mjs
git -C "$R3a" commit -qm "add skills test.mjs"
TASK3a="$(git -C "$R3a" rev-parse HEAD)"
git -C "$R3a" checkout -q - 2>/dev/null

cwd3a="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd3a"
rc3a=0
( cd "$cwd3a" && bash "$SCRIPT" "$BASE3a" "$TASK3a" --repo "$R3a" ) >/dev/null 2>&1 || rc3a=$?

if [ "$rc3a" -eq 0 ]; then
  pass "case 3a: skills/x/foo.test.mjs -> match (exit 0)"
else
  fail "case 3a: skills/x/foo.test.mjs -> expected match (exit 0), got $rc3a"
fi

# ---------------------------------------------------------------------------
# Case 3b: dir/bar.test.sh -> MATCH (repo-wide bash-suite find)
# ---------------------------------------------------------------------------
R3b="$(setup_repo)"
BASE3b="$(git -C "$R3b" rev-parse HEAD)"
git -C "$R3b" checkout -qb task/sh-test 2>/dev/null
mkdir -p "$R3b/dir"
printf 'test\n' > "$R3b/dir/bar.test.sh"
git -C "$R3b" add dir/bar.test.sh
git -C "$R3b" commit -qm "add .test.sh"
TASK3b="$(git -C "$R3b" rev-parse HEAD)"
git -C "$R3b" checkout -q - 2>/dev/null

cwd3b="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd3b"
rc3b=0
( cd "$cwd3b" && bash "$SCRIPT" "$BASE3b" "$TASK3b" --repo "$R3b" ) >/dev/null 2>&1 || rc3b=$?

if [ "$rc3b" -eq 0 ]; then
  pass "case 3b: dir/bar.test.sh -> match (exit 0)"
else
  fail "case 3b: dir/bar.test.sh -> expected match (exit 0), got $rc3b"
fi

# ---------------------------------------------------------------------------
# Case 3c: over-count guard — root foo.test.mjs (outside skills/) -> NO MATCH
# The node --test glob is 'skills/**/*.test.mjs' (path-scoped to skills/).
# A .test.mjs at repo root or in a non-skills/ dir must NOT match.
# ---------------------------------------------------------------------------
R3c="$(setup_repo)"
BASE3c="$(git -C "$R3c" rev-parse HEAD)"
git -C "$R3c" checkout -qb task/root-mjs 2>/dev/null
printf 'test\n' > "$R3c/foo.test.mjs"
git -C "$R3c" add foo.test.mjs
git -C "$R3c" commit -qm "add root .test.mjs (not in skills/)"
TASK3c="$(git -C "$R3c" rev-parse HEAD)"
git -C "$R3c" checkout -q - 2>/dev/null

cwd3c="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd3c"
rc3c=0
( cd "$cwd3c" && bash "$SCRIPT" "$BASE3c" "$TASK3c" --repo "$R3c" ) >/dev/null 2>&1 || rc3c=$?

if [ "$rc3c" -ne 0 ]; then
  pass "case 3c: root foo.test.mjs (outside skills/) -> NO match (exit non-zero)"
else
  fail "case 3c: root foo.test.mjs (outside skills/) -> expected NO match (non-zero), got exit 0 (over-count)"
fi

# ---------------------------------------------------------------------------
# Case 3d: over-count guard — foo.test.js -> NO MATCH
# The gate does NOT run .test.js files; the floor must not either.
# ---------------------------------------------------------------------------
R3d="$(setup_repo)"
BASE3d="$(git -C "$R3d" rev-parse HEAD)"
git -C "$R3d" checkout -qb task/test-js 2>/dev/null
mkdir -p "$R3d/skills/z"
printf 'test\n' > "$R3d/skills/z/foo.test.js"
git -C "$R3d" add skills/z/foo.test.js
git -C "$R3d" commit -qm "add .test.js (gate ignores it)"
TASK3d="$(git -C "$R3d" rev-parse HEAD)"
git -C "$R3d" checkout -q - 2>/dev/null

cwd3d="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd3d"
rc3d=0
( cd "$cwd3d" && bash "$SCRIPT" "$BASE3d" "$TASK3d" --repo "$R3d" ) >/dev/null 2>&1 || rc3d=$?

if [ "$rc3d" -ne 0 ]; then
  pass "case 3d: foo.test.js -> NO match (exit non-zero)"
else
  fail "case 3d: foo.test.js -> expected NO match (non-zero), got exit 0 (over-count)"
fi

# ---------------------------------------------------------------------------
# Case 3e: over-count guard — test_foo.py -> NO MATCH
# pytest files are not in the gate's discovery set.
# ---------------------------------------------------------------------------
R3e="$(setup_repo)"
BASE3e="$(git -C "$R3e" rev-parse HEAD)"
git -C "$R3e" checkout -qb task/pytest 2>/dev/null
mkdir -p "$R3e/skills/w"
printf 'test\n' > "$R3e/skills/w/test_foo.py"
git -C "$R3e" add skills/w/test_foo.py
git -C "$R3e" commit -qm "add pytest file (gate ignores it)"
TASK3e="$(git -C "$R3e" rev-parse HEAD)"
git -C "$R3e" checkout -q - 2>/dev/null

cwd3e="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd3e"
rc3e=0
( cd "$cwd3e" && bash "$SCRIPT" "$BASE3e" "$TASK3e" --repo "$R3e" ) >/dev/null 2>&1 || rc3e=$?

if [ "$rc3e" -ne 0 ]; then
  pass "case 3e: test_foo.py -> NO match (exit non-zero)"
else
  fail "case 3e: test_foo.py -> expected NO match (non-zero), got exit 0 (over-count)"
fi

# ---------------------------------------------------------------------------
# Case 4: .. traversal in path argument -> non-zero (no crash, no traversal)
# ---------------------------------------------------------------------------
R4="$(setup_repo)"
BASE4="$(git -C "$R4" rev-parse HEAD)"
TASK4="$BASE4"  # same commit, so diff is empty — that's fine, safety is the point

cwd4="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd4"
rc4=0
( cd "$cwd4" && bash "$SCRIPT" "../$BASE4" "$TASK4" --repo "$R4" ) >/dev/null 2>&1 || rc4=$?

if [ "$rc4" -ne 0 ]; then
  pass "case 4: .. traversal in base arg -> non-zero (no crash)"
else
  fail "case 4: .. traversal in base arg -> expected non-zero, got exit 0"
fi

# ---------------------------------------------------------------------------
# Case 5: empty diff (base and branch are the same commit) -> non-zero, not a crash
# ---------------------------------------------------------------------------
R5="$(setup_repo)"
BASE5="$(git -C "$R5" rev-parse HEAD)"
TASK5="$BASE5"

cwd5="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd5"
rc5=0
( cd "$cwd5" && bash "$SCRIPT" "$BASE5" "$TASK5" --repo "$R5" ) >/dev/null 2>&1 || rc5=$?

if [ "$rc5" -ne 0 ]; then
  pass "case 5: empty diff -> non-zero (not a crash)"
else
  fail "case 5: empty diff -> expected non-zero (no test added), got exit 0"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\nassert-test-in-diff: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
