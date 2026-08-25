---
name: evidence-artifacts-emission-clause-shipped-with-two-known-residual-gaps-filed-not-fixed
description: "workflow-template.js's new auditEvidenceOf/`## Evidence artifacts` filing-prompt emission (Task 3.2, PIN-14, ADR 0044) landed with two known, filed-but-unfixed gaps: (1) the seat-lens extraction clause's trailing `:<lens>` parse mis-reads a rebuttal-round seat label's `:rebut` suffix (#1659); (2) auditEvidenceOf's pinned-sha arm has no producer for requiresTest:false tasks, so a whole task class renders 'pinned sha unrecorded' (#1660) — treat both as known live gaps until their filed issues land"
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

# The new `## Evidence artifacts` emission clause landed with two known, filed-but-unfixed gaps

**Found (code-verified — landed tip `783bd136ea6a9d8da9b73b5dcbf01d1d475a0cef` on
`claude/authoring-side-verification-600a79`, verified in the phase's own `_refinery` worktree
whose `HEAD` is directly on this ref/sha; both were audit findings on NEW code in Task 3.2, routed
`follow-up` and filed as issues rather than fixed pre-land):**

1. **Trailing-`:<lens>` extraction mis-reads a rebuttal-round seat label (#1659).** The
   file-followups filing-prompt clause instructs the filing agent to take "each entry's trailing
   `:<lens>` segment" from a row's `seats` list
   (`skills/war/assets/workflow-template.js`, the Evidence-artifacts emission clause text). Seat
   labels are built as `` `audit:${task.id}:${seat.lens}${peers ? ':rebut' : ''}` `` (the
   `label:` construction inside `runSeat`, confirmed at the line building `AUDIT_VERDICT` seat
   dispatches). When a split panel takes a rebuttal round and then approves, the surviving
   `minorsFiled` rows' `seats` carry the `:rebut`-suffixed labels — so the literal-clause
   extraction reads the lens as `rebut`, a nonsense value in exactly the field the mechanism
   exists to emit. Fail-open (no throw, no hold), but silently degrades the evidence.

2. **`auditEvidenceOf`'s pinned-sha arm has no producer for `requiresTest:false` tasks (#1660).**
   `auditEvidenceOf` (`workflow-template.js`) looks up the sha from
   `auditLog.find(e => e.gateEvidence && typeof e.gateHeadSha === 'string' ...)`. That entry's
   only producer is `landMerged`'s gate-audit push, which is itself gated:
   `if (task.requiresTest === false) { log(...skipping...) } else { mergedTasksForGateAudit.push(...) }`
   (same file, `landMerged`). A `requiresTest:false` task lands normally with a perfectly knowable
   `mr.integration_sha`, but never gets a gate-audit `auditLog` entry, so every follow-up finding
   it raises renders `pinned sha unrecorded`. This is not a rare edge (the code comment names only
   "a never-merged task filing on the held:escalation path") — it is the **standing shape of every
   docs/prose task** in a plan. This same plan carried four such tasks (1.2, 2.1, 2.2, 2.5).

**Why record this instead of waiting for the fixes:** both are `follow-up`-disposed, not `absorb`,
so nothing forced a fix before land — they are real, currently-live gaps in shipped code. A future
task touching `auditEvidenceOf`, the seat-label lens parse, or the file-followups filing prompt
should check #1659/#1660's current status before re-diagnosing from scratch.

**Adjacent, not separately filed:** the same audit pass also noted (as `disposition: note`, not
Minor) that the emitted "pinned sha" is the task's post-merge `gateHeadSha` (the rebased
integration tip), not the finding's own `audit_sha` — this is a deliberate, fence-forced
substitution (plumbing the seat's own `audit_sha` into `minorsOf`/the auditLog push would exceed
Task 3.2's binding "engine fence: only the filing-prompt surface moves" constraint), and the
"audit round" value is a pre-`--ace` `fixRounds` snapshot that can understate the true raising
round on an ace-regression path — both are informational, not filed as issues.

**Locate-cue (verify still present before acting):** `auditEvidenceOf` and the Evidence-artifacts
emission clause text in `skills/war/assets/workflow-template.js` (search `auditEvidenceOf` and
`## Evidence artifacts`); the seat-label `:rebut` suffix construction (search `':rebut'`); the
`requiresTest === false` gate in `landMerged` (search `gate-audit: skipping`).

## Related

[[premergetip-chain-skips-requirestest-false-tasks]] — the same durable family ("a
`requiresTest:false` task is systematically invisible to gate-audit-derived downstream
structures"), but a *different* named construct (`preMergeTip`'s topology chain, already fixed) —
this lesson's gap 2 is the analogous, still-open instance in the newer `auditEvidenceOf` consumer.
[[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]] — the model
for this "known, filed, not fixed" recording pattern on a freshly-shipped mechanism.
[[standing-instruction-vs-dispatched-prompt-coverage-split]] — same phase's sibling finding: the
standing `file-followups.md` reference doc now under-describes the dispatched prompt's new
Evidence-artifacts duty (informational, not a defect, per the file's own "best-effort enrichment"
posture).
