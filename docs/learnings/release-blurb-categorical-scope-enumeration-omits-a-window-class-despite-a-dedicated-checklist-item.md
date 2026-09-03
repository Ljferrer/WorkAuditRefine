---
name: release-blurb-categorical-scope-enumeration-omits-a-window-class-despite-a-dedicated-checklist-item
description: "Before trusting a release blurb's closing categorical claim, bucket every file in the full diff window into a named category."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: release-blurb-categorical-scope-enumeration-omits-a-window-class-despite-a-dedicated-checklist-item
  phase: "ask-disposition/phase-3 (Release), task 3.1, 2026-08-25; recurred engine-reliability-and-filing-fidelity/phase-9 task 9.1, 2026-08-26 (omission); clean-pass confirmation 2026-08-30-engine-concurrency-and-pin-transfer/phase-3 task 3.1, 2026-08-30"
  keywords: 
    - release blurb
    - Status-blurb authoring checklist
    - bound every absolute
    - every other change in the window
    - categorical enumeration
    - CHANGELOG byte-identical paragraph
    - agent cards
    - CLAUDE.md
    - version-slots.test.mjs checklist test
    - README Status
    - checklist presence vs content
    - docs-only ride-alongs
    - design spec omitted
    - catch-all clause dropped
    - ADR unmentioned in blurb
    - full window diff enumeration
    - clean pass
    - mitigation confirmed
  tags: 
    - war
    - release
    - readme
    - audit-findings
    - prose-precision
  created: 2026-08-25
  originSessionId: 351f8fc5-4d48-4ee9-8beb-5d257d9bcf6f
  modified: 2026-08-30T15:52:38.237Z
---

# A release blurb's closing categorical claim can violate the checklist item written to catch it

**Rule:** a release blurb's closing scope sentence ("every other change in the window is X, Y, or
Z"; "its docs-only ride-alongs are A, B, and C") is an absolute. README's
`### Status-blurb authoring checklist` item 1 ("Bound every absolute") exists for it. The checklist's
presence is locked by `version-slots.test.mjs` (heading plus anchor token). Its content being
applied to a given draft is not checked by anything. Only an audit that enumerates the real window
catches the gap.

**How to apply:** run `git diff --name-only <base>...<phase-tip>` over the full plan window and
bucket every file by directory or type. Check that each bucket lands in a named category of the
closing sentence. Do not trust the sentence because other bullets in the same paragraph happen to
name the missing surfaces. If a prior release used a broader scope word that covered the omitted
classes (0.19.0 used "doctrine prose"), prefer restoring it over narrowing. Also check that a new
ADR in the window is named somewhere in the blurb.

**Why it recurs:** the blurb is written from memory of the plan, not from the diff. Agent cards,
`CLAUDE.md`, `docs/learnings/*`, and the design spec are the classes most often dropped.

**Disposition:** `note`, never `absorb`. The fix is a two-slot lock-step edit (`README.md`
`## Status` plus the matching `CHANGELOG.md` entry) and touching release slots post-bump from
another worktree risks [[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]].

**Recurrence tally:** three. 0.20.0 (ask-disposition/phase-3, task 3.1) omitted agent cards,
`CLAUDE.md`, and learnings. 0.20.1 (engine-reliability-and-filing-fidelity/phase-9, task 9.1)
omitted the design spec and ADR 0048 after dropping the catch-all clause. 0.21.7
(engine-concurrency-and-pin-transfer/phase-3, task 3.1) was a clean pass: the seat did the
full-window enumeration first and the sentence held. That clean pass is the evidence the check
above works.

Related: [[release-task-requirestest-true-with-test-free-files-list-routes-precedented-no-test-floor]]
(same release shape, a different recurring cost). Same family as
`release-blurb-headline-count-word-can-mismatch-its-own-enumeration` (headline count vs its own
list) and the archived `readme-status-blurb-homes-list-is-editorial-not-exhaustive` (a `Homes:`
pointer list vs its prose). All three are a blurb underclaiming what the document or window holds.
This one is the categorical-absolute sub-mechanism and stays its own lesson.
