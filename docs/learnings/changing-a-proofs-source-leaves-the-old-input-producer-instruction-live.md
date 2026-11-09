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
It now asks agents for work that proves nothing.

**RESOLVED.** Plan 2026-11-08-engine-recovery-relaunch-and-land, phase 3 task 3.1, retired both worker-side trailer instructions.
At landed tip fe18b242, `taskProvenanceClause` in `skills/war/assets/workflow-template.js` only forbids empty commits and asks for `head_sha`.
Step 5 of `agents/war-worker.md` no longer asks for a `WAR-Task` trailer.
The trailer now appears only on the refiner merge commit (`taskMergeTrailer`).
The text below describes the defect as it stood before the fix. The pattern still applies.

**Instance (historical).** Plan #2485 D14 moved recovery ownership proof to the first-parent `WAR-Task` merge commit.
`deriveSkipClause` now says "worker commits need no trailer".
`taskProvenanceClause` still tells workers to put `WAR-Task: <branch>` on their commits.
`agents/war-worker.md` step 5 also still asks for that trailer.
`skills/war/assets/task-integrated.sh` skips single-parent commits, so a worker trailer is harmless and proves nothing.
The plan names no task that retires `taskProvenanceClause`, so a correctness seat raised it as a `note` Nit.

**Rule.** If you change where a proof reads its evidence, grep for every instruction that produces the old evidence.
Retire it, or state in the plan why it stays.
Check both the dispatched prompt and the standing card (see [[standing-instruction-vs-dispatched-prompt-coverage-split]]).

Related: [[contract-cardinality-change-leaves-singular-prose-that-no-value-guard-reads]], [[default-flip-must-audit-all-doc-surfaces]].

Locate-cue: verify still present before acting. At landed tip 8c1a7a51, `taskProvenanceClause` and `deriveSkipClause` are both in `skills/war/assets/workflow-template.js`.
The plan file `docs/plans/2026-10-28-blocked-ace-and-merge-provenance.md` does not mention `taskProvenanceClause`.
