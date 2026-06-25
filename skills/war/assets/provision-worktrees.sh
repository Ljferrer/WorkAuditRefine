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
#   teardown-task [--keep] --run-dir <ledger-dir> <path> <branch>              (Task 4)
#   teardown-phase --run-dir <ledger-dir> <slug> <N>                           (Task 4)
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

# branch_ahead_of <branch> <tip> -> 0 if <branch> has commits NOT reachable from
# <tip> (i.e. carries un-merged work). Used to reason about conservative heal.
# NOTE: even when true, recreating a worktree never loses those commits — they
# live in the branch ref, which `git worktree prune`/`remove` never touches.
branch_ahead_of() {
  branch_exists "$1" || return 1
  c="$(git rev-list --count "$2..$1" 2>/dev/null || echo 0)"
  [ "${c:-0}" -gt 0 ]
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
# Idempotent "ensure" with conservative heal (D4/D7):
#   * Already a registered worktree, dir present  -> REUSE untouched (only make
#     sure the .war-task marker is there). Never reset <branch>; an un-merged
#     commit on it survives.
#   * Registered but the dir is gone (stale registry) -> prune + recreate on the
#     existing <branch>. Its commits live in the ref, so nothing is lost.
#   * Not registered, no dir            -> create fresh on the integration tip.
#   * Not registered, empty dir         -> create fresh into it.
#   * Not registered, NON-EMPTY dir     -> FAIL LOUD; never delete it.
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
# teardown-phase --run-dir <ledger-dir> <slug> <N>
#
# Phase land: remove the integration branch integration/<slug>/phase-<N> and any
# remaining phase worktrees. Strictly run-scoped: only worktrees whose path is
# inside --run-dir are removed; a sibling worktree of a different run-id is never
# touched (even though the integration ref is global, we still only reap our own
# worktrees). We identify "phase worktrees" as registered worktrees of this repo
# that live under --run-dir AND are checked out on a war/<slug>/p<N>-* branch.
cmd_teardown_phase() {
  run_dir=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --run-dir)
        [ $# -ge 2 ] || die "--run-dir requires a path"
        run_dir="$2"; shift 2 ;;
      --) shift; break ;;
      -*) die "teardown-phase: unknown flag '$1'" ;;
      *)  break ;;
    esac
  done
  [ $# -ge 2 ] || die "usage: teardown-phase --run-dir <ledger-dir> <slug> <N>"
  slug="$1"; num="$2"
  [ -n "$slug" ] || die "teardown-phase: empty <slug>"
  case "$num" in
    ''|*[!0-9]*) die "teardown-phase: <N> must be a positive integer, got '$num'" ;;
  esac
  [ -n "$run_dir" ] || die "teardown-phase is run-scoped: --run-dir <ledger-dir> is required."
  [ -d "$run_dir" ] || die "teardown-phase --run-dir '$run_dir' does not exist or is not a directory."

  git_dir >/dev/null

  rd_phys="$(phys "$run_dir")"; rd_phys="${rd_phys%/}"

  # Collect this run's phase worktrees: registered worktree paths that (a) live
  # under run-dir and (b) are on a war/<slug>/p<N>-* branch. We read the porcelain
  # once, pairing each `worktree <path>` with its following `branch <ref>`.
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

  # Finally drop the integration branch for this phase.
  delete_branch "integration/$slug/phase-$num"
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
subcommands: ensure-integration, ensure-exclude, ensure-worktree, teardown-task, teardown-phase, prune"
  sub="$1"; shift
  case "$sub" in
    ensure-integration) cmd_ensure_integration "$@" ;;
    ensure-exclude)     cmd_ensure_exclude "$@" ;;
    ensure-worktree)    cmd_ensure_worktree "$@" ;;
    teardown-task)      cmd_teardown_task "$@" ;;
    teardown-phase)     cmd_teardown_phase "$@" ;;
    prune)              cmd_prune "$@" ;;
    *) die "unknown subcommand '$sub' (have: ensure-integration, ensure-exclude, ensure-worktree, teardown-task, teardown-phase, prune)" ;;
  esac
}

main "$@"
