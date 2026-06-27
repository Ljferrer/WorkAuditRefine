#!/usr/bin/env bash
# Doc-scan test: verify skills/red-team/SKILL.md instructs the red-team Lead to
# read the committed provisioning manifest (.war-provision.json) via the shared
# readManifest and thread the resolved list into args.provision.
#
# Also verifies workflow-scaffold.js has a provenance comment documenting that the
# committed .war-provision.json is ONE valid provenance of args.provision.
#
# This is a TEXT-SCAN test (not a code test) — SKILL.md is an LLM-agent prompt,
# not a module. The gate runs this as: bash skills/red-team/manifest-provenance.test.sh
#
# Follows repo .test.sh conventions (refinery-surface.test.sh, validate-worktree-scope.test.sh).
# Runs under macOS bash 3.2.57. Resolves paths from the script's own location.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
# skills/red-team/ is two levels below repo root
ROOT="$(cd "$HERE/../.." && pwd)"

SKILL_MD="$ROOT/skills/red-team/SKILL.md"
SCAFFOLD_JS="$ROOT/skills/red-team/assets/workflow-scaffold.js"

PASS=0
FAIL=0

pass() { echo "ok - $1"; PASS=$((PASS + 1)); }
fail() { echo "FAIL - $1" >&2; FAIL=$((FAIL + 1)); }

# ---------------------------------------------------------------------------
# Guard: required files must exist
# ---------------------------------------------------------------------------
if [ ! -f "$SKILL_MD" ]; then
  echo "FAIL - SKILL.md not found at $SKILL_MD" >&2
  exit 1
fi
if [ ! -f "$SCAFFOLD_JS" ]; then
  echo "FAIL - workflow-scaffold.js not found at $SCAFFOLD_JS" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# SKILL.md assertions
#
# T3.1 requirement: the step that assembles args.provision must instruct the
# red-team Lead to:
#   (a) read .war-provision.json via the shared readManifest
#   (b) thread the resolved list into args.provision (same as /war pins run.provision)
# ---------------------------------------------------------------------------

# (a) SKILL.md references .war-provision.json (the manifest file name)
if grep -q '\.war-provision\.json' "$SKILL_MD"; then
  pass "SKILL.md references .war-provision.json"
else
  fail "SKILL.md does NOT reference .war-provision.json — Lead must be told to read the manifest"
fi

# (b) SKILL.md references readManifest (the shared reader function)
if grep -q 'readManifest' "$SKILL_MD"; then
  pass "SKILL.md references readManifest (the shared reader)"
else
  fail "SKILL.md does NOT reference readManifest — Lead must use the shared reader, not re-implement"
fi

# (c) SKILL.md references provision in the context of args (the scaffold arg)
# Look for args.provision or 'provision' near 'args' (within the file)
if grep -q 'args\.provision' "$SKILL_MD"; then
  pass "SKILL.md references args.provision (threads result into scaffold arg)"
else
  fail "SKILL.md does NOT reference args.provision — Lead must thread the manifest list into the scaffold arg"
fi

# (d) SKILL.md must mention the manifest path in the context of the provision step
# (uniqueness guard — prune-assertion-substring-token-drift: assert a unique manifest token)
if grep -q 'provision.*manifest\|manifest.*provision' "$SKILL_MD"; then
  pass "SKILL.md contains manifest+provision proximity (provision step references manifest)"
else
  fail "SKILL.md does NOT connect 'provision' and 'manifest' — the manifest-read step is missing"
fi

# ---------------------------------------------------------------------------
# workflow-scaffold.js assertion
#
# T3.1 requirement: a comment near provisionDirective documents that the committed
# .war-provision.json manifest is ONE valid provenance of args.provision.
# The comment must NOT change scaffold behavior (behavioral no-op).
# ---------------------------------------------------------------------------

# (e) workflow-scaffold.js has a comment referencing .war-provision.json as a valid
#     provenance of args.provision. Unique token: ".war-provision.json" + "provision"
#     in proximity within the file.
if grep -q '\.war-provision\.json' "$SCAFFOLD_JS"; then
  pass "workflow-scaffold.js references .war-provision.json (provenance comment present)"
else
  fail "workflow-scaffold.js does NOT reference .war-provision.json — provenance comment missing near provisionDirective"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "$PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  echo "manifest-provenance.test.sh: FAIL"
  exit 1
fi

echo "manifest-provenance.test.sh: PASS"
