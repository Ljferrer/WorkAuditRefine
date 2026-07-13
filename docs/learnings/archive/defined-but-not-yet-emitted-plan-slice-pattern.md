---
name: defined-but-not-yet-emitted-plan-slice-pattern
description: "Field pre-added before emitter; plan names owning task"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: defined-but-not-yet-emitted-plan-slice-pattern
  phase: audit-scheduler-integrity/p1 + ace-nit-autofix/phase1-t2+phase2-t3+phase3-t4 + campaign-xbranch-add/T1 + test-floor-pattern-threading/p2t1 + manifest-and-skill/t2 (recurrence 5, 2026-07-12)
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
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# Defined-but-not-yet-emitted plan slice pattern

**Rule:** a foundation task may legitimately add a constant/field/prose-ref before its emitter exists (serial slices sharing a mirrored constant or schema). The plan MUST carry a "defined-but-not-yet-emitted; produced in Task N" note naming the owning downstream task — without it, auditors misgrade the inert slice as dead code / an omission and return audit-blocked.

Variants — every tracked instance closed on schedule at its named owner: code constant (`'dep-failed'` in `HARD_ESCALATION_REASONS`, emitter Task 3); prose forward-link to a sibling task's section; ledger field named before its schema rows (submodule-inc2 T10→T9, T3→T9); return-contract key (`aced`, later emitted by `workflow-template.js`); inverse — code lands ahead of the doc surface describing it (campaign-xbranch-add T1: the `[<ref>]` positional landed in `campaign-ledger.mjs` before `war-campaign/SKILL.md` documented it; since closed — the SKILL.md invocation line now reads `add <plan-path> [<ref>]` on master).

Recurrence (test-floor-pattern-threading/p2t1, 2026-07-07): the merge-task worker consumed
`plan.testPattern` correctly, but the Lead-side threading of `overrides.testPattern` ->
`args.plan.testPattern` at Setup is plan prose (mirroring the ratified `overrides.gate` ->
`plan.gate` precedent) that lives outside this task's four files. Rated Nit/note, not a defect —
flagged for phase-coherence confirmation that the threading prose actually exists.

**Recurrence 5 (manifest-and-skill/t2, 2026-07-12, audit-log-sourced — NOT independently
code-verified this instance):** `skills/war-review/SKILL.md` (Task 1.2) linked
`../war/references/schemas.md` § "Run manifest" as the manifest field contract, but that section
is authored by sibling Task 1.3 (same Phase 1, file-disjoint, `deps: []`) and was absent from
Task 1.2's frozen base. The plan carried the producing cross-link (Task 1.3 explicitly adds a "Run
manifest" section to schemas.md), so the auditor graded it correct-by-construction (disposition
`note`, not a hold) per this exact calibration rule, and the phase's post-merge gate-audit
(`audit_sha` `2c1b4e510f752bb10c0cd43302601079774dca7e`) confirmed the section present at the
integrated tip. This servitor could not independently re-Grep `schemas.md` for the section at
write time — its session worktree is a documented, session-stable stale checkout (see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]], four consecutive phases now) —
so this recurrence rests on the gate-audit's `gateEvidence:true` confirmation, not a direct D3
check.

**Recurrence 6 (audit-gate-evidence-fidelity/1.2, 2026-07-12) — independently code-verified, closing Recurrence 5's uncertainty:** Task 1.2's resolution note (in
`docs/learnings/verbatim-mirror-directive-context-mismatch-at-destination.md`) asserted present-tense
that sibling Task 1.1 would land the `_refinery land worktree` clause byte-for-byte and a durable
test asserting exactly 2/1 source counts — while Task 1.1's branch was still at the phase base
(not yet committed) at review time. Per Commander's Intent End state #8 the plan named Task 1.1 as
the owning emitter, so this was graded correct-by-construction (disposition `note`, `phaseClose:
true`, not a hold). Unlike Recurrence 5, this servitor independently code-verified the resolution
at the true landed task worktree (not just trusted a gate-audit's `gateEvidence:true` claim — see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] Recurrence 4/5 technique): both the
exact clause and the exact test counts (2 and 1) are present at
`<repo-root>/.claude/war-worktrees/2026-07-12-audit-gate-evidence-fidelity/p1-1.1/skills/war/assets/workflow-template.js`
and its `.test.mjs`.

**How to apply (auditing):** a dangling ref at a task tip is a defect ONLY if the plan lacks the cross-link. Confirm the plan names a sibling/downstream owner — for the inverse variant the plan's end-state list is the source of truth for which task owns the doc sweep — grade Nit/non-blocking, and confirm resolution at the integration tip post-merge.

**Why (doc-surface tail):** the emitter landing does NOT fix prose enumerating the shape — the plan must list EVERY doc surface (canonical contract, summary bullets, mirrors) as in-scope for the emitter task or a named follow-up. Same family: [[wire-key-rename-misses-prose-placeholders]], [[default-flip-must-audit-all-doc-surfaces]].

> archived 2026-07-12: resolved — moved to archive
