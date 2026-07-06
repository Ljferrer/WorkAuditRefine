---
name: tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it
description: "Tour prose code-facts rot silently; re-verify on sweep"
metadata: 
  node_type: memory
  type: project
  keywords: [CodeTour, walkthrough drift, stale snapshot claim, doc rot, mirrored constants, unguarded prose, point-in-time count]
  provenance: code-verified
  slug: tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it
  phase: variable-audit-roster/T2
  tags: 
    - docs
    - tour
    - drift
    - mirror-discipline
    - doc-sweep
  created: 2026-07-02
  originSessionId: 61876e7f-1f8a-45c3-92bb-885bdccba10e
---

# A `.tour` narrative asserted a code fact that had gone (or always been) false

## What happened

`.tours/architect-war-system.tour` step 17 ("Gotcha: mirrored constants, one intentional
divergence") narrated that `land-decision.mjs`'s `HARD_ESCALATION_REASONS` (6 entries) and
`workflow-template.js`'s mirror (7 entries, +`'unrunnable-deps'`) were a *deliberate, commented*
divergence. By the time T2 (variable-audit-roster plan) surveyed the file, both arrays actually
listed **8 identical entries** (`escalate, audit-blocked, conflict, land_stale, dep-failed,
gate-evidence, unrunnable-deps, no-test`) — no divergence, no comment claiming one. The plan's own
survey called this out explicitly as false and directed a full rewrite of the step's narrative
(not just its numbers) to describe the mirror-discipline pattern generically instead of asserting
a specific stale divergence.

## The pattern

A `.tour` file (or any narrative walkthrough doc) freezes a claim about code *shape* at authoring
time. Unlike a version number or a line count, a narrative claim like "X and Y differ by exactly
one entry, and that's deliberate" has no drift-guard test watching it — nothing fails when the
underlying arrays converge or diverge differently. It rots silently and reads as authoritative
right up until someone doing a doc sweep actually re-diffs the referents against the live source.

## How to apply

Treat any tour/walkthrough prose that makes a specific quantitative or structural claim about two
code sites ("N vs M", "identical except for X") as a claim to re-verify, not copy forward, on every
doc-touching task that lists that file. Prefer rewriting such steps to describe the *mechanism*
("these two arrays are hand-mirrored because the sandbox can't import; drift-guard tests + comments
keep them in sync") rather than a point-in-time snapshot of their exact diff, so the narrative
survives future convergence/divergence without going false again.

## Code-verified referent

Re-confirmed at v0.14.6: the exported `HARD_ESCALATION_REASONS` in
`skills/war/assets/land-decision.mjs` and the `const HARD_ESCALATION_REASONS` mirror declaration
in `skills/war/assets/workflow-template.js` (marked "mirrors land-decision.mjs export … Keep in
sync") remain byte-identical — the array has since grown (`'unpackaged'` appended after the
original 8-entry survey), and the `.tours/architect-war-system.tour` step titled "17 · Gotcha:
mirrored constants — two sites, kept identical" needed no edit: its mechanism-style rewrite
survived the growth exactly as this memory predicts. Anchor on the construct names and the
"Keep in sync" comment, never on an element count — a count literal is the same rotting-snapshot
class this memory warns about.

## Relation

- [[plan-survey-token-sweep-misses-untagged-siblings]] — same T1/T2 plan, same discipline (a manual
  survey, not a mechanical grep, is what catches a stale/false claim); this file is the doc-narrative
  instance of that same "survey beats sweep" lesson.
- [[source-comment-lags-emitted-prompt-after-rewrite]] — related family: a comment/narrative
  describing code state can lag the code itself after a refactor.
- [[drift-guard-extraction-regex-unions-comparisons-with-assignments]] — the drift-guard machinery
  that *does* watch these two arrays for a real divergence; the tour text is the one place with no
  such guard.
