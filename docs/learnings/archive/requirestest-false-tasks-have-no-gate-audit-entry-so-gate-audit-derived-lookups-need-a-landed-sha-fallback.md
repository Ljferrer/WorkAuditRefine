---
name: requirestest-false-tasks-have-no-gate-audit-entry-so-gate-audit-derived-lookups-need-a-landed-sha-fallback
description: "requiresTest:false tasks skip gate-audit, so any lookup built on gate-audit records needs its own landed-sha fallback"
metadata:
  type: project
  provenance: code-verified
  slug: requirestest-false-tasks-have-no-gate-audit-entry-so-gate-audit-derived-lookups-need-a-landed-sha-fallback
  phase: "authoring-side-verification/phase-3 task 3.2"
  keywords:
    - requiresTest false
    - gate-audit skip
    - auditEvidenceOf
    - landedShaByTask
    - pinned sha unrecorded
  tags:
    - war
    - engine
    - workflow-template
    - gate-audit
  created: 2026-08-24
  originSessionId: dcda690d-99d2-4fba-9d28-2a2a858d4676
  modified: 2026-08-25T08:18:31.435Z
---

# A requiresTest:false task has no gate-audit entry, so gate-audit-derived lookups need a landed-sha fallback

**Rule:** a `requiresTest:false` task lands normally but never gets a gate-audit `auditLog` entry
(the D7 skip in `landMerged`). Any downstream structure derived from gate-audit records is blind to
such tasks unless it carries its own fallback. This is the standing shape of every docs/prose task
in a plan, not a rare edge.

**Instance (#1660, now fixed):** `auditEvidenceOf` read only `gateHeadSha` from gate-evidence
`auditLog` entries, so every follow-up from a `requiresTest:false` task rendered
`pinned sha unrecorded`. Fix: `landMerged` retains `landedShaByTask` per merged task and
`auditEvidenceOf` falls back to it.

**How to apply:** when adding a consumer of gate-audit records, add the `requiresTest:false`
fallback at the same time.

**Informational, never filed:** the emitted pinned sha is the post-merge `gateHeadSha` (rebased
integration tip), not the finding's own `audit_sha`; and the audit round is a pre-`--ace`
`fixRounds` snapshot that can understate the raising round on an ace-regression path.

## Related

- [[premergetip-chain-skips-requirestest-false-tasks]] (archived): the same family in `preMergeTip`'s topology chain, fixed earlier.
- [[a-seat-label-parser-must-not-take-the-rebut-suffix-as-the-lens]]: the sibling gap found in the same audit pass.

> archived 2026-10-27: resolved — moved to archive
