---
name: ""
metadata: 
  node_type: memory
  type: project
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

In `workflow-template.js` the per-phase Workflow now has a **Provision** phase that runs
*before* the Work fan-out. A single `war-refiner` seat runs `provision-worktrees.sh` to build
the whole phase's git topology (ensure-exclude → ensure-integration → ensure-worktree per task),
then workers fan out into worktrees that already exist. Workers no longer run `git worktree add`
and no longer `export WAR_WORKTREE`; their prompt is "work in the ALREADY-PROVISIONED worktree
at `${task.worktree}` — do NOT create it yourself."

## Why this is the shape (it's load-bearing, not stylistic)

This directly resolves the E1 scope-hook finding (`[[scope-guard-needs-agent-type]]`): a worker
**cannot scope itself** because the PreToolUse hook keys write-scope on `agent_type`, and the env
var a worker would export is a no-op. The same logic extends to creation — if a worker can't
fence its own writes, it shouldn't own creating the shared git state either. Moving all shared-git
mutation to a refiner seat that runs *before* any worker touches the tree means workers never race
on shared git state, and a resume is a no-op (every subcommand is idempotent "ensure").

This is a barrier (a hard happens-before), not just an ordering preference: the worker prompt now
*asserts* the worktree + `.war-task` marker already exist.

## Carry-forward contracts the barrier MUST honor (from Phase 2 coven)

- **ensure-exclude runs FROM THE MAIN CHECKOUT, never inside a task worktree** — it resolves its
  target repo from cwd (see `[[provision-ensure-exclude-cwd-contract]]`). The barrier prompt pins
  this explicitly with `${mainCheckout}`.
- **ensure-integration is passed `--owned-file <run-ledger>`** so a resume recognizes its own
  integration branch as owned; a foreign unrecorded branch exits 3 / fails loud
  (see `provision-ownership-ledger-gates-create-not-teardown`).

(Part B — repo-derived `run.provision`, the env-blocked/setup-scout phase — has since landed
*as an addition on top of* this barrier, not a rewrite of it; the barrier ownership invariant
above is what stayed load-bearing.)
