---
name: changing-a-proofs-source-leaves-the-old-input-producer-instruction-live
description: RESOLVED (2026-11-08 phase 3 task 3.1): worker prompts no longer ask for the WAR-Task trailer
metadata:
  promoted: dev/2026-10-28-blocked-ace-and-merge-provenance@phase-3
  node_type: memory
  type: project
  keywords:
    - taskProvenanceClause
    - deriveSkipClause
    - WAR-Task trailer on worker commits
    - orphaned instruction
    - proof source change
    - doctrine inconsistency
    - merge-commit provenance
    - D14
  provenance: code-verified
  slug: changing-a-proofs-source-leaves-the-old-input-producer-instruction-live
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-3 (task 3.1)
  tags:
    - war-engine
    - prompt-surface
    - doctrine-drift
  created: 2026-10-30
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-11-09T17:39:09.518Z
---

# Changing a proof's source leaves the old input's producer instruction live

**The pattern.** A plan can move a proof to a new source of evidence.
The instruction that produced the old evidence often survives, because no task owns it.
It then asks agents for work that proves nothing.

**RESOLVED (instance).** Plan #2485 D14 moved recovery ownership proof to the first-parent `WAR-Task` merge commit, but worker prompts still asked for the trailer.
Plan `docs/plans/2026-11-08-engine-recovery-relaunch-and-land.md`, phase 3 task 3.1, retired both worker-side asks (landed tip fe18b242).
Now `taskProvenanceClause` in `skills/war/assets/workflow-template.js` only forbids empty commits and asks for `head_sha`, and only the refiner merge commit carries the trailer (`taskMergeTrailer`).

**Rule.** If you change where a proof reads its evidence, grep for every instruction that produces the old evidence.
Retire it, or state in the plan why it stays.
Check both the dispatched prompt and the standing card (see [[standing-instruction-vs-dispatched-prompt-coverage-split]]).

Related: [[contract-cardinality-change-leaves-singular-prose-that-no-value-guard-reads]], [[default-flip-must-audit-all-doc-surfaces]].
