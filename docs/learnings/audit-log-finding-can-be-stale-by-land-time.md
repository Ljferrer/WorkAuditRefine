---
name: audit-log-finding-can-be-stale-by-land-time
description: "Audit finding may be fixed-in-flight; re-Grep tip"
metadata:
  node_type: memory
  type: project
  keywords: [resolved in flight, fix round history, landed tip verification, tautological test finding, outdated defect record, servitor gotcha capture, ff-topology, plan prose drift, merge-commit idiom, preMergeTip, fixRounds zero does not guarantee byte accuracy]
  provenance: code-verified
  slug: audit-log-finding-can-be-stale-by-land-time
  phase: war-companion-skills/p1-t3 + audit-gate-verdict-fidelity/t2.1
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
`skills/war-campaign/assets/campaign-ledger.test.mjs` that did not exist at the landed tip — the
construct was already a real test plus a clarifying comment.

**Why:** finding text persists in the log after the referent it names stops matching the code.
**How to apply:** before recording an audit finding as a live gotcha, re-Grep/Read the named
construct at the landed tip; if it no longer matches, treat it as resolved-in-flight and record
only the underlying generic pattern (if any), never the file/line as a current instance.
`fixRounds: 0` does not guarantee the audited sha's prose matches landed code; re-Grep the named construct anyway.

**Recurrence (audit-gate-verdict-fidelity/t2.1, 2026-07-09):** a Nit said the plan file
`docs/plans/2026-07-08-audit-gate-verdict-fidelity.md` still described a retired changed-file
idiom. The committed plan already stated the `<preMergeTip>` idiom. A plan file outside a task's
`Files:` list is the typical referent a fix round never touches, so re-Read the committed text
before treating a "stale plan prose" finding as live.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]] (the tautology
anti-pattern this stale finding would have instanced),
[[verify-and-close-claim-can-trace-to-transient-uncommitted-edit]] (archived; re-verify against
committed HEAD, not transient state), [[premergetip-chain-skips-requirestest-false-tasks]] (a
*real* gap in the same preMergeTip mechanism, found in the code rather than stale plan prose).

**Note (2026-10-30, merge-commit rule, #2485):** Task merges are now `--no-ff` merge commits with a `WAR-Task` trailer
(ADR 0054), so the `<preMergeTip>` and `ff-topology` caution applies only to polish and terminal
merges. The rule (re-read the committed text before treating a finding as live) is unchanged.
