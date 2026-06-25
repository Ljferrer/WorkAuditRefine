#!/usr/bin/env bash
# Tests for the WAR provisioning script (skills/war/assets/provision-worktrees.sh).
#
# Plain-bash assertion runner over throwaway `mktemp -d` git repos — one fresh
# repo per case via setup_repo(). No bats, no package.json, no live Claude
# harness. Runs under macOS bash 3.2.57 (no globstar, no associative arrays,
# no ${,,}).
#
# Exit 0 (this script) = all cases passed; non-zero = at least one failed.
#
# Subcommands exercised (Task 2): ensure-integration, ensure-exclude.
# Subcommands exercised (Task 3): ensure-worktree.
# Ownership seam: the run tells the script which refs it owns via --owned-file
# <path> (a newline-delimited ledger the script reads AND appends to when it
# creates a branch) and/or repeatable --owned <ref>. Both are pure-bash
# testable. A branch that exists but is NOT recorded as ours is a foreign
# collision -> fail loud.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/provision-worktrees.sh"

fails=0
n=0

# expect <description> <expected> <actual>
expect() {
  n=$((n + 1))
  if [ "$2" = "$3" ]; then
    printf 'ok %d - %s (%s)\n' "$n" "$1" "$3"
  else
    printf 'FAIL %d - %s (expected [%s], got [%s])\n' "$n" "$1" "$2" "$3"
    fails=$((fails + 1))
  fi
}

# setup_repo -> echoes the path to a fresh git repo with one commit on the
# working branch. Deterministic identity + a quiet default branch name so the
# "working tip" is well defined regardless of the host git's init.defaultBranch.
setup_repo() {
  T="$(mktemp -d 2>/dev/null || mktemp -d -t warprov)"
  git -C "$T" init -q
  git -C "$T" config user.email war@test.local
  git -C "$T" config user.name "WAR Test"
  git -C "$T" config commit.gpgsign false
  printf 'seed\n' > "$T/seed.txt"
  git -C "$T" add -A
  git -C "$T" commit -qm "seed"
  echo "$T"
}

# A registry of repos (and standalone temp dirs) to clean up at the end.
REPOS=""
new_repo() { r="$(setup_repo)"; REPOS="$REPOS $r"; echo "$r"; }
# new_wt_path -> echoes a not-yet-existing path suitable for `git worktree add`.
# It lives under a fresh mktemp parent (registered for cleanup) and is OUTSIDE
# any repo working tree, mirroring production where worktrees live elsewhere.
new_wt_path() {
  p="$(mktemp -d 2>/dev/null || mktemp -d -t warwt)"
  REPOS="$REPOS $p"
  echo "$p/wt"   # the leaf does not exist yet; ensure-worktree creates it
}
cleanup() {
  for r in $REPOS; do
    chmod -R u+w "$r" 2>/dev/null || true
    rm -rf "$r"
  done
}
trap cleanup EXIT

# run_in <repo> <args...> -> runs the script with cwd=<repo>, swallows output,
# echoes its exit code. cd in a subshell so the parent cwd is untouched.
run_in() {
  d="$1"; shift
  ( cd "$d" && bash "$SCRIPT" "$@" ) >/dev/null 2>&1
  echo $?
}

# run_in_msg <repo> <args...> -> echoes combined stdout+stderr (for message
# assertions). Exit code discarded here.
run_in_msg() {
  d="$1"; shift
  ( cd "$d" && bash "$SCRIPT" "$@" ) 2>&1
}

# ---------------------------------------------------------------------------
# Case 1: ensure-integration <slug> 1 <working-tip> creates
# integration/<slug>/phase-1 at the working tip.
# ---------------------------------------------------------------------------
R1="$(new_repo)"
TIP1="$(git -C "$R1" rev-parse HEAD)"
OWN1="$R1/owned.txt"; : > "$OWN1"
code="$(run_in "$R1" ensure-integration myplan 1 "$TIP1" --owned-file "$OWN1")"
expect "ensure-integration exits 0 on create" 0 "$code"
expect "integration/myplan/phase-1 exists after create" \
  "0" "$(git -C "$R1" rev-parse --verify -q integration/myplan/phase-1 >/dev/null 2>&1; echo $?)"
expect "integration branch is at the working tip" \
  "$TIP1" "$(git -C "$R1" rev-parse integration/myplan/phase-1 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case 2: calling again (resume) is a no-op and does NOT move the branch, even
# after a new commit lands on the working branch. Proves "never re-cut".
# Reuses R1 (the owned-file now records the branch from case 1).
# ---------------------------------------------------------------------------
printf 'more\n' > "$R1/more.txt"
git -C "$R1" add -A
git -C "$R1" commit -qm "advance working"
NEWTIP1="$(git -C "$R1" rev-parse HEAD)"
expect "working branch actually advanced (sanity)" \
  "different" "$([ "$NEWTIP1" != "$TIP1" ] && echo different || echo same)"
code="$(run_in "$R1" ensure-integration myplan 1 "$NEWTIP1" --owned-file "$OWN1")"
expect "ensure-integration resume exits 0 (reuse)" 0 "$code"
expect "integration branch did NOT move (still original tip)" \
  "$TIP1" "$(git -C "$R1" rev-parse integration/myplan/phase-1 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case 3: ensure-exclude appends a .claude/ line to .git/info/exclude;
# calling twice does not duplicate it (exactly one match).
# ---------------------------------------------------------------------------
R3="$(new_repo)"
EXCL="$R3/.git/info/exclude"
code="$(run_in "$R3" ensure-exclude)"
expect "ensure-exclude exits 0" 0 "$code"
expect "exclude file contains a .claude/ line after first call" \
  "1" "$(grep -c '^\.claude/$' "$EXCL" 2>/dev/null || echo 0)"
run_in "$R3" ensure-exclude >/dev/null 2>&1
expect "ensure-exclude is idempotent (exactly one .claude/ match after two calls)" \
  "1" "$(grep -c '^\.claude/$' "$EXCL" 2>/dev/null || echo 0)"

# ---------------------------------------------------------------------------
# Case 4: a FOREIGN integration/<slug>/phase-1 created out-of-band (NOT
# recorded as owned) makes ensure-integration exit non-zero with a
# 'foreign branch' message. Fail-loud.
# ---------------------------------------------------------------------------
R4="$(new_repo)"
TIP4="$(git -C "$R4" rev-parse HEAD)"
OWN4="$R4/owned.txt"; : > "$OWN4"   # empty ledger: we own nothing yet
# Create the branch out-of-band (someone else / another run).
git -C "$R4" branch integration/myplan/phase-1 "$TIP4"
code="$(run_in "$R4" ensure-integration myplan 1 "$TIP4" --owned-file "$OWN4")"
expect "ensure-integration on foreign branch exits non-zero" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
msg="$(run_in_msg "$R4" ensure-integration myplan 1 "$TIP4" --owned-file "$OWN4")"
expect "foreign-branch failure mentions 'foreign'" \
  "match" "$(printf '%s' "$msg" | grep -qi 'foreign' && echo match || echo nomatch)"
# It must NOT silently adopt or move the foreign branch.
expect "foreign branch left untouched (still at its tip)" \
  "$TIP4" "$(git -C "$R4" rev-parse integration/myplan/phase-1 2>/dev/null)"

# ---------------------------------------------------------------------------
# Extra (ownership-seam robustness, not in the 4 acceptance cases but
# load-bearing): the --owned <ref> flag form lets a run declare a pre-existing
# branch as ours, so a branch present-and-owned is reused (exit 0), not failed.
# ---------------------------------------------------------------------------
R5="$(new_repo)"
TIP5="$(git -C "$R5" rev-parse HEAD)"
git -C "$R5" branch integration/myplan/phase-1 "$TIP5"   # pre-existing
code="$(run_in "$R5" ensure-integration myplan 1 "$TIP5" --owned integration/myplan/phase-1)"
expect "pre-existing branch declared via --owned is reused (exit 0)" 0 "$code"
expect "owned pre-existing branch not moved" \
  "$TIP5" "$(git -C "$R5" rev-parse integration/myplan/phase-1 2>/dev/null)"

# ===========================================================================
# Task 3: ensure-worktree <path> <branch> <integration-tip>
#
# Helper: resolve <path> to its physical (symlink-resolved) absolute form, even
# when the leaf does not exist (resolve the existing parent, reattach the leaf).
# Mirrors the script's phys(): /var vs /private/var must compare equal, AND a
# stale worktree whose dir was just deleted must still match its registry entry.
phys_path() {
  if [ -d "$1" ]; then
    ( cd "$1" && pwd -P )
  else
    p="${1%/}"; base="$(basename "$p")"; parent="$(dirname "$p")"
    if [ -d "$parent" ]; then
      printf '%s/%s\n' "$( cd "$parent" && pwd -P )" "$base"
    else
      printf '%s\n' "$1"
    fi
  fi
}

# Helper: wt_on_branch <repo> <path> -> echoes the branch the worktree at <path>
# is checked out on, per `git worktree list --porcelain`, or empty if <path> is
# not a registered worktree of <repo>. Matches by resolved (physical) path so a
# /var vs /private/var symlink on macOS — or a just-deleted stale dir — still
# resolves to the path git recorded.
wt_on_branch() {
  repo="$1"; want="$(phys_path "$2")"
  git -C "$repo" worktree list --porcelain 2>/dev/null | awk -v want="$want" '
    /^worktree /  { wt = substr($0, 10); have = 0 }
    /^branch /    { if (wt == want) { print substr($0, 8); have = 1 } }
  ' | sed 's@^refs/heads/@@'
}

# ---------------------------------------------------------------------------
# Case (T3.1) Fresh: ensure-worktree creates the worktree on <branch> at the
# integration tip; <path>/.war-task exists; git worktree list shows it on
# <branch>; the branch points at the integration tip.
# ---------------------------------------------------------------------------
RW1="$(new_repo)"
git -C "$RW1" branch integration/myplan/phase-2 HEAD    # the integration branch
TIPW1="$(git -C "$RW1" rev-parse integration/myplan/phase-2)"
WT1="$(new_wt_path)"
code="$(run_in "$RW1" ensure-worktree "$WT1" war/myplan/p2-t3 "$TIPW1")"
expect "ensure-worktree exits 0 on fresh create" 0 "$code"
expect "worktree dir exists after create" \
  "yes" "$([ -d "$WT1" ] && echo yes || echo no)"
expect ".war-task marker dropped at the worktree root" \
  "yes" "$([ -f "$WT1/.war-task" ] && echo yes || echo no)"
expect "git worktree list shows <path> on <branch>" \
  "war/myplan/p2-t3" "$(wt_on_branch "$RW1" "$WT1")"
expect "the worktree branch points at the integration tip" \
  "$TIPW1" "$(git -C "$WT1" rev-parse HEAD 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case (T3.2) Idempotent: a second call with the same args is a no-op — the
# worktree is not recreated. Proven by a sentinel written into the worktree
# surviving the second call.
# ---------------------------------------------------------------------------
printf 'sentinel-2\n' > "$WT1/SENTINEL"
code="$(run_in "$RW1" ensure-worktree "$WT1" war/myplan/p2-t3 "$TIPW1")"
expect "ensure-worktree second call (same args) exits 0" 0 "$code"
expect "idempotent: sentinel file survives the second call" \
  "sentinel-2" "$(cat "$WT1/SENTINEL" 2>/dev/null)"
expect "idempotent: still the same single worktree on <branch>" \
  "war/myplan/p2-t3" "$(wt_on_branch "$RW1" "$WT1")"

# ---------------------------------------------------------------------------
# Case (T3.3) CONSERVATIVE HEAL — preserve: a real commit lands on <branch>
# inside the worktree (un-merged work ahead of the integration tip). Calling
# ensure-worktree again must leave the worktree AND its commit completely
# untouched — the commit SHA and a sentinel both survive. Never destroy work.
# ---------------------------------------------------------------------------
printf 'work\n' > "$WT1/work.txt"
git -C "$WT1" add -A
git -C "$WT1" commit -qm "un-merged work on the task branch"
WORKSHA="$(git -C "$WT1" rev-parse HEAD)"
expect "sanity: branch advanced past the integration tip" \
  "ahead" "$([ "$WORKSHA" != "$TIPW1" ] && echo ahead || echo same)"
printf 'sentinel-3\n' > "$WT1/SENTINEL"
code="$(run_in "$RW1" ensure-worktree "$WT1" war/myplan/p2-t3 "$TIPW1")"
expect "conservative heal: ensure-worktree over un-merged work exits 0 (reuse)" 0 "$code"
expect "conservative heal: the un-merged commit SHA is UNTOUCHED" \
  "$WORKSHA" "$(git -C "$WT1" rev-parse HEAD 2>/dev/null)"
expect "conservative heal: the worktree sentinel survives" \
  "sentinel-3" "$(cat "$WT1/SENTINEL" 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case (T3.4) Heal — recreate empty: the worktree dir is deleted out-of-band,
# leaving git's registry stale (worktree still listed but its dir is gone, and
# the branch has NO un-merged commits beyond the tip). ensure-worktree must
# prune the stale registry and recreate the worktree cleanly — .war-task present
# again, listed on <branch>.
# ---------------------------------------------------------------------------
RW4="$(new_repo)"
git -C "$RW4" branch integration/myplan/phase-2 HEAD
TIPW4="$(git -C "$RW4" rev-parse integration/myplan/phase-2)"
WT4="$(new_wt_path)"
run_in "$RW4" ensure-worktree "$WT4" war/myplan/p2-t3 "$TIPW4" >/dev/null 2>&1
# Delete the worktree dir behind git's back -> stale registry entry.
rm -rf "$WT4"
expect "sanity: worktree dir is gone but registry is now stale" \
  "stale" "$([ ! -d "$WT4" ] && [ -n "$(wt_on_branch "$RW4" "$WT4")" ] && echo stale || echo notstale)"
code="$(run_in "$RW4" ensure-worktree "$WT4" war/myplan/p2-t3 "$TIPW4")"
expect "heal-recreate: ensure-worktree exits 0 after pruning stale registry" 0 "$code"
expect "heal-recreate: worktree dir exists again" \
  "yes" "$([ -d "$WT4" ] && echo yes || echo no)"
expect "heal-recreate: .war-task marker present again" \
  "yes" "$([ -f "$WT4/.war-task" ] && echo yes || echo no)"
expect "heal-recreate: listed on <branch> again" \
  "war/myplan/p2-t3" "$(wt_on_branch "$RW4" "$WT4")"

# ---------------------------------------------------------------------------
# Case (T3.5) Fail-loud: an unregistered dir already sits at <path> and it
# CONTAINS changes (it is NOT a git worktree of this repo). ensure-worktree must
# exit non-zero and must NOT delete the dir or its contents.
# ---------------------------------------------------------------------------
RW5="$(new_repo)"
git -C "$RW5" branch integration/myplan/phase-2 HEAD
TIPW5="$(git -C "$RW5" rev-parse integration/myplan/phase-2)"
WT5="$(new_wt_path)"
mkdir -p "$WT5"
printf 'precious unmanaged data\n' > "$WT5/PRECIOUS"   # not a worktree, has content
code="$(run_in "$RW5" ensure-worktree "$WT5" war/myplan/p2-t3 "$TIPW5")"
expect "fail-loud: unregistered non-empty dir makes ensure-worktree exit non-zero" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
expect "fail-loud: the unmanaged dir is NOT deleted" \
  "yes" "$([ -d "$WT5" ] && echo yes || echo no)"
expect "fail-loud: the unmanaged dir's contents are preserved" \
  "precious unmanaged data" "$(cat "$WT5/PRECIOUS" 2>/dev/null)"

# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "provision-worktrees.test.sh: PASS"
