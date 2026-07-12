#!/usr/bin/env bash
# Tests for assert-guard-specificity-in-diff.sh — the WAR guard-specificity floor.
#
# Plain-bash over throwaway mktemp git repos; one fresh fixture per case.
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
#
# Exit 0 = all cases passed; non-zero = at least one failed.
#
# Cases (each load-bearing — the noted deletion flips the assertion):
#   1. uncovered die "MSG" guard in a non-test file -> exit 1, MSG on stdout.
#   2. SAME MSG but a same-diff test asserts it -> exit 0.
#      (1+2 are a delete-and-trace PAIR: break detection and 1 stops firing;
#       break coverage-matching and 2 flips to 1.)
#   3. no new guard (a `# die "..."` COMMENT + a plain `echo` with no >&2) -> exit 0.
#      (delete comment-skip -> the comment is read as a die call -> exit 1;
#       drop the >&2 requirement -> the plain echo is flagged -> exit 1.)
#   4. non-shell change (.js `throw`, `process.stderr.write`) -> exit 0.
#      (broaden detection to non-shell guards -> exit 1.)
#   5a. bad ref (nonexistent base sha) -> exit 2 (NOT 1).
#   5b. `..` in base arg -> exit 2 + the guard's unique stderr message.
#       (delete the .. guard -> base reaches git diff -> "git diff failed", no
#        "refusing" token -> the stderr assertion flips.)
#   6. printf '...\n' >&2 on one added line, exit on the NEXT -> exit 1, MSG on
#      stdout (trailing \n stripped). (delete the pending/adjacency arm -> exit 0.)
#   7. a lone `die() { ...; >&2; exit; }` HELPER definition, no call -> exit 0.
#      (delete the function-def skip -> the helper's printf `%s` self-flags -> exit 1.
#       This is why every new floor script's boilerplate never trips the floor.)
#   8. coverage only via --pattern: guard covered by src/foo.test.ts.
#      8a BARE -> exit 1 (.test.ts not a default test); 8b --pattern '*.test.ts' -> exit 0.
#      (delete the --pattern union -> 8b flips to 1.)
#   9. UNION arm: guard covered by hooks/x.test.sh, --pattern '*.test.ts' -> exit 0.
#      (the custom token misses .test.sh; only the unioned *.test.sh arm credits it —
#       floor ⊆ gate. Delete the union -> exit 1.)
#  10. FLOOR ⊆ GATE PARITY (#732, survey-derived): this floor's *.test.sh discovery
#      set must equal the gate's, read from resolveGate's emitted OUTPUT string (not
#      its source), so a semantics-preserving resolveGate refactor cannot break it.
#      Replicates the assert-test-in-diff.test.sh Case 10 idiom (inline helper copies).
#      a. resolveGate output exclusion set == {.claude,.git,node_modules}
#      b. floor match_sh_suite exclusion set == resolveGate output set (the parity)
#      c. *.test.sh name glob present in gate output and comment-stripped floor source
#      d. shape-adapted: this script has no `pattern_mjs` literal, so its
#         skills/**/*.test.mjs mirror is the nested `skills/*)` + `*.test.mjs)` arms
#         inside match_default — asserted via function-body extraction + grep -F.
#      e. DELETE-THE-FEATURE: floor with the .claude arm removed != gate set,
#         proving 10b is load-bearing (mutating either side turns it RED).
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/assert-guard-specificity-in-diff.sh"

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

# add_file <repo> <relpath> <<'BODY' ... BODY  — write a file (mkdir -p its dir), staged.
add_file() {
  af_repo="$1"; af_path="$2"
  af_dir="$(dirname "$af_path")"
  [ "$af_dir" = "." ] || mkdir -p "$af_repo/$af_dir"
  cat > "$af_repo/$af_path"
  git -C "$af_repo" add "$af_path"
}

# ---------------------------------------------------------------------------
# Case 1: uncovered die guard -> exit 1 + the message on stdout.
# ---------------------------------------------------------------------------
R1="$(setup_repo)"
BASE1="$(git -C "$R1" rev-parse HEAD)"
git -C "$R1" checkout -qb task/uncovered-die 2>/dev/null
add_file "$R1" lib/foo.sh <<'BODY'
#!/usr/bin/env bash
[ -n "$x" ] || die "unique guard alpha"
BODY
git -C "$R1" commit -qm "add guard, no test"
TASK1="$(git -C "$R1" rev-parse HEAD)"
git -C "$R1" checkout -q - 2>/dev/null

cwd1="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"; TMPFILES="$TMPFILES $cwd1"
rc1=0
out1="$( ( cd "$cwd1" && bash "$SCRIPT" "$BASE1" "$TASK1" --repo "$R1" ) 2>/dev/null )" || rc1=$?
if [ "$rc1" -eq 1 ] && printf '%s' "$out1" | grep -qF "unique guard alpha"; then
  pass "case 1: uncovered die guard -> exit 1 + message on stdout"
elif [ "$rc1" -ne 1 ]; then
  fail "case 1: uncovered die guard -> expected exit 1, got $rc1 (detection broken?)"
else
  fail "case 1: uncovered die guard -> exit 1 but message absent on stdout (got: $out1)"
fi

# ---------------------------------------------------------------------------
# Case 2: SAME guard message WITH a same-diff test asserting it -> exit 0.
# Paired with case 1: this is the coverage-arm delete-and-trace.
# ---------------------------------------------------------------------------
R2="$(setup_repo)"
BASE2="$(git -C "$R2" rev-parse HEAD)"
git -C "$R2" checkout -qb task/covered-die 2>/dev/null
add_file "$R2" lib/foo.sh <<'BODY'
#!/usr/bin/env bash
[ -n "$x" ] || die "unique guard alpha"
BODY
add_file "$R2" helpers/g.test.sh <<'BODY'
# regression: the guard fires with its exact message
grep -qF "unique guard alpha" out
BODY
git -C "$R2" commit -qm "add guard + covering test"
TASK2="$(git -C "$R2" rev-parse HEAD)"
git -C "$R2" checkout -q - 2>/dev/null

cwd2="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"; TMPFILES="$TMPFILES $cwd2"
rc2=0
( cd "$cwd2" && bash "$SCRIPT" "$BASE2" "$TASK2" --repo "$R2" ) >/dev/null 2>&1 || rc2=$?
if [ "$rc2" -eq 0 ]; then
  pass "case 2: covered die guard (same message asserted in a same-diff test) -> exit 0"
else
  fail "case 2: covered die guard -> expected exit 0, got $rc2 (coverage matching broken?)"
fi

# ---------------------------------------------------------------------------
# Case 3: no new guard — a `# die "..."` COMMENT and a plain echo (no >&2) -> exit 0.
# ---------------------------------------------------------------------------
R3="$(setup_repo)"
BASE3="$(git -C "$R3" rev-parse HEAD)"
git -C "$R3" checkout -qb task/no-guard 2>/dev/null
add_file "$R3" lib/plain.sh <<'BODY'
#!/usr/bin/env bash
# die "commented-out guard should not flag"
echo "ordinary stdout, no stderr redirect"
BODY
git -C "$R3" commit -qm "no real guard"
TASK3="$(git -C "$R3" rev-parse HEAD)"
git -C "$R3" checkout -q - 2>/dev/null

cwd3="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"; TMPFILES="$TMPFILES $cwd3"
rc3=0
( cd "$cwd3" && bash "$SCRIPT" "$BASE3" "$TASK3" --repo "$R3" ) >/dev/null 2>&1 || rc3=$?
if [ "$rc3" -eq 0 ]; then
  pass "case 3: comment + plain echo (no >&2) -> exit 0 (comment-skip + >&2 requirement)"
else
  fail "case 3: no-new-guard -> expected exit 0, got $rc3 (comment read as guard, or >&2 not required)"
fi

# ---------------------------------------------------------------------------
# Case 4: non-shell change (.js throw / stderr.write) -> exit 0 (shell heuristic only).
# ---------------------------------------------------------------------------
R4="$(setup_repo)"
BASE4="$(git -C "$R4" rev-parse HEAD)"
git -C "$R4" checkout -qb task/non-shell 2>/dev/null
add_file "$R4" src/app.js <<'BODY'
if (!ok) throw new Error("js boom should not flag");
process.stderr.write("plain node warning");
BODY
git -C "$R4" commit -qm "add non-shell source"
TASK4="$(git -C "$R4" rev-parse HEAD)"
git -C "$R4" checkout -q - 2>/dev/null

cwd4="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"; TMPFILES="$TMPFILES $cwd4"
rc4=0
( cd "$cwd4" && bash "$SCRIPT" "$BASE4" "$TASK4" --repo "$R4" ) >/dev/null 2>&1 || rc4=$?
if [ "$rc4" -eq 0 ]; then
  pass "case 4: non-shell change (.js throw) -> exit 0 (heuristic is shell-only)"
else
  fail "case 4: non-shell change -> expected exit 0, got $rc4 (over-broad detection matched non-shell)"
fi

# ---------------------------------------------------------------------------
# Case 5a: bad ref (nonexistent base) -> exit 2, NEVER collapsed into 1.
# ---------------------------------------------------------------------------
R5="$(setup_repo)"
git -C "$R5" checkout -qb task/anything 2>/dev/null
add_file "$R5" lib/z.sh <<'BODY'
#!/usr/bin/env bash
die "whatever"
BODY
git -C "$R5" commit -qm "add"
TASK5="$(git -C "$R5" rev-parse HEAD)"
git -C "$R5" checkout -q - 2>/dev/null

cwd5="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"; TMPFILES="$TMPFILES $cwd5"
rc5a=0
( cd "$cwd5" && bash "$SCRIPT" "0000000000000000000000000000000000000000" "$TASK5" --repo "$R5" ) >/dev/null 2>&1 || rc5a=$?
if [ "$rc5a" -eq 2 ]; then
  pass "case 5a: bad ref -> exit 2 (git/ref error, never collapsed into 1)"
else
  fail "case 5a: bad ref -> expected exit 2, got $rc5a"
fi

# ---------------------------------------------------------------------------
# Case 5b: `..` in base arg -> exit 2 + the guard's unique stderr message.
# The branch has a REAL uncovered guard that WOULD flag if the diff ran; the .. guard
# must fire FIRST. Assert exit 2 AND the guard's token in stderr (deleting the guard
# routes to "git diff failed" instead — a different message — flipping this).
# memory: relative-path-test-needs-clean-cwd — cd to an unrelated mktemp dir.
# ---------------------------------------------------------------------------
cwd5b="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"; TMPFILES="$TMPFILES $cwd5b"
rc5b=0
stderr5b="$( cd "$cwd5b" && bash "$SCRIPT" "../$BASE1" "$TASK5" --repo "$R5" 2>&1 >/dev/null )" || rc5b=$?
if [ "$rc5b" -eq 2 ] && printf '%s' "$stderr5b" | grep -qF "refusing to use potentially unsafe ref"; then
  pass "case 5b: '..' in base -> exit 2 + guard message in stderr"
elif [ "$rc5b" -ne 2 ]; then
  fail "case 5b: '..' in base -> expected exit 2, got $rc5b"
else
  fail "case 5b: '..' in base -> exit 2 but guard message absent (guard bypassed; stderr: $stderr5b)"
fi

# ---------------------------------------------------------------------------
# Case 6: printf '...\n' >&2 on one line, exit on the NEXT (two-line adjacency) -> exit 1.
# ---------------------------------------------------------------------------
R6="$(setup_repo)"
BASE6="$(git -C "$R6" rev-parse HEAD)"
git -C "$R6" checkout -qb task/two-line-guard 2>/dev/null
add_file "$R6" lib/bar.sh <<'BODY'
#!/usr/bin/env bash
validate() {
  printf 'boom beta message\n' >&2
  exit 1
}
BODY
git -C "$R6" commit -qm "add two-line stderr+exit guard, no test"
TASK6="$(git -C "$R6" rev-parse HEAD)"
git -C "$R6" checkout -q - 2>/dev/null

cwd6="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"; TMPFILES="$TMPFILES $cwd6"
rc6=0
out6="$( ( cd "$cwd6" && bash "$SCRIPT" "$BASE6" "$TASK6" --repo "$R6" ) 2>/dev/null )" || rc6=$?
if [ "$rc6" -eq 1 ] && printf '%s' "$out6" | grep -qF "boom beta message"; then
  pass "case 6: printf >&2 then exit on next line -> exit 1 + message (trailing \\n stripped)"
elif [ "$rc6" -ne 1 ]; then
  fail "case 6: two-line stderr+exit guard -> expected exit 1, got $rc6 (adjacency arm broken?)"
else
  fail "case 6: two-line guard -> exit 1 but message absent (got: $out6)"
fi

# ---------------------------------------------------------------------------
# Case 7: a lone die() HELPER definition (no call) -> exit 0. The def-skip proof:
# without it, `die() { printf '%s: %s\n' ... >&2; exit 1; }` self-flags on the printf.
# ---------------------------------------------------------------------------
R7="$(setup_repo)"
BASE7="$(git -C "$R7" rev-parse HEAD)"
git -C "$R7" checkout -qb task/helper-only 2>/dev/null
add_file "$R7" lib/onlyhelper.sh <<'BODY'
#!/usr/bin/env bash
die() { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-1}"; }
BODY
git -C "$R7" commit -qm "add die() helper only, no guard call"
TASK7="$(git -C "$R7" rev-parse HEAD)"
git -C "$R7" checkout -q - 2>/dev/null

cwd7="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"; TMPFILES="$TMPFILES $cwd7"
rc7=0
( cd "$cwd7" && bash "$SCRIPT" "$BASE7" "$TASK7" --repo "$R7" ) >/dev/null 2>&1 || rc7=$?
if [ "$rc7" -eq 0 ]; then
  pass "case 7: lone die() helper definition -> exit 0 (function-def skip; helper never self-flags)"
else
  fail "case 7: die() helper only -> expected exit 0, got $rc7 (def-skip broken; boilerplate self-flags)"
fi

# ---------------------------------------------------------------------------
# Case 8: coverage only via --pattern (target-repo .test.ts convention).
#   guard `die "ts covered gamma"` in lib/ts.sh; the assertion lives in src/foo.test.ts.
#   8a BARE -> exit 1 (.test.ts not in the default test set -> not a coverage source).
#   8b --pattern '*.test.ts' -> exit 0 (.test.ts now counts as a test).
# LOAD-BEARING pair: 8a proves the default refuses .test.ts as coverage, so 8b's pass is
# attributable to the --pattern union, not a vacuous default match.
# ---------------------------------------------------------------------------
R8="$(setup_repo)"
BASE8="$(git -C "$R8" rev-parse HEAD)"
git -C "$R8" checkout -qb task/ts-cover 2>/dev/null
add_file "$R8" lib/ts.sh <<'BODY'
#!/usr/bin/env bash
[ -n "$y" ] || die "ts covered gamma"
BODY
add_file "$R8" src/foo.test.ts <<'BODY'
expect(err).toContain("ts covered gamma");
BODY
git -C "$R8" commit -qm "add guard + .test.ts assertion"
TASK8="$(git -C "$R8" rev-parse HEAD)"
git -C "$R8" checkout -q - 2>/dev/null

cwd8="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"; TMPFILES="$TMPFILES $cwd8"
rc8a=0
( cd "$cwd8" && bash "$SCRIPT" "$BASE8" "$TASK8" --repo "$R8" ) >/dev/null 2>&1 || rc8a=$?
if [ "$rc8a" -eq 1 ]; then
  pass "case 8a: guard covered only by .test.ts, BARE -> exit 1 (.test.ts not a default test)"
else
  fail "case 8a: BARE -> expected exit 1, got $rc8a (.test.ts counted as coverage without --pattern)"
fi

rc8b=0
( cd "$cwd8" && bash "$SCRIPT" "$BASE8" "$TASK8" --pattern '*.test.ts' --repo "$R8" ) >/dev/null 2>&1 || rc8b=$?
if [ "$rc8b" -eq 0 ]; then
  pass "case 8b: same + --pattern '*.test.ts' -> exit 0 (--pattern threads into the coverage corpus)"
else
  fail "case 8b: --pattern '*.test.ts' -> expected exit 0, got $rc8b (--pattern not unioned into coverage)"
fi

# ---------------------------------------------------------------------------
# Case 9: UNION arm — guard covered by hooks/x.test.sh, custom --pattern '*.test.ts'.
# The custom token misses .test.sh; only the unioned *.test.sh discovery arm credits the
# coverage (floor ⊆ gate). Delete the union and this flips to exit 1.
# ---------------------------------------------------------------------------
R9="$(setup_repo)"
BASE9="$(git -C "$R9" rev-parse HEAD)"
git -C "$R9" checkout -qb task/union-cover 2>/dev/null
add_file "$R9" lib/sh.sh <<'BODY'
#!/usr/bin/env bash
[ -n "$z" ] || die "sh union delta"
BODY
add_file "$R9" hooks/x.test.sh <<'BODY'
grep -qF "sh union delta" out
BODY
git -C "$R9" commit -qm "add guard + .test.sh coverage"
TASK9="$(git -C "$R9" rev-parse HEAD)"
git -C "$R9" checkout -q - 2>/dev/null

cwd9="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"; TMPFILES="$TMPFILES $cwd9"
rc9=0
( cd "$cwd9" && bash "$SCRIPT" "$BASE9" "$TASK9" --pattern '*.test.ts' --repo "$R9" ) >/dev/null 2>&1 || rc9=$?
if [ "$rc9" -eq 0 ]; then
  pass "case 9: .test.sh coverage + --pattern '*.test.ts' -> exit 0 (unioned *.test.sh arm; floor ⊆ gate)"
else
  fail "case 9: union arm -> expected exit 0, got $rc9 (union deleted? coverage blind to *.test.sh)"
fi

# ---------------------------------------------------------------------------
# Case 10: FLOOR ⊆ GATE PARITY (#732, survey-derived). This floor's *.test.sh
# discovery set is asserted equal to the gate's, extracted from resolveGate's emitted
# OUTPUT string (not its source text) — a benign resolveGate refactor that preserves
# semantics cannot break it; only a real discovery-set drift does. Mutating either side
# (a floor arm removed, or the resolveGate exclusion changed) turns it RED. Replicates
# the assert-test-in-diff.test.sh Case 10 idiom with the two extraction helpers copied
# INLINE (resolved design: no shared sourced lib — a drifted inline copy fails loud).
# spec §4C; the recorded shell↔mjs drift-guard idiom applied to floor ⊆ gate.
# ---------------------------------------------------------------------------
WARCONFIG="$HERE/war-config.mjs"

# gate_excl: exclusion tokens from resolveGate's emitted
# `find ... -not -path '*/X/*'` discovery clause (OUTPUT, not source) — the verbatim
# assert-test-in-diff.test.sh Case 10 helper.
gate_excl() {
  node "$WARCONFIG" --resolve-gate "node --test 'skills/**/*.test.mjs'" \
    | grep -oE "\-not -path '\*/[^/]*/\*'" \
    | sed -E "s#-not -path '\*/(.*)/\*'#\1#" \
    | sort
}
# floor_excl <script>: exclusion tokens from match_sh_suite's `return 1 ;;` case
# arms (the `.claude/*|*/.claude/*)` etc. shapes). Scoped to `return 1 ;;` so the
# header comment's identical `-not -path` prose is NOT counted — the assertion tests
# the executable arms, not the doc that describes them (a doc edit alone could
# otherwise fake parity, spec §8). TRIPWIRE: any future `return 1 ;;` arm added here
# for an unrelated purpose widens the extracted set and turns case 10b RED BY DESIGN;
# the author then reconciles against the gate or updates this extraction contract.
# That loud failure is the whole point of the inline copy — a shared sourced lib
# would silently absorb the drift instead.
floor_excl() {
  grep 'return 1 ;;' "$1" \
    | sed -E 's#^[[:space:]]*([^/|]*)/\*.*#\1#' \
    | sort
}

EXPECT_EXCL="$(printf '.claude\n.git\nnode_modules\n')"
G_EXCL="$(gate_excl)"
F_EXCL="$(floor_excl "$SCRIPT")"

# 10a: resolveGate output exclusion set == canonical {.claude,.git,node_modules}
if [ "$G_EXCL" = "$EXPECT_EXCL" ]; then
  pass "case 10a: resolveGate output exclusion set == {.claude,.git,node_modules}"
else
  fail "case 10a: resolveGate output exclusion set drifted -> got [$(printf '%s' "$G_EXCL" | tr '\n' ' ')]"
fi

# 10b: floor match_sh_suite exclusion set == gate output set (THE parity claim).
# Reads resolveGate output, not source -> refactor-robust; drift on either side RED.
if [ "$F_EXCL" = "$G_EXCL" ]; then
  pass "case 10b: floor match_sh_suite exclusion set == resolveGate output set (floor ⊆ gate)"
else
  fail "case 10b: floor⊆gate PARITY BROKEN -> floor [$(printf '%s' "$F_EXCL" | tr '\n' ' ')] != gate [$(printf '%s' "$G_EXCL" | tr '\n' ' ')]"
fi

# 10c: the *.test.sh name glob is present in BOTH gate output and the floor's
# COMMENT-STRIPPED source (grep -v '^[[:space:]]*#') — a `# ... *.test.sh ...` comment
# can never satisfy the floor side; only the executable arm counts.
g_name=0
node "$WARCONFIG" --resolve-gate "node --test 'skills/**/*.test.mjs'" | grep -qE "\-name '\*.test.sh'" && g_name=1
f_name=0
grep -v '^[[:space:]]*#' "$SCRIPT" | grep -qF '*.test.sh)' && f_name=1
if [ "$g_name" -eq 1 ] && [ "$f_name" -eq 1 ]; then
  pass "case 10c: *.test.sh name glob present in both gate output and comment-stripped floor"
else
  fail "case 10c: *.test.sh name glob missing (gate=$g_name floor=$f_name)"
fi

# 10d: SHAPE-ADAPTED node-glob mirror. assert-guard-specificity-in-diff.sh has NO
# `pattern_mjs=` literal (unlike assert-test-in-diff.sh's Case 10d); its
# skills/**/*.test.mjs mirror is the nested `skills/*)` + `*.test.mjs)` case arms inside
# match_default. Extract that function body (sed range on the def), comment-strip, then
# grep -F the two fixed-string arm tokens — a prose comment describing the pattern can
# never satisfy it, and grep -F keeps the glob metacharacters literal (bash-3.2 safe).
# Asserts what THIS construct actually is, never a literal borrowed from Case 10d.
md_body="$(sed -n '/^match_default()/,/^}/p' "$SCRIPT" | grep -v '^[[:space:]]*#')"
d_skills=0
d_mjs=0
printf '%s' "$md_body" | grep -qF 'skills/*)'   && d_skills=1
printf '%s' "$md_body" | grep -qF '*.test.mjs)' && d_mjs=1
if [ "$d_skills" -eq 1 ] && [ "$d_mjs" -eq 1 ]; then
  pass "case 10d: match_default mjs-mirror arms (skills/*) + *.test.mjs)) present in function body"
else
  fail "case 10d: match_default mjs-mirror arms drifted (skills/*)=$d_skills *.test.mjs)=$d_mjs)"
fi

# 10e: DELETE-THE-FEATURE — remove the .claude arm from a floor copy; its extracted
# set must NO LONGER equal the gate set, proving 10b actually distinguishes a
# discovery-set drift (not a vacuous always-true compare).
# memory: weak-test-assertion-passes-without-feature-being-exercised.
MUT="$(mktemp -d 2>/dev/null || mktemp -d -t wartest)"; TMPFILES="$TMPFILES $MUT"
grep -v '\.claude/\*)' "$SCRIPT" > "$MUT/floor.sh"
M_EXCL="$(floor_excl "$MUT/floor.sh")"
if [ "$M_EXCL" != "$G_EXCL" ]; then
  pass "case 10e: floor with .claude arm removed != gate set (parity check is load-bearing)"
else
  fail "case 10e: mutated floor (.claude dropped) still == gate set -> parity check is vacuous"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\nassert-guard-specificity-in-diff: %d check(s) passed, %d check(s) failed.\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
