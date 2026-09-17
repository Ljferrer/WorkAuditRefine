---
name: budget-hotfix-crossing-prompt-literal-hard-line-forward-reverts-unrelated-ace-commit
description: A hotfix that grows a budgeted prompt literal can gate-red and discard an unrelated ace commit
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: budget-hotfix-crossing-prompt-literal-hard-line-forward-reverts-unrelated-ace-commit
  phase: 2026-09-11-backward-chain-doctrine/phase-1
  keywords: 
    - WORKFLOW_LITERAL_BUDGET
    - prompt-surface-budgets.test.mjs
    - ace forward-revert
    - PIN-2
    - GATE_CHECK
    - byte budget hotfix
    - full-gate red
    - test-integrity erosion
  tags: 
    - engine
    - byte-budget
    - ace-ladder
    - gate-audit
  created: 2026-09-12
  originSessionId: 5a652d85-60d8-4ec9-9cbf-3333802c7056
  modified: 2026-09-12T08:14:35.449Z
---

# A byte-budget hotfix elsewhere can forward-revert an unrelated ace commit's real content

**Fact:** the engine forward-reverts an ace-family commit whenever the full gate is red at its
tip, by design (PIN-2): "a red gate forward-reverts the ace tip and the approved pre-ace tip still
merges" — see the comment beside `GATE_CHECK` in `skills/war/assets/workflow-template.js`. This is
correct and intentional when the redness comes from the ace commit's own content. It is NOT
content-aware: a red full gate reverts the commit even when the redness is caused by something
else entirely.

**What happened (Phase 1, `2026-09-11-backward-chain-doctrine`):** a hotfix to the PIN TRANSFER
GIT VERIFICATION prompt literal (naming the exact integration ref, see
[[refiner-verification-prompt-must-name-the-exact-ref-not-the-origin]]) added bytes to the same
template file whose prompt-literal share is bound by `WORKFLOW_LITERAL_BUDGET` in
`skills/war/assets/prompt-surface-budgets.test.mjs`. The hotfix pushed that share 66 B over its
then-current hard line. On the next full-gate run, `prompt-surface-budgets.test.mjs` went red —
unrelated to the ace commit's own content (a positive-control-bearing test file, verified by
`backward-chain.test.mjs`'s assertions passing 77/77 at the integrated tip). The engine's
content-blind forward-revert (PIN-2) then discarded that ace commit, deleting 18 positive controls
and a per-assertion census. Gate-audit seats correctly flagged the revert as a Major
test-integrity finding; the Lead had to hand-verify the ace commit's suite at the integrated tip,
restore it, then run the operator-approved budget re-baseline pass before the run could land clean.

**Guidance:** after hotfixing ANY prompt-literal text mid-run (not just the site you are fixing),
re-measure every budgeted surface that file shares (`prompt-surface-budgets.test.mjs`'s whole
table), not just the correctness of the fix. A hotfix that quietly overruns a sibling byte-budget
line can surface several steps downstream as an apparently-unrelated ace-commit content loss, and
the true cause (a byte-budget overage) is easy to miss because the forward-revert mechanism itself
gives no indication of *why* the gate was red.

**Provenance note:** the `PIN-2` forward-revert design and the `WORKFLOW_LITERAL_BUDGET` constant
are directly confirmed in the landed tip (`WORKFLOW_LITERAL_BUDGET = { hard: 172032, advisory:
151552 }`, i.e. already post-re-baseline). The specific commit SHAs in the Lead's narrative
(hotfix, revert, restore, re-baseline) were not independently re-derived by this servitor (no git
access) but the root-cause trail — a named Major gate-audit finding plus the Lead's own traced
byte-overage explanation — is the primary-evidence + refute pass this fact rests on.
