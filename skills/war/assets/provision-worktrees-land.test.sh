#!/usr/bin/env bash
# Tests for the WAR provisioning script (skills/war/assets/provision-worktrees.sh):
# the ensure-worktree existing-branch path (EB rows), the land-advance post-push
# readback (LA rows), and the remote-rejected retry (RR rows).
# The shared helpers live in provision-worktrees.test-lib.sh (its header
# describes the runner and the ownership seam). #2824 split the suite into
# three files so they run in parallel. Plain-bash assertion runner, bash 3.2
# safe, cwd-independent. Exit 0 = all cases passed.
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/provision-worktrees.test-lib.sh"

# ---------------------------------------------------------------------------
# #2493: ensure-worktree's existing-branch path. After the add, a branch that the
# integration tip already contains moves to the tip, unless the branch is a merged
# task's. Anything else stays where it is. All rows but EB.8 reach the path with no
# worktree registered, or with a stale registry entry. Row EB.8 pins the REUSE arm.
# ---------------------------------------------------------------------------
EB_INT=integration/eb/phase-1
EB_TASK=war/eb/p1-t1
EB_REAL_GIT="$(command -v git)"
EB_SHIM_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t warebshim)"
REPOS="$REPOS $EB_SHIM_DIR"
# The shim answers one Git verb the way EB_SHIM asks, and runs all else for real.
# Exit 128 is a Git error. Exit 1 from merge-base means "not an ancestor".
{
  printf '#!/bin/bash\n'
  printf 'case "${EB_SHIM:-} $*" in\n'
  printf '  "ancestor-fails merge-base --is-ancestor "*) exit 128 ;;\n'
  printf '  "merges-fail rev-list --first-parent --merges "*) exit 128 ;;\n'
  printf '  "show-fails show -s "*) exit 128 ;;\n'
  printf '  "rebase-fails "*" rebase "*) exit 1 ;;\n'
  printf '  "rebase-stops "*" rebase --abort"*) ;;\n'
  printf '  "rebase-stops "*" rebase "*)\n'
  printf '    exec "%s" -C "$2" rebase --onto "$EB_STOP_ONTO" "$EB_STOP_BASE" ;;\n' "$EB_REAL_GIT"
  printf 'esac\n'
  printf 'exec "%s" "$@"\n' "$EB_REAL_GIT"
} > "$EB_SHIM_DIR/git"
chmod +x "$EB_SHIM_DIR/git"

# eb_repo -> a fresh repo with the integration and task branches at the seed.
eb_repo() {
  ebr="$(new_repo)"
  git -C "$ebr" branch "$EB_INT" HEAD
  git -C "$ebr" branch "$EB_TASK" HEAD
  echo "$ebr"
}
# eb_commit <repo> <branch> <file> <text> -> commit on <branch>, echo its SHA.
eb_commit() {
  git -C "$1" checkout -q "$2"
  printf '%s\n' "$4" > "$1/$3"
  git -C "$1" add -A
  git -C "$1" commit -qm "$3 on $2"
  git -C "$1" rev-parse HEAD
  git -C "$1" checkout -q -
}
# eb_merge <repo> <branch> <trailer value, or empty> -> merge <branch> into the
# integration branch with --no-ff, the production shape. Echo the integration tip.
eb_merge() {
  git -C "$1" checkout -q "$EB_INT"
  if [ -n "$3" ]; then ebm="$(printf 'merge %s\n\nWAR-Task: %s\n' "$2" "$3")"; else ebm="merge $2"; fi
  git -C "$1" merge -q --no-ff -m "$ebm" "$2"
  git -C "$1" rev-parse HEAD
  git -C "$1" checkout -q -
}
# eb_contained <repo> -> one commit on the task branch that the integration tip
# contains, with a sibling commit above it. It sets EB_OLD and EB_TIP.
eb_contained() {
  EB_OLD="$(eb_commit "$1" "$EB_TASK" one.txt one)"
  git -C "$1" branch -f "$EB_INT" "$EB_OLD"
  EB_TIP="$(eb_commit "$1" "$EB_INT" sibling.txt sibling)"
}
# eb_run <repo> <wt> <tip>: run ensure-worktree. It sets EB_OUT, EB_ERR and EB_RC.
# EB_SHIM picks the shim. With EB_SHIM empty, no shim sits on PATH.
eb_run() {
  ebe="$(mktemp 2>/dev/null || mktemp -t warebe)"
  if [ -n "${EB_SHIM:-}" ]; then
    EB_OUT="$(cd "$1" && PATH="$EB_SHIM_DIR:$PATH" bash "$SCRIPT" ensure-worktree "$2" "$EB_TASK" "$3" 2>"$ebe")"
  else
    EB_OUT="$(cd "$1" && bash "$SCRIPT" ensure-worktree "$2" "$EB_TASK" "$3" 2>"$ebe")"
  fi
  EB_RC=$?
  EB_ERR="$(cat "$ebe")"
  rm -f "$ebe"
}
# eb_has <text> <fixed string> -> yes or no.
eb_has() {
  case "$1" in *"$2"*) echo yes ;; *) echo no ;; esac
}
# eb_clean <wt> -> clean, rebase-open or dirty. An open rebase counts as its own
# state, because porcelain alone can read clean there.
eb_clean() {
  ebs="$(git -C "$1" status --porcelain --ignore-submodules=none)"
  ebg="$(git -C "$1" rev-parse --git-path rebase-merge)"
  case "$ebg" in /*) ;; *) ebg="$1/$ebg" ;; esac
  if [ -e "$ebg" ]; then echo rebase-open
  elif [ -n "$ebs" ]; then echo dirty
  else echo clean; fi
}
export EB_SHIM=""

# EB.1: a branch the tip contains moves to the tip, and a plain push still works.
RE1="$(eb_repo)"
eb_contained "$RE1"
BARE_E1="$(new_wt_path)"
git init -q --bare "$BARE_E1"
git -C "$RE1" remote add origin "$BARE_E1"
git -C "$RE1" push -q origin "$EB_TASK"
WT_E1="$(new_wt_path)"
eb_run "$RE1" "$WT_E1" "$EB_TIP"
expect "EB.1: a contained branch exits 0" 0 "$EB_RC"
expect "EB.1: a contained branch moves to the tip" "$EB_TIP" "$(git -C "$RE1" rev-parse "$EB_TASK")"
expect "EB.1: the worktree sits on the branch at the tip" "$EB_TIP" "$(git -C "$WT_E1" rev-parse HEAD)"
expect "EB.1: the worktree stays on the branch" "$EB_TASK" "$(git -C "$WT_E1" symbolic-ref --short HEAD 2>/dev/null)"
expect "EB.1: the tree carries the sibling's file" "sibling" "$(cat "$WT_E1/sibling.txt" 2>/dev/null)"
expect "EB.1: stdout is exactly the worktree path" "$WT_E1" "$EB_OUT"
expect "EB.1: the marker file is present" "yes" "$([ -f "$WT_E1/.war-task" ] && echo yes || echo no)"
expect "EB.1: a hygiene marker names both SHAs" "yes" \
  "$(eb_has "$EB_ERR" "WORKTREE_HYGIENE path=$WT_E1 action=moved detail=from-$EB_OLD-to-$EB_TIP")"
git -C "$WT_E1" push -q origin "$EB_TASK" >/dev/null 2>&1
expect "EB.1: a plain push of the moved branch works" 0 "$?"

# EB.1b: the stale-registry route reaches the same path.
RE1B="$(eb_repo)"
SEED_E1B="$(git -C "$RE1B" rev-parse "$EB_INT")"
WT_E1B="$(new_wt_path)"
run_in "$RE1B" ensure-worktree "$WT_E1B" "$EB_TASK" "$SEED_E1B" >/dev/null
rm -rf "$WT_E1B"
TIP_E1B="$(eb_commit "$RE1B" "$EB_INT" sibling.txt sibling)"
eb_run "$RE1B" "$WT_E1B" "$TIP_E1B"
expect "EB.1b: a stale registry exits 0" 0 "$EB_RC"
expect "EB.1b: a stale registry also moves a contained branch" "$TIP_E1B" "$(git -C "$WT_E1B" rev-parse HEAD)"

# EB.2: no commits above the tip moves the branch to the tip.
RE2="$(eb_repo)"
TIP_E2="$(eb_commit "$RE2" "$EB_INT" sibling.txt sibling)"
WT_E2="$(new_wt_path)"
eb_run "$RE2" "$WT_E2" "$TIP_E2"
expect "EB.2: a branch behind the tip exits 0" 0 "$EB_RC"
expect "EB.2: a branch behind the tip moves to the tip" "$TIP_E2" "$(git -C "$WT_E2" rev-parse HEAD)"
expect "EB.2: stdout is exactly the worktree path" "$WT_E2" "$EB_OUT"

# EB.2b: a branch already at the tip stays, and says nothing.
RE2B="$(eb_repo)"
TIP_E2B="$(git -C "$RE2B" rev-parse "$EB_INT")"
WT_E2B="$(new_wt_path)"
eb_run "$RE2B" "$WT_E2B" "$TIP_E2B"
expect "EB.2b: a branch at the tip exits 0" 0 "$EB_RC"
expect "EB.2b: a branch at the tip stays there" "$TIP_E2B" "$(git -C "$WT_E2B" rev-parse HEAD)"
expect "EB.2b: a branch at the tip writes no warning" "" "$EB_ERR"

# EB.3: one unmerged commit keeps the branch at its old tip, with no warning.
RE3="$(eb_repo)"
eb_contained "$RE3"
SHA_E3="$(eb_commit "$RE3" "$EB_TASK" two.txt two)"
WT_E3="$(new_wt_path)"
eb_run "$RE3" "$WT_E3" "$EB_TIP"
expect "EB.3: an unmerged commit exits 0" 0 "$EB_RC"
expect "EB.3: an unmerged commit keeps the old tip" "$SHA_E3" "$(git -C "$WT_E3" rev-parse HEAD)"
expect "EB.3: stdout is exactly the worktree path" "$WT_E3" "$EB_OUT"
expect "EB.3: an unmerged commit writes no warning" "" "$EB_ERR"

# EB.3b: a copy of the commit upstream is not containment, so the branch stays.
RE3B="$(eb_repo)"
SHA_E3B="$(eb_commit "$RE3B" "$EB_TASK" one.txt one)"
eb_commit "$RE3B" "$EB_INT" sibling.txt sibling >/dev/null
git -C "$RE3B" checkout -q "$EB_INT"
git -C "$RE3B" cherry-pick "$SHA_E3B" >/dev/null 2>&1
TIP_E3B="$(git -C "$RE3B" rev-parse HEAD)"
git -C "$RE3B" checkout -q -
WT_E3B="$(new_wt_path)"
eb_run "$RE3B" "$WT_E3B" "$TIP_E3B"
expect "EB.3b: a copied commit keeps the old tip" "$SHA_E3B" "$(git -C "$WT_E3B" rev-parse HEAD)"
expect "EB.3b: a copied commit writes no warning" "" "$EB_ERR"

# EB.4: a branch holding a merge commit the tip does not contain stays. The reason
# is containment, as in EB.3. The merge commit itself plays no part.
RE4="$(eb_repo)"
git -C "$RE4" branch eb-side "$EB_TASK"
eb_commit "$RE4" eb-side side.txt side >/dev/null
eb_commit "$RE4" "$EB_TASK" one.txt one >/dev/null
git -C "$RE4" checkout -q "$EB_TASK"
git -C "$RE4" merge -q --no-ff -m "merge side" eb-side
MERGE_E4="$(git -C "$RE4" rev-parse HEAD)"
git -C "$RE4" checkout -q -
TIP_E4="$(eb_commit "$RE4" "$EB_INT" sibling.txt sibling)"
WT_E4="$(new_wt_path)"
eb_run "$RE4" "$WT_E4" "$TIP_E4"
expect "EB.4: a merge commit exits 0" 0 "$EB_RC"
expect "EB.4: a branch the tip does not contain keeps the old tip" "$MERGE_E4" "$(git -C "$WT_E4" rev-parse HEAD)"

# EB.4b: a sibling's merge on the integration side does not stop the move.
RE4B="$(eb_repo)"
git -C "$RE4B" branch eb-sibling "$EB_TASK"
eb_commit "$RE4B" eb-sibling sibling.txt sibling >/dev/null
TIP_E4B="$(eb_merge "$RE4B" eb-sibling war/eb/p1-t2)"
WT_E4B="$(new_wt_path)"
eb_run "$RE4B" "$WT_E4B" "$TIP_E4B"
expect "EB.4b: a sibling's merge still moves the branch" "$TIP_E4B" "$(git -C "$WT_E4B" rev-parse HEAD)"

# EB.4c: a merged task's branch stays at its tip, so the merge proof and the
# Ace-Charge read still match it.
RE4C="$(eb_repo)"
git -C "$RE4C" checkout -q "$EB_TASK"
printf 'charged\n' > "$RE4C/one.txt"
git -C "$RE4C" add -A
git -C "$RE4C" commit -qm "$(printf 'ace fix\n\nAce-Charge: t1:3\n')"
SHA_E4C="$(git -C "$RE4C" rev-parse HEAD)"
git -C "$RE4C" checkout -q -
eb_merge "$RE4C" "$EB_TASK" "$EB_TASK" >/dev/null
TIP_E4C="$(eb_commit "$RE4C" "$EB_INT" later.txt later)"
WT_E4C="$(new_wt_path)"
eb_run "$RE4C" "$WT_E4C" "$TIP_E4C"
expect "EB.4c: a merged branch exits 0" 0 "$EB_RC"
expect "EB.4c: a merged branch keeps its tip" "$SHA_E4C" "$(git -C "$WT_E4C" rev-parse HEAD)"
expect "EB.4c: a merged branch writes no warning" "" "$EB_ERR"
# Read the branch first, as the barrier does. A moved branch gives an empty list.
REF_E4C="$(git -C "$RE4C" rev-parse "$EB_TASK")"
MERGE_E4C="$(git -C "$RE4C" rev-list --first-parent --merges "$REF_E4C..$EB_INT")"
expect "EB.4c: the barrier's M^2 match still finds the tip" "$REF_E4C" \
  "$(git -C "$WT_E4C" rev-parse "$MERGE_E4C^2" 2>/dev/null)"
expect "EB.4c: the charge stays readable" "t1:3" \
  "$(git -C "$WT_E4C" log --format='%(trailers:key=Ace-Charge,valueonly)' "$MERGE_E4C^1..$MERGE_E4C^2" 2>/dev/null | tr -d '\n')"
WORK_E4C="$(git -C "$RE4C" symbolic-ref --short HEAD)"
( cd "$RE4C" && bash "$HERE/task-integrated.sh" "$EB_TASK" "$EB_INT" "$WORK_E4C" ) >/dev/null 2>&1
expect "EB.4c: task-integrated.sh still proves the merge" 0 "$?"

# EB.4f: a sibling's merge above the task's own merge does not hide the proof.
RE4F="$(eb_repo)"
SHA_E4F="$(eb_commit "$RE4F" "$EB_TASK" one.txt one)"
git -C "$RE4F" branch eb-sibling "$(git -C "$RE4F" rev-parse "$EB_INT")"
eb_commit "$RE4F" eb-sibling sibling.txt sibling >/dev/null
eb_merge "$RE4F" "$EB_TASK" "$EB_TASK" >/dev/null
TIP_E4F="$(eb_merge "$RE4F" eb-sibling war/eb/p1-t2)"
WT_E4F="$(new_wt_path)"
eb_run "$RE4F" "$WT_E4F" "$TIP_E4F"
expect "EB.4f: the task's merge below a sibling's still keeps the branch" "$SHA_E4F" "$(git -C "$WT_E4F" rev-parse HEAD)"

# EB.4g: a matching merge off the first-parent chain is no proof, so the branch
# moves. The engine's own task merges sit on the first-parent chain.
RE4G="$(eb_repo)"
eb_commit "$RE4G" "$EB_TASK" one.txt one >/dev/null
git -C "$RE4G" branch eb-side "$EB_INT"
git -C "$RE4G" checkout -q eb-side
git -C "$RE4G" merge -q --no-ff -m "$(printf 'side merge\n\nWAR-Task: %s\n' "$EB_TASK")" "$EB_TASK"
git -C "$RE4G" checkout -q -
eb_commit "$RE4G" "$EB_INT" sibling.txt sibling >/dev/null
TIP_E4G="$(eb_merge "$RE4G" eb-side "")"
WT_E4G="$(new_wt_path)"
eb_run "$RE4G" "$WT_E4G" "$TIP_E4G"
expect "EB.4g: a merge off the first-parent chain does not keep the branch" "$TIP_E4G" "$(git -C "$WT_E4G" rev-parse HEAD)"

# EB.4d: a merge that names another branch is no proof, so the branch moves.
RE4D="$(eb_repo)"
eb_commit "$RE4D" "$EB_TASK" one.txt one >/dev/null
eb_commit "$RE4D" "$EB_INT" sibling.txt sibling >/dev/null
TIP_E4D="$(eb_merge "$RE4D" "$EB_TASK" war/eb/p1-t2)"
WT_E4D="$(new_wt_path)"
eb_run "$RE4D" "$WT_E4D" "$TIP_E4D"
expect "EB.4d: another task's merge commit does not keep the branch" "$TIP_E4D" "$(git -C "$WT_E4D" rev-parse HEAD)"

# EB.4e: a merge with the task's trailer proves nothing if its second parent is
# another commit, so the branch moves.
RE4E="$(eb_repo)"
git -C "$RE4E" branch eb-later "$EB_TASK"
eb_commit "$RE4E" eb-later later.txt later >/dev/null
eb_commit "$RE4E" "$EB_INT" sibling.txt sibling >/dev/null
TIP_E4E="$(eb_merge "$RE4E" eb-later "$EB_TASK")"
WT_E4E="$(new_wt_path)"
eb_run "$RE4E" "$WT_E4E" "$TIP_E4E"
expect "EB.4e: a merge of another commit does not keep the branch" "$TIP_E4E" "$(git -C "$WT_E4E" rev-parse HEAD)"

# EB.5: a Git error in the check reuses the branch and warns. Each fixture holds a
# merge above the branch, so each read runs.
eb_error_row() { # <label> <shim mode, or none> <tip override, or empty> <warn text> <detail>
  ebrp="$(eb_repo)"
  git -C "$ebrp" branch eb-sibling "$EB_TASK"
  eb_commit "$ebrp" eb-sibling sibling.txt sibling >/dev/null
  ebsha="$(git -C "$ebrp" rev-parse "$EB_TASK")"
  ebtip="$(eb_merge "$ebrp" eb-sibling "")"
  [ -z "$3" ] || ebtip="$3"
  ebwt="$(new_wt_path)"
  if [ "$2" = none ]; then EB_SHIM=""; else EB_SHIM="$2"; fi
  eb_run "$ebrp" "$ebwt" "$ebtip"
  EB_SHIM=""
  expect "EB.5 $1: exits 0" 0 "$EB_RC"
  expect "EB.5 $1: keeps the old tip" "$ebsha" "$(git -C "$ebwt" rev-parse HEAD)"
  expect "EB.5 $1: stdout is exactly the worktree path" "$ebwt" "$EB_OUT"
  expect "EB.5 $1: warns with its own reason" "yes" "$(eb_has "$EB_ERR" "$4")"
  expect "EB.5 $1: emits its marker" "yes" \
    "$(eb_has "$EB_ERR" "WORKTREE_HYGIENE path=$ebwt action=detected detail=catch-up-$5")"
  expect "EB.5 $1: the marker file is present" "yes" "$([ -f "$ebwt/.war-task" ] && echo yes || echo no)"
}
eb_error_row "ancestry fails" ancestor-fails "" "could not compare" compare-failed
eb_error_row "merge list fails" merges-fail "" "could not read the merges" merge-read-failed
eb_error_row "merge owner fails" show-fails "" "could not read merge" merge-read-failed
eb_error_row "tip unreadable" none "0000000000000000000000000000000000000abc" "could not read '" unreadable-ref

# EB.6: a failed rebase aborts and stays. The shim points the rebase at a commit
# that conflicts, so a real rebase stops open and the abort has work to do.
RE6="$(eb_repo)"
SEED_E6="$(git -C "$RE6" rev-parse "$EB_TASK")"
git -C "$RE6" branch eb-conflict "$SEED_E6"
ONTO_E6="$(eb_commit "$RE6" eb-conflict seed.txt other-side)"
SHA_E6="$(eb_commit "$RE6" "$EB_TASK" seed.txt task-side)"
git -C "$RE6" branch -f "$EB_INT" "$SHA_E6"
TIP_E6="$(eb_commit "$RE6" "$EB_INT" sibling.txt sibling)"
WT_E6="$(new_wt_path)"
export EB_STOP_ONTO="$ONTO_E6" EB_STOP_BASE="$SEED_E6"
EB_SHIM=rebase-stops
eb_run "$RE6" "$WT_E6" "$TIP_E6"
EB_SHIM=""
expect "EB.6: a failed rebase exits 0" 0 "$EB_RC"
expect "EB.6: a failed rebase keeps the old tip" "$SHA_E6" "$(git -C "$WT_E6" rev-parse HEAD)"
expect "EB.6: the branch ref keeps the old tip" "$SHA_E6" "$(git -C "$RE6" rev-parse "$EB_TASK")"
expect "EB.6: the worktree stays on the branch" "$EB_TASK" "$(git -C "$WT_E6" symbolic-ref --short HEAD 2>/dev/null)"
expect "EB.6: the worktree stays clean" "clean" "$(eb_clean "$WT_E6")"
expect "EB.6: stdout is exactly the worktree path" "$WT_E6" "$EB_OUT"
expect "EB.6: warns with its own reason" "yes" "$(eb_has "$EB_ERR" "onto $TIP_E6 failed")"
expect "EB.6: emits its marker" "yes" "$(eb_has "$EB_ERR" "action=detected detail=catch-up-rebase-failed")"

# EB.6b: a rebase that fails before it starts leaves nothing to abort.
RE6B="$(eb_repo)"
eb_contained "$RE6B"
WT_E6B="$(new_wt_path)"
EB_SHIM=rebase-fails
eb_run "$RE6B" "$WT_E6B" "$EB_TIP"
EB_SHIM=""
expect "EB.6b: exits 0 with nothing to abort" 0 "$EB_RC"
expect "EB.6b: keeps the old tip" "$EB_OLD" "$(git -C "$WT_E6B" rev-parse HEAD)"
expect "EB.6b: stdout is exactly the worktree path" "$WT_E6B" "$EB_OUT"
expect "EB.6b: warns with its own reason" "yes" "$(eb_has "$EB_ERR" "onto $EB_TIP failed")"

# EB.7: the rebase runs no repository hook.
RE7="$(eb_repo)"
eb_contained "$RE7"
HOOK_E7="$(git -C "$RE7" rev-parse --absolute-git-dir)/hooks/pre-rebase"
mkdir -p "$(dirname "$HOOK_E7")"
printf '#!/bin/sh\nexit 1\n' > "$HOOK_E7"
chmod +x "$HOOK_E7"
WT_E7="$(new_wt_path)"
eb_run "$RE7" "$WT_E7" "$EB_TIP"
expect "EB.7: a failing pre-rebase hook does not stop the move" "$EB_TIP" "$(git -C "$WT_E7" rev-parse HEAD)"

# EB.8: a registered present worktree stays untouched, even when it could move.
RE8="$(eb_repo)"
TIP_E8A="$(git -C "$RE8" rev-parse "$EB_INT")"
WT_E8="$(new_wt_path)"
eb_run "$RE8" "$WT_E8" "$TIP_E8A"
TIP_E8B="$(eb_commit "$RE8" "$EB_INT" sibling.txt sibling)"
eb_run "$RE8" "$WT_E8" "$TIP_E8B"
expect "EB.8: the REUSE arm exits 0" 0 "$EB_RC"
expect "EB.8: a registered present worktree keeps its tip" "$TIP_E8A" "$(git -C "$WT_E8" rev-parse HEAD)"
expect "EB.8: the REUSE arm writes no warning" "" "$EB_ERR"

# EB.9: a branch ahead of the tip stays, and says nothing.
RE9="$(eb_repo)"
SHA_E9="$(eb_commit "$RE9" "$EB_TASK" one.txt one)"
TIP_E9="$(git -C "$RE9" rev-parse "$EB_INT")"
WT_E9="$(new_wt_path)"
eb_run "$RE9" "$WT_E9" "$TIP_E9"
expect "EB.9: a branch ahead of the tip keeps its tip" "$SHA_E9" "$(git -C "$WT_E9" rev-parse HEAD)"
expect "EB.9: a branch ahead of the tip writes no warning" "" "$EB_ERR"

# ---------------------------------------------------------------------------
# #1837 item 1: land-advance's post-push readback. The lagging-ls-remote fixture
# is a git wrapper first on PATH. It passes each verb to real Git and lets the
# pre-push ls-remote through, because a push marker gates it. After the push,
# LA_SHIM sets what ls-remote answers. A sleep stub records its argument, so the
# rows run at full speed and pin the 2 second wait.
#   lag-once    the stale tip once, then the real answer
#   lag-always  the stale tip on each read
#   fail-once   a Git failure once, then the real answer
#   fail-always a Git failure on each read
#   empty       no row on each read
#   (unset)     the real answer
# ---------------------------------------------------------------------------
LA_REAL_GIT="$(command -v git)"
LA_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t warlashim)"
REPOS="$REPOS $LA_DIR"
cat > "$LA_DIR/git" <<'LASHIM'
#!/bin/bash
case "${1:-}" in
  push)
    "$LA_REAL_GIT" "$@"
    rc=$?
    : > "$LA_DIR/pushed"
    exit "$rc"
    ;;
  ls-remote)
    if [ -e "$LA_DIR/pushed" ]; then
      printf 'x' >> "$LA_DIR/reads"
      reads="$(wc -c < "$LA_DIR/reads" | tr -d ' ')"
      case "${LA_SHIM:-}:$reads" in
        lag-once:1 | lag-always:*)
          printf '%s\t%s\n' "$LA_STALE" "$3"
          exit 0
          ;;
        fail-once:1 | fail-always:*)
          printf 'fatal: the remote end hung up\n' >&2
          exit 128
          ;;
        empty:*) exit 0 ;;
      esac
    fi
    ;;
esac
exec "$LA_REAL_GIT" "$@"
LASHIM
# The stub also records the reads so far, so a row sees the wait fall between two reads.
printf '#!/bin/bash\nprintf "%%s after %%s\\n" "$1" "$(wc -c < "$LA_DIR/reads" | tr -d " ")" >> "$LA_DIR/sleeps"\n' > "$LA_DIR/sleep"
chmod +x "$LA_DIR/git" "$LA_DIR/sleep"

la_has() {
  case "$1" in *"$2"*) echo yes ;; *) echo no ;; esac
}

# la_fixture <branch>: seed <branch>, then detach clone1 at a new commit.
la_fixture() {
  LA_PAIR="$(setup_origin_pair)"
  LA_C1="$(printf '%s' "$LA_PAIR" | cut -d' ' -f1)"
  LA_C2="$(printf '%s' "$LA_PAIR" | cut -d' ' -f2)"
  LA_SEED="$(seed_working_branch "$LA_C1" "$LA_C2" "$1")"
  printf '%s\n' "$1" > "$LA_C1/la.txt"
  git -C "$LA_C1" add -A
  git -C "$LA_C1" commit -qm "new sha for $1"
  LA_NEW="$(git -C "$LA_C1" rev-parse HEAD)"
  git -C "$LA_C1" checkout -q --detach "$LA_NEW"
}

# la_run <mode> <branch> <new-sha>: sets LA_RC, LA_ERR, LA_READS and LA_SLEEPS.
la_run() {
  rm -f "$LA_DIR/pushed" "$LA_DIR/reads" "$LA_DIR/sleeps"
  LA_RC=0
  LA_ERR="$( ( cd "$LA_C1" && LA_SHIM="$1" LA_STALE="$LA_SEED" LA_REAL_GIT="$LA_REAL_GIT" LA_DIR="$LA_DIR" \
    PATH="$LA_DIR:$PATH" bash "$SCRIPT" land-advance "$2" "$3" ) 2>&1 >/dev/null )" || LA_RC=$?
  LA_READS=0
  [ -e "$LA_DIR/reads" ] && LA_READS="$(wc -c < "$LA_DIR/reads" | tr -d ' ')"
  LA_SLEEPS=""
  [ -e "$LA_DIR/sleeps" ] && LA_SLEEPS="$(cat "$LA_DIR/sleeps")"
  return 0
}

la_follower() { git -C "$LA_C1" rev-parse "refs/heads/$1"; }
la_origin() { git -C "$LA_C1" ls-remote origin "refs/heads/$1" | cut -f1; }

# LA.1: a lag that clears on the second read lands.
la_fixture working/la1
la_run lag-once working/la1 "$LA_NEW"
expect "LA.1 lagging-ls-remote: a lag that clears exits 0" 0 "$LA_RC"
expect "LA.1 lagging-ls-remote: the follower advances" "$LA_NEW" "$(la_follower working/la1)"
expect "LA.1 lagging-ls-remote: the readback runs twice" 2 "$LA_READS"
expect "LA.1 lagging-ls-remote: the wait is 2 seconds, after the first read" "2 after 1" "$LA_SLEEPS"
expect "LA.1 lagging-ls-remote: a land that clears says nothing" "" "$LA_ERR"

# LA.2: a lag that stays dies loud, and the follower stays.
la_fixture working/la2
la_run lag-always working/la2 "$LA_NEW"
expect "LA.2 lagging-ls-remote: a lag that stays exits 3" 3 "$LA_RC"
expect "LA.2 lagging-ls-remote: the die names actual" yes "$(la_has "$LA_ERR" "$LA_SEED")"
expect "LA.2 lagging-ls-remote: the die names new_sha" yes "$(la_has "$LA_ERR" "$LA_NEW")"
expect "LA.2 lagging-ls-remote: the die gives the reconcile hint" yes "$(la_has "$LA_ERR" "sync-follower working/la2")"
expect "LA.2 lagging-ls-remote: the die says the push exited 0" yes "$(la_has "$LA_ERR" "push exited 0")"
expect "LA.2 lagging-ls-remote: the follower stays" "$LA_SEED" "$(la_follower working/la2)"
expect "LA.2 lagging-ls-remote: the readback stops after two reads" 2 "$LA_READS"
expect "LA.2 lagging-ls-remote: the wait is 2 seconds, after the first read" "2 after 1" "$LA_SLEEPS"

# LA.3: a failed ls-remote is a mismatch, on either read.
la_fixture working/la3
la_run fail-always working/la3 "$LA_NEW"
expect "LA.3 lagging-ls-remote: two failed reads exit 3, not Git's code" 3 "$LA_RC"
expect "LA.3 lagging-ls-remote: the die names new_sha" yes "$(la_has "$LA_ERR" "$LA_NEW")"
expect "LA.3 lagging-ls-remote: the die gives the reconcile hint" yes "$(la_has "$LA_ERR" "sync-follower working/la3")"
expect "LA.3 lagging-ls-remote: the follower stays" "$LA_SEED" "$(la_follower working/la3)"
expect "LA.3 lagging-ls-remote: both reads ran" 2 "$LA_READS"
expect "LA.3 lagging-ls-remote: the wait is 2 seconds, after the first read" "2 after 1" "$LA_SLEEPS"

la_fixture working/la3b
la_run fail-once working/la3b "$LA_NEW"
expect "LA.3b lagging-ls-remote: a failed first read that clears exits 0" 0 "$LA_RC"
expect "LA.3b lagging-ls-remote: the follower advances" "$LA_NEW" "$(la_follower working/la3b)"

la_fixture working/la3c
la_run empty working/la3c "$LA_NEW"
expect "LA.3c lagging-ls-remote: an empty read on both tries exits 3" 3 "$LA_RC"
expect "LA.3c lagging-ls-remote: the die gives the reconcile hint" yes "$(la_has "$LA_ERR" "sync-follower working/la3c")"
expect "LA.3c lagging-ls-remote: the wait is 2 seconds, after the first read" "2 after 1" "$LA_SLEEPS"
expect "LA.3c lagging-ls-remote: the die says no tip was read" yes "$(la_has "$LA_ERR" "no tip, or the read failed")"
expect "LA.3c lagging-ls-remote: the follower stays" "$LA_SEED" "$(la_follower working/la3c)"

# LA.4: the control. A clean land reads once and never waits.
la_fixture working/la4
la_run "" working/la4 "$LA_NEW"
expect "LA.4 lagging-ls-remote control: a clean land exits 0" 0 "$LA_RC"
expect "LA.4 lagging-ls-remote control: the follower advances" "$LA_NEW" "$(la_follower working/la4)"
expect "LA.4 lagging-ls-remote control: one readback" 1 "$LA_READS"
expect "LA.4 lagging-ls-remote control: no wait" "" "$LA_SLEEPS"

# LA.5: a short <new-sha> lands. The readback compares two full SHAs.
la_fixture working/la5
la_run "" working/la5 "$(printf '%.8s' "$LA_NEW")"
expect "LA.5: a short new_sha exits 0" 0 "$LA_RC"
expect "LA.5: the follower advances to the full SHA" "$LA_NEW" "$(la_follower working/la5)"
expect "LA.5: origin holds the full SHA" "$LA_NEW" "$(la_origin working/la5)"
expect "LA.5: a short new_sha reads origin once" 1 "$LA_READS"

# LA.6: a short <new-sha> cannot slip past the phantom guard.
la_fixture working/la6
git -C "$LA_C1" push -q origin "HEAD:refs/heads/working/la6"
git -C "$LA_C1" update-ref refs/heads/working/la6 "$LA_NEW"
la_run "" working/la6 "$(printf '%.8s' "$LA_NEW")"
expect "LA.6: a short phantom exits 3" 3 "$LA_RC"
expect "LA.6: a short phantom names the phantom route" yes "$(la_has "$LA_ERR" "equals the pre-push origin tip")"
expect "LA.6: a short phantom runs no push" no "$(la_has "$(ls "$LA_DIR")" pushed)"

# LA.7: a short <new-sha> reads an already-landed origin as landed.
la_fixture working/la7
git -C "$LA_C1" push -q origin "HEAD:refs/heads/working/la7"
la_run "" working/la7 "$(printf '%.8s' "$LA_NEW")"
expect "LA.7: a short already-landed call exits 0" 0 "$LA_RC"
expect "LA.7: the follower reconciles to origin" "$LA_NEW" "$(la_follower working/la7)"
expect "LA.7: a short already-landed call runs no push" no "$(la_has "$(ls "$LA_DIR")" pushed)"

# ---------------------------------------------------------------------------
# #2626: land-advance retries a server-side "[remote rejected]" push while
# origin has not moved. The remote-rejected fixture is a git wrapper first on
# PATH. It counts each push, and RR_SHIM picks what a push answers. The pre-push
# ls-remote passes through, because a push marker gates the ls-remote arms. The
# LA sleep stub records each wait, so no row really sleeps.
#   rr-once     the first push is a [remote rejected], later pushes are real
#   rr-thrice   the first three pushes are a [remote rejected], the fourth is real
#   rr-always   each push is a [remote rejected]
#   rejected    each push is a plain [rejected]
#   rr-moved    each push is a [remote rejected], and origin then reads a new tip
#   rr-readfail each push is a [remote rejected], and the origin read then fails
#   rr-landed   each push is a [remote rejected], and origin then reads new_sha
#   rr-then-rejected the first push is a [remote rejected], later pushes are [rejected]
#   rr-moved-later   each push is a [remote rejected], and origin reads a new tip from the second read
#   rr-readfail-later each push is a [remote rejected], and the origin read fails from the second read
#   other       each push fails with an unrelated error (no rejection token)
#   rr-then-other the first push is a [remote rejected], later pushes fail unrelated
# ---------------------------------------------------------------------------
RR_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t warrrshim)"
REPOS="$REPOS $RR_DIR"
cat > "$RR_DIR/git" <<'RRSHIM'
#!/bin/bash
case "${1:-}" in
  push)
    printf 'x' >> "$RR_DIR/pushes"
    pushes="$(wc -c < "$RR_DIR/pushes" | tr -d ' ')"
    : > "$RR_DIR/pushed"
    case "${RR_SHIM:-}:$pushes" in
      rr-once:1 | rr-thrice:1 | rr-thrice:2 | rr-thrice:3 | rr-always:* | rr-moved:* | rr-readfail:* | rr-landed:* | rr-then-rejected:1 | rr-then-other:1 | rr-moved-later:* | rr-readfail-later:*)
        printf 'remote: fatal error in commit_refs_rules\nTo origin\n ! [remote rejected]   %s (fatal error in commit_refs_rules)\nerror: failed to push some refs to origin\n' "$3" >&2
        exit 1
        ;;
      other:* | rr-then-other:*)
        printf 'fatal: unable to access origin\n' >&2
        exit 128
        ;;
      rejected:* | rr-then-rejected:*)
        printf 'To origin\n ! [rejected]        %s (fetch first)\nerror: failed to push some refs to origin\n' "$3" >&2
        exit 1
        ;;
    esac
    ;;
  ls-remote)
    if [ -e "$RR_DIR/pushed" ]; then
      printf 'x' >> "$RR_DIR/reads"
      reads="$(wc -c < "$RR_DIR/reads" | tr -d ' ')"
      case "${RR_SHIM:-}:$reads" in
        rr-moved-later:1 | rr-readfail-later:1) ;;
        rr-moved-later:*)
          printf '%s\t%s\n' "$RR_OTHER" "$3"
          exit 0
          ;;
        rr-readfail-later:*)
          printf 'fatal: the remote end hung up\n' >&2
          exit 128
          ;;
      esac
      case "${RR_SHIM:-}" in
        rr-moved)
          printf '%s\t%s\n' "$RR_OTHER" "$3"
          exit 0
          ;;
        rr-landed)
          printf '%s\t%s\n' "$RR_LANDED" "$3"
          exit 0
          ;;
        rr-readfail)
          printf 'fatal: the remote end hung up\n' >&2
          exit 128
          ;;
      esac
    fi
    ;;
esac
exec "$RR_REAL_GIT" "$@"
RRSHIM
printf '#!/bin/bash\nprintf "%%s " "$1" >> "$RR_DIR/sleeps"\n' > "$RR_DIR/sleep"
chmod +x "$RR_DIR/git" "$RR_DIR/sleep"

# rr_run <mode> <branch> <new-sha>: sets RR_RC, RR_ERR, RR_PUSHES and RR_SLEEPS.
rr_run() {
  rm -f "$RR_DIR/pushed" "$RR_DIR/pushes" "$RR_DIR/sleeps" "$RR_DIR/reads"
  RR_RC=0
  RR_ERR="$( ( cd "$LA_C1" && RR_SHIM="$1" RR_OTHER=1111111111111111111111111111111111111111 RR_LANDED="$LA_NEW" RR_REAL_GIT="$LA_REAL_GIT" RR_DIR="$RR_DIR" \
    PATH="$RR_DIR:$PATH" bash "$SCRIPT" land-advance "$2" "$3" ) 2>&1 >/dev/null )" || RR_RC=$?
  RR_PUSHES=0
  [ -e "$RR_DIR/pushes" ] && RR_PUSHES="$(wc -c < "$RR_DIR/pushes" | tr -d ' ')"
  RR_SLEEPS=""
  [ -e "$RR_DIR/sleeps" ] && RR_SLEEPS="$(cat "$RR_DIR/sleeps")"
  return 0
}

# RR.1: one server-side rejection, then a retry lands.
la_fixture working/rr1
rr_run rr-once working/rr1 "$LA_NEW"
expect "RR.1 remote-rejected: a retry that lands exits 0" 0 "$RR_RC"
expect "RR.1 remote-rejected: the follower advances" "$LA_NEW" "$(la_follower working/rr1)"
expect "RR.1 remote-rejected: origin holds new_sha" "$LA_NEW" "$(la_origin working/rr1)"
expect "RR.1 remote-rejected: two pushes" 2 "$RR_PUSHES"
expect "RR.1 remote-rejected: one 10 second wait" "10 " "$RR_SLEEPS"

# RR.2: a rejection on every push spends 3 retries, then dies loud.
la_fixture working/rr2
rr_run rr-always working/rr2 "$LA_NEW"
expect "RR.2 remote-rejected: spent retries exit 3" 3 "$RR_RC"
expect "RR.2 remote-rejected: the follower stays" "$LA_SEED" "$(la_follower working/rr2)"
expect "RR.2 remote-rejected: origin stays" "$LA_SEED" "$(la_origin working/rr2)"
expect "RR.2 remote-rejected: one push plus 3 retries" 4 "$RR_PUSHES"
expect "RR.2 remote-rejected: the waits are 10, 20 and 40 seconds" "10 20 40 " "$RR_SLEEPS"
expect "RR.2 remote-rejected: the die carries the push output" yes "$(la_has "$RR_ERR" "[remote rejected]")"
expect "RR.2 remote-rejected: the die names the retries" yes "$(la_has "$RR_ERR" "after 3 retries")"

# RR.3: a plain [rejected] is a lost CAS. It exits 2 at once, with no retry.
la_fixture working/rr3
rr_run rejected working/rr3 "$LA_NEW"
expect "RR.3 rejected: a lost CAS exits 2" 2 "$RR_RC"
expect "RR.3 rejected: one push" 1 "$RR_PUSHES"
expect "RR.3 rejected: no wait" "" "$RR_SLEEPS"
expect "RR.3 rejected: the follower stays" "$LA_SEED" "$(la_follower working/rr3)"

# RR.4: if origin moved after the rejection, no retry runs.
la_fixture working/rr4
rr_run rr-moved working/rr4 "$LA_NEW"
expect "RR.4 remote-rejected: a moved origin exits 3" 3 "$RR_RC"
expect "RR.4 remote-rejected: one push" 1 "$RR_PUSHES"
expect "RR.4 remote-rejected: no wait" "" "$RR_SLEEPS"
expect "RR.4 remote-rejected: the follower stays" "$LA_SEED" "$(la_follower working/rr4)"
expect "RR.4 remote-rejected: the die names no retry" yes "$(la_has "$RR_ERR" "after 0 retries")"

# RR.5: if the origin read fails after the rejection, no retry runs.
la_fixture working/rr5
rr_run rr-readfail working/rr5 "$LA_NEW"
expect "RR.5 remote-rejected: a failed origin read exits 3, not Git's code" 3 "$RR_RC"
expect "RR.5 remote-rejected: one push" 1 "$RR_PUSHES"
expect "RR.5 remote-rejected: no wait" "" "$RR_SLEEPS"
expect "RR.5 remote-rejected: the follower stays" "$LA_SEED" "$(la_follower working/rr5)"
expect "RR.5 remote-rejected: the die names no retry" yes "$(la_has "$RR_ERR" "after 0 retries")"

# RR.6: a first land (no branch on origin yet) retries too. The empty origin
# read equals the empty pre-push read, so nothing moved.
LA_PAIR="$(setup_origin_pair)"
LA_C1="$(printf '%s' "$LA_PAIR" | cut -d' ' -f1)"
printf 'rr6\n' > "$LA_C1/la.txt"
git -C "$LA_C1" add -A
git -C "$LA_C1" commit -qm "new sha for working/rr6"
LA_NEW="$(git -C "$LA_C1" rev-parse HEAD)"
git -C "$LA_C1" checkout -q --detach "$LA_NEW"
expect "RR.6 fixture: origin has no working/rr6 before the land" "" "$(la_origin working/rr6)"
rr_run rr-once working/rr6 "$LA_NEW"
expect "RR.6 remote-rejected first land: a retry that lands exits 0" 0 "$RR_RC"
expect "RR.6 remote-rejected first land: origin holds new_sha" "$LA_NEW" "$(la_origin working/rr6)"
expect "RR.6 remote-rejected first land: the follower is created at new_sha" "$LA_NEW" "$(la_follower working/rr6)"
expect "RR.6 remote-rejected first land: two pushes" 2 "$RR_PUSHES"
expect "RR.6 remote-rejected first land: one 10 second wait" "10 " "$RR_SLEEPS"

# RR.7: a first land whose origin read fails after the rejection runs no retry.
# A failed read prints nothing, which equals the empty pre-push read, so only the
# read's own exit code can stop the retry here. RR.5 cannot see that, because its
# pre-push read is not empty.
LA_PAIR="$(setup_origin_pair)"
LA_C1="$(printf '%s' "$LA_PAIR" | cut -d' ' -f1)"
printf 'rr7\n' > "$LA_C1/la.txt"
git -C "$LA_C1" add -A
git -C "$LA_C1" commit -qm "new sha for working/rr7"
LA_NEW="$(git -C "$LA_C1" rev-parse HEAD)"
git -C "$LA_C1" checkout -q --detach "$LA_NEW"
rr_run rr-readfail working/rr7 "$LA_NEW"
expect "RR.7 remote-rejected first land: a failed origin read exits 3" 3 "$RR_RC"
expect "RR.7 remote-rejected first land: one push" 1 "$RR_PUSHES"
expect "RR.7 remote-rejected first land: no wait" "" "$RR_SLEEPS"
expect "RR.7 remote-rejected first land: no follower ref is created" no \
  "$(git -C "$LA_C1" show-ref --verify --quiet refs/heads/working/rr7 && echo yes || echo no)"
expect "RR.7 remote-rejected first land: origin still has no branch" "" "$(la_origin working/rr7)"

# RR.8: origin moves between the fresh read and the retry push. The retry gets a
# plain [rejected], which is a lost CAS: exit 2, never a further retry.
la_fixture working/rr8
rr_run rr-then-rejected working/rr8 "$LA_NEW"
expect "RR.8 remote-rejected then rejected: a lost CAS on the retry exits 2" 2 "$RR_RC"
expect "RR.8 remote-rejected then rejected: two pushes" 2 "$RR_PUSHES"
expect "RR.8 remote-rejected then rejected: one 10 second wait" "10 " "$RR_SLEEPS"
expect "RR.8 remote-rejected then rejected: the follower stays" "$LA_SEED" "$(la_follower working/rr8)"

# RR.9: the server applied the push but still printed [remote rejected], so origin
# reads new_sha. That is a moved origin: exit 3 with no retry and the follower
# unmoved. The Lead's Land-advance die probe then records the land (ADR 0023).
la_fixture working/rr9
rr_run rr-landed working/rr9 "$LA_NEW"
expect "RR.9 remote-rejected but applied: exits 3" 3 "$RR_RC"
expect "RR.9 remote-rejected but applied: one push" 1 "$RR_PUSHES"
expect "RR.9 remote-rejected but applied: no wait" "" "$RR_SLEEPS"
expect "RR.9 remote-rejected but applied: the die names no retry" yes "$(la_has "$RR_ERR" "after 0 retries")"
expect "RR.9 remote-rejected but applied: the follower stays" "$LA_SEED" "$(la_follower working/rr9)"

# RR.10: an unrelated push error (network, permission) is never retried.
la_fixture working/rr10
rr_run other working/rr10 "$LA_NEW"
expect "RR.10 unrelated push error: exits 3" 3 "$RR_RC"
expect "RR.10 unrelated push error: one push" 1 "$RR_PUSHES"
expect "RR.10 unrelated push error: no wait" "" "$RR_SLEEPS"
expect "RR.10 unrelated push error: the die names no retry" yes "$(la_has "$RR_ERR" "after 0 retries")"
expect "RR.10 unrelated push error: the follower stays" "$LA_SEED" "$(la_follower working/rr10)"

# RR.11: an unrelated error on a retry stops the loop at once.
la_fixture working/rr11
rr_run rr-then-other working/rr11 "$LA_NEW"
expect "RR.11 remote-rejected then unrelated: exits 3" 3 "$RR_RC"
expect "RR.11 remote-rejected then unrelated: two pushes" 2 "$RR_PUSHES"
expect "RR.11 remote-rejected then unrelated: one 10 second wait" "10 " "$RR_SLEEPS"
expect "RR.11 remote-rejected then unrelated: the die names one retry" yes "$(la_has "$RR_ERR" "after 1 retries")"
expect "RR.11 remote-rejected then unrelated: the follower stays" "$LA_SEED" "$(la_follower working/rr11)"

# RR.12: origin moves after the first retry. The read runs again before the
# second wait, so the loop stops there.
la_fixture working/rr12
rr_run rr-moved-later working/rr12 "$LA_NEW"
expect "RR.12 origin moves after one retry: exits 3" 3 "$RR_RC"
expect "RR.12 origin moves after one retry: two pushes" 2 "$RR_PUSHES"
expect "RR.12 origin moves after one retry: one 10 second wait" "10 " "$RR_SLEEPS"
expect "RR.12 origin moves after one retry: the die names one retry" yes "$(la_has "$RR_ERR" "after 1 retries")"
expect "RR.12 origin moves after one retry: the follower stays" "$LA_SEED" "$(la_follower working/rr12)"

# RR.13: the origin read fails after the first retry, so the loop stops there.
la_fixture working/rr13
rr_run rr-readfail-later working/rr13 "$LA_NEW"
expect "RR.13 read fails after one retry: exits 3, not Git's code" 3 "$RR_RC"
expect "RR.13 read fails after one retry: two pushes" 2 "$RR_PUSHES"
expect "RR.13 read fails after one retry: one 10 second wait" "10 " "$RR_SLEEPS"
expect "RR.13 read fails after one retry: the die names one retry" yes "$(la_has "$RR_ERR" "after 1 retries")"
expect "RR.13 read fails after one retry: the follower stays" "$LA_SEED" "$(la_follower working/rr13)"

# RR.14: the first three pushes are rejected, and the last allowed retry lands.
la_fixture working/rr14
rr_run rr-thrice working/rr14 "$LA_NEW"
expect "RR.14 the third retry lands: exits 0" 0 "$RR_RC"
expect "RR.14 the third retry lands: four pushes" 4 "$RR_PUSHES"
expect "RR.14 the third retry lands: the waits are 10, 20 and 40 seconds" "10 20 40 " "$RR_SLEEPS"
expect "RR.14 the third retry lands: origin holds new_sha" "$LA_NEW" "$(la_origin working/rr14)"
expect "RR.14 the third retry lands: the follower advances" "$LA_NEW" "$(la_follower working/rr14)"

# The Lead's recovery step quotes this die, so it must match the script's text.
RR_DOC="$HERE/../references/resume-and-recovery.md"
expect "RR doc: the recovery step quotes the spent-retry die" yes "$(la_has "$(cat "$RR_DOC")" "git push failed (rc=N) after 3 retries:")"
expect "RR doc: the recovery step names the [remote rejected] line" yes "$(la_has "$(cat "$RR_DOC")" "\`[remote rejected]\` line")"
# The Precheck, the #2626 step and the Escalation-completion land each carry it.
expect "RR doc: each Lead land-advance recipe runs with the raised tool timeout" 3 "$(grep -c 'as a foreground call with timeout 300000' "$RR_DOC")"
expect "RR doc: the script still prints the quoted die" yes "$(la_has "$(cat "$SCRIPT")" 'git push failed (rc=$push_rc) after $retries retries:')"

# ---------------------------------------------------------------------------
finish provision-worktrees-land.test.sh
