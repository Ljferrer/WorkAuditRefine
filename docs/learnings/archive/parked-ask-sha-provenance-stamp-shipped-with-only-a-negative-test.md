---
name: parked-ask-sha-provenance-stamp-shipped-with-only-a-negative-test
description: "A fix-round positive test can be silently dropped before land; re-verify the current tip for the assertion, not the round that added it."
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

# A fix-round positive test can vanish before land, leaving only an absence-side assertion

**Fixed:** the positive test is now present in `skills/war/assets/workflow-template.test.mjs`.
A seat echoes `audit_sha: 'deadbeef'` and the test asserts both `out.asks[0].sha` and
`out.handoff.asks[0].sha` carry it, next to the older absence assertion (`sha` is `null` when no
`audit_sha` is echoed). In source, `minorsOf` stamps `sha: auditShaOrSentinel(s.audit_sha)` and
`parkAsk` reads `sha: f.sha ?? null` in `skills/war/assets/workflow-template.js`.

**The durable rule:** in a bounded fix-round loop, a positive test added in one round is not
guaranteed to survive to land. A later round's revert, rebase, or re-audit can drop a pure
test-only addition with no source change, and nothing catches it unless a fresh audit pass or an
explicit delete-and-trace check runs. An `undefined ?? null` fallback keeps an absence-only
assertion green even when the stamp reads a field that does not exist.

**Why:** "the auditor approved this file in round N" does not mean the approved state persists
through later rounds.

**How to apply:**
- When an audit-log finding reads "only the absence case is asserted; delete-and-trace fails",
  grep the CURRENT landed tip for the specific positive assertion before treating it as fixed.
- When closing a vacuous test, land the positive assertion in the SAME commit as any prose or
  doc change, so a revert of that commit cannot drop just the test half.
- Re-verify the current tip, not the round that fixed it.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]] (the generic
delete-the-feature-mentally rule this is an instance of);
[[old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently]] (sibling class: an
uncommitted hand grep, versus a committed-then-reverted test here);
[[gate-audit-family-seat-disposition-ask-silently-dropped]] (a second gap recorded from the same
phase's audit log).

> archived 2026-09-04: resolved — moved to archive
