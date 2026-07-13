---
name: status-equality-leak-detector-false-positive-ceiling-on-mergeresult-prose
description: "D9 leak-detector equality-regex false-trips on MergeResult prose"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - leak detector
    - doc-contract test
    - status-equality regex
    - enum-level separation
    - landDecision
    - task status enum
    - MergeResult
    - false positive ceiling
    - schemas.md
  provenance: agent-unverified
  slug: status-equality-leak-detector-false-positive-ceiling-on-mergeresult-prose
  phase: land-path-integrity-and-status-enum-discipline/t2.1
  tags: 
    - land-path
    - test-fidelity
    - drift-guard
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

Phase 2's D9 task (`land-decision.test.mjs`) added a doc-contract test that greps `agents/*.md` +
`schemas.md` for a phase-level `landDecision` token used in a task-level status-equality/assignment
context (and vice-versa), sourcing both enums fresh from `schemas.md`. Its pattern-1 regex is
`\bstatus\s*===?…` — matching bare `status`/equality-operator adjacency. The audit (Nit, disposition
`note`) flagged a documented false-positive ceiling: pattern-1 would flag a `MergeResult`-style
`mr.status === 'landed'` construct if one were ever added to an agent `.md` prose surface, because
the detector's exclusion is keyed on **colon-space-quote object-literal form** (`status: 'landed'`) —
the shape used today for legit MergeResult returns and "landed SHA" narration — not on the
equality/assignment form the detector is built to catch. Equality-form and colon-form aren't
distinguished by *legitimacy*, only by which one the current tree happens to use.

**Why this is a ceiling, not a defect:** the task's plan slice deliberately anchors "tightly on
status-equality/assignment context ... not a bare word match" specifically so the current tree's
colon-form MergeResult/landed-SHA narration doesn't false-trip (spec §8 open-risk). Widening the
exclusion to also except equality-form would reopen the exact leak the test exists to catch (a
phase-level `landDecision` token compared against a task-level `status` via `===`). The ponytail
comment left in the test names this tradeoff inline — this lesson is the durable pointer to it.

**How to apply:** if a future task adds any `status === '<landDecision-literal>'` (or similar
equality/assignment) construct to an agent `.md` surface — even a legitimate one narrating a
`MergeResult` shape — expect this D9 test to false-positive. The fix at that point is to narrow the
detector with a task-level context cue (e.g. require the LHS to resolve to a task-status-typed
identifier) or reword the prose to the colon-form the detector already excludes — not to loosen the
equality-form match itself.

**Verification note:** the finding's file/line anchor (`skills/war/assets/land-decision.test.mjs`
~line 231 comment, assertion ~line 253) was **not independently re-Grep-verified** in this write —
this checkout (`.claude/worktrees/nice-visvesvaraya-cabb53`, branch
`claude/memory-frictions-roadmap-26a40e`) predates the phase's landed changes on
`dev/2026-07-08-land-path-integrity-and-status-enum-discipline`; the file here still shows its
pre-phase-2 153-line shape with no D9 test present (same worktree-staleness pattern already recorded
by this phase's own Task-1 servitor pass — [[reland-loop-contender-less-transient-vs-real-divergence]],
[[process-recipe-lesson-body-is-not-drift-guarded-by-any-test]]). **Before acting on this lesson,
re-Read `land-decision.test.mjs` on the actual landed branch to confirm pattern-1's regex and the
colon-form exclusion still take this shape.**

Related: [[reland-loop-contender-less-transient-vs-real-divergence]],
[[test-reframe-can-strand-adjacent-branch-coverage]],
[[dockerfile-shell-form-parser-heuristic-ceiling]],
[[floor-subset-gate-claim-overstates-arbitrary-custom-pattern]].

> archived 2026-07-13: resolved — moved to archive
