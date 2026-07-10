#!/usr/bin/env bash
# Tests for assert-no-repo-escape.sh — /red-team post-run sandbox-escape guard.
#
# Each case runs from a fresh mktemp cwd (memory relative-path-test-needs-clean-cwd)
# against a fresh temp git repo. macOS bash 3.2.57 compatible.
#
# Exit 0 = all cases passed; non-zero = at least one failed.
#
# Cases:
#   1.  clean repo (no origin) -> exit 0
#   2.  stray working-tree file (porcelain non-empty) -> exit 1
#   3a. junk LOCAL ref matching refs/heads/redteam-* -> exit 1
#   3b. junk LOCAL ref matching *-sandbox-* -> exit 1
#   4.  junk ref on a STUBBED origin remote (no local junk ref) -> exit 1
#   5.  non-repo / git error -> exit 2 (asserted != 1 — the boundary never collapses)
#   6.  .. traversal in --repo -> exit 2 (guard rule)
#   7.  CONTROL: benign local ref name, clean tree, no origin -> exit 0
#       (delete-and-trace: proves the junk pattern is specific, not match-all —
#        widening it to '*' flips this to 1)
#   8.  CONTROL: origin with only a benign head -> exit 0
#       (delete-and-trace: proves the remote arm is pattern-specific, not
#        "any remote ref = escape")
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/assert-no-repo-escape.sh"

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

# setup_repo: fresh git repo with one commit; echo its path.
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

# fresh_cwd: a clean mktemp dir to run the guard from (cwd-independence).
fresh_cwd() {
  C="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
  TMPFILES="$TMPFILES $C"
  printf '%s\n' "$C"
}

# run_guard <repo>: run the guard from a clean cwd; echo the exit code.
run_guard() {
  _cwd="$(fresh_cwd)"
  _rc=0
  ( cd "$_cwd" && bash "$SCRIPT" --repo "$1" ) >/dev/null 2>&1 || _rc=$?
  printf '%s\n' "$_rc"
}

# ---------------------------------------------------------------------------
# Case 1: clean repo (no origin) -> exit 0
# ---------------------------------------------------------------------------
R1="$(setup_repo)"
rc1="$(run_guard "$R1")"
if [ "$rc1" -eq 0 ]; then
  pass "case 1: clean repo -> exit 0"
else
  fail "case 1: clean repo -> expected exit 0, got $rc1"
fi

# ---------------------------------------------------------------------------
# Case 2: stray working-tree file (porcelain non-empty) -> exit 1
# ---------------------------------------------------------------------------
R2="$(setup_repo)"
printf 'leaked\n' > "$R2/stray-sandbox-artifact.txt"   # untracked stray file
rc2="$(run_guard "$R2")"
if [ "$rc2" -eq 1 ]; then
  pass "case 2: stray working-tree file -> exit 1"
else
  fail "case 2: stray working-tree file -> expected exit 1, got $rc2"
fi

# ---------------------------------------------------------------------------
# Case 3a: junk LOCAL ref matching refs/heads/redteam-* -> exit 1
# Create the branch WITHOUT checkout so the working tree stays clean — this
# isolates the local-ref arm from the porcelain arm.
# ---------------------------------------------------------------------------
R3A="$(setup_repo)"
git -C "$R3A" branch redteam-probe-123 2>/dev/null
rc3a="$(run_guard "$R3A")"
if [ "$rc3a" -eq 1 ]; then
  pass "case 3a: junk local ref (redteam-*) -> exit 1"
else
  fail "case 3a: junk local ref (redteam-*) -> expected exit 1, got $rc3a"
fi

# ---------------------------------------------------------------------------
# Case 3b: junk LOCAL ref matching *-sandbox-* -> exit 1
# ---------------------------------------------------------------------------
R3B="$(setup_repo)"
git -C "$R3B" branch probe-sandbox-9 2>/dev/null
rc3b="$(run_guard "$R3B")"
if [ "$rc3b" -eq 1 ]; then
  pass "case 3b: junk local ref (*-sandbox-*) -> exit 1"
else
  fail "case 3b: junk local ref (*-sandbox-*) -> expected exit 1, got $rc3b"
fi

# ---------------------------------------------------------------------------
# Case 4: junk ref on a STUBBED origin remote -> exit 1
# Push a junk branch to a stubbed origin, then DELETE the local junk branch so
# only the remote carries it — isolates the remote (b2 ls-remote) arm from the
# local (b1 for-each-ref) arm. Working tree stays clean, so the porcelain arm is
# inert too. NOTE: `git push` also writes the remote-tracking ref
# refs/remotes/origin/redteam-sandbox-leak, which b1's unpatterned for-each-ref
# enumerates; `branch -D` only removes refs/heads/*, so we must also drop the
# remote-tracking ref or b1 would fire first and b2 would get zero coverage.
# ---------------------------------------------------------------------------
R4="$(setup_repo)"
ORIGIN4="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $ORIGIN4"
git -C "$ORIGIN4" init -q --bare
git -C "$R4" remote add origin "$ORIGIN4"
git -C "$R4" branch redteam-sandbox-leak 2>/dev/null
git -C "$R4" push -q origin redteam-sandbox-leak 2>/dev/null
git -C "$R4" branch -D redteam-sandbox-leak >/dev/null 2>&1   # drop LOCAL heads/ copy
git -C "$R4" update-ref -d refs/remotes/origin/redteam-sandbox-leak >/dev/null 2>&1  # drop remote-tracking copy so ONLY b2 can fire
rc4="$(run_guard "$R4")"
if [ "$rc4" -eq 1 ]; then
  pass "case 4: junk ref on stubbed origin (local copy dropped) -> exit 1"
else
  fail "case 4: junk ref on stubbed origin -> expected exit 1, got $rc4"
fi

# ---------------------------------------------------------------------------
# Case 5: non-repo / git error -> exit 2 (asserted != 1 — boundary never collapses)
# ---------------------------------------------------------------------------
NOTREPO="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $NOTREPO"
rc5="$(run_guard "$NOTREPO")"
if [ "$rc5" -eq 2 ]; then
  pass "case 5: non-repo -> exit 2 (not 1 — correctness boundary)"
else
  fail "case 5: non-repo -> expected exit 2, got $rc5 (2-vs-1 boundary violated)"
fi

# ---------------------------------------------------------------------------
# Case 6: .. traversal in --repo -> exit 2 (guard rule)
# ---------------------------------------------------------------------------
_cwd6="$(fresh_cwd)"
rc6=0
( cd "$_cwd6" && bash "$SCRIPT" --repo "../evil" ) >/dev/null 2>&1 || rc6=$?
if [ "$rc6" -eq 2 ]; then
  pass "case 6: .. traversal in --repo -> exit 2"
else
  fail "case 6: .. traversal in --repo -> expected exit 2, got $rc6"
fi

# ---------------------------------------------------------------------------
# Case 7: CONTROL — benign local ref, clean tree, no origin -> exit 0
# Delete-and-trace: proves the junk pattern is specific. Widen the case globs in
# the script to '*' and this flips to 1.
# ---------------------------------------------------------------------------
R7="$(setup_repo)"
git -C "$R7" branch feature-normal-work 2>/dev/null
rc7="$(run_guard "$R7")"
if [ "$rc7" -eq 0 ]; then
  pass "case 7: CONTROL benign local ref -> exit 0 (pattern is specific)"
else
  fail "case 7: CONTROL benign local ref -> expected exit 0, got $rc7"
fi

# ---------------------------------------------------------------------------
# Case 8: CONTROL — origin with only a benign head -> exit 0
# Delete-and-trace: proves the remote arm is pattern-specific, not "any remote
# ref = escape". Drop the pattern guard on the remote arm and this flips to 1.
# ---------------------------------------------------------------------------
R8="$(setup_repo)"
ORIGIN8="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $ORIGIN8"
git -C "$ORIGIN8" init -q --bare
git -C "$R8" remote add origin "$ORIGIN8"
# Push the current (benign) branch to origin.
_cur8="$(git -C "$R8" rev-parse --abbrev-ref HEAD)"
git -C "$R8" push -q origin "$_cur8" 2>/dev/null
rc8="$(run_guard "$R8")"
if [ "$rc8" -eq 0 ]; then
  pass "case 8: CONTROL benign origin head -> exit 0 (remote arm is specific)"
else
  fail "case 8: CONTROL benign origin head -> expected exit 0, got $rc8"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\nassert-no-repo-escape: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
