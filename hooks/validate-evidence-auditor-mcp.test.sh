#!/usr/bin/env bash
# Tests for the WAR evidence-auditor MCP guard (hooks/validate-evidence-auditor-mcp.sh).
# Plan 2026-10-20-rea-artifact-evidence Task 2.2 (D3, D14, D18; PIN-11, PIN-15).
#
# The guard is FAIL-CLOSED on matcher `mcp__.*`:
#   - war-refiner                       : every MCP tool denied (exit 2).
#   - war-auditor / war-servitor        : only the memory query tool (the
#     hook's MEMORY_TOOL literal, exact full-name compare) under the `local`
#     fence; every other MCP tool denied (Group A, Group H).
#   - war-evidence-auditor / war-worker : the memory query tool under the
#     `local` fence (Group H), else allowed only when the tool-name suffix
#     (after the second `__`) is on the hook's REA allowlist; a server
#     registered under another prefix still matches by suffix and prints a
#     one-line canary on stdout. A member's `tool_input.output_directory` (or
#     `destination`) must sit under `/.claude/war/evidence/` with no `..`
#     segment (Group B2, the output-path check).
#   - every other agent_type (main session, non-WAR agent) : pass-through (0).
#   - a parse or infra error (jq absent, payload not JSON, no tool_name, a
#     tool_name that is not `mcp__<server>__<tool>`, one carrying a newline) : exit 2,
#     never a pass. An unexpected failure with no explicit branch folds to 2
#     through the hook's ERR trap (the `ERR trap` rows in Group E).
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
# Group A: the three non-REA roles deny every REA or foreign MCP tool, member
# or not (the auditor and servitor admit only the memory tool, Group H).
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

# Exactness of the membership match. The hook compares the whole allowlist
# line; a delimiter-free match (`*"mcp__rea__$suffix"*`) would admit
# `mcp__rea__binary`, a proper prefix of the members `mcp__rea__binary_session`
# and `mcp__rea__binary_overview`, and an unquoted suffix would let a glob
# character match any member. Each row below goes red under one of those
# mutations; the first row is a precondition that keeps the prefix row from
# going vacuous if the `binary_` members are ever renamed.
if grep -qE '^mcp__rea__binary_[a-z0-9_]+$' "$HOOK"; then
  pass "a member with the proper prefix mcp__rea__binary_ is on the hook allowlist"
else
  fail "no hook allowlist member starts with mcp__rea__binary_ (the proper-prefix row below is vacuous)"
fi
expect_deny "war-evidence-auditor proper-prefix of a member denied (no substring capture)" \
  "$(mk 'war-evidence-auditor' 'mcp__rea__binary')" "not on the REA allowlist"
expect_deny "war-evidence-auditor glob suffix denied (suffix matched literally)" \
  "$(mk 'war-evidence-auditor' 'mcp__rea__*')" "not on the REA allowlist"
expect_deny "war-evidence-auditor single-char glob suffix denied (suffix matched literally)" \
  "$(mk 'war-evidence-auditor' 'mcp__rea__binary_sessio?')" "not on the REA allowlist"

expect_allow "war-worker allowlist member allowed" \
  "$(mk 'war-worker' "$PRESENCE_TOOL")"
expect_allow "exact-shape :war-worker allowlist member allowed" \
  "$(mk 'work-audit-refine:war-worker' "$PRESENCE_TOOL")"
expect_deny "war-worker non-member denied" \
  "$(mk 'war-worker' "$NON_MEMBER")" "not on the REA allowlist"
expect_deny "exact-shape :war-worker non-member denied" \
  "$(mk 'work-audit-refine:war-worker' "$NON_MEMBER")" "not on the REA allowlist"

# ---------------------------------------------------------------------------
# Group B2: the output-path check (ruling #2402, the G2 bundle rule). After the
# allowlist membership passes, a `tool_input.output_directory` (or
# `destination`) must contain the segment `/.claude/war/evidence/` and carry no
# `..` segment, else deny; an absent key passes, and a present key must hold a
# non-empty string (`""`, null, false, an array or an object is denied; the key
# is read by presence, never by value). A tool_input that is neither absent nor
# an object is denied. war-evidence-auditor and war-worker share the rule. The
# four plan labels are the exact TAP labels.
# ---------------------------------------------------------------------------
# mk_in <agent_type> <tool_name> <tool_input-json> -> a payload with that input.
mk_in() { jq -nc --arg at "$1" --arg tn "$2" --argjson ti "$3" '{"agent_type":$at,"tool_name":$tn,"tool_input":$ti}'; }
WRITE_TOOL="mcp__rea__pull_adb_file"                  # a member that takes a caller-named output_directory
EVID_DIR="/Users/x/repo/.claude/war/evidence/plan-slug"
expect_deny "output_directory outside evidence dir denied" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" '{"output_directory":"/Users/x/repo/.claude/war-worktrees/p1"}')" "outside the run's evidence dir"
expect_deny "output_directory with .. denied" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" "{\"output_directory\":\"$EVID_DIR/../../../etc\"}")" ".. segment"
expect_allow "output_directory under evidence dir allowed" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" "{\"output_directory\":\"$EVID_DIR/bundle\"}")"
expect_allow "no output_directory key allowed" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" '{"path":"/data/app/x.apk"}')"
# A trailing `..` is a segment too; a dotted name is not.
expect_deny "output_directory with trailing .. denied" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" "{\"output_directory\":\"$EVID_DIR/..\"}")" ".. segment"
expect_allow "output_directory with a dotted name under evidence dir allowed" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" "{\"output_directory\":\"$EVID_DIR/v1..v2\"}")"
# The contract is the path segment: a bare `evidence` dir name elsewhere is denied.
expect_deny "output_directory with the bare dir name but no segment denied" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" '{"output_directory":"/Users/x/evidence/plan"}')" "outside the run's evidence dir"
# `destination` rides the same rule.
expect_deny "destination outside evidence dir denied" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" '{"destination":"/tmp/out"}')" "outside the run's evidence dir"
expect_allow "destination under evidence dir allowed" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" "{\"destination\":\"$EVID_DIR/out\"}")"
# war-worker: the same rule (G2 bundle rule).
expect_deny "war-worker output_directory outside evidence dir denied" \
  "$(mk_in 'war-worker' "$WRITE_TOOL" '{"output_directory":"/Users/x/repo/.claude/war-worktrees/p1"}')" "outside the run's evidence dir"
expect_deny "war-worker output_directory with .. denied" \
  "$(mk_in 'war-worker' "$WRITE_TOOL" "{\"output_directory\":\"$EVID_DIR/../x\"}")" ".. segment"
expect_allow "war-worker output_directory under evidence dir allowed" \
  "$(mk_in 'war-worker' "$WRITE_TOOL" "{\"output_directory\":\"$EVID_DIR/bundle\"}")"
# Order: membership first. A non-member is denied by the allowlist even with a
# clean output_directory; a member with no tool_input key at all passes.
expect_deny "non-member with an evidence-dir output_directory still denied by the allowlist" \
  "$(mk_in 'war-evidence-auditor' "$NON_MEMBER" "{\"output_directory\":\"$EVID_DIR/bundle\"}")" "not on the REA allowlist"
expect_allow "member with no tool_input key allowed" \
  "$(jq -nc --arg tn "$WRITE_TOOL" '{"agent_type":"war-evidence-auditor","tool_name":$tn}')"
# A present key is read by presence, never by value: an empty string, null,
# false or a non-string is denied (ruling #2402: when present, deny unless the
# value carries the segment). The array row embeds the segment in one element,
# which jq -r would print as JSON text; the type check denies it first.
expect_deny "output_directory empty string denied" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" '{"output_directory":""}')" "not a non-empty path string"
expect_deny "destination empty string denied" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" '{"destination":""}')" "not a non-empty path string"
expect_deny "output_directory null denied" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" '{"output_directory":null}')" "not a non-empty path string"
expect_deny "output_directory false denied" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" '{"output_directory":false}')" "not a non-empty path string"
# The array literal is assigned first: bash 3.2 mis-parses a comma between
# `\"`-escaped strings nested inside `"$(...)"` and splits the arguments.
ARRAY_OD="{\"output_directory\":[\"$EVID_DIR/a\",\"/tmp/evil\"]}"
expect_deny "output_directory non-string denied" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" "$ARRAY_OD")" "not a non-empty path string"
expect_deny "war-worker output_directory empty string denied" \
  "$(mk_in 'war-worker' "$WRITE_TOOL" '{"output_directory":""}')" "not a non-empty path string"
# A tool_input that is neither absent nor an object is an explicit deny, not an
# ERR-trap fold.
expect_deny "tool_input non-object denied (exit 2)" \
  "$(jq -nc --arg tn "$WRITE_TOOL" '{"agent_type":"war-evidence-auditor","tool_name":$tn,"tool_input":"/tmp/out"}')" "not an object"
expect_deny "tool_input array denied (exit 2)" \
  "$(mk_in 'war-evidence-auditor' "$WRITE_TOOL" "[\"$EVID_DIR/bundle\"]")" "not an object"

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
# A newline inside the name is the allowlist's line delimiter: a name that
# splices two adjacent members (binary_overview, newline, binary_session)
# matched the block as a whole before the hook's newline reject. The row
# goes red when that reject arm is deleted. jq --arg carries the newline
# byte verbatim.
expect_deny "war-evidence-auditor newline-spliced tool_name -> exit 2 (delimiter never matched)" \
  "$(mk 'war-evidence-auditor' $'mcp__rea__binary_overview\nmcp__rea__binary_session')" "carries a newline"
# The deny roles report a missing tool_name as the deny (they reach no MCP tool
# at all), still exit 2.
expect_deny "war-auditor empty tool_name -> still exit 2" \
  "$(mk 'war-auditor' '')" "reaches no MCP tool"

# ERR trap: every row above reaches an explicit infra/deny/exit-0 branch, so
# none of them trips `trap ... ERR`. The rows below force a failure with no
# explicit branch through a PATH shim, one per unguarded `$(...)` site in the
# hook: `get` (jq -r fails, jq -e still passes) and `input="$(cat)"`. Only
# the trap turns that failure into exit 2; without it `set -e` exits with the
# shim's own status (5, 3), which a PreToolUse hook does not treat as a block.
# Deleting the trap line goes red on each row. The infra line may print
# twice: `set -E` fires the trap inside the substitution subshell and the
# parent fires it again, so the assertion is a substring, not a line count.
# shim_err <shim-dir> <payload> -> stderr; shim_rc <shim-dir> <payload> -> rc.
shim_err() { printf '%s' "$2" | PATH="$1:$PATH" bash "$HOOK" 2>&1 >/dev/null || true; }
shim_rc() { _rc=0; printf '%s' "$2" | PATH="$1:$PATH" bash "$HOOK" >/dev/null 2>&1 || _rc=$?; echo "$_rc"; }
expect_trap() {
  _rc="$(shim_rc "$2" "$3")"
  _err="$(shim_err "$2" "$3")"
  _war=0; _sub=0
  case "$_err" in *WAR:*) _war=1 ;; esac
  case "$_err" in *"unexpected failure"*) _sub=1 ;; esac
  if [ "$_rc" = "2" ] && [ "$_war" = "1" ] && [ "$_sub" = "1" ]; then
    pass "$1 (exit 2, WAR: + |unexpected failure|)"
  else
    fail "$1 (expected exit 2 + WAR: + |unexpected failure|, got rc=$_rc stderr=|$_err|)"
  fi
}
REAL_JQ="$(command -v jq)"
SHIM="$(mktemp -d 2>/dev/null || mktemp -d -t evmcpshim)"
printf '#!/usr/bin/env bash\ncase "$1" in -r) exit 5 ;; esac\nexec "%s" "$@"\n' "$REAL_JQ" > "$SHIM/jq"
chmod +x "$SHIM/jq"
expect_trap "ERR trap: jq -r failure inside get folds to exit 2" \
  "$SHIM" "$(mk 'war-evidence-auditor' "$PRESENCE_TOOL")"
rm -rf "$SHIM"
SHIM="$(mktemp -d 2>/dev/null || mktemp -d -t evmcpshim)"
printf '#!/usr/bin/env bash\nexit 3\n' > "$SHIM/cat"
chmod +x "$SHIM/cat"
expect_trap "ERR trap: cat failure reading the payload folds to exit 2" \
  "$SHIM" "$(mk 'war-evidence-auditor' "$PRESENCE_TOOL")"
rm -rf "$SHIM"

# jq missing: the hook's first guard (`command -v jq ... || infra`) exits 2
# with its own message before the payload is read. A PATH holding only `cat`
# (no jq) drives that branch; the payload is built BEFORE the PATH override
# (mk needs the real jq), and the hook runs through $BASH, not a PATH lookup.
SHIM="$(mktemp -d 2>/dev/null || mktemp -d -t evmcpshim)"
ln -s "$(command -v cat)" "$SHIM/cat"
_nojq_payload="$(mk 'war-evidence-auditor' "$PRESENCE_TOOL")"
_rc=0; printf '%s' "$_nojq_payload" | PATH="$SHIM" "$BASH" "$HOOK" >/dev/null 2>&1 || _rc=$?
_err="$(printf '%s' "$_nojq_payload" | PATH="$SHIM" "$BASH" "$HOOK" 2>&1 >/dev/null || true)"
_war=0; _sub=0
case "$_err" in *WAR:*) _war=1 ;; esac
case "$_err" in *"jq is not installed"*) _sub=1 ;; esac
if [ "$_rc" = "2" ] && [ "$_war" = "1" ] && [ "$_sub" = "1" ]; then
  pass "jq missing from PATH -> exit 2 (exit 2, WAR: + |jq is not installed|)"
else
  fail "jq missing from PATH -> exit 2 (expected exit 2 + WAR: + |jq is not installed|, got rc=$_rc stderr=|$_err|)"
fi
rm -rf "$SHIM"

# Exit codes are 0/2 only: every row above asserts exactly 0 or exactly 2,
# and the `ERR trap` rows (jq, cat) are the proof that a failure with no
# explicit branch reaches 2 rather than the failing command's own status.

# ---------------------------------------------------------------------------
# Group F: the hook owns the allowlist literal; the card's `tools:` REA
# entries are set-equal to it (G4, PIN-15 extraction plus equality); the
# presence tool is a member (asserted from THIS file's literal, no doc
# extraction). Allowlist extraction contract: one full `mcp__rea__<tool>`
# name per line, nothing else on the line. The extraction reads the lines
# between `REA_ALLOWLIST='` and its closing `'` line, the same block the
# hook's membership match reads, so an entry the hook would honor can never
# be dropped by a shape filter; a separate row enforces the shape instead.
# ---------------------------------------------------------------------------
hook_block="$(awk '/^REA_ALLOWLIST=/{f=1;next} f&&/^'"'"'$/{exit} f&&NF' "$HOOK")"
hook_bad="$(printf '%s\n' "$hook_block" | grep -vE '^mcp__rea__[a-z0-9_]+$' || true)"
if [ -n "$hook_block" ] && [ -z "$hook_bad" ]; then
  pass "every REA_ALLOWLIST line is a full mcp__rea__<tool> name"
else
  fail "REA_ALLOWLIST carries an off-contract line (block empty, or lines: $hook_bad)"
fi
hook_list="$(printf '%s\n' "$hook_block" | sort)"
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
# Group H: the memory query tool (plan 2026-10-27-memory-query-mcp-tool Task
# 1.2; PIN-4, PIN-7, PIN-8, PIN-10). The hook OWNS the full tool-name literal
# on one `MEMORY_TOOL='...'` line outside the REA_ALLOWLIST block. The rows
# build their payloads from the extracted literal, so a renamed server cannot
# leave them vacuous; the shape rows pin the literal's form against the server
# registered in plugin.json. The compare is exact: a proper prefix, an
# extension, a foreign server with the same suffix, or a glob character is
# denied for every role.
#   - war-auditor / war-servitor        : the memory tool is their ONLY MCP tool.
#   - war-evidence-auditor / war-worker : the memory tool beside the REA allowlist.
#   - war-refiner                       : still denied every MCP tool.
#   - `tool_input.local`, when present, must be a non-empty string that
#     matches `*/.claude/projects/*/memory` (a trailing `/` tolerated) and
#     carries no `..` segment, else deny; an absent key passes; `repo` is
#     not fenced.
# ---------------------------------------------------------------------------
PLUGIN_JSON="$HERE/../.claude-plugin/plugin.json"
MEMORY_TOOL="$(sed -n "s/^MEMORY_TOOL='\([^']*\)'\$/\1/p" "$HOOK")"
_mt_lines="$(grep -c '^MEMORY_TOOL=' "$HOOK")"
if [ "$_mt_lines" = "1" ] && [ -n "$MEMORY_TOOL" ]; then
  pass "hook carries exactly one single-quoted MEMORY_TOOL= line ($MEMORY_TOOL)"
else
  fail "hook MEMORY_TOOL= line count $_mt_lines, extracted |$MEMORY_TOOL| (expected one single-quoted line)"
fi
case "$MEMORY_TOOL" in
  mcp__?*__memory_query) pass "MEMORY_TOOL has the mcp__<server>__memory_query shape" ;;
  *) fail "MEMORY_TOOL |$MEMORY_TOOL| is not mcp__<server>__memory_query" ;;
esac
_mt_rest="${MEMORY_TOOL#mcp__}"; _mt_server="${_mt_rest%%__*}"
_reg_server="$(jq -r '.mcpServers | keys[0] // empty' "$PLUGIN_JSON" 2>/dev/null)"
if [ -n "$_reg_server" ]; then
  case "$_mt_server" in
    *"$_reg_server"*) pass "MEMORY_TOOL server part '$_mt_server' names the registered server '$_reg_server'" ;;
    *) fail "MEMORY_TOOL server part '$_mt_server' omits the registered server '$_reg_server'" ;;
  esac
else
  fail "plugin.json registers no mcpServers entry (MEMORY_TOOL server row vacuous)"
fi
if printf '%s\n' "$hook_block" | grep -Fxq "$MEMORY_TOOL"; then
  fail "MEMORY_TOOL sits inside the REA_ALLOWLIST block (it must be its own line outside it)"
else
  pass "MEMORY_TOOL is outside the REA_ALLOWLIST block"
fi

# Allow rows: each of the four roles, bare and namespaced.
expect_allow "war-auditor memory tool allowed" \
  "$(mk 'war-auditor' "$MEMORY_TOOL")"
expect_allow "exact-shape :war-auditor memory tool allowed" \
  "$(mk 'work-audit-refine:war-auditor' "$MEMORY_TOOL")"
expect_allow "war-servitor memory tool allowed" \
  "$(mk 'war-servitor' "$MEMORY_TOOL")"
expect_allow "exact-shape :war-servitor memory tool allowed" \
  "$(mk 'work-audit-refine:war-servitor' "$MEMORY_TOOL")"
expect_allow "war-evidence-auditor memory tool allowed" \
  "$(mk 'war-evidence-auditor' "$MEMORY_TOOL")"
expect_allow "exact-shape :war-evidence-auditor memory tool allowed" \
  "$(mk 'work-audit-refine:war-evidence-auditor' "$MEMORY_TOOL")"
expect_allow "war-worker memory tool allowed" \
  "$(mk 'war-worker' "$MEMORY_TOOL")"
expect_allow "exact-shape :war-worker memory tool allowed" \
  "$(mk 'work-audit-refine:war-worker' "$MEMORY_TOOL")"
# No canary: the memory tool's server prefix is not `rea`, but the exact
# compare decides before the REA suffix path, so no canary line prints.
_out="$(stdout_of "$(mk 'war-worker' "$MEMORY_TOOL")")"
case "$_out" in
  *canary*) fail "memory tool printed the REA canary (stdout=|$_out|)" ;;
  *) pass "memory tool prints no canary line" ;;
esac

# Refiner: denied the memory tool too (PIN-7).
expect_deny "war-refiner memory tool denied" \
  "$(mk 'war-refiner' "$MEMORY_TOOL")" "reaches no MCP tool"
expect_deny "exact-shape :war-refiner memory tool denied" \
  "$(mk 'work-audit-refine:war-refiner' "$MEMORY_TOOL")" "reaches no MCP tool"

# Auditor and servitor: every OTHER MCP tool stays denied, including near
# misses of the literal. A prefix glob admits the extension, a suffix glob
# admits the foreign server, an unquoted compare admits the `*` name, and a
# substring compare admits the proper prefix.
MEMORY_TOOL_EXT="${MEMORY_TOOL}_extra"
MEMORY_TOOL_PREFIX="${MEMORY_TOOL%?}"
MEMORY_TOOL_FOREIGN="mcp__other__memory_query"
MEMORY_TOOL_GLOB="mcp__${_mt_server}__*"
expect_deny "war-auditor other mcp tool still denied" \
  "$(mk 'war-auditor' "$PRESENCE_TOOL")" "reaches no MCP tool"
expect_deny "war-servitor other mcp tool still denied" \
  "$(mk 'war-servitor' 'mcp__github__get_issue')" "reaches no MCP tool"
expect_deny "war-auditor memory tool extension denied (exact compare)" \
  "$(mk 'war-auditor' "$MEMORY_TOOL_EXT")" "reaches no MCP tool"
expect_deny "war-auditor memory tool proper prefix denied (exact compare)" \
  "$(mk 'war-auditor' "$MEMORY_TOOL_PREFIX")" "reaches no MCP tool"
expect_deny "war-auditor foreign server memory_query denied (no suffix keying)" \
  "$(mk 'war-auditor' "$MEMORY_TOOL_FOREIGN")" "reaches no MCP tool"
expect_deny "war-servitor foreign server memory_query denied (no suffix keying)" \
  "$(mk 'war-servitor' "$MEMORY_TOOL_FOREIGN")" "reaches no MCP tool"
expect_deny "war-auditor glob-char memory tool name denied (literal compare)" \
  "$(mk 'war-auditor' "$MEMORY_TOOL_GLOB")" "reaches no MCP tool"
expect_deny "war-servitor newline-spliced memory tool name denied" \
  "$(mk 'war-servitor' "$MEMORY_TOOL"$'\n'"$MEMORY_TOOL")" "reaches no MCP tool"

# Evidence auditor and worker: REA still allowed beside the memory tool
# (PIN-10), and a near miss of the memory literal falls to the REA allowlist
# deny, never through.
expect_allow "war-evidence-auditor REA member still allowed beside the memory tool" \
  "$(mk 'war-evidence-auditor' "$PRESENCE_TOOL")"
expect_allow "war-worker REA member still allowed beside the memory tool" \
  "$(mk 'war-worker' "$PRESENCE_TOOL")"
expect_deny "war-evidence-auditor foreign server memory_query denied (no suffix keying)" \
  "$(mk 'war-evidence-auditor' "$MEMORY_TOOL_FOREIGN")" "not on the REA allowlist"
expect_deny "war-worker memory tool extension denied (exact compare)" \
  "$(mk 'war-worker' "$MEMORY_TOOL_EXT")" "not on the REA allowlist"
expect_deny "war-worker memory tool proper prefix denied (exact compare)" \
  "$(mk 'war-worker' "$MEMORY_TOOL_PREFIX")" "not on the REA allowlist"

# `local` fence (PIN-4). The value itself must match the memory-root glob: a
# path beneath the memory dir is denied too, because the server appends the
# query log into `local` itself.
MEM_ROOT="/Users/x/.claude/projects/-Users-x-repo/memory"
# mk_local <agent_type> <local> -> a memory-tool payload whose tool_input.local
# is that string (jq --arg: bytes verbatim; no `\"`-escaped comma inside
# `"$(...)"`, which bash 3.2 mis-parses).
mk_local() { jq -nc --arg at "$1" --arg tn "$MEMORY_TOOL" --arg l "$2" '{"agent_type":$at,"tool_name":$tn,"tool_input":{"query":"q","local":$l}}'; }
expect_allow "memory tool local under a memory root allowed" \
  "$(mk_local 'war-auditor' "$MEM_ROOT")"
expect_allow "memory tool local with trailing slash allowed" \
  "$(mk_local 'war-servitor' "$MEM_ROOT/")"
expect_allow "memory tool local absent allowed" \
  "$(mk_in 'war-auditor' "$MEMORY_TOOL" '{"query":"q","repo":"/Users/x/repo/docs/learnings"}')"
expect_allow "memory tool with no tool_input key allowed" \
  "$(jq -nc --arg tn "$MEMORY_TOOL" '{"agent_type":"war-servitor","tool_name":$tn}')"
expect_allow "memory tool repo outside the memory root allowed (only local is fenced)" \
  "$(mk_in 'war-worker' "$MEMORY_TOOL" '{"query":"q","repo":"/tmp/anywhere"}')"
expect_deny "memory tool local outside the memory root denied" \
  "$(mk_local 'war-auditor' "/Users/x/repo/docs/learnings")" "outside"
expect_deny "memory tool local beneath the memory root denied" \
  "$(mk_local 'war-auditor' "$MEM_ROOT/archive")" "outside"
expect_deny "memory tool local with the bare dir name but no projects segment denied" \
  "$(mk_local 'war-auditor' "/Users/x/memory")" "outside"
expect_deny "memory tool relative local denied" \
  "$(mk_local 'war-auditor' ".claude/projects/s/memory")" "outside"
# A `..` inside the matching glob span is still a segment: the row goes red
# when the `..` arm is deleted, because the glob alone admits it.
expect_deny "memory tool local with .. denied" \
  "$(mk_local 'war-auditor' "/Users/x/.claude/projects/../projects/s/memory")" ".. segment"
expect_deny "memory tool local with trailing .. denied" \
  "$(mk_local 'war-servitor' "$MEM_ROOT/..")" ".. segment"
expect_deny "memory tool local empty string denied" \
  "$(mk_local 'war-auditor' "")" "not a non-empty path string"
expect_deny "memory tool local null denied" \
  "$(mk_in 'war-auditor' "$MEMORY_TOOL" '{"query":"q","local":null}')" "not a non-empty path string"
ARRAY_LOCAL="{\"query\":\"q\",\"local\":[\"$MEM_ROOT\",\"/tmp/evil\"]}"
expect_deny "memory tool local non-string denied" \
  "$(mk_in 'war-auditor' "$MEMORY_TOOL" "$ARRAY_LOCAL")" "not a non-empty path string"
expect_deny "memory tool tool_input non-object denied" \
  "$(jq -nc --arg tn "$MEMORY_TOOL" '{"agent_type":"war-auditor","tool_name":$tn,"tool_input":"q"}')" "not an object"
# The fence binds every admitted role, not only the auditor.
expect_deny "war-worker memory tool local outside the memory root denied" \
  "$(mk_local 'war-worker' "/Users/x/repo/.claude/war-worktrees/p1")" "outside"
expect_deny "war-evidence-auditor memory tool local with .. denied" \
  "$(mk_local 'war-evidence-auditor' "$MEM_ROOT/../x/memory")" ".. segment"
expect_deny "war-servitor memory tool local outside the memory root denied" \
  "$(mk_local 'war-servitor' "/tmp/memory")" "outside"

# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "validate-evidence-auditor-mcp.test.sh: PASS"
