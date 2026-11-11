---
name: bash-seconds-inherits-from-the-environment-so-a-test-forces-an-expired-deadline-without-sleeping
description: "A test can expire a bash script's SECONDS deadline by exporting SECONDS, but it reaches only the pre-check arms"
metadata:
  node_type: memory
  type: project
  keywords:
    - bash SECONDS
    - deadline test
    - expired pre-check
    - sleep shim flake
    - whole-second granularity
    - mid-hash arm
    - test fixture
    - audit-tree-fingerprint
  provenance: code-verified
  slug: bash-seconds-inherits-from-the-environment-so-a-test-forces-an-expired-deadline-without-sleeping
  phase: 2026-10-20-rea-artifact-evidence/phase-7 p7-polish
  tags:
    - war
    - hooks
    - testing
    - bash-3.2
  created: 2026-10-24
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-25T00:57:13.111Z
---

# Export SECONDS to expire a deadline in a test, and know what it cannot reach

**Technique.** A bash script that measures its own deadline on `SECONDS` can be forced past the deadline from outside. The test row runs the hook as `SECONDS=1000 WAR_FINGERPRINT_DEADLINE_SECONDS=900 bash "$HOOK"`. Bash counts on from an inherited `SECONDS`, so the first `expired` check fires at once. The reason string prints the deadline in force: 540 with the clamp, 900 without it. The row needs no sleep, no git shim and no wall-clock margin.

**Why it beats a slow shim.** `SECONDS` ticks in whole wall-clock seconds, so a deadline of 2 can fire after 1.0 s of real time. A row that relies on a slow call racing a short deadline can pass through the wrong arm or go red with no defect under load.

**What it cannot reach.** Expiry is immediate, so the row exercises the entry pre-checks only: `expired` at `fingerprint` entry, and the pre-checks in `compare` and the SubagentStart loop. It never reaches the arms that fire mid-call: the `_frc = 3` branches ("still hashing" in `compare`, the marker write in the SubagentStart loop) and the per-path check in `blob_lines`. The rows in the section "the per-call watchdog (Task 8.1, ruling A, 2026-10-24)" now reach the `_frc = 3` branches: a `git` shim sleeps 5 s in `status`, `hash-object` or `ls-files`, and the hook kills the call at a 2 s deadline. The row "a start-arm watchdog kill records the stop point and lists every worktree it skipped" reaches the marker write. The per-path check in `blob_lines` still has no discriminating row: see the pinned list in [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]]. A row for a mid-call arm needs a call that is slow on purpose, which brings back the granularity problem. Give it a margin of several seconds, not one.

**Locate-cue (verify still present before acting).** In `hooks/audit-tree-fingerprint.deadline.test.sh` (#2823 split the suite), the row titled "deadline override at or above 600 is clamped" runs the hook with `SECONDS=1000`.

> archived 2026-11-05: resolved — moved to archive
