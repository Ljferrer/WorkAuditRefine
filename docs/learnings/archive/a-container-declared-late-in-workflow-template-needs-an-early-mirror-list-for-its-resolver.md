---
name: a-container-declared-late-in-workflow-template-needs-an-early-mirror-list-for-its-resolver
description: "A queue declared late in workflow-template.js throws a TDZ ReferenceError when a wave-side resolver reads it, so declare an early mirror list (lateSrcRows)"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: a-container-declared-late-in-workflow-template-needs-an-early-mirror-list-for-its-resolver
  phase: 2026-11-04-late-defects-fixed-in-run/phase-4 (task 4.1)
  keywords: 
    - TDZ
    - ReferenceError
    - temporal dead zone
    - lateFixQueue
    - lateSrcRows
    - declaration order
    - workflow-template
  tags: 
    - workflow-template
    - engine-reliability
    - javascript
  created: 2026-11-05
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
---

# A container declared late in workflow-template.js needs an early mirror list for its resolver

**Rule.** A wave-side read of a `const` declared later in `skills/war/assets/workflow-template.js`
throws a temporal-dead-zone (TDZ) `ReferenceError`. Give the resolver an early-declared mirror list
instead of reading the late container directly.

**Instance.** `lateFixQueue` is declared far below the wave-side callers of `corroborateSurvivor`. A
lookup that read `lateFixQueue` directly would throw a TDZ `ReferenceError` on the wave side. So
`lateSrcRows`, a flat list that `queueLateRow` appends to, is declared near the top of the file with
a comment that names this reason, and `corroborateSurvivor` searches `lateSrcRows`.

**How to apply.** If you add a new container declared late in `workflow-template.js`, and a function
that runs earlier (wave side) must read it, declare a mirror list early and push to it at the same
site that fills the late container. This trap applies to any late `const`, with or without a dedup
registry.

**Locate-cue (verify still present before acting):** `const lateSrcRows = []` with its TDZ comment,
the `lateSrcRows.find` arm in `corroborateSurvivor`, and `lateSrcRows.push(row)` in `queueLateRow`.

Related: [[dedup-registry-must-cover-every-queue-producer-and-every-resolver-consumer]] (the
registry-coverage fix that ran into this trap).
