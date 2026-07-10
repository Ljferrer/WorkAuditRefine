#!/usr/bin/env bash
# Tests for snap-shared-docs.sh — the stacked shared-doc snap helper (spec §4.5).
#
# Each case builds a fresh bare "origin" remote + a working clone with a master
# branch and a stacked branch that diverge, then runs the helper --repo <clone>
# and asserts exit code + resulting remote state.
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
# Exit 0 = all cases passed; non-zero = at least one failed.
#
# Cases:
#   1. docs-only conflict -> resolves to MASTER's copy, code untouched, push
#      fast-forwards, exit 0. (delete-and-trace: asserts the doc became master's
#      copy — proves --theirs, not --ours or a no-op — AND that origin/<branch>
#      actually advanced — proves the push ran.)
#   2. clean code change outside the pathspec -> step-2 guard REFUSES, exit 1,
#      remote UNCHANGED (isolates the byte-identity guard).
#   3. conflict on a CODE file outside the pathspec -> step-1 resolution REFUSES,
#      exit 1, remote UNCHANGED (isolates the outside-pathspec refuse arm).
#
# Cases 2 and 3 each trip a DIFFERENT refuse arm (guard vs resolution) and assert
# a distinct stderr token, so a regression in one arm alone is caught
# (memory: weak-test-assertion-passes-without-feature-being-exercised).
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/snap-shared-docs.sh"

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

gitc() { git -C "$1" "${@:2}"; }

# setup_clone: create a bare origin remote + a working clone with an initial
# master commit (docs/plans/foo.md + code.txt). Echoes "<remote> <clone>".
setup_clone() {
  REMOTE="$(mktemp -d 2>/dev/null || mktemp -d -t warsnapr)"
  CLONE="$(mktemp -d 2>/dev/null || mktemp -d -t warsnapc)"
  TMPFILES="$TMPFILES $REMOTE $CLONE"
  git init -q --bare "$REMOTE"
  git clone -q "$REMOTE" "$CLONE" 2>/dev/null
  git -C "$CLONE" config user.email war@test.local
  git -C "$CLONE" config user.name "WAR Test"
  git -C "$CLONE" config commit.gpgsign false
  mkdir -p "$CLONE/docs/plans"
  printf 'shared line\n' > "$CLONE/docs/plans/foo.md"
  printf 'code base\n' > "$CLONE/code.txt"
  git -C "$CLONE" add docs/plans/foo.md code.txt
  git -C "$CLONE" commit -qm "seed master"
  git -C "$CLONE" branch -M master
  git -C "$CLONE" push -q origin master 2>/dev/null
  printf '%s %s\n' "$REMOTE" "$CLONE"
}

# ---------------------------------------------------------------------------
# Case 1: docs-only conflict -> snap to master's copy, ff push, exit 0.
# ---------------------------------------------------------------------------
set -- $(setup_clone); REMOTE1="$1"; CLONE1="$2"

# stack branch: change the doc.
git -C "$CLONE1" checkout -q -b stack
printf 'stack version\n' > "$CLONE1/docs/plans/foo.md"
git -C "$CLONE1" commit -qam "stack: edit doc"
git -C "$CLONE1" push -q origin stack 2>/dev/null

# master: conflicting change to the same doc line.
git -C "$CLONE1" checkout -q master
printf 'master version\n' > "$CLONE1/docs/plans/foo.md"
git -C "$CLONE1" commit -qam "master: edit doc"
git -C "$CLONE1" push -q origin master 2>/dev/null
git -C "$CLONE1" fetch -q origin 2>/dev/null

before1="$(git -C "$REMOTE1" rev-parse stack)"
rc1=0
out1="$(mktemp 2>/dev/null || mktemp -t warsnap)"; TMPFILES="$TMPFILES $out1"
bash "$SCRIPT" stack --repo "$CLONE1" >"$out1" 2>&1 || rc1=$?

after1="$(git -C "$REMOTE1" rev-parse stack)"
doc1="$(git -C "$REMOTE1" show stack:docs/plans/foo.md 2>/dev/null)"
code1="$(git -C "$REMOTE1" show stack:code.txt 2>/dev/null)"

# exit 0 AND doc snapped to MASTER's copy (proves --theirs, not --ours/no-op)
# AND remote advanced (proves the push ran) AND code byte-untouched.
if [ "$rc1" -eq 0 ] \
   && [ "$doc1" = "master version" ] \
   && [ "$after1" != "$before1" ] \
   && [ "$code1" = "code base" ]; then
  pass "case 1: docs-only conflict -> master's copy, code untouched, ff push, exit 0"
else
  fail "case 1: expected exit 0 + doc='master version' + advanced + code intact; got rc=$rc1 doc='$doc1' before=$before1 after=$after1 code='$code1'"
fi

# ---------------------------------------------------------------------------
# Case 2: clean code change outside the pathspec -> step-2 guard REFUSES.
#
# master adds a new code file (no conflict, merges clean); after the merge the
# diff outside the churny-doc pathspec is non-empty -> guard refuses, exit 1,
# remote UNCHANGED.
# ---------------------------------------------------------------------------
set -- $(setup_clone); REMOTE2="$1"; CLONE2="$2"

git -C "$CLONE2" checkout -q -b stack
printf 'stack doc\n' > "$CLONE2/docs/plans/foo.md"
git -C "$CLONE2" commit -qam "stack: edit doc"
git -C "$CLONE2" push -q origin stack 2>/dev/null

git -C "$CLONE2" checkout -q master
printf 'new module\n' > "$CLONE2/newcode.txt"
git -C "$CLONE2" add newcode.txt
git -C "$CLONE2" commit -qm "master: add code file"
git -C "$CLONE2" push -q origin master 2>/dev/null
git -C "$CLONE2" fetch -q origin 2>/dev/null

before2="$(git -C "$REMOTE2" rev-parse stack)"
rc2=0
out2="$(mktemp 2>/dev/null || mktemp -t warsnap)"; TMPFILES="$TMPFILES $out2"
bash "$SCRIPT" stack --repo "$CLONE2" >"$out2" 2>&1 || rc2=$?
after2="$(git -C "$REMOTE2" rev-parse stack)"

if [ "$rc2" -eq 1 ] \
   && [ "$after2" = "$before2" ] \
   && grep -q "code changed outside churny-doc pathspec" "$out2" 2>/dev/null; then
  pass "case 2: code change outside pathspec -> step-2 guard refuse (exit 1), remote unchanged"
else
  fail "case 2: expected exit 1 + 'code changed outside churny-doc pathspec' + remote unchanged; got rc=$rc2 before=$before2 after=$after2 out='$(cat "$out2")'"
fi

# ---------------------------------------------------------------------------
# Case 3: conflict on a CODE file outside the pathspec -> step-1 REFUSES.
#
# Both branches edit code.txt on the same line -> merge conflict on a path
# outside the pathspec. The resolution loop must refuse (never blindly --theirs
# a code file), exit 1, remote UNCHANGED.
# ---------------------------------------------------------------------------
set -- $(setup_clone); REMOTE3="$1"; CLONE3="$2"

git -C "$CLONE3" checkout -q -b stack
printf 'stack code\n' > "$CLONE3/code.txt"
git -C "$CLONE3" commit -qam "stack: edit code"
git -C "$CLONE3" push -q origin stack 2>/dev/null

git -C "$CLONE3" checkout -q master
printf 'master code\n' > "$CLONE3/code.txt"
git -C "$CLONE3" commit -qam "master: edit code"
git -C "$CLONE3" push -q origin master 2>/dev/null
git -C "$CLONE3" fetch -q origin 2>/dev/null

before3="$(git -C "$REMOTE3" rev-parse stack)"
rc3=0
out3="$(mktemp 2>/dev/null || mktemp -t warsnap)"; TMPFILES="$TMPFILES $out3"
bash "$SCRIPT" stack --repo "$CLONE3" >"$out3" 2>&1 || rc3=$?
after3="$(git -C "$REMOTE3" rev-parse stack)"

if [ "$rc3" -eq 1 ] \
   && [ "$after3" = "$before3" ] \
   && grep -q "unmerged path outside churny-doc pathspec" "$out3" 2>/dev/null; then
  pass "case 3: conflict on code outside pathspec -> step-1 refuse (exit 1), remote unchanged"
else
  fail "case 3: expected exit 1 + 'unmerged path outside churny-doc pathspec' + remote unchanged; got rc=$rc3 before=$before3 after=$after3 out='$(cat "$out3")'"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\nsnap-shared-docs: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
