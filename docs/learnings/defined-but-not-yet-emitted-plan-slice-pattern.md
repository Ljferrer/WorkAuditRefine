---
name: defined-but-not-yet-emitted-plan-slice-pattern
description: "Field pre-added before emitter; plan names owning task"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: defined-but-not-yet-emitted-plan-slice-pattern
  phase: audit-scheduler-integrity/p1 +4 recurrences (latest 2026-07-12)
  date: 2026-07-01
  updated: 2026-07-12
  keywords:
    - defined-but-not-yet-emitted
    - plan slice ownership
    - out-of-scope nit
    - SKILL.md lag
    - doc surface stale
    - end-state item owned by later task
    - dangling cross-reference
    - schemas.md run manifest
    - war-review
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

Recurrence (test-floor-pattern-threading/p2t1, 2026-07-07): the merge-task worker consumed
`plan.testPattern` correctly, but the Lead-side threading of `overrides.testPattern` ->
`args.plan.testPattern` at Setup is plan prose (mirroring the ratified `overrides.gate` ->
`plan.gate` precedent) that lives outside this task's four files. Rated Nit/note, not a defect —
flagged for phase-coherence confirmation that the threading prose actually exists.

**Recurrence 5 (manifest-and-skill/t2, 2026-07-12):** `skills/war-review/SKILL.md` (Task 1.2)
linked `../war/references/schemas.md` § "Run manifest" as the manifest field contract, but that
section is authored by sibling Task 1.3 (same phase, file-disjoint, `deps: []`) and was absent
from Task 1.2's frozen base. The plan carried the producing cross-link, so the auditor graded it
correct-by-construction (disposition `note`, not a hold) per this exact calibration rule, and the
post-merge gate-audit confirmed the section at the integrated tip — since independently
re-verified on master (`## Run manifest` present in `schemas.md`). Originally recorded
audit-log-sourced from a stale servitor checkout; see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]].

**How to apply (auditing):** a dangling ref at a task tip is a defect ONLY if the plan lacks the cross-link. Confirm the plan names a sibling/downstream owner — for the inverse variant the plan's end-state list is the source of truth for which task owns the doc sweep — grade Nit/non-blocking, and confirm resolution at the integration tip post-merge.

**Why (doc-surface tail):** the emitter landing does NOT fix prose enumerating the shape — the plan must list EVERY doc surface (canonical contract, summary bullets, mirrors) as in-scope for the emitter task or a named follow-up. Same family: [[wire-key-rename-misses-prose-placeholders]], [[default-flip-must-audit-all-doc-surfaces]].
