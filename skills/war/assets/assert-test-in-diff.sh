#!/usr/bin/env bash
# assert-test-in-diff.sh — WAR worker test-floor guard (M2, spec §3.1).
#
# Usage: assert-test-in-diff.sh <integration-base> <task-branch> \
#          [--repo <git-dir>] [--pattern <glob-set>]
# (--repo is test-only: points git at a fixture repo; production invokes from the task-worktree cwd)
#
# Compute `git diff --name-only <base>...<branch>` (three-dot symmetric diff —
# exactly what the task branch added relative to the integration base).
#
# Exit codes (load-bearing contract):
#   0 — at least one changed path matches the test pattern (test found in diff)
#   1 — no matching test in the diff (the "no-test" route; not an error).
#       stdout stays the empty summary; stderr MAY carry the near-miss
#       diagnostic (see NEAR-MISS DIAGNOSTIC below) — advisory, never routed on.
#   2 — git/ref error (HARD error; NOT a "no-test" signal; caller must not treat
#       as "no test found" — it means the diff could not be computed)
#
# DEFAULT PATTERN = EXACTLY the resolved gate's discovery set (operator decision
# 2026-06-29 — supersedes the spec §3.1 broad union, which red-team proved
# over-counts):
#   - skills/**/*.test.mjs   (the node --test glob, PATH-SCOPED to skills/,
#                             DEPTH-AGNOSTIC — mirrors the unbounded glob)
#   - **/*.test.sh           (the repo-wide bash-suite find, *.test.sh anywhere,
#                             EXCLUDING node_modules/, .git/, and .claude/ — mirrors
#                             `find . -name '*.test.sh' -not -path '*/node_modules/*'
#                              -not -path '*/.git/*' -not -path '*/.claude/*'`)
#
# ponytail: default == gate-discovery set so the floor can never be satisfied
# by a test the gate ignores. Override via --pattern for repos that use other
# test types (.test.js, pytest, etc). The gate's resolveGate in war-config.mjs
# is the authoritative source; this default mirrors it verbatim.
#
# --pattern IS LOAD-BEARING: the value is PER-PHASE-RESOLVED from the run's
# overrides.testPattern config — pinned at Setup, and an --afk run's rejected
# Setup proposal can still be re-checked and adopted at a later phase launch —
# then threaded into each phase's Workflow and passed through to this floor by
# the refiner.
# A custom --pattern does NOT replace the floor wholesale — the gate's
# UNCONDITIONAL *.test.sh discovery arm (resolveGate appends
# `find . -name '*.test.sh' ...` to EVERY declared gate) is UNIONED into any
# custom set (match_sh_suite), so a *.test.sh suite always satisfies the floor.
# The union preserves floor ⊆ gate for the gate's unconditional discovery,
# whatever pattern is in force for the phase.
#
# NEAR-MISS DIAGNOSTIC (spec §4, D4/D5) — EXIT-1 PATH ONLY, STDERR ONLY.
# When nothing matched, the SAME changed-file list is re-scanned against a
# FIXED, documented set of test-shaped conventions:
#   *.test.*   *.spec.*   *_test.*   plus basename-prefix  test_*
# (node / pytest / go conventions, at equal cost; never derived from the repo —
# a floor-time derivation would make the verdict depend on tree state outside
# the diff). Any hit is printed on stderr next to the ACTIVE pattern set, so a
# pattern/target-repo mismatch is visible on the FIRST no-test instead of after
# three add-test rounds (#983).
# DIAGNOSTIC-ONLY: the scan can never block, change an exit code, or write to
# stdout — a false positive costs exactly one stderr line. No scan on exit 0
# (nothing to explain) and none on the exit-2 die path (a diff that could not be
# computed has no file list).
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
# A custom --pattern string is matched by iterating its space-separated glob
# tokens (caller controls), UNIONED with the gate's *.test.sh arm (match_sh_suite).
# ---------------------------------------------------------------------------

# match_sh_suite <path> -> exit 0 iff the path is a *.test.sh bash suite the
# gate's UNCONDITIONAL discovery loop would run: repo-wide, excluding
# node_modules/, .git/, and .claude/ to mirror:
#   find . -name '*.test.sh' -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.claude/*'
# resolveGate appends this loop to EVERY declared gate, so this arm is unioned
# into BOTH the default matcher (Pattern 2) and the custom --pattern branch —
# a *.test.sh suite always satisfies the floor, preserving floor ⊆ gate.
match_sh_suite() {
  p="$1"
  case "$p" in
    node_modules/*|*/node_modules/*) return 1 ;;
    .git/*|*/.git/*)                 return 1 ;;
    .claude/*|*/.claude/*)           return 1 ;;
    *.test.sh)                       return 0 ;;
  esac
  return 1
}

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
  # Pattern 2: **/*.test.sh (bash-suite find, repo-wide) — extracted to
  # match_sh_suite so the custom --pattern branch can union the same arm.
  match_sh_suite "$p"
}

# near_miss <path> -> exit 0 iff the path looks test-shaped under the fixed set
# documented in the header (*.test.*, *.spec.*, *_test.*, basename test_*).
# Diagnostic ONLY — never consulted by the match logic, never affects an exit
# code. Whole-path `case` suffix matching, same bash-3.2 idiom as
# match_sh_suite; the basename arm carries the prefix-shaped convention.
# ponytail: fixed conventional set, no repo derivation — a false positive costs
# one stderr line, so the cheap heuristic is the right ceiling.
near_miss() {
  p="$1"
  case "$p" in
    *.test.*|*.spec.*|*_test.*) return 0 ;;
  esac
  case "${p##*/}" in
    test_*) return 0 ;;
  esac
  return 1
}

found=0
if [ -n "$changed_files" ]; then
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    if [ -n "$custom_pattern" ]; then
      # Custom pattern: space-separated glob set supplied by caller; match each
      # token independently. `set -f` (noglob) keeps IFS word-splitting while
      # suppressing pathname expansion — without it the unquoted
      # `for pat in $custom_pattern` would glob-expand a token like `*.test.js`
      # against the cwd. Plain `break` (not `break 2`) exits only the `for` so
      # `set +f` always runs; `[ "$found" = 1 ] && break` ends the file-read while.
      # ponytail: space-separated glob set; each token matched independently.
      set -f
      for pat in $custom_pattern; do
        case "$f" in $pat) found=1; break ;; esac
      done
      set +f
      # UNION the gate's unconditional *.test.sh discovery arm: resolveGate
      # always appends the repo-wide `find . -name '*.test.sh' ...` loop, so a
      # *.test.sh suite satisfies the floor whatever the custom pattern —
      # floor ⊆ gate survives any --pattern. Only reached when no custom token
      # matched; `set +f` already restored (match_sh_suite's case globs are
      # literal, unaffected by noglob either way).
      if [ "$found" != 1 ] && match_sh_suite "$f"; then
        found=1
      fi
      [ "$found" = 1 ] && break
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

# Near-miss diagnostic — stderr only, this path only. stdout above is already
# committed and stays byte-empty; the exit 1 below is unconditional.
if [ -n "$changed_files" ]; then
  near_misses=""
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    if near_miss "$f"; then
      near_misses="$near_misses$f
"
    fi
  done <<EOF
$changed_files
EOF

  if [ -n "$near_misses" ]; then
    # ACTIVE pattern set. The defaults are printed FROM the pattern_mjs /
    # pattern_sh variables, never re-stated as literals here — a third
    # statement of the default set would drift from the header and the matcher
    # independently.
    if [ -n "$custom_pattern" ]; then
      active_set="$custom_pattern"
    else
      active_set="$pattern_mjs $pattern_sh"
    fi
    printf '%s: no diff file matched the active test pattern set: %s\n' "$PROG" "$active_set" >&2
    printf '%s: (the unconditional *.test.sh union arm is always in force, whatever the pattern)\n' "$PROG" >&2
    printf '%s: near-miss — test-shaped files in the diff that the active pattern did NOT match:\n' "$PROG" >&2
    while IFS= read -r f; do
      [ -n "$f" ] || continue
      printf '%s:   %s\n' "$PROG" "$f" >&2
    done <<EOF
$near_misses
EOF
    printf '%s: if those ARE the mapped tests, the pattern is wrong for this repo (--pattern / overrides.testPattern), not the diff.\n' "$PROG" >&2
  fi
fi

exit 1
