---
name: zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged
description: "A zero-commit task branch is vacuously an ancestor of the tip, so derive-and-skip falsely records it merged; check the commit count"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged
  phase: "2026-08-27-in-run-finding-resolution/phases 1-3 (landed dev/2026-08-27-in-run-finding-resolution, tip ec0b920); addendum 2026-08-30-engine-concurrency-and-pin-transfer/phase-2 task 2.2 (landed dev/2026-08-30-engine-concurrency-and-pin-transfer, tip ad440fc0); engine bug #1895"
  keywords: 
    - derive-and-skip
    - preMerged
    - recovery relaunch
    - zero-commit branch
    - merge-base --is-ancestor
    - vacuous ancestor
    - phantom merged task
    - reconcile toward git
    - silent no-op release
    - recovered pre-merged
    - missing ADR
    - task 2.2
    - End-state unverified not unmet
    - rev-list --count guard absent
    - sanctioned recovery relaunch
  originSessionId: fddd64d3-2c2c-400e-b891-9b7b75dcd158
  modified: 2026-08-30T14:48:17.863Z
---

**Rule:** `git merge-base --is-ancestor <task-branch> "$TIP"` is vacuously true for a branch sitting at the
phase base with no commits. A task that dep-failed or never dispatched in an earlier attempt leaves exactly
that branch. A sanctioned recovery relaunch's derive-and-skip then reports it `preMerged`, the handoff lists
it in `landed[]`, the ledger records `merged`, and the Lead closes its issue, while the deliverable does not
exist anywhere in the window. A gate-audit does not catch it when every needle it checks belongs to a task
that really landed.

**Still open (#1895):** the `deriveSkipClause` in `skills/war/assets/workflow-template.js` (search
`SANCTIONED RECOVERY RELAUNCH — derive-then-cut`) still gates only on `merge-base --is-ancestor`; the barrier
`preMerged` intake has no commit-count check. A partial guard exists only on the merge-slot pin-transfer
path: an empty post-rebase diff with zero task commits fails closed as `empty-unmatched` (#1931).

**Fix shape:** derive-and-skip must also require `git rev-list --count <base>..<branch>` > 0 before deriving
`preMerged`; a zero-commit branch takes the fresh-run path. Pair it with a phase-level assertion that every
task the handoff reports `landed` contributed at least one commit to the integration range.

**How to apply until it lands:**
- Before trusting any relaunch's `preMerged` set, or any `recovered:pre-merged` audit-log verdict, run
  `git rev-list --count <base>..<branch>` for each skipped task and diff the window for its `Files:`.
- Delete stale zero-commit task branches before relaunching; that removes the vacuous input entirely.
- Reconcile toward git at Checkpoint (ADR 0008): a ledger claim git cannot corroborate is the only detection
  seen so far.
- An End state a gate-audit records `unverified` (scoped out of another task's attestation) is not evidence
  the artifact exists.

**Why it matters:** the degenerate case is a release-bump task whose phase lands with an empty diff on the
four version slots (the CLAUDE.md-named silent no-op release), or an ADR-authoring task whose ADR never
appears.

Recurrences: 3 in two runs (2026-08-27-in-run-finding-resolution tasks 1.2, 1.3, 2.1;
2026-08-30-engine-concurrency-and-pin-transfer task 2.2, where a `p2-polish` gate-audit raised an `ask` naming
the gap, but the discarded terminal polish round drained no queue, see
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]]).
