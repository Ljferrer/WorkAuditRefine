---
name: test-reframe-can-strand-adjacent-branch-coverage
description: "New short-circuit guard: reframed old test strands old branch"
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

Concrete instance (`provision-worktrees.sh`'s `cmd_land_advance`, this phase): a new pre-push `git ls-remote` guard was added ahead of the push. The old test for "push fails without a `[rejected]` token → `exit 3`" used a broken remote URL fixture. The plan (correctly, and explicitly) reframed that same fixture to prove the new `ls-remote`-failure guard instead — but a broken URL now fails at the `ls-remote` readback and never reaches the push at all, so the old push-error classification branch (still live: reachable when origin **is** reachable via `ls-remote` but the push itself later fails for a non-CAS reason — permission denial, pre-receive hook rejection, mid-flight unreachability) lost its only exerciser. Not a defect (the plan directed the reframe and the branch is unchanged), but it is a **coverage residual** worth naming explicitly rather than silently absorbing into "tests still pass."

A second instance from the same task: two already-landed-branch test cases asserted the correct *outcome* (exit 0, follower reconciled, origin unchanged) but that outcome is identical to the pre-existing no-op-push fallback path — mentally deleting the new already-landed branch still leaves those two cases green. The branch's actual discrimination was pinned by a *different*, genuinely isolating case (a phantom-vs-already-landed sha comparison), not by the cases that read as its "own" tests. This is the same failure shape as [[weak-test-assertion-passes-without-feature-being-exercised]], but the cause here is structural (branch outcome coincides with a sibling path's outcome) rather than a loose assertion.

**How to apply during audit/plan review of a guard-insertion task:** for every test case being *reframed* (not newly written) to prove new logic, ask "does deleting the new guard/branch still leave this case green via some other path?" If yes for the reframed case, and the branch it used to cover is still live code, flag as a Nit/Minor coverage residual — decide `absorb` (add a minimal new fixture) vs `note` (byte-unchanged branch, low production risk) rather than silently trusting "tests still pass."

**Why:** guard-insertion tasks age well on correctness but can quietly erode regression coverage on the branches they route *around* — the erosion is invisible in a green run because nothing fails, it only shows up as an absence of a specific fixture.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]], [[decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome]], [[defined-but-not-yet-emitted-plan-slice-pattern]].

> archived 2026-07-21: resolved — moved to archive
