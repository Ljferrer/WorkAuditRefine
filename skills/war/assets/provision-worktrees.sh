#!/usr/bin/env bash
# WAR worktree provisioning — refiner-owned git-topology lifecycle.
#
# This is the single tested shell asset that owns all shared git-state mutation
# for a WAR run: the plan-namespaced integration branch, per-task worktrees,
# their .war-task markers, idempotent "ensure" with conservative heal,
# run-scoped teardown, and .git/info/exclude upkeep. The Workflow template stays
# thin and calls these subcommands from the refiner's Provision barrier.
#
# Subcommands (this file, Task 2):
#   ensure-integration <slug> <N> <base> [--owned-file PATH] [--owned REF]...
#   ensure-exclude
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

# --- dispatch ---------------------------------------------------------------
main() {
  [ $# -ge 1 ] || die "usage: $PROG <subcommand> [args...]
subcommands: ensure-integration, ensure-exclude"
  sub="$1"; shift
  case "$sub" in
    ensure-integration) cmd_ensure_integration "$@" ;;
    ensure-exclude)     cmd_ensure_exclude "$@" ;;
    *) die "unknown subcommand '$sub' (have: ensure-integration, ensure-exclude)" ;;
  esac
}

main "$@"
