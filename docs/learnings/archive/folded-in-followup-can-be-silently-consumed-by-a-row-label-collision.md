---
name: folded-in-followup-can-be-silently-consumed-by-a-row-label-collision
description: "A follow-up issue folded into a later task's dispatch that specifies its guard by ROW LABEL (write one D28 row) can be reported as satisfied when the task writes a row under that label for a DIFFERENT subject — the label collides, the audit sees a present-and-green D28, and the folded-in scope silently never lands; verify a fold-in by its required TOKENS at the landed tip, never by its label"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: folded-in-followup-can-be-silently-consumed-by-a-row-label-collision
  phase: prompt-surface-simplification/6.2
  keywords:
    - fold-in
    - follow-up issue
    - row label collision
    - D28
    - doc-contract row
    - scope silently unmet
    - verify by token not label
    - phase close
    - three-surface doctrine mirror
    - ADR 0042
  tags:
    - war
    - prompt-surface
    - audit-discipline
  created: 2026-07-29
---

# A folded-in follow-up can be silently consumed by a row-label collision

**Found (code-verified — landed tip `5df7e47a8e668259f83aaf2e0dbad0df66d02c4e`):** issue #1208
asked for "one **D28** row" binding a three-surface doctrine mirror (ADR 0042 D4/D5 ↔
`CONTEXT.md` `### Prompt-surface budgets` ↔ `CLAUDE.md` `## Doctrine placement`), and was folded
into Task 6.2's dispatch. Task 6.2 **did** land a row labelled `D28` — for a completely different
subject: `D28 — CONTEXT.md compressed glossary entries keep definition + trigger pointer …
(#1228)`. Five audit seats reviewed 6.2 and none flagged the fold-in as unmet, because by label
the deliverable was present, named as specified, and green.

Measured at the landed tip across `skills/**/*.test.mjs`: `0042` → **0** occurrences,
`trigger is the skeleton` → **0**, `when <trigger>` → **0**, `Doctrine placement` → **0**.
`git grep -l 0042 -- 'skills/**/*.test.mjs'` returned nothing. At that tip the mirror was still
hand-synced with no suite reading any of it — exactly the condition #1208 existed to end.

**Landed since:** #1208's mirror guard has since landed as the `D29 — ADR 0042 doctrine mirrors …
(#1208)` row in `skill-doc-contracts.test.mjs` — under the *next free* label, itself confirming
that row labels are moving targets.

**Why the label is the trap:** a doc-contract suite numbers its rows `D1, D2, …` in landing order,
so the *next free* label is a moving target. An issue authored at time T that says "write the D28
row" is naming a slot that a different task may claim first. The fold-in's real content — its
extraction constructs and token keys — is what identifies it; the label is incidental and
collides silently.

**How to verify a fold-in (the rule):** check the folded-in issue's **required tokens** at the
landed tip, never its row label or row count. For #1208 that is a four-token grep taking seconds.
A present-and-green row under the expected label is not evidence; a task can satisfy the label
while missing the scope entirely.

**Corollary for authoring fold-ins:** specify a folded-in guard by its subject and its token keys,
and say "the next free row label" rather than naming one. Naming `D28` in the issue body is what
made the collision invisible.

**Related:** [[worker-applying-one-red-team-adjudication-row-can-miss-a-sibling-in-the-same-file]]
— same family (a correctly-applied row masking a missed sibling), but that one is per-row inside a
diff; this one is a *label* aliasing two different subjects across two different plans.

> archived 2026-08-15: resolved — moved to archive
