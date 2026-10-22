---
name: evidence-knob-has-two-engine-carriers-run-evidence-and-args-evidence
description: run.evidence validates rosters, args.evidence gates clauses and drops stray evidence rows at entry; the Lead strip stays the first line of defense
metadata:
  node_type: memory
  type: project
  keywords:
    - run.evidence
    - args.evidence
    - args.targetArtifacts
    - validateRoster
    - dropEvidenceRows
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
  phase: 2026-10-20-rea-artifact-evidence/phase-1 task 1.1, updated at phase-2 (tasks 2.3, 2.4, p2-polish) and phase-3 (task 3.1 ruling #2404, p3-polish)
  tags:
    - war
    - engine
    - plan-seam
    - phase-2
    - phase-3
  created: 2026-10-20
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-21T20:10:00.000Z
---

# The evidence knob reaches the engine through two carriers

**Phase 2 state (landed).** Both carriers now exist in `skills/war/assets/workflow-template.js`.
- `run.evidence` feeds `validateRoster(t.roster, run.evidence)` at phase start and `validateRoster(defaultRoster, run.evidence)` in the phase-close sweep. An evidence-type row is refused unless it is `true`.
- `args.evidence` is a boolean or absent. `null` and any other type are refused at entry. It sets `reaOn`, which gates the worker REA clause, the regular-seat staleness line, and the one loud line.
- A Lead that threads `args.evidence` but leaves `run.evidence` out of `args.run` gets `held:workflow-error` at entry. The failure is loud.
- A Lead that threads only `run.evidence` seats the evidence auditor but leaves every clause off. The failure is silent.

**Phase 3 state: the engine drops stray evidence rows (ruling #2404).** With `args.evidence` off, `dropEvidenceRows` filters every evidence-type row out of each task roster after its `validateRoster` pass, and out of `defaultRoster` in place before the widen fallback and the phase-close sweep read it. The one loud OFF line names each dropped row as `<task-id|audit.roster>:<lens>` and carries the count. A task roster that held only evidence-type rows throws, like any broken roster. Three audit seats had raised this as an `ask` in phase 2 (engine drops the row, or seating stays Lead-only). The operator ruled for the engine drop with a loud line. The Lead strip is the first line of defense, and the engine drop is the backstop behind it.

**How the Lead closes it.** `skills/war/references/artifact-evidence-lead.md` makes the Lead strip every evidence-type row from the pool and from every seeded task roster. The strip holds on the skip arm too. The Lead adds the seat only for citing tasks, and only when `run.evidence` is on and REA presence resolved. The phase-2 polish pass widened the Decompose pointer in `skills/war/SKILL.md`. It now fires on a config `audit.roster` evidence row even when the plan has no Target artifacts block.

**How to apply.**
- An off-run with a stray evidence row proceeds with the row dropped and named on the loud line. Keep the Lead strip anyway: a task roster of only evidence rows still throws, and the strip is what keeps the roster coherent before entry.
- A test that asserts "no evidence auditor seated" on a default-roster fixture proves nothing. See [[negative-assert-on-a-fixture-that-cannot-carry-the-offender-is-vacuous-and-a-label-count-a-fix-round-also-satisfies]].
- The phase-1 worry about mocks (the `defaultImpl` and `sweepBase` answers only for `war-auditor`) is resolved. The roster entry test in `workflow-template.test.mjs` now lands a task through an evidence seat.

**Locate-cue (verify still present before acting).** In `skills/war/assets/workflow-template.js`, search `const reaOn = A.evidence === true`, `const dropEvidenceRows` and `validateRoster(t.roster, run.evidence)`. In `skills/war/references/artifact-evidence-lead.md`, read the `## Skip with one loud line` section. Found at phase-3 integrated tip f39fca02, read in the p3-polish worktree.
