#!/usr/bin/env bash
# Doc-scan: war-setup-scout.md must describe the manifest authority tier (tier 1,
# above CI). Three assertions:
#   1. A heading containing "manifest" appears BEFORE a heading containing "ci"
#      in the "Algorithm — descending authority" section.
#   2. The ## Return source enum includes "manifest".
#   3. The frontmatter description authority chain mentions "manifest".
#
# The scout is an LLM agent — no node:test. We scan the emitted markdown text,
# mirroring the refinery-surface.test.sh and frontmatter-tools-negation-check
# pattern. Runs under macOS bash 3.2.57. cwd-independent via script-relative path.
set -eu

HERE="$(cd "$(dirname "$0")" && pwd)"
# skills/war/assets/ lives three levels below the repo root; walk up.
ROOT="$(cd "$HERE/../../.." && pwd)"

SCOUT="$ROOT/agents/war-setup-scout.md"

PASS=0
FAIL=0

pass() { echo "ok - $1"; PASS=$((PASS + 1)); }
fail() { echo "FAIL - $1" >&2; FAIL=$((FAIL + 1)); }

if [ ! -f "$SCOUT" ]; then
  fail "war-setup-scout.md not found at $SCOUT"
  echo ""
  echo "scout-manifest-surface: $PASS check(s) passed, $FAIL check(s) failed."
  exit 1
fi

# ---------------------------------------------------------------------------
# CHECK 1: A heading containing "manifest" appears BEFORE a heading
# containing "ci" in the Algorithm section.
# Strategy: find the line numbers of the first "manifest"-keyed heading and
# the first "ci"-keyed heading (case-insensitive) within the Algorithm section,
# then verify manifest_line < ci_line.
# ---------------------------------------------------------------------------
# Extract algorithm section: from the "Algorithm" heading to the next same-level
# heading (## or end of file), then find subheadings (###) containing manifest/ci.

manifest_heading_line=""
ci_heading_line=""

# Use grep with fixed strings to avoid bash glob false-matches (e.g. "explicit" contains "ci").
# Look for headings whose tier label is literally `manifest` or `ci` (backtick-quoted in the text).
manifest_heading_line="$(grep -n '^\#.*`manifest`' "$SCOUT" | head -1 | cut -d: -f1)"
ci_heading_line="$(grep -n '^\#.*`ci`' "$SCOUT" | head -1 | cut -d: -f1)"

if [ -z "$manifest_heading_line" ]; then
  fail "CHECK 1 — no heading containing 'manifest' found in $SCOUT"
elif [ -z "$ci_heading_line" ]; then
  fail "CHECK 1 — no heading containing 'ci' found in $SCOUT (cannot verify order)"
elif [ "$manifest_heading_line" -lt "$ci_heading_line" ]; then
  pass "CHECK 1 — manifest heading (line $manifest_heading_line) appears BEFORE ci heading (line $ci_heading_line) in $SCOUT"
else
  fail "CHECK 1 — manifest heading (line $manifest_heading_line) does NOT appear before ci heading (line $ci_heading_line) in $SCOUT — manifest must be tier 1 above CI"
fi

# ---------------------------------------------------------------------------
# CHECK 2: ## Return source enum includes "manifest"
# Strategy: find the ## Return section and check for the string "manifest"
# in the jsonc block or the text following it.
# ---------------------------------------------------------------------------
# Extract the ## Return section content and check for manifest in the enum line
return_section="$(awk '/^## Return/{found=1} found{print} /^## [^R]/{if(found)exit}' "$SCOUT")"

if echo "$return_section" | grep -q '"manifest"'; then
  pass "CHECK 2 — ## Return source enum includes \"manifest\" in $SCOUT"
else
  fail "CHECK 2 — ## Return source enum does NOT include \"manifest\" in $SCOUT — widen source to include manifest"
fi

# ---------------------------------------------------------------------------
# CHECK 3: frontmatter description mentions "manifest" in the authority chain
# Strategy: extract the frontmatter block (between --- delimiters) and check
# the description field contains "manifest".
# Per memory frontmatter-tools-negation-check-single-line-only: scan the full
# frontmatter block, not just the first line of description.
# ---------------------------------------------------------------------------
frontmatter="$(awk '/^---/{count++; if(count==2)exit} count==1{print}' "$SCOUT")"

if echo "$frontmatter" | grep -q 'manifest'; then
  pass "CHECK 3 — frontmatter description authority chain mentions 'manifest' in $SCOUT"
else
  fail "CHECK 3 — frontmatter description does NOT mention 'manifest' in $SCOUT — update the authority chain to include manifest"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "scout-manifest-surface: $PASS check(s) passed, $FAIL check(s) failed."
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
