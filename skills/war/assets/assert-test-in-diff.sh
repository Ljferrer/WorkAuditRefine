#!/usr/bin/env bash
# assert-test-in-diff.sh — WAR worker test-floor guard (M2, spec §3.1).
#
# Usage: assert-test-in-diff.sh <integration-base> <task-branch> \
#          [--repo <git-dir>] [--pattern <glob-set>]
#
# Compute `git diff --name-only <base>...<branch>` (three-dot symmetric diff —
# exactly what the task branch added relative to the integration base).
#
# Exit codes (load-bearing contract):
#   0 — at least one changed path matches the test pattern (test found in diff)
#   1 — no matching test in the diff (the "no-test" route; not an error)
#   2 — git/ref error (HARD error; NOT a "no-test" signal; caller must not treat
#       as "no test found" — it means the diff could not be computed)
#
# DEFAULT PATTERN = EXACTLY the resolved gate's discovery set (operator decision
# 2026-06-29 — supersedes the spec §3.1 broad union, which red-team proved
# over-counts):
#   - skills/**/*.test.mjs   (the node --test glob, PATH-SCOPED to skills/,
#                             DEPTH-AGNOSTIC — mirrors the unbounded glob)
#   - **/*.test.sh           (the repo-wide bash-suite find, *.test.sh anywhere,
#                             EXCLUDING node_modules/ and .git/ — mirrors
#                             `find . -name '*.test.sh' -not -path '*/node_modules/*'
#                              -not -path '*/.git/*'`)
#
# ponytail: default == gate-discovery set so the floor can never be satisfied
# by a test the gate ignores. Override via --pattern for repos that use other
# test types (.test.js, pytest, etc). The gate's resolveGate in war-config.mjs
# is the authoritative source; this default mirrors it verbatim.
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
# Style mirrors validate-auditor-git.sh / provision-worktrees.sh.
set -euo pipefail

PROG="assert-test-in-diff"
die()  { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-1}"; }

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
[ $# -ge 2 ] || die "usage: $PROG <integration-base> <task-branch> [--repo <dir>] [--pattern <glob-set>]"

base="$1"
branch="$2"
shift 2

repo_dir=""
# Default: two patterns that mirror the gate exactly.
# Pattern 1: skills/**/*.test.mjs (node --test glob, scoped to skills/)
# Pattern 2: **/*.test.sh         (bash-suite find, repo-wide)
pattern_mjs="skills/**/*.test.mjs"
pattern_sh="**/*.test.sh"
custom_pattern=""

while [ $# -gt 0 ]; do
  case "$1" in
    --repo)
      [ $# -ge 2 ] || die "--repo requires a path"
      repo_dir="$2"; shift 2 ;;
    --pattern)
      [ $# -ge 2 ] || die "--pattern requires a glob-set"
      custom_pattern="$2"; shift 2 ;;
    --) shift; break ;;
    -*) die "unknown argument '$1'" ;;
    *)  die "unexpected positional argument '$1'" ;;
  esac
done

# ---------------------------------------------------------------------------
# Safety: reject .. traversal in base or branch arguments.
# (A `..` token in a git ref typically resolves to a relative path traversal
# when the arg looks like a filesystem path; fail loud to prevent confusion.)
# ---------------------------------------------------------------------------
case "$base" in
  *..*)  die "base argument contains '..'; refusing to use potentially unsafe ref: $base" ;;
esac
case "$branch" in
  *..*)  die "branch argument contains '..'; refusing to use potentially unsafe ref: $branch" ;;
esac

# ---------------------------------------------------------------------------
# Run git diff --name-only <base>...<branch>.
# If --repo is supplied, use git -C <repo_dir>; otherwise use the cwd.
# ---------------------------------------------------------------------------
if [ -n "$repo_dir" ]; then
  git_cmd="git -C $repo_dir"
else
  git_cmd="git"
fi

# Three-dot diff: exactly what <branch> added vs the merge-base of <base>.
# We capture the list; an empty diff (base == branch) is not a crash — we just
# get zero lines, which means no test found, which is non-zero exit.
changed_files="$($git_cmd diff --name-only "$base...$branch" 2>/dev/null)" || \
  die "git diff failed for '$base...$branch'" 2

# ---------------------------------------------------------------------------
# Match each changed file against the test pattern(s).
# macOS bash 3.2 has no globstar; we implement the two default patterns with
# explicit prefix/suffix matching:
#   Pattern 1: skills/**/*.test.mjs — file starts with "skills/" and ends with ".test.mjs"
#   Pattern 2: **/*.test.sh        — file ends with ".test.sh" (repo-wide)
# A custom --pattern string is matched via a single case glob (caller controls).
# ---------------------------------------------------------------------------

# match_default <path> -> exit 0 if the path matches the gate's default patterns.
match_default() {
  p="$1"
  # Pattern 1: skills/**/*.test.mjs (node --test glob, scoped to skills/).
  # Depth-agnostic: check prefix then suffix independently, no enumeration cap.
  # ponytail: two nested case arms instead of depth-1..5 enumeration; mirrors the
  # gate's unbounded `skills/**/*.test.mjs` glob exactly.
  case "$p" in
    skills/*)
      case "$p" in
        *.test.mjs) return 0 ;;
      esac ;;
  esac
  # Pattern 2: **/*.test.sh (bash-suite find, repo-wide).
  # Exclude node_modules/ and .git/ to mirror:
  #   find . -name '*.test.sh' -not -path '*/node_modules/*' -not -path '*/.git/*'
  case "$p" in
    node_modules/*|*/node_modules/*) return 1 ;;
    .git/*|*/.git/*)                 return 1 ;;
    *.test.sh)                       return 0 ;;
  esac
  return 1
}

found=0
if [ -n "$changed_files" ]; then
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    if [ -n "$custom_pattern" ]; then
      # Custom pattern: single case glob supplied by caller.
      # ponytail: one-glob custom path; add multi-pattern support when needed.
      case "$f" in
        $custom_pattern) found=1; break ;;
      esac
    else
      if match_default "$f"; then
        found=1
        break
      fi
    fi
  done <<EOF
$changed_files
EOF
fi

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
if [ "$found" -eq 1 ]; then
  # Exit 0: at least one test file was found in the diff.
  exit 0
fi

# Exit non-zero: no test file in the diff. Emit an empty summary on stdout
# (the refiner reads this; empty = no matched test files).
printf ''
exit 1
