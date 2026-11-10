---
name: within-phase-dep-gate-must-rerun-on-integrated-tip
description: "RESOLVED: gate re-runs at integrated tip; covers same-repo deps only"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: [false green, build-order gap, sibling task dependency, per-branch gate result, cross-task reference, integration branch retest]
  slug: within-phase-dep-gate-must-rerun-on-integrated-tip
  phase: 3
  task: t6
  severity: Nit (process; confirmed by auditor finding)
  originSessionId: 4f3e4595-5aaa-40b5-9004-183f4bb53936
---

# Within-phase task ordering: gate must re-run after all dependent tasks are integrated

**RESOLVED/MECHANIZED:** on an intra-phase-dep phase the engine re-runs the full gate once at the final integration tip (`integratedTipGate` in `skills/war/assets/workflow-template.js`, mirrored in `agents/war-refiner.md`). That run supersedes the per-branch gates for the dep-crossing tasks. It covers only same-repo dep edges; the rule below still applies to manual and plan-level gating.

**Why:** a task that references code an earlier within-phase task writes can gate green on its own branch while the reference points at code not yet in its base. Its own diff is correct, but the cross-references are untested against the real artifact. Instance: phase-3/t6, where `war-refiner.md` cited `_refinery`/`land_stale` wiring a sibling task added.

## Rule

For within-phase dependencies (Task N references Task M's output):
1. Both tasks land into the shared integration branch first.
2. The full gate (all runners) re-runs on the integrated tip.
3. Only the integrated-tip gate result is authoritative for land/release decisions.

Same-wave tasks share the frozen phase base, so undeclared same-file coupling still rebase-conflicts at merge: declare the dep, or split the tasks across phases.

Recovery: land the gate-green task, then re-run the rest as single-task phases.
