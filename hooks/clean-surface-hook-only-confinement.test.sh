#!/usr/bin/env bash
# Clean-surface guard (F01 D2/D3): no live-surface site may claim the
# worktree-scope hook ALONE confines the servitor.
#
# Background: post-F01 (T1), the servitor holds NO Bash — its confinement is
# the CAPABILITY ALLOWLIST (the harness cannot grant a tool not listed).  The
# PreToolUse scope hook then gates the residual Write/Edit paths.  Attributing
# confinement to "the hook alone" or "the hook confines you" (without mentioning
# the allowlist) overstates what the hook does and understates the real primary
# mechanism.
#
# What this test rejects:
#   - "the worktree-scope hook confines you"
#   - "physically confines your writes"
#   - "hook confines it" / "hook confines the servitor"
# … applied to the SERVITOR on the live surface (skills/ agents/ hooks/ README
# docs/adr/) — excluding *.test.* files (those may contain the forbidden
# patterns as absence-asserted comments; exclusion is LOAD-BEARING).
#
# The matching patterns are conservative globs — they target the exact overstated
# phrasings found on the live surface at the time the test was written, so the
# test is a precise signal, not a broad keyword blacklist.
#
# Runs under macOS bash 3.2.57.  Resolves the repo root from its own location so
# it is cwd-independent.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
cd "$ROOT" || { echo "FAIL - could not cd to repo root '$ROOT'" >&2; exit 1; }

ok=0
fail=0

check() {
  local desc="$1" pattern="$2" hits
  hits="$(grep -rn "$pattern" skills/ agents/ hooks/ README.md docs/adr/ 2>/dev/null \
          | grep -vE '\.test\.')"
  if [ -z "$hits" ]; then
    echo "ok - $desc"
    ok=$((ok + 1))
  else
    echo "FAIL - $desc" >&2
    printf '%s\n' "$hits" >&2
    fail=$((fail + 1))
  fi
}

# Pattern 1: the exact Wrap-up prompt phrase from workflow-template.js:421
check \
  "workflow-template.js Wrap-up prompt: 'worktree-scope hook confines you' absent from live surface" \
  "worktree-scope hook confines you"

# Pattern 2: 'physically confines' applied to servitor writes
check \
  "war-servitor.md: 'physically confines your writes' absent from live surface" \
  "physically confines"

# Pattern 3: 'hook confines it' / 'hook confines the servitor' absent from ServitorResult prose
# (schemas.md ServitorResult section used the exact phrasing "hook keys on its agent_type and confines it")
# The test targets the hook-alone framing: hook doing the confining WITHOUT mentioning allowlist.
# We match "confines it to the learnings path-pattern" which was the exact phrasing in schemas.md
check \
  "schemas.md ServitorResult: hook-alone confinement claim ('confines it to the learnings path-pattern') absent" \
  "confines it to the learnings path-pattern"

# Pattern 4: design.md v0.2.0 amendments: "writes are confined to learningsTarget by the worktree-scope hook"
check \
  "design.md v0.2.0: hook-only attribution ('confined to.*by the worktree-scope hook') absent from live surface" \
  "confined to.*by the worktree-scope hook"

# Pattern 5: SKILL.md Invariants: 'hook keys on agent_type and confines the servitor'
check \
  "SKILL.md Invariants: hook-alone confinement claim ('confines the servitor to the learnings path-pattern') absent" \
  "confines the servitor to the learnings path-pattern"

# Pattern 6: SKILL.md Checkpoint: 'worktree-scope hook confines it there by agent_type'
check \
  "SKILL.md Checkpoint: hook-alone confinement claim ('worktree-scope hook confines it there') absent" \
  "worktree-scope hook confines it there"

echo ""
echo "clean-surface-hook-only-confinement: ${ok} check(s) passed, ${fail} check(s) failed."

[ "$fail" -eq 0 ] || exit 1
exit 0
