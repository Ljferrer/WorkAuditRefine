#!/usr/bin/env bash
# assert-no-repo-escape.sh — /red-team post-run sandbox-escape detection guard.
#
# Runs BETWEEN the verification Workflow return and the gate (see
# skills/red-team/SKILL.md). Executed probes copy the repo into throwaway
# sandboxes and run destructive git there; a cwd reset between Bash calls or a
# bare `git push` can leak that work back into the REAL repo (recorded escape:
# memory redteam-executed-probe-cwd-reset-hits-real-remote). The hardened
# `git -C <sandbox>` scope-lock in the executed probe preamble is the PREVENTION
# layer; this guard is the DETECTION authority (Layer-2/3 doctrine, ADR 0033).
# A nonzero result quarantines the verdict through the self-confound gate —
# never CLEARED — until the state is clean.
#
# Usage: assert-no-repo-escape.sh --repo <abs-repo-dir>
#
# Checks (given --repo <abs>):
#   (a) `git -C <repo> status --porcelain` must be EMPTY — no stray working-tree
#       files a probe left behind. This half is EXACT.
#   (b) no local ref (`for-each-ref`) and no remote head (`ls-remote --heads
#       origin`, only when an `origin` remote is configured) matches the
#       throwaway-sandbox junk pattern: `refs/heads/redteam-*` or `*-sandbox-*`.
#
# ponytail: the junk-ref pattern is a HEURISTIC ceiling — a probe inventing an
# unrelated ref name slips it. The porcelain half is exact and the common escape
# (a bare push that lands a sandbox branch on origin) is caught by the pattern.
# Named upgrade path: a full ref-diff snapshot (pre/post ref set) if a second
# escape shape slips the pattern (plan Deferred validations backstop).
#
# Exit codes (load-bearing floor-family contract; sibling: assert-test-in-diff.sh,
# assert-no-submodule-mutation.sh — the 1-vs-2 boundary routes differently):
#   0 — clean (no stray files, no junk ref)
#   1 — escape detected (stray working-tree file OR junk sandbox ref)
#   2 — git error / non-repo (bad path, git failed) — a NON-clean, NON-escape
#       signal the caller must never collapse into 1 or treat as a pass.
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
set -euo pipefail

PROG="assert-no-repo-escape"
# die() default exit = 2 (the conservative infra code, per the header exit
# contract), NOT 1. The escape code (1) is emitted ONLY by escape() below — its
# hardcoded `exit 1` IS the detection path. Every die call site passes an explicit
# code (all 2) today; the default only governs a future code-omitting die call,
# which must read as an infra failure (2), never a false escape (1). Locked by
# assert-no-repo-escape.test.sh (source default lock + negative call-site lock).
die()    { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-2}"; }
escape() { printf '%s: escape detected — %s\n' "$PROG" "$1" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
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

[ -n "$repo_dir" ] || die "usage: $PROG --repo <abs-repo-dir>" 2

# Reject .. traversal (universal guard rule; mirrors siblings).
case "$repo_dir" in
  *..*) die "repo argument contains '..'; refusing unsafe path: $repo_dir" 2 ;;
esac

# ---------------------------------------------------------------------------
# Check (a): working tree must be clean. A git failure here (non-repo, bad
# path) is exit 2 — NEVER collapsed into the escape (1) or clean (0) signal.
# ---------------------------------------------------------------------------
status_out=""
status_out="$(git -C "$repo_dir" status --porcelain 2>/dev/null)" \
  || die "git status failed for repo '$repo_dir' (not a repo?)" 2

if [ -n "$status_out" ]; then
  escape "stray working-tree file(s):
$status_out"
fi

# ---------------------------------------------------------------------------
# Check (b1): no LOCAL ref matches the junk sandbox pattern.
# ---------------------------------------------------------------------------
local_refs=""
local_refs="$(git -C "$repo_dir" for-each-ref --format='%(refname)' 2>/dev/null)" \
  || die "git for-each-ref failed for repo '$repo_dir'" 2

while IFS= read -r ref; do
  [ -n "$ref" ] || continue
  case "$ref" in
    refs/heads/redteam-*|*-sandbox-*)
      escape "junk local ref: $ref" ;;
  esac
done <<LOCAL_REFS
$local_refs
LOCAL_REFS

# ---------------------------------------------------------------------------
# Check (b2): no REMOTE head on origin matches the junk pattern.
# Only run when an `origin` remote is configured — a repo with no origin has no
# remote to leak onto (benign, not an error). An origin that IS configured but
# whose ls-remote fails (network, bad url) is a git error -> exit 2.
# ---------------------------------------------------------------------------
remotes=""
remotes="$(git -C "$repo_dir" remote 2>/dev/null)" \
  || die "git remote failed for repo '$repo_dir'" 2

has_origin=0
while IFS= read -r rname; do
  [ "$rname" = "origin" ] && has_origin=1
done <<REMOTES
$remotes
REMOTES

if [ "$has_origin" -eq 1 ]; then
  ls_out=""
  ls_out="$(git -C "$repo_dir" ls-remote --heads origin 2>/dev/null)" \
    || die "git ls-remote --heads origin failed for repo '$repo_dir'" 2
  # ls-remote lines: "<sha>\t<refname>"; awk $2 is the refname.
  remote_refs=""
  remote_refs="$(printf '%s\n' "$ls_out" | awk '{print $2}')" || true
  while IFS= read -r ref; do
    [ -n "$ref" ] || continue
    case "$ref" in
      refs/heads/redteam-*|*-sandbox-*)
        escape "junk ref on origin: $ref" ;;
    esac
  done <<REMOTE_REFS
$remote_refs
REMOTE_REFS
fi

# ---------------------------------------------------------------------------
# Clean: no stray files, no junk ref.
# ---------------------------------------------------------------------------
exit 0
