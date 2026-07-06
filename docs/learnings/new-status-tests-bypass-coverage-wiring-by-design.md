---
name: ""
metadata: 
  node_type: memory
  slug: new-status-tests-bypass-coverage-wiring-by-design
  phase: red-team-verdict-integrity/t2.1
  type: project
  keywords: [inner-layer test, production wiring, vacuous assertion, direct function call, integration point, verdict classify]
  tags: 
    - red-team
    - testing-pattern
    - coverage-wiring
    - design-intent
    - audit-nit
  files: 
    - skills/red-team/assets/red-team-gate.test.mjs
  relates: 
    - "[[weak-test-assertion-passes-without-feature-being-exercised]]"
    - "[[pass-probe-demotion-gate-layer-without-probe-contract]]"
  created: 2026-06-26
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
---

# New gate-status tests calling bare verdict(findings) bypass coverage wiring by design — valid only when production path is separately covered

## What the auditor flagged (Nit, not a defect)

When T2.1 added CLEARED and BLOCKED test cases for the new probe-status-aware classification, the
new tests called `verdict(findings)` directly (no coverage arg), exercising `classify()` in
isolation rather than through the full production path
`verdict(allFindings(cov.onTarget), cov)`. The auditor noted this is the plan-mandated form (Step 1
specifies the bare path), and the production wiring was verified to already be exercised by the
updated on-target Major test at lines 159-165 (verify still present before acting).

## The durable pattern

When adding tests for a new classification branch (new status, new severity tier, new verdict
enum), calling the inner function directly is acceptable **if and only if**:
1. At least one existing test exercises the full production wiring (`verdict(allFindings(...), cov)`)
   that reaches the same branch.
2. The new test is explicitly documented (or plan-referenced) as testing the inner layer, not the
   full production path.

If neither condition is met, the new test is a vacuous assertion: it exercises code that the
production path never reaches the same way. See [[weak-test-assertion-passes-without-feature-being-exercised]]
for the related "assertion passes without feature being exercised" pattern.

## How to apply

- When an auditor flags "test bypasses coverage layer," check: is the production path covered
  elsewhere in the suite? If yes, the Nit is informational; no change needed.
- If adding a new probe status (e.g., `'skip'`), add at least one test that routes through
  `classifyCoverage + allFindings + verdict(..., cov)` to pin the integration point, even if the
  behavior is also exercised by the inner-path test.
- The plan's task slice defines which layer the step tests; a reviewer cannot flag the inner-layer
  test as a gap without checking whether the integration-layer test is already present.
