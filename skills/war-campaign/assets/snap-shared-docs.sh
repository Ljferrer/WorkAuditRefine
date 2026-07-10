#!/usr/bin/env bash
# snap-shared-docs.sh — package the stacked-doc snap recipe as one command.
#
# Canonical statement: spec §4.5 of
#   docs/specs/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization-design.md
# (The originating record is a LOCAL memory —
#  `stacked-pr-shared-doc-conflict-fix-merge-theirs` — not a repo learning, so
#  there is no docs/learnings/ path to cite here.)
#
# Usage: snap-shared-docs.sh <branch> [--repo <git-dir>]
#   <branch>  the stacked branch that conflicts with master on shared docs.
#   --repo    test-only: point git at a fixture repo (production runs from the
#             campaign repo's cwd, i.e. --repo defaults to ".").
#
# Reaffirms ADR 0011 (stack-and-plow) as the PRIMARY recurrence reducer — this
# helper is invoked only when a docs-only conflict surfaces anyway (C7). The
# caller is responsible for a fresh `git fetch` first; this helper snaps against
# whatever origin/* refs are already present (spec §4.5 lists no fetch step).
#
# Recipe (spec §4.5), run in a detached scratch worktree off origin/<branch>:
#   1. git merge --no-edit origin/master; resolve each unmerged path UNDER the
#      canonical churny-doc pathspec (docs/plans docs/specs docs/roadmaps) with
#      `git checkout --theirs -- "$f" && git add -- "$f"` (--theirs in a
#      merge-of-master = master's canonical copy). Any unmerged path OUTSIDE the
#      pathspec ⇒ REFUSE (a code-touching doc is never blindly --theirs'd).
#   2. Guard before push: 0 unmerged paths remain AND the diff outside the
#      pathspec (origin/<branch>..HEAD) is empty (code byte-identical to the
#      reviewed tip — a docs-only snap never alters code).
#   3. git push origin HEAD:refs/heads/<branch> — first parent = old tip ⇒
#      fast-forwards; wrong content auto-rejects non-ff. NEVER --force (C6).
#   4. Verify `git merge-tree --messages origin/master origin/<branch>` shows 0
#      CONFLICT before trusting GitHub's (lagging) mergeability.
#
# Exit codes (load-bearing contract, floor-family 0/1/2):
#   0 — snapped (or nothing to snap) and pushed as a fast-forward.
#   1 — REFUSED: an unmerged path outside the pathspec, or a code diff outside
#       the pathspec (a docs-only snap must never alter code). Not a tooling
#       error — the caller must resolve the code divergence by hand.
#   2 — git/tooling error (worktree/merge/push failure, post-snap CONFLICT).
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,});
# cwd-independent. Style mirrors assert-test-in-diff.sh / provision-worktrees.sh.
set -euo pipefail

PROG="snap-shared-docs"
die() { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-1}"; }

# under_pathspec <path> -> exit 0 iff the path lives under the canonical
# churny-doc pathspec (the only paths a snap may blindly resolve with --theirs).
under_pathspec() {
  case "$1" in
    docs/plans/*|docs/specs/*|docs/roadmaps/*) return 0 ;;
  esac
  return 1
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
[ $# -ge 1 ] || die "usage: $PROG <branch> [--repo <dir>]"

branch="$1"
shift

repo_dir="."
while [ $# -gt 0 ]; do
  case "$1" in
    --repo)
      [ $# -ge 2 ] || die "--repo requires a path"
      repo_dir="$2"; shift 2 ;;
    --) shift; break ;;
    -*) die "unknown argument '$1'" ;;
    *)  die "unexpected positional argument '$1'" ;;
  esac
done

# Safety: reject .. traversal in the branch argument.
case "$branch" in
  *..*) die "branch argument contains '..'; refusing potentially unsafe ref: $branch" ;;
esac

# ---------------------------------------------------------------------------
# Scratch worktree off origin/<branch> (detached — never touches the caller's
# checkout). Cleaned up on any exit.
# ---------------------------------------------------------------------------
scratch="$(mktemp -d 2>/dev/null || mktemp -d -t warsnap)"
cleanup() {
  git -C "$repo_dir" worktree remove --force "$scratch" >/dev/null 2>&1 || rm -rf "$scratch"
}
trap cleanup EXIT

git -C "$repo_dir" worktree add -q --detach "$scratch" "refs/remotes/origin/$branch" 2>/dev/null \
  || die "cannot create scratch worktree off origin/$branch" 2

# w: run git inside the scratch worktree.
w() { git -C "$scratch" "$@"; }

# ---------------------------------------------------------------------------
# Step 1: merge master, resolve churny-doc conflicts with master's copy.
# ---------------------------------------------------------------------------
merge_rc=0
w merge --no-edit origin/master >/dev/null 2>&1 || merge_rc=$?

unmerged="$(w diff --name-only --diff-filter=U 2>/dev/null)" \
  || die "git diff (unmerged) failed" 2

if [ -n "$unmerged" ]; then
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    if under_pathspec "$f"; then
      # --theirs in a merge-of-master = master's canonical copy.
      w checkout --theirs -- "$f" >/dev/null 2>&1 || die "checkout --theirs failed for '$f'" 2
      w add -- "$f" >/dev/null 2>&1 || die "git add failed for '$f'" 2
    else
      # A code-touching path is never blindly resolved with --theirs.
      die "REFUSE: unmerged path outside churny-doc pathspec: '$f'" 1
    fi
  done <<EOF
$unmerged
EOF
fi

# Complete the merge commit if the merge stopped on conflicts (a clean merge
# already auto-committed; merge_rc==0 leaves nothing to commit).
if [ "$merge_rc" -ne 0 ]; then
  w commit --no-edit >/dev/null 2>&1 || die "merge commit failed after resolving conflicts" 2
fi

# ---------------------------------------------------------------------------
# Step 2: guard before push — 0 unmerged remain AND no code diff outside the
# churny-doc pathspec (a docs-only snap never alters code).
# ---------------------------------------------------------------------------
remaining="$(w diff --name-only --diff-filter=U 2>/dev/null)" \
  || die "git diff (post-resolve unmerged) failed" 2
[ -z "$remaining" ] || die "unmerged paths remain after resolution: $remaining" 2

codediff="$(w diff "origin/$branch" HEAD -- . \
  ':(exclude)docs/plans' ':(exclude)docs/specs' ':(exclude)docs/roadmaps' 2>/dev/null)" \
  || die "git diff (code guard) failed" 2
[ -z "$codediff" ] \
  || die "REFUSE: code changed outside churny-doc pathspec — a docs-only snap never alters code" 1

# ---------------------------------------------------------------------------
# Step 3: push. First parent = old origin/<branch> tip ⇒ fast-forward; wrong
# content auto-rejects non-ff. NEVER --force (C6).
# ---------------------------------------------------------------------------
w push origin "HEAD:refs/heads/$branch" >/dev/null 2>&1 \
  || die "push rejected (non-fast-forward or remote error); NOT retrying with --force" 2

# ---------------------------------------------------------------------------
# Step 4: verify GitHub's (lagging) mergeability against local truth — the
# pushed origin/<branch> must merge master with 0 CONFLICT.
# ---------------------------------------------------------------------------
mtout="$(git -C "$repo_dir" merge-tree --messages origin/master "origin/$branch" 2>&1)" || true
case "$mtout" in
  *CONFLICT*) die "post-snap merge-tree still reports CONFLICT; snap incomplete" 2 ;;
esac

printf '%s: snapped %s to master canonical docs and pushed (fast-forward).\n' "$PROG" "$branch"
exit 0
