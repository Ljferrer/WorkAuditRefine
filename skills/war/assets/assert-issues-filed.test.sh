#!/usr/bin/env bash
# Tests for assert-issues-filed.sh — WAR issue-lifecycle floor (spec §4.1, ADR 0026).
#
# Each case installs a stubbed `gh` on PATH (records argv, behaves per fixture
# files) plus a fixture ledger.json, and asserts the load-bearing exit contract:
#   0 — verified
#   1 — named route: `issues-missing` OR `done-but-open`
#   2 — gh/network/ledger-parse/tooling error (NEVER collapsed into 1)
#
# CRITICAL ASSERTION DESIGN (mirrors gh-preflight.test.sh / the floor family):
# the non-zero cases assert a SPECIFIC exit code AND the named route on stderr,
# never merely exit != 0 — a crashed script also exits non-zero. The C5 teeth
# (network failure => 2, not a false `issues-missing` 1) is asserted directly.
#
# Cases (each delete-and-traced — the comment names what break flips it):
#   1. all epic+task issues exist -> exit 0
#   2. a task issue is null in the ledger -> exit 1 `issues-missing` naming the task
#   3. a task issue is gh not-found -> exit 1 `issues-missing` naming the issue
#   4. gh network failure verifying an issue -> exit 2 (asserted != 1)
#   5. landed phase, epic state:OPEN + status:done -> exit 1 `done-but-open`
#   6. landed phase, epic state:CLOSED + status:done -> exit 0
#   7. `--close-epic 7 --sha abc123` -> gh edit(+status:done/-status:in-progress)
#      AND gh close(--reason completed, comment carries the sha) both recorded
#   8. bad ledger JSON -> exit 2 (parse error, not 1)
#   9. gh-preflight tooling failure (WAR_GH_USER mismatch, no switch) -> exit 2
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
# Exit 0 = all cases passed; non-zero = at least one failed.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/assert-issues-filed.sh"

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

# ---------------------------------------------------------------------------
# make_env: fresh scratch dir with a stubbed `gh` on PATH; echo the dir.
# Stub behavior is driven by files the caller writes under $D:
#   $D/issues/<n>   contents = "<STATE>\t<comma-labels>" -> gh issue view prints
#                   it (exit 0). Missing file -> gh emits a not-found GraphQL
#                   error to stderr (exit 1).
#   $D/argv         append-only argv log (one gh invocation per line)
#   GH_NET_FAIL=1   `gh issue view` emits a NON-not-found network error (exit 1)
#                   -> the floor must classify this as tooling (exit 2), not 1.
#   $D/login        contents = the login `gh api user --jq .login` returns
#                   (used only by the embedded gh-preflight; defaults to a value
#                   equal to WAR_GH_USER so preflight is a clean pass).
# ---------------------------------------------------------------------------
make_env() {
  D="$(mktemp -d 2>/dev/null || mktemp -d -t aif)"
  TMPFILES="$TMPFILES $D"
  mkdir -p "$D/bin" "$D/issues"
  # Default the preflight login to whatever WAR_GH_USER the case exports, so
  # preflight passes unless a case deliberately breaks it. If WAR_GH_USER is
  # empty/unset, preflight no-ops and never reads $D/login.
  printf '%s' "${WAR_GH_USER:-}" > "$D/login"
  cat > "$D/bin/gh" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$D/argv"
case "$1 $2" in
  "api user")
    cat "$D/login" 2>/dev/null
    ;;
  "auth switch")
    exit 0
    ;;
  "issue view")
    _n="$3"
    if [ "${GH_NET_FAIL:-0}" = "1" ]; then
      echo "error connecting to api.github.com: dial tcp: lookup timeout" >&2
      exit 1
    fi
    if [ -f "$D/issues/$_n" ]; then
      cat "$D/issues/$_n"
      exit 0
    fi
    echo "GraphQL: Could not resolve to an Issue with the number $_n. (repository.issue)" >&2
    exit 1
    ;;
  "issue edit"|"issue close")
    exit 0
    ;;
  *)
    echo "STUB gh: unexpected argv: $*" >&2
    exit 5
    ;;
esac
STUB
  chmod +x "$D/bin/gh"
  printf '%s' "$D"
}

# write_ledger <dir> <json> -> path to ledger file
write_ledger() {
  printf '%s' "$2" > "$1/ledger.json"
  printf '%s' "$1/ledger.json"
}

# ---------------------------------------------------------------------------
# Case 1: all epic + task issues exist -> exit 0.
# Break trace: make a task's issue file absent -> gh not-found -> exit 1.
# ---------------------------------------------------------------------------
D="$(make_env)"
printf 'OPEN\tphase:1,status:working' > "$D/issues/7"
printf 'OPEN\t'                       > "$D/issues/8"
printf 'OPEN\t'                       > "$D/issues/9"
L="$(write_ledger "$D" '{"phases":[{"id":"1","status":"running","epic_issue":7,"tasks":[{"id":"1.1","issue":8},{"id":"1.2","issue":9}]}]}')"
rc=0
D="$D" PATH="$D/bin:$PATH" bash "$SCRIPT" assert "$L" 1 >/dev/null 2>&1 || rc=$?
if [ "$rc" = "0" ]; then
  pass "all issues exist -> exit 0"
else
  fail "all-exist (expected 0, got rc=$rc)"
fi

# ---------------------------------------------------------------------------
# Case 2: a task issue is null in the ledger -> exit 1 `issues-missing`.
# Break trace: drop the `[ -n "$_tissue" ]` null guard -> gh gets called with
# an empty number, unexpected argv -> exit 2, not a clean 1 naming the task.
# ---------------------------------------------------------------------------
D="$(make_env)"
printf 'OPEN\t' > "$D/issues/7"
L="$(write_ledger "$D" '{"phases":[{"id":"1","status":"running","epic_issue":7,"tasks":[{"id":"1.1","issue":null}]}]}')"
rc=0
err="$(D="$D" PATH="$D/bin:$PATH" bash "$SCRIPT" assert "$L" 1 2>&1 >/dev/null)" || rc=$?
if [ "$rc" = "1" ] && printf '%s' "$err" | grep -q 'issues-missing' && printf '%s' "$err" | grep -q '1.1'; then
  pass "null task issue -> exit 1 issues-missing naming task"
else
  fail "null-task (expected 1 + issues-missing + 1.1, got rc=$rc err=|$err|)"
fi

# ---------------------------------------------------------------------------
# Case 3: a task issue is gh not-found -> exit 1 `issues-missing` naming issue #.
# Break trace: classify not-found as tooling -> exit 2 not 1.
# ---------------------------------------------------------------------------
D="$(make_env)"
printf 'OPEN\t' > "$D/issues/7"
# issue 8 file intentionally absent -> gh not-found
L="$(write_ledger "$D" '{"phases":[{"id":"1","status":"running","epic_issue":7,"tasks":[{"id":"1.1","issue":8}]}]}')"
rc=0
err="$(D="$D" PATH="$D/bin:$PATH" bash "$SCRIPT" assert "$L" 1 2>&1 >/dev/null)" || rc=$?
if [ "$rc" = "1" ] && printf '%s' "$err" | grep -q 'issues-missing' && printf '%s' "$err" | grep -q '#8'; then
  pass "gh not-found task issue -> exit 1 issues-missing naming #8"
else
  fail "notfound-task (expected 1 + issues-missing + #8, got rc=$rc err=|$err|)"
fi

# ---------------------------------------------------------------------------
# Case 4: gh network failure verifying an issue -> exit 2, NOT 1 (C5 teeth).
# Break trace: collapse the tooling class into the not-found (1) route -> the
# network blip would masquerade as `issues-missing` and the assert flips.
# ---------------------------------------------------------------------------
D="$(make_env)"
printf 'OPEN\t' > "$D/issues/7"
printf 'OPEN\t' > "$D/issues/8"
L="$(write_ledger "$D" '{"phases":[{"id":"1","status":"running","epic_issue":7,"tasks":[{"id":"1.1","issue":8}]}]}')"
rc=0
D="$D" GH_NET_FAIL=1 PATH="$D/bin:$PATH" bash "$SCRIPT" assert "$L" 1 >/dev/null 2>&1 || rc=$?
if [ "$rc" = "2" ]; then
  pass "gh network failure -> exit 2 (not 1)"
else
  fail "net-failure (expected 2, got rc=$rc)"
fi

# ---------------------------------------------------------------------------
# Case 5: landed phase, epic state:OPEN + status:done -> exit 1 `done-but-open`.
# Break trace: skip the landed CLOSED check -> a labelled-but-open epic passes
# (exit 0) and the coupling teeth are gone.
# ---------------------------------------------------------------------------
D="$(make_env)"
printf 'OPEN\tphase:1,status:done' > "$D/issues/7"
L="$(write_ledger "$D" '{"phases":[{"id":"1","status":"landed","epic_issue":7,"tasks":[]}]}')"
rc=0
err="$(D="$D" PATH="$D/bin:$PATH" bash "$SCRIPT" assert "$L" 1 2>&1 >/dev/null)" || rc=$?
if [ "$rc" = "1" ] && printf '%s' "$err" | grep -q 'done-but-open'; then
  pass "landed + OPEN + status:done -> exit 1 done-but-open"
else
  fail "done-but-open (expected 1 + done-but-open, got rc=$rc err=|$err|)"
fi

# ---------------------------------------------------------------------------
# Case 6: landed phase, epic state:CLOSED + status:done -> exit 0.
# Break trace: require OPEN by mistake -> a correctly-closed epic fails.
# ---------------------------------------------------------------------------
D="$(make_env)"
printf 'CLOSED\tphase:1,status:done' > "$D/issues/7"
L="$(write_ledger "$D" '{"phases":[{"id":"1","status":"landed","epic_issue":7,"tasks":[]}]}')"
rc=0
D="$D" PATH="$D/bin:$PATH" bash "$SCRIPT" assert "$L" 1 >/dev/null 2>&1 || rc=$?
if [ "$rc" = "0" ]; then
  pass "landed + CLOSED + status:done -> exit 0"
else
  fail "landed-closed (expected 0, got rc=$rc)"
fi

# ---------------------------------------------------------------------------
# Case 7: `--close-epic 7 --sha abc123` -> BOTH gh edit (label swap) AND gh
# close (--reason completed, comment carries the sha) recorded in argv.
# Break trace: drop the label edit or the close -> the paired grep asserts flip.
# ---------------------------------------------------------------------------
D="$(make_env)"
rc=0
D="$D" PATH="$D/bin:$PATH" bash "$SCRIPT" --close-epic 7 --sha abc123 --phase "phase 1" >/dev/null 2>&1 || rc=$?
if [ "$rc" = "0" ] \
   && grep -q 'issue edit 7 --add-label status:done --remove-label status:in-progress' "$D/argv" \
   && grep -q 'issue close 7 --reason completed' "$D/argv" \
   && grep -q 'abc123' "$D/argv"; then
  pass "--close-epic -> label edit + close(reason completed, sha in comment) recorded"
else
  fail "close-epic (expected 0 + edit+close+sha argv, got rc=$rc argv=|$(cat "$D/argv")|)"
fi

# ---------------------------------------------------------------------------
# Case 8: bad ledger JSON -> exit 2 (parse error, not a `1` route).
# Break trace: swallow the node parse failure into a route verdict -> exit 1.
# ---------------------------------------------------------------------------
D="$(make_env)"
L="$(write_ledger "$D" '{ this is not json')"
rc=0
D="$D" PATH="$D/bin:$PATH" bash "$SCRIPT" assert "$L" 1 >/dev/null 2>&1 || rc=$?
if [ "$rc" = "2" ]; then
  pass "bad ledger JSON -> exit 2 (parse error, not 1)"
else
  fail "bad-json (expected 2, got rc=$rc)"
fi

# ---------------------------------------------------------------------------
# Case 9: gh-preflight tooling failure -> exit 2 BEFORE any ledger verdict.
# WAR_GH_USER=alice but the active login (stub $D/login) is bob and the switch
# does not stick -> preflight exits non-zero -> the floor maps to 2.
# Break trace: skip run_preflight -> the account flip goes unnoticed and the
# floor returns a ledger verdict (0/1) instead of the tooling 2.
# ---------------------------------------------------------------------------
D="$(make_env)"                 # make_env seeds $D/login from WAR_GH_USER (unset here) => empty
printf 'bob' > "$D/login"       # active login is bob; switch stub is a no-op (doesn't stick)
printf 'OPEN\t' > "$D/issues/7"
L="$(write_ledger "$D" '{"phases":[{"id":"1","status":"running","epic_issue":7,"tasks":[]}]}')"
rc=0
D="$D" WAR_GH_USER=alice PATH="$D/bin:$PATH" bash "$SCRIPT" assert "$L" 1 >/dev/null 2>&1 || rc=$?
if [ "$rc" = "2" ]; then
  pass "gh-preflight account mismatch -> exit 2"
else
  fail "preflight-fail (expected 2, got rc=$rc)"
fi

# ---------------------------------------------------------------------------
printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
