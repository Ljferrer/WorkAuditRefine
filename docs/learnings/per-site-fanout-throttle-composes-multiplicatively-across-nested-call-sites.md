---
name: per-site-fanout-throttle-composes-multiplicatively-across-nested-call-sites
description: "RESOLVED (2026-08-30-engine-concurrency-and-pin-transfer, #1897): a per-site pacing knob multiplies to N x N agents; cap with one global semaphore at the dispatch seam."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - run.maxParallel
    - batched
    - fan-out throttle
    - nested concurrency
    - rate limit pacing
    - workflow-template.js
    - concurrency ceiling
    - per-site throttle
  provenance: code-verified
  slug: per-site-fanout-throttle-composes-multiplicatively-across-nested-call-sites
  phase: "2026-08-25-engine-reliability-and-filing-fidelity/Phase 1 (tasks 1.1, 1.3)"
  tags: 
    - war
    - workflow-template
    - concurrency
    - config
  created: 2026-08-25
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-26T06:35:06.903Z
---

# A per-fan-out-site throttle nests multiplicatively, not additively

**Fixed in plan `2026-08-30-engine-concurrency-and-pin-transfer` (#1897).** The per-site
`batched()` slicing is retired. `run.maxParallel` is now a true global ceiling: one
global counting semaphore (`makeSemaphore` and `dispatchSemaphore` in `skills/war/assets/workflow-template.js`)
caps agent dispatches in flight across the whole run. `skills/war-room/SKILL.md` and
`CONTEXT.md` carry the global wording, pinned by `skills/war/assets/doc-semantics.test.mjs`.

**The durable rule:** when one throttle knob is threaded into more than one fan-out site, and one
site runs inside another (nesting, not just siblings), worst-case concurrency is the product of
the per-site caps, not the sum. `run.maxParallel: N` applied to both the per-wave task fan-out
and the auditor-roster fan-out reached from inside each task thunk gave up to `N × N` concurrent
dispatches (N=3 gave 9, N=5 gave 25).

**Why:** each site was faithful to its own End state ("at most N task thunks run concurrently")
while missing the Commander's Intent purpose (pace fan-out on rate-limited accounts). Three
audit seats across two gate-audit rounds flagged it independently.

**How to apply:**
- For any new multi-site pacing knob, count the nesting before writing the doc line. Never
  describe a per-site cap as a flat or global agent ceiling.
- If the purpose is a real ceiling, use one shared in-flight semaphore at the leaf dispatch
  seam, not more per-site group slicing.
