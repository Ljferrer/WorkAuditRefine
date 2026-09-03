---
name: new-record-signal-computed-but-dropped-by-a-pre-existing-explicit-key-projection
description: "When a fix adds a field to an internal record, update every explicit-key projection of that record too, or the field never reaches readers."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: new-record-signal-computed-but-dropped-by-a-pre-existing-explicit-key-projection
  phase: 2026-08-27-in-run-finding-resolution/phase-1
  keywords: 
    - handoff projection
    - corroborators
    - lossy projection
    - explicit key mapping
    - operator-facing gate
    - parkAsk
    - Checkpoint strike-list
    - new field dropped
  tags: 
    - workflow-template
    - operator-visibility
    - audit-finding
    - projection-lag
  created: 2026-08-27
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
  modified: 2026-08-27T12:55:35.757Z
---

# A new record field can ship without updating an existing explicit-key projection

## What happened

Phase 1 ("in-run-finding-resolution") changed `parkAsk` in
`skills/war/assets/workflow-template.js` so that N seats independently raising the same question
on one task merge into ONE parked record carrying a `corroborators: [{seat, sha}]` list (the
#1790 fix; before, each raise parked a separate record).

The `handoff.asks` projection in the same file, described by its own comment as the Checkpoint
strike-list ruling gate's input, still maps its output keys explicitly:

```js
asks: asks.map(a => ({ task: a.task, seat: a.seat, sha: a.sha, question: a.question, fork: a.fork, ... })),
```

`corroborators` is absent from this list, so a question re-raised by three seats renders the same
as one raised once at the one surface the operator rules from. The full record survives on the
run's raw top-level return, and the merge is logged, so #1790's "never a silent drop" duty is
discharged. This is an attribution-fidelity gap in the operator channel, not data loss. Four audit
seats re-raised it as a `note` finding; `note` is informational and never auto-fixed by `--ace`.

Still open: the projection is unchanged at the current tip. A later field (`citationPrefill`) was
added to it by name, which confirms the rule below.

## Durable rule

When a fix widens an internal record with a new field that carries operator- or consumer-relevant
signal, grep every serialization and projection site of that record type, not just the write
site, before calling the fix complete. An explicit-key object literal
(`{ task: a.task, seat: a.seat, ... }`) rather than a spread (`{ ...a }`) is the tell that a
projection will keep excluding any new field forever. A spread would carry the field automatically
but would also expose internal bookkeeping (such as a dedup `key`) the projection may want to
hide. So the fix is to add the new field by name, not to switch to a spread.

## Related

None found in the local store at write time.
