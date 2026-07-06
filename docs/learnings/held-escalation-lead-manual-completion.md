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
2. Rebase the task branch onto the **integration tip** (clean when file-disjoint from the landed tasks).
3. Run the **FULL gate** on the integrated tree (authoritative — [[gate-under-covers-after-cross-branch-merge-new-runner]]): `node --test 'skills/**/*.test.mjs'` + the `*.test.sh` sweep.
4. `git merge --ff-only <task-branch>` into integration (in the `_refinery` worktree); push integration.
5. Land integration → working branch via **push-first CAS**: `git push origin <int-tip>:refs/heads/<working> --force-with-lease=<working>:<current-working-sha>`. Verify remote moved (`git ls-remote`), then sync the local ref.
6. Detach `_refinery` off the working branch afterward so the next phase's workflow can check it out.

**Why:** far cheaper than a ~44-min phase re-run for a one-line fix; the full-gate-on-integrated-tree step preserves the refiner's real safety guarantee. **How to apply:** only when the Major is genuinely small + fully understood; escalate to the operator only if unresolvable ([[afk-self-adjudicate-escalate-only-if-unresolvable]]). Concrete instance: plan-4 memsub Phase-1 T4 — servitor `keywords:` was top-level but the T1 CLI reads only `metadata.keywords` (BM25 weight 8.0), so it went silently unindexed; fixed by nesting under `metadata:` + a placement guard. See also [[war-phantom-land-reports-success-without-advancing-integration]] (always confirm the working SHA actually moved).
