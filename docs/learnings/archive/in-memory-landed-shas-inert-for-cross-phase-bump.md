---
name: in-memory-landed-shas-inert-for-cross-phase-bump
description: "RESOLVED: an in-memory accumulator cannot feed a later phase invocation; cross-phase SHAs must come from the ledger"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords:
    - landedShas
    - in-memory accumulator
    - cross-phase SHA
    - ledger
    - gitlink bump
    - one phase per invocation
  slug: in-memory-landed-shas-inert-for-cross-phase-bump
  phase: submod-inc2/T4 (analysis); hygiene-sweep/T4 (removal LANDED at 134c39f, 2026-07-01)
  tags: 
    - workflow-template
    - submodule
    - gitlink-bump
    - cross-phase
    - ledger
    - architecture
    - audit-fidelity
  created: 2026-06-30
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
---

# landedShas was inert cross-phase; RESOLVED — dropped, ledger is the SHA source

Durable rule: the template runs one phase per invocation, so an in-memory accumulator populated in one REFINE loop can never feed a later invocation's dispatch. Cross-phase SHA dependencies must read the external ledger (war-worker.md T7) — see [[template-defers-runtime-values-to-agent-via-literal-placeholder]].

To verify a deletion at the committed tip, not in a worktree, see [[audit-worktree-pre-impl-tip-stale-verdict]].

Fixed/landed: the inert `landedShas` Map was dropped in hygiene-sweep/T4 @ `134c39f` (v0.8.11); the gitlink-bump dispatch now emits the `'<dep-submodule-landed-sha>'` placeholder resolved from the ledger. Nothing to act on — anchor/history record.

**Why:** trusting in-memory state across invocations turns real cross-phase data flow into silent fallbacks.
**How to apply:** route cross-invocation state through the ledger.

Related: [[land-local-follower-ref-can-lag-sync-before-next-phase]], [[war-phantom-land-reports-success-without-advancing-integration]], [[audit-worktree-pre-impl-tip-stale-verdict]]

> archived 2026-07-04: resolved — moved to archive
