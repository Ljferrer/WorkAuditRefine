#!/usr/bin/env bash
# Tests for hooks/inject-campaign-state.sh — the campaign post-compact
# re-injection hook. Plain-bash assertion runner (no bats, no package.json);
# runs under macOS bash 3.2.57 (no globstar, no associative arrays, no ${,,}).
#
# HERMETIC: every fixture is built under a fresh `mktemp -d` dir which we `cd`
# into first. We do NOT rely on TMPDIR redirection — BSD mktemp ignores it
# ([[bsd-mktemp-ignores-tmpdir-gnu-only]]). Since the hook now git-probes every
# root it is handed (the main-checkout anchor), that hermeticity is asserted, not
# assumed: a fatal setup guard after the `cd "$WORK"` line below aborts the suite
# if the hook's own probe finds an enclosing repo at the fixture root. Most cases
# invoke the hook with
# CLAUDE_PROJECT_DIR pinned at each fixture root (so the test never reads the
# developer's real ~/.claude). Case 10 covers the OTHER root-resolution branch:
# env unset, root taken from the stdin `cwd` fallback (the ${CLAUDE_PROJECT_DIR:-}
# else branch of the hook). Cases 12–18 exercise the git-common-dir ANCHOR (a
# linked-worktree cwd resolves to the main checkout) and the stranded-state
# WARNING emitted at each of the hook's three silent no-inject exits. Cases 1–11
# remain UNMODIFIED — they are the non-git fail-open fallback coverage.
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

# HERMETICITY GUARD (fatal setup, before case 1). The hook now git-probes EVERY
# root it is handed (the main-checkout anchor). If WORK sits inside ANY enclosing
# repo — a working tree OR a bare repo — the hook's own probe resolves upward and
# silently re-roots the fixtures to that repo's main checkout, so injection-path
# cases would fail far from the cause. Assert the hook's OWN probe finds nothing
# at WORK, in the two-step capture form the hook mandates (a composed one-liner
# masks failure as "."). Probe FAILURE — including git absent — IS hermeticity, so
# this is NOT a numbered ok/no case: like the jq presence guard above, a
# non-hermetic workspace invalidates every case, so aborting at setup is the honest
# semantic. Cases 12-13 build real repos INSIDE WORK deliberately; git discovery
# walks UPWARD, so those children never re-root sibling probes (and they are
# created after this line). No ambient-env unsets: the guard IS the hook's own
# probe, so any exported GIT_DIR/GIT_CEILING_DIRECTORIES affects guard and hook
# identically — the guard then fires loudly here rather than letting cases fail far
# from the cause.
if common="$(git -C "$WORK" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" && [ -n "$common" ]; then
  echo "FATAL: the hook's probe at $WORK resolves ($common) — fixture root is not hermetic"; exit 1
fi

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
# Cases 12–13: ANCHORING — a Lead invoked from a linked git worktree injects the
# MAIN checkout's active campaign. `git rev-parse --path-format=absolute
# --git-common-dir` resolves the worktree back to the main checkout (End state
# 1). Case 12: CLAUDE_PROJECT_DIR UNSET (root from stdin .cwd). Case 13:
# CLAUDE_PROJECT_DIR SET to the worktree path. Both must inject identically.
# Requires real git (a hard plugin dependency, always present in the gate env).
# ---------------------------------------------------------------------------
GMAIN="$WORK/gmain"; mkdir -p "$GMAIN"
git -C "$GMAIN" init -q
git -C "$GMAIN" config user.email t@t.t
git -C "$GMAIN" config user.name t
: > "$GMAIN/seed"; git -C "$GMAIN" add seed; git -C "$GMAIN" commit -qm seed >/dev/null 2>&1
# Active campaign lives under the MAIN checkout only (untracked → the worktree
# checkout below will NOT contain it, so nothing is stranded under the worktree).
WT_SENT="ZZ-WT-BODY-7777"
mk_ledger "$GMAIN/.claude/campaigns/camp-wt" "camp-wt" '[{"slug":"p","status":"queued"}]'
printf '%s\n' "$WT_SENT body line" > "$GMAIN/.claude/campaigns/camp-wt/CAMPAIGN-STATE.md"
# Linked worktree (its own disposable .claude/, no campaign of its own).
GWT="$WORK/gwt"
git -C "$GMAIN" worktree add --detach -q "$GWT" HEAD >/dev/null 2>&1

# Case 12: env UNSET, stdin cwd = worktree → anchor resolves to MAIN, injects.
OUT12="$(env -u CLAUDE_PROJECT_DIR bash -c '
  jq -nc --arg cwd "$1" "{\"cwd\":\$cwd,\"hook_event_name\":\"SessionStart\"}" | bash "$2"
' _ "$GWT" "$HOOK" 2>/dev/null)"; RC12=$?
assert_eq       "case12 worktree cwd, env unset → exit 0" 0 "$RC12"
CTX12="$(printf '%s' "$OUT12" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)"
assert_contains "case12 injects MAIN campaign body sentinel" "$CTX12" "$WT_SENT"
assert_contains "case12 injects MAIN campaign id" "$CTX12" "camp-wt"

# Case 13: CLAUDE_PROJECT_DIR SET to the worktree (env + stdin cwd both = WT).
run_hook "$GWT"
assert_eq       "case13 worktree cwd, env set → exit 0" 0 "$RC"
CTX13="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)"
assert_contains "case13 injects MAIN campaign body sentinel" "$CTX13" "$WT_SENT"
assert_contains "case13 injects MAIN campaign id" "$CTX13" "camp-wt"

# ---------------------------------------------------------------------------
# Case 14: git shadowed off PATH (a failing shim) + a NON-git fixture → the
# anchor fails open and the hook still injects via the unanchored (env/cwd)
# root. Proves the anchor never breaks the pre-anchor fail-open path (End state
# 2 — the same guarantee cases 1–11 rely on, here with git unavailable).
# ---------------------------------------------------------------------------
FAKEBIN="$WORK/fakebin"; mkdir -p "$FAKEBIN"
printf '%s\n' '#!/bin/sh' 'exit 127' > "$FAKEBIN/git"; chmod +x "$FAKEBIN/git"
R14="$WORK/c14"; CDIR14="$R14/.claude/campaigns/camp-nogit"
mk_ledger "$CDIR14" "camp-nogit" '[{"slug":"only","status":"queued"}]'
NOGIT_SENT="ZZ-NOGIT-BODY-8888"
printf '%s\n' "$NOGIT_SENT body line" > "$CDIR14/CAMPAIGN-STATE.md"
JSON14="$(jq -nc --arg cwd "$R14" '{"cwd":$cwd,"hook_event_name":"SessionStart"}')"
OUT14="$(printf '%s' "$JSON14" | CLAUDE_PROJECT_DIR="$R14" PATH="$FAKEBIN:$PATH" bash "$HOOK" 2>/dev/null)"; RC14=$?
assert_eq       "case14 git off PATH, non-git → exit 0" 0 "$RC14"
CTX14="$(printf '%s' "$OUT14" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)"
assert_contains "case14 injects via unanchored root (body sentinel)" "$CTX14" "$NOGIT_SENT"
assert_contains "case14 injects via unanchored root (campaign id)" "$CTX14" "camp-nogit"

# ---------------------------------------------------------------------------
# Case 15: STRANDED-STATE WARNING at the no-campaigns-dir exit (site 1). No
# <root>/.claude/campaigns, but an ACTIVE ledger sits under a worktree's OWN
# .claude/campaigns. The hook warns, naming the stranded path, and deliberately
# does NOT inject the stranded body (End state 3).
# ---------------------------------------------------------------------------
R15="$WORK/c15"; mkdir -p "$R15"
STRAND15="$R15/.claude/worktrees/wt-x/.claude/campaigns/camp-strand"
mk_ledger "$STRAND15" "camp-strand" '[{"slug":"s","status":"queued"}]'
STRAND15_SENT="ZZ-STRAND-BODY-9999"
printf '%s\n' "$STRAND15_SENT" > "$STRAND15/CAMPAIGN-STATE.md"
run_hook "$R15"
assert_eq       "case15 stranded active (site 1) → exit 0" 0 "$RC"
if printf '%s' "$OUT" | jq -e . >/dev/null 2>&1; then ok "case15 warning parses with jq"; else no "case15 warning parses with jq"; fi
CTX15="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)"
assert_contains "case15 warning names the stranded ledger path" "$CTX15" "$STRAND15/ledger.json"
assert_contains "case15 warning mentions worktree reaping" "$CTX15" "reaping"
assert_absent   "case15 warning does NOT inject the stranded body" "$CTX15" "$STRAND15_SENT"

# ---------------------------------------------------------------------------
# Case 16: an ALL-LANDED stranded ledger stays SILENT (the is_active gate). Same
# site-1 shape as case 15 but every plan landed → empty stdout, exit 0.
# ---------------------------------------------------------------------------
R16="$WORK/c16"; mkdir -p "$R16"
STRAND16="$R16/.claude/worktrees/wt-x/.claude/campaigns/camp-landed"
mk_ledger "$STRAND16" "camp-landed" '[{"slug":"a","status":"landed"},{"slug":"b","status":"landed"}]'
run_hook "$R16"
assert_eq       "case16 all-landed stranded → exit 0" 0 "$RC"
assert_eq       "case16 all-landed stranded → empty stdout" "" "$OUT"

# ---------------------------------------------------------------------------
# Case 17: STRANDED-STATE WARNING at the empty-candidates exit (site 2). The main
# .claude/campaigns dir is PRESENT-BUT-EMPTY (holds no */ledger.json), so site 1
# passes and the empty-candidates guard fires. REDS if warn_if_stranded is wired
# into only the two originally-named sites (guard + no-active) and misses this
# empty-candidates exit (red-team coverage fix 2026-07-16).
# ---------------------------------------------------------------------------
R17="$WORK/c17"; mkdir -p "$R17/.claude/campaigns"   # present but EMPTY (no */ledger.json)
STRAND17="$R17/.claude/worktrees/wt-x/.claude/campaigns/camp-strand"
mk_ledger "$STRAND17" "camp-strand" '[{"slug":"s","status":"queued"}]'
run_hook "$R17"
assert_eq       "case17 stranded active (site 2, empty-candidates) → exit 0" 0 "$RC"
CTX17="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)"
assert_contains "case17 warning names the stranded ledger path" "$CTX17" "$STRAND17/ledger.json"
assert_contains "case17 warning mentions worktree reaping" "$CTX17" "reaping"

# ---------------------------------------------------------------------------
# Case 18: STRANDED-STATE WARNING at the no-active-ledger exit (site 3). The main
# .claude/campaigns holds an ALL-LANDED (inactive) ledger — candidates non-empty,
# but the mtime scan finds no active winner — so the third silent exit fires. An
# active stranded ledger under a worktree still warns. Enforces the THIRD wiring
# of the single probe helper.
# ---------------------------------------------------------------------------
R18="$WORK/c18"
mk_ledger "$R18/.claude/campaigns/camp-inactive" "camp-inactive" '[{"slug":"z","status":"landed"}]'
STRAND18="$R18/.claude/worktrees/wt-x/.claude/campaigns/camp-strand"
mk_ledger "$STRAND18" "camp-strand" '[{"slug":"s","status":"queued"}]'
run_hook "$R18"
assert_eq       "case18 stranded active (site 3, no-active-ledger) → exit 0" 0 "$RC"
CTX18="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)"
assert_contains "case18 warning names the stranded ledger path" "$CTX18" "$STRAND18/ledger.json"
assert_contains "case18 warning mentions worktree reaping" "$CTX18" "reaping"

# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "inject-campaign-state.test.sh: PASS"
