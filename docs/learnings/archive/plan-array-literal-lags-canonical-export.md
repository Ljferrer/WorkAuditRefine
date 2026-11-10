---
name: plan-array-literal-lags-canonical-export
description: "A plan's literal of a live set (a mirrored constant, a gate suite list) is approximate; the live mechanism (drift guard deepEqual, resolveGate self-discovery) is the authority"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  keywords: [stale spec value, deepEqual, mirrored constant, append not replace, drift test, HARD_ESCALATION_REASONS, suite count mismatch, resolveGate, self-discovery, extra test suite, scope creep false alarm]
  slug: plan-array-literal-lags-canonical-export
  phase: audit-scheduler-integrity/p1 + provisioning-lifecycle/p3
  date: 2026-06-26
  tags:
    - plan-mismatch
    - drift-guard
    - TDD
    - gate
    - self-discovery
  related:
    - - drift-guard-pin-for-task-split-intermediate-state
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Plan array literal lags the canonical export

**Rule:** when a plan writes out the expected state of a live set — a mirrored constant, a gate
suite list — treat that literal as *approximate*. The live mechanism is the authority: the drift
guard's `deepEqual` for a mirrored constant, `resolveGate` self-discovery for gate suites.

## What happened

The plan's Step 3 listed the expected final value of `HARD_ESCALATION_REASONS` as
`['escalate','audit-blocked','conflict','dep-failed']` — omitting `'land_stale'`, which had
already been appended to the canonical export at v0.6.0 (clandiso phase work).

The worker had to reconcile: appending `'dep-failed'` to the CURRENT array (which already
contained `'land_stale'`) rather than replacing with the plan's stale literal.

Gate-suite instance: a plan's gate block named three `*.test.sh` suites, stacked work added a
fourth, and `resolveGate`'s `find . -name '*.test.sh'` discovery correctly ran all four — correct
behavior, not scope creep; flag as Nit only, never block.

## Why it matters

The drift guard's `deepEqual` assertion in `war-config.test.mjs` is the ground truth —
it extracts the inline mirror from `workflow-template.js` and deep-equals it against the
canonical export. Any plan-stated literal is advisory; the test is authoritative.

**How to apply:** never replace the live array with the plan's literal; always append to (or
remove from) the current value. When authoring a plan, name the self-discovery mechanism, not a
list.

## Cross-links

Companion to [[drift-guard-pin-for-task-split-intermediate-state]] — same family: plan text
diverges from live code during multi-phase work; the drift guard is the arbiter.
Gate-suite sibling: [[gate-under-covers-after-cross-branch-merge-new-runner]].

> archived 2026-08-30: resolved — moved to archive
