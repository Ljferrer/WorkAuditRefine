---
name: old-absent-guard-comment-in-a-deps-chain-must-cite-the-retiring-tasks-base-not-its-own-tasks-base
description: "An OLD-absent guard comment for a literal retired by a deps sibling must cite the base where the literal was really present."
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

## The durable rule

When you write an OLD-absent (PIN-8-style) guard comment for a literal that a `deps`-edge
sibling task retired, not this task, cite the base at which the literal was **actually
present**: the plan's implementation base, or the sibling's pre-widening commit. Then name which
task's landed widening the absence assert guards against a revert of. Never write "verified
present at this task's base" when a merged dependency already retired the literal before that
base.

**Why:** PIN-8's law is anti-vacuity. An OLD-absent key must cite a literal that genuinely
existed somewhere, never a never-present value. In a rule-7 `deps` chain the sibling lands its
widening before this task's base, so the literal is already gone when this task starts. The
assert is still correct (it guards a revert of the sibling's widening), but the comment
misattributes where the literal lived. No test asserts comment content, so a green suite never
catches it, and a future reader tracing the literal is sent to the wrong commit.

**How to apply:** before writing the comment, `git log -S'<literal>'` from the plan base and
name the commit that removed it.

**Incident:** ask-disposition phase 2, Task 2.3. The D40/D41/D42 comments in
`skills/war/assets/skill-doc-contracts.test.mjs` claimed the literal was verified present at
this task's base after Tasks 2.1/2.2 had retired it. Corrected in a fix round before land; the
comments now cite the plan's implementation base `a60221a` and name the merged dep that retired
the literal.

## Related

[[guard-rationale-comment-can-cite-a-different-scanned-surface-than-the-pin-it-justifies]] —
sibling comment-accuracy class (a comment misnames WHICH surface a pin covers; this lesson is
the WHEN/WHERE-verified variant for `deps`-edge provenance chains).
[[plan-line-number-refs-stale-use-construct-locator]] — the same "trust the artifact, not the
narrative" discipline for provenance claims in a serial-merge pipeline.
