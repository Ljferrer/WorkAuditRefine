---
name: changing-a-proofs-source-leaves-the-old-input-producer-instruction-live
description: Worker prompts still ask for a WAR-Task trailer that the merge-commit proof no longer reads
metadata:
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
  modified: 2026-10-30T07:47:34.378Z
---

# Changing a proof's source leaves the old input's producer instruction live

**The pattern.** A plan can move a proof to a new source of evidence.
The instruction that produced the old evidence often survives, because no task owns it.
It now asks agents for work that proves nothing.

**Instance.** Plan #2485 D14 moved recovery ownership proof to the first-parent `WAR-Task` merge commit.
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
