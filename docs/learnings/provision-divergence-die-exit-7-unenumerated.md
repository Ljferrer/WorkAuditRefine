---
name: provision-divergence-die-exit-7-unenumerated
description: "cmd_ensure_integration's new create-path divergence guard dies with exit 7, a value not in provision-worktrees.sh's existing ad-hoc scheme (1/3/4/5/6) — downstream provision-prompt surfacing must treat any non-zero exit as a halt, not special-case exit 3"
metadata:
  type: project
  provenance: agent-unverified
  slug: provision-divergence-die-exit-7-unenumerated
  phase: target-repo-agnostic-execution/p1t2
  keywords:
    - exit code 7
    - cmd_ensure_integration
    - provision-worktrees.sh
    - divergence
    - ad-hoc exit scheme
    - non-zero exit halt
    - Provision barrier
    - foreign branch exit 3
    - ADR 0008
  tags:
    - provisioning
    - exit-codes
    - gotcha
  created: 2026-07-07
  absence_note: "referent not found @ phase target-repo-agnostic-execution/p1t2 — the p1t2 task worktree was already torn down post-land (only p1t1's worktree survives on disk) and the checked-out branch here (claude/resume-war-campaign-945f35) predates this phase's merge. Verify the divergence branch and its exit code in cmd_ensure_integration at skills/war/assets/provision-worktrees.sh before acting on this note."
---

# A new divergence die uses exit 7 — not in the file's existing ad-hoc exit-code set, and that's fine only because nothing keys on the number

Per the p1t2 gate-audit (approve, gate-HEAD `f5f1a0548bfa54d62508cdc89be4775d6ae4f8ca`): `cmd_ensure_integration`'s
new **create-path-only** divergence guard (local base and `origin/<base>` neither an ancestor of the
other → `die`, both SHAs in the message, no branch created — ADR 0008) exits **7**. The file's other
dies use 1 (generic), 3 (foreign branch not owned, ADR 0003), and other small ad-hoc values — there
is no central exit-code table in `provision-worktrees.sh`.

**Why it's safe today:** the sole consumer, the Provision prompt in `workflow-template.js`, keys on
*any non-zero exit* + the stderr message, not the numeric code, so exit 7 is handled correctly
(fail-loud halt via the Provision barrier — env-blocked, worker never spawned).

**Why it matters going forward:** Phase 2 Task 1 of the same plan wires the provision prompt /
`MergeResult` to surface this die "like today's foreign-branch exit 3." If that future surfacing
ever special-cases exit 3 specifically (instead of "non-zero"), exit 7 — and any future new die —
would silently fall through unhandled. **How to apply:** when building provision-exit surfacing,
treat any non-zero `provision-worktrees.sh` exit as a halt; do not enumerate specific codes unless
the file first grows a real exit-code table.

Related: [[ensure-origin-swallows-stderr-unlike-sibling-subcommands]] (same file, same
`cmd_ensure_integration`/sibling-subcommand family, different nit — stderr capture idiom rather
than exit-code enumeration).
