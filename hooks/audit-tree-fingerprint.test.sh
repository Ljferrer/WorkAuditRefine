#!/usr/bin/env bash
# Tests for the WAR audit tree fingerprint hook (hooks/audit-tree-fingerprint.sh).
# Plan 2026-10-20-rea-artifact-evidence Task 6.2 (D22).
#
# The hook acts only for agent types ending `war-auditor` or
# `war-evidence-auditor`. SubagentStart records every `.war-task` worktree's
# fingerprint. PreToolUse on Read/Bash/Glob/Grep records the worktree a call
# reaches. PreToolUse on StructuredOutput compares the touched worktrees and,
# on a mismatch or an unverifiable fingerprint, allows the call with an
# `updatedInput` whose verdict is `escalate` and whose escalate_reason starts
# `AUDIT-TAMPER:`. SubagentStop records a mismatch and never blocks. No arm
# writes a worktree's index (GIT_OPTIONAL_LOCKS=0): pinned by an index-bytes
# oracle over a staled index, with its own sensitivity row.
#
# FIXTURES: a throwaway repo with real worktrees under a mktemp dir, outside
# any git working tree (git-probing-hook-requires-fixtures-outside-any-git-repo).
# Payloads are built with jq --arg and fed on stdin.
#
# SEARCH-ROOT CONVENTION (guard-conventions.test.sh lint 2): every grep below
# names its file (the hook, hooks.json, the recovery doc); no `find`, no `grep -r`.
#
# Plain-bash assertion runner. Runs under macOS bash 3.2.57 (no globstar, no
# associative arrays, no ${,,}). cwd-independent. Exit 0 = all cases passed.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
HOOK="$HERE/audit-tree-fingerprint.sh"
HJSON="$HERE/hooks.json"
DOC="$HERE/../skills/war/references/resume-and-recovery.md"

fails=0
n=0
pass() { n=$((n + 1)); printf 'ok %d - %s\n' "$n" "$1"; }
fail() { n=$((n + 1)); fails=$((fails + 1)); printf 'FAIL %d - %s\n' "$n" "$1"; }

# --- fixture repo ------------------------------------------------------------
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1
# The no-optional-locks rows read git's default: the hook sets the opt-out
# itself, and an inherited opt-out would hide a hook that dropped it.
unset GIT_OPTIONAL_LOCKS
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t.invalid GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t.invalid
TMP="$(mktemp -d 2>/dev/null || mktemp -d -t atfp)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

MAIN="$TMP/main"
git init -q "$MAIN"
printf 'base\n' > "$MAIN/f"
git -C "$MAIN" add f
git -C "$MAIN" commit -q -m base
git -C "$MAIN" worktree add -q "$TMP/wtA" -b a
git -C "$MAIN" worktree add -q "$TMP/wtB" -b b
git -C "$MAIN" worktree add -q "$TMP/wtC" -b c
git -C "$MAIN" worktree add -q "$TMP/wtD" -b d
printf '.war-task\n' >> "$MAIN/.git/info/exclude"
printf 'marker\n' > "$TMP/wtA/.war-task"
printf 'marker\n' > "$TMP/wtB/.war-task"
printf 'marker\n' > "$TMP/wtD/.war-task"
# wtC carries no marker: never fingerprinted.
WTA="$(cd "$TMP/wtA" && pwd -P)"
WTB="$(cd "$TMP/wtB" && pwd -P)"
WTC="$(cd "$TMP/wtC" && pwd -P)"
WTD="$(cd "$TMP/wtD" && pwd -P)"
FP_ROOT="$MAIN/.claude/war/audit-fingerprints"
TAMPER_ROOT="$MAIN/.claude/war/audit-tamper"

AUD="work-audit-refine:war-auditor"
EVA="work-audit-refine:war-evidence-auditor"

# --- payload builders --------------------------------------------------------
mk_start() { jq -nc --arg at "$1" --arg id "$2" --arg c "$MAIN" '{hook_event_name:"SubagentStart",agent_type:$at,agent_id:$id,cwd:$c}'; }
mk_stop()  { jq -nc --arg at "$1" --arg id "$2" --arg c "$MAIN" '{hook_event_name:"SubagentStop",agent_type:$at,agent_id:$id,cwd:$c}'; }
# mk_tool <agent_type> <agent_id> <tool_name> <tool_input-json>
mk_tool()  { jq -nc --arg at "$1" --arg id "$2" --arg tn "$3" --argjson ti "$4" --arg c "$MAIN" '{hook_event_name:"PreToolUse",agent_type:$at,agent_id:$id,tool_name:$tn,tool_input:$ti,cwd:$c}'; }
mk_read()  { mk_tool "$1" "$2" Read "$(jq -nc --arg p "$3" '{file_path:$p}')"; }
mk_glob()  { mk_tool "$1" "$2" Glob "$(jq -nc --arg p "$3" '{pattern:"**/*",path:$p}')"; }
mk_bash()  { mk_tool "$1" "$2" Bash "$(jq -nc --arg c "$3" '{command:$c}')"; }
VERDICT='{"verdict":"approve","findings":[{"severity":"Minor","title":"t"}],"confidence":"high"}'
mk_verdict() { mk_tool "$1" "$2" StructuredOutput "$VERDICT"; }

# run <payload> -> sets RC, OUT, ERR
run() {
  OUT="$(printf '%s' "$1" | bash "$HOOK" 2>"$TMP/err")"; RC=$?
  ERR="$(cat "$TMP/err")"
}

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
if [ "$lines" = 3 ] && grep -Fq " $WTA" "$START" && grep -Fq " $WTB" "$START" && grep -Fq " $WTD" "$START" && ! grep -Fq " $WTC" "$START"; then
  pass "start record lists every .war-task worktree and no unmarked worktree"
else
  fail "start record content wrong (lines=$lines): $(cat "$START" 2>/dev/null)"
fi
head_a="$(git -C "$TMP/wtA" rev-parse HEAD)"
if grep -Fq "^$head_a " "$START" || grep -q "^$head_a [0-9a-f]\{64\} " "$START"; then
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
# stale <mtime>: gives wtA's tracked file that old mtime, content unchanged.
# Each call takes a mtime unlike the last one, so the index is stat-stale
# again even if the previous call's status wrote it back.
stale() { touch -t "$1" "$TMP/wtA/f"; }
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
# A git error on a touched worktree (its .git link removed) is unverifiable.
run "$(mk_start "$AUD" a4)"
run "$(mk_read "$AUD" a4 "$TMP/wtD/f")"
rm -f "$TMP/wtD/.git"
run "$(mk_verdict "$AUD" a4)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: unverifiable fingerprint (git error on $WTD)") pass "a git error on a touched worktree escalates as unverifiable" ;; *) fail "git error not caught: |$OUT| err=|$ERR|" ;; esac

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

# --- exit contract: 0 or 2 only -----------------------------------------------
run '{not json'
case "$ERR" in *WAR:*) m=1 ;; *) m=0 ;; esac
if [ "$RC" = 2 ] && [ "$m" = 1 ]; then pass "payload not JSON -> exit 2 with a WAR: marker"; else fail "not-JSON payload rc=$RC err=|$ERR|"; fi
run "$(jq -nc --arg at "$AUD" --arg c "$MAIN" '{hook_event_name:"PreToolUse",agent_type:$at,agent_id:"a1",tool_name:"Write",tool_input:{},cwd:$c}')"
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then pass "an unmatched tool_name passes through"; else fail "unmatched tool rc=$RC out=|$OUT|"; fi
# jq missing: an auditor payload exits 2 (fail-closed); a worker payload passes
# through, so a jq-less host never blocks the main session's every Read. The
# payloads are built BEFORE the PATH override (the builders need the real jq);
# the shim PATH carries only the tools the jq-less branch needs.
SHIM="$(mktemp -d 2>/dev/null || mktemp -d -t atfpshim)"
for _t in cat grep printf; do _b="$(command -v "$_t")" && [ -n "$_b" ] && ln -s "$_b" "$SHIM/$_t"; done
_aud_payload="$(mk_verdict "$AUD" a1)"
_wrk_payload="$(mk_verdict 'work-audit-refine:war-worker' w1)"
_rc=0; _err="$(printf '%s' "$_aud_payload" | PATH="$SHIM" "$BASH" "$HOOK" 2>&1 >/dev/null)" || _rc=$?
case "$_err" in *"jq is not installed"*) m=1 ;; *) m=0 ;; esac
if [ "$_rc" = 2 ] && [ "$m" = 1 ]; then pass "jq missing on an auditor payload -> exit 2 (fail-closed)"; else fail "jq missing auditor rc=$_rc err=|$_err|"; fi
_rc=0; _out="$(printf '%s' "$_wrk_payload" | PATH="$SHIM" "$BASH" "$HOOK" 2>/dev/null)" || _rc=$?
if [ "$_rc" = 0 ] && [ -z "$_out" ]; then pass "jq missing on a worker payload -> pass-through"; else fail "jq missing worker rc=$_rc out=|$_out|"; fi
rm -rf "$SHIM"

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
for m in 'StructuredOutput' 'Read|Bash|Glob|Grep'; do
  reg="$(jq -r --arg m "$m" '.hooks.PreToolUse[] | select(.matcher == $m) | .hooks[].command' "$HJSON" 2>/dev/null)"
  case "$reg" in
    *audit-tree-fingerprint.sh*) pass "hooks.json PreToolUse($m) -> audit-tree-fingerprint.sh" ;;
    *) fail "hooks.json has no PreToolUse matcher $m entry for the hook (got |$reg|)" ;;
  esac
done
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

# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "audit-tree-fingerprint.test.sh: PASS"
