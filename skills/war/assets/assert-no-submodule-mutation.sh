#!/usr/bin/env bash
# assert-no-submodule-mutation.sh — WAR refiner submodule-refuse floor guard (Increment 1).
#
# Usage: assert-no-submodule-mutation.sh <base> <branch> [--repo <git-dir>]
#
# Compute `git diff --raw <base>...<branch>` (three-dot symmetric diff —
# exactly what the task branch added relative to the integration base).
#
# Detect a submodule mutation if ANY of:
#   1. A gitlink entry appears in the raw diff (mode 160000 in old OR new mode field).
#   2. A changed path lives under a .gitmodules submodule path
#      (cross-checked via `git config -f .gitmodules --get-regexp '\.path$'`).
#
# Exit codes (load-bearing contract — mirrors assert-test-in-diff.sh discipline;
# memory: floor-script-exit-codes-1-vs-2-route-differently):
#   0 — no submodule mutation in the diff (clean; allow)
#   1 — submodule mutation detected (REFUSE)
#   2 — git/ref error (fatal git error, bad ref; NOT a refuse signal; caller
#       must not treat as a clean pass — it means the diff could not be computed)
#
# ponytail: refuse-ALL stance — any gitlink/submodule-path touch is refused.
# Increment 2 relaxes this to refuse-UNDECLARED via a --declared flag (named
# here for context; not built in Increment 1). See ADR-0009.
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
set -euo pipefail

PROG="assert-no-submodule-mutation"
die()  { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-1}"; }

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
[ $# -ge 2 ] || die "usage: $PROG <base> <branch> [--repo <dir>]" 2

base="$1"
branch="$2"
shift 2

repo_dir=""

while [ $# -gt 0 ]; do
  case "$1" in
    --repo)
      [ $# -ge 2 ] || die "--repo requires a path" 2
      repo_dir="$2"; shift 2 ;;
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
# macOS bash 3.2: use read with IFS to split fields; no arrays available.
# ponytail: awk one-liner; bash 3.2-safe, no external deps beyond awk.
# ---------------------------------------------------------------------------
found_gitlink=0
if [ -n "$raw_diff" ]; then
  # awk: field 1 is :<old-mode>, field 2 is <new-mode>.
  # A gitlink if old-mode == :160000 OR new-mode == 160000.
  if printf '%s\n' "$raw_diff" | awk '
    /^:/ {
      old = substr($1, 2)   # strip leading ":"
      new = $2
      if (old == "160000" || new == "160000") { found=1; exit }
    }
    END { exit !found }
  ' 2>/dev/null; then
    found_gitlink=1
  fi
fi

if [ "$found_gitlink" -eq 1 ]; then
  printf '%s: submodule mutation detected (gitlink mode 160000 in diff)\n' "$PROG" >&2
  exit 1
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
