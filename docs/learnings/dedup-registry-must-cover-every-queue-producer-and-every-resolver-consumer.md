---
name: dedup-registry-must-cover-every-queue-producer-and-every-resolver-consumer
description: "Adding a new content-key dedup registry (queuedKeys) over a shared queue (phaseCloseQueue / r.reentryQueue) landed incomplete on BOTH sides: the header comment claimed queuedKeys is stamped at 'BOTH phaseCloseQueue entry points' but a THIRD producer (the ruledAsks intake loop) already pushed into the same queue unstamped, and the pre-existing companion resolver (corroborateSurvivor) that merges a re-raising seat onto a finding's surviving row was never extended to search the queue containers at all — so a queued survivor's cross-seat corroboration silently drops even though the queue itself correctly refuses to double-queue"
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

## What happened

Phase 1 ("in-run-finding-resolution") of `workflow-template.js` added a fourth content-key
registry, `queuedKeys`, to stop a re-audit-born finding from double-queuing into
`phaseCloseQueue` / `r.reentryQueue`. The declaring comment states it is stamped at "BOTH
`phaseCloseQueue` entry points (`routeToSweep` and the round-1 approve arm's direct push) and at
`reentryQueue.push`."

Verified at the landed tip (`faa76d6415bdf61ba87a0cd82235d386020eb7f5`, read via the
`_refinery` worktree whose `gitdir` physical path names this plan's slug — HEAD exactly equal to
the landed tip):

- **Producer side**: `skills/war/assets/workflow-template.js`'s `ruledAsks` intake loop (the
  D15(b) interactively-ruled-ask vehicle, around the `for (const ra of ruledAsks)` block) pushes
  a new row straight into `phaseCloseQueue` **without** `queuedKeys.add(remintKey(...))` — a
  third entry point the comment's "BOTH" undercounts. `queuedKeys`/`remintKey` are declared later
  in the file than this loop, so a straight fix requires hoisting the declarations or moving the
  intake below them.
- **Consumer side**: `corroborateSurvivor` (the function that merges a re-raising seat onto a
  finding's surviving row when `remintBlock` refuses a re-mint) resolves the survivor via
  `minorsFiled.find(...)` or `aced.find(...).finding` only — it never searches `phaseCloseQueue`
  or `r.reentryQueue`. When `remintBlock`'s refusal reason is "already queued," the lookup misses
  and the function silently returns, so the second seat's attribution is never merged onto the
  queued row's `seats` list.

Both gaps were independently raised by multiple audit seats across the phase (task 1.1's
correctness/plan-faithfulness/cascading-impact lenses, repeated at successive shas) and shipped
to land as `absorb`-disposition findings that did not make it into a fix round before the phase
closed — i.e. the registry's headline property (no double-queue) landed correct, while its two
side-effects (complete producer coverage, complete consumer coverage) did not.

## Durable rule

1. When adding an Nth content-key dedup registry over a shared queue/array, **grep every
   push-site of that queue** before writing the "stamped at every entry point" comment — a
   comment claiming completeness is not proof of it; a later or earlier code path that already
   pushes into the same container is easy to miss, especially one added in the *same* diff
   (here, ruledAsks and queuedKeys landed in the same commit).
2. Separately, **grep every function that already resolves/looks up entries in that container**
   (a survivor-merge helper, an existing dedup check, a rendering pass) and extend each one to
   search the new registry's container(s) too — a registry only prevents double-write; the
   read-side helpers that predate it do not automatically gain visibility into it.
3. Treat "stamped at BOTH X and Y" language in a guard comment as a claim to verify, not a fact —
   count the actual push-sites in the file before trusting the enumeration.

## Related

[[gate-audit-family-seat-disposition-ask-silently-dropped]] — a sibling case where a shared enum
widening reached further call sites than the author accounted for.
