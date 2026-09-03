---
name: new-advisory-lint-rule-batch-can-ship-with-asymmetric-fallback-and-scope-bugs-across-all-four-rules
description: "Review each rule of a new lint-rule batch against its sibling's edge-case grammar and the file's stated fail-open posture."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: new-advisory-lint-rule-batch-can-ship-with-asymmetric-fallback-and-scope-bugs-across-all-four-rules
  phase: authoring-side-verification/phase-1 task 1.3 (audit + gate-audit)
  keywords: 
    - plan-literal-lint
    - advisory lint
    - exit 0 report only
    - WAIVE-<n>
    - right-delimited id
    - lookahead delimiter
    - slice landing class
    - fan-out to every task
    - fail-open fallback
    - class-less pin
    - anywhere-citation
    - GUARDRAILS_MARK
    - END_STATE_MARK
    - document-wide first match
    - bulletRegion
    - findIndex
    - pin-citation
    - section-scoped citation
  tags: 
    - war
    - war-strategy
    - lint
    - plan-literal-lint
    - audit-findings
  created: 2026-08-24
  originSessionId: dcda690d-99d2-4fba-9d28-2a2a858d4676
  modified: 2026-08-25T05:10:53.077Z
---

# A new advisory lint rule batch can ship with the same class of grammar/scope bug in every rule

## The durable rule

When a batch of lint rules lands in one diff, each rule can pass the happy path of the
ratified grammar and still diverge from its siblings on the edge case. Before landing, check
each rule against two references:

1. The sibling rule that solves the same sub-problem. Two implementations of one ratified
   phrase (an id delimiter, a class token) must use the same regex shape and carry the same
   negative test.
2. The file's own stated posture. If the header says "fail-open throughout", an unparseable
   cell must degrade to the fallback path, not fan out or scan wider than its section.

Advisory rules (exit 0, report only) make these bugs cheap at runtime, so they are filed as
`note` and can ship unfixed. Do not assume a shipped rule batch is internally consistent.

**Incident (`skills/war-strategy/assets/plan-literal-lint.mjs`, task 1.3):** three defects with
one shape. The `waive-row-form` row regex used a digit-only right delimiter while `PIN_TOKEN`
used `(?!\w)`, so `WAIVE-1a` passed. The `pin-citation` rule's bare `slice` cell fanned out to
every task instead of taking the anywhere-citation fallback. `GUARDRAILS_MARK` and
`END_STATE_MARK` were resolved by a document-wide `findIndex` instead of within the intent span.

**Fixed in #1966** (`76a2bbe`, `65695e6`): the WAIVE row regex now flags a letter suffix as a
malformed id; a task-less `slice` cell degrades to `fallback()` (D5); the `markIn` helper
searches only inside `intentSpan`.

**How to apply:** when extending `plan-literal-lint.mjs` or any rule family, grep the file for
the sibling that handles the same token and diff the two edge-case branches before landing.

## Related

[[lacks-case-sensitive-vs-has-i-presence-pin-asymmetry]] — the same "two implementations of one
ratified grammar phrase diverge on the edge case" shape, in the shell structural-test family.
[[doctrine-landing-class-token-can-name-a-marker-outside-its-own-ratified-enum]] — the doc-side
instance of the same class-boundary confusion the `slice` fan-out bug hit on the code side.
