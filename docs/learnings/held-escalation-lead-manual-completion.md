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
  provenance: code-verified
  slug: held-escalation-lead-manual-completion
  phase: memsub/p1
  originSessionId: 9c57c14a-92ed-4fc9-92d1-27be3d4dbad5
---

When a WAR phase returns `held:escalation` with N−1 tasks already landed to the integration branch and one task escalated on a **real** Major (first verify it against the actual task-branch diff, not the audit log — [[audit-log-finding-can-be-stale-by-land-time]]), the Lead under `--afk` can complete the phase **manually** rather than re-run a whole phase for a trivial fix:

1. Fix on the escalated task branch + add the coupled test the auditor said was missing (the "would land green" gap). Commit on that branch.
2. Get the fix onto the **integration branch**: in the `_refinery` worktree checked out on integration, `git merge --no-ff <task-branch>` (**no rebase** — clean when file-disjoint from the landed tasks). Integration now carries all N tasks.
3. Land the completed integration branch onto the working branch through the **one land primitive** every land uses (ADR 0023 — **no rebase, no raw push**): fetch, re-detach `_refinery` at `origin/<working>`, `git merge --no-ff <integration-tip>`, and run the **FULL gate** on that merge commit (authoritative — [[gate-under-covers-after-cross-branch-merge-new-runner]]): `node --test 'skills/**/*.test.mjs'` + the `*.test.sh` sweep.
4. On a green gate, land via a **single** `provision-worktrees.sh land-advance <working> <merge-sha>` — that one call performs the CAS push, the follower sync, and the phantom-land guard, so there is **no** raw `git push` / `git update-ref` / `git ls-remote` / `--force-with-lease` step.
5. Re-detach `_refinery` off the working branch afterward so the next phase's workflow can check it out.

**Why:** far cheaper than a ~44-min phase re-run for a one-line fix; the full-gate-on-the-land-merge step preserves the refiner's real safety guarantee, and routing the land through the single `land-advance` primitive (ADR 0023) makes the CAS push, follower sync, and phantom-land guard **verified** rather than hand-run — the old raw `--force-with-lease` + `ls-remote` dance was the error-prone part. **How to apply:** only when the Major is genuinely small + fully understood; escalate to the operator only if unresolvable ([[afk-self-adjudicate-escalate-only-if-unresolvable]]). Concrete instance: plan-4 memsub Phase-1 T4 — servitor `keywords:` was top-level but the T1 CLI reads only `metadata.keywords` (BM25 weight 8.0), so it went silently unindexed; fixed by nesting under `metadata:` + a placement guard. See also [[war-phantom-land-reports-success-without-advancing-integration]] — the phantom-land guard `land-advance` now runs makes "confirm the working SHA actually moved" automatic rather than a manual step.
