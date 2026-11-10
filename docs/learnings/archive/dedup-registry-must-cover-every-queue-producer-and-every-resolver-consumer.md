---
name: dedup-registry-must-cover-every-queue-producer-and-every-resolver-consumer
description: "A new dedup registry must stamp every push site of its queue, and every pre-existing lookup helper must search that queue too."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: dedup-registry-must-cover-every-queue-producer-and-every-resolver-consumer
  phase: 2026-08-27-in-run-finding-resolution/phase-1 + 2026-11-04-late-defects-fixed-in-run/phase-4 (task 4.1, recurrence)
  keywords: 
    - dedup registry
    - queuedKeys
    - corroborateSurvivor
    - phaseCloseQueue
    - content-key registry
    - remintBlock
    - third entry point
    - companion resolver lag
    - terminalQueue
    - terminal pass
    - unstamped producer
    - sweepMinors
    - p5-polish
    - in-band-absorb-default phase-5
    - registry expansion regresses same rule
    - lateSrcRows
    - late-fix queue
  tags: 
    - workflow-template
    - engine-reliability
    - audit-finding
    - registry-completeness
  created: 2026-08-27
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
  modified: 2026-11-05T16:19:05.404Z
---

# A new dedup registry can leave BOTH a producer and a consumer uncovered

## Durable rule

1. When adding an Nth content-key dedup registry over a shared queue/array, **grep every
   push-site of that queue** before writing the "stamped at every entry point" comment — a
   comment claiming completeness is not proof of it; a later or earlier code path that already
   pushes into the same container is easy to miss, especially one added in the *same* diff.
2. Separately, **grep every function that already resolves/looks up entries in that container**
   (a survivor-merge helper, an existing dedup check, a rendering pass) and extend each one to
   search the new registry's container(s) too — a registry only prevents double-write; the
   read-side helpers that predate it do not automatically gain visibility into it.
3. Treat "stamped at BOTH X and Y" language in a guard comment as a claim to verify, not a fact —
   count the actual push-sites in the file before trusting the enumeration.
4. Re-apply rules 1 and 2 every time a `queuedKeys`-style registry gains a new backing container,
   not only when the registry is first introduced.

## Instances (all on the `queuedKeys` registry in `skills/war/assets/workflow-template.js`)

- **Phase 1, `in-run-finding-resolution`:** the `ruledAsks` intake loop pushed into
  `phaseCloseQueue` without `queuedKeys.add(remintKey(...))`, and `corroborateSurvivor` searched only
  `minorsFiled`/`aced`, so an "already queued" re-mint lost the second seat's attribution.
- **Phase 5, `in-band-absorb-default` (p5-polish):** the merged-arm `sweepMinors` loop ended
  `else terminalQueue.push(f)` with no stamp, so two seats raising one absorb were recorded twice;
  fixed by #2069 (PR #2065).
- **Phase 4, `late-defects-fixed-in-run` (task 4.1):** rows moved into `lateFixQueue` through
  `queueLateRow` (and `carryLate` rows in `carriedTasks[]`) were invisible to `corroborateSurvivor`;
  a fix round added `lateSrcRows` and `carriedTasks` lookups before land.

## Resolution (current state)

`queuedKeys.add(remintKey(f))` now precedes `terminalQueue.push(f)` in `sweepMinors`, and
`corroborateSurvivor` searches `phaseCloseQueue`, `carriedPhaseClose`, `terminalQueue`,
`lateSrcRows`, `carriedTasks` (under the raiser key `raisedTask ?? task`), and, through the
`liveTaskRecords` set, the per-task `r.reentryQueue` and `r.task.pendingAbsorbs`. An unresolvable
re-mint logs "no surviving record found" instead of returning silently. The durable rule stands.

Tests: `late-defect: exclusion late-fix corroboration` and `late-defect: exclusion corroboration` in
`skills/war/assets/workflow-template.late-defect-3.test.mjs`.

**Locate-cue (verify still present before acting):** the `liveTaskRecords` declaration directly above
`corroborateSurvivor`; the `lateSrcRows.find` and `carriedTasks.find` arms in `corroborateSurvivor`;
`lateSrcRows.push(row)` in `queueLateRow`.

## Related

[[gate-audit-family-seat-disposition-ask-silently-dropped]] — a sibling case where a shared enum
widening reached further call sites than the author accounted for.
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] — why the phase-5
instance had no round left to drain it.
[[a-container-declared-late-in-workflow-template-needs-an-early-mirror-list-for-its-resolver]] — the
TDZ trap the phase-4 fix had to work around.

> archived 2026-10-30: resolved — moved to archive
