---
name: audit-log-finding-can-be-stale-by-land-time
description: "Audit finding may be fixed-in-flight; re-Grep tip"
metadata:
  node_type: memory
  type: project
  keywords: [resolved in flight, fix round history, landed tip verification, tautological test finding, outdated defect record, servitor gotcha capture, ff-topology, plan prose drift, merge-commit idiom, preMergeTip]
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
`campaign-ledger.test.mjs` that did not exist at the landed tip — the construct was already a
real test plus a clarifying comment.

**Why:** finding text persists in the log after the referent it names stops matching the code.
**How to apply:** before recording an audit finding as a live gotcha, re-Grep/Read the named
construct at the landed tip; if it no longer matches, treat it as resolved-in-flight and record
only the underlying generic pattern (if any), never the file/line as a current instance.

**Recurrence (audit-gate-verdict-fidelity/t2.1, 2026-07-09):** a Nit finding claimed the plan file
(`docs/plans/2026-07-08-audit-gate-verdict-fidelity.md`, Task 2.1 slice + Notes) "still describes
the retired `<merge>^1`/`--no-ff` changed-file idiom" against the actual fast-forward
`<preMergeTip>` implementation. Re-reading the plan file at the landed tip (verified in the
p2-t2.1 worktree) showed the opposite: both the Task 2.1 slice and the Notes/"conscious deviations"
section already state the `<preMergeTip>` idiom correctly, and the Notes section explicitly calls
out that "an earlier draft's `<merge>^1` … idiom was itself topology-void" — i.e. the plan had
already been self-corrected (the mid-task ff-topology course-correction was back-ported into the
plan prose in the same task) before this finding was ever read. The finding described a prior
draft state, not the landed one. **Extra angle vs. the original instance:** a plan file living
*outside* a task's declared `Files:` list is exactly the kind of referent a courtesy/informational
finding names but that a fix round has no obligation to re-touch — always re-Read the actual
committed plan text before treating a "stale plan prose" finding as still live, even (especially)
when the file is out-of-scope for the task under audit.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]] (the tautology
anti-pattern this stale finding would have instanced),
[[verify-and-close-claim-can-trace-to-transient-uncommitted-edit]] (re-verify against committed
HEAD, not transient state), [[premergetip-chain-skips-requirestest-false-tasks]] (a *real*,
still-live gap in the same preMergeTip mechanism, found in the code rather than stale plan prose).
