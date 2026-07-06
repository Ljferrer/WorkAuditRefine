---
name: audit-log-finding-can-be-stale-by-land-time
description: "Audit finding may be fixed-in-flight; re-Grep tip"
metadata: 
  node_type: memory
  type: project
  keywords: [resolved in flight, fix round history, landed tip verification, tautological test finding, outdated defect record, servitor gotcha capture]
  provenance: code-verified
  slug: audit-log-finding-can-be-stale-by-land-time
  phase: war-companion-skills/p1-t3
  tags: 
    - audit
    - fixrounds
    - servitor-verification
    - process
  created: 2026-07-01
  originSessionId: 4e5003ee-7132-4597-be6e-d8061e9d86a8
---

# An audit-log finding can be stale by the time a servitor reads it

The audit log is the assembled record across a task's audit + fix-round history, not a final
snapshot: a finding can describe a defect a fix round already resolved before landing.
Instance (resolved-in-flight): three near-duplicate findings named a tautological IIFE test in
`campaign-ledger.test.mjs` that did not exist at the landed tip — the construct was already a
real test plus a clarifying comment.

**Why:** finding text persists in the log after the referent it names stops matching the code.
**How to apply:** before recording an audit finding as a live gotcha, re-Grep/Read the named
construct at the landed tip; if it no longer matches, treat it as resolved-in-flight and record
only the underlying generic pattern (if any), never the file/line as a current instance.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]] (the tautology
anti-pattern this stale finding would have instanced),
[[verify-and-close-claim-can-trace-to-transient-uncommitted-edit]] (re-verify against committed
HEAD, not transient state).
