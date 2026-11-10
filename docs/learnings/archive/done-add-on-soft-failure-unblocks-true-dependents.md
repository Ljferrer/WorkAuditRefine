---
name: done-add-on-soft-failure-unblocks-true-dependents
description: "[RESOLVED] deps gate on succeeded set; done≠merged"
metadata: 
  node_type: memory
  slug: done-add-on-soft-failure-unblocks-true-dependents
  phase: B4b
  type: project
  tags: 
    - war
    - workflow-template
    - scheduling
    - dependencies
    - wave
    - soft-escalation
    - env-blocked
    - gotcha
    - pre-existing
  files: 
    - skills/war/assets/workflow-template.js
  relates: 
    - "[[run-provision-config-not-yet-mirrored-into-template]]"
    - "[[provision-barrier-refiner-owned-not-worker-self-create]]"
  created: 2026-06-25
  originSessionId: 53421d17-5351-48da-baf8-7d315d56c7b5
---

# `done.add` on a SOFT failure unblocks true dependents

**RESOLVED — kept as concept anchor** for the "shared scheduler bookkeeping set conflates *attempted* with *merged*" family.

**The trap:** the wave loop marked every result `done` before the verdict branch, and `nextWave()` gated dependents purely on `done.has(d)` — a soft-failed predecessor (`env-blocked`/`escalate`/`audit-blocked`) silently satisfied its dependents' deps, fanning them out from an integration tip lacking the work. `done`-for-siblings-proceed is deliberate; the hazard was reusing that set as the merged gate.

**Fixed in `workflow-template.js`:** a separate `succeeded` set is added only on merge; `nextWave()` gates deps on `succeeded.has(d)`, and a pre-wave sweep marks dep-blocked tasks done with their `failedDeps`.

**Why:** "finished being attempted" ≠ "work is on the tip"; every scheduler predicate must say which one it needs.
**How to apply:** when auditing wave/dependency logic, trace which set each predicate reads; a dependent that ran after a soft-failed predecessor is suspect unless gated on the merged set.

Related: [[run-provision-config-not-yet-mirrored-into-template]], [[provision-barrier-refiner-owned-not-worker-self-create]]
