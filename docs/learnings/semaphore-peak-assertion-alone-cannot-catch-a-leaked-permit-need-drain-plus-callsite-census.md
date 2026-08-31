---
name: semaphore-peak-assertion-alone-cannot-catch-a-leaked-permit-need-drain-plus-callsite-census
description: "Testing a counting semaphore needs a drain assertion after rejected dispatches, plus a default-deny call-site census — a peak-only assertion cannot catch a leaked permit, because a leak lowers the peak instead of raising it"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - counting semaphore
    - makeSemaphore
    - dispatch seam
    - leak guard
    - drain assertion
    - permit leak
    - default-deny census
    - rate limiter testing
    - maxParallel
    - workflow-template.js
    - finally release
  provenance: code-verified
  slug: semaphore-peak-assertion-alone-cannot-catch-a-leaked-permit-need-drain-plus-callsite-census
  phase: "2026-08-30-engine-concurrency-and-pin-transfer/Phase 1 (tasks 1.1, 1.2)"
  tags: 
    - war
    - workflow-template
    - concurrency
    - testing-pattern
  created: 2026-08-30
  originSessionId: fddd64d3-2c2c-400e-b891-9b7b75dcd158
  modified: 2026-08-30T10:25:54.215Z
---

# A semaphore's peak assertion alone cannot catch a leaked permit

## Context

Phase 1 of plan `2026-08-30-engine-concurrency-and-pin-transfer` replaced the old per-site
`batched()` throttle (see
[[per-site-fanout-throttle-composes-multiplicatively-across-nested-call-sites]], now RESOLVED)
with one global counting semaphore. `makeSemaphore(n)` gates a single leaf dispatch seam,
`dispatch(prompt, opts)`, in `skills/war/assets/workflow-template.js`. Every `agent()` call in
the file now routes through this one seam (PIN-4): worker, auditor, ace, fix worker, refiner,
servitor, and gate-audit seat dispatches all share the one counter.

## The gotcha: a leaked permit lowers the peak, it does not raise it

`dispatch()` acquires a permit, calls `agent()`, and releases the permit in a `finally`, so a
rejected or thrown dispatch never leaks one. If that `finally` were missing, or a later edit
moved the release outside it, a leaked permit would not raise the observed concurrency peak. It
would silently shrink the pool of permits in circulation instead. A test that only asserts
`peak <= N` cannot tell a correctly-draining semaphore apart from one that is slowly leaking
permits shut — the assertion still passes, and the ceiling gets quietly stricter over the life
of a long run. Task 1.1 landed with two paired tests, not one:

1. a peak/FIFO/results test that settles the run and checks the observed peak, and
2. a dedicated leak-guard test that drives several REJECTED dispatches through the seam, then
   asserts `dispatchSemaphore.permits` is back at N and `dispatchSemaphore.waiting` is 0 once the
   run settles.

## The companion technique: default-deny call-site census

To prove the old per-site throttle was fully retired, not merely dead but still reachable, the
same test file asserts on the stripped source text:

- the count of `agent(` call sites in the whole file equals the count of `agent(` calls inside
  the seam body itself, so a future call site cannot bypass the global ceiling unnoticed,
- the count of `batched(` occurrences (definition plus call sites) is exactly zero, and
- no fan-out site still threads `maxParallel` as a parameter — the ceiling lives only at the
  seam.

## When this generalizes

Reach for this pair whenever a fix consolidates several throttle or pacing call sites into one
shared gate. Add a drain/leak-guard test that exercises the rejection path and re-checks the
counter's resting state, never just a peak bound. Add a default-deny call-site census (an exact
count, not "at least") that proves the old scattered mechanism has zero surviving call or
definition sites.

## Locate-cue (verify still present before acting)

`makeSemaphore` and `dispatch` in `skills/war/assets/workflow-template.js` (search
`function makeSemaphore(n)` and `async function dispatch(prompt, opts)`, around line 424 and
452). The paired tests in `skills/war/assets/workflow-template.test.mjs` (search `semaphore: at
most N agent dispatches` and `leak guard`). The census test (search `dispatch-seam census`).

## Cross-links

- [[per-site-fanout-throttle-composes-multiplicatively-across-nested-call-sites]] — the bug this
  phase resolved by adding this semaphore.
