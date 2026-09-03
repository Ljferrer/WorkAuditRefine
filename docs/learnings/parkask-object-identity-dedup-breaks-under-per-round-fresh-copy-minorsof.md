---
name: parkask-object-identity-dedup-breaks-under-per-round-fresh-copy-minorsof
description: "An object-identity dedup guard breaks when a fresh-copy helper is re-invoked in a loop; dedup by content key instead."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: parkask-object-identity-dedup-breaks-under-per-round-fresh-copy-minorsof
  phase: 2026-08-25-engine-reliability-and-filing-fidelity/phase-7 tasks 7.1+7.2 (landed dev/2026-08-25-engine-reliability-and-filing-fidelity)
  keywords: 
    - parkAsk
    - minorsOf
    - object identity dedup
    - asks channel
    - ask disposition
    - fresh copy per call
    - aceBisect re-audit loop
    - Checkpoint strike-list duplicate
    - exactly-once contract
    - workflow-template.js
  tags: 
    - war
    - engine
    - workflow-template
    - ask-disposition
    - dedup
  created: 2026-08-26
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
  modified: 2026-08-26T22:42:32.679Z
---

# `parkAsk`'s exactly-once dedup was by object identity; a per-round fresh-copy re-invocation defeated it

## The durable rule

An object-identity dedup guard (`arr.some(x => x.key === candidate)`) is load-bearing only if the
candidate is guaranteed to be the **same reference** on every code path that can produce the
same fact more than once. Before adding a call site that re-invokes a fresh-copy helper (any
`.map(f => ({ ...f }))` pattern) inside a loop, check whether an identity-based dedup downstream
assumes single-invocation semantics. The fix belongs on the dedup side: a content key, or a
per-task routed set tracked across rounds. Not on the mapping side.

**Incident (`skills/war/assets/workflow-template.js`):** `minorsOf` mints a new object for every
Minor/Nit on every call. `parkAsk` guarded with `a.finding === f`. Each call site fired once per
task, so it was safe until the aceBisect re-audit ladder called `minorsOf` inside a `while` loop
over bisection rounds. A seat re-raising the same `ask` each round produced a fresh object each
round, and the Checkpoint strike-list saw N rows for one open question.

**Fixed in #1853** (`c30d419`): `parkAsk` now dedups by `askContentKey` (task + question) and
merges a re-raise onto the surviving record's `corroborators` list instead of dropping it.
Issue #1810 is still open on GitHub despite the code fix.

**How to apply:** when a dedup registry keys on content, also check the wider follow-up collapse
keys on the same fields, so the two registries cannot disagree on what "the same finding" is.

## Related

[[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]] — the
parent lesson; this file is the standalone write-up of its phase-7 residual.
