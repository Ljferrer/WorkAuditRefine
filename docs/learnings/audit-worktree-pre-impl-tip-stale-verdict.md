---
name: audit-worktree-pre-impl-tip-stale-verdict
description: "Stale worktree HEAD false reads; verify at audit_sha"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: audit-worktree-pre-impl-tip-stale-verdict
  phase: F01-D2D3/p2 + packaging-floor-enum-wiring/p1
  updated: 2026-07-06
  keywords:
    - stale worktree HEAD
    - gateHeadSha vs auditSha
    - pre-tip false absence
    - servitor stale read
    - phase advanced past gate pin
    - HARD_ESCALATION_REASONS not found in checkout
  tags:
    - audit-verdict-integrity
    - stale-tip
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
---

# Auditor/servitor worktree can be at a pre-implementation tip, producing false reads

Any agent spawned against a worktree pinned mid-phase (auditor, servitor, Lead) can observe a
pre-final-tip snapshot: absence reads are false-absent, and presence of the *pre-fix shape* is a
false regression. 9+ recorded instances across phases (latest: packaging-floor-enum-wiring/p1,
where a stale servitor checkout false-read `'unpackaged'` and the packaging scripts as absent —
that work has since landed on master); in serial/parallel shared-integration phases every task's
gate-audit pin except the last shows benign drift (expected steady state), and a release task's
own bump commit is the most common single-task cause. Left unhandled it can escalate to a
spurious `held:escalation` land-halt.

**Distinguisher:** `gateHeadSha === auditSha` → take the gate result at face value. Pin lags →
confirm `merge-base --is-ancestor`, then hand-verify the disputed construct at the real tip via
`git show <sha>:<path>` (bracketed `git -C` forms are guard-blocked —
[[gate-audit-pin-bracket-test-blocked-by-git-guard]]). requiresTest:false/release tasks have no
mapped-test HARD path → SOFT (Minor/Nit) at most; for releases hand-verify the four version slots
([[release-bump-slots-canonical-no-badge]]).

**Why:** the worktree HEAD, not the audit log, is the stale artifact — a gate-audit
`approve` + `gateEvidence:true` log outranks a conflicting worktree read.
**How to apply:** before asserting "X present/absent" from a worktree, check its HEAD against
`gateHeadSha`/`auditSha` (check `git log` depth — servitor trees can lag whole phases, even
`git mv` renames); if behind, pin verdicts to the audit sha or defer to the gate-audit log and tag
`agent-unverified` with an absence-note. Lead resolving a stale-looking HARD escalation: read the
construct at the real integration tip, re-run the full gate there, and if green land via the
held:escalation path with a resolution note.

Related: [[audit-baseline-must-pin-integration-branch-not-main-checkout]] (wrong diff baseline vs.
stale worktree), [[gate-evidence-severity-not-verdict-gates-hard-path]],
[[version-slots-no-cross-slot-consistency-test]],
[[handoff-endstate-met-default-hinges-on-verbatim-planref-match]],
[[done-add-on-soft-failure-unblocks-true-dependents]] (sentinel vs. real commit check).
