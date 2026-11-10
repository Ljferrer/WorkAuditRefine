---
name: a-file-claim-may-end-only-where-the-merge-slot-can-drop-the-claiming-commit-and-its-revert
description: A polish file claim ends only where the merge slot can drop the claim commit and its revert
metadata:
  node_type: memory
  type: project
  keywords:
    - polish claim
    - releaseClaims
    - keepClaims
    - net-zero clash range
    - forward revert replay
    - same-file clash
    - claim lifecycle
    - D19
  provenance: code-verified
  slug: a-file-claim-may-end-only-where-the-merge-slot-can-drop-the-claiming-commit-and-its-revert
  phase: 2026-11-08-engine-findings-ace-and-late-fix/phase-5 (task 5.1)
  tags:
    - engine
    - ace
    - polish
    - merge-slot
    - claims
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-10T07:17:50.659Z
---

# A file claim may end only where the merge slot can drop the claiming commit and its revert

D19 (ADR 0061) lets the first same-wave polish commit claim an unlisted file.
Later peers see the claimed file in their FIX-ROUND FENCE line.
A forward revert keeps the claiming commit and its revert on the branch.
So "the claimant's commit was reverted" does not mean "the commit is gone".

Task 5.1 needed two fix rounds because the release point was wrong twice.

1. Round 0 released a claim when its sha differed from the current approved sha.
   A later approved ace moves the approved sha past a still-approved claim commit.
   The claim then ended while its commit still merged.
   Fix: `keepClaims(r, aceSha)` marks a claim approved in the batch approve arm, and a kept claim never ends.
2. Round 1 still released claims inside `aceRevertDispatch` (the in-loop revert before a bisection subset or re-entry).
   The claim pair then sat below later approved work.
   The net-zero step (`netZeroScript`) drops only a range of exactly the clash commit plus its revert above the approved sha.
   So the buried pair replayed onto the peer's merged line at pin transfer.
   Different edits: a conflict hold of an approved task.
   Identical edits: git drops the claim commit as already upstream, and its revert silently deletes the peer's line.
   Fix: `releaseClaims` runs once, at the end of the ace stage.
   It ends a claim only if it is not approved, has `count === 1`, and equals the registered range revert tip (`rangeRevertOf(r).tip`).

General rule: any lock or claim release must sit at the one place where the downstream cleanup can handle the released state.
Before you add a release call, trace what the merge slot does with the commits that stay on the branch.
A conservative residual (the file stays claimed, or the full rebase runs with NET-ZERO-KEPT) is safe.
A release the cleanup cannot match is not safe.

Locate-cue: verify still present before acting — found `polishClaims`, `keepClaims`, `releaseClaims`, `registerRangeRevert`, `netZeroScript` and `clashRec` in `skills/war/assets/workflow-template.js` @ phase 5 landed tip 924df66a (read in the run's `_refinery` worktree, whose HEAD equals that tip).
The engine-1 fixture is `polish claim: a claim ends only when the merge slot can drop its pair` in `skills/war/assets/workflow-template.engine-1.test.mjs`.

Related: [[a-new-merge-and-reaudit-pass-must-copy-every-duty-its-sibling-sites-carry]], [[phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings]].
