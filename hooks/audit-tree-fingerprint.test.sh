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
if touched_is t14 "~nosuchuser/wtB" && [ "$rsn" = "AUDIT-TAMPER: unverifiable fingerprint (unresolved -C path)" ]; then
  pass "Bash unquoted -C ~<name>/<path> is recorded literal and escalates as an unresolved -C path"
else
  fail "tilde-name -C not escalated (touched=|$(cat "$FP_ROOT/t14/touched" 2>/dev/null)| rsn=|$rsn|)"
fi

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
