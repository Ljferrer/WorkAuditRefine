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

# Per-task Files line: the backticked-path contract the campaign ledger's extractFiles reads
# (the producer half of the ingestion contract). Presence-only like every sibling; fragment chosen
# free of embedded double quotes ([[shared-string-constant-quote-literal-byte-anchor-fragility]]).
check_f 'every path backticked & comma-separated; the campaign ledger'

# Packaging: the per-task requiresPackaging field line AND the required backstop section.
# Both are fence-blind verbatim lines (arrow annotation makes each unique to the template
# fence). Delete either from the template and the matching check fails.
check_f '  - requiresPackaging: true|false  ← default true'
check_f '## Deferred validations (backstops)   ← required; ratify in /red-team; surfaced at every land'

# Drift-guard coverage subsection (§3) — pin the block heading plus each rule by its
# distinctive teeth phrase so a future edit can't silently drop either authoring rule.
# Fixed-string, no quote-marks/bold crossing the anchor (byte-anchor-fragility trap).
check '^### Drift-guard coverage'
check_f 'unguarded mirror is a plan defect'   # rule (a): new mirror ⇒ registry row same task
check_f 'OLD value absent'                     # rule (b): default-flip enumerates surfaces, asserts old absent

# "Reference the live artifact, never a stack-fragile literal" convention block (§2) —
# pin the heading plus each of the six named rules + the defined-but-not-yet-emitted
# annotation by a distinctive teeth phrase, so a future edit can't silently drop one.
# Fixed-string, anchored inside the line (no quote-marks/bold crossing the anchor).
check '^### Reference the live artifact, never a stack-fragile literal'
check_f 'name the enclosing symbol or comment header'        # construct locator
check_f 'reference the self-discovery gate'                   # self-discovery gate (resolveGate)
check_f 'append to the canonical export in'                  # canonical export mirror
check_f 'use the dotted path'                                # dotted path for nested keys
check_f 'next free patch above the live base'               # release-task next-free-patch
check_f 'defined-but-not-yet-emitted; produced in Task N'    # cross-slice annotation
check_f 'requires a manual same-scope title/comment survey'  # grep-as-floor
check_f 'plan-literal-lint.mjs'                              # advisory lint named in the convention + §4

# Commander's Intent sits BEFORE ## Build order inside the plan template.
# Locators anchor to the verbatim arrow-bearing template lines (unique to the plan-template
# fence) so a stray earlier bare heading of the same text can't misbind them.
ci="$(grep -nF "## Commander's Intent              ← operator-authored; intent ceiling, plan floor" "$SKILL" | head -n 1 | cut -d: -f1)"
bo="$(grep -nF '## Build order (for /war)          ← the phase list, in DAG order' "$SKILL" | head -n 1 | cut -d: -f1)"
if [ -n "$ci" ] && [ -n "$bo" ] && [ "$ci" -lt "$bo" ]; then
  printf "ok - Commander's Intent precedes ## Build order\n"
else
  printf "not ok - Commander's Intent must precede ## Build order (ci=%s bo=%s)\n" "$ci" "$bo"
  fails=$((fails + 1))
fi

exit $fails
