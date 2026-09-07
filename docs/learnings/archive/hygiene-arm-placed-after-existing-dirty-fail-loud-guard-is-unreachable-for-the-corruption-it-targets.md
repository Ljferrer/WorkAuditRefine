---
name: hygiene-arm-placed-after-existing-dirty-fail-loud-guard-is-unreachable-for-the-corruption-it-targets
description: "Appending a new fail-open repair/hygiene arm to a reuse path that already has an existing fail-loud dirty-tree guard reading the SAME underlying signal (superproject porcelain status) can leave the new arm unreachable for its target corruption shape: the guard's own probe sees the corruption as dirt and dies before the new arm can run, or sees a clean tree and the new arm's own detection is a no-op. Order — not just presence — determines reachability when composing new fail-open behavior alongside an established fail-loud check."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - unreachable branch
    - reuse_hygiene
    - dirty guard ordering
    - fail-open vs fail-loud
    - cmd_ensure_refinery_worktree
    - coverage decorativeness
    - status --porcelain -uno
    - RG.4
  provenance: code-verified
  slug: hygiene-arm-placed-after-existing-dirty-fail-loud-guard-is-unreachable-for-the-corruption-it-targets
  phase: "2026-08-25-engine-reliability-and-filing-fidelity/phase-8 task 8.1 (#1476 gap 4)"
  tags: 
    - plan-code-mismatch
    - shell-scripts
    - test-coverage
  created: 2026-08-26
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
  modified: 2026-08-27T02:42:17.474Z
---

Phase 8 Task 1 extended `reuse_hygiene` to run on `cmd_ensure_refinery_worktree`'s two reuse
arms in `skills/war/assets/provision-worktrees.sh` (#1476 gap 4). Confirmed live at the landed
tip `31ac70a72b09231cbfab3a106d28afdc29442a4f` (read via the `_refinery` worktree whose
`gitdir` physical path names this plan's slug, HEAD == the confirmed tip):

- Arm (b) (`cur_branch == int_branch`) calls `reuse_hygiene "$wt_path" || true`
  **unconditionally** — reachable, and this is the arm the plan's regression-gate row (RG.4)
  actually exercises.
- Arm (c) (HEAD detached/different) instead runs the **existing** dirty-tree guard first —
  `git status --porcelain -uno` on the whole worktree — and `die`s on ANY tracked-file
  modification, THEN switches branches, THEN calls `reuse_hygiene`. A submodule left in the
  killed-populate corruption shape (staged deletions vs HEAD, the exact shape `reuse_hygiene`
  exists to repair) is a tracked-content modification, so the **superproject** reports it
  under `-uno` and the existing (d) guard dies with `EX_WRONG_BRANCH` before arm (c)'s new
  `reuse_hygiene` call is ever reached. Conversely, if the tree passes the `-uno` probe as
  clean, the submodule is clean too, so `reuse_hygiene`'s own entry read finds nothing and
  returns immediately. Either way, arm (c)'s hygiene call has no reachable input that both
  passes the pre-existing guard AND trips the new repair logic — a coverage/decorativeness
  defect (the code is not dead, but no realistic corruption state exercises it), not a
  functional regression, since the arm (b) path this same gap targets is genuinely fixed.

Filed as a `follow-up` (Minor) at gate-audit, not absorbed — closing it is a design call (it
would mean relaxing the never-destroy-work refusal (d) exists to enforce, or adding a
regression row that reaches (c) via a *post-switch-induced* dirt rather than a pre-existing
one), not a mechanical fix.

**Pattern:** when bolting a new fail-open repair/detection arm onto a reuse path that already
carries an established fail-loud guard reading the *same* underlying signal (here: tracked-
file porcelain status), check which one the composed control flow reaches FIRST for the
exact corruption shape the new arm targets — an arm added textually "alongside" an existing
guard is not automatically reachable; ordering can make it either dead code or a false sense
of coverage. Verify with a regression-gate row that actually reaches the new arm's branch,
not just a row that reaches the sibling arm where ordering happens to work out.

> archived 2026-09-04: resolved — moved to archive
