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
#   ensure-integration <slug> <N> <base> [--owned-file PATH] [--owned REF]...  (Task 2)
#   ensure-exclude                                                             (Task 2)
#   ensure-worktree <path> <branch> <integration-tip>                          (Task 3)
#   land-advance <working-ref> <new-sha>                                       (Task 2/clandiso)
#   ensure-refinery-worktree <path> <integration-branch>                       (Task 1/clandiso)
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

# write_marker <worktree-path> : drop the .war-task marker at the worktree root.
# Idempotent; records minimal provenance for humans/auditors reading it.
write_marker() {
  printf 'WAR task worktree — provisioned by provision-worktrees.sh (do not delete).\nbranch=%s\n' \
    "${2:-}" > "$1/.war-task"
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
  printf '%s\n' "$ref" >> "$ofile"
}

# --- subcommand: ensure-integration ----------------------------------------
# ensure-integration <slug> <N> <base> [--owned-file PATH] [--owned REF]...
# Reuse if the branch exists and is ours; create from <base> if absent; fail
# loud if it exists but is not ours.
cmd_ensure_integration() {
  [ $# -ge 3 ] || die "usage: ensure-integration <slug> <N> <base> [--owned-file PATH] [--owned REF]..."
  slug="$1"; num="$2"; base="$3"; shift 3

  owned_file=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --owned-file)
        [ $# -ge 2 ] || die "--owned-file requires a path"
        owned_file="$2"; shift 2 ;;
      --owned)
        [ $# -ge 2 ] || die "--owned requires a ref"
        owned_add "$2"; shift 2 ;;
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
    die "foreign branch '$branch' already exists and is not owned by this run; refusing to reuse or overwrite it (see ADR 0003). If this is a stale ref from a prior run, delete it or record it as owned." 3
  fi

  # Absent -> create from the supplied base, then record ownership.
  git branch "$branch" "$base" >/dev/null 2>&1 \
    || die "failed to create branch '$branch' at base '$base'"
  record_owned_file "$owned_file" "$branch"
  printf '%s\n' "$branch"
}

# --- subcommand: ensure-exclude --------------------------------------------
# Append a `.claude/` line to .git/info/exclude exactly once (idempotent), so a
# nested worktree under .claude/ does not surface as untracked in the parent
# repo's `git status` (probe E2).
cmd_ensure_exclude() {
  gd="$(git_dir)"
  info_dir="$gd/info"
  excl="$info_dir/exclude"
  mkdir -p "$info_dir"
  [ -f "$excl" ] || : > "$excl"
  if grep -Fxq -- '.claude/' "$excl"; then
    return 0
  fi
  # Ensure we start the new entry on its own line even if the file lacked a
  # trailing newline.
  if [ -s "$excl" ] && [ -n "$(tail -c 1 "$excl" 2>/dev/null)" ]; then
    printf '\n' >> "$excl"
  fi
  printf '%s\n' '.claude/' >> "$excl"
}

# dir_is_empty <path> -> 0 if <path> is a directory with no entries (dotfiles
# included). A missing path is NOT "empty" here (callers test -d separately).
dir_is_empty() {
  [ -d "$1" ] || return 1
  [ -z "$(ls -A "$1" 2>/dev/null)" ]
}

# --- subcommand: ensure-worktree -------------------------------------------
# ensure-worktree <path> <branch> <integration-tip>
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
  [ $# -ge 3 ] || die "usage: ensure-worktree <path> <branch> <integration-tip>"
  path="$1"; branch="$2"; tip="$3"
  [ -n "$path" ]   || die "ensure-worktree: empty <path>"
  [ -n "$branch" ] || die "ensure-worktree: empty <branch>"
  [ -n "$tip" ]    || die "ensure-worktree: empty <integration-tip>"

  # Must be inside a working tree (git dir resolves) before we mutate anything.
  git_dir >/dev/null

  if worktree_registered "$path"; then
    if [ -d "$path" ]; then
      # REUSE: present and registered. Touch nothing but the marker (idempotent).
      # Crucially we do NOT move/reset <branch>, so un-merged commits survive.
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
        die "refusing to provision worktree at '$path': a non-empty, unregistered directory already exists there (not a git worktree of this repo). Move or remove it by hand — provision-worktrees will not delete unmanaged data (D7)." 4
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
    git worktree add -b "$branch" "$path" "$tip" >/dev/null 2>&1 \
      || die "failed to add worktree at '$path' on new branch '$branch' at '$tip'"
  fi

  write_marker "$path" "$branch"
  printf '%s\n' "$path"
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
    die "refusing to tear down '$1': it is OUTSIDE the current run-dir '$2' (a different run-id may own it, possibly paused on an escalation). Cross-run cleanup is manual (D9)." 5
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

# delete_branch <ref> : delete a local branch ref if it exists. Uses -D because
# teardown is called on a branch already merged into integration (task land) or
# on the integration branch itself after the phase merged up; the refiner only
# tears down once the work is captured. Skips a branch that is currently checked
# out by a still-registered worktree (caller removes the worktree first).
delete_branch() {
  ref="$1"
  branch_exists "$ref" || return 0
  git branch -D "$ref" >/dev/null 2>&1 \
    || warn "could not delete branch '$ref' (still checked out?); leaving it in place."
}

# --- subcommand: teardown-task ---------------------------------------------
# teardown-task [--keep] --run-dir <ledger-dir> <path> <branch>
#
# Normal task land: remove the worktree at <path> and delete the (merged)
# <branch>. With --keep (escalation/block), leave BOTH intact for inspection.
# Strictly run-scoped: <path> must live inside --run-dir or we fail loud.
cmd_teardown_task() {
  keep=0; run_dir=""
  args=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --keep)        keep=1; shift ;;
      --run-dir)
        [ $# -ge 2 ] || die "--run-dir requires a path"
        run_dir="$2"; shift 2 ;;
      --) shift; break ;;
      -*) die "teardown-task: unknown flag '$1'" ;;
      *)  break ;;
    esac
  done
  [ $# -ge 2 ] || die "usage: teardown-task [--keep] --run-dir <ledger-dir> <path> <branch>"
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

  remove_worktree "$path"
  delete_branch "$branch"
}

# --- subcommand: teardown-phase --------------------------------------------
# teardown-phase [--keep] --run-dir <ledger-dir> [--worktree-root <wt-root>]
#                <slug> <N>
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
      --) shift; break ;;
      -*) die "teardown-phase: unknown flag '$1'" ;;
      *)  break ;;
    esac
  done
  [ $# -ge 2 ] || die "usage: teardown-phase [--keep] --run-dir <ledger-dir> [--worktree-root <wt-root>] <slug> <N>"
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
      die "teardown-phase: computed _refinery path '$refinery_path' is outside the run-scope '$run_wt_scope' — refusing to reap." 5
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
      || die "teardown-phase: could not delete branch '$int_branch' (still checked out? ensure _refinery is reaped first via --worktree-root)." 1
  fi
}

# --- subcommand: land-advance -----------------------------------------------
# land-advance <working-ref> <new-sha>
#
# Push-first cross-run CAS for the land phase. The caller (refiner in a
# detached _refinery worktree) has already produced <new-sha> — the --no-ff
# merge commit — and HEAD is currently detached at <new-sha>.
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
# 3. ONLY on push success (exit 0): advance the local follower ref:
#    git update-ref refs/heads/<working> <new-sha> <pre-push-local-tip>
#    A rejected push leaves the local refs/heads/<working> UNCHANGED — nothing
#    to rewind.
#
# Exit codes:
#   0  → push accepted; local follower ref advanced to <new-sha>.
#   2  → push rejected ([rejected] token seen); local ref unchanged; reland.
#   3  → unrelated push error; escalate.
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
  # This is the CAS expected-value for the update-ref.
  pre_push_local=""
  if git show-ref --verify --quiet "refs/heads/$working" 2>/dev/null; then
    pre_push_local="$(git rev-parse "refs/heads/$working")"
  fi

  # Push HEAD (which IS <new-sha> in the detached refinery) to the named branch
  # on origin. Capture combined stdout+stderr for [rejected] detection.
  push_out="$(mktemp 2>/dev/null || mktemp -t warpush)"
  push_rc=0
  git push origin "HEAD:refs/heads/$working" >"$push_out" 2>&1 || push_rc=$?
  push_output="$(cat "$push_out")"
  rm -f "$push_out"

  if [ "$push_rc" -eq 0 ]; then
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
        die "ensure-refinery-worktree: worktree at '$wt_path' is not on the integration branch '$int_branch' and has uncommitted tracked-file changes — refusing to switch (would destroy work). Clean or stash changes first." 6
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
        die "refusing to provision refinery worktree at '$wt_path': a non-empty, unregistered directory already exists there. Move or remove it by hand (D7)." 4
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
subcommands: ensure-integration, ensure-exclude, ensure-worktree, land-advance, ensure-refinery-worktree, teardown-task, teardown-phase, prune"
  sub="$1"; shift
  case "$sub" in
    ensure-integration)       cmd_ensure_integration "$@" ;;
    ensure-exclude)           cmd_ensure_exclude "$@" ;;
    ensure-worktree)          cmd_ensure_worktree "$@" ;;
    land-advance)             cmd_land_advance "$@" ;;
    ensure-refinery-worktree) cmd_ensure_refinery_worktree "$@" ;;
    teardown-task)            cmd_teardown_task "$@" ;;
    teardown-phase)           cmd_teardown_phase "$@" ;;
    prune)                    cmd_prune "$@" ;;
    *) die "unknown subcommand '$sub' (have: ensure-integration, ensure-exclude, ensure-worktree, land-advance, ensure-refinery-worktree, teardown-task, teardown-phase, prune)" ;;
  esac
}

main "$@"
