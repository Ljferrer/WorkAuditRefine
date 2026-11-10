# Shared setup for the audit tree fingerprint hook suites
# (hooks/audit-tree-fingerprint*.test.sh). Each suite sets HERE to its own
# directory and sources this file, so each suite builds its own fixture.
# This file holds no rows, and the gate never runs it (its name does not end
# in .test.sh). #2823 split the one suite into four so no single suite binds
# the repo gate. The comment block below is the original suite header.
#
# Tests for the WAR audit tree fingerprint hook (hooks/audit-tree-fingerprint.sh).
# Plan 2026-10-20-rea-artifact-evidence Task 6.2 (D22), Task 7.2 (deadline)
# and Task 8.1 (the per-call watchdog, every operand form the guard admits);
# plan 2026-10-26-fingerprint-hook-followups Task 1.1 (fsmonitor and the
# untracked cache off, assume-unchanged and skip-worktree paths hashed, the
# ls-files watchdog) and Task 2.1 (the Grep walk-down where ripgrep recurses,
# the pinned Glob non-walk, `~-` unresolved); plan
# 2026-11-08-auditor-and-worker-guard-habits Task 1.3 (every git call under
# the watchdog: the BD rows; the grep count and `-E` forms: GP; the folder
# cache: GC; the pq check controls: TR; the `--prune` mode: PR).
#
# The hook acts only for agent types ending `war-auditor` or
# `war-evidence-auditor`. SubagentStart records every `.war-task` worktree's
# fingerprint. PreToolUse on Read/Glob/Grep, and PostToolUse and
# PostToolUseFailure on Bash, record the worktree a call reaches, so a Bash call
# another guard denied records nothing. PreToolUse on StructuredOutput compares
# the touched worktrees and,
# on a mismatch or an unverifiable fingerprint, allows the call with an
# `updatedInput` whose verdict is `escalate` and whose escalate_reason starts
# `AUDIT-TAMPER:`. SubagentStop records a mismatch and never blocks. No arm
# writes a worktree's index (GIT_OPTIONAL_LOCKS=0): pinned by an index-bytes
# oracle over a staled index, with its own sensitivity row. The hook keeps
# its own deadline under the hooks.json timeout (Task 7.2): past it, the
# verdict escalates with `AUDIT-TAMPER: fingerprint timeout` and the record
# carries `timeout: true`; the pre-check rows set
# WAR_FINGERPRINT_DEADLINE_SECONDS=0, and the watchdog rows (Task 8.1) cross
# a 10 s deadline inside a git call slowed by a shim.
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
set -u

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
# MK_EV overrides the event; mk_bash defaults it to PostToolUse, the event that records.
mk_tool()  { jq -nc --arg ev "${MK_EV:-PreToolUse}" --arg at "$1" --arg id "$2" --arg tn "$3" --argjson ti "$4" --arg c "$PCWD" '{hook_event_name:$ev,agent_type:$at,agent_id:$id,tool_name:$tn,tool_input:$ti,cwd:$c}'; }
mk_read()  { mk_tool "$1" "$2" Read "$(jq -nc --arg p "$3" '{file_path:$p}')"; }
mk_glob()  { mk_tool "$1" "$2" Glob "$(jq -nc --arg p "$3" '{pattern:"**/*",path:$p}')"; }
mk_bash()  { MK_EV="${MK_EV:-PostToolUse}" mk_tool "$1" "$2" Bash "$(jq -nc --arg c "$3" '{command:$c}')"; }
mk_bash_pre()  { MK_EV=PreToolUse mk_bash "$@"; }
mk_bash_fail() { MK_EV=PostToolUseFailure mk_bash "$@" | jq -c '.error="Exit code 1"'; }
VERDICT='{"verdict":"approve","findings":[{"severity":"Minor","title":"t"}],"confidence":"high"}'
mk_verdict() { mk_tool "$1" "$2" StructuredOutput "$VERDICT"; }

# run <payload> -> sets RC, OUT, ERR
run() {
  OUT="$(printf '%s' "$1" | bash "$HOOK" 2>"$TMP/err")"; RC=$?
  ERR="$(cat "$TMP/err")"
}
# reason_of: the escalate_reason of the last run's updatedInput.
reason_of() { printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null; }


# --- helpers shared across the suites -----------------------------------------
# stale <mtime>: gives wtA's tracked file that old mtime, content unchanged.
# Each call takes a mtime unlike the last one, so the index is stat-stale
# again even if the previous call's status wrote it back.
stale() { touch -t "$1" "$TMP/wtA/f"; }
# touched_is <agent_id> <expected touched-file content>
touched_is() { [ "$(cat "$FP_ROOT/$1/touched" 2>/dev/null)" = "$2" ]; }
# touched_has <agent_id> <line>: the seat's touched set carries the line.
touched_has() { grep -Fxq -- "$2" "$FP_ROOT/$1/touched" 2>/dev/null; }
mk_grep() { mk_tool "$1" "$2" Grep "$(jq -nc --arg p "$3" '{pattern:"base",path:$p}')"; }
# in_start <agent_id> <worktree>: the seat's start record carries the worktree.
in_start() { grep -Fq " $2" "$FP_ROOT/$1/start" 2>/dev/null; }
# escalates_on <agent_id> <worktree>: the seat's verdict names that worktree.
escalates_on() {
  run "$(mk_verdict "$AUD" $1)"
  _v="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.verdict // empty' 2>/dev/null)"
  _r="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.updatedInput.escalate_reason // empty' 2>/dev/null)"
  case "$_r" in "AUDIT-TAMPER: $2 changed during the audit round ("*) [ "$RC" = 0 ] && [ "$_v" = escalate ] ;; *) false ;; esac
}
# A name ending in CR: the content rows and the watchdog wave both use it.
CRN="$(printf 'r\r')"

# finish <suite name>: print the tally and exit 1 on any failed row.
finish() {
  printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
  [ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
  echo "$1: PASS"
}
