---
name: defined-but-not-yet-emitted-plan-slice-pattern
description: "A field or prose ref may land before its emitter only if the plan names the owning task; without that note auditors misgrade it as dead code"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: defined-but-not-yet-emitted-plan-slice-pattern
  phase: audit-scheduler-integrity/p1 + ace-nit-autofix/phase1-t2+phase2-t3+phase3-t4 + campaign-xbranch-add/T1 + test-floor-pattern-threading/p2t1 + manifest-and-skill/t2 (recurrence 5, 2026-07-12) + aftermath-class1-gate-evidence/1.3 (recurrence 7, 2026-07-16) + 2026-09-11-backward-chain-doctrine/phase-1 (recurrence 8, 2026-09-12)
  date: 2026-07-01
  updated: 2026-09-12
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
    - sibling task same phase
    - servitor lesson note pairing
    - relation tag premise
    - scope adjudication row
    - later-phase emitter task
  tags:
    - plan-pattern
    - auditor-warning
    - serial-dependency
  related:
    []
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
  modified: 2026-09-12T08:15:28.499Z
---

# Defined-but-not-yet-emitted plan slice pattern

**Rule:** a foundation task may legitimately add a constant/field/prose-ref before its emitter exists (serial slices sharing a mirrored constant or schema). The plan MUST carry a "defined-but-not-yet-emitted; produced in Task N" note naming the owning downstream task — without it, auditors misgrade the inert slice as dead code / an omission and return audit-blocked.

Variants — every tracked instance closed on schedule at its named owner: code constant (`'dep-failed'` in `HARD_ESCALATION_REASONS`, emitter Task 3); prose forward-link to a sibling task's section; ledger field named before its schema rows (submodule-inc2 T10→T9, T3→T9); return-contract key (`aced`, later emitted by `workflow-template.js`); inverse — code lands ahead of the doc surface describing it (campaign-xbranch-add T1: the `[<ref>]` positional landed in `campaign-ledger.mjs` before `war-campaign/SKILL.md` documented it; since closed — the SKILL.md invocation line now reads `add <plan-path> [<ref>]` on master).

Recurrence (test-floor-pattern-threading/p2t1, 2026-07-07): the merge-task worker consumed
`plan.testPattern` correctly, but the Lead-side threading of `overrides.testPattern` ->
`args.plan.testPattern` at Setup is plan prose (mirroring the ratified `overrides.gate` ->
`plan.gate` precedent) that lives outside this task's four files. Rated Nit/note, not a defect —
flagged for phase-coherence confirmation that the threading prose actually exists.

**Recurrence 5 (manifest-and-skill/t2, 2026-07-12):** `war-review/SKILL.md` linked a `schemas.md` § "Run manifest" that sibling Task 1.3 (same phase) authored; graded `note`, present at the integrated tip.

**Recurrence 6 (audit-gate-evidence-fidelity/1.2, 2026-07-12):** a lesson resolution note asserted a clause and test counts that sibling Task 1.1 had not yet committed; graded `note`, later code-verified at the landed task worktree.

**Recurrence 7 (aftermath-class1-gate-evidence/1.3, 2026-07-16):** the dangling referent was a lesson body claiming prose that sibling Task 1.1 adds to `skills/aftermath/SKILL.md`; graded `note`, and re-Grepped present at the landed tip.

**Recurrence 8 (2026-09-11-backward-chain-doctrine/phase-1, 2026-09-12):** new `references/` files described engine behavior that Task 2.1 builds in a later phase; a scope adjudication row named it defined-but-not-yet-emitted, and every "claims do not match today's engine" finding was graded `note`.

**How to apply (auditing):** a dangling ref at a task tip is a defect ONLY if the plan lacks the cross-link. Confirm the plan names a sibling/downstream owner — for the inverse variant the plan's end-state list is the source of truth for which task owns the doc sweep — grade Nit/non-blocking, and confirm resolution at the integration tip post-merge. This applies equally when the dangling referent is a servitor-authored lesson-note claim about a sibling task's output, not just code or SKILL prose.

**Doc-surface tail:** the emitter landing does not fix prose that enumerates the shape. See [[default-flip-must-audit-all-doc-surfaces]].

> archived 2026-07-12: resolved — moved to archive; recurrence 7 (2026-07-16) confirms the pattern still holds and closed cleanly at land
