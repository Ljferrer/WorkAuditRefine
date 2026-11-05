#!/usr/bin/env bash
# Tests for task-integrated.sh — the recovery proof that a task merged through its merge commit.
#
# Plain bash over throwaway mktemp git repos, one fresh repo per case. bash 3.2.57 compatible
# and cwd-independent: the helper path comes from this file's own location, and every git call
# names its repo. Each case asserts the exit code AND the exact stdout token, because the
# refusals share exit 1 and only the marker text tells them apart (#2485 D14).
#
#   1. plain + untrailered floor-fix + `git revert --no-edit` commits, --no-ff merge -> TASK_INTEGRATED
#   2. one-commit task, --no-ff merge                                              -> TASK_INTEGRATED
#   3. never-merged branch                                       -> NO_TASK_PROOF ... is not integrated
#   4. fast-forward-only merge                          -> NO_TASK_PROOF ... has no WAR-Task merge commit
#   5. working branch equal to integration              -> NO_TASK_PROOF ... has no WAR-Task merge commit
#   6. a second task's merge commit (second parent = this tip) -> NO_TASK_PROOF ... no WAR-Task merge commit
#   7. task whose commits net to zero, --no-ff merge                              -> TASK_INTEGRATED
#   8. merged, then a plain commit changes an owned path -> NO_TASK_PROOF ... changed outside a sibling task merge
#   9. merge commit whose trailer is not exact (suffix)  -> NO_TASK_PROOF ... has no WAR-Task merge commit
#  10. merged, then an unrelated integration commit -> TASK_INTEGRATED <task> <merge commit> <later tip>
#  11. branch moved back below its merge commit's second parent -> NO_TASK_PROOF ... no WAR-Task merge commit
#  12-15. a later sibling merge edits an owned path                               -> TASK_INTEGRATED (#2571)
#  17-23. any other later change to an owned path -> NO_TASK_PROOF ... changed outside a sibling task merge
#  24-25. owned content at the merge commit differs from the task tip -> NO_TASK_PROOF ... at its merge commit
#  16, 26-27. a later change off the owned paths, including a glob-shaped name     -> TASK_INTEGRATED
#  28-30b. a failed walk, parent read, trailer read (task or late-fix) or content compare -> exit 2, no marker
#  31. a single-parent late-fix commit whose Late-Fix trailer names this task      -> TASK_INTEGRATED
#  31b-31e. a Late-Fix naming another task, a near-miss id, a bad index, or on a merge -> NO_TASK_PROOF
#
# Exit 0 = all cases passed; non-zero = at least one failed.
set -u

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HELPER="$HERE/task-integrated.sh"
PASS=0
FAIL=0
pass() { PASS=$((PASS + 1)); printf 'ok   %s\n' "$1"; }
fail() { FAIL=$((FAIL + 1)); printf 'FAIL %s\n' "$1"; }

ROOT="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
trap 'rm -rf "$ROOT"' EXIT
# Isolate the fixtures from the operator's git config (signing, hooks, default branch).
export HOME="$ROOT/home"
mkdir -p "$HOME"
export GIT_CONFIG_NOSYSTEM=1
export GIT_AUTHOR_NAME='WAR Fixture' GIT_AUTHOR_EMAIL='fixture@example.invalid'
export GIT_COMMITTER_NAME='WAR Fixture' GIT_COMMITTER_EMAIL='fixture@example.invalid'

TASK='war/fixture/p3-3.1'
OTHER='war/fixture/p3-3.2'
THIRD='war/fixture/p3-3.3'
REPO=''

g() { git -C "$REPO" "$@" >/dev/null 2>&1 || { printf 'fixture git failed: %s\n' "$*" >&2; exit 3; }; }
put() { printf '%s\n' "$2" > "$REPO/$1"; g add -A; }
# new_repo <name>: working branch `working` with one base commit, integration cut from it.
new_repo() {
  REPO="$ROOT/$1"
  mkdir -p "$REPO"
  g init -b working
  put base base
  g commit -m base
  g branch integration
}
# engine_merge <branch>: the engine's two-step task merge into integration, trailer exact.
engine_merge() {
  g checkout integration
  g -c core.hooksPath=/dev/null merge --no-ff --no-commit "$1"
  g -c core.hooksPath=/dev/null commit --no-verify -m "Merge $1" --trailer "WAR-Task: $1"
}
# probe <task> <integration> <working>: run the helper from the fixture repo root and print
# "<exit> <stdout and stderr>".
probe() {
  out="$(cd "$REPO" && bash "$HELPER" "$1" "$2" "$3" 2>&1)"
  printf '%s %s' "$?" "$out"
}
expect() { # expect <label> <want> <got>
  if [ "$3" = "$2" ]; then pass "$1"; else fail "$1 (want '$2', got '$3')"; fi
}

# Case 1: plain commit, untrailered floor-fix commit, and a `git revert --no-edit` commit.
new_repo c1
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m 'implement feature'
put feature.test 'mapped test'; g commit -m 'floor fix: add the mapped test'
put polish 'ace polish'; g commit -m 'ace polish'
g revert --no-edit HEAD
engine_merge "$TASK"
M="$(git -C "$REPO" rev-parse integration)"
expect 'case 1: plain + floor-fix + revert commits prove through the merge commit' \
  "0 TASK_INTEGRATED $TASK $M $M" "$(probe "$TASK" integration working)"

# Case 2: a one-commit task.
new_repo c2
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m 'implement feature'
engine_merge "$TASK"
M="$(git -C "$REPO" rev-parse integration)"
expect 'case 2: a one-commit task proves' "0 TASK_INTEGRATED $TASK $M $M" "$(probe "$TASK" integration working)"

# Case 3: never merged.
new_repo c3
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m "implement feature

WAR-Task: $TASK"
expect 'case 3: a never-merged branch refuses' "1 NO_TASK_PROOF $TASK is not integrated" "$(probe "$TASK" integration working)"

# Case 4: fast-forward only, even with a worker-side trailer (the retired legacy proof).
new_repo c4
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m "implement feature

WAR-Task: $TASK"
g checkout integration
g merge --ff-only "$TASK"
expect 'case 4: a fast-forward-only branch refuses with the no-merge-commit marker' \
  "1 NO_TASK_PROOF $TASK has no WAR-Task merge commit" "$(probe "$TASK" integration working)"

# Case 5: the working branch equals integration, so the phase holds no first-parent commit.
new_repo c5
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m 'implement feature'
engine_merge "$TASK"
g branch -f working integration
expect 'case 5: a working branch equal to integration refuses' \
  "1 NO_TASK_PROOF $TASK has no WAR-Task merge commit" "$(probe "$TASK" integration working)"

# Case 6: a second task's merge commit whose second parent IS this task's tip never proves it.
new_repo c6
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m 'implement feature'
g branch "$OTHER" "$TASK"
engine_merge "$OTHER"
expect 'case 6: a second task merge commit never proves the first' \
  "1 NO_TASK_PROOF $TASK has no WAR-Task merge commit" "$(probe "$TASK" integration working)"
M="$(git -C "$REPO" rev-parse integration)"
expect 'case 6b: the same merge commit proves its own task' \
  "0 TASK_INTEGRATED $OTHER $M $M" "$(probe "$OTHER" integration working)"

# Case 7: the task's commits net to zero; the merge commit is still the proof.
new_repo c7
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m 'implement feature'
g revert --no-edit HEAD
engine_merge "$TASK"
M="$(git -C "$REPO" rev-parse integration)"
expect 'case 7: a net-zero task proves through its merge commit' \
  "0 TASK_INTEGRATED $TASK $M $M" "$(probe "$TASK" integration working)"

# Case 8: the later-history walk refuses a plain commit on an owned path.
new_repo c8
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m 'implement feature'
engine_merge "$TASK"
put feature 'lost accepted behavior'; g commit -m 'later change'
expect 'case 8: owned content changed after the merge refuses' \
  "1 NO_TASK_PROOF $TASK owned path changed outside a sibling task merge" "$(probe "$TASK" integration working)"

# Case 9: an inexact trailer value never matches the task branch.
new_repo c9
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m 'implement feature'
g checkout integration
g merge --no-ff --no-commit "$TASK"
g commit --no-verify -m "Merge $TASK" --trailer "WAR-Task: $TASK-extra"
expect 'case 9: an inexact trailer refuses' \
  "1 NO_TASK_PROOF $TASK has no WAR-Task merge commit" "$(probe "$TASK" integration working)"

# Case 10: the merge commit sits below the tip, so the two provenance fields must differ.
new_repo c10
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m 'implement feature'
engine_merge "$TASK"
M="$(git -C "$REPO" rev-parse integration)"
put unrelated 'sibling work'; g commit -m 'unrelated later commit'
TIP="$(git -C "$REPO" rev-parse integration)"
expect 'case 10: the merge-commit field names M below a later integration tip' \
  "0 TASK_INTEGRATED $TASK $M $TIP" "$(probe "$TASK" integration working)"

# Case 11: the merge commit's trailer is exact, but its second parent is not the current task tip.
new_repo c11
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m 'implement feature'
put second 'second task commit'; g commit -m 'second task commit'
engine_merge "$TASK"
g branch -f "$TASK" "$TASK~1"
expect 'case 11: a merge commit whose second parent is not the task tip refuses' \
  "1 NO_TASK_PROOF $TASK has no WAR-Task merge commit" "$(probe "$TASK" integration working)"

# later_task <branch> <path> <content>: the engine's merge of a task cut from the integration tip.
later_task() {
  g checkout -b "$1" integration
  put "$2" "$3"; g commit -m "edit $2"
  engine_merge "$1"
}
# task_a: task TASK edits `feature` and merges. M is its merge commit. A_TIP is its tip.
task_a() {
  new_repo "$1"
  g checkout -b "$TASK" integration
  put feature 'task feature'; g commit -m 'implement feature'
  A_TIP="$(git -C "$REPO" rev-parse "$TASK")"
  engine_merge "$TASK"
  M="$(git -C "$REPO" rev-parse integration)"
}
tip() { git -C "$REPO" rev-parse integration; }
REFUSED="1 NO_TASK_PROOF $TASK owned path changed outside a sibling task merge"

# Case 12 (#2571): B depends on A, edits A's file and merges after A. Both tasks prove.
task_a c12
later_task "$OTHER" feature 'task feature, extended by the sibling'
TIP="$(tip)"
expect 'case 12: a later sibling merge on an owned path leaves the task proved' \
  "0 TASK_INTEGRATED $TASK $M $TIP" "$(probe "$TASK" integration working)"
expect 'case 12b: the sibling proves through its own merge commit' \
  "0 TASK_INTEGRATED $OTHER $TIP $TIP" "$(probe "$OTHER" integration working)"

# Case 13: two later siblings on the same path, so the walk reads more than one changer.
task_a c13
later_task "$OTHER" feature 'second edit'
later_task "$THIRD" feature 'third edit'
expect 'case 13: two later sibling merges on an owned path leave the task proved' \
  "0 TASK_INTEGRATED $TASK $M $(tip)" "$(probe "$TASK" integration working)"

# Case 14: a sibling merge deletes the owned file, and a deletion is a change the walk attributes.
task_a c14
g checkout -b "$OTHER" integration
g rm feature; g commit -m 'remove the feature'
engine_merge "$OTHER"
expect 'case 14: a later sibling merge that deletes an owned path leaves the task proved' \
  "0 TASK_INTEGRATED $TASK $M $(tip)" "$(probe "$TASK" integration working)"

# Case 15: a sibling merge off the owned paths, then one on them.
task_a c15
later_task "$OTHER" unrelated 'sibling file'
later_task "$THIRD" feature 'third edit'
expect 'case 15: a sibling merge off the owned paths and one on them both pass' \
  "0 TASK_INTEGRATED $TASK $M $(tip)" "$(probe "$TASK" integration working)"

# Case 16: a later merge with no trailer that leaves every owned path alone never blocks the proof.
task_a c16
g checkout -b side integration
put unrelated 'side file'; g commit -m 'side work'
g checkout integration
g -c core.hooksPath=/dev/null merge --no-ff --no-edit side
expect 'case 16: a trailerless merge off the owned paths leaves the task proved' \
  "0 TASK_INTEGRATED $TASK $M $(tip)" "$(probe "$TASK" integration working)"

# Case 17 (#2571): a plain commit edits A's file after M.
task_a c17
later_task "$OTHER" feature 'sibling edit'
put feature 'plain edit'; g commit -m 'direct commit on integration'
expect 'case 17: a plain commit after a sibling merge refuses' "$REFUSED" "$(probe "$TASK" integration working)"

# Case 17b: a sibling merge above the plain commit never hides it.
task_a c17b
put feature 'plain edit'; g commit -m 'direct commit on integration'
later_task "$OTHER" feature 'sibling edit on top'
expect 'case 17b: a plain commit below a sibling merge refuses' "$REFUSED" "$(probe "$TASK" integration working)"

# Case 18: reverting a sibling merge restores A's bytes, but a revert is not a task merge.
task_a c18
later_task "$OTHER" feature 'sibling edit'
g revert --no-edit -m 1 HEAD
expect 'case 18: a revert commit on an owned path refuses even when the bytes match again' \
  "$REFUSED" "$(probe "$TASK" integration working)"

# Case 19: a second merge names this same task and carries another second parent.
task_a c19
g checkout -b rework integration
put feature 'rework'; g commit -m 'rework'
g checkout integration
g -c core.hooksPath=/dev/null merge --no-ff --no-commit rework
g -c core.hooksPath=/dev/null commit --no-verify -m "Merge $TASK again" --trailer "WAR-Task: $TASK"
expect 'case 19: a later merge naming this same task refuses' "$REFUSED" "$(probe "$TASK" integration working)"

# Case 20: a polish commit carries a sibling trailer, but it has one parent.
task_a c20
put feature 'polish edit'; g commit -m "polish

WAR-Task: $OTHER"
expect 'case 20: a single-parent commit with a sibling trailer refuses' "$REFUSED" "$(probe "$TASK" integration working)"

# Case 20b: an octopus merge carries a sibling trailer, but it has three parents.
task_a c20b
g checkout -b side integration
put feature 'side edit'; g commit -m 'side work'
g checkout -b side2 integration
put unrelated 'second side'; g commit -m 'second side work'
g checkout integration
g -c core.hooksPath=/dev/null merge --no-ff --no-commit side side2
g -c core.hooksPath=/dev/null commit --no-verify -m 'Merge sides' --trailer "WAR-Task: $OTHER"
expect 'case 20b: a three-parent merge with a sibling trailer refuses' "$REFUSED" "$(probe "$TASK" integration working)"

# Case 21: a merge with no trailer changes an owned path.
task_a c21
g checkout -b side integration
put feature 'side edit'; g commit -m 'side work'
g checkout integration
g -c core.hooksPath=/dev/null merge --no-ff --no-edit side
expect 'case 21: a trailerless merge on an owned path refuses' "$REFUSED" "$(probe "$TASK" integration working)"

# Case 22: two trailer values, one of them this task, never read as a clean sibling.
task_a c22
g checkout -b side integration
put feature 'side edit'; g commit -m 'side work'
g checkout integration
g -c core.hooksPath=/dev/null merge --no-ff --no-commit side
g -c core.hooksPath=/dev/null commit --no-verify -m 'Merge side' --trailer "WAR-Task: $OTHER" --trailer "WAR-Task: $TASK"
expect 'case 22: a merge with two WAR-Task trailers refuses' "$REFUSED" "$(probe "$TASK" integration working)"

# Case 22b: a trailer value that no branch could carry names no task.
task_a c22b
g checkout -b side integration
put feature 'side edit'; g commit -m 'side work'
g checkout integration
g -c core.hooksPath=/dev/null merge --no-ff --no-commit side
g -c core.hooksPath=/dev/null commit --no-verify -m 'Merge side' --trailer 'WAR-Task: not a branch'
expect 'case 22b: a merge whose trailer is no branch name refuses' "$REFUSED" "$(probe "$TASK" integration working)"

# Case 23: mode, Gitlink and rename-side changes each count as a later change to an owned path.
task_a c23
g update-index --chmod=+x feature; g commit -m 'mode change on integration'
expect 'case 23: a later mode change on an owned path refuses' "$REFUSED" "$(probe "$TASK" integration working)"

new_repo c23b
g checkout -b "$TASK" integration
GITLINK="$(git -C "$REPO" rev-parse HEAD)"
g update-index --add --cacheinfo "160000,$GITLINK,sub"; g commit -m 'add a gitlink'
engine_merge "$TASK"
g checkout -f integration
g update-index --cacheinfo "160000,$(git -C "$REPO" rev-parse "$TASK"),sub"; g commit -m 'bump the gitlink'
expect 'case 23b: a later plain Gitlink bump on an owned path refuses' "$REFUSED" "$(probe "$TASK" integration working)"

new_repo c23c
g checkout integration
put old 'old name'; g commit -m 'seed old'
g checkout -b "$TASK" integration
g mv old new; g commit -m 'rename'
engine_merge "$TASK"
put old 'the old name returns'; g commit -m 'recreate the rename source'
expect 'case 23c: a later plain commit on a rename source refuses' "$REFUSED" "$(probe "$TASK" integration working)"

# Case 24: an evil merge changes an owned path inside M itself, and nothing later touches it.
new_repo c24
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m 'implement feature'
g checkout integration
g -c core.hooksPath=/dev/null merge --no-ff --no-commit "$TASK"
put feature 'evil merge bytes'
g -c core.hooksPath=/dev/null commit --no-verify -m "Merge $TASK" --trailer "WAR-Task: $TASK"
expect 'case 24: owned content changed inside the merge commit refuses' \
  "1 NO_TASK_PROOF $TASK changed-file content differs at its merge commit" "$(probe "$TASK" integration working)"

# Case 25: a sibling merge above an evil merge cannot launder it.
new_repo c25
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m 'implement feature'
g checkout integration
g -c core.hooksPath=/dev/null merge --no-ff --no-commit "$TASK"
put feature 'evil merge bytes'
g -c core.hooksPath=/dev/null commit --no-verify -m "Merge $TASK" --trailer "WAR-Task: $TASK"
later_task "$OTHER" feature 'sibling edit'
expect 'case 25: a sibling merge above an evil merge still refuses' \
  "1 NO_TASK_PROOF $TASK changed-file content differs at its merge commit" "$(probe "$TASK" integration working)"

# Case 26: a sibling merge that edits only unrelated files is outside the content proof.
task_a c26
put unrelated 'plain edit'; g commit -m 'plain commit off the owned paths'
later_task "$OTHER" unrelated 'sibling edit'
expect 'case 26: later changes off the owned paths leave the task proved' \
  "0 TASK_INTEGRATED $TASK $M $(tip)" "$(probe "$TASK" integration working)"

# Case 27: a path name with glob bytes stays literal, so a plain commit on `ab` is not a change to `a*`.
new_repo c27
g checkout -b "$TASK" integration
put 'a*' 'glob-shaped owned file'; g commit -m 'implement feature'
engine_merge "$TASK"
M="$(tip)"
put ab 'plain edit of a file the glob would match'; g commit -m 'plain commit'
expect 'case 27: a glob-shaped owned path matches only itself' \
  "0 TASK_INTEGRATED $TASK $M $(tip)" "$(probe "$TASK" integration working)"

# Case 31 (late-defects PIN-25): the late-fix pass fast-forwards a one-parent commit onto an owned path,
# with the trailer `Late-Fix: <bare task id>:<n>`; the bare id is the branch leaf after `p3-`.
task_a c31
put feature 'late fix'; g commit -m 'late fix

Late-Fix: 3.1:1'
later_task "$OTHER" unrelated 'sibling after the late fix'
put feature 'second late fix'; g commit -m 'second late fix

Late-Fix: 3.1:2'
expect 'case 31: a single-parent late-fix commit naming this task leaves the task proved' \
  "0 TASK_INTEGRATED $TASK $M $(tip)" "$(probe "$TASK" integration working)"

# Case 31b: a late-fix commit that names another task is not this task's.
task_a c31b
put feature 'late fix'; g commit -m 'late fix

Late-Fix: 3.2:1'
expect 'case 31b: a late-fix commit naming another task refuses' "$REFUSED" "$(probe "$TASK" integration working)"

# Case 31c: ids that only contain this task's id, or a dot-as-wildcard spelling, never match it.
task_a c31c
put feature 'late fix'; g commit -m 'late fix

Late-Fix: 13.1:1
Late-Fix: 3.1.1:1
Late-Fix: 3x1:1'
expect 'case 31c: a near-miss Late-Fix id refuses' "$REFUSED" "$(probe "$TASK" integration working)"

# Case 31d: the index must be an integer.
task_a c31d
put feature 'late fix'; g commit -m 'late fix

Late-Fix: 3.1:one'
expect 'case 31d: a Late-Fix trailer without an integer index refuses' "$REFUSED" "$(probe "$TASK" integration working)"

# Case 31e: the trailer proves only a one-parent commit, never a merge that carries it.
task_a c31e
g checkout -b side integration
put feature 'side edit'; g commit -m 'side work'
g checkout integration
g -c core.hooksPath=/dev/null merge --no-ff --no-commit side
g -c core.hooksPath=/dev/null commit --no-verify -m 'Merge side' --trailer 'Late-Fix: 3.1:1'
expect 'case 31e: a merge commit carrying a Late-Fix trailer refuses' "$REFUSED" "$(probe "$TASK" integration working)"

# probe_shim <args fragment>: run the helper with a git that exits 128 on any call holding the fragment.
# If SHIM_PASS_FIRST names an absent file, the first matching call passes.
REAL_GIT="$(command -v git)"
SHIM="$ROOT/shim"
mkdir -p "$SHIM"
cat > "$SHIM/git" <<SHIMEOF
#!/bin/bash
case " \$* " in
  *"\$SHIM_FRAGMENT"*)
    if [ -n "\${SHIM_PASS_FIRST:-}" ] && [ ! -e "\$SHIM_PASS_FIRST" ]; then
      : > "\$SHIM_PASS_FIRST"
    else
      echo 'shim: forced failure' >&2; exit 128
    fi ;;
esac
exec "$REAL_GIT" "\$@"
SHIMEOF
chmod +x "$SHIM/git"
probe_shim() {
  out="$(cd "$REPO" && PATH="$SHIM:$PATH" SHIM_FRAGMENT="$1" bash "$HELPER" "$TASK" integration working 2>&1)"
  printf '%s %s' "$?" "$out"
}

# Case 28: a failed walk stops recovery. It never reads as ordinary missing proof.
task_a c28
later_task "$OTHER" feature 'sibling edit'
expect 'case 28: a failed later-history walk exits 2' \
  '2 shim: forced failure
task-integrated: cannot read later integration history' "$(probe_shim "--first-parent $M..")"

# Case 29: a failed parent read on a later commit exits 2.
task_a c29
later_task "$OTHER" feature 'sibling edit'
expect 'case 29: a failed parent read on a later commit exits 2' \
  '2 shim: forced failure
task-integrated: cannot read later merge parents' "$(probe_shim "--format=%P $(tip)")"

# Case 29b: the first trailer read is the owner walk, so the shim fails the second read of this commit.
task_a c29b
later_task "$OTHER" feature 'sibling edit'
expect 'case 29b: a failed trailer read on a later commit exits 2' \
  '2 shim: forced failure
task-integrated: cannot read later task trailer' "$(SHIM_PASS_FIRST="$ROOT/c29b.seen" probe_shim "valueonly) $(tip)")"

# Case 30: a failed compare at the merge commit exits 2.
task_a c30
expect 'case 30: a failed compare at the merge commit exits 2' \
  '2 shim: forced failure
task-integrated: cannot compare current task content' "$(probe_shim "--quiet $A_TIP $M")"

# Case 30b: a failed Late-Fix trailer read on a later single-parent commit exits 2.
task_a c30b
put feature 'late fix'; g commit -m 'late fix

Late-Fix: 3.1:1'
expect 'case 30b: a failed late-fix trailer read on a later commit exits 2' \
  '2 shim: forced failure
task-integrated: cannot read later late-fix trailer' "$(probe_shim "key=Late-Fix,valueonly) $(tip)")"

printf '\ntask-integrated: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
