---
name: release-blurb-fix-for-one-finding-can-violate-its-own-appositive-checklist-item
description: "A same-commit fix that inserts an exception clause into a release-blurb sentence can leave the sentence's trailing appositive binding by proximity to the new clause instead of its original subject — even when the paragraph's own authoring checklist names exactly this failure mode"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - appositive
    - proximity binding
    - release blurb
    - Status-blurb authoring checklist
    - README Status
    - checklist self-violation
    - em-dash parenthetical
    - phase-close polish
  provenance: code-verified
  slug: release-blurb-fix-for-one-finding-can-violate-its-own-appositive-checklist-item
  phase: 2026-07-28-prompt-surface-simplification/phase-7 (Task 7.2 + p7-polish)
  tags: 
    - doc-honesty
    - release-blurb
    - prose-authoring
  created: 2026-07-29
  provenanceNote: "written by WAR servitor, phase 7 close"
  originSessionId: a505c140-d6ba-4279-a944-c3fcab124655
  modified: 2026-07-30T00:17:29.252Z
---

# A release-blurb fix for one finding can violate its own paragraph's appositive checklist

## The rule

When a release blurb (README `## Status`) is authored against a checklist that includes an item
like "appositives restate their subject — a trailing clause binds by proximity to the nearest
noun, name the subject outright" (verify still present before acting — README.md's `### Status-
blurb authoring checklist` item 6, confirmed at the landed tip), a phase-close fix that inserts a
new **exception clause** between a general claim and the trailing appositive that was written to
gloss *that general claim* silently re-binds the appositive to the exception instead. The
underlying factual claims can all be individually true and still land with this structural defect,
because reviewers (and audit seats) tend to check each inserted clause's own accuracy rather than
re-reading how the surrounding sentence now parses as a whole.

## Evidence

`README.md`'s `## Status` paragraph (phase 7 of `2026-07-28-prompt-surface-simplification`, Task
7.2) originally read: "...re-anchored in the same task as the move — a presence key by relocating
its read to the destination file, an OLD-absent / whole-file key as a UNION scan over origin plus
every destination, never a relocated read — and the dispatched copies...". The em-dash pair wraps
the per-key-shape recipe as an appositive on "re-anchored". A phase-close commit fixing three
"same task" accuracy findings inserted a sanctioned-exception clause right after "the move",
producing: "...re-anchored in the same task as the move — save one whole-file UNION key ... because
that suite sat in same-wave Task 6.2's Files list while Task 6.1 performed the eviction — a
presence key by relocating its read to the destination file, an OLD-absent / whole-file key as a
UNION scan over origin plus every destination, never a relocated read — and the dispatched
copies...". The recipe appositive now binds by proximity to the exception clause, and its first
half ("a presence key by relocating its read") does not describe that exception at all (the
exception is a whole-file UNION key only) — precisely the failure mode the paragraph's own
checklist item 6 names. **Confirmed still present, unfixed, at the landed tip**:
`README.md` line 363 (the `## Status` paragraph), phase 7 of `2026-07-28-prompt-surface-
simplification`, landed tip `2037e6491117988b04115e79408017b392719a70` on
`dev/2026-07-28-prompt-surface-simplification`. Multiple phase-close audit findings (severity
Minor, disposition `absorb`, `phaseClose: true`) flagged this exact defect and suggested either
moving the exception clause after the appositive or restating the appositive's subject — but the
suggestion was not applied before land.

## How to apply

- When inserting a new clause into an existing release-blurb sentence, re-read the **whole**
  sentence afterward for appositive/pronoun proximity, not just the accuracy of the inserted text.
- Prefer appending the new exception as a **trailing** clause after any existing appositive, rather
  than splicing it in the middle — this preserves the appositive's original binding.
- If a checklist item exists specifically to catch this class (as README's item 6 does here),
  re-run it as an explicit check against the **post-fix** sentence, not just against the original
  draft — a fix for one checklist violation can introduce another.

> archived 2026-08-15: resolved — moved to archive
