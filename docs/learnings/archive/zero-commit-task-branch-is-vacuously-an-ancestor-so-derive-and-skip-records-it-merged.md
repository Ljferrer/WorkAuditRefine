---
name: zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged
description: "RESOLVED (#1895, then ADR 0054): a zero-commit task branch is vacuously an ancestor of the tip, so an ancestor check alone falsely records it merged; prove merges from a merge commit"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged
  phase: "2026-08-27-in-run-finding-resolution/phases 1-3; addendum 2026-08-30-engine-concurrency-and-pin-transfer/phase-2 task 2.2; engine bug #1895"
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
    - rev-list --count guard
    - sanctioned recovery relaunch
  originSessionId: fddd64d3-2c2c-400e-b891-9b7b75dcd158
  modified: 2026-09-07T00:00:00.000Z
---

**Rule:** `git merge-base --is-ancestor <task-branch> "$TIP"` is vacuously true for a branch sitting at the
phase base with no commits. A task that dep-failed or never dispatched in an earlier attempt leaves exactly
that branch. A sanctioned recovery relaunch's derive-and-skip then reports it `preMerged`, the handoff lists
it in `landed[]`, the ledger records `merged`, and the Lead closes its issue, while the deliverable does not
exist anywhere in the window. A gate-audit does not catch it when every needle it checks belongs to a task
that really landed.

**Resolved (2026-09-06, #1895):** Task 6.1 of the 2026-09-06-engine-and-audit-verdict-integrity plan
(D9, PIN-13) added the `git rev-list --count <base>..<branch>` > 0 conjunct to the `deriveSkipClause` in
`skills/war/assets/workflow-template.js` beside `merge-base --is-ancestor`; a zero-commit branch took the
ordinary ensure-worktree path with a loud classification log. Its residual: the count's base was the
integration branch's fork point off the working branch, so a zero-commit branch cut at a later relaunch's
adopted tip counted its siblings' fast-forwarded commits and was not caught.

**Note (2026-10-30, merge-commit rule, #2485):** the derive-and-skip proof is now merge-commit
provenance (ADR 0054): `task-integrated.sh` proves a task from a first-parent merge commit whose `WAR-Task`
trailer names it and whose second parent is its tip, so a zero-commit branch has no such commit and is never
reported merged. That also closes the residual above, and the `rev-list --count` conjunct is no longer the
proof.

**How to apply:**
- Never prove a task merged from ancestry alone; a zero-commit branch is an ancestor of every tip.
- Reconcile toward git at Checkpoint (ADR 0008): a ledger claim git cannot corroborate is a red flag.
- An End state a gate-audit records `unverified` (scoped out of another task's attestation) is not evidence
  the artifact exists.

**Why it matters:** the degenerate case is a release-bump task whose phase lands with an empty diff on the
four version slots (the CLAUDE.md-named silent no-op release), or an ADR-authoring task whose ADR never
appears.

Related: [[full-dag-relaunch-of-already-merged-task-content-escalates-empty-unmatched]],
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]].

> archived 2026-10-30: resolved — moved to archive
