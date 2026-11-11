---
name: the-per-task-gate-log-is-stamped-with-the-merge-second-parent-never-the-confirmed-tip
description: "A per-task gate log carries the merge's second parent, never the confirmed tip"
metadata:
  promoted: dev/2026-11-08-engine-findings-ace-and-late-fix@phase-2
  node_type: memory
  type: project
  keywords:
    - CONFIRMED TIP
    - confirmedTipLine
    - lastLandedTip
    - gateHeadSha
    - tip_sha stamp
    - gate log
    - second parent
    - SOFT cannot-confirm
  provenance: code-verified
  slug: the-per-task-gate-log-is-stamped-with-the-merge-second-parent-never-the-confirmed-tip
  phase: "2026-11-08-engine-findings-ace-and-late-fix/phase-2 (task 2.1), landed cebb1d4d0a7826952f241b91d1c76a3197b140bf"
  tags:
    - war
    - workflow-template
    - gate-audit
    - end-state
    - evidence
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T23:56:57.462Z
---

# The per-task gate log never carries the confirmed tip

`lastLandedTip` is set from `mr.integration_sha`, the `--no-ff` merge commit.
The per-task gate log is stamped with `gateHeadSha`, the merge commit's second parent.
A merge commit never equals its own second parent.

## What went wrong in task 2.1

The first D28 cut of `confirmedTipLine` said "compare each artifact's stamped tip_sha against this literal".
`gate-audit-checklist.md` said the same.
On the per-task seat that rule reads every gate log as tip-mismatched.
Under the execution rung, a mismatched gate log is SOFT cannot-confirm, never HARD.
So the rule quietly disabled the HARD lane of the per-task gate-audit seat.
Two seats raised it as a Major.

The fix round scoped the line to End-state check artifacts (`endstate-<phase>-<n>.log`).
It also says a gate log stays judged against the sha its gate ran at.

## How to apply

- If you add a tip compare to a gate-audit-family prompt, name the artifact kind it applies to. Never write "each artifact".
- A gate log is judged against its gated sha (PIN STATUS gate-HEAD). An End-state check artifact is judged against the confirmed tip.
- Keep the prompt and the checklist twin in the same words.

Related: [[standing-instruction-vs-dispatched-prompt-coverage-split]].

**Locate-cue (verify still present before acting):** found in `skills/war/assets/workflow-template.js` at `const confirmedTipLine` @ phase 2. Read via the run-scoped `_refinery` worktree, whose HEAD equals the landed tip.
