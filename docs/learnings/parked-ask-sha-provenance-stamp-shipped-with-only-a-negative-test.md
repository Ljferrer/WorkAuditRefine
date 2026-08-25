---
name: parked-ask-sha-provenance-stamp-shipped-with-only-a-negative-test
description: "The ask-disposition channel's parked-ask `sha` provenance field (minorsOf stamps `sha: s.audit_sha`, parkAsk reads `f.sha ?? null`) shipped to land with only an absence-side assertion (`a.sha === null`) — a positive-echo test existed in one fix round (485bf6b) and was gone again by the gate-audit tip (711233d) and remained gone at the final landed tip, with the cause of the regression never established"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: parked-ask-sha-provenance-stamp-shipped-with-only-a-negative-test
  phase: ask-disposition/phase-1 (task 1.1)
  tags: 
    - workflow-template.js
    - workflow-template.test.mjs
    - vacuous-test
    - fix-rounds
    - audit_sha
    - parkAsk
    - minorsOf
    - delete-and-trace
  keywords: 
    - parked ask sha
    - audit_sha provenance
    - vacuous assertion
    - delete-and-trace
    - fix round regression
    - test coverage regressed
    - forward-revert
    - minorsOf
    - parkAsk
  created: 2026-08-25
  originSessionId: 351f8fc5-4d48-4ee9-8beb-5d257d9bcf6f
  modified: 2026-08-25T22:22:07.465Z
---

# A field can gain a real stamp in source while its only test stays absence-only — and a fix round can silently regress a positive test back to that state

**What happened (code-verified — confirmed at the landed tip `4bbfdc3902d079261eb607f3a5dc2f7d153f22fe`
on `dev/2026-08-25-ask-disposition`, read via the `_refinery` worktree whose HEAD matched that SHA
exactly):** `skills/war/assets/workflow-template.js`'s `minorsOf` (line 746) stamps
`sha: s.audit_sha` onto every Minor/Nit copy, and `parkAsk` (line 768) carries it onto the parked
ask record as `sha: f.sha ?? null`. At the landed tip, `workflow-template.test.mjs` line 3949 is
the ONLY assertion touching this field: `assert.equal(a.sha, null, 'no echoed audit_sha ⇒ sha
null')` — an absence-side assertion. Because `undefined ?? null` collapses to `null`, a regression
of the stamp to a non-existent field (e.g. `sha: s.sha` instead of `s.audit_sha`) would leave this
assertion green — mandatory delete-and-trace fails. The gate-audit pass (auditSha `711233d`) had
already caught and recorded this exact gap as a Minor follow-up, noting that a POSITIVE sibling
test (an auditor seat echoing `audit_sha: 'deadbeef'`, asserting the parked record's `sha` AND
the handoff's `sha` both carry it) had landed at commit `485bf6b` and was then gone again at
`711233d` — with the note "it was a pure test addition with no source change, so the regression
cause is not self-evident from the pinned history." The gap was still present, unresolved, at
the final landed tip.

**The durable pattern:** in a bounded fix-round loop, a positive test added in one round to close
a vacuous-assertion gap is not guaranteed to survive to land — a later round's revert/rebase/
re-audit cycle can silently drop a pure test-only addition with no accompanying source change,
and nothing short of a fresh audit pass (or an explicit delete-and-trace check) will catch that
the fix regressed. Do not assume "the auditor logged approve on this file" means the state it
approved persists through subsequent rounds — always re-verify the CURRENT tip, not the round
that fixed it.

**How to apply:** when an audit-log finding of this shape ("only the absence case is asserted;
delete-and-trace fails") recurs, grep the CURRENT landed tip for the specific positive assertion
before assuming it was fixed — a finding that reads as "resolved in flight" in an earlier round's
narrative can still be live at land. When authoring a fix for a vacuous test, prefer landing the
positive assertion in the SAME commit as any accompanying prose/doc change so a later revert of
that commit cannot silently drop just the test half.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]] (archived — the generic
delete-the-feature-mentally rule this is an instance of);
[[old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently]] (a sibling class — an
uncommitted hand grep vs. here a committed-then-reverted test);
[[gate-audit-family-seat-disposition-ask-silently-dropped]] (a second live gap recorded from the
same phase's audit log).
