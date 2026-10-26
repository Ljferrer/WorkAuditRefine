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
    - emptied roster hold
  provenance: code-verified
  slug: evidence-knob-has-two-engine-carriers-run-evidence-and-args-evidence
  phase: 2026-10-20-rea-artifact-evidence/phase-1 task 1.1, updated at phase-2 (tasks 2.3, 2.4, p2-polish) and phase-3 (task 3.1 ruling #2404, p3-polish, servitor)
  tags:
    - war
    - engine
    - plan-seam
    - phase-2
    - phase-3
  created: 2026-10-20
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-22T15:49:55.502Z
---

# The evidence knob reaches the engine through two carriers

**Phase 2 state (landed).** Both carriers now exist in `skills/war/assets/workflow-template.js`.
- `run.evidence` feeds `validateRoster(t.roster, run.evidence)` at phase start and `validateRoster(defaultRoster, run.evidence)` in the phase-close sweep. An evidence-type row is refused unless it is `true`.
- `args.evidence` is a boolean or absent. `null` and any other type are refused at entry. It sets `reaOn`, which gates the worker REA clause, the regular-seat staleness line, and the one loud line.
- A Lead that threads `args.evidence` but leaves `run.evidence` out of `args.run` gets `held:workflow-error` at entry. The failure is loud.
- A Lead that threads only `run.evidence` seats the evidence auditor but leaves every clause off. The failure is silent. (Closed in phase 3: ruling #2404 drops that row at entry and names it on the loud line.)

**Phase 3 state: the engine drops stray evidence rows (ruling #2404).** With `args.evidence` off, `dropEvidenceRows` filters every evidence-type row out of each task roster, and out of `defaultRoster` in place, before the widen fallback and the phase-close sweep read it. The one loud OFF line names each dropped row as `<task-id|audit.roster>:<lens>` and carries the count. Three audit seats had raised this as an `ask` in phase 2 (engine drops the row, or seating stays Lead-only). The operator ruled for the engine drop with a loud line. The Lead strip is the first line of defense, and the engine drop is the backstop behind it.

**Order matters for task rosters.** In the per-task loop, `validateRoster(t.roster, run.evidence)` runs before `dropEvidenceRows(t.roster, t.id)`. So a task-roster row is dropped, not refused, only when `run.evidence` is on and `args.evidence` is off (REA absent). With `run.evidence` off, a task-roster evidence row still ends in `held:workflow-error` at entry. An `audit.roster` row is spliced out when `defaultRoster` is defined, before the sweep's `validateRoster` runs. So it is dropped whatever `run.evidence` says.

**An emptied roster holds the phase.** If the drop leaves a task roster with no rows, the loop throws (`roster held only evidence-type rows and args.evidence is off`), which ends in `held:workflow-error`. The audits judged this latitude. It is reachable only through a Lead seeding bug. Two audit seats parked an `ask` for hold versus fall back to the stripped default roster and proceed (G3 fail-open). The operator ratified hold on 2026-10-22.

**How the Lead closes it.** `skills/war/references/artifact-evidence-lead.md` makes the Lead strip every evidence-type row from the pool and from every seeded task roster. The strip holds on the skip arm too. The Lead adds the seat only for citing tasks, and only when `run.evidence` is on and REA presence resolved. The phase-2 polish pass widened the Decompose pointer in `skills/war/SKILL.md`. It now fires on a config `audit.roster` evidence row even when the plan has no Target artifacts block.

**How to apply.**
- With `args.evidence` off, a stray `audit.roster` evidence row is always dropped and named on the loud line. A stray task-roster row is dropped only when `run.evidence` is on. With `run.evidence` off, it fails `validateRoster` at entry. Keep the Lead strip anyway: a task roster of only evidence rows still throws.
- Do not read the phase-2 "silent failure" bullet as current. It describes the state before ruling #2404.
- A test that asserts "no evidence auditor seated" on a default-roster fixture proves nothing. See [[negative-assert-on-a-fixture-that-cannot-carry-the-offender-is-vacuous-and-a-label-count-a-fix-round-also-satisfies]].
- A comment on `reaOn` once claimed a dropped row always means `run.evidence` on. That is false for the `audit.roster` splice. A fix round scoped the comment to task rosters. Re-read the comment before trusting a "dropped means X" claim.
- The phase-1 worry about mocks (the `defaultImpl` and `sweepBase` answers only for `war-auditor`) is resolved. The roster entry test in `workflow-template.test.mjs` now lands a task through an evidence seat.

**Locate-cue (verify still present before acting).** In `skills/war/assets/workflow-template.js`, search `const reaOn = A.evidence === true`, `const dropEvidenceRows`, `droppedEvidenceRows` and `validateRoster(t.roster, run.evidence)`. In `skills/war/references/artifact-evidence-lead.md`, read the `## Skip with one loud line` section. Found at the phase-3 integration tip f94b8783, read through the run's `_refinery` worktree. That commit is the second parent of landed tip 6e655d6e, and the landed merge's other parent is an ancestor of it, so the two trees match by ancestry (tree not read directly).
