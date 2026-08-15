---
name: spliced-test-section-orphans-adjacent-explanatory-comment
description: "Inserting a new labeled test section directly between an explanatory comment block and the test() call it documents orphans the comment — a #1034-class rot"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - comment adjacency
    - orphaned comment
    - test file splice
    - comment-construct rot
    - 1034
    - section banner
    - code review hand-scan
  provenance: agent-unverified
  slug: spliced-test-section-orphans-adjacent-explanatory-comment
  phase: dispatch-args-and-floor-coverage/2.1
  tags: 
    - comment-drift
    - test-hygiene
    - phase-close
  created: 2026-07-27
  originSessionId: 0ad881e1-4bbc-43c6-8e45-8597d9cec1cf
  modified: 2026-07-27T22:02:17.824Z
---

# Splicing a new test section between a comment and the test() it explains orphans the comment

## The pattern

A test file's explanatory comment block (documenting *why* the next `test(...)` call is shaped the
way it is — a regression rationale, a guard's discriminating case, etc.) is positionally coupled to
that one test: nothing marks the association except adjacency. When a later task inserts a **new**
labeled section (its own banner comment + several new `test(...)` cases) directly between the
existing comment and the test it describes, the file's physical layout now reads as though the
banner introduces the *new* section and the original comment sits orphaned with no test of its
own — even though every assertion in both blocks is still intact and nothing goes red. This is the
comment/construct-adjacency rot class (#1034) — introduced by the diff itself, not by later drift.

## Origin

Observed as an audit finding during phase `dispatch-args-and-floor-coverage`/2.1 (Task 2.1's new
`--args <file>` embedding section spliced between a symlink-invocation regression comment and its
`test('(guard) symlinked invocation …')` call in `stage-workflow.test.mjs`), disposition `absorb`.
Audit finding resolved in a fix round before land — recorded as pattern, not live instance: verify
before assuming any specific file still has this shape.

## How to apply

When inserting a new section into an existing test file (or any file with comment-then-construct
pairs), grep for any explanatory comment block that sits **immediately above** the insertion point
and would land immediately above the new section instead. Move the new section after that comment's
own test, or move the comment down with its test — never let the insertion silently sit between a
comment and the construct it explains. Worth a dedicated hand-scan pass whenever a plan slice's
"Known collateral pin" already calls out one comment reword for the same rot class in the same
file — a second, unmentioned comment in that file is a common sibling casualty.

> archived 2026-08-15: resolved — moved to archive
