---
name: test-reframe-can-strand-adjacent-branch-coverage
description: "When a new short-circuit guard reuses the old path's only fixture, the reframed test stops at the guard and the still-live old branch loses its coverage"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - test coverage regression
    - guard insertion
    - short-circuit
    - repurposed test case
    - adjacent branch
    - stranded coverage
    - fixture reuse
    - plan-directed reframe
  provenance: agent-unverified
  slug: test-reframe-can-strand-adjacent-branch-coverage
  phase: land-path-integrity-and-status-enum-discipline/t1.1
  tags: 
    - test-fidelity
    - provision-worktrees
    - audit-pattern
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

When a plan directs inserting a new guard that runs (and can fail/escalate) **before** an existing code path, and also directs repurposing the existing test fixture that used to reach that old path to instead exercise the new guard, check whether that fixture was the **only** test of the old path. The new guard short-circuiting ahead of the old logic means the reframed test now stops at the guard and never reaches the old branch — even though the old branch is byte-unchanged, still live, and still reachable in production whenever the new guard's precondition doesn't trip (e.g. the guard's own gate passes but the old classification later fails for an unrelated reason).

Concrete instance (`provision-worktrees.sh`'s `cmd_land_advance`): a new pre-push `git ls-remote` guard was added ahead of the push, and the plan reframed the old broken-remote-URL fixture to prove it. A broken URL now fails at `ls-remote` and never reaches the push, so the old push-error branch (`exit 3`, still live when origin is reachable but the push fails for a non-CAS reason) lost its only exerciser. Not a defect, but a **coverage residual** worth naming.

A related shape, where a branch's outcome coincides with a sibling path's outcome, is [[weak-test-assertion-passes-without-feature-being-exercised]].

**How to apply during audit/plan review of a guard-insertion task:** for every test case being *reframed* (not newly written) to prove new logic, ask "does deleting the new guard/branch still leave this case green via some other path?" If yes for the reframed case, and the branch it used to cover is still live code, flag as a Nit/Minor coverage residual — decide `absorb` (add a minimal new fixture) vs `note` (byte-unchanged branch, low production risk) rather than silently trusting "tests still pass."

**Why:** guard-insertion tasks age well on correctness but can quietly erode regression coverage on the branches they route *around* — the erosion is invisible in a green run because nothing fails, it only shows up as an absence of a specific fixture.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]], [[decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome]], [[defined-but-not-yet-emitted-plan-slice-pattern]].

> archived 2026-07-21: resolved — moved to archive
