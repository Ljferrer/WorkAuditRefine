---
name: contract-cardinality-change-leaves-singular-prose-that-no-value-guard-reads
description: A one-to-N contract change leaves singular prose on surfaces that a path-value guard never reads
metadata:
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
  provenance: agent-unverified
  slug: contract-cardinality-change-leaves-singular-prose-that-no-value-guard-reads
  phase: "2026-10-20-rea-artifact-evidence/phase-5 (task 5.1, p5-polish)"
  tags:
    - war
    - rea
    - doc-truth
    - plan-faithfulness
    - phase-close
  created: 2026-10-22
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-23T00:34:27.645Z
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

## Locate-cue (verify still present before acting)

- `skills/war/references/artifact-evidence-lead.md`: search `one digest manifest per cited artifact`.
- `docs/adr/0053-rea-artifact-evidence-source.md`: search `digest manifest per cited` in section 2, `mismatch against any cited` in section 5 (both sentences wrap after `cited`), and `D23` in the Decision log.
- `docs/adr/0041-audit-evidence-precedence.md`: the 2026-10-20 row that begins `evidence-seat rung`.
- `agents/war-evidence-auditor.md`: the `ADR 0041 rung:` line and the `HOLD only on a sha256 mismatch` line.
- `skills/war/assets/workflow-template.engine-1.test.mjs`: the test titled `evidence seat skeleton: IDENTICAL wording`.

Read at landed tip 82cef9c9 through the run's `_refinery` worktree (HEAD equal to the tip). The resolved wording is at the tip. The defects themselves come from the audit log, so this file stays `agent-unverified`.
