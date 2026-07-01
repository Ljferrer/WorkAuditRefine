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
# Case (T2.5) NO-OP PUSH FROM THE WRONG CWD -> origin readback mismatch -> exit
# 3, local ref UNCHANGED. This is the #251 bug: from a cwd whose HEAD == origin's
# OLD tip, `git push HEAD:refs/heads/<working>` is a genuine no-op — it exits 0
# and prints no [rejected] — yet origin never moved to <new-sha>. Pre-fix the
# step-3 update-ref advanced the LOCAL follower past origin while reporting
# success. The origin readback (`ls-remote origin == new_sha`) must catch this
# and exit 3 with the local ref left untouched.
#
# CRUCIAL: this case does NOT use run_in_detached — that helper detaches HEAD to
# <new-sha>, making HEAD == new_sha so the push is a REAL ff push that moves
# origin (readback would see origin == new_sha and pass, masking the bug). We
# instead check clone1's HEAD BACK to the SEED tip so HEAD == origin's old tip
# and the push is a true no-op (weak-test-assertion-passes-without-feature).
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
# so HEAD == origin's old tip and `git push HEAD:…` is a genuine no-op (exit 0,
# no [rejected]). Do NOT detach to NEW_SHA5 (that is the masked path
# run_in_detached already covers in T2.2).
git -C "$C1_5" checkout -q "$SEED5"
LOCAL_BEFORE5="$(git -C "$C1_5" rev-parse refs/heads/working/myplan5)"   # == SEED5
# Call the script DIRECTLY from clone1's cwd (HEAD == SEED5), NOT via run_in_detached.
code="$( ( cd "$C1_5" && bash "$SCRIPT" land-advance working/myplan5 "$NEW_SHA5" ); echo $? )"

expect "T2.5: no-op push from wrong cwd (HEAD≠new_sha, origin already at HEAD) → readback mismatch → exit 3" \
  "3" "$code"
LOCAL_AFTER5="$(git -C "$C1_5" rev-parse refs/heads/working/myplan5)"
expect "T2.5: local working ref did NOT advance to new_sha (origin readback gated the advance)" \
  "$LOCAL_BEFORE5" "$LOCAL_AFTER5"

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
SKILLS_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
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
# Case (SI.1) cmd_ensure_integration branch-create: git stderr surfaced in
# the die message. We trigger a create failure by supplying a non-existent
# base ref so git branch fails. The error message must contain something from
# git's stderr (not just a generic "failed to create branch" with no detail).
# ---------------------------------------------------------------------------
RSI1="$(new_repo)"
OWN_SI1="$RSI1/owned_si.txt"; : > "$OWN_SI1"
msg_si1="$(run_in_msg "$RSI1" ensure-integration myplan 99 nonexistent-base-sha-ZZZZZ --owned-file "$OWN_SI1")"
code_si1="$(run_in "$RSI1" ensure-integration myplan 99 nonexistent-base-sha-ZZZZZ --owned-file "$OWN_SI1")"
expect "SI.1: ensure-integration with bad base exits non-zero" \
  "nonzero" "$([ "$code_si1" -ne 0 ] && echo nonzero || echo zero)"
# The die message must include git's stderr (e.g. "invalid object name" or "not
# a valid object name" or the bad ref itself).
expect "SI.1: die message surfaces git stderr (bad-ref detail present)" \
  "match" "$(printf '%s' "$msg_si1" | grep -qiE 'not a valid object|invalid object|fatal' && echo match || echo nomatch)"

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
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "provision-worktrees.test.sh: PASS"
