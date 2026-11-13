#!/usr/bin/env bash
# Tests for the WAR provisioning script (skills/war/assets/provision-worktrees.sh):
# ensure-integration, ensure-exclude, ensure-worktree (with the reuse-path
# submodule hygiene and RG rows), teardown-task, teardown-phase and prune,
# ensure-refinery-worktree, and land-advance (T2 rows).
# The shared helpers live in provision-worktrees.test-harness.sh (its header
# describes the runner and the ownership seam). #2824 split the suite into
# three files so they run in parallel. Plain-bash assertion runner, bash 3.2
# safe, cwd-independent. Exit 0 = all cases passed.
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/provision-worktrees.test-harness.sh"

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
# Case (WX) Scratch exclude (plan 2026-11-08 PIN-10, A23): write_marker adds
# `.war/` to the shared common-dir info/exclude beside `.war-task`, so a
# worker's scratch file under <worktree>/.war/ is never staged by `git add -A`.
# ---------------------------------------------------------------------------
RWX="$(new_repo)"
git -C "$RWX" branch integration/myplan/phase-2 HEAD
TIPWX="$(git -C "$RWX" rev-parse integration/myplan/phase-2)"
WTX="$(new_wt_path)"
run_in "$RWX" ensure-worktree "$WTX" war/myplan/p2-wx "$TIPWX" >/dev/null
mkdir -p "$WTX/.war"
printf 'msg\n' > "$WTX/.war/commit-msg.txt"
expect "WX1: git add -A --dry-run in a fresh worktree lists nothing from .war/" \
  "" "$(git -C "$WTX" add -A --dry-run 2>&1 | awk '/\.war\//')"
expect "WX2: git check-ignore -q .war/commit-msg.txt exits 0 in a fresh worktree" \
  0 "$(git -C "$WTX" check-ignore -q .war/commit-msg.txt; echo $?)"

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
# Plan 2026-08-06 Task 1.2 (#1381, D19): ensure-worktree REUSE-path submodule
# hygiene. Each case builds its own throwaway superproject+submodule fixture
# (never a shared one — the redteam-sandbox-residue lesson) via hyg_fixture.
# protocol.file.allow=always is FIXTURE-BUILD-ONLY (the submodule clone from a
# file-path source); the hygiene repair itself re-checks-out an already-cloned
# submodule and needs no protocol override.
# ===========================================================================

# hyg_fixture -> echoes "REPO WT": a superproject repo with ONE declared
# submodule `sub` (two tracked files), a task branch, and a POPULATED, clean
# task worktree on that branch (provisioned via the script, so the next
# ensure-worktree call takes the REUSE path).
hyg_fixture() {
  hs="$(mktemp -d 2>/dev/null || mktemp -d -t warhysub)"; REPOS="$REPOS $hs"
  git -C "$hs" init -q
  git -C "$hs" config user.email war@test.local
  git -C "$hs" config user.name "WAR Test"
  git -C "$hs" config commit.gpgsign false
  printf 'one\n' > "$hs/a.txt"; printf 'two\n' > "$hs/b.txt"
  git -C "$hs" add -A; git -C "$hs" commit -qm subseed
  hr="$(new_repo)"
  git -C "$hr" -c protocol.file.allow=always submodule add -q "$hs" sub >/dev/null 2>&1
  git -C "$hr" commit -qm "declare submodule"
  git -C "$hr" branch war/myplan/p2-t3 HEAD
  hw="$(new_wt_path)"
  ( cd "$hr" && bash "$SCRIPT" ensure-worktree "$hw" war/myplan/p2-t3 "$(git -C "$hr" rev-parse HEAD)" ) >/dev/null 2>&1
  git -C "$hw" -c protocol.file.allow=always submodule update --init sub >/dev/null 2>&1
  echo "$hr $hw"
}

# ---------------------------------------------------------------------------
# Case (HYG.j / 1.2(j)) HYGIENE-REPAIR (End state 21) + (HYG.k / 1.2(k))
# WIP-PRESERVATION (End state 22) — one fixture, per the plan: the submodule
# index is emptied deterministically (`git read-tree --empty` + a dropped
# index.lock — A10: state-equivalent to the reproduced killed-populate state on
# every surface the hygiene arm reads; files stay on disk, a dimension nothing
# consulted reads), and superproject WIP (a tracked modification + two
# untracked files) rides the same reuse. The reuse must repair the submodule
# (clean, HEAD still at the recorded gitlink SHA), emit a WORKTREE_HYGIENE
# `repaired` marker on stderr, and leave the WIP byte-for-byte with nothing
# staged. Streams captured SPLIT (stderr to a temp file, stdout separately) so
# the marker greps and the stdout-is-the-path assertion are stream-accurate.
# ---------------------------------------------------------------------------
FXH_J="$(hyg_fixture)"; RH_J="${FXH_J%% *}"; WTH_J="${FXH_J##* }"
TIPH_J="$(git -C "$RH_J" rev-parse war/myplan/p2-t3)"
GITLINK_J="$(git -C "$WTH_J" ls-tree HEAD -- sub | awk '{print $3}')"
expect "HYG.j setup: submodule populated and clean" \
  "clean" "$([ -z "$(git -C "$WTH_J" status --porcelain -- sub 2>/dev/null)" ] && echo clean || echo dirty)"
# Corrupt: empty the submodule index + drop a stale index.lock.
git -C "$WTH_J/sub" read-tree --empty
SUBGD_J="$(git -C "$WTH_J/sub" rev-parse --git-dir)"
touch "$SUBGD_J/index.lock"
expect "HYG.j setup: corruption visible in superproject porcelain" \
  "dirty" "$([ -n "$(git -C "$WTH_J" status --porcelain -- sub 2>/dev/null)" ] && echo dirty || echo clean)"
# WIP rides the same fixture (HYG.k): tracked modification + two untracked files.
printf 'tracked-wip\n' >> "$WTH_J/seed.txt"
printf 'untracked-one\n' > "$WTH_J/wip1.txt"
printf 'untracked-two\n' > "$WTH_J/wip2.txt"
SEED_J="$(cat "$WTH_J/seed.txt")"
# Split streams (stderr-only marker contract): the barrier parses stdout as the
# worktree PATH, so markers MUST stay on stderr — dropping >&2 from
# hygiene_marker would corrupt the path capture. OUT_HJ is stderr ONLY; the
# marker greps below are therefore stream-discriminating.
ERRF_J="$(mktemp 2>/dev/null || mktemp -t warhyg)"; REPOS="$REPOS $ERRF_J"
OUT_HJ_STDOUT="$( ( cd "$RH_J" && bash "$SCRIPT" ensure-worktree "$WTH_J" war/myplan/p2-t3 "$TIPH_J" ) 2>"$ERRF_J" )"; C_HJ=$?
OUT_HJ="$(cat "$ERRF_J")"
expect "HYG.j: stdout is exactly the worktree path (markers stay on stderr)" \
  "$WTH_J" "$OUT_HJ_STDOUT"
expect "HYG.j: reuse over the corrupted submodule exits 0 (fail-open, no new die)" \
  "0" "$C_HJ"
expect "HYG.j: a WORKTREE_HYGIENE repaired marker is emitted" \
  "yes" "$(printf '%s' "$OUT_HJ" | grep -Fq 'WORKTREE_HYGIENE path=sub action=repaired' && echo yes || echo no)"
expect "HYG.j: submodule ends clean in superproject porcelain" \
  "clean" "$([ -z "$(git -C "$WTH_J" status --porcelain -- sub 2>/dev/null)" ] && echo clean || echo dirty)"
expect "HYG.j: submodule porcelain itself is clean (index restored)" \
  "clean" "$([ -z "$(git -C "$WTH_J/sub" status --porcelain 2>/dev/null)" ] && echo clean || echo dirty)"
expect "HYG.j: submodule HEAD still at the recorded gitlink SHA (no bump possible)" \
  "$GITLINK_J" "$(git -C "$WTH_J/sub" rev-parse HEAD 2>/dev/null)"
expect "HYG.j: submodule tracked file restored" \
  "one" "$(cat "$WTH_J/sub/a.txt" 2>/dev/null)"
expect "HYG.k: superproject tracked modification survives byte-for-byte" \
  "$SEED_J" "$(cat "$WTH_J/seed.txt" 2>/dev/null)"
expect "HYG.k: untracked WIP file 1 survives byte-for-byte" \
  "untracked-one" "$(cat "$WTH_J/wip1.txt" 2>/dev/null)"
expect "HYG.k: untracked WIP file 2 survives byte-for-byte" \
  "untracked-two" "$(cat "$WTH_J/wip2.txt" 2>/dev/null)"
expect "HYG.k: nothing staged in the superproject (git diff --cached empty)" \
  "" "$(git -C "$WTH_J" diff --cached --name-only 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case (HYG.l / 1.2(l)) SHA-MISMATCH CONTROL (End state 22's control arm): a
# submodule checked out at a DIFFERENT HEAD than the recorded gitlink SHA is
# `detected` only — its tree untouched, never force-restored (could be real
# submodule work; the relaunching Lead adjudicates).
# ---------------------------------------------------------------------------
FXH_L="$(hyg_fixture)"; RH_L="${FXH_L%% *}"; WTH_L="${FXH_L##* }"
TIPH_L="$(git -C "$RH_L" rev-parse war/myplan/p2-t3)"
git -C "$WTH_L/sub" config user.email war@test.local
git -C "$WTH_L/sub" config user.name "WAR Test"
git -C "$WTH_L/sub" config commit.gpgsign false
printf 'advanced\n' >> "$WTH_L/sub/a.txt"
git -C "$WTH_L/sub" add -A
git -C "$WTH_L/sub" commit -qm "sub advanced past the gitlink"
SUBHEAD_L="$(git -C "$WTH_L/sub" rev-parse HEAD)"
OUT_HL="$( ( cd "$RH_L" && bash "$SCRIPT" ensure-worktree "$WTH_L" war/myplan/p2-t3 "$TIPH_L" ) 2>&1 )"; C_HL=$?
expect "HYG.l: reuse over a SHA-mismatched submodule exits 0" "0" "$C_HL"
expect "HYG.l: marker is detected (sha-mismatch), never repaired" \
  "yes" "$(printf '%s' "$OUT_HL" | grep -Fq 'WORKTREE_HYGIENE path=sub action=detected detail=sha-mismatch' && echo yes || echo no)"
expect "HYG.l: no repaired marker emitted" \
  "no" "$(printf '%s' "$OUT_HL" | grep -Fq 'action=repaired' && echo yes || echo no)"
expect "HYG.l: submodule HEAD untouched (still the advanced commit)" \
  "$SUBHEAD_L" "$(git -C "$WTH_L/sub" rev-parse HEAD 2>/dev/null)"

# ---------------------------------------------------------------------------
# Case (HYG.m / 1.2(m)) CLEAN CONTROL: a clean reuse emits NO marker.
# ---------------------------------------------------------------------------
FXH_M="$(hyg_fixture)"; RH_M="${FXH_M%% *}"; WTH_M="${FXH_M##* }"
TIPH_M="$(git -C "$RH_M" rev-parse war/myplan/p2-t3)"
OUT_HM="$( ( cd "$RH_M" && bash "$SCRIPT" ensure-worktree "$WTH_M" war/myplan/p2-t3 "$TIPH_M" ) 2>&1 )"; C_HM=$?
expect "HYG.m: clean reuse exits 0" "0" "$C_HM"
expect "HYG.m: clean reuse emits no WORKTREE_HYGIENE marker" \
  "no" "$(printf '%s' "$OUT_HM" | grep -Fq 'WORKTREE_HYGIENE' && echo yes || echo no)"

# ---------------------------------------------------------------------------
# Case (HYG.n) REAL-EDITS CONTROL (the red-team-narrowed detector, D19): an
# UNSTAGED modification in the submodule at the MATCHED gitlink SHA is
# indistinguishable from a submodule-content worker's legitimate uncommitted
# work — the repair arm must NOT fire (--force would destroy it): `detected`
# only, the edit survives byte-for-byte.
# ---------------------------------------------------------------------------
FXH_N="$(hyg_fixture)"; RH_N="${FXH_N%% *}"; WTH_N="${FXH_N##* }"
TIPH_N="$(git -C "$RH_N" rev-parse war/myplan/p2-t3)"
printf 'real-edit\n' >> "$WTH_N/sub/a.txt"
EDIT_N="$(cat "$WTH_N/sub/a.txt")"
OUT_HN="$( ( cd "$RH_N" && bash "$SCRIPT" ensure-worktree "$WTH_N" war/myplan/p2-t3 "$TIPH_N" ) 2>&1 )"; C_HN=$?
expect "HYG.n: reuse over real submodule edits exits 0" "0" "$C_HN"
expect "HYG.n: real edits are detected, never repaired" \
  "yes" "$(printf '%s' "$OUT_HN" | grep -Fq 'WORKTREE_HYGIENE path=sub action=detected' && echo yes || echo no)"
expect "HYG.n: no repaired marker emitted (the --force arm did not fire)" \
  "no" "$(printf '%s' "$OUT_HN" | grep -Fq 'action=repaired' && echo yes || echo no)"
expect "HYG.n: the unstaged edit survives byte-for-byte" \
  "$EDIT_N" "$(cat "$WTH_N/sub/a.txt" 2>/dev/null)"

# ===========================================================================
# Plan 2026-08-25 Phase 8 Task 1 (#1476, End state 16): the four reuse-hygiene
# gaps, each with its own `reuse-gap`-titled row; plus fold #1712 fix 1 (End
# state 26): the worktree-add failure die names the holding worktree
# (`checked out at <path>`) for BOTH ensure-worktree and
# ensure-refinery-worktree.
# ===========================================================================

# ---------------------------------------------------------------------------
# Case (RG.1 / #1476 gap 1) --untracked-files=all: a submodule with a tracked
# file in a SUBDIRECTORY, index emptied with files kept on disk. The porcelain
# default collapses the wholly-untracked dir to one `?? d/` entry that can
# never match the `d/x.txt` staged-deletion path, degrading the repairable
# state to unrecognized-dirt; with --untracked-files=all it must REPAIR.
# ---------------------------------------------------------------------------
hyg_fixture_deep() {
  hs="$(mktemp -d 2>/dev/null || mktemp -d -t warhydeep)"; REPOS="$REPOS $hs"
  git -C "$hs" init -q
  git -C "$hs" config user.email war@test.local
  git -C "$hs" config user.name "WAR Test"
  git -C "$hs" config commit.gpgsign false
  printf 'one\n' > "$hs/a.txt"
  mkdir -p "$hs/d"
  printf 'deep\n' > "$hs/d/x.txt"
  git -C "$hs" add -A; git -C "$hs" commit -qm subseed
  hr="$(new_repo)"
  git -C "$hr" -c protocol.file.allow=always submodule add -q "$hs" sub >/dev/null 2>&1
  git -C "$hr" commit -qm "declare submodule"
  git -C "$hr" branch war/myplan/p8-t1 HEAD
  hw="$(new_wt_path)"
  ( cd "$hr" && bash "$SCRIPT" ensure-worktree "$hw" war/myplan/p8-t1 "$(git -C "$hr" rev-parse HEAD)" ) >/dev/null 2>&1
  git -C "$hw" -c protocol.file.allow=always submodule update --init sub >/dev/null 2>&1
  echo "$hr $hw"
}
FXRG1="$(hyg_fixture_deep)"; RRG1="${FXRG1%% *}"; WTRG1="${FXRG1##* }"
TIPRG1="$(git -C "$RRG1" rev-parse war/myplan/p8-t1)"
git -C "$WTRG1/sub" read-tree --empty
expect "reuse-gap(untracked-files) setup: subdir collapses under default porcelain" \
  "yes" "$(git -C "$WTRG1/sub" status --porcelain 2>/dev/null | grep -Fxq '?? d/' && echo yes || echo no)"
OUT_RG1="$( ( cd "$RRG1" && bash "$SCRIPT" ensure-worktree "$WTRG1" war/myplan/p8-t1 "$TIPRG1" ) 2>&1 )"; C_RG1=$?
expect "reuse-gap(untracked-files): reuse exits 0 (fail-open)" "0" "$C_RG1"
expect "reuse-gap(untracked-files): subdir emptied-index state is REPAIRED, not unrecognized-dirt" \
  "yes" "$(printf '%s' "$OUT_RG1" | grep -Fq 'WORKTREE_HYGIENE path=sub action=repaired' && echo yes || echo no)"
expect "reuse-gap(untracked-files): no unrecognized-dirt marker emitted" \
  "no" "$(printf '%s' "$OUT_RG1" | grep -Fq 'unrecognized-dirt' && echo yes || echo no)"
expect "reuse-gap(untracked-files): submodule ends clean (subdir file restored to the index)" \
  "clean" "$([ -z "$(git -C "$WTRG1/sub" status --porcelain 2>/dev/null)" ] && echo clean || echo dirty)"

# ---------------------------------------------------------------------------
# Case (RG.2 / #1476 gap 2) deliberate-git-rm disambiguation: a worker's own
# uncommitted `git rm a.txt` (b.txt stays in the index) yields the
# staged-deletions-only porcelain at the matched gitlink SHA — the OLD arm
# force-restored it, destroying the intentional deletion. The non-empty
# remaining index must now classify `detected possible-deliberate-git-rm`,
# never repaired; the staged deletion survives byte-for-byte.
# ---------------------------------------------------------------------------
FXRG2="$(hyg_fixture)"; RRG2="${FXRG2%% *}"; WTRG2="${FXRG2##* }"
TIPRG2="$(git -C "$RRG2" rev-parse war/myplan/p2-t3)"
git -C "$WTRG2/sub" rm -q a.txt
expect "reuse-gap(git-rm) setup: deletion staged, b.txt still in the index" \
  "b.txt" "$(git -C "$WTRG2/sub" ls-files 2>/dev/null)"
OUT_RG2="$( ( cd "$RRG2" && bash "$SCRIPT" ensure-worktree "$WTRG2" war/myplan/p2-t3 "$TIPRG2" ) 2>&1 )"; C_RG2=$?
expect "reuse-gap(git-rm): reuse exits 0 (fail-open)" "0" "$C_RG2"
expect "reuse-gap(git-rm): partial staged deletion is detected as possible-deliberate-git-rm" \
  "yes" "$(printf '%s' "$OUT_RG2" | grep -Fq 'WORKTREE_HYGIENE path=sub action=detected detail=possible-deliberate-git-rm' && echo yes || echo no)"
expect "reuse-gap(git-rm): never repaired (the --force arm did not fire)" \
  "no" "$(printf '%s' "$OUT_RG2" | grep -Fq 'action=repaired' && echo yes || echo no)"
expect "reuse-gap(git-rm): the staged deletion survives" \
  "a.txt" "$(git -C "$WTRG2/sub" diff --cached --name-only --diff-filter=D 2>/dev/null)"
expect "reuse-gap(git-rm): the deleted file stays deleted on disk" \
  "absent" "$([ -e "$WTRG2/sub/a.txt" ] && echo present || echo absent)"
# The one indistinguishable shape (`git rm` of EVERY tracked file == emptied
# index) is an ACCEPTED RESIDUAL taken only because no readable surface can
# split it — the plan requires the header-documentation text itself asserted,
# never a prose-only waiver.
expect "reuse-gap(git-rm): accepted-residual header documentation is present in the script" \
  "yes" "$(grep -Fq 'indistinguishable from the emptied-index corruption' "$SCRIPT" && echo yes || echo no)"

# ---------------------------------------------------------------------------
# Case (RG.3 / #1476 gap 3) SIGPIPE regression: a LARGE emptied-index
# submodule whose staged-deletion list exceeds the pipe buffer. The old
# per-line `printf | grep -Fxq` mirror check let grep exit on first match,
# SIGPIPE-killing printf, and pipefail then misread the 141 as a shape
# mismatch (unrecognized-dirt). The single draining awk pass must REPAIR.
# ---------------------------------------------------------------------------
RGBIGSUB="$(mktemp -d 2>/dev/null || mktemp -d -t warhybig)"; REPOS="$REPOS $RGBIGSUB"
git -C "$RGBIGSUB" init -q
git -C "$RGBIGSUB" config user.email war@test.local
git -C "$RGBIGSUB" config user.name "WAR Test"
git -C "$RGBIGSUB" config commit.gpgsign false
i=0
while [ "$i" -lt 2600 ]; do
  : > "$RGBIGSUB/payload-sigpipe-regression-file-number-$(printf '%05d' "$i").txt"
  i=$((i + 1))
done
git -C "$RGBIGSUB" add -A; git -C "$RGBIGSUB" commit -qm bigseed
RRG3="$(new_repo)"
git -C "$RRG3" -c protocol.file.allow=always submodule add -q "$RGBIGSUB" sub >/dev/null 2>&1
git -C "$RRG3" commit -qm "declare submodule"
git -C "$RRG3" branch war/myplan/p8-t1 HEAD
WTRG3="$(new_wt_path)"
( cd "$RRG3" && bash "$SCRIPT" ensure-worktree "$WTRG3" war/myplan/p8-t1 "$(git -C "$RRG3" rev-parse HEAD)" ) >/dev/null 2>&1
git -C "$WTRG3" -c protocol.file.allow=always submodule update --init sub >/dev/null 2>&1
TIPRG3="$(git -C "$RRG3" rev-parse war/myplan/p8-t1)"
git -C "$WTRG3/sub" read-tree --empty
expect "reuse-gap(sigpipe) setup: staged-deletion list exceeds the 64KB pipe buffer" \
  "big" "$([ "$(git -C "$WTRG3/sub" diff --cached --name-only --diff-filter=D 2>/dev/null | wc -c)" -gt 65536 ] && echo big || echo small)"
OUT_RG3="$( ( cd "$RRG3" && bash "$SCRIPT" ensure-worktree "$WTRG3" war/myplan/p8-t1 "$TIPRG3" ) 2>&1 )"; C_RG3=$?
expect "reuse-gap(sigpipe): reuse exits 0 (fail-open)" "0" "$C_RG3"
expect "reuse-gap(sigpipe): the large emptied-index submodule is REPAIRED" \
  "yes" "$(printf '%s' "$OUT_RG3" | grep -Fq 'WORKTREE_HYGIENE path=sub action=repaired' && echo yes || echo no)"
expect "reuse-gap(sigpipe): never misclassified as unrecognized-dirt" \
  "no" "$(printf '%s' "$OUT_RG3" | grep -Fq 'unrecognized-dirt' && echo yes || echo no)"

# ---------------------------------------------------------------------------
# Case (hygiene env-error, PIN-7, #1824) the env-error route by behavior: a
# mode-000 submodule index makes every classification read fail, so the reuse
# emits `detected env-error:*`, never unrecognized-dirt (which implies
# possibly-real work). Root reads a mode-000 file, so the row skips there by name.
# ---------------------------------------------------------------------------
if [ "$(id -u)" -eq 0 ]; then
  expect "hygiene env-error (SKIP: running as root)" "skip" "skip"
else
  FXH_EE="$(hyg_fixture)"; RH_EE="${FXH_EE%% *}"; WTH_EE="${FXH_EE##* }"
  TIPH_EE="$(git -C "$RH_EE" rev-parse war/myplan/p2-t3)"
  IDX_EE="$(cd "$WTH_EE/sub" && git rev-parse --path-format=absolute --git-path index)"
  chmod 000 "$IDX_EE"
  OUT_HEE="$( ( cd "$RH_EE" && bash "$SCRIPT" ensure-worktree "$WTH_EE" war/myplan/p2-t3 "$TIPH_EE" ) 2>&1 )"
  chmod 644 "$IDX_EE"
  V_HEE="$(printf '%s' "$OUT_HEE" | grep -Fq 'WORKTREE_HYGIENE path=sub action=detected detail=env-error:' && echo env-error || echo no-env-error)"
  V_HEE="$V_HEE/$(printf '%s' "$OUT_HEE" | grep -Fq 'unrecognized-dirt' && echo unrecognized-dirt || echo no-dirt-finding)"
  expect "hygiene env-error: a mode-000 submodule index gives env-error:*, never unrecognized-dirt" \
    "env-error/no-dirt-finding" "$V_HEE"
fi

# ---------------------------------------------------------------------------
# Case (hygiene unrecognized-dirt, PIN-7, #1825) an emptied index plus a
# foreign untracked file do not match the corruption signature: the reuse
# emits `detected unrecognized-dirt` and never repairs (--force would restore
# the index and wipe the staged deletions). The index is emptied, as in HYG.j,
# so the shape check is the only guard before the repair arm.
# ---------------------------------------------------------------------------
FXH_UD="$(hyg_fixture)"; RH_UD="${FXH_UD%% *}"; WTH_UD="${FXH_UD##* }"
TIPH_UD="$(git -C "$RH_UD" rev-parse war/myplan/p2-t3)"
git -C "$WTH_UD/sub" read-tree --empty
printf 'foreign\n' > "$WTH_UD/sub/foreign.txt"
OUT_HUD="$( ( cd "$RH_UD" && bash "$SCRIPT" ensure-worktree "$WTH_UD" war/myplan/p2-t3 "$TIPH_UD" ) 2>&1 )"
V_HUD="$(printf '%s' "$OUT_HUD" | grep -Fxq 'WORKTREE_HYGIENE path=sub action=detected detail=unrecognized-dirt' && echo unrecognized-dirt || echo no-marker)"
V_HUD="$V_HUD/$(printf '%s' "$OUT_HUD" | grep -Fq 'action=repaired' && echo repaired || echo not-repaired)"
expect "hygiene unrecognized-dirt: staged deletions plus a foreign file are detected, never repaired" \
  "unrecognized-dirt/not-repaired" "$V_HUD"
expect "HYG.ud: the staged deletions survive" \
  "a.txt b.txt" "$(git -C "$WTH_UD/sub" diff --cached --name-only --diff-filter=D 2>/dev/null | tr '\n' ' ' | sed 's/ $//')"

# ---------------------------------------------------------------------------
# Case (RG.4 / #1476 gap 4) refinery-worktree hygiene arm: the SAME corrupted
# emptied-index submodule state on ensure-refinery-worktree's reuse path must
# now be repaired (previously the refinery reuse carried no hygiene arm).
# Streams captured SPLIT: stdout stays exactly the worktree path.
# ---------------------------------------------------------------------------
RGRSUB="$(mktemp -d 2>/dev/null || mktemp -d -t warhyref)"; REPOS="$REPOS $RGRSUB"
git -C "$RGRSUB" init -q
git -C "$RGRSUB" config user.email war@test.local
git -C "$RGRSUB" config user.name "WAR Test"
git -C "$RGRSUB" config commit.gpgsign false
printf 'one\n' > "$RGRSUB/a.txt"; printf 'two\n' > "$RGRSUB/b.txt"
git -C "$RGRSUB" add -A; git -C "$RGRSUB" commit -qm subseed
RRG4="$(new_repo)"
git -C "$RRG4" -c protocol.file.allow=always submodule add -q "$RGRSUB" sub >/dev/null 2>&1
git -C "$RRG4" commit -qm "declare submodule"
git -C "$RRG4" branch integration/myplan/phase-8 HEAD
WTRG4="$(new_wt_path)"
( cd "$RRG4" && bash "$SCRIPT" ensure-refinery-worktree "$WTRG4" integration/myplan/phase-8 ) >/dev/null 2>&1
git -C "$WTRG4" -c protocol.file.allow=always submodule update --init sub >/dev/null 2>&1
git -C "$WTRG4/sub" read-tree --empty
touch "$(cd "$WTRG4/sub" && git rev-parse --git-dir)/index.lock" 2>/dev/null || true
ERRF_RG4="$(mktemp 2>/dev/null || mktemp -t warhyg4)"; REPOS="$REPOS $ERRF_RG4"
OUT_RG4_STDOUT="$( ( cd "$RRG4" && bash "$SCRIPT" ensure-refinery-worktree "$WTRG4" integration/myplan/phase-8 ) 2>"$ERRF_RG4" )"; C_RG4=$?
OUT_RG4="$(cat "$ERRF_RG4")"
expect "reuse-gap(refinery): reuse exits 0 (fail-open, exit discipline unchanged)" "0" "$C_RG4"
expect "reuse-gap(refinery): stdout is exactly the worktree path (markers stay on stderr)" \
  "$WTRG4" "$OUT_RG4_STDOUT"
expect "reuse-gap(refinery): refinery reuse repairs the corrupted submodule" \
  "yes" "$(printf '%s' "$OUT_RG4" | grep -Fq 'WORKTREE_HYGIENE path=sub action=repaired' && echo yes || echo no)"
expect "reuse-gap(refinery): submodule ends clean in superproject porcelain" \
  "clean" "$([ -z "$(git -C "$WTRG4" status --porcelain -- sub 2>/dev/null)" ] && echo clean || echo dirty)"

# ---------------------------------------------------------------------------
# Case (RG.4b, PIN-7, #1826, ledger A4) the refinery (c) arm's reuse_hygiene
# call is reachable: the refinery worktree sits CLEAN under -uno on a prior
# branch whose gitlink pins an older submodule commit. `git switch` leaves the
# submodule checkout alone, so after the re-attach the checkout differs from
# the integration branch's gitlink, and the (c) call emits sha-mismatch.
# ---------------------------------------------------------------------------
RG4B_SUB="$(mktemp -d 2>/dev/null || mktemp -d -t warhy4b)"; REPOS="$REPOS $RG4B_SUB"
git -C "$RG4B_SUB" init -q
git -C "$RG4B_SUB" config user.email war@test.local
git -C "$RG4B_SUB" config user.name "WAR Test"
git -C "$RG4B_SUB" config commit.gpgsign false
printf 'one\n' > "$RG4B_SUB/a.txt"; git -C "$RG4B_SUB" add -A; git -C "$RG4B_SUB" commit -qm s1
RG4B_S1="$(git -C "$RG4B_SUB" rev-parse HEAD)"
printf 'two\n' > "$RG4B_SUB/a.txt"; git -C "$RG4B_SUB" commit -qam s2
RRG4B="$(new_repo)"
git -C "$RRG4B" -c protocol.file.allow=always submodule add -q "file://$RG4B_SUB" sub >/dev/null 2>&1
git -C "$RRG4B" commit -qm "declare submodule"
git -C "$RRG4B" branch integration/myplan/phase-9 HEAD
git -C "$RRG4B" branch integration/myplan/phase-8 HEAD
WTRG4B="$(new_wt_path)"
( cd "$RRG4B" && bash "$SCRIPT" ensure-refinery-worktree "$WTRG4B" integration/myplan/phase-8 ) >/dev/null 2>&1
git -C "$WTRG4B" -c protocol.file.allow=always submodule update --init sub >/dev/null 2>&1
git -C "$WTRG4B/sub" checkout -q "$RG4B_S1"
git -C "$WTRG4B" add sub
git -C "$WTRG4B" -c user.email=war@test.local -c user.name="WAR Test" -c commit.gpgsign=false commit -qm "phase-8 pins s1"
expect "reuse-gap(refinery re-attach) setup: prior-branch tree is clean under -uno" \
  "" "$(git -C "$WTRG4B" status --porcelain -uno 2>/dev/null)"
OUT_RG4B="$( ( cd "$RRG4B" && bash "$SCRIPT" ensure-refinery-worktree "$WTRG4B" integration/myplan/phase-9 ) 2>&1 )"; C_RG4B=$?
V_RG4B="$C_RG4B/$(git -C "$WTRG4B" symbolic-ref --short HEAD 2>/dev/null)"
V_RG4B="$V_RG4B/$(printf '%s' "$OUT_RG4B" | grep -Fxq 'WORKTREE_HYGIENE path=sub action=detected detail=sha-mismatch' && echo sha-mismatch || echo no-marker)"
expect "RG.4b: a clean prior-branch refinery worktree re-attaches and emits detected sha-mismatch" \
  "0/integration/myplan/phase-9/sha-mismatch" "$V_RG4B"

# ===========================================================================
# PIN-8 (#2346, D8): submodule-ready worktrees. A plain `git worktree add`
# leaves declared submodules uninitialized, so both ensure arms init them and
# then call assert-submodules-ready, which exits EX_SUBMODULES (9) with a
# SUBMODULES_UNINITIALIZED marker if one stays uninitialized. Fixtures use
# local file-URL submodules only. SM_ALLOW lets the fixture's own file-URL
# clone through, whatever the host's protocol.file.allow says.
# ===========================================================================
SM_ALLOW="GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=protocol.file.allow GIT_CONFIG_VALUE_0=always"
# sm_fixture -> echoes "REPO SRC": a superproject that declares the file-URL
# submodule `sub` (source SRC), with a task branch and an integration branch.
sm_fixture() {
  ss="$(mktemp -d 2>/dev/null || mktemp -d -t warsmsrc)"; REPOS="$REPOS $ss"
  git -C "$ss" init -q
  git -C "$ss" config user.email war@test.local
  git -C "$ss" config user.name "WAR Test"
  git -C "$ss" config commit.gpgsign false
  printf 'one\n' > "$ss/a.txt"; git -C "$ss" add -A; git -C "$ss" commit -qm subseed
  sr="$(new_repo)"
  git -C "$sr" -c protocol.file.allow=always submodule add -q "file://$ss" sub >/dev/null 2>&1
  git -C "$sr" commit -qm "declare submodule"
  git -C "$sr" branch integration/myplan/phase-1 HEAD
  echo "$sr $ss"
}

R_SM0="$(new_repo)"
OUT_SM0="$(cd "$R_SM0" && bash "$SCRIPT" assert-submodules-ready "$R_SM0" 2>&1)"; C_SM0=$?
expect "assert-submodules-ready: no .gitmodules is a silent no-op" "0:" "$C_SM0:$OUT_SM0"

FX_SM1="$(sm_fixture)"; R_SM1="${FX_SM1%% *}"
WT_SM1="$(new_wt_path)"
( cd "$R_SM1" && env $SM_ALLOW bash "$SCRIPT" ensure-worktree "$WT_SM1" war/myplan/p1-t1 "$(git -C "$R_SM1" rev-parse HEAD)" ) >/dev/null 2>&1; C_SM1=$?
V_SM1="$C_SM1/$(git -C "$WT_SM1" submodule status --recursive 2>/dev/null | cut -c1)/$(cat "$WT_SM1/sub/a.txt" 2>/dev/null)"
expect "assert-submodules-ready: ensure-worktree inits the submodule of a fresh cut" "0/ /one" "$V_SM1"

FX_SM2="$(sm_fixture)"; R_SM2="${FX_SM2%% *}"; SRC_SM2="${FX_SM2##* }"
rm -rf "$SRC_SM2"
WT_SM2="$(new_wt_path)"
ERRF_SM2="$(mktemp 2>/dev/null || mktemp -t warsm2)"; REPOS="$REPOS $ERRF_SM2"
OUT_SM2="$( ( cd "$R_SM2" && env $SM_ALLOW bash "$SCRIPT" ensure-worktree "$WT_SM2" war/myplan/p1-t1 "$(git -C "$R_SM2" rev-parse HEAD)" ) 2>"$ERRF_SM2" )"; C_SM2=$?
V_SM2="$C_SM2/$(grep -Fxq 'SUBMODULES_UNINITIALIZED sub' "$ERRF_SM2" && echo marker || echo no-marker)"
V_SM2="$V_SM2/$(grep -Fq "assert-submodules-ready: '" "$ERRF_SM2" && echo die-text || echo no-die-text)/stdout=$OUT_SM2"
expect "assert-submodules-ready: unreachable URL exits 9 with SUBMODULES_UNINITIALIZED on stderr" \
  "9/marker/die-text/stdout=" "$V_SM2"

FX_SM3="$(sm_fixture)"; R_SM3="${FX_SM3%% *}"
WT_SM3="$(new_wt_path)"
OUT_SM3="$( ( cd "$R_SM3" && env $SM_ALLOW bash "$SCRIPT" ensure-refinery-worktree "$WT_SM3" integration/myplan/phase-1 ) 2>/dev/null )"; C_SM3=$?
V_SM3="$C_SM3/$(git -C "$WT_SM3" submodule status --recursive 2>/dev/null | cut -c1)/$(cat "$WT_SM3/sub/a.txt" 2>/dev/null)"
expect "assert-submodules-ready: refinery arm inits the submodule and keeps stdout the path" \
  "0/ /one/$WT_SM3" "$V_SM3/$OUT_SM3"

# The reuse arms init too: a plain `git worktree add` leaves the submodule at
# `-`, so the next ensure call takes the reuse arm, and its init is the
# recovery path after a failed first init.
FX_SM4="$(sm_fixture)"; R_SM4="${FX_SM4%% *}"
WT_SM4="$(new_wt_path)"
git -C "$R_SM4" worktree add -q -b war/myplan/p1-t2 "$WT_SM4" HEAD >/dev/null 2>&1
( cd "$R_SM4" && env $SM_ALLOW bash "$SCRIPT" ensure-worktree "$WT_SM4" war/myplan/p1-t2 "$(git -C "$R_SM4" rev-parse HEAD)" ) >/dev/null 2>&1; C_SM4=$?
V_SM4="$C_SM4/$(git -C "$WT_SM4" submodule status --recursive 2>/dev/null | cut -c1)/$(cat "$WT_SM4/sub/a.txt" 2>/dev/null)"
expect "reuse-gap(submodules-ready): ensure-worktree reuse arm inits the submodule" "0/ /one" "$V_SM4"

FX_SM5="$(sm_fixture)"; R_SM5="${FX_SM5%% *}"
WT_SM5="$(new_wt_path)"
git -C "$R_SM5" worktree add -q "$WT_SM5" integration/myplan/phase-1 >/dev/null 2>&1
OUT_SM5="$( ( cd "$R_SM5" && env $SM_ALLOW bash "$SCRIPT" ensure-refinery-worktree "$WT_SM5" integration/myplan/phase-1 ) 2>/dev/null )"; C_SM5=$?
V_SM5="$C_SM5/$(git -C "$WT_SM5" submodule status --recursive 2>/dev/null | cut -c1)/$(cat "$WT_SM5/sub/a.txt" 2>/dev/null)"
expect "reuse-gap(submodules-ready): refinery reuse arm inits the submodule" \
  "0/ /one/$WT_SM5" "$V_SM5/$OUT_SM5"

# The verb's own die guards, matched by their stderr text.
R_SMU="$(new_repo)"
ERR_SMU="$( (cd "$R_SMU" && bash "$SCRIPT" assert-submodules-ready) 2>&1 >/dev/null)"; C_SMU=$?
expect "verb usage guard: assert-submodules-ready with no argument exits 1 and prints usage" \
  "1/usage" "$C_SMU/$(printf '%s' "$ERR_SMU" | grep -Fq 'usage: assert-submodules-ready <worktree>' && echo usage || echo no-usage)"
D_SMS="$(mktemp -d 2>/dev/null || mktemp -d -t warsms)"; REPOS="$REPOS $D_SMS"
: > "$D_SMS/.gitmodules"
ERR_SMS="$( (cd "$D_SMS" && GIT_CEILING_DIRECTORIES="$(dirname "$D_SMS")" bash "$SCRIPT" assert-submodules-ready "$D_SMS") 2>&1 >/dev/null)"; C_SMS=$?
expect "verb status-read guard: a non-repo with .gitmodules exits 9 and names the status read" \
  "9/status-read" "$C_SMS/$(printf '%s' "$ERR_SMS" | grep -Fq "assert-submodules-ready: could not read the submodule status of '" && echo status-read || echo no-status-read)"

# ---------------------------------------------------------------------------
# Case (RG.5 / #1712 fix 1, End state 26) holder-naming die, ensure-worktree:
# the branch is already checked out at worktree A; provisioning worktree B on
# the same branch must die naming A's path (`checked out at <path>`), not just
# ask "is the branch checked out elsewhere?".
# ---------------------------------------------------------------------------
RRG5="$(new_repo)"
WTRG5A="$(new_wt_path)"
( cd "$RRG5" && bash "$SCRIPT" ensure-worktree "$WTRG5A" war/myplan/p8-t9 "$(git -C "$RRG5" rev-parse HEAD)" ) >/dev/null 2>&1
WTRG5A_PHYS="$(cd "$WTRG5A" && pwd -P)"
WTRG5B="$(new_wt_path)"
code="$(run_in "$RRG5" ensure-worktree "$WTRG5B" war/myplan/p8-t9 "$(git -C "$RRG5" rev-parse HEAD)")"
expect "holder-die(ensure-worktree): second worktree on a held branch fails loud" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
MSG_RG5="$(run_in_msg "$RRG5" ensure-worktree "$WTRG5B" war/myplan/p8-t9 "$(git -C "$RRG5" rev-parse HEAD)")"
expect "holder-die(ensure-worktree): die names the holder path (checked out at <path>)" \
  "yes" "$(printf '%s' "$MSG_RG5" | grep -Fq "checked out at $WTRG5A_PHYS" && echo yes || echo no)"

# ---------------------------------------------------------------------------
# Case (RG.6 / #1712 fix 1, End state 26) holder-naming die,
# ensure-refinery-worktree: the integration branch is held by worktree A; a
# second refinery worktree at B must die naming A's path.
# ---------------------------------------------------------------------------
RRG6="$(new_repo)"
git -C "$RRG6" branch integration/myplan/phase-8 HEAD
WTRG6A="$(new_wt_path)"
( cd "$RRG6" && bash "$SCRIPT" ensure-refinery-worktree "$WTRG6A" integration/myplan/phase-8 ) >/dev/null 2>&1
WTRG6A_PHYS="$(cd "$WTRG6A" && pwd -P)"
WTRG6B="$(new_wt_path)"
code="$(run_in "$RRG6" ensure-refinery-worktree "$WTRG6B" integration/myplan/phase-8)"
expect "holder-die(ensure-refinery-worktree): second refinery worktree on the held branch fails loud" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
MSG_RG6="$(run_in_msg "$RRG6" ensure-refinery-worktree "$WTRG6B" integration/myplan/phase-8)"
expect "holder-die(ensure-refinery-worktree): die names the holder path (checked out at <path>)" \
  "yes" "$(printf '%s' "$MSG_RG6" | grep -Fq "checked out at $WTRG6A_PHYS" && echo yes || echo no)"

# ---------------------------------------------------------------------------
# Case (RG.7 / #2087, plan 2026-09-06 Task 6.2) holder-naming die,
# ensure-publication-worktree: the working branch is held by worktree A; a
# second publication worktree at B must die naming A's path. The base die
# already carried the `ensure-publication-worktree: failed to add worktree`
# prefix, so the decisive token is the `checked out at <path>` holder clause.
# ---------------------------------------------------------------------------
RRG7="$(new_repo)"
git -C "$RRG7" branch dev/myplan-work HEAD
WTRG7A="$(new_wt_path)"
( cd "$RRG7" && bash "$SCRIPT" ensure-publication-worktree "$WTRG7A" dev/myplan-work ) >/dev/null 2>&1
WTRG7A_PHYS="$(cd "$WTRG7A" && pwd -P)"
WTRG7B="$(new_wt_path)"
code="$(run_in "$RRG7" ensure-publication-worktree "$WTRG7B" dev/myplan-work)"
expect "holder-die(ensure-publication-worktree): second publication worktree on the held branch fails loud" \
  "nonzero" "$([ "$code" -ne 0 ] && echo nonzero || echo zero)"
MSG_RG7="$(run_in_msg "$RRG7" ensure-publication-worktree "$WTRG7B" dev/myplan-work)"
expect "holder-die(ensure-publication-worktree): die carries the add-failure prefix" \
  "yes" "$(printf '%s' "$MSG_RG7" | grep -Fq "ensure-publication-worktree: failed to add worktree" && echo yes || echo no)"
expect "holder-die(ensure-publication-worktree): die names the holder path (checked out at <path>)" \
  "yes" "$(printf '%s' "$MSG_RG7" | grep -Fq "checked out at $WTRG7A_PHYS" && echo yes || echo no)"

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
# Helpers (defined in provision-worktrees.test-harness.sh):
#   branch_exists_in <repo> <ref> -> "yes"/"no", and mk_run_dir
# run-dir layout used by these cases mirrors production:
#   <repo>/.claude/teams/<run-id>/worktrees/<task-id>
# ---------------------------------------------------------------------------

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
# Case (T4.2b) teardown-phase <slug> <N> also reaps a run-scoped late-fix
# worktree (branch war/<slug>/<runIdShort>/p<N>-latefix-<k>), and keeps a
# late-fix worktree of another phase.
# ---------------------------------------------------------------------------
RT2B="$(new_repo)"
git -C "$RT2B" branch integration/myplan/phase-2 HEAD
TIPT2B="$(git -C "$RT2B" rev-parse integration/myplan/phase-2)"
RD2B="$(mk_run_dir "$RT2B" run-bbc)"
WTLF2="$RD2B/worktrees/latefix2"
WTLF3="$RD2B/worktrees/latefix3"
run_in "$RT2B" ensure-worktree "$WTLF2" war/myplan/run-2026/p2-latefix-1 "$TIPT2B" >/dev/null 2>&1
run_in "$RT2B" ensure-worktree "$WTLF3" war/myplan/run-2026/p3-latefix-1 "$TIPT2B" >/dev/null 2>&1
OWN_T42B="$RD2B/owned.txt"
printf 'integration/myplan/phase-2\n' > "$OWN_T42B"
expect "T4.2b setup: phase-2 late-fix worktree present before teardown" \
  "war/myplan/run-2026/p2-latefix-1" "$(wt_on_branch "$RT2B" "$WTLF2")"
expect "T4.2b setup: phase-3 late-fix worktree present before teardown" \
  "war/myplan/run-2026/p3-latefix-1" "$(wt_on_branch "$RT2B" "$WTLF3")"
code="$(run_in "$RT2B" teardown-phase --owned-file "$OWN_T42B" --run-dir "$RD2B" myplan 2)"
expect "teardown-phase (late-fix) exits 0" 0 "$code"
expect "teardown-phase: run-scoped p2 late-fix worktree gone from list" \
  "" "$(wt_on_branch "$RT2B" "$WTLF2")"
expect "teardown-phase: run-scoped p2 late-fix worktree dir removed" \
  "no" "$([ -d "$WTLF2" ] && echo yes || echo no)"
expect "teardown-phase: p3 late-fix worktree kept" \
  "war/myplan/run-2026/p3-latefix-1" "$(wt_on_branch "$RT2B" "$WTLF3")"

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
# Behavior (ensure + re-attach; the reuse paths (b)/(c) run the same
# examined-but-untouched submodule hygiene arm as ensure-worktree's reuse —
# #1476 gap 4, case RG.4 above):
#   (a) Not registered / empty dir -> `git worktree add <path> <integration-branch>` + .war-task
#   (b) Registered + present + HEAD on the integration branch -> reuse (marker
#         + reuse_hygiene submodule arm)
#   (c) Registered + present + HEAD detached or on a different branch AND tree CLEAN ->
#         `git -C <path> switch <integration-branch>` (re-attach), then reuse
#         + reuse_hygiene
#   (d) Registered + present + HEAD detached/different + tree DIRTY -> FAIL LOUD (never reset)
#   (e) Stale registry (dir gone) -> prune + recreate on the integration branch
#   (f) Non-empty unregistered dir -> fail loud (D7 discipline)
#

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
#        [remote rejected] with origin unmoved -> the same push again, up to
#                            3 retries after 10, 20 and 40 s, then exit 3 (#2626)
#        other non-zero    -> exit ESCALATE code (3)
#   3. ONLY on push success: git update-ref refs/heads/<working> <new-sha> <pre-push-local-tip>
#
# Exit codes:
#   0  -> push accepted; local follower advanced
#   2  -> push rejected ([rejected] token seen); local ref UNCHANGED
#   3  -> unrelated push error (not a non-ff rejection), or a [remote rejected]
#         push whose retries are spent or whose origin moved; escalate
#   6  -> EX_WRONG_BRANCH: invoked from a worktree whose HEAD is not <new-sha>;
#         no push attempted, all refs untouched (never 2 — #986)
#
# Test harness uses a bare origin + two clones to simulate cross-run races
# deterministically (same method as spec §12):
#   setup_origin_pair <slug> -> creates origin.git + clone1 + clone2;
#     echoes "clone1_path clone2_path origin_path" space-separated.
#   It is defined in provision-worktrees.test-harness.sh, with run_in_detached
#   and seed_working_branch.
# ---------------------------------------------------------------------------


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
# push-error exit-3 classification is now exercised directly by T2.9
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
# rc-guard path, never by the push-error die.
OUT3="$( ( cd "$C1_3" && git checkout --detach "$NEW_SHA3" >/dev/null 2>&1 && bash "$SCRIPT" land-advance working/myplan3 "$NEW_SHA3" ) 2>&1 )"
code=$?

expect "T2.3: origin unreachable -> ls-remote guard escalates (exit 3), not reland (2)" \
  "3" "$code"
expect "T2.3: failed-readback die uniquely names the rc-guard path (not the push-error die)" \
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
# comment STAY as defense in depth for a mid-push origin race. The lagging-ls-remote
# rows LA.1 to LA.4 in provision-worktrees.land.test.sh fixture that branch.
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
expect "T2.5d: unresolvable-HEAD die carries the 'could not resolve HEAD to a commit' substring (discriminates from T2.5c's die and the push-error die)" \
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
# contiguous [rejected] non-ff token cmd_land_advance matches), so
# classification falls through to the loud push-error die (the 0/2/3
# contract in cmd_land_advance's CLASSIFY header). This is the exit-3 route T2.3
# STOPPED exercising when it was reframed to prove the ls-remote rc-guard
# short-circuit (test-reframe-can-strand-adjacent-branch-coverage).
# Since #2626 the die comes only after 3 retries, because origin stays unmoved.
# This is the real-git end-to-end row for spent retries.
#
# Exit 3 is reached by several routes, and each dies LOUDLY with route-naming text.
# Route identity is therefore proved in TWO steps — (b)+(d) exclude the other
# routes; (c)+(e) then confirm the push was declined:
#   (b) ls-remote SUCCEEDS pre-call — closes the T2.3 rc-guard route by
#       construction (pre-receive is push-side; ls-remote is fetch-side);
#   (c) the token-distinctness fact asserted BY NAME (remote rejected present,
#       contiguous [rejected] absent) — a future git wording change fails HERE,
#       loud, not as an unexplained exit-code mismatch (never widen to bare
#       `rejected`; extend/adjudicate instead). (c) also proves the push is
#       pre-receive-DECLINED (exits non-zero), and the post-push origin readback
#       lives inside the `push_rc -eq 0` arm — a declined push never runs it;
#   (d) the land-advance invocation emits NEITHER the rc-guard die text ("could
#       not read the origin tip") NOR the phantom die text ("refusing to report a
#       land that did not advance") — a regression rerouting the fixture through
#       either route would surface that die text and fail (d), and a third row
#       excludes the post-push readback die. The remaining loud
#       exit-3 dies (unresolvable HEAD / unresolvable <new-sha>) are closed by
#       construction: the call detaches at $NEW_SHA9, so both resolve;
#   (e) origin tip byte-unchanged (still the seed) corroborates the declined push
#       in this fixture.
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
# present; the contiguous [rejected] token (what cmd_land_advance matches) is NOT.
PROBE9="$( ( cd "$C1_9" && git checkout --detach "$NEW_SHA9" >/dev/null 2>&1 && git push origin "HEAD:refs/heads/working/myplan9" ) 2>&1 )"
expect "T2.9: direct-push probe output contains 'remote rejected' (pre-receive declined)" \
  "1" "$(printf '%s' "$PROBE9" | grep -c 'remote rejected')"
expect "T2.9: direct-push probe output does NOT contain the contiguous [rejected] token (space-distinct)" \
  "0" "$(printf '%s' "$PROBE9" | grep -c '\[rejected\]')"

# Record refs before the land-advance call — a push-error exit 3 rewinds nothing.
FOLLOWER_BEFORE9="$(git -C "$C1_9" rev-parse refs/heads/working/myplan9)"
ORIGIN_BEFORE9="$(git -C "$C1_9" ls-remote origin refs/heads/working/myplan9 | cut -f1)"

# (d) Run land-advance, capturing BOTH combined output and exit code (T2.3/T2.6
# idiom; run_in_detached swallows stderr). The push-error die names its own route,
# and the die-text-ABSENCE assertions exclude the rc-guard (T2.3), phantom (T2.6)
# and readback exit-3 routes.
# A declined push prints "[remote rejected]" and origin does not move, so
# land-advance retries it 3 times (#2626). A sleep stub first on PATH records the
# waits, so the row runs at full speed.
SLEEP9_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t warsleep9)"
REPOS="$REPOS $SLEEP9_DIR"
printf '#!/bin/bash\nprintf "%%s " "$1" >> "$SLEEP9_DIR/sleeps"\n' > "$SLEEP9_DIR/sleep"
chmod +x "$SLEEP9_DIR/sleep"
OUT9="$( ( cd "$C1_9" && git checkout --detach "$NEW_SHA9" >/dev/null 2>&1 && SLEEP9_DIR="$SLEEP9_DIR" PATH="$SLEEP9_DIR:$PATH" bash "$SCRIPT" land-advance working/myplan9 "$NEW_SHA9" ) 2>&1 )"
CODE9=$?
expect "T2.9: a declined push is retried 3 times, after 10, 20 and 40 seconds" \
  "10 20 40 " "$(cat "$SLEEP9_DIR/sleeps" 2>/dev/null)"
expect "T2.9: pre-receive push rejection -> push-error die (exit 3)" \
  "3" "$CODE9"
expect "T2.9: push-error exit 3 does NOT emit the rc-guard die text (route distinct from T2.3)" \
  "0" "$(printf '%s' "$OUT9" | grep -c 'could not read the origin tip')"
expect "T2.9: push-error exit 3 does NOT emit the phantom die text (route distinct from T2.6)" \
  "0" "$(printf '%s' "$OUT9" | grep -c 'refusing to report a land that did not advance')"
expect "T2.9: the push-error die names the failed push" \
  "1" "$(printf '%s' "$OUT9" | grep -c 'git push failed (rc=1) after 3 retries:')"
expect "T2.9: the push-error die carries the push output" \
  "yes" "$(printf '%s' "$OUT9" | grep -q 'pre-receive hook declined' && echo yes || echo no)"
expect "T2.9: push-error exit 3 does NOT emit the readback die text (a declined push never reads back)" \
  "0" "$(printf '%s' "$OUT9" | grep -c 'the push exited 0')"

# (e) A push-error escalation rewinds nothing: local follower byte-identical,
# origin tip unchanged (still the seed — the rejected push never advanced it).
expect "T2.9: push-error leaves the local follower byte-identical to before" \
  "$FOLLOWER_BEFORE9" "$(git -C "$C1_9" rev-parse refs/heads/working/myplan9 2>/dev/null)"
expect "T2.9: push-error leaves the origin tip unchanged (still the seed)" \
  "$ORIGIN_BEFORE9" "$(git -C "$C1_9" ls-remote origin refs/heads/working/myplan9 | cut -f1)"


# ---------------------------------------------------------------------------
finish provision-worktrees.core.test.sh
