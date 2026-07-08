#!/usr/bin/env bash
# Doc-scan test: verify the diagnosis pre-flight (self-confound gate) is present on
# all six prose surfaces that reach a diagnosing role, and that its four canonical
# parts are individually present in the red-team SKILL.md home.
#
# These are LLM-agent prompt surfaces, not modules — a TEXT-SCAN test (like
# manifest-provenance.test.sh, war-pipeline-structure.test.sh). The gate runs it via
# its `find … -name '*.test.sh'` sweep: bash skills/red-team/diagnosis-preflight.test.sh
#
# Every anchor is checked case-tolerant (grep -qi, mid-sentence) — the clauses are
# deliberately non-identical per surface (self-contained, never verbatim mirrors), so
# only presence of the shared `self-confound` term + per-surface/-part tokens is asserted,
# never byte-identity ([[verbatim-mirror-directive-context-mismatch-at-destination]],
# [[gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity]]).
#
# Temp-break proof (per [[weak-test-assertion-passes-without-feature-being-exercised]]):
# every assertion below was shown to FAIL when its clause is reverted — each of the four
# canonical parts and each of the five non-canonical surface clauses was deleted in turn
# and this test failed each time (recorded in the worker result). Each per-part token is
# unique to its part in SKILL.md and each per-surface token was verified absent from its
# file pre-change, so no assertion is vacuous.
#
# Follows repo .test.sh conventions. Runs under macOS bash 3.2.57. cwd-independent —
# resolves paths from the script's own location.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
# skills/red-team/ is two levels below repo root.
ROOT="$(cd "$HERE/../.." && pwd)"

SKILL_MD="$ROOT/skills/red-team/SKILL.md"
SCAFFOLD_JS="$ROOT/skills/red-team/assets/workflow-scaffold.js"
LENSES_MD="$ROOT/skills/red-team/references/lenses.md"
WAR_SKILL="$ROOT/skills/war/SKILL.md"
WORKER_MD="$ROOT/agents/war-worker.md"
SERVITOR_MD="$ROOT/agents/war-servitor.md"

PASS=0
FAIL=0

pass() { echo "ok - $1"; PASS=$((PASS + 1)); }
fail() { echo "FAIL - $1" >&2; FAIL=$((FAIL + 1)); }

# has FILE PATTERN LABEL — case-tolerant substring presence. `--` guards patterns that
# could start with `-`; `-i` makes anchors mid-sentence / case-insensitive.
has() {
  if grep -qi -- "$2" "$1"; then
    pass "$3"
  else
    fail "$3 (missing anchor: [$2] in $1)"
  fi
}

# ---------------------------------------------------------------------------
# Guard: every scanned surface must exist.
# ---------------------------------------------------------------------------
for f in "$SKILL_MD" "$SCAFFOLD_JS" "$LENSES_MD" "$WAR_SKILL" "$WORKER_MD" "$SERVITOR_MD"; do
  if [ ! -f "$f" ]; then
    echo "FAIL - required surface not found: $f" >&2
    exit 1
  fi
done

# ---------------------------------------------------------------------------
# Canonical home — skills/red-team/SKILL.md: the section + its four numbered parts.
# ---------------------------------------------------------------------------
has "$SKILL_MD" "self-confound"          "red-team/SKILL.md carries the shared self-confound term"
has "$SKILL_MD" "## Diagnosis pre-flight" "red-team/SKILL.md has the Diagnosis pre-flight section heading"
has "$SKILL_MD" "action-provenance"      "red-team/SKILL.md part 1 — action-provenance first"
has "$SKILL_MD" "single-path"            "red-team/SKILL.md part 2 — single-path validation"
has "$SKILL_MD" "primary evidence"       "red-team/SKILL.md part 3 — hypothesis promotion gated on primary evidence"
has "$SKILL_MD" "falsif"                 "red-team/SKILL.md part 4 — state the falsifier"

# ---------------------------------------------------------------------------
# Non-canonical surface clauses (self-contained, sharing the self-confound term).
# ---------------------------------------------------------------------------
has "$SCAFFOLD_JS" "self-confound"       "workflow-scaffold.js confirmStage prompt carries the self-confound gate"

has "$LENSES_MD"   "self-confound"       "lenses.md Safety carries the self-confound term"
has "$LENSES_MD"   "sandbox reuse"       "lenses.md Safety names sandbox reuse as a confound to rule out"

has "$WAR_SKILL"   "self-confound"       "war/SKILL.md Invariants carries the self-confound term"
has "$WAR_SKILL"   "hypothesis promotion" "war/SKILL.md Invariants gates hypothesis promotion"
has "$WAR_SKILL"   "sub-agent fan-out"   "war/SKILL.md Invariants names the sub-agent fan-out channel"

has "$WORKER_MD"   "self-confound"       "war-worker.md escalation carries the self-confound term"
has "$WORKER_MD"   "ruled out"           "war-worker.md escalation requires naming what was ruled out"

has "$SERVITOR_MD" "self-confound"       "war-servitor.md D3 carries the self-confound term"
has "$SERVITOR_MD" "evidence trail"      "war-servitor.md D3 requires the self-confound evidence trail"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "$PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  echo "diagnosis-preflight.test.sh: FAIL"
  exit 1
fi

echo "diagnosis-preflight.test.sh: PASS"
