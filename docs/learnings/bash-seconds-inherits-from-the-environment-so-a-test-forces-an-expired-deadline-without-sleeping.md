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

**Technique.** A bash script that measures its own deadline on `SECONDS` can be forced past the deadline from outside. The test row runs the hook as `SECONDS=1000 WAR_FINGERPRINT_DEADLINE_SECONDS=900 bash "$HOOK"`. The test comment says bash counts on from an inherited `SECONDS`, so the first `expired` check fires at once. The reason string prints the deadline in force: 540 with the clamp, 900 without it. The row needs no sleep, no git shim and no wall-clock margin. I did not run the row. The phase gate exited 0 at the tip with the row present, and a failed inheritance would have failed it, because the reason would not name a deadline.

**Why it beat the earlier shape.** The slow-shim rows from task 7.2's ace rounds used a deadline of 2 and a `git` shim that slept in `status`. `SECONDS` ticks in whole wall-clock seconds, so a deadline of 2 can fire after 1.0 s of real time. Under load the pre-check could fire before the slow call, and the row would pass through the wrong arm or go red with no defect. Two seats flagged that flake risk. The ladder later reverted those rows with the rest of the ace work.

**What it cannot reach.** Expiry is immediate, so the row exercises the entry pre-checks only: `expired` at `fingerprint` entry, and the pre-checks in `compare` and the SubagentStart loop. It never reaches the arms that fire mid-call: the `_frc = 3` branches ("still hashing" in `compare`, the marker write in the SubagentStart loop) and the per-path check in `blob_lines`. Deleting any of those turns no row red. A row for them needs a call that is slow on purpose, which brings back the granularity problem. Give it a margin of several seconds, not one. See [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]] item 6.

**Weak pin to avoid.** The default-540 row greps `[^0-9]540[^0-9]` in the hook, and the header comment satisfies that pattern. Anchor a literal pin on the code line, for example `DEADLINE=540 ;;`, or test the default behaviorally.

**Locate-cue (verify still present before acting).** In `hooks/audit-tree-fingerprint.test.sh`, the row titled "a deadline override of 600 or more falls back to 540 (clamped under the hooks.json timeout)" runs the hook with `SECONDS=1000`. Found at landed tip 218012434004 on `dev/2026-10-20-rea-artifact-evidence`.
