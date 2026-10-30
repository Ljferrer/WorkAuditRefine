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
#   8. merged, then integration changes an owned path -> NO_TASK_PROOF ... content differs at integration
#   9. merge commit whose trailer is not exact (suffix)  -> NO_TASK_PROOF ... has no WAR-Task merge commit
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

# Case 8: the owned-path content check over M^1..M^2 still refuses lost task content.
new_repo c8
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m 'implement feature'
engine_merge "$TASK"
put feature 'lost accepted behavior'; g commit -m 'later change'
expect 'case 8: owned content changed after the merge refuses' \
  "1 NO_TASK_PROOF $TASK changed-file content differs at integration" "$(probe "$TASK" integration working)"

# Case 9: an inexact trailer value never matches the task branch.
new_repo c9
g checkout -b "$TASK" integration
put feature 'task feature'; g commit -m 'implement feature'
g checkout integration
g merge --no-ff --no-commit "$TASK"
g commit --no-verify -m "Merge $TASK" --trailer "WAR-Task: $TASK-extra"
expect 'case 9: an inexact trailer refuses' \
  "1 NO_TASK_PROOF $TASK has no WAR-Task merge commit" "$(probe "$TASK" integration working)"

printf '\ntask-integrated: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
