---
name: dedup-registry-must-cover-every-queue-producer-and-every-resolver-consumer
description: "A new dedup registry must stamp every push site of its queue, and every pre-existing lookup helper must search that queue too."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: dedup-registry-must-cover-every-queue-producer-and-every-resolver-consumer
  phase: 2026-08-27-in-run-finding-resolution/phase-1
  keywords: 
    - dedup registry
    - queuedKeys
    - corroborateSurvivor
    - phaseCloseQueue
    - content-key registry
    - remintBlock
    - third entry point
    - companion resolver lag
  tags: 
    - workflow-template
    - engine-reliability
    - audit-finding
    - registry-completeness
  created: 2026-08-27
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
  modified: 2026-08-27T12:55:03.628Z
---

# A new dedup registry can leave BOTH a producer and a consumer uncovered

**Rule:** a content-key dedup registry over a shared queue only prevents double-write at the push sites that stamp it. Before writing a "stamped at every entry point" comment, grep every push site of that queue. Separately, grep every helper that already looks up entries in that container and extend each one to search the registry's container(s) too. Read-side helpers that predate the registry do not gain visibility into it on their own.

**Instance (still open):** phase 1 of `2026-08-27-in-run-finding-resolution` added `queuedKeys` to `skills/war/assets/workflow-template.js` to stop a re-audit-born finding from double-queuing into `phaseCloseQueue` / `r.reentryQueue`. The declaring comment says it is stamped at "BOTH `phaseCloseQueue` entry points". Two gaps shipped to land as `absorb` findings that never reached a fix round:

- **Producer side:** the `ruledAsks` intake loop (`for (const ra of ruledAsks)`, the D15(b) ruled-ask vehicle) pushes straight into `phaseCloseQueue` without `queuedKeys.add(remintKey(...))`. It is a third entry point the comment undercounts. The loop sits above the `queuedKeys` / `remintKey` declarations, so a fix must hoist the declarations or move the intake below them.
- **Consumer side:** `corroborateSurvivor` (merges a re-raising seat onto a finding's surviving row when `remintBlock` refuses a re-mint) resolves the survivor via `minorsFiled.find(...)` or `aced.find(...).finding` only. When the refusal reason is "already queued", the lookup misses and the function returns silently. The second seat's attribution never reaches the queued row's `seats` list.

**Why:** the registry's headline property (no double-queue) landed correct while its two side effects (complete producer coverage, complete consumer coverage) did not. The missed producer landed in the same diff as the registry, which made it easy to overlook.

**How to apply:**
1. Count the actual push sites in the file before trusting a "stamped at BOTH X and Y" enumeration. Treat it as a claim to verify.
2. For each existing lookup helper over the container, ask whether the new registry's refusal reason can now route a record to it that it cannot find.

## Related

[[gate-audit-family-seat-disposition-ask-silently-dropped]]: a sibling case where a shared enum widening reached further call sites than the author accounted for.
