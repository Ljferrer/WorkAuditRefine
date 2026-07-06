---
name: provision-ensure-exclude-cwd-contract
description: "ensure-exclude resolves repo from cwd; run from MAIN"
metadata:
  node_type: memory
  type: project
  keywords: [git rev-parse --git-dir, info/exclude, wrong git dir, untracked worktrees, main checkout, caller working directory, implicit repo resolution]
  slug: provision-ensure-exclude-cwd-contract
  phase: 2
  title: "ensure-exclude target repo depends on cwd — implicit contract, prompt-pinned"
  tags:
    - war
    - provisioning
    - worktrees
    - bash
    - git
    - task-5-wiring
  date: 2026-06-25
  originSessionId: war-phase-2-servitor
---

## Rule

In `skills/war/assets/provision-worktrees.sh`, `git_dir()` resolves the target repo via
`git rev-parse --git-dir` against the **caller's cwd** — there is no target-repo flag.
`cmd_ensure_exclude` writes `.claude/` into `<that-git-dir>/info/exclude`, so it must run with
cwd at the MAIN checkout; invoked from inside a task worktree, the exclusion lands on the
wrong git dir and nested worktrees still surface as untracked in the parent repo.

**Landed:** the refiner's Provision barrier now pins this — `mainCheckout` in
`skills/war/references/schemas.md` is defined as the cwd the barrier runs `ensure-exclude` from.

**Why:** cwd-coupled tools "work" in unit tests (cwd = repo) and break only in the wired pipeline.
**How to apply:** invoke `ensure-exclude` from the main checkout only; if hardening, add an explicit target-repo argument rather than relying on caller cwd.
