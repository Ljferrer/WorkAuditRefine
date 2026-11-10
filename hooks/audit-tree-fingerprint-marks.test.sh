#!/usr/bin/env bash
# Tests for the WAR audit tree fingerprint hook (hooks/audit-tree-fingerprint.sh):
# Bash-arm infra failure marks, search patterns that are not paths, the --prune record cleanup, and hook registration and conventions.
# The shared fixture, payload builders and helpers live in
# audit-tree-fingerprint.test-lib.sh (its header describes the hook and the
# fixture). #2823 split the suite into four files so they run in parallel.
# Plain-bash assertion runner, bash 3.2 safe, cwd-independent.
# Exit 0 = all cases passed.
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/audit-tree-fingerprint.test-lib.sh"

# The infra-failure rows walk $TMP/plain, which holds a marked task worktree
# (wtP). The operands suite builds the same fixture for its Grep walk-down rows.
mkdir -p "$TMP/plain/mid"
git -C "$MAIN" worktree add -q "$TMP/plain/mid/wtP" -b pwalk
printf 'marker\n' > "$TMP/plain/mid/wtP/.war-task"

# --- a Bash-arm infra failure leaves a mark -----------------------------------
# A post event cannot stop the call, so the verdict arm escalates on the mark.
# run_with <path-prefix> <payload>: run with a shim dir first on PATH.
run_with() { OUT="$(printf '%s' "$2" | PATH="$1:$PATH" bash "$HOOK" 2>"$TMP/err")"; RC=$?; ERR="$(cat "$TMP/err")"; }
_p="$(mk_bash "$AUD" pi1 "git -C $TMP/wtA log")"
run "$(mk_start "$AUD" pi1)"
OUT="$(printf '%s' "$_p" | WAR_FINGERPRINT_DEADLINE_SECONDS=0 bash "$HOOK" 2>/dev/null)"; RC=$?
_prc="$RC"
run "$(mk_verdict "$AUD" pi1)"
if [ "$_prc" = 0 ] && [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (deadline passed on a Bash call)' ] \
   && [ "$(jq -r '.worktree' "$TAMPER_ROOT/pi1.json" 2>/dev/null)" = '!deadline passed on a Bash call' ]; then
  pass "a deadline hit on the Bash arm escalates at the verdict, with no fail-open timeout reason, and the record names the mark"
else
  fail "a Bash-arm deadline did not escalate (rc=$_prc reason=|$(reason_of)|)"
fi
SHIM="$(mktemp -d 2>/dev/null || mktemp -d -t atfpshim3)"
for _t in cat grep printf sed head mkdir dirname git; do _b="$(command -v "$_t")" && [ -n "$_b" ] && ln -s "$_b" "$SHIM/$_t"; done
_p="$(mk_bash_fail "$AUD" pi2 "git -C $TMP/wtA log")"
run "$(mk_start "$AUD" pi2)"
_rc=0; _err="$(printf '%s' "$_p" | PATH="$SHIM" "$BASH" "$HOOK" 2>&1 >/dev/null)" || _rc=$?
run "$(mk_verdict "$AUD" pi2)"
case "$_err" in *"jq is not installed"*) m=1 ;; *) m=0 ;; esac
if [ "$_rc" = 2 ] && [ "$m" = 1 ] && [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (jq is not installed on a Bash call)' ]; then
  pass "jq missing on the Bash arm escalates at the verdict"
else
  fail "a jq-less Bash call did not escalate (rc=$_rc err=|$_err| reason=|$(reason_of)|)"
fi
_p="$(mk_read "$AUD" pi2b "$TMP/wtA/f")"
run "$(mk_start "$AUD" pi2b)"
_rc=0; printf '%s' "$_p" | PATH="$SHIM" "$BASH" "$HOOK" >/dev/null 2>&1 || _rc=$?
if [ "$_rc" = 2 ] && [ ! -s "$FP_ROOT/pi2b/touched" ]; then pass "jq missing on a Read leaves no mark (exit 2 denies that call)"; else fail "a jq-less Read left a mark (rc=$_rc)"; fi
rm -rf "$SHIM"
run "$(mk_start "$AUD" pi3)"
run "{\"hook_event_name\":\"PostToolUse\",\"agent_type\":\"$AUD\",\"agent_id\":\"pi3\",\"tool_name\":\"Bash\",\"cwd\":\"$MAIN\",\"tool_input\":{"
_prc="$RC"
run "$(mk_verdict "$AUD" pi3)"
if [ "$_prc" = 2 ] && [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (payload is not JSON on a Bash call)' ]; then
  pass "a Bash payload that is not JSON escalates at the verdict"
else
  fail "a Bash payload that is not JSON did not escalate (rc=$_prc reason=|$(reason_of)|)"
fi
run "$(mk_start "$AUD" pi3b)"
run "{\"hook_event_name\":\"PostToolUse\",\"agent_type\":\"work-audit-refine:war-worker\",\"agent_id\":\"pi3b\",\"tool_name\":\"Bash\",\"cwd\":\"$MAIN\",\"tool_input\":{"
if [ "$RC" = 2 ] && [ ! -s "$FP_ROOT/pi3b/touched" ]; then pass "a worker payload that is not JSON leaves no mark"; else fail "a worker payload that is not JSON left a mark (rc=$RC)"; fi
run "$(mk_start "$AUD" pi3c)"
run "{\"hook_event_name\":\"PreToolUse\",\"agent_type\":\"$AUD\",\"agent_id\":\"pi3c\",\"tool_name\":\"Bash\",\"cwd\":\"$MAIN\",\"tool_input\":{"
_prc="$RC"
run "{\"hook_event_name\":\"PostToolUse\",\"agent_type\":\"$AUD\",\"agent_id\":\"pi3c\",\"tool_name\":\"Read\",\"cwd\":\"$MAIN\",\"tool_input\":{"
if [ "$_prc" = 2 ] && [ "$RC" = 2 ] && [ ! -s "$FP_ROOT/pi3c/touched" ]; then pass "a broken payload off the Bash post arm leaves no mark"; else fail "a broken payload off the Bash post arm left a mark (rc=$RC)"; fi
SHIMG2="$(mktemp -d 2>/dev/null || mktemp -d -t atfpshimg2)"
REALGIT="$(command -v git)"
printf '#!/bin/bash\ncase "$*" in *--git-common-dir*) exit 128 ;; esac\nexec "%s" "$@"\n' "$REALGIT" > "$SHIMG2/git"
chmod +x "$SHIMG2/git"
run "$(mk_start "$AUD" pi4)"
run_with "$SHIMG2" "$(mk_bash "$AUD" pi4 "git -C $TMP/wtA log")"
_prc="$RC"
run "$(mk_verdict "$AUD" pi4)"
if [ "$_prc" = 0 ] && [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (no git common dir on a Bash call)' ]; then
  pass "a failed git common dir from the main checkout leaves a mark the verdict escalates"
else
  fail "a failed git common dir did not escalate (rc=$_prc reason=|$(reason_of)|)"
fi
for _tl in Read Glob Grep; do
  run "$(mk_start "$AUD" pi4b)"
  case "$_tl" in
    Read) _p="$(mk_read "$AUD" pi4b "$TMP/wtA/f")" ;;
    Glob) _p="$(mk_glob "$AUD" pi4b "$TMP/wtA")" ;;
    Grep) _p="$(mk_grep "$AUD" pi4b "$TMP/wtA")" ;;
  esac
  run_with "$SHIMG2" "$_p"
  run "$(mk_verdict "$AUD" pi4b)"
  if [ "$(reason_of)" = "AUDIT-TAMPER: unverifiable fingerprint (no git common dir on a $_tl call)" ]; then
    pass "a failed git common dir on a $_tl call leaves a mark the verdict escalates"
  else
    fail "a failed git common dir on a $_tl call did not escalate (reason=|$(reason_of)|)"
  fi
done
run "$(mk_start "$AUD" pi5)"
PCWD="$TMP/wtA"
_p="$(mk_bash "$AUD" pi5 'git log')"
PCWD="$MAIN"
run_with "$SHIMG2" "$_p"
_prc="$RC"
run "$(mk_verdict "$AUD" pi5)"
if [ "$_prc" = 0 ] && [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (no git common dir on a Bash call)' ]; then
  pass "a failed git common dir from a linked worktree finds the main checkout through the gitfile"
else
  fail "a failed git common dir from a worktree did not escalate (rc=$_prc reason=|$(reason_of)|)"
fi
mkdir -p "$TMP/norepo"
PCWD="$TMP/norepo"
_p="$(mk_bash "$AUD" pi5b 'git log')"
PCWD="$MAIN"
run "$_p"
case "$ERR" in *"no place for the mark"*) m=1 ;; *) m=0 ;; esac
if [ "$RC" = 0 ] && [ "$m" = 1 ]; then pass "a Bash call outside any repository names the lost mark on stderr"; else fail "a lost mark stayed silent (rc=$RC err=|$ERR|)"; fi
rm -rf "$SHIMG2"
run "$(mk_start "$AUD" pj0)"
run "$(jq -nc --arg at "$AUD" --arg c "$MAIN" '{hook_event_name:"PostToolUse",agent_type:$at,agent_id:"pj0",tool_name:"Bash",tool_input:{},cwd:$c}')"
run "$(mk_verdict "$AUD" pj0)"
if [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (jq failed on a Bash call)' ]; then pass "a Bash payload with no command escalates at the verdict"; else fail "a Bash payload with no command did not escalate (reason=|$(reason_of)|)"; fi
# A later jq read fails after the first pass parsed the payload.
SHIMJ="$(mktemp -d 2>/dev/null || mktemp -d -t atfpshimj)"
printf '#!/bin/bash\ncase "$*" in *"$JQ_FAIL"*) exit 5 ;; esac\nexec "%s" "$@"\n' "$(command -v jq)" > "$SHIMJ/jq"
chmod +x "$SHIMJ/jq"
for _f in .tool_input.command .hook_event_name .tool_name .cwd; do
  run "$(mk_start "$AUD" pj1)"
  _p="$(mk_bash_fail "$AUD" pj1 "git -C $TMP/wtA log")"
  OUT="$(printf '%s' "$_p" | JQ_FAIL="$_f" PATH="$SHIMJ:$PATH" bash "$HOOK" 2>/dev/null)"; _prc=$?
  run "$(mk_verdict "$AUD" pj1)"
  if [ "$_prc" = 0 ] && [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (jq failed on a Bash call)' ]; then
    pass "a failed jq read of $_f on the Bash arm escalates at the verdict"
  else
    fail "a failed jq read of $_f did not escalate (rc=$_prc reason=|$(reason_of)|)"
  fi
done
rm -rf "$SHIMJ"
SHIMG3="$(mktemp -d 2>/dev/null || mktemp -d -t atfpshimg3)"
printf '#!/bin/bash\ncase "$*" in *"worktree list"*) exit 128 ;; esac\nexec "%s" "$@"\n' "$REALGIT" > "$SHIMG3/git"
chmod +x "$SHIMG3/git"
run "$(mk_start "$AUD" pi6d)"
run_with "$SHIMG3" "$(mk_tool "$AUD" pi6d Grep '{"pattern":"base"}')"
run "$(mk_verdict "$AUD" pi6d)"
if [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (git worktree list failed on a Grep call)' ]; then pass "a failed worktree list on a Grep walk leaves a mark the verdict escalates"; else fail "a failed worktree list on a Grep walk did not escalate (reason=|$(reason_of)|)"; fi
# At seat start a failed list stays what it was: no mark.
run_with "$SHIMG3" "$(mk_start "$AUD" pi6a)"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/pi6a/touched" ]; then pass "a failed worktree list at seat start leaves no mark"; else fail "a failed worktree list at seat start left a mark: |$(cat "$FP_ROOT/pi6a/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" pi6)"
run_with "$SHIMG3" "$(mk_bash "$AUD" pi6 "git diff --no-index $TMP/plain /dev/null")"
_prc="$RC"
run "$(mk_verdict "$AUD" pi6)"
rm -rf "$SHIMG3"
if [ "$_prc" = 0 ] && [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (git worktree list failed on a Bash call)' ]; then
  pass "a failed worktree list on a Bash walk leaves a mark the verdict escalates"
else
  fail "a failed worktree list did not escalate (rc=$_prc reason=|$(reason_of)|)"
fi
# A failed list in a submodule repository names no failure in the cwd list.
SHIMG5="$(mktemp -d 2>/dev/null || mktemp -d -t atfpshimg5)"
printf '#!/bin/bash\ncase "$*" in *"sub dir"*"worktree list"*) exit 128 ;; esac\nexec "%s" "$@"\n' "$REALGIT" > "$SHIMG5/git"
chmod +x "$SHIMG5/git"
run "$(mk_start "$AUD" pi6b)"
run_with "$SHIMG5" "$(mk_bash "$AUD" pi6b "git diff --no-index $TMP/plain /dev/null")"
run "$(mk_verdict "$AUD" pi6b)"
rm -rf "$SHIMG5"
if [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (git worktree list failed on a Bash call)' ]; then
  pass "a failed submodule worktree list on a Bash walk leaves a mark the verdict escalates"
else
  fail "a failed submodule worktree list did not escalate (reason=|$(reason_of)|)"
fi
# A timeout on an earlier touched line never hides a mark: the verdict must
# offer no fail-open question for a touched set known to be short.
run "$(mk_start "$AUD" pi6c)"
run "$(mk_bash "$AUD" pi6c "git -C $TMP/wtA log")"
_p="$(mk_bash "$AUD" pi6c "git -C $TMP/wtB log")"
printf '%s' "$_p" | WAR_FINGERPRINT_DEADLINE_SECONDS=0 bash "$HOOK" >/dev/null 2>&1
_p="$(mk_verdict "$AUD" pi6c)"
OUT="$(printf '%s' "$_p" | WAR_FINGERPRINT_DEADLINE_SECONDS=0 bash "$HOOK" 2>/dev/null)"; RC=$?
if touched_has pi6c "$WTA" && [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (deadline passed on a Bash call)' ]; then
  pass "a verdict-arm timeout on an earlier line does not hide a Bash mark"
else
  fail "a timeout hid a Bash mark (reason=|$(reason_of)|)"
fi
# A hook killed mid-recording leaves its open marker. The shim kills the hook
# and its command substitution on the first show-toplevel call.
SHIMG4="$(mktemp -d 2>/dev/null || mktemp -d -t atfpshimg4)"
printf '#!/bin/bash\ncase "$*" in *--show-toplevel*) _g="$(ps -o ppid= -p "$PPID" | tr -d " ")"; kill -9 "$_g" "$PPID"; sleep 5; exit 1 ;; esac\nexec "%s" "$@"\n' "$REALGIT" > "$SHIMG4/git"
chmod +x "$SHIMG4/git"
run "$(mk_start "$AUD" pi7)"
run_with "$SHIMG4" "$(mk_bash "$AUD" pi7 "git diff $TMP/plain HEAD")" 2>/dev/null
_prc="$RC"
run "$(mk_verdict "$AUD" pi7)"
rm -rf "$SHIMG4"
if [ "$_prc" != 0 ] && [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (a Bash recording did not finish)' ]; then
  pass "a hook killed during a Bash recording escalates at the verdict"
else
  fail "a killed Bash recording did not escalate (rc=$_prc reason=|$(reason_of)|)"
fi

# --- a search pattern is not a path (#2604) ----------------------------------
# A seat ran `git grep -n -F -e '/Users' <sha> -- x`. The hook read the pattern
# as an absolute directory operand, walked down, and touched every task
# worktree under it, so a sibling's fix round rewrote an approve to escalate.
# Here the pattern is $TMP, the directory that holds every fixture worktree:
# without the fix each row below walks them all. The base is $MAIN (no marker).
# The `-L` rows pin token shape only: git refuses `-L <abs dir>` as a range.
_psha="$(git -C "$MAIN" rev-parse HEAD)"
# git_runs <command>: the command runs under real git from the payload cwd and
# exits 0, or 1 with no `error:` or `fatal:` line on stderr (a grep with no
# match, a diff with changes; a warning is fine). A no-index diff that cannot
# open a path also exits 1, but it prints `error:`, so it fails here. Every row in this
# block must name a command git accepts (operator ruling 2026-11-04), except
# the `-L` token-shape rows. The eval runs under LC_ALL=C, so git's `error:`
# and `fatal:` prefixes are never translated, and a failed `cd` exits 2, which
# fails the check. prow <id> <command> runs a start and the Bash payload, and
# records the command and counts the row for the pq_check after the rows.
git_runs() {
  ( export LC_ALL=C; cd "$PCWD" || exit 2; eval "$1" ) >/dev/null 2>"$TMP/gr.err"; _gr=$?
  [ "$_gr" = 0 ] && return 0
  [ "$_gr" = 1 ] && ! grep -Eq '^(error|fatal):' "$TMP/gr.err"
}
# git_runs itself can fail: git refuses an unknown flag (exit 128), and a
# no-index diff of a missing path exits 1 with an error.
if ! git_runs "git -C $MAIN log --no-such-flag" && ! git_runs "git diff --no-index $TMP/no-such-a $TMP/no-such-b"; then pass "control: git_runs fails on a refused command and on a missing path"; else fail "control: git_runs passed a command git refuses"; fi
_pq_cmds=""; _pq_n=0
prow() { run "$(mk_start "$AUD" "$1")"; run "$(mk_bash "$AUD" "$1" "$2")"; _pq_n=$((_pq_n + 1)); _pq_cmds="$_pq_cmds$2
"; }
# pq_check <command list> <row count>: returns 0 only when the list holds at
# least one command, exactly <row count> of them, and git accepts each one
# (git_runs). _pq_bad names the refused ones.
pq_check() {
  _pq_bad=""; _pq_seen=0
  while IFS= read -r _c; do
    [ -n "$_c" ] || continue
    _pq_seen=$((_pq_seen + 1))
    git_runs "$_c" || _pq_bad="$_pq_bad[$_c] "
  done <<EOF_PQ
$1
EOF_PQ
  [ "$_pq_seen" -gt 0 ] && [ "$_pq_seen" = "$2" ] && [ -z "$_pq_bad" ]
}
# The checks fail closed (#2620): an empty command list, a list short of the
# row count, and a failed `cd` each fail, and a command git accepts passes.
if ! pq_check "" 0; then pass "TR1: pq_check fails on an empty command list"; else fail "TR1: pq_check passed an empty command list"; fi
if ! pq_check "git -C $MAIN log -1" 2; then pass "TR2: pq_check fails when the list is short of the row count"; else fail "TR2: pq_check passed a short list"; fi
if ! ( PCWD="$TMP/no-such-dir"; git_runs "true" ); then pass "TR3: git_runs fails on a failed cd"; else fail "TR3: git_runs passed a failed cd"; fi
if pq_check "git -C $MAIN log -1" 1; then pass "TR4: pq_check passes one command git accepts at a row count of one"; else fail "TR4: pq_check refused a command git accepts (bad=|$_pq_bad|)"; fi
# Positive control: the same $TMP value walks the task worktrees when it is a
# path, so the empty touched sets below are not vacuous. From wtC, git diffs
# the folder $TMP against an empty folder (both outside wtC, so git implies
# --no-index) and reads every task worktree under $TMP.
mkdir "$TMP/pp0e"
run "$(mk_start "$AUD" pp0)"
PCWD="$TMP/wtC"
run "$(mk_bash "$AUD" pp0 "git diff $TMP $TMP/pp0e")"
PCWD="$MAIN"
if touched_has pp0 "$WTB" && ( PCWD="$TMP/wtC"; git_runs "git diff $TMP $TMP/pp0e" ); then pass "control: a \$TMP path operand walks the task worktrees here"; else fail "control: \$TMP did not walk or git refused it: |$(cat "$FP_ROOT/pp0/touched" 2>/dev/null | tr '\n' ' ')| git: $(head -c 300 "$TMP/gr.err" 2>/dev/null | tr '\n' ' ')"; fi
_pi=0
for _pcmd in \
  "git -C $MAIN grep -n -F -e '$TMP' $_psha -- x" \
  "git -C $MAIN grep -n -F -e $TMP $_psha -- x" \
  "git -C $MAIN log -S $TMP $_psha" \
  "git -C $MAIN log -pS $TMP $_psha" \
  "git -C $MAIN show -G $TMP $_psha" \
  "git -C $MAIN diff -S $TMP $_psha $_psha" \
  "git -C $MAIN log --grep=$TMP $_psha" \
  "git -C $MAIN log --grep $TMP $_psha" \
  "git -C $MAIN log --author $TMP $_psha" \
  "git -C $MAIN log --committer=$TMP $_psha" \
  "git -C $MAIN log --grep-reflog $TMP -g $_psha" \
  "git -C $MAIN grep -n -Fe $TMP $_psha -- x" \
  "git -C $MAIN log --oneline -S $TMP $_psha" \
  "git -C $MAIN log $_psha -S $TMP" \
  "git -C $MAIN log -S a --grep $TMP $_psha" \
  "git -C $MAIN log -L $TMP $_psha" \
  "git -C $MAIN blame -L $TMP $_psha -- f" \
  "git -C $MAIN blame -w -L $TMP $_psha -- f" \
  "git -C $MAIN log -1 -S $TMP $_psha" \
  "git -C $MAIN log --graph -S $TMP $_psha" \
  "git -C $MAIN log -i --grep $TMP $_psha" \
  "git -C $MAIN diff -I $TMP $_psha $_psha" \
  "git -C $MAIN diff --ignore-matching-lines $TMP $_psha $_psha" \
  "git -C $MAIN diff --word-diff-regex=$TMP $_psha $_psha" \
  "git -C $MAIN diff --word-diff-regex $TMP $_psha $_psha" \
  "git -C $MAIN diff --ignore-matching-lines=$TMP $_psha $_psha" \
  "git -C $MAIN show --grep $TMP $_psha" \
  "git -C $MAIN log -I $TMP $_psha" \
  "git -C $MAIN log --word-diff-regex $TMP $_psha" \
  "git -C $MAIN log --format=%h -S $TMP $_psha" \
  "git -C $MAIN log --author=$TMP $_psha" \
  "git -C $MAIN log -r -S $TMP $_psha" \
  "git -C $MAIN show -p -S $TMP $_psha" \
  "git -C $MAIN show -i --grep $TMP $_psha" \
  "git -C $MAIN show -I $TMP $_psha" \
  "git -C $MAIN show --word-diff-regex $TMP $_psha" \
  "git -C $MAIN diff -p -G $TMP $_psha $_psha" \
  "git -C $MAIN diff -r -S $TMP $_psha $_psha" \
  "git -C $MAIN log --committer $TMP $_psha" \
  "git -C $MAIN log --grep-reflog=$TMP -g $_psha" \
  "git -C $MAIN grep -n -ilwcF -e $TMP $_psha -- x" \
  "git -C $MAIN log -g --grep-reflog $TMP $_psha" \
  "git -C $MAIN log --walk-reflogs --grep-reflog $TMP $_psha" \
  "git -C $MAIN show -g --grep-reflog $TMP $_psha" \
  "git -C $MAIN show --walk-reflogs -S $TMP $_psha" \
  "git -C $MAIN diff --color-words=$TMP $_psha $_psha" \
  "git -C $MAIN log --color-words=$TMP $_psha" \
  "git -C $MAIN show --color-words=$TMP $_psha" \
  "git -C $MAIN log --color-words -S $TMP $_psha" \
  "git -C $MAIN log --abbrev-commit -S $TMP $_psha" \
  "git -C $MAIN log --no-walk -S $TMP $_psha" \
  "git -C $MAIN log --date-order -S $TMP $_psha" \
  "git -C $MAIN log --decorate-refs $TMP $_psha" \
  "git -C $MAIN log --decorate-refs=$TMP $_psha" \
  "git -C $MAIN log --decorate-refs-exclude $TMP $_psha" \
  "git -C $MAIN log --decorate-refs-exclude=$TMP $_psha" \
  "git -C $MAIN grep -E -e $TMP $_psha -- x" \
  "git -C $MAIN grep -A 2 -e $TMP $_psha -- x" \
  "git -C $MAIN grep -A2 -e $TMP $_psha -- x"
do
  _pi=$((_pi + 1))
  run "$(mk_start "$AUD" pp$_pi)"
  run "$(mk_bash "$AUD" pp$_pi "$_pcmd")"
  if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/pp$_pi/touched" ]; then pass "a pattern value touches no worktree: $_pcmd"; else fail "a pattern value touched worktrees: $_pcmd (rc=$RC touched=|$(cat "$FP_ROOT/pp$_pi/touched" 2>/dev/null)|)"; fi
  case "$_pcmd" in *" -L "*) ;; *) git_runs "$_pcmd" || fail "git refuses pp row: $_pcmd" ;; esac
done
# An attached pattern is no path either: from wtA, `-S../wtB/f` and the
# clustered `-sGS../wtD/f` (the -G value is `S../wtD/f`, which the old cluster
# arm read as the path `../wtD/f`) read wtA only. git refuses -S with -G, so
# each has its own row (the clustered one is pq15, so the IDs run in order).
prow pq1 "git -C $TMP/wtA log -S../wtB/f $_psha"
if touched_is pq1 "$WTA"; then pass "an attached -S pattern touches no sibling worktree"; else fail "an attached -S pattern touched a sibling: |$(cat "$FP_ROOT/pq1/touched" 2>/dev/null)|"; fi
# The reported symptom: a sibling changes while the seat greps, and the
# seat's approve stands.
prow pq2 "git -C $MAIN grep -n -F -e '$TMP' $_psha -- x"
printf 'sibling fix round\n' >> "$TMP/wtB/f"
run "$(mk_verdict "$AUD" pq2)"
if [ "$RC" = 0 ] && [ -z "$OUT" ] && [ ! -e "$TAMPER_ROOT/pq2.json" ]; then pass "a sibling edit during a pattern grep leaves the approve standing"; else fail "a pattern grep still escalated (rc=$RC reason=|$(reason_of)|)"; fi
# A path stays a path: after `--` a `-e` token is a pathspec (the `x` before
# it makes the token free, so only the `--` rule keeps it a path), `grep -f` reads
# a pattern file, and `blame -S` reads a revs file. pq3's pathspec names a file
# in wtP, a task worktree nested under $MAIN: git matches the pathspec against
# the tree, and the hook touches wtP (over-touch, the safe side). pq4 and pq5
# touch wtB.
git -C "$MAIN" worktree add -q "$MAIN/nest/wtP" -b pq3
printf 'marker\n' > "$MAIN/nest/wtP/.war-task"
WTP="$(cd "$MAIN/nest/wtP" && pwd -P)"
prow pq3 "git -C $MAIN grep -F -e x $_psha -- x -e nest/wtP/f"
if touched_is pq3 "$WTP"; then pass "a -e after -- stays a pathspec"; else fail "a -e after -- hid its path: |$(cat "$FP_ROOT/pq3/touched" 2>/dev/null)|"; fi
prow pq4 "git -C $MAIN grep -F -f $TMP/wtB/f $_psha"
if touched_is pq4 "$WTB"; then pass "a grep -f value stays a path"; else fail "a grep -f value was not touched: |$(cat "$FP_ROOT/pq4/touched" 2>/dev/null)|"; fi
prow pq5 "git -C $MAIN blame -S $TMP/wtB/f $_psha -- f"
if touched_is pq5 "$WTB"; then pass "a blame -S value stays a path"; else fail "a blame -S value was not touched: |$(cat "$FP_ROOT/pq5/touched" 2>/dev/null)|"; fi
# A value-taking letter before S keeps the cluster a path: in `-pOS/../../wtB/f`
# the `O` takes `S/../../wtB/f` as its orderfile, whose lexical reading lands
# in wtB (the hook reads both ways, see task_worktree_of).
prow pq6 "git -C $TMP/wtA diff -pOS/../../wtB/f $_psha $_psha"
if touched_is pq6 "$(printf '%s\n%s' "$WTA" "$WTB")"; then pass "a value-taking letter before S keeps the cluster a path"; else fail "a -pOS cluster lost its orderfile: |$(cat "$FP_ROOT/pq6/touched" 2>/dev/null)|"; fi
# An option that takes the next token as its value takes a following -S or
# -G as that value, so the token after it is a path git reads: `-I` takes
# `-S` as its regex, `--src-prefix` takes `-G` as its prefix, `-O` takes `-S`
# as its orderfile, and each diff reads wtB/f and wtD/f (git 2.54). `-I` is a
# pattern option itself, so pq7 pins this rule: a pattern value that starts
# with `-` is still the value, never an option (the `_pv` skip runs before
# pat_opt). pq8, pq10 and pq12 pin pat_free: neither `--src-prefix`, `-O`
# nor the mixed cluster `-pO` is free (every cluster letter must be in _pk).
# git reads the orderfile, so an empty file named `-S` in $MAIN lets git run
# pq10 and pq12.
: > "$MAIN/-S"
prow pq7 "git -C $MAIN diff --no-index -I -S $TMP/wtB/f $TMP/wtD/f"
if touched_is pq7 "$(printf '%s\n%s' "$WTB" "$WTD")"; then pass "a -S taken as the value of -I stays no pattern option"; else fail "a -S after -I hid a path: |$(cat "$FP_ROOT/pq7/touched" 2>/dev/null)|"; fi
prow pq8 "git -C $MAIN diff --src-prefix -G $TMP/wtB/f $TMP/wtD/f"
if touched_is pq8 "$(printf '%s\n%s' "$WTB" "$WTD")"; then pass "a -G taken as the value of --src-prefix stays no pattern option"; else fail "a -G after --src-prefix hid a path: |$(cat "$FP_ROOT/pq8/touched" 2>/dev/null)|"; fi
# An attached -e pattern is no path: from wtA, `-e../wtB/f` reads wtA only.
prow pq9 "git -C $TMP/wtA grep -n -F -e../wtB/f $_psha -- x"
if touched_is pq9 "$WTA"; then pass "an attached -e pattern touches no sibling worktree"; else fail "an attached -e pattern touched a sibling: |$(cat "$FP_ROOT/pq9/touched" 2>/dev/null)|"; fi
prow pq10 "git -C $MAIN diff -O -S $TMP/wtB/f $TMP/wtD/f"
if touched_is pq10 "$(printf '%s\n%s' "$WTB" "$WTD")"; then pass "a -S taken as the value of -O stays no pattern option"; else fail "a -S after -O hid a path: |$(cat "$FP_ROOT/pq10/touched" 2>/dev/null)|"; fi
# `--end-of-options` ends option parsing like `--`: in `diff --no-index
# --end-of-options wtA -S wtB` from $TMP, git compares wtA with the empty
# folder `-S`, limited to the pathspec wtB. git reads wtA, and the hook also
# touches wtB (over-touch, the safe side). The `wtA` before `-S` is free, so
# only the `--end-of-options` rule keeps `-S` from skipping wtB. git floor:
# a `diff --no-index` that takes a trailing pathspec, which git 2.50 added
# (an older git refuses the third operand, and the pq_check below goes red);
# this row is checked against git 2.54.
mkdir "$TMP/-S"
prow pq11 "git -C $TMP diff --no-index --end-of-options wtA -S wtB"
if touched_is pq11 "$(printf '%s\n%s' "$WTA" "$WTB")"; then pass "a -S after --end-of-options stays a path"; else fail "a -S after --end-of-options hid a path: |$(cat "$FP_ROOT/pq11/touched" 2>/dev/null)|"; fi
prow pq12 "git -C $MAIN diff -pO -S $TMP/wtB/f $TMP/wtD/f"
if touched_is pq12 "$(printf '%s\n%s' "$WTB" "$WTD")"; then pass "a -S taken as the value of the cluster -pO stays no pattern option"; else fail "a -S after -pO hid a path: |$(cat "$FP_ROOT/pq12/touched" 2>/dev/null)|"; fi
# An attached pattern value carries its own value, so the token after it is
# free and stays a path: both diffs read wtB/f and wtD/f (git 2.54).
prow pq13 "git -C $MAIN diff --no-index --word-diff-regex=x $TMP/wtB/f $TMP/wtD/f"
if touched_is pq13 "$(printf '%s\n%s' "$WTB" "$WTD")"; then pass "a path after an attached long pattern value stays a path"; else fail "a path after --word-diff-regex=x was skipped: |$(cat "$FP_ROOT/pq13/touched" 2>/dev/null)|"; fi
prow pq14 "git -C $MAIN diff --no-index -Sx $TMP/wtB/f $TMP/wtD/f"
if touched_is pq14 "$(printf '%s\n%s' "$WTB" "$WTD")"; then pass "a path after an attached short pattern value stays a path"; else fail "a path after -Sx was skipped: |$(cat "$FP_ROOT/pq14/touched" 2>/dev/null)|"; fi
# The clustered attached -G row (see pq1 above).
prow pq15 "git -C $TMP/wtA log -sGS../wtD/f $_psha"
if touched_is pq15 "$WTA"; then pass "a clustered attached -G pattern touches no sibling worktree"; else fail "a clustered attached -G pattern touched a sibling: |$(cat "$FP_ROOT/pq15/touched" 2>/dev/null)|"; fi
# The grep forms validate-auditor-git.sh admits (PIN-22): `-E` is a no-value
# letter and `-A/-B/-C <n>` or `-A<n>` a count, so neither makes the `-e` after
# it a path. From wtA each `-e` value names a sibling worktree file, and the
# pathspec `f` is the only path: wtA alone is touched. GP1 is the plan's form;
# GP2 to GP4 each go red when one of the forms is missing from the parser.
prow gp1 "git -C $TMP/wtA grep -E -A 2 -e ../wtB/f -e ../wtD/f -- f"
if touched_is gp1 "$WTA"; then pass "GP1: grep -E -A 2 -e tok -e tok2 -- <path> touches only the path"; else fail "GP1: grep -E -A 2 -e .. -e .. touched more than the path: |$(cat "$FP_ROOT/gp1/touched" 2>/dev/null)|"; fi
prow gp2 "git -C $TMP/wtA grep -A2 -e ../wtB/f -- f"
if touched_is gp2 "$WTA"; then pass "GP2: an attached -A2 count leaves the -e after it a pattern"; else fail "GP2: -A2 made the -e value a path: |$(cat "$FP_ROOT/gp2/touched" 2>/dev/null)|"; fi
prow gp3 "git -C $TMP/wtA grep -E -e ../wtB/f -- f"
if touched_is gp3 "$WTA"; then pass "GP3: -E leaves the -e after it a pattern"; else fail "GP3: -E made the -e value a path: |$(cat "$FP_ROOT/gp3/touched" 2>/dev/null)|"; fi
prow gp4 "git -C $TMP/wtA grep -B 1 -C3 -e ../wtB/f -e ../wtD/f -- f"
if touched_is gp4 "$WTA"; then pass "GP4: -B 1 and an attached -C3 leave the -e after them a pattern"; else fail "GP4: a -B or -C count made an -e value a path: |$(cat "$FP_ROOT/gp4/touched" 2>/dev/null)|"; fi
# Every pq and GP command is one git accepts (the git_runs rule above), and
# the check reads exactly one command per row (pq_check: #2620).
if pq_check "$_pq_cmds" "$_pq_n"; then pass "git accepts every pq and GP row command ($_pq_n rows checked)"; else fail "pq rows: $_pq_seen of $_pq_n checked, git refuses: $_pq_bad"; fi
git -C "$MAIN" worktree remove --force "$MAIN/nest/wtP"
rm -rf "$MAIN/nest" "$MAIN/-S" "$TMP/-S" "$TMP/pp0e" "$TMP/gr.err"

# --- record cleanup: --prune (PIN-25, #2680) ----------------------------------
# A scratch main checkout with a record tree. `--prune` is an argument mode:
# it runs before the stdin payload is read, from a cwd inside the repository.
# prune <args...>: run the hook from $PRM with an empty stdin; sets RC, OUT, ERR.
PRM="$TMP/prm"
git init -q "$PRM"
PRT="$PRM/.claude/war/audit-fingerprints"
prune() { OUT="$(cd "$PRM" && bash "$HOOK" "$@" </dev/null 2>"$TMP/err")"; RC=$?; ERR="$(cat "$TMP/err")"; }
mkrec() { mkdir -p "$PRT/$1" && printf 'x\n' > "$PRT/$1/start" && printf '{}\n' > "$PRT/$1.payload"; }
mkrec leadprobeA; mkrec leadprobeB
prune --prune leadprobeA
case "$OUT" in "pruned: "*"/.claude/war/audit-fingerprints/leadprobeA") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$p" = 1 ] && [ ! -e "$PRT/leadprobeA" ] && [ -d "$PRT/leadprobeB" ]; then
  pass "PR1: --prune leadprobeA removes that record directory and leaves leadprobeB"
else
  fail "PR1: --prune leadprobeA (rc=$RC out=|$OUT| A=$([ -e "$PRT/leadprobeA" ] && echo present || echo absent) B=$([ -d "$PRT/leadprobeB" ] && echo present || echo absent) err=|$ERR|)"
fi
# A name with `/` or `..` exits 2 with nothing removed, even when it names a
# directory that exists (`../x` and `a/b` are both made here).
mkrec leadprobeA; mkdir -p "$PRM/.claude/war/x" "$PRT/a/b"
for _n in ../x a/b; do
  prune --prune "$_n"
  case "$ERR" in *"is not a record name"*) e=1 ;; *) e=0 ;; esac
  if [ "$RC" = 2 ] && [ "$e" = 1 ] && [ -z "$OUT" ] && [ -d "$PRT/leadprobeA" ] && [ -d "$PRT/leadprobeB" ] && [ -d "$PRM/.claude/war/x" ] && [ -d "$PRT/a/b" ]; then
    pass "PR$([ "$_n" = a/b ] && echo 3 || echo 2): --prune $_n exits 2 and removes nothing"
  else
    fail "PR$([ "$_n" = a/b ] && echo 3 || echo 2): --prune $_n (rc=$RC out=|$OUT| err=|$ERR|)"
  fi
done
rm -rf "$PRM/.claude/war/x" "$PRT/a"
# Every name is checked before any removal: a good name beside a bad one,
# and a missing directory, both exit 2 and leave leadprobeA in place.
prune --prune leadprobeA ../x
_r1="$RC"; _e1="$ERR"
prune --prune leadprobeA nosuch
case "$_e1" in *"is not a record name"*) e=1 ;; *) e=0 ;; esac
case "$ERR" in *"no record directory"*) ;; *) e=0 ;; esac
if [ "$_r1" = 2 ] && [ "$RC" = 2 ] && [ "$e" = 1 ] && [ -d "$PRT/leadprobeA" ]; then
  pass "PR4: --prune checks every name first (a bad or missing name removes nothing)"
else
  fail "PR4: --prune removed before checking every name (rc=$_r1/$RC A=$([ -d "$PRT/leadprobeA" ] && echo present || echo absent) err=|$_e1|$ERR|)"
fi
# --stale removes a record directory whose files are 25 hours old and keeps
# one touched now (the directory's own mtime is not read).
mkrec old
_old="$(date -v-25H +%Y%m%d%H%M 2>/dev/null || date -d '25 hours ago' +%Y%m%d%H%M)"
touch -t "$_old" "$PRT/old/start"
mkrec new
prune --prune --stale
case "$OUT" in "pruned: "*"/.claude/war/audit-fingerprints/old") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$p" = 1 ] && [ ! -e "$PRT/old" ] && [ -d "$PRT/new" ] && [ -d "$PRT/leadprobeA" ] && [ -d "$PRT/leadprobeB" ]; then
  pass "PR5: --prune --stale removes a directory with no file newer than 24 hours and keeps a fresh one"
else
  fail "PR5: --prune --stale (rc=$RC out=|$OUT| old=$([ -e "$PRT/old" ] && echo present || echo absent) new=$([ -d "$PRT/new" ] && echo present || echo absent) err=|$ERR|)"
fi
# No name, and a cwd in no repository, exit 2.
prune --prune
_r1="$RC"; _e1="$ERR"
OUT="$(cd "$TMP" && bash "$HOOK" --prune leadprobeA </dev/null 2>"$TMP/err")"; RC=$?; ERR="$(cat "$TMP/err")"
case "$_e1" in *"takes a record name or --stale"*) e=1 ;; *) e=0 ;; esac
case "$ERR" in *"no git common dir"*) ;; *) e=0 ;; esac
if [ "$_r1" = 2 ] && [ "$RC" = 2 ] && [ "$e" = 1 ] && [ -d "$PRT/leadprobeA" ]; then
  pass "PR6: --prune with no name, or from outside a repository, exits 2"
else
  fail "PR6: --prune usage errors (no name rc=$_r1, no repo rc=$RC err=|$_e1|$ERR|)"
fi
# A symlinked record tree (the tree, or .claude/war above it) exits 2 and
# leaves the old directory in place. In the second arm only .claude/war is a
# link: the tree under its target is a real directory, so only the physical
# path compare refuses it. The live records wait in $TMP/prk and come back
# after the row.
PRL="$TMP/prl"; mkdir -p "$PRL/olddir"; printf 'x\n' > "$PRL/olddir/f"; touch -t "$_old" "$PRL/olddir/f"
mv "$PRT" "$TMP/prk"; ln -s "$PRL" "$PRT"
prune --prune --stale
_r1="$RC"; _e1="$ERR"
rm -f "$PRT"; mv "$PRM/.claude/war" "$PRM/.claude/warreal"; ln -s "$PRM/.claude/warreal" "$PRM/.claude/war"
PRW="$PRM/.claude/warreal/audit-fingerprints"; mkdir -p "$PRW/olddir"; printf 'x\n' > "$PRW/olddir/f"; touch -t "$_old" "$PRW/olddir/f"
prune --prune --stale
case "$_e1" in *"is not a real record tree"*) e=1 ;; *) e=0 ;; esac
case "$ERR" in *"is not a real record tree"*) ;; *) e=0 ;; esac
if [ "$_r1" = 2 ] && [ "$RC" = 2 ] && [ "$e" = 1 ] && [ -d "$PRL/olddir" ] && [ -d "$PRW/olddir" ]; then
  pass "PR7: --prune --stale on a symlinked record tree exits 2 and removes nothing in the link target"
else
  fail "PR7: symlinked record tree (tree rc=$_r1, parent rc=$RC olddir=$([ -d "$PRL/olddir" ] && echo present || echo absent) parent olddir=$([ -d "$PRW/olddir" ] && echo present || echo absent) err=|$_e1|$ERR|)"
fi
rm -f "$PRM/.claude/war"; mv "$PRM/.claude/warreal" "$PRM/.claude/war"; rm -rf "$PRT"; mv "$TMP/prk" "$PRT"
rm -rf "$PRL"
# --stale with a name exits 2 and removes nothing.
prune --prune --stale leadprobeA
case "$ERR" in *"takes no name"*) e=1 ;; *) e=0 ;; esac
if [ "$RC" = 2 ] && [ "$e" = 1 ] && [ -d "$PRT/leadprobeA" ]; then
  pass "PR8: --prune --stale with a name exits 2 and removes nothing"
else
  fail "PR8: --prune --stale leadprobeA (rc=$RC err=|$ERR|)"
fi
# A repeated name removes its directory once and exits 0.
prune --prune leadprobeA leadprobeA
case "$OUT" in "pruned: "*"/.claude/war/audit-fingerprints/leadprobeA") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$p" = 1 ] && [ ! -e "$PRT/leadprobeA" ] && [ -d "$PRT/leadprobeB" ]; then
  pass "PR9: --prune with a repeated name removes it once and exits 0"
else
  fail "PR9: --prune leadprobeA leadprobeA (rc=$RC out=|$OUT| err=|$ERR|)"
fi
rm -rf "$PRM"

# --- registration + conventions ---------------------------------------------
if jq -e . "$HJSON" >/dev/null 2>&1; then pass "hooks.json parses"; else fail "hooks.json does not parse"; fi
SUBM='^work-audit-refine:war-(evidence-)?auditor$'
for ev in SubagentStart SubagentStop; do
  reg="$(jq -r --arg ev "$ev" --arg m "$SUBM" '.hooks[$ev][] | select(.matcher == $m) | .hooks[].command' "$HJSON" 2>/dev/null)"
  case "$reg" in
    *audit-tree-fingerprint.sh*) pass "hooks.json $ev($SUBM) -> audit-tree-fingerprint.sh" ;;
    *) fail "hooks.json has no $ev matcher $SUBM entry for the hook (got |$reg|)" ;;
  esac
done
for m in 'StructuredOutput' 'Read|Glob|Grep'; do
  reg="$(jq -r --arg m "$m" '.hooks.PreToolUse[] | select(.matcher == $m) | .hooks[].command' "$HJSON" 2>/dev/null)"
  case "$reg" in
    *audit-tree-fingerprint.sh*) pass "hooks.json PreToolUse($m) -> audit-tree-fingerprint.sh" ;;
    *) fail "hooks.json has no PreToolUse matcher $m entry for the hook (got |$reg|)" ;;
  esac
done
for ev in PostToolUse PostToolUseFailure; do
  reg="$(jq -r --arg ev "$ev" '.hooks[$ev][] | select(.matcher == "Bash") | .hooks[] | select(.timeout >= 600) | .command' "$HJSON" 2>/dev/null)"
  case "$reg" in
    *audit-tree-fingerprint.sh*) pass "hooks.json $ev(Bash) -> audit-tree-fingerprint.sh with a 600 second timeout" ;;
    *) fail "hooks.json has no $ev matcher Bash entry for the hook (got |$reg|)" ;;
  esac
done
# No PreToolUse entry for the hook may match Bash: its recorder would run before
# a sibling guard's deny lands.
nbash="$(jq '[.hooks.PreToolUse[] | select(.matcher | test("(^|\\|)Bash(\\||$)")) | .hooks[] | select(.command | contains("audit-tree-fingerprint.sh"))] | length' "$HJSON" 2>/dev/null)"
if [ "$nbash" = 0 ]; then pass "hooks.json runs no PreToolUse fingerprint entry on Bash"; else fail "hooks.json still runs the hook on PreToolUse Bash (entries=|$nbash|)"; fi
# Every hooks.json entry for the hook carries a timeout of at least 600 s, so
# the hook's own 540 s default deadline sits below the harness kill.
nreg="$(jq '[.hooks[][] | .hooks[] | select(.command | contains("audit-tree-fingerprint.sh"))] | length' "$HJSON" 2>/dev/null)"
nlong="$(jq '[.hooks[][] | .hooks[] | select(.command | contains("audit-tree-fingerprint.sh")) | select((.timeout // 0) >= 600)] | length' "$HJSON" 2>/dev/null)"
if [ -n "$nreg" ] && [ "$nreg" -ge 3 ] && [ "$nreg" = "$nlong" ]; then
  pass "every hooks.json audit-tree-fingerprint.sh entry carries a timeout of at least 600 seconds ($nreg entries)"
else
  fail "hooks.json fingerprint entries without a >=600 timeout: $((nreg - nlong)) of $nreg"
fi
if [ -x "$HOOK" ]; then pass "hook is executable"; else fail "hook is not executable"; fi
if grep -qE '\*war-[a-z-]*\*' "$HOOK"; then
  fail "hook carries a trailing-star agent-type arm"
else
  pass "hook agent-type arms are suffix-anchored (no trailing star)"
fi
if grep -Fq 'AUDIT-TAMPER:' "$DOC"; then
  pass "resume-and-recovery.md carries the AUDIT-TAMPER: Checkpoint bullet"
else
  fail "resume-and-recovery.md has no AUDIT-TAMPER: bullet"
fi
# The question lives in the AUDIT-TAMPER bullet itself (one line in that doc),
# so the words are required inside that bullet, not anywhere in the file: fail
# closed, fail open, the --afk hold, and seat_verdict as the fail-open value.
_b="$(grep -F 'AUDIT-TAMPER: fingerprint timeout' "$DOC")"
case "$_b" in *"fail closed"*) _c1=1 ;; *) _c1=0 ;; esac
case "$_b" in *"fail open"*) _c2=1 ;; *) _c2=0 ;; esac
case "$_b" in *"--afk"*) _c3=1 ;; *) _c3=0 ;; esac
case "$_b" in *"seat_verdict"*) _c4=1 ;; *) _c4=0 ;; esac
if [ -n "$_b" ] && [ "$_c1$_c2$_c3$_c4" = 1111 ]; then
  pass "resume-and-recovery.md's AUDIT-TAMPER timeout bullet carries the Lead question (fail closed or fail open), the --afk hold and seat_verdict"
else
  fail "resume-and-recovery.md AUDIT-TAMPER timeout bullet incomplete (closed=$_c1 open=$_c2 afk=$_c3 seat_verdict=$_c4)"
fi

# ---------------------------------------------------------------------------
finish audit-tree-fingerprint-marks.test.sh
