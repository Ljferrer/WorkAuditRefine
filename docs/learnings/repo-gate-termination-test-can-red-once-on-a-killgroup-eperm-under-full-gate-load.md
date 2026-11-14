---
name: repo-gate-termination-test-can-red-once-on-a-killgroup-eperm-under-full-gate-load
description: The repo-gate termination test can red once with kill EPERM under full gate load
metadata:
  node_type: memory
  type: project
  keywords:
    - EPERM
    - killGroup
    - process.kill
    - repo-gate.test.mjs
    - gate flake
    - environment class
    - termination kills descendants
    - process group
  provenance: agent-unverified
  slug: repo-gate-termination-test-can-red-once-on-a-killgroup-eperm-under-full-gate-load
  phase: "2026-11-08-engine-comment-and-duplication-tidy/phase-2 (task 2.1 merge), landed 044a11f76d821eb44f8c5080df2aecb499c22e18"
  tags:
    - gate
    - flake
    - test-infra
  created: 2026-11-11
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T21:09:14.313Z
---

# The repo-gate termination test can red once on a kill EPERM

## Observed

- The task 2.1 merge gate ran `node skills/war/assets/repo-gate.mjs`: 89 jobs, 1 failed.
- The one failure was the `repo-gate.test.mjs` test "termination kills descendants, drains active jobs, and never reports a complete gate".
- The child gate's `killGroup` threw `Error: kill EPERM` from `process.kill(-pid, signal)`. The test expected exit 143 and got 1.
- `killGroup` swallows only `ESRCH`, so an `EPERM` escapes and turns the exit code into 1.
- The test passed 15/15 at base and again at the task tip with a fresh TMPDIR. The task diff did not touch repo-gate.
- The refiner classed it `environment` and re-ran the gate green (89/89), so the merge went ahead.

## Cause (hypothesis, not proven)

- A likely cause is macOS returning EPERM from a process-group kill when the group holds only exiting or zombie members.
- No refute pass ruled other causes out. Treat this as a hypothesis until someone reproduces it.

## What to do

- If this test alone reds with `kill EPERM` and the diff does not touch repo-gate, class it `environment` and re-run.
- A durable fix may be to treat `EPERM` like `ESRCH` in `killGroup` for the group kill. Prove the test still catches a live descendant first.
- Related flakes under gate load: [[audit-tree-fingerprint-d8-row-can-red-under-gate-load-and-discard-a-docs-only-polish]].

## Merged sibling: the late-defect-2 teardown ENOTEMPTY

The same gate-load class: one test reds on a cleanup path the diff never touched, and a solo re-run is green.
In `skills/war/assets/workflow-template.late-defect-2.test.mjs`, three `finally { rmSync(dir, { recursive: true, force: true }) }` blocks can throw `ENOTEMPTY` when a spawned git child still writes during the walk.
Treat that red as a flake. The durable fix is `maxRetries: 3, retryDelay: 50` on each `rmSync`, or a wait for the child before cleanup. The cause is a hypothesis (a late writer).
Merged from `late-defect-2-charge-test-teardown-rmsync-can-fail-enotempty-under-gate-load` (memory tighten, 2026-11-14).

Verify still present before acting: `killGroup` and its ESRCH-only catch found in `skills/war/assets/repo-gate.mjs`,
and the test name found in `skills/war/assets/repo-gate.test.mjs` @ phase 2 tip 044a11f7. The cause is unverified.
