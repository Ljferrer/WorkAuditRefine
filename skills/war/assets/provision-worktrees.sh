#!/usr/bin/env bash
# WAR worktree provisioning — refiner-owned git-topology lifecycle.
#
# This is the single tested shell asset that owns all shared git-state mutation
# for a WAR run: the plan-namespaced integration branch, per-task worktrees,
# their .war-task markers, idempotent "ensure" with conservative heal,
# run-scoped teardown, and .git/info/exclude upkeep. The Workflow template stays
# thin and calls these subcommands from the refiner's Provision barrier.
#
# Subcommands (this file):
#   ensure-integration <slug> <N> <base> [--owned-file PATH] [--owned REF]... [--reclaim-empty-orphan]  (Task 2 + 1.4/G)
#   record-as-owned <branch> <base> --owned-file PATH                          (partial-phase recovery §4.1)
#   ensure-exclude [<repo-dir>]                                                (Task 2 + 1.4/F)
#   ensure-worktree <path> <branch> <integration-tip> [--reclaim-stale-remote] (Task 3 + partial-phase recovery §4.4)
#   sync-follower <branch>                                                     (partial-phase recovery §4.6)
#   land-advance <working-ref> <new-sha>                                       (Task 2/clandiso)
#   ensure-refinery-worktree <path> <integration-branch>                       (Task 1/clandiso)
#   ensure-publication-worktree <path> <working-branch>                        (servitor-learnings-write-path)
#   remove-publication-worktree <path>                                         (servitor-learnings-write-path)
#   resolve-working-branch <desired> <slug> <date> [--owned-file PATH] [--owned REF]...  (checkout-guard)
#   ensure-origin <resolved>                                                    (checkout-guard)
#   teardown-task [--keep] --run-dir <ledger-dir> <path> <branch>              (Task 4)
#   teardown-phase [--keep] --run-dir <ledger-dir> [--worktree-root <r>] <s> <N>  (Task 4 + clandiso/T3)
#   prune                                                                      (Task 4)
#
# Design notes:
# - Branches are plan-namespaced: integration/<slug>/phase-<N> (ADR 0003). Refs
#   are global to a repo, so two runs of different plans would otherwise collide.
# - Ownership seam (ADR 0003): the run tells us which refs it owns. A branch that
#   already exists AND is recorded as ours is a legitimate resume -> reuse, never
#   re-cut. A branch that exists but is NOT ours is a foreign collision -> fail
#   loud. Ownership is supplied two interchangeable ways, both pure-bash testable:
#     --owned-file PATH : a newline-delimited ledger of owned refs we READ; and,
#                         when we create a branch, we APPEND its ref so a later
#                         resume sees it as ours.
#     --owned REF       : repeatable; declare a specific ref as ours inline.
#   In production the --owned-file is the run ledger's branch list under
#   .claude/teams/<run-id>/; the seam stays exercisable without a live harness.
# - .git/info/exclude carries a `.claude/` line so a nested worktree under
#   .claude/ does not show as untracked in the parent `git status` (probe E2).
# - ensure-worktree is idempotent "ensure" with CONSERVATIVE heal (D4/D7): create
#   fresh on the integration tip with a .war-task marker; reuse a present worktree
#   untouched (never reset a branch that may carry un-merged commits); prune +
#   recreate only when the registry is stale (dir gone) — recreation re-checks-out
#   the existing branch, so its commits, which live in the ref, are never lost;
#   and FAIL LOUD (never delete) on an unregistered dir that already holds files.
# - teardown is STRICTLY RUN-SCOPED (D9): the refiner supplies the current run's
#   ledger dir (<repo-root>/.claude/teams/<run-id>) via --run-dir, and teardown
#   only ever removes a worktree whose path is INSIDE that dir. A sibling worktree
#   of a DIFFERENT run-id (which may be paused on an escalation) is never touched;
#   teardown-task on an out-of-run path FAILS LOUD. teardown-task on a landed task
#   removes the worktree + deletes the merged branch; --keep (escalation/block)
#   leaves both intact for inspection. teardown-phase removes the phase's
#   integration branch + this run's remaining phase worktrees. prune clears only
#   THIS repo's stale registry (git worktree prune is per-repo), so a worktree
#   registered to a different repo/run is never pruned. Cross-run cleanup is
#   manual / out-of-scope.
#
# Constraint: macOS bash 3.2.57 — no globstar, no associative arrays, no ${,,}.
set -euo pipefail

# --- diagnostics ------------------------------------------------------------
PROG="provision-worktrees"
die()  { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-1}"; }
warn() { printf '%s: %s\n' "$PROG" "$1" >&2; }

# --- exit-code catalogue (E, ADR 0034) --------------------------------------
# Every coded `die` passes one of these named constants; a test forbids any
# uncatalogued numeric-literal exit (`die "…" 3`). SURFACING CONTRACT (single
# source of non-zero meanings): the refiner treats ANY non-zero exit as a HALT —
# these names document the DOMINANT meaning of each code, not a per-site semantic
# contract. Codes are deliberately overloaded where the halt-semantics are
# identical (the grep-assertion enforces catalogued constants, not per-site
# uniqueness). Code 1 is the generic `die` default (the ${2:-1} fallback) and is
# intentionally left unnamed.
#   3 EX_FOREIGN      — foreign/unowned ref, or a land that did not advance:
#                       ensure-integration foreign branch, teardown ownership
#                       gate, resolve-working-branch foreign name, land-advance
#                       no-advance/escalation. ADR 0003 (ownership) / ADR 0023
#                       (land-truth guard). Overloaded — halt-semantics identical.
#   4 EX_DIRTY_UNREG  — a non-empty, unregistered dir at a worktree path; refuse
#                       to delete unmanaged data. ADR 0003 (D7).
#   5 EX_OUT_OF_RUN   — a teardown target outside the current run-dir scope;
#                       cross-run cleanup is manual. ADR 0003 (D9).
#   6 EX_WRONG_BRANCH — a registered worktree on the wrong branch, or a dirty
#                       tree we refuse to switch/remove (never destroy work).
#                       ADR 0008 (repair toward git; never destroy work).
#   7 EX_DIVERGED     — local <base> and origin/<base> have diverged; only the
#                       operator can adjudicate which side is real. ADR 0008.
#                       Also sync-follower's ahead/diverged follower vs origin.
#   8 EX_STALE_REMOTE — ensure-worktree fresh-cut found an unmerged remote task
#                       branch that is NOT an ancestor of the frozen integration
#                       tip: a STALE PRIOR ATTEMPT (§4.4, #650). The direct-
#                       invocation contract; the provision barrier keys on the
#                       STALE_REMOTE marker token (never this number) and classi-
#                       fies the task per-task (env-blocked), never a phase halt.
readonly EX_FOREIGN=3
readonly EX_DIRTY_UNREG=4
readonly EX_OUT_OF_RUN=5
readonly EX_WRONG_BRANCH=6
readonly EX_DIVERGED=7
readonly EX_STALE_REMOTE=8

# --- git helpers ------------------------------------------------------------
# Resolve the repo's git dir once; ensure-exclude writes inside it. Run from any
# cwd within a working tree.
git_dir() { git rev-parse --git-dir 2>/dev/null || die "not inside a git repository"; }

# branch_exists <ref> -> 0 if the local branch ref exists.
branch_exists() {
  git show-ref --verify --quiet "refs/heads/$1"
}

# phys <path> -> echo the physical (symlink-resolved) absolute path. If <path>
# does not exist yet, resolve its existing parent and re-attach the leaf, so a
# not-yet-created worktree path still normalizes the way `git worktree list`
# reports it (macOS /var -> /private/var).
phys() {
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

# worktree_registered <abs-path> -> 0 if <abs-path> is a registered worktree of
# this repo (present in `git worktree list`, dir-on-disk or stale alike). Matches
# on the physical path so symlinked temp dirs compare equal.
worktree_registered() {
  want="$(phys "$1")"
  git worktree list --porcelain 2>/dev/null | awk -v want="$want" '
    /^worktree / { if (substr($0, 10) == want) { found = 1 } }
    END { exit (found ? 0 : 1) }
  '
}

# branch_checked_out_anywhere <ref> -> 0 if <ref> is the checked-out branch of
# ANY worktree of this repo (main checkout or any linked worktree), per
# `git worktree list --porcelain` (each entry emits `branch refs/heads/<ref>`
# when on a branch; detached entries emit no `branch` line). This is exactly the
# "launch-worktree collision" condition: a ref checked out somewhere cannot be
# advanced by a push, so WAR must resolve a dedicated working branch instead.
branch_checked_out_anywhere() {
  git worktree list --porcelain 2>/dev/null | grep -Fxq -- "branch refs/heads/$1"
}

# exclude_line <exclude-file> <pattern> : append <pattern> to <exclude-file>
# exactly once (idempotent), creating the file and its dir as needed and keeping
# a clean line boundary if the file lacked a trailing newline.
exclude_line() {
  excl="$1"; pat="$2"
  mkdir -p "$(dirname "$excl")"
  [ -f "$excl" ] || : > "$excl"
  grep -Fxq -- "$pat" "$excl" && return 0
  if [ -s "$excl" ] && [ -n "$(tail -c 1 "$excl" 2>/dev/null)" ]; then
    printf '\n' >> "$excl"
  fi
  printf '%s\n' "$pat" >> "$excl"
}

# write_marker <worktree-path> : drop the .war-task marker at the worktree root.
# Idempotent; records minimal provenance for humans/auditors reading it. Also
# adds `.war-task` to the shared common-dir info/exclude so the marker never
# surfaces in ANY linked worktree's `git status`/`git add -A` — a worker staging
# with `git add -A` would otherwise track it, and the tracked blob collides with
# _refinery's own untracked marker, aborting the refiner merge as a spurious
# conflict. The exclude lives in the common dir, so one write covers every
# worktree (task, refinery, and the main checkout) at once.
write_marker() {
  printf 'WAR task worktree — provisioned by provision-worktrees.sh (do not delete).\nbranch=%s\n' \
    "${2:-}" > "$1/.war-task"
  common="$(git -C "$1" rev-parse --git-common-dir 2>/dev/null)" || return 0
  case "$common" in /*) ;; *) common="$1/$common" ;; esac   # resolve relative
  exclude_line "$common/info/exclude" '.war-task'
}

# --- ownership --------------------------------------------------------------
# We accumulate owned refs (one per line) in a single string. A trailing
# newline keeps grep -Fx happy on the empty case.
OWNED_REFS=""

owned_add() {
  # Skip blank lines defensively.
  [ -n "$1" ] || return 0
  OWNED_REFS="$OWNED_REFS$1
"
}

# owned_has <ref> -> 0 if <ref> is in the owned set.
owned_has() {
  printf '%s' "$OWNED_REFS" | grep -Fxq -- "$1"
}

# load_owned_file <path> : append each non-blank line of <path> to the owned set.
# A missing file is fine (an as-yet-empty ledger) — we simply own nothing from it.
load_owned_file() {
  [ -f "$1" ] || return 0
  # Read line by line; handles a final line with no trailing newline.
  while IFS= read -r line || [ -n "$line" ]; do
    owned_add "$line"
  done < "$1"
}

# record_owned_file <path> <ref> : append <ref> to the owned-file ledger so a
# later resume recognizes it as ours. No-op if the ledger path was not supplied
# or the ref is already present.
record_owned_file() {
  ofile="$1"; ref="$2"
  [ -n "$ofile" ] || return 0
  if [ -f "$ofile" ] && grep -Fxq -- "$ref" "$ofile"; then
    return 0
  fi
  # The ledger dir may not exist yet on a fresh run; under set -e a failed
  # append here would kill the script AFTER the branch was created but BEFORE
  # ownership was recorded, making a retry see its own branch as foreign (exit 3).
  mkdir -p "$(dirname "$ofile")"
  printf '%s\n' "$ref" >> "$ofile"
}

# --- subcommand: ensure-integration ----------------------------------------
# ensure-integration <slug> <N> <base> [--owned-file PATH] [--owned REF]...
# Reuse if the branch exists and is ours; fail loud if it exists but is not ours.
# On CREATE (branch absent) reconcile the local <base> against origin/<base>
# before cutting (ADR 0008 — git is the source of truth, and a fetch can reveal
# the LOCAL base is stale/diverged vs the shared remote): equal/ahead -> cut from
# local; behind -> cut from the ORIGIN tip + guarded follower fast-forward;
# diverged -> die (no branch created); fetch fails / no origin -> stderr warning +
# local cut (offline fallback). The owned resume/reuse path is never re-cut.
cmd_ensure_integration() {
  [ $# -ge 3 ] || die "usage: ensure-integration <slug> <N> <base> [--owned-file PATH] [--owned REF]... [--reclaim-empty-orphan]"
  slug="$1"; num="$2"; base="$3"; shift 3

  owned_file=""
  reclaim=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --owned-file)
        [ $# -ge 2 ] || die "--owned-file requires a path"
        owned_file="$2"; shift 2 ;;
      --owned)
        [ $# -ge 2 ] || die "--owned requires a ref"
        owned_add "$2"; shift 2 ;;
      --reclaim-empty-orphan)
        reclaim=1; shift ;;
      *) die "ensure-integration: unknown argument '$1'" ;;
    esac
  done

  [ -n "$slug" ] || die "ensure-integration: empty <slug>"
  case "$num" in
    ''|*[!0-9]*) die "ensure-integration: <N> must be a positive integer, got '$num'" ;;
  esac

  load_owned_file "$owned_file"

  branch="integration/$slug/phase-$num"

  if branch_exists "$branch"; then
    if owned_has "$branch"; then
      # Legitimate resume: reuse as-is. NEVER re-cut or move it.
      printf '%s\n' "$branch"
      return 0
    fi
    # Unowned branch in this run's EXACT namespace (it is integration/<slug>/
    # phase-<N> by construction). Default: fail loud (ADR 0003). Opt-in
    # --reclaim-empty-orphan (G, Lead-supplied only on a SANCTIONED recovery
    # relaunch) is a TWO-PROOF self-heal for a HALF-RUN orphan — a branch a
    # crashed provision cut but never recorded as owned
    # (provision-nonidempotent-orphan-integration-branch-blocks-relaunch). BOTH
    # proofs must hold or we fall through to the unchanged EX_FOREIGN die. Every
    # proof FAILS LOUD on a git ERROR — a non-zero rc is never read as a pass
    # (#728; lessons reclaim-empty-orphan-proof-swallows-git-log-error-as-empty +
    # ensure-origin-swallows-stderr-unlike-sibling-subcommands):
    #   (0) <base> resolves to a commit — an unresolvable base cannot prove
    #       emptiness, so it dies EX_FOREIGN BEFORE proof 1 runs, never a pass.
    #   (1) `git log <base>..<branch>` EMPTY with rc 0 — the orphan carries no
    #       unique commits, so deleting it resets no work (ADR 0008 conservative
    #       heal; no ahead-check ref-reset path — provision-conservative-heal
    #       lesson). The rc is captured SEPARATELY from stdout (the _tmp_err idiom
    #       the fetch path below uses); a non-zero rc dies EX_FOREIGN surfacing
    #       git's own stderr, NEVER swallowed into empty output.
    #   (2) `git ls-remote --exit-code origin <branch>` ABSENT — never published.
    # Any proof fails => die EX_FOREIGN (never delete unique or published work).
    if [ "$reclaim" -eq 1 ]; then
      # Proof 0: the base must resolve. An unresolvable base cannot prove the
      # orphan empty, so it is an operator error, never a silent pass (#728).
      git rev-parse --verify --quiet "$base^{commit}" >/dev/null \
        || die "ensure-integration: --reclaim-empty-orphan given, but the base '$base' does not resolve to a commit — cannot prove '$branch' is empty against an unresolvable base. Refusing to delete (ADR 0008: a git error is never 'proven empty'). Fix the base ref or adjudicate by hand." "$EX_FOREIGN"
      # Proof 1: capture git log's rc SEPARATELY from its output; a non-zero rc
      # dies (never collapses into empty). Only rc-0 empty output passes.
      _tmp_err="$(mktemp 2>/dev/null || mktemp -t warreclaim)"
      orphan_rc=0
      orphan_commits="$(git log --oneline "$base..$branch" 2>"$_tmp_err")" || orphan_rc=$?
      if [ "$orphan_rc" -ne 0 ]; then
        _orphan_err="$(cat "$_tmp_err")"; rm -f "$_tmp_err"
        die "ensure-integration: --reclaim-empty-orphan: could not compute the commits of '$branch' ahead of '$base' (git log failed, rc=$orphan_rc); refusing to treat a failed proof as 'proven empty' (ADR 0008). git: $_orphan_err" "$EX_FOREIGN"
      fi
      rm -f "$_tmp_err"
      if [ -z "$orphan_commits" ] \
         && ! git ls-remote --exit-code origin "refs/heads/$branch" >/dev/null 2>&1; then
        warn "ensure-integration: --reclaim-empty-orphan: '$branch' is unowned but PROVEN EMPTY (no commits ahead of '$base') AND origin-ABSENT — deleting and re-cutting it (ADR 0008: resets no work)."
        git branch -D "$branch" >/dev/null 2>&1 \
          || die "ensure-integration: failed to delete the proven-empty orphan '$branch' for reclaim (still checked out somewhere?)." "$EX_FOREIGN"
        # Branch now absent -> fall through to the create/reconcile path below.
      else
        die "ensure-integration: --reclaim-empty-orphan given, but '$branch' is NOT a reclaimable orphan — it has unique commits ahead of '$base' OR is present on origin. Refusing to delete unique or published work (ADR 0008). Adjudicate by hand, or adopt it with record-as-owned." "$EX_FOREIGN"
      fi
    else
      die "foreign branch '$branch' already exists and is not owned by this run; refusing to reuse or overwrite it (see ADR 0003). If this is a stale ref from a prior run, delete it or adopt it with record-as-owned (or pass --reclaim-empty-orphan on a sanctioned recovery relaunch to self-heal a proven-empty orphan)." "$EX_FOREIGN"
    fi
  fi

  # Absent -> create. Before cutting, reconcile the local <base> against
  # origin/<base> (ADR 0008). Fetch stderr is captured via the _tmp_err idiom
  # (the same idiom cmd_ensure_origin's push now uses too) so the offline
  # fallback surfaces git's own diagnostic. Resolution:
  #   fetch fails / no origin -> warn, cut from local base (offline = today).
  #   local == origin         -> cut from local (unchanged).
  #   local behind origin     -> cut from the ORIGIN tip; then fast-forward the
  #                              local follower ref (guarded CAS), SKIPPED with a
  #                              warning when <base> is checked out anywhere (moving
  #                              a live ref phantom-dirties that checkout; the cut
  #                              still used the origin tip, so correctness holds).
  #   local ahead of origin   -> cut from local (origin is the stale side).
  #   diverged (neither anc.)  -> die non-zero, NO branch created, both SHAs + the
  #                              two ADR-0008 repair directions (operator picks).
  #   no LOCAL ref, origin ok  -> §4.7 (#725.4): cut from the ORIGIN tip with a
  #                              warn (origin fallback; no follower ff to do).
  #   neither resolvable       -> §4.7 (#725.4): die with the NAMED missing-local-
  #                              ref diagnostic (not the raw "not a valid object").
  cut_ref="$base"
  do_follower_ff=0
  origin_sha=""
  local_sha=""
  _tmp_err="$(mktemp 2>/dev/null || mktemp -t warfetch)"
  if git fetch origin "$base" >/dev/null 2>"$_tmp_err"; then
    rm -f "$_tmp_err"
    origin_sha="$(git rev-parse FETCH_HEAD 2>/dev/null || true)"
    local_sha="$(git rev-parse --verify --quiet "refs/heads/$base" 2>/dev/null || true)"
    if [ -n "$origin_sha" ] && [ -n "$local_sha" ]; then
      if [ "$local_sha" = "$origin_sha" ]; then
        :   # equal: cut from local (== origin).
      elif git merge-base --is-ancestor "$local_sha" "$origin_sha" 2>/dev/null; then
        cut_ref="$origin_sha"   # behind: cut from the origin tip, ff the follower.
        do_follower_ff=1
      elif git merge-base --is-ancestor "$origin_sha" "$local_sha" 2>/dev/null; then
        :   # ahead: cut from local (origin is the stale side).
      else
        die "ensure-integration: local '$base' ($local_sha) and origin/$base ($origin_sha) have DIVERGED — neither is an ancestor of the other, so no branch was created. Only the operator can adjudicate which side is real (ADR 0008 — git is the source of truth, but here two gits disagree). Inspect both: 'git log --oneline $origin_sha..$local_sha' (local-only commits) and 'git log --oneline $local_sha..$origin_sha' (origin-only commits). Then EITHER reconcile local onto origin (rebase/merge onto origin/$base) and relaunch, OR — if origin is the stale side — push local to advance origin/$base and relaunch. This script never picks a side." "$EX_DIVERGED"
      fi
    elif [ -n "$origin_sha" ] && [ -z "$local_sha" ]; then
      # §4.7 (#725.4): no LOCAL base ref, but origin resolved (an origin-only
      # working branch). Cut from the ORIGIN tip; NO follower ff — there is no
      # local ref to move (the follower stays absent, which land-advance's create
      # branch and sync-follower both handle later).
      cut_ref="$origin_sha"
      warn "ensure-integration: local '$base' has no ref; cutting '$branch' from the origin tip ($origin_sha) — origin fallback (no local follower to move)."
    fi
  else
    _fetch_err="$(cat "$_tmp_err")"; rm -f "$_tmp_err"
    warn "ensure-integration: could not fetch origin/$base (offline, or no origin remote); proceeding with the local base '$base'. git: $_fetch_err"
  fi

  # §4.7 (#725.4): if the resolved cut ref does not name a commit, the base has
  # NO local ref AND origin did not resolve it (both empty). Die with a NAMED
  # missing-local-ref diagnostic rather than letting `git branch` surface the raw
  # "not a valid object name" as held:workflow-error (lesson
  # war-provision-barrier-needs-local-working-branch-ref).
  if ! git rev-parse --verify --quiet "$cut_ref^{commit}" >/dev/null 2>&1; then
    die "ensure-integration: base '$base' has no local ref and could not be resolved on origin — cannot cut '$branch'. Create the local working branch, or check the branch name; the provision barrier needs a LOCAL working-branch ref (lesson war-provision-barrier-needs-local-working-branch-ref)." "$EX_FOREIGN"
  fi

  # Cut the integration branch from the resolved ref. Capture stderr so a bad ref
  # surfaces git's own diagnostic in the die message.
  _tmp_err="$(mktemp 2>/dev/null || mktemp -t warbranch)"
  git branch "$branch" "$cut_ref" >/dev/null 2>"$_tmp_err" \
    || { _git_branch_err="$(cat "$_tmp_err")"; rm -f "$_tmp_err"; die "failed to create branch '$branch' at base '$cut_ref': $_git_branch_err"; }
  rm -f "$_tmp_err"

  # Behind case: fast-forward the local follower ref to the origin tip so it no
  # longer lags. Guarded CAS (expected old value = local_sha). Skipped when <base>
  # is checked out anywhere.
  if [ "$do_follower_ff" -eq 1 ]; then
    if branch_checked_out_anywhere "$base"; then
      warn "ensure-integration: local '$base' is behind origin/$base but is checked out in a worktree; skipping the follower fast-forward (the integration branch was cut from the origin tip regardless)."
    else
      git update-ref "refs/heads/$base" "$origin_sha" "$local_sha" \
        || warn "ensure-integration: could not fast-forward local '$base' to the origin tip (concurrent move?); the integration branch was still cut from the origin tip."
    fi
  fi

  record_owned_file "$owned_file" "$branch"
  printf '%s\n' "$branch"
}

# --- subcommand: record-as-owned -------------------------------------------
# record-as-owned <branch> <base> --owned-file PATH
#
# Tooled ADOPTION of a non-empty orphaned integration branch (§4.1, #725.1). A
# held partial phase leaves integration/<slug>/phase-<N> carrying real merged
# commits, so --reclaim-empty-orphan's proven-empty delete correctly REFUSES it.
# Recovery is ADOPTION, not deletion (ADR 0008): append <branch> to the
# --owned-file ledger so a sanctioned recovery relaunch hits ensure-integration's
# unchanged owned-reuse path ("Legitimate resume: reuse as-is. NEVER re-cut or
# move it."). This subcommand REPAIRS THE RECORD TOWARD GIT and creates, moves,
# or deletes NO ref.
#
# Proof 1 (mechanical, lineage): rev-parse --verify --quiet BOTH <branch> and
#   <base> (die EX_FOREIGN on either — same fail-loud discipline as the reclaim
#   proof), then require `git merge-base --is-ancestor <base> <branch>`. A branch
#   that does not strictly descend from the supplied frozen phase base is foreign
#   work, not this run's partial phase -> die EX_FOREIGN.
# Proof 2 (procedural, sanction): print the `git log --oneline <base>..<branch>`
#   ahead-commits to stdout BEFORE recording, so the invocation is an INFORMED
#   sanction. Deliberately PROSE-ADJUDICATED, not mechanized: task merges land
#   under fast-forward topology (plus phase-close sweep polish merges), so a
#   second-parent/merge-shape classifier would false-refuse legitimate histories.
#   The Lead's standing duty (SKILL.md runbook) is to map every listed commit to
#   a merged task before invoking; an unexplained commit halts recovery (ADR 0008).
# On both proofs: append <branch> via record_owned_file — idempotent
#   (already-recorded is a no-op, exit 0; it mkdir -p's the ledger dir, so a
#   not-yet-existing new-run ledger is fine).
cmd_record_as_owned() {
  owned_file=""; branch=""; base=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --owned-file)
        [ $# -ge 2 ] || die "--owned-file requires a path"
        owned_file="$2"; shift 2 ;;
      --) shift; break ;;
      -*) die "record-as-owned: unknown flag '$1'" ;;
      *)
        if [ -z "$branch" ]; then branch="$1"
        elif [ -z "$base" ]; then base="$1"
        else die "record-as-owned: too many positional arguments (usage: record-as-owned <branch> <base> --owned-file PATH)"
        fi
        shift ;;
    esac
  done
  [ -n "$branch" ] || die "usage: record-as-owned <branch> <base> --owned-file PATH"
  [ -n "$base" ]   || die "usage: record-as-owned <branch> <base> --owned-file PATH"
  [ -n "$owned_file" ] || die "record-as-owned: --owned-file PATH is required (the ledger the recovery relaunch will read)."

  git_dir >/dev/null

  # Proof 1 (lineage): both refs resolve; <base> is an ancestor of <branch>.
  git rev-parse --verify --quiet "$branch^{commit}" >/dev/null \
    || die "record-as-owned: branch '$branch' does not resolve to a commit — nothing to adopt (check the branch name)." "$EX_FOREIGN"
  git rev-parse --verify --quiet "$base^{commit}" >/dev/null \
    || die "record-as-owned: base '$base' does not resolve to a commit — cannot prove '$branch' descends from it (check the base ref)." "$EX_FOREIGN"
  if ! git merge-base --is-ancestor "$base" "$branch"; then
    die "record-as-owned: base '$base' is NOT an ancestor of '$branch' — the branch does not strictly descend from the frozen phase base, so it is foreign work, not this run's partial phase. Refusing to adopt it (ADR 0003/0008). Adjudicate by hand." "$EX_FOREIGN"
  fi

  # Proof 2 (informed sanction): print the ahead-commits so the Lead maps each to
  # a merged task before this record stands (an unexplained commit halts recovery,
  # ADR 0008). Prose-adjudicated, not mechanized (see the header rationale).
  printf 'record-as-owned: adopting orphan %s — commits ahead of %s (map each to a merged task before relaunch; an unexplained commit halts, ADR 0008):\n' "$branch" "$base"
  git log --oneline "$base..$branch"

  # Repair the record toward git: append <branch> idempotently. No ref created,
  # moved, or deleted.
  record_owned_file "$owned_file" "$branch"
}

# --- subcommand: ensure-exclude --------------------------------------------
# ensure-exclude [<repo-dir>]
#
# Append a `.claude/` line to .git/info/exclude exactly once (idempotent), so a
# nested worktree under .claude/ does not surface as untracked in the parent
# repo's `git status` (probe E2).
#
# Optional positional <repo-dir> (F): resolve the exclude via
# `git -C <repo-dir> rev-parse --git-dir`, so the Provision barrier can target
# the MAIN checkout's exclude explicitly from any cwd (the refiner runs from the
# _refinery worktree). Absent -> current-cwd git dir, BYTE-IDENTICAL to the old
# no-arg form (back-compat with the existing no-arg tests).
cmd_ensure_exclude() {
  [ $# -le 1 ] || die "ensure-exclude: too many arguments (usage: ensure-exclude [<repo-dir>])"
  if [ $# -eq 1 ]; then
    [ -n "$1" ] || die "ensure-exclude: empty <repo-dir>"
    gdir="$(git -C "$1" rev-parse --git-dir 2>/dev/null)" \
      || die "ensure-exclude: '$1' is not inside a git repository"
    # rev-parse --git-dir yields a path relative to <repo-dir>; anchor it so the
    # write lands in <repo-dir>'s git dir regardless of the caller's cwd.
    case "$gdir" in /*) ;; *) gdir="$1/$gdir" ;; esac
  else
    gdir="$(git_dir)"
  fi
  exclude_line "$gdir/info/exclude" '.claude/'
}

# dir_is_empty <path> -> 0 if <path> is a directory with no entries (dotfiles
# included). A missing path is NOT "empty" here (callers test -d separately).
dir_is_empty() {
  [ -d "$1" ] || return 1
  [ -z "$(ls -A "$1" 2>/dev/null)" ]
}

# --- subcommand: ensure-worktree -------------------------------------------
# ensure-worktree <path> <branch> <integration-tip> [--reclaim-stale-remote]
#
# On the FRESH-CUT path only (local <branch> absent), a stale-remote probe runs
# before the cut (§4.4, #650): origin/<branch> is classified against the frozen
# tip by ANCESTRY — an ancestor/equal remote is already-integrated work (warn +
# proceed); a non-ancestor remote is a STALE PRIOR ATTEMPT that dies
# EX_STALE_REMOTE (marker-led), or, with --reclaim-stale-remote (sanctioned
# recovery relaunch only), is deleted after three proofs and re-cut. See
# stale_remote_probe below. No path force-pushes.
#
# Idempotent "ensure" with conservative heal (D4/D7). The real guard is
# NEVER-RESET-ON-REUSE: we never destroy a worktree whose branch carries
# un-merged commits. Safety does NOT rely on a "branch is ahead?" pre-check —
# it is enforced structurally by never resetting or recreating a registered,
# present worktree. The heal cases are:
#   * Already a registered worktree, dir present  -> REUSE untouched (only make
#     sure the .war-task marker is there). Never reset <branch>; un-merged
#     commits survive because we never touch them.
#   * Registered but the dir is gone (stale registry) -> prune + recreate on
#     the existing <branch>. Commits live in the ref (never deleted by prune/
#     remove), so nothing is lost. Only safe because the dir is gone — there is
#     nothing to destroy.
#   * Not registered, no dir            -> create fresh on the integration tip.
#   * Not registered, empty dir         -> rmdir + create fresh (no data at risk).
#   * Not registered, NON-EMPTY dir     -> FAIL LOUD; never delete unmanaged data
#     (D7).
cmd_ensure_worktree() {
  reclaim_stale_remote=0
  path=""; branch=""; tip=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --reclaim-stale-remote) reclaim_stale_remote=1; shift ;;
      --) shift; break ;;
      -*) die "ensure-worktree: unknown flag '$1'" ;;
      *)
        if [ -z "$path" ]; then path="$1"
        elif [ -z "$branch" ]; then branch="$1"
        elif [ -z "$tip" ]; then tip="$1"
        else die "ensure-worktree: too many positional arguments (usage: ensure-worktree <path> <branch> <integration-tip> [--reclaim-stale-remote])"
        fi
        shift ;;
    esac
  done
  [ -n "$path" ]   || die "usage: ensure-worktree <path> <branch> <integration-tip> [--reclaim-stale-remote]"
  [ -n "$branch" ] || die "ensure-worktree: empty <branch>"
  [ -n "$tip" ]    || die "ensure-worktree: empty <integration-tip>"

  # Must be inside a working tree (git dir resolves) before we mutate anything.
  git_dir >/dev/null

  if worktree_registered "$path"; then
    if [ -d "$path" ]; then
      # REUSE: present and registered. Before adopting it, verify the checkout is
      # actually on <branch>. A path reused across phases without teardown-task
      # first can still be on a PRIOR branch (observed live: a p1 task worktree
      # left on war/<slug>/p1-task1 while a p2 task requested war/<slug>/p2-task1,
      # p2 never created). Writing the marker with <branch> then would claim a
      # branch the checkout is not on, and the worker would be dispatched against a
      # (possibly nonexistent) ref. Conservative heal — never reset a checkout that
      # may carry un-merged commits -> FAIL LOUD on mismatch (mirrors
      # ensure-refinery-worktree case (d)).
      # ponytail: fail-loud is the minimal safe fix; a clean-tree switch-to-<branch>
      # re-attach (like ensure-refinery-worktree cases c/d) could auto-heal instead.
      cur_branch="$(git -C "$path" symbolic-ref --short HEAD 2>/dev/null || true)"
      if [ "$cur_branch" != "$branch" ]; then
        die "ensure-worktree: worktree at '$path' is registered but checked out on '${cur_branch:-(detached)}', not the requested branch '$branch' — refusing to reuse it (the checkout may carry un-merged commits, and writing the marker would claim a branch the tree is not on). Run teardown-task for the prior branch first, or remove the worktree by hand." "$EX_WRONG_BRANCH"
      fi
      # Touch nothing but the marker (idempotent). Crucially we do NOT move/reset
      # <branch>, so un-merged commits survive.
      write_marker "$path" "$branch"
      printf '%s\n' "$path"
      return 0
    fi
    # STALE registry: the dir was removed out-of-band. Recreating re-checks-out
    # the existing branch; `git worktree prune` clears the dangling entry and
    # never deletes the branch or its commits, so this stays conservative.
    git worktree prune >/dev/null 2>&1 || true
  else
    # Not registered. An existing non-empty dir is unmanaged data -> fail loud.
    if [ -e "$path" ]; then
      if ! dir_is_empty "$path"; then
        die "refusing to provision worktree at '$path': a non-empty, unregistered directory already exists there (not a git worktree of this repo). Move or remove it by hand — provision-worktrees will not delete unmanaged data (D7)." "$EX_DIRTY_UNREG"
      fi
      # Empty dir: git worktree add wants to create the leaf itself, so clear the
      # empty placeholder (no data at risk — we just verified it is empty).
      rmdir "$path" 2>/dev/null || true
    fi
  fi

  # Create (or re-create after prune). If the branch already exists, check it out
  # as-is (preserves its commits); otherwise cut it at the integration tip.
  if branch_exists "$branch"; then
    git worktree add "$path" "$branch" >/dev/null 2>&1 \
      || die "failed to add worktree at '$path' on existing branch '$branch' (is the branch checked out elsewhere?)"
  else
    # FRESH CUT (local <branch> absent — the exact torn-down-locally-but-not-
    # remotely restart shape). Before cutting, probe origin for a STALE PRIOR
    # ATTEMPT: an unmerged remote task branch a prior run left behind (§4.4,
    # #650). The rc is captured SEPARATELY from output (a network failure warns
    # and proceeds — offline runs must still provision; the worker's push-handoff
    # escalation is the backstop, never a false stale classification; lesson
    # ensure-origin-swallows-stderr-unlike-sibling-subcommands).
    stale_remote_probe "$branch" "$tip" "$reclaim_stale_remote"
    git worktree add -b "$branch" "$path" "$tip" >/dev/null 2>&1 \
      || die "failed to add worktree at '$path' on new branch '$branch' at '$tip'"
  fi

  write_marker "$path" "$branch"
  printf '%s\n' "$path"
}

# stale_remote_probe <branch> <frozen-tip> <reclaim-flag> : on the fresh-cut path,
# classify origin/<branch> against the frozen integration tip (§4.4, #650). No ref
# or worktree is created here — this only probes/reclaims BEFORE the caller cuts.
#   ls-remote FAILS (rc!=0)          -> warn and return (fail-open; offline runs
#                                       must provision; a git error is never a
#                                       false stale classification).
#   remote ABSENT (rc 0, empty)      -> return (clean fresh cut).
#   remote tip IS an ancestor of (or == the) frozen tip -> already-integrated
#                                       work; warn and return (a later plain push
#                                       fast-forwards; NEVER flag or delete it —
#                                       that would punish the merged tasks a
#                                       recovery relaunch re-provisions).
#   remote tip is NOT an ancestor    -> a STALE PRIOR ATTEMPT.
#     * with <reclaim-flag>=1 (--reclaim-stale-remote, sanctioned recovery only):
#       delete the remote after THREE proofs — (1) the branch is in the
#       war/<slug>/pN-tK namespace, (2) the local ref is absent (guaranteed on
#       this path), (3) the remote is NOT an ancestor of the frozen tip (just
#       proven) — via `git push origin --delete` (rc-checked; NO force), warning
#       with the deleted SHA + the restore command, then return to cut fresh.
#     * without the flag: emit the machine-readable STALE_REMOTE marker line (the
#       barrier keys on the token, never the numeric code) and die EX_STALE_REMOTE
#       with both recovery directions + the restore command. No force-push exists
#       on any path — deletion + a later plain push is the recorded #650 Lead
#       reconciliation, now tooled.
stale_remote_probe() {
  sr_branch="$1"; sr_tip="$2"; sr_reclaim="$3"
  sr_rc=0
  sr_remote_sha="$(git ls-remote origin "refs/heads/$sr_branch" 2>/dev/null | cut -f1)" || sr_rc=$?
  if [ "$sr_rc" -ne 0 ]; then
    warn "ensure-worktree: could not probe origin for '$sr_branch' (offline, or no origin remote); proceeding with a fresh cut at the frozen tip. A stale prior attempt, if any, will surface later as a push rejection the worker escalates."
    return 0
  fi
  [ -n "$sr_remote_sha" ] || return 0   # remote absent: clean fresh cut.

  if git merge-base --is-ancestor "$sr_remote_sha" "$sr_tip" 2>/dev/null; then
    # Already-integrated work (ancestor of, or equal to, the frozen tip).
    warn "ensure-worktree: origin already has '$sr_branch' ($sr_remote_sha) as an ancestor of the frozen tip ($sr_tip) — already-integrated work; proceeding with a fresh cut (a later plain push fast-forwards)."
    return 0
  fi

  # NOT an ancestor -> a STALE PRIOR ATTEMPT.
  if [ "$sr_reclaim" -eq 1 ]; then
    # Proof 1 (namespace): the caller-supplied positional is proved in-script (every
    # destructive path here proves its own preconditions). Proofs 2 (local absent)
    # and 3 (non-ancestor) hold by construction on this path.
    case "$sr_branch" in
      war/*/p*-t*) ;;
      *) die "ensure-worktree: --reclaim-stale-remote refuses '$sr_branch' — not in the war/<slug>/pN-tK task-branch namespace; refusing to delete a remote ref outside this run's namespace (ADR 0003)." "$EX_FOREIGN" ;;
    esac
    git push origin --delete "refs/heads/$sr_branch" >/dev/null 2>&1 \
      || die "ensure-worktree: --reclaim-stale-remote: failed to delete the stale remote '$sr_branch' on origin (permission, or already gone?)."
    warn "ensure-worktree: --reclaim-stale-remote: DELETED the stale prior attempt origin/$sr_branch (was $sr_remote_sha); cutting fresh at the frozen tip ($sr_tip). Reversible until remote GC: git push origin $sr_remote_sha:refs/heads/$sr_branch"
    return 0
  fi

  # No flag: emit the machine-readable marker line FIRST (the barrier keys on the
  # STALE_REMOTE token, never the numeric exit code — live-artifact rule), then
  # die with the two-direction operator diagnostic + the restore command.
  printf 'STALE_REMOTE branch=%s remoteSha=%s frozenTip=%s\n' "$sr_branch" "$sr_remote_sha" "$sr_tip" >&2
  die "ensure-worktree: origin has '$sr_branch' at $sr_remote_sha, which is NOT an ancestor of the frozen integration tip $sr_tip — a STALE PRIOR ATTEMPT (an unmerged remote task branch left by a prior run whose local state was torn down). No ref or worktree was created. Reconcile one of two ways: (a) ADOPT the remote as the real work — 'git branch $sr_branch $sr_remote_sha' then relaunch (the existing-branch reuse path checks it out as-is); or (b) on a SANCTIONED recovery relaunch where the remote is a superseded attempt, pass --reclaim-stale-remote to delete it. Reversible until remote GC: git push origin $sr_remote_sha:refs/heads/$sr_branch" "$EX_STALE_REMOTE"
}

# --- run-scoping ------------------------------------------------------------
# All teardown is strictly run-scoped (D9): the refiner passes the current run's
# ledger dir (<repo-root>/.claude/teams/<run-id>) via --run-dir, and a worktree
# path is only ever removed if it sits INSIDE that dir. A sibling worktree
# belonging to a DIFFERENT run-id (which may be paused on an escalation) is thus
# never touched. We compare on physical (symlink-resolved) paths so /var vs
# /private/var on macOS compares equal.

# path_under <child> <ancestor> -> 0 if physical <child> is <ancestor> itself or
# lives beneath it. Pure string compare on resolved paths; no globbing surprises.
path_under() {
  c="$(phys "$1")"; a="$(phys "$2")"
  a="${a%/}"
  [ "$c" = "$a" ] && return 0
  case "$c" in
    "$a"/*) return 0 ;;
    *)      return 1 ;;
  esac
}

# require_in_run <path> <run-dir> : die unless <path> is inside <run-dir>.
require_in_run() {
  [ -n "$2" ] || die "teardown is run-scoped: --run-dir <ledger-dir> is required (refusing to act without a run scope)."
  [ -d "$2" ] || die "teardown --run-dir '$2' does not exist or is not a directory; refusing to act outside a known run scope."
  if ! path_under "$1" "$2"; then
    die "refusing to tear down '$1': it is OUTSIDE the current run-dir '$2' (a different run-id may own it, possibly paused on an escalation). Cross-run cleanup is manual (D9)." "$EX_OUT_OF_RUN"
  fi
}

# remove_worktree <abs-path> : remove a registered worktree of THIS repo if it is
# one, then prune any stale registry entry, then clear an empty leftover dir.
# Never deletes a non-empty unmanaged dir. Branch refs are never touched here.
remove_worktree() {
  wt="$1"
  if worktree_registered "$wt"; then
    # --force so a worktree with a dirty/owned checkout is still detached from the
    # registry; this removes the working dir but NEVER the branch ref or commits.
    git worktree remove --force "$wt" >/dev/null 2>&1 || true
  fi
  # Clear any dangling registry entry left if the dir was already gone.
  git worktree prune >/dev/null 2>&1 || true
  # If a now-empty dir lingers (e.g. remove left the leaf), drop it; leave any
  # non-empty unmanaged dir in place.
  if [ -d "$wt" ] && dir_is_empty "$wt"; then
    rmdir "$wt" 2>/dev/null || true
  fi
}

# delete_branch <ref> [force=0|1] : delete a local branch ref if it exists.
# Tries `git branch -d` (safe, refuses un-merged work) first. If the branch
# is not fully merged and force=1, escalates to `git branch -D`. If force=0
# (default), warn and leave the branch in place — never loses un-merged commits.
# Skips a branch that is currently checked out (caller removes the worktree first).
delete_branch() {
  ref="$1"; force="${2:-0}"
  branch_exists "$ref" || return 0
  # Try safe delete first.
  _del_err="$(git branch -d "$ref" 2>&1 >/dev/null)" && return 0
  # Branch not deleted. If the error is "not fully merged" and force is set,
  # escalate to -D (force-delete, knowingly discards un-merged work on caller's
  # behalf). Otherwise warn and leave it — no data loss.
  if printf '%s' "$_del_err" | grep -qi 'not fully merged\|is not fully merged'; then
    if [ "${force:-0}" -eq 1 ]; then
      git branch -D "$ref" >/dev/null 2>&1 \
        || warn "could not force-delete branch '$ref' (still checked out?); leaving it in place."
    else
      warn "branch '$ref' is not fully merged; leaving it in place (pass --force to delete anyway)."
    fi
  else
    # Other error (e.g. still checked out).
    warn "could not delete branch '$ref' (still checked out?); leaving it in place."
  fi
}

# --- subcommand: teardown-task ---------------------------------------------
# teardown-task [--keep] [--owned-file PATH] --run-dir <ledger-dir> <path> <branch>
#
# Normal task land: remove the worktree at <path> and delete the (merged)
# <branch>. With --keep (escalation/block), leave BOTH intact for inspection.
# Strictly run-scoped: <path> must live inside --run-dir or we fail loud.
# Ownership-gated (F09): if --owned-file is supplied and the branch is NOT
# recorded in the ledger, refuse (exit 3). If --owned-file is absent (ledger-
# less) while the branch exists, also refuse (exit 3, fail-closed).
cmd_teardown_task() {
  keep=0; force=0; run_dir=""; owned_file=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --keep)        keep=1; shift ;;
      --force)       force=1; shift ;;
      --run-dir)
        [ $# -ge 2 ] || die "--run-dir requires a path"
        run_dir="$2"; shift 2 ;;
      --owned-file)
        [ $# -ge 2 ] || die "--owned-file requires a path"
        owned_file="$2"; shift 2 ;;
      --) shift; break ;;
      -*) die "teardown-task: unknown flag '$1'" ;;
      *)  break ;;
    esac
  done
  [ $# -ge 2 ] || die "usage: teardown-task [--keep] [--force] [--owned-file PATH] --run-dir <ledger-dir> <path> <branch>"
  path="$1"; branch="$2"
  [ -n "$path" ]   || die "teardown-task: empty <path>"
  [ -n "$branch" ] || die "teardown-task: empty <branch>"

  git_dir >/dev/null   # must be inside a working tree

  # Run-scope gate FIRST — refuse out-of-run paths before touching anything.
  require_in_run "$path" "$run_dir"

  if [ "$keep" -eq 1 ]; then
    # Keep-on-escalation: touch nothing. Report and succeed.
    warn "keep-on-escalation: leaving worktree '$path' and branch '$branch' intact for inspection."
    return 0
  fi

  # Ownership gate (F09): verify the branch is ours before any deletion.
  # Fail-closed: no --owned-file (ledger-less) while the branch exists → exit 3.
  if branch_exists "$branch"; then
    if [ -z "$owned_file" ]; then
      die "teardown-task: no --owned-file ledger supplied but branch '$branch' exists — refusing to tear down without ownership proof. Supply --owned-file, or adopt the branch with record-as-owned, or delete it manually." "$EX_FOREIGN"
    fi
    load_owned_file "$owned_file"
    if ! owned_has "$branch"; then
      die "teardown-task: branch '$branch' is not recorded in the owned-file ledger '$owned_file' — refusing to tear down a foreign or unrecorded ref (F09). Adopt it with record-as-owned or delete it manually." "$EX_FOREIGN"
    fi
  fi

  remove_worktree "$path"
  delete_branch "$branch" "$force"
}

# --- subcommand: teardown-phase --------------------------------------------
# teardown-phase [--keep] [--owned-file PATH] --run-dir <ledger-dir>
#                [--worktree-root <wt-root>] <slug> <N>
#
# Phase land: reap the _refinery (if --worktree-root supplied), remove any
# remaining phase worktrees, then delete the integration branch
# integration/<slug>/phase-<N>.
#
# Strictly run-scoped: only worktrees whose path is inside --run-dir are
# removed (for phase worktrees) or inside <worktreeRoot>/<runId> (for
# _refinery). A sibling worktree of a different run-id is never touched.
# We identify "phase worktrees" as registered worktrees of this repo that live
# under --run-dir AND are checked out on a war/<slug>/p<N>-* branch.
#
# --owned-file PATH: the run's owned-ref ledger. The integration branch
#   integration/<slug>/phase-<N> must be recorded in this ledger before
#   teardown proceeds. Fail-closed: absent/empty ledger while the branch
#   exists → exit 3 with a recovery hint (F09).
#
# --worktree-root <wt-root>: the root under which _refinery lives, i.e.
#   <wt-root>/<runId>/_refinery where <runId> = basename(--run-dir). The reap
#   is path-based (branch-agnostic), so it handles both on-integration and
#   detached states. Guarded by its own path_under check scoped to
#   <wt-root>/<runId> (NOT --run-dir, which is a sibling ledger dir).
#   If absent, no _refinery reap is attempted.
#
# --keep: held/escalated phase — preserve _refinery and the integration branch
#   for inspection. Neither is removed. Exits 0.
#
# Integration branch delete: now FAIL LOUD on error (propagates non-zero exit)
#   instead of the former `|| warn` swallow (which returned 0 even on failure).
#   This makes a checked-out _refinery block the delete detectably (the caller
#   must supply --worktree-root to reap it first).
cmd_teardown_phase() {
  run_dir=""
  worktree_root=""
  owned_file=""
  keep=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --keep)          keep=1; shift ;;
      --run-dir)
        [ $# -ge 2 ] || die "--run-dir requires a path"
        run_dir="$2"; shift 2 ;;
      --worktree-root)
        [ $# -ge 2 ] || die "--worktree-root requires a path"
        worktree_root="$2"; shift 2 ;;
      --owned-file)
        [ $# -ge 2 ] || die "--owned-file requires a path"
        owned_file="$2"; shift 2 ;;
      --) shift; break ;;
      -*) die "teardown-phase: unknown flag '$1'" ;;
      *)  break ;;
    esac
  done
  [ $# -ge 2 ] || die "usage: teardown-phase [--keep] [--owned-file PATH] --run-dir <ledger-dir> [--worktree-root <wt-root>] <slug> <N>"
  slug="$1"; num="$2"
  [ -n "$slug" ] || die "teardown-phase: empty <slug>"
  case "$num" in
    ''|*[!0-9]*) die "teardown-phase: <N> must be a positive integer, got '$num'" ;;
  esac
  [ -n "$run_dir" ] || die "teardown-phase is run-scoped: --run-dir <ledger-dir> is required."
  [ -d "$run_dir" ] || die "teardown-phase --run-dir '$run_dir' does not exist or is not a directory."

  git_dir >/dev/null

  # --keep: preserve everything for inspection; exit cleanly.
  if [ "$keep" -eq 1 ]; then
    warn "keep-on-escalation: leaving _refinery and integration branch 'integration/$slug/phase-$num' intact for inspection."
    return 0
  fi

  # Ownership gate (F09): verify the integration branch is ours before any
  # deletion. Fail-closed: no --owned-file (ledger-less) while the branch
  # exists → exit 3.
  int_branch_check="integration/$slug/phase-$num"
  if branch_exists "$int_branch_check"; then
    if [ -z "$owned_file" ]; then
      die "teardown-phase: no --owned-file ledger supplied but integration branch '$int_branch_check' exists — refusing to tear down without ownership proof. Supply --owned-file, or adopt the branch with record-as-owned, or delete it manually." "$EX_FOREIGN"
    fi
    load_owned_file "$owned_file"
    if ! owned_has "$int_branch_check"; then
      die "teardown-phase: integration branch '$int_branch_check' is not recorded in the owned-file ledger '$owned_file' — refusing to tear down a foreign or unrecorded integration branch (F09). Adopt it with record-as-owned or delete it manually." "$EX_FOREIGN"
    fi
  fi

  rd_phys="$(phys "$run_dir")"; rd_phys="${rd_phys%/}"

  # --- Reap _refinery by path (before the integration branch delete) --------
  # _refinery lives at <worktreeRoot>/<runId>/_refinery where <runId> is the
  # basename of --run-dir. The reap is path-based (branch-agnostic): works
  # whether _refinery is on the integration branch OR detached. Guarded by its
  # own path_under check scoped to <worktreeRoot>/<runId>, NOT --run-dir.
  if [ -n "$worktree_root" ]; then
    run_id="$(basename "$run_dir")"
    run_wt_scope="$(phys "$worktree_root")/$run_id"
    refinery_path="$run_wt_scope/_refinery"
    # Scope guard: the computed refinery path must be under <wt-root>/<runId>.
    # If path_under fails (should be impossible with the formula above, but
    # defensive), refuse rather than silently skipping.
    if ! path_under "$refinery_path" "$run_wt_scope"; then
      die "teardown-phase: computed _refinery path '$refinery_path' is outside the run-scope '$run_wt_scope' — refusing to reap." "$EX_OUT_OF_RUN"
    fi
    # Reap by path regardless of what branch _refinery is on (or whether it is
    # detached). `remove_worktree` is branch-agnostic.
    if worktree_registered "$refinery_path"; then
      remove_worktree "$refinery_path"
    fi
    # Even if not registered, prune any stale entry at that path.
    git worktree prune >/dev/null 2>&1 || true
  fi

  # --- Collect and remove this run's phase task worktrees -------------------
  # Registered worktree paths that (a) live under run-dir and (b) are on a
  # war/<slug>/p<N>-* branch. We read the porcelain once, pairing each
  # `worktree <path>` with its following `branch <ref>`.
  wt_prefix="refs/heads/war/$slug/p$num-"
  phase_paths="$(
    git worktree list --porcelain 2>/dev/null | awk -v want="$rd_phys/" -v pref="$wt_prefix" '
      /^worktree / { wt = substr($0, 10); br = "" }
      /^branch /   {
        br = substr($0, 8)
        if (index(wt, want) == 1 && index(br, pref) == 1) { print wt }
      }
    '
  )"

  # Remove each phase worktree (already proven in-run by the awk filter).
  printf '%s\n' "$phase_paths" | while IFS= read -r wt; do
    [ -n "$wt" ] || continue
    remove_worktree "$wt"
  done

  # --- Delete the integration branch (FAIL LOUD on error) -------------------
  # Previously this was `delete_branch ...` which internally did `|| warn`
  # (returning 0 even when the branch could not be deleted, e.g. still checked
  # out in an un-reaped _refinery). Now we propagate the real exit code.
  int_branch="integration/$slug/phase-$num"
  if branch_exists "$int_branch"; then
    git branch -D "$int_branch" >/dev/null 2>&1 \
      || die "teardown-phase: could not delete branch '$int_branch' (still checked out? ensure _refinery is reaped first via --worktree-root)."
  fi
}

# --- subcommand: land-advance -----------------------------------------------
# land-advance <working-ref> <new-sha>
#
# Push-first cross-run CAS for the land phase, guarded by the LAND-TRUTH GUARD
# (ADR 0023): a `landed` result is never self-reported — git ground truth (the
# origin tip) must prove the working ref advanced. The caller (refiner in a
# detached _refinery worktree) has already produced <new-sha> — the --no-ff
# merge commit — and HEAD is currently detached at <new-sha>.
#
# The 2-arg contract (<working-ref> <new-sha>) is STABLE for every caller (both
# workflow land prompts, SKILL.md's auto-recover / escalation-completion prose,
# the submodule 2A path). The pre-push origin tip is a NEW CAPTURE INSIDE this
# subcommand, not a new CLI arg — captured at the last moment before the push so
# it cannot go stale in caller prose (smallest race window).
#
# 0. LAND-TRUTH GUARD (anchor = the pre-push ORIGIN tip, NOT the local follower
#    refs/heads/<working>, which lags). Read `git ls-remote origin
#    refs/heads/<working>` before the push and branch on it:
#    - ls-remote FAILS (rc!=0)             → ESCALATE (exit 3). A git error never
#      collapses into the first-land carve-out below (floor-script 0/1/2 discipline).
#    - origin readback EMPTY (rc 0)        → FIRST LAND: skip the guard; the push
#      creates the branch; the post-push readback still enforces origin==new_sha.
#    - origin==new_sha AND follower==new_sha → PHANTOM LAND (exit 3, loud die): the
#      --no-ff merge produced no commit (integration had nothing ahead of <working>);
#      refuse to report a land that did not advance. (Fail-safe: also catches the
#      rare cross-resume already-landed — harmless, see body.)
#    - origin==new_sha, follower LAGS/ABSENT → ALREADY LANDED (exit 0): a prior
#      interrupted land pushed <new-sha> before its follower CAS; skip the push and
#      reconcile the follower toward git (ADR 0008). Makes an in-loop re-land
#      idempotent instead of a false phantom.
#    - origin!=new_sha                     → normal path (steps 1-3 below).
#
# 1. PUSH: git push origin HEAD:refs/heads/<working>
#    - Named source (HEAD, which IS <new-sha>) — NOT a bare SHA refspec.
#      A bare-SHA push can spuriously report "src refspec does not match any";
#      pushing a ref name is reliable (red-team-verified).
#    - NO --force. The non-ff rejection is the atomic CAS against shared truth.
#
# 2. CLASSIFY the push result by the [rejected] token:
#    - Exit 0  → success (clean push); proceed to step 3.
#    - [rejected] present in output → RELAND (exit 2); another run won the CAS;
#      the caller re-fetches origin/<working>, re-merges, and retries.
#      Do NOT key on the literal "non-fast-forward" — red-team proved it is NOT
#      reliably emitted for this push form. [rejected] is the canonical token.
#    - Other non-zero (e.g. network failure, bad URL) → ESCALATE (exit 3).
#      Never infer success from absence of [rejected] alone — require exit 0.
#
# 3. ONLY on push success AND ls-remote origin == new_sha: advance the local follower ref:
#    On readback mismatch (origin not at <new-sha>) → exit 3 (escalate); local ref unchanged.
#    git update-ref refs/heads/<working> <new-sha> <pre-push-local-tip>
#    A rejected push leaves the local refs/heads/<working> UNCHANGED — nothing
#    to rewind.
#
# Exit codes:
#   0  → push accepted and local follower advanced to <new-sha>; OR already-landed
#        (origin already at <new-sha>, follower reconciled, push skipped).
#   2  → push rejected ([rejected] token seen); local ref unchanged; reland.
#   3  → phantom land, failed origin readback, unrelated push error, or post-push
#        readback mismatch; escalate. A git error never collapses into 0 or 2.
#
# Constraint: macOS bash 3.2.57 — no process substitution with stderr routing
# that drops one stream; use a temp file to capture combined output.
cmd_land_advance() {
  [ $# -ge 2 ] || die "usage: land-advance <working-ref> <new-sha>"
  working="$1"; new_sha="$2"
  [ -n "$working" ]  || die "land-advance: empty <working-ref>"
  [ -n "$new_sha" ]  || die "land-advance: empty <new-sha>"

  git_dir >/dev/null

  # Capture the local tip of refs/heads/<working> before pushing.
  # This is the CAS expected-value for the update-ref AND the phantom-vs-already-
  # landed tiebreak in the land-truth guard below.
  pre_push_local=""
  if git show-ref --verify --quiet "refs/heads/$working" 2>/dev/null; then
    pre_push_local="$(git rev-parse "refs/heads/$working")"
  fi

  # --- Land-truth guard (D1, ADR 0023): anchor on git ground truth ----------
  # Capture the PRE-PUSH ORIGIN TIP — a last-moment readback of
  # refs/heads/<working> on origin (smallest race window before the push). This
  # is the guard's anchor, NOT the local follower ref, which lags
  # (land-local-follower-ref-can-lag-sync-before-next-phase). The follower is
  # consulted below ONLY as the phantom-vs-already-landed tiebreak.
  #
  # A FAILED ls-remote (network/remote error, rc!=0) must NEVER collapse into the
  # empty/first-land reading — a git error is never the first-land carve-out
  # (mirrors the floor-script 0/1/2 discipline: exit 2 is a git error, never the
  # named route). Capture the pipeline rc under `set -o pipefail` and escalate.
  pre_push_origin=""
  pre_push_origin_rc=0
  pre_push_origin="$(git ls-remote origin "refs/heads/$working" | cut -f1)" || pre_push_origin_rc=$?
  if [ "$pre_push_origin_rc" -ne 0 ]; then
    die "land-advance: could not read the origin tip of '$working' (git ls-remote failed, rc=$pre_push_origin_rc — network/remote error); refusing to treat a failed readback as a first land. Escalate." "$EX_FOREIGN"
  fi

  if [ -z "$pre_push_origin" ]; then
    # FIRST LAND (empty origin readback, rc 0): no <working> ref on origin yet.
    # Skip the guard — a genuine first advance has no prior origin tip to compare.
    # Fall through to the push (which creates the branch); the post-push readback
    # still enforces `actual == new_sha`. This re-keys the first-land carve-out
    # from the old empty-LOCAL-ref reading to an empty ORIGIN readback (the same
    # signal D6's absent-origin detector reads).
    :
  elif [ "$pre_push_origin" = "$new_sha" ]; then
    # Origin already holds <new-sha>. Disambiguate PHANTOM vs. ALREADY-LANDED by
    # the local follower — the guard's anchor stays the origin tip; the follower's
    # lag is precisely the already-landed signature.
    if [ "$pre_push_local" = "$new_sha" ]; then
      # PHANTOM LAND: origin is at <new-sha> AND the follower already sits at it,
      # so this land did not advance origin — the --no-ff merge produced no new
      # commit (integration had nothing ahead of <working>). Escalate (exit 3),
      # never reland; all refs untouched.
      #
      # Fail-safe residual (red-team): this also catches the rare CROSS-RESUME
      # already-landed case (a prior interrupted land pushed <new-sha>, then
      # cmd_ensure_integration's behind-case ff'd the follower to it OUTSIDE this
      # primitive). Escalating a benign already-landed is harmless — the work is on
      # origin; the operator confirms via the escalation-completion path — and
      # never masks a real phantom nor reports a land that did not advance.
      die "land-advance: <new-sha> ($new_sha) equals the pre-push origin tip — the --no-ff merge produced no new commit; the integration branch had nothing ahead of '$working'; refusing to report a land that did not advance." "$EX_FOREIGN"
    fi
    # ALREADY LANDED: origin holds <new-sha> but the local follower LAGS or is
    # ABSENT — an interrupted prior attempt pushed <new-sha> before the follower
    # CAS ran (ADR 0008 reconciliation; the in-loop transient-recovery path of the
    # reland loop, where ensure-integration has NOT yet ff'd the follower). Skip
    # the push (it would no-op — origin is already there) and reconcile the follower
    # TOWARD git. Repair the record toward git, never git toward the record: this
    # is what makes an in-loop re-land idempotent instead of a false phantom.
    if [ -n "$pre_push_local" ]; then
      git update-ref "refs/heads/$working" "$new_sha" "$pre_push_local" \
        || die "land-advance: update-ref failed reconciling the follower to an already-landed origin tip (concurrent local move?)."
    else
      git update-ref "refs/heads/$working" "$new_sha" \
        || die "land-advance: update-ref (create) failed reconciling the follower to an already-landed origin tip."
    fi
    return 0
  fi
  # else: pre_push_origin is non-empty and != new_sha -> normal path below (push,
  # [rejected] classification, post-push readback, follower CAS), byte-unchanged.

  # Push HEAD (which IS <new-sha> in the detached refinery) to the named branch
  # on origin. Capture combined stdout+stderr for [rejected] detection.
  push_out="$(mktemp 2>/dev/null || mktemp -t warpush)"
  push_rc=0
  git push origin "HEAD:refs/heads/$working" >"$push_out" 2>&1 || push_rc=$?
  push_output="$(cat "$push_out")"
  rm -f "$push_out"

  if [ "$push_rc" -eq 0 ]; then
    # Origin readback: the push exited 0, but a no-op push from the wrong cwd
    # (HEAD == origin's old tip) also exits 0 without moving origin. Advance the
    # local follower ONLY if origin actually holds <new-sha>; else escalate.
    actual="$(git ls-remote origin "refs/heads/$working" | cut -f1)"
    [ "$actual" = "$new_sha" ] || exit 3
    # Success: advance the local follower ref with a CAS update-ref.
    # If there was no pre-push local tip, create the ref unconditionally.
    if [ -n "$pre_push_local" ]; then
      git update-ref "refs/heads/$working" "$new_sha" "$pre_push_local" \
        || die "land-advance: update-ref failed after successful push (this is unexpected; the push succeeded but the local CAS failed — manual intervention required)."
    else
      git update-ref "refs/heads/$working" "$new_sha" \
        || die "land-advance: update-ref (create) failed after successful push."
    fi
    return 0
  fi

  # Non-zero exit from push. Classify by the [rejected] token.
  # git always emits "! [rejected] ..." on a non-ff rejection.
  if printf '%s' "$push_output" | grep -q '\[rejected\]'; then
    # Reland: the loser re-fetches origin/<working>, re-merges, re-gates, retries.
    # Local ref is unchanged — nothing to rewind.
    exit 2
  fi

  # Any other non-zero (network failure, bad URL, permission error, etc.)
  # → escalate. The Lead must intervene.
  exit 3
}

# --- subcommand: sync-follower ----------------------------------------------
# sync-follower <branch>
#
# Manual-land follower assertion (#731 residual, §4.6). The AUTOMATED land path
# needs nothing — cmd_land_advance already does the post-push origin readback +
# follower CAS + ALREADY-LANDED reconcile, and cmd_ensure_integration's create
# path reconciles local-vs-origin before cutting (landed in #593). This
# subcommand CITES that mechanization; it does NOT rebuild it. It exists only to
# ASSERT, after a MANUAL escalation-completion / held:land-failed land, that the
# local follower ref matches origin — catching a recipe deviation (a raw
# `git push` instead of land-advance) before the next phase consumes a stale
# follower. Reads origin via ls-remote as ground truth (ADR 0023), rc captured
# separately (a git error is never "absent"). Never force-pushes; never touches
# origin.
#   origin ls-remote FAILS (rc!=0)   -> die (network error is never "absent").
#   origin ABSENT (rc 0, empty)      -> die with the "nothing landed to origin —
#                                       did the manual land push?" hint.
#   local == origin                  -> exit 0 (in sync).
#   local ABSENT                     -> create the follower at the origin tip
#                                       (mirrors land-advance's create branch).
#   local strictly BEHIND origin     -> guarded CAS ff (update-ref expected old);
#                                       SKIPPED with a warn (still exit 0) when the
#                                       branch is checked out anywhere (byte-
#                                       consistent with ensure-integration's ff).
#   local strictly AHEAD or DIVERGED -> die EX_DIVERGED, both SHAs + the two ADR
#                                       0008 repair directions.
cmd_sync_follower() {
  [ $# -ge 1 ] || die "usage: sync-follower <branch>"
  branch="$1"
  [ -n "$branch" ] || die "sync-follower: empty <branch>"

  git_dir >/dev/null

  # Origin is ground truth (ADR 0023). Capture the ls-remote rc SEPARATELY from
  # its output — a failed readback is never read as "absent".
  origin_rc=0
  origin_sha="$(git ls-remote origin "refs/heads/$branch" 2>/dev/null | cut -f1)" || origin_rc=$?
  if [ "$origin_rc" -ne 0 ]; then
    die "sync-follower: could not read the origin tip of '$branch' (git ls-remote failed, rc=$origin_rc — network/remote error); refusing to treat a failed readback as 'absent'." "$EX_FOREIGN"
  fi
  if [ -z "$origin_sha" ]; then
    die "sync-follower: origin has no '$branch' — nothing landed to origin; did the manual land push? (This assertion exists to catch exactly that deviation — a raw 'git push' or a skipped land-advance.)" "$EX_FOREIGN"
  fi

  local_sha="$(git rev-parse --verify --quiet "refs/heads/$branch" 2>/dev/null || true)"

  if [ -z "$local_sha" ]; then
    # Local follower absent -> create it at the origin tip (mirrors land-advance's
    # create branch). A fresh create has no CAS old-value; never force.
    git update-ref "refs/heads/$branch" "$origin_sha" \
      || die "sync-follower: failed to create the local follower '$branch' at the origin tip $origin_sha."
    warn "sync-follower: created local '$branch' at the origin tip $origin_sha (the follower was absent)."
    return 0
  fi

  if [ "$local_sha" = "$origin_sha" ]; then
    return 0   # in sync.
  fi

  if git merge-base --is-ancestor "$local_sha" "$origin_sha" 2>/dev/null; then
    # Local strictly BEHIND origin -> guarded CAS fast-forward, UNLESS <branch> is
    # checked out anywhere (moving a live ref phantom-dirties that checkout; the
    # next phase's create path cuts from origin regardless). Byte-consistent with
    # cmd_ensure_integration's follower-ff discipline.
    if branch_checked_out_anywhere "$branch"; then
      warn "sync-follower: local '$branch' ($local_sha) is behind origin ($origin_sha) but is checked out in a worktree; skipping the follower fast-forward (the next phase's create path cuts from origin regardless)."
      return 0
    fi
    git update-ref "refs/heads/$branch" "$origin_sha" "$local_sha" \
      || die "sync-follower: could not fast-forward local '$branch' to the origin tip (concurrent move?)."
    return 0
  fi

  # Local strictly AHEAD or DIVERGED -> the operator adjudicates (ADR 0008). Never
  # force, never touch origin. Reuse the DIVERGED die's two-direction wording.
  die "sync-follower: local '$branch' ($local_sha) is AHEAD OF or DIVERGED FROM origin ($origin_sha) — neither is a fast-forward of the other, so no ref was moved. Only the operator can adjudicate (ADR 0008). EITHER reconcile local onto origin (rebase/merge onto origin/$branch) if origin is real, OR — if local is the real land — push local to advance origin/$branch. This assertion never picks a side and never force-pushes." "$EX_DIVERGED"
}

# --- subcommand: ensure-refinery-worktree -----------------------------------
# ensure-refinery-worktree <path> <integration-branch>
#
# Ensure+re-attach for the Refinery's run-scoped worktree (_refinery). This is
# distinct from ensure-worktree's pure no-op reuse: when the worktree is present
# but HEAD is detached or on a different branch, and the tree is CLEAN (no
# tracked-file modifications), we re-attach via `git -C <path> switch`. A dirty
# tree (tracked-file modifications) always FAIL LOUD — never reset, never destroy
# work. Untracked files (e.g. the .war-task marker) do not count as dirty.
#
# Behaviors:
#   (a) Not registered / empty dir  -> git worktree add <path> <integration-branch>
#                                       + .war-task marker.
#   (b) Registered + present + HEAD on integration branch  -> reuse (marker only).
#   (c) Registered + present + HEAD detached/different + CLEAN  -> switch to
#                                       integration branch (re-attach) + marker.
#   (d) Registered + present + HEAD detached/different + DIRTY  -> FAIL LOUD.
#   (e) Stale registry (dir gone)   -> prune + recreate on integration branch.
#   (f) Non-empty unregistered dir  -> FAIL LOUD (D7).
cmd_ensure_refinery_worktree() {
  [ $# -ge 2 ] || die "usage: ensure-refinery-worktree <path> <integration-branch>"
  wt_path="$1"; int_branch="$2"
  [ -n "$wt_path" ]    || die "ensure-refinery-worktree: empty <path>"
  [ -n "$int_branch" ] || die "ensure-refinery-worktree: empty <integration-branch>"

  git_dir >/dev/null

  if worktree_registered "$wt_path"; then
    if [ -d "$wt_path" ]; then
      # Worktree is present and registered. Check what HEAD is on.
      cur_branch="$(git -C "$wt_path" symbolic-ref --short HEAD 2>/dev/null || true)"
      if [ "$cur_branch" = "$int_branch" ]; then
        # (b) Already on the integration branch -> reuse untouched.
        write_marker "$wt_path" "$int_branch"
        printf '%s\n' "$wt_path"
        return 0
      fi
      # HEAD is detached or on a different branch. Check for tracked-file
      # modifications only (-uno); untracked files (e.g. .war-task) are safe.
      if [ -n "$(git -C "$wt_path" status --porcelain -uno 2>/dev/null)" ]; then
        # (d) DIRTY tree -> FAIL LOUD. Never reset, never destroy work.
        die "ensure-refinery-worktree: worktree at '$wt_path' is not on the integration branch '$int_branch' and has uncommitted tracked-file changes — refusing to switch (would destroy work). Clean or stash changes first." "$EX_WRONG_BRANCH"
      fi
      # (c) CLEAN tree, detached or on a different branch -> re-attach.
      git -C "$wt_path" switch "$int_branch" >/dev/null 2>&1 \
        || die "ensure-refinery-worktree: failed to switch '$wt_path' to integration branch '$int_branch'"
      write_marker "$wt_path" "$int_branch"
      printf '%s\n' "$wt_path"
      return 0
    fi
    # (e) Stale registry: the dir was removed out-of-band. Prune then recreate.
    git worktree prune >/dev/null 2>&1 || true
  else
    # Not registered. An existing non-empty dir is unmanaged data -> fail loud.
    if [ -e "$wt_path" ]; then
      if ! dir_is_empty "$wt_path"; then
        # (f) Non-empty unregistered dir -> FAIL LOUD.
        die "refusing to provision refinery worktree at '$wt_path': a non-empty, unregistered directory already exists there. Move or remove it by hand (D7)." "$EX_DIRTY_UNREG"
      fi
      # Empty dir: git worktree add creates the leaf; clear the empty placeholder.
      rmdir "$wt_path" 2>/dev/null || true
    fi
  fi

  # (a) or (e): Create (or recreate after prune) the refinery worktree, checking
  # out the integration branch directly (no new branch created).
  git worktree add "$wt_path" "$int_branch" >/dev/null 2>&1 \
    || die "ensure-refinery-worktree: failed to add worktree at '$wt_path' on branch '$int_branch'"

  write_marker "$wt_path" "$int_branch"
  printf '%s\n' "$wt_path"
}

# --- subcommand: ensure-publication-worktree --------------------------------
# ensure-publication-worktree <path> <working-branch>
#
# Ensure+re-attach for the Gate-2 learnings-publication worktree (p<N>-publication).
# Structurally byte-for-byte mirrors cmd_ensure_refinery_worktree's six behaviors,
# with the WORKING branch in place of the integration branch: the Lead checks out
# the working branch here to commit `docs(learnings): phase N` before pushing via
# ensure-origin's CAS. It checks the branch out AS-IS AT THE LOCAL TIP — the land
# path's land-advance already advanced the local follower ref on every successful
# land, so staleness is the CAS retry's job, never this subcommand's. A dirty tree
# (tracked-file modifications) always FAILS LOUD — never reset, never destroy work.
# Untracked files (e.g. the .war-task marker) do not count as dirty.
#
# Behaviors (mirror ensure-refinery-worktree):
#   (a) Not registered / empty dir  -> git worktree add <path> <working-branch>
#                                       + .war-task marker.
#   (b) Registered + present + HEAD on the working branch  -> reuse (marker only).
#   (c) Registered + present + HEAD detached/different + CLEAN  -> switch to the
#                                       working branch (re-attach) + marker.
#   (d) Registered + present + HEAD detached/different + DIRTY  -> FAIL LOUD.
#   (e) Stale registry (dir gone)   -> prune + recreate on the working branch.
#   (f) Non-empty unregistered dir  -> FAIL LOUD (D7).
cmd_ensure_publication_worktree() {
  [ $# -ge 2 ] || die "usage: ensure-publication-worktree <path> <working-branch>"
  wt_path="$1"; work_branch="$2"
  [ -n "$wt_path" ]     || die "ensure-publication-worktree: empty <path>"
  [ -n "$work_branch" ] || die "ensure-publication-worktree: empty <working-branch>"

  git_dir >/dev/null

  if worktree_registered "$wt_path"; then
    if [ -d "$wt_path" ]; then
      # Worktree is present and registered. Check what HEAD is on.
      cur_branch="$(git -C "$wt_path" symbolic-ref --short HEAD 2>/dev/null || true)"
      if [ "$cur_branch" = "$work_branch" ]; then
        # (b) Already on the working branch -> reuse untouched.
        write_marker "$wt_path" "$work_branch"
        printf '%s\n' "$wt_path"
        return 0
      fi
      # HEAD is detached or on a different branch. Check for tracked-file
      # modifications only (-uno); untracked files (e.g. .war-task) are safe.
      if [ -n "$(git -C "$wt_path" status --porcelain -uno 2>/dev/null)" ]; then
        # (d) DIRTY tree -> FAIL LOUD. Never reset, never destroy work.
        die "ensure-publication-worktree: worktree at '$wt_path' is not on the working branch '$work_branch' and has uncommitted tracked-file changes — refusing to switch (would destroy work). Clean or stash changes first." "$EX_WRONG_BRANCH"
      fi
      # (c) CLEAN tree, detached or on a different branch -> re-attach.
      git -C "$wt_path" switch "$work_branch" >/dev/null 2>&1 \
        || die "ensure-publication-worktree: failed to switch '$wt_path' to working branch '$work_branch'"
      write_marker "$wt_path" "$work_branch"
      printf '%s\n' "$wt_path"
      return 0
    fi
    # (e) Stale registry: the dir was removed out-of-band. Prune then recreate.
    git worktree prune >/dev/null 2>&1 || true
  else
    # Not registered. An existing non-empty dir is unmanaged data -> fail loud.
    if [ -e "$wt_path" ]; then
      if ! dir_is_empty "$wt_path"; then
        # (f) Non-empty unregistered dir -> FAIL LOUD.
        die "refusing to provision publication worktree at '$wt_path': a non-empty, unregistered directory already exists there. Move or remove it by hand (D7)." "$EX_DIRTY_UNREG"
      fi
      # Empty dir: git worktree add creates the leaf; clear the empty placeholder.
      rmdir "$wt_path" 2>/dev/null || true
    fi
  fi

  # (a) or (e): Create (or recreate after prune) the publication worktree, checking
  # out the working branch as-is at its local tip (no new branch created).
  git worktree add "$wt_path" "$work_branch" >/dev/null 2>&1 \
    || die "ensure-publication-worktree: failed to add worktree at '$wt_path' on branch '$work_branch'"

  write_marker "$wt_path" "$work_branch"
  printf '%s\n' "$wt_path"
}

# --- subcommand: remove-publication-worktree --------------------------------
# remove-publication-worktree <path>
#
# Tear down the Gate-2 publication worktree after the docs commit is pushed (or
# heal a crash leftover from Setup's pre-flight / Gate-2 entry scan). This is NOT
# a reuse of teardown-task: teardown-task DELETES the branch, which is exactly
# wrong here — the working branch must survive (a committed-but-unpushed docs
# commit lives on its ref, and it is WAR's land target). So this subcommand NEVER
# touches the branch ref.
#
#   * Registered + DIRTY (tracked-file modifications, -uno) -> die non-zero with a
#     never-force message. Escalate for inspection — never force-remove work
#     (teardown reap-order/fail-loud discipline). Untracked files (.war-task) are
#     not "dirty".
#   * Registered + CLEAN -> `git worktree remove` (NO --force) + registry prune.
#   * Not registered -> nothing to remove; prune any stale registry entry. Idempotent.
cmd_remove_publication_worktree() {
  [ $# -ge 1 ] || die "usage: remove-publication-worktree <path>"
  wt_path="$1"
  [ -n "$wt_path" ] || die "remove-publication-worktree: empty <path>"

  git_dir >/dev/null

  if worktree_registered "$wt_path"; then
    if [ -d "$wt_path" ] && [ -n "$(git -C "$wt_path" status --porcelain -uno 2>/dev/null)" ]; then
      # DIRTY tree -> escalate. NEVER --force away uncommitted tracked work.
      die "remove-publication-worktree: worktree at '$wt_path' has uncommitted tracked-file changes — refusing to remove it (never force; escalate for inspection instead). Commit or discard the changes by hand." "$EX_WRONG_BRANCH"
    fi
    # CLEAN -> plain remove (NO --force). The branch ref is NEVER touched, so a
    # committed-but-unpushed docs commit on the working branch survives.
    git worktree remove "$wt_path" >/dev/null 2>&1 \
      || die "remove-publication-worktree: failed to remove clean worktree at '$wt_path'."
  fi
  # Clear any dangling registry entry (dir already gone / just removed). Never
  # touches a branch ref.
  git worktree prune >/dev/null 2>&1 || true
}

# --- subcommand: resolve-working-branch -------------------------------------
# resolve-working-branch <desired> <slug> <date> [--owned-file PATH] [--owned REF]...
#
# Resolve the branch WAR will land onto. If <desired> is NOT checked out in any
# worktree, echo it unchanged (byte-identical to today's default — zero behavior
# change for the common case). If <desired> IS checked out somewhere (the
# launch-worktree collision), a push to it would be rejected as un-advanceable,
# so instead resolve a DEDICATED working branch dev/<date>-<slug> created at
# <desired>'s tip, checked out nowhere, and echo that.
#
# Ownership seam (ADR 0003), same inputs as the other subcommands:
#   - Absent dedicated branch -> create at <desired> tip, record as owned.
#   - Present AND ours (resume) -> reuse as-is, never re-cut.
#   - Present but NOT ours (foreign pre-existing name) -> FAIL LOUD (exit 3).
# Never checks out the dedicated branch anywhere; `git branch` only creates the ref.
cmd_resolve_working_branch() {
  [ $# -ge 3 ] || die "usage: resolve-working-branch <desired> <slug> <date> [--owned-file PATH] [--owned REF]..."
  desired="$1"; slug="$2"; date="$3"; shift 3

  owned_file=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --owned-file)
        [ $# -ge 2 ] || die "--owned-file requires a path"
        owned_file="$2"; shift 2 ;;
      --owned)
        [ $# -ge 2 ] || die "--owned requires a ref"
        owned_add "$2"; shift 2 ;;
      *) die "resolve-working-branch: unknown argument '$1'" ;;
    esac
  done

  [ -n "$desired" ] || die "resolve-working-branch: empty <desired>"
  [ -n "$slug" ]    || die "resolve-working-branch: empty <slug>"
  [ -n "$date" ]    || die "resolve-working-branch: empty <date>"

  git_dir >/dev/null

  # No collision -> the desired branch is landable as-is. Echo it unchanged.
  if ! branch_checked_out_anywhere "$desired"; then
    printf '%s\n' "$desired"
    return 0
  fi

  # Collision: resolve a dedicated working branch, created at the desired tip.
  load_owned_file "$owned_file"
  resolved="dev/$date-$slug"

  if branch_exists "$resolved"; then
    if owned_has "$resolved"; then
      # Legitimate resume: reuse as-is. NEVER re-cut or move it.
      printf '%s\n' "$resolved"
      return 0
    fi
    die "resolve-working-branch: dedicated branch '$resolved' already exists and is not owned by this run; refusing to reuse or overwrite it (see ADR 0003). Delete the stale ref or adopt it with record-as-owned." "$EX_FOREIGN"
  fi

  # Absent -> create at the desired branch's tip (checked out nowhere), then
  # record ownership. Capture git stderr so a bad <desired> surfaces its diagnostic.
  _tmp_err="$(mktemp 2>/dev/null || mktemp -t warwbranch)"
  git branch "$resolved" "$desired" >/dev/null 2>"$_tmp_err" \
    || { _git_branch_err="$(cat "$_tmp_err")"; rm -f "$_tmp_err"; die "resolve-working-branch: failed to create dedicated branch '$resolved' at '$desired' tip: $_git_branch_err"; }
  rm -f "$_tmp_err"
  record_owned_file "$owned_file" "$resolved"
  printf '%s\n' "$resolved"
}

# --- subcommand: ensure-origin ----------------------------------------------
# ensure-origin <resolved>
#
# Bootstrap the resolved working branch on origin so the land-phase push-first
# CAS has a baseline to advance. `git push -u origin <resolved>` is idempotent:
# a branch already on origin at the same tip is a no-op (git reports "Everything
# up-to-date"), and it is NEVER a force — a diverged remote is rejected, matching
# the never-force invariant (ADR 0004). This is the single tested owner of the
# origin push; SKILL.md never issues a raw `git push`.
cmd_ensure_origin() {
  [ $# -ge 1 ] || die "usage: ensure-origin <resolved>"
  resolved="$1"
  [ -n "$resolved" ] || die "ensure-origin: empty <resolved>"

  git_dir >/dev/null

  # Capture git's own stderr via the _tmp_err idiom (the fetch + branch-create
  # sites in cmd_ensure_integration / cmd_resolve_working_branch use the same one)
  # so a push failure surfaces git's ground truth APPENDED AFTER the never-force
  # guidance — not swallowed behind the static message alone
  # (ensure-origin-swallows-stderr-unlike-sibling-subcommands, now resolved). The
  # push command, refspec, and -u flag are byte-identical (never-force, ADR 0004).
  _tmp_err="$(mktemp 2>/dev/null || mktemp -t warorigin)"
  git push -u origin "refs/heads/$resolved:refs/heads/$resolved" >/dev/null 2>"$_tmp_err" \
    || { _push_err="$(cat "$_tmp_err")"; rm -f "$_tmp_err"; die "ensure-origin: failed to push '$resolved' to origin (no origin remote, or the remote branch has diverged — refusing to force). git: $_push_err"; }
  rm -f "$_tmp_err"
}

# --- subcommand: prune ------------------------------------------------------
# prune
#
# Provision-start hygiene: clear THIS repo's stale worktree-registry entries
# (dirs removed out-of-band). `git worktree prune` operates only on the current
# repo's registry, so a worktree registered to a DIFFERENT repo (a different run)
# is never touched — its live dir survives untouched. Branch refs are never
# affected by prune.
cmd_prune() {
  [ $# -eq 0 ] || die "usage: prune  (takes no arguments)"
  git_dir >/dev/null
  git worktree prune >/dev/null 2>&1 \
    || die "git worktree prune failed in this repository."
}

# --- dispatch ---------------------------------------------------------------
main() {
  [ $# -ge 1 ] || die "usage: $PROG <subcommand> [args...]
subcommands: ensure-integration, record-as-owned, ensure-exclude, ensure-worktree, sync-follower, land-advance, ensure-refinery-worktree, ensure-publication-worktree, remove-publication-worktree, resolve-working-branch, ensure-origin, teardown-task, teardown-phase, prune"
  sub="$1"; shift
  case "$sub" in
    ensure-integration)          cmd_ensure_integration "$@" ;;
    record-as-owned)             cmd_record_as_owned "$@" ;;
    ensure-exclude)              cmd_ensure_exclude "$@" ;;
    ensure-worktree)             cmd_ensure_worktree "$@" ;;
    land-advance)                cmd_land_advance "$@" ;;
    sync-follower)               cmd_sync_follower "$@" ;;
    ensure-refinery-worktree)    cmd_ensure_refinery_worktree "$@" ;;
    ensure-publication-worktree) cmd_ensure_publication_worktree "$@" ;;
    remove-publication-worktree) cmd_remove_publication_worktree "$@" ;;
    resolve-working-branch)      cmd_resolve_working_branch "$@" ;;
    ensure-origin)               cmd_ensure_origin "$@" ;;
    teardown-task)               cmd_teardown_task "$@" ;;
    teardown-phase)              cmd_teardown_phase "$@" ;;
    prune)                       cmd_prune "$@" ;;
    *) die "unknown subcommand '$sub' (have: ensure-integration, record-as-owned, ensure-exclude, ensure-worktree, sync-follower, land-advance, ensure-refinery-worktree, ensure-publication-worktree, remove-publication-worktree, resolve-working-branch, ensure-origin, teardown-task, teardown-phase, prune)" ;;
  esac
}

main "$@"
