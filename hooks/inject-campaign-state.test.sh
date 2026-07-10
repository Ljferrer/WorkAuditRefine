#!/usr/bin/env bash
# Tests for hooks/inject-campaign-state.sh — the campaign post-compact
# re-injection hook. Plain-bash assertion runner (no bats, no package.json);
# runs under macOS bash 3.2.57 (no globstar, no associative arrays, no ${,,}).
#
# HERMETIC: every fixture is built under a fresh `mktemp -d` dir which we `cd`
# into first. We do NOT rely on TMPDIR redirection — BSD mktemp ignores it
# ([[bsd-mktemp-ignores-tmpdir-gnu-only]]). Most cases invoke the hook with
# CLAUDE_PROJECT_DIR pinned at each fixture root (so the test never reads the
# developer's real ~/.claude). Case 10 covers the OTHER root-resolution branch:
# env unset, root taken from the stdin `cwd` fallback (lines 33-34 of the hook).
#
# Each case asserts BOTH stdout content AND exit code.
# Exit 0 (this script) = all cases passed; non-zero = at least one failed.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
HOOK="$HERE/inject-campaign-state.sh"
REPO_ROOT="$(cd "$HERE/.." && pwd)"   # for the registration-sanity case (real hooks.json)

# jq is required to run these tests (and is a hook dependency).
command -v jq >/dev/null 2>&1 || { echo "jq not found — cannot run tests"; exit 1; }

fails=0
n=0

# ok/no — record a pass or fail with a message.
ok()  { n=$((n + 1)); printf 'ok %d - %s\n' "$n" "$1"; }
no()  { n=$((n + 1)); fails=$((fails + 1)); printf 'FAIL %d - %s\n' "$n" "$1"; }

# assert_eq <desc> <expected> <actual>
assert_eq() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1 (expected [$2], got [$3])"; fi; }
# assert_contains <desc> <haystack> <needle>
assert_contains() { case "$2" in *"$3"*) ok "$1" ;; *) no "$1 (missing [$3])" ;; esac; }
# assert_absent <desc> <haystack> <needle>
assert_absent() { case "$2" in *"$3"*) no "$1 (found forbidden [$3])" ;; *) ok "$1" ;; esac; }

# run_hook <root> -> sets OUT (stdout) and RC (exit code). stderr discarded.
OUT=""; RC=0
run_hook() {
  # Feed a minimal SessionStart payload on stdin; pin the scan root via env.
  OUT="$(CLAUDE_PROJECT_DIR="$1" printf '%s' "$(jq -nc --arg cwd "$1" '{"cwd":$cwd,"hook_event_name":"SessionStart"}')" | CLAUDE_PROJECT_DIR="$1" bash "$HOOK" 2>/dev/null)"
  RC=$?
}

# mk_ledger <dir> <campaign-id> <plans-json-array>
# Writes a ledger.json mirroring the real shape (campaign + plans[]).
mk_ledger() {
  mkdir -p "$1"
  jq -nc --arg c "$2" --argjson plans "$3" '{"campaign":$c,"created":"2026-07-03T00:00:00Z","mode":"stack","plans":$plans}' > "$1/ledger.json"
}

# A sentinel unique enough that a substring match proves the body was inlined.
SENTINEL="ZZ-STATE-SENTINEL-9f3a"

# Fresh hermetic workspace.
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cd "$WORK" || { echo "cannot cd to mktemp dir"; exit 1; }

# ---------------------------------------------------------------------------
# Case 1: no .claude/campaigns dir → empty stdout, exit 0
# ---------------------------------------------------------------------------
R1="$WORK/c1"; mkdir -p "$R1"
run_hook "$R1"
assert_eq       "case1 no campaigns dir → exit 0" 0 "$RC"
assert_eq       "case1 no campaigns dir → empty stdout" "" "$OUT"

# ---------------------------------------------------------------------------
# Case 2: all plans landed → empty stdout, exit 0
# ---------------------------------------------------------------------------
R2="$WORK/c2"
mk_ledger "$R2/.claude/campaigns/camp-landed" "camp-landed" \
  '[{"slug":"a","status":"landed"},{"slug":"b","status":"landed"}]'
run_hook "$R2"
assert_eq       "case2 all landed → exit 0" 0 "$RC"
assert_eq       "case2 all landed → empty stdout" "" "$OUT"

# ---------------------------------------------------------------------------
# Case 3: empty plans array → empty stdout, exit 0
# ---------------------------------------------------------------------------
R3="$WORK/c3"
mk_ledger "$R3/.claude/campaigns/camp-empty" "camp-empty" '[]'
run_hook "$R3"
assert_eq       "case3 empty plans → exit 0" 0 "$RC"
assert_eq       "case3 empty plans → empty stdout" "" "$OUT"

# ---------------------------------------------------------------------------
# Case 4: malformed ledger JSON → empty stdout, exit 0
# ---------------------------------------------------------------------------
R4="$WORK/c4"; mkdir -p "$R4/.claude/campaigns/camp-bad"
printf '%s\n' '{ this is not: valid json ,,,' > "$R4/.claude/campaigns/camp-bad/ledger.json"
run_hook "$R4"
assert_eq       "case4 malformed ledger → exit 0" 0 "$RC"
assert_eq       "case4 malformed ledger → empty stdout" "" "$OUT"

# ---------------------------------------------------------------------------
# Case 5: active ledger + CAMPAIGN-STATE.md → parses; hookEventName; sentinel + id
# ---------------------------------------------------------------------------
R5="$WORK/c5"; CDIR5="$R5/.claude/campaigns/camp-active"
mk_ledger "$CDIR5" "camp-active" \
  '[{"slug":"plan-one","status":"queued"},{"slug":"plan-two","status":"landed"}]'
printf '%s\n' "# Resume brief" "$SENTINEL body line" > "$CDIR5/CAMPAIGN-STATE.md"
run_hook "$R5"
assert_eq       "case5 active+state → exit 0" 0 "$RC"
# stdout parses as JSON
if printf '%s' "$OUT" | jq -e . >/dev/null 2>&1; then ok "case5 stdout parses with jq"; else no "case5 stdout parses with jq"; fi
EVT5="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.hookEventName // empty' 2>/dev/null)"
assert_eq       "case5 hookEventName == SessionStart" "SessionStart" "$EVT5"
CTX5="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)"
assert_contains "case5 additionalContext has body sentinel" "$CTX5" "$SENTINEL"
assert_contains "case5 additionalContext has campaign id" "$CTX5" "camp-active"

# ---------------------------------------------------------------------------
# Case 6: active, missing CAMPAIGN-STATE.md → additionalContext has reconstruct token
# ---------------------------------------------------------------------------
R6="$WORK/c6"; CDIR6="$R6/.claude/campaigns/camp-nostate"
mk_ledger "$CDIR6" "camp-nostate" '[{"slug":"only","status":"queued"}]'
# no CAMPAIGN-STATE.md written
run_hook "$R6"
assert_eq       "case6 missing state → exit 0" 0 "$RC"
CTX6="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)"
assert_contains "case6 additionalContext has reconstruct token" "$CTX6" "Reconstruct"
assert_contains "case6 additionalContext names the missing state path" "$CTX6" "CAMPAIGN-STATE.md is missing"

# ---------------------------------------------------------------------------
# Case 7: two active campaigns, distinct mtimes → newer sentinel inlined, older id named
#         (pair presence-of-winner-body with absence-of-loser-body-sentinel)
# ---------------------------------------------------------------------------
R7="$WORK/c7"
OLD="$R7/.claude/campaigns/camp-old"; NEW="$R7/.claude/campaigns/camp-new"
OLD_SENT="ZZ-OLD-BODY-1111"; NEW_SENT="ZZ-NEW-BODY-2222"
mk_ledger "$OLD" "camp-old" '[{"slug":"o","status":"queued"}]'
printf '%s\n' "$OLD_SENT" > "$OLD/CAMPAIGN-STATE.md"
mk_ledger "$NEW" "camp-new" '[{"slug":"nn","status":"queued"}]'
printf '%s\n' "$NEW_SENT" > "$NEW/CAMPAIGN-STATE.md"
# Force distinct mtimes: make the OLD ledger definitively older than NEW.
# touch -t is portable (POSIX). Older stamp on old, newer on new.
touch -t 202601010000 "$OLD/ledger.json"
touch -t 202612310000 "$NEW/ledger.json"
run_hook "$R7"
assert_eq       "case7 two active → exit 0" 0 "$RC"
CTX7="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)"
assert_contains "case7 newer campaign body inlined" "$CTX7" "$NEW_SENT"
assert_absent   "case7 older campaign body NOT inlined" "$CTX7" "$OLD_SENT"
assert_contains "case7 older campaign id named" "$CTX7" "camp-old"

# ---------------------------------------------------------------------------
# Case 8: state file > 32KB → additionalContext has the path but NOT the body sentinel
#         (paired presence/absence)
# ---------------------------------------------------------------------------
R8="$WORK/c8"; CDIR8="$R8/.claude/campaigns/camp-big"
mk_ledger "$CDIR8" "camp-big" '[{"slug":"big","status":"queued"}]'
BIG_SENT="ZZ-BIG-BODY-3333"
# Build a >32768-byte file whose FIRST line carries the sentinel.
{ printf '%s\n' "$BIG_SENT"; head -c 40000 /dev/zero | tr '\0' 'x'; } > "$CDIR8/CAMPAIGN-STATE.md"
run_hook "$R8"
assert_eq       "case8 big state → exit 0" 0 "$RC"
CTX8="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)"
assert_contains "case8 additionalContext has the file path" "$CTX8" "$CDIR8/CAMPAIGN-STATE.md"
assert_absent   "case8 additionalContext does NOT inline the body" "$CTX8" "$BIG_SENT"

# ---------------------------------------------------------------------------
# Case 9: registration sanity — hooks.json parses AND a SessionStart entry with
#         matcher compact|clear|resume points at inject-campaign-state.sh.
# ---------------------------------------------------------------------------
HJSON="$REPO_ROOT/hooks/hooks.json"
if jq -e . "$HJSON" >/dev/null 2>&1; then ok "case9 hooks.json parses with jq"; else no "case9 hooks.json parses with jq"; fi
# The SessionStart group with the compact|clear|resume matcher must reference our script.
REG="$(jq -r '.hooks.SessionStart[]? | select(.matcher == "compact|clear|resume") | .hooks[].command' "$HJSON" 2>/dev/null)"
assert_contains "case9 SessionStart(compact|clear|resume) → inject-campaign-state.sh" "$REG" "inject-campaign-state.sh"

# ---------------------------------------------------------------------------
# Case 10: cwd fallback — CLAUDE_PROJECT_DIR UNSET, root taken from stdin .cwd.
#          Exercises hook lines 33-34 (the ${CLAUDE_PROJECT_DIR:-} else branch).
#          Active campaign + state file → payload produced with the sentinel.
# ---------------------------------------------------------------------------
R10="$WORK/c10"; CDIR10="$R10/.claude/campaigns/camp-cwd"
mk_ledger "$CDIR10" "camp-cwd" '[{"slug":"only","status":"queued"}]'
CWD_SENT="ZZ-CWD-BODY-4444"
printf '%s\n' "$CWD_SENT body line" > "$CDIR10/CAMPAIGN-STATE.md"
# Invoke with env UNSET so root must resolve from the stdin cwd fallback.
OUT10="$(env -u CLAUDE_PROJECT_DIR bash -c '
  jq -nc --arg cwd "$1" "{\"cwd\":\$cwd,\"hook_event_name\":\"SessionStart\"}" | bash "$2"
' _ "$R10" "$HOOK" 2>/dev/null)"; RC10=$?
assert_eq       "case10 cwd fallback → exit 0" 0 "$RC10"
CTX10="$(printf '%s' "$OUT10" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)"
assert_contains "case10 cwd fallback → payload has body sentinel" "$CTX10" "$CWD_SENT"
assert_contains "case10 cwd fallback → payload has campaign id" "$CTX10" "camp-cwd"

# ---------------------------------------------------------------------------
# Case 11: campaign dir path containing a SPACE → newest active still selected
#          and injected. RED against the old `printf | xargs ls -t` idiom, which
#          word-split the spaced path into two bogus args and dropped it from
#          the sort. Two active campaigns; the NEWER one lives under a spaced
#          path — its body must win. (Pairs winner-body presence with a
#          newest-first assertion.)
# ---------------------------------------------------------------------------
R11="$WORK/c11"
SP_OLD="$R11/.claude/campaigns/camp plain old"     # spaced dir name, older
SP_NEW="$R11/.claude/campaigns/camp spaced new"    # spaced dir name, newer
SP_OLD_SENT="ZZ-SPACE-OLD-5555"; SP_NEW_SENT="ZZ-SPACE-NEW-6666"
mk_ledger "$SP_OLD" "camp-space-old" '[{"slug":"so","status":"queued"}]'
printf '%s\n' "$SP_OLD_SENT" > "$SP_OLD/CAMPAIGN-STATE.md"
mk_ledger "$SP_NEW" "camp-space-new" '[{"slug":"sn","status":"queued"}]'
printf '%s\n' "$SP_NEW_SENT" > "$SP_NEW/CAMPAIGN-STATE.md"
touch -t 202601010000 "$SP_OLD/ledger.json"
touch -t 202612310000 "$SP_NEW/ledger.json"
run_hook "$R11"
assert_eq       "case11 spaced path → exit 0" 0 "$RC"
CTX11="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)"
assert_contains "case11 spaced newer campaign body inlined" "$CTX11" "$SP_NEW_SENT"
assert_absent   "case11 spaced older campaign body NOT inlined" "$CTX11" "$SP_OLD_SENT"
assert_contains "case11 spaced older campaign id named" "$CTX11" "camp-space-old"

# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "inject-campaign-state.test.sh: PASS"
