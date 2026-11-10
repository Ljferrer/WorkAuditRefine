---
name: assert-deepequal-custom-message-suppresses-diff-interpolate-delta
description: "node:assert's assert.deepEqual/assert.equal suppresses its generated actual/expected diff whenever a custom message string is supplied — a default-deny discovery-floor guard that passes a FIXED message string degrades to 'eyeball the reporter dump' instead of naming the offending key, even though the guard still REDs correctly in both directions. Always interpolate the computed delta into the message."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: assert-deepequal-custom-message-suppresses-diff-interpolate-delta
  phase: structural-test-nonvacuity/1.1
  keywords: 
    - assert.deepEqual
    - custom message suppresses diff
    - node:assert
    - discovery floor
    - default-deny census
    - undiscovered unexpected
    - diagnostics degraded not broken
    - failure message naming the key
  tags: 
    - war
    - non-vacuity
    - test-coverage
    - diagnostics
  created: 2026-08-02
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-03T02:46:18.178Z
---

# A fixed custom message on assert.deepEqual hides the diff — compute and interpolate the delta

**The pattern:** RED-ability alone does not certify a guard's diagnostics. `assert.deepEqual`/
`assert.equal`'s custom-message parameter is an all-or-nothing swap: supplying *any* string, even
one that adds useful context, throws away the library's own diff entirely. A default-deny
discovery-floor guard (or any census/sweep guard) that names *which* subject is missing or extra
is a stated design goal in this repo's non-vacuity work — a message that doesn't compute the delta
silently fails that goal while still passing every RED/green mutation proof.

**How to apply:** whenever writing (or auditing) an `assert.deepEqual`/`assert.equal` call with a
custom message on a set/array comparison, check whether the message interpolates a computed
delta (`filter`, set difference, etc.) rather than being a static string. If the guard's
stated purpose includes "naming" the offending item, a static message is a defect even though the
assert still REDs — flag it, and mirror the pattern already used by other census helpers in the
same file/suite rather than inventing a new one.

**Anchors (verify still present before acting):** the discovery-floor assert in
`skills/war/assets/prompt-surface-budgets.test.mjs` (search "did not discover every budgeted
constant"); the sibling delta-computing idiom in `skills/war/assets/skill-doc-contracts.test.mjs`'s
`assertCensus` helper.

Related: [[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]]
(same family — default-deny census construction); [[weak-test-assertion-passes-without-feature-being-exercised]]
(adjacent but distinct: that lesson is about an assert that never fires under mutation at all,
this one is about an assert that fires correctly but can't say why).

> archived 2026-08-15: resolved — moved to archive
