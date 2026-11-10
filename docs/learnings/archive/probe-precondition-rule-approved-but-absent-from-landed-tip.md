---
name: probe-precondition-rule-approved-but-absent-from-landed-tip
description: "An approved requiresTest:true task can land a no-op; grep the plan's RED tokens against the landed tip before trusting the verdict"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: probe-precondition-rule-approved-but-absent-from-landed-tip
  phase: red-team-precondition-not-deliverable/t1
  tags: 
    - audit-fidelity
    - gate-evidence
    - red-team
    - plan-code-mismatch
    - land-integrity
  created: 2026-07-01
  originSessionId: 1bd064e5-a8af-4b1f-91d5-638887067351
---

# Approve + gate-audit:approve can land a no-op for a requiresTest:true task

**Rule:** an approve + gate-audit:approve pair (even with `gateHeadSha === auditSha`) can land
a no-op for a `requiresTest:true` task — the audit graded "no regression in pre-existing code"
instead of "the plan's named deliverable exists." Before trusting the verdict, grep the plan's
own Step-1 RED tokens against the landed tree; zero matches for a `requiresTest:true` task is
a hard stop, independent of what the audit log says.

**Why:** a content review that only raises Nits about pre-existing lines signals the reviewer diffed the wrong scope (or an empty diff).
**How to apply:** on any approved `requiresTest:true` task, positively confirm the plan's named new construct exists at the landed tip before recording success.

Related: [[audit-worktree-pre-impl-tip-stale-verdict]] (distinct: there the worktree was stale; here absence was real at the graded tip), [[weak-test-assertion-passes-without-feature-being-exercised]], [[redteam-claims-vs-reality-misfires-on-impl-plans]], [[gate-evidence-severity-not-verdict-gates-hard-path]], [[war-phantom-land-reports-success-without-advancing-integration]].

> archived 2026-07-04: resolved — moved to archive
