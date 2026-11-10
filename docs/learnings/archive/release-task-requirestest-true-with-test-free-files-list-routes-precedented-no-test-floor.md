---
name: release-task-requirestest-true-with-test-free-files-list-routes-precedented-no-test-floor
description: "A release-only task with requiresTest:true and a test-free Files list always routes the no-test floor; declare requiresTest:false or map a real test into Files"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: release-task-requirestest-true-with-test-free-files-list-routes-precedented-no-test-floor
  phase: "ask-disposition/phase-3 (Release), task 3.1, 2026-08-25"
  keywords: 
    - requiresTest
    - no-test floor
    - assert-test-in-diff.sh
    - merge-task step 4
    - release task
    - plan attribute vs diff shape
    - version-slots.test.mjs
    - bounded fix round
    - roundLimit
    - release-only Files list
    - test-free diff
    - authoring-side-verification precedent
  tags: 
    - war
    - release
    - plan-authoring
    - merge-floor
    - audit-findings
  created: 2026-08-25
  originSessionId: 351f8fc5-4d48-4ee9-8beb-5d257d9bcf6f
  modified: 2026-08-26T04:04:17.974Z
---

# A release task's `requiresTest: true` + test-free Files list is a known, precedented cost — not a defect

**The mechanism:** `skills/war/assets/assert-test-in-diff.sh`'s default pattern set is exactly
`skills/**/*.test.mjs` and `**/*.test.sh` (see the script header and `match_default`).
A release task's Files list — `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`,
`README.md`, `CHANGELOG.md` — matches neither pattern, so the floor deterministically exits 1 and
`agents/war-refiner.md` merge-task step 4 returns `status: "no-test"`: the refiner does **not**
merge, and the engine routes a bounded fix-worker + full re-audit sub-loop off the shared
`roundLimit` (6; exhaustion is a HARD escalation reason).

**Why this is not a plan deviation:** `requiresTest` is a plan/dispatch attribute, and a
release-only task's Files list is closed by the plan's own authoring — the tension lives entirely
inside the plan slice's own fields, not in what the worker delivered.

**Precedent (`authoring-side-verification` plan, Task 4.1):** the identical slice shape resolved in
exactly **one** fix round: a bump commit (four files, no test), then
`test(release): guard the release-commit prose halves` (new assertions in `version-slots.test.mjs`),
then land. The cost is a deferred merge plus one round of six — never an unsound land, no test
erosion, no incorrect release.

**New wrinkle on the second occurrence (`ask-disposition` phase 3):** the release-shape guards a fix
round would normally add (Status replace-in-place + CHANGELOG newest-first assertions) **already
exist** in `version-slots.test.mjs`. A second no-test round on this shape has no obvious *new* test to
author, and risks becoming a make-work edit purely to satisfy the diff floor.

**How to apply:**
1. At plan-authoring/Checkpoint time, a release-only task whose Files list is closed and
   structurally test-free should either declare `requiresTest: false` (as sibling doc-only tasks in
   the same plan already do) or explicitly map a real test-side addition into the Files list.
2. If the floor is allowed to fire anyway, direct the resulting fix round at a **genuine** test-side
   addition (new release-prose guards) — never a token edit whose only purpose
   is to satisfy `assert-test-in-diff.sh`.
3. Before spending a second such round, check whether the guards a first round would have added
   (Status replace-in-place, CHANGELOG ordering/newest-first) already exist — if so, the round is
   likely make-work and the Lead should consider ruling `requiresTest: false` at the Checkpoint
   instead of re-running the same precedented loop for no new coverage.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]] (the CHANGELOG-ordering test
this pattern's fix round would add carries its own coverage gap — no fixture-driven negative control).

> archived 2026-10-27: resolved — moved to archive
