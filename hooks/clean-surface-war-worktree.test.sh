#!/usr/bin/env bash
# Clean-surface guard: the literal token WAR_WORKTREE must NOT appear anywhere in
# the live skill/agent/hook surface (skills/, agents/, hooks/) — it is a retired,
# proven-NO-OP env var (probe E1; ADR 0002). Write-scope is now enforced by
# `agent_type` + the `.war-task` marker, so any lingering WAR_WORKTREE in prose,
# a comment, or a prompt string is stale and misleading.
#
# The ONLY allowed occurrences are inside *.test.* files: those are
# ABSENCE-ASSERTIONS that prove the token is gone (e.g. the workflow-template
# test asserts the worker / fix-worker / servitor prompts no longer contain it).
# The grep below therefore excludes any path containing ".test." — that exclusion
# is load-bearing: do not drop it, or this check would flag its own sibling
# assertions.
#
# Encoded as a *.test.sh so the WAR gate (`find hooks skills -name '*.test.sh'`)
# enforces it on every run. Exit 0 = clean; non-zero = a live WAR_WORKTREE site
# survived and must be removed/reworded.
#
# Runs under macOS bash 3.2.57. Resolves the repo root from the script's own
# location so it is cwd-independent (the gate may invoke it from anywhere).
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
# hooks/ lives at the repo root; its parent is the repo root.
ROOT="$(cd "$HERE/.." && pwd)"
cd "$ROOT" || { echo "FAIL - could not cd to repo root '$ROOT'" >&2; exit 1; }

# The exact contract from the plan/issue: the live surface (minus *.test.* files)
# must be free of the literal token. grep -rn over the three live trees, then drop
# every test file, must yield an EMPTY result.
hits="$(grep -rn WAR_WORKTREE skills agents hooks | grep -vE '\.test\.')"

if [ -z "$hits" ]; then
  echo "ok - live surface (skills/ agents/ hooks/, excluding *.test.*) is free of WAR_WORKTREE"
  exit 0
fi

echo "FAIL - WAR_WORKTREE still present on the live surface (must be removed/reworded):" >&2
printf '%s\n' "$hits" >&2
exit 1
