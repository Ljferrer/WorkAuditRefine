---
name: scope-hook-test-nonhermetic-inside-war-task-worktree
description: "Case-11 hermeticity fixed #95a; empty got→check stderr"
metadata:
  node_type: memory
  slug: scope-hook-test-nonhermetic-inside-war-task-worktree
  type: project
  keywords: [spurious gate_failed, false FAIL, REL_GUARD_PRECONDITION_FAILED, clean checkout rerun, ancestor marker walk, empty got value, stderr not stdout]
  tags:
    - war
    - scope-hook
    - test-hermeticity
    - gate-failure
    - stderr-stdout
  files:
    - hooks/validate-worktree-scope.test.sh
  relates:
    - "[[relative-path-test-needs-clean-cwd]]"
    - "[[auditor-cannot-execute-the-tests-it-must-verify-pass]]"
    - "[[gate-under-covers-after-cross-branch-merge-new-runner]]"
    - "[[done-add-on-soft-failure-unblocks-true-dependents]]"
  created: 2026-06-25
  updated: 2026-06-26
  originSessionId: 4f3e4595-5aaa-40b5-9004-183f4bb53936
---

# Scope-hook test non-hermetic inside .war-task worktree — fixed; two durable residues

Bug (#95): the "war-worker relative path denies (no infinite loop)" case of `hooks/validate-worktree-scope.test.sh` flipped to FAIL when the gate ran inside a `.war-task`-marked worktree (the hook's ancestor walk found the marker and ALLOWED), producing a spurious merge-task `gate_failed`. Fixed in guard-fidelity tA (#95a): the `rel_guard` helper in that test detects a `.war-task` ancestor and emits `REL_GUARD_PRECONDITION_FAILED` to stderr — a loud FAIL, never a silent false-pass. (The file no longer numbers cases; anchor on the test title, not "case 11".)

1. Never trust a WAR `gate_failed` at face value — re-run the gate from a clean, non-`.war-task` checkout; ground truth is git state plus a clean-checkout gate.
2. A FAIL on that case showing an empty "got" value means: check stderr for `REL_GUARD_PRECONDITION_FAILED` before assuming a code regression.

**Why:** same "tests behave differently than the orchestrator assumes" family as [[auditor-cannot-execute-the-tests-it-must-verify-pass]] and [[gate-under-covers-after-cross-branch-merge-new-runner]].
**How to apply:** re-run suspect gates from a clean checkout; read stderr, not just the TAP stdout.

Related: [[relative-path-test-needs-clean-cwd]], [[done-add-on-soft-failure-unblocks-true-dependents]], [[absence-guard-redundant-filter-is-deliberate-mirror]]
