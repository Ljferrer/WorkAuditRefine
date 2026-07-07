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
#      f. node_modules/x/foo.test.sh -> NO MATCH (over-count guard)
#      f2. .claude/worktrees/x/foo.test.sh -> NO MATCH (over-count guard, mirrors gate -not -path '*/.claude/*')
#      g. skills/a/b/c/d/e/f/deep.test.mjs (depth 6) -> MATCH (depth-agnostic)
#   4. .. traversal path -> non-zero (LOAD-BEARING: real test file on branch,
#      guard fires before diff so it would false-allow without the guard)
#   5. empty diff -> non-zero (not a crash)
#   6. --pattern multi-glob override (space-separated glob set):
#      a. adds pkg/foo.test.js, --pattern '*.test.js *.spec.js', clean cwd -> exit 0
#      b. adds pkg/foo.txt,      same flags,                     clean cwd -> non-zero
#      c. SAME as 6a but cwd seeded with app.test.js -> exit 0 (LOAD-BEARING:
#         guards the noglob regression — bare `for pat in $custom_pattern`
#         glob-expands *.test.js against the cwd without `set -f`)
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
# Case 3f: over-count guard — node_modules/x/foo.test.sh -> NO MATCH
# The gate's find excludes node_modules/; the floor must mirror that.
# ---------------------------------------------------------------------------
R3f="$(setup_repo)"
BASE3f="$(git -C "$R3f" rev-parse HEAD)"
git -C "$R3f" checkout -qb task/nodemod-sh 2>/dev/null
mkdir -p "$R3f/node_modules/x"
printf 'test\n' > "$R3f/node_modules/x/foo.test.sh"
git -C "$R3f" add node_modules/x/foo.test.sh
git -C "$R3f" commit -qm "add node_modules test.sh (gate excludes it)"
TASK3f="$(git -C "$R3f" rev-parse HEAD)"
git -C "$R3f" checkout -q - 2>/dev/null

cwd3f="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd3f"
rc3f=0
( cd "$cwd3f" && bash "$SCRIPT" "$BASE3f" "$TASK3f" --repo "$R3f" ) >/dev/null 2>&1 || rc3f=$?

if [ "$rc3f" -ne 0 ]; then
  pass "case 3f: node_modules/x/foo.test.sh -> NO match (exit non-zero, mirrors gate -not -path '*/node_modules/*')"
else
  fail "case 3f: node_modules/x/foo.test.sh -> expected NO match (non-zero), got exit 0 (over-count)"
fi

# ---------------------------------------------------------------------------
# Case 3f2: over-count guard — .claude/worktrees/x/foo.test.sh -> NO MATCH
# The gate's find excludes .claude/ (~100 stale duplicate suites live under
# .claude/worktrees/); the floor must mirror that -not -path '*/.claude/*'.
# ---------------------------------------------------------------------------
R3f2="$(setup_repo)"
BASE3f2="$(git -C "$R3f2" rev-parse HEAD)"
git -C "$R3f2" checkout -qb task/claude-sh 2>/dev/null
mkdir -p "$R3f2/.claude/worktrees/x"
printf 'test\n' > "$R3f2/.claude/worktrees/x/foo.test.sh"
git -C "$R3f2" add .claude/worktrees/x/foo.test.sh
git -C "$R3f2" commit -qm "add .claude test.sh (gate excludes it)"
TASK3f2="$(git -C "$R3f2" rev-parse HEAD)"
git -C "$R3f2" checkout -q - 2>/dev/null

cwd3f2="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd3f2"
rc3f2=0
( cd "$cwd3f2" && bash "$SCRIPT" "$BASE3f2" "$TASK3f2" --repo "$R3f2" ) >/dev/null 2>&1 || rc3f2=$?

if [ "$rc3f2" -ne 0 ]; then
  pass "case 3f2: .claude/worktrees/x/foo.test.sh -> NO match (exit non-zero, mirrors gate -not -path '*/.claude/*')"
else
  fail "case 3f2: .claude/worktrees/x/foo.test.sh -> expected NO match (non-zero), got exit 0 (over-count)"
fi

# ---------------------------------------------------------------------------
# Case 3g: depth-agnostic — skills/a/b/c/d/e/f/deep.test.mjs (depth 6) -> MATCH
# The old enumeration capped at depth 5; the depth-agnostic check must match.
# ---------------------------------------------------------------------------
R3g="$(setup_repo)"
BASE3g="$(git -C "$R3g" rev-parse HEAD)"
git -C "$R3g" checkout -qb task/deep-mjs 2>/dev/null
mkdir -p "$R3g/skills/a/b/c/d/e/f"
printf 'test\n' > "$R3g/skills/a/b/c/d/e/f/deep.test.mjs"
git -C "$R3g" add skills/a/b/c/d/e/f/deep.test.mjs
git -C "$R3g" commit -qm "add depth-6 skills test.mjs"
TASK3g="$(git -C "$R3g" rev-parse HEAD)"
git -C "$R3g" checkout -q - 2>/dev/null

cwd3g="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd3g"
rc3g=0
( cd "$cwd3g" && bash "$SCRIPT" "$BASE3g" "$TASK3g" --repo "$R3g" ) >/dev/null 2>&1 || rc3g=$?

if [ "$rc3g" -eq 0 ]; then
  pass "case 3g: skills/a/b/c/d/e/f/deep.test.mjs (depth 6) -> match (exit 0, depth-agnostic)"
else
  fail "case 3g: skills/a/b/c/d/e/f/deep.test.mjs (depth 6) -> expected match (exit 0), got $rc3g (depth cap bug)"
fi

# ---------------------------------------------------------------------------
# Case 4: .. traversal in base arg -> LOAD-BEARING: guard fires BEFORE diff,
# and stderr must contain the guard's distinctive rejection message.
#
# The branch has a REAL skills/x.test.mjs that WOULD match if the diff ran.
# With the .. guard:    dies with "refusing to use potentially unsafe ref"
#                       on stderr BEFORE any git operation.
# Without the guard:    git diff reaches line 94, fails on "../<sha>" as an
#                       unknown ref, and dies with "git diff failed" on stderr.
#
# Assertion: stderr contains the guard's unique token
# ("refusing to use potentially unsafe ref") so that deleting the guard
# flips the assertion — the without-guard path emits a DIFFERENT message.
# A bare `rc -ne 0` is NOT sufficient (both paths exit non-zero); we must
# distinguish the two by the guard's own diagnostic text.
# memory: relative-path-test-needs-clean-cwd — cd to unrelated mktemp dir.
# ---------------------------------------------------------------------------
R4="$(setup_repo)"
BASE4="$(git -C "$R4" rev-parse HEAD)"
# Create a branch with a REAL matching test file so the diff is non-empty.
git -C "$R4" checkout -qb task/dotdot-real-test 2>/dev/null
mkdir -p "$R4/skills"
printf 'test\n' > "$R4/skills/x.test.mjs"
git -C "$R4" add skills/x.test.mjs
git -C "$R4" commit -qm "add real test file"
TASK4="$(git -C "$R4" rev-parse HEAD)"
git -C "$R4" checkout -q - 2>/dev/null

cwd4="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd4"
rc4=0
# Capture stderr so we can assert the guard's unique message.
# Pass base as "../<sha>" — the .. guard must fire before any git operation.
stderr4="$( cd "$cwd4" && bash "$SCRIPT" "../$BASE4" "$TASK4" --repo "$R4" 2>&1 >/dev/null )" || rc4=$?

# Two-part assertion (BOTH must hold):
# (a) non-zero exit — guard or diff error; necessary but not sufficient alone
# (b) guard message present in stderr — load-bearing uniqueness check:
#     with guard:    "refusing to use potentially unsafe ref" emitted before diff
#     without guard: "git diff failed for ..." emitted instead — assertion fails
if [ "$rc4" -ne 0 ] && printf '%s' "$stderr4" | grep -qF "refusing to use potentially unsafe ref"; then
  pass "case 4: .. traversal in base arg -> guard fires (non-zero + guard message in stderr)"
elif [ "$rc4" -eq 0 ]; then
  fail "case 4: .. traversal in base arg -> expected non-zero, got exit 0 (guard missing or bypassed)"
else
  fail "case 4: .. traversal in base arg -> got non-zero ($rc4) but guard message absent in stderr (guard bypassed; stderr: $stderr4)"
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
# Case 6: --pattern multi-glob override — the advertised <glob-set> is a
# space-separated set, each token matched independently. .test.js is used
# deliberately: the DEFAULT pattern rejects it (Case 3d), so only a working
# override can make 6a/6c pass — keeps these load-bearing, not vacuously
# matched by the default arm.
# ---------------------------------------------------------------------------

# Case 6a: adds pkg/foo.test.js, --pattern '*.test.js *.spec.js', clean cwd -> exit 0
R6a="$(setup_repo)"
BASE6a="$(git -C "$R6a" rev-parse HEAD)"
git -C "$R6a" checkout -qb task/multi-glob-hit 2>/dev/null
mkdir -p "$R6a/pkg"
printf 'test\n' > "$R6a/pkg/foo.test.js"
git -C "$R6a" add pkg/foo.test.js
git -C "$R6a" commit -qm "add pkg/foo.test.js"
TASK6a="$(git -C "$R6a" rev-parse HEAD)"
git -C "$R6a" checkout -q - 2>/dev/null

cwd6a="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd6a"
rc6a=0
( cd "$cwd6a" && bash "$SCRIPT" "$BASE6a" "$TASK6a" --pattern '*.test.js *.spec.js' --repo "$R6a" ) >/dev/null 2>&1 || rc6a=$?

if [ "$rc6a" -eq 0 ]; then
  pass "case 6a: --pattern '*.test.js *.spec.js' matches pkg/foo.test.js -> exit 0"
else
  fail "case 6a: --pattern '*.test.js *.spec.js' matches pkg/foo.test.js -> expected exit 0, got $rc6a (single-arm treats the set as one literal-with-space pattern)"
fi

# Case 6b: adds pkg/foo.txt, same flags, clean cwd -> non-zero (negative control)
R6b="$(setup_repo)"
BASE6b="$(git -C "$R6b" rev-parse HEAD)"
git -C "$R6b" checkout -qb task/multi-glob-miss 2>/dev/null
mkdir -p "$R6b/pkg"
printf 'src\n' > "$R6b/pkg/foo.txt"
git -C "$R6b" add pkg/foo.txt
git -C "$R6b" commit -qm "add pkg/foo.txt (no glob match)"
TASK6b="$(git -C "$R6b" rev-parse HEAD)"
git -C "$R6b" checkout -q - 2>/dev/null

cwd6b="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd6b"
rc6b=0
( cd "$cwd6b" && bash "$SCRIPT" "$BASE6b" "$TASK6b" --pattern '*.test.js *.spec.js' --repo "$R6b" ) >/dev/null 2>&1 || rc6b=$?

if [ "$rc6b" -ne 0 ]; then
  pass "case 6b: --pattern '*.test.js *.spec.js' does NOT match pkg/foo.txt -> non-zero"
else
  fail "case 6b: --pattern '*.test.js *.spec.js' vs pkg/foo.txt -> expected non-zero, got exit 0"
fi

# Case 6c: SAME as 6a but cwd SEEDED with a real file matching a token ->
# exit 0. LOAD-BEARING glob-expansion guard: without `set -f`, the unquoted
# `for pat in $custom_pattern` pathname-expands `*.test.js` against this cwd
# (-> app.test.js), corrupting the token so pkg/foo.test.js no longer matches
# -> exit 1 != 0. 6a/6b run in EMPTY cwds and are structurally blind to this.
# memory: weak-test-assertion-passes-without-feature-being-exercised.
R6c="$(setup_repo)"
BASE6c="$(git -C "$R6c" rev-parse HEAD)"
git -C "$R6c" checkout -qb task/multi-glob-seeded 2>/dev/null
mkdir -p "$R6c/pkg"
printf 'test\n' > "$R6c/pkg/foo.test.js"
git -C "$R6c" add pkg/foo.test.js
git -C "$R6c" commit -qm "add pkg/foo.test.js (seeded-cwd variant)"
TASK6c="$(git -C "$R6c" rev-parse HEAD)"
git -C "$R6c" checkout -q - 2>/dev/null

cwd6c="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd6c"
# Seed the cwd with a real file matching a pattern token; a naive
# glob-expanding loop would rewrite `*.test.js` -> `app.test.js` here.
touch "$cwd6c/app.test.js"
rc6c=0
( cd "$cwd6c" && bash "$SCRIPT" "$BASE6c" "$TASK6c" --pattern '*.test.js *.spec.js' --repo "$R6c" ) >/dev/null 2>&1 || rc6c=$?

if [ "$rc6c" -eq 0 ]; then
  pass "case 6c: seeded cwd (app.test.js) + --pattern '*.test.js *.spec.js' matches pkg/foo.test.js -> exit 0 (noglob guard holds)"
else
  fail "case 6c: seeded cwd + --pattern '*.test.js *.spec.js' -> expected exit 0, got $rc6c (glob-expansion corrupted the token; set -f missing)"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\nassert-test-in-diff: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
