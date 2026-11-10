---
name: relative-path-test-needs-clean-cwd
description: "A relative-path ancestor-walk test must run the hook from a verified .war-task-free dir, or the cwd's own marker false-allows"
metadata: 
  node_type: memory
  type: project
  keywords: [ancestor walk, war-task marker, false allow, mktemp, TMPDIR, fixture isolation, spurious gate_failed, REL_GUARD_PRECONDITION_FAILED, clean checkout rerun, empty got value, stderr not stdout]
  slug: relative-path-test-needs-clean-cwd
  phase: clandiso/phase-1
  tasks: t1 (gate escalation)
  date: 2026-06-25
  tags: 
    - scope-guard
    - testing
    - CWD
    - worktree
    - bash
    - test-hermeticity
  related: 
    - - scope-hook-relative-path-loop-hang
  originSessionId: 4f3e4595-5aaa-40b5-9004-183f4bb53936
---

# Relative-path ancestor-walk test must run from a verified .war-task-free dir

## What happened

A merge gate failed the case `"war-worker relative path denies (no infinite loop)"`
in `hooks/validate-worktree-scope.test.sh`: expected exit 2, got exit 0.

The hook code was **correct**: the `prev` progress guard terminates the ancestor
walk for relative paths (see [[scope-hook-relative-path-loop-hang]]).
The bug was in the **test fixture**.

The suite ran `rel_guard` (the hook) in whatever CWD the gate invoked it from —
the task worktree root, which **has a `.war-task` marker**.

Ancestor walk for `"relative/sub/file.txt"` from that CWD:
- `relative/sub` → no marker
- `relative` → no marker
- `.` → **`.war-task` found at worktree root** → exit 0 (allow)

So the CWD's own `.war-task` satisfied the walk even though the path was relative
and had no real worktree ancestor. The hook returned "allowed" — the opposite of
the test's intent.

## The fix (landed, since strengthened)

The `rel_guard` helper in `hooks/validate-worktree-scope.test.sh` now roots its
clean dir under the suite's own `$WT/plain` fixture (created `.war-task`-free at
setup) — explicitly **NOT** an ambient `mktemp -d`, which can land under a
`.war-task` ancestor when `TMPDIR` points inside a worktree root on Linux/CI. A
precondition walks the chosen dir's ancestors and emits
`REL_GUARD_PRECONDITION_FAILED` to stderr if any holds `.war-task`, so an
unisolatable environment fails loudly instead of false-allowing.

## Rule

Any test that verifies **"relative path with no real worktree ancestor is denied"**
MUST run the hook from a **verified** `.war-task`-free directory — root it in a
fixture the suite controls and precondition-check the ancestor chain; a bare
`mktemp -d` is NOT sufficient (its ancestry depends on `TMPDIR`). Running from
the repo/worktree root silently satisfies the walk via the root's own
`.war-task`, producing a false-allow that masks regression.

The test comment should document the clean dir as load-bearing, not incidental.

## Reading a failure of this case

1. Never trust a WAR `gate_failed` at face value — re-run the gate from a clean, non-`.war-task` checkout; ground truth is git state plus a clean-checkout gate.
2. A FAIL on that case showing an empty "got" value means: check stderr for `REL_GUARD_PRECONDITION_FAILED` before assuming a code regression. Read stderr, not just the TAP stdout.

Related: [[auditor-cannot-execute-the-tests-it-must-verify-pass]], [[gate-under-covers-after-cross-branch-merge-new-runner]].

> archived 2026-07-13: resolved — moved to archive
