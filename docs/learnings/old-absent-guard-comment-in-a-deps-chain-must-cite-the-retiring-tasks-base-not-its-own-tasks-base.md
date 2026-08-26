---
name: old-absent-guard-comment-in-a-deps-chain-must-cite-the-retiring-tasks-base-not-its-own-tasks-base
description: "A PIN-8-style OLD-absent drift-guard comment in a task that `deps` on a sibling task which already retired the literal can wrongly claim the literal was 'verified present at this task's base' — it was already absent there; the true verification point is the plan's implementation base / the retiring dep's own commit."
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: old-absent-guard-comment-in-a-deps-chain-must-cite-the-retiring-tasks-base-not-its-own-tasks-base
  phase: "ask-disposition/phase-2 (Task 2.3 audit finding, resolved in a fix round before land)"
  keywords: 
    - PIN-8
    - OLD-absent
    - base-verified
    - deps edge
    - provenance comment
    - rule 7
    - skill-doc-contracts.test.mjs
    - drift-guard comment accuracy
  tags: 
    - test-design
    - drift-guard
    - comment-accuracy
    - plan-decomposition
  created: 2026-08-25
  originSessionId: 351f8fc5-4d48-4ee9-8beb-5d257d9bcf6f
  modified: 2026-08-26T03:02:59.592Z
---

# An OLD-absent guard comment across a `deps` edge must cite the retiring task's base, not its own task's base

## The pattern (recorded as a pattern, not a live instance)

Task 2.3's own audit (both the task-level audit and its gate-audit pass) flagged D40/D41/D42 in
`skills/war/assets/skill-doc-contracts.test.mjs`: each row's block comment claimed its OLD-absent
literal (a retired pre-widening phrase, e.g. `**Two producers**` or `two producers above`) was
"verified present at this task's base (PIN-8)". Read-only git at the pin showed this was false as
written — Task 2.3 `deps` on sibling Tasks 2.1/2.2 (rule-7 edges), and those siblings had ALREADY
retired the literals in their own merged commits, before Task 2.3's own base. So the literal was
already absent when Task 2.3 started; the comment's stated verification point was wrong, even
though the assertion itself was correct and non-vacuous against the true origin — the plan's
implementation base, where the literal genuinely existed before any widening task touched it.

## Finding-match note (audit finding resolved before land)

Re-read at the landed tip (`4aa729a3770232994d4944e09b8c86e829259f89` on
`dev/2026-08-25-ask-disposition`, via the `_refinery27` worktree whose `gitdir` names this plan's
slug — HEAD == the landed tip exactly): the three comments were corrected in a fix round before
land. They now read, e.g., "OLD-absent keys cite literals verified present at the plan's
implementation base `a60221a` and retired at this task's base by merged dep Task 2.2 — each
absence assert guards against a revert of that widening, never a never-present value (PIN-8)"
(D40, ~line 2667; D41, ~line 2706; D42, ~line 2761 in `skills/war/assets/skill-doc-contracts.test.mjs`).
This lesson is recorded as the **generic pattern**, not a live instance, per the standing
finding-match-check protocol — the specific comments named above are no longer wrong.

## Why this is durable

PIN-8's law is "an OLD-absent key must cite a literal that genuinely existed somewhere, never a
never-present value" — its purpose is anti-vacuity, not base-precision. When a task depends on
sibling tasks that landed a widening (retiring the old literal) BEFORE this task's own base, the
natural phrasing "verified present at this task's base" is code-traceably false, because the
literal was retired by the dependency, not by this task. The assertion still correctly guards
against a REVERT of the dependency's widening — that part of PIN-8 holds — but the comment
misattributes the temporal/provenance point, which is exactly the class of defect a green test
suite can never catch (no test asserts comment content) and that misleads a future reader trying
to trace where the guarded literal actually lived.

## The durable rule

When authoring an OLD-absent (PIN-8-style) guard comment for a literal retired by a `deps`-edge
sibling task rather than by this task itself, cite the base at which the literal was **actually
present** — the plan's own implementation/authoring base, or the sibling task's pre-widening
commit — and separately name which task's landed widening the absence-assert now guards against a
revert of. Never write "verified present at this task's base" when a merged dependency already
retired the literal before that base.

## Related

[[guard-rationale-comment-can-cite-a-different-scanned-surface-than-the-pin-it-justifies]] —
sibling comment-accuracy class (a justifying comment can misname WHICH surface a pin covers; this
lesson is the misnamed WHEN/WHERE-verified variant, specific to rule-7 `deps`-edge provenance
chains). [[plan-line-number-refs-stale-use-construct-locator]] — a related "trust the artifact,
not the narrative" discipline for provenance claims in a serial-merge/deps pipeline.
