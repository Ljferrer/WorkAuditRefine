---
name: plan-decision-id-and-end-state-id-can-share-a-numeral-and-get-conflated-in-worker-self-reports
description: "A plan's D-prefixed decision id and its numbered End state can share a numeral; a worker's acceptance_criteria_covered self-report can cite the wrong one"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: plan-decision-id-and-end-state-id-can-share-a-numeral-and-get-conflated-in-worker-self-reports
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-12 (task 12.2), landed 48a7120616627a35ecf2a05e76e34d15dcf985a3 on dev/2026-09-06-engine-and-audit-verdict-integrity"
  keywords: 
    - acceptance_criteria_covered
    - decision id
    - D20
    - End state 20
    - numeral collision
    - worker self-report
    - gate-audit no routing consequence
    - plan numbering scheme
  tags: 
    - war
    - plan-authoring
    - gate-audit
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-08T23:58:17.998Z
---

# A plan's decision id and its End-state id can share a numeral, and a worker's self-report can conflate them

**Found (code-verified referent, agent-unverified causal claim — landed tip
`48a7120616627a35ecf2a05e76e34d15dcf985a3` on `dev/2026-09-06-engine-and-audit-verdict-integrity`;
the plan itself confirmed at
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/docs/plans/2026-09-06-engine-and-audit-verdict-integrity.md`
carries 3 occurrences of the literal `D20` and a separate, unrelated `End state` item 20 in the
Commander's Intent — two genuinely distinct numbering spaces sharing the numeral 20).**

Task 12.2's worker reported `acceptance_criteria_covered = [18, 20]`. Phase 12 claims only End
state 18 in its `END-STATE CHECK` block. End state 20 belongs to a different task entirely (Task
1.2's slice, landed in phase 1: the manifest relaunch arm, `followUps` literal, overrule clause,
Clean-handoff row) — not Task 12.2's Files (`disposition-eligibility.md`, `SKILL.md`,
`docs/adr/0013-*.md`, `CONTEXT.md`, `skill-doc-contracts.test.mjs`). The gate-audit seat that
caught this named the likely cause directly: Task 12.2's own plan slice is labeled decision `D20`
("release-slot eligibility by literal, D20, PIN-24, #2000"), and the worker most likely reported
its own decision id, `D20`, as if it were End-state id 20.

**Why this is durable:** this plan (like several others in this repo) numbers TWO separate things
with overlapping integer sequences in the same document — decision ids (`D1`...`D24`+) inside plan
slices, and End-state ids (1...21) inside the Commander's Intent. When a task's decision id
happens to numerically equal an unrelated End-state id, a worker's free-text
`acceptance_criteria_covered` self-report is one plausible place for the two spaces to bleed
together. This is a recurring risk for ANY future plan in this repo that reaches double-digit
decision ids alongside double-digit End states.

**Consequence observed here: none.** The gate-audit's handoff keys `endState` on the phase's
actually-claimed conditions, and 20 was not among phase 12's claims, so the mis-citation had no
routing effect — it was caught and recorded as a `note`, not a hold.

**Pattern to watch for:** when reviewing a worker's `acceptance_criteria_covered` (or any
self-reported id list), cross-check each claimed id against the PHASE's actual claimed End-state
set (from the phase's `END-STATE CHECK` block), never against the task's own decision-id
vocabulary — the two numeral spaces are easy to conflate when a plan reaches high decision-id
counts.

**Locate-cue:** `docs/plans/2026-09-06-engine-and-audit-verdict-integrity.md`, Task 12.2's Plan
slice (search `D20`) versus the Commander's Intent `## End state` numbered list, item 20 (manifest
relaunch arm).
