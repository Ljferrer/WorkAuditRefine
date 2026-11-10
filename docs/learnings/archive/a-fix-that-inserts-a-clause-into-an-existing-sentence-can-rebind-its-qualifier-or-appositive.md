---
name: a-fix-that-inserts-a-clause-into-an-existing-sentence-can-rebind-its-qualifier-or-appositive
description: "A fix that inserts a qualifier or exception clause into an existing sentence can rebind a modifier or appositive; attach the clause to its target or append it, then re-read the whole sentence"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: a-fix-that-inserts-a-clause-into-an-existing-sentence-can-rebind-its-qualifier-or-appositive
  phase: 2026-08-06-war-strategy-mirror-guards/phase-2 (task 2.1 audit + phase-close polish); 2026-07-28-prompt-surface-simplification/phase-7 (Task 7.2 + p7-polish)
  keywords: 
    - "--afk scoping"
    - qualifier placement
    - parenthetical scoping bug
    - doc prose fix regression
    - scope creep in a fix
    - appositive
    - proximity binding
    - release blurb
    - Status-blurb authoring checklist
    - checklist self-violation
    - em-dash parenthetical
    - phase-close polish
  tags: 
    - doc-authoring
    - doc-honesty
    - prose-authoring
    - gotcha
  created: 2026-07-29
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-08-18T07:59:13.562Z
---

# A fix that inserts a clause into an existing sentence can rebind its qualifier or appositive

## The rule

A fix that inserts a qualifier or exception clause into an existing sentence can rebind a
modifier or appositive. The clause attaches by proximity to the nearest phrase, not to the one
the fix meant. Each inserted clause can be accurate on its own and the sentence can still parse
wrong. Reviewers and audit seats tend to check the inserted text, not how the whole sentence now
reads.

## Instances

- **Qualifier:** a fix inserted `— under `--afk`,` into the drafter-charter parenthetical in
  `skills/war-machine/SKILL.md` to scope the `AI-declared` markers, but the qualifier attached to
  "offers the sub-bullets" instead, a second scoping bug one clause over.
- **Appositive:** a phase-close fix inserted an exception clause into the README `## Status` blurb
  before a trailing appositive, so the appositive bound to the exception, the exact failure the
  blurb's own authoring checklist (item 6) names.

## How to apply

- Attach the qualifier directly to the phrase it must bound, or split the sentence so it has only
  one possible attachment point.
- Prefer appending a new exception as a trailing clause after any existing appositive, rather than
  splicing it into the middle.
- After the fix, re-read the whole sentence against the doctrine or checklist it must satisfy. A
  fix for one checklist violation can introduce another.

> archived 2026-08-30: resolved — moved to archive
