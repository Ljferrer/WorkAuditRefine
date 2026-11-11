#!/usr/bin/env bash
# Tests for the WAR audit tree fingerprint hook (hooks/audit-tree-fingerprint.sh):
# flagged paths, unverifiable fingerprints, SubagentStop, the hook deadline, the per-call watchdog, the exit contract, Bash recording, and payloads with no agent_id.
# The shared fixture, payload builders and helpers live in
# audit-tree-fingerprint.test-harness.sh (its header describes the hook and the
# fixture). #2823 split the suite into four files so they run in parallel.
# Plain-bash assertion runner, bash 3.2 safe, cwd-independent.
# Exit 0 = all cases passed.
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/audit-tree-fingerprint.test-harness.sh"

# --- git's own change detection off; flagged paths hashed (#2438) -------------
# `git status` never reports a worktree edit to a path flagged assume-unchanged
# or skip-worktree (a staged change to one is still listed), so the hook hashes
# every path `git ls-files -v` flags
# (a lowercase tag, or `S`) as if it were dirty, with the flagged set in the
# hashed data. A worker-set `core.fsmonitor` command runs under a plain
# `git status` or `git ls-files`, GIT_OPTIONAL_LOCKS=0 or not, so both calls
# run with `-c core.fsmonitor=false`. The rows use a fresh marked worktree
# (wtG), added here and removed at the end of the section, so the start-record
# line counts and skip lists of the other rows keep their exact content.
git -C "$MAIN" worktree add -q "$TMP/wtG" -b gflag
printf 'marker\n' > "$TMP/wtG/.war-task"
WTG="$(cd "$TMP/wtG" && pwd -P)"
GDG="$(git -C "$TMP/wtG" rev-parse --path-format=absolute --git-dir)"
printf 'au1\n' > "$TMP/wtG/au"
printf 'sw1\n' > "$TMP/wtG/sw"
printf 'fl1\n' > "$TMP/wtG/fl"
printf 'bo1\n' > "$TMP/wtG/bo"
printf 'qz1\n' > "$TMP/wtG/q\"z"
git -C "$TMP/wtG" add au sw fl bo 'q"z'
git -C "$TMP/wtG" commit -q -m flags
git -C "$TMP/wtG" update-index --assume-unchanged au
git -C "$TMP/wtG" update-index --skip-worktree sw
git -C "$TMP/wtG" update-index --assume-unchanged bo
git -C "$TMP/wtG" update-index --skip-worktree bo
git -C "$TMP/wtG" update-index --assume-unchanged 'q"z'
# Oracle, independent of the hook: after an edit to each flagged file, git
# status lists neither, so a status-only fingerprint cannot see the edits.
printf 'au2\n' >> "$TMP/wtG/au"
printf 'sw2\n' >> "$TMP/wtG/sw"
if [ -z "$(git -C "$TMP/wtG" status --porcelain=v1 -uall)" ] \
   && [ "$(git -C "$TMP/wtG" ls-files -v au sw)" = "$(printf 'h au\nS sw')" ]; then
  pass "oracle: git status lists no edited assume-unchanged or skip-worktree path"
else
  fail "oracle vacuous: status=|$(git -C "$TMP/wtG" status --porcelain=v1 -uall)| ls-files=|$(git -C "$TMP/wtG" ls-files -v au sw)|"
fi
run "$(mk_start "$AUD" g1)"
run "$(mk_read "$AUD" g1 "$TMP/wtG/au")"
printf 'au3\n' >> "$TMP/wtG/au"
if escalates_on g1 "$WTG"; then pass "an assume-unchanged edit escalates as changed during the audit round"; else fail "assume-unchanged edit not caught (rc=$RC out=|$OUT| err=|$ERR|)"; fi
run "$(mk_start "$AUD" g2)"
run "$(mk_read "$AUD" g2 "$TMP/wtG/sw")"
printf 'sw3\n' >> "$TMP/wtG/sw"
if escalates_on g2 "$WTG"; then pass "a skip-worktree edit escalates as changed during the audit round"; else fail "skip-worktree edit not caught (rc=$RC out=|$OUT| err=|$ERR|)"; fi
# Both flags on one path: ls-files -v tags it `s` (lowercase S), caught by
# the `[[:lower:]]` class, not the `S` arm. Oracle first, so the row cannot
# pass through the `h` or `S` tag alone.
if [ "$(git -C "$TMP/wtG" ls-files -v bo)" = "s bo" ]; then
  pass "oracle: a path with both flags is tagged s"
else
  fail "oracle vacuous: ls-files=|$(git -C "$TMP/wtG" ls-files -v bo)|"
fi
run "$(mk_start "$AUD" g2b)"
run "$(mk_read "$AUD" g2b "$TMP/wtG/bo")"
printf 'bo2\n' >> "$TMP/wtG/bo"
if escalates_on g2b "$WTG"; then pass "a both-flags (assume-unchanged and skip-worktree) edit escalates"; else fail "both-flags edit not caught (rc=$RC out=|$OUT| err=|$ERR|)"; fi
# A flagged path whose name needs C-quoting: plain `ls-files -v` prints it
# as `h "q\"z"`, so a newline-mode read would hash a name that does not
# exist and the real path would escape the flagged set. The hook's
# `ls-files -v -z` carries the name raw. Oracle first, so the row cannot
# pass on a name plain output leaves untouched.
if git -C "$TMP/wtG" ls-files -v | grep -Fxq 'h "q\"z"'; then
  pass "oracle: plain ls-files -v C-quotes a flagged path with a double quote"
else
  fail "oracle vacuous: ls-files=|$(git -C "$TMP/wtG" ls-files -v)|"
fi
run "$(mk_start "$AUD" g2c)"
run "$(mk_read "$AUD" g2c "$TMP/wtG/au")"
printf 'qz2\n' >> "$TMP/wtG/q\"z"
if escalates_on g2c "$WTG"; then pass "an edit to a flagged path whose name needs C-quoting escalates (ls-files -z carries it raw)"; else fail "C-quoted flagged path edit not caught (rc=$RC out=|$OUT| err=|$ERR|)"; fi
# A flag set mid-round, with no edit, changes the fingerprint too: the flagged
# set is inside the hashed data, so a writer cannot flag a file between the
# start and the verdict arm and edit it unseen afterwards.
run "$(mk_start "$AUD" g3)"
run "$(mk_read "$AUD" g3 "$TMP/wtG/fl")"
git -C "$TMP/wtG" update-index --assume-unchanged fl
if escalates_on g3 "$WTG"; then pass "a flag set mid-round escalates (the flagged set is hashed)"; else fail "mid-round flag not caught (rc=$RC out=|$OUT| err=|$ERR|)"; fi
# Negative control: the flagged and edited paths stay as they are, nothing
# moves, and the verdict passes, so the rows above fail on the edit or the
# flag alone.
run "$(mk_start "$AUD" g4)"
run "$(mk_read "$AUD" g4 "$TMP/wtG/au")"
run "$(mk_verdict "$AUD" g4)"
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then pass "an unchanged worktree with flagged paths passes"; else fail "unchanged flagged worktree did not pass (rc=$RC out=|$OUT| err=|$ERR|)"; fi
# A fsmonitor hook that writes a sentinel, configured for the marked worktrees
# (the repository config they share, set and unset in this window). One fixture
# `git status` with fsmonitor on and optional locks allowed (unset at the top)
# runs the hook and writes the fsmonitor extension (`FSMN`) into wtG's index,
# which still carries the flagged paths, so the hook's `ls-files` call is
# reached with every input that would run the command. The hook script lives
# in the fixture's mktemp dir. Red without `-c core.fsmonitor=false` on the
# status call or on the ls-files call.
FSMON="$TMP/fsmon-hook"
cat > "$FSMON" <<FSM
#!/bin/sh
printf 'ran %s\n' "\$*" >> "$TMP/fsmon-ran"
printf 'tok\0/\0'
FSM
chmod +x "$FSMON"
git -C "$MAIN" config core.fsmonitor "$FSMON"
rm -f "$TMP/fsmon-ran"
git -C "$TMP/wtG" status --porcelain=v1 >/dev/null 2>&1
_fsmon_status=$([ -s "$TMP/fsmon-ran" ] && echo yes || echo no)
# A plain ls-files (no override) must run the hook too, or row g5 could not
# go red on a missing override on the hook's ls-files call. ls-files writes
# no index, so row g5 sees the same index and sentinel state either way.
rm -f "$TMP/fsmon-ran"
git -C "$TMP/wtG" ls-files -v >/dev/null 2>&1
_fsmon_lsfiles=$([ -s "$TMP/fsmon-ran" ] && echo yes || echo no)
if [ "$_fsmon_status" = yes ] && [ "$_fsmon_lsfiles" = yes ] && LC_ALL=C grep -aq FSMN "$GDG/index" \
   && git -C "$TMP/wtG" -c core.fsmonitor=false ls-files -v | grep -q '^[[:lower:]] '; then
  pass "oracle: the fixture fsmonitor hook runs under a plain git status and under a plain git ls-files, and wtG's index carries an fsmonitor extension and a flagged path"
else
  fail "oracle vacuous: status-ran=$_fsmon_status ls-files-ran=$_fsmon_lsfiles fsmn=$(LC_ALL=C grep -ac FSMN "$GDG/index") ls-files=|$(git -C "$TMP/wtG" -c core.fsmonitor=false ls-files -v)|"
fi
rm -f "$TMP/fsmon-ran"
run "$(mk_start "$AUD" g5)"
_g5s="$RC"
run "$(mk_read "$AUD" g5 "$TMP/wtG/au")"
run "$(mk_verdict "$AUD" g5)"
if [ "$_g5s" = 0 ] && [ "$RC" = 0 ] && [ -z "$OUT" ] && grep -Fq " $WTG" "$FP_ROOT/g5/start" && [ ! -e "$TMP/fsmon-ran" ]; then
  pass "a configured fsmonitor hook never runs during the start or verdict arm"
else
  fail "fsmonitor hook ran or the round failed (start rc=$_g5s rc=$RC out=|$OUT| ran=|$(cat "$TMP/fsmon-ran" 2>/dev/null)| start=|$(cat "$FP_ROOT/g5/start" 2>/dev/null)|)"
fi
git -C "$MAIN" config --unset core.fsmonitor
git -C "$MAIN" worktree remove --force "$TMP/wtG"
git -C "$MAIN" branch -q -D gflag
# The untracked cache is git's own change detection for untracked files: a
# stale cache can hide a new file from status. A4: a structural row on the
# status call is the expected form (a hide needs a non-default config stack).
# Every code line that runs `status --porcelain` carries both overrides.
_st="$(grep -E '^[^#]*git .*status --porcelain' "$HOOK")"
_stn="$(printf '%s\n' "$_st" | grep -c .)"
_stok="$(printf '%s\n' "$_st" | grep -F -e '-c core.fsmonitor=false' | grep -cF -e '-c core.untrackedCache=false')"
if [ -n "$_st" ] && [ "$_stn" = "$_stok" ]; then
  pass "the status scan runs with the untracked cache off (structural: core.untrackedCache=false and core.fsmonitor=false on every status call)"
else
  fail "a status call runs with the untracked cache or fsmonitor on: |$_st|"
fi

# --- unverifiable fingerprint escalates --------------------------------------
run "$(mk_read "$AUD" a9 "$TMP/wtA/f")"
run "$(mk_verdict "$AUD" a9)"
ver="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: unverifiable fingerprint ("*")") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$ver" = escalate ] && [ "$p" = 1 ] && [ -f "$TAMPER_ROOT/a9.json" ]; then
  pass "unverifiable fingerprint escalates"
else
  fail "unverifiable fingerprint escalates (rc=$RC ver=$ver rsn=|$rsn| rec=$([ -f "$TAMPER_ROOT/a9.json" ] && echo present || echo absent))"
fi
# No agent_id at verdict time is unverifiable too.
run "$(jq -nc --arg at "$AUD" --arg c "$MAIN" '{hook_event_name:"PreToolUse",agent_type:$at,tool_name:"StructuredOutput",tool_input:{verdict:"approve"},cwd:$c}')"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: unverifiable fingerprint (no agent_id"*) pass "missing agent_id at verdict time escalates as unverifiable" ;; *) fail "missing agent_id not caught: |$OUT|" ;; esac
# A rejected agent_id (a separator or traversal in it) is unverifiable too,
# named as unsafe, and never keys a state path outside the fingerprint root.
run "$(mk_start "$AUD" '../esc')"
run "$(mk_verdict "$AUD" '../esc')"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
ver="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: unverifiable fingerprint (unsafe agent_id"*) p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$ver" = escalate ] && [ "$p" = 1 ] && [ ! -e "$MAIN/.claude/war/esc" ]; then
  pass "a traversal agent_id escalates as unsafe and writes no state outside the fingerprint root"
else
  fail "traversal agent_id not rejected (rc=$RC ver=$ver rsn=|$rsn| esc=$([ -e "$MAIN/.claude/war/esc" ] && echo present || echo absent))"
fi
# A git error on a touched worktree (its .git link removed) is unverifiable.
run "$(mk_start "$AUD" a4)"
run "$(mk_read "$AUD" a4 "$TMP/wtD/f")"
rm -f "$TMP/wtD/.git"
run "$(mk_verdict "$AUD" a4)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: unverifiable fingerprint (git error on $WTD)") pass "a git error on a touched worktree escalates as unverifiable" ;; *) fail "git error not caught: |$OUT| err=|$ERR|" ;; esac
# A marked worktree whose start fingerprint fails (wtD, .git link gone) is
# skipped by the start arm; a touch on it then has no start record.
# The seat touches clean wtA first, so a record that carried the previous
# worktree's start or now fingerprint would show a fabricated mismatch.
run "$(mk_start "$AUD" t7)"
run "$(mk_read "$AUD" t7 "$TMP/wtA/f")"
run "$(mk_read "$AUD" t7 "$TMP/wtD/f")"
run "$(mk_verdict "$AUD" t7)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
if [ -f "$FP_ROOT/t7/start" ] && ! grep -Fq " $WTD" "$FP_ROOT/t7/start" && [ "$rsn" = "AUDIT-TAMPER: unverifiable fingerprint (no start record for $WTD)" ]; then
  pass "a touched worktree the start arm could not fingerprint escalates as no start record"
else
  fail "start-arm skip not caught: rsn=|$rsn| start=|$(cat "$FP_ROOT/t7/start" 2>/dev/null)|"
fi
rec="$TAMPER_ROOT/t7.json"
if [ "$(jq -r '.worktree' "$rec" 2>/dev/null)" = "$WTD" ] && [ -z "$(jq -r '.start' "$rec" 2>/dev/null)" ] && [ -z "$(jq -r '.now' "$rec" 2>/dev/null)" ]; then
  pass "an unverifiable record carries no start or now fingerprint from a previous worktree"
else
  fail "unverifiable record carries stale fingerprints: $(cat "$rec" 2>/dev/null)"
fi

# --- subagent stop records a mismatch without blocking -----------------------
run "$(mk_start "$AUD" a5)"
run "$(mk_read "$AUD" a5 "$TMP/wtA/f")"
printf 'late change\n' >> "$TMP/wtA/f"
run "$(mk_stop "$AUD" a5)"
rec="$TAMPER_ROOT/a5.json"
if [ "$RC" = 0 ] && [ -z "$OUT" ] && [ -f "$rec" ] && [ "$(jq -r '.event' "$rec")" = SubagentStop ] \
   && [ "$(jq -r '.reason' "$rec" | cut -c1-13)" = "AUDIT-TAMPER:" ]; then
  pass "subagent stop records a mismatch without blocking"
else
  fail "subagent stop records a mismatch without blocking (rc=$RC out=|$OUT| rec=$(cat "$rec" 2>/dev/null))"
fi
run "$(mk_start "$AUD" a7)"
run "$(mk_read "$AUD" a7 "$TMP/wtA/f")"
run "$(mk_stop "$AUD" a7)"
if [ "$RC" = 0 ] && [ -z "$OUT" ] && [ ! -f "$TAMPER_ROOT/a7.json" ]; then
  pass "subagent stop on an unchanged worktree writes no record"
else
  fail "clean stop wrote a record or failed (rc=$RC out=|$OUT|)"
fi
# A rewritten verdict's record outlives the stop: the stop arm never replaces
# a PreToolUse:StructuredOutput record with its own.
run "$(mk_start "$AUD" a6)"
run "$(mk_read "$AUD" a6 "$TMP/wtA/f")"
printf 'late change\n' >> "$TMP/wtA/f"
run "$(mk_verdict "$AUD" a6)"
ver="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
rec="$TAMPER_ROOT/a6.json"
vrec="$(cat "$rec" 2>/dev/null)"
run "$(mk_stop "$AUD" a6)"
if [ "$ver" = escalate ] && [ "$RC" = 0 ] && [ -z "$OUT" ] && [ "$(jq -r '.event' "$rec")" = "PreToolUse:StructuredOutput" ] && [ "$(cat "$rec")" = "$vrec" ]; then
  pass "subagent stop keeps the verdict-time tamper record"
else
  fail "subagent stop replaced the verdict-time record (ver=$ver rc=$RC rec=$(cat "$rec" 2>/dev/null))"
fi

# --- the hook's own deadline (Task 7.2, ruling 2026-10-24) -------------------
# Claude Code kills a hook at its hooks.json timeout and the verdict then
# passes unchecked. The hook keeps a shorter deadline of its own (540 s by
# default, WAR_FINGERPRINT_DEADLINE_SECONDS when set) and, on hitting it,
# stops hashing and escalates with a reason that starts `AUDIT-TAMPER:
# fingerprint timeout`. A deadline of 0 expires before the first worktree.
# The payload is built BEFORE the env override, so only the run under test
# sees the variable.
run "$(mk_start "$AUD" d1)"
run "$(mk_read "$AUD" d1 "$TMP/wtA/f")"
_p="$(mk_verdict "$AUD" d1)"
export WAR_FINGERPRINT_DEADLINE_SECONDS=0
run "$_p"
unset WAR_FINGERPRINT_DEADLINE_SECONDS
ver="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
rec="$TAMPER_ROOT/d1.json"
# The verdict arm appends the seat's own verdict (`; seat verdict <v>`) to a
# timeout reason: the reason rides the engine's audit log, which no worker can
# write, so the Lead can cross-check the worker-writable tamper record.
case "$rsn" in "AUDIT-TAMPER: fingerprint timeout ("*"$WTA"*" after "[0-9]*"s, deadline 0s; seat verdict approve)") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$ver" = escalate ] && [ "$p" = 1 ] && [ "$(jq -r '.timeout' "$rec" 2>/dev/null)" = true ] && [ "$(jq -r '.worktree' "$rec" 2>/dev/null)" = "$WTA" ]; then
  pass "fingerprint timeout escalates with a timeout reason"
else
  fail "fingerprint timeout escalates with a timeout reason (rc=$RC ver=$ver rsn=|$rsn| rec=$(cat "$rec" 2>/dev/null))"
fi
# The rewrite replaces the seat's verdict in the tool input, so the record
# keeps it: a fail-open ruling accepts `seat_verdict` as the round's verdict.
if [ "$(jq -r '.seat_verdict' "$rec" 2>/dev/null)" = approve ] && [ "$(jq -r '.seat_escalate_reason' "$rec" 2>/dev/null)" = null ]; then
  pass "a timeout record keeps the seat's own verdict as seat_verdict"
else
  fail "seat_verdict not kept on the timeout record: $(cat "$rec" 2>/dev/null)"
fi
# A seat that returned escalate itself keeps its verdict and its reason.
run "$(mk_start "$AUD" d1b)"
run "$(mk_read "$AUD" d1b "$TMP/wtA/f")"
_p="$(mk_tool "$AUD" d1b StructuredOutput '{"verdict":"escalate","escalate_reason":"seat reason","findings":[]}')"
export WAR_FINGERPRINT_DEADLINE_SECONDS=0
run "$_p"
unset WAR_FINGERPRINT_DEADLINE_SECONDS
rec="$TAMPER_ROOT/d1b.json"
if [ "$(jq -r '.seat_verdict' "$rec" 2>/dev/null)" = escalate ] && [ "$(jq -r '.seat_escalate_reason' "$rec" 2>/dev/null)" = "seat reason" ]; then
  pass "a timeout record keeps a seat-authored escalate and its escalate_reason"
else
  fail "seat-authored escalate not kept: $(cat "$rec" 2>/dev/null)"
fi
# The suffix prints only a verdict from the schema enum (approve,
# request_changes, escalate); any other value, a crafted one included, prints
# `unparsed`, so a seat cannot write text of its own into the reason.
run "$(mk_start "$AUD" d1c)"
run "$(mk_read "$AUD" d1c "$TMP/wtA/f")"
_p="$(mk_tool "$AUD" d1c StructuredOutput '{"verdict":"approve) x","findings":[]}')"
export WAR_FINGERPRINT_DEADLINE_SECONDS=0
run "$_p"
unset WAR_FINGERPRINT_DEADLINE_SECONDS
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: fingerprint timeout ("*"; seat verdict unparsed)") pass "a crafted seat verdict prints as unparsed in the timeout reason" ;; *) fail "seat verdict sanitizer missing: rsn=|$rsn|" ;; esac
# The stop arm records the same timeout and never blocks.
run "$(mk_start "$AUD" d2)"
run "$(mk_read "$AUD" d2 "$TMP/wtA/f")"
_p="$(mk_stop "$AUD" d2)"
export WAR_FINGERPRINT_DEADLINE_SECONDS=0
run "$_p"
unset WAR_FINGERPRINT_DEADLINE_SECONDS
rec="$TAMPER_ROOT/d2.json"
if [ "$RC" = 0 ] && [ -z "$OUT" ] && [ "$(jq -r '.event' "$rec" 2>/dev/null)" = SubagentStop ] && [ "$(jq -r '.timeout' "$rec" 2>/dev/null)" = true ] \
   && [ "$(jq -r '.reason' "$rec" 2>/dev/null | cut -c1-33)" = "AUDIT-TAMPER: fingerprint timeout" ]; then
  pass "subagent stop records a fingerprint timeout without blocking"
else
  fail "stop-arm timeout record wrong (rc=$RC out=|$OUT| rec=$(cat "$rec" 2>/dev/null))"
fi
if [ "$(jq -r '.seat_verdict' "$rec" 2>/dev/null)" = null ] && [ "$(jq -r '.seat_escalate_reason' "$rec" 2>/dev/null)" = null ]; then
  pass "a stop record carries null seat_verdict and seat_escalate_reason (no tool input)"
else
  fail "stop record seat fields wrong: $(cat "$rec" 2>/dev/null)"
fi
# A start arm that hits the deadline leaves worktrees unrecorded. It writes a
# start marker, so a later verdict on such a worktree names the timeout, never
# `no start record`, and its record carries timeout: true.
_p="$(mk_start "$AUD" d3)"
export WAR_FINGERPRINT_DEADLINE_SECONDS=0
run "$_p"
unset WAR_FINGERPRINT_DEADLINE_SECONDS
run "$(mk_read "$AUD" d3 "$TMP/wtA/f")"
run "$(mk_verdict "$AUD" d3)"
ver="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
rec="$TAMPER_ROOT/d3.json"
# The start ran under a deadline of 0 and the verdict under the default, so the
# reason names the stored start-arm deadline (`deadline 0s;`), never 540.
case "$rsn" in "AUDIT-TAMPER: fingerprint timeout (SubagentStart stopped at $WTA after "[0-9]*"s, deadline 0s; $WTA has no start fingerprint; seat verdict approve)") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$ver" = escalate ] && [ "$p" = 1 ] && [ "$(jq -r '.timeout' "$rec" 2>/dev/null)" = true ]; then
  pass "start timeout yields a timeout reason, not a missing record"
else
  fail "start timeout yields a timeout reason, not a missing record (rc=$RC ver=$ver rsn=|$rsn| rec=$(cat "$rec" 2>/dev/null))"
fi
# A worktree listed after the stop point (wtB, never reached) gets the same
# timeout reason, naming where the start arm stopped, never `no start record`.
_p="$(mk_start "$AUD" d4)"
export WAR_FINGERPRINT_DEADLINE_SECONDS=0
run "$_p"
unset WAR_FINGERPRINT_DEADLINE_SECONDS
run "$(mk_read "$AUD" d4 "$TMP/wtB/f")"
run "$(mk_verdict "$AUD" d4)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: fingerprint timeout (SubagentStart stopped at $WTA after "[0-9]*"s, deadline 0s; $WTB has no start fingerprint; seat verdict approve)") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$p" = 1 ] && [ "$(jq -r '.timeout' "$TAMPER_ROOT/d4.json" 2>/dev/null)" = true ]; then
  pass "a worktree past the start arm's stop point yields the timeout reason, not a missing record"
else
  fail "later-worktree start timeout reason wrong (rc=$RC rsn=|$rsn| rec=$(cat "$TAMPER_ROOT/d4.json" 2>/dev/null))"
fi
# DS1 and DS2: a spent deadline before a submodule list (task_worktrees).
# DS1, a recording arm: a Grep rooted at $MAIN (it holds .git, so the root
# check spawns nothing) walks past the deadline. A logging git shim, apart
# from the hook, shows the .gitmodules read ran, so the walk reached the
# submodule loop, and no `worktree list` ran in `sub dir`. The Grep arm
# leaves its deadline mark. (The Bash arm checks the deadline before each
# token, so it never reaches a walk at deadline 0.) DS2, the start arm: the
# submodule list still runs, so `timeout-skipped` names wtS.
DSG="$TMP/dsg"; mkdir -p "$DSG"
cat > "$DSG/git" <<DSHIM
#!/bin/bash
printf '%s\n' "\$*" >> "$DSG/log"
exec "$(command -v git)" "\$@"
DSHIM
chmod +x "$DSG/git"
run "$(mk_start "$AUD" ds1)"
_p="$(mk_grep "$AUD" ds1 "$MAIN")"
OUT="$(printf '%s' "$_p" | PATH="$DSG:$PATH" WAR_FINGERPRINT_DEADLINE_SECONDS=0 bash "$HOOK" 2>"$TMP/err")"; RC=$?; ERR="$(cat "$TMP/err")"
if [ "$RC" = 0 ] && grep -Fq -- 'config -z -f' "$DSG/log" && ! grep -Fq -- 'sub dir worktree list' "$DSG/log" && touched_has ds1 '!deadline passed on a Grep call'; then
  pass "DS1: a Grep walk past the deadline runs no submodule list and leaves the deadline mark"
else
  fail "DS1: a Grep walk past the deadline (rc=$RC log=|$(cat "$DSG/log" 2>/dev/null)| touched=|$(cat "$FP_ROOT/ds1/touched" 2>/dev/null)| err=|$ERR|)"
fi
rm -rf "$DSG"
_p="$(mk_start "$AUD" ds2)"
export WAR_FINGERPRINT_DEADLINE_SECONDS=0
run "$_p"
unset WAR_FINGERPRINT_DEADLINE_SECONDS
if [ "$RC" = 0 ] && grep -Fxq -- "$WTS" "$FP_ROOT/ds2/timeout-skipped" 2>/dev/null; then
  pass "DS2: a start arm past the deadline still lists the submodule worktree as skipped"
else
  fail "DS2: start-arm skipped list lacks wtS (rc=$RC skipped=|$(cat "$FP_ROOT/ds2/timeout-skipped" 2>/dev/null)| err=|$ERR|)"
fi
# The default and the clamp are pinned on their code lines, never on a comment
# that names the same number.
if grep -Fq 'WAR_FINGERPRINT_DEADLINE_SECONDS' "$HOOK" && grep -Eq '^case "\$DEADLINE" in .*\) DEADLINE=540 ;; esac$' "$HOOK"; then
  pass "hook reads WAR_FINGERPRINT_DEADLINE_SECONDS and defaults to 540 seconds"
else
  fail "hook deadline literal or env name missing"
fi
if grep -Fq '[ "$DEADLINE" -lt 600 ] 2>/dev/null || DEADLINE=540' "$HOOK"; then
  pass "hook clamps the deadline override under 600 on its code line"
else
  fail "hook clamp line missing"
fi
# A non-integer override falls back to the default and an untouched worktree
# still passes under it.
run "$(mk_start "$AUD" d5a)"
run "$(mk_read "$AUD" d5a "$TMP/wtB/f")"
_p="$(mk_verdict "$AUD" d5a)"
OUT="$(printf '%s' "$_p" | WAR_FINGERPRINT_DEADLINE_SECONDS=abc bash "$HOOK" 2>/dev/null)"; RC=$?
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then pass "a non-integer deadline override falls back to the default and passes an untouched worktree"; else fail "non-integer override not tolerated (rc=$RC out=|$OUT|)"; fi
# An override of 600 or more would let Claude Code kill the hook at the
# hooks.json timeout and pass the verdict unchecked, so it falls back to 540.
# SECONDS is inherited from the environment (bash counts on from the value),
# so SECONDS=1000 expires any deadline and the reason names the one in force:
# `deadline 540s` with the clamp, `deadline 900s` without it.
run "$(mk_start "$AUD" d5)"
run "$(mk_read "$AUD" d5 "$TMP/wtA/f")"
_p="$(mk_verdict "$AUD" d5)"
OUT="$(printf '%s' "$_p" | SECONDS=1000 WAR_FINGERPRINT_DEADLINE_SECONDS=900 bash "$HOOK" 2>/dev/null)"; RC=$?
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: fingerprint timeout ("*", deadline 540s; seat verdict approve)") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$p" = 1 ]; then
  pass "deadline override at or above 600 is clamped"
else
  fail "deadline override not clamped (rc=$RC rsn=|$rsn|)"
fi
# A leading-zero override passes the digit check and the decimal clamp, but
# bounded's arithmetic would read `08` as octal and fail, so the hook strips
# the zeros once after the clamp. Two arms: an untouched worktree still passes
# under `08`, and an expired `09` names the stripped value in the reason.
run "$(mk_start "$AUD" d5b)"
run "$(mk_read "$AUD" d5b "$TMP/wtB/f")"
_p="$(mk_verdict "$AUD" d5b)"
OUT="$(printf '%s' "$_p" | WAR_FINGERPRINT_DEADLINE_SECONDS=08 bash "$HOOK" 2>/dev/null)"; RC=$?
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then pass "a leading-zero deadline override passes an untouched worktree"; else fail "leading-zero override not tolerated (rc=$RC out=|$OUT|)"; fi
run "$(mk_start "$AUD" d5c)"
run "$(mk_read "$AUD" d5c "$TMP/wtA/f")"
_p="$(mk_verdict "$AUD" d5c)"
OUT="$(printf '%s' "$_p" | SECONDS=1000 WAR_FINGERPRINT_DEADLINE_SECONDS=09 bash "$HOOK" 2>/dev/null)"; RC=$?
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: fingerprint timeout ("*", deadline 9s; seat verdict approve)") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$p" = 1 ]; then
  pass "a leading-zero deadline override is read as decimal in the timeout reason"
else
  fail "leading-zero override not read as decimal (rc=$RC rsn=|$rsn|)"
fi
# --- the per-call watchdog (Task 8.1, ruling A, 2026-10-24) ------------------
# The deadline rows above expire at a pre-check. These rows cross the deadline
# INSIDE a git call: a `git` shim runs the real git and then sleeps SHIM_NAP
# seconds on the status call whose arguments carry SHIM_SLOW (`<worktree>
# status`), or on the hash-object or ls-files call whose arguments carry it
# (`<worktree> hash-object ...`, `<worktree> ls-files`), or
# fails before git runs when they carry SHIM_FAIL, or kills itself with
# SIGTERM before git runs when they carry SHIM_TERM. SHIM_DELAY is the load
# stand-in (#2615): a status call whose arguments carry it waits 3 s, then
# goes on to the arms above. SHIM_BLOCK stubs any other git call to block: a
# call whose arguments carry it sleeps SHIM_NAP before git runs (the BD rows,
# one per git call PIN-15 put under bounded). The hook must kill the slow
# call at its deadline (SHIM_D) instead of waiting for it, so each row also
# bounds its own wall time: a killed call ends near SHIM_D, a call left to
# run takes at least SHIM_NAP, and SHIM_CAP sits between them. The shim is on
# PATH for the run under test only; the payload builders use the real jq and
# git.
# The deadline is SHIM_D = 10 s, never 2 s (#2615, operator ruling
# 2026-11-08): under a loaded gate the real git calls before the slowed one
# outran a 2 s budget, and the watchdog fired at the wrong worktree. The
# deadline is real time and the hook offers no other clock, so a row whose
# slowed call is killed waits SHIM_D. Those rows run their hook in one
# parallel wave (shim_bg, then wait), so the block waits SHIM_D once.
SHIM_D=10
SHIM_NAP=30
SHIM_CAP=20
REALGIT="$(command -v git)"
SHIMG="$(mktemp -d 2>/dev/null || mktemp -d -t atfpshimg)"
cat > "$SHIMG/git" <<SHIM
#!/bin/bash
if [ -n "\${SHIM_BLOCK-}" ]; then case "\$*" in *"\$SHIM_BLOCK"*) sleep $SHIM_NAP ;; esac; fi
case " \$* " in
  *" status "*)
    if [ -n "\${SHIM_DELAY-}" ]; then case "\$*" in *"\$SHIM_DELAY"*) sleep 3 ;; esac; fi
    if [ -n "\${SHIM_FAIL-}" ]; then case "\$*" in *"\$SHIM_FAIL"*) exit 128 ;; esac; fi
    if [ -n "\${SHIM_TERM-}" ]; then case "\$*" in *"\$SHIM_TERM"*) kill -TERM \$\$; sleep 5; exit 1 ;; esac; fi
    if [ -n "\${SHIM_SLOW-}" ]; then case "\$*" in *"\$SHIM_SLOW"*) "$REALGIT" "\$@"; _rc=\$?; sleep $SHIM_NAP; exit \$_rc ;; esac; fi ;;
  *" hash-object "*)
    if [ -n "\${SHIM_SLOW-}" ]; then case "\$*" in *"\$SHIM_SLOW"*) "$REALGIT" "\$@"; _rc=\$?; sleep $SHIM_NAP; exit \$_rc ;; esac; fi ;;
  *" ls-files "*)
    if [ -n "\${SHIM_FAIL-}" ]; then case "\$*" in *"\$SHIM_FAIL"*) exit 128 ;; esac; fi
    if [ -n "\${SHIM_SLOW-}" ]; then case "\$*" in *"\$SHIM_SLOW"*) "$REALGIT" "\$@"; _rc=\$?; sleep $SHIM_NAP; exit \$_rc ;; esac; fi ;;
esac
exec "$REALGIT" "\$@"
SHIM
chmod +x "$SHIMG/git"
# run_shim <payload>: like run, under the shim PATH and the SHIM_D deadline;
# sets EL to the wall seconds the hook took. SHIM_TAG keeps a parallel run's
# stderr file apart. SHIM_CWD, when set, is the hook's own working directory.
run_shim() {
  _t0=$SECONDS
  OUT="$(cd "${SHIM_CWD:-.}" && printf '%s' "$1" | PATH="$SHIMG:$PATH" WAR_FINGERPRINT_DEADLINE_SECONDS=$SHIM_D bash "$HOOK" 2>"$TMP/err${SHIM_TAG-}")"; RC=$?
  EL=$((SECONDS - _t0))
  ERR="$(cat "$TMP/err${SHIM_TAG-}")"
}
# shim_bg <tag> <payload>: run_shim in the background, with the caller's
# SHIM_* assignments; shim_get <tag> (after wait) sets OUT, RC, EL and ERR
# from it. A run that left no result reads as RC=x, which fails its row.
shim_bg() {
  ( SHIM_TAG=".$1"; run_shim "$2"; printf '%s' "$OUT" > "$TMP/bg.$1.out"; printf '%s %s\n' "$RC" "$EL" > "$TMP/bg.$1.rc" ) &
}
shim_get() {
  OUT="$(cat "$TMP/bg.$1.out" 2>/dev/null)"; ERR="$(cat "$TMP/err.$1" 2>/dev/null)"
  RC=x; EL=x; read -r RC EL < "$TMP/bg.$1.rc" 2>/dev/null || { RC=x; EL=x; }
}
# The wave. (1c) needs an untracked name ending in CR in wtA, so the name is
# made before every row's start record and removed after row (3). Each row
# then sees the same wtA from its start record to its verdict. (1b) slows
# only the batched `--stdin-paths` call, so the CR name's own call runs at
# full speed there.
printf 'cr\n' > "$TMP/wtA/$CRN"
run "$(mk_start "$AUD" d6)"
run "$(mk_read "$AUD" d6 "$TMP/wtA/f")"
_p6="$(mk_verdict "$AUD" d6)"
run "$(mk_start "$AUD" d6b)"
run "$(mk_read "$AUD" d6b "$TMP/wtA/f")"
_p6b="$(mk_verdict "$AUD" d6b)"
run "$(mk_start "$AUD" d6c)"
run "$(mk_read "$AUD" d6c "$TMP/wtA/f")"
_p6c="$(mk_verdict "$AUD" d6c)"
run "$(mk_start "$AUD" d6e)"
run "$(mk_read "$AUD" d6e "$TMP/wtA/f")"
_p6e="$(mk_verdict "$AUD" d6e)"
_p7="$(mk_start "$AUD" d7)"
_p8="$(mk_start "$AUD" d8)"
# The BD rows (PIN-15): each stubs one newly bounded git call to block
# (SHIM_BLOCK). bd1 to bd5b block a call inside fingerprint or a walk helper,
# and the hook takes its return-3 path: the timeout reason, or the Bash or
# Grep arm's `deadline passed` mark. bd6 and bd7 block the common-dir probe
# (main_common at the top, main_find on the jq-failed Bash path, whose payload
# carries no cwd), and the hook exits 0 with MAIN empty: no state dir, no
# record. Every row ends inside SHIM_CAP, so no blocked call ran to its end.
run "$(mk_start "$AUD" bd1)"
run "$(mk_read "$AUD" bd1 "$TMP/wtA/f")"
_pb1="$(mk_verdict "$AUD" bd1)"
mkdir -p "$TMP/bde" "$MAIN/bdir"
for _b in bd2 bd3 bd4 bd5; do run "$(mk_start "$AUD" $_b)"; done
PCWD="$TMP/wtC"
_pb2="$(mk_bash "$AUD" bd2 "git diff $TMP $TMP/bde")"
_pb3="$(mk_bash "$AUD" bd3 "git diff $TMP $TMP/bde")"
PCWD="$MAIN"
_pb4="$(mk_bash "$AUD" bd4 "git -C $MAIN log -1 --oneline -- bdir")"
_pb5="$(mk_grep "$AUD" bd5 "$TMP")"
# bd5b: a Grep rooted at a repository top ($BDR holds .git, so ignored_dir
# answers the root without a spawn). The first check-ignore is the inner
# folder $BDR/in on the path down to the marked worktree $BDR/in/wtR.
BDR="$TMP/bdr"
git init -q "$BDR" && git -C "$BDR" commit -q --allow-empty -m i
git -C "$BDR" worktree add -q "$BDR/in/wtR" -b r
printf '.war-task\n' >> "$BDR/.git/info/exclude"
printf 'marker\n' > "$BDR/in/wtR/.war-task"
WTR="$(cd "$BDR/in/wtR" && pwd -P)"
PCWD="$BDR"
run "$(mk_start "$AUD" bd5b)"
_pb5b="$(mk_grep "$AUD" bd5b "$BDR")"
PCWD="$MAIN"
_pb6="$(mk_read "$AUD" bd6 "$TMP/wtA/f")"
_pb7="$(jq -nc --arg at "$AUD" '{hook_event_name:"PostToolUse",agent_type:$at,agent_id:"bd7",tool_name:"Bash",tool_input:{command:"git log -1"}}')"
SHIM_BLOCK="$WTA rev-parse HEAD" shim_bg bd1 "$_pb1"
SHIM_BLOCK="worktree list --porcelain" shim_bg bd2 "$_pb2"
SHIM_BLOCK="config -z -f" shim_bg bd3 "$_pb3"
SHIM_BLOCK="rev-parse --show-toplevel" shim_bg bd4 "$_pb4"
SHIM_BLOCK="check-ignore" shim_bg bd5 "$_pb5"
SHIM_BLOCK="check-ignore" shim_bg bd5b "$_pb5b"
SHIM_BLOCK="--git-common-dir" shim_bg bd6 "$_pb6"
SHIM_CWD="$MAIN" SHIM_BLOCK="--git-common-dir" shim_bg bd7 "$_pb7"
SHIM_SLOW="$WTA status" shim_bg d6 "$_p6"
SHIM_SLOW="$WTA hash-object --no-filters --stdin-paths" shim_bg d6b "$_p6b"
SHIM_SLOW="$WTA hash-object --no-filters -- " shim_bg d6c "$_p6c"
SHIM_SLOW="$WTA ls-files" shim_bg d6e "$_p6e"
SHIM_DELAY="$WTA status" SHIM_SLOW="$WTB status" shim_bg d7 "$_p7"
SHIM_DELAY="$WTB status" SHIM_FAIL="$WTA status" SHIM_SLOW="$WTS status" shim_bg d8 "$_p8"
wait
# (1) The verdict arm: wtA is dirty (f modified above), so its fingerprint
# runs status. The slow status is killed at the deadline, the hook returns
# before SHIM_CAP, and the reason names the hashing step.
shim_get d6
ver="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
rec="$TAMPER_ROOT/d6.json"
case "$rsn" in "AUDIT-TAMPER: fingerprint timeout ($WTA still hashing after "[0-9]*"s, deadline ${SHIM_D}s; seat verdict approve)") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$ver" = escalate ] && [ "$p" = 1 ] && [ "$EL" -lt "$SHIM_CAP" ] && [ "$(jq -r '.timeout' "$rec" 2>/dev/null)" = true ]; then
  pass "watchdog kills a slow git call at the deadline"
else
  fail "watchdog kills a slow git call at the deadline (rc=$RC ver=$ver el=${EL}s rsn=|$rsn| err=|$ERR| rec=$(cat "$rec" 2>/dev/null))"
fi
# (1b) The hash-object watchdog: wtA's status is fast, and its modified `f`
# goes to the batched `hash-object --stdin-paths` call, which the shim slows.
# The kill lands inside blob_lines (bounded is shared, so a direct hash-object
# call would wait the full SHIM_NAP), and the reason names the hashing step.
shim_get d6b
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: fingerprint timeout ($WTA still hashing after "[0-9]*"s, deadline ${SHIM_D}s; seat verdict approve)") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$p" = 1 ] && [ "$EL" -lt "$SHIM_CAP" ]; then
  pass "watchdog kills a slow hash-object call at the deadline"
else
  fail "watchdog kills a slow hash-object call at the deadline (rc=$RC el=${EL}s rsn=|$rsn| err=|$ERR|)"
fi
# (1c) The single-path hash-object arm: the untracked CR name in wtA gets its
# own `hash-object --no-filters -- <path>` call, which runs inside the record
# loop before the batch (wtA's modified `f` is still queued for it). The shim
# slows only that call (the trailing space after `--` leaves the batch out),
# the kill lands in the single-path arm, and the hook returns before SHIM_CAP.
shim_get d6c
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: fingerprint timeout ($WTA still hashing after "[0-9]*"s, deadline ${SHIM_D}s; seat verdict approve)") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$p" = 1 ] && [ "$EL" -lt "$SHIM_CAP" ]; then
  pass "watchdog kills a slow single-path hash-object call at the deadline"
else
  fail "watchdog kills a slow single-path hash-object call at the deadline (rc=$RC el=${EL}s rsn=|$rsn| err=|$ERR|)"
fi
# (1d) A SIGTERM that is not the watchdog's: the shim kills itself on wtA's
# status before the deadline. The hook reads that as a git error (the
# `unverifiable fingerprint (git error on ...)` reason, `timeout: false`),
# never as the timeout reason, which offers the Lead a fail-open ruling.
# Oracle, independent of the hook: the row's wall time stays under the
# SHIM_D deadline, so no watchdog could have fired.
run "$(mk_start "$AUD" d6d)"
run "$(mk_read "$AUD" d6d "$TMP/wtA/f")"
_p="$(mk_verdict "$AUD" d6d)"
SHIM_TERM="$WTA status" run_shim "$_p"
ver="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
if [ "$RC" = 0 ] && [ "$ver" = escalate ] && [ "$rsn" = "AUDIT-TAMPER: unverifiable fingerprint (git error on $WTA)" ] && [ "$EL" -lt "$SHIM_D" ] && [ "$(jq -r '.timeout' "$TAMPER_ROOT/d6d.json" 2>/dev/null)" = false ]; then
  pass "a SIGTERM before the deadline is a git error, never the timeout reason"
else
  fail "a SIGTERM before the deadline is a git error, never the timeout reason (rc=$RC ver=$ver el=${EL}s rsn=|$rsn| err=|$ERR| rec=$(cat "$TAMPER_ROOT/d6d.json" 2>/dev/null))"
fi
# (1e) The ls-files watchdog: the flagged-path scan (`ls-files -v -z`) runs
# under bounded like status and hash-object, so a slow ls-files on wtA is
# killed at the deadline, the hook returns before SHIM_CAP, and the reason is
# the fingerprint timeout naming the hashing step.
shim_get d6e
ver="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: fingerprint timeout ($WTA still hashing after "[0-9]*"s, deadline ${SHIM_D}s; seat verdict approve)") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$ver" = escalate ] && [ "$p" = 1 ] && [ "$EL" -lt "$SHIM_CAP" ] && [ "$(jq -r '.timeout' "$TAMPER_ROOT/d6e.json" 2>/dev/null)" = true ]; then
  pass "ls-files watchdog kills a slow git ls-files call at the deadline"
else
  fail "ls-files watchdog kills a slow git ls-files call at the deadline (rc=$RC ver=$ver el=${EL}s rsn=|$rsn| err=|$ERR| rec=$(cat "$TAMPER_ROOT/d6e.json" 2>/dev/null))"
fi
# (1f) A non-timeout ls-files failure: the shim fails wtA's ls-files call
# before git runs, so fingerprint returns 1 and the verdict escalates with
# the git-error reason (`timeout: false`), never an empty flagged set that
# would hash a status-only fingerprint and read as unchanged.
run "$(mk_start "$AUD" d6f)"
run "$(mk_read "$AUD" d6f "$TMP/wtA/f")"
_p="$(mk_verdict "$AUD" d6f)"
SHIM_FAIL="$WTA ls-files" run_shim "$_p"
ver="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
if [ "$RC" = 0 ] && [ "$ver" = escalate ] && [ "$rsn" = "AUDIT-TAMPER: unverifiable fingerprint (git error on $WTA)" ] && [ "$(jq -r '.timeout' "$TAMPER_ROOT/d6f.json" 2>/dev/null)" = false ]; then
  pass "a failing git ls-files call is a git error, never an empty flagged set"
else
  fail "a failing git ls-files call is a git error, never an empty flagged set (rc=$RC ver=$ver rsn=|$rsn| err=|$ERR| rec=$(cat "$TAMPER_ROOT/d6f.json" 2>/dev/null))"
fi
# (2) The start arm: wtA records before the deadline, even though its status
# waits 3 s (the SHIM_DELAY load stand-in), wtB's slow status is killed at
# the deadline, and the marker names wtB with an elapsed value of at least
# the deadline (so it came from the killed call, not a pre-check at 0 s). The
# skipped list is wtB plus every worktree after it (wtD has had no .git since
# row a4 and wtS is the submodule's; the start arm never reached either).
shim_get d7
_m="$(cat "$FP_ROOT/d7/timeout" 2>/dev/null)"; _mn="${_m%% *}"
if [ "$RC" = 0 ] && [ "$EL" -lt "$SHIM_CAP" ] && grep -Fq " $WTA" "$FP_ROOT/d7/start" && ! grep -Fq " $WTB" "$FP_ROOT/d7/start" \
   && [ "$_m" = "$_mn $SHIM_D $WTB" ] && [ "$_mn" -ge "$SHIM_D" ] 2>/dev/null \
   && [ "$(cat "$FP_ROOT/d7/timeout-skipped" 2>/dev/null)" = "$(printf '%s\n%s\n%s' "$WTB" "$WTD" "$WTS")" ]; then
  pass "a start-arm watchdog kill records the stop point and lists every worktree it skipped"
else
  fail "start-arm watchdog kill recorded wrong (rc=$RC el=${EL}s marker=|$_m| start=|$(cat "$FP_ROOT/d7/start" 2>/dev/null)| skipped=|$(cat "$FP_ROOT/d7/timeout-skipped" 2>/dev/null)| err=|$ERR|)"
fi
# A seat that touched only the skipped wtB gets the timeout reason, naming the
# stored start-arm deadline (SHIM_D), under the default verdict-arm deadline.
run "$(mk_read "$AUD" d7 "$TMP/wtB/f")"
run "$(mk_verdict "$AUD" d7)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: fingerprint timeout (SubagentStart stopped at $WTB after "[0-9]*"s, deadline ${SHIM_D}s; $WTB has no start fingerprint; seat verdict approve)") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$p" = 1 ] && [ "$(jq -r '.timeout' "$TAMPER_ROOT/d7.json" 2>/dev/null)" = true ]; then
  pass "a worktree the start-arm watchdog skipped yields the timeout reason with the stored deadline"
else
  fail "skipped-worktree timeout reason wrong (rc=$RC rsn=|$rsn| rec=$(cat "$TAMPER_ROOT/d7.json" 2>/dev/null))"
fi
# The start-arm timeout is pending, never final: the same seat then touches
# the recorded wtA, which changes, and the mismatch wins over the pending
# timeout (the record carries timeout: false), so a fail-open question is
# never offered on a round that proved a change.
run "$(mk_read "$AUD" d7 "$TMP/wtA/f")"
printf 'masked change\n' >> "$TMP/wtA/f"
run "$(mk_verdict "$AUD" d7)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: $WTA changed during the audit round ("*) p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$p" = 1 ] && [ "$(jq -r '.timeout' "$TAMPER_ROOT/d7.json" 2>/dev/null)" = false ]; then
  pass "a start-arm timeout does not mask a later mismatch"
else
  fail "start-arm timeout masked a mismatch (rc=$RC rsn=|$rsn| rec=$(cat "$TAMPER_ROOT/d7.json" 2>/dev/null))"
fi
# (3) A worktree the start arm skipped on a GIT ERROR (status fails for wtA)
# before a later watchdog kill (slow status on wtS, the last one) is not on
# the skipped list, so a verdict that touched it keeps `no start record`,
# never the timeout reason. wtB's status waits 3 s (the SHIM_DELAY load
# stand-in, #2615): under the old 2 s deadline the watchdog then fired at wtB.
shim_get d8
_m="$(cat "$FP_ROOT/d8/timeout" 2>/dev/null)"
run "$(mk_read "$AUD" d8 "$TMP/wtA/f")"
run "$(mk_verdict "$AUD" d8)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
if [ "$_m" = "${_m%% *} $SHIM_D $WTS" ] && [ "$(cat "$FP_ROOT/d8/timeout-skipped" 2>/dev/null)" = "$WTS" ] \
   && [ "$rsn" = "AUDIT-TAMPER: unverifiable fingerprint (no start record for $WTA)" ] && [ "$(jq -r '.timeout' "$TAMPER_ROOT/d8.json" 2>/dev/null)" = false ]; then
  pass "a worktree skipped on a start-arm git error keeps no start record, never the timeout reason"
else
  fail "git-error skip labelled wrong (marker=|$_m| skipped=|$(cat "$FP_ROOT/d8/timeout-skipped" 2>/dev/null)| rsn=|$rsn| start=|$(cat "$FP_ROOT/d8/start" 2>/dev/null)|)"
fi
# BD1: fingerprint's `rev-parse HEAD` blocks; the kill is the timeout reason.
shim_get bd1
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: fingerprint timeout ($WTA still hashing after "[0-9]*"s, deadline ${SHIM_D}s; seat verdict approve)") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$p" = 1 ] && [ "$EL" -lt "$SHIM_CAP" ] && [ "$(jq -r '.timeout' "$TAMPER_ROOT/bd1.json" 2>/dev/null)" = true ]; then
  pass "BD1: a blocked rev-parse HEAD in fingerprint is killed at the deadline (timeout reason)"
else
  fail "BD1: a blocked rev-parse HEAD was not killed at the deadline (rc=$RC el=${EL}s rsn=|$rsn| err=|$ERR|)"
fi
# BD2 to BD4: a blocked call inside a Bash-arm walk helper (the worktree list,
# the .gitmodules read, the show-toplevel probe) is killed, and the Bash arm
# leaves its deadline mark, which the verdict escalates.
for _b in bd2:'worktree list' bd3:'.gitmodules read' bd4:'show-toplevel probe'; do
  _id="${_b%%:*}"; _what="${_b#*:}"; _lbl="BD${_id#bd}"
  shim_get "$_id"
  if [ "$RC" = 0 ] && [ "$EL" -lt "$SHIM_CAP" ] && touched_has "$_id" '!deadline passed on a Bash call'; then
    pass "$_lbl: a blocked $_what on a Bash walk is killed at the deadline and leaves the deadline mark"
  else
    fail "$_lbl: a blocked $_what on a Bash walk was not killed or left no mark (rc=$RC el=${EL}s touched=|$(cat "$FP_ROOT/$_id/touched" 2>/dev/null)| err=|$ERR|)"
  fi
done
# BD5: a blocked check-ignore in the Grep walk is killed, and the Grep arm
# leaves its deadline mark.
shim_get bd5
if [ "$RC" = 0 ] && [ "$EL" -lt "$SHIM_CAP" ] && touched_has bd5 '!deadline passed on a Grep call'; then
  pass "BD5: a blocked check-ignore in the Grep walk is killed at the deadline and leaves the deadline mark"
else
  fail "BD5: a blocked check-ignore was not killed or left no mark (rc=$RC el=${EL}s touched=|$(cat "$FP_ROOT/bd5/touched" 2>/dev/null)| err=|$ERR|)"
fi
# BD5v: the verdict names the Grep deadline mark's own cause (mark_cause).
run "$(mk_verdict "$AUD" bd5)"
if [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (deadline passed on a Grep call)' ]; then
  pass "BD5v: the verdict on the Grep deadline mark names its cause"
else
  fail "BD5v: the Grep deadline mark's verdict reason is |$(reason_of)|"
fi
# BD5b: the blocked check-ignore is the inner folder's (the root holds .git).
# The walk stops there, so wtR below it is not touched, and the Grep arm
# leaves its deadline mark.
shim_get bd5b
BDF="$BDR/.claude/war/audit-fingerprints/bd5b/touched"
if [ "$RC" = 0 ] && [ "$EL" -lt "$SHIM_CAP" ] && grep -Fxq -- '!deadline passed on a Grep call' "$BDF" 2>/dev/null && ! grep -Fxq -- "$WTR" "$BDF" 2>/dev/null; then
  pass "BD5b: a blocked inner-folder check-ignore stops the Grep walk and leaves the deadline mark"
else
  fail "BD5b: a blocked inner-folder check-ignore (rc=$RC el=${EL}s touched=|$(cat "$BDF" 2>/dev/null)| err=|$ERR|)"
fi
git -C "$BDR" worktree remove --force "$BDR/in/wtR"
rm -rf "$BDR"
# BD6 and BD7: a blocked common-dir probe leaves MAIN empty, fail-open.
shim_get bd6
if [ "$RC" = 0 ] && [ -z "$OUT" ] && [ "$EL" -lt "$SHIM_CAP" ] && [ ! -e "$FP_ROOT/bd6" ]; then
  pass "BD6: a blocked top-level common-dir probe exits 0 with MAIN empty (no state, no record)"
else
  fail "BD6: a blocked top-level common-dir probe (rc=$RC el=${EL}s out=|$OUT| state=$([ -e "$FP_ROOT/bd6" ] && echo present || echo absent) err=|$ERR|)"
fi
shim_get bd7
case "$ERR" in *"(no place for the mark)"*) p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$EL" -lt "$SHIM_CAP" ] && [ "$p" = 1 ] && [ ! -e "$FP_ROOT/bd7" ]; then
  pass "BD7: a blocked common-dir probe in main_find exits 0 with MAIN empty (no state, no record)"
else
  fail "BD7: a blocked main_find probe (rc=$RC el=${EL}s state=$([ -e "$FP_ROOT/bd7" ] && echo present || echo absent) err=|$ERR|)"
fi
rmdir "$TMP/bde" "$MAIN/bdir"
rm -f "$TMP/wtA/$CRN"
# A clean worktree spawns one temp file per fingerprint (the HEAD sha, the
# ls-files output, then the status output, in the same file), never a second
# for hash output or for the flagged paths: blob_lines makes its file on its
# first hash-object call, and a clean worktree makes none. A `mktemp` shim
# counts the calls the verdict arm makes on a fresh marked worktree (wtF,
# clean: .war-task is excluded) that one Read touched: one for the bounded
# common-dir probe (main_common, PIN-15) and one for the fingerprint. The row
# goes red (count 3) when the hash-output file is made on entry again.
REALMKTEMP="$(command -v mktemp)"
printf '#!/bin/bash\nprintf x >> "%s"\nexec "%s" "$@"\n' "$TMP/mtcount" "$REALMKTEMP" > "$SHIMG/mktemp"
chmod +x "$SHIMG/mktemp"
git -C "$MAIN" worktree add -q "$TMP/wtF" -b fclean
printf 'marker\n' > "$TMP/wtF/.war-task"
PCWD="$TMP/wtF"
run "$(mk_start "$AUD" d9)"
run "$(mk_read "$AUD" d9 "$TMP/wtF/f")"
: > "$TMP/mtcount"
_p="$(mk_verdict "$AUD" d9)"
run_shim "$_p"
PCWD="$MAIN"
_mt="$(wc -c < "$TMP/mtcount" | tr -d ' ')"
if [ "$RC" = 0 ] && [ -z "$OUT" ] && [ "$_mt" = 2 ]; then pass "a clean worktree's fingerprint makes one temp file (no hash-output file before a hash-object call)"; else fail "clean worktree temp files: mktemp calls=$_mt rc=$RC out=|$OUT| err=|$ERR|"; fi
git -C "$MAIN" worktree remove --force "$TMP/wtF"
rm -rf "$SHIMG"

# --- exit contract: 0 or 2 only -----------------------------------------------
run '{not json'
case "$ERR" in *"WAR: audit tree fingerprint: payload is not JSON"*) m=1 ;; *) m=0 ;; esac
if [ "$RC" = 2 ] && [ "$m" = 1 ]; then pass "payload not JSON -> exit 2 with a WAR: marker"; else fail "not-JSON payload rc=$RC err=|$ERR|"; fi
run "$(jq -nc --arg at "$AUD" --arg c "$MAIN" '{hook_event_name:"PreToolUse",agent_type:$at,agent_id:"a1",tool_name:"Write",tool_input:{},cwd:$c}')"
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then pass "an unmatched tool_name passes through"; else fail "unmatched tool rc=$RC out=|$OUT|"; fi
# The updatedInput build guard: a jq that fails only on the rewrite call (a
# shim that exits 5 when its arguments name updatedInput, else the real jq)
# makes a tainted verdict exit 2 with that guard's own message.
REALJQ="$(command -v jq)"
SHIM2="$(mktemp -d 2>/dev/null || mktemp -d -t atfpshim2)"
printf '#!/bin/bash\ncase "$*" in *updatedInput*) exit 5 ;; esac\nexec "%s" "$@"\n' "$REALJQ" > "$SHIM2/jq"
chmod +x "$SHIM2/jq"
run "$(mk_start "$AUD" a10)"
run "$(mk_read "$AUD" a10 "$TMP/wtA/f")"
printf 'late change\n' >> "$TMP/wtA/f"
_p="$(mk_verdict "$AUD" a10)"
_rc=0; _err="$(printf '%s' "$_p" | PATH="$SHIM2:$PATH" "$BASH" "$HOOK" 2>&1 >/dev/null)" || _rc=$?
case "$_err" in *"WAR: audit tree fingerprint: could not build the updatedInput payload"*) m=1 ;; *) m=0 ;; esac
if [ "$_rc" = 2 ] && [ "$m" = 1 ]; then pass "a failed updatedInput build -> exit 2 with its own WAR: message"; else fail "updatedInput build guard rc=$_rc err=|$_err|"; fi
rm -rf "$SHIM2"
# jq missing: an auditor payload exits 2 (fail-closed); a worker payload passes
# through, so a jq-less host never blocks the main session's every Read. The
# payloads are built BEFORE the PATH override (the builders need the real jq);
# the shim PATH carries only the tools the jq-less branch needs.
SHIM="$(mktemp -d 2>/dev/null || mktemp -d -t atfpshim)"
for _t in cat grep printf; do _b="$(command -v "$_t")" && [ -n "$_b" ] && ln -s "$_b" "$SHIM/$_t"; done
_aud_payload="$(mk_verdict "$AUD" a1)"
# The worker payload carries a file_path ending war-auditor: a grep that is
# not anchored on the agent_type key would block it.
_wrk_payload="$(mk_read 'work-audit-refine:war-worker' w1 "$TMP/notes-war-auditor")"
_rc=0; _err="$(printf '%s' "$_aud_payload" | PATH="$SHIM" "$BASH" "$HOOK" 2>&1 >/dev/null)" || _rc=$?
case "$_err" in *"jq is not installed"*) m=1 ;; *) m=0 ;; esac
if [ "$_rc" = 2 ] && [ "$m" = 1 ]; then pass "jq missing on an auditor payload -> exit 2 (fail-closed)"; else fail "jq missing auditor rc=$_rc err=|$_err|"; fi
_rc=0; _out="$(printf '%s' "$_wrk_payload" | PATH="$SHIM" "$BASH" "$HOOK" 2>/dev/null)" || _rc=$?
if [ "$_rc" = 0 ] && [ -z "$_out" ]; then pass "jq missing on a worker payload whose path ends war-auditor -> pass-through"; else fail "jq missing worker rc=$_rc out=|$_out|"; fi
rm -rf "$SHIM"

# --- Bash records after the call runs (#2477) --------------------------------
# The host fires neither post event for a call a hook denied, so a denied
# ~<name> grep reaches the hook on PreToolUse alone. The token sits in the pathspec:
# since #2604 an `-e` pattern value records nothing on any event.
run "$(mk_start "$AUD" pb1)"
run "$(mk_bash_pre "$AUD" pb1 'git grep -F -n -e x HEAD -- ~<name>')"
_prc="$RC"
run "$(mk_verdict "$AUD" pb1)"
if [ "$_prc" = 0 ] && [ "$RC" = 0 ] && [ -z "$OUT" ] && [ ! -s "$FP_ROOT/pb1/touched" ] && [ ! -e "$TAMPER_ROOT/pb1.json" ]; then
  pass "a denied ~<name> grep that fires only PreToolUse raises no escalate"
else
  fail "a denied Bash call still records (rc=$RC out=|$OUT| touched=|$(cat "$FP_ROOT/pb1/touched" 2>/dev/null)|)"
fi
run "$(mk_start "$AUD" pb2)"
run "$(mk_bash "$AUD" pb2 "git -C $TMP/wtA log -1")"
if [ "$RC" = 0 ] && touched_is pb2 "$WTA"; then pass "a Bash call that ran records on PostToolUse"; else fail "PostToolUse did not record (rc=$RC touched=|$(cat "$FP_ROOT/pb2/touched" 2>/dev/null)|)"; fi
if [ -z "$(ls "$FP_ROOT/pb2" | grep bash-open)" ]; then pass "a finished Bash recording leaves no open marker"; else fail "a finished Bash recording left an open marker"; fi
run "$(mk_start "$AUD" pb3)"
run "$(mk_bash_fail "$AUD" pb3 "git -C $TMP/wtB grep -F -e nomatch HEAD")"
if [ "$RC" = 0 ] && touched_is pb3 "$WTB"; then pass "a Bash call that exited non-zero records on PostToolUseFailure"; else fail "PostToolUseFailure did not record (rc=$RC touched=|$(cat "$FP_ROOT/pb3/touched" 2>/dev/null)|)"; fi
printf 'edit after the failed call\n' >> "$TMP/wtB/f"
run "$(mk_verdict "$AUD" pb3)"
case "$(reason_of)" in "AUDIT-TAMPER: $WTB changed during the audit round"*) pass "a worktree a failed Bash call read still compares at the verdict" ;; *) fail "a failed Bash call's worktree did not compare: |$(reason_of)|" ;; esac
run "$(mk_start "$AUD" pb4)"
run "$(mk_bash_fail "$AUD" pb4 'git grep -F -e x HEAD -- ~<name>')"
run "$(mk_verdict "$AUD" pb4)"
case "$(reason_of)" in *'unresolved Bash path ~<name>'*) pass "an unresolved token on a call that ran still escalates" ;; *) fail "an unresolved token on a call that ran did not escalate: |$(reason_of)|" ;; esac
# Read, Glob and Grep record on PreToolUse alone, and the post arm is Bash only.
run "$(mk_start "$AUD" pb5)"
# The payload cwd is a task worktree, so a post arm that took these tools would
# record it through the cwd fallback.
PCWD="$TMP/wtA"
run "$(MK_EV=PostToolUse mk_read "$AUD" pb5 "$TMP/wtA/f")"
run "$(MK_EV=PostToolUseFailure mk_glob "$AUD" pb5 "$TMP/wtA")"
run "$(MK_EV=PostToolUse mk_grep "$AUD" pb5 "$TMP/wtA")"
PCWD="$MAIN"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/pb5/touched" ]; then pass "the post events record no Read, Glob or Grep"; else fail "a post event recorded a non-Bash tool: |$(cat "$FP_ROOT/pb5/touched" 2>/dev/null)|"; fi
run "$(mk_bash_fail 'work-audit-refine:war-worker' pb6 "git -C $TMP/wtA log")"
if [ "$RC" = 0 ] && [ -z "$OUT" ] && [ ! -d "$FP_ROOT/pb6" ]; then pass "a worker's Bash post event passes through"; else fail "a worker's Bash post event wrote state (rc=$RC)"; fi

# A link to a file sends the reader to the target's worktree, through each hop.
ln -s ../wtB/f "$TMP/wtA/lnkf"
ln -s lnkf "$TMP/wtA/lnkg"
ln -s "$TMP/wtB/f" "$TMP/wtA/lnka"
ln -s ../wtB/nosuch "$TMP/wtA/lnkd"
ln -s lnkc "$TMP/wtA/lnkc"
ln -s ../wtD/f "$TMP/wtB/lnkm"
ln -s ../wtB/lnkm "$TMP/wtA/lnkh"
# seat_read_touches <seat> <path>: a fresh seat reads <path>; the caller reads
# the touched set.
seat_read_touches() { run "$(mk_start "$AUD" "$1")"; run "$(mk_read "$AUD" "$1" "$2")"; }
seat_read_touches pb7 "$TMP/wtA/lnkg"
if touched_has pb7 "$WTA" && touched_has pb7 "$WTB"; then pass "a Read through a file link touches the link's worktree and the target's"; else fail "a file link missed a worktree: |$(cat "$FP_ROOT/pb7/touched" 2>/dev/null)|"; fi
seat_read_touches pb7a "$TMP/wtA/lnka"
if touched_has pb7a "$WTA" && touched_has pb7a "$WTB"; then pass "a Read through an absolute file link touches the target's worktree"; else fail "an absolute file link missed a worktree: |$(cat "$FP_ROOT/pb7a/touched" 2>/dev/null)|"; fi
seat_read_touches pb7b "$TMP/wtA/nosuch/../lnkf"
if touched_has pb7b "$WTA" && touched_has pb7b "$WTB"; then pass "a folded path through a file link touches the target's worktree"; else fail "a folded file link missed a worktree: |$(cat "$FP_ROOT/pb7b/touched" 2>/dev/null)|"; fi
seat_read_touches pb7c "$TMP/wtA/lnkh"
if touched_has pb7c "$WTA" && touched_has pb7c "$WTB" && touched_has pb7c "$WTD"; then pass "a link chain touches the worktree of each hop"; else fail "a link chain missed a hop: |$(cat "$FP_ROOT/pb7c/touched" 2>/dev/null)|"; fi
# A chain that ends at a directory: each hop's worktree, the first link's too.
ln -s ../wtD/ddir "$TMP/wtB/lnkn"
ln -s ../wtB/lnkn "$TMP/wtA/lnki"
mkdir -p "$TMP/wtD/ddir"
seat_read_touches pb7d "$TMP/wtA/lnki"
if touched_has pb7d "$WTA" && touched_has pb7d "$WTB" && touched_has pb7d "$WTD"; then pass "a link chain that ends at a directory touches the worktree of each hop"; else fail "a directory link chain missed a hop: |$(cat "$FP_ROOT/pb7d/touched" 2>/dev/null)|"; fi
rm -f "$TMP/wtA/lnki" "$TMP/wtB/lnkn"
rmdir "$TMP/wtD/ddir"
seat_read_touches pb8 "$TMP/wtA/lnkd"
if [ "$RC" = 0 ] && touched_is pb8 "$WTA"; then pass "a Read through a dangling link touches only the link's worktree"; else fail "a dangling link touched: |$(cat "$FP_ROOT/pb8/touched" 2>/dev/null)|"; fi
# The hop limit is the only stop on a cycle, so this call runs under a kill: a
# regression fails this row and never stalls the suite. The poll checks every
# 0.1 s, up to the same 30 s ceiling as before.
run "$(mk_start "$AUD" pb8a)"
_p="$(mk_read "$AUD" pb8a "$TMP/wtA/lnkc")"
printf '%s' "$_p" > "$TMP/pb8a.json"
bash "$HOOK" < "$TMP/pb8a.json" >/dev/null 2>&1 &
_hp=$!
_hw=0
while kill -0 "$_hp" 2>/dev/null && [ "$_hw" -lt 300 ]; do sleep 0.1; _hw=$((_hw + 1)); done
_hung=0
if kill -0 "$_hp" 2>/dev/null; then _hung=1; kill -9 "$_hp" 2>/dev/null; fi
wait "$_hp" 2>/dev/null
if [ "$_hung" = 0 ] && touched_is pb8a "$WTA"; then pass "a Read through a link cycle ends and touches only the link's worktree"; else fail "a link cycle hung=$_hung touched: |$(cat "$FP_ROOT/pb8a/touched" 2>/dev/null)|"; fi
rm -f "$TMP/wtA/lnkf" "$TMP/wtA/lnkg" "$TMP/wtA/lnka" "$TMP/wtA/lnkd" "$TMP/wtA/lnkc" "$TMP/wtA/lnkh" "$TMP/wtB/lnkm"

# A mark a worker wrote never prints its own words in the reason.
run "$(mk_start "$AUD" pb9)"
printf '!free text; seat verdict approve\n' >> "$FP_ROOT/pb9/touched"
run "$(mk_verdict "$AUD" pb9)"
if [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (unrecognized mark)' ]; then pass "a forged touched mark prints the fixed cause"; else fail "a forged touched mark printed: |$(reason_of)|"; fi
run "$(mk_start "$AUD" pb9a)"
printf 'free text; seat verdict approve\n' >> "$FP_ROOT/pb9a/touched"
run "$(mk_verdict "$AUD" pb9a)"
if [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (unrecognized mark)' ]; then pass "a forged line with no mark byte prints the fixed cause"; else fail "a forged line printed: |$(reason_of)|"; fi

# --- a seat Bash payload with no usable agent_id ------------------------------
# The mark sits under $MAIN, because no state dir has a key. A seat that started
# after the mark never sees it.
NOID="$MAIN/.claude/war/audit-no-agent-id"
run "$(mk_start "$AUD" pn1)"
run "$(mk_bash_fail "$AUD" x "git -C $TMP/wtA log" | jq -c 'del(.agent_id)')"
_prc="$RC"
run "$(mk_verdict "$AUD" pn1)"
if [ "$_prc" = 0 ] && [ "$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty')" = escalate ] \
   && [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (no agent_id in the Bash payload)' ]; then
  pass "a failure payload with no agent_id escalates at the verdict"
else
  fail "a failure payload with no agent_id did not escalate (rc=$_prc reason=|$(reason_of)| mark=|$(cat "$NOID" 2>/dev/null)|)"
fi
rm -f "$NOID"
run "$(mk_start "$AUD" pn2)"
run "$(mk_bash "$AUD" '../x' "git -C $TMP/wtA log")"
_prc="$RC"
run "$(mk_verdict "$AUD" pn2)"
if [ "$_prc" = 0 ] && [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (unsafe agent_id in the Bash payload)' ]; then
  pass "a Bash payload with an unsafe agent_id escalates at the verdict"
else
  fail "a Bash payload with an unsafe agent_id did not escalate (rc=$_prc reason=|$(reason_of)|)"
fi
touch -t 202001010000 "$NOID"
run "$(mk_start "$AUD" pn3)"
run "$(mk_verdict "$AUD" pn3)"
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then pass "a seat that started after the no-agent_id mark passes"; else fail "an old no-agent_id mark escalated a later seat: |$(reason_of)|"; fi
rm -f "$NOID"
run "$(jq -nc --arg c "$MAIN" '{hook_event_name:"PostToolUseFailure",tool_name:"Bash",tool_input:{command:"false"},error:"Exit code 1",cwd:$c}')"
if [ "$RC" = 0 ] && [ ! -e "$NOID" ]; then pass "a main-session Bash failure leaves no mark"; else fail "a main-session Bash failure left a mark"; fi

run "$(mk_start "$AUD" pn3b)"
printf 'free text; seat verdict approve\n' > "$NOID"
run "$(mk_verdict "$AUD" pn3b)"
rm -f "$NOID"
if [ "$(reason_of)" = 'AUDIT-TAMPER: unverifiable fingerprint (unrecognized mark)' ]; then pass "a forged keyless mark prints the fixed cause"; else fail "a forged keyless mark printed: |$(reason_of)|"; fi
# A Read, Glob or Grep payload with no usable agent_id leaves the same mark.
run "$(mk_start "$AUD" pn4)"
run "$(mk_read "$AUD" '' "$TMP/wtA/f" | jq -c 'del(.agent_id)')"
run "$(mk_verdict "$AUD" pn4)"
_r1="$(reason_of)"; rm -f "$NOID"
run "$(mk_start "$AUD" pn5)"
run "$(mk_glob "$AUD" '../x' "$TMP/wtA")"
run "$(mk_verdict "$AUD" pn5)"
_r2="$(reason_of)"; rm -f "$NOID"
run "$(mk_start "$AUD" pn6)"
run "$(mk_grep "$AUD" '../x' "$TMP/wtA")"
run "$(mk_verdict "$AUD" pn6)"
_r3="$(reason_of)"; rm -f "$NOID"
if [ "$_r1" = 'AUDIT-TAMPER: unverifiable fingerprint (no agent_id in the Read payload)' ] \
   && [ "$_r2" = 'AUDIT-TAMPER: unverifiable fingerprint (unsafe agent_id in the Glob payload)' ] \
   && [ "$_r3" = 'AUDIT-TAMPER: unverifiable fingerprint (unsafe agent_id in the Grep payload)' ]; then
  pass "a Read, Glob or Grep payload with no usable agent_id escalates at the verdict"
else
  fail "a Read, Glob or Grep payload with no usable agent_id did not escalate (|$_r1| |$_r2| |$_r3|)"
fi


# ---------------------------------------------------------------------------
finish audit-tree-fingerprint.deadline.test.sh
