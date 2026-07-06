---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [branch delete refused, checked out worktree, git worktree remove force, warn swallow, silent footgun, integration branch cleanup, keep flag]
  slug: teardown-phase-reap-order-and-delete-fail-loud
  phase: clandiso/phase-1
  tasks: t3
  date: 2026-06-25
  tags: 
    - teardown
    - refinery
    - worktree
    - git
    - fail-loud
    - path_under
  related: 
    - - provision-ownership-ledger-gates-create-not-teardown
  originSessionId: 4f3e4595-5aaa-40b5-9004-183f4bb53936
---

# teardown-phase: reap _refinery BEFORE branch delete; delete must fail loud

**Rule:** when a branch is checked out in a worktree, git refuses to delete it. Any teardown that deletes an integration branch MUST reap the `_refinery` worktree first — by PATH (`git worktree remove --force` + `prune`), so it works whether `_refinery` is on the integration branch or detached — then delete the branch with fail-loud propagation. A `|| warn` swallow on a branch delete is a silent footgun.

Landed in the `teardown-phase` command of `skills/war/assets/provision-worktrees.sh` (clandiso/t3): `--worktree-root` supplies where `_refinery` lives (`<wt-root>/<runId>/_refinery`); the path-based reap runs before the integration branch delete; the delete propagates a real non-zero exit ("still checked out? ensure _refinery is reaped first via --worktree-root"); `--keep` preserves `_refinery` and the branch for held/escalated phases.

**Caveat — the tautological path_under guard:** inside the reap, `path_under "$run_wt_scope/_refinery" "$run_wt_scope"` can never fire — the child is derived by appending to the ancestor (the comment says "should be impossible ... but defensive"). Do NOT remove it: it documents intent and covers a hypothetical `..` injection via caller-supplied `--worktree-root`. But do not assume its die-5 branch is test-exercised; the real out-of-run refusal comes from `worktree_registered` returning false for a foreign run's path.
