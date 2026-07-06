---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [suite count mismatch, resolveGate, self-discovery, extra test suite, scope creep false alarm, release gate block]
  slug: plan-gate-enumeration-stale-after-stacking
  phase: provisioning-lifecycle/p3
  tags: 
    - gate
    - stacking
    - plan-drift
    - self-discovery
  related: "[[gate-under-covers-after-cross-branch-merge-new-runner]], [[retire-token-needs-clean-surface-gate-test]]"
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Plan's explicit gate enumeration goes stale when stacked work adds runners

## What happened
The provisioning-lifecycle plan's gate block (lines 30-34) explicitly enumerates three `*.test.sh` suites: validate-worktree-scope, clean-surface-war-worktree, and provision-worktrees. Stacked work (verification-layer-integrity) added a fourth — refinery-surface.test.sh. The release task (T6) correctly relied on the F12 self-discovery mechanism (`war-config.mjs resolveGate` using `find . -name '*.test.sh'`) which picked up all four. The plan's literal three-suite list was stale.

## Why it's a gotcha
An auditor checking "does the gate in the candidate match the gate in the plan?" would see a discrepancy — the candidate runs 4 suites, the plan names 3. This looks like scope creep but is actually correct: the plan was written before the fourth suite existed.

## Durable rule
**Explicit gate enumerations in plan docs go stale as soon as any stacked task adds a new runner.** The authoritative gate is the self-discovery path, not the plan literal. When a plan and candidate diverge on gate suite count, check whether the extra suite was added by stacked work that landed after the plan was drafted — if yes, the candidate is correct and the plan is outdated. Flag as Nit only; do not block.

This is the stacking analog of [[gate-under-covers-after-cross-branch-merge-new-runner]] (which covers the inverse: a merge ADDING suites that the configured runner misses). Here the configured gate FINDS extra suites via self-discovery — that is correct behavior, not over-reach.

## Implication for plan authors
When writing a gate block for a release task in a multi-plan stack, prefer referencing the self-discovery mechanism by name rather than enumerating suites literally. Literal enumeration is immediately a maintenance liability.
