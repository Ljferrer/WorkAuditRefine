#!/usr/bin/env bash
# assert-no-submodule-mutation.sh — WAR refiner submodule-refuse floor guard (Increment 2).
#
# Usage: assert-no-submodule-mutation.sh <base> <branch> [--repo <git-dir>] [--declared]
#
# Compute `git diff --raw <base>...<branch>` (three-dot symmetric diff —
# exactly what the task branch added relative to the integration base).
#
# Detect a submodule mutation if ANY of:
#   1. A gitlink entry appears in the raw diff (mode 160000 in old OR new mode field).
#   2. A changed path lives under a .gitmodules submodule path
#      (cross-checked via `git config -f .gitmodules --get-regexp '\.path$'`).
#
# --declared flag (Increment 2): a declared gitlink-bump task may move the
# gitlink pointer. With --declared, a GITLINK-ONLY move (mode 160000, and no
# non-gitlink content under a .gitmodules path) exits 0. A non-gitlink content
# change under a submodule path is still refused even with --declared — that
# class of diff should have been run inside the submodule repo and must never
# reach this guard as a superproject content touch. The pin-validity lens (T6)
# validates the new SHA separately; this guard only checks the mutation class.
#
# DEFAULT (no --declared): refuse ANY submodule mutation — Increment 1 behavior,
# byte-for-byte UNCHANGED. See ADR-0009.
#
# Exit codes (load-bearing contract — mirrors assert-test-in-diff.sh discipline;
# memory: floor-script-exit-codes-1-vs-2-route-differently):
#   0 — no submodule mutation in the diff (clean; allow)
#   1 — submodule mutation detected (REFUSE)
#   2 — git/ref error (fatal git error, bad ref; NOT a refuse signal; caller
#       must not treat as a clean pass — it means the diff could not be computed)
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
set -euo pipefail

PROG="assert-no-submodule-mutation"
die()  { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-1}"; }

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
[ $# -ge 2 ] || die "usage: $PROG <base> <branch> [--repo <dir>] [--declared]" 2

base="$1"
branch="$2"
shift 2

repo_dir=""
declared=0

while [ $# -gt 0 ]; do
  case "$1" in
    --repo)
      [ $# -ge 2 ] || die "--repo requires a path" 2
      repo_dir="$2"; shift 2 ;;
    --declared)
      declared=1; shift ;;
    --) shift; break ;;
    -*) die "unknown argument '$1'" 2 ;;
    *)  die "unexpected positional argument '$1'" 2 ;;
  esac
done

# ---------------------------------------------------------------------------
# Safety: reject .. traversal in base or branch arguments (mirrors sibling).
# ---------------------------------------------------------------------------
case "$base" in
  *..*)  die "base argument contains '..'; refusing to use potentially unsafe ref: $base" 2 ;;
esac
case "$branch" in
  *..*)  die "branch argument contains '..'; refusing to use potentially unsafe ref: $branch" 2 ;;
esac

# ---------------------------------------------------------------------------
# Build the git command prefix.
# ---------------------------------------------------------------------------
if [ -n "$repo_dir" ]; then
  git_cmd="git -C $repo_dir"
else
  git_cmd="git"
fi

# ---------------------------------------------------------------------------
# Step 1: run git diff --raw to get mode + path info.
# Three-dot diff: exactly what <branch> added vs the merge-base of <base>.
# Exit 2 on any git/ref failure.
# ---------------------------------------------------------------------------
raw_diff=""
raw_diff="$($git_cmd diff --raw "$base...$branch" 2>/dev/null)" || \
  die "git diff failed for '$base...$branch'" 2

# ---------------------------------------------------------------------------
# Step 2: scan for gitlink mode (160000) in the raw diff output.
#
# git diff --raw lines look like:
#   :<old-mode> <new-mode> <old-sha> <new-sha> <status>\t<path>
# or for renames/copies:
#   :<old-mode> <new-mode> <old-sha> <new-sha> <R|C><score>\t<old-path>\t<new-path>
#
# A gitlink entry has mode 160000 in the old or new mode field (field 1 or 2).
# ponytail: awk one-liner; bash 3.2-safe, no external deps beyond awk.
# ---------------------------------------------------------------------------
found_gitlink=0
gitlink_paths=""
if [ -n "$raw_diff" ]; then
  # awk: field 1 is :<old-mode>, field 2 is <new-mode>.
  # A gitlink if old-mode == :160000 OR new-mode == 160000.
  # Also collect gitlink paths (after the first tab) so --declared can exclude
  # them from the non-gitlink content check — the gitlink path itself is not
  # "content under a submodule path", it IS the gitlink.
  gitlink_paths="$(printf '%s\n' "$raw_diff" | awk '
    /^:/ {
      old = substr($1, 2)   # strip leading ":"
      new = $2
      if (old == "160000" || new == "160000") {
        # split>=2 is equivalent to the old unconditional found=1: git diff --raw
        # always emits a TAB before the path, so a matched gitlink line always
        # splits into >=2 fields. The guard just also hands us parts[2] (the path).
        n = split($0, parts, "\t")
        if (n >= 2) print parts[2]
      }
    }
  ' 2>/dev/null)" || true
  if [ -n "$gitlink_paths" ]; then
    found_gitlink=1
  fi
fi

if [ "$found_gitlink" -eq 1 ]; then
  if [ "$declared" -eq 1 ]; then
    # --declared: a pure gitlink-only move is the legitimate gitlink-bump-task path.
    # We still need to check for non-gitlink content under a .gitmodules path below.
    # ponytail: fall through to the submodule-path content check; if nothing found
    # there, exit 0 (the pin-validity lens validates the SHA separately, T6).
    true
  else
    printf '%s: submodule mutation detected (gitlink mode 160000 in diff)\n' "$PROG" >&2
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Step 3: collect submodule paths from .gitmodules (if present).
# git config -f .gitmodules --get-regexp '\.path$' prints lines like:
#   submodule.sub.path  sub
# We extract the path values (second field) and check whether any changed
# file in the diff lives under them.
# ---------------------------------------------------------------------------

# Resolve .gitmodules location (relative to repo root or cwd).
if [ -n "$repo_dir" ]; then
  gitmodules_file="$repo_dir/.gitmodules"
else
  gitmodules_file=".gitmodules"
fi

# No .gitmodules -> no submodule paths to cross-check; clean (no-op).
if [ ! -f "$gitmodules_file" ]; then
  exit 0
fi

# Collect submodule paths; one per line.
submod_paths=""
submod_paths="$(git config -f "$gitmodules_file" --get-regexp '\.path$' 2>/dev/null | awk '{print $2}')" || true

# No submodule paths configured -> no-op.
if [ -z "$submod_paths" ]; then
  exit 0
fi

# Collect changed file paths from the raw diff (last field(s) for renames).
# For our purposes: grab every path token after the status field.
# git diff --name-only is simpler here — re-run it for path extraction.
changed_files=""
changed_files="$($git_cmd diff --name-only "$base...$branch" 2>/dev/null)" || \
  die "git diff --name-only failed for '$base...$branch'" 2

if [ -z "$changed_files" ]; then
  # Nothing changed -> clean.
  exit 0
fi

# Cross-check: for each changed file, check if it lives under any submodule path.
# A path "sub/foo" is under submodule path "sub" if it starts with "sub/".
# With --declared: skip paths that are themselves gitlinks (mode 160000) —
# those are the allowed gitlink-bump move; only non-gitlink content under a
# submodule path is refused even with --declared.
found_under_submod=0
while IFS= read -r spath; do
  [ -n "$spath" ] || continue
  # Normalise: strip trailing slash if any.
  case "$spath" in
    */) spath="${spath%/}" ;;
  esac
  while IFS= read -r fpath; do
    [ -n "$fpath" ] || continue
    # Check: fpath starts with "spath/" OR fpath == spath.
    case "$fpath" in
      "$spath"/*|"$spath")
        # With --declared: if this exact path is a gitlink path, it is the
        # allowed bump move — skip it, not a non-gitlink content touch.
        if [ "$declared" -eq 1 ] && [ -n "$gitlink_paths" ]; then
          is_gitlink=0
          while IFS= read -r gpath; do
            [ -n "$gpath" ] || continue
            if [ "$fpath" = "$gpath" ]; then
              is_gitlink=1
              break
            fi
          done <<GITLINKS
$gitlink_paths
GITLINKS
          if [ "$is_gitlink" -eq 1 ]; then
            continue
          fi
        fi
        found_under_submod=1
        break 2
        ;;
    esac
  done <<CHANGED
$changed_files
CHANGED
done <<SUBMODS
$submod_paths
SUBMODS

if [ "$found_under_submod" -eq 1 ]; then
  printf '%s: submodule mutation detected (path under .gitmodules submodule path)\n' "$PROG" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# No submodule mutation found.
# ---------------------------------------------------------------------------
exit 0
