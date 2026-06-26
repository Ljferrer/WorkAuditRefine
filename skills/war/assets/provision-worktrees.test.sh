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
expect "T4.1 setup: worktree present before teardown" \
  "war/myplan/p2-t1" "$(wt_on_branch "$RT1" "$WTT1")"
expect "T4.1 setup: branch exists before teardown" \
  "yes" "$(branch_exists_in "$RT1" war/myplan/p2-t1)"
code="$(run_in "$RT1" teardown-task --run-dir "$RD1" "$WTT1" war/myplan/p2-t1)"
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
expect "T4.2 setup: integration branch exists before teardown" \
  "yes" "$(branch_exists_in "$RT2" integration/myplan/phase-2)"
expect "T4.2 setup: phase worktree A present before teardown" \
  "war/myplan/p2-tA" "$(wt_on_branch "$RT2" "$WTA")"
code="$(run_in "$RT2" teardown-phase --run-dir "$RD2" myplan 2)"
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
# Case (T2.2) Origin at expected tip -> push accepted, local follower advanced
# to <new-sha>.
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
# Case (T2.3) Unrelated push error (not a non-ff rejection) -> exit ESCALATE
# code, not RELAND. Simulate by pointing the remote at a non-existent path so
# git push errors without ever printing [rejected].
# ---------------------------------------------------------------------------
PAIR3="$(setup_origin_pair)"
C1_3="$(printf '%s' "$PAIR3" | cut -d' ' -f1)"
C2_3="$(printf '%s' "$PAIR3" | cut -d' ' -f2)"
ORIG3="$(printf '%s' "$PAIR3" | cut -d' ' -f3)"

SEED3="$(seed_working_branch "$C1_3" "$C2_3" "working/myplan3")"

# Break the remote URL so the push fails for a non-CAS reason.
git -C "$C1_3" remote set-url origin "/nonexistent/path/that/cannot/be/a/repo.git"

printf 'clone1-merge3\n' > "$C1_3/merge3.txt"
git -C "$C1_3" add -A
git -C "$C1_3" commit -qm "clone1 merge sha for T2.3"
NEW_SHA3="$(git -C "$C1_3" rev-parse HEAD)"

code="$(run_in_detached "$C1_3" "$NEW_SHA3" land-advance working/myplan3 "$NEW_SHA3")"

expect "T2.3: unrelated push error -> exit ESCALATE code (3), not RELAND (2)" \
  "3" "$code"

# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "provision-worktrees.test.sh: PASS"
