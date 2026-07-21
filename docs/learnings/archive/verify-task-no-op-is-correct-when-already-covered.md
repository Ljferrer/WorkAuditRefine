---
name: verify-task-no-op-is-correct-when-already-covered
description: "VERIFY zero diff ok when base covers; 3-check audit"
metadata: 
  node_type: memory
  type: project
  keywords: [zero diff, empty diff, audit checklist, green-by-presence, double no-op, approve no change, worker vs verify prior]
  slug: verify-task-no-op-is-correct-when-already-covered
  phase: 5/t9
  severity: process
  originSessionId: 4f3e4595-5aaa-40b5-9004-183f4bb53936
---

# VERIFY task no-op is correct when integration base already covers the scenario

**Rule:** a VERIFY task whose "add X if missing" condition evaluates to FALSE is correct to
produce zero file changes — that is not "task skipped the work". Instance: phase 5/t9
approved with zero diff because the integration base already contained the requested
zero-cross-bleed leg in provision-worktrees.test.sh.

**3-check auditor checklist:** (1) the requested scenario already exists in the integration
base; (2) coverage is green-by-presence, not green-by-deletion; (3) no other phase task was
supposed to add it and also no-opped (double-no-op).

**Why:** the prior differs by task type — worker zero diff is suspicious; VERIFY zero diff is often the intended outcome.
**How to apply:** run the 3 checks; if all hold, approve the no-op.

Related: [[auditor-cannot-execute-the-tests-it-must-verify-pass]] (gate execution stays with
the refiner), [[gate-under-covers-after-cross-branch-merge-new-runner]] (re-detect gate
runners after cross-branch merge before claiming green).

> archived 2026-07-21: resolved — moved to archive
