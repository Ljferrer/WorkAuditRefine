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
#   7. --pattern '*.test.ts' (target-repo TS convention), diff adds src/foo.test.ts:
#      a. BARE -> non-zero (.test.ts not in default set); b. --pattern -> exit 0
#         (single-star crosses '/'). Load-bearing pair: default refuses .test.ts.
#   8. '**/'-token literal-slash trap, root-level foo.test.ts:
#      a. --pattern '**/*.test.ts' -> non-zero (bash `case` '**' has no globstar;
#         the literal '/' needs a slash the root file lacks — why Setup proposes
#         single-star tokens); b. --pattern '*.test.ts' -> exit 0 (contrast).
#   9. UNION / delete-the-union check: diff adds hooks/x.test.sh, --pattern
#      '*.test.ts' -> exit 0 (custom token misses .test.sh; the unioned *.test.sh
#      arm satisfies the floor — floor ⊆ gate for the gate's unconditional find).
#  10. FLOOR ⊆ GATE PARITY (Task 1.6): the floor's *.test.sh discovery set must
#      equal the gate's, read from resolveGate's OUTPUT string (not its source),
#      so a semantics-preserving resolveGate refactor cannot break it.
#      a. resolveGate output exclusion set == {.claude,.git,node_modules}
#      b. floor match_sh_suite exclusion set == resolveGate output set (the parity)
#      c. *.test.sh name glob present in both gate output and floor
#      d. floor node glob literal == skills/**/*.test.mjs
#      e. DELETE-THE-FEATURE: floor with the .claude arm removed != gate set,
#         proving 10b is load-bearing (mutating either side turns it RED).
#  11. FAIL-CLOSED FLOOR CLASSIFICATION (#732): every non-test .sh in
#      skills/war/assets/ must carry a hardcoded parity/exempt-with-reason row —
#      an unclassified new floor turns this RED, forcing the author to classify.
#      a. every enumerated non-test .sh is classified (parity or exempt-with-reason)
#      b. each `parity` row is content-verified: its twin <name>.test.sh invokes
#         --resolve-gate (comment-stripped) — tag honesty checked, not trusted
#      c. DELETE-THE-FEATURE: classify_floors flags a stub (new-floor.sh) as
#         UNCLASSIFIED, proving the fail-closed arm is load-bearing.
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
# Case 7: custom --pattern '*.test.ts' — the target-repo TypeScript convention.
# A diff adding only src/foo.test.ts (spec validation 3, single-star variant):
#   7a. BARE (no --pattern) -> non-zero: .test.ts is NOT in the default gate
#       discovery set (mirrors Case 3d's .test.js refusal); the floor refuses.
#   7b. --pattern '*.test.ts' -> exit 0: single-star token; bash `case` `*`
#       crosses '/', so it matches the nested src/foo.test.ts.
# LOAD-BEARING pair: 7a proves the default refuses .test.ts, so 7b's pass is
# attributable to the override, not a vacuous default match.
# ---------------------------------------------------------------------------
R7="$(setup_repo)"
BASE7="$(git -C "$R7" rev-parse HEAD)"
git -C "$R7" checkout -qb task/ts-test 2>/dev/null
mkdir -p "$R7/src"
printf 'test\n' > "$R7/src/foo.test.ts"
git -C "$R7" add src/foo.test.ts
git -C "$R7" commit -qm "add src/foo.test.ts"
TASK7="$(git -C "$R7" rev-parse HEAD)"
git -C "$R7" checkout -q - 2>/dev/null

cwd7="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd7"
rc7a=0
( cd "$cwd7" && bash "$SCRIPT" "$BASE7" "$TASK7" --repo "$R7" ) >/dev/null 2>&1 || rc7a=$?
if [ "$rc7a" -ne 0 ]; then
  pass "case 7a: src/foo.test.ts BARE (default pattern) -> non-zero (.test.ts not in default set)"
else
  fail "case 7a: src/foo.test.ts BARE -> expected non-zero, got exit 0 (default set over-counts .test.ts)"
fi

rc7b=0
( cd "$cwd7" && bash "$SCRIPT" "$BASE7" "$TASK7" --pattern '*.test.ts' --repo "$R7" ) >/dev/null 2>&1 || rc7b=$?
if [ "$rc7b" -eq 0 ]; then
  pass "case 7b: src/foo.test.ts + --pattern '*.test.ts' -> exit 0 (single-star crosses /)"
else
  fail "case 7b: src/foo.test.ts + --pattern '*.test.ts' -> expected exit 0, got $rc7b (single-star token should match nested .test.ts)"
fi

# ---------------------------------------------------------------------------
# Case 8: the '**/'-token literal-slash trap (documents why Setup proposes
# SINGLE-star tokens, not the spec Decision A '**/*.test.ts' example).
# A root-level foo.test.ts:
#   8a. --pattern '**/*.test.ts' -> non-zero: in bash `case`, '**' is just two
#       '*' (no globstar); the literal '/' between '**' and '*' REQUIRES a slash
#       in the path, so a root-level file MISSES.
#   8b. --pattern '*.test.ts' (single-star) -> exit 0: same file matches.
# LOAD-BEARING pair: 8b proves the file WOULD match under a single-star token,
# so 8a's miss is attributable specifically to the '**/' literal-slash trap,
# not to an unrelated reason the file fails to match.
# ---------------------------------------------------------------------------
R8="$(setup_repo)"
BASE8="$(git -C "$R8" rev-parse HEAD)"
git -C "$R8" checkout -qb task/root-ts 2>/dev/null
printf 'test\n' > "$R8/foo.test.ts"
git -C "$R8" add foo.test.ts
git -C "$R8" commit -qm "add root foo.test.ts"
TASK8="$(git -C "$R8" rev-parse HEAD)"
git -C "$R8" checkout -q - 2>/dev/null

cwd8="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd8"
rc8a=0
( cd "$cwd8" && bash "$SCRIPT" "$BASE8" "$TASK8" --pattern '**/*.test.ts' --repo "$R8" ) >/dev/null 2>&1 || rc8a=$?
if [ "$rc8a" -ne 0 ]; then
  pass "case 8a: root foo.test.ts + --pattern '**/*.test.ts' -> non-zero ('**/' literal-slash trap)"
else
  fail "case 8a: root foo.test.ts + --pattern '**/*.test.ts' -> expected non-zero, got exit 0 ('**/' unexpectedly matched a root file)"
fi

rc8b=0
( cd "$cwd8" && bash "$SCRIPT" "$BASE8" "$TASK8" --pattern '*.test.ts' --repo "$R8" ) >/dev/null 2>&1 || rc8b=$?
if [ "$rc8b" -eq 0 ]; then
  pass "case 8b: root foo.test.ts + --pattern '*.test.ts' (single-star) -> exit 0 (contrast: the file DOES match single-star)"
else
  fail "case 8b: root foo.test.ts + --pattern '*.test.ts' -> expected exit 0, got $rc8b (single-star should match a root file)"
fi

# ---------------------------------------------------------------------------
# Case 9: the UNION / delete-the-union check. A diff adding only hooks/x.test.sh
# with --pattern '*.test.ts' -> exit 0.
# The custom token '*.test.ts' does NOT match a .test.sh file; the ONLY way this
# exits 0 is the unioned *.test.sh arm (match_sh_suite) mirroring the gate's
# unconditional discovery. Delete the union and this flips to exit 1 -> the
# assertion fails. This is the floor ⊆ gate guarantee: a .test.sh suite
# satisfies the floor regardless of the custom pattern.
# memory: weak-test-assertion-passes-without-feature-being-exercised.
# ---------------------------------------------------------------------------
R9="$(setup_repo)"
BASE9="$(git -C "$R9" rev-parse HEAD)"
git -C "$R9" checkout -qb task/union-sh 2>/dev/null
mkdir -p "$R9/hooks"
printf 'test\n' > "$R9/hooks/x.test.sh"
git -C "$R9" add hooks/x.test.sh
git -C "$R9" commit -qm "add hooks/x.test.sh"
TASK9="$(git -C "$R9" rev-parse HEAD)"
git -C "$R9" checkout -q - 2>/dev/null

cwd9="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd9"
rc9=0
( cd "$cwd9" && bash "$SCRIPT" "$BASE9" "$TASK9" --pattern '*.test.ts' --repo "$R9" ) >/dev/null 2>&1 || rc9=$?
if [ "$rc9" -eq 0 ]; then
  pass "case 9: hooks/x.test.sh + --pattern '*.test.ts' -> exit 0 (union: *.test.sh always satisfies the floor)"
else
  fail "case 9: hooks/x.test.sh + --pattern '*.test.ts' -> expected exit 0, got $rc9 (union deleted? floor went blind to the gate's *.test.sh discovery)"
fi

# ---------------------------------------------------------------------------
# Case 10: FLOOR ⊆ GATE PARITY (Task 1.6). The floor's *.test.sh discovery set
# is asserted equal to the gate's, extracted from resolveGate's emitted OUTPUT
# string (not its source text) — a benign resolveGate refactor that preserves
# semantics cannot break this; only a real discovery-set drift does. Mutating
# either side (floor arm removed, or resolveGate exclusion changed) turns it RED.
# spec §8; the recorded shell↔mjs drift-guard idiom applied to floor⊆gate.
# ---------------------------------------------------------------------------
WARCONFIG="$HERE/war-config.mjs"

# gate_excl: exclusion tokens from resolveGate's emitted
# `find ... -not -path '*/X/*'` discovery clause (OUTPUT, not source).
gate_excl() {
  node "$WARCONFIG" --resolve-gate "node --test 'skills/**/*.test.mjs'" \
    | grep -oE "\-not -path '\*/[^/]*/\*'" \
    | sed -E "s#-not -path '\*/(.*)/\*'#\1#" \
    | sort
}
# floor_excl <script>: exclusion tokens from match_sh_suite's `return 1 ;;`
# case arms (the `.claude/*|*/.claude/*)` etc. shapes). Scoped to `return 1 ;;`
# so the header comment's identical `-not -path` prose is NOT counted — the
# assertion tests the executable arms, not the doc that describes them.
floor_excl() {
  grep 'return 1 ;;' "$1" \
    | sed -E 's#^[[:space:]]*([^/|]*)/\*.*#\1#' \
    | sort
}

EXPECT_EXCL="$(printf '.claude\n.git\nnode_modules\n')"
G_EXCL="$(gate_excl)"
F_EXCL="$(floor_excl "$SCRIPT")"

# 10a: resolveGate output exclusion set == canonical {.claude,.git,node_modules}
if [ "$G_EXCL" = "$EXPECT_EXCL" ]; then
  pass "case 10a: resolveGate output exclusion set == {.claude,.git,node_modules}"
else
  fail "case 10a: resolveGate output exclusion set drifted -> got [$(printf '%s' "$G_EXCL" | tr '\n' ' ')]"
fi

# 10b: floor match_sh_suite exclusion set == gate output set (THE parity claim).
# Reads resolveGate output, not source -> refactor-robust; drift on either side RED.
if [ "$F_EXCL" = "$G_EXCL" ]; then
  pass "case 10b: floor match_sh_suite exclusion set == resolveGate output set (floor ⊆ gate)"
else
  fail "case 10b: floor⊆gate PARITY BROKEN -> floor [$(printf '%s' "$F_EXCL" | tr '\n' ' ')] != gate [$(printf '%s' "$G_EXCL" | tr '\n' ' ')]"
fi

# 10c: the *.test.sh name glob is present in BOTH gate output and floor source.
g_name=0
node "$WARCONFIG" --resolve-gate "node --test 'skills/**/*.test.mjs'" | grep -qE "\-name '\*.test.sh'" && g_name=1
f_name=0
grep -qF '*.test.sh)' "$SCRIPT" && f_name=1
if [ "$g_name" -eq 1 ] && [ "$f_name" -eq 1 ]; then
  pass "case 10c: *.test.sh name glob present in both gate output and floor"
else
  fail "case 10c: *.test.sh name glob missing (gate=$g_name floor=$f_name)"
fi

# 10d: floor node glob literal == skills/**/*.test.mjs (the declared-gate mirror).
if grep -qF 'pattern_mjs="skills/**/*.test.mjs"' "$SCRIPT"; then
  pass "case 10d: floor node glob literal == skills/**/*.test.mjs"
else
  fail "case 10d: floor node glob literal drifted from skills/**/*.test.mjs"
fi

# 10e: DELETE-THE-FEATURE — remove the .claude arm from a floor copy; its
# extracted set must NO LONGER equal the gate set, proving 10b actually
# distinguishes a discovery-set drift (not a vacuous always-true compare).
# memory: weak-test-assertion-passes-without-feature-being-exercised.
MUT="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $MUT"
grep -v '\.claude/\*)' "$SCRIPT" > "$MUT/floor.sh"
M_EXCL="$(floor_excl "$MUT/floor.sh")"
if [ "$M_EXCL" != "$G_EXCL" ]; then
  pass "case 10e: floor with .claude arm removed != gate set (parity check is load-bearing)"
else
  fail "case 10e: mutated floor (.claude dropped) still == gate set -> parity check is vacuous"
fi

# ---------------------------------------------------------------------------
# Case 11: FAIL-CLOSED FLOOR CLASSIFICATION (#732). Built on the Case 10 parity
# idiom but a distinct, cross-floor concern: enumerate every non-test .sh in
# skills/war/assets/ and require each to carry a hardcoded classification row —
# `parity` (owes a floor⊆gate parity case) or `exempt: <reason>` naming its
# ACTUAL non-gate discovery mechanism (spec §3's exemption table, never a generic
# "different"). A new floor script with no row, or a row whose script vanished,
# turns this RED and directs the author to classify. Each `parity` row is
# CONTENT-VERIFIED (11b): its twin <name>.test.sh must invoke --resolve-gate in
# comment-stripped text — the irreducible fingerprint of the parity idiom (gate
# side extracted from emitted output). An honor-system `parity` tag with no real
# parity case goes RED, closing the silent-copy hole that let the lesson recur.
# The enumeration is NOT prefix-narrowed: gate-pin-status.sh and
# provision-worktrees.sh carry no assert- prefix and must still be evaluated.
# memory: floor-script-discovery-set-must-mirror-gate-exclusions (3rd recurrence).
# ---------------------------------------------------------------------------

# Hardcoded classification: one row per non-test .sh, `<name> parity` or
# `<name> exempt: <actual discovery mechanism>`. Survey-derived (directory listing
# + manual header-comment survey of every script), never a name-prefix grep.
CLASSIFICATION="$(cat <<'EOF'
assert-guard-specificity-in-diff.sh parity
assert-issues-filed.sh exempt: gh/ledger reconciliation, no file discovery
assert-no-submodule-mutation.sh exempt: git diff --raw gitlink-mode inspection, no file discovery
assert-packaging-in-diff.sh exempt: Dockerfile-naming discovery via git ls-tree
assert-test-in-diff.sh parity
gate-pin-status.sh parity
provision-worktrees.sh exempt: lifecycle tool, not a merge-path floor
EOF
)"

# floor_listing: non-test .sh basenames under $HERE (cwd-independent). Excludes
# only the *.test.sh suites — NOT narrowed to assert-*.sh (End state 9).
floor_listing() {
  for p in "$HERE"/*.sh; do
    b="$(basename "$p")"
    case "$b" in
      *.test.sh) ;;                 # skip the test suites themselves
      *) printf '%s\n' "$b" ;;
    esac
  done
}

# classify_floors <listing>: set-diff a newline listing against CLASSIFICATION's
# names. Echoes `UNCLASSIFIED <name>` (listed, no row) and `ABSENT <name>` (row,
# not listed); empty output == fully classified. Factored so the mutation arm
# (11c) can feed a synthetic listing — the permanent delete-the-feature proof.
classify_floors() {
  _cf_listing="$(printf '%s\n' "$1" | grep -v '^[[:space:]]*$' | sort)"
  _cf_names="$(printf '%s\n' "$CLASSIFICATION" | grep -v '^[[:space:]]*$' | sed 's/ .*//' | sort)"
  comm -23 <(printf '%s\n' "$_cf_listing") <(printf '%s\n' "$_cf_names") | sed 's/^/UNCLASSIFIED /'
  comm -13 <(printf '%s\n' "$_cf_listing") <(printf '%s\n' "$_cf_names") | sed 's/^/ABSENT /'
}

# verify_parity_twins: content-verify each `parity` row — the tag is checked, not
# trusted. Echoes `MISSING-TWIN <name>` / `NO-FINGERPRINT <name>` for any parity
# floor whose twin <name>.test.sh is absent or lacks --resolve-gate (comment-
# stripped). Empty output == every parity tag is backed by a real parity case.
verify_parity_twins() {
  printf '%s\n' "$CLASSIFICATION" | grep ' parity$' | sed 's/ .*//' | while IFS= read -r name; do
    [ -z "$name" ] && continue
    twin="$HERE/${name%.sh}.test.sh"
    if [ ! -f "$twin" ]; then
      printf 'MISSING-TWIN %s\n' "$name"
    elif ! grep -v '^[[:space:]]*#' "$twin" | grep -q -- '--resolve-gate'; then
      printf 'NO-FINGERPRINT %s\n' "$name"
    fi
  done
}

LISTING="$(floor_listing)"

# 11a: every enumerated non-test .sh carries a classification row (parity or exempt).
CLASS_ISSUES="$(classify_floors "$LISTING")"
if [ -z "$CLASS_ISSUES" ]; then
  pass "case 11a: every non-test .sh in skills/war/assets/ is classified (parity or exempt-with-reason)"
else
  fail "case 11a: floor classification drift. Each line is either UNCLASSIFIED (a floor script with no row — add a parity case, idiom: this file's Case 10, or an exempt: row naming its non-gate discovery mechanism) or ABSENT (a row whose script vanished — remove the row):
$CLASS_ISSUES"
fi

# 11b: every `parity` tag is content-verified — its twin suite really runs the idiom.
PARITY_ISSUES="$(verify_parity_twins)"
if [ -z "$PARITY_ISSUES" ]; then
  pass "case 11b: every parity-tagged floor has a content-verified twin (--resolve-gate present, comment-stripped)"
else
  fail "case 11b: a parity tag is not backed by a real parity case. Its twin <name>.test.sh must invoke --resolve-gate (the idiom's fingerprint — gate side from emitted output):
$PARITY_ISSUES"
fi

# 11c: DELETE-THE-FEATURE (permanent, not a one-off dev run). Feed classify_floors
# the real listing PLUS an unclassified stub floor; it MUST report it UNCLASSIFIED.
# A vacuous always-empty classify_floors would pass 11a yet let the next floor slip.
# memory: weak-test-assertion-passes-without-feature-being-exercised.
MUT_LISTING="$(printf '%s\nnew-floor.sh\n' "$LISTING")"
if classify_floors "$MUT_LISTING" | grep -q '^UNCLASSIFIED new-floor.sh$'; then
  pass "case 11c: classify_floors flags an unclassified stub (new-floor.sh) RED (fail-closed arm is load-bearing)"
else
  fail "case 11c: classify_floors did NOT flag new-floor.sh -> the classification check is vacuous (a new floor would pass unnoticed)"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\nassert-test-in-diff: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
