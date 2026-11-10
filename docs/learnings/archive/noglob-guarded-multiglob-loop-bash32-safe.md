---
name: noglob-guarded-multiglob-loop-bash32-safe
description: "set -f + unquoted for + plain break + set +f; && break errexit-safe; bash 3.2-safe"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: noglob-guarded-multiglob-loop-bash32-safe
  phase: test-floor-script-glob-and-doc-hardening/phase-1-t1 (#231)
  date: 2026-07-01
  tags:
    - bash
    - noglob
    - set--f
    - errexit
    - bash-3.2
    - word-splitting
  related:
    - floor-script-discovery-set-must-mirror-gate-exclusions
    - floor-script-exit-codes-1-vs-2-route-differently
    - tr-escape-single-quote-strips-literal-not-newline
  originSessionId: 1bd064e5-a8af-4b1f-91d5-638887067351
---

# NOGLOB-guarded multi-glob loop: bash-3.2-safe unquoted pattern-list iteration

**Rule:** to match a string against a space-separated glob list: `set -f` → `for pat in $custom_pattern` (unquoted; `-f` suppresses pathname expansion but keeps word-splitting) → `case "$f" in $pat) found=1; break ;;` (plain `break`, NOT `break 2` — `break 2` would skip the restore on the match path) → unconditional `set +f` → `[ "$found" = 1 ] && break` (a failing LHS of `&&` is exempt from `set -e`, so non-matches don't abort the loop).

Unconditional `set +f` is correct only while the script never sets `-f` earlier; add save/restore (`case $- in *f*) ...`) before extracting into a library.

Landed in the `--pattern` multi-glob loop of `skills/war/assets/assert-test-in-diff.sh`.

**Why:** an unguarded unquoted `$pat` filename-expands against stray CWD files, silently corrupting the match.
**How to apply:** copy the four-step shape verbatim; verify presence against the landed branch tip, not whatever the cwd has checked out.
Related: [[land-local-follower-ref-can-lag-sync-before-next-phase]], [[gate-audit-pin-bracket-test-blocked-by-git-guard]]

> archived 2026-07-04: resolved — moved to archive
