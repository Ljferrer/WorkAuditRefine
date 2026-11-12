---
name: an-extraction-regex-that-spells-the-expected-keys-makes-the-equality-assert-unable-to-fail
description: An extraction regex that spells the expected keys makes its equality assert vacuous
metadata:
  node_type: memory
  type: project
  keywords:
    - engine-fact-pin
    - extraction regex
    - deepEqual
    - tautological assert
    - appended key
    - prefix match
    - doc-engine drift
    - drift guard
  provenance: agent-unverified
  slug: an-extraction-regex-that-spells-the-expected-keys-makes-the-equality-assert-unable-to-fail
  phase: 2026-11-08-doc-truth-drift-and-adr-hygiene/phase-3 (task 3.5)
  tags:
    - testing
    - drift-guard
    - doc-contracts
  created: 2026-11-12
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-12T12:16:47.123Z
---

**Pattern.** A doc pin extracts an engine literal, then compares the extracted keys with a fixed list.
If the extraction regex itself spells those keys, the compare can never fail once the regex matches.
If the regex also matches only a prefix, a key the engine appends later escapes the pin.
The doc then names fewer keys than the engine returns, and every suite stays green.

**Fix shape.** Capture the whole literal with a generic pattern, such as everything up to the closing brace.
Split the captured text into keys, then run the equality assert against the fixed list.
Now an appended or renamed key reds the row.

**Same class, set form.** A doc sentence lists the call-site names that mint a label.
Extract the names from the call sites (a `matchAll` over the call), and assert each one appears in the doc.
A row that only reads the doc cannot see a new call site.

**Provenance note.** Audit finding resolved in a fix round before land — recorded as pattern, not live instance.
A test-fidelity seat found it by reading the regex, not by running a mutation.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]], [[a-doc-shape-test-that-takes-the-first-regex-match-binds-the-wrong-row-when-a-second-line-reuses-the-shape]], [[negative-assert-on-a-fixture-that-cannot-carry-the-offender-is-vacuous-and-a-label-count-a-fix-round-also-satisfies]].
