---
name: segmentedmerge-nested-in-floor-retry-loop-multiplies-worst-case-merge-dispatch-count
description: "segmentedMerge's own bounded re-dispatch loop, called from inside the floor-retry while loop, multiplies rather than adds to the worst-case per-task merge-gate dispatch count"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: segmentedmerge-nested-in-floor-retry-loop-multiplies-worst-case-merge-dispatch-count
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-5 (task 5.1), landed fc9cf8c1099156f551c414ef99d34d277451da25 on dev/2026-09-06-engine-and-audit-verdict-integrity"
  keywords: 
    - segmentedMerge
    - FLOOR_STATUSES
    - floor-retry loop
    - roundLimit
    - gate_segment
    - dispatch count multiplication
    - worst-case dispatch bound
    - merge-task dispatch cost
  tags: 
    - war
    - workflow-template
    - capacity
    - performance
  created: 2026-09-07
  originSessionId: a2a576b1-d8af-4c79-ad1a-af3d3e5c5c91
  modified: 2026-09-08T01:54:44.879Z
---

# `segmentedMerge`'s re-dispatch loop nests inside the floor-retry loop, multiplying dispatch cost

**Found (code-verified — landed tip `fc9cf8c1099156f551c414ef99d34d277451da25` on
`dev/2026-09-06-engine-and-audit-verdict-integrity`, read via the run-scoped `_refinery` worktree
whose `HEAD` is directly on this tip:
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/`).**

`skills/war/assets/workflow-template.js`'s `segmentedMerge` helper (defined near `const
segmentedMerge = async (prompt, opts) => {`) is itself a bounded loop: while a merge-task result
carries `gate_segment: 'incomplete'` paired with `status: 'error'`, it re-dispatches up to
`roundLimit` more times. Four call sites use it: the initial merge, the floor-retry re-merge, the
environment-proceed re-merge, and the baseline-proceed re-merge.

The floor-retry call site sits **inside** its own bounded retry loop: `while (floorMr &&
FLOOR_STATUSES.includes(floorMr.status) && r.task.fixRounds < roundLimit)` (the `FLOOR_STATUSES`
sub-loop that dispatches a fix worker plus a re-merge on every `no-test` / `unpackaged` /
`done-unmet` / `budget-uncited` result), which itself iterates up to `roundLimit` times. Because
`segmentedMerge` is called fresh on every floor-retry iteration, the two bounds **multiply**, not
add: at the default `roundLimit` of 6, worst-case per-task merge-gate dispatch count rises from
roughly 9 (one dispatch per call site) to roughly 63 (initial: 7; six floor-retries at 7 each: 42;
environment-proceed: 7; baseline-proceed: 7).

**Not a defect.** Every leg stays serial (the merge queue is already serial) and bounded (both
loops cap at `roundLimit`), and reaching the worst case needs a refiner that keeps returning both a
real floor status AND a mid-gate incomplete return on every single round — a narrow, specific
failure mode. The plan's own binding language ("bounded by `run.roundLimit`") holds per call site;
it just does not warn that nesting multiplies the total.

**Pattern to watch for:** when a bounded re-dispatch/retry helper is called from inside another
bounded retry loop, the worst-case dispatch count is the **product** of the two bounds, not their
sum. Before sizing a run timeout, capacity estimate, or `run.roundLimit` default, check whether any
segment-aware helper (`segmentedMerge`, `segmentedLand`) is called from inside another bounded
loop, not just how many straight-line call sites exist.

**Related:** [[per-site-fanout-throttle-composes-multiplicatively-across-nested-call-sites]] — the
same "nested bounds multiply" shape in a different domain (per-site concurrency/fanout throttles
composing across nested call sites, rather than sequential re-dispatch retries composing across
nested loops).

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`,
search `const segmentedMerge` for the helper, `const FLOOR_STATUSES` for the outer retry loop, and
confirm a `segmentedMerge(` call sits between the `FLOOR_STATUSES` `while` line and its closing
brace (the floor-retry re-merge call site).
