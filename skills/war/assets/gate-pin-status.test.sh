#!/usr/bin/env bash
# Tests for gate-pin-status.sh — the WAR refiner-side pin-drift classifier.
#
# Plain-bash over throwaway mktemp git repos; one fresh fixture per case
# (the assert-test-in-diff.test.sh scaffold idiom). bash 3.2.57 compatible.
#
# Exit 0 = all cases passed; non-zero = at least one failed.
#
# Covers all FOUR exit branches of the contract, delete-and-traced (each case fails if
# its branch of the contract is removed — the stdout TOKEN, not just the exit code, is
# asserted wherever two branches share an exit code):
#   1.  CONFIRMED       — equal SHAs -> exit 0, token 'CONFIRMED'
#                         (delete-and-trace vs BENIGN: reflexive is-ancestor + empty diff
#                          would print BENIGN-ADVANCE at exit 0 if the CONFIRMED branch went)
#   2.  BENIGN-ADVANCE  — descendant, intervening file NOT in --mapped -> exit 0, token
#                         'BENIGN-ADVANCE' + the intervening file printed (cited evidence)
#   3.  STALE-MISMATCH  — descendant, a --mapped file changed in the range -> exit 1, token
#                         'STALE-MISMATCH' + offending file printed
#   4.  STALE-MISMATCH  — NOT an ancestor (diverged), --mapped intersection empty -> exit 1
#                         (isolates the non-ancestor branch: deleting it -> BENIGN exit 0)
#   5.  ERROR           — bogus (valid-hex, nonexistent) gate sha -> exit 2 (NOT 1: a ref
#                         error must never collapse into the STALE status)
#   6.  ERROR           — '(integration_sha …)' sentinel gate pin -> exit 2 + distinctive
#                         'sentinel' message on stderr (delete-and-trace vs the plain
#                          rev-parse-fail message the sentinel branch's removal would emit)
#   7.  ERROR/invariant — '..'-bearing gate ref -> exit 2 (NOT 1): locks "malformed ref
#                         never collapses into STALE"; flips if a sibling-style exit-1
#                         `..` die is ever added
#   8a. STANDALONE dflt — no --mapped, a gate-discovery test file in the range -> exit 1
#                         (proves the absent-flag default IS the gate-discovery set, not
#                          an empty/all set)
#   8b. contrast        — same range WITH explicit --mapped (test file not in it) -> exit 0
#                         BENIGN (isolates 8a's STALE to the default matcher; documents WHY
#                          the pipeline must pass an explicit --mapped)
#   9.  FLOOR ⊆ GATE PARITY (mirrors assert-test-in-diff.test.sh Case 10a–10e): the
#       standalone-default match_sh_suite/match_default discovery set must equal the gate's,
#       read from resolveGate's OUTPUT string (not its source) so a semantics-preserving
#       resolveGate refactor cannot break it; only a real discovery-set drift does.
#       a. resolveGate output exclusion set == {.claude,.git,node_modules}
#       b. floor match_sh_suite exclusion set == resolveGate output set (the parity)
#       c. *.test.sh name glob present in gate output AND comment-stripped floor source
#       d. match_default body carries the structural mjs-mirror arms skills/*) + *.test.mjs)
#       e. DELETE-THE-FEATURE: floor with the .claude arm removed != gate set
#          (mutating either side turns the parity RED — proves 9b is not vacuous)
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/gate-pin-status.sh"

PASS=0
FAIL=0
TMPFILES=""

pass() { printf 'ok - %s\n' "$1"; PASS=$((PASS + 1)); }
fail() { printf 'FAIL - %s\n' "$1" >&2; FAIL=$((FAIL + 1)); }

cleanup() {
  for d in $TMPFILES; do
    rm -rf "$d"
  done
}
trap cleanup EXIT

# setup_repo: create a fresh git repo with a seed commit; echo its path.
setup_repo() {
  T="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
  TMPFILES="$TMPFILES $T"
  git -C "$T" init -q
  git -C "$T" config user.email war@test.local
  git -C "$T" config user.name "WAR Test"
  git -C "$T" config commit.gpgsign false
  printf 'seed\n' > "$T/seed.txt"
  git -C "$T" add seed.txt
  git -C "$T" commit -qm "seed"
  printf '%s\n' "$T"
}

# clean_cwd: a fresh unrelated dir to run the script from (cwd-independence +
# memory: relative-path-test-needs-clean-cwd). echo its path.
clean_cwd() {
  C="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
  TMPFILES="$TMPFILES $C"
  printf '%s\n' "$C"
}

# run_case <repo> <cwd> <gate> <observed> [extra args...] : run the script, capturing
# stdout, stderr, and rc into globals OUT/ERR/RC (avoids a subshell losing the rc).
run_gps() {
  _repo="$1"; _cwd="$2"; _gate="$3"; _obs="$4"; shift 4
  _ef="$(mktemp 2>/dev/null || mktemp -t wartesterr)"
  TMPFILES="$TMPFILES $_ef"
  RC=0
  OUT="$( cd "$_cwd" && bash "$SCRIPT" "$_gate" "$_obs" "$@" --repo "$_repo" 2>"$_ef" )" || RC=$?
  ERR="$(cat "$_ef")"
  FIRST="$(printf '%s\n' "$OUT" | head -1)"
}

# ---------------------------------------------------------------------------
# Case 1: CONFIRMED — gate == observed (same commit) -> exit 0, token 'CONFIRMED'.
# Delete-and-trace: a commit IS a reflexive ancestor of itself and diff X..X is empty,
# so removing the CONFIRMED branch would print 'BENIGN-ADVANCE' (also exit 0). Asserting
# the EXACT token 'CONFIRMED' (not merely rc 0) flips if the branch is removed.
# ---------------------------------------------------------------------------
R1="$(setup_repo)"
S1="$(git -C "$R1" rev-parse HEAD)"
run_gps "$R1" "$(clean_cwd)" "$S1" "$S1" --mapped "seed.txt"
if [ "$RC" -eq 0 ] && [ "$FIRST" = "CONFIRMED" ]; then
  pass "case 1: equal SHAs -> exit 0, token CONFIRMED"
else
  fail "case 1: equal SHAs -> expected exit 0 + token CONFIRMED, got rc=$RC token='$FIRST'"
fi

# ---------------------------------------------------------------------------
# Case 2: BENIGN-ADVANCE — observed descends gate; the intervening file is NOT in --mapped.
#   S -> G (adds src/app.js == the mapped file) -> O (adds docs/readme.md, NOT mapped)
# is-ancestor(G,O) holds; intervening = {docs/readme.md}; ∩ {src/app.js} = empty -> BENIGN.
# Asserts exit 0 + token BENIGN-ADVANCE + the intervening file is printed (cited evidence).
# ---------------------------------------------------------------------------
R2="$(setup_repo)"
git -C "$R2" checkout -qb task/benign 2>/dev/null
mkdir -p "$R2/src"
printf 'app\n' > "$R2/src/app.js"
git -C "$R2" add src/app.js
git -C "$R2" commit -qm "add src/app.js (task-own)"
G2="$(git -C "$R2" rev-parse HEAD)"
mkdir -p "$R2/docs"
printf 'readme\n' > "$R2/docs/readme.md"
git -C "$R2" add docs/readme.md
git -C "$R2" commit -qm "add docs/readme.md (not task-own)"
O2="$(git -C "$R2" rev-parse HEAD)"
run_gps "$R2" "$(clean_cwd)" "$G2" "$O2" --mapped "src/app.js"
if [ "$RC" -eq 0 ] && [ "$FIRST" = "BENIGN-ADVANCE" ] && printf '%s' "$OUT" | grep -qF "docs/readme.md"; then
  pass "case 2: descendant + intervening file outside --mapped -> exit 0, BENIGN-ADVANCE + intervening list"
else
  fail "case 2: expected exit 0 + BENIGN-ADVANCE + 'docs/readme.md' listed, got rc=$RC token='$FIRST' out='$OUT'"
fi

# ---------------------------------------------------------------------------
# Case 3: STALE-MISMATCH (mapped file changed) — observed descends gate; a --mapped file
# was modified in the intervening range.
#   S -> G (adds src/app.js) -> O (MODIFIES src/app.js == the mapped file)
# Asserts exit 1 + token STALE-MISMATCH + the offending mapped file printed.
# Delete-and-trace: removing the mapped-intersection check would flip this to BENIGN
# (exit 0) — asserting exit 1 catches it. The mapped file is genuinely modified in-range.
# ---------------------------------------------------------------------------
R3="$(setup_repo)"
git -C "$R3" checkout -qb task/stale-mapped 2>/dev/null
mkdir -p "$R3/src"
printf 'app v1\n' > "$R3/src/app.js"
git -C "$R3" add src/app.js
git -C "$R3" commit -qm "add src/app.js v1"
G3="$(git -C "$R3" rev-parse HEAD)"
printf 'app v2 (changed after the gate ran)\n' > "$R3/src/app.js"
git -C "$R3" add src/app.js
git -C "$R3" commit -qm "modify src/app.js v2"
O3="$(git -C "$R3" rev-parse HEAD)"
run_gps "$R3" "$(clean_cwd)" "$G3" "$O3" --mapped "src/app.js"
if [ "$RC" -eq 1 ] && [ "$FIRST" = "STALE-MISMATCH" ] && printf '%s' "$OUT" | grep -qF "src/app.js"; then
  pass "case 3: descendant + a mapped file changed -> exit 1, STALE-MISMATCH + offending file"
else
  fail "case 3: expected exit 1 + STALE-MISMATCH + 'src/app.js' offending, got rc=$RC token='$FIRST' out='$OUT'"
fi

# ---------------------------------------------------------------------------
# Case 4: STALE-MISMATCH (not an ancestor) — gate and observed diverged from S; the
# --mapped set intersects NEITHER divergent file, so the ONLY thing making this STALE is
# the non-ancestor check.
#   S -> G (adds gate-only.txt)   [branch A]
#   S -> O (adds observed-only.txt)  [branch B]  ; G is NOT an ancestor of O
#   --mapped mapped-file.txt  (matches neither -> offending stays empty)
# Delete-and-trace: removing the non-ancestor->STALE branch (treating a diverged pair like
# an ancestor) computes an empty offending set -> BENIGN-ADVANCE (exit 0). Asserting exit 1
# flips 1->0, isolating the ancestor check.
# ---------------------------------------------------------------------------
R4="$(setup_repo)"
S4="$(git -C "$R4" rev-parse HEAD)"
git -C "$R4" checkout -qb task/gate-branch 2>/dev/null
printf 'gate\n' > "$R4/gate-only.txt"
git -C "$R4" add gate-only.txt
git -C "$R4" commit -qm "gate-only commit"
G4="$(git -C "$R4" rev-parse HEAD)"
git -C "$R4" checkout -q "$S4" 2>/dev/null
git -C "$R4" checkout -qb task/observed-branch 2>/dev/null
printf 'observed\n' > "$R4/observed-only.txt"
git -C "$R4" add observed-only.txt
git -C "$R4" commit -qm "observed-only commit"
O4="$(git -C "$R4" rev-parse HEAD)"
# sanity: G4 must NOT be an ancestor of O4 (the fixture's premise)
anc_rc4=0
git -C "$R4" merge-base --is-ancestor "$G4" "$O4" || anc_rc4=$?
run_gps "$R4" "$(clean_cwd)" "$G4" "$O4" --mapped "mapped-file.txt"
if [ "$anc_rc4" -ne 1 ]; then
  fail "case 4: fixture invalid — G4 should NOT be an ancestor of O4 (is-ancestor rc=$anc_rc4)"
elif [ "$RC" -eq 1 ] && [ "$FIRST" = "STALE-MISMATCH" ] && printf '%s' "$OUT" | grep -qF "not an ancestor"; then
  pass "case 4: diverged (not an ancestor), empty mapped intersection -> exit 1, STALE-MISMATCH"
else
  fail "case 4: expected exit 1 + STALE-MISMATCH + 'not an ancestor', got rc=$RC token='$FIRST' out='$OUT'"
fi

# ---------------------------------------------------------------------------
# Case 5: ERROR — a valid-hex but NONEXISTENT gate sha (not the sentinel) -> exit 2.
# Asserts exit 2 SPECIFICALLY (not 1): a ref error must never collapse into the STALE
# status. Delete-and-trace: if ref validation were dropped and the error fell through to
# is-ancestor being read as "not ancestor", this would exit 1 — asserting 2 catches it.
# ---------------------------------------------------------------------------
R5="$(setup_repo)"
O5="$(git -C "$R5" rev-parse HEAD)"
BOGUS="0123456789abcdef0123456789abcdef01234567"  # 40-hex, passes pinOrSentinel, nonexistent
run_gps "$R5" "$(clean_cwd)" "$BOGUS" "$O5" --mapped "seed.txt"
if [ "$RC" -eq 2 ]; then
  pass "case 5: bogus (valid-hex, nonexistent) gate sha -> exit 2 (git/ref error, not a status)"
else
  fail "case 5: bogus gate sha -> expected exit 2, got rc=$RC (a ref error must never collapse into a status)"
fi

# ---------------------------------------------------------------------------
# Case 6: ERROR — the '(integration_sha …)' pin sentinel -> exit 2 + distinctive 'sentinel'
# message on stderr. Delete-and-trace (mirrors assert-test-in-diff.test.sh case 4's unique-
# message assertion): removing the explicit sentinel branch would let the sentinel fall to
# rev-parse, which ALSO exits 2 but with a DIFFERENT message ("not a valid git commit
# object") — so asserting the 'sentinel' token flips when the branch is removed. A bare
# rc=2 assertion would NOT be load-bearing here.
# ---------------------------------------------------------------------------
R6="$(setup_repo)"
O6="$(git -C "$R6" rev-parse HEAD)"
SENTINEL="(integration_sha unrecorded/malformed)"
run_gps "$R6" "$(clean_cwd)" "$SENTINEL" "$O6" --mapped "seed.txt"
if [ "$RC" -eq 2 ] && printf '%s' "$ERR" | grep -qF "sentinel"; then
  pass "case 6: '(integration_sha …)' sentinel pin -> exit 2 + distinctive 'sentinel' message"
elif [ "$RC" -ne 2 ]; then
  fail "case 6: sentinel pin -> expected exit 2, got rc=$RC"
else
  fail "case 6: sentinel pin -> got exit 2 but 'sentinel' message absent (branch removed?); stderr='$ERR'"
fi

# ---------------------------------------------------------------------------
# Case 7: ERROR/invariant — a '..'-bearing gate ref -> exit 2 (NOT 1). Locks the invariant
# that a malformed ref never collapses into the STALE status. Run from a clean unrelated
# cwd (memory: relative-path-test-needs-clean-cwd). Delete-and-trace: if a sibling-style
# exit-1 `..` die is ever added, this flips 2->1 and fails.
# ---------------------------------------------------------------------------
R7="$(setup_repo)"
O7="$(git -C "$R7" rev-parse HEAD)"
run_gps "$R7" "$(clean_cwd)" "../$O7" "$O7" --mapped "seed.txt"
if [ "$RC" -eq 2 ]; then
  pass "case 7: '..'-bearing gate ref -> exit 2 (ref error, never STALE(1))"
else
  fail "case 7: '..'-bearing gate ref -> expected exit 2, got rc=$RC (must not collapse into STALE)"
fi

# ---------------------------------------------------------------------------
# Case 8a: STANDALONE default (absent --mapped) — a gate-discovery test file changed in the
# intervening range -> exit 1 STALE. Proves the absent-flag default IS the gate-discovery
# set (skills/**/*.test.mjs), not an empty set (which would BENIGN everything) nor all-files.
#   S -> G (adds src/app.js) -> O (adds skills/x/foo.test.mjs, a gate-discovery test)
# Delete-and-trace: replacing match_default with an empty set flips this to BENIGN (exit 0).
# ---------------------------------------------------------------------------
R8="$(setup_repo)"
git -C "$R8" checkout -qb task/default 2>/dev/null
mkdir -p "$R8/src"
printf 'app\n' > "$R8/src/app.js"
git -C "$R8" add src/app.js
git -C "$R8" commit -qm "add src/app.js"
G8="$(git -C "$R8" rev-parse HEAD)"
mkdir -p "$R8/skills/x"
printf 'test\n' > "$R8/skills/x/foo.test.mjs"
git -C "$R8" add skills/x/foo.test.mjs
git -C "$R8" commit -qm "add skills/x/foo.test.mjs (gate-discovery)"
O8="$(git -C "$R8" rev-parse HEAD)"
run_gps "$R8" "$(clean_cwd)" "$G8" "$O8"   # NO --mapped -> standalone default
if [ "$RC" -eq 1 ] && [ "$FIRST" = "STALE-MISMATCH" ]; then
  pass "case 8a: no --mapped + gate-discovery test file in range -> exit 1 STALE (default == gate-discovery set)"
else
  fail "case 8a: no --mapped + skills/x/foo.test.mjs in range -> expected exit 1 STALE, got rc=$RC token='$FIRST' (default not the gate-discovery set?)"
fi

# Case 8b: contrast — SAME range but WITH explicit --mapped 'src/app.js' (the test file is
# NOT in the mapped set) -> exit 0 BENIGN-ADVANCE. Isolates 8a's STALE to the default
# matcher and documents WHY the pipeline must pass an explicit --mapped (a sibling test-file
# addition would otherwise trip STALE and defuse the HARD path).
run_gps "$R8" "$(clean_cwd)" "$G8" "$O8" --mapped "src/app.js"
if [ "$RC" -eq 0 ] && [ "$FIRST" = "BENIGN-ADVANCE" ]; then
  pass "case 8b: explicit --mapped 'src/app.js' (test file not mapped) -> exit 0 BENIGN (contrast to 8a)"
else
  fail "case 8b: explicit --mapped 'src/app.js' -> expected exit 0 BENIGN-ADVANCE, got rc=$RC token='$FIRST' out='$OUT'"
fi

# ---------------------------------------------------------------------------
# Case 9: FLOOR ⊆ GATE PARITY. gate-pin-status.sh's STANDALONE-default discovery
# set (match_sh_suite / match_default, copied verbatim from assert-test-in-diff.sh)
# must equal the gate's, extracted from resolveGate's emitted OUTPUT string (not its
# source text) — a benign resolveGate refactor that preserves semantics cannot break
# this; only a real discovery-set drift does. Mirrors assert-test-in-diff.test.sh
# Case 10a–10e; the two extraction helpers are copied INLINE (resolved design, spec §3:
# a shared sourced lib would hide floor↔gate drift, an inline copy fails loud).
# spec §4B / §8; memory: floor-script-discovery-set-must-mirror-gate-exclusions.
# ---------------------------------------------------------------------------
WARCONFIG="$HERE/war-config.mjs"

# gate_excl: exclusion tokens from resolveGate's emitted
# `find ... -not -path '*/X/*'` discovery clause (OUTPUT, not source).
# Verbatim copy of assert-test-in-diff.test.sh's Case 10 gate_excl helper.
gate_excl() {
  node "$WARCONFIG" --resolve-gate "node --test 'skills/**/*.test.mjs'" \
    | grep -oE "\-not -path '\*/[^/]*/\*'" \
    | sed -E "s#-not -path '\*/(.*)/\*'#\1#" \
    | sort
}
# floor_excl <script>: exclusion tokens from match_sh_suite's `return 1 ;;` case
# arms (the `.claude/*|*/.claude/*)` etc. shapes). DELIBERATELY scoped to the
# executable `return 1 ;;` arms so the header comment's identical `-not -path`
# prose is NOT counted — otherwise a doc-only edit could fake parity (spec §8);
# the assertion tests the executable arms, not the doc that describes them. The
# bare `return 1` fallthroughs lack ` ;;` and are correctly out of scope.
# TRIPWIRE (the whole point of the inline copy): any FUTURE `return 1 ;;` arm
# added to this script for an unrelated purpose widens the extracted set and turns
# case 9b RED BY DESIGN — the author then reconciles the new arm against the gate's
# exclusion set or updates this extraction contract. A shared sourced lib would
# silently absorb that drift; the inline copy fails loud, which is the intent.
floor_excl() {
  grep 'return 1 ;;' "$1" \
    | sed -E 's#^[[:space:]]*([^/|]*)/\*.*#\1#' \
    | sort
}

EXPECT_EXCL="$(printf '.claude\n.git\nnode_modules\n')"
G_EXCL="$(gate_excl)"
F_EXCL="$(floor_excl "$SCRIPT")"

# 9a: resolveGate output exclusion set == canonical {.claude,.git,node_modules}.
if [ "$G_EXCL" = "$EXPECT_EXCL" ]; then
  pass "case 9a: resolveGate output exclusion set == {.claude,.git,node_modules}"
else
  fail "case 9a: resolveGate output exclusion set drifted -> got [$(printf '%s' "$G_EXCL" | tr '\n' ' ')]"
fi

# 9b: floor match_sh_suite exclusion set == gate output set (THE parity claim).
# Reads resolveGate output, not source -> refactor-robust; drift on either side RED.
if [ "$F_EXCL" = "$G_EXCL" ]; then
  pass "case 9b: floor match_sh_suite exclusion set == resolveGate output set (floor ⊆ gate)"
else
  fail "case 9b: floor⊆gate PARITY BROKEN -> floor [$(printf '%s' "$F_EXCL" | tr '\n' ' ')] != gate [$(printf '%s' "$G_EXCL" | tr '\n' ' ')]"
fi

# 9c: the *.test.sh name glob is present in BOTH gate output and the COMMENT-STRIPPED
# floor source (grep -v '^[[:space:]]*#') — a `#`-comment naming it cannot satisfy
# the floor side, only the executable `*.test.sh)` case arm can.
g_name=0
node "$WARCONFIG" --resolve-gate "node --test 'skills/**/*.test.mjs'" | grep -qE "\-name '\*.test.sh'" && g_name=1
f_name=0
grep -v '^[[:space:]]*#' "$SCRIPT" | grep -qF '*.test.sh)' && f_name=1
if [ "$g_name" -eq 1 ] && [ "$f_name" -eq 1 ]; then
  pass "case 9c: *.test.sh name glob present in both gate output and (comment-stripped) floor"
else
  fail "case 9c: *.test.sh name glob missing (gate=$g_name floor=$f_name)"
fi

# 9d: shape-adapted mjs-mirror. gate-pin-status.sh has NO `pattern_mjs="..."` literal
# (unlike assert-test-in-diff.sh's Case 10d); its skills/**/*.test.mjs discovery is the
# nested `skills/*)` + `*.test.mjs)` case arms inside match_default. Assert BOTH structural
# arms as FIXED STRINGS (grep -F, never unescaped-glob grep) in the COMMENT-STRIPPED
# match_default function BODY (sed function-slice) — a header/inline `#`-comment describing
# the same pattern in prose can never satisfy this.
md_body="$(sed -n '/^match_default()/,/^}/p' "$SCRIPT" | grep -v '^[[:space:]]*#')"
d_skills=0; printf '%s\n' "$md_body" | grep -qF 'skills/*)'    && d_skills=1
d_mjs=0;    printf '%s\n' "$md_body" | grep -qF '*.test.mjs)'  && d_mjs=1
if [ "$d_skills" -eq 1 ] && [ "$d_mjs" -eq 1 ]; then
  pass "case 9d: match_default body carries structural mjs-mirror arms skills/*) + *.test.mjs)"
else
  fail "case 9d: match_default mjs-mirror arms missing (skills/*)=$d_skills *.test.mjs)=$d_mjs)"
fi

# 9e: DELETE-THE-FEATURE — remove the .claude arm from a floor copy; its extracted
# set must NO LONGER equal the gate set, proving 9b actually distinguishes a
# discovery-set drift (not a vacuous always-true compare). Mutating either side
# (floor arm removed, or a resolveGate exclusion changed) turns 9b RED.
# memory: weak-test-assertion-passes-without-feature-being-exercised.
MUT="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"
TMPFILES="$TMPFILES $MUT"
grep -v '\.claude/\*)' "$SCRIPT" > "$MUT/floor.sh"
M_EXCL="$(floor_excl "$MUT/floor.sh")"
if [ "$M_EXCL" != "$G_EXCL" ]; then
  pass "case 9e: floor with .claude arm removed != gate set (parity check is load-bearing)"
else
  fail "case 9e: mutated floor (.claude dropped) still == gate set -> parity check is vacuous"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\ngate-pin-status: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
