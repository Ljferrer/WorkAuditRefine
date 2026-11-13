# Shared setup for the provisioning script suites
# (skills/war/assets/provision-worktrees*.test.sh). Each suite sets HERE to its
# own directory and sources this file. This file holds no rows, and the gate
# never runs it on its own (its name does not end in .test.sh). #2824 split the
# one suite into three so no single suite binds the repo gate. The comment
# block below is the original suite header.
#
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
# Subcommands exercised (plan 2026-08-06 Task 1.2, #1380): resolve-working-branch
# leaf-ref arms (RWB.f-RWB.k: leaf-dev flat fallback, planSlug validation,
# actionable cut-failure die, fallback resume-reuse, no-collision control,
# widened-reuse discriminator).
# Subcommands exercised (plan 2026-08-06 Task 1.2, #1381): ensure-worktree
# reuse-path submodule hygiene (HYG.j-HYG.n: corruption repair + WIP
# preservation, SHA-mismatch control, clean control, real-edits control).
# Subcommands exercised (plan 2026-08-25 Phase 8 Task 1, #1476 + #1712 fix 1):
# reuse-gap rows RG.1-RG.4 (untracked-files=all, deliberate-git-rm
# disambiguation + accepted-residual header pin, SIGPIPE regression, refinery
# hygiene arm) and holder-die rows RG.5-RG.6 (`checked out
# at <path>` in the two worktree-add failure dies fix 1 covered: ensure-worktree
# and ensure-refinery-worktree). Row RG.7 (#2087, plan 2026-09-06 Task 6.2)
# pins the same holder clause on ensure-publication-worktree's add-die.
# Subcommands exercised (plan 2026-11-08 Task 1.6, PIN-7 + PIN-8): behavioral
# hygiene env-error and unrecognized-dirt rows, RG.4b (the refinery (c) arm's
# hygiene call), and the assert-submodules-ready rows.
# Subcommands exercised (#1840, #2007): large-registry and PIPE rows pin the
# SIGPIPE-safe branch, owned-set, delete and push classifiers.
# Ownership seam: the run tells the script which refs it owns via --owned-file
# <path> (a newline-delimited ledger the script reads AND appends to when it
# creates a branch) and/or repeatable --owned <ref>. Both are pure-bash
# testable. A branch that exists but is NOT recorded as ours is a foreign
# collision -> fail loud.
set -u

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


# --- helpers shared across the suites -----------------------------------------
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

# branch_exists_in <repo> <ref> -> "yes"/"no"
branch_exists_in() {
  if git -C "$1" show-ref --verify --quiet "refs/heads/$2"; then echo yes; else echo no; fi
}

# mk_run_dir <repo> <run-id> -> echoes <repo>/.claude/teams/<run-id> (created).
mk_run_dir() {
  rd="$1/.claude/teams/$2"
  mkdir -p "$rd/worktrees"
  echo "$rd"
}

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

# finish <suite name>: print the tally and exit 1 on any failed row.
finish() {
  printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
  [ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
  echo "$1: PASS"
}
