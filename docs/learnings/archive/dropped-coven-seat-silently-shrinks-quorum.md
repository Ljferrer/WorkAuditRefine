---
name: dropped-coven-seat-silently-shrinks-quorum
description: "filter(Boolean) drops crashed seats; quorum code-gated seats===expected [RESOLVED]"
metadata: 
  node_type: memory
  slug: dropped-coven-seat-silently-shrinks-quorum
  phase: B5
  type: project
  tags: 
    - war
    - coven
    - quorum
    - audit
    - filter-boolean
    - transient-failure
    - silent-drop
    - release
  files: 
    - skills/war/assets/workflow-template.js
  relates: 
    - "[[done-add-on-soft-failure-unblocks-true-dependents]]"
    - "[[auditor-cannot-execute-the-tests-it-must-verify-pass]]"
  created: 2026-06-25
  originSessionId: 53421d17-5351-48da-baf8-7d315d56c7b5
---

# A dropped coven seat silently shrinks the quorum

**Rule:** a seat that throws (transient API/auth/rate-limit error) is dropped by `parallel(...).filter(Boolean)`, which conflates "seat crashed" with "seat had nothing to flag" — unanimity over survivors is NOT unanimity over the intended coven. Quorum is meaningless if the denominator can silently shrink.

**Fixed in code:** `auditRound` in `workflow-template.js` re-runs dropped (null) lenses up to 2 retry passes, returns `{ seats, expected }`, and `allApprove(seats, expected)` requires `seats.length === expected`; a persistent shortfall sets `verdict = 'audit-blocked'`. Enforced by code, not by the Lead eyeballing `<failures>`.

**Why:** a silently-shrinkable denominator makes any unanimity/quorum claim vacuous — least acceptable on release/land tasks.
**How to apply:** wherever results are collected through a falsy-filter, ask what a crashed producer looks like; gate on count === expected. Residual: a populated `<failures>` on a "unanimous" verdict still deserves a glance.

Audit-side analogue of [[done-add-on-soft-failure-unblocks-true-dependents]]; compounds [[auditor-cannot-execute-the-tests-it-must-verify-pass]].

> archived 2026-07-04: resolved — moved to archive
