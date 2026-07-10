#!/usr/bin/env bash
# Tests for gh-preflight.sh — WAR gh-account preflight (spec §1, ADR 0026).
#
# Each case installs a stubbed `gh` on PATH (records argv, behaves per env)
# and asserts the load-bearing exit contract:
#   0 — no-op (empty arg), already-active match, or switched+verified
#   2 — tooling error (gh read/switch failed or returned empty)
#   3 — unrecoverable mismatch (switch did not take)
#
# CRITICAL ASSERTION DESIGN (mirrors validate-auditor-git.test.sh): the
# non-zero cases assert a SPECIFIC exit code AND (for fail-loud) both logins on
# stderr, never merely exit != 0 — a crashed script also exits non-zero.
#
# Cases (each delete-and-traced — the comment names what break flips it):
#   1. empty arg -> exit 0, gh NEVER invoked (no-op / C1 path)
#   2. already-active match -> exit 0, no `auth switch` in argv
#   3. drift -> `auth switch --hostname github.com --user A` recorded, re-verify A -> exit 0
#   4. switch doesn't take -> exit 3, stderr names BOTH wanted 'A' and actual 'B'
#   5. gh api read failure -> exit 2 (NOT 3 — tooling vs mismatch boundary)
#   6. gh api empty login -> exit 2 (never a silent match)
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
# Exit 0 = all cases passed; non-zero = at least one failed.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/gh-preflight.sh"

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
# Stub behavior is driven by files/env the caller sets:
#   $D/login       contents = the login `gh api user --jq .login` returns
#   $D/argv        append-only argv log (one invocation per line)
#   GH_FORBIDDEN=1 any invocation is a test failure (no-op case)
#   GH_API_FAIL=1  `gh api user` exits non-zero (read failure)
#   GH_SWITCH_STICKS=1  `gh auth switch --user X` rewrites $D/login to X
# ---------------------------------------------------------------------------
make_env() {
  D="$(mktemp -d 2>/dev/null || mktemp -d -t ghpf)"
  TMPFILES="$TMPFILES $D"
  mkdir -p "$D/bin"
  cat > "$D/bin/gh" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$D/argv"
if [ "${GH_FORBIDDEN:-0}" = "1" ]; then
  echo "STUB gh forbidden but invoked: $*" >&2
  exit 99
fi
case "$1 $2" in
  "api user")
    [ "${GH_API_FAIL:-0}" = "1" ] && exit 4
    cat "$D/login" 2>/dev/null
    ;;
  "auth switch")
    _user=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --user) _user="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    [ "${GH_SWITCH_STICKS:-0}" = "1" ] && printf '%s' "$_user" > "$D/login"
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

# run <expected-account> ... env prefix set by caller via `D=... GH_...=...`
# Echoes exit code to stdout; stderr captured separately by callers as needed.

# ---------------------------------------------------------------------------
# Case 1: empty arg -> exit 0, gh NEVER invoked.
# Break trace: drop the `[ -n "$expected" ] || exit 0` short-circuit -> gh
# (forbidden) gets called -> exit 99->2 and argv non-empty -> both asserts flip.
# ---------------------------------------------------------------------------
D="$(make_env)"
rc=0
D="$D" GH_FORBIDDEN=1 PATH="$D/bin:$PATH" bash "$SCRIPT" "" >/dev/null 2>&1 || rc=$?
if [ "$rc" = "0" ] && [ ! -s "$D/argv" ]; then
  pass "empty arg -> exit 0, gh never invoked"
else
  fail "empty arg (expected exit 0 + empty argv, got rc=$rc argv=|$(cat "$D/argv" 2>/dev/null)|)"
fi

# ---------------------------------------------------------------------------
# Case 2: already-active match -> exit 0, no `auth switch` recorded.
# Break trace: remove the match short-circuit -> a needless switch is logged.
# ---------------------------------------------------------------------------
D="$(make_env)"
printf 'alice' > "$D/login"
rc=0
D="$D" PATH="$D/bin:$PATH" bash "$SCRIPT" "alice" >/dev/null 2>&1 || rc=$?
if [ "$rc" = "0" ] && ! grep -q 'auth switch' "$D/argv"; then
  pass "already-active match -> exit 0, no switch"
else
  fail "already-active match (expected exit 0 + no switch, got rc=$rc argv=|$(cat "$D/argv")|)"
fi

# ---------------------------------------------------------------------------
# Case 3: drift -> auth switch recorded with the exact expected user, re-verify
# succeeds -> exit 0. Break trace: drop the switch call -> login stays 'bob' ->
# re-verify mismatch -> exit 3 not 0.
# ---------------------------------------------------------------------------
D="$(make_env)"
printf 'bob' > "$D/login"
rc=0
D="$D" GH_SWITCH_STICKS=1 PATH="$D/bin:$PATH" bash "$SCRIPT" "alice" >/dev/null 2>&1 || rc=$?
if [ "$rc" = "0" ] && grep -q 'auth switch --hostname github.com --user alice' "$D/argv"; then
  pass "drift -> switch (argv recorded) + re-verify -> exit 0"
else
  fail "drift-switch (expected exit 0 + switch argv, got rc=$rc argv=|$(cat "$D/argv")|)"
fi

# ---------------------------------------------------------------------------
# Case 4: switch doesn't take -> exit 3, stderr names BOTH wanted + actual.
# Break trace: swallow the mismatch (exit 0 after switch) -> exit code flips;
# drop either login from the die message -> the grep assert flips.
# ---------------------------------------------------------------------------
D="$(make_env)"
printf 'bob' > "$D/login"        # GH_SWITCH_STICKS unset -> switch is a no-op
rc=0
err="$(D="$D" PATH="$D/bin:$PATH" bash "$SCRIPT" "alice" 2>&1 >/dev/null)" || rc=$?
if [ "$rc" = "3" ] \
   && printf '%s' "$err" | grep -q "alice" \
   && printf '%s' "$err" | grep -q "bob"; then
  pass "switch doesn't take -> exit 3, stderr names both wanted+actual"
else
  fail "fail-loud (expected exit 3 + both logins, got rc=$rc err=|$err|)"
fi

# ---------------------------------------------------------------------------
# Case 5: gh api read failure -> exit 2, NOT 3 (tooling vs mismatch boundary).
# Break trace: collapse the read-failure die into a match/mismatch verdict ->
# exit would become 0 or 3, never 2.
# ---------------------------------------------------------------------------
D="$(make_env)"
printf 'bob' > "$D/login"
rc=0
D="$D" GH_API_FAIL=1 PATH="$D/bin:$PATH" bash "$SCRIPT" "alice" >/dev/null 2>&1 || rc=$?
if [ "$rc" = "2" ]; then
  pass "gh api read failure -> exit 2 (not 1/3)"
else
  fail "read-failure (expected exit 2, got rc=$rc)"
fi

# ---------------------------------------------------------------------------
# Case 6: gh api empty login -> exit 2 (never a silent match).
# Break trace: drop the `[ -n "$_login" ]` guard -> empty == expected is false
# so it would try to switch; but the real risk is treating empty as verified —
# the guard forces exit 2.
# ---------------------------------------------------------------------------
D="$(make_env)"
: > "$D/login"                   # empty login response
rc=0
D="$D" PATH="$D/bin:$PATH" bash "$SCRIPT" "alice" >/dev/null 2>&1 || rc=$?
if [ "$rc" = "2" ]; then
  pass "gh api empty login -> exit 2"
else
  fail "empty-login (expected exit 2, got rc=$rc)"
fi

# ---------------------------------------------------------------------------
printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
