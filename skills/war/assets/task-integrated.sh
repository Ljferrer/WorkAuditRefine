#!/usr/bin/env bash
# Prove task-specific work already reached integration before a recovery skip.
# Usage (from the repository): task-integrated.sh <task-branch> <integration> <working>
# Exit 0: integrated task provenance and preserved final content; 1: no proof, run work/audit;
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
proof_root=$(git rev-parse --show-toplevel) || die 'cannot resolve repository root'
cd "$proof_root" || die 'cannot enter repository root'
proof_diff() { git --literal-pathspecs diff --no-ext-diff --ignore-submodules=none "$@"; }
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
commits=$(git rev-list --reverse --topo-order --no-merges "$phase_base..$task_tip") || die 'cannot read task history'
provenance_commit=''
ownership_base=''
owned_commits=''
for commit in $commits; do
  owner=$(git show -s --format='%(trailers:key=WAR-Task,valueonly)' "$commit") || die 'cannot read task trailer'
  [ "$owner" = "$task_branch" ] || continue
  if proof_diff --quiet "$commit^" "$commit" --; then
    continue # An empty bookkeeping commit cannot prove task work.
  else
    result=$?
    [ "$result" -eq 1 ] || die 'cannot read task commit diff'
  fi
  [ -n "$ownership_base" ] || ownership_base="$commit^"
  provenance_commit="$commit"
  owned_commits+=" $commit"
done
[ -n "$provenance_commit" ] || no_proof "$task_branch has no nonempty WAR-Task commit in the phase"
# Do not combine an old owner witness with unrelated surviving work. Once owned work
# starts, any nonempty unowned/merge contribution makes attribution uncertain. Empty
# bookkeeping is harmless. Rebased sibling history before ownership_base is preserved.
owned_history=$(git rev-list "$ownership_base..$task_tip") || die 'cannot read owned interval'
for commit in $owned_history; do
  case " $owned_commits " in *" $commit "*) continue ;; esac
  if proof_diff --quiet "$commit^" "$commit" --; then
    :
  else
    result=$?
    [ "$result" -eq 1 ] || die 'cannot read unowned contribution'
    no_proof "$task_branch has mixed history after task-owned work"
  fi
done
if proof_diff --quiet "$ownership_base" "$task_tip" --; then
  no_proof "$task_branch has no surviving task-owned change"
else
  result=$?
  [ "$result" -eq 1 ] || die 'cannot read surviving task-owned diff'
fi
# Union every owned commit's paths, even changes that cancel preceding phase work.
# Preserve rename sides, Gitlinks, modes and deletions; duplicate paths are harmless.
proof_paths=$(mktemp "${TMPDIR:-/tmp}/war-task-integrated.XXXXXX") || die 'cannot allocate proof paths'
trap 'rm -f "$proof_paths"' EXIT
for commit in $owned_commits; do
  proof_diff --no-renames --name-only -z "$commit^" "$commit" -- >> "$proof_paths" || die 'cannot read owned task paths'
done
while IFS= read -r -d '' proof_path; do
  if proof_diff --quiet "$task_tip" "$integration_tip" -- "$proof_path"; then
    :
  else
    result=$?
    [ "$result" -eq 1 ] || die 'cannot compare current task content'
    no_proof "$task_branch changed-file content differs at integration"
  fi
done < "$proof_paths"
# The proof used immutable objects; refuse a stale result if any named input moved meanwhile.
proof_refs=$(git rev-parse "refs/heads/$task_branch^{commit}" "refs/heads/$integration_branch^{commit}" "refs/heads/$working_branch^{commit}") || die 'cannot re-read proof refs'
[ "$proof_refs" = "$(printf '%s\n' "$task_tip" "$integration_tip" "$working_tip")" ] || no_proof 'refs moved during task proof'
printf 'TASK_INTEGRATED %s %s %s\n' "$task_branch" "$provenance_commit" "$integration_tip"
