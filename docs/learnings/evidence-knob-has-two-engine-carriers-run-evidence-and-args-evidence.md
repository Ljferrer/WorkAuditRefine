---
name: evidence-knob-has-two-engine-carriers-run-evidence-and-args-evidence
description: run.evidence validates rosters, args.evidence gates clauses, and only the Lead keeps the two in step
metadata:
  node_type: memory
  type: project
  keywords:
    - run.evidence
    - args.evidence
    - args.targetArtifacts
    - validateRoster
    - evidence seat
    - war-evidence-auditor
    - held:workflow-error
    - Lead procedure
    - artifact-evidence-lead
    - SEAT_AGENT_TYPES
    - reaOn
    - loud line
    - strip the pool
    - evidence seat row stripped
    - Decompose trigger
  provenance: code-verified
  slug: evidence-knob-has-two-engine-carriers-run-evidence-and-args-evidence
  phase: 2026-10-20-rea-artifact-evidence/phase-1 task 1.1, updated at phase-2 (tasks 2.3, 2.4, p2-polish; landed tip 0d8a9fba)
  tags:
    - war
    - engine
    - plan-seam
    - phase-2
  created: 2026-10-20
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-21T16:41:32.859Z
---

# The evidence knob reaches the engine through two carriers

**Phase 2 state (landed).** Both carriers now exist in `skills/war/assets/workflow-template.js`.
- `run.evidence` feeds `validateRoster(t.roster, run.evidence)` at phase start and `validateRoster(defaultRoster, run.evidence)` in the phase-close sweep. An evidence-type row is refused unless it is `true`.
- `args.evidence` is a boolean or absent. `null` and any other type are refused at entry. It sets `reaOn`, which gates the worker REA clause, the regular-seat staleness line, and the one loud line.
- A Lead that threads `args.evidence` but leaves `run.evidence` out of `args.run` gets `held:workflow-error` at entry. The failure is loud.
- A Lead that threads only `run.evidence` seats the evidence auditor but leaves every clause off. The failure is silent.

**The engine does not reconcile the two.** With `run.evidence` true, `args.evidence` absent, and a roster that still carries an evidence-type row, `runSeat` dispatches the evidence seat anyway. The loud line then claims "no evidence seat", which is false for that launch. Three audit seats raised this as an `ask` (engine drops the row, or seating stays Lead-only). No one ruled it before land. The landed answer is Lead-only.

**How the Lead closes it.** `skills/war/references/artifact-evidence-lead.md` makes the Lead strip every evidence-type row from the pool and from every seeded task roster. The strip holds on the skip arm too. The Lead adds the seat only for citing tasks, and only when `run.evidence` is on and REA presence resolved. The phase-2 polish pass widened the Decompose pointer in `skills/war/SKILL.md`. It now fires on a config `audit.roster` evidence row even when the plan has no Target artifacts block.

**How to apply.**
- Do not assume the engine protects an off-run from a stray evidence row. Check the Lead strip.
- A test that asserts "no evidence auditor seated" on a default-roster fixture proves nothing. See [[negative-assert-on-a-fixture-that-cannot-carry-the-offender-is-vacuous-and-a-label-count-a-fix-round-also-satisfies]].
- The phase-1 worry about mocks (the `defaultImpl` and `sweepBase` answers only for `war-auditor`) is resolved. The roster entry test in `workflow-template.test.mjs` now lands a task through an evidence seat.

**Locate-cue (verify still present before acting).** In `skills/war/assets/workflow-template.js`, search `const reaOn = A.evidence === true` and `validateRoster(t.roster, run.evidence)`. In `skills/war/references/artifact-evidence-lead.md`, read the `## Skip with one loud line` section. Found at landed tip 0d8a9fba, read through the run's `_refinery` worktree (HEAD equal to the tip).
