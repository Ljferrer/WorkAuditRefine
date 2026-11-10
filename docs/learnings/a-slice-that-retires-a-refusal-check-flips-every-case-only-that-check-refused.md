---
name: a-slice-that-retires-a-refusal-check-flips-every-case-only-that-check-refused
description: Retiring a refusal check flips every fixture that only that check refused
metadata:
  promoted: dev/2026-11-08-engine-findings-ace-and-late-fix@phase-3
  node_type: memory
  type: project
  keywords:
    - retired marker
    - verdict flip
    - every other verdict is kept
    - self-inconsistent plan slice
    - fixture expectations
    - refusal check removal
    - test family rewrite
    - plan authoring
    - widened predicate
    - shared harness fixture
  provenance: code-verified
  slug: a-slice-that-retires-a-refusal-check-flips-every-case-only-that-check-refused
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-3 (task 3.1) + 2026-11-08-engine-findings-ace-and-late-fix/phase-3 (task 3.1, recurrence)
  tags:
    - plan-authoring
    - red-team
    - tests
  created: 2026-10-30
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-11-10T03:09:08.900Z
---

# A slice that retires a refusal check flips every case only that check refused

**The trap.** A plan slice can retire a refusal check and also say "only case X flips, every other verdict is kept".
Both sentences cannot hold.
Every fixture that only the retired check refused now passes.

**Instance.** Task 3.1 of plan `docs/plans/2026-10-28-blocked-ace-and-merge-provenance.md` replaced the `has mixed history after task-owned work` marker in `skills/war/assets/task-integrated.sh` with a merge-commit rule.
The same slice said a net-zero task flips to `TASK_INTEGRATED` and "every other verdict is kept".
The `recovery owned footprint:` family, now in `skills/war/assets/workflow-template.git-3.test.mjs`, flipped about seven scenarios, not one.
The extra flips include `unowned-overlap` and `unowned-late-contribution`, which do not net to zero.
Three audit seats each raised it as a `note` Nit, and two panels repeated it.
The worker's candidate was correct, and the slice sentence was wrong.

**Rule for plan authors and red-team.** If a slice removes a check, list each fixture that only that check refused.
State their new verdicts in the slice, or drop the "every other verdict is kept" claim.
If a worker meets this conflict, follow the retirement and record the wider flip set in the commit body.

**Recurrence: widening a predicate (2026-11-08-engine-findings-ace-and-late-fix, phase 3, task 3.1).**
The mirror case is a slice that widens a predicate.
D11 widened `aceIsSegment` so a red with no `head_sha` and no ids re-dispatches as a segment.
A shared harness fixture still answered the ace gate with a bare red.
It now looped `roundLimit` times and reached the revert through the spent-bound died arm, not the RED arm.
Its callers asserted only the captured revert script, and both arms revert, so every test stayed green.
An audit seat found it, and a fix round moved the fixture to a judged red before land.
Audit finding resolved in a fix round before land — recorded as pattern, not live instance.
Rule: if a slice widens or narrows a predicate, survey every fixture whose reply shape crosses the new line, shared harness helpers included.
A test that asserts only an effect two arms share cannot tell which arm ran.

Related: [[plan-end-state-superseded-by-a-later-decision-row-stays-live-and-attests-unmet-at-the-gate]], [[weak-test-assertion-passes-without-feature-being-exercised]].

Locate-cue: verify still present before acting. At landed tip 8c1a7a51 the plan's Task 3.1 slice holds both "every other verdict is kept" and the mixed-history retirement.
`skills/war/assets/task-integrated.sh` no longer contains "mixed history".
The `recovery owned footprint:` scenario loop is in `skills/war/assets/workflow-template.git-3.test.mjs`.
