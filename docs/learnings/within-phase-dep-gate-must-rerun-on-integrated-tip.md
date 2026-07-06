---
name: within-phase-dep-gate-must-rerun-on-integrated-tip
metadata: 
  node_type: memory
  type: project
  keywords: [false green, build-order gap, sibling task dependency, per-branch gate result, cross-task reference, integration branch retest]
  slug: within-phase-dep-gate-must-rerun-on-integrated-tip
  phase: 3
  task: t6
  severity: Nit (process; confirmed by auditor finding)
  related: 
    - "[[gate-under-covers-after-cross-branch-merge-new-runner]]"
  originSessionId: 4f3e4595-5aaa-40b5-9004-183f4bb53936
---

# Within-phase task ordering: gate must re-run after all dependent tasks are integrated

**Why:** a task referencing code an earlier within-phase task writes can gate green on its own
branch while the cross-reference points at code not yet in its base — a false green: the task's
own diff is correct, but the cross-references are untested against the real artifact.

Instance (phase-3/t6): `war-refiner.md` referenced `_refinery`/`land-advance`/`land_stale` wiring
that a sibling task added to `workflow-template.js` but that was absent from the audited base;
the auditor correctly graded it "within-phase build-order gap, not a defect" and approved.

## Rule

For within-phase dependencies (Task N references Task M's output):
1. Both tasks land into the shared integration branch first.
2. The full gate (all runners — see [[gate-under-covers-after-cross-branch-merge-new-runner]]) re-runs on the integrated tip.
3. Only the integrated-tip gate result is authoritative for land/release decisions.

Do not rely on per-task branch gate results when tasks within the same phase are inter-dependent.
