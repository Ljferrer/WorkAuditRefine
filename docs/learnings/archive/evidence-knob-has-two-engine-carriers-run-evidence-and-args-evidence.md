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

**Both carriers live in `skills/war/assets/workflow-template.js`.**
- `run.evidence` feeds `validateRoster(t.roster, run.evidence)` at phase start and `validateRoster(defaultRoster, run.evidence)` in the phase-close sweep. An evidence-type row is refused unless it is `true`.
- `args.evidence` is a boolean or absent. `null` and any other type are refused at entry. It sets `reaOn`, which gates the worker REA clause, the regular-seat staleness line, and the one loud line.
- No entry check compares the two knobs. If a Lead threads `args.evidence` but leaves `run.evidence` out of `args.run`, a task-roster evidence row ends in `held:workflow-error`. An `audit.roster` evidence row instead fails the sweep's `validateRoster`, and the sweep skips fail-open and drains its queue to follow-up. With no evidence row, nothing fires.

**The engine drops stray evidence rows (ruling #2404).** With `args.evidence` off, `dropEvidenceRows` filters every evidence-type row out of each task roster, and out of `defaultRoster` in place, before the widen fallback and the phase-close sweep read it. The one loud OFF line names each dropped row as `<task-id|audit.roster>:<lens>` and carries the count. The Lead strip is the first line of defense, and the engine drop is the backstop behind it. Landed in 6e655d6e.

**Order matters for task rosters.** In the per-task loop, `validateRoster(t.roster, run.evidence)` runs before `dropEvidenceRows(t.roster, t.id)`. So a task-roster row is dropped, not refused, only when `run.evidence` is on and `args.evidence` is off (REA absent). With `run.evidence` off, a task-roster evidence row still ends in `held:workflow-error` at entry. An `audit.roster` row is spliced out before the sweep's `validateRoster` runs, so it is dropped whatever `run.evidence` says.

**An emptied roster holds the phase.** If the drop leaves a task roster with no rows, the loop throws (`roster held only evidence-type rows and args.evidence is off`), which ends in `held:workflow-error`. It is reachable only through a Lead seeding bug. The operator ratified hold over fall-back on 2026-10-22.

**How the Lead closes it.** `skills/war/references/artifact-evidence-lead.md` makes the Lead strip every evidence-type row from the pool and from every seeded task roster. The strip holds on the skip arm too. The Lead adds the seat only for citing tasks, and only when `run.evidence` is on and REA presence resolved. The Decompose pointer in `skills/war/SKILL.md` also fires on a config `audit.roster` evidence row when the plan has no Target artifacts block.

**Why:** the carriers fail differently, so one knob threaded alone gives a hold, a skip or a dropped row depending on where the row sits.

**How to apply.**
- With `args.evidence` off, a stray `audit.roster` evidence row is always dropped and named on the loud line. A stray task-roster row is dropped only when `run.evidence` is on. Keep the Lead strip anyway: a task roster of only evidence rows still throws.
- A test that asserts "no evidence auditor seated" on a default-roster fixture proves nothing. See [[negative-assert-on-a-fixture-that-cannot-carry-the-offender-is-vacuous-and-a-label-count-a-fix-round-also-satisfies]].
- Re-read the comment above `reaOn` before trusting a "dropped means X" claim. It scopes that claim by roster.

**Locate-cue (verify still present before acting).** In `skills/war/assets/workflow-template.js`, search `const reaOn = A.evidence === true`, `const dropEvidenceRows`, `droppedEvidenceRows` and `validateRoster(t.roster, run.evidence)`. In `skills/war/references/artifact-evidence-lead.md`, read the `## Skip with one loud line` section. The entry test is `roster — phase-start assertion threads run.evidence` in `skills/war/assets/workflow-template.engine-1.test.mjs`.

> archived 2026-10-30: resolved — moved to archive
