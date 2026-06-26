#!/usr/bin/env bash
# Clean-surface guard: the Refinery (war-refiner.md + the workflow-template.js
# land/merge prompts) MUST route all merges and pushes through the run-scoped
# _refinery worktree, NEVER through the Lead's main checkout.
#
# ABSENCE assertions (the forbidden pattern):
#   The live surface (agents/ + skills/war/assets/workflow-template.js, excluding
#   *.test.* files) must NOT contain a direct instruction for the Refinery to
#   "checkout <working>" by name (non-detached) in a land context, or to "push"
#   from the main checkout ("push from the Lead's main checkout" as a positive
#   command). The concrete token: `--detach` must accompany any `checkout` of a
#   working branch in a land context — bare `checkout <workingBranch>` (without
#   --detach) would signal "Refinery operating in main checkout." We scan for the
#   absence of the positive-instruction form "git checkout origin/" without
#   --detach in the refinery agent or workflow land prompt. The more conservative
#   and unambiguous forbidden token is: any instruction containing the phrase
#   "merge or push from the" (which, if it appeared as a command rather than a
#   prohibition, would indicate a main-checkout merge instruction). More precisely:
#   the token "Never merge or push from the Lead's main checkout" must appear ONLY
#   as a prohibition — and no token of the form "from the Lead's main checkout"
#   should appear as a positive instruction. We enforce this via the absence of
#   the substring "from the Lead" that is NOT prefixed by "Never" or "never".
#
# PRESENCE assertions (the required routing):
#   1. `_refinery` must appear in agents/war-refiner.md (the merge container).
#   2. `_refinery` must appear in skills/war/assets/workflow-template.js (the land
#      and merge-task prompts must reference the _refinery path).
#   3. `ensure-refinery-worktree` must appear in workflow-template.js (the Provision
#      barrier step that creates the Refinery's dedicated worktree).
#
# Test-file exclusion (load-bearing): this file NAMES the forbidden tokens (e.g.
# "from the Lead's main checkout"); excluding *.test.* from the scan is critical
# so that this test file does not cause a false positive on the absence check.
# Do NOT remove the *.test.* exclusion.
#
# Mirrors the WAR_WORKTREE-retirement pattern (hooks/clean-surface-war-worktree.test.sh).
# Runs under macOS bash 3.2.57. Resolves the repo root from the script's own location
# so it is cwd-independent (the gate may invoke it from anywhere).
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
# skills/war/assets/ lives three levels below the repo root; walk up.
ROOT="$(cd "$HERE/../../.." && pwd)"
cd "$ROOT" || { echo "FAIL - could not cd to repo root '$ROOT'" >&2; exit 1; }

PASS=0
FAIL=0

pass() { echo "ok - $1"; PASS=$((PASS + 1)); }
fail() { echo "FAIL - $1" >&2; FAIL=$((FAIL + 1)); }

# ---------------------------------------------------------------------------
# PRESENCE CHECK 1: _refinery must appear in war-refiner.md
# ---------------------------------------------------------------------------
REFINER_FILE="agents/war-refiner.md"
if [ ! -f "$REFINER_FILE" ]; then
  fail "_refinery presence in $REFINER_FILE — file not found"
else
  if grep -q '_refinery' "$REFINER_FILE"; then
    pass "_refinery is present in $REFINER_FILE (Refinery routes merges through the run-scoped worktree)"
  else
    fail "_refinery NOT found in $REFINER_FILE — the Refinery must route merges through _refinery, not the main checkout"
  fi
fi

# ---------------------------------------------------------------------------
# PRESENCE CHECK 2: _refinery must appear in workflow-template.js
# ---------------------------------------------------------------------------
WORKFLOW_FILE="skills/war/assets/workflow-template.js"
if [ ! -f "$WORKFLOW_FILE" ]; then
  fail "_refinery presence in $WORKFLOW_FILE — file not found"
else
  if grep -q '_refinery' "$WORKFLOW_FILE"; then
    pass "_refinery is present in $WORKFLOW_FILE (land/merge prompts reference the refinery worktree)"
  else
    fail "_refinery NOT found in $WORKFLOW_FILE — the land/merge prompts must route through _refinery"
  fi
fi

# ---------------------------------------------------------------------------
# PRESENCE CHECK 3: ensure-refinery-worktree must appear in workflow-template.js
# (the Provision barrier step that creates the Refinery's dedicated worktree)
# ---------------------------------------------------------------------------
if [ ! -f "$WORKFLOW_FILE" ]; then
  fail "ensure-refinery-worktree presence in $WORKFLOW_FILE — file not found"
else
  if grep -q 'ensure-refinery-worktree' "$WORKFLOW_FILE"; then
    pass "ensure-refinery-worktree is present in $WORKFLOW_FILE (Provision barrier creates the _refinery worktree)"
  else
    fail "ensure-refinery-worktree NOT found in $WORKFLOW_FILE — the Provision barrier must create the _refinery worktree"
  fi
fi

# ---------------------------------------------------------------------------
# ABSENCE CHECK: the live surface (agents/ + workflow-template.js, excluding
# *.test.*) must NOT instruct the Refinery to operate via the Lead's main
# checkout. The forbidden pattern: "from the Lead" appearing as a POSITIVE
# instruction (i.e. NOT on a line that starts with "Never" / "never" / "-"
# prohibition prose / "Do NOT" / comment).
#
# Concretely: we scan for lines containing "from the Lead" in the live surface,
# then require that EVERY such line is clearly a prohibition (contains "Never",
# "never", "Do NOT", "do NOT", "do not", or "must not") — a positive instruction
# would be a bare "merge ... from the Lead" without a prohibition prefix.
# ---------------------------------------------------------------------------
LIVE_SURFACE_FILES="$REFINER_FILE $WORKFLOW_FILE"

# Collect all lines containing "from the Lead" in the live surface
# (excluding *.test.* paths — load-bearing exclusion)
from_lead_hits=""
for f in $LIVE_SURFACE_FILES; do
  case "$f" in *.test.*) continue ;; esac
  if [ -f "$f" ]; then
    hits="$(grep -n 'from the Lead' "$f" 2>/dev/null || true)"
    if [ -n "$hits" ]; then
      from_lead_hits="$from_lead_hits
$f:$hits"
    fi
  fi
done
from_lead_hits="${from_lead_hits#?}"  # strip leading newline

if [ -z "$from_lead_hits" ]; then
  # No "from the Lead" at all — that is also fine (the prohibition might be phrased differently)
  pass "absence check — no 'from the Lead' phrase found on the live surface (no main-checkout merge instruction)"
else
  # Every match must be a prohibition, not a positive instruction.
  # A prohibition line contains: Never / never / Do NOT / do NOT / do not / must not / MUST NOT
  bad_hits=""
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    # Check if this line is a prohibition
    case "$line" in
      *Never*|*never*|*"Do NOT"*|*"do NOT"*|*"do not"*|*"must not"*|*"MUST NOT"*|*"Do not"*)
        : # prohibition — allowed ;;
        ;;
      *)
        bad_hits="$bad_hits
$line"
        ;;
    esac
  done <<EOF
$from_lead_hits
EOF
  bad_hits="${bad_hits#?}"  # strip leading newline

  if [ -z "$bad_hits" ]; then
    pass "absence check — every 'from the Lead' occurrence is a prohibition, not a positive instruction (main-checkout merge invariant holds)"
  else
    fail "MAIN-CHECKOUT MERGE INSTRUCTION DETECTED — 'from the Lead' appears as a positive (non-prohibition) instruction on the live surface (excluding *.test.*). The Refinery must NEVER be instructed to merge/push from the Lead's main checkout:"
    printf '%s\n' "$bad_hits" >&2
  fi
fi

# ---------------------------------------------------------------------------
# ABSENCE CHECK 2: the live surface must NOT instruct the Refinery to
# `git checkout <working-branch>` (by name, non-detached) in a land context.
# The correct form is `--detach` (spec §5.3). The forbidden token:
# "checkout origin/" WITHOUT "--detach" on the same line (in the live surface).
# We require that any "checkout origin/" line also contains "--detach".
# ---------------------------------------------------------------------------
no_detach_checkout_hits=""
for f in $LIVE_SURFACE_FILES; do
  case "$f" in *.test.*) continue ;; esac
  if [ -f "$f" ]; then
    # Lines that contain "checkout origin/" but NOT "--detach" (or "detach")
    hits="$(grep -n 'checkout origin/' "$f" 2>/dev/null | grep -v '\-\-detach' | grep -v 'detach' || true)"
    if [ -n "$hits" ]; then
      no_detach_checkout_hits="$no_detach_checkout_hits
$f:$hits"
    fi
  fi
done
no_detach_checkout_hits="${no_detach_checkout_hits#?}"  # strip leading newline

if [ -z "$no_detach_checkout_hits" ]; then
  pass "absence check — no bare 'checkout origin/' (non-detached) found on the live surface (detached-land constraint holds)"
else
  fail "BARE CHECKOUT DETECTED — 'checkout origin/' without --detach found on the live surface. The Refinery must use detached HEAD for land (git refuses a named checkout of a branch checked out in the Lead's main checkout):"
  printf '%s\n' "$no_detach_checkout_hits" >&2
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "refinery-surface: $PASS check(s) passed, $FAIL check(s) failed."
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
