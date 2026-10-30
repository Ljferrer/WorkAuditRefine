---
name: negative-assert-on-a-fixture-that-cannot-carry-the-offender-is-vacuous-and-a-label-count-a-fix-round-also-satisfies
description: "A not-seated assertion on a fixture with no such row cannot fail, and a label count that a fix round also reaches proves nothing"
metadata:
  promoted: dev/2026-10-20-rea-artifact-evidence@phase-3
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
    - OLD-absent half
    - add-only surface
    - doctrine grep guard
    - retired premise
  provenance: code-verified
  slug: negative-assert-on-a-fixture-that-cannot-carry-the-offender-is-vacuous-and-a-label-count-a-fix-round-also-satisfies
  phase: 2026-10-20-rea-artifact-evidence/phase-2 task 2.3 +1 recurrence (2026-10-28-blocked-ace-and-merge-provenance/phase-5 task 5.4)
  tags:
    - war
    - testing
    - assertion-strength
    - workflow-template
  created: 2026-10-21
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-30T13:38:09.861Z
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

**Phase 3 follow-up.** Phase 3 gave the engine the behavior these shapes were probing. Since phase 3 (ruling #2404) the engine drops stray evidence-type rows when `args.evidence` is off and names them on the one loud line; see [[evidence-knob-has-two-engine-carriers-run-evidence-and-args-evidence]]. The same test now carries arms whose fixtures can hold the offender: a stray task-roster row, stray `audit.roster` rows in the sweep panel (with `run.evidence` on and off), and a widen arm. The widen arm uses a lone security seat at low confidence with no nomination, so the fallback reads the default roster, which carries a stray evidence row. A mutation that moves the in-place `defaultRoster` splice to after the widen read turns only that arm red. Check each arm with that mutation test before you call it covered.

**Shape 3 (recurrence, 2026-10-28-blocked-ace-and-merge-provenance phase 5, task 5.4): an OLD-absent half on an add-only doc surface.** The #2485 doctrine grep guard gives each surface two halves: retired text absent, new text present. Some surfaces only ever added text: a new ADR section, an amendment line, a dated note on a lesson. Those rows use the premise sentences themselves (`PREMISE_TOKENS`) as their OLD half. The surface never held them, so that half cannot go red today. A test-fidelity seat noted it as a Nit, and the plan slice allowed it.
- That half still guards the future: it goes red if someone later writes the premise into that region. It just cannot catch a stale surface.
- What carries the row is the NEW-present half plus fail-closed extraction. A missing anchor throws, an empty region fails, and an empty token list fails.
- A shared token read from the engine at load time sits in a try/catch. On failure, every row that needs it gets a sentinel no file contains. Each row then fails on its own line, and the whole test file never dies at import.
- Rule: when you review a retire-the-text grep guard, find the rows whose OLD half the surface never held. Judge those rows only by their NEW half.

**Status.** Audit findings from phase 2 resolved in a fix round before land, recorded as pattern, not live instance.

**Locate-cue (verify still present before acting).** `skills/war/assets/workflow-template.engine-1.test.mjs`, the test titled "rea absent path: evidence off with targetArtifacts present", and its `widenStray` arm. The test moved there when `workflow-template.test.mjs` was split into topic files. First found in the old file at the phase-3 integration tip f94b8783, read through the run's `_refinery` worktree. That commit is the second parent of landed tip 6e655d6e, and the landed merge's other parent is an ancestor of it, so the two trees match by ancestry (tree not read directly).

**Locate-cue for shape 3 (verify still present before acting).** `skills/war/assets/doc-semantics.test.mjs`, the `PREMISE_TOKENS` constant and the `ES18_SURFACES` rows whose `old` is `[...PREMISE_TOKENS]` (ADR 0021, ADR 0013, the four ADR 0054 rows, the two dated lessons). Also the `UNREADABLE_FORM` sentinel beside `ENGINE_MERGE_FORM`. Found at landed tip 7d6b597e, read through the run's `_refinery` worktree, whose HEAD equals that tip. This finding was a live note at land, not fixed in a fix round.
