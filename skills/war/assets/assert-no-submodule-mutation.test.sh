#!/usr/bin/env bash
# Tests for assert-no-submodule-mutation.sh — WAR submodule-refuse floor guard.
#
# Each case: fresh mktemp dir for cwd (memory relative-path-test-needs-clean-cwd),
# fresh temp git repo with a real submodule (as needed).
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
#
# Exit 0 = all cases passed; non-zero = at least one failed.
#
# Cases:
#   1. gitlink bump in the diff (mode 160000) -> exit 1 (refuse)
#   2. content change under a .gitmodules submodule path -> exit 1 (refuse)
#   3. clean superproject-only diff (no submodule touch) -> exit 0
#   4. bad ref -> exit 2 (NOT 1; the 1-vs-2 correctness boundary)
#   5. empty diff (base == branch) -> exit 0
#   6. repo with no .gitmodules + normal diff -> exit 0 (no-op case)
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/assert-no-submodule-mutation.sh"

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

# setup_repo: create a fresh git repo with an initial commit; echo its path.
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

# setup_submodule_repo: create a bare-ish repo to use as a submodule remote; echo its path.
setup_submodule_repo() {
  T="$(mktemp -d 2>/dev/null || mktemp -d -t warsub)"
  TMPFILES="$TMPFILES $T"
  git -C "$T" init -q
  git -C "$T" config user.email war@test.local
  git -C "$T" config user.name "WAR Test"
  git -C "$T" config commit.gpgsign false
  printf 'submod\n' > "$T/submod.txt"
  git -C "$T" add submod.txt
  git -C "$T" commit -qm "submod seed"
  printf '%s\n' "$T"
}

# ---------------------------------------------------------------------------
# Case 1: gitlink bump in the diff (mode 160000) -> exit 1 (refuse)
#
# We build a superproject that has a submodule, then make a branch that bumps
# the submodule's gitlink (commits the submodule at a later SHA).
# git diff --raw shows mode 160000 for the submodule path -> refuse (exit 1).
# ---------------------------------------------------------------------------
SUB1="$(setup_submodule_repo)"
R1="$(setup_repo)"
BASE1="$(git -C "$R1" rev-parse HEAD)"

# Add the submodule at its current HEAD.
git -C "$R1" -c protocol.file.allow=always submodule add -q "$SUB1" sub 2>/dev/null
git -C "$R1" commit -qm "add submodule"
# Now check out the integration base after adding the submodule.
BASE1_WITH_SUB="$(git -C "$R1" rev-parse HEAD)"

# Create a task branch that bumps the submodule gitlink.
git -C "$R1" checkout -qb task/gitlink-bump 2>/dev/null
# Add a second commit in the submodule repo so we can advance the pointer.
printf 'v2\n' > "$SUB1/v2.txt"
git -C "$SUB1" add v2.txt
git -C "$SUB1" commit -qm "v2"
# Advance the submodule in the superproject to the new commit.
git -C "$R1" -c protocol.file.allow=always submodule update --remote -q sub 2>/dev/null
git -C "$R1" add sub
git -C "$R1" commit -qm "bump submodule gitlink"
TASK1="$(git -C "$R1" rev-parse HEAD)"
git -C "$R1" checkout -q - 2>/dev/null

cwd1="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd1"
rc1=0
( cd "$cwd1" && bash "$SCRIPT" "$BASE1_WITH_SUB" "$TASK1" --repo "$R1" ) >/dev/null 2>&1 || rc1=$?

if [ "$rc1" -eq 1 ]; then
  pass "case 1: gitlink bump in diff -> exit 1 (refuse)"
else
  fail "case 1: gitlink bump in diff -> expected exit 1 (refuse), got $rc1"
fi

# ---------------------------------------------------------------------------
# Case 2: content change under a .gitmodules submodule path -> exit 1 (refuse)
#
# Build a superproject with a submodule at path "sub". On a task branch,
# commit a regular file change under "sub/" as a tracked file (i.e., without
# entering the submodule's repo — just a path that matches a submodule path).
# The script checks .gitmodules paths and refuses if a changed file lives under one.
# ---------------------------------------------------------------------------
SUB2="$(setup_submodule_repo)"
R2="$(setup_repo)"
git -C "$R2" -c protocol.file.allow=always submodule add -q "$SUB2" sub 2>/dev/null
git -C "$R2" commit -qm "add submodule"
BASE2="$(git -C "$R2" rev-parse HEAD)"

# Detach and make a commit that changes a path "sub/extra.txt" in the index
# (deinit the submodule so it appears as a plain path, simulating a content touch).
# Actually, we simulate this differently: create a branch where we deinit the
# submodule and add a plain file under sub/ — this shows up in the diff as a
# path under the submodule path.
git -C "$R2" checkout -qb task/content-under-subpath 2>/dev/null
git -C "$R2" submodule deinit -q sub 2>/dev/null || true
rm -rf "$R2/.git/modules/sub" 2>/dev/null || true
# Remove the submodule entry so we can add a plain file there.
git -C "$R2" rm -qrf sub 2>/dev/null || true
mkdir -p "$R2/sub"
printf 'changed\n' > "$R2/sub/extra.txt"
git -C "$R2" add sub/extra.txt
git -C "$R2" commit -qm "content change under sub/ path"
TASK2="$(git -C "$R2" rev-parse HEAD)"
git -C "$R2" checkout -q - 2>/dev/null

cwd2="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd2"
rc2=0
( cd "$cwd2" && bash "$SCRIPT" "$BASE2" "$TASK2" --repo "$R2" ) >/dev/null 2>&1 || rc2=$?

if [ "$rc2" -eq 1 ]; then
  pass "case 2: content change under .gitmodules submodule path -> exit 1 (refuse)"
else
  fail "case 2: content change under .gitmodules submodule path -> expected exit 1 (refuse), got $rc2"
fi

# ---------------------------------------------------------------------------
# Case 3: clean superproject-only diff (no submodule touch) -> exit 0
#
# A superproject with a submodule; the task branch only changes a non-submodule file.
# ---------------------------------------------------------------------------
SUB3="$(setup_submodule_repo)"
R3="$(setup_repo)"
git -C "$R3" -c protocol.file.allow=always submodule add -q "$SUB3" sub 2>/dev/null
git -C "$R3" commit -qm "add submodule"
BASE3="$(git -C "$R3" rev-parse HEAD)"

git -C "$R3" checkout -qb task/clean-super 2>/dev/null
printf 'changed\n' > "$R3/superproject_file.txt"
git -C "$R3" add superproject_file.txt
git -C "$R3" commit -qm "change superproject file only"
TASK3="$(git -C "$R3" rev-parse HEAD)"
git -C "$R3" checkout -q - 2>/dev/null

cwd3="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd3"
rc3=0
( cd "$cwd3" && bash "$SCRIPT" "$BASE3" "$TASK3" --repo "$R3" ) >/dev/null 2>&1 || rc3=$?

if [ "$rc3" -eq 0 ]; then
  pass "case 3: clean superproject-only diff -> exit 0"
else
  fail "case 3: clean superproject-only diff -> expected exit 0, got $rc3"
fi

# ---------------------------------------------------------------------------
# Case 4: bad ref -> exit 2 (NOT 1)
#
# Correctness boundary: git/ref error must be 2, not 1 (refuse).
# Passing a non-existent ref as base or branch must produce exit 2.
# ---------------------------------------------------------------------------
R4="$(setup_repo)"

cwd4="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd4"
rc4=0
( cd "$cwd4" && bash "$SCRIPT" "nonexistent-ref-abc123" "also-nonexistent-xyz" --repo "$R4" ) >/dev/null 2>&1 || rc4=$?

if [ "$rc4" -eq 2 ]; then
  pass "case 4: bad ref -> exit 2 (not 1 — correctness boundary)"
else
  fail "case 4: bad ref -> expected exit 2, got $rc4 (1 vs 2 correctness boundary violated)"
fi

# ---------------------------------------------------------------------------
# Case 5: empty diff (base == branch) -> exit 0
#
# No changes = no submodule mutation = refuse-all returns 0.
# (Nothing to refuse; clean.)
# ---------------------------------------------------------------------------
R5="$(setup_repo)"
BASE5="$(git -C "$R5" rev-parse HEAD)"
TASK5="$BASE5"

cwd5="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd5"
rc5=0
( cd "$cwd5" && bash "$SCRIPT" "$BASE5" "$TASK5" --repo "$R5" ) >/dev/null 2>&1 || rc5=$?

if [ "$rc5" -eq 0 ]; then
  pass "case 5: empty diff -> exit 0 (no mutation, not a crash)"
else
  fail "case 5: empty diff -> expected exit 0 (clean), got $rc5"
fi

# ---------------------------------------------------------------------------
# Case 6: repo with no .gitmodules + normal diff -> exit 0 (no-op case)
#
# A superproject-free repo; the task adds only a plain file.
# No .gitmodules = no submodule paths to cross-check; no gitlinks possible.
# Must be a no-op (exit 0).
# ---------------------------------------------------------------------------
R6="$(setup_repo)"
BASE6="$(git -C "$R6" rev-parse HEAD)"
git -C "$R6" checkout -qb task/no-gitmodules 2>/dev/null
printf 'normal file\n' > "$R6/normal.txt"
git -C "$R6" add normal.txt
git -C "$R6" commit -qm "plain file, no submodules"
TASK6="$(git -C "$R6" rev-parse HEAD)"
git -C "$R6" checkout -q - 2>/dev/null

cwd6="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd6"
rc6=0
( cd "$cwd6" && bash "$SCRIPT" "$BASE6" "$TASK6" --repo "$R6" ) >/dev/null 2>&1 || rc6=$?

if [ "$rc6" -eq 0 ]; then
  pass "case 6: no .gitmodules + normal diff -> exit 0 (no-op)"
else
  fail "case 6: no .gitmodules + normal diff -> expected exit 0 (no-op), got $rc6"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\nassert-no-submodule-mutation: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
