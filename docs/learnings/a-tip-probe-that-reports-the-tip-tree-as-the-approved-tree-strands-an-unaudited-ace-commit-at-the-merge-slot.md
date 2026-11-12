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
  phase: "2026-11-08-doc-truth-drift-and-adr-hygiene/phase-2 (task 2.1, held:escalation); fix landed phase-3 (task 3.2)"
  tags:
    - engine
    - ace
    - pin-transfer
    - tip-probe
  created: 2026-11-12
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-12T12:17:09.089Z
---

**Observed (phase 2, task 2.1).** The panel approved 75775f7c. An ace re-entry commit 28d5178c (`Ace-Charge: 2.1:3`, `Ace-Subset: 2.1:reentry:a3:...`) then landed on the task branch.
The re-entry tip probe returned `pre_sha` 75775f7c and `pre_tree` 1085b5f8, but `approved_tree` d2134cee.
d2134cee is the tip tree, not the approved tree. The pin-transfer proof read the approved tree from Git as 1085b5f8.
The merge slot then held the task with `pin-transfer:tree-mismatch` and the note "branch tip carries content committed after approval".

**Engine mechanics.**
- `tipClass` in `skills/war/assets/workflow-template.js` classes a probe as `unchanged` when `tip_tree === approved_tree`, even when `count` > 0.
- At the re-entry arm, a non-`moved` class abandons the batch to the sweep and charges nothing.
- `tipStranded` registers no merge-slot revert when `tip_tree === approved_tree`.
- So one wrong `approved_tree` value leaves a real commit on the branch with no re-audit and no revert. Only the pin-transfer tree clause (`verifyPinTransfer`) catches it.

**Root cause: verified by the Lead (2026-11-12).** The probe prompt carried `APPROVED=75775f7c`, the same commit as `PRE`.
The probe agent's transcript shows it never ran `git show -s --format=%T` on APPROVED. It returned the tip tree in that field.
So the engine argument was right, and the helper misread. The engine trusted a self-inconsistent reply: equal pre and approved shas must give equal trees.

**Fix landed (phase 3, task 3.2).** In `tipProbe`, a `sameCommit` check now sets `approved_tree` to `pre_tree` when the two differ, and logs "a misread". ADR 0054 § 1 records the rule.

**Open residual: the mirror misread.** The fix always trusts `pre_tree`. If a probe misreads `pre_tree` as the tip tree and reads `approved_tree` correctly, the fix copies the tip tree into `approved_tree`.
`tipClass` then returns `unchanged`, and the ace commit gets no re-audit: the same failure the fix meant to remove.
Before the fix, that case classed `moved`, the safe direction. A correctness seat raised it as an `ask`: trust the tree that differs from `tip_tree`, so the rule fails toward `moved`.
The plan pinned `pre_tree` as the winner, so the ask needs an operator ruling. Check the issue tracker for its status before relying on either rule.
Only `verifyPinTransfer` still catches the mirror case.

**Lead recovery.** This hold is a held:escalation with an approved pin and an unaudited ace commit on top. See [[held-escalation-lead-manual-completion]] and [[turning-an-always-hold-signal-into-a-fix-route-stales-every-reader-that-assumed-it-held]].

**Grounding note.** Phase 3 landed at beab0ad2 on `dev/2026-11-08-doc-truth-drift-and-adr-hygiene`. The run-scoped `_refinery` worktree HEAD equaled that tip (rung 2). The `sameCommit` block was found in `tipProbe` there. Verify still present before acting.
