---
name: retrofit-site-existing-tests-as-regression-guard
metadata:
  node_type: memory
  type: project
  keywords: [shared predicate, dispatch site, redundant test, test scoping, coverage waiver, delete-the-branch check, no new test needed]
  slug: retrofit-site-existing-tests-as-regression-guard
  phase: fix-worker-result-binding/p2-t2
  date: 2026-06-29
  tags:
    - testing
    - retrofit
    - plan-scoping
    - workflow-template
  related: "[[weak-test-assertion-passes-without-feature-being-exercised]] [[verify-task-no-op-is-correct-when-already-covered]]"
  originSessionId: fa4a98d9-e917-4fc2-8838-f98e4a473a1a
---

# Retrofit dispatch site covered by shared predicate needs no dedicated behavioral test

## What happened

Phase `fix-worker-result-binding/p2` applied the `blockedReason` predicate fix to three
dispatch sites (verify still present before acting in `skills/war/assets/workflow-template.js`):

- **Site 1** (fix-worker escalation path): new L3 behavioral test written (TEST 2).
- **Site 2** (fix-worker blocked result binding): new L3 behavioral test written (TEST 1).
- **Site 3** (M2 no-test add-test-worker escalation): retrofit — no new behavioral test.

Site 3 is a **retrofit**: the new branch mirrors the existing vacuous-re-audit escalation
pattern already present at an adjacent site, and the shared predicate is the only change.
The plan explicitly labeled Site 3 a "retrofit," scoped behavioral tests to Sites 1 and 2
only, and identified the existing M2 no-test tests as the regression guard (they exercise
the code path by passing implemented add-test workers, so the new branch is skipped —
confirming behavior preservation).

The audit approved this as plan-faithful.

## The pattern

When a fix is applied to multiple dispatch sites via a **shared predicate**:

1. Sites that introduce a NEW behavior path → require a behavioral test (drives the new
   branch RED before the fix, GREEN after).
2. Sites that merely apply the same predicate to an already-correct branch structure
   (the "retrofit" sites) → existing tests that exercise the old path already serve as
   regression guards. A dedicated behavioral test is redundant unless the plan explicitly
   requires it.

## When to add the behavioral test anyway

- The retrofit site has a meaningfully different caller context (different worker type,
  different result shape) that existing tests do not exercise.
- The plan's §7 test table or validation criteria explicitly list the retrofit site.
- An auditor flags the absence as a plan deviation (not merely a Nit).

## Caution

Calling a site a "retrofit" to avoid writing a test when the branch logic is actually
novel is a smell. The check: can a reader point to a specific existing test case that
would FAIL if the new branch were deleted? If yes, the label is legitimate.

> archived 2026-07-21: resolved — moved to archive
