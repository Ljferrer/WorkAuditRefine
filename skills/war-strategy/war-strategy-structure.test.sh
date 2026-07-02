#!/usr/bin/env bash
# Structure test for skills/war-strategy/SKILL.md: locks all five sections, the three
# inline templates, and the template-internal Commander's Intent block so a future edit
# can't silently drop one. grep is fence-blind, so template-internal headings are checked
# as verbatim full lines (the arrow annotation / leading spaces make each match unique to
# the fence). Plain-bash, no mktemp — bash 3.2-safe. Exit 0 = all present; else non-zero.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SKILL="$HERE/SKILL.md"

fails=0
check() { # regex
  if grep -q "$1" "$SKILL"; then
    printf 'ok - %s\n' "$1"
  else
    printf 'not ok - missing: %s\n' "$1"
    fails=$((fails + 1))
  fi
}
check_f() { # fixed string — verbatim line fragments, incl. leading spaces
  if grep -qF "$1" "$SKILL"; then
    printf 'ok - %s\n' "$1"
  else
    printf 'not ok - missing: %s\n' "$1"
    fails=$((fails + 1))
  fi
}

# All five SKILL.md sections
check '^## 1. Dependency check'
check '^## 2. The three templates'
check '^## 3. The code-boundary decomposition rule'
check '^## 4. Handoff & convert'
check '^## 5. Closing offer'

# The three inline templates
check '^### Spec template'
check '^### Plan template'
check '^### Roadmap template'

# Template-internal Commander's Intent block (fence-safe: verbatim lines)
check_f "## Commander's Intent              ← operator-authored; intent ceiling, plan floor"
check_f '  - Purpose: <why'
check_f '  - Method: <how'
check_f '  - End state: <numbered list'

# Commander's Intent sits BEFORE ## Build order inside the plan template
ci="$(grep -nF "## Commander's Intent" "$SKILL" | head -n 1 | cut -d: -f1)"
bo="$(grep -nF '## Build order (for /war)' "$SKILL" | head -n 1 | cut -d: -f1)"
if [ -n "$ci" ] && [ -n "$bo" ] && [ "$ci" -lt "$bo" ]; then
  printf "ok - Commander's Intent precedes ## Build order\n"
else
  printf "not ok - Commander's Intent must precede ## Build order (ci=%s bo=%s)\n" "$ci" "$bo"
  fails=$((fails + 1))
fi

exit $fails
