---
name: end-state-literal-can-be-satisfied-by-guard-forced-alternate-shape
description: "A plan End-state's literal wording can be satisfied by a different landed shape when the plan's own drift guard makes the literal shape infeasible; check the guard's bounds before flagging a deviation"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: end-state-literal-can-be-satisfied-by-guard-forced-alternate-shape
  phase: audit-evidence-precedence/phase-1 tasks 1.2 + 1.3
  keywords:
    - end-state literal vs landed shape
    - single-region extraction constraint
    - anchor as locator not edit target
    - five-surface registry row
    - chain anchor substitute
    - D22 pinned span
    - sibling paragraph insertion
    - guard-forced implementation shape
    - red-team adjudication contradiction
    - rung-body pairing infeasible
    - stale-looking-but-correct
    - confirmation-gated demotion
    - plan-internal contradiction
  tags:
    - audit-pipeline
    - plan-faithfulness
    - drift-guard
    - end-state
  created: 2026-07-28
  originSessionId: unknown
  modified: 2026-07-28T19:49:39.128Z
---

# A plan's End-state literal wording can be satisfied by a guard-forced alternate shape, not the literal edit

**Pattern:** a plan's Commander's Intent / End-state condition can describe the landed change in
terms of a specific literal edit target ("bullets carry X", "pair each ambiguous name with a
rung-body fragment"). When the plan's own drift-guard design (a single-region extraction test, or
a same-anchor-set five-surface registry row) makes that literal shape **infeasible without
violating a different End-state condition in the same plan**, the worker's job is to satisfy the
*substantive intent* (discrimination / coverage) via an alternate shape, document the reasoning
in-code at the deviation site, and an auditor's job is to verify the guard's own extraction bounds
before scoring the divergence as a defect — under the "stale-looking-but-correct" / "confirmation-
gated demotion" calibration rule, a literal-vs-landed divergence that the live artifacts confirm
correct is a Nit at most, never a hold.

**Example 1 — chain-anchor substitute** (`2026-07-28-audit-evidence-precedence` phase 1,
Task 1.2): red-team adjudication [C] asked to pair each ambiguous claim-shape name (`execution`,
`history`, `authority`) with a rung-body fragment in a five-surface registry row. But End state
8(ii) required those rung-body tokens to measure zero on four of the five surfaces. The worker
used an ordered chain anchor that leads with a base-absent token, moved the rung-body coverage
into a card-only assert loop, and explained it in the row's anchor-precondition comment. Every
seat that re-checked it confirmed it correct (`disposition: note`).

**Example 2 — sibling paragraph instead of in-place bullet edits** (same plan, Task 1.3): End
state 3 said SKILL.md's phase-close and Gate-2 bullets carry the three Lead bindings. The diff
instead added a new sibling paragraph (`**Lead evidence bindings (phase-close + Gate 2; ADR
0041).**`) between the two bullets and left them unchanged. That was correct: the mapped guard
(`skill-doc-contracts.test.mjs`'s D27 row) needs one contiguous extraction region, and editing the
Gate-2 bullet would have spliced into D22's already-pinned span. Adjudication [G] had named the
bullets as locators, not edit targets.

**How to apply:** when an End-state's literal wording ("edit bullet X", "pair name Y with fragment
Z") looks unmet by a landed diff, do not score it as a deviation before checking (1) whether a
*different* End-state condition or the plan's own drift-guard extraction/coverage design in the
*same plan* makes the literal shape infeasible, and (2) whether the worker recorded the resulting
substitute shape's reasoning in-code at the deviation site (an anchor-precondition comment, a
cross-referencing sentence). If both hold and the guard still achieves its discriminating purpose
(verify by delete-and-trace or reading the pinned extraction bounds), the divergence is a Nit —
record it as `note`, never escalate or hold. This is the same calibration lens as
[[plan-bullet-replacement-text-can-contradict-its-own-plans-end-state-and-mapped-test]] but from
the opposite direction: there the plan's replacement TEXT was internally contradictory; here the
plan's *literal edit-target wording* is what conflicts with the plan's own guard-coverage
requirement, and the worker/auditor's job is to resolve toward substance over literal wording.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]] (the five-surface
registry row from Example 1 has its own residual coverage gap, recorded separately).

> archived 2026-08-15: resolved — moved to archive
