---
name: late-defect-2-charge-test-teardown-rmsync-can-fail-enotempty-under-gate-load
description: "The late-defect-2 charge test's finally rmSync can throw ENOTEMPTY under gate load and red the whole merge gate"
metadata:
  promoted: dev/2026-11-08-engine-findings-ace-and-late-fix@phase-3
  node_type: memory
  type: project
  keywords:
    - ENOTEMPTY
    - rmSync flake
    - teardown flake
    - gate load
    - real-repo test cleanup
    - late-defect-2
    - red gate retry
    - recursive force rm
  provenance: code-verified
  slug: late-defect-2-charge-test-teardown-rmsync-can-fail-enotempty-under-gate-load
  phase: 2026-11-08-engine-findings-ace-and-late-fix/phase-3 (task p3-latefix-4)
  tags:
    - tests
    - flake
    - gate
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-10T03:08:10.854Z
---

# The late-defect-2 charge test teardown can red the gate with ENOTEMPTY

**What happened.** The round-4 merge gate for `p3-latefix-4` went red with one failure in 3033 tests.
The failing test is `late-defect: charge — the barrier read spelling, run through bash on a real repo, ...` in `skills/war/assets/workflow-template.late-defect-2.test.mjs`.
The error came from its `finally { rmSync(dir, { recursive: true, force: true }) }` cleanup: `ENOTEMPTY, Directory not empty` under the gate's `node.tmp` dir.
The branch diff touched only `agents/war-refiner.md` and an ADR, so the diff did not cause it.
The same test file run alone at the same tip passed 27 of 27.
The next gate run at the next tip was green.

**Why it matters.** `force: true` does not stop ENOTEMPTY when a child process still writes into the dir during the recursive walk.
A real-repo test that spawns git can leave such a late writer (for example a git background process) under gate load.
One teardown flake reds the full gate and costs a late-fix round.

**What to do.**
- If the gate fails only on this teardown ENOTEMPTY, treat it as a flake, not a defect in the diff.
- A durable fix is `rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })`, or a wait for the spawned child before cleanup.
- A second test in the same file uses the same cleanup shape, so fix both.

This is a hypothesis about the root cause (a late writer); no refute pass ran.
Related: [[audit-tree-fingerprint-d8-row-can-red-under-gate-load-and-discard-a-docs-only-polish]].

Locate-cue: verify still present before acting. Found at `skills/war/assets/workflow-template.late-defect-2.test.mjs` (two `rmSync(dir, { recursive: true, force: true })` finally blocks) @ phase 3 landed tip aabdfe42, read in the run's `_refinery` worktree whose HEAD equals that tip.
