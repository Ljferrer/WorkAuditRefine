#!/usr/bin/env bash
# Tests for the WAR evidence-auditor MCP guard (hooks/validate-evidence-auditor-mcp.sh).
# Plan 2026-10-20-rea-artifact-evidence Task 2.2 (D3, D14, D18; PIN-11, PIN-15).
#
# The guard is FAIL-CLOSED on matcher `mcp__.*`:
#   - war-auditor / war-servitor / war-refiner : every MCP tool denied (exit 2).
#   - war-evidence-auditor / war-worker        : allowed only when the tool-name
#     suffix (after the second `__`) is on the hook's REA allowlist; a server
#     registered under another prefix still matches by suffix and prints a
#     one-line canary on stdout.
#   - every other agent_type (main session, non-WAR agent) : pass-through (0).
#   - a parse or infra error (payload not JSON, no tool_name, a tool_name that
#     is not `mcp__<server>__<tool>`) : exit 2, never a pass.
#
# ASSERTION DESIGN: deny cases assert exit 2 AND a `WAR:` marker AND the
# rule's own substring on stderr, never exit != 0 alone (a crashed hook also
# exits non-zero). Allow cases assert exit 0 exactly.
#
# SEARCH-ROOT CONVENTION (guard-conventions.test.sh lint 2): every grep below
# names its file (the hook, the card, hooks.json); no `find`, no `grep -r`.
#
# Plain-bash assertion runner. No bats, no package.json. Runs under macOS bash
# 3.2.57 (no globstar, no associative arrays, no ${,,}). cwd-independent.
# Exit 0 = all cases passed; non-zero = at least one failed.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
HOOK="$HERE/validate-evidence-auditor-mcp.sh"
CARD="$HERE/../agents/war-evidence-auditor.md"
HJSON="$HERE/hooks.json"

fails=0
n=0

pass() { n=$((n + 1)); printf 'ok %d - %s\n' "$n" "$1"; }
fail() { n=$((n + 1)); fails=$((fails + 1)); printf 'FAIL %d - %s\n' "$n" "$1"; }

# rc_of <payload> -> exit code
rc_of() {
  _rc=0
  printf '%s' "$1" | bash "$HOOK" >/dev/null 2>&1 || _rc=$?
  echo "$_rc"
}
# stderr_of <payload> -> stderr text (exit code ignored)
stderr_of() { printf '%s' "$1" | bash "$HOOK" 2>&1 >/dev/null || true; }
# stdout_of <payload> -> stdout text (exit code ignored)
stdout_of() { printf '%s' "$1" | bash "$HOOK" 2>/dev/null || true; }

# mk <agent_type> <tool_name> -> a PreToolUse payload (jq --arg: bytes verbatim,
# never printf-escaped — printf-json-escaping-vacuous-test-case).
mk() { jq -nc --arg at "$1" --arg tn "$2" '{"agent_type":$at,"tool_name":$tn,"tool_input":{}}'; }

# expect_allow <desc> <payload>: exit 0 exactly.
expect_allow() {
  _rc="$(rc_of "$2")"
  if [ "$_rc" = "0" ]; then pass "$1 (exit 0)"; else fail "$1 (expected exit 0, got $_rc)"; fi
}

# expect_deny <desc> <payload> <substr>: exit 2 AND `WAR:` AND <substr> on stderr.
expect_deny() {
  _rc="$(rc_of "$2")"
  _err="$(stderr_of "$2")"
  _war=0; _sub=0
  case "$_err" in *WAR:*) _war=1 ;; esac
  case "$_err" in *"$3"*) _sub=1 ;; esac
  if [ "$_rc" = "2" ] && [ "$_war" = "1" ] && [ "$_sub" = "1" ]; then
    pass "$1 (exit 2, WAR: deny + |$3|)"
  else
    fail "$1 (expected exit 2 + WAR: + |$3|, got rc=$_rc stderr=|$_err|)"
  fi
}

PRESENCE_TOOL="mcp__rea__binary_session"            # a known allowlist member
NON_MEMBER="mcp__rea__gdb_console"                   # fails the G4 predicate; never on the card
NON_MEMBER_DEVICE="mcp__rea__install_adb_package"    # mutatesDevice; never on the card
OTHER_SERVER_MEMBER="mcp__rea-local__binary_session" # another server prefix, same suffix
OTHER_SERVER_NON="mcp__rea-local__gdb_console"

# ---------------------------------------------------------------------------
# Group A: the three MCP-less roles deny EVERY MCP tool, member or not.
# The labels `war-auditor mcp tool denied` / `war-servitor mcp tool denied` /
# `war-refiner mcp tool denied` are the plan's exact TAP labels.
# ---------------------------------------------------------------------------
expect_deny "war-auditor mcp tool denied" \
  "$(mk 'war-auditor' "$PRESENCE_TOOL")" "reaches no MCP tool"
expect_deny "war-servitor mcp tool denied" \
  "$(mk 'war-servitor' "$PRESENCE_TOOL")" "reaches no MCP tool"
expect_deny "war-refiner mcp tool denied" \
  "$(mk 'war-refiner' "$PRESENCE_TOOL")" "reaches no MCP tool"

# Exact dispatched shapes (namespaced) still hit the deny arms: deny-side
# under-capture would fail-open a read-only seat.
expect_deny "exact-shape :war-auditor mcp tool denied" \
  "$(mk 'work-audit-refine:war-auditor' "$PRESENCE_TOOL")" "reaches no MCP tool"
expect_deny "exact-shape :war-servitor mcp tool denied" \
  "$(mk 'work-audit-refine:war-servitor' "$PRESENCE_TOOL")" "reaches no MCP tool"
expect_deny "exact-shape :war-refiner mcp tool denied" \
  "$(mk 'work-audit-refine:war-refiner' "$PRESENCE_TOOL")" "reaches no MCP tool"

# A non-REA MCP tool is denied for these roles too (the deny is every MCP tool,
# not just REA).
expect_deny "war-auditor non-rea mcp tool denied" \
  "$(mk 'war-auditor' 'mcp__github__get_issue')" "reaches no MCP tool"

# ---------------------------------------------------------------------------
# Group B: war-evidence-auditor and war-worker — allowlist only.
# ---------------------------------------------------------------------------
expect_allow "war-evidence-auditor allowlist member allowed" \
  "$(mk 'war-evidence-auditor' "$PRESENCE_TOOL")"
expect_allow "exact-shape :war-evidence-auditor allowlist member allowed" \
  "$(mk 'work-audit-refine:war-evidence-auditor' "$PRESENCE_TOOL")"
expect_deny "war-evidence-auditor non-member denied" \
  "$(mk 'war-evidence-auditor' "$NON_MEMBER")" "not on the REA allowlist"
expect_deny "exact-shape :war-evidence-auditor non-member denied" \
  "$(mk 'work-audit-refine:war-evidence-auditor' "$NON_MEMBER_DEVICE")" "not on the REA allowlist"
expect_deny "war-evidence-auditor non-rea mcp tool denied" \
  "$(mk 'war-evidence-auditor' 'mcp__github__get_issue')" "not on the REA allowlist"

expect_allow "war-worker allowlist member allowed" \
  "$(mk 'war-worker' "$PRESENCE_TOOL")"
expect_allow "exact-shape :war-worker allowlist member allowed" \
  "$(mk 'work-audit-refine:war-worker' "$PRESENCE_TOOL")"
expect_deny "war-worker non-member denied" \
  "$(mk 'war-worker' "$NON_MEMBER")" "not on the REA allowlist"
expect_deny "exact-shape :war-worker non-member denied" \
  "$(mk 'work-audit-refine:war-worker' "$NON_MEMBER")" "not on the REA allowlist"

# ---------------------------------------------------------------------------
# Group C: suffix keying + the live-name canary. A server registered under
# another prefix still matches by the suffix after the second `__`; the hook
# prints ONE canary line (stdout) naming the foreign prefix. No canary for
# the `rea` prefix. The suffix never widens: a non-member stays denied under
# a foreign prefix too.
# ---------------------------------------------------------------------------
expect_allow "foreign server prefix, member suffix -> allowed (suffix keyed)" \
  "$(mk 'war-evidence-auditor' "$OTHER_SERVER_MEMBER")"
_out="$(stdout_of "$(mk 'war-evidence-auditor' "$OTHER_SERVER_MEMBER")")"
case "$_out" in
  *canary*) pass "foreign server prefix prints the canary line" ;;
  *) fail "foreign server prefix printed no canary line (stdout=|$_out|)" ;;
esac
_lines="$(printf '%s\n' "$_out" | grep -c 'canary')"
if [ "$_lines" = "1" ]; then pass "canary is exactly one line"; else fail "canary line count $_lines, expected 1"; fi
case "$_out" in
  *"rea-local"*) pass "canary names the foreign server prefix" ;;
  *) fail "canary omits the foreign server prefix (stdout=|$_out|)" ;;
esac
_out="$(stdout_of "$(mk 'war-evidence-auditor' "$PRESENCE_TOOL")")"
case "$_out" in
  *canary*) fail "rea prefix printed a canary (stdout=|$_out|)" ;;
  *) pass "rea prefix prints no canary" ;;
esac
expect_deny "foreign server prefix, non-member suffix -> denied" \
  "$(mk 'war-evidence-auditor' "$OTHER_SERVER_NON")" "not on the REA allowlist"
expect_allow "war-worker foreign server prefix, member suffix -> allowed" \
  "$(mk 'war-worker' "$OTHER_SERVER_MEMBER")"

# ---------------------------------------------------------------------------
# Group D: pass-through for every other agent_type, and suffix-anchored arms.
# ---------------------------------------------------------------------------
expect_allow "main session (no agent_type) pass-through" \
  "$(jq -nc --arg tn "$NON_MEMBER" '{"tool_name":$tn,"tool_input":{}}')"
expect_allow "unknown agent_type pass-through" \
  "$(mk 'some-other-agent' "$NON_MEMBER")"
expect_allow "empty agent_type pass-through" \
  "$(mk '' "$NON_MEMBER")"
# Trailing-junk decorations fall through to pass-through: the arms are
# suffix-anchored (`*war-<role>`, never `*war-<role>*`). Delete-the-feature:
# a trailing-star arm flips each of these to deny.
expect_allow "trailing-junk :war-auditor-helper falls to pass-through" \
  "$(mk 'work-audit-refine:war-auditor-helper' "$NON_MEMBER")"
expect_allow "trailing-junk :war-evidence-auditor-helper falls to pass-through" \
  "$(mk 'work-audit-refine:war-evidence-auditor-helper' "$NON_MEMBER")"
expect_allow "trailing-junk :war-worker-helper falls to pass-through" \
  "$(mk 'work-audit-refine:war-worker-helper' "$NON_MEMBER")"

# ---------------------------------------------------------------------------
# Group E: parse / infra errors exit 2, never 0 — fail-closed. Each row asserts
# the WAR: marker and the diagnosis, so a crash cannot pass as the deny.
# ---------------------------------------------------------------------------
expect_deny "payload not JSON -> exit 2 (infra)" \
  '{not json' "not JSON"
expect_deny "war-evidence-auditor empty tool_name -> exit 2" \
  "$(mk 'war-evidence-auditor' '')" "no tool_name"
expect_deny "war-evidence-auditor missing tool_name key -> exit 2" \
  "$(jq -nc '{"agent_type":"war-evidence-auditor","tool_input":{}}')" "no tool_name"
expect_deny "war-evidence-auditor non-mcp tool_name shape -> exit 2" \
  "$(mk 'war-evidence-auditor' 'binary_session')" "not an mcp__<server>__<tool> name"
expect_deny "war-evidence-auditor one-underscore-pair tool_name -> exit 2" \
  "$(mk 'war-evidence-auditor' 'mcp__rea')" "not an mcp__<server>__<tool> name"
expect_deny "war-evidence-auditor empty suffix -> exit 2" \
  "$(mk 'war-evidence-auditor' 'mcp__rea__')" "not an mcp__<server>__<tool> name"
expect_deny "war-worker empty server prefix -> exit 2" \
  "$(mk 'war-worker' 'mcp____binary_session')" "not an mcp__<server>__<tool> name"
# The deny roles report a missing tool_name as the deny (they reach no MCP tool
# at all), still exit 2.
expect_deny "war-auditor empty tool_name -> still exit 2" \
  "$(mk 'war-auditor' '')" "reaches no MCP tool"

# Exit codes are 0/2 only: every exit above was asserted as exactly 0 or
# exactly 2, so a `set -e` trip (1) or a SIGPIPE (141) would already have
# failed a row.

# ---------------------------------------------------------------------------
# Group F: the hook owns the allowlist literal; the card's `tools:` REA
# entries are set-equal to it (G4, PIN-15 extraction plus equality); the
# presence tool is a member (asserted from THIS file's literal, no doc
# extraction). Allowlist extraction contract: one full `mcp__rea__<tool>`
# name per line, nothing else on the line.
# ---------------------------------------------------------------------------
hook_list="$(grep -E '^mcp__rea__[a-z0-9_]+$' "$HOOK" | sort)"
card_list="$(grep '^tools: ' "$CARD" | sed 's/^tools: //' | tr ',' '\n' | sed 's/^ *//; s/ *$//' | grep '^mcp__rea__' | sort)"
hook_count="$(printf '%s\n' "$hook_list" | grep -c '^mcp__rea__')"
card_count="$(printf '%s\n' "$card_list" | grep -c '^mcp__rea__')"
if [ "$hook_count" -gt 0 ] && [ "$card_count" -gt 0 ] && [ "$hook_list" = "$card_list" ]; then
  pass "card allowlist set-equal to hook ($hook_count entries)"
else
  fail "card allowlist set-equal to hook (hook=$hook_count card=$card_count)"
  printf '%s\n' "$hook_list" > "${TMPDIR:-/tmp}/evmcp-hook.$$"
  printf '%s\n' "$card_list" > "${TMPDIR:-/tmp}/evmcp-card.$$"
  diff "${TMPDIR:-/tmp}/evmcp-hook.$$" "${TMPDIR:-/tmp}/evmcp-card.$$" >&2 || true
  rm -f "${TMPDIR:-/tmp}/evmcp-hook.$$" "${TMPDIR:-/tmp}/evmcp-card.$$"
fi
hook_dups="$(printf '%s\n' "$hook_list" | uniq -d)"
if [ -z "$hook_dups" ]; then pass "hook allowlist has no duplicate entry"; else fail "hook allowlist duplicates: $hook_dups"; fi

if printf '%s\n' "$hook_list" | grep -Fxq 'mcp__rea__binary_session'; then
  pass "presence tool is an allowlist member"
else
  fail "presence tool is an allowlist member (mcp__rea__binary_session absent from the hook allowlist)"
fi
# The literal above is the test's own text; a non-member literal proves the
# membership grep discriminates (delete-the-feature for the row above).
if printf '%s\n' "$hook_list" | grep -Fxq "$NON_MEMBER"; then
  fail "non-member $NON_MEMBER is on the hook allowlist (predicate breach)"
else
  pass "non-member $NON_MEMBER is absent from the hook allowlist"
fi

# ---------------------------------------------------------------------------
# Group G: registration — hooks.json carries a PreToolUse entry with matcher
# `mcp__.*` pointing at the hook; the hook is executable (hooks.json invokes
# it directly). Every agent-type arm in the hook is suffix-anchored.
# ---------------------------------------------------------------------------
if jq -e . "$HJSON" >/dev/null 2>&1; then pass "hooks.json parses"; else fail "hooks.json does not parse"; fi
_reg="$(jq -r '.hooks.PreToolUse[] | select(.matcher == "mcp__.*") | .hooks[].command' "$HJSON" 2>/dev/null)"
case "$_reg" in
  *validate-evidence-auditor-mcp.sh*) pass "hooks.json PreToolUse(mcp__.*) -> validate-evidence-auditor-mcp.sh" ;;
  *) fail "hooks.json has no PreToolUse matcher mcp__.* entry for validate-evidence-auditor-mcp.sh (got |$_reg|)" ;;
esac
if [ -x "$HOOK" ]; then pass "hook is executable"; else fail "hook is not executable"; fi
if grep -qE '\*war-[a-z-]*\*' "$HOOK"; then
  fail "hook carries a trailing-star agent-type arm"
else
  pass "hook agent-type arms are suffix-anchored (no trailing star)"
fi

# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "validate-evidence-auditor-mcp.test.sh: PASS"
