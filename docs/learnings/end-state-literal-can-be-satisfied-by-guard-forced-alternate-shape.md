---
name: end-state-literal-can-be-satisfied-by-guard-forced-alternate-shape
description: "A plan End-state's literal wording can be satisfied by a landed shape that differs from it, when the plan's own drift-guard extraction/coverage constraint makes the literal shape infeasible — verify the guard's own bounds before flagging placement as a deviation"
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

**Instance 1 — chain-anchor substitute for infeasible rung-body pairing**
(`2026-07-28-audit-evidence-precedence` phase 1, Task 1.2; code-verified at the landed tip
`731d46e88b502009745bfbb07e9655fdd027cd0a`, read via the `_refinery` worktree,
`skills/war/assets/workflow-template.test.mjs` lines 7060-7080): red-team adjudication [C] mandated
pairing each ambiguous claim-shape name (`execution`, `history`, `authority`) with a rung-body
fragment (e.g. `execution` + `Gate-evidence artifact`) in a **five-surface** registry row (the
auditor card plus four dispatched-prompt surfaces). That prescription directly contradicts the
plan's own End state 8(ii), which requires those same rung-body tokens to measure **zero**
occurrences on the dispatched-prompt surfaces — a five-surface anchor cannot carry a token that
four of its five surfaces are forbidden to contain. The worker resolved this **in the row's own
anchor-precondition comment**: kept the three base-absent skeleton tokens adjudication [C] also
required, substituted an ordered four-shape chain anchor
(`/content-at-pin[\s\S]{0,200}\bexecution\b[\s\S]{0,200}\bhistory\b[\s\S]{0,200}\bauthority\b/i`,
which cannot green on the pre-existing bare `execution`/`history` hits because it leads with a
base-absent token), and moved the rung-body coverage adjudication [C] wanted into a **card-only**
supplementary assert loop below the registry loop. Multiple independent seats — the task's own
audit, its gate-audit, and the authoritative phase-integrated-tip gate-audit — each re-verified this
reasoning and confirmed it correct (`disposition: note`, never held).

**Instance 2 — sibling paragraph instead of in-place bullet edits**
(same plan, Task 1.3; code-verified at the same landed tip,
`skills/war/SKILL.md` lines 88-92): the plan's End state 3 read "SKILL.md's phase-close and Gate-2
bullets carry the three Lead bindings + skeleton," naming two existing bolded bullets
(`**Retired-token sweep...**`, `**Post-servitor publication...**`) as the edit target. The landed
diff instead inserts a **new sibling bolded paragraph** (`**Lead evidence bindings (phase-close +
Gate 2; ADR 0041).**`) between the two, leaving both named bullets byte-unchanged, and the new
paragraph cross-references both by name. Two independent grounds made this the correct shape, not
a deviation: (a) the plan's own mapped guard (`skill-doc-contracts.test.mjs`'s D27 row) needs
**one contiguous extraction region** for the three bindings — splitting them across two
non-contiguous bullets would leave some bindings outside any pinned region; (b) editing inside the
Gate-2 bullet would have spliced new text into a **different**, already-pinned extraction region
(D22's ordered five-arm span) that the plan itself flagged as a rot risk to avoid splicing into.
Red-team adjudication [G] had named the two bullets as *locators* ("locate them by these
constructs, never by line number"), not edit targets — a reading the landed shape satisfies.

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
registry row from Instance 1 has its own residual coverage gap, recorded separately).
