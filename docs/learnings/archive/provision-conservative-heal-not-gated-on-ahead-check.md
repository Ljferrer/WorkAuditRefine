---
name: provision-conservative-heal-not-gated-on-ahead-check
description: "Heal safety = never-reset-on-reuse; no ahead-check"
metadata:
  node_type: memory
  type: project
  keywords: [dead code, uncalled helper, branch reset, unmerged commits, worktree reuse, call graph, work destruction]
  slug: provision-conservative-heal-not-gated-on-ahead-check
  phase: 2
  title: "Conservative worktree heal: safety from never-reset, not from ahead-check"
  tags:
    - war
    - provisioning
    - worktrees
    - bash
    - heal
    - dead-code
    - audit-pattern
  date: 2026-06-25
  originSessionId: war-phase-2-servitor
---

## Rule

In `skills/war/assets/provision-worktrees.sh`, the conservative worktree heal is safe
because `cmd_ensure_worktree` **never resets the branch ref**: the reuse path returns before
any reset, and the stale-prune-and-recreate path never touches the ref. Un-merged commits
survive structurally — NOT because of any ahead/behind check.

A now-removed `branch_ahead_of` helper (defined, never called) used to sit alongside this and
was flagged as dead 4× by auditors before being deleted. The takeaway outlives it: **a
defined-but-uncalled helper with a careful comment is more likely deliberate
documentation-of-an-invariant than a missing wire — confirm the call graph before assuming a
helper gates anything**, and never "fix" the heal by adding an ahead-check call that would
introduce a ref-resetting (work-destroying) path.

Related: provision-ownership-ledger-gates-create-not-teardown (a merged-only delete
fallback is where such an ahead-check could legitimately be wired).

> archived 2026-07-13: resolved — moved to archive
