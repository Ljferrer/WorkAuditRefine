---
name: closure-rationale-infeasibility-claim-needs-code-trace-not-assertion
description: "A closure rationale that waives a coverage gap as 'cannot be fixtured' can be wrong; trace the function's own early-return control flow before accepting it"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: closure-rationale-infeasibility-claim-needs-code-trace-not-assertion
  phase: "merge-land-resilience/phase-1 (p1-polish, phase-close queue finding 3)"
  keywords: 
    - infeasibility claim
    - closure rationale
    - guard-specificity floor
    - assert-guard-specificity-in-diff.sh
    - EX_FOREIGN
    - unresolvable HEAD
    - cmd_land_advance
    - provision-worktrees.sh
    - orphan HEAD fixture
    - unborn branch
    - waived in a commit body
    - verify before dismissing
    - T2.5d
    - land-advance-exit-contract-truth
    - RESOLVED
  tags: 
    - war
    - audit-pipeline
    - test-coverage
    - calibration
    - provision-worktrees
  created: 2026-07-22
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-24T20:52:43.986Z
---

# A commit-body "cannot be fixtured" closure claim can be wrong — trace the code path before accepting it

**What happened:** task 1.2 added an `EX_FOREIGN` die arm for an unresolvable `HEAD` to
`cmd_land_advance` in `skills/war/assets/provision-worktrees.sh`, with no test. The
`assert-guard-specificity-in-diff.sh` floor flagged it. The phase-close commit waived it as needing
"an unborn-HEAD clone the refiner can never produce" — true for production, false for tests. A
`git checkout --orphan` clone against a seeded origin reaches that exact die deterministically.
The gate-audit confirmed the trace and downgraded the closure to a Minor `follow-up`.

**The pattern:** production-unreachability ("the refiner will never invoke this from an unborn-HEAD
cwd") and test-fixture-infeasibility ("this cannot be exercised by a unit test") are two different
claims. A commit body — or any adjudication prose — asserting the second while only having
established the first is exactly the CLAUDE.md "verify a limitation binds before asserting it" trap:
a recorded/asserted "can't" needs to be checked against the actual construct (here: trace the
function's own early-return arms) before it is trusted, especially when it is being used to *waive*
a floor-flagged gap rather than fix or explicitly defer it in the plan's own Deferred-validations
section.

**How to apply:** before accepting (or writing) a closure rationale that waives a coverage/guard
gap as "infeasible to fixture," trace the actual function/branch reachability yourself (Read the
early-return arms, don't just read the die message) — if a normal fixture combination reaches the
arm, the correct move is either add the one-line test case or record the gap honestly in the plan's
Deferred validations section, never silently waive it in prose that oversells the reason.

Related: [[deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold]] (the legitimate
"cannot be fixtured" family — a real, structural evidence ceiling, unlike this false claim).

## RESOLVED — land-advance-exit-contract-truth Phase 1, Task 1.2 (#1036, 2026-07-24)

Case **T2.5d** in `skills/war/assets/provision-worktrees.test.sh` now fixtures the orphan-HEAD arm and asserts exit `3` with the `could not resolve HEAD to a commit` die substring.
The general pattern above stays the durable part; only this one follow-up debt item is closed.

> archived 2026-08-15: resolved — moved to archive
