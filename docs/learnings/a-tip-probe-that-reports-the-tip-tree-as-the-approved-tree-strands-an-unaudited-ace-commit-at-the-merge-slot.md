---
name: a-tip-probe-that-reports-the-tip-tree-as-the-approved-tree-strands-an-unaudited-ace-commit-at-the-merge-slot
description: A tip probe that echoes the tip tree as approved_tree strands an unaudited ace commit
metadata:
  node_type: memory
  type: project
  keywords:
    - tip-probe
    - approved_tree
    - pre_tree
    - tree-mismatch
    - ace re-entry
    - branch tip carries content committed after approval
    - pin-transfer
    - mirror misread
  provenance: code-verified
  slug: a-tip-probe-that-reports-the-tip-tree-as-the-approved-tree-strands-an-unaudited-ace-commit-at-the-merge-slot
  phase: "2026-11-08-doc-truth-drift-and-adr-hygiene/phase-2 (task 2.1, held:escalation); fix landed phase-3 (task 3.2); mirror ruling landed phase-4 (seed-1); recurrence phase-4 (task 4.5, held:escalation)"
  tags:
    - engine
    - ace
    - pin-transfer
    - tip-probe
  created: 2026-11-12
  modified: 2026-11-12T22:26:03.389Z
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
---

**Observed (phase 2, task 2.1).** The panel approved 75775f7c. An ace re-entry commit 28d5178c (`Ace-Charge: 2.1:3`, `Ace-Subset: 2.1:reentry:a3:...`) then landed on the task branch.
The re-entry tip probe returned `pre_sha` 75775f7c and `pre_tree` 1085b5f8, but `approved_tree` d2134cee.
d2134cee is the tip tree, not the approved tree. The pin-transfer proof read the approved tree from Git as 1085b5f8.
The merge slot then held the task with `pin-transfer:tree-mismatch` and the note "branch tip carries content committed after approval".

**Recurrence (phase 4, task 4.5).** The same shape came back. The panel approved 730af3bb (tree 370ca495). An ace commit 54889658 (`Ace-Charge: 4.5:1`) landed on top.
The escalation's `tipProbe` record shows `pre_sha` 730af3bb, `pre_tree` 370ca495, and `approved_tree` 928ef224, which equals `tip_tree`.
Pin-transfer again read `approved_tree` 370ca495 from Git and held the task with `pin-transfer:tree-mismatch`. Task 4.5 never merged, so the phase held.
So the helper misread is a recurring failure, not a one-off.
Hypothesis (agent-unverified): the recorded `tipProbe` may be the raw reply before the `sameCommit` correction, or the running engine may predate it. The input does not say which.

**Engine mechanics.**
- `tipClass` in `skills/war/assets/workflow-template.js` classes a probe as `unchanged` when `tip_tree === approved_tree`, even when `count` > 0.
- At the re-entry arm, a non-`moved` class abandons the batch to the sweep and charges nothing.
- `tipStranded` registers no merge-slot revert when `tip_tree === approved_tree`.
- So one wrong `approved_tree` value leaves a real commit on the branch with no re-audit and no revert. Only the pin-transfer tree clause (`verifyPinTransfer`) catches it.

**Root cause: verified by the Lead (2026-11-12, phase 2).** The probe prompt carried `APPROVED=75775f7c`, the same commit as `PRE`.
The probe agent's transcript shows it never ran `git show -s --format=%T` on APPROVED. It returned the tip tree in that field.
So the engine argument was right, and the helper misread. The engine trusted a self-inconsistent reply: equal pre and approved shas must give equal trees.

**Fix (phase 3, task 3.2, refined phase 4, seed-1).** In `tipProbe`, a `sameCommit` check fires when APPROVED and PRE name one commit but the two trees differ.
RESOLVED mirror residual: operator ruling 2026-11-12 (phase 3 Checkpoint) says fail toward `moved`. ADR 0054 § 1 records it.
The tree that differs from `tip_tree` wins. If both differ, `pre_tree` wins.
The log names the winner and the reason ("because approved_tree equals tip_tree", "because pre_tree equals tip_tree", or "because both differ from tip_tree").
The phase-3 rule always trusted `pre_tree`, so a mirror misread (pre_tree echoes the tip tree) could class a moved tip `unchanged`. The ruling closes that gap.
Test gap at land: the tip-probe test in `skills/war/assets/workflow-template.engine-1.test.mjs` asserts the reason text only on the mirror row (audit Nit, absorb). Check whether a later commit added the other two reason asserts.

**Lead recovery.** This hold is a held:escalation with an approved pin and an unaudited ace commit on top. See [[held-escalation-lead-manual-completion]] and [[turning-an-always-hold-signal-into-a-fix-route-stales-every-reader-that-assumed-it-held]].

**Grounding note.** Phase 4 held at a5a30fe5 on `integration/2026-11-08-doc-truth-drift-and-adr-hygiene/phase-4`, and the Lead landed it by hand at a31facc4. The run-scoped `_refinery` worktree HEAD equaled that tip (rung 2). The `sameCommit` block and its "fail toward moved" log were found in `tipProbe` there. Verify still present before acting.
