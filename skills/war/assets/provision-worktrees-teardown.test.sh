#!/usr/bin/env bash
# Tests for the WAR provisioning script (skills/war/assets/provision-worktrees.sh):
# teardown-phase --worktree-root, the F08 and F09 guards, the teardown
# merged-guard, resolve-working-branch (RWB rows), ensure-integration base
# reconcile, ensure-publication-worktree, the exit-code catalogue and
# ensure-exclude, partial-phase recovery, and the large-registry and PIPE rows.
# The shared helpers live in provision-worktrees.test-lib.sh (its header
# describes the runner and the ownership seam). #2824 split the suite into
# three files so they run in parallel. Plain-bash assertion runner, bash 3.2
# safe, cwd-independent. Exit 0 = all cases passed.
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/provision-worktrees.test-lib.sh"

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
# Detach at the parent: the branch is then not checked out and is un-merged
# from HEAD, so real `git branch -d` refuses it and the classifier runs.
git -C "$RMG3" checkout --detach HEAD~1 >/dev/null 2>&1
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

# --- Case (RWB.f / 1.2(e)) LEAF-`dev` COLLISION (End state 16, #1380 D12): the
# desired branch is checked out (collision path engaged) AND a leaf branch `dev`
# exists, blocking the nested derived name's namespace. resolve-working-branch
# must fall back ONCE to the flat fallback name: echoed, created at the desired
# tip, checked out NOWHERE, ownership recorded (the RWB.a assertion set against
# the fallback name). Throwaway temp repo, never a shared fixture (the
# redteam-sandbox-residue lesson). ---
RWB_F="$(new_repo)"
DESIRED_F="$(git -C "$RWB_F" symbolic-ref --short HEAD)"    # checked out in main
TIP_F="$(git -C "$RWB_F" rev-parse HEAD)"
git -C "$RWB_F" branch dev                                  # the blocking leaf
OWN_F="$RWB_F/owned.txt"; : > "$OWN_F"
RESOLVED_F="$(run_out "$RWB_F" resolve-working-branch "$DESIRED_F" myplan 2026-07-06 --owned-file "$OWN_F")"
expect "RWB.f: leaf-dev collision echoes the FLAT fallback" \
  "war-2026-07-06-myplan" "$RESOLVED_F"
expect "RWB.f: flat fallback created at the desired tip" \
  "$TIP_F" "$(git -C "$RWB_F" rev-parse war-2026-07-06-myplan 2>/dev/null)"
expect "RWB.f: flat fallback is checked out NOWHERE" \
  "no" "$(checked_out_anywhere "$RWB_F" war-2026-07-06-myplan)"
expect "RWB.f: flat-fallback ownership recorded in the ledger" \
  "0" "$(grep -Fxq -- war-2026-07-06-myplan "$OWN_F"; echo $?)"
expect "RWB.f: the nested derived name was NOT created" \
  "1" "$(git -C "$RWB_F" rev-parse --verify -q dev/2026-07-06-myplan >/dev/null 2>&1; echo $?)"

# --- Case (RWB.g / 1.2(f)) planSlug VALIDATION (End state 17, #1380 D14): a
# fixture repo with a leaf branch `war/<slug>` blocks the task-branch namespace,
# so resolve-working-branch must die at Setup — BEFORE any task dispatch could
# hit the block mid-phase — naming the leaf in stderr. Die text captured via the
# T2.3/T2.6 inline idiom (run_in echoes only the exit code). The probe precedes
# the branch_checked_out_anywhere collision fork, so this one no-collision shape
# suffices for both paths. Exit is pinned to 1 (the plain-die default): this is
# a namespace/argument problem, deliberately NOT EX_FOREIGN(3).
RWB_G="$(new_repo)"
git -C "$RWB_G" branch war/myplan          # leaf at war/<slug>
git -C "$RWB_G" branch landing HEAD
git -C "$RWB_G" checkout -q --detach HEAD  # <desired> checked out nowhere
OUT_G="$( ( cd "$RWB_G" && bash "$SCRIPT" resolve-working-branch landing myplan 2026-07-06 ) 2>&1 )"; C_G=$?
expect "RWB.g: leaf war/<slug> dies with the plain-die exit 1 (never EX_FOREIGN)" \
  "1" "$C_G"
expect "RWB.g: the die names the blocking leaf" \
  "match" "$(printf '%s' "$OUT_G" | grep -Fq 'war/myplan' && echo match || echo nomatch)"
expect "RWB.g: the die names the remedy (a different plan slug)" \
  "match" "$(printf '%s' "$OUT_G" | grep -qi 'different plan slug' && echo match || echo nomatch)"
expect "RWB.g: no branch was echoed on stdout (died before either echo)" \
  "" "$(run_out "$RWB_G" resolve-working-branch landing myplan 2026-07-06)"

# --- Case (RWB.h / 1.2(g)) ACTIONABLE CUT-FAILURE DIE (End state 18, #1380
# D13): block the NESTED derived name from BELOW — a child ref makes it a ref
# DIRECTORY, which the D12 ancestor-segment probe (leaf `dev` only) cannot see —
# so the cut itself dies "cannot lock ref", exercising the D13 arm. The die must
# RETAIN a known git-stderr fragment AND name the `--working` remedy plus the
# blocking ref. Fragment DISJUNCTION per the RWB.e precedent: on a future
# git-wording miss EXTEND the fragment list, never weaken. ---
RWB_H="$(new_repo)"
DESIRED_H="$(git -C "$RWB_H" symbolic-ref --short HEAD)"   # collision engaged
git -C "$RWB_H" branch dev/2026-07-06-myplan/blocker
OUT_H="$( ( cd "$RWB_H" && bash "$SCRIPT" resolve-working-branch "$DESIRED_H" myplan 2026-07-06 ) 2>&1 )"; C_H=$?
expect "RWB.h: blocked cut exits non-zero (one fallback, then fail loud)" \
  "nonzero" "$([ "$C_H" -ne 0 ] && echo nonzero || echo zero)"
expect "RWB.h: die RETAINS a known git-stderr fragment" \
  "yes" "$(printf '%s' "$OUT_H" | grep -Eiq 'cannot lock ref|exists; cannot create' && echo yes || echo no)"
expect "RWB.h: die names the --working remedy" \
  "yes" "$(printf '%s' "$OUT_H" | grep -Fq -- '--working' && echo yes || echo no)"
# Discriminating needle: the WRAPPER's own diagnosis phrasing, which git's stderr
# never emits — a bare grep for the ref name would pass on modern git's own
# "'refs/heads/.../blocker' exists" text even with blocking_leaf_for deleted.
expect "RWB.h: die names the blocking ref via the wrapper's own diagnosis phrasing" \
  "yes" "$(printf '%s' "$OUT_H" | grep -Fq "the blocking ref is 'dev/2026-07-06-myplan/blocker'" && echo yes || echo no)"

# --- Case (RWB.i / 1.2(h)) FALLBACK RESUME-REUSE (End state 19, #1380 A3): a
# run that fell back to the flat name resumes — the second call with the same
# recorded owned-file returns the SAME flat branch and never re-cuts, even after
# the desired tip advances (the RWB.d shape against the fallback name). ---
RWB_I="$(new_repo)"
DESIRED_I="$(git -C "$RWB_I" symbolic-ref --short HEAD)"
git -C "$RWB_I" branch dev
OWN_I="$RWB_I/owned.txt"; : > "$OWN_I"
RESOLVED_I1="$(run_out "$RWB_I" resolve-working-branch "$DESIRED_I" myplan 2026-07-06 --owned-file "$OWN_I")"
FLAT_TIP_I1="$(git -C "$RWB_I" rev-parse war-2026-07-06-myplan 2>/dev/null)"
printf 'more\n' > "$RWB_I/more.txt"; git -C "$RWB_I" add -A; git -C "$RWB_I" commit -qm advance
code_rwbi="$(run_in "$RWB_I" resolve-working-branch "$DESIRED_I" myplan 2026-07-06 --owned-file "$OWN_I")"
expect "RWB.i: fallback resume call exits 0 (reuse, not error)" 0 "$code_rwbi"
RESOLVED_I2="$(run_out "$RWB_I" resolve-working-branch "$DESIRED_I" myplan 2026-07-06 --owned-file "$OWN_I")"
expect "RWB.i: resume returns the SAME flat branch" \
  "$RESOLVED_I1" "$RESOLVED_I2"
expect "RWB.i: flat branch did NOT move (never re-cut)" \
  "$FLAT_TIP_I1" "$(git -C "$RWB_I" rev-parse war-2026-07-06-myplan 2>/dev/null)"

# --- Case (RWB.j / 1.2(i)) CONTROL: leaf `dev` present but <desired> checked
# out NOWHERE — the no-collision path still echoes <desired> unchanged and cuts
# nothing. The `dev` probe fires only where a cut would happen. ---
RWB_J="$(new_repo)"
git -C "$RWB_J" branch dev
git -C "$RWB_J" branch landing HEAD
git -C "$RWB_J" checkout -q --detach HEAD
RESOLVED_J="$(run_out "$RWB_J" resolve-working-branch landing myplan 2026-07-06)"
expect "RWB.j: leaf dev + NO collision still echoes <desired> unchanged" \
  "landing" "$RESOLVED_J"
expect "RWB.j: no fallback branch created (probe fires only where a cut would happen)" \
  "1" "$(git -C "$RWB_J" rev-parse --verify -q war-2026-07-06-myplan >/dev/null 2>&1; echo $?)"

# --- Case (RWB.k / 1.2(h)) WIDENED-REUSE DISCRIMINATOR (End state 19, #1380
# A3): the blocking leaf `dev` is DELETED mid-run after the fallback cut, so on
# resume the freshly-derived candidate is the NESTED name again — only the
# widened BOTH-candidate reuse arm can find the recorded flat branch. A
# single-candidate reuse check (the pre-A3 shape) would re-cut
# dev/<date>-<slug> here; RWB.i keeps the leaf in place and cannot see that
# regression. ---
RWB_K="$(new_repo)"
DESIRED_K="$(git -C "$RWB_K" symbolic-ref --short HEAD)"
git -C "$RWB_K" branch dev
OWN_K="$RWB_K/owned.txt"; : > "$OWN_K"
RESOLVED_K1="$(run_out "$RWB_K" resolve-working-branch "$DESIRED_K" myplan 2026-07-06 --owned-file "$OWN_K")"
expect "RWB.k: first resolve fell back to the FLAT name (fixture precondition)" \
  "war-2026-07-06-myplan" "$RESOLVED_K1"
git -C "$RWB_K" branch -D dev >/dev/null 2>&1
RESOLVED_K2="$(run_out "$RWB_K" resolve-working-branch "$DESIRED_K" myplan 2026-07-06 --owned-file "$OWN_K")"
expect "RWB.k: leaf dev deleted mid-run — resume still returns the recorded FLAT name" \
  "war-2026-07-06-myplan" "$RESOLVED_K2"
expect "RWB.k: no nested dev/<date>-<slug> ref was cut on resume" \
  "1" "$(git -C "$RWB_K" rev-parse --verify -q dev/2026-07-06-myplan >/dev/null 2>&1; echo $?)"

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
# integration branch, less two landed divergences (the reuse hygiene arm and the
# dirty-reuse refusal; the script header carries the full set, plus one closed
# under #2087): behavior (b), where the publication verb also refuses a DIRTY
# reuse (#1083, case P.8) while the refinery verb still reuses unconditionally
# on-branch; reuse arms (b) and (c), where the refinery verb runs the
# reuse_hygiene submodule arm and emits its WORKTREE_HYGIENE markers (#1476
# gap 4) and this verb runs neither. The worktree-add failure die names the
# branch holder like the refinery twin (#2087, row RG.7 beside RG.5-RG.6).
# remove-publication-worktree <path> is a NO-FORCE,
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
# survives (no recreation). The sentinel is UNTRACKED on purpose — with P.8's
# behavior-(b) dirty refusal in place, this case is also the standing proof that
# `-uno` holds: untracked files never count as dirty, so reuse still exits 0.
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

# ---------------------------------------------------------------------------
# Case (P.8) Behavior (b) DIRTY reuse -> FAIL LOUD (#1083). Registered + present
# + HEAD already ON the working branch + one TRACKED-file modification: the
# stale-staging hazard — a docs(learnings) commit made on top sweeps those files
# in and can silently revert landed work.
#
# CRITICAL ASSERTION DESIGN: the exit code is pinned to the SPECIFIC
# EX_WRONG_BRANCH value (6), never merely non-zero — a crashed script also exits
# non-zero, so a nonzero-only assert (P.4's weaker form) cannot tell a deliberate
# refusal from a crash on the way to it. Refusal-only posture is asserted too:
# the tracked modification and the branch checkout must both survive (the P.4
# never-destroy idiom). Contrast P.2, whose UNTRACKED sentinel still reuses at
# exit 0 — `-uno` means untracked files never count as dirty.
# ---------------------------------------------------------------------------
RP8="$(new_repo)"
git -C "$RP8" branch "$WORKB" HEAD
WTP8="$(new_wt_path)"
run_in "$RP8" ensure-publication-worktree "$WTP8" "$WORKB" >/dev/null 2>&1
printf 'stale-tracked-change\n' >> "$WTP8/seed.txt"   # tracked-file modification
expect "P.8 setup: publication worktree is ON the working branch" \
  "$WORKB" "$(wt_on_branch "$RP8" "$WTP8")"
expect "P.8 setup: worktree is dirty (tracked-file modification)" \
  "dirty" "$([ -n "$(git -C "$WTP8" status --porcelain -uno 2>/dev/null)" ] && echo dirty || echo clean)"
code="$(run_in "$RP8" ensure-publication-worktree "$WTP8" "$WORKB")"
expect "on-branch+dirty reuse refused with EX_WRONG_BRANCH (6), never merely non-zero" \
  "6" "$code"
msg="$(run_in_msg "$RP8" ensure-publication-worktree "$WTP8" "$WORKB")"
expect "on-branch+dirty: refusal names the stale-staging hazard" \
  "match" "$(printf '%s' "$msg" | grep -qiE 'stale-staging|stale staging' && echo match || echo nomatch)"
expect "on-branch+dirty: refusal names the remove-then-re-provision remedy" \
  "match" "$(printf '%s' "$msg" | grep -qi 'remove-publication-worktree' && printf '%s' "$msg" | grep -qi 're-provision' && echo match || echo nomatch)"
expect "on-branch+dirty: tracked modification still present (nothing destroyed)" \
  "dirty" "$([ -n "$(git -C "$WTP8" status --porcelain -uno 2>/dev/null)" ] && echo dirty || echo clean)"
expect "on-branch+dirty: worktree still on the working branch (never switched away)" \
  "$WORKB" "$(wt_on_branch "$RP8" "$WTP8")"

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
# Case (large-registry) SIGPIPE false negative (#1840, #2007): the porcelain
# list exceeds 64 KiB and the main checkout, always its first entry, holds the
# branch. An early-exit grep then kills git, pipefail returns 141, and a live
# branch reads as free. Long paths keep the entry count, and the runtime, low.
# ---------------------------------------------------------------------------
LR="$(new_repo)"
LR_BRANCH="$(git -C "$LR" symbolic-ref --short HEAD)"
LR_SEG="$(printf '%0180d' 0)"
LR_DEEP="$(dirname "$(new_wt_path)")/$LR_SEG/$LR_SEG/$LR_SEG"
mkdir -p "$LR_DEEP"
lr_i=0
while [ "$lr_i" -lt 120 ]; do
  git -C "$LR" worktree add -q --detach --no-checkout "$LR_DEEP/wt$lr_i"
  lr_i=$((lr_i + 1))
done
expect "large-registry: the porcelain output exceeds 64 KiB" \
  "yes" "$([ "$(git -C "$LR" worktree list --porcelain | wc -c)" -gt 65536 ] && echo yes || echo no)"
expect "large-registry: the branch under test sits in the first entry" \
  "branch refs/heads/$LR_BRANCH" "$(git -C "$LR" worktree list --porcelain | sed -n 3p)"

# The landing-branch harm: a checked-out desired branch must never echo back.
expect "large-registry: resolve-working-branch cuts a dedicated branch for a first-entry match" \
  "dev/2026-10-31-lrplan" \
  "$( ( cd "$LR" && bash "$SCRIPT" resolve-working-branch "$LR_BRANCH" lrplan 2026-10-31 ) 2>/dev/null )"
expect "large-registry: an absent branch still reads as free" \
  "lr-absent" \
  "$( ( cd "$LR" && bash "$SCRIPT" resolve-working-branch lr-absent lrplan2 2026-10-31 ) 2>/dev/null )"

# A match outside the first entry: the drain must read the whole list.
git -C "$LR" worktree add -q -b lr-late "$LR_DEEP/wt-late"
expect "large-registry: a linked-worktree match also reads as checked out" \
  "dev/2026-10-31-lrplan3" \
  "$( ( cd "$LR" && bash "$SCRIPT" resolve-working-branch lr-late lrplan3 2026-10-31 ) 2>/dev/null )"
expect "large-registry: a branch name that only prefixes a live branch reads as free" \
  "lr-la" \
  "$( ( cd "$LR" && bash "$SCRIPT" resolve-working-branch lr-la lrplan4 2026-10-31 ) 2>/dev/null )"

# The phantom-dirty harm: sync-follower must not move a live branch.
LR_ORIG="$(dirname "$(new_wt_path)")/origin.git"
git init --bare -q "$LR_ORIG"
git -C "$LR" remote add origin "$LR_ORIG"
LR_TIP="$(git -C "$LR" rev-parse HEAD)"
LR_AHEAD="$(git -C "$LR" commit-tree "$LR_TIP^{tree}" -p "$LR_TIP" -m ahead)"
git -C "$LR" push -q origin "$LR_AHEAD:refs/heads/$LR_BRANCH"
expect "large-registry: setup leaves origin strictly ahead of the local branch" \
  "$LR_AHEAD" "$(git -C "$LR_ORIG" rev-parse "refs/heads/$LR_BRANCH")"
run_capture "$LR" sync-follower "$LR_BRANCH"
expect "large-registry: sync-follower exits 0" 0 "$CAP_CODE"
expect "large-registry: sync-follower takes the checked-out skip arm" \
  "match" "$(printf '%s' "$CAP_OUT" | grep -q 'skipping the follower fast-forward' && echo match || echo nomatch)"
expect "large-registry: sync-follower leaves a checked-out branch in place" \
  "$LR_TIP" "$(git -C "$LR" rev-parse "refs/heads/$LR_BRANCH")"

# ---------------------------------------------------------------------------
# Case (PIPE) one row per site converted from `printf | grep` to a case match.
# Each hit sits in the first line of an output over 64 KiB, so the old pipeline
# went red here too. A shim stands in for the two git calls that produce the
# output. Rows MG.2-MG.3 and T2.1/T2.9 pin the same sites with real git output.
# ---------------------------------------------------------------------------
PIPE_FILLER="$(dirname "$(new_wt_path)")/filler.txt"
awk 'BEGIN { for (i = 0; i < 2000; i++) printf "filler line %060d\n", i }' > "$PIPE_FILLER"
PIPE_SHIM="$(dirname "$(new_wt_path)")"
printf '#!/usr/bin/env bash\n' > "$PIPE_SHIM/git"
printf 'case "$1 ${2:-}" in\n' >> "$PIPE_SHIM/git"
printf '  "push "*|"branch -d") { printf "%%s\\n" "$PIPE_FIRST_LINE"; cat "$PIPE_FILLER"; } >&2; exit 1 ;;\n' >> "$PIPE_SHIM/git"
printf 'esac\n' >> "$PIPE_SHIM/git"
printf 'exec "%s" "$@"\n' "$(command -v git)" >> "$PIPE_SHIM/git"
chmod +x "$PIPE_SHIM/git"

# run_shimmed <first-output-line> <repo> <args...> -> run_in behind the git shim.
run_shimmed() {
  ( PIPE_FIRST_LINE="$1" PIPE_FILLER="$PIPE_FILLER" PATH="$PIPE_SHIM:$PATH"
    export PIPE_FIRST_LINE PIPE_FILLER PATH
    shift
    run_in "$@" )
}

# owned_has: a ledger over 64 KiB whose first line is the candidate.
RPO="$(new_repo)"
RPO_BRANCH="$(git -C "$RPO" symbolic-ref --short HEAD)"
git -C "$RPO" branch dev/2026-10-31-poplan
OWN_PO="$(dirname "$(new_wt_path)")/owned.txt"
printf 'dev/2026-10-31-poplan\n' > "$OWN_PO"
sed 's/ /-/g' "$PIPE_FILLER" >> "$OWN_PO"
expect "PIPE owned_has: a first-line member of a large ledger reads as owned" \
  "dev/2026-10-31-poplan" \
  "$( ( cd "$RPO" && bash "$SCRIPT" resolve-working-branch "$RPO_BRANCH" poplan 2026-10-31 --owned-file "$OWN_PO" ) 2>/dev/null )"
# A ledger row must match whole: a longer ref and a prefixed ref own nothing.
printf 'dev/2026-10-31-poplan-more\nxdev/2026-10-31-poplan\n' > "$OWN_PO"
expect "PIPE owned_has: a partial ledger row is foreign (exit 3)" \
  "3" "$(run_in "$RPO" resolve-working-branch "$RPO_BRANCH" poplan 2026-10-31 --owned-file "$OWN_PO")"

# delete_branch: the classifier keeps grep -i's case folding.
pipe_unmerged() {
  PIPE_R="$(new_repo)"
  git -C "$PIPE_R" checkout -q -b war/myplan/pipe-t1
  printf 'unmerged\n' > "$PIPE_R/unmerged.txt"
  git -C "$PIPE_R" add -A
  git -C "$PIPE_R" commit -qm "un-merged commit"
  git -C "$PIPE_R" checkout -q --detach HEAD~1
  PIPE_RD="$(mk_run_dir "$PIPE_R" run-pipe)"
  printf 'war/myplan/pipe-t1\n' > "$PIPE_RD/owned.txt"
  mkdir -p "$PIPE_RD/worktrees/task-pipe"
}
pipe_unmerged
expect "PIPE not fully merged: an upper-case hit exits 0" \
  "0" "$(run_shimmed "ERROR: the branch IS NOT FULLY MERGED." "$PIPE_R" teardown-task --force \
    --owned-file "$PIPE_RD/owned.txt" --run-dir "$PIPE_RD" "$PIPE_RD/worktrees/task-pipe" war/myplan/pipe-t1)"
expect "PIPE not fully merged: an upper-case hit with --force escalates to -D" \
  "no" "$(branch_exists_in "$PIPE_R" war/myplan/pipe-t1)"
pipe_unmerged
expect "PIPE not fully merged: any other error exits 0" \
  "0" "$(run_shimmed "error: some other refusal" "$PIPE_R" teardown-task --force \
    --owned-file "$PIPE_RD/owned.txt" --run-dir "$PIPE_RD" "$PIPE_RD/worktrees/task-pipe" war/myplan/pipe-t1)"
expect "PIPE not fully merged: any other error leaves the branch even with --force" \
  "yes" "$(branch_exists_in "$PIPE_R" war/myplan/pipe-t1)"

# land-advance: the token is a literal, so a miss stays a plain push error.
PIPE_PAIR="$(setup_origin_pair)"
PIPE_C1="$(printf '%s' "$PIPE_PAIR" | cut -d' ' -f1)"
PIPE_C2="$(printf '%s' "$PIPE_PAIR" | cut -d' ' -f2)"
seed_working_branch "$PIPE_C1" "$PIPE_C2" working/pipe >/dev/null
printf 'pipe\n' > "$PIPE_C1/pipe.txt"
git -C "$PIPE_C1" add -A
git -C "$PIPE_C1" commit -qm "new sha for PIPE"
PIPE_NEW="$(git -C "$PIPE_C1" rev-parse HEAD)"
git -C "$PIPE_C1" checkout -q --detach "$PIPE_NEW"
expect "PIPE [rejected]: a first-line token reads as a reland (exit 2)" \
  "2" "$(run_shimmed " ! [rejected] HEAD -> working/pipe (fetch first)" "$PIPE_C1" land-advance working/pipe "$PIPE_NEW")"
expect "PIPE [rejected]: bare letters of the token stay a plain push error (exit 3)" \
  "3" "$(run_shimmed "rejected by the remote" "$PIPE_C1" land-advance working/pipe "$PIPE_NEW")"


# ---------------------------------------------------------------------------
finish provision-worktrees-teardown.test.sh
