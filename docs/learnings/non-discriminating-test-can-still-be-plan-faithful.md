---
name: non-discriminating-test-can-still-be-plan-faithful
description: "A test that never goes RED for the current mechanism, or doesn't alone discriminate a trigger, can still be a legitimate non-vacuous guard"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - vacuous test
    - future regression guard
    - decoy fixture
    - discrimination
    - sibling test
    - weak assertion
    - audit calibration
    - backtick fallback
    - TODO fixture
  provenance: agent-unverified
  slug: non-discriminating-test-can-still-be-plan-faithful
  phase: Contract-on-both-sides/1.1 (2026-07-12)
  tags: 
    - audit-calibration
    - test-quality
    - campaign-ledger
  related: 
    - weak-test-assertion-passes-without-feature-being-exercised
  created: 2026-07-12
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
---

# A test can look "weak" (non-discriminating, never-RED) and still be correct

Two related auditor-calibration patterns surfaced auditing `campaign-ledger.test.mjs`'s Files:
extraction and roadmap-ingestion fixtures. Both named specific line numbers/fixtures
(`roadmaps/notes/decoy2.md`, a sole-backticked-`` `TODO` `` fixture) that do not match this
checkout's current copy of the file — referent not found @ Contract-on-both-sides/1.1; recording
only the generic patterns below, not the named instances, per the audit-log staleness protocol.

**Pattern A — future-regression guard, not current-mechanism proof.** An absence assertion (e.g.
"this decoy path must never appear in the ledger") can be non-vacuous even when it never goes RED
against the CURRENT parser, if the fixture's decoy is deliberately shaped to only matter for a
*hypothetical future* parser capability (e.g. a backticked table-cell token that today's
link-only extractor can't ingest regardless, but a future backtick-cell-extraction enhancement
might). Before flagging such an assertion as vacuous, check whether the surrounding comment
documents this forward-looking intent — if so, it's correct to keep even though it can't currently
fail.

**Pattern B — discrimination can be split across sibling fixtures.** A single fixture that
produces the same observable output (e.g. `[]`) under two different possible root causes (backtick-
ABSENCE keying vs. zero-files keying) does not itself discriminate between them — but if an
ADJACENT fixture in the same suite exercises the other branch (e.g. a mixed-defers case that goes
RED if the fallback fires despite a backtick being present), the discrimination is legitimately
provided by the pair, not any single test. Check sibling tests in the same suite/section before
concluding a test's assertion is non-discriminating in isolation.

**How to apply:** when a test's assertion looks like it "doesn't prove much" in isolation, read (1)
its authoring comment for forward-looking/future-regression intent, and (2) the adjacent tests in
the same suite section for split discrimination, before rating it a defect.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]] (the contrasting failure
mode — when a weak assertion genuinely IS the defect, because no sibling test picks up the slack).
