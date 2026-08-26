---
name: release-task-requirestest-true-with-test-free-files-list-routes-precedented-no-test-floor
description: "A release-only task's plan slice pairing requiresTest:true with a test-free Files list (plugin.json/marketplace.json/README.md/CHANGELOG.md) deterministically routes the assert-test-in-diff.sh no-test floor at merge-task step 4 — a precedented, bounded one-round cost, not a worker deviation, but a second occurrence after the guards it would fix already exist risks a make-work fix round"
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

**Code-verified** at the audited pin `a3f7b8b282bd1a993e5a3c56bdf4347395d89ee7` (task worktree
`p3-3.17`, gitdir physical path
`<repo-root>/.claude/war-worktrees/ask-disposition-2026-08-25/p3-3.1/`, branch
`war/ask-disposition/p3-3.1` resolving to that exact SHA — matching the audit log's `auditSha`/
`gateHeadSha`): `skills/war/assets/assert-test-in-diff.sh`'s default pattern set is exactly
`skills/**/*.test.mjs` and `**/*.test.sh` (verified in the script header and `match_default`).
A release task's Files list — `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`,
`README.md`, `CHANGELOG.md` — matches neither pattern, so the floor deterministically exits 1 and
`agents/war-refiner.md` merge-task step 4 returns `status: "no-test"`: the refiner does **not**
merge, and the engine routes a bounded fix-worker + full re-audit sub-loop off the shared
`roundLimit` (6; exhaustion is a HARD escalation reason, per `ef5b98b`).

**Why this is not a plan deviation:** `requiresTest` is a plan/dispatch attribute, and a
release-only task's Files list is closed by the plan's own authoring — the tension lives entirely
inside the plan slice's own fields, not in what the worker delivered. The worker's diff matched the
Files list, the four-slot bump, the in-place `## Status` replacement, and the appended CHANGELOG
entry exactly.

**Precedent (2026-08-24, `authoring-side-verification` plan, Task 4.1):** the identical slice shape
— same four release files, `requiresTest: true` — resolved in exactly **one** fix round: bump
commit `e0e72ad` (four files, no test) → `ac96685` `test(release): guard the release-commit prose
halves` (+43 lines in `version-slots.test.mjs`) → landed, on the same tracking issue (#1661). So the
consequence of this shape is a deferred merge plus one round of six, with a deterministic,
precedented resolution — a cost, never an unsound land, no test erosion, no incorrect release.

**New wrinkle this occurrence (`ask-disposition` phase 3, task 3.1, 2026-08-25):** unlike the
`#1661` precedent, the release-shape guards a fix round would normally add (Status
replace-in-place + CHANGELOG newest-first assertions) **already exist** in
`version-slots.test.mjs`, landed by `ac96685` one release ago. A second no-test round on this exact
shape therefore has no obvious *new* substantive test to author, and risks becoming a token/
make-work edit purely to satisfy the diff floor — a qualitatively different situation from the
first occurrence, where the fix round produced genuinely new coverage.

**How to apply:**
1. At plan-authoring/Checkpoint time, a release-only task whose Files list is closed and
   structurally test-free should either declare `requiresTest: false` (as sibling doc-only tasks in
   the same plan already do) or explicitly map a real test-side addition into the Files list.
2. If the floor is allowed to fire anyway, direct the resulting fix round at a **genuine** test-side
   addition (new release-prose guards, the `ac96685` shape) — never a token edit whose only purpose
   is to satisfy `assert-test-in-diff.sh`.
3. Before spending a second such round, check whether the guards a first round would have added
   (Status replace-in-place, CHANGELOG ordering/newest-first) already exist — if so, the round is
   likely make-work and the Lead should consider ruling `requiresTest: false` at the Checkpoint
   instead of re-running the same precedented loop for no new coverage.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]] (the `ac96685`-shape
CHANGELOG-ordering test this pattern's fix round would add carries its own coverage gap — no
fixture-driven negative control, recorded as a new bullet there this same phase).
