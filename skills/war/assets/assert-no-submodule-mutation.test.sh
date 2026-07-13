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
#   7. --declared + gitlink-only move -> exit 0 (legitimate gitlink-bump path)
#   8. --declared + gitlink bump AND non-gitlink content under a branch-declared path
#      -> exit 1 (step 3 fires despite --declared's gitlink fall-through)
#   9. no flag + gitlink move -> exit 1 (Increment-1 behavior intact — regression guard)
#  10. step-3 isolation: .gitmodules-path content touch, NO gitlink move -> exit 1 (step 3 only)
#  11. step-2 isolation: pure gitlink mode-160000 move, path NOT in .gitmodules -> exit 1 (step 2 only)
#  12. --declared + pure content under a .gitmodules path, NO incidental gitlink deletion -> exit 1
#  13. --declared + branch itself declares a submodule path + content under it, working
#      tree diverged to LACK the declaration -> exit 1 (ref read keys on the branch)
#  14. content under a path the WORKING TREE declares but the BRANCH REF does NOT
#      -> exit 0 (a working-tree-only declaration no longer leaks into the ref read)
#  15. branch .gitmodules exists but declares no paths (empty) -> exit 0 (git config
#      rc==1 is a clean "no declared paths", never a die-2; + exit-2 deferred-validation note)
#
# Cases 1/2 conflate the guard's two refuse arms (both the mode-160000 step-2 arm
# and the .gitmodules-path step-3 arm fire on the same fixture). Cases 10/11/12 each
# isolate ONE arm so a regression in that arm alone is caught (proven by temp-break:
# disabling that arm flips the case to allow; disabling the other keeps it refused).
# The guard reads .gitmodules from the BRANCH REF (`$branch:.gitmodules`), NOT the
# checked-out working tree (#802) — a fixture's declared paths come from what the
# TASK BRANCH commits, so the working-tree position is irrelevant. Cases 13/14 prove
# the ref read by dirtying the working tree to diverge from the branch ref.
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
# Case 7: --declared + gitlink-only move -> exit 0 (legitimate gitlink-bump path)
#
# Increment 2: when the guard is invoked with --declared, a pure gitlink move
# (mode 160000, no non-gitlink submodule-path content change) must be ALLOWED
# (exit 0) because it is the declared gitlink-bump task's legitimate path.
# The pin-validity check is a separate auditor lens; here we only refuse
# undeclared mutations.
# ---------------------------------------------------------------------------
SUB7="$(setup_submodule_repo)"
R7="$(setup_repo)"
git -C "$R7" -c protocol.file.allow=always submodule add -q "$SUB7" sub 2>/dev/null
git -C "$R7" commit -qm "add submodule"
BASE7="$(git -C "$R7" rev-parse HEAD)"

git -C "$R7" checkout -qb task/declared-gitlink-bump 2>/dev/null
# Advance the submodule pointer (add a commit to the submodule remote, then bump).
printf 'v2\n' > "$SUB7/v2.txt"
git -C "$SUB7" add v2.txt
git -C "$SUB7" commit -qm "v2"
git -C "$R7" -c protocol.file.allow=always submodule update --remote -q sub 2>/dev/null
git -C "$R7" add sub
git -C "$R7" commit -qm "bump submodule gitlink (declared)"
TASK7="$(git -C "$R7" rev-parse HEAD)"
git -C "$R7" checkout -q - 2>/dev/null

cwd7="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd7"
rc7=0
( cd "$cwd7" && bash "$SCRIPT" "$BASE7" "$TASK7" --repo "$R7" --declared ) >/dev/null 2>&1 || rc7=$?

if [ "$rc7" -eq 0 ]; then
  pass "case 7: --declared + gitlink-only move -> exit 0 (legitimate gitlink-bump path)"
else
  fail "case 7: --declared + gitlink-only move -> expected exit 0, got $rc7"
fi

# ---------------------------------------------------------------------------
# Case 8: --declared + a legit gitlink bump AND non-gitlink content under a
# branch-declared submodule path -> exit 1 (step 3 fires despite --declared)
#
# --declared lets a gitlink mode-160000 move fall through the step-2 arm (the
# legitimate gitlink-bump path). This fixture ALSO adds regular-file content
# under a SEPARATE submodule path 'data' that the BRANCH ITSELF declares in
# .gitmodules — the step-3 arm must still refuse that (exit 1) even though the
# gitlink move is allowed. A gitlink is present in the diff, so the --declared
# fall-through is exercised; the refusal must come from step 3, so we assert the
# step-3-specific stderr token (not the step-2 gitlink token).
#
# Ref-read (#802): the declared 'data' path is read from the branch ref, so no
# working-tree parking is needed. (The pre-#802 fixture deinit'd + `git rm`'d the
# submodule and leaned on a base-parked working tree; under a correct ref read
# that is a legitimate de-submodule — allowed, not refused — so it was reworked.)
# ---------------------------------------------------------------------------
SUB8="$(setup_submodule_repo)"
R8="$(setup_repo)"
git -C "$R8" -c protocol.file.allow=always submodule add -q "$SUB8" sub 2>/dev/null
git -C "$R8" commit -qm "add submodule"
BASE8="$(git -C "$R8" rev-parse HEAD)"

git -C "$R8" checkout -qb task/declared-content-under-subpath 2>/dev/null
# Legit --declared move: advance the real 'sub' gitlink (mode 160000 in the diff
# -> the step-2 fall-through path is exercised under --declared).
printf 'v2\n' > "$SUB8/v2.txt"
git -C "$SUB8" add v2.txt
git -C "$SUB8" commit -qm "v2"
git -C "$R8" -c protocol.file.allow=always submodule update --remote -q sub 2>/dev/null
git -C "$R8" add sub
# Non-gitlink content under a separately-declared 'data' path (the thing step 3
# must STILL refuse under --declared). The branch commits the 'data' declaration.
git -C "$R8" config -f .gitmodules submodule.data.path data
git -C "$R8" config -f .gitmodules submodule.data.url ./nowhere
mkdir -p "$R8/data"
printf 'changed\n' > "$R8/data/extra.txt"
git -C "$R8" add .gitmodules data/extra.txt
git -C "$R8" commit -qm "bump sub gitlink + regular content under branch-declared data/"
TASK8="$(git -C "$R8" rev-parse HEAD)"

cwd8="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd8"
rc8=0
stderr8="$(mktemp 2>/dev/null || mktemp -t wartest)"
TMPFILES="$TMPFILES $stderr8"
( cd "$cwd8" && bash "$SCRIPT" "$BASE8" "$TASK8" --repo "$R8" --declared ) >"$stderr8" 2>&1 || rc8=$?

# Refuse must come from step 3 (the --declared gitlink fall-through does NOT
# bypass step 3), so assert the step-3-specific token.
if [ "$rc8" -eq 1 ] && grep -q "path under .gitmodules submodule path" "$stderr8" 2>/dev/null; then
  pass "case 8: --declared + gitlink bump + content under branch-declared path -> exit 1 (step 3 fires)"
else
  fail "case 8: --declared + content under branch-declared path -> expected exit 1 + step-3 token, got rc=$rc8"
fi

# ---------------------------------------------------------------------------
# Case 9: no flag + gitlink move -> exit 1 (Increment-1 behavior intact)
#
# Regression guard: the no-flag (default) path refuses ANY gitlink move,
# exactly as in Increment 1. This is a LOAD-BEARING regression guard —
# it proves the --declared flag is the discriminator, not a change to the
# default path (memory: weak-test-assertion-passes-without-feature-being-exercised).
# The unique failure-mode token is "submodule mutation detected" on stderr
# with exit 1, not exit 0.
# ---------------------------------------------------------------------------
SUB9="$(setup_submodule_repo)"
R9="$(setup_repo)"
git -C "$R9" -c protocol.file.allow=always submodule add -q "$SUB9" sub 2>/dev/null
git -C "$R9" commit -qm "add submodule"
BASE9="$(git -C "$R9" rev-parse HEAD)"

git -C "$R9" checkout -qb task/noflag-gitlink-bump 2>/dev/null
printf 'v2\n' > "$SUB9/v2.txt"
git -C "$SUB9" add v2.txt
git -C "$SUB9" commit -qm "v2"
git -C "$R9" -c protocol.file.allow=always submodule update --remote -q sub 2>/dev/null
git -C "$R9" add sub
git -C "$R9" commit -qm "bump gitlink (no --declared flag)"
TASK9="$(git -C "$R9" rev-parse HEAD)"
git -C "$R9" checkout -q - 2>/dev/null

cwd9="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd9"
rc9=0
stderr9="$(mktemp 2>/dev/null || mktemp -t wartest)"
TMPFILES="$TMPFILES $stderr9"
( cd "$cwd9" && bash "$SCRIPT" "$BASE9" "$TASK9" --repo "$R9" ) >"$stderr9" 2>&1 || rc9=$?

# Assert exit 1 AND the unique token in stderr — proves the no-flag path is the
# Increment-1 refuse-ALL path, not silently passing (memory: weak-test-assertion).
if [ "$rc9" -eq 1 ] && grep -q "submodule mutation detected" "$stderr9" 2>/dev/null; then
  pass "case 9: no flag + gitlink move -> exit 1 with 'submodule mutation detected' (Increment-1 regression guard)"
else
  fail "case 9: no flag + gitlink move -> expected exit 1 + 'submodule mutation detected', got rc=$rc9"
fi

# ---------------------------------------------------------------------------
# Case 10: STEP-3 ISOLATION — .gitmodules-path content touch, NO gitlink move -> exit 1
#
# Isolates the step-3 (.gitmodules-path) arm. Unlike cases 1/2/8 (where a mode
# 160000 gitlink also appears in the diff and the step-2 arm fires/falls through),
# here the raw diff carries NO mode 160000: the existing "sub" gitlink is untouched,
# and a NEW .gitmodules entry ("data") plus a plain tracked file under data/ is added.
# The branch itself commits the "data" declaration, so the step-3 arm reads it from
# the branch ref (#802) — the working-tree position is irrelevant. Only step 3 can
# refuse this -> exit 1. (Temp-break proof, plan Step 3: disabling step 3 flips this
# to allow; disabling step 2 leaves it refused — so it exercises step 3 alone.)
# ---------------------------------------------------------------------------
SUB10="$(setup_submodule_repo)"
R10="$(setup_repo)"
git -C "$R10" -c protocol.file.allow=always submodule add -q "$SUB10" sub 2>/dev/null
git -C "$R10" commit -qm "add submodule"
BASE10="$(git -C "$R10" rev-parse HEAD)"

git -C "$R10" checkout -qb task/step3-isolation 2>/dev/null
# Declare a SECOND submodule path "data" in .gitmodules (no real gitlink for it)
# and add a plain content file under data/. The "sub" gitlink is NOT moved.
git -C "$R10" config -f .gitmodules submodule.data.path data
git -C "$R10" config -f .gitmodules submodule.data.url ./nowhere
mkdir -p "$R10/data"
printf 'content\n' > "$R10/data/file.txt"
git -C "$R10" add .gitmodules data/file.txt
git -C "$R10" commit -qm "content under data/ submodule path, no gitlink move"
TASK10="$(git -C "$R10" rev-parse HEAD)"
# The branch ref carries the "data" path the step-3 arm cross-checks; the guard
# reads it from the ref, so the working-tree position is immaterial (#802).

cwd10="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd10"
rc10=0
stderr10="$(mktemp 2>/dev/null || mktemp -t wartest)"
TMPFILES="$TMPFILES $stderr10"
( cd "$cwd10" && bash "$SCRIPT" "$BASE10" "$TASK10" --repo "$R10" ) >"$stderr10" 2>&1 || rc10=$?

# Assert exit 1 AND the step-3-specific token (not the step-2 gitlink token) —
# proves the .gitmodules-path arm refused, with no mode-160000 gitlink in the diff.
if [ "$rc10" -eq 1 ] && grep -q "path under .gitmodules submodule path" "$stderr10" 2>/dev/null; then
  pass "case 10: step-3 isolation (content under .gitmodules path, no gitlink move) -> exit 1 (step 3 only)"
else
  fail "case 10: step-3 isolation -> expected exit 1 + 'path under .gitmodules submodule path', got rc=$rc10"
fi

# ---------------------------------------------------------------------------
# Case 11: STEP-2 ISOLATION — pure gitlink mode-160000 move, path NOT in .gitmodules -> exit 1
#
# Isolates the step-2 (mode 160000) arm. The submodule gitlink is bumped (mode
# 160000 in the raw diff), and .gitmodules is REMOVED in the same commit so the
# changed gitlink path "sub" matches NO declared submodule path. In default mode
# step 2 refuses before step 3 runs at all; and even if step 3 were reached, the
# branch ref has no .gitmodules (removed here), so its cat-file -e probe finds
# nothing (#802) — the working-tree position is immaterial. Only step 2 can refuse
# this -> exit 1. (Temp-break proof, plan Step 3: disabling step 2 flips this to
# allow; disabling step 3 leaves it refused — so it exercises step 2 alone.)
# ---------------------------------------------------------------------------
SUB11="$(setup_submodule_repo)"
R11="$(setup_repo)"
git -C "$R11" -c protocol.file.allow=always submodule add -q "$SUB11" sub 2>/dev/null
git -C "$R11" commit -qm "add submodule"
BASE11="$(git -C "$R11" rev-parse HEAD)"

git -C "$R11" checkout -qb task/step2-isolation 2>/dev/null
# Advance the submodule pointer (mode 160000 change in the diff).
printf 'v2\n' > "$SUB11/v2.txt"
git -C "$SUB11" add v2.txt
git -C "$SUB11" commit -qm "v2"
git -C "$R11" -c protocol.file.allow=always submodule update --remote -q sub 2>/dev/null
git -C "$R11" add sub
# Drop .gitmodules so the changed path "sub" no longer matches any submodule path.
git -C "$R11" rm -q --cached .gitmodules 2>/dev/null || true
rm -f "$R11/.gitmodules"
git -C "$R11" commit -qm "bump gitlink; drop .gitmodules entry (path unmatched by step 3)"
TASK11="$(git -C "$R11" rev-parse HEAD)"
# The branch ref has no .gitmodules (removed above), so the step-3 probe would
# find nothing even if reached; the working-tree position is immaterial (#802).

cwd11="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd11"
rc11=0
stderr11="$(mktemp 2>/dev/null || mktemp -t wartest)"
TMPFILES="$TMPFILES $stderr11"
( cd "$cwd11" && bash "$SCRIPT" "$BASE11" "$TASK11" --repo "$R11" ) >"$stderr11" 2>&1 || rc11=$?

# Assert exit 1 AND the step-2-specific token (the mode-160000 gitlink message),
# proving the gitlink arm refused independent of any .gitmodules-path match.
if [ "$rc11" -eq 1 ] && grep -q "gitlink mode 160000 in diff" "$stderr11" 2>/dev/null; then
  pass "case 11: step-2 isolation (gitlink mode 160000, path not in .gitmodules) -> exit 1 (step 2 only)"
else
  fail "case 11: step-2 isolation -> expected exit 1 + 'gitlink mode 160000 in diff', got rc=$rc11"
fi

# ---------------------------------------------------------------------------
# Case 12: --declared + pure content under a .gitmodules path, NO gitlink move
#          at all -> exit 1 (still refused via step 3)
#
# Case-8 analogue WITHOUT any gitlink move in the diff. Case 8 bumps the "sub"
# gitlink (mode 160000 present -> the step-2 --declared fall-through is exercised).
# Here the diff is PURE content: a new .gitmodules "data" path + a plain file under
# data/, and NO gitlink is moved (raw diff has no mode 160000), so step 2 never even
# finds a gitlink. Invoked WITH --declared, the guard must STILL refuse — the
# --declared allowance is only for gitlink moves, never non-gitlink content under a
# declared submodule path. This exercises the step-3 refuse under --declared with no
# step-2 material at all.
# ---------------------------------------------------------------------------
SUB12="$(setup_submodule_repo)"
R12="$(setup_repo)"
git -C "$R12" -c protocol.file.allow=always submodule add -q "$SUB12" sub 2>/dev/null
git -C "$R12" commit -qm "add submodule"
BASE12="$(git -C "$R12" rev-parse HEAD)"

git -C "$R12" checkout -qb task/declared-pure-content 2>/dev/null
git -C "$R12" config -f .gitmodules submodule.data.path data
git -C "$R12" config -f .gitmodules submodule.data.url ./nowhere
mkdir -p "$R12/data"
printf 'content\n' > "$R12/data/file.txt"
git -C "$R12" add .gitmodules data/file.txt
git -C "$R12" commit -qm "pure content under data/ (no gitlink move), declared"
TASK12="$(git -C "$R12" rev-parse HEAD)"
# The branch ref declares the "data" path; the guard reads it from the ref, so
# the working-tree position is immaterial (#802).

cwd12="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd12"
rc12=0
stderr12="$(mktemp 2>/dev/null || mktemp -t wartest)"
TMPFILES="$TMPFILES $stderr12"
( cd "$cwd12" && bash "$SCRIPT" "$BASE12" "$TASK12" --repo "$R12" --declared ) >"$stderr12" 2>&1 || rc12=$?

# Assert exit 1 AND the step-3 token: --declared did not rescue pure content under
# a submodule path, and no mode-160000 gitlink deletion was involved.
if [ "$rc12" -eq 1 ] && grep -q "path under .gitmodules submodule path" "$stderr12" 2>/dev/null; then
  pass "case 12: --declared + pure content under .gitmodules path (no gitlink deletion) -> exit 1 (still refused)"
else
  fail "case 12: --declared + pure content under .gitmodules path -> expected exit 1 + 'path under .gitmodules submodule path', got rc=$rc12"
fi

# ---------------------------------------------------------------------------
# Case 13: --declared + the BRANCH ITSELF declares a submodule path and commits
# non-gitlink content under it, while the WORKING TREE is dirtied to LACK that
# declaration -> exit 1 (the ref read keys on the branch's own .gitmodules).
#
# This is the #802 fix's headline case: a working-tree read (the pre-fix code)
# would MISS the branch-declared "data" path (the dirtied working-tree .gitmodules
# only has "sub") and WRONGLY allow; the branch-ref read sees "data" and refuses.
# Built with plumbing (commit the declaration, then dirty the working tree via
# `git config --remove-section`), not checkout gymnastics — cwd-independent.
# RED pre-change: the base-ref script exits 0 here (proven in the done-report).
# ---------------------------------------------------------------------------
SUB13="$(setup_submodule_repo)"
R13="$(setup_repo)"
git -C "$R13" -c protocol.file.allow=always submodule add -q "$SUB13" sub 2>/dev/null
git -C "$R13" commit -qm "add submodule"
BASE13="$(git -C "$R13" rev-parse HEAD)"

git -C "$R13" checkout -qb task/branch-declares-data 2>/dev/null
# The BRANCH commits a new "data" submodule declaration + regular content under it.
git -C "$R13" config -f .gitmodules submodule.data.path data
git -C "$R13" config -f .gitmodules submodule.data.url ./nowhere
mkdir -p "$R13/data"
printf 'content\n' > "$R13/data/file.txt"
git -C "$R13" add .gitmodules data/file.txt
git -C "$R13" commit -qm "branch declares data submodule + content under data/"
TASK13="$(git -C "$R13" rev-parse HEAD)"
# Dirty the working tree so it does NOT carry the branch's "data" declaration:
# strip the data section from the checked-out .gitmodules. A working-tree read
# would now miss "data" and wrongly allow; the ref read must still refuse.
git -C "$R13" config -f "$R13/.gitmodules" --remove-section submodule.data 2>/dev/null

cwd13="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd13"
rc13=0
stderr13="$(mktemp 2>/dev/null || mktemp -t wartest)"
TMPFILES="$TMPFILES $stderr13"
( cd "$cwd13" && bash "$SCRIPT" "$BASE13" "$TASK13" --repo "$R13" --declared ) >"$stderr13" 2>&1 || rc13=$?

if [ "$rc13" -eq 1 ] && grep -q "path under .gitmodules submodule path" "$stderr13" 2>/dev/null; then
  pass "case 13: branch-declared path + working tree lacks it -> exit 1 (ref read keys on branch)"
else
  fail "case 13: branch-declared path (WT diverged) -> expected exit 1 + step-3 token, got rc=$rc13"
fi

# ---------------------------------------------------------------------------
# Case 14 (inverse of 13): content under a path the WORKING TREE declares but the
# BRANCH REF does NOT -> exit 0 (a working-tree-only declaration no longer leaks
# into the ref read).
#
# The branch adds regular content under data/ but does NOT declare "data" in its
# committed .gitmodules; the working tree is then dirtied to ADD a "data"
# declaration the branch ref lacks. The pre-fix working-tree read would WRONGLY
# refuse (it sees the dirtied "data" path); the branch-ref read correctly allows,
# because the branch never declared data/ a submodule — it is just regular content.
# RED pre-change: the base-ref script exits 1 here (proven in the done-report).
# ---------------------------------------------------------------------------
SUB14="$(setup_submodule_repo)"
R14="$(setup_repo)"
git -C "$R14" -c protocol.file.allow=always submodule add -q "$SUB14" sub 2>/dev/null
git -C "$R14" commit -qm "add submodule"
BASE14="$(git -C "$R14" rev-parse HEAD)"

git -C "$R14" checkout -qb task/wt-only-data 2>/dev/null
# Branch adds content under data/ but does NOT declare "data" in .gitmodules.
mkdir -p "$R14/data"
printf 'content\n' > "$R14/data/file.txt"
git -C "$R14" add data/file.txt
git -C "$R14" commit -qm "content under data/ (branch does NOT declare data)"
TASK14="$(git -C "$R14" rev-parse HEAD)"
# Dirty the working tree to ADD a "data" declaration the BRANCH REF lacks.
git -C "$R14" config -f "$R14/.gitmodules" submodule.data.path data
git -C "$R14" config -f "$R14/.gitmodules" submodule.data.url ./nowhere

cwd14="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd14"
rc14=0
( cd "$cwd14" && bash "$SCRIPT" "$BASE14" "$TASK14" --repo "$R14" ) >/dev/null 2>&1 || rc14=$?

if [ "$rc14" -eq 0 ]; then
  pass "case 14: working-tree-only declaration does NOT leak into the ref read -> exit 0"
else
  fail "case 14: working-tree-only declaration -> expected exit 0 (ref read ignores WT), got $rc14"
fi

# ---------------------------------------------------------------------------
# Case 15: branch .gitmodules EXISTS but declares no submodule paths (empty) +
# a plain file change -> exit 0 (clean, no declared paths).
#
# `git config --blob ... --get-regexp '\.path$'` exits 1 (no match) on an empty
# or path-less .gitmodules; the ref-read Step 3 treats rc==1 as "no declared
# paths" (today's empty-result no-op), NOT a git error. This is the delete-the-
# feature guard for that branch: a naive "any non-zero git config -> die 2" would
# flip this case to exit 2 (and would wrongly refuse a branch that de-submodules
# its last submodule by emptying .gitmodules).
#
# NOTE on the exit-2 (blob-read-failure) deferred validation (spec §10.7 / plan
# backstops): after a successful `cat-file -e`, `git config --blob ... --get-regexp`
# cannot be cheaply driven to exit >1 — git normalizes EVERY read failure to exit 1
# (empty, path-less, a MALFORMED config blob that prints 'bad config line' to
# stderr, even a non-blob/tree object). So the script's `cfg_rc > 1 -> die 2` branch
# is a defensive guard with no cheap fixture; it is documented here per the plan's
# escape hatch and backstopped by /red-team's sandbox probe.
# ---------------------------------------------------------------------------
R15="$(setup_repo)"
BASE15="$(git -C "$R15" rev-parse HEAD)"
git -C "$R15" checkout -qb task/empty-gitmodules 2>/dev/null
: > "$R15/.gitmodules"
printf 'x\n' > "$R15/plain.txt"
git -C "$R15" add .gitmodules plain.txt
git -C "$R15" commit -qm "empty .gitmodules + plain file (no declared paths)"
TASK15="$(git -C "$R15" rev-parse HEAD)"

cwd15="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $cwd15"
rc15=0
( cd "$cwd15" && bash "$SCRIPT" "$BASE15" "$TASK15" --repo "$R15" ) >/dev/null 2>&1 || rc15=$?

if [ "$rc15" -eq 0 ]; then
  pass "case 15: empty branch .gitmodules (git config rc==1) -> exit 0 (clean, not die-2)"
else
  fail "case 15: empty branch .gitmodules -> expected exit 0 (rc==1 is clean), got $rc15"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\nassert-no-submodule-mutation: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
