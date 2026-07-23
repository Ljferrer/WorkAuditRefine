---
name: closure-rationale-infeasibility-claim-needs-code-trace-not-assertion
description: "A phase-close/commit-body rationale that closes a guard-specificity finding by asserting a die arm 'cannot be fixtured' can be wrong — the arm was in fact deterministically reachable by tracing the function's own early-return control flow; verify infeasibility claims by reading the code path, don't accept the assertion"
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
  tags: 
    - war
    - audit-pipeline
    - test-coverage
    - calibration
    - provision-worktrees
  created: 2026-07-22
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-23T06:18:18.768Z
---

# A commit-body "cannot be fixtured" closure claim can be wrong — trace the code path before accepting it

**What happened (code-verified — `skills/war/assets/provision-worktrees.sh`, `cmd_land_advance`,
confirmed at the landed phase-1 tip via the `p1-polish` task worktree,
`.claude/war/wt/2026-07-22-merge-land-resilience-2026-07-22/p1-polish/skills/war/assets/provision-worktrees.sh`
~lines 1095-1137):** task 1.2 added two new `EX_FOREIGN` die arms to `cmd_land_advance`'s wrong-HEAD
precheck: an unresolvable `<new-sha>` (covered by a same-diff test, T2.5c) and an unresolvable
`HEAD` (uncovered). The `assert-guard-specificity-in-diff.sh` floor correctly flagged the
uncovered arm. The phase-close (`p1-polish`) commit closed that queued finding with the rationale
"stays deliberately uncovered ... it needs an unborn-HEAD clone the refiner can never produce" —
citing production-unreachability (true: the refiner always lands from the detached `_refinery`,
which is never on an unborn HEAD) as if it also meant *test-fixture* infeasibility. Reading the
function's actual control flow end to end shows that is false for the test harness: an
`git checkout --orphan` clone against an already-`setup_origin_pair`-seeded origin passes the
git-dir check, passes the `ls-remote` guard (origin holds the seeded ref, non-empty), takes the
`pre_push_origin != new_sha` fall-through past the two early-return arms (already-landed /
no-new-commit), and then deterministically fails `git rev-parse "HEAD^{commit}"` — reaching the
exact `EX_FOREIGN` die in question, dying escalate-class before any push. The gate-audit's own
subsequent pass (`p1-polish` gate-audit) independently confirmed the same code trace and
downgraded the closure to a Minor `follow-up`, not a re-opened Critical.

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
