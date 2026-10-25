#!/usr/bin/env bash
# Tests for the WAR audit tree fingerprint hook (hooks/audit-tree-fingerprint.sh).
# Plan 2026-10-20-rea-artifact-evidence Task 6.2 (D22), Task 7.2 (deadline)
# and Task 8.1 (the per-call watchdog, every operand form the guard admits).
#
# The hook acts only for agent types ending `war-auditor` or
# `war-evidence-auditor`. SubagentStart records every `.war-task` worktree's
# fingerprint. PreToolUse on Read/Bash/Glob/Grep records the worktree a call
# reaches. PreToolUse on StructuredOutput compares the touched worktrees and,
# on a mismatch or an unverifiable fingerprint, allows the call with an
# `updatedInput` whose verdict is `escalate` and whose escalate_reason starts
# `AUDIT-TAMPER:`. SubagentStop records a mismatch and never blocks. No arm
# writes a worktree's index (GIT_OPTIONAL_LOCKS=0): pinned by an index-bytes
# oracle over a staled index, with its own sensitivity row. The hook keeps
# its own deadline under the hooks.json timeout (Task 7.2): past it, the
# verdict escalates with `AUDIT-TAMPER: fingerprint timeout` and the record
# carries `timeout: true`; the pre-check rows set
# WAR_FINGERPRINT_DEADLINE_SECONDS=0, and the watchdog rows (Task 8.1) cross
# a 2 s deadline inside a `git status` slowed by a shim.
#
# FIXTURES: a throwaway repo with real worktrees under a mktemp dir, outside
# any git working tree (git-probing-hook-requires-fixtures-outside-any-git-repo),
# plus a declared submodule (path `sub dir`, a space in it) with a marked
# worktree cut from inside the submodule, and a declared-but-never-initialized
# submodule (`ghost`, the empty dir a plain clone leaves). Payloads are built
# with jq --arg and fed on stdin.
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
# A submodule task's worktree is cut cwd-scoped to the submodule path, so it
# is registered in the submodule's git dir (.git/modules/<path>), not the
# superproject's. The submodule path carries a space; `ghost` is declared in
# .gitmodules but never initialized: an empty dir with no .git entry, where a
# `git -C` would walk up to the superproject.
git init -q "$TMP/subsrc"
printf 'sb\n' > "$TMP/subsrc/s"
git -C "$TMP/subsrc" add s
git -C "$TMP/subsrc" commit -q -m sb
git -C "$MAIN" -c protocol.file.allow=always submodule add -q "$TMP/subsrc" "sub dir"
git -C "$MAIN" commit -q -m addsub
git config -f "$MAIN/.gitmodules" submodule.ghost.path ghost
mkdir -p "$MAIN/ghost"
SUB="$MAIN/sub dir"
git -C "$SUB" worktree add -q "$TMP/wtS" -b s
printf 'marker\n' > "$TMP/wtS/.war-task"
SUBGD="$(git -C "$SUB" rev-parse --path-format=absolute --git-common-dir)"
mkdir -p "$SUBGD/info"
printf '.war-task\n' >> "$SUBGD/info/exclude"
WTA="$(cd "$TMP/wtA" && pwd -P)"
WTB="$(cd "$TMP/wtB" && pwd -P)"
WTC="$(cd "$TMP/wtC" && pwd -P)"
WTD="$(cd "$TMP/wtD" && pwd -P)"
WTS="$(cd "$TMP/wtS" && pwd -P)"
FP_ROOT="$MAIN/.claude/war/audit-fingerprints"
TAMPER_ROOT="$MAIN/.claude/war/audit-tamper"

AUD="work-audit-refine:war-auditor"
EVA="work-audit-refine:war-evidence-auditor"

# --- payload builders --------------------------------------------------------
# PCWD is the payload cwd; a row that needs the cwd-fallback arm sets it.
PCWD="$MAIN"
mk_start() { jq -nc --arg at "$1" --arg id "$2" --arg c "$PCWD" '{hook_event_name:"SubagentStart",agent_type:$at,agent_id:$id,cwd:$c}'; }
mk_stop()  { jq -nc --arg at "$1" --arg id "$2" --arg c "$PCWD" '{hook_event_name:"SubagentStop",agent_type:$at,agent_id:$id,cwd:$c}'; }
# mk_tool <agent_type> <agent_id> <tool_name> <tool_input-json>
mk_tool()  { jq -nc --arg at "$1" --arg id "$2" --arg tn "$3" --argjson ti "$4" --arg c "$PCWD" '{hook_event_name:"PreToolUse",agent_type:$at,agent_id:$id,tool_name:$tn,tool_input:$ti,cwd:$c}'; }
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
# touched_is <agent_id> <expected touched-file content>
touched_is() { [ "$(cat "$FP_ROOT/$1/touched" 2>/dev/null)" = "$2" ]; }
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
# `~+` and `~-` are admitted too and the seat's shell expands them (PWD and
# OLDPWD); the hook reads both from the payload cwd (wtA here, so `~+/../wtB`
# reaches wtB). A `~<name>` form needs getpwnam, so the hook records it
# literal and the verdict arm escalates it.
PCWD="$TMP/wtA"
run "$(mk_start "$AUD" t12)"
run "$(mk_bash "$AUD" t12 "git -C ~+/../wtB log")"
if touched_is t12 "$WTB"; then pass "Bash unquoted -C ~+/<path> resolves from the payload cwd and touches that worktree"; else fail "tilde-plus -C touch not recorded: |$(cat "$FP_ROOT/t12/touched" 2>/dev/null)|"; fi
run "$(mk_start "$AUD" t13)"
run "$(mk_bash "$AUD" t13 "git -C ~-/../wtB log")"
if touched_is t13 "$WTB"; then pass "Bash unquoted -C ~-/<path> resolves from the payload cwd and touches that worktree"; else fail "tilde-minus -C touch not recorded: |$(cat "$FP_ROOT/t13/touched" 2>/dev/null)|"; fi
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
# --- Task 8.1 operand forms (ruling B, 2026-10-24) ---------------------------
# A `-C` after the subcommand word is git's copy-detection flag (diff, log,
# blame), never a global `-C`: the operand base must not move. From wtC the two
# operands resolve against wtC and reach wtB and wtD; with the old global-only
# reading, `-C ../wtB/f` moved the base into wtB/f and `../wtD/f` resolved to
# wtB/wtD, no such worktree. Red with the gate removed.
run "$(mk_start "$AUD" t28)"
PCWD="$TMP/wtC"
run "$(mk_bash "$AUD" t28 "git diff -C ../wtB/f ../wtD/f")"
PCWD="$MAIN"
if touched_is t28 "$(printf '%s\n%s' "$WTB" "$WTD")"; then pass "subcommand -C does not move the operand base"; else fail "subcommand -C moved the operand base: |$(cat "$FP_ROOT/t28/touched" 2>/dev/null)|"; fi
# The same gate on the real shape: one global -C into the worktrees' parent,
# then `diff -C --no-index T1 T2`. The touched set is exactly the two
# worktrees (the old reading emptied it: `-C --no-index` moved the base to
# `$TMP/--no-index`, and wtA, wtB resolved under it).
run "$(mk_start "$AUD" t29)"
run "$(mk_bash "$AUD" t29 "git -C $TMP diff -C --no-index wtA wtB")"
if touched_is t29 "$(printf '%s\n%s' "$WTA" "$WTB")"; then pass "a global -C followed by a subcommand -C keeps the operand base at the global -C directory"; else fail "global then subcommand -C routed wrong: |$(cat "$FP_ROOT/t29/touched" 2>/dev/null)|"; fi
# A relative operand with a mid-path `..` segment escapes the cwd worktree:
# from wtA (wtA/sub exists from row t18), `sub/../../wtB/f` is wtB/f.
# `diff` resolves to the base (wtA) first, so the set is wtA then wtB.
run "$(mk_start "$AUD" t30)"
PCWD="$TMP/wtA"
run "$(mk_bash "$AUD" t30 "git diff sub/../../wtB/f sub/../../wtB/g")"
PCWD="$MAIN"
if touched_is t30 "$(printf '%s\n%s' "$WTA" "$WTB")"; then pass "mid-path dotdot operand is touched"; else fail "mid-path .. operand not touched: |$(cat "$FP_ROOT/t30/touched" 2>/dev/null)|"; fi
# A `--<opt>=<value>` whose value is a bare relative path (no `./`, no `../`)
# into a nested task worktree: `git blame --contents=<file>` reads that file.
# `HEAD`, `--` and `f` resolve to $MAIN (no marker), so wtE is the only line.
mkdir -p "$MAIN/.claude/war-worktrees/r/wtE"
printf 'marker\n' > "$MAIN/.claude/war-worktrees/r/wtE/.war-task"
WTE="$(cd "$MAIN/.claude/war-worktrees/r/wtE" && pwd -P)"
run "$(mk_start "$AUD" t31)"
run "$(mk_bash "$AUD" t31 "git blame --contents=.claude/war-worktrees/r/wtE/f HEAD -- f")"
if touched_is t31 "$WTE"; then pass "option value path inside a worktree is touched"; else fail "--opt=<bare relative> value not touched: |$(cat "$FP_ROOT/t31/touched" 2>/dev/null)|"; fi
# The space form of a file-valued flag: the value is the next token, resolved
# against the base like every other operand.
run "$(mk_start "$AUD" t32)"
run "$(mk_bash "$AUD" t32 "git blame --ignore-revs-file .claude/war-worktrees/r/wtE/revs HEAD -- f")"
if touched_is t32 "$WTE"; then pass "a space-form file-valued flag's bare relative value is touched"; else fail "--ignore-revs-file <bare relative> value not touched: |$(cat "$FP_ROOT/t32/touched" 2>/dev/null)|"; fi
# A `~/<path>` operand and a bare `~` operand inside a task worktree: HOME is
# wtB for this row, the cwd is wtC (no marker), so wtB is the only line.
_home="$HOME"; HOME="$TMP/wtB"
run "$(mk_start "$AUD" t33)"
PCWD="$TMP/wtC"
run "$(mk_bash "$AUD" t33 "git diff --no-index ~/f ~")"
PCWD="$MAIN"
HOME="$_home"
if touched_is t33 "$WTB"; then pass "tilde operand inside a worktree is touched"; else fail "tilde operand inside a worktree not touched: |$(cat "$FP_ROOT/t33/touched" 2>/dev/null)|"; fi
# A directory operand that holds task worktrees: `git diff <dir> /dev/null`
# from wtC implies --no-index ($TMP is outside wtC's work tree) and recurses
# every worktree under $TMP, so each marked one is touched, in `git worktree
# list` order (the superproject's, then the submodule's). wtD still has its
# .git here (row a4 removes it later).
run "$(mk_start "$AUD" t34)"
PCWD="$TMP/wtC"
run "$(mk_bash "$AUD" t34 "git diff $TMP /dev/null")"
PCWD="$MAIN"
if touched_is t34 "$(printf '%s\n%s\n%s\n%s' "$WTA" "$WTB" "$WTD" "$WTS")"; then pass "directory operand holding worktrees touches each"; else fail "directory operand walk-down wrong: |$(cat "$FP_ROOT/t34/touched" 2>/dev/null)|"; fi
# The walk-down is narrowed to a --no-index command (explicit, or implied by
# git for a two-path `diff` with either path outside the work tree) or an
# operand outside the base's work tree: an in-repo directory operand (`./`
# from $MAIN, three operands, so no implied --no-index) reads the repository's
# own tree and touches no task worktree. A marked worktree nested under $MAIN
# (the real layout) is the oracle for this row and the rows below it down to
# its removal, which keeps the later start-record line counts unchanged.
git -C "$MAIN" worktree add -q "$MAIN/.claude/wtQ" -b q
printf 'marker\n' > "$MAIN/.claude/wtQ/.war-task"
WTQ="$(cd "$MAIN/.claude/wtQ" && pwd -P)"
run "$(mk_start "$AUD" t35)"
run "$(mk_bash "$AUD" t35 "git diff HEAD -- ./")"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/t35/touched" ]; then pass "an in-repo directory operand without --no-index touches no task worktree"; else fail "in-repo directory operand walked down (rc=$RC touched=|$(cat "$FP_ROOT/t35/touched" 2>/dev/null)|)"; fi
# The cwd fallback never walks down: `git log -1` from $MAIN reads $MAIN's
# own tree, not the nested worktree.
run "$(mk_start "$AUD" t36)"
run "$(mk_bash "$AUD" t36 "git log -1")"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/t36/touched" ]; then pass "the Bash cwd fallback does not walk down into nested task worktrees"; else fail "cwd fallback walked down (rc=$RC touched=|$(cat "$FP_ROOT/t36/touched" 2>/dev/null)|)"; fi
# With --no-index an in-repo directory operand does recurse: `.` from $MAIN
# reaches the nested worktree.
run "$(mk_start "$AUD" t37)"
run "$(mk_bash "$AUD" t37 "git diff --no-index . /dev/null")"
if touched_is t37 "$WTQ"; then pass "an in-repo directory operand under --no-index touches the nested task worktree"; else fail "--no-index in-repo directory operand not walked: |$(cat "$FP_ROOT/t37/touched" 2>/dev/null)|"; fi
# git implies --no-index when exactly two paths follow `diff` and EITHER is
# outside the work tree (builtin/diff.c), so `git diff . /dev/null` from $MAIN
# recurses `.` with no --no-index token: the nested worktree must be touched.
# The oracle is git itself: the same command in the fixture exits 0 and names
# no "outside repository" error, where a non-implied form (t41, t44) does.
run "$(mk_start "$AUD" t38)"
run "$(mk_bash "$AUD" t38 "git diff . /dev/null")"
if touched_is t38 "$WTQ"; then pass "an in-repo directory operand under implied --no-index touches the nested task worktree"; else fail "implied --no-index in-repo directory operand not walked: |$(cat "$FP_ROOT/t38/touched" 2>/dev/null)|"; fi
git -C "$MAIN" diff --quiet . /dev/null 2>"$TMP/err"
if ! grep -q 'outside repository' "$TMP/err"; then pass "git itself treats the two-path form with one outside path as --no-index"; else fail "git did not imply --no-index for 'diff . /dev/null': $(cat "$TMP/err")"; fi
# The live layout: the run directory (`.claude` here) diffed against a
# directory outside $MAIN, behind a leading flag git skips when it counts the
# paths. $TMP/wtC is unmarked and holds no worktree, so only wtQ is touched.
run "$(mk_start "$AUD" t39)"
run "$(mk_bash "$AUD" t39 "git diff --stat .claude $TMP/wtC")"
if touched_is t39 "$WTQ"; then pass "the run directory diffed against a directory outside the repo touches its nested task worktree"; else fail "run-directory operand under implied --no-index not walked: |$(cat "$FP_ROOT/t39/touched" 2>/dev/null)|"; fi
# A `--` ends the leading options and is not counted as a path.
run "$(mk_start "$AUD" t40)"
run "$(mk_bash "$AUD" t40 "git diff -- . /dev/null")"
if touched_is t40 "$WTQ"; then pass "a -- before the two paths still implies --no-index"; else fail "-- form of implied --no-index not walked: |$(cat "$FP_ROOT/t40/touched" 2>/dev/null)|"; fi
# Three operands never imply --no-index (git refuses the outside path), so
# the in-repo directory is not walked.
run "$(mk_start "$AUD" t41)"
run "$(mk_bash "$AUD" t41 "git diff HEAD . /dev/null")"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/t41/touched" ]; then pass "three operands never imply --no-index, so the in-repo directory is not walked"; else fail "three-operand diff walked down (rc=$RC touched=|$(cat "$FP_ROOT/t41/touched" 2>/dev/null)|)"; fi
if ! git -C "$MAIN" diff --quiet HEAD . /dev/null 2>"$TMP/err" && grep -q 'outside repository' "$TMP/err"; then pass "git itself refuses the outside path when three operands follow diff"; else fail "git implied --no-index for 'diff HEAD . /dev/null': $(cat "$TMP/err")"; fi
# Two in-repo paths imply nothing: `.` is not walked.
run "$(mk_start "$AUD" t42)"
run "$(mk_bash "$AUD" t42 "git diff . .claude")"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/t42/touched" ]; then pass "two in-repo paths imply no --no-index, so the in-repo directory is not walked"; else fail "two in-repo paths walked down (rc=$RC touched=|$(cat "$FP_ROOT/t42/touched" 2>/dev/null)|)"; fi
# The paths resolve against the global -C base, not the payload cwd: from
# wtC, `git -C $MAIN diff . /dev/null` reads $MAIN's `.`, so wtQ is touched
# and nothing under wtC is.
run "$(mk_start "$AUD" t43)"
PCWD="$TMP/wtC"
run "$(mk_bash "$AUD" t43 "git -C $MAIN diff . /dev/null")"
PCWD="$MAIN"
if touched_is t43 "$WTQ"; then pass "implied --no-index resolves its two paths against the global -C base"; else fail "implied --no-index under -C wrong: |$(cat "$FP_ROOT/t43/touched" 2>/dev/null)|"; fi
# Only `diff` implies --no-index: `git log . /dev/null` refuses the outside
# path and reads nothing under `.`.
run "$(mk_start "$AUD" t44)"
run "$(mk_bash "$AUD" t44 "git log . /dev/null")"
if [ "$RC" = 0 ] && [ ! -s "$FP_ROOT/t44/touched" ]; then pass "a two-path non-diff command implies no --no-index"; else fail "non-diff two-path command walked down (rc=$RC touched=|$(cat "$FP_ROOT/t44/touched" 2>/dev/null)|)"; fi
git -C "$MAIN" worktree remove --force "$MAIN/.claude/wtQ"
git -C "$MAIN" branch -q -D q

# --- content sensitivity: a second edit to an already-dirty path -------------
# Each path below is dirty before the seat starts and edited once after, so
# its status record is the same at verdict time; only the blob hash moves.
# porcelain v1 C-quotes a path with a space, a double quote or a control byte
# even under core.quotePath=false; the -z form carries it raw. A staged rename
# record carries its source path as an extra -z field; its blob is the new
# path's. The --stdin-paths batch reader ends a path at a newline, strips a
# trailing CR and C-unquotes a line whose first byte is a double quote (a raw
# name there kills the whole batch): each of those three forms is hashed
# outside the batch, and a plain dirty sibling beside such a name must keep
# its own content sensitivity.
# escalates_on <agent_id> <worktree>: the seat's verdict names that worktree.
escalates_on() {
  run "$(mk_verdict "$AUD" $1)"
  _v="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
  _r="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
  case "$_r" in "AUDIT-TAMPER: $2 changed during the audit round ("*) [ "$RC" = 0 ] && [ "$_v" = escalate ] ;; *) false ;; esac
}
printf 'one\n' > "$TMP/wtB/a b"
run "$(mk_start "$AUD" c1)"
run "$(mk_read "$AUD" c1 "$TMP/wtB/f")"
printf 'two\n' > "$TMP/wtB/a b"
if escalates_on c1 "$WTB"; then pass "a second edit to an untracked path with a space escalates (status record unchanged)"; else fail "space path edit not caught (rc=$RC out=|$OUT| err=|$ERR|)"; fi
printf 'one\n' > "$TMP/wtB/q\"x"
run "$(mk_start "$AUD" c2)"
run "$(mk_read "$AUD" c2 "$TMP/wtB/f")"
printf 'two\n' > "$TMP/wtB/q\"x"
if escalates_on c2 "$WTB"; then pass "a second edit to an untracked path with a double quote escalates"; else fail "double-quote path edit not caught (rc=$RC out=|$OUT|)"; fi
printf 'one\n' > "$TMP/wtB/n
l"
run "$(mk_start "$AUD" c3)"
run "$(mk_read "$AUD" c3 "$TMP/wtB/f")"
printf 'two\n' > "$TMP/wtB/n
l"
if escalates_on c3 "$WTB"; then pass "a second edit to an untracked path with a newline escalates"; else fail "newline path edit not caught (rc=$RC out=|$OUT|)"; fi
git -C "$TMP/wtB" mv g g2
printf 'r1\n' >> "$TMP/wtB/g2"
run "$(mk_start "$AUD" c4)"
run "$(mk_read "$AUD" c4 "$TMP/wtB/f")"
printf 'r2\n' >> "$TMP/wtB/g2"
if escalates_on c4 "$WTB"; then pass "a second edit to the new path of a staged rename escalates"; else fail "rename path edit not caught (rc=$RC out=|$OUT|)"; fi
printf 'one\n' > "$TMP/wtB/\"lead"
run "$(mk_start "$AUD" c5)"
run "$(mk_read "$AUD" c5 "$TMP/wtB/f")"
printf 'two\n' > "$TMP/wtB/\"lead"
if escalates_on c5 "$WTB"; then pass "a second edit to an untracked path whose first byte is a double quote escalates"; else fail "leading-quote path edit not caught (rc=$RC out=|$OUT|)"; fi
CRN="$(printf 'r\r')"
printf 'one\n' > "$TMP/wtB/$CRN"
run "$(mk_start "$AUD" c6)"
run "$(mk_read "$AUD" c6 "$TMP/wtB/f")"
printf 'two\n' > "$TMP/wtB/$CRN"
if escalates_on c6 "$WTB"; then pass "a second edit to an untracked path ending in CR escalates"; else fail "trailing-CR path edit not caught (rc=$RC out=|$OUT|)"; fi
# The leading-quote and trailing-CR names are still dirty in wtB: a second
# edit to a plain dirty sibling must escalate on its own blob, not vanish
# into a dead batch that marks every batched path `unreadable`.
printf 'one\n' > "$TMP/wtB/p"
run "$(mk_start "$AUD" c7)"
run "$(mk_read "$AUD" c7 "$TMP/wtB/f")"
printf 'two\n' > "$TMP/wtB/p"
if escalates_on c7 "$WTB"; then pass "a second edit to a plain dirty sibling of a leading-quote and a trailing-CR name escalates"; else fail "plain sibling edit not caught beside odd names (rc=$RC out=|$OUT|)"; fi
# Negative control: the same odd names stay dirty, nothing moves, and the
# verdict passes, so the c rows above fail on the edit and not on churn in
# the out-of-batch arm or the batch zip between two runs.
run "$(mk_start "$AUD" c8)"
run "$(mk_read "$AUD" c8 "$TMP/wtB/f")"
run "$(mk_verdict "$AUD" c8)"
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then pass "an unchanged worktree with odd-name dirty paths passes"; else fail "unchanged odd-name worktree did not pass (rc=$RC out=|$OUT| err=|$ERR|)"; fi
# hash-object runs no clean filter: a `text` attribute would normalize CRLF
# to LF on the way in and hide a line-ending-only second edit. One row per
# hash-object arm: the batch (plain name e) and the single call (the CR name).
printf 'e text\nr* text\n' > "$TMP/wtB/.gitattributes"
printf 'x\n' > "$TMP/wtB/e"
run "$(mk_start "$AUD" c9)"
run "$(mk_read "$AUD" c9 "$TMP/wtB/f")"
printf 'x\r\n' > "$TMP/wtB/e"
if escalates_on c9 "$WTB"; then pass "a line-ending-only second edit under a text attribute escalates (batch arm, no clean filter)"; else fail "clean filter hid a CRLF edit in the batch arm (rc=$RC out=|$OUT|)"; fi
printf 'x\n' > "$TMP/wtB/$CRN"
run "$(mk_start "$AUD" c10)"
run "$(mk_read "$AUD" c10 "$TMP/wtB/f")"
printf 'x\r\n' > "$TMP/wtB/$CRN"
if escalates_on c10 "$WTB"; then pass "a line-ending-only second edit to a CR-named path under a text attribute escalates (single-call arm, no clean filter)"; else fail "clean filter hid a CRLF edit in the single-call arm (rc=$RC out=|$OUT|)"; fi
# A symlink is fingerprinted by its link text, never by its target: a
# retarget to a same-content file keeps the status record and the target's
# blob the same, and a link to a directory is not a regular file at all. The
# unchanged links then pass, so the two rows fail on the retarget alone.
printf 'same\n' > "$TMP/wtB/x1"
printf 'same\n' > "$TMP/wtB/x2"
ln -s x1 "$TMP/wtB/lnk"
run "$(mk_start "$AUD" c11)"
run "$(mk_read "$AUD" c11 "$TMP/wtB/f")"
ln -sfn x2 "$TMP/wtB/lnk"
if escalates_on c11 "$WTB"; then pass "an untracked symlink retargeted to a same-content file escalates (link text hashed, target never read)"; else fail "symlink retarget not caught (rc=$RC out=|$OUT| err=|$ERR|)"; fi
mkdir -p "$TMP/wtB/d1" "$TMP/wtB/d2"
ln -s d1 "$TMP/wtB/dlnk"
run "$(mk_start "$AUD" c12)"
run "$(mk_read "$AUD" c12 "$TMP/wtB/f")"
ln -sfn d2 "$TMP/wtB/dlnk"
if escalates_on c12 "$WTB"; then pass "an untracked symlink retargeted between directories escalates"; else fail "directory symlink retarget not caught (rc=$RC out=|$OUT| err=|$ERR|)"; fi
run "$(mk_start "$AUD" c13)"
run "$(mk_read "$AUD" c13 "$TMP/wtB/f")"
run "$(mk_verdict "$AUD" c13)"
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then pass "an unchanged worktree with dirty symlinks passes"; else fail "unchanged symlink worktree did not pass (rc=$RC out=|$OUT| err=|$ERR|)"; fi
# The link text is the whole record: a link to a file OUTSIDE the worktree
# whose target content changes mid-round still passes, because the hook never
# reads the target. This row goes red if the -L arm ever follows the link.
printf 'o1\n' > "$TMP/outside"
ln -s "$TMP/outside" "$TMP/wtB/olnk"
run "$(mk_start "$AUD" c14)"
run "$(mk_read "$AUD" c14 "$TMP/wtB/f")"
printf 'o2\n' >> "$TMP/outside"
run "$(mk_verdict "$AUD" c14)"
if [ "$RC" = 0 ] && [ -z "$OUT" ]; then pass "a symlink whose out-of-worktree target changes passes (symlink target is never read)"; else fail "symlink target was read (rc=$RC out=|$OUT| err=|$ERR|)"; fi

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
# --- the per-call watchdog (Task 8.1, ruling A, 2026-10-24) ------------------
# The deadline rows above expire at a pre-check. These rows cross the deadline
# INSIDE a git call: a `git` shim runs the real git and then sleeps 5 s on the
# status call whose arguments carry SHIM_SLOW (`<worktree> status`), or fails
# before git runs when they carry SHIM_FAIL. The hook must kill the slow call
# at its deadline (2 s here) instead of waiting for it, so each row also
# bounds its own wall time. The shim is on PATH for the run under test only;
# the payload builders use the real jq and git.
REALGIT="$(command -v git)"
SHIMG="$(mktemp -d 2>/dev/null || mktemp -d -t atfpshimg)"
cat > "$SHIMG/git" <<SHIM
#!/bin/bash
case " \$* " in
  *" status "*)
    if [ -n "\${SHIM_FAIL-}" ]; then case "\$*" in *"\$SHIM_FAIL"*) exit 128 ;; esac; fi
    if [ -n "\${SHIM_SLOW-}" ]; then case "\$*" in *"\$SHIM_SLOW"*) "$REALGIT" "\$@"; _rc=\$?; sleep 5; exit \$_rc ;; esac; fi ;;
esac
exec "$REALGIT" "\$@"
SHIM
chmod +x "$SHIMG/git"
# run_shim <payload>: like run, under the shim PATH and a 2 s deadline; sets EL
# to the wall seconds the hook took.
run_shim() {
  _t0=$SECONDS
  OUT="$(printf '%s' "$1" | PATH="$SHIMG:$PATH" WAR_FINGERPRINT_DEADLINE_SECONDS=2 bash "$HOOK" 2>"$TMP/err")"; RC=$?
  EL=$((SECONDS - _t0))
  ERR="$(cat "$TMP/err")"
}
# (1) The verdict arm: wtA is dirty (f modified above), so its fingerprint
# runs status. The slow status is killed at the deadline, the hook returns in
# under 5 s, and the reason names the hashing step.
run "$(mk_start "$AUD" d6)"
run "$(mk_read "$AUD" d6 "$TMP/wtA/f")"
_p="$(mk_verdict "$AUD" d6)"
SHIM_SLOW="$WTA status" run_shim "$_p"
ver="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
rec="$TAMPER_ROOT/d6.json"
case "$rsn" in "AUDIT-TAMPER: fingerprint timeout ($WTA still hashing after "[0-9]*"s, deadline 2s; seat verdict approve)") p=1 ;; *) p=0 ;; esac
if [ "$RC" = 0 ] && [ "$ver" = escalate ] && [ "$p" = 1 ] && [ "$EL" -lt 5 ] && [ "$(jq -r '.timeout' "$rec" 2>/dev/null)" = true ]; then
  pass "watchdog kills a slow git call at the deadline"
else
  fail "watchdog kills a slow git call at the deadline (rc=$RC ver=$ver el=${EL}s rsn=|$rsn| err=|$ERR| rec=$(cat "$rec" 2>/dev/null))"
fi
# (2) The start arm: wtA records before the deadline, wtB's slow status is
# killed at it, and the marker names wtB with an elapsed value of at least the
# deadline (so it came from the killed call, not a pre-check at 0 s). The
# skipped list is wtB plus every worktree after it (wtD has had no .git since
# row a4 and wtS is the submodule's; the start arm never reached either).
_p="$(mk_start "$AUD" d7)"
SHIM_SLOW="$WTB status" run_shim "$_p"
_m="$(cat "$FP_ROOT/d7/timeout" 2>/dev/null)"; _mn="${_m%% *}"
if [ "$RC" = 0 ] && [ "$EL" -lt 5 ] && grep -Fq " $WTA" "$FP_ROOT/d7/start" && ! grep -Fq " $WTB" "$FP_ROOT/d7/start" \
   && [ "$_m" = "$_mn 2 $WTB" ] && [ "$_mn" -ge 2 ] 2>/dev/null \
   && [ "$(cat "$FP_ROOT/d7/timeout-skipped" 2>/dev/null)" = "$(printf '%s\n%s\n%s' "$WTB" "$WTD" "$WTS")" ]; then
  pass "a start-arm watchdog kill records the stop point and lists every worktree it skipped"
else
  fail "start-arm watchdog kill recorded wrong (rc=$RC el=${EL}s marker=|$_m| start=|$(cat "$FP_ROOT/d7/start" 2>/dev/null)| skipped=|$(cat "$FP_ROOT/d7/timeout-skipped" 2>/dev/null)| err=|$ERR|)"
fi
# A seat that touched only the skipped wtB gets the timeout reason, naming the
# stored start-arm deadline (2 s), under the default verdict-arm deadline.
run "$(mk_read "$AUD" d7 "$TMP/wtB/f")"
run "$(mk_verdict "$AUD" d7)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
case "$rsn" in "AUDIT-TAMPER: fingerprint timeout (SubagentStart stopped at $WTB after "[0-9]*"s, deadline 2s; $WTB has no start fingerprint; seat verdict approve)") p=1 ;; *) p=0 ;; esac
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
# never the timeout reason.
_p="$(mk_start "$AUD" d8)"
SHIM_FAIL="$WTA status" SHIM_SLOW="$WTS status" run_shim "$_p"
_m="$(cat "$FP_ROOT/d8/timeout" 2>/dev/null)"
run "$(mk_read "$AUD" d8 "$TMP/wtA/f")"
run "$(mk_verdict "$AUD" d8)"
rsn="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
if [ "$_m" = "${_m%% *} 2 $WTS" ] && [ "$(cat "$FP_ROOT/d8/timeout-skipped" 2>/dev/null)" = "$WTS" ] \
   && [ "$rsn" = "AUDIT-TAMPER: unverifiable fingerprint (no start record for $WTA)" ] && [ "$(jq -r '.timeout' "$TAMPER_ROOT/d8.json" 2>/dev/null)" = false ]; then
  pass "a worktree skipped on a start-arm git error keeps no start record, never the timeout reason"
else
  fail "git-error skip labelled wrong (marker=|$_m| skipped=|$(cat "$FP_ROOT/d8/timeout-skipped" 2>/dev/null)| rsn=|$rsn| start=|$(cat "$FP_ROOT/d8/start" 2>/dev/null)|)"
fi
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
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "audit-tree-fingerprint.test.sh: PASS"
