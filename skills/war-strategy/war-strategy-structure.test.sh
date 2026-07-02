#!/usr/bin/env bash
# Structure test for skills/war-strategy/SKILL.md: locks the three inline
# templates + the code-boundary rule so a future edit can't silently drop one.
# Plain-bash, no mktemp — bash 3.2-safe. Exit 0 = all present; else non-zero.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SKILL="$HERE/SKILL.md"

fails=0
check() {
  if grep -q "$1" "$SKILL"; then
    printf 'ok - %s\n' "$1"
  else
    printf 'not ok - missing: %s\n' "$1"
    fails=$((fails + 1))
  fi
}

check '^### Spec template'
check '^### Plan template'
check '^### Roadmap template'
check '^## 3. The code-boundary decomposition rule'

exit $fails
