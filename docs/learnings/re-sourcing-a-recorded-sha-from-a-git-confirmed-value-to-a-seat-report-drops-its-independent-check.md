---
name: re-sourcing-a-recorded-sha-from-a-git-confirmed-value-to-a-seat-report-drops-its-independent-check
description: Moving a recorded SHA from a Git-confirmed field to a seat-reported field silently drops its Git check
metadata:
  node_type: memory
  type: project
  keywords:
    - gate_sha
    - gateHeadSha
    - gitBoundGateSha
    - integration_sha
    - refiner report
    - Git proof
    - merge parents
    - pinOrSentinel
  provenance: code-verified
  slug: re-sourcing-a-recorded-sha-from-a-git-confirmed-value-to-a-seat-report-drops-its-independent-check
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-2 (task 2.1)
  tags:
    - war-engine
    - merge
    - gate-audit
    - security
  created: 2026-10-29
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-10-29T19:14:49.868Z
---

# Re-sourcing a recorded SHA to a seat report drops its Git check

**What happened.** Under fast-forward merges, `landMerged` took `gateHeadSha` from `integration_sha`.
`confirmMerge` already checked `integration_sha` against the Git-read local target.
Plan #2485 (D12) moved task merges to `--no-ff` merge commits.
`integration_sha` became the merge commit, and `gateHeadSha` moved to the new refiner-reported `gate_sha`.
No confirmation arm compared `gate_sha` with Git, so the gate-audit anchor rested on two values from one refiner.
The security seat caught this as a Minor regression.

**The fix that landed.** `gitBoundGateSha` in `skills/war/assets/workflow-template.js` keeps `gate_sha` only if the Git-read second merge parent starts with it.
Otherwise it drops the field, and `landMerged` records the `pinOrSentinel` sentinel (SOFT cannot-confirm).
`confirmMerge` now returns its Git proof, so the caller can read the parents.
The check never holds a task, so it adds no new refusal path.

**Rule.** If a change moves a recorded field from a confirmed source to a seat-reported one, re-check what confirmed it before.
Bind the new field to the Git proof the engine already reads, and degrade to a sentinel on mismatch.
Without that, the field keeps its old trust level in prose but loses it in code.

Related: [[audit-log-finding-can-be-stale-by-land-time]].

Locate-cue: verify still present before acting. Found `gitBoundGateSha` and its two callers in `skills/war/assets/workflow-template.js` at landed tip 9bcc4fa6 (phase 2).
