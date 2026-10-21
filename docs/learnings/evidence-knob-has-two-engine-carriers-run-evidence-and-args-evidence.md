---
name: evidence-knob-has-two-engine-carriers-run-evidence-and-args-evidence
description: run.evidence validates rosters; args.evidence (phase 2) gates clauses; the Lead must thread both
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
  provenance: code-verified
  slug: evidence-knob-has-two-engine-carriers-run-evidence-and-args-evidence
  phase: 2026-10-20-rea-artifact-evidence/phase-1 task 1.1
  tags:
    - war
    - engine
    - plan-seam
    - phase-2
  created: 2026-10-20
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-21T07:00:02.114Z
---

# The evidence knob reaches the engine through two carriers

**Phase 1 state.** Phase 1 landed the validator half only. `validateRoster(roster, evidence)` rejects an evidence-type row unless `evidence === true`. The engine passes `run.evidence` at two call sites: the phase-start roster assertion and the phase-close sweep's default roster. No `args.evidence` exists in the engine yet.

**The seam.** Plan Tasks 2.3 and 2.4 add a separate top-level `args.evidence` for the worker clause and the staleness line, plus `args.targetArtifacts`. Both signals come from one config.
- A Lead that threads `args.evidence` and the seat rows but leaves `run.evidence` out of `args.run` gets `held:workflow-error` at entry. The failure is loud.
- A Lead that threads only `run.evidence` seats the evidence auditor but leaves every clause off.

**For Task 2.3 and 2.4 owners.** State in the Lead file that `args.run.evidence` stays the roster-entry gate beside `args.evidence`. Guard the pair with a test, as End state 2 plans.

**Second coupling.** The test mocks `sweepBase` and `defaultImpl` answer only the `war-auditor` seat type. When `runSeat` dispatches `seat.agentType` (End state 11), the evidence seat gets `{}` and those fixtures go red. Extend both mocks in that task.

**Locate-cue (verify still present before acting).** `skills/war/assets/workflow-template.js`: search `validateRoster(t.roster, run.evidence)` and `validateRoster(defaultRoster, run.evidence)`. If `args.evidence` now appears in that file, phase 2 has landed. Re-read `skills/war/references/schemas.md` before acting. Found at landed tip 4e33b6db.
