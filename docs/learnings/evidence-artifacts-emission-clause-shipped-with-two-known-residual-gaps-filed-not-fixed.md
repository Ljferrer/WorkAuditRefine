---
name: evidence-artifacts-emission-clause-shipped-with-two-known-residual-gaps-filed-not-fixed
description: "A `requiresTest:false` task has no gate-audit entry, so any gate-audit-derived lookup needs its own landed-sha fallback."
metadata:
  type: project
  provenance: code-verified
  slug: evidence-artifacts-emission-clause-shipped-with-two-known-residual-gaps-filed-not-fixed
  phase: "authoring-side-verification/phase-3 task 3.2 (landed 783bd136ea6a9d8da9b73b5dcbf01d1d475a0cef on claude/authoring-side-verification-600a79)"
  keywords:
    - auditEvidenceOf
    - Evidence artifacts
    - seat lens extraction
    - rebut suffix
    - rebuttal round seat label
    - pinned sha unrecorded
    - requiresTest false gate-audit gap
    - gateHeadSha producer
    - mergedTasksForGateAudit
    - file-followups dispatch
    - PIN-14
    - ADR 0044
  tags:
    - war
    - engine
    - workflow-template
    - gate-audit
    - known-gap
  created: 2026-08-24
  originSessionId: dcda690d-99d2-4fba-9d28-2a2a858d4676
  modified: 2026-08-25T08:18:31.435Z
---

# The `## Evidence artifacts` emission clause landed with two known, filed-but-unfixed gaps

**Fixed in code** (both gaps; issues #1659 and #1660 remain OPEN on GitHub and should be closed).

## Durable rule

A `requiresTest:false` task lands normally but never gets a gate-audit `auditLog` entry (the D7
skip in `landMerged`). Any downstream structure derived from gate-audit records is blind to such
tasks unless it carries its own fallback. This is the standing shape of every docs/prose task in a
plan, not a rare edge.

**The two gaps, as shipped in phase authoring-side-verification/3.2:**

1. Lens extraction (#1659): the filing prompt took "the trailing `:<lens>` segment" of each seat
   label, but rebuttal-round labels are built as `audit:<task>:<lens>:rebut` (the `label:`
   construction in `runSeat`), so the lens read as `rebut`. Fixed: the Evidence-artifacts clause in
   `skills/war/assets/workflow-template.js` now says a trailing `:rebut` is a dispatch label, never
   the lens, and applies a family-prefix rule for `gate-audit` seats.
2. Pinned sha (#1660): `auditEvidenceOf` read only `gateHeadSha` from gate-evidence `auditLog`
   entries, so every follow-up from a `requiresTest:false` task rendered `pinned sha unrecorded`.
   Fixed: `landMerged` retains `landedShaByTask` per merged task and `auditEvidenceOf` falls back to it.

**How to apply:** when adding a consumer of gate-audit records, add the `requiresTest:false`
fallback at the same time, and check the `:rebut` suffix and the `gate-audit` family prefix before
parsing a seat label for its lens.

**Informational, never filed:** the emitted pinned sha is the post-merge `gateHeadSha` (rebased
integration tip), not the finding's own `audit_sha`; and the audit round is a pre-`--ace`
`fixRounds` snapshot that can understate the raising round on an ace-regression path.

## Related

- [[premergetip-chain-skips-requirestest-false-tasks]] (archived): the same family in `preMergeTip`'s topology chain, fixed earlier.
- [[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]]: the model for recording known, filed, not-fixed gaps on a fresh mechanism.
- [[standing-instruction-vs-dispatched-prompt-coverage-split]]: the standing `file-followups.md` reference under-describes the dispatched prompt's Evidence-artifacts duty.
