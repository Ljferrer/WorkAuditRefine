---
name: a-plan-slice-that-edits-claude-md-needs-a-lead-owner-because-the-worker-declines-it
description: "A worker declines a CLAUDE.md edit, so give that slice a Lead owner"
metadata:
  node_type: memory
  type: project
  keywords:
    - CLAUDE.md edit
    - late-fix rejected
    - worker refuses
    - gate comment
    - gate(node-staged) docs
    - README Repository tests
    - polish discarded
    - doc drift
  provenance: agent-unverified
  slug: a-plan-slice-that-edits-claude-md-needs-a-lead-owner-because-the-worker-declines-it
  phase: "2026-11-08-shell-floors-tests-and-lint/phase-1 (p1-latefix-1, p1-polish)"
  tags:
    - war
    - planning
    - docs
    - late-fix
  created: 2026-11-13
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-13T19:01:03.473Z
---

# A worker will not edit CLAUDE.md from a dispatched slice

Late-fix p1-latefix-1 had two edits: a README gate sentence and the CLAUDE.md gate comment.
The worker made the README edit and declined the CLAUDE.md one.
Its commit body said a worker may not change CLAUDE.md on an agent message.
One auditor seat rated the gap Major, so the engine rejected the whole late fix (`late-fix:rejected`).
The README half was lost with it.
The phase-close polish then failed its gate on an unrelated fingerprint flake and was discarded.

**Live result.** At the landed tip neither doc names the staged gate job.
The CLAUDE.md gate comment still says "two bounded pools", and README.md has no `node-staged` text.
Both gaps carry over to the Lead.

**How to apply.**
- Assign a CLAUDE.md edit to the Lead or operator, never to a worker task or late fix.
- Keep a CLAUDE.md edit out of a slice that bundles other edits, so one refusal cannot sink them.

Absence-note: the worker's reason comes from audit rationale, not a read of its card. Verify the worker card's rule before acting. Referents read in the plan's `_refinery` worktree on the integration branch (tip 12fbb132, the source of land merge d2fafed7).

Related: [[audit-tree-fingerprint-d8-row-can-red-under-gate-load-and-discard-a-docs-only-polish]], [[doc-drift-on-a-near-full-budgeted-surface-is-parked-not-fixed-by-late-fix-rounds]].
