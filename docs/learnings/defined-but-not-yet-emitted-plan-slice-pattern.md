---
name: defined-but-not-yet-emitted-plan-slice-pattern
description: "Field pre-added before emitter; plan names owning task"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: defined-but-not-yet-emitted-plan-slice-pattern
  phase: audit-scheduler-integrity/p1 + ace-nit-autofix/phase1-t2+phase2-t3+phase3-t4 + campaign-xbranch-add/T1
  date: 2026-07-01
  updated: 2026-07-06
  keywords:
    - defined-but-not-yet-emitted
    - plan slice ownership
    - out-of-scope nit
    - SKILL.md lag
    - doc surface stale
    - end-state item owned by later task
  tags: 
    - plan-pattern
    - auditor-warning
    - serial-dependency
  related: 
    []
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Defined-but-not-yet-emitted plan slice pattern

**Rule:** a foundation task may legitimately add a constant/field/prose-ref before its emitter exists (serial slices sharing a mirrored constant or schema). The plan MUST carry a "defined-but-not-yet-emitted; produced in Task N" note naming the owning downstream task — without it, auditors misgrade the inert slice as dead code / an omission and return audit-blocked.

Variants — every tracked instance closed on schedule at its named owner: code constant (`'dep-failed'` in `HARD_ESCALATION_REASONS`, emitter Task 3); prose forward-link to a sibling task's section; ledger field named before its schema rows (submodule-inc2 T10→T9, T3→T9); return-contract key (`aced`, later emitted by `workflow-template.js`); inverse — code lands ahead of the doc surface describing it (campaign-xbranch-add T1: the `[<ref>]` positional landed in `campaign-ledger.mjs` before `war-campaign/SKILL.md` documented it; since closed — the SKILL.md invocation line now reads `add <plan-path> [<ref>]` on master).

**How to apply (auditing):** a dangling ref at a task tip is a defect ONLY if the plan lacks the cross-link. Confirm the plan names a sibling/downstream owner — for the inverse variant the plan's end-state list is the source of truth for which task owns the doc sweep — grade Nit/non-blocking, and confirm resolution at the integration tip post-merge.

**Why (doc-surface tail):** the emitter landing does NOT fix prose enumerating the shape — the plan must list EVERY doc surface (canonical contract, summary bullets, mirrors) as in-scope for the emitter task or a named follow-up. Same family: [[wire-key-rename-misses-prose-placeholders]], [[default-flip-must-audit-all-doc-surfaces]].
