#!/usr/bin/env bash
# Prove task-specific work already reached integration before a recovery skip.
# Usage (from the repository): task-integrated.sh <task-branch> <integration> <working>
# Exit 0: integrated nonempty task commit; 1: no proof, run ordinary work/audit;
# 2: Git/usage error, stop recovery. Branches are local names, never revision expressions.
set -euo pipefail
die() { printf 'task-integrated: %s\n' "$1" >&2; exit 2; }
no_proof() { printf 'NO_TASK_PROOF %s\n' "$1"; exit 1; }
[ "$#" -eq 3 ] || die 'expected task, integration and working branch names'
task_branch="$1"; integration_branch="$2"; working_branch="$3"
for branch in "$task_branch" "$integration_branch" "$working_branch"; do
  git check-ref-format "refs/heads/$branch" >/dev/null 2>&1 || die 'invalid branch name'
done
git rev-parse --git-dir >/dev/null 2>&1 || die 'not a Git repository'
task_tip=$(git rev-parse --verify "refs/heads/$task_branch^{commit}" 2>/dev/null) || no_proof "$task_branch absent or unreadable"
integration_tip=$(git rev-parse --verify "refs/heads/$integration_branch^{commit}" 2>/dev/null) || die 'cannot resolve integration'
working_tip=$(git rev-parse --verify "refs/heads/$working_branch^{commit}" 2>/dev/null) || die 'cannot resolve working branch'
if git merge-base --is-ancestor "$task_tip" "$integration_tip"; then
  :
else
  result=$?
  [ "$result" -eq 1 ] || die 'ancestry check failed'
  no_proof "$task_branch is not integrated"
fi
phase_base=$(git merge-base "$integration_tip" "$working_tip") || die 'cannot resolve phase base'
commits=$(git rev-list --no-merges "$phase_base..$task_tip") || die 'cannot read task history'
for commit in $commits; do
  owner=$(git show -s --format='%(trailers:key=WAR-Task,valueonly)' "$commit") || die 'cannot read task trailer'
  [ "$owner" = "$task_branch" ] || continue
  if git diff --quiet "$commit^" "$commit" --; then
    continue # An empty bookkeeping commit cannot prove task work.
  else
    result=$?
    [ "$result" -eq 1 ] || die 'cannot read task commit diff'
  fi
  printf 'TASK_INTEGRATED %s %s %s\n' "$task_branch" "$commit" "$integration_tip"
  exit 0
done
no_proof "$task_branch has no nonempty WAR-Task commit in the phase"
