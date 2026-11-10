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

Audit findings resolved in a fix round before land. Recorded as a pattern, not a live instance. The landed tip carries the corrected wording.

## What changed

Operator ruling D23 turned "one digest manifest per task" into "one per cited artifact". The path gained a `<sha12>` key. `MANIFEST_KEYS` stayed the same.

Every guard that moved with it binds a value, meaning the template string. These are the End state 27 test, the mirror-registry row for `MANIFEST_PATH_TEMPLATE`, and the doc-token guard on the `Manifest path:` line. A sentence that says "its manifest" in the singular names no value. No guard reads it.

## Which surfaces lagged

- The Lead procedure said "The worker commits its digest manifest". It sat outside the task's `Files:` list. Three seats across two rounds rated it Nit, `absorb`, `phaseClose:true`.
- ADR 0053 section 2, section 5 and the Decision log still said one manifest, with no D23 or D24 row. A seat rated it Minor under the ADR 0025 attribution check.
- The doctrine home, the card bullet and the export comment lagged by one word. See [[sha12-manifest-key-has-no-code-deriving-it-so-unguarded-prose-defines-its-source-digest]].

The phase-close sweep fixed the first two. It needed two rounds, because the first edit overran the line wrap on two lines.

## What stayed singular on purpose

- ADR 0041's dated Decision log row still reads "the digest manifest". A dated row is history.
- The card's `ADR 0041 rung:` line is generic and true in the singular. A template test extracts that line and the `HOLD only on a sha256 mismatch` line from the card. It requires both byte-for-byte in the dispatched evidence-seat skeleton (End state 22). The per-artifact rule rides the HOLD line: "on any cited artifact". Editing one copy of the rung line would split the pair.
- The `CONTEXT.md` glossary entry "Digest manifest" is generic singular. No seat flagged it.

Seats rated the ADR 0041 row and the rung line `note`.

## What was deferred on purpose

The README Status blurb and the CHANGELOG 0.21.17 entry still described the single-manifest path after the task. They are release-slot files. A later task owns them. End state 28 greps the CHANGELOG for `<sha12>`. A seat applied stale-calibration rule 2 and rated it `note`. The in-run auto-fix machinery refuses release-slot files anyway. See [[release-slot-files-exempt-from-in-run-ace-and-sweep-machinery]].

## How to apply

- When a task changes a contract's cardinality, grep for the noun phrase ("digest manifest", "its manifest"). A grep for the value finds nothing new.
- Sort each hit into one of three bins: rewrite it, leave it (a dated row, or a generic sentence under an IDENTICAL guard), or defer it (a release-slot file that a later task owns).
- If a hit sits outside the task's `Files:` list, put it in the plan slice. Otherwise expect it to reach the phase-close sweep as an `absorb` finding.
- Same family: [[default-flip-must-audit-all-doc-surfaces]] (a changed fact survives in a sibling surface).

## Recurrence: N-to-fewer grouping breaks an index-aligned reader (2026-11-08 phase 1)

- Plan D26 grouped `handoff.followUps[]` by issue number. Rows that share an issue now ride the first entry's `merged[]`.
- So the list got shorter than `minorsFiled[]`. Three Lead docs still said each entry maps the `minorsFiled[]` row "at the same index" ("one for one", "row for row").
- The ADR 0058 behavior-row floor used that mapping. A Lead who followed it could skip a tail behavior row and advance unruled.
- The engine comment said "the Checkpoint floor reads minorsFiled". That was true in code and false in the doctrine the Lead follows.
- Three seats raised it as Major. The fix round made every entry and `merged[]` row carry its own `findingClass`. It reworded SKILL.md, late-defects.md, resume-and-recovery.md and schemas.md, and banned `at the same index` in skill-doc-contracts.
- Lesson: a grouping or dedup change shrinks a list. Grep every reader for positional words ("same index", "row for row", "one for one") as well as the noun phrase.
- A fixture that asserts only the count and the merged titles stays green over this break. Add an arm that puts the flagged row at a grouped index.

Audit finding resolved in a fix round before land. Recorded as pattern, not live instance. Read at landed tip 293edc46 through the run's `_refinery` worktree (branch head 37560c72, the land merge's source, same tree).

## Locate-cue (verify still present before acting)

- `skills/war/references/late-defects.md`: search `not index-aligned` (2026-11-08 recurrence).
- `skills/war/assets/skill-doc-contracts.test.mjs`: search `at the same index` (the ban regex).
- `skills/war/references/artifact-evidence-lead.md`: search `one digest manifest per cited artifact`.
- `docs/adr/0053-rea-artifact-evidence-source.md`: search `digest manifest per cited` in section 2, `mismatch against any cited` in section 5 (both sentences wrap after `cited`), and `D23` in the Decision log.
- `docs/adr/0041-audit-evidence-precedence.md`: the 2026-10-20 row that begins `evidence-seat rung`.
- `agents/war-evidence-auditor.md`: the `ADR 0041 rung:` line and the `HOLD only on a sha256 mismatch` line.
- `skills/war/assets/workflow-template.engine-1.test.mjs`: the test titled `evidence seat skeleton: IDENTICAL wording`.

Read at landed tip 82cef9c9 through the run's `_refinery` worktree (HEAD equal to the tip). The resolved wording is at the tip. The defects themselves come from the audit log, so this file stays `agent-unverified`.
