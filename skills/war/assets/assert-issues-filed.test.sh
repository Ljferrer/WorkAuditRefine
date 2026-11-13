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
#  10. gh-degraded: older gh rejects `close --reason` -> flagless retry closes
#      the epic (exit 0), degradation noted on stderr, labels-first preserved
#  11. gh-degraded: the flagless retry itself fails -> die exit 2
#  12. non-flag close failure -> die exit 2, NO degraded retry attempted
#  13. second-tier close: gh rejects --reason AND --comment -> bare close, then
#      a separate `gh issue comment`, `gh-degraded` printed once per tier (2x)
#  14. second-tier comment dropped: the separate comment call fails -> exit 0
#      (epic closed), stderr logs the dropped comment
#  15. object phases: an id-keyed `phases` object reads like the array, with a
#      stderr deprecation note
#  16. node-unusable exits 2: a PATH-stubbed `node` exiting 126 -> exit 2 and
#      one stderr line naming node and PATH, never a ledger parse failure
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
#   GH_OLD_CLOSE=1  `gh issue close` with a `--reason` arg rejects it with
#                   `unknown flag: --reason` (exit 1), emulating an older gh
#                   -> the floor must degrade to a flagless close (gh-degraded).
#   GH_OLDER_CLOSE=1 `gh issue close` rejects BOTH `--reason` and `--comment`
#                   with `unknown flag: <flag>` (exit 1), emulating a still-older
#                   gh -> the floor must take the second tier: a bare close,
#                   then a separate `gh issue comment`.
#   GH_CLOSE_FAIL=1 `gh issue close` WITHOUT `--reason` (or with it, when
#                   GH_OLD_CLOSE is unset) fails with a non-flag error (exit 1)
#                   -> the floor must die (exit 2), never silently pass.
#   GH_COMMENT_FAIL=1 `gh issue comment` fails (exit 1) -> on the second tier
#                   the epic is still closed and the floor logs the dropped
#                   comment on stderr.
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
  "issue edit")
    exit 0
    ;;
  "issue close")
    # Older-gh emulation FIRST: a --reason arg is rejected before any generic
    # failure knob, so GH_OLD_CLOSE=1 + GH_CLOSE_FAIL=1 exercises "degraded
    # retry itself fails" (first attempt: unknown flag; flagless retry: fail).
    if [ "${GH_OLD_CLOSE:-0}" = "1" ]; then
      case " $* " in
        *" --reason "*)
          echo "unknown flag: --reason" >&2
          exit 1
          ;;
      esac
    fi
    # Still-older-gh emulation: GH_OLDER_CLOSE=1 rejects BOTH --reason and
    # --comment (the flag gh parses first is named, as cobra does).
    if [ "${GH_OLDER_CLOSE:-0}" = "1" ]; then
      for _a in "$@"; do
        case "$_a" in
          --reason|--comment)
            echo "unknown flag: $_a" >&2
            exit 1
            ;;
        esac
      done
    fi
    if [ "${GH_CLOSE_FAIL:-0}" = "1" ]; then
      echo "HTTP 500: server error (api.github.com)" >&2
      exit 1
    fi
    exit 0
    ;;
  "issue comment")
    if [ "${GH_COMMENT_FAIL:-0}" = "1" ]; then
      echo "HTTP 500: server error (api.github.com)" >&2
      exit 1
    fi
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
# Case 10: gh-degraded — older gh rejects `close --reason` -> the floor retries
# a FLAGLESS close (epic still closed, exit 0), notes `gh-degraded` on stderr,
# and the labels-first ordering is preserved (edit recorded before any close).
# Break trace: drop the degradation branch -> the unknown-flag failure dies
# (exit 2) and the epic never closes; drop the stderr note -> silent degrade.
# ---------------------------------------------------------------------------
D="$(make_env)"
rc=0
err="$(D="$D" GH_OLD_CLOSE=1 PATH="$D/bin:$PATH" bash "$SCRIPT" --close-epic 7 --sha abc123 --phase "phase 1" 2>&1 >/dev/null)" || rc=$?
edit_ln="$(grep -n 'issue edit 7 ' "$D/argv" | head -1 | cut -d: -f1)"
close_ln="$(grep -n 'issue close 7 ' "$D/argv" | head -1 | cut -d: -f1)"
if [ "$rc" = "0" ] \
   && grep -q 'issue close 7 --reason completed' "$D/argv" \
   && grep 'issue close 7 ' "$D/argv" | grep -v -- '--reason' | grep -q 'abc123' \
   && printf '%s' "$err" | grep -q 'gh-degraded' \
   && [ -n "$edit_ln" ] && [ -n "$close_ln" ] && [ "$edit_ln" -lt "$close_ln" ]; then
  pass "gh-degraded: old gh rejects --reason -> flagless close, exit 0, loud stderr, labels-first"
else
  fail "gh-degraded old-gh (expected 0 + flagless retry + gh-degraded stderr + edit-before-close, got rc=$rc err=|$err| argv=|$(cat "$D/argv")|)"
fi

# ---------------------------------------------------------------------------
# Case 11: gh-degraded — the flagless retry ITSELF fails -> die exit 2.
# GH_OLD_CLOSE rejects the --reason attempt, GH_CLOSE_FAIL fails the retry.
# Break trace: swallow the retry failure -> a never-closed epic exits 0.
# ---------------------------------------------------------------------------
D="$(make_env)"
rc=0
err="$(D="$D" GH_OLD_CLOSE=1 GH_CLOSE_FAIL=1 PATH="$D/bin:$PATH" bash "$SCRIPT" --close-epic 7 --sha abc123 2>&1 >/dev/null)" || rc=$?
if [ "$rc" = "2" ] && printf '%s' "$err" | grep -q 'degraded flagless retry'; then
  pass "gh-degraded: flagless retry failure -> die exit 2"
else
  fail "gh-degraded retry-fail (expected 2 + degraded-retry die, got rc=$rc err=|$err|)"
fi

# ---------------------------------------------------------------------------
# Case 12: non-flag close failure -> die exit 2, NO degraded retry attempted.
# Break trace: classify every close failure as gh-degraded -> a network error
# would trigger a pointless flagless retry instead of the immediate die.
# ---------------------------------------------------------------------------
D="$(make_env)"
rc=0
err="$(D="$D" GH_CLOSE_FAIL=1 PATH="$D/bin:$PATH" bash "$SCRIPT" --close-epic 7 --sha abc123 2>&1 >/dev/null)" || rc=$?
close_count="$(grep -c 'issue close 7 ' "$D/argv")"
if [ "$rc" = "2" ] && ! printf '%s' "$err" | grep -q 'gh-degraded' && [ "$close_count" = "1" ] \
   && printf '%s' "$err" | grep -q 'gh issue close failed for epic #7'; then
  pass "non-flag close failure -> die exit 2, single close attempt (no gh-degraded retry)"
else
  fail "close-fail (expected 2 + one close + no gh-degraded, got rc=$rc closes=$close_count err=|$err|)"
fi

# ---------------------------------------------------------------------------
# Case 13: second-tier close — gh rejects BOTH --reason and --comment. The
# floor takes tier 1 (flagless --comment close), sees `unknown flag:
# --comment`, then takes tier 2: a bare `gh issue close 7` and a separate
# `gh issue comment 7` carrying the sha. Each tier prints `gh-degraded`, so
# one close shows it twice.
# Break trace: drop the second tier -> the tier-1 retry failure dies (exit 2)
# and no bare close or comment is recorded.
# ---------------------------------------------------------------------------
D="$(make_env)"
rc=0
err="$(D="$D" GH_OLDER_CLOSE=1 PATH="$D/bin:$PATH" bash "$SCRIPT" --close-epic 7 --sha abc123 --phase "phase 1" 2>&1 >/dev/null)" || rc=$?
degraded_count="$(printf '%s\n' "$err" | grep -c 'gh-degraded')"
if [ "$rc" = "0" ] && [ "$degraded_count" = "2" ] \
   && grep -qx 'issue close 7' "$D/argv" \
   && grep 'issue comment 7 ' "$D/argv" | grep -q 'abc123'; then
  pass "second-tier close: gh rejects --reason and --comment -> bare close + separate comment, gh-degraded twice"
else
  fail "second-tier close (expected 0 + bare close + comment + 2x gh-degraded, got rc=$rc degraded=$degraded_count err=|$err| argv=|$(cat "$D/argv")|)"
fi

# ---------------------------------------------------------------------------
# Case 14: second-tier comment dropped — the separate comment call fails. The
# epic is already closed, so the floor exits 0 and logs the dropped comment.
# Break trace: die on the comment failure -> exit 2; drop the log line -> the
# comment is lost silently and the grep flips.
# ---------------------------------------------------------------------------
D="$(make_env)"
rc=0
err="$(D="$D" GH_OLDER_CLOSE=1 GH_COMMENT_FAIL=1 PATH="$D/bin:$PATH" bash "$SCRIPT" --close-epic 7 --sha abc123 2>&1 >/dev/null)" || rc=$?
if [ "$rc" = "0" ] && grep -qx 'issue close 7' "$D/argv" \
   && printf '%s' "$err" | grep -q 'comment dropped'; then
  pass "second-tier comment dropped: comment call fails -> exit 0, dropped comment logged"
else
  fail "second-tier comment dropped (expected 0 + bare close + 'comment dropped', got rc=$rc err=|$err| argv=|$(cat "$D/argv")|)"
fi

# ---------------------------------------------------------------------------
# Case 15: object phases — `phases` keyed by phase id (the legacy shape) reads
# like the array: a missing task issue still routes `issues-missing` (exit 1),
# a clean object ledger exits 0, and both print the deprecation note.
# Break trace: drop the object branch -> `(led.phases || []).find` throws on
# an object, so the parse dies exit 2 and both asserts flip.
# ---------------------------------------------------------------------------
D="$(make_env)"
printf 'OPEN\t' > "$D/issues/7"
printf 'OPEN\t' > "$D/issues/8"
L="$(write_ledger "$D" '{"phases":{"1":{"status":"running","epic_issue":7,"tasks":[{"id":"1.1","issue":8}]},"2":{"status":"pending","epic_issue":null,"tasks":[]}}}')"
rc=0
err="$(D="$D" PATH="$D/bin:$PATH" bash "$SCRIPT" assert "$L" 1 2>&1 >/dev/null)" || rc=$?
rm -f "$D/issues/8"
rc_miss=0
err_miss="$(D="$D" PATH="$D/bin:$PATH" bash "$SCRIPT" assert "$L" 1 2>&1 >/dev/null)" || rc_miss=$?
if [ "$rc" = "0" ] && printf '%s' "$err" | grep -q 'deprecated' \
   && [ "$rc_miss" = "1" ] && printf '%s' "$err_miss" | grep -q 'issues-missing'; then
  pass "object phases: id-keyed phases object reads like the array, with a deprecation note"
else
  fail "object phases (expected 0 + deprecated, then 1 + issues-missing, got rc=$rc err=|$err| rc_miss=$rc_miss err_miss=|$err_miss|)"
fi

# ---------------------------------------------------------------------------
# Case 16: node-unusable exits 2 — a PATH-stubbed `node` exits 126 (found but
# not runnable). The floor probes `node --version` before the ledger parse,
# prints ONE stderr line naming node and PATH, and exits 2 — never the
# "ledger parse failed" message.
# Break trace: drop the probe -> the `node -e` parse fails and the floor dies
# with "ledger parse failed", so the no-parse-message assert flips.
# ---------------------------------------------------------------------------
D="$(make_env)"
printf 'OPEN\t' > "$D/issues/7"
L="$(write_ledger "$D" '{"phases":[{"id":"1","status":"running","epic_issue":7,"tasks":[]}]}')"
printf '#!/bin/sh\nexit 126\n' > "$D/bin/node"
chmod +x "$D/bin/node"
rc=0
err="$(D="$D" PATH="$D/bin:$PATH" bash "$SCRIPT" assert "$L" 1 2>&1 >/dev/null)" || rc=$?
err_lines="$(printf '%s\n' "$err" | grep -c .)"
if [ "$rc" = "2" ] && [ "$err_lines" = "1" ] \
   && printf '%s' "$err" | grep -q 'node' && printf '%s' "$err" | grep -q 'PATH' \
   && ! printf '%s' "$err" | grep -q 'ledger parse failed'; then
  pass "node-unusable exits 2: PATH-stubbed node exit 126 -> one stderr line naming node and PATH"
else
  fail "node-unusable (expected 2 + one line naming node and PATH, no parse message, got rc=$rc lines=$err_lines err=|$err|)"
fi

# ---------------------------------------------------------------------------
printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
