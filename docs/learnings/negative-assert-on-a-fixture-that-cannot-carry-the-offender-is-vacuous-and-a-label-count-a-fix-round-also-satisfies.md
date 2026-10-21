---
name: negative-assert-on-a-fixture-that-cannot-carry-the-offender-is-vacuous-and-a-label-count-a-fix-round-also-satisfies
description: "A not-seated assertion on a fixture with no such row cannot fail, and a label count that a fix round also reaches proves nothing"
metadata:
  node_type: memory
  type: project
  keywords:
    - vacuous negative assertion
    - no evidence auditor seated
    - fixture cannot carry the row
    - label count witness
    - fix round relabel
    - widen path ran
    - lone-seat widening
    - discriminating witness
    - End state 23
    - weak test
    - delete the feature
  provenance: code-verified
  slug: negative-assert-on-a-fixture-that-cannot-carry-the-offender-is-vacuous-and-a-label-count-a-fix-round-also-satisfies
  phase: 2026-10-20-rea-artifact-evidence/phase-2 task 2.3
  tags:
    - war
    - testing
    - assertion-strength
    - workflow-template
  created: 2026-10-21
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-21T16:42:59.860Z
---

# Two new vacuous-test shapes from the REA absent-path test

Both shapes were caught by audit seats and fixed in ace rounds before land. Both extend [[weak-test-assertion-passes-without-feature-being-exercised]].

**Shape 1: a negative assertion over a fixture that cannot carry the offender.** End state 23 says that with `args.evidence` off the engine "seats no evidence auditor". The first test asserted `!r.calls.some(isEvidenceSeat)` on `PROVISION_ARGS`, whose roster is one regular seat. No engine route adds a roster row by itself, so the assertion passes whatever the engine does. Five audit seats raised it, as Minor or Nit.
- Check before trusting "X is absent": can the fixture even contain X? If the input never carries it and the engine never invents it, the assertion is true by construction.
- Fix used here: add a fixture that can produce the offender. A lone seat at low confidence nominates the evidence lens through the widen path. With the lens barred, the engine falls back to the default roster, and the assertion now has something to fail on.

**Shape 2: a label-count witness that a fix round also reaches.** The widen arm first proved "the widen path ran" with `audit:t1:security` appearing at least twice. The lone seat returned `request_changes` with a Major, so the fix round and a full re-audit label `audit:t1:security` a second time even if the widening block is deleted. The count could not see a removed branch.
- Fix used here: witness the branch itself. The engine logs `lone-seat widening (Critical or low confidence; source: default fallback)` only inside the widening branch, and `source: nominated` only when the nomination was not barred. The test asserts the first and refuses the second.
- Rule: a witness for "path P ran" must be a side effect that only P produces. A repeated dispatch label is shared by every path that re-audits.

**Residual.** The original `>= 2` line and the default-roster `isEvidenceSeat` line still exist at the landed tip. The discriminating witnesses sit beside them. A reader who sees only those two lines will think the test is weak. Read the whole test.

**Status.** Audit findings resolved in a fix round before land, recorded as pattern, not live instance. The engine still does not drop a stray evidence row when `args.evidence` is off; see [[evidence-knob-has-two-engine-carriers-run-evidence-and-args-evidence]].

**Locate-cue (verify still present before acting).** `skills/war/assets/workflow-template.test.mjs`, the test titled "rea absent path: evidence off with targetArtifacts present". Found at landed tip 0d8a9fba, read through the run's `_refinery` worktree (HEAD equal to the tip).
