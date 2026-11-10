---
name: reland-submodule-pr-arm-leaves-stale-landresult-unlike-initial-land
description: "When a retry path captures its result under a new local name, propagate every field the initial path exposes on the shared outer variable, not just onto a side list"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: reland-submodule-pr-arm-leaves-stale-landresult-unlike-initial-land
  phase: 2026-07-26-dispatch-args-and-floor-coverage/1.1 (2026-07-26)
  keywords: 
    - landResult
    - submodule-pr
    - held:submodule-pr
    - reLand
    - asymmetric arm
    - stale result object
    - environment-proceed re-land
    - baseline-proceed re-land
    - pr_number
    - pr_remote
    - RESOLVED
    - arm-symmetry pin
  tags: 
    - workflow-template
    - land-phase
    - submodule
    - asymmetric-arms
    - result-mutation
  created: 2026-07-27
  originSessionId: 0ad881e1-4bbc-43c6-8e45-8597d9cec1cf
  modified: 2026-08-03T16:55:30.982Z
---

# A retry path that captures its result under a new name can leave the outer result stale

**Rule:** when a code path is duplicated across an "initial attempt" / "retry attempt" pair, and the
initial path aliases a shared outer variable to the dispatched result while the retry path captures
it under a *new* local name, propagate every field the initial path exposes via the shared variable
to the shared variable on the retry path too — not just onto a side list (`escalated`, a log entry,
etc.).

**Why:** a field present only on the retry's *local* result object is invisible to any consumer that
reads the shared/outer name. It can work on the initial path and silently return `undefined` on the
retry path. The gap is easy to reintroduce when a new retry arm is added by mirroring an old one
without noticing a missing assignment.

**Instance:** in `skills/war/assets/workflow-template.js`, the initial land set `landResult` to the
dispatched `MergeResult`, so a `status:'submodule-pr'` result exposed `landResult.pr_number` /
`landResult.pr_remote`. The `environment-proceed` and `baseline-proceed` re-land arms captured the
result as `reLand` and pushed the PR fields onto the `escalated` entry, but never ran
`landResult = reLand`.

**RESOLVED (2026-08-02-war-engine-and-standing-doc-truth/1.2, #1245):** both re-land arms now assign
`landResult = reLand` inside their `reLand.status === 'submodule-pr'` branches, symmetric with the
initial land.

> archived 2026-08-15: resolved — moved to archive
