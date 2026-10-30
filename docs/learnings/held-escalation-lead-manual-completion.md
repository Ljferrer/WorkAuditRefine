---
name: held-escalation-lead-manual-completion
description: "held:escalation + 1 Major = Lead manual complete"
metadata:
  node_type: memory
  type: project
  keywords:
    - held-escalation
    - manual-land
    - refiner-bypass
    - afk-adjudication
    - integration-merge
    - CAS-land
    - escalated-task
    - round 0
    - fixRounds 0
    - panel split
    - D17
  provenance: code-verified
  slug: held-escalation-lead-manual-completion
  phase: "memsub/p1 + 2026-09-06-engine-and-audit-verdict-integrity/phase-10 (task 10.1, recurrence)"
  originSessionId: 9c57c14a-92ed-4fc9-92d1-27be3d4dbad5
  created: 2026-09-08
  modified: 2026-09-08T17:14:23.094Z
---

When a WAR phase returns `held:escalation` with N−1 tasks already landed to the integration branch and one task escalated on a **real** Major (first verify it against the actual task-branch diff, not the audit log — [[audit-log-finding-can-be-stale-by-land-time]]), the Lead under `--afk` can complete the phase **manually** rather than re-run a whole phase for a trivial fix. `skills/war/references/resume-and-recovery.md` ("Escalation-completion land") names this lesson as the canonical recipe:

1. Fix on the escalated task branch + add the coupled test the auditor said was missing (the "would land green" gap). Commit on that branch.
2. Get the fix onto the **integration branch**: in the `_refinery` worktree checked out on integration, make the task merge commit in two steps — `git -c core.hooksPath=/dev/null merge --no-ff --no-commit <task-branch>`, then `git -c core.hooksPath=/dev/null commit --no-verify -m "<subject>" --trailer "WAR-Task: <task-branch>"` (**no rebase** — clean when file-disjoint from the landed tasks). The trailer on that merge commit is the task's merge-commit provenance: a later recovery relaunch proves the task merged from it (ADR 0054), and a bare `git merge --no-ff <task-branch>` leaves no such proof. Integration now carries all N tasks.
3. Land the completed integration branch onto the working branch through the **one land primitive** every land uses (ADR 0023 — **no rebase, no raw push**): fetch, re-detach `_refinery` at `origin/<working>`, `git merge --no-ff <integration-tip>`, and run the **resolved gate** on that merge commit (authoritative — [[gate-under-covers-after-cross-branch-merge-new-runner]]).
4. On a green gate, land via a **single** `provision-worktrees.sh land-advance <working> <merge-sha>`, run from the detached `_refinery` — that one call performs the CAS push, the follower sync, and the phantom-land guard, so there is **no** raw `git push` / `git update-ref` / `git ls-remote` / `--force-with-lease` step.
5. Close with `provision-worktrees.sh sync-follower <working>` (a closing assertion, not a load-bearing sync), then re-detach `_refinery` off the working branch so the next phase's workflow can check it out.

**Why:** far cheaper than a ~44-min phase re-run for a one-line fix. The gate on the land merge preserves the refiner's real safety guarantee, and the single `land-advance` makes the CAS push, follower sync, and phantom-land guard **verified** rather than hand-run — see [[war-phantom-land-reports-success-without-advancing-integration]]. Concrete instance: plan-4 memsub Phase-1 T4 — servitor `keywords:` was top-level but the T1 CLI reads only `metadata.keywords`, so it went silently unindexed; fixed by nesting under `metadata:` + a placement guard.

**How to apply:** only for an implementation defect where the Major is genuinely small + fully understood. A plan-shaped escalation (`PLAN-DEFECT:`, or a seat's `escalate_reason`) goes to a `/red-team` plan amendment instead. Escalate to the operator only if unresolvable ([[afk-self-adjudicate-escalate-only-if-unresolvable]]).

**The round-0 gap is fixed.** Task 10.1 of `2026-09-06-engine-and-audit-verdict-integrity` escalated at round 0 on a 3-Minor/1-Major panel split, and the Lead used this recipe. Details: [[audit-panel-unanimity-beats-majority-and-round0-escalation-is-a-known-pre-phase-11-gap]]. The engine now runs a rebuttal round, then a fix round when all surviving blockers carry a concrete `suggested_fix`, then a full-roster re-audit (PIN-29). So a fix-having Major no longer needs this recipe. It still applies when a fix-less blocker, an unchanged survivor after a fix round, or round-budget exhaustion holds the task.
