---
name: provision-barrier-refiner-owned-not-worker-self-create
description: "Worktree provisioning is a refiner-owned Provision barrier before worker fan-out"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: [happens-before ordering, git worktree add, fan-out race, idempotent ensure, shared git state, WAR_WORKTREE export, resume no-op]
  slug: provision-barrier-refiner-owned-not-worker-self-create
  phase: 3
  tags: 
    - war
    - workflow-template
    - provisioning
    - worktree
    - architecture
    - adr
  files: 
    - skills/war/assets/workflow-template.js
  relates: 
    - "[[scope-guard-needs-agent-type]]"
    - "[[provision-ensure-exclude-cwd-contract]]"
  created: 2026-06-25
  originSessionId: 53421d17-5351-48da-baf8-7d315d56c7b5
---

# Worktree provisioning is a refiner-owned barrier BEFORE fan-out, not worker self-create

## The pattern

In `workflow-template.js`, the `// ---- PROVISION — refiner-owned worktree barrier` section runs *before* the Work fan-out. One `war-refiner` seat runs `provision-worktrees.sh` to build the whole phase's git topology (ensure-exclude, then ensure-integration, then ensure-worktree per task). Workers then fan out into worktrees that already exist. They never run `git worktree add` and never export `WAR_WORKTREE`; the `provisionedLine` builder tells them to work in the "ALREADY-PROVISIONED worktree … do NOT create it yourself and do NOT set any worktree env var". The binding contract is ADR 0021 (`docs/adr/0021-run-lifecycle-provision-contract.md`).

## Why this shape is load-bearing

A worker cannot scope itself: the PreToolUse hook keys write scope on `agent_type`, and an env var the worker exports is a no-op ([[scope-guard-needs-agent-type]]). If a worker cannot fence its own writes, it should not own creating shared git state either. With all shared-git mutation in one refiner seat before any worker starts, workers never race on shared git state, and a resume is a no-op because every subcommand is an idempotent "ensure". This is a hard happens-before barrier, not an ordering preference: the worker prompt *asserts* the worktree and its `.war-task` marker already exist.

## Contracts the barrier must honor

- **ensure-exclude targets the main checkout explicitly.** The barrier passes `${mainCheckout}` as the optional `<repo-dir>` positional, so the write lands in that repo's git dir whatever the caller's cwd ([[provision-ensure-exclude-cwd-contract]]).
- **ensure-integration gets `--owned-file <run-ledger>`.** A resume then recognizes its own integration branch as owned; a foreign, unrecorded branch fails loud (the ownership seam described in the `provision-worktrees.sh` header).

Later work added to this barrier without rewriting it: repo-derived `run.provision` steps (env-blocked on failure), and the derive-skip, ref-holder auto-free, stale-remote, worktree-hygiene and absorb-charge clauses (`deriveSkipClause`, `holderFreeClause`, `staleRemoteClause`, `worktreeHygieneClause`, `absorbChargesClause`). The ownership invariant above is what stayed load-bearing.

> archived 2026-11-10: resolved — moved to archive
