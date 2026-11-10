---
name: contract-cardinality-change-leaves-singular-prose-that-no-value-guard-reads
description: A one-to-N contract change leaves singular prose on surfaces that a path-value guard never reads
metadata:
  promoted: dev/2026-11-08-engine-findings-ace-and-late-fix@phase-1
  node_type: memory
  type: project
  keywords:
    - cardinality change
    - one manifest per task
    - per cited artifact
    - singular wording
    - doc cascade
    - stale sibling surface
    - dated decision log
    - IDENTICAL guard
    - index-aligned projection
    - same index
    - grouped followUps
  provenance: agent-unverified
  slug: contract-cardinality-change-leaves-singular-prose-that-no-value-guard-reads
  phase: "2026-10-20-rea-artifact-evidence/phase-5 (task 5.1, p5-polish); recurrence 2026-11-08-engine-findings-ace-and-late-fix/phase-1 (task 1.1)"
  tags:
    - war
    - rea
    - doc-truth
    - plan-faithfulness
    - phase-close
  created: 2026-10-22
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-11-09T22:18:14.221Z
---

# A cardinality change leaves singular prose that no value guard reads

Audit findings resolved in fix rounds before land. Recorded as a pattern, not a live instance.

## The instance

Operator ruling D23 turned "one digest manifest per task" into "one per cited artifact". The path gained a `<sha12>` key. Every guard that moved with it binds a value (the template string). A sentence that says "its manifest" in the singular names no value, so no guard reads it.

Lead procedure, ADR 0053 and three one-word doctrine sites lagged; the phase-close sweep fixed them (see [[sha12-manifest-key-has-no-code-deriving-it-so-unguarded-prose-defines-its-source-digest]]). A dated ADR 0041 Decision log row and the card's IDENTICAL-guarded `ADR 0041 rung:` line stayed singular on purpose. The release-slot README and CHANGELOG were deferred to a later task (see [[release-slot-files-exempt-from-in-run-ace-and-sweep-machinery]]).

## How to apply

- When a task changes a contract's cardinality, grep for the noun phrase ("digest manifest", "its manifest"). A grep for the value finds nothing new.
- Sort each hit into one of three bins: rewrite it, leave it (a dated row, or a generic sentence under an IDENTICAL guard), or defer it (a release-slot file that a later task owns).
- If a hit sits outside the task's `Files:` list, put it in the plan slice. Otherwise expect it to reach the phase-close sweep as an `absorb` finding.
- Same family: [[default-flip-must-audit-all-doc-surfaces]] (a changed fact survives in a sibling surface).

## Recurrence: N-to-fewer grouping breaks an index-aligned reader (2026-11-08 phase 1)

- Plan D26 grouped `handoff.followUps[]` by issue number, so the list got shorter than `minorsFiled[]`. Three Lead docs still said each entry maps the row "at the same index". A Lead who followed that could skip a tail behavior row and advance unruled.
- The fix made every entry and `merged[]` row carry its own `findingClass` and banned `at the same index` in skill-doc-contracts.
- Lesson: a grouping or dedup change shrinks a list. Grep every reader for positional words ("same index", "row for row", "one for one") as well as the noun phrase.
- A fixture that asserts only the count and the merged titles stays green over this break. Add an arm that puts the flagged row at a grouped index.

Locate-cue: verify still present before acting — `not index-aligned` in `skills/war/references/late-defects.md` and the `at the same index` ban regex in `skills/war/assets/skill-doc-contracts.test.mjs`. The anchors resolve; the defects themselves come from the audit log, so this file stays `agent-unverified`.
