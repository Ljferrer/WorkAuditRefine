#!/usr/bin/env bash
# Tests for the WAR servitor provenance gate (hooks/validate-servitor-provenance.sh).
# Plain-bash assertion runner: pipes crafted PreToolUse payloads into the hook
# and asserts the exit code. No bats, no package.json — runs under macOS bash
# 3.2.57 (no globstar, no associative arrays, no ${,,}).
#
# Exit 0 (this script) = all cases passed; non-zero = at least one failed.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
HOOK="$HERE/validate-servitor-provenance.sh"

fails=0
n=0

# run <payload-json> -> echoes the hook's exit code
run() { printf '%s' "$1" | bash "$HOOK" >/dev/null 2>&1; echo $?; }

# expect <description> <expected-code> <actual-code>
expect() {
  n=$((n + 1))
  if [ "$2" = "$3" ]; then
    printf 'ok %d - %s (exit %s)\n' "$n" "$1" "$3"
  else
    printf 'FAIL %d - %s (expected %s, got %s)\n' "$n" "$1" "$2" "$3"
    fails=$((fails + 1))
  fi
}

# ---------------------------------------------------------------------------
# Payload builders — use jq -nc --arg to avoid printf double-quote escaping
# making tests vacuous (printf-json-escaping-vacuous-test-case).
# All content uses the REAL nested metadata: -> provenance: shape.
# ---------------------------------------------------------------------------

# A fact file path under the servitor's memory target.
FACT_PATH="/home/user/.claude/projects/myproj/memory/topic-slug.md"

# mk_write <agent_type> <file_path> <content>
# Build a Write PreToolUse payload.
mk_write() {
  jq -nc --arg at "$1" --arg fp "$2" --arg ct "$3" \
    '{"tool_name":"Write","agent_type":$at,"tool_input":{"file_path":$fp,"content":$ct}}'
}

# mk_edit <agent_type> <file_path>
# Build an Edit PreToolUse payload (no content field — old_string/new_string only).
mk_edit() {
  jq -nc --arg at "$1" --arg fp "$2" \
    '{"tool_name":"Edit","agent_type":$at,"tool_input":{"file_path":$fp,"old_string":"old","new_string":"new"}}'
}

# ---------------------------------------------------------------------------
# Content helpers — nested metadata.provenance shape.
# Use printf '%s\n' with per-line args (macOS bash 3.2: printf '---\n...'
# triggers "invalid option" because --- starts with --).
# ---------------------------------------------------------------------------

# Content with a valid nested metadata.provenance tier
content_with_tier() {
  printf '%s\n' "---" "title: some fact" "metadata:" "  type: learning" "  provenance: $1" "---" "" "# Body"
}

# Same, but the metadata children are indented 4 spaces (indent-agnostic extractor).
content_with_tier_4space() {
  printf '%s\n' "---" "title: some fact" "metadata:" "    type: learning" "    provenance: $1" "---" "" "# Body"
}

# Same, but the metadata children are tab-indented. Build the tab via printf '\t'
# (NOT a literal tab an editor may silently convert to spaces).
content_with_tier_tab() {
  local tab; tab="$(printf '\t')"
  printf '%s\n' "---" "title: some fact" "metadata:" "${tab}type: learning" "${tab}provenance: $1" "---" "" "# Body"
}

# Content with NO metadata block at all (tag-less write)
content_no_metadata() {
  printf '%s\n' "---" "title: some fact" "---" "" "# Body"
}

# Content with metadata block but NO provenance key
content_no_provenance() {
  printf '%s\n' "---" "title: some fact" "metadata:" "  type: learning" "---" "" "# Body"
}

# Content with a bad (invalid) provenance tier
content_bad_tier() {
  printf '%s\n' "---" "title: some fact" "metadata:" "  type: learning" "  provenance: agent-observed" "---" "" "# Body"
}

# ---------------------------------------------------------------------------
# Case 1: missing nested metadata.provenance -> DENY, exact exit code 2
# (floor-script-exit-codes-1-vs-2-route-differently: assert == 2, not just != 0)
# ---------------------------------------------------------------------------
expect "missing metadata.provenance (no metadata block) -> deny exit 2" \
  2 "$(run "$(mk_write 'war-servitor' "$FACT_PATH" "$(content_no_metadata)")")"

# Case 1b: metadata block present but provenance key absent -> DENY exit 2
expect "metadata block present but provenance absent -> deny exit 2" \
  2 "$(run "$(mk_write 'war-servitor' "$FACT_PATH" "$(content_no_provenance)")")"

# ---------------------------------------------------------------------------
# Case 2: valid tier -> allow (exit 0)
# ---------------------------------------------------------------------------
expect "agent-unverified tier -> allow" \
  0 "$(run "$(mk_write 'war-servitor' "$FACT_PATH" "$(content_with_tier 'agent-unverified')")")"

expect "code-verified tier -> allow" \
  0 "$(run "$(mk_write 'war-servitor' "$FACT_PATH" "$(content_with_tier 'code-verified')")")"

expect "user-confirmed tier -> allow" \
  0 "$(run "$(mk_write 'war-servitor' "$FACT_PATH" "$(content_with_tier 'user-confirmed')")")"

# Indent-agnostic extractor (#247): 4-space and tab-indented metadata children
# must ACCEPT identically to the 2-space case.
expect "4-space metadata.provenance -> allow" \
  0 "$(run "$(mk_write 'war-servitor' "$FACT_PATH" "$(content_with_tier_4space 'code-verified')")")"

expect "tab-indented metadata.provenance -> allow" \
  0 "$(run "$(mk_write 'war-servitor' "$FACT_PATH" "$(content_with_tier_tab 'code-verified')")")"

# ---------------------------------------------------------------------------
# Case 3: bad tier (not in the valid set) -> DENY exit 2
# ---------------------------------------------------------------------------
expect "bad tier (agent-observed) -> deny exit 2" \
  2 "$(run "$(mk_write 'war-servitor' "$FACT_PATH" "$(content_bad_tier)")")"

# ---------------------------------------------------------------------------
# Case 4: MEMORY.md exact basename -> allow (index file is exempt)
# The hook must check exact basename == MEMORY.md, not a substring.
# ---------------------------------------------------------------------------
MEMORY_PATH="/home/user/.claude/projects/myproj/memory/MEMORY.md"
expect "MEMORY.md exact basename -> allow" \
  0 "$(run "$(mk_write 'war-servitor' "$MEMORY_PATH" "$(content_no_metadata)")")"

# Confirm MEMORY.md.bak is NOT exempted (exact-basename, not a substring)
MEMORY_BAK_PATH="/home/user/.claude/projects/myproj/memory/MEMORY.md.bak"
expect "MEMORY.md.bak not exempt (exact basename check)" \
  2 "$(run "$(mk_write 'war-servitor' "$MEMORY_BAK_PATH" "$(content_no_metadata)")")"

# ---------------------------------------------------------------------------
# Case 5: tool_name == Edit of a fact file -> pass-through (allow)
# Edit payloads carry old_string/new_string, NOT tool_input.content.
# The hook short-circuits allow on non-Write tool_name.
# ---------------------------------------------------------------------------
expect "tool_name:Edit of fact file -> pass-through allow" \
  0 "$(run "$(mk_edit 'war-servitor' "$FACT_PATH")")"

# ---------------------------------------------------------------------------
# Case 6: non-war-servitor agent_type -> pass-through (allow)
# ---------------------------------------------------------------------------
expect "non-servitor agent (war-worker) -> pass-through" \
  0 "$(run "$(mk_write 'war-worker' "$FACT_PATH" "$(content_no_metadata)")")"

expect "non-servitor agent (war-refiner) -> pass-through" \
  0 "$(run "$(mk_write 'war-refiner' "$FACT_PATH" "$(content_no_metadata)")")"

expect "no agent_type -> pass-through" \
  0 "$(run "$(jq -nc --arg fp "$FACT_PATH" --arg ct "$(content_no_metadata)" \
    '{"tool_name":"Write","tool_input":{"file_path":$fp,"content":$ct}}')")"

# ---------------------------------------------------------------------------
# Case 7: no file_path -> allow
# ---------------------------------------------------------------------------
expect "no file_path -> allow" \
  0 "$(run "$(jq -nc --arg at 'war-servitor' --arg ct "$(content_no_metadata)" \
    '{"tool_name":"Write","agent_type":$at,"tool_input":{"content":$ct}}')")"

# ---------------------------------------------------------------------------
# Case 8: path outside memory/learnings target -> pass-through (not in scope)
# The scope hook handles this; this hook allows writes outside the target.
# ---------------------------------------------------------------------------
OUTSIDE_PATH="/home/user/src/whatever.md"
expect "path outside memory target -> allow (scope hook handles)" \
  0 "$(run "$(mk_write 'war-servitor' "$OUTSIDE_PATH" "$(content_no_metadata)")")"

# ---------------------------------------------------------------------------
printf '\n%d/%d cases passed\n' "$((n - fails))" "$n"
[ "$fails" -eq 0 ] || { printf '%d FAILED\n' "$fails"; exit 1; }
echo "validate-servitor-provenance.test.sh: PASS"
