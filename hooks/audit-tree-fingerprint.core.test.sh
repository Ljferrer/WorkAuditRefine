#!/usr/bin/env bash
# Tests for the WAR audit tree fingerprint hook (hooks/audit-tree-fingerprint.sh):
# pass-through, start records, no optional locks, change detection, sibling and submodule worktrees, and the touched-set resolution arms.
# The shared fixture, payload builders and helpers live in
# audit-tree-fingerprint.test-harness.sh (its header describes the hook and the
# fixture). #2823 split the suite into four files so they run in parallel.
# Plain-bash assertion runner, bash 3.2 safe, cwd-independent.
# Exit 0 = all cases passed.
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/audit-tree-fingerprint.test-harness.sh"

# --- other agent types pass through -----------------------------------------
run "$(mk_start 'work-audit-refine:war-worker' w1)"
run "$(mk_read 'work-audit-refine:war-worker' w1 "$TMP/wtA/f")"
run "$(mk_verdict 'work-audit-refine:war-worker' w1)"
if [ "$RC" = 0 ] && [ -z "$OUT" ] && [ ! -d "$FP_ROOT/w1" ]; then
  pass "other agent types pass through"
else
  fail "other agent types pass through (rc=$RC out=|$OUT| state=$([ -d "$FP_ROOT/w1" ] && echo present || echo absent))"
fi
run "$(mk_start 'work-audit-refine:war-auditor-helper' h1)"
if [ "$RC" = 0 ] && [ -z "$OUT" ] && [ ! -d "$FP_ROOT/h1" ]; then
  pass "trailing-junk :war-auditor-helper falls to pass-through (suffix-anchored arm)"
else
  fail "trailing-junk :war-auditor-helper did not pass through (rc=$RC out=|$OUT|)"
fi
run "$(jq -nc --arg c "$MAIN" '{hook_event_name:"PreToolUse",tool_name:"StructuredOutput",tool_input:{verdict:"approve"},cwd:$c}')"
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then
  pass "main session (no agent_type) StructuredOutput passes through"
else
  fail "main session StructuredOutput did not pass through (rc=$RC out=|$OUT|)"
fi

# --- start record + untouched worktree passes --------------------------------
run "$(mk_start "$AUD" a1)"
START="$FP_ROOT/a1/start"
if [ "$RC" = 0 ] && [ -z "$OUT" ] && [ -f "$START" ]; then
  pass "SubagentStart writes the start record for an exact-shape :war-auditor"
else
  fail "SubagentStart wrote no start record (rc=$RC out=|$OUT| err=|$ERR|)"
fi
lines="$(grep -c . "$START" 2>/dev/null)"; [ -n "$lines" ] || lines=0
if [ "$lines" = 4 ] && grep -Fq " $WTA" "$START" && grep -Fq " $WTB" "$START" && grep -Fq " $WTD" "$START" && grep -Fq " $WTS" "$START" && ! grep -Fq " $WTC" "$START"; then
  pass "start record lists every .war-task worktree, the submodule's included, and no unmarked worktree"
else
  fail "start record content wrong (lines=$lines): $(cat "$START" 2>/dev/null)"
fi
head_a="$(git -C "$TMP/wtA" rev-parse HEAD)"
if grep -q "^$head_a [0-9a-f]\{64\} " "$START"; then
  pass "start record line carries the HEAD sha and a 64-hex status sha256"
else
  fail "start record line shape wrong: $(cat "$START")"
fi
run "$(mk_read "$AUD" a1 "$TMP/wtA/f")"
if [ "$RC" = 0 ] && [ -z "$OUT" ] && [ "$(cat "$FP_ROOT/a1/touched")" = "$WTA" ]; then
  pass "Read inside a task worktree adds that worktree to the touched set"
else
  fail "Read touch not recorded (rc=$RC touched=|$(cat "$FP_ROOT/a1/touched" 2>/dev/null)|)"
fi
run "$(mk_read "$AUD" a1 "$TMP/wtA/sub/dir/f")"
run "$(mk_read "$AUD" a1 "$MAIN/f")"
if [ "$(grep -c . "$FP_ROOT/a1/touched")" = 1 ]; then
  pass "touched set dedupes and ignores a path outside any task worktree"
else
  fail "touched set wrong: $(cat "$FP_ROOT/a1/touched")"
fi
run "$(mk_verdict "$AUD" a1)"
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then
  pass "untouched worktree passes"
else
  fail "untouched worktree passes (rc=$RC out=|$OUT| err=|$ERR|)"
fi

# --- no optional locks: the hook never writes a worktree index ---------------
# With optional locks on, `git status` refreshes a stale index and writes it
# back under <gitdir>/index.lock; a sibling worker's `git add` or the refiner's
# rebase in that worktree then dies on `index.lock: File exists`. Oracle: stale
# wtA's index (its tracked file gets an old mtime, content unchanged), run each
# arm that fingerprints, and compare the index bytes before and after. A
# pre-existing index.lock is NOT the oracle: `git status` skips the refresh
# silently when it cannot take the lock, in both modes, so that row never
# goes red. The plain `git status` after the three arms is the oracle's own
# sensitivity check: it writes a stale index, which the hook never did.
GDA="$(git -C "$TMP/wtA" rev-parse --path-format=absolute --git-dir)"
# stale_arm <label> <mtime> <payload>: stales wtA's index, runs the hook, and
# appends to ARM_BAD on a non-zero exit, any output, or a changed index.
ARM_BAD=""
stale_arm() {
  stale "$2"
  _b="$(cksum < "$GDA/index")"
  run "$3"
  _a="$(cksum < "$GDA/index")"
  [ "$RC" = 0 ] && [ -z "$OUT" ] && [ "$_b" = "$_a" ] && return 0
  ARM_BAD="$ARM_BAD $1(rc=$RC out=|$OUT| index=$([ "$_b" = "$_a" ] && echo unchanged || echo written))"
}
stale_arm SubagentStart 200001010000 "$(mk_start "$AUD" a8)"
run "$(mk_read "$AUD" a8 "$TMP/wtA/f")"
stale_arm StructuredOutput 200101010000 "$(mk_verdict "$AUD" a8)"
stale_arm SubagentStop 200201010000 "$(mk_stop "$AUD" a8)"
if [ -z "$ARM_BAD" ] && grep -Fq " $WTA" "$FP_ROOT/a8/start" && [ ! -f "$GDA/index.lock" ]; then
  pass "every fingerprinting arm leaves the worktree index unwritten (no optional lock)"
else
  fail "an arm wrote the worktree index or failed:$ARM_BAD (lock=$([ -f "$GDA/index.lock" ] && echo present || echo absent))"
fi
stale 200301010000
_b="$(cksum < "$GDA/index")"
git -C "$TMP/wtA" status --porcelain=v1 -uall >/dev/null 2>&1
_a="$(cksum < "$GDA/index")"
if [ "$_b" != "$_a" ]; then
  pass "oracle sensitivity: a plain git status writes the stale index the hook left alone"
else
  fail "oracle vacuous: a plain git status did not write the stale index"
fi

# --- changed worktree rewrites verdict to escalate ---------------------------
printf 'tamper\n' >> "$TMP/wtA/f"
run "$(mk_verdict "$AUD" a1)"
dec="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.permissionDecision // empty' 2>/dev/null)"
ver="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
kept="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.findings[0].title // empty' 2>/dev/null)"
case "$rsn" in
  "AUDIT-TAMPER: $WTA changed during the audit round ("*" -> "*")") prefix_ok=1 ;;
  *) prefix_ok=0 ;;
esac
if [ "$RC" = 0 ] && [ "$dec" = allow ] && [ "$ver" = escalate ] && [ "$prefix_ok" = 1 ] && [ "$kept" = t ]; then
  pass "changed worktree rewrites verdict to escalate"
else
  fail "changed worktree rewrites verdict to escalate (rc=$RC dec=$dec ver=$ver kept=$kept rsn=|$rsn| err=|$ERR|)"
fi
if [ "$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.hookEventName' 2>/dev/null)" = PreToolUse ]; then
  pass "updatedInput rides a PreToolUse hookSpecificOutput"
else
  fail "hookEventName wrong: |$OUT|"
fi
rec="$TAMPER_ROOT/a1.json"
if [ -f "$rec" ] && [ "$(jq -r '.reason' "$rec")" = "$rsn" ] && [ "$(jq -r '.worktree' "$rec")" = "$WTA" ] && [ "$(jq -r '.agent_id' "$rec")" = a1 ]; then
  pass "tamper record written under .claude/war/audit-tamper/<agent_id>.json"
else
  fail "tamper record missing or wrong: $(cat "$rec" 2>/dev/null)"
fi

# A HEAD move is a mismatch too; the Bash `git -C <path>` form resolves the
# worktree; the evidence-auditor arm acts the same.
run "$(mk_start "$EVA" e1)"
run "$(mk_bash "$EVA" e1 "git -C $TMP/wtB log --oneline -1")"
if [ "$(cat "$FP_ROOT/e1/touched" 2>/dev/null)" = "$WTB" ]; then
  pass "Bash git -C <path> adds that worktree to the touched set (evidence-auditor)"
else
  fail "Bash -C touch not recorded: |$(cat "$FP_ROOT/e1/touched" 2>/dev/null)|"
fi
printf 'new\n' > "$TMP/wtB/g"
git -C "$TMP/wtB" add g
git -C "$TMP/wtB" commit -q -m move
run "$(mk_verdict "$EVA" e1)"
ver="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: $WTB changed during the audit round ("*) p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$ver" = escalate ] && [ "$p" = 1 ]; then
  pass "a HEAD move on a Bash-touched worktree escalates (exact-shape :war-evidence-auditor)"
else
  fail "HEAD move not caught (rc=$RC ver=$ver rsn=|$rsn|)"
fi

# The two rows below read the a1 record above. They sat with the deadline
# rows before #2823 split the suite.
# A tamper record from a non-timeout cause carries timeout: false, so the Lead
# question in resume-and-recovery.md never fires on a plain mismatch.
if [ "$(jq -r '.timeout' "$TAMPER_ROOT/a1.json" 2>/dev/null)" = false ]; then
  pass "a plain mismatch record carries timeout: false"
else
  fail "plain mismatch record timeout field wrong: $(cat "$TAMPER_ROOT/a1.json" 2>/dev/null)"
fi
# Every tamper record, a plain mismatch included, keeps the seat's own verdict.
if [ "$(jq -r '.seat_verdict' "$TAMPER_ROOT/a1.json" 2>/dev/null)" = approve ] && [ "$(jq -r '.seat_escalate_reason' "$TAMPER_ROOT/a1.json" 2>/dev/null)" = null ]; then
  pass "tamper record keeps the seat verdict"
else
  fail "mismatch record seat_verdict wrong: $(cat "$TAMPER_ROOT/a1.json" 2>/dev/null)"
fi
# --- sibling worktree not touched is ignored ---------------------------------
run "$(mk_start "$AUD" a2)"
run "$(mk_glob "$AUD" a2 "$TMP/wtA")"
if [ "$(cat "$FP_ROOT/a2/touched" 2>/dev/null)" = "$WTA" ]; then
  pass "Glob path adds that worktree to the touched set"
else
  fail "Glob touch not recorded: |$(cat "$FP_ROOT/a2/touched" 2>/dev/null)|"
fi
printf 'sibling change\n' >> "$TMP/wtB/f"
run "$(mk_verdict "$AUD" a2)"
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then
  pass "sibling worktree not touched is ignored"
else
  fail "sibling worktree not touched is ignored (rc=$RC out=|$OUT|)"
fi
# A seat that touched nothing passes on its start record alone.
run "$(mk_start "$AUD" a3)"
run "$(mk_verdict "$AUD" a3)"
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then
  pass "a seat that touched no worktree passes"
else
  fail "no-touch seat did not pass (rc=$RC out=|$OUT|)"
fi

# --- submodule-task worktrees are recorded at start ---------------------------
# The auditor card sends every seat of a submodule task to `git -C
# <submodule-task-worktree> diff`. Oracle, independent of the hook: the
# superproject's own worktree list never shows wtS and the submodule's does,
# so a start arm that listed the cwd repository alone would record no line
# for it and every such seat would escalate `no start record`.
if ! git -C "$MAIN" worktree list --porcelain | grep -Fxq "worktree $WTS" \
   && git -C "$SUB" worktree list --porcelain | grep -Fxq "worktree $WTS"; then
  pass "oracle: the submodule worktree is listed by the submodule, never by the superproject"
else
  fail "oracle vacuous: superproject list=|$(git -C "$MAIN" worktree list --porcelain)| sub list=|$(git -C "$SUB" worktree list --porcelain)|"
fi
# The start arm reads .gitmodules from $MAIN, not from the payload cwd: a seat
# whose cwd is a superproject worktree (no initialized submodule there) still
# records wtS, and the never-initialized `ghost` entry is skipped (the exact
# line count: a walk-up from its empty dir would list the superproject's
# marked worktrees twice).
PCWD="$TMP/wtA"
run "$(mk_start "$AUD" s1)"
PCWD="$MAIN"
if [ "$RC" = 0 ] && [ -z "$OUT" ] && grep -Fq " $WTS" "$FP_ROOT/s1/start" && [ "$(grep -c . "$FP_ROOT/s1/start")" = 4 ]; then
  pass "start from a superproject worktree cwd records the submodule worktree and skips the uninitialized ghost entry"
else
  fail "submodule worktree not recorded from a worktree cwd (rc=$RC out=|$OUT| err=|$ERR| start=|$(cat "$FP_ROOT/s1/start" 2>/dev/null)|)"
fi
run "$(mk_start "$AUD" s2)"
run "$(mk_bash "$AUD" s2 "git -C $TMP/wtS diff")"
run "$(mk_verdict "$AUD" s2)"
if [ "$(cat "$FP_ROOT/s2/touched" 2>/dev/null)" = "$WTS" ] && [ "$RC" = 0 ] && [ -z "$OUT" ]; then
  pass "an unchanged submodule-task worktree touched via git -C passes"
else
  fail "unchanged submodule worktree did not pass (rc=$RC out=|$OUT| err=|$ERR| touched=|$(cat "$FP_ROOT/s2/touched" 2>/dev/null)|)"
fi
run "$(mk_start "$AUD" s3)"
run "$(mk_bash "$AUD" s3 "git -C $TMP/wtS diff")"
printf 'sub tamper\n' >> "$TMP/wtS/s"
run "$(mk_verdict "$AUD" s3)"
ver="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: $WTS changed during the audit round ("*) p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$ver" = escalate ] && [ "$p" = 1 ]; then
  pass "an edit in a submodule-task worktree escalates as changed during the audit round"
else
  fail "submodule worktree edit not caught (rc=$RC ver=$ver rsn=|$rsn| err=|$ERR|)"
fi

# --- touched-set resolution arms ---------------------------------------------
# An arm that dropped a worktree from the touched set would leave a tampered
# worktree uncompared (the fail-open direction), so each arm has its own seat.
run "$(mk_start "$AUD" t1)"
run "$(mk_tool "$AUD" t1 Grep "$(jq -nc --arg p "$TMP/wtA" '{pattern:"base",path:$p}')")"
if touched_is t1 "$WTA"; then pass "Grep path adds that worktree to the touched set"; else fail "Grep touch not recorded: |$(cat "$FP_ROOT/t1/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" t2)"
PCWD="$TMP/wtA"
run "$(mk_tool "$AUD" t2 Glob '{"pattern":"**/*"}')"
PCWD="$MAIN"
if touched_is t2 "$WTA"; then pass "Glob with no path falls back to the payload cwd worktree"; else fail "Glob cwd fallback not recorded: |$(cat "$FP_ROOT/t2/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" t3)"
PCWD="$TMP/wtA"
run "$(mk_bash "$AUD" t3 "git log -1")"
PCWD="$MAIN"
if touched_is t3 "$WTA"; then pass "Bash with no -C falls back to the payload cwd worktree"; else fail "Bash cwd fallback not recorded: |$(cat "$FP_ROOT/t3/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" t4)"
run "$(mk_bash "$AUD" t4 "git -C$TMP/wtB log")"
if touched_is t4 "$WTB"; then pass "Bash attached -C<path> adds that worktree to the touched set"; else fail "attached -C touch not recorded: |$(cat "$FP_ROOT/t4/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" t5)"
run "$(mk_bash "$AUD" t5 "git -C '$TMP/wtB' log")"
if touched_is t5 "$WTB"; then pass "Bash quoted -C '<path>' adds that worktree to the touched set"; else fail "quoted -C touch not recorded: |$(cat "$FP_ROOT/t5/touched" 2>/dev/null)|"; fi
# validate-auditor-git.sh admits one quoted value as one shell word, so a value
# with a space is one operand here too. Fixture: a task worktree with a space in
# its path and a tab in its name, under a directory with a space. Each row needs
# a quote-aware split: a whitespace split reads `'$TMP/run` and `dir/wt...` and
# touches nothing.
_tb="$(printf '\t')"
git -C "$MAIN" worktree add -q "$TMP/run  dir/wt${_tb}S" -b wtq
printf 'marker\n' > "$TMP/run  dir/wt${_tb}S/.war-task"
WTQ="$(cd "$TMP/run  dir/wt${_tb}S" && pwd -P)"
run "$(mk_start "$AUD" ts1)"
run "$(mk_bash "$AUD" ts1 "git diff --no-index '$TMP/run  dir/wt${_tb}S/f' /dev/null")"
if touched_has ts1 "$WTQ"; then pass "a quoted operand with a space touches its worktree"; else fail "quoted spaced operand not touched: |$(cat "$FP_ROOT/ts1/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" ts2)"
run "$(mk_bash "$AUD" ts2 "git -C '$TMP/run  dir/wt${_tb}S' log")"
if touched_is ts2 "$WTQ"; then pass "a quoted -C path with a space touches that worktree"; else fail "quoted spaced -C not touched: |$(cat "$FP_ROOT/ts2/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" ts3)"
run "$(mk_bash "$AUD" ts3 "git blame -S'$TMP/run  dir/wt${_tb}S/revs' f")"
if touched_has ts3 "$WTQ"; then pass "an attached quoted value with a space touches its worktree"; else fail "attached quoted value not touched: |$(cat "$FP_ROOT/ts3/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" ts4)"
run "$(mk_bash "$AUD" ts4 "git diff '$TMP/run  dir' /dev/null")"
if touched_has ts4 "$WTQ"; then pass "a quoted directory operand with a space walks to its worktree"; else fail "quoted dir operand not walked: |$(cat "$FP_ROOT/ts4/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" ts5)"
run "$(mk_bash "$AUD" ts5 "git diff --no-index -S'a b' '$TMP/run  dir/wt${_tb}S/f' /dev/null")"
if touched_has ts5 "$WTQ"; then pass "the second quoted value in a command stays one token"; else fail "second quoted value not touched: |$(cat "$FP_ROOT/ts5/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" ts6)"
run "$(mk_bash "$AUD" ts6 "git -C \"$TMP/run  dir/wt${_tb}S\" log")"
if touched_is ts6 "$WTQ"; then pass "a double-quoted -C path with a space touches that worktree"; else fail "double-quoted -C not touched: |$(cat "$FP_ROOT/ts6/touched" 2>/dev/null)|"; fi
# The eighth value, the last the guard admits, still reads as one token.
run "$(mk_start "$AUD" ts9)"
run "$(mk_bash "$AUD" ts9 "git diff --no-index -- 'a' 'a' 'a' 'a' 'a' 'a' 'a' '$TMP/run  dir/wt${_tb}S/f'")"
if touched_has ts9 "$WTQ"; then pass "the eighth quoted value stays one token"; else fail "eighth quoted value not touched: |$(cat "$FP_ROOT/ts9/touched" 2>/dev/null)|"; fi
# Only the spaced operand implies --no-index here: the link leaves the work tree
# and `runs` stays inside it, so only that implied flag walks `runs` to wtR.
git -C "$MAIN" worktree add -q "$MAIN/runs/wtR" -b wtr
printf 'marker\n' > "$MAIN/runs/wtR/.war-task"
WTR="$(cd "$MAIN/runs/wtR" && pwd -P)"
ln -s "$TMP/run  dir" "$MAIN/lnk dir"
run "$(mk_start "$AUD" ts7)"
run "$(mk_bash "$AUD" ts7 "git diff runs 'lnk dir'")"
if touched_has ts7 "$WTR"; then pass "a quoted in-repo link with a space implies --no-index by itself"; else fail "implied --no-index missed: |$(cat "$FP_ROOT/ts7/touched" 2>/dev/null)|"; fi
rm -f "$MAIN/lnk dir"
git -C "$MAIN" worktree remove --force "$MAIN/runs/wtR"
git -C "$MAIN" branch -q -D wtr
rm -rf "$MAIN/runs"
# A value with both quote kinds keeps the inner pair: the shell passes 'lnk'/f.
mkdir -p "$MAIN/nest"
ln -s "$TMP/wtB" "$MAIN/nest/'lnk'"
run "$(mk_start "$AUD" ts8)"
run "$(mk_bash "$AUD" ts8 "git -C '$MAIN/nest' diff --no-index \"'lnk'/f\" /dev/null")"
if touched_has ts8 "$WTB"; then pass "unquote strips one quote kind only"; else fail "nested quotes stripped twice: |$(cat "$FP_ROOT/ts8/touched" 2>/dev/null)|"; fi
rm -rf "$MAIN/nest"
git -C "$MAIN" worktree remove --force "$TMP/run  dir/wt${_tb}S"
git -C "$MAIN" branch -q -D wtq
rm -rf "$TMP/run  dir"
run "$(mk_start "$AUD" t6)"
run "$(mk_read "$AUD" t6 "$TMP/wtC/../wtA/f")"
if touched_is t6 "$WTA"; then pass "Read through a ..-segment path touches the worktree it reaches, not the one it names"; else fail "..-segment touch wrong: |$(cat "$FP_ROOT/t6/touched" 2>/dev/null)|"; fi
# A glob in a -C token stays literal (set -f): wt[B] is not expanded to wtB.
run "$(mk_start "$AUD" t8)"
run "$(mk_bash "$AUD" t8 "git -C $TMP/wt[B] log")"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/t8/touched" ]; then pass "a glob in a Bash -C token is not expanded against the filesystem"; else fail "glob -C token expanded (rc=$RC touched=|$(cat "$FP_ROOT/t8/touched" 2>/dev/null)|)"; fi
# The seat's shell expands an unquoted word-initial `~` before git runs, so
# `git -C ~/wtB` reads wtB and the hook must touch it; a quoted `'~/wtB'` or
# an attached `-C~/wtB` reaches git literal (cwd-relative, no such dir) and
# the hook must touch nothing. HOME is the fixture dir for these three rows.
_home="$HOME"; HOME="$TMP"
run "$(mk_start "$AUD" t9)"
run "$(mk_bash "$AUD" t9 "git -C ~/wtB log")"
if touched_is t9 "$WTB"; then pass "Bash unquoted -C ~/<path> expands the tilde and touches that worktree"; else fail "tilde -C touch not recorded: |$(cat "$FP_ROOT/t9/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" t10)"
run "$(mk_bash "$AUD" t10 "git -C '~/wtB' log")"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/t10/touched" ]; then pass "Bash quoted -C '~/<path>' stays literal and touches nothing"; else fail "quoted tilde expanded (rc=$RC touched=|$(cat "$FP_ROOT/t10/touched" 2>/dev/null)|)"; fi
run "$(mk_start "$AUD" t11)"
run "$(mk_bash "$AUD" t11 "git -C~/wtB log")"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/t11/touched" ]; then pass "Bash attached -C~/<path> stays literal and touches nothing"; else fail "attached tilde expanded (rc=$RC touched=|$(cat "$FP_ROOT/t11/touched" 2>/dev/null)|)"; fi
HOME="$_home"
# `~+` is admitted too and the seat's shell expands it from PWD, which the
# hook reads from the payload cwd (wtA here, so `~+/../wtB` reaches wtB). `~-`
# is admitted too, but the seat's shell expands it from OLDPWD, which the
# payload does not carry, and a `~<name>` form needs getpwnam: the hook
# records either form literal and the verdict arm escalates it as an
# unresolved Bash path (PIN-7). Row t13 runs from wtA, so a payload-cwd
# reading of `~-/../wtB` would touch wtB instead.
PCWD="$TMP/wtA"
run "$(mk_start "$AUD" t12)"
run "$(mk_bash "$AUD" t12 "git -C ~+/../wtB log")"
if touched_is t12 "$WTB"; then pass "Bash unquoted -C ~+/<path> resolves from the payload cwd and touches that worktree"; else fail "tilde-plus -C touch not recorded: |$(cat "$FP_ROOT/t12/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" t13)"
run "$(mk_bash "$AUD" t13 "git -C ~-/../wtB log")"
run "$(mk_verdict "$AUD" t13)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
if touched_is t13 "~-/../wtB" && [ "$rsn" = "AUDIT-TAMPER: unverifiable fingerprint (unresolved Bash path ~-/../wtB)" ]; then
  pass "Bash unquoted -C ~-/<path> is recorded literal: tilde-minus -C escalates as unresolved (OLDPWD is not in the payload)"
else
  fail "tilde-minus -C not escalated (touched=|$(cat "$FP_ROOT/t13/touched" 2>/dev/null)| rsn=|$rsn|)"
fi
run "$(mk_start "$AUD" t14)"
run "$(mk_bash "$AUD" t14 "git -C ~nosuchuser/wtB log")"
run "$(mk_verdict "$AUD" t14)"
PCWD="$MAIN"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
if touched_is t14 "~nosuchuser/wtB" && [ "$rsn" = "AUDIT-TAMPER: unverifiable fingerprint (unresolved Bash path ~nosuchuser/wtB)" ]; then
  pass "Bash unquoted -C ~<name>/<path> is recorded literal and escalates as an unresolved Bash path"
else
  fail "tilde-name -C not escalated (touched=|$(cat "$FP_ROOT/t14/touched" 2>/dev/null)| rsn=|$rsn|)"
fi
# An absolute operand reaches a worktree with no -C: validate-auditor-git.sh
# admits `git diff /abs/f /abs/g`, and git implies --no-index outside the cwd
# repository. Both the bare and the quoted form touch; the cwd (MAIN, no
# marker) adds no line.
run "$(mk_start "$AUD" t15)"
run "$(mk_bash "$AUD" t15 "git diff $TMP/wtB/f '$TMP/wtD/f'")"
if touched_is t15 "$(printf '%s\n%s' "$WTB" "$WTD")"; then pass "Bash absolute path operands add every worktree they reach to the touched set"; else fail "absolute operand touch not recorded: |$(cat "$FP_ROOT/t15/touched" 2>/dev/null)|"; fi
# An absolute Glob pattern with no path: the prefix before the first glob
# metacharacter names the tree the pattern walks.
run "$(mk_start "$AUD" t16)"
run "$(mk_tool "$AUD" t16 Glob "$(jq -nc --arg p "$TMP/wtB/**/*.md" '{pattern:$p}')")"
if touched_is t16 "$WTB"; then pass "Glob with an absolute pattern and no path touches the worktree the pattern prefix reaches"; else fail "absolute Glob pattern touch not recorded: |$(cat "$FP_ROOT/t16/touched" 2>/dev/null)|"; fi
# A relative operand escapes the cwd worktree the same way: the guard's
# character allowlist carries `.` and `/`, and a path that normalizes outside
# the cwd repository's work tree implies --no-index too. wtC (unmarked,
# beside wtB) is the cwd; the operands resolve against it, so the unmarked
# cwd adds no line and wtB is the only touched worktree.
run "$(mk_start "$AUD" t17)"
PCWD="$TMP/wtC"
run "$(mk_bash "$AUD" t17 "git diff ../wtB/f '../wtB/g'")"
PCWD="$MAIN"
if touched_is t17 "$WTB"; then pass "relative operand escaping the cwd worktree is touched"; else fail "relative operand touch not recorded: |$(cat "$FP_ROOT/t17/touched" 2>/dev/null)|"; fi
# After a -C, a relative operand is relative to that directory (git applies
# -C before it reads the operand). The cwd is the nested dir wtA/sub, whose
# own `../wtD` names wtA/wtD, no such worktree; the -C dir wtC sits beside
# wtD, so only a base moved by the -C reaches wtD.
mkdir -p "$TMP/wtA/sub"
run "$(mk_start "$AUD" t18)"
PCWD="$TMP/wtA/sub"
run "$(mk_bash "$AUD" t18 "git -C ../../wtC diff ../wtD/f")"
PCWD="$MAIN"
if touched_is t18 "$WTD"; then pass "Bash relative operand after -C resolves from the -C directory, not the payload cwd"; else fail "relative operand after -C resolved wrong: |$(cat "$FP_ROOT/t18/touched" 2>/dev/null)|"; fi
# A `./`-led operand escapes the same way (`./../wtB/f` from wtC reaches wtB);
# the positive row, since from $MAIN a `./` operand touches nothing either way.
run "$(mk_start "$AUD" t19)"
PCWD="$TMP/wtC"
run "$(mk_bash "$AUD" t19 "git diff ./../wtB/f ./../wtB/g")"
PCWD="$MAIN"
if touched_is t19 "$WTB"; then pass "a relative ./ operand escaping the cwd worktree is touched"; else fail "./ operand touch not recorded: |$(cat "$FP_ROOT/t19/touched" 2>/dev/null)|"; fi
# A bare relative operand (no `./` or `../`) reaches a task worktree nested
# under the cwd: task worktrees live under $MAIN/.claude/war-worktrees/, and
# the guard admits `git diff --no-index <rel> /dev/null` (`.` and `/` are in
# its character allowlist, no diff flag is policed). The nested marker dir is
# never a registered worktree, so the start-record rows above are unaffected.
mkdir -p "$MAIN/.claude/war-worktrees/r/wtN"
printf 'marker\n' > "$MAIN/.claude/war-worktrees/r/wtN/.war-task"
WTN="$(cd "$MAIN/.claude/war-worktrees/r/wtN" && pwd -P)"
run "$(mk_start "$AUD" t20)"
run "$(mk_bash "$AUD" t20 "git diff --no-index .claude/war-worktrees/r/wtN/f /dev/null")"
if touched_is t20 "$WTN"; then pass "a bare relative operand into a nested task worktree is touched"; else fail "bare relative operand touch not recorded: |$(cat "$FP_ROOT/t20/touched" 2>/dev/null)|"; fi
# A `--<opt>=<path>` token is classified by its value: the guard admits every
# `--opt=value` form, and `git blame --contents=<file>` reads that file.
run "$(mk_start "$AUD" t21)"
run "$(mk_bash "$AUD" t21 "git blame --contents=$TMP/wtB/f HEAD -- f")"
if touched_is t21 "$WTB"; then pass "a --opt=/abs/path value is touched"; else fail "--opt=/abs value touch not recorded: |$(cat "$FP_ROOT/t21/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" t22)"
PCWD="$TMP/wtC"
run "$(mk_bash "$AUD" t22 "git blame --contents=../wtB/f HEAD -- f")"
PCWD="$MAIN"
if touched_is t22 "$WTB"; then pass "a --opt=../path value resolves against the base and is touched"; else fail "--opt=../ value touch not recorded: |$(cat "$FP_ROOT/t22/touched" 2>/dev/null)|"; fi
# Negative control for the classifier: a slashless token that names no
# worktree (the subcommand, a flag, HEAD~1, a plain file) resolves to the
# base, so from $MAIN (no marker) the touched set stays empty.
run "$(mk_start "$AUD" t23)"
run "$(mk_bash "$AUD" t23 "git log --oneline -1 HEAD~1 -- f")"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/t23/touched" ]; then pass "slashless Bash tokens touch nothing beyond the cwd fallback"; else fail "slashless token touched something (rc=$RC touched=|$(cat "$FP_ROOT/t23/touched" 2>/dev/null)|)"; fi
# A slashless operand IS routed: after a `-C` into the directory that holds
# the task worktrees, a bare `wtA` names a whole worktree, and `diff
# --no-index wtA wtB` recurses both. The guard admits the form (one `-C
# <path>` peeled, no diff flag policed). The touched set must be exactly the
# two worktrees: the -C dir ($TMP, no marker) and the `diff` and `--no-index`
# tokens add no line. Red with the old `*/*` arm (both operands skipped).
run "$(mk_start "$AUD" t24)"
run "$(mk_bash "$AUD" t24 "git -C $TMP diff --no-index wtA wtB")"
if touched_is t24 "$(printf '%s\n%s' "$WTA" "$WTB")"; then pass "slashless operands after -C into the worktrees' parent touch exactly the worktrees they name"; else fail "slashless operands after -C not routed: |$(cat "$FP_ROOT/t24/touched" 2>/dev/null)|"; fi
# The real layout: `-C $MAIN/.claude/war-worktrees/<run>` then a bare task
# name, from the main checkout.
run "$(mk_start "$AUD" t25)"
run "$(mk_bash "$AUD" t25 "git -C $MAIN/.claude/war-worktrees/r diff --no-index wtN /dev/null")"
if touched_is t25 "$WTN"; then pass "a bare task name after -C into the run directory touches that task worktree"; else fail "bare task name after -C into the run dir not touched: |$(cat "$FP_ROOT/t25/touched" 2>/dev/null)|"; fi
# A HOME-relative operand: the seat's shell expands a word-initial `~/`
# before git runs, so `git diff --no-index ~/wtB/f /dev/null` reads wtB. HOME
# is the fixture dir, as in the -C tilde rows. Red without tilde expansion
# on the operand arm (`$MAIN/~/wtB/f` resolves to $MAIN, no marker).
_home="$HOME"; HOME="$TMP"
run "$(mk_start "$AUD" t26)"
run "$(mk_bash "$AUD" t26 "git diff --no-index ~/wtB/f /dev/null")"
HOME="$_home"
if touched_is t26 "$WTB"; then pass "a HOME-relative ~/ Bash operand expands the tilde and touches that worktree"; else fail "tilde operand not touched: |$(cat "$FP_ROOT/t26/touched" 2>/dev/null)|"; fi
# A `~<name>` operand is recorded literal, like the -C form, and the verdict
# arm escalates it as unresolved instead of comparing nothing.
run "$(mk_start "$AUD" t27)"
run "$(mk_bash "$AUD" t27 "git diff --no-index ~nosuchuser/wtB/f /dev/null")"
run "$(mk_verdict "$AUD" t27)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
if touched_is t27 "~nosuchuser/wtB/f" && [ "$rsn" = "AUDIT-TAMPER: unverifiable fingerprint (unresolved Bash path ~nosuchuser/wtB/f)" ]; then
  pass "a ~<name> Bash operand is recorded literal and escalates as an unresolved Bash path"
else
  fail "tilde-name operand not escalated (touched=|$(cat "$FP_ROOT/t27/touched" 2>/dev/null)| rsn=|$rsn|)"
fi
# A `~-` operand is unresolved too (PIN-7): the payload carries no OLDPWD. The
# cwd is wtC (unmarked), so a payload-cwd reading of `~-/../wtB/f` would touch
# wtB; the hook records the token literal and the verdict escalates it.
run "$(mk_start "$AUD" t27b)"
PCWD="$TMP/wtC"
run "$(mk_bash "$AUD" t27b "git diff --no-index ~-/../wtB/f /dev/null")"
run "$(mk_verdict "$AUD" t27b)"
PCWD="$MAIN"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
if touched_is t27b "~-/../wtB/f" && [ "$rsn" = "AUDIT-TAMPER: unverifiable fingerprint (unresolved Bash path ~-/../wtB/f)" ]; then
  pass "a ~-/<path> Bash operand is recorded literal: tilde-minus operand escalates as unresolved"
else
  fail "tilde-minus operand not escalated (touched=|$(cat "$FP_ROOT/t27b/touched" 2>/dev/null)| rsn=|$rsn|)"
fi

# ---------------------------------------------------------------------------
finish audit-tree-fingerprint.core.test.sh
