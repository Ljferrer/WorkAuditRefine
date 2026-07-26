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
# Case (T3.6) BRANCH-MISMATCH REUSE: a registered worktree exists at <path> on
# branch A, then ensure-worktree is called for the SAME path with a DIFFERENT
# branch B (a phase-1 path reused for a phase-2 task without teardown-task first,
# B never created — observed live in followup444-r1). It must FAIL LOUD (never
# reset a checkout that may carry un-merged commits) and MUST NOT rewrite the
# .war-task marker to claim branch B the checkout is not on.
# ---------------------------------------------------------------------------
RW6="$(new_repo)"
git -C "$RW6" branch integration/myplan/phase-2 HEAD
TIPW6="$(git -C "$RW6" rev-parse integration/myplan/phase-2)"
WT6="$(new_wt_path)"
run_in "$RW6" ensure-worktree "$WT6" war/myplan/p1-task1 "$TIPW6" >/dev/null 2>&1
expect "T3.6 setup: worktree present on branch A (p1-task1)" \
  "war/myplan/p1-task1" "$(wt_on_branch "$RW6" "$WT6")"
# Ask for the same path on a DIFFERENT branch B (p2-task1) that does not exist.
code="$(run_in "$RW6" ensure-worktree "$WT6" war/myplan/p2-task1 "$TIPW6")"
expect "branch-mismatch reuse fails loud (exit non-zero)" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
msg="$(run_in_msg "$RW6" ensure-worktree "$WT6" war/myplan/p2-task1 "$TIPW6")"
expect "branch-mismatch refusal names the requested branch" \
  "match" "$(printf '%s' "$msg" | grep -q 'p2-task1' && echo match || echo nomatch)"
expect "branch-mismatch: checkout still on branch A (never reset)" \
  "war/myplan/p1-task1" "$(wt_on_branch "$RW6" "$WT6")"
# The crux: the marker must NEVER claim branch B the checkout is not on.
expect "branch-mismatch: .war-task marker does NOT claim branch B" \
  "no" "$(grep -qx 'branch=war/myplan/p2-task1' "$WT6/.war-task" 2>/dev/null && echo yes || echo no)"
expect "branch-mismatch: .war-task marker still names branch A" \
  "yes" "$(grep -qx 'branch=war/myplan/p1-task1' "$WT6/.war-task" 2>/dev/null && echo yes || echo no)"

# ===========================================================================
# Task 4: teardown-task / teardown-phase / prune  (all strictly RUN-SCOPED).
#
# Run-scoping (D6/D9): task worktrees live under the run's ledger dir,
# <repo-root>/.claude/teams/<run-id>/worktrees/<task-id>. The run tells the
# script its ledger dir via --run-dir PATH (mirrors the --owned-file seam of
# Task 2). teardown-task / teardown-phase REFUSE to remove anything whose
# worktree path is not inside that run-dir, so a sibling worktree belonging to a
# DIFFERENT run-id (possibly paused on an escalation) is never touched. `prune`
# only clears THIS repo's stale registry — a worktree registered to a different
# repo (a different run) lives in a different .git and is never pruned.
#
# Helpers:
#   branch_exists_in <repo> <ref> -> "yes"/"no"
# run-dir layout used by these cases mirrors production:
#   <repo>/.claude/teams/<run-id>/worktrees/<task-id>
# ---------------------------------------------------------------------------
branch_exists_in() {
  if git -C "$1" show-ref --verify --quiet "refs/heads/$2"; then echo yes; else echo no; fi
}

# mk_run_dir <repo> <run-id> -> echoes <repo>/.claude/teams/<run-id> (created).
mk_run_dir() {
  rd="$1/.claude/teams/$2"
  mkdir -p "$rd/worktrees"
  echo "$rd"
}

# ---------------------------------------------------------------------------
# Case (T4.1) teardown-task <path> <branch> removes the worktree AND deletes the
# (merged) branch -> both gone from `git worktree list` and `git branch`.
# The branch is merged into the integration tip (no un-merged work), the normal
# task-land case.
# ---------------------------------------------------------------------------
RT1="$(new_repo)"
git -C "$RT1" branch integration/myplan/phase-2 HEAD
TIPT1="$(git -C "$RT1" rev-parse integration/myplan/phase-2)"
RD1="$(mk_run_dir "$RT1" run-aaa)"
WTT1="$RD1/worktrees/task1"
run_in "$RT1" ensure-worktree "$WTT1" war/myplan/p2-t1 "$TIPT1" >/dev/null 2>&1
OWN_T41="$RD1/owned.txt"
printf 'war/myplan/p2-t1\n' > "$OWN_T41"
expect "T4.1 setup: worktree present before teardown" \
  "war/myplan/p2-t1" "$(wt_on_branch "$RT1" "$WTT1")"
expect "T4.1 setup: branch exists before teardown" \
  "yes" "$(branch_exists_in "$RT1" war/myplan/p2-t1)"
code="$(run_in "$RT1" teardown-task --owned-file "$OWN_T41" --run-dir "$RD1" "$WTT1" war/myplan/p2-t1)"
expect "teardown-task exits 0" 0 "$code"
expect "teardown-task: worktree gone from git worktree list" \
  "" "$(wt_on_branch "$RT1" "$WTT1")"
expect "teardown-task: worktree dir removed" \
  "no" "$([ -d "$WTT1" ] && echo yes || echo no)"
expect "teardown-task: merged branch deleted from git branch" \
  "no" "$(branch_exists_in "$RT1" war/myplan/p2-t1)"

# ---------------------------------------------------------------------------
# Case (T4.2) teardown-phase <slug> <N> removes the integration branch AND any
# remaining phase worktrees -> all gone.
# ---------------------------------------------------------------------------
RT2="$(new_repo)"
git -C "$RT2" branch integration/myplan/phase-2 HEAD
TIPT2="$(git -C "$RT2" rev-parse integration/myplan/phase-2)"
RD2="$(mk_run_dir "$RT2" run-bbb)"
WTA="$RD2/worktrees/taskA"
WTB="$RD2/worktrees/taskB"
run_in "$RT2" ensure-worktree "$WTA" war/myplan/p2-tA "$TIPT2" >/dev/null 2>&1
run_in "$RT2" ensure-worktree "$WTB" war/myplan/p2-tB "$TIPT2" >/dev/null 2>&1
OWN_T42="$RD2/owned.txt"
printf 'integration/myplan/phase-2\n' > "$OWN_T42"
expect "T4.2 setup: integration branch exists before teardown" \
  "yes" "$(branch_exists_in "$RT2" integration/myplan/phase-2)"
expect "T4.2 setup: phase worktree A present before teardown" \
  "war/myplan/p2-tA" "$(wt_on_branch "$RT2" "$WTA")"
code="$(run_in "$RT2" teardown-phase --owned-file "$OWN_T42" --run-dir "$RD2" myplan 2)"
expect "teardown-phase exits 0" 0 "$code"
expect "teardown-phase: integration branch gone" \
  "no" "$(branch_exists_in "$RT2" integration/myplan/phase-2)"
expect "teardown-phase: remaining phase worktree A gone from list" \
  "" "$(wt_on_branch "$RT2" "$WTA")"
expect "teardown-phase: remaining phase worktree B gone from list" \
  "" "$(wt_on_branch "$RT2" "$WTB")"
expect "teardown-phase: phase worktree A dir removed" \
  "no" "$([ -d "$WTA" ] && echo yes || echo no)"

# ---------------------------------------------------------------------------
# Case (T4.3) KEEP-ON-ESCALATION: teardown-task --keep <path> <branch> leaves
# the worktree AND the branch completely intact (for inspection). Nothing is
# removed or deleted.
# ---------------------------------------------------------------------------
RT3="$(new_repo)"
git -C "$RT3" branch integration/myplan/phase-2 HEAD
TIPT3="$(git -C "$RT3" rev-parse integration/myplan/phase-2)"
RD3="$(mk_run_dir "$RT3" run-ccc)"
WTT3="$RD3/worktrees/task1"
run_in "$RT3" ensure-worktree "$WTT3" war/myplan/p2-t1 "$TIPT3" >/dev/null 2>&1
printf 'inspect-me\n' > "$WTT3/SENTINEL"
code="$(run_in "$RT3" teardown-task --keep --run-dir "$RD3" "$WTT3" war/myplan/p2-t1)"
expect "teardown-task --keep exits 0" 0 "$code"
expect "keep-on-escalation: worktree still present on its branch" \
  "war/myplan/p2-t1" "$(wt_on_branch "$RT3" "$WTT3")"
expect "keep-on-escalation: worktree dir intact" \
  "yes" "$([ -d "$WTT3" ] && echo yes || echo no)"
expect "keep-on-escalation: worktree contents intact" \
  "inspect-me" "$(cat "$WTT3/SENTINEL" 2>/dev/null)"
expect "keep-on-escalation: branch NOT deleted" \
  "yes" "$(branch_exists_in "$RT3" war/myplan/p2-t1)"

# ---------------------------------------------------------------------------
# Case (T4.4a) prune runs `git worktree prune` scoped to THIS repo's stale
# registry; a sibling worktree under a DIFFERENT run-id (a separate repo, a
# separate run) is NEVER touched -> assert the unrelated run dir survives.
# ---------------------------------------------------------------------------
RT4="$(new_repo)"
RD4="$(mk_run_dir "$RT4" run-ddd)"
WTT4="$RD4/worktrees/task1"
run_in "$RT4" ensure-worktree "$WTT4" war/myplan/p2-t1 "$(git -C "$RT4" rev-parse HEAD)" >/dev/null 2>&1
# Make THIS repo's registry stale: delete the worktree dir behind git's back.
rm -rf "$WTT4"
# An UNRELATED run: a different repo, its own run-id dir, its own live worktree.
OTHER_REPO="$(new_repo)"
OTHER_RD="$(mk_run_dir "$OTHER_REPO" run-zzz)"
OTHER_WT="$OTHER_RD/worktrees/task1"
run_in "$OTHER_REPO" ensure-worktree "$OTHER_WT" war/other/p1-t1 "$(git -C "$OTHER_REPO" rev-parse HEAD)" >/dev/null 2>&1
expect "T4.4a setup: unrelated run worktree exists before prune" \
  "yes" "$([ -d "$OTHER_WT" ] && echo yes || echo no)"
code="$(run_in "$RT4" prune)"
expect "prune exits 0" 0 "$code"
expect "prune: this repo's stale registry entry is cleared" \
  "" "$(wt_on_branch "$RT4" "$WTT4")"
# The crux: prune in RT4 must NOT touch the unrelated run under a different repo.
expect "prune: unrelated run dir under a DIFFERENT run-id survives" \
  "yes" "$([ -d "$OTHER_WT" ] && echo yes || echo no)"
expect "prune: unrelated run worktree still registered to its own repo" \
  "war/other/p1-t1" "$(wt_on_branch "$OTHER_REPO" "$OTHER_WT")"

# ---------------------------------------------------------------------------
# Case (T4.4b) teardown REFUSES to operate on a path OUTSIDE the current run-id
# dir. A sibling worktree that belongs to a different run-id (it may be paused on
# an escalation) must be left completely intact, and teardown-task must fail loud.
# ---------------------------------------------------------------------------
RT5="$(new_repo)"
git -C "$RT5" branch integration/myplan/phase-2 HEAD
TIPT5="$(git -C "$RT5" rev-parse integration/myplan/phase-2)"
RD5_MINE="$(mk_run_dir "$RT5" run-mine)"      # the current run
RD5_OTHER="$(mk_run_dir "$RT5" run-other)"    # a DIFFERENT run-id, same repo
WT_OTHER="$RD5_OTHER/worktrees/task1"
run_in "$RT5" ensure-worktree "$WT_OTHER" war/other/p2-t1 "$TIPT5" >/dev/null 2>&1
# Ask the CURRENT run (run-mine) to tear down the OTHER run's worktree path.
code="$(run_in "$RT5" teardown-task --run-dir "$RD5_MINE" "$WT_OTHER" war/other/p2-t1)"
expect "teardown-task refuses a path outside the run-dir (exit non-zero)" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
msg="$(run_in_msg "$RT5" teardown-task --run-dir "$RD5_MINE" "$WT_OTHER" war/other/p2-t1)"
expect "out-of-run refusal mentions run scope" \
  "match" "$(printf '%s' "$msg" | grep -qiE 'run-?dir|run.?scope|outside|run-id' && echo match || echo nomatch)"
expect "out-of-run refusal: the other run's worktree is left intact" \
  "war/other/p2-t1" "$(wt_on_branch "$RT5" "$WT_OTHER")"
expect "out-of-run refusal: the other run's branch is NOT deleted" \
  "yes" "$(branch_exists_in "$RT5" war/other/p2-t1)"
# teardown-phase must be just as run-scoped: it must never reach into the other
# run's worktree even while removing the integration branch is in principle global.
# Here run-mine has no phase-2 worktrees of its own, and the other run's worktree
# is out-of-scope, so teardown-phase must leave WT_OTHER untouched.
code="$(run_in "$RT5" teardown-phase --run-dir "$RD5_MINE" myplan 2)"
expect "teardown-phase (run-mine) does not touch the other run's worktree" \
  "war/other/p2-t1" "$(wt_on_branch "$RT5" "$WT_OTHER")"

# ===========================================================================
# Task 1 (clandiso): ensure-refinery-worktree <path> <integration-branch>
#
# Behavior (ensure + re-attach, distinct from ensure-worktree's pure no-op reuse):
#   (a) Not registered / empty dir -> `git worktree add <path> <integration-branch>` + .war-task
#   (b) Registered + present + HEAD on the integration branch -> reuse untouched (marker only)
#   (c) Registered + present + HEAD detached or on a different branch AND tree CLEAN ->
#         `git -C <path> switch <integration-branch>` (re-attach), then reuse
#   (d) Registered + present + HEAD detached/different + tree DIRTY -> FAIL LOUD (never reset)
#   (e) Stale registry (dir gone) -> prune + recreate on the integration branch
#   (f) Non-empty unregistered dir -> fail loud (D7 discipline)
#
# Helper: wt_head_branch <repo> <path> -> "(detached)" if HEAD is detached,
# branch short-name if on a branch, or "" if not a registered worktree at all.
wt_head_branch() {
  repo="$1"; want="$(phys_path "$2")"
  git -C "$repo" worktree list --porcelain 2>/dev/null | awk -v want="$want" '
    /^worktree / { cur = substr($0, 10); branch = ""; is_detached = 0 }
    /^branch /   { if (cur == want) branch = substr($0, 8) }
    /^detached$/ { if (cur == want) is_detached = 1 }
    /^$/ {
      if (cur == want) {
        if (is_detached) print "(detached)"
        else if (branch != "") print branch
      }
      cur = ""; branch = ""; is_detached = 0
    }
  ' | sed 's@^refs/heads/@@'
}

# ---------------------------------------------------------------------------
# Case (T1.1) Fresh create: ensure-refinery-worktree creates the worktree on
# the integration branch; .war-task marker is dropped; git worktree list shows
# the worktree on the integration branch.
# ---------------------------------------------------------------------------
RR1="$(new_repo)"
git -C "$RR1" branch integration/myplan/phase-1 HEAD
TIPRI1="$(git -C "$RR1" rev-parse integration/myplan/phase-1)"
WTR1="$(new_wt_path)"
code="$(run_in "$RR1" ensure-refinery-worktree "$WTR1" integration/myplan/phase-1)"
expect "ensure-refinery-worktree exits 0 on fresh create" 0 "$code"
expect "refinery worktree dir exists after create" \
  "yes" "$([ -d "$WTR1" ] && echo yes || echo no)"
expect "refinery .war-task marker dropped" \
  "yes" "$([ -f "$WTR1/.war-task" ] && echo yes || echo no)"
expect "refinery worktree listed on integration branch" \
  "integration/myplan/phase-1" "$(wt_on_branch "$RR1" "$WTR1")"
expect "refinery worktree HEAD at integration tip" \
  "$TIPRI1" "$(git -C "$WTR1" rev-parse HEAD 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case (T1.2) Reuse when already on the integration branch: a second call is a
# no-op — worktree is already registered and HEAD is on the integration branch.
# A sentinel file in the worktree survives (nothing is reset or recreated).
# ---------------------------------------------------------------------------
printf 'sentinel-r2\n' > "$WTR1/SENTINEL"
code="$(run_in "$RR1" ensure-refinery-worktree "$WTR1" integration/myplan/phase-1)"
expect "ensure-refinery-worktree reuse-on-integration exits 0" 0 "$code"
expect "reuse-on-integration: sentinel file survives (no recreation)" \
  "sentinel-r2" "$(cat "$WTR1/SENTINEL" 2>/dev/null)"
expect "reuse-on-integration: still on integration branch" \
  "integration/myplan/phase-1" "$(wt_on_branch "$RR1" "$WTR1")"

# ---------------------------------------------------------------------------
# Case (T1.3) Re-attach when detached and clean: simulate a crash-mid-land
# state by detaching HEAD inside the refinery worktree. The tree is CLEAN
# (no tracked-file modifications). ensure-refinery-worktree must switch back
# to the integration branch (re-attach).
# ---------------------------------------------------------------------------
RR3="$(new_repo)"
git -C "$RR3" branch integration/myplan/phase-1 HEAD
WTR3="$(new_wt_path)"
run_in "$RR3" ensure-refinery-worktree "$WTR3" integration/myplan/phase-1 >/dev/null 2>&1
# Detach HEAD inside the refinery worktree (clean tree).
git -C "$WTR3" checkout --detach HEAD >/dev/null 2>&1
# Confirm it is detached.
expect "T1.3 setup: refinery worktree is now detached" \
  "(detached)" "$(wt_head_branch "$RR3" "$WTR3")"
code="$(run_in "$RR3" ensure-refinery-worktree "$WTR3" integration/myplan/phase-1)"
expect "ensure-refinery-worktree re-attaches from detached+clean (exits 0)" 0 "$code"
expect "re-attach: worktree is now on integration branch" \
  "integration/myplan/phase-1" "$(wt_on_branch "$RR3" "$WTR3")"

# ---------------------------------------------------------------------------
# Case (T1.4) Detached AND dirty -> FAIL LOUD, never reset.
# Detach the worktree and modify a TRACKED file. The dirty check uses -uno so
# only tracked-file modifications trigger the guard (untracked files like
# .war-task are safe). ensure-refinery-worktree must exit non-zero and leave
# the worktree and its dirty modification untouched.
# ---------------------------------------------------------------------------
RR4="$(new_repo)"
git -C "$RR4" branch integration/myplan/phase-1 HEAD
WTR4="$(new_wt_path)"
run_in "$RR4" ensure-refinery-worktree "$WTR4" integration/myplan/phase-1 >/dev/null 2>&1
# Detach HEAD and modify a TRACKED file (seed.txt was committed in setup_repo).
git -C "$WTR4" checkout --detach HEAD >/dev/null 2>&1
printf 'dirty-change\n' >> "$WTR4/seed.txt"
# Confirm dirty (tracked-file modification).
expect "T1.4 setup: refinery worktree is detached" \
  "(detached)" "$(wt_head_branch "$RR4" "$WTR4")"
expect "T1.4 setup: worktree is dirty (tracked-file modification)" \
  "dirty" "$([ -n "$(git -C "$WTR4" status --porcelain -uno 2>/dev/null)" ] && echo dirty || echo clean)"
code="$(run_in "$RR4" ensure-refinery-worktree "$WTR4" integration/myplan/phase-1)"
expect "ensure-refinery-worktree detached+dirty fails loud (exits non-zero)" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
expect "detached+dirty: worktree tree still dirty (modification not lost)" \
  "dirty" "$([ -n "$(git -C "$WTR4" status --porcelain -uno 2>/dev/null)" ] && echo dirty || echo clean)"
expect "detached+dirty: worktree dir intact" \
  "yes" "$([ -d "$WTR4" ] && echo yes || echo no)"

# ---------------------------------------------------------------------------
# Case (T1.5) Stale registry (dir gone) -> prune + recreate on the integration
# branch. The new worktree is on the integration branch with a .war-task marker.
# ---------------------------------------------------------------------------
RR5="$(new_repo)"
git -C "$RR5" branch integration/myplan/phase-1 HEAD
TIPRI5="$(git -C "$RR5" rev-parse integration/myplan/phase-1)"
WTR5="$(new_wt_path)"
run_in "$RR5" ensure-refinery-worktree "$WTR5" integration/myplan/phase-1 >/dev/null 2>&1
# Delete the worktree dir behind git's back -> stale registry entry.
rm -rf "$WTR5"
expect "T1.5 setup: dir is gone but registry stale" \
  "stale" "$([ ! -d "$WTR5" ] && [ -n "$(wt_on_branch "$RR5" "$WTR5")" ] && echo stale || echo notstale)"
code="$(run_in "$RR5" ensure-refinery-worktree "$WTR5" integration/myplan/phase-1)"
expect "ensure-refinery-worktree stale-registry exits 0 after recreate" 0 "$code"
expect "stale-registry: worktree dir recreated" \
  "yes" "$([ -d "$WTR5" ] && echo yes || echo no)"
expect "stale-registry: .war-task marker present" \
  "yes" "$([ -f "$WTR5/.war-task" ] && echo yes || echo no)"
expect "stale-registry: worktree on integration branch" \
  "integration/myplan/phase-1" "$(wt_on_branch "$RR5" "$WTR5")"

# ---------------------------------------------------------------------------
# Case (T1.6) Non-empty unregistered dir -> fail loud (D7 discipline).
# An existing dir with content that is NOT a registered worktree must be refused.
# ---------------------------------------------------------------------------
RR6="$(new_repo)"
git -C "$RR6" branch integration/myplan/phase-1 HEAD
WTR6="$(new_wt_path)"
mkdir -p "$WTR6"
printf 'precious refinery data\n' > "$WTR6/PRECIOUS"
code="$(run_in "$RR6" ensure-refinery-worktree "$WTR6" integration/myplan/phase-1)"
expect "ensure-refinery-worktree non-empty unregistered dir fails loud (exits non-zero)" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
expect "non-empty unregistered dir: precious file NOT deleted" \
  "yes" "$([ -f "$WTR6/PRECIOUS" ] && echo yes || echo no)"

# ===========================================================================
# Task 2 (clandiso): land-advance <working-ref> <new-sha>
#
# Push-first cross-run CAS. The caller has already produced <new-sha> (the
# --no-ff merge of integration into a detached refinery worktree at
# origin/<working>). Steps:
#   0b. Wrong-HEAD precheck (§4.4), AFTER the land-truth guard's early-return
#      arms and before the push: HEAD must resolve to <new-sha>, else die
#      EX_WRONG_BRANCH (6) — never the reland code.
#   1. git push origin HEAD:refs/heads/<working>  — named source, no --force;
#      HEAD in the detached _refinery IS <new-sha>.
#   2. Classify on the [rejected] token (always emitted on non-ff rejection):
#        [rejected] present -> exit RELAND code (2)
#        clean exit 0      -> success (continue to step 3)
#        other non-zero    -> exit ESCALATE code (3)
#   3. ONLY on push success: git update-ref refs/heads/<working> <new-sha> <pre-push-local-tip>
#
# Exit codes:
#   0  -> push accepted; local follower advanced
#   2  -> push rejected ([rejected] token seen); local ref UNCHANGED
#   3  -> unrelated push error (not a non-ff rejection); escalate
#   6  -> EX_WRONG_BRANCH: invoked from a worktree whose HEAD is not <new-sha>;
#         no push attempted, all refs untouched (never 2 — #986)
#
# Test harness uses a bare origin + two clones to simulate cross-run races
# deterministically (same method as spec §12):
#   setup_origin_pair <slug> -> creates origin.git + clone1 + clone2;
#     echoes "clone1_path clone2_path origin_path" space-separated.
# ---------------------------------------------------------------------------

# setup_origin_pair -> bare origin + two working clones; both clones track origin.
# Echoes "clone1 clone2 origin" space-separated.
setup_origin_pair() {
  ORIG="$(mktemp -d 2>/dev/null || mktemp -d -t warorg)"
  REPOS="$REPOS $ORIG"
  git init --bare -q "$ORIG/origin.git"
  # Clone 1 (the "refinery" that will call land-advance).
  C1="$(mktemp -d 2>/dev/null || mktemp -d -t warc1)"
  REPOS="$REPOS $C1"
  git clone -q "$ORIG/origin.git" "$C1/clone1" 2>/dev/null
  git -C "$C1/clone1" config user.email war@test.local
  git -C "$C1/clone1" config user.name "WAR Test"
  git -C "$C1/clone1" config commit.gpgsign false
  # Clone 2 (the "out-of-band advancer").
  C2="$(mktemp -d 2>/dev/null || mktemp -d -t warc2)"
  REPOS="$REPOS $C2"
  git clone -q "$ORIG/origin.git" "$C2/clone2" 2>/dev/null
  git -C "$C2/clone2" config user.email war@test.local
  git -C "$C2/clone2" config user.name "WAR Test"
  git -C "$C2/clone2" config commit.gpgsign false
  echo "$C1/clone1 $C2/clone2 $ORIG/origin.git"
}

# run_in_detached <repo-path> <new-sha> <args...> -> run the script from within
# a detached HEAD at <new-sha> (simulating the refinery's detached state after
# `--no-ff` merge). Echoes exit code.
run_in_detached() {
  repo="$1"; sha="$2"; shift 2
  ( cd "$repo" && git checkout --detach "$sha" >/dev/null 2>&1 && bash "$SCRIPT" "$@" ) >/dev/null 2>&1
  echo $?
}

# ---------------------------------------------------------------------------
# Seed helper: create an initial commit in clone1, push it to origin as the
# <working> branch, then set up clone2 so it is checked out on <working> and
# can make ff-valid OOB advances. Returns the initial SHA on stdout.
# ---------------------------------------------------------------------------
seed_working_branch() {
  c1="$1"; c2="$2"; working="$3"
  # Create a seed commit in clone1.
  printf 'init-land\n' > "$c1/seed-land.txt"
  git -C "$c1" add -A
  git -C "$c1" commit -qm "seed land branch"
  SEED_SHA="$(git -C "$c1" rev-parse HEAD)"
  # Push to origin as the working branch.
  git -C "$c1" push -q origin "HEAD:refs/heads/$working"
  # Create local tracking branch in clone1 at SEED_SHA (the local follower).
  git -C "$c1" branch "$working" "$SEED_SHA"
  # Set up clone2: fetch, then CHECK OUT the working branch so that OOB commits
  # land on it (making clone2 a valid ff-ancestor for the out-of-band advance).
  git -C "$c2" fetch -q origin
  git -C "$c2" checkout -q -b "$working" "origin/$working" 2>/dev/null \
    || git -C "$c2" checkout -q "$working" 2>/dev/null \
    || true
  echo "$SEED_SHA"
}

# ---------------------------------------------------------------------------
# Case (T2.1) Origin advanced out-of-band -> push REJECTED, exit=RELAND (2),
# AND the local working ref in clone1 is byte-identical to before the call.
# ---------------------------------------------------------------------------
PAIR1="$(setup_origin_pair)"
C1_1="$(printf '%s' "$PAIR1" | cut -d' ' -f1)"
C2_1="$(printf '%s' "$PAIR1" | cut -d' ' -f2)"
ORIG1="$(printf '%s' "$PAIR1" | cut -d' ' -f3)"

SEED1="$(seed_working_branch "$C1_1" "$C2_1" "working/myplan")"

# Advance origin/<working> out-of-band via clone2 (simulating a concurrent run
# winning the CAS before clone1 calls land-advance).
printf 'concurrent-win\n' > "$C2_1/extra.txt"
git -C "$C2_1" add -A
git -C "$C2_1" commit -qm "concurrent run advances origin"
OOB_SHA="$(git -C "$C2_1" rev-parse HEAD)"
git -C "$C2_1" push -q origin "HEAD:refs/heads/working/myplan"

# Now clone1 produces its own new-sha (a --no-ff merge, simulated here as a
# separate commit at origin's SEED_SHA parent — not a descendant of OOB_SHA,
# making the push a genuine non-ff rejection).
printf 'clone1-merge\n' > "$C1_1/merge.txt"
git -C "$C1_1" add -A
git -C "$C1_1" commit -qm "clone1 merge sha"
NEW_SHA1="$(git -C "$C1_1" rev-parse HEAD)"

# Record the local working ref SHA before calling land-advance.
LOCAL_BEFORE1="$(git -C "$C1_1" rev-parse "refs/heads/working/myplan" 2>/dev/null)"

# Run land-advance from clone1 in a detached HEAD at NEW_SHA1.
code="$(run_in_detached "$C1_1" "$NEW_SHA1" land-advance working/myplan "$NEW_SHA1")"

# The [rejected] token causes exit RELAND=2.
expect "T2.1: origin out-of-band -> push rejected, exit RELAND code" \
  "2" "$code"
# Local working ref must be UNCHANGED (byte-identical to before).
LOCAL_AFTER1="$(git -C "$C1_1" rev-parse "refs/heads/working/myplan" 2>/dev/null)"
expect "T2.1: local working ref is byte-identical to before (rejected push leaves local unchanged)" \
  "$LOCAL_BEFORE1" "$LOCAL_AFTER1"

# ---------------------------------------------------------------------------
# Case (T2.2 / plan case 2) GENUINE ADVANCE: origin at the expected (old) tip,
# <new-sha> a fresh descendant -> the land-truth guard passes through
# (pre_push_origin != new_sha), the push is accepted, and the local follower
# advances to <new-sha>. Proves the phantom guard does NOT false-fire on a real
# advance.
# ---------------------------------------------------------------------------
PAIR2="$(setup_origin_pair)"
C1_2="$(printf '%s' "$PAIR2" | cut -d' ' -f1)"
C2_2="$(printf '%s' "$PAIR2" | cut -d' ' -f2)"
ORIG2="$(printf '%s' "$PAIR2" | cut -d' ' -f3)"

SEED2="$(seed_working_branch "$C1_2" "$C2_2" "working/myplan2")"

# clone1 produces its new-sha (a ff-pushable descendant of SEED2).
printf 'clone1-merge2\n' > "$C1_2/merge2.txt"
git -C "$C1_2" add -A
git -C "$C1_2" commit -qm "clone1 merge sha for T2.2"
NEW_SHA2="$(git -C "$C1_2" rev-parse HEAD)"

# Origin is still at SEED2 (no out-of-band advance) — push should be accepted.
code="$(run_in_detached "$C1_2" "$NEW_SHA2" land-advance working/myplan2 "$NEW_SHA2")"

expect "T2.2: origin at expected tip -> push accepted, exit 0" \
  "0" "$code"
# Local follower must now point at NEW_SHA2.
LOCAL_AFTER2="$(git -C "$C1_2" rev-parse "refs/heads/working/myplan2" 2>/dev/null)"
expect "T2.2: local follower advanced to <new-sha>" \
  "$NEW_SHA2" "$LOCAL_AFTER2"
# Origin must also be at NEW_SHA2.
ORIGIN_AFTER2="$(git -C "$C1_2" ls-remote origin "refs/heads/working/myplan2" 2>/dev/null | cut -f1)"
expect "T2.2: origin/<working> advanced to <new-sha>" \
  "$NEW_SHA2" "$ORIGIN_AFTER2"

# ---------------------------------------------------------------------------
# Case (T2.3 / plan case 5) ORIGIN UNREACHABLE -> the land-truth guard's
# pre-push `git ls-remote origin refs/heads/<working>` FAILS (rc!=0) and
# escalates (exit 3) BEFORE the push is attempted. A git error must never
# collapse into the empty/first-land carve-out (land-advance-push-first-cas-
# rejected-token: a git error is never a success/first-land) nor into a reland
# (exit 2). Simulate by pointing the remote at a non-existent path so ls-remote
# cannot read the origin tip.
#
# (Pre-guard this case exercised the PUSH-error classification; with the
# land-truth guard, an entirely-unreachable origin short-circuits at the
# ls-remote readback — comment kept honest per
# decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome. The
# bare push-error exit-3 classification is now exercised directly by T2.9
# below, where a reachable origin's pre-receive hook rejects the push.)
# ---------------------------------------------------------------------------
PAIR3="$(setup_origin_pair)"
C1_3="$(printf '%s' "$PAIR3" | cut -d' ' -f1)"
C2_3="$(printf '%s' "$PAIR3" | cut -d' ' -f2)"
ORIG3="$(printf '%s' "$PAIR3" | cut -d' ' -f3)"

SEED3="$(seed_working_branch "$C1_3" "$C2_3" "working/myplan3")"

# Break the remote URL so ls-remote (and any push) fails for a non-CAS reason.
git -C "$C1_3" remote set-url origin "/nonexistent/path/that/cannot/be/a/repo.git"

printf 'clone1-merge3\n' > "$C1_3/merge3.txt"
git -C "$C1_3" add -A
git -C "$C1_3" commit -qm "clone1 merge sha for T2.3"
NEW_SHA3="$(git -C "$C1_3" rev-parse HEAD)"

# Record the local follower before the call — a failed origin readback must NOT
# be read as a first land, so the follower is left byte-identical (never
# created/advanced).
LOCAL_BEFORE3="$(git -C "$C1_3" rev-parse refs/heads/working/myplan3 2>/dev/null)"

# Capture BOTH the die message and the exit code (mirroring T2.6, since
# run_in_detached swallows stderr). The die text is the ONLY thing that pins
# THIS escalation to the rc-guard: with the guard mentally deleted (or pipefail
# dropped), the failed ls-remote yields an EMPTY origin readback that falls
# through to first-land, and the unreachable-origin push then fails with the
# same observable exit 3 + unchanged follower. So the exit-code + follower
# checks alone do not fail if the guard regresses
# (weak-test-assertion-passes-without-feature-being-exercised); the die-text
# assertion below does — 'could not read the origin tip' is emitted only by the
# rc-guard path, never by the bare push-error exit 3.
OUT3="$( ( cd "$C1_3" && git checkout --detach "$NEW_SHA3" >/dev/null 2>&1 && bash "$SCRIPT" land-advance working/myplan3 "$NEW_SHA3" ) 2>&1 )"
code=$?

expect "T2.3: origin unreachable -> ls-remote guard escalates (exit 3), not reland (2)" \
  "3" "$code"
expect "T2.3: failed-readback die uniquely names the rc-guard path (not the bare push-error exit 3)" \
  "1" "$(printf '%s' "$OUT3" | grep -c 'could not read the origin tip')"
expect "T2.3: failed origin readback leaves the local follower unchanged (never read as first-land)" \
  "$LOCAL_BEFORE3" "$(git -C "$C1_3" rev-parse refs/heads/working/myplan3 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case (T2.4) DIFFERENT-BRANCH concurrency: two land-advance calls on DIFFERENT
# working branches both succeed with zero cross-bleed. Two clones each push to
# their own distinct branch on the same bare origin; each push should be accepted
# (exit 0), the local follower for each clone must advance to its own new-sha,
# and crucially neither push disturbs the other branch on origin.
#
# Layout: one bare origin; clone1 works on branch-A, clone2 works on branch-B.
# Both produce a new-sha (a ff-descendant of the branch's seed) and call
# land-advance. Neither is a non-ff rejection because they are on different refs.
# After both succeed: origin/branch-A == new_sha_A, origin/branch-B == new_sha_B,
# and the local follower in each clone points at its own new-sha only.
# ---------------------------------------------------------------------------

# Setup: one bare origin + two independent clones on DIFFERENT branches.
ORIG4="$(mktemp -d 2>/dev/null || mktemp -d -t warorg4)"
REPOS="$REPOS $ORIG4"
git init --bare -q "$ORIG4/origin.git"

C_A="$(mktemp -d 2>/dev/null || mktemp -d -t warc_a)"
REPOS="$REPOS $C_A"
git clone -q "$ORIG4/origin.git" "$C_A/clone_a" 2>/dev/null
git -C "$C_A/clone_a" config user.email war@test.local
git -C "$C_A/clone_a" config user.name "WAR Test"
git -C "$C_A/clone_a" config commit.gpgsign false

C_B="$(mktemp -d 2>/dev/null || mktemp -d -t warc_b)"
REPOS="$REPOS $C_B"
git clone -q "$ORIG4/origin.git" "$C_B/clone_b" 2>/dev/null
git -C "$C_B/clone_b" config user.email war@test.local
git -C "$C_B/clone_b" config user.name "WAR Test"
git -C "$C_B/clone_b" config commit.gpgsign false

# Seed branch-A in clone_a and push to origin.
printf 'seed-a\n' > "$C_A/clone_a/seed-a.txt"
git -C "$C_A/clone_a" add -A
git -C "$C_A/clone_a" commit -qm "seed branch-A"
SEED_A="$(git -C "$C_A/clone_a" rev-parse HEAD)"
git -C "$C_A/clone_a" push -q origin "HEAD:refs/heads/working/branch-a"
git -C "$C_A/clone_a" branch "working/branch-a" "$SEED_A"

# Seed branch-B in clone_b and push to origin.
printf 'seed-b\n' > "$C_B/clone_b/seed-b.txt"
git -C "$C_B/clone_b" add -A
git -C "$C_B/clone_b" commit -qm "seed branch-B"
SEED_B="$(git -C "$C_B/clone_b" rev-parse HEAD)"
git -C "$C_B/clone_b" push -q origin "HEAD:refs/heads/working/branch-b"
git -C "$C_B/clone_b" branch "working/branch-b" "$SEED_B"

# Each clone produces its own new-sha (ff-descendants of their respective seeds).
printf 'merge-a\n' > "$C_A/clone_a/merge-a.txt"
git -C "$C_A/clone_a" add -A
git -C "$C_A/clone_a" commit -qm "clone_a merge sha (branch-A)"
NEW_SHA_A="$(git -C "$C_A/clone_a" rev-parse HEAD)"

printf 'merge-b\n' > "$C_B/clone_b/merge-b.txt"
git -C "$C_B/clone_b" add -A
git -C "$C_B/clone_b" commit -qm "clone_b merge sha (branch-B)"
NEW_SHA_B="$(git -C "$C_B/clone_b" rev-parse HEAD)"

# Clone_a calls land-advance for branch-A (detached at NEW_SHA_A).
code_a="$(run_in_detached "$C_A/clone_a" "$NEW_SHA_A" land-advance working/branch-a "$NEW_SHA_A")"

# Clone_b calls land-advance for branch-B (detached at NEW_SHA_B).
code_b="$(run_in_detached "$C_B/clone_b" "$NEW_SHA_B" land-advance working/branch-b "$NEW_SHA_B")"

expect "T2.4: different-branch clone_a land-advance succeeds (exit 0)" \
  "0" "$code_a"
expect "T2.4: different-branch clone_b land-advance succeeds (exit 0)" \
  "0" "$code_b"

# Each local follower must have advanced to its own new-sha.
expect "T2.4: clone_a local follower points at new_sha_A" \
  "$NEW_SHA_A" "$(git -C "$C_A/clone_a" rev-parse "refs/heads/working/branch-a" 2>/dev/null)"
expect "T2.4: clone_b local follower points at new_sha_B" \
  "$NEW_SHA_B" "$(git -C "$C_B/clone_b" rev-parse "refs/heads/working/branch-b" 2>/dev/null)"

# Zero cross-bleed: origin must have both branches at their expected shas,
# and each branch is independent of the other.
ORIG_A_SHA="$(git -C "$C_A/clone_a" ls-remote origin "refs/heads/working/branch-a" 2>/dev/null | cut -f1)"
ORIG_B_SHA="$(git -C "$C_B/clone_b" ls-remote origin "refs/heads/working/branch-b" 2>/dev/null | cut -f1)"
expect "T2.4: origin/branch-a == new_sha_A (no cross-bleed)" \
  "$NEW_SHA_A" "$ORIG_A_SHA"
expect "T2.4: origin/branch-b == new_sha_B (no cross-bleed)" \
  "$NEW_SHA_B" "$ORIG_B_SHA"

# ---------------------------------------------------------------------------
# Case (T2.5) WRONG-HEAD PRECHECK (§4.4, End state 7) -> die EX_WRONG_BRANCH (6),
# BEFORE any push; local follower AND origin byte-unchanged. Invoked from a cwd
# whose HEAD is NOT <new-sha> while origin/<working> sits at an older tip, the
# named-source push (`HEAD:refs/heads/<working>`) either no-ops or advances
# <working> to a foreign commit, and its outcome could surface as a misleading
# exit 2 (#986). The precheck refuses first, so exit 2 keeps ONE meaning: a real
# concurrent advance.
#
# This case was formerly the "no-op push from the wrong cwd -> readback mismatch
# -> exit 3" case: same fixture, and its expected exit necessarily changes 3 -> 6
# because the precheck now intercepts pre-push (plan Notes / adjudication 10).
# The step-3 post-push origin readback (`ls-remote origin == new_sha`) and its
# comment STAY as defense in depth for a mid-push origin race — that residual is
# a declared backstop, not a deterministically fixture-able branch.
#
# CRUCIAL: this case does NOT use run_in_detached — that helper detaches HEAD to
# <new-sha>, making HEAD == new_sha so the precheck passes and the push is a real
# ff push (masking the wrong-HEAD route entirely). We instead check clone1's HEAD
# BACK to the SEED tip so HEAD != <new-sha>
# (weak-test-assertion-passes-without-feature).
# ---------------------------------------------------------------------------
PAIR5="$(setup_origin_pair)"
C1_5="$(printf '%s' "$PAIR5" | cut -d' ' -f1)"
C2_5="$(printf '%s' "$PAIR5" | cut -d' ' -f2)"
ORIG5="$(printf '%s' "$PAIR5" | cut -d' ' -f3)"

SEED5="$(seed_working_branch "$C1_5" "$C2_5" "working/myplan5")"

# clone1 produces its own new-sha (a separate commit, as T2.2 does). This commit
# lands on clone1's DEFAULT branch and advances clone1's ambient HEAD to NEW_SHA5;
# the working-branch ref refs/heads/working/myplan5 stays at SEED5.
printf 'clone1-merge5\n' > "$C1_5/merge5.txt"
git -C "$C1_5" add -A
git -C "$C1_5" commit -qm "clone1 merge sha for T2.5"
NEW_SHA5="$(git -C "$C1_5" rev-parse HEAD)"

# The NEW_SHA5 commit above moved clone1's HEAD off the seed; detach back to SEED5
# so HEAD != <new-sha> and origin/<working> sits at that older tip. Do NOT detach
# to NEW_SHA5 (that is the well-formed path run_in_detached covers in T2.2).
git -C "$C1_5" checkout -q --detach "$SEED5"
HEAD_BEFORE5="$(git -C "$C1_5" rev-parse HEAD)"                          # == SEED5
LOCAL_BEFORE5="$(git -C "$C1_5" rev-parse refs/heads/working/myplan5)"   # == SEED5
ORIGIN_BEFORE5="$(git -C "$C1_5" ls-remote origin refs/heads/working/myplan5 | cut -f1)"
expect "T2.5: fixture sanity — HEAD is NOT <new-sha> and origin sits at the older tip" \
  "wrong-head-older-origin" \
  "$([ "$HEAD_BEFORE5" != "$NEW_SHA5" ] && [ "$ORIGIN_BEFORE5" = "$SEED5" ] && echo wrong-head-older-origin || echo unexpected)"

# Call the script DIRECTLY from clone1's cwd (HEAD == SEED5), NOT via
# run_in_detached; capture the die message and the exit code from the ONE run
# (test runs under `set -u` only, so a non-zero substitution does not abort it).
OUT5="$( ( cd "$C1_5" && bash "$SCRIPT" land-advance working/myplan5 "$NEW_SHA5" ) 2>&1 )"
CODE5=$?

expect "T2.5: wrong HEAD (HEAD≠new_sha, origin at an older tip) → EX_WRONG_BRANCH (6), never reland (2) or escalate (3)" \
  "6" "$CODE5"
expect "T2.5: wrong-HEAD die names the actual HEAD sha" \
  "1" "$(printf '%s' "$OUT5" | grep -c "$HEAD_BEFORE5")"
expect "T2.5: wrong-HEAD die names the <new-sha> it expected" \
  "1" "$(printf '%s' "$OUT5" | grep -c "$NEW_SHA5")"
expect "T2.5: wrong-HEAD die carries the expected-cwd guidance (HEAD is the merge sha / _refinery)" \
  "match" "$(printf '%s' "$OUT5" | grep -qi 'HEAD is the merge sha' && printf '%s' "$OUT5" | grep -qi '_refinery' && echo match || echo nomatch)"
LOCAL_AFTER5="$(git -C "$C1_5" rev-parse refs/heads/working/myplan5)"
expect "T2.5: local refs/heads/<working> byte-unchanged (die happens before any push or update-ref)" \
  "$LOCAL_BEFORE5" "$LOCAL_AFTER5"
expect "T2.5: origin refs/heads/<working> byte-unchanged (nothing pushed)" \
  "$ORIGIN_BEFORE5" "$(git -C "$C1_5" ls-remote origin refs/heads/working/myplan5 | cut -f1)"

# ---------------------------------------------------------------------------
# Case (T2.5b) PRECHECK PLACEMENT DISCRIMINATOR (spec decision 8): the wrong-HEAD
# precheck sits AFTER the land-truth guard's early-return arms, not at the top of
# the function. An ALREADY-LANDED invocation (origin already at <new-sha>, local
# follower lagging) reconciles the follower WITHOUT pushing, so it is correct from
# ANY cwd and must stay idempotent (ADR 0008 repair-toward-git) — here it runs
# from a cwd whose HEAD != <new-sha> and must still exit 0.
#
# Delete-and-trace: hoist the precheck above the guard and this case dies 6.
# Same fixture as T2.8 EXCEPT the deliberate detach off <new-sha> before the call.
# ---------------------------------------------------------------------------
PAIR5B="$(setup_origin_pair)"
C1_5B="$(printf '%s' "$PAIR5B" | cut -d' ' -f1)"
C2_5B="$(printf '%s' "$PAIR5B" | cut -d' ' -f2)"
ORIG5B="$(printf '%s' "$PAIR5B" | cut -d' ' -f3)"

SEED5B="$(seed_working_branch "$C1_5B" "$C2_5B" "working/myplan5b")"
# A prior interrupted land pushed <new-sha> to origin but died before its follower
# CAS: the commit lands on clone1's default branch, refs/heads/working/myplan5b
# stays at SEED5B (lags one commit).
printf 'already-landed-5b\n' > "$C1_5B/landed5b.txt"
git -C "$C1_5B" add -A
git -C "$C1_5B" commit -qm "already-landed merge sha for T2.5b"
NEW_SHA5B="$(git -C "$C1_5B" rev-parse HEAD)"
git -C "$C1_5B" push -q origin "HEAD:refs/heads/working/myplan5b"

# The discriminating half: move HEAD OFF <new-sha>. A top-of-function precheck
# would die 6 right here; the specced placement lets the already-landed arm run.
git -C "$C1_5B" checkout -q --detach "$SEED5B"
expect "T2.5b: fixture sanity — HEAD is NOT <new-sha> at call time (the discriminating half)" \
  "different" "$([ "$(git -C "$C1_5B" rev-parse HEAD)" != "$NEW_SHA5B" ] && echo different || echo same)"
expect "T2.5b: fixture sanity — follower lags origin before the call" \
  "different" "$([ "$(git -C "$C1_5B" rev-parse refs/heads/working/myplan5b)" != "$NEW_SHA5B" ] && echo different || echo same)"

OUT5B="$( ( cd "$C1_5B" && bash "$SCRIPT" land-advance working/myplan5b "$NEW_SHA5B" ) 2>&1 )"
CODE5B=$?

expect "T2.5b: already-landed from a wrong-HEAD cwd still exits 0 (precheck sits AFTER the guard's early-return arms)" \
  "0" "$CODE5B"
expect "T2.5b: already-landed -> follower reconciled to <new-sha> (repair toward git)" \
  "$NEW_SHA5B" "$(git -C "$C1_5B" rev-parse refs/heads/working/myplan5b 2>/dev/null)"
expect "T2.5b: already-landed -> origin unchanged at <new-sha> (push skipped)" \
  "$NEW_SHA5B" "$(git -C "$C1_5B" ls-remote origin refs/heads/working/myplan5b | cut -f1)"

# ---------------------------------------------------------------------------
# Case (T2.5c) UNRESOLVABLE <new-sha> (precheck escalate arm): a <new-sha> that
# does not resolve to a commit dies EX_FOREIGN (3) — a git error is never the
# reland code (2) and never the wrong-HEAD code (6). With origin non-empty at
# the seed and != the bogus sha, control reaches the precheck on every run and
# the `rev-parse <new-sha>^{commit}` arm fails deterministically. Refs untouched.
# ---------------------------------------------------------------------------
PAIR5C="$(setup_origin_pair)"
C1_5C="$(printf '%s' "$PAIR5C" | cut -d' ' -f1)"
C2_5C="$(printf '%s' "$PAIR5C" | cut -d' ' -f2)"
ORIG5C="$(printf '%s' "$PAIR5C" | cut -d' ' -f3)"

SEED5C="$(seed_working_branch "$C1_5C" "$C2_5C" "working/myplan5c")"
git -C "$C1_5C" checkout -q --detach "$SEED5C"
BOGUS5C="deadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
LOCAL_BEFORE5C="$(git -C "$C1_5C" rev-parse refs/heads/working/myplan5c)"
ORIGIN_BEFORE5C="$(git -C "$C1_5C" ls-remote origin refs/heads/working/myplan5c | cut -f1)"

OUT5C="$( ( cd "$C1_5C" && bash "$SCRIPT" land-advance working/myplan5c "$BOGUS5C" ) 2>&1 )"
CODE5C=$?

expect "T2.5c: unresolvable <new-sha> → EX_FOREIGN (3), never reland (2) or wrong-HEAD (6)" \
  "3" "$CODE5C"
expect "T2.5c: unresolvable-<new-sha> die names the bogus sha" \
  "1" "$(printf '%s' "$OUT5C" | grep -c "$BOGUS5C")"
expect "T2.5c: unresolvable-<new-sha> die carries the 'does not resolve to a commit' substring" \
  "match" "$(printf '%s' "$OUT5C" | grep -q 'does not resolve to a commit' && echo match || echo nomatch)"
expect "T2.5c: local refs/heads/<working> byte-unchanged (die happens before any push or update-ref)" \
  "$LOCAL_BEFORE5C" "$(git -C "$C1_5C" rev-parse refs/heads/working/myplan5c)"
expect "T2.5c: origin refs/heads/<working> byte-unchanged (nothing pushed)" \
  "$ORIGIN_BEFORE5C" "$(git -C "$C1_5C" ls-remote origin refs/heads/working/myplan5c | cut -f1)"

# ---------------------------------------------------------------------------
# Case (T2.5d) UNRESOLVABLE HEAD (precheck escalate arm): an orphan/unborn HEAD
# dies EX_FOREIGN (3) — a git error is never the reland code (2), and this is
# never the wrong-HEAD code (6): a wrong-HEAD MISMATCH requires a RESOLVABLE HEAD
# to compare against <new-sha>, so an unresolvable HEAD can only escalate. The
# phase-close waiver claimed this arm was production-unreachable; an orphan-HEAD
# cwd reaches it deterministically — fixture infeasibility and production
# unreachability are different claims, and only the former was ever in doubt.
#
# Fixture notes (spec §8):
#  - The orphan branch MUST be a FRESH name, never the seeded <working> branch:
#    `git checkout --orphan <existing-name>` refuses (rc 128, probe-verified) — a
#    deliberate divergence from the family's branch-naming idiom.
#  - `git checkout --orphan` leaves the prior tree staged in the index; the
#    fixture does NOT care (no commit is made; land-advance reads only HEAD/refs).
#    Do not "fix" this with `git rm`.
#  - The script resolves `HEAD^{commit}` BEFORE `<new-sha>^{commit}`, so <new-sha>
#    is passed RESOLVABLE (origin-distinct, committed on the default branch) to
#    make the failure unambiguously the HEAD arm — the assertion matches the real
#    first-failing arm, never relies on die order.
# ---------------------------------------------------------------------------
PAIR5D="$(setup_origin_pair)"
C1_5D="$(printf '%s' "$PAIR5D" | cut -d' ' -f1)"
C2_5D="$(printf '%s' "$PAIR5D" | cut -d' ' -f2)"
ORIG5D="$(printf '%s' "$PAIR5D" | cut -d' ' -f3)"

SEED5D="$(seed_working_branch "$C1_5D" "$C2_5D" "working/myplan5d")"
# Commit a resolvable, origin-distinct <new-sha> on clone1's default branch (the
# T2.2/T2.5 add+commit-after-seed idiom); refs/heads/working/myplan5d stays parked
# at the seed — committing on the default branch never moves the follower.
printf 'orphan-head-newsha-5d\n' > "$C1_5D/newsha5d.txt"
git -C "$C1_5D" add -A
git -C "$C1_5D" commit -qm "clone1 merge sha for T2.5d"
NEW_SHA5D="$(git -C "$C1_5D" rev-parse HEAD)"
# Orphan HEAD -> unborn. Origin is non-empty (at the seed) and distinct from
# <new-sha>, so control passes the step-0 guard arms (rc-guard, phantom,
# already-landed) and dies at the precheck's HEAD^{commit} resolution.
git -C "$C1_5D" checkout -q --orphan orphan-head-5d
LOCAL_BEFORE5D="$(git -C "$C1_5D" rev-parse refs/heads/working/myplan5d)"
ORIGIN_BEFORE5D="$(git -C "$C1_5D" ls-remote origin refs/heads/working/myplan5d | cut -f1)"

OUT5D="$( ( cd "$C1_5D" && bash "$SCRIPT" land-advance working/myplan5d "$NEW_SHA5D" ) 2>&1 )"
CODE5D=$?

expect "T2.5d: unresolvable HEAD (orphan/unborn) → EX_FOREIGN (3), never reland (2) or wrong-HEAD (6)" \
  "3" "$CODE5D"
expect "T2.5d: unresolvable-HEAD die carries the 'could not resolve HEAD to a commit' substring (discriminates from T2.5c's die and the silent push-error exit 3)" \
  "match" "$(printf '%s' "$OUT5D" | grep -q 'could not resolve HEAD to a commit' && echo match || echo nomatch)"
expect "T2.5d: local refs/heads/<working> byte-unchanged (die happens before any push or update-ref)" \
  "$LOCAL_BEFORE5D" "$(git -C "$C1_5D" rev-parse refs/heads/working/myplan5d)"
expect "T2.5d: origin refs/heads/<working> byte-unchanged (nothing pushed)" \
  "$ORIGIN_BEFORE5D" "$(git -C "$C1_5D" ls-remote origin refs/heads/working/myplan5d | cut -f1)"

# ---------------------------------------------------------------------------
# Case (T2.6 / plan case 1) PHANTOM LAND: the --no-ff merge produced no commit,
# so <new-sha> == the pre-push origin tip AND the local follower already sits at
# it. land-advance must refuse (exit 3, loud die), leaving refs/heads/<working>
# AND origin byte-unchanged. This is the war-phantom-land-reports-success bug:
# origin never advanced, so a `landed` report would silently drop the phase.
#
# Side payoff (origin anchoring, D6/D7): the checkout-collision auto-recover
# merges in the LEAD worktree, where the merge advances the CHECKED-OUT
# refs/heads/<working> to <merge-sha> BEFORE land-advance runs. A LOCAL-follower
# anchor would false-phantom that legitimate advance; anchoring on the ORIGIN tip
# is what lets D6/D7 route through this one primitive at all.
# ---------------------------------------------------------------------------
PAIR6="$(setup_origin_pair)"
C1_6="$(printf '%s' "$PAIR6" | cut -d' ' -f1)"
C2_6="$(printf '%s' "$PAIR6" | cut -d' ' -f2)"
ORIG6="$(printf '%s' "$PAIR6" | cut -d' ' -f3)"

SEED6="$(seed_working_branch "$C1_6" "$C2_6" "working/myplan6")"
# origin at SEED6, follower refs/heads/working/myplan6 at SEED6. A no-commit
# --no-ff merge leaves HEAD at SEED6, so <new-sha> == SEED6 == origin == follower.
ORIGIN_BEFORE6="$(git -C "$C1_6" ls-remote origin refs/heads/working/myplan6 | cut -f1)"
FOLLOWER_BEFORE6="$(git -C "$C1_6" rev-parse refs/heads/working/myplan6)"

# Detach at SEED6 (HEAD == new_sha == origin tip == follower) and run; capture
# both the die message and the exit code in one invocation (test uses set -u only,
# so a non-zero substitution does not terminate the script).
OUT6="$( ( cd "$C1_6" && git checkout --detach "$SEED6" >/dev/null 2>&1 && bash "$SCRIPT" land-advance working/myplan6 "$SEED6" ) 2>&1 )"
CODE6=$?

expect "T2.6: phantom land (new-sha == origin tip == follower) -> exit 3" \
  "3" "$CODE6"
expect "T2.6: phantom die names the pre-push origin tip" \
  "1" "$(printf '%s' "$OUT6" | grep -c 'equals the pre-push origin tip')"
expect "T2.6: phantom land leaves origin unchanged" \
  "$ORIGIN_BEFORE6" "$(git -C "$C1_6" ls-remote origin refs/heads/working/myplan6 | cut -f1)"
expect "T2.6: phantom land leaves the local follower unchanged" \
  "$FOLLOWER_BEFORE6" "$(git -C "$C1_6" rev-parse refs/heads/working/myplan6)"

# ---------------------------------------------------------------------------
# Case (T2.7 / plan case 3) FIRST LAND: no refs/heads/<fresh-working> on origin
# (empty ls-remote readback, rc 0) and none locally. The phantom guard is
# SKIPPED (a genuine first advance has no prior origin tip), the push creates the
# branch, and the post-push readback still enforces origin == new_sha. Exit 0.
# Get this carve-out right or the first phase of every run false-fails (spec §8).
# ---------------------------------------------------------------------------
PAIR7="$(setup_origin_pair)"
C1_7="$(printf '%s' "$PAIR7" | cut -d' ' -f1)"
C2_7="$(printf '%s' "$PAIR7" | cut -d' ' -f2)"
ORIG7="$(printf '%s' "$PAIR7" | cut -d' ' -f3)"

# Do NOT seed working/myplan7 — it must exist neither on origin nor locally.
# Make the first commit in the fresh (empty) clone1 as the new-sha.
printf 'first-land\n' > "$C1_7/first.txt"
git -C "$C1_7" add -A
git -C "$C1_7" commit -qm "first land merge sha"
NEW_SHA7="$(git -C "$C1_7" rev-parse HEAD)"

code="$(run_in_detached "$C1_7" "$NEW_SHA7" land-advance working/myplan7 "$NEW_SHA7")"
expect "T2.7: first land (empty origin readback) -> guard skipped, exit 0" \
  "0" "$code"
expect "T2.7: first land -> origin branch created at <new-sha>" \
  "$NEW_SHA7" "$(git -C "$C1_7" ls-remote origin refs/heads/working/myplan7 | cut -f1)"
expect "T2.7: first land -> local follower created at <new-sha>" \
  "$NEW_SHA7" "$(git -C "$C1_7" rev-parse refs/heads/working/myplan7 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case (T2.8 / plan case 4) ALREADY LANDED: origin holds <new-sha> but the local
# follower LAGS one commit — an interrupted prior land pushed <new-sha> before
# its follower CAS ran (ADR 0008; the in-loop transient-recovery path). The guard
# skips the (no-op) push and reconciles the follower TOWARD git, exiting 0. This
# is the load-bearing idempotent-reland branch — distinct from the phantom case
# only by the follower's lag.
# ---------------------------------------------------------------------------
PAIR8="$(setup_origin_pair)"
C1_8="$(printf '%s' "$PAIR8" | cut -d' ' -f1)"
C2_8="$(printf '%s' "$PAIR8" | cut -d' ' -f2)"
ORIG8="$(printf '%s' "$PAIR8" | cut -d' ' -f3)"

SEED8="$(seed_working_branch "$C1_8" "$C2_8" "working/myplan8")"
# Produce a descendant of SEED8 and push it to origin as <working> WITHOUT
# advancing the local follower ref — simulating a prior land that pushed but died
# before the follower CAS. The commit lands on clone1's default branch; the ref
# refs/heads/working/myplan8 stays at SEED8 (lags one commit).
printf 'already-landed\n' > "$C1_8/landed.txt"
git -C "$C1_8" add -A
git -C "$C1_8" commit -qm "already-landed merge sha"
NEW_SHA8="$(git -C "$C1_8" rev-parse HEAD)"
git -C "$C1_8" push -q origin "HEAD:refs/heads/working/myplan8"

FOLLOWER_BEFORE8="$(git -C "$C1_8" rev-parse refs/heads/working/myplan8)"   # == SEED8 (lags)
expect "T2.8: fixture sanity — follower lags origin before the call" \
  "different" "$([ "$FOLLOWER_BEFORE8" != "$NEW_SHA8" ] && echo different || echo same)"

code="$(run_in_detached "$C1_8" "$NEW_SHA8" land-advance working/myplan8 "$NEW_SHA8")"
expect "T2.8: already-landed (origin at new-sha, follower lags) -> exit 0" \
  "0" "$code"
expect "T2.8: already-landed -> follower reconciled to <new-sha>" \
  "$NEW_SHA8" "$(git -C "$C1_8" rev-parse refs/heads/working/myplan8 2>/dev/null)"
expect "T2.8: already-landed -> origin unchanged at <new-sha> (push skipped)" \
  "$NEW_SHA8" "$(git -C "$C1_8" ls-remote origin refs/heads/working/myplan8 | cut -f1)"

# ---------------------------------------------------------------------------
# Case (T2.8b) ALREADY LANDED, FOLLOWER ABSENT — the "or is absent" arm of the
# already-landed branch (plan Task 1.1: follower "lags or is absent"). Origin
# holds <new-sha> but there is NO local refs/heads/<working> at all; the guard
# must CREATE the follower at <new-sha> and exit 0 (not phantom — an absent
# follower is not == new_sha).
# ---------------------------------------------------------------------------
PAIR8B="$(setup_origin_pair)"
C1_8B="$(printf '%s' "$PAIR8B" | cut -d' ' -f1)"
C2_8B="$(printf '%s' "$PAIR8B" | cut -d' ' -f2)"
ORIG8B="$(printf '%s' "$PAIR8B" | cut -d' ' -f3)"

# Commit in the fresh clone and push it to origin as <working>, but do NOT create
# a local refs/heads/working/myplan8b (follower absent — a plain push with an
# explicit refspec creates no local branch).
printf 'absent-follower\n' > "$C1_8B/af.txt"
git -C "$C1_8B" add -A
git -C "$C1_8B" commit -qm "absent-follower already-landed sha"
NEW_SHA8B="$(git -C "$C1_8B" rev-parse HEAD)"
git -C "$C1_8B" push -q origin "HEAD:refs/heads/working/myplan8b"
expect "T2.8b: fixture sanity — local follower absent before the call" \
  "1" "$(git -C "$C1_8B" rev-parse --verify -q refs/heads/working/myplan8b >/dev/null 2>&1; echo $?)"

code="$(run_in_detached "$C1_8B" "$NEW_SHA8B" land-advance working/myplan8b "$NEW_SHA8B")"
expect "T2.8b: already-landed, follower absent -> exit 0" \
  "0" "$code"
expect "T2.8b: already-landed, follower absent -> follower CREATED at <new-sha>" \
  "$NEW_SHA8B" "$(git -C "$C1_8B" rev-parse refs/heads/working/myplan8b 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case (T2.9) PUSH ERROR (pre-receive rejection) -> the [rejected]-token
# classifier does NOT match git's "! [remote rejected] ... (pre-receive hook
# declined)" line (the space in "[remote rejected]" is distinct from the
# contiguous [rejected] non-ff token cmd_land_advance greps for), so
# classification falls through to the bare `exit 3` push-error branch (the 0/2/3
# contract in cmd_land_advance's CLASSIFY header). This is the exit-3 route T2.3
# STOPPED exercising when it was reframed to prove the ls-remote rc-guard
# short-circuit (test-reframe-can-strand-adjacent-branch-coverage).
#
# Exit 3 is shared by multiple routes, every one of which dies LOUDLY with
# route-naming text — except this one: the push-error branch is the only SILENT
# exit-3 route (land-advance captures the push output internally and prints
# nothing), so route identity rests on (b)+(c)+(d) TOGETHER:
#   (b) ls-remote SUCCEEDS pre-call — closes the T2.3 rc-guard route by
#       construction (pre-receive is push-side; ls-remote is fetch-side);
#   (c) the token-distinctness fact asserted BY NAME (remote rejected present,
#       contiguous [rejected] absent) — a future git wording change fails HERE,
#       loud, not as an unexplained exit-code mismatch (never widen to bare
#       `rejected`; extend/adjudicate instead);
#   (d) the land-advance invocation emits NEITHER the rc-guard die text ("could
#       not read the origin tip") NOR the phantom die text ("refusing to report a
#       land that did not advance") — a regression rerouting the fixture through
#       either route would surface that die text and fail (d).
# ---------------------------------------------------------------------------
PAIR9="$(setup_origin_pair)"
C1_9="$(printf '%s' "$PAIR9" | cut -d' ' -f1)"
C2_9="$(printf '%s' "$PAIR9" | cut -d' ' -f2)"
ORIG9="$(printf '%s' "$PAIR9" | cut -d' ' -f3)"

SEED9="$(seed_working_branch "$C1_9" "$C2_9" "working/myplan9")"

# (a) Install a pre-receive hook in the bare origin that rejects every push
# (marker to stderr, exit 1). Installed AFTER the seed push so seeding succeeds.
cat > "$ORIG9/hooks/pre-receive" <<'HOOK'
#!/bin/sh
echo "T2.9-PRERECEIVE-DECLINED" >&2
exit 1
HOOK
chmod +x "$ORIG9/hooks/pre-receive"

# clone1 produces a ff-descendant new-sha (so the ONLY rejection reason is the
# hook, never a non-ff [rejected] token — that would ride the reland exit-2 path).
printf 'clone1-merge9\n' > "$C1_9/merge9.txt"
git -C "$C1_9" add -A
git -C "$C1_9" commit -qm "clone1 merge sha for T2.9"
NEW_SHA9="$(git -C "$C1_9" rev-parse HEAD)"

# (b) Fixture sanity: ls-remote (fetch-side; the pre-receive hook is push-side)
# still succeeds, so the ls-remote rc-guard route (T2.3) is closed by construction.
LSR9="$( ( cd "$C1_9" && git ls-remote origin refs/heads/working/myplan9 >/dev/null 2>&1 ); echo $? )"
expect "T2.9: fixture sanity — ls-remote origin succeeds pre-call (rc-guard route closed)" \
  "0" "$LSR9"

# (c) Direct-push probe: the SAME push land-advance will issue, run here in the
# test so the token-distinctness fact is asserted BY NAME. 'remote rejected' is
# present; the contiguous [rejected] token (what cmd_land_advance greps) is NOT.
PROBE9="$( ( cd "$C1_9" && git checkout --detach "$NEW_SHA9" >/dev/null 2>&1 && git push origin "HEAD:refs/heads/working/myplan9" ) 2>&1 )"
expect "T2.9: direct-push probe output contains 'remote rejected' (pre-receive declined)" \
  "1" "$(printf '%s' "$PROBE9" | grep -c 'remote rejected')"
expect "T2.9: direct-push probe output does NOT contain the contiguous [rejected] token (space-distinct)" \
  "0" "$(printf '%s' "$PROBE9" | grep -c '\[rejected\]')"

# Record refs before the land-advance call — a push-error exit 3 rewinds nothing.
FOLLOWER_BEFORE9="$(git -C "$C1_9" rev-parse refs/heads/working/myplan9)"
ORIGIN_BEFORE9="$(git -C "$C1_9" ls-remote origin refs/heads/working/myplan9 | cut -f1)"

# (d) Run land-advance, capturing BOTH combined output and exit code (T2.3/T2.6
# idiom; run_in_detached swallows stderr). The push-error branch prints nothing,
# so the die-text-ABSENCE assertions are what exclude the rc-guard (T2.3) and
# phantom (T2.6) exit-3 routes.
OUT9="$( ( cd "$C1_9" && git checkout --detach "$NEW_SHA9" >/dev/null 2>&1 && bash "$SCRIPT" land-advance working/myplan9 "$NEW_SHA9" ) 2>&1 )"
CODE9=$?
expect "T2.9: pre-receive push rejection -> bare push-error branch (exit 3)" \
  "3" "$CODE9"
expect "T2.9: push-error exit 3 does NOT emit the rc-guard die text (route distinct from T2.3)" \
  "0" "$(printf '%s' "$OUT9" | grep -c 'could not read the origin tip')"
expect "T2.9: push-error exit 3 does NOT emit the phantom die text (route distinct from T2.6)" \
  "0" "$(printf '%s' "$OUT9" | grep -c 'refusing to report a land that did not advance')"

# (e) A push-error escalation rewinds nothing: local follower byte-identical,
# origin tip unchanged (still the seed — the rejected push never advanced it).
expect "T2.9: push-error leaves the local follower byte-identical to before" \
  "$FOLLOWER_BEFORE9" "$(git -C "$C1_9" rev-parse refs/heads/working/myplan9 2>/dev/null)"
expect "T2.9: push-error leaves the origin tip unchanged (still the seed)" \
  "$ORIGIN_BEFORE9" "$(git -C "$C1_9" ls-remote origin refs/heads/working/myplan9 | cut -f1)"

# ===========================================================================
# Task 3 (clandiso): teardown-phase --worktree-root <root> — reap _refinery
# by path + verified integration delete.
#
# New flag: teardown-phase --run-dir <ledger-dir> --worktree-root <wt-root>
#           <slug> <N>
#
# The _refinery lives at <worktreeRoot>/<runId>/_refinery, where <runId> is
# derived from the basename of --run-dir. The reap is path-based (branch-
# agnostic: works whether _refinery is on the integration branch or detached)
# and guarded by its own path_under check scoped to <worktreeRoot>/<runId>.
#
# The integration branch delete now FAILS LOUD on error (propagates non-zero)
# instead of swallowing the error via `|| warn` (which returns 0 today).
#
# --keep preserves _refinery for inspection.
#
# Helper: run_id_from_dir <dir> -> echoes the basename (the run-id component).
run_id_from_dir() { basename "$1"; }

# mk_wt_root <parent> <run-id> -> echo <parent>/<run-id> (parent created).
# The _refinery will be placed at <parent>/<run-id>/_refinery by the test.
mk_wt_root() {
  wtr="$1"
  mkdir -p "$wtr"
  echo "$wtr"
}

# ---------------------------------------------------------------------------
# Case (T3a) teardown-phase reaps an ON-INTEGRATION _refinery (worktree is
# present, registered, and HEAD is on the integration branch). After teardown,
# the _refinery dir and its registry entry must be gone, and the integration
# branch itself must be deleted.
# ---------------------------------------------------------------------------
RTP_A="$(new_repo)"
git -C "$RTP_A" branch integration/myplan/phase-3 HEAD
TIPTA="$(git -C "$RTP_A" rev-parse integration/myplan/phase-3)"

# Layout: run-dir is <repo>/.claude/teams/<runId>
#         worktree-root is <repo>/.claude/worktrees
RD_TA="$(mk_run_dir "$RTP_A" run-ta1)"
RUN_ID_TA="run-ta1"
WT_ROOT_TA="$RTP_A/.claude/worktrees"
mkdir -p "$WT_ROOT_TA/$RUN_ID_TA"
REFINERY_TA="$WT_ROOT_TA/$RUN_ID_TA/_refinery"
OWN_TA="$RD_TA/owned.txt"
printf 'integration/myplan/phase-3\n' > "$OWN_TA"

# Provision the _refinery worktree on the integration branch (on-integration case).
run_in "$RTP_A" ensure-refinery-worktree "$REFINERY_TA" "integration/myplan/phase-3" >/dev/null 2>&1
expect "T3a setup: _refinery is registered and present on integration branch" \
  "integration/myplan/phase-3" "$(wt_head_branch "$RTP_A" "$REFINERY_TA")"
expect "T3a setup: integration branch exists" \
  "yes" "$(branch_exists_in "$RTP_A" integration/myplan/phase-3)"

code="$(run_in "$RTP_A" teardown-phase \
  --owned-file "$OWN_TA" \
  --run-dir "$RD_TA" \
  --worktree-root "$WT_ROOT_TA" \
  myplan 3)"
expect "T3a: teardown-phase exits 0 (on-integration _refinery reaped)" \
  "0" "$code"
expect "T3a: _refinery dir gone after teardown" \
  "no" "$([ -d "$REFINERY_TA" ] && echo yes || echo no)"
expect "T3a: _refinery registry entry gone after teardown" \
  "" "$(wt_head_branch "$RTP_A" "$REFINERY_TA")"
expect "T3a: integration branch deleted after teardown" \
  "no" "$(branch_exists_in "$RTP_A" integration/myplan/phase-3)"

# ---------------------------------------------------------------------------
# Case (T3b) teardown-phase reaps a DETACHED _refinery (HEAD is detached —
# the post-land state after a successful merge). Path-based reap must work
# whether _refinery is on-integration or detached.
# ---------------------------------------------------------------------------
RTP_B="$(new_repo)"
git -C "$RTP_B" branch integration/myplan/phase-4 HEAD
TIPTB="$(git -C "$RTP_B" rev-parse integration/myplan/phase-4)"

RD_TB="$(mk_run_dir "$RTP_B" run-tb1)"
RUN_ID_TB="run-tb1"
WT_ROOT_TB="$RTP_B/.claude/worktrees"
mkdir -p "$WT_ROOT_TB/$RUN_ID_TB"
REFINERY_TB="$WT_ROOT_TB/$RUN_ID_TB/_refinery"
OWN_TB="$RD_TB/owned.txt"
printf 'integration/myplan/phase-4\n' > "$OWN_TB"

# Provision the _refinery worktree on the integration branch, then detach HEAD.
run_in "$RTP_B" ensure-refinery-worktree "$REFINERY_TB" "integration/myplan/phase-4" >/dev/null 2>&1
# Detach HEAD in the refinery (simulating the post-merge detached state).
git -C "$REFINERY_TB" checkout --detach HEAD >/dev/null 2>&1
expect "T3b setup: _refinery is in detached HEAD state" \
  "(detached)" "$(wt_head_branch "$RTP_B" "$REFINERY_TB")"
expect "T3b setup: integration branch exists" \
  "yes" "$(branch_exists_in "$RTP_B" integration/myplan/phase-4)"

code="$(run_in "$RTP_B" teardown-phase \
  --owned-file "$OWN_TB" \
  --run-dir "$RD_TB" \
  --worktree-root "$WT_ROOT_TB" \
  myplan 4)"
expect "T3b: teardown-phase exits 0 (detached _refinery reaped)" \
  "0" "$code"
expect "T3b: detached _refinery dir gone after teardown" \
  "no" "$([ -d "$REFINERY_TB" ] && echo yes || echo no)"
expect "T3b: detached _refinery registry entry gone after teardown" \
  "" "$(wt_head_branch "$RTP_B" "$REFINERY_TB")"
expect "T3b: integration branch deleted after teardown (detached case)" \
  "no" "$(branch_exists_in "$RTP_B" integration/myplan/phase-4)"

# ---------------------------------------------------------------------------
# Case (T3c) Integration branch delete FAILS LOUD if the _refinery is still
# checked out on it (i.e. when no --worktree-root is supplied and the old
# behavior would silently swallow the error). Specifically: if _refinery is
# NOT reaped first (by omitting --worktree-root so _refinery remains checked
# out on the integration branch), the delete_branch call must now propagate a
# real non-zero exit. We test this by calling teardown-phase WITHOUT
# --worktree-root while the _refinery is on the integration branch — git will
# refuse to delete the branch, and teardown-phase must exit non-zero.
#
# --owned-file is required (F09): the integration branch must be in the ledger
# so the ownership gate is satisfied, allowing teardown-phase to reach the
# integration-branch-delete path (its intended failure mechanism).
# ---------------------------------------------------------------------------
RTP_C="$(new_repo)"
git -C "$RTP_C" branch integration/myplan/phase-5 HEAD
TIPTC="$(git -C "$RTP_C" rev-parse integration/myplan/phase-5)"

RD_TC="$(mk_run_dir "$RTP_C" run-tc1)"
OWN_TC="$RD_TC/owned.txt"
printf 'integration/myplan/phase-5\n' > "$OWN_TC"
WT_ROOT_TC="$RTP_C/.claude/worktrees"
mkdir -p "$WT_ROOT_TC/run-tc1"
REFINERY_TC="$WT_ROOT_TC/run-tc1/_refinery"

# Provision _refinery on the integration branch; do NOT reap it before calling
# teardown-phase (simulate the missing --worktree-root scenario).
run_in "$RTP_C" ensure-refinery-worktree "$REFINERY_TC" "integration/myplan/phase-5" >/dev/null 2>&1
expect "T3c setup: _refinery is on integration branch (not yet reaped)" \
  "integration/myplan/phase-5" "$(wt_head_branch "$RTP_C" "$REFINERY_TC")"

# Call teardown-phase WITH --owned-file (F09 satisfied) but WITHOUT
# --worktree-root: _refinery stays checked out, git refuses to delete the
# branch — teardown-phase must exit non-zero due to the branch-delete failure.
code="$(run_in "$RTP_C" teardown-phase --owned-file "$OWN_TC" --run-dir "$RD_TC" myplan 5)"
expect "T3c: teardown-phase exits non-zero when integration branch cannot be deleted (checked out in _refinery)" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
msg_tc="$(run_in_msg "$RTP_C" teardown-phase --owned-file "$OWN_TC" --run-dir "$RD_TC" myplan 5)"
# Mechanism-specific assertion: the failure must mention the branch-delete path.
expect "T3c: failure message mentions branch delete failure or checked-out branch" \
  "match" "$(printf '%s' "$msg_tc" | grep -qiE 'delete|checked.out|_refinery|worktree.?root' && echo match || echo nomatch)"
# Integration branch must still exist (not partially deleted).
expect "T3c: integration branch still present after failed teardown" \
  "yes" "$(branch_exists_in "$RTP_C" integration/myplan/phase-5)"

# ---------------------------------------------------------------------------
# Case (T3d) An out-of-run _refinery path is refused. If the _refinery path
# supplied via --worktree-root would compute a refinery path OUTSIDE
# <worktreeRoot>/<runId> (e.g. a worktree-root whose run-id component differs),
# teardown-phase must fail loud instead of removing foreign data.
# We test this by supplying a --worktree-root that puts the _refinery under a
# DIFFERENT run-id than the one derived from --run-dir.
#
# --owned-file is required (F09): the integration branch must be in the ledger
# so the ownership gate is satisfied, allowing teardown-phase to reach its
# intended failure mechanism (branch checked out in unreaped foreign _refinery).
# ---------------------------------------------------------------------------
RTP_D="$(new_repo)"
git -C "$RTP_D" branch integration/myplan/phase-6 HEAD

RD_TD="$(mk_run_dir "$RTP_D" run-td1)"
OWN_TD="$RD_TD/owned.txt"
printf 'integration/myplan/phase-6\n' > "$OWN_TD"
# A worktree-root that corresponds to a DIFFERENT run-id than run-td1.
WT_ROOT_TD_OTHER="$RTP_D/.claude/worktrees-FOREIGN"
mkdir -p "$WT_ROOT_TD_OTHER/run-FOREIGN"
REFINERY_TD_FOREIGN="$WT_ROOT_TD_OTHER/run-FOREIGN/_refinery"
run_in "$RTP_D" ensure-refinery-worktree "$REFINERY_TD_FOREIGN" "integration/myplan/phase-6" >/dev/null 2>&1
expect "T3d setup: foreign _refinery registered" \
  "integration/myplan/phase-6" "$(wt_head_branch "$RTP_D" "$REFINERY_TD_FOREIGN")"

# Supplying the foreign worktree-root: the computed _refinery path would be
# <WT_ROOT_TD_OTHER>/run-td1/_refinery which is NOT where the actual foreign
# _refinery lives. The guard must refuse or simply not match the out-of-run path.
# What we test: passing a --worktree-root that points to a DIFFERENT run-id's
# dir; teardown-phase should not remove the foreign refinery that isn't at the
# expected path. The foreign one must remain untouched.
code="$(run_in "$RTP_D" teardown-phase \
  --owned-file "$OWN_TD" \
  --run-dir "$RD_TD" \
  --worktree-root "$WT_ROOT_TD_OTHER" \
  myplan 6)"
# Whether it exits 0 or non-zero depends on whether the integration branch
# delete succeeds (it will if the foreign refinery is NOT under integration
# branch — but actually it IS, which means git WILL refuse to delete the
# integration branch that's checked out in REFINERY_TD_FOREIGN). So:
# teardown-phase cannot delete the branch, exits non-zero.
expect "T3d: teardown-phase exits non-zero (foreign _refinery path not under run-scope; branch still checked out)" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
msg_td="$(run_in_msg "$RTP_D" teardown-phase \
  --owned-file "$OWN_TD" \
  --run-dir "$RD_TD" \
  --worktree-root "$WT_ROOT_TD_OTHER" \
  myplan 6)"
# Mechanism-specific assertion: the failure must mention the branch-delete path.
expect "T3d: failure message mentions branch delete or checked-out branch" \
  "match" "$(printf '%s' "$msg_td" | grep -qiE 'delete|checked.out|_refinery|worktree.?root' && echo match || echo nomatch)"
# The foreign _refinery must remain untouched (not deleted).
expect "T3d: out-of-run _refinery dir remains intact" \
  "yes" "$([ -d "$REFINERY_TD_FOREIGN" ] && echo yes || echo no)"
expect "T3d: out-of-run _refinery still registered to its repo" \
  "integration/myplan/phase-6" "$(wt_head_branch "$RTP_D" "$REFINERY_TD_FOREIGN")"

# ---------------------------------------------------------------------------
# T3c/T3d verify note: both cases above call teardown-phase and trigger the
# fail-loud integration-branch-delete path (git refuses to delete the branch
# while it is still checked out in an unreaped _refinery). The path is already
# exercised by T3c and T3d — no additional test is needed here.
# (verify-task-no-op-is-correct-when-already-covered)
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Case (T3f) teardown-phase --force is an UNKNOWN FLAG (#136 drop).
# --force was parsed but never wired; it is now fully removed. Passing it
# must hit the -* catch-all arm and exit non-zero with "unknown flag".
# ---------------------------------------------------------------------------
RTP_F="$(new_repo)"
git -C "$RTP_F" branch integration/myplan/phase-8 HEAD
RD_TF="$(mk_run_dir "$RTP_F" run-tf1)"
OWN_TF="$RD_TF/owned.txt"
printf 'integration/myplan/phase-8\n' > "$OWN_TF"
code_tf="$(run_in "$RTP_F" teardown-phase --force --owned-file "$OWN_TF" --run-dir "$RD_TF" myplan 8)"
msg_tf="$(run_in_msg "$RTP_F" teardown-phase --force --owned-file "$OWN_TF" --run-dir "$RD_TF" myplan 8)"
expect "T3f: teardown-phase --force exits non-zero (unknown flag)" \
  "nonzero" "$([ "$code_tf" -ne 0 ] && echo nonzero || echo zero)"
expect "T3f: failure message mentions 'unknown flag'" \
  "match" "$(printf '%s' "$msg_tf" | grep -qi 'unknown' && echo match || echo nomatch)"

# ---------------------------------------------------------------------------
# Case (T3e) --keep preserves _refinery. When teardown-phase is called with
# --keep, neither the _refinery nor the integration branch is removed.
# ---------------------------------------------------------------------------
RTP_E="$(new_repo)"
git -C "$RTP_E" branch integration/myplan/phase-7 HEAD

RD_TE="$(mk_run_dir "$RTP_E" run-te1)"
WT_ROOT_TE="$RTP_E/.claude/worktrees"
mkdir -p "$WT_ROOT_TE/run-te1"
REFINERY_TE="$WT_ROOT_TE/run-te1/_refinery"

run_in "$RTP_E" ensure-refinery-worktree "$REFINERY_TE" "integration/myplan/phase-7" >/dev/null 2>&1
expect "T3e setup: _refinery present on integration branch" \
  "integration/myplan/phase-7" "$(wt_head_branch "$RTP_E" "$REFINERY_TE")"

code="$(run_in "$RTP_E" teardown-phase \
  --keep \
  --run-dir "$RD_TE" \
  --worktree-root "$WT_ROOT_TE" \
  myplan 7)"
expect "T3e: teardown-phase --keep exits 0" \
  "0" "$code"
expect "T3e: --keep preserves _refinery dir" \
  "yes" "$([ -d "$REFINERY_TE" ] && echo yes || echo no)"
expect "T3e: --keep preserves _refinery registry entry" \
  "integration/myplan/phase-7" "$(wt_head_branch "$RTP_E" "$REFINERY_TE")"
expect "T3e: --keep preserves the integration branch" \
  "yes" "$(branch_exists_in "$RTP_E" integration/myplan/phase-7)"

# ===========================================================================
# F08: structural absence guard — branch_ahead_of must not exist in skills/
#
# Verifies that the dead `branch_ahead_of` helper has been removed from all
# shell source files under skills/ (excluding test files). This is a clean-
# surface gate: the function was dead code that misrepresented the real
# conservative-heal guard (never-reset-on-reuse, D7).
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(dirname "$0")"
# assets -> war -> skills : two levels up. NOT three (that lands on the repo
# root and drags in stale branch_ahead_of copies under .claude/worktrees/**).
SKILLS_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# Search for branch_ahead_of in skills/ source files (exclude test files so
# this assertion itself does not false-positive on the grep term appearing
# in a comment inside a test file).
n=$((n + 1))
FOUND_AHEAD="$(grep -rn branch_ahead_of "$SKILLS_ROOT" \
  --include='*.sh' --exclude='*.test.sh' \
  --include='*.bash' 2>/dev/null || true)"
if [ -z "$FOUND_AHEAD" ]; then
  printf 'ok %d - F08: branch_ahead_of is absent from skills/ source files (grep returns nothing)\n' "$n"
else
  printf 'FAIL %d - F08: branch_ahead_of still present in skills/ source files:\n%s\n' "$n" "$FOUND_AHEAD"
  fails=$((fails + 1))
fi

# ===========================================================================
# F09: teardown/resume verify the --owned-file ledger (fail-closed)
#
# Ownership is checked at CREATE today; F09 adds symmetric checks at TEARDOWN
# and on the resume path (ensure-integration on an existing namespace branch
# without a ledger).
#
# Cases:
#   (F09.1) teardown-task refuses a FOREIGN branch (not in ledger) → exit 3,
#           worktree and branch untouched.
#   (F09.2) teardown-phase refuses a FOREIGN integration branch (not owned) →
#           exit 3, integration branch preserved.
#   (F09.3) teardown-task with an OWNED branch still works (worktree removed,
#           branch deleted).
#   (F09.4) teardown-task with NO --owned-file while namespace branch exists →
#           exit 3 with a recovery hint.
#   (F09.5) teardown-phase with NO --owned-file while integration branch exists →
#           exit 3 with a recovery hint.
#   (F09.6) ensure-integration (resume/create-side) on a ledger-less namespace
#           branch already emits a recovery hint (foreign-branch failure).
#           Pins the hint message (D2 resolution).
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Case (F09.1) teardown-task --owned-file <ledger> refuses a FOREIGN branch.
# The branch is NOT in the ledger → exit 3; worktree and branch must remain.
# ---------------------------------------------------------------------------
RF1="$(new_repo)"
git -C "$RF1" branch integration/myplan/phase-10 HEAD
TIPF1="$(git -C "$RF1" rev-parse integration/myplan/phase-10)"
RDF1="$(mk_run_dir "$RF1" run-f09-1)"
WTF1="$RDF1/worktrees/task-f09-1"
# Provision the worktree (branch war/myplan/p10-t1 gets created by ensure-worktree).
run_in "$RF1" ensure-worktree "$WTF1" war/myplan/p10-t1 "$TIPF1" >/dev/null 2>&1
expect "F09.1 setup: task branch exists" \
  "yes" "$(branch_exists_in "$RF1" war/myplan/p10-t1)"
expect "F09.1 setup: worktree present" \
  "war/myplan/p10-t1" "$(wt_on_branch "$RF1" "$WTF1")"
# Create an owned-file that does NOT include the task branch (foreign scenario).
OWNF1="$RDF1/owned.txt"; : > "$OWNF1"   # empty ledger — branch not recorded
code="$(run_in "$RF1" teardown-task --owned-file "$OWNF1" --run-dir "$RDF1" "$WTF1" war/myplan/p10-t1)"
expect "F09.1: teardown-task foreign branch → exit 3" \
  "3" "$code"
expect "F09.1: foreign-branch refusal — worktree still registered" \
  "war/myplan/p10-t1" "$(wt_on_branch "$RF1" "$WTF1")"
expect "F09.1: foreign-branch refusal — branch NOT deleted" \
  "yes" "$(branch_exists_in "$RF1" war/myplan/p10-t1)"

# ---------------------------------------------------------------------------
# Case (F09.2) teardown-phase refuses a FOREIGN integration branch.
# The integration branch is NOT in the ledger → exit 3, branch preserved.
# ---------------------------------------------------------------------------
RF2="$(new_repo)"
git -C "$RF2" branch integration/myplan/phase-11 HEAD
TIPF2="$(git -C "$RF2" rev-parse integration/myplan/phase-11)"
RDF2="$(mk_run_dir "$RF2" run-f09-2)"
OWNF2="$RDF2/owned.txt"; : > "$OWNF2"   # empty ledger — integration branch not recorded
code="$(run_in "$RF2" teardown-phase --owned-file "$OWNF2" --run-dir "$RDF2" myplan 11)"
expect "F09.2: teardown-phase foreign integration branch → exit 3" \
  "3" "$code"
expect "F09.2: foreign integration branch still present after refusal" \
  "yes" "$(branch_exists_in "$RF2" integration/myplan/phase-11)"

# ---------------------------------------------------------------------------
# Case (F09.3) teardown-task with an OWNED branch → normal teardown works.
# The branch IS in the ledger → worktree removed, branch deleted.
# ---------------------------------------------------------------------------
RF3="$(new_repo)"
git -C "$RF3" branch integration/myplan/phase-12 HEAD
TIPF3="$(git -C "$RF3" rev-parse integration/myplan/phase-12)"
RDF3="$(mk_run_dir "$RF3" run-f09-3)"
WTF3="$RDF3/worktrees/task-f09-3"
run_in "$RF3" ensure-worktree "$WTF3" war/myplan/p12-t1 "$TIPF3" >/dev/null 2>&1
# Owned-file records the task branch.
OWNF3="$RDF3/owned.txt"
printf 'war/myplan/p12-t1\n' > "$OWNF3"
expect "F09.3 setup: worktree present before teardown" \
  "war/myplan/p12-t1" "$(wt_on_branch "$RF3" "$WTF3")"
code="$(run_in "$RF3" teardown-task --owned-file "$OWNF3" --run-dir "$RDF3" "$WTF3" war/myplan/p12-t1)"
expect "F09.3: owned teardown exits 0" \
  "0" "$code"
expect "F09.3: owned teardown — worktree removed from registry" \
  "" "$(wt_on_branch "$RF3" "$WTF3")"
expect "F09.3: owned teardown — branch deleted" \
  "no" "$(branch_exists_in "$RF3" war/myplan/p12-t1)"

# ---------------------------------------------------------------------------
# Case (F09.4) teardown-task with NO --owned-file while the namespace branch
# exists → exit 3 with a recovery hint. Fail-closed: no ledger = refuse.
# ---------------------------------------------------------------------------
RF4="$(new_repo)"
git -C "$RF4" branch integration/myplan/phase-13 HEAD
TIPF4="$(git -C "$RF4" rev-parse integration/myplan/phase-13)"
RDF4="$(mk_run_dir "$RF4" run-f09-4)"
WTF4="$RDF4/worktrees/task-f09-4"
run_in "$RF4" ensure-worktree "$WTF4" war/myplan/p13-t1 "$TIPF4" >/dev/null 2>&1
# Call teardown-task WITHOUT --owned-file (ledger-less).
code="$(run_in "$RF4" teardown-task --run-dir "$RDF4" "$WTF4" war/myplan/p13-t1)"
expect "F09.4: teardown-task ledger-less → exit 3" \
  "3" "$code"
msg="$(run_in_msg "$RF4" teardown-task --run-dir "$RDF4" "$WTF4" war/myplan/p13-t1)"
expect "F09.4: ledger-less refusal message contains recovery hint" \
  "match" "$(printf '%s' "$msg" | grep -qi 'owned-file\|record\|ledger' && echo match || echo nomatch)"
expect "F09.4: ledger-less refusal — worktree still present" \
  "war/myplan/p13-t1" "$(wt_on_branch "$RF4" "$WTF4")"
expect "F09.4: ledger-less refusal — branch NOT deleted" \
  "yes" "$(branch_exists_in "$RF4" war/myplan/p13-t1)"

# ---------------------------------------------------------------------------
# Case (F09.5) teardown-phase with NO --owned-file while integration branch
# exists → exit 3 with a recovery hint. Fail-closed.
# ---------------------------------------------------------------------------
RF5="$(new_repo)"
git -C "$RF5" branch integration/myplan/phase-14 HEAD
RDF5="$(mk_run_dir "$RF5" run-f09-5)"
# Call teardown-phase WITHOUT --owned-file (ledger-less).
code="$(run_in "$RF5" teardown-phase --run-dir "$RDF5" myplan 14)"
expect "F09.5: teardown-phase ledger-less → exit 3" \
  "3" "$code"
msg="$(run_in_msg "$RF5" teardown-phase --run-dir "$RDF5" myplan 14)"
expect "F09.5: ledger-less phase refusal message contains recovery hint" \
  "match" "$(printf '%s' "$msg" | grep -qi 'owned-file\|record\|ledger' && echo match || echo nomatch)"
expect "F09.5: ledger-less phase refusal — integration branch still present" \
  "yes" "$(branch_exists_in "$RF5" integration/myplan/phase-14)"

# ---------------------------------------------------------------------------
# Case (F09.6) ensure-integration on a ledger-less existing namespace branch
# already fails with 'foreign' + includes a recovery hint. Pins the D2 resolution.
# The plan requires pinning the recovery-hint message text.
# ---------------------------------------------------------------------------
RF6="$(new_repo)"
TF6="$(git -C "$RF6" rev-parse HEAD)"
# Create the integration branch out-of-band (simulates a resume without a ledger).
git -C "$RF6" branch integration/myplan/phase-15 "$TF6"
# Try to resume with an EMPTY ledger — branch exists but is not owned.
OWNF6="$RF6/owned.txt"; : > "$OWNF6"
code="$(run_in "$RF6" ensure-integration myplan 15 "$TF6" --owned-file "$OWNF6")"
expect "F09.6: ensure-integration ledger-less resume → exit non-zero (foreign-branch)" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
msg6="$(run_in_msg "$RF6" ensure-integration myplan 15 "$TF6" --owned-file "$OWNF6")"
expect "F09.6: ledger-less resume failure message mentions 'foreign'" \
  "match" "$(printf '%s' "$msg6" | grep -qi 'foreign' && echo match || echo nomatch)"
expect "F09.6: ledger-less resume recovery hint mentions record-as-owned or delete" \
  "match" "$(printf '%s' "$msg6" | grep -qi 'record\|delete\|owned' && echo match || echo nomatch)"

# ===========================================================================
# Task 3 (#69): teardown merged-guard + cosmetic nits
#
# (A) delete_branch merged-guard: `git branch -d` (safe) before `-D`. An
#     un-merged branch without --force is preserved + warned; with --force
#     it is deleted. A merged branch is deleted by `-d` normally.
#
# (B) ensure-exclude strict args: unknown positional/flag → die.
#
# (C) cmd_ensure_integration branch-create: git stderr surfaced in the die
#     message (not just a generic "failed to create branch").
#
# (D) ensure-worktree empty-dir-recreate: an empty unregistered dir at <path>
#     is consumed (rmdir) and the worktree created (dir_is_empty → rmdir branch).
#
# Helper: setup a repo with an un-merged branch (branch was cut from HEAD but
# diverged — its commit is NOT an ancestor of HEAD in the main worktree).
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Case (MG.1) Merged branch → teardown-task deletes it (default behavior,
# confirms -d works on a merged branch). Uses a branch that was created at
# HEAD (same commit), which git considers "merged" into HEAD.
# ---------------------------------------------------------------------------
RMG1="$(new_repo)"
git -C "$RMG1" branch integration/myplan/phase-20 HEAD
TIPMG1="$(git -C "$RMG1" rev-parse integration/myplan/phase-20)"
RD_MG1="$(mk_run_dir "$RMG1" run-mg1)"
WT_MG1="$RD_MG1/worktrees/task-mg1"
run_in "$RMG1" ensure-worktree "$WT_MG1" war/myplan/p20-t1 "$TIPMG1" >/dev/null 2>&1
OWN_MG1="$RD_MG1/owned.txt"
printf 'war/myplan/p20-t1\n' > "$OWN_MG1"
# The task branch is at the same commit as HEAD → considered merged by git.
# Remove the worktree so delete_branch can run (branch must not be checked out).
run_in "$RMG1" teardown-task --owned-file "$OWN_MG1" --run-dir "$RD_MG1" "$WT_MG1" war/myplan/p20-t1 >/dev/null 2>&1
# After a clean teardown the branch should be gone.
expect "MG.1: merged branch deleted by teardown-task (exit 0 path)" \
  "no" "$(branch_exists_in "$RMG1" war/myplan/p20-t1)"

# ---------------------------------------------------------------------------
# Case (MG.2) Un-merged branch without --force → preserved + warn (exit 0,
# branch still exists). An un-merged branch has commits that are NOT ancestors
# of the current HEAD — git branch -d refuses it.
# ---------------------------------------------------------------------------
RMG2="$(new_repo)"
git -C "$RMG2" branch integration/myplan/phase-21 HEAD
TIPMG2="$(git -C "$RMG2" rev-parse integration/myplan/phase-21)"
RD_MG2="$(mk_run_dir "$RMG2" run-mg2)"
WT_MG2="$RD_MG2/worktrees/task-mg2"
run_in "$RMG2" ensure-worktree "$WT_MG2" war/myplan/p21-t1 "$TIPMG2" >/dev/null 2>&1
# Add an un-merged commit on the task branch inside the worktree.
printf 'unmerged-work\n' > "$WT_MG2/unmerged.txt"
git -C "$WT_MG2" add -A
git -C "$WT_MG2" commit -qm "un-merged commit on task branch"
# Remove the worktree registry entry (but keep the branch with its un-merged commit).
# We need to remove the worktree so git branch -d runs without "checked out" error.
# teardown-task calls remove_worktree THEN delete_branch; we simulate by manually
# removing the worktree registration, leaving the branch un-merged.
git -C "$RMG2" worktree remove --force "$WT_MG2" >/dev/null 2>&1 || true
git -C "$RMG2" worktree prune >/dev/null 2>&1 || true
expect "MG.2 setup: task branch exists with un-merged work" \
  "yes" "$(branch_exists_in "$RMG2" war/myplan/p21-t1)"
# Confirm un-merged: git branch -d should fail on this branch from the main worktree.
git -C "$RMG2" branch -d war/myplan/p21-t1 >/dev/null 2>&1 && SAFE_D_RC=0 || SAFE_D_RC=1
expect "MG.2 setup: git branch -d refuses un-merged branch (sanity)" \
  "1" "$SAFE_D_RC"
# Re-create the branch to be in a known state for the test (git branch -d deleted it
# on success, but we confirmed above it should fail; if it succeeded we still have it).
# Actually, if -d succeeded, it was "merged" — our setup might be wrong. Let's create
# a fresh un-merged branch by making a new commit diverging from integration tip.
RMG2b="$(new_repo)"
git -C "$RMG2b" branch integration/myplan/phase-21b HEAD
TIPMG2b="$(git -C "$RMG2b" rev-parse HEAD)"
# Cut a new branch at the same tip, then add a commit to it (making it un-merged).
git -C "$RMG2b" checkout -b war/myplan/p21b-t1 >/dev/null 2>&1
printf 'unmerged\n' > "$RMG2b/unmerged.txt"
git -C "$RMG2b" add -A
git -C "$RMG2b" commit -qm "un-merged commit"
# Detach HEAD at the integration tip (BEFORE the un-merged commit) so that
# git branch -d considers the branch un-merged (its commit is NOT an ancestor
# of HEAD). HEAD~0 would be the un-merged commit itself — not what we want.
git -C "$RMG2b" checkout --detach "$TIPMG2b" >/dev/null 2>&1
# Verify the branch is un-merged from HEAD.
expect "MG.2b setup: un-merged branch exists" \
  "yes" "$(branch_exists_in "$RMG2b" war/myplan/p21b-t1)"
RD_MG2b="$(mk_run_dir "$RMG2b" run-mg2b)"
OWN_MG2b="$RD_MG2b/owned.txt"
printf 'war/myplan/p21b-t1\n' > "$OWN_MG2b"
# Create a fake worktree path inside run-dir to satisfy run-scope guard.
WT_MG2b_FAKE="$RD_MG2b/worktrees/task-mg2b"
mkdir -p "$WT_MG2b_FAKE"
# Directly test delete_branch behavior by calling teardown-task (which calls
# remove_worktree then delete_branch). With an empty unregistered dir as path,
# remove_worktree will do nothing (not registered), then delete_branch fires.
# Without --force: un-merged branch must be preserved + warn (exit 0, branch stays).
code_mg2b="$(run_in "$RMG2b" teardown-task --owned-file "$OWN_MG2b" --run-dir "$RD_MG2b" "$WT_MG2b_FAKE" war/myplan/p21b-t1)"
expect "MG.2: teardown-task without --force on un-merged branch exits 0 (warn+leave)" \
  "0" "$code_mg2b"
expect "MG.2: un-merged branch preserved without --force (not deleted)" \
  "yes" "$(branch_exists_in "$RMG2b" war/myplan/p21b-t1)"
msg_mg2b="$(run_in_msg "$RMG2b" teardown-task --owned-file "$OWN_MG2b" --run-dir "$RD_MG2b" "$WT_MG2b_FAKE" war/myplan/p21b-t1)"
expect "MG.2: warn message mentions un-merged or not fully merged" \
  "match" "$(printf '%s' "$msg_mg2b" | grep -qiE 'merged|unmerged|not fully' && echo match || echo nomatch)"

# ---------------------------------------------------------------------------
# Case (MG.3) Un-merged branch WITH --force → deleted.
# Same setup as MG.2b but teardown-task is called with --force.
# ---------------------------------------------------------------------------
RMG3="$(new_repo)"
git -C "$RMG3" checkout -b war/myplan/p22-t1 >/dev/null 2>&1
printf 'unmerged3\n' > "$RMG3/unmerged3.txt"
git -C "$RMG3" add -A
git -C "$RMG3" commit -qm "un-merged commit for MG.3"
# Switch back to detached HEAD so the branch is not checked out.
git -C "$RMG3" checkout --detach HEAD >/dev/null 2>&1
expect "MG.3 setup: un-merged branch exists" \
  "yes" "$(branch_exists_in "$RMG3" war/myplan/p22-t1)"
RD_MG3="$(mk_run_dir "$RMG3" run-mg3)"
OWN_MG3="$RD_MG3/owned.txt"
printf 'war/myplan/p22-t1\n' > "$OWN_MG3"
WT_MG3_FAKE="$RD_MG3/worktrees/task-mg3"
mkdir -p "$WT_MG3_FAKE"
code_mg3="$(run_in "$RMG3" teardown-task --force --owned-file "$OWN_MG3" --run-dir "$RD_MG3" "$WT_MG3_FAKE" war/myplan/p22-t1)"
expect "MG.3: teardown-task --force on un-merged branch exits 0" \
  "0" "$code_mg3"
expect "MG.3: un-merged branch deleted with --force" \
  "no" "$(branch_exists_in "$RMG3" war/myplan/p22-t1)"

# ---------------------------------------------------------------------------
# Case (EE.1) ensure-exclude strict args: an unknown positional/flag → die
# (non-zero exit). Mirrors ensure-integration's behavior.
# ---------------------------------------------------------------------------
REE1="$(new_repo)"
code_ee1="$(run_in "$REE1" ensure-exclude unexpected-arg)"
expect "EE.1: ensure-exclude with unknown arg exits non-zero" \
  "nonzero" "$([ "$code_ee1" -ne 0 ] && echo nonzero || echo zero)"
msg_ee1="$(run_in_msg "$REE1" ensure-exclude unexpected-arg)"
expect "EE.1: ensure-exclude unknown-arg error message is non-empty" \
  "match" "$(printf '%s' "$msg_ee1" | grep -qi 'unknown\|usage\|arg' && echo match || echo nomatch)"

# ---------------------------------------------------------------------------
# Case (SI.1) cmd_ensure_integration branch-create with a base that resolves
# NOWHERE (no local ref, no origin). Survey-derived correction (§4.7, #725.4):
# this input is now exactly the missing-local-ref shape, so the AUTHORITATIVE
# die is the NAMED missing-local-ref diagnostic (referencing the lesson), NOT
# the raw "not a valid object name" from `git branch` — the §4.7 guard fires
# before the cut. The fetch-fallback warn still surfaces git's own stderr in the
# combined output (offline-fallback behavior, unchanged), which this case also
# pins so the offline diagnostic never regresses to a generic message.
# ---------------------------------------------------------------------------
RSI1="$(new_repo)"
OWN_SI1="$RSI1/owned_si.txt"; : > "$OWN_SI1"
msg_si1="$(run_in_msg "$RSI1" ensure-integration myplan 99 nonexistent-base-sha-ZZZZZ --owned-file "$OWN_SI1")"
code_si1="$(run_in "$RSI1" ensure-integration myplan 99 nonexistent-base-sha-ZZZZZ --owned-file "$OWN_SI1")"
expect "SI.1: ensure-integration with an unresolvable base exits non-zero" \
  "nonzero" "$([ "$code_si1" -ne 0 ] && echo nonzero || echo zero)"
# The combined output still surfaces git's stderr (via the fetch-fallback warn),
# never a generic detail-free message.
expect "SI.1: combined output surfaces git stderr (offline-fallback detail present)" \
  "match" "$(printf '%s' "$msg_si1" | grep -qiE 'not a valid object|invalid object|fatal' && echo match || echo nomatch)"
# §4.7: the authoritative die names the missing-local-ref cause + the lesson,
# not the raw "not a valid object name" (end state 9, both-absent half).
expect "SI.1: die names the missing-local-ref cause (§4.7)" \
  "match" "$(printf '%s' "$msg_si1" | grep -qi 'no local ref\|local working branch\|war-provision-barrier-needs-local-working-branch-ref' && echo match || echo nomatch)"

# ---------------------------------------------------------------------------
# Case (ED.1) ensure-worktree empty-dir-recreate: an empty unregistered dir
# at <path> is consumed (rmdir) and the worktree is created there. This
# exercises the dir_is_empty → rmdir branch in cmd_ensure_worktree.
# The dir must exist after the call (as the new worktree), with .war-task.
# ---------------------------------------------------------------------------
RED1="$(new_repo)"
git -C "$RED1" branch integration/myplan/phase-30 HEAD
TIPED1="$(git -C "$RED1" rev-parse integration/myplan/phase-30)"
# Create an EMPTY unregistered dir at the target path.
WED1="$(new_wt_path)"
mkdir -p "$WED1"    # empty leaf exists but is NOT a registered worktree
expect "ED.1 setup: empty dir exists before ensure-worktree" \
  "yes" "$([ -d "$WED1" ] && [ -z "$(ls -A "$WED1" 2>/dev/null)" ] && echo yes || echo no)"
code_ed1="$(run_in "$RED1" ensure-worktree "$WED1" war/myplan/p30-t1 "$TIPED1")"
expect "ED.1: ensure-worktree on empty unregistered dir exits 0" \
  "0" "$code_ed1"
expect "ED.1: worktree dir exists and is populated after ensure-worktree" \
  "yes" "$([ -d "$WED1" ] && echo yes || echo no)"
expect "ED.1: .war-task marker present after empty-dir recreate" \
  "yes" "$([ -f "$WED1/.war-task" ] && echo yes || echo no)"
expect "ED.1: git worktree list shows <path> on <branch>" \
  "war/myplan/p30-t1" "$(wt_on_branch "$RED1" "$WED1")"

# ---------------------------------------------------------------------------
# Case (MX.1) MARKER EXCLUDED: a freshly-provisioned worktree must NOT surface
# .war-task as an untracked/addable path — write_marker adds it to the shared
# common-dir info/exclude. A worker staging with `git add -A` would otherwise
# track the marker; the tracked blob then collides with _refinery's own
# untracked marker and aborts the refiner merge as a spurious conflict.
# Asserts: (1) the marker file exists, (2) `git status --porcelain` does NOT
# list it, and (3) `git add -A` does not stage it (nothing in the index names it).
# Covers both the task worktree (ensure-worktree) and the refinery worktree
# (ensure-refinery-worktree), which share the same common-dir exclude.
# ---------------------------------------------------------------------------
RMX1="$(new_repo)"
git -C "$RMX1" branch integration/myplan/phase-40 HEAD
TIPMX1="$(git -C "$RMX1" rev-parse integration/myplan/phase-40)"
WMX1="$(new_wt_path)"
run_in "$RMX1" ensure-worktree "$WMX1" war/myplan/p40-t1 "$TIPMX1" >/dev/null 2>&1
expect "MX.1: .war-task marker exists in the fresh worktree" \
  "yes" "$([ -f "$WMX1/.war-task" ] && echo yes || echo no)"
expect "MX.1: .war-task does NOT surface in git status (excluded)" \
  "" "$(git -C "$WMX1" status --porcelain | grep '\.war-task' || true)"
git -C "$WMX1" add -A >/dev/null 2>&1
expect "MX.1: git add -A does NOT stage .war-task" \
  "" "$(git -C "$WMX1" diff --cached --name-only | grep '\.war-task' || true)"

# Same guarantee for the refinery worktree.
WMXR="$(new_wt_path)"
run_in "$RMX1" ensure-refinery-worktree "$WMXR" integration/myplan/phase-40 >/dev/null 2>&1
expect "MX.1: refinery .war-task does NOT surface in git status (excluded)" \
  "" "$(git -C "$WMXR" status --porcelain | grep '\.war-task' || true)"

# ---------------------------------------------------------------------------
# Case (OF.1) OWNED-FILE PARENT DIR MISSING: ensure-integration with
# --owned-file pointing into a not-yet-existing directory must still record
# ownership (record_owned_file mkdir -p's the parent). Regression: the append
# used to die under set -e AFTER the branch was created but BEFORE ownership
# was recorded, so an identical retry saw its own branch as foreign and
# exited 3 (ADR 0003), halting the phase.
# ---------------------------------------------------------------------------
ROF1="$(new_repo)"
TIPOF1="$(git -C "$ROF1" rev-parse HEAD)"
OWNOF1="$ROF1/.claude/teams/run-of1/owned.txt"   # parent dirs do NOT exist yet
code_of1="$(run_in "$ROF1" ensure-integration myplan 50 "$TIPOF1" --owned-file "$OWNOF1")"
expect "OF.1: create with missing owned-file parent dir exits 0" 0 "$code_of1"
expect "OF.1: ownership recorded in the ledger" \
  "0" "$(grep -Fxq -- integration/myplan/phase-50 "$OWNOF1" 2>/dev/null; echo $?)"
code_of1b="$(run_in "$ROF1" ensure-integration myplan 50 "$TIPOF1" --owned-file "$OWNOF1")"
expect "OF.1: identical retry reuses the branch (exit 0, not 3)" 0 "$code_of1b"

# ---------------------------------------------------------------------------
# resolve-working-branch / ensure-origin (checkout-guard)
# ---------------------------------------------------------------------------
# run_out <repo> <args...> -> echoes ONLY stdout of the script (stderr dropped),
# so we can assert the resolved branch name the subcommand prints.
run_out() {
  d="$1"; shift
  ( cd "$d" && bash "$SCRIPT" "$@" ) 2>/dev/null
}

# checked_out_anywhere <repo> <ref> -> "yes" if <ref> is the checked-out branch
# of any worktree of <repo>, else "no".
checked_out_anywhere() {
  git -C "$1" worktree list --porcelain 2>/dev/null \
    | grep -Fxq -- "branch refs/heads/$2" && echo yes || echo no
}

# --- Case (RWB.a) COLLISION: <desired> is checked out (in the main checkout),
# so resolve-working-branch must return a fresh dev/<date>-<slug> created at the
# desired tip, checked out NOWHERE, and != <desired>.
RWB_A="$(new_repo)"
DESIRED_A="$(git -C "$RWB_A" symbolic-ref --short HEAD)"   # the main checkout's branch
TIP_A="$(git -C "$RWB_A" rev-parse HEAD)"
OWN_A="$RWB_A/owned.txt"; : > "$OWN_A"
RESOLVED_A="$(run_out "$RWB_A" resolve-working-branch "$DESIRED_A" myplan 2026-07-06 --owned-file "$OWN_A")"
expect "RWB.a: collision resolves a branch != <desired>" \
  "different" "$([ "$RESOLVED_A" != "$DESIRED_A" ] && echo different || echo same)"
expect "RWB.a: resolved branch is dev/<date>-<slug>" \
  "dev/2026-07-06-myplan" "$RESOLVED_A"
expect "RWB.a: dedicated branch created at the desired tip" \
  "$TIP_A" "$(git -C "$RWB_A" rev-parse dev/2026-07-06-myplan 2>/dev/null)"
expect "RWB.a: dedicated branch is checked out NOWHERE" \
  "no" "$(checked_out_anywhere "$RWB_A" dev/2026-07-06-myplan)"
expect "RWB.a: ownership recorded in the ledger" \
  "0" "$(grep -Fxq -- dev/2026-07-06-myplan "$OWN_A"; echo $?)"

# --- Case (RWB.b) NO COLLISION: <desired> exists but is checked out NOWHERE, so
# resolve-working-branch echoes it byte-identically and creates no new branch.
RWB_B="$(new_repo)"
# Detach the main checkout so 'landing' is not checked out anywhere.
git -C "$RWB_B" branch landing HEAD
git -C "$RWB_B" checkout -q --detach HEAD
RESOLVED_B="$(run_out "$RWB_B" resolve-working-branch landing myplan 2026-07-06)"
expect "RWB.b: no-collision echoes <desired> unchanged" \
  "landing" "$RESOLVED_B"
expect "RWB.b: no dedicated branch was created" \
  "1" "$(git -C "$RWB_B" rev-parse --verify -q dev/2026-07-06-myplan >/dev/null 2>&1; echo $?)"

# --- Case (RWB.c) ensure-origin against a local mock remote: the ref shows up on
# origin after the push (git ls-remote), and a second call is an idempotent no-op.
RWB_C_ORIG="$(mktemp -d 2>/dev/null || mktemp -d -t warorg)"; REPOS="$REPOS $RWB_C_ORIG"
git init --bare -q "$RWB_C_ORIG/origin.git"
RWB_C="$(new_repo)"
git -C "$RWB_C" remote add origin "$RWB_C_ORIG/origin.git"
git -C "$RWB_C" branch dev/2026-07-06-myplan HEAD
code_rwbc="$(run_in "$RWB_C" ensure-origin dev/2026-07-06-myplan)"
expect "RWB.c: ensure-origin exits 0" "0" "$code_rwbc"
expect "RWB.c: ref present on origin after push" \
  "1" "$(git -C "$RWB_C" ls-remote origin "refs/heads/dev/2026-07-06-myplan" | grep -c .)"
code_rwbc2="$(run_in "$RWB_C" ensure-origin dev/2026-07-06-myplan)"
expect "RWB.c: ensure-origin is idempotent (second call exits 0)" "0" "$code_rwbc2"

# --- Case (RWB.d) RESUME-REUSE: a second resolve-working-branch call with the
# same slug/date and the recorded owned-file reuses the run-owned dedicated
# branch — never re-cuts, never errors — even after the desired tip advances.
RWB_D="$(new_repo)"
DESIRED_D="$(git -C "$RWB_D" symbolic-ref --short HEAD)"
OWN_D="$RWB_D/owned.txt"; : > "$OWN_D"
RESOLVED_D1="$(run_out "$RWB_D" resolve-working-branch "$DESIRED_D" myplan 2026-07-06 --owned-file "$OWN_D")"
DEV_TIP_D1="$(git -C "$RWB_D" rev-parse dev/2026-07-06-myplan)"
# Advance the desired branch so a re-cut would move the dedicated branch.
printf 'more\n' > "$RWB_D/more.txt"; git -C "$RWB_D" add -A; git -C "$RWB_D" commit -qm "advance"
code_rwbd="$(run_in "$RWB_D" resolve-working-branch "$DESIRED_D" myplan 2026-07-06 --owned-file "$OWN_D")"
expect "RWB.d: resume call exits 0 (reuse, not error)" "0" "$code_rwbd"
RESOLVED_D2="$(run_out "$RWB_D" resolve-working-branch "$DESIRED_D" myplan 2026-07-06 --owned-file "$OWN_D")"
expect "RWB.d: resume returns the same dedicated branch" \
  "$RESOLVED_D1" "$RESOLVED_D2"
expect "RWB.d: dedicated branch did NOT move (never re-cut)" \
  "$DEV_TIP_D1" "$(git -C "$RWB_D" rev-parse dev/2026-07-06-myplan)"

# --- Case (RWB.e) ensure-origin FAILURE PATH: the origin remote URL points at a
# nonexistent path, so `git push -u origin ...` fails for a non-CAS reason. The
# die message must RETAIN the never-force guidance ("refusing to force") AND
# APPEND git's own stderr (the _tmp_err capture, #801; resolved lesson
# ensure-origin-swallows-stderr-unlike-sibling-subcommands). Assert the guidance
# is present AND at least one of the two known git-stderr family fragments is
# present — a case-insensitive DISJUNCTION, never an exact full-message match
# (git wording varies across versions; on a future miss EXTEND the fragment list,
# never weaken to "any non-static content"). RWB.c above stays the success /
# idempotency control, unmodified. Die stderr captured via the T2.3/T2.6
# hand-rolled inline idiom (run_in echoes only the exit code; run_in_detached
# swallows both streams — neither can assert die text). ---
RWB_E="$(new_repo)"
git -C "$RWB_E" remote add origin "/nonexistent/path/that/cannot/be/a/repo-eo.git"
git -C "$RWB_E" branch dev/2026-07-06-myplan HEAD
OUT_EO="$( ( cd "$RWB_E" && bash "$SCRIPT" ensure-origin dev/2026-07-06-myplan ) 2>&1 )"
expect "RWB.e: ensure-origin failure die RETAINS the never-force guidance" \
  "1" "$(printf '%s' "$OUT_EO" | grep -c 'refusing to force')"
expect "RWB.e: ensure-origin failure die APPENDS git's own stderr (a known family fragment)" \
  "yes" "$(printf '%s' "$OUT_EO" | grep -Eiq 'does not appear to be a git repository|could not read from remote repository' && echo yes || echo no)"

# ===========================================================================
# Task 2 (target-repo-agnostic): ensure-integration reconciles the local <base>
# against origin/<base> before cutting, on the CREATE path only (ADR 0008).
# Cases (a)-(f). All use a LOCAL fixture remote (file-path origin), are
# bash-3.2-safe and cwd-independent (git -C + absolute paths + run_capture's cd
# subshell). The base is a BRANCH NAME here (as in production, where it is the
# resolved working branch), so refs/heads/<base> is a real follower ref.
#
# The owned resume/reuse path is unchanged (cases 1-2 above); the fetch only
# happens when the integration branch is absent (the create path).
FBASE="wbranch"

# fixture_remote -> echoes "LOCAL ORIGIN": an origin repo whose single branch
# $FBASE holds a seed commit c0, and a local clone with origin -> that repo.
# The clone's HEAD is left ON $FBASE (case f needs it checked out; cases a-e
# detach first). Both dirs are registered for cleanup.
fixture_remote() {
  fo="$(mktemp -d 2>/dev/null || mktemp -d -t warorig)"; REPOS="$REPOS $fo"
  git -C "$fo" init -q
  git -C "$fo" config user.email war@test.local
  git -C "$fo" config user.name "WAR Test"
  git -C "$fo" config commit.gpgsign false
  git -C "$fo" checkout -q -b "$FBASE"
  printf 'c0\n' > "$fo/base.txt"; git -C "$fo" add -A; git -C "$fo" commit -qm c0
  fl="$(mktemp -d 2>/dev/null || mktemp -d -t warlocal)"; REPOS="$REPOS $fl"
  git clone -q "$fo" "$fl"
  git -C "$fl" config user.email war@test.local
  git -C "$fl" config user.name "WAR Test"
  git -C "$fl" config commit.gpgsign false
  echo "$fl $fo"
}

# run_capture <repo> <args...> : run the script ONCE with cwd=<repo>, setting
# globals CAP_OUT (combined stdout+stderr) and CAP_CODE (exit). One invocation
# matters here: a second call would hit the resume/reuse path (branch now
# exists + is owned), never re-running the create-path fetch we assert on.
run_capture() {
  d="$1"; shift
  CAP_OUT="$( ( cd "$d" && bash "$SCRIPT" "$@" ) 2>&1 )"
  CAP_CODE="$?"
}

# ---------------------------------------------------------------------------
# Case (a): local BEHIND origin -> cut the integration branch at the ORIGIN tip,
# then fast-forward the local follower ref (base checked out NOWHERE here).
# ---------------------------------------------------------------------------
FXa="$(fixture_remote)"; La="${FXa%% *}"; Oa="${FXa##* }"
git -C "$La" checkout -q --detach                     # free $FBASE (checked out nowhere)
LOCa="$(git -C "$La" rev-parse "$FBASE")"             # c0
printf 'c1\n' > "$Oa/adv.txt"; git -C "$Oa" add -A; git -C "$Oa" commit -qm c1
ORIa="$(git -C "$Oa" rev-parse "$FBASE")"             # c1 (origin ahead => local behind)
OWNa="$La/owned.txt"; : > "$OWNa"
expect "(a) behind: fixture sanity — local != origin" \
  "different" "$([ "$LOCa" != "$ORIa" ] && echo different || echo same)"
run_capture "$La" ensure-integration myplan 1 "$FBASE" --owned-file "$OWNa"
expect "(a) behind: exits 0" "0" "$CAP_CODE"
expect "(a) behind: integration cut at the ORIGIN tip" \
  "$ORIa" "$(git -C "$La" rev-parse integration/myplan/phase-1 2>/dev/null)"
expect "(a) behind: local follower fast-forwarded to the origin tip" \
  "$ORIa" "$(git -C "$La" rev-parse "$FBASE" 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case (b): local EQUAL to origin -> cut from local (== origin), nothing moves.
# ---------------------------------------------------------------------------
FXb="$(fixture_remote)"; Lb="${FXb%% *}"; Ob="${FXb##* }"
git -C "$Lb" checkout -q --detach
BASEb="$(git -C "$Lb" rev-parse "$FBASE")"            # == origin tip
OWNb="$Lb/owned.txt"; : > "$OWNb"
run_capture "$Lb" ensure-integration myplan 1 "$FBASE" --owned-file "$OWNb"
expect "(b) equal: exits 0" "0" "$CAP_CODE"
expect "(b) equal: integration at the shared tip" \
  "$BASEb" "$(git -C "$Lb" rev-parse integration/myplan/phase-1 2>/dev/null)"
expect "(b) equal: local base unchanged" \
  "$BASEb" "$(git -C "$Lb" rev-parse "$FBASE" 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case (c): local AHEAD of origin -> cut from local (origin is the stale side);
# origin left untouched, follower NOT moved.
# ---------------------------------------------------------------------------
FXc="$(fixture_remote)"; Lc="${FXc%% *}"; Oc="${FXc##* }"
printf 'c1\n' > "$Lc/adv.txt"; git -C "$Lc" add -A; git -C "$Lc" commit -qm c1
LOCc="$(git -C "$Lc" rev-parse "$FBASE")"             # ahead of origin
git -C "$Lc" checkout -q --detach
ORIc="$(git -C "$Oc" rev-parse "$FBASE")"             # still c0
OWNc="$Lc/owned.txt"; : > "$OWNc"
run_capture "$Lc" ensure-integration myplan 1 "$FBASE" --owned-file "$OWNc"
expect "(c) ahead: exits 0" "0" "$CAP_CODE"
expect "(c) ahead: integration cut from the LOCAL (ahead) tip" \
  "$LOCc" "$(git -C "$Lc" rev-parse integration/myplan/phase-1 2>/dev/null)"
expect "(c) ahead: origin left untouched" \
  "$ORIc" "$(git -C "$Oc" rev-parse "$FBASE" 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case (d): DIVERGED (local and origin each have unique commits off c0) ->
# die non-zero, NO branch created, message carries both SHAs + both repair
# directions (reconcile / push). The script never picks a side (ADR 0008).
# ---------------------------------------------------------------------------
FXd="$(fixture_remote)"; Ld="${FXd%% *}"; Od="${FXd##* }"
printf 'local\n' > "$Ld/local.txt"; git -C "$Ld" add -A; git -C "$Ld" commit -qm cy
LOCd="$(git -C "$Ld" rev-parse "$FBASE")"
git -C "$Ld" checkout -q --detach
printf 'origin\n' > "$Od/origin.txt"; git -C "$Od" add -A; git -C "$Od" commit -qm cx
ORId="$(git -C "$Od" rev-parse "$FBASE")"
OWNd="$Ld/owned.txt"; : > "$OWNd"
run_capture "$Ld" ensure-integration myplan 1 "$FBASE" --owned-file "$OWNd"
expect "(d) diverged: exits non-zero" \
  "nonzero" "$([ "$CAP_CODE" -ne 0 ] && echo nonzero || echo zero)"
expect "(d) diverged: message carries the LOCAL sha" \
  "match" "$(printf '%s' "$CAP_OUT" | grep -q "$LOCd" && echo match || echo nomatch)"
expect "(d) diverged: message carries the ORIGIN sha" \
  "match" "$(printf '%s' "$CAP_OUT" | grep -q "$ORId" && echo match || echo nomatch)"
expect "(d) diverged: message names both repair directions (reconcile + push)" \
  "match" "$(printf '%s' "$CAP_OUT" | grep -qi 'reconcile' && printf '%s' "$CAP_OUT" | grep -qi 'push' && echo match || echo nomatch)"
expect "(d) diverged: NO integration branch created" \
  "absent" "$(git -C "$Ld" rev-parse --verify -q integration/myplan/phase-1 >/dev/null 2>&1 && echo present || echo absent)"

# ---------------------------------------------------------------------------
# Case (e): fetch FAILURE via an origin URL pointing at a nonexistent path ->
# local cut + stderr warning (offline fallback = today's behavior). NOTE: this
# no-origin/fetch-fail arm is FIXTURE-ONLY in a real run — Setup's ensure-origin
# requires a pushable origin, so a live WAR run always has a reachable remote.
# ---------------------------------------------------------------------------
Re="$(new_repo)"
git -C "$Re" checkout -q -b "$FBASE"
BASEe="$(git -C "$Re" rev-parse "$FBASE")"
git -C "$Re" remote add origin "$Re/nonexistent-origin.git"   # bogus, unreachable
OWNe="$Re/owned.txt"; : > "$OWNe"
run_capture "$Re" ensure-integration myplan 1 "$FBASE" --owned-file "$OWNe"
expect "(e) fetch-fail: exits 0 (offline fallback)" "0" "$CAP_CODE"
expect "(e) fetch-fail: integration cut from the LOCAL base" \
  "$BASEe" "$(git -C "$Re" rev-parse integration/myplan/phase-1 2>/dev/null)"
expect "(e) fetch-fail: stderr warning names the fetch fallback" \
  "match" "$(printf '%s' "$CAP_OUT" | grep -qi 'could not fetch' && echo match || echo nomatch)"

# ---------------------------------------------------------------------------
# Case (f): local BEHIND origin WITH $FBASE checked out in a worktree -> the cut
# still uses the origin tip, but the follower fast-forward is SKIPPED (moving a
# checked-out ref would phantom-dirty that worktree) with a warning; the
# checkout is left untouched and clean.
# ---------------------------------------------------------------------------
FXf="$(fixture_remote)"; Lf="${FXf%% *}"; Of="${FXf##* }"
# Do NOT detach: $FBASE stays checked out in Lf's main worktree.
LOCf="$(git -C "$Lf" rev-parse "$FBASE")"             # c0
printf 'c1\n' > "$Of/adv.txt"; git -C "$Of" add -A; git -C "$Of" commit -qm c1
ORIf="$(git -C "$Of" rev-parse "$FBASE")"             # c1 (origin ahead => local behind)
OWNf="$Lf/owned.txt"; : > "$OWNf"
run_capture "$Lf" ensure-integration myplan 1 "$FBASE" --owned-file "$OWNf"
expect "(f) behind+checked-out: exits 0" "0" "$CAP_CODE"
expect "(f) behind+checked-out: integration still cut at the ORIGIN tip" \
  "$ORIf" "$(git -C "$Lf" rev-parse integration/myplan/phase-1 2>/dev/null)"
expect "(f) behind+checked-out: follower ff SKIPPED (local base not moved)" \
  "$LOCf" "$(git -C "$Lf" rev-parse "$FBASE" 2>/dev/null)"
expect "(f) behind+checked-out: warning names the skipped fast-forward" \
  "match" "$(printf '%s' "$CAP_OUT" | grep -qi 'skipping the follower fast-forward' && echo match || echo nomatch)"
# -uno: the phantom-dirty a checked-out ref move causes is a TRACKED-file
# mismatch (worktree vs the moved HEAD). Untracked files (the test's own
# owned.txt ledger) are not that signal, and -uno mirrors the script's own
# dirty-check idiom (ensure-refinery-worktree).
expect "(f) behind+checked-out: checkout not phantom-dirtied (tracked files clean)" \
  "clean" "$([ -z "$(git -C "$Lf" status --porcelain -uno 2>/dev/null)" ] && echo clean || echo dirty)"

# ===========================================================================
# servitor-learnings-write-path Task 4: ensure-publication-worktree /
# remove-publication-worktree  (End-state 5).
#
# ensure-publication-worktree <path> <working-branch> structurally mirrors
# ensure-refinery-worktree's (a)-(f) with the WORKING branch in place of the
# integration branch. remove-publication-worktree <path> is a NO-FORCE,
# dirty-guarded removal that NEVER touches the branch ref (the working branch —
# WAR's land target — must survive; a committed-but-unpushed docs commit lives
# on it).
#
# Helper: branch_checked_out_somewhere <repo> <ref> -> "yes"/"no". Porcelain scan
# for `branch refs/heads/<ref>` across all worktrees of <repo> (the same signal
# the script's branch_checked_out_anywhere uses).
branch_checked_out_somewhere() {
  if git -C "$1" worktree list --porcelain 2>/dev/null | grep -Fxq -- "branch refs/heads/$2"; then
    echo yes
  else
    echo no
  fi
}

WORKB="dev/2026-07-08-myplan"

# ---------------------------------------------------------------------------
# Case (P.1) Create-at-tip: ensure-publication-worktree checks out the working
# branch at its local tip; .war-task marker dropped; worktree HEAD symbolic-ref
# == working branch; worktree tip == working-branch tip.
# ---------------------------------------------------------------------------
RP1="$(new_repo)"
git -C "$RP1" branch "$WORKB" HEAD
TIPP1="$(git -C "$RP1" rev-parse "$WORKB")"
WTP1="$(new_wt_path)"
code="$(run_in "$RP1" ensure-publication-worktree "$WTP1" "$WORKB")"
expect "ensure-publication-worktree exits 0 on fresh create" 0 "$code"
expect "publication worktree dir exists after create" \
  "yes" "$([ -d "$WTP1" ] && echo yes || echo no)"
expect "publication .war-task marker dropped" \
  "yes" "$([ -f "$WTP1/.war-task" ] && echo yes || echo no)"
expect "publication worktree HEAD symbolic-ref == working branch" \
  "$WORKB" "$(git -C "$WTP1" symbolic-ref --short HEAD 2>/dev/null)"
expect "publication worktree listed on the working branch" \
  "$WORKB" "$(wt_on_branch "$RP1" "$WTP1")"
expect "publication worktree tip == working-branch tip" \
  "$TIPP1" "$(git -C "$WTP1" rev-parse HEAD 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case (P.2) Idempotent reuse when already on the working branch: a sentinel
# survives (no recreation).
# ---------------------------------------------------------------------------
printf 'sentinel-p2\n' > "$WTP1/SENTINEL"
code="$(run_in "$RP1" ensure-publication-worktree "$WTP1" "$WORKB")"
expect "ensure-publication-worktree reuse-on-branch exits 0" 0 "$code"
expect "reuse-on-branch: sentinel survives (no recreation)" \
  "sentinel-p2" "$(cat "$WTP1/SENTINEL" 2>/dev/null)"
expect "reuse-on-branch: still on the working branch" \
  "$WORKB" "$(wt_on_branch "$RP1" "$WTP1")"

# ---------------------------------------------------------------------------
# Case (P.3) Re-attach when detached and clean: detach HEAD (clean tree),
# re-invoke -> switch back to the working branch.
# ---------------------------------------------------------------------------
git -C "$WTP1" checkout --detach HEAD >/dev/null 2>&1
expect "P.3 setup: publication worktree is detached" \
  "(detached)" "$(wt_head_branch "$RP1" "$WTP1")"
code="$(run_in "$RP1" ensure-publication-worktree "$WTP1" "$WORKB")"
expect "ensure-publication-worktree re-attaches from detached+clean (exits 0)" 0 "$code"
expect "re-attach: worktree is now on the working branch" \
  "$WORKB" "$(wt_on_branch "$RP1" "$WTP1")"

# ---------------------------------------------------------------------------
# Case (P.4) Detached AND dirty -> FAIL LOUD, never reset. Detach + modify a
# TRACKED file (-uno dirty). Re-invoke must exit non-zero, leaving the dirty
# modification untouched.
# ---------------------------------------------------------------------------
RP4="$(new_repo)"
git -C "$RP4" branch "$WORKB" HEAD
WTP4="$(new_wt_path)"
run_in "$RP4" ensure-publication-worktree "$WTP4" "$WORKB" >/dev/null 2>&1
git -C "$WTP4" checkout --detach HEAD >/dev/null 2>&1
printf 'dirty-change\n' >> "$WTP4/seed.txt"
expect "P.4 setup: publication worktree is detached" \
  "(detached)" "$(wt_head_branch "$RP4" "$WTP4")"
expect "P.4 setup: worktree is dirty (tracked-file modification)" \
  "dirty" "$([ -n "$(git -C "$WTP4" status --porcelain -uno 2>/dev/null)" ] && echo dirty || echo clean)"
code="$(run_in "$RP4" ensure-publication-worktree "$WTP4" "$WORKB")"
expect "ensure-publication-worktree detached+dirty fails loud (exits non-zero)" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
expect "detached+dirty: worktree tree still dirty (modification not lost)" \
  "dirty" "$([ -n "$(git -C "$WTP4" status --porcelain -uno 2>/dev/null)" ] && echo dirty || echo clean)"

# ---------------------------------------------------------------------------
# Case (P.5) Non-empty unregistered dir -> fail loud (D7).
# ---------------------------------------------------------------------------
RP5="$(new_repo)"
git -C "$RP5" branch "$WORKB" HEAD
WTP5="$(new_wt_path)"
mkdir -p "$WTP5"
printf 'precious publication data\n' > "$WTP5/PRECIOUS"
code="$(run_in "$RP5" ensure-publication-worktree "$WTP5" "$WORKB")"
expect "ensure-publication-worktree non-empty unregistered dir fails loud" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
expect "non-empty unregistered dir: precious file NOT deleted" \
  "yes" "$([ -f "$WTP5/PRECIOUS" ] && echo yes || echo no)"

# ---------------------------------------------------------------------------
# Case (P.6) remove-publication-worktree on a CLEAN worktree: succeeds, the
# worktree is gone from the list, the working branch is checked out NOWHERE, and
# the branch ref is left intact (rev-parse still resolves — the land target must
# survive).
# ---------------------------------------------------------------------------
RP6="$(new_repo)"
git -C "$RP6" branch "$WORKB" HEAD
BRSHA6="$(git -C "$RP6" rev-parse "$WORKB")"
WTP6="$(new_wt_path)"
run_in "$RP6" ensure-publication-worktree "$WTP6" "$WORKB" >/dev/null 2>&1
expect "P.6 setup: working branch checked out in the publication worktree" \
  "yes" "$(branch_checked_out_somewhere "$RP6" "$WORKB")"
code="$(run_in "$RP6" remove-publication-worktree "$WTP6")"
expect "remove-publication-worktree (clean) exits 0" 0 "$code"
expect "remove clean: worktree gone from git worktree list" \
  "" "$(wt_on_branch "$RP6" "$WTP6")"
expect "remove clean: worktree dir removed" \
  "no" "$([ -d "$WTP6" ] && echo yes || echo no)"
expect "remove clean: working branch checked out NOWHERE" \
  "no" "$(branch_checked_out_somewhere "$RP6" "$WORKB")"
expect "remove clean: branch ref left INTACT (rev-parse still resolves)" \
  "$BRSHA6" "$(git -C "$RP6" rev-parse "$WORKB" 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case (P.7) remove-publication-worktree on a DIRTY worktree: dies non-zero with
# a never-force message; the worktree and the branch ref are left intact.
# ---------------------------------------------------------------------------
RP7="$(new_repo)"
git -C "$RP7" branch "$WORKB" HEAD
BRSHA7="$(git -C "$RP7" rev-parse "$WORKB")"
WTP7="$(new_wt_path)"
run_in "$RP7" ensure-publication-worktree "$WTP7" "$WORKB" >/dev/null 2>&1
printf 'uncommitted-work\n' >> "$WTP7/seed.txt"    # tracked-file modification
expect "P.7 setup: worktree is dirty (tracked-file modification)" \
  "dirty" "$([ -n "$(git -C "$WTP7" status --porcelain -uno 2>/dev/null)" ] && echo dirty || echo clean)"
code="$(run_in "$RP7" remove-publication-worktree "$WTP7")"
expect "remove-publication-worktree (dirty) exits non-zero" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
msg="$(run_in_msg "$RP7" remove-publication-worktree "$WTP7")"
expect "remove dirty: refusal carries a never-force message" \
  "match" "$(printf '%s' "$msg" | grep -qiE 'never force|refusing to remove' && echo match || echo nomatch)"
expect "remove dirty: worktree dir intact" \
  "yes" "$([ -d "$WTP7" ] && echo yes || echo no)"
expect "remove dirty: worktree still on the working branch" \
  "$WORKB" "$(wt_on_branch "$RP7" "$WTP7")"
expect "remove dirty: branch ref left INTACT" \
  "$BRSHA7" "$(git -C "$RP7" rev-parse "$WORKB" 2>/dev/null)"

# ===========================================================================
# Task 1.4 — (E) exit-code catalogue, (F) ensure-exclude <repo-dir>,
#            (G) --reclaim-empty-orphan. End states 5, 6, 7 with delete-and-trace.
# ===========================================================================

# ---------------------------------------------------------------------------
# End state 5 (E): structural grep assertion — every coded `die` uses an EX_*
# constant; NO `die "…" <numeric-literal>` survives outside the catalogue
# definitions. Delete-and-trace: reverting any conversion back to a bare number
# re-introduces a `die "…" <n>` line and fails this assertion.
# ---------------------------------------------------------------------------
n=$((n + 1))
# A `die` whose LAST token before EOL is a bare integer (the exit code). The
# catalogue lines themselves are `readonly EX_*=<n>`, never `die "…" <n>`, and
# the doc comment's example is `die "…" 3` INSIDE a comment (leading `#`), so
# anchor the match to a real statement: a line whose first non-space is `die`
# or `|| die` (never `#`).
BARE_CODED_DIE="$(grep -nE '^[[:space:]]*(\|\| )?die "[^"]*" [0-9]+[[:space:]]*$' "$SCRIPT" || true)"
if [ -z "$BARE_CODED_DIE" ]; then
  printf 'ok %d - E: no coded die uses a bare numeric-literal exit (all catalogued)\n' "$n"
else
  printf 'FAIL %d - E: bare numeric-literal die(s) survive outside the catalogue:\n%s\n' "$n" "$BARE_CODED_DIE"
  fails=$((fails + 1))
fi

# The catalogue names codes 3/4/5/6/7/8 as readonly EX_* constants.
for pair in EX_FOREIGN=3 EX_DIRTY_UNREG=4 EX_OUT_OF_RUN=5 EX_WRONG_BRANCH=6 EX_DIVERGED=7 EX_STALE_REMOTE=8; do
  n=$((n + 1))
  if grep -qE "^readonly $pair\$" "$SCRIPT"; then
    printf 'ok %d - E: catalogue defines readonly %s\n' "$n" "$pair"
  else
    printf 'FAIL %d - E: catalogue missing readonly %s\n' "$n" "$pair"
    fails=$((fails + 1))
  fi
done

# At least one coded die actually references each constant (they are wired, not
# just declared) and the "any non-zero = halt" surfacing contract is documented.
n=$((n + 1))
if grep -qE 'die "[^"]*" "\$EX_FOREIGN"' "$SCRIPT"; then
  printf 'ok %d - E: coded die references $EX_FOREIGN (catalogue wired)\n' "$n"
else
  printf 'FAIL %d - E: no die references $EX_FOREIGN — catalogue declared but unwired\n' "$n"
  fails=$((fails + 1))
fi
n=$((n + 1))
if grep -qiE 'any non-zero.*halt' "$SCRIPT"; then
  printf 'ok %d - E: "any non-zero = halt" surfacing contract documented\n' "$n"
else
  printf 'FAIL %d - E: surfacing contract ("any non-zero = halt") not documented\n' "$n"
  fails=$((fails + 1))
fi

# ---------------------------------------------------------------------------
# End state 6 (F): ensure-exclude <repo-dir> invoked from a DIFFERENT cwd writes
# the exclude into <repo-dir>'s git dir; the no-arg form is byte-identical (Case
# 3 above already covers no-arg). Delete-and-trace: without the positional arg
# the exclude would land in the caller's cwd git dir (or die: not a git repo).
# ---------------------------------------------------------------------------
REX="$(new_repo)"
REX_EXCL="$REX/.git/info/exclude"
# A different, unrelated cwd (a plain temp dir, NOT inside REX). Registered for
# cleanup via new_wt_path's parent trick — reuse new_repo so it is a valid cwd
# that is definitely not REX.
OTHERCWD="$(new_repo)"
code="$( ( cd "$OTHERCWD" && bash "$SCRIPT" ensure-exclude "$REX" ); echo $? )"
expect "ensure-exclude <repo-dir> from a different cwd exits 0" 0 "$code"
expect "ensure-exclude <repo-dir>: exclude lands in <repo-dir>'s git dir (.claude/ line)" \
  "1" "$(grep -c '^\.claude/$' "$REX_EXCL" 2>/dev/null || echo 0)"
# It must NOT have written into the caller's cwd git dir. (grep -c prints 0 AND
# exits 1 on no match, so tail -1 normalizes the count without a spurious echo.)
expect "ensure-exclude <repo-dir>: caller-cwd exclude NOT written" \
  "0" "$(grep -c '^\.claude/$' "$OTHERCWD/.git/info/exclude" 2>/dev/null | tail -1)"
# Idempotent from the different cwd, too.
( cd "$OTHERCWD" && bash "$SCRIPT" ensure-exclude "$REX" ) >/dev/null 2>&1
expect "ensure-exclude <repo-dir> is idempotent (still exactly one .claude/ line)" \
  "1" "$(grep -c '^\.claude/$' "$REX_EXCL" 2>/dev/null || echo 0)"

# ---------------------------------------------------------------------------
# End state 7 (G): --reclaim-empty-orphan two-proof self-heal.
#   (7a) PROVEN-EMPTY + origin-absent orphan -> deleted and re-cut (exit 0,
#        now recorded as owned — proving the CREATE path ran, not reuse).
#   (7b) one UNIQUE commit ahead of base -> exit EX_FOREIGN(3), NOT deleted.
#   (7c) present on ORIGIN -> exit 3, NOT deleted.
#   (7d) flag ABSENT -> exit 3, byte-identical default (no delete).
# Delete-and-trace: reverting the reclaim branch makes (7a) exit 3 (foreign die).
# ---------------------------------------------------------------------------
# (7a) empty orphan, no origin, unowned -> reclaim succeeds.
R7A="$(new_repo)"
TIP7A="$(git -C "$R7A" rev-parse HEAD)"
OWN7A="$R7A/owned.txt"; : > "$OWN7A"              # empty ledger: orphan is unowned
git -C "$R7A" branch integration/myplan/phase-1 "$TIP7A"   # out-of-band orphan == base tip
# Single invocation: reclaim mutates state (records ownership), so a second run
# would hit the owned-reuse path and emit no reclaim log — capture code + output
# together from the ONE run.
OUT7A="$( ( cd "$R7A" && bash "$SCRIPT" ensure-integration myplan 1 "$TIP7A" --owned-file "$OWN7A" --reclaim-empty-orphan ) 2>&1 )"; C7A=$?
expect "7a: --reclaim-empty-orphan on a proven-empty origin-absent orphan exits 0" 0 "$C7A"
expect "7a: reclaim logs the proof (deleting and re-cutting)" \
  "match" "$(printf '%s' "$OUT7A" | grep -qi 'reclaim' && echo match || echo nomatch)"
expect "7a: branch re-cut and now RECORDED AS OWNED (create path ran, not reuse)" \
  "1" "$(grep -c '^integration/myplan/phase-1$' "$OWN7A" 2>/dev/null || echo 0)"
expect "7a: integration branch still exists after reclaim" \
  "0" "$(git -C "$R7A" rev-parse --verify -q integration/myplan/phase-1 >/dev/null 2>&1; echo $?)"

# (7b) orphan with a UNIQUE commit ahead of base -> refuse, exit 3, not deleted.
R7B="$(new_repo)"
TIP7B="$(git -C "$R7B" rev-parse HEAD)"
OWN7B="$R7B/owned.txt"; : > "$OWN7B"
# Build a commit whose parent is the base tip WITHOUT checking out (plumbing).
TREE7B="$(git -C "$R7B" rev-parse 'HEAD^{tree}')"
UNIQ7B="$(printf 'unique orphan commit\n' | git -C "$R7B" commit-tree "$TREE7B" -p "$TIP7B")"
git -C "$R7B" branch integration/myplan/phase-1 "$UNIQ7B"
code="$(run_in "$R7B" ensure-integration myplan 1 "$TIP7B" --owned-file "$OWN7B" --reclaim-empty-orphan)"
expect "7b: orphan with a unique commit refuses reclaim (exit 3 EX_FOREIGN)" 3 "$code"
expect "7b: orphan with a unique commit is NOT deleted (still at UNIQ)" \
  "$UNIQ7B" "$(git -C "$R7B" rev-parse integration/myplan/phase-1 2>/dev/null)"

# (7c) orphan empty locally but PRESENT ON ORIGIN -> refuse, exit 3, not deleted.
R7C="$(new_repo)"
TIP7C="$(git -C "$R7C" rev-parse HEAD)"
OWN7C="$R7C/owned.txt"; : > "$OWN7C"
BARE7C="$(mktemp -d 2>/dev/null || mktemp -d -t warbare)"; REPOS="$REPOS $BARE7C"
git init -q --bare "$BARE7C"
git -C "$R7C" remote add origin "$BARE7C"
git -C "$R7C" branch integration/myplan/phase-1 "$TIP7C"      # empty vs base
git -C "$R7C" push -q origin integration/myplan/phase-1        # publish it
code="$(run_in "$R7C" ensure-integration myplan 1 "$TIP7C" --owned-file "$OWN7C" --reclaim-empty-orphan)"
expect "7c: empty orphan PRESENT ON ORIGIN refuses reclaim (exit 3)" 3 "$code"
expect "7c: origin-present orphan is NOT deleted (still resolves)" \
  "0" "$(git -C "$R7C" rev-parse --verify -q integration/myplan/phase-1 >/dev/null 2>&1; echo $?)"

# (7d) NO flag on an empty unowned orphan -> byte-identical foreign die, exit 3.
R7D="$(new_repo)"
TIP7D="$(git -C "$R7D" rev-parse HEAD)"
OWN7D="$R7D/owned.txt"; : > "$OWN7D"
git -C "$R7D" branch integration/myplan/phase-1 "$TIP7D"
code="$(run_in "$R7D" ensure-integration myplan 1 "$TIP7D" --owned-file "$OWN7D")"
expect "7d: no --reclaim flag on an unowned orphan exits 3 (byte-identical default)" 3 "$code"
expect "7d: no-flag orphan is left untouched (not deleted)" \
  "0" "$(git -C "$R7D" rev-parse --verify -q integration/myplan/phase-1 >/dev/null 2>&1; echo $?)"

# (7e) reclaim with an UNRESOLVABLE base -> proof 0 dies EX_FOREIGN(3); the orphan
# tip is UNCHANGED (a git error is NEVER read as "proven empty", #728). Survey
# note: the (7a)-(7d) case comments describe the two-proof self-heal, none
# describe the old swallowed-error behavior, so no straggler comment to correct.
R7E="$(new_repo)"
TIP7E="$(git -C "$R7E" rev-parse HEAD)"
OWN7E="$R7E/owned.txt"; : > "$OWN7E"
git -C "$R7E" branch integration/myplan/phase-1 "$TIP7E"      # out-of-band orphan (unowned)
ORPHAN7E="$(git -C "$R7E" rev-parse integration/myplan/phase-1)"
code="$(run_in "$R7E" ensure-integration myplan 1 nonexistent-base-ZZZ --owned-file "$OWN7E" --reclaim-empty-orphan)"
expect "7e: reclaim with an UNRESOLVABLE base exits 3 (EX_FOREIGN, #728)" 3 "$code"
expect "7e: orphan tip UNCHANGED after refused reclaim (git error never 'proven empty')" \
  "$ORPHAN7E" "$(git -C "$R7E" rev-parse integration/myplan/phase-1 2>/dev/null)"
msg="$(run_in_msg "$R7E" ensure-integration myplan 1 nonexistent-base-ZZZ --owned-file "$OWN7E" --reclaim-empty-orphan)"
expect "7e: refusal names the unresolvable base (proof 0)" \
  "match" "$(printf '%s' "$msg" | grep -qi 'does not resolve\|unresolvable' && echo match || echo nomatch)"

# ===========================================================================
# Partial-phase recovery mechanics (§4.1 record-as-owned, §4.4 stale-remote,
# §4.6 sync-follower, §4.7 origin-fallback). One fresh repo/fixture per case.
# ===========================================================================

# new_bare -> echoes a fresh bare repo dir (registered for cleanup), usable as a
# file-path origin. Mirrors the fixture-remote idiom (bash-3.2-safe, cwd-indep).
new_bare() {
  b="$(mktemp -d 2>/dev/null || mktemp -d -t warbare)"; REPOS="$REPOS $b"
  git init -q --bare "$b"; echo "$b"
}

# --- §4.1 record-as-owned --------------------------------------------------
# Build an orphan integration branch two commits ahead of the frozen base
# (plumbing commit-tree, no checkout) — the observed held-partial-phase shape.
RRA="$(new_repo)"
BASE_RA="$(git -C "$RRA" rev-parse HEAD)"
TREE_RA="$(git -C "$RRA" rev-parse 'HEAD^{tree}')"
C1_RA="$(printf 'merged task one\n' | git -C "$RRA" commit-tree "$TREE_RA" -p "$BASE_RA")"
ORPHAN_RA="$(printf 'merged task two\n' | git -C "$RRA" commit-tree "$TREE_RA" -p "$C1_RA")"
git -C "$RRA" branch integration/myplan/phase-1 "$ORPHAN_RA"
OWN_RA="$RRA/.claude/teams/run-x/owned.txt"          # ledger dir does NOT exist yet
OUT_RA="$( ( cd "$RRA" && bash "$SCRIPT" record-as-owned integration/myplan/phase-1 "$BASE_RA" --owned-file "$OWN_RA" ) 2>&1 )"; C_RA=$?
expect "record-as-owned: accepts a descendant orphan (exit 0)" 0 "$C_RA"
expect "record-as-owned: prints the ahead-commits (proof 2)" \
  "match" "$(printf '%s' "$OUT_RA" | grep -qi 'merged task two' && echo match || echo nomatch)"
expect "record-as-owned: appends exactly one ledger line" \
  "1" "$(grep -c '^integration/myplan/phase-1$' "$OWN_RA" 2>/dev/null || echo 0)"
expect "record-as-owned: moved NO ref (orphan tip unchanged)" \
  "$ORPHAN_RA" "$(git -C "$RRA" rev-parse integration/myplan/phase-1 2>/dev/null)"
expect "record-as-owned: created the ledger dir/file when absent" \
  "yes" "$([ -f "$OWN_RA" ] && echo yes || echo no)"
# Idempotent re-run: no-op exit 0, ledger still one line.
C_RA2="$(run_in "$RRA" record-as-owned integration/myplan/phase-1 "$BASE_RA" --owned-file "$OWN_RA")"
expect "record-as-owned: idempotent re-run is a no-op (exit 0)" 0 "$C_RA2"
expect "record-as-owned: ledger still has exactly one line after re-run" \
  "1" "$(grep -c '^integration/myplan/phase-1$' "$OWN_RA" 2>/dev/null || echo 0)"
# After adoption, ensure-integration for the same slug/N takes the owned-reuse
# path — prints the branch, tip unchanged, no re-cut.
code="$(run_in "$RRA" ensure-integration myplan 1 "$BASE_RA" --owned-file "$OWN_RA")"
expect "record-as-owned: ensure-integration then REUSES the adopted branch (exit 0)" 0 "$code"
expect "record-as-owned: adopted branch tip UNCHANGED after ensure-integration reuse" \
  "$ORPHAN_RA" "$(git -C "$RRA" rev-parse integration/myplan/phase-1 2>/dev/null)"
expect "record-as-owned: ensure-integration reuse prints the adopted branch" \
  "integration/myplan/phase-1" "$(run_out "$RRA" ensure-integration myplan 1 "$BASE_RA" --owned-file "$OWN_RA")"

# Non-descendant refuse: a branch rooted elsewhere (a parentless commit) — <base>
# is NOT its ancestor -> exit 3, ledger unchanged.
RRB="$(new_repo)"
BASE_RB="$(git -C "$RRB" rev-parse HEAD)"
TREE_RB="$(git -C "$RRB" rev-parse 'HEAD^{tree}')"
FOREIGN_RB="$(printf 'foreign root\n' | git -C "$RRB" commit-tree "$TREE_RB")"   # no -p => root, not a descendant
git -C "$RRB" branch integration/myplan/phase-1 "$FOREIGN_RB"
OWN_RB="$RRB/owned.txt"; : > "$OWN_RB"
code="$(run_in "$RRB" record-as-owned integration/myplan/phase-1 "$BASE_RB" --owned-file "$OWN_RB")"
expect "record-as-owned: refuses a NON-descendant branch (exit 3)" 3 "$code"
expect "record-as-owned: non-descendant refusal leaves the ledger unchanged (empty)" \
  "0" "$(wc -l < "$OWN_RB" | tr -d ' ')"
expect "record-as-owned: non-descendant refusal moved no ref (orphan tip intact)" \
  "$FOREIGN_RB" "$(git -C "$RRB" rev-parse integration/myplan/phase-1 2>/dev/null)"

# Unresolvable-ref refuse: an unresolvable <branch>, and an unresolvable <base>.
RRC="$(new_repo)"
BASE_RC="$(git -C "$RRC" rev-parse HEAD)"
OWN_RC="$RRC/owned.txt"; : > "$OWN_RC"
code="$(run_in "$RRC" record-as-owned nonexistent-branch-ZZZ "$BASE_RC" --owned-file "$OWN_RC")"
expect "record-as-owned: refuses an unresolvable BRANCH ref (exit 3)" 3 "$code"
git -C "$RRC" branch integration/myplan/phase-1 "$BASE_RC"
code="$(run_in "$RRC" record-as-owned integration/myplan/phase-1 nonexistent-base-ZZZ --owned-file "$OWN_RC")"
expect "record-as-owned: refuses an unresolvable BASE ref (exit 3)" 3 "$code"
expect "record-as-owned: unresolvable-ref refusals left the ledger unchanged" \
  "0" "$(wc -l < "$OWN_RC" | tr -d ' ')"

# --- §4.4 ensure-worktree stale-remote probe (#650) ------------------------
# Fixture: origin (bare) carries a task branch NOT an ancestor of the frozen tip
# (a stale prior attempt), and NO local task branch exists (fresh-cut shape).
Lsr="$(new_repo)"; Osr="$(new_bare)"
git -C "$Lsr" remote add origin "$Osr"
git -C "$Lsr" branch integration/myplan/phase-1 HEAD
TIP_SR="$(git -C "$Lsr" rev-parse integration/myplan/phase-1)"
TREE_SR="$(git -C "$Lsr" rev-parse 'HEAD^{tree}')"
STALE_SR="$(printf 'stale prior attempt\n' | git -C "$Lsr" commit-tree "$TREE_SR")"   # root commit, not an ancestor of TIP
git -C "$Lsr" push -q origin "$STALE_SR:refs/heads/war/myplan/p1-t9"
WT_SR="$(new_wt_path)"
OUT_SR="$( ( cd "$Lsr" && bash "$SCRIPT" ensure-worktree "$WT_SR" war/myplan/p1-t9 "$TIP_SR" ) 2>&1 )"; C_SR=$?
expect "stale-remote: non-ancestor remote dies EX_STALE_REMOTE (exit 8)" 8 "$C_SR"
expect "stale-remote: diagnostic carries the STALE_REMOTE marker" \
  "match" "$(printf '%s' "$OUT_SR" | grep -q 'STALE_REMOTE' && echo match || echo nomatch)"
expect "stale-remote: marker carries the remote SHA" \
  "match" "$(printf '%s' "$OUT_SR" | grep -q "remoteSha=$STALE_SR" && echo match || echo nomatch)"
expect "stale-remote: marker carries the frozen tip" \
  "match" "$(printf '%s' "$OUT_SR" | grep -q "frozenTip=$TIP_SR" && echo match || echo nomatch)"
expect "stale-remote: diagnostic carries the restore command" \
  "match" "$(printf '%s' "$OUT_SR" | grep -q "git push origin $STALE_SR:refs/heads/war/myplan/p1-t9" && echo match || echo nomatch)"
expect "stale-remote: names both recovery directions (adopt via git branch + --reclaim-stale-remote)" \
  "match" "$(printf '%s' "$OUT_SR" | grep -q 'git branch war/myplan/p1-t9' && printf '%s' "$OUT_SR" | grep -q 'reclaim-stale-remote' && echo match || echo nomatch)"
expect "stale-remote: NO worktree created on the die" \
  "no" "$([ -d "$WT_SR" ] && echo yes || echo no)"
expect "stale-remote: NO local task branch created on the die" \
  "no" "$(branch_exists_in "$Lsr" war/myplan/p1-t9)"
expect "stale-remote: remote ref left intact on the die (not deleted)" \
  "1" "$(git -C "$Lsr" ls-remote origin refs/heads/war/myplan/p1-t9 | grep -c .)"

# ANCESTOR remote -> warn and proceed (already-integrated work; nothing deleted).
Lan="$(new_repo)"; Oan="$(new_bare)"
git -C "$Lan" remote add origin "$Oan"
OLD_AN="$(git -C "$Lan" rev-parse HEAD)"
git -C "$Lan" push -q origin "$OLD_AN:refs/heads/war/myplan/p1-t8"    # remote at the OLD tip
printf 'adv\n' > "$Lan/adv.txt"; git -C "$Lan" add -A; git -C "$Lan" commit -qm adv
git -C "$Lan" branch integration/myplan/phase-1 HEAD
TIP_AN="$(git -C "$Lan" rev-parse integration/myplan/phase-1)"        # ahead of OLD_AN
WT_AN="$(new_wt_path)"
C_AN="$(run_in "$Lan" ensure-worktree "$WT_AN" war/myplan/p1-t8 "$TIP_AN")"
expect "stale-remote: ANCESTOR remote warns and proceeds (exit 0, fresh cut)" 0 "$C_AN"
expect "stale-remote: ancestor case created the worktree on the branch" \
  "war/myplan/p1-t8" "$(wt_on_branch "$Lan" "$WT_AN")"
expect "stale-remote: ancestor remote NOT deleted" \
  "1" "$(git -C "$Lan" ls-remote origin refs/heads/war/myplan/p1-t8 | grep -c .)"
# --reclaim-stale-remote is INERT on an ancestor remote (the probe warns+proceeds
# before the flag is ever consulted; nothing deleted — end state 6).
Lai="$(new_repo)"; Oai="$(new_bare)"
git -C "$Lai" remote add origin "$Oai"
OLD_AI="$(git -C "$Lai" rev-parse HEAD)"
git -C "$Lai" push -q origin "$OLD_AI:refs/heads/war/myplan/p1-t4"
printf 'adv\n' > "$Lai/adv.txt"; git -C "$Lai" add -A; git -C "$Lai" commit -qm adv
git -C "$Lai" branch integration/myplan/phase-1 HEAD
TIP_AI="$(git -C "$Lai" rev-parse integration/myplan/phase-1)"
WT_AI="$(new_wt_path)"
C_AI="$(run_in "$Lai" ensure-worktree "$WT_AI" war/myplan/p1-t4 "$TIP_AI" --reclaim-stale-remote)"
expect "stale-remote: reclaim flag INERT on an ancestor remote (exit 0)" 0 "$C_AI"
expect "stale-remote: reclaim flag + ancestor remote deletes NOTHING" \
  "1" "$(git -C "$Lai" ls-remote origin refs/heads/war/myplan/p1-t4 | grep -c .)"

# --reclaim-stale-remote on the stale shape: delete the remote + cut fresh.
Lrc="$(new_repo)"; Orc="$(new_bare)"
git -C "$Lrc" remote add origin "$Orc"
git -C "$Lrc" branch integration/myplan/phase-1 HEAD
TIP_RC="$(git -C "$Lrc" rev-parse integration/myplan/phase-1)"
TREE_RC="$(git -C "$Lrc" rev-parse 'HEAD^{tree}')"
STALE_RC="$(printf 'superseded attempt\n' | git -C "$Lrc" commit-tree "$TREE_RC")"
git -C "$Lrc" push -q origin "$STALE_RC:refs/heads/war/myplan/p1-t7"
WT_RC="$(new_wt_path)"
OUT_RC="$( ( cd "$Lrc" && bash "$SCRIPT" ensure-worktree "$WT_RC" war/myplan/p1-t7 "$TIP_RC" --reclaim-stale-remote ) 2>&1 )"; C_RC=$?
expect "stale-remote reclaim: exits 0 (deleted + cut fresh)" 0 "$C_RC"
expect "stale-remote reclaim: warn carries the deleted SHA" \
  "match" "$(printf '%s' "$OUT_RC" | grep -q "$STALE_RC" && echo match || echo nomatch)"
expect "stale-remote reclaim: warn carries the restore command" \
  "match" "$(printf '%s' "$OUT_RC" | grep -q "git push origin $STALE_RC:refs/heads/war/myplan/p1-t7" && echo match || echo nomatch)"
expect "stale-remote reclaim: remote ref DELETED from origin" \
  "0" "$(git -C "$Lrc" ls-remote origin refs/heads/war/myplan/p1-t7 | grep -c .)"
expect "stale-remote reclaim: fresh worktree created" \
  "war/myplan/p1-t7" "$(wt_on_branch "$Lrc" "$WT_RC")"
expect "stale-remote reclaim: local branch cut at the frozen tip" \
  "$TIP_RC" "$(git -C "$Lrc" rev-parse war/myplan/p1-t7 2>/dev/null)"

# Flag INERT when a LOCAL ref exists (the reuse/existing-branch path owns it).
Lin="$(new_repo)"; Oin="$(new_bare)"
git -C "$Lin" remote add origin "$Oin"
git -C "$Lin" branch integration/myplan/phase-1 HEAD
TIP_IN="$(git -C "$Lin" rev-parse integration/myplan/phase-1)"
TREE_IN="$(git -C "$Lin" rev-parse 'HEAD^{tree}')"
STALE_IN="$(printf 'stale but local present\n' | git -C "$Lin" commit-tree "$TREE_IN")"
git -C "$Lin" push -q origin "$STALE_IN:refs/heads/war/myplan/p1-t6"
git -C "$Lin" branch war/myplan/p1-t6 "$TIP_IN"                       # LOCAL ref present
WT_IN="$(new_wt_path)"
C_IN="$(run_in "$Lin" ensure-worktree "$WT_IN" war/myplan/p1-t6 "$TIP_IN" --reclaim-stale-remote)"
expect "stale-remote: flag INERT when a local ref exists (exit 0)" 0 "$C_IN"
expect "stale-remote: flag inert leaves the remote ref intact (reuse path owns it)" \
  "1" "$(git -C "$Lin" ls-remote origin refs/heads/war/myplan/p1-t6 | grep -c .)"

# Flag REFUSES a non-war-namespace branch (proof 1) — no deletion.
Lns="$(new_repo)"; Ons="$(new_bare)"
git -C "$Lns" remote add origin "$Ons"
git -C "$Lns" branch integration/myplan/phase-1 HEAD
TIP_NS="$(git -C "$Lns" rev-parse integration/myplan/phase-1)"
TREE_NS="$(git -C "$Lns" rev-parse 'HEAD^{tree}')"
STALE_NS="$(printf 'stale non-namespace\n' | git -C "$Lns" commit-tree "$TREE_NS")"
git -C "$Lns" push -q origin "$STALE_NS:refs/heads/notwar/foo"
WT_NS="$(new_wt_path)"
code="$(run_in "$Lns" ensure-worktree "$WT_NS" notwar/foo "$TIP_NS" --reclaim-stale-remote)"
expect "stale-remote reclaim: refuses a non-war-namespace branch (exit 3)" 3 "$code"
expect "stale-remote reclaim: non-namespace refusal did NOT delete the remote" \
  "1" "$(git -C "$Lns" ls-remote origin refs/heads/notwar/foo | grep -c .)"

# UNREACHABLE remote on a fresh cut -> warn and proceed (fail-open by design).
Lur="$(new_repo)"
git -C "$Lur" remote add origin "$Lur/nonexistent-origin.git"        # bogus, unreachable
git -C "$Lur" branch integration/myplan/phase-1 HEAD
TIP_UR="$(git -C "$Lur" rev-parse integration/myplan/phase-1)"
WT_UR="$(new_wt_path)"
OUT_UR="$( ( cd "$Lur" && bash "$SCRIPT" ensure-worktree "$WT_UR" war/myplan/p1-t5 "$TIP_UR" ) 2>&1 )"; C_UR=$?
expect "stale-remote: UNREACHABLE remote warns and proceeds (exit 0, fail-open)" 0 "$C_UR"
expect "stale-remote: unreachable-remote warn names the fail-open probe" \
  "match" "$(printf '%s' "$OUT_UR" | grep -qi 'could not probe origin' && echo match || echo nomatch)"
expect "stale-remote: unreachable-remote still created the worktree" \
  "war/myplan/p1-t5" "$(wt_on_branch "$Lur" "$WT_UR")"

# --- §4.6 sync-follower (#731 residual) ------------------------------------
# equal -> exit 0.
Fse="$(fixture_remote)"; Lse="${Fse%% *}"; Ose="${Fse##* }"
git -C "$Lse" checkout -q --detach
code="$(run_in "$Lse" sync-follower "$FBASE")"
expect "sync-follower: local == origin exits 0" 0 "$code"

# behind, not checked out -> guarded CAS fast-forward to the origin tip.
# The origin commit must be a LOCAL object for the ancestry check — exactly the
# production reality (sync-follower runs in the just-landed repo, whose merge
# commit is local before the follower CAS). The fetch models that; it updates
# FETCH_HEAD / remote-tracking, never refs/heads/<branch> (the follower lag).
Fsb="$(fixture_remote)"; Lsb="${Fsb%% *}"; Osb="${Fsb##* }"
git -C "$Lsb" checkout -q --detach
printf 'c1\n' > "$Osb/adv.txt"; git -C "$Osb" add -A; git -C "$Osb" commit -qm c1
ORI_SB="$(git -C "$Osb" rev-parse "$FBASE")"
git -C "$Lsb" fetch -q origin "$FBASE"
code="$(run_in "$Lsb" sync-follower "$FBASE")"
expect "sync-follower: local BEHIND (not checked out) fast-forwards (exit 0)" 0 "$code"
expect "sync-follower: follower advanced to the origin tip" \
  "$ORI_SB" "$(git -C "$Lsb" rev-parse "$FBASE" 2>/dev/null)"

# behind BUT checked out somewhere -> warn, still exit 0, follower NOT moved.
Fsc="$(fixture_remote)"; Lsc="${Fsc%% *}"; Osc="${Fsc##* }"
LOC_SC="$(git -C "$Lsc" rev-parse "$FBASE")"                          # $FBASE stays checked out
printf 'c1\n' > "$Osc/adv.txt"; git -C "$Osc" add -A; git -C "$Osc" commit -qm c1
git -C "$Lsc" fetch -q origin "$FBASE"                                # origin commit local (post-land reality)
code="$(run_in "$Lsc" sync-follower "$FBASE")"
expect "sync-follower: behind + checked-out warns, still exit 0" 0 "$code"
expect "sync-follower: checked-out follower NOT moved" \
  "$LOC_SC" "$(git -C "$Lsc" rev-parse "$FBASE" 2>/dev/null)"
msg="$(run_in_msg "$Lsc" sync-follower "$FBASE")"
expect "sync-follower: checked-out warn names the skipped fast-forward" \
  "match" "$(printf '%s' "$msg" | grep -qi 'skipping the follower fast-forward' && echo match || echo nomatch)"

# local ABSENT -> create the follower at the origin tip.
Fsl="$(fixture_remote)"; Lsl="${Fsl%% *}"; Osl="${Fsl##* }"
git -C "$Lsl" checkout -q --detach
git -C "$Lsl" branch -D "$FBASE"                                     # remove the local follower
ORI_SL="$(git -C "$Osl" rev-parse "$FBASE")"
code="$(run_in "$Lsl" sync-follower "$FBASE")"
expect "sync-follower: local ABSENT creates the follower at the origin tip (exit 0)" 0 "$code"
expect "sync-follower: created follower points at the origin tip" \
  "$ORI_SL" "$(git -C "$Lsl" rev-parse "$FBASE" 2>/dev/null)"

# diverged -> exit 7 (EX_DIVERGED), both SHAs in the message, no ref moved. Both
# tips are local objects (fetch brings the origin-only commit in) so this is a
# REAL divergence, not an object-missing artifact.
Fsd="$(fixture_remote)"; Lsd="${Fsd%% *}"; Osd="${Fsd##* }"
printf 'c1o\n' > "$Osd/o.txt"; git -C "$Osd" add -A; git -C "$Osd" commit -qm c1o
ORI_SD="$(git -C "$Osd" rev-parse "$FBASE")"
printf 'c1l\n' > "$Lsd/l.txt"; git -C "$Lsd" add -A; git -C "$Lsd" commit -qm c1l
LOC_SD="$(git -C "$Lsd" rev-parse "$FBASE")"
git -C "$Lsd" checkout -q --detach
git -C "$Lsd" fetch -q origin "$FBASE"                               # origin-only commit now local
code="$(run_in "$Lsd" sync-follower "$FBASE")"
expect "sync-follower: diverged exits 7 (EX_DIVERGED)" 7 "$code"
expect "sync-follower: diverged did NOT move the local ref" \
  "$LOC_SD" "$(git -C "$Lsd" rev-parse "$FBASE" 2>/dev/null)"
msg="$(run_in_msg "$Lsd" sync-follower "$FBASE")"
expect "sync-follower: diverged message carries both SHAs" \
  "match" "$(printf '%s' "$msg" | grep -q "$LOC_SD" && printf '%s' "$msg" | grep -q "$ORI_SD" && echo match || echo nomatch)"

# origin ref ABSENT -> die with the "nothing landed to origin" hint.
Fso="$(new_repo)"; Ooo="$(new_bare)"
git -C "$Fso" remote add origin "$Ooo"
git -C "$Fso" branch someland HEAD
code="$(run_in "$Fso" sync-follower someland)"
expect "sync-follower: origin ref ABSENT dies non-zero" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
msg="$(run_in_msg "$Fso" sync-follower someland)"
expect "sync-follower: origin-absent die carries the 'nothing landed to origin' hint" \
  "match" "$(printf '%s' "$msg" | grep -qi 'nothing landed to origin\|did the manual land push' && echo match || echo nomatch)"

# ls-remote FAILURE (unreachable) -> die, never read as "absent".
Fsf="$(new_repo)"
git -C "$Fsf" remote add origin "$Fsf/nonexistent-origin.git"
git -C "$Fsf" branch someland HEAD
code="$(run_in "$Fsf" sync-follower someland)"
expect "sync-follower: ls-remote FAILURE dies non-zero (never reads 'absent')" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
msg="$(run_in_msg "$Fsf" sync-follower someland)"
expect "sync-follower: ls-remote-failure die names the readback failure" \
  "match" "$(printf '%s' "$msg" | grep -qi 'ls-remote failed\|could not read the origin' && echo match || echo nomatch)"

# --- §4.7 origin-fallback cut (#725.4) -------------------------------------
# No LOCAL base ref but origin resolves -> cut integration at the origin tip
# (warn, exit 0, no follower ff). The both-absent die half is pinned by SI.1.
Fof="$(fixture_remote)"; Lof="${Fof%% *}"; Oof="${Fof##* }"
git -C "$Lof" checkout -q --detach
git -C "$Lof" branch -D "$FBASE"                                     # remove the LOCAL base ref (origin-only)
ORI_OF="$(git -C "$Oof" rev-parse "$FBASE")"
OWN_OF="$Lof/owned.txt"; : > "$OWN_OF"
run_capture "$Lof" ensure-integration myplan 1 "$FBASE" --owned-file "$OWN_OF"
expect "§4.7 origin-fallback: exits 0" 0 "$CAP_CODE"
expect "§4.7 origin-fallback: integration cut at the ORIGIN tip (no local ref)" \
  "$ORI_OF" "$(git -C "$Lof" rev-parse integration/myplan/phase-1 2>/dev/null)"
expect "§4.7 origin-fallback: warn names the origin fallback" \
  "match" "$(printf '%s' "$CAP_OUT" | grep -qi 'origin fallback\|has no ref' && echo match || echo nomatch)"

# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "provision-worktrees.test.sh: PASS"
