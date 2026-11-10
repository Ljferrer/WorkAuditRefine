---
name: new-references-md-file-forces-doc-cli-consistency-placement-census-registration
description: "A new skills/*/references/*.md file must be registered in doc-cli-consistency.test.mjs (reds at once) and, if it is an ADR 0042 eviction destination, in QUALIFIED_HEADERS (fails open)"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: new-references-md-file-forces-doc-cli-consistency-placement-census-registration
  phase: 2026-09-03-in-band-absorb-default/phase-6 task 6.1
  keywords:
    - doc-cli-consistency.test.mjs
    - EVICTION_DESTINATIONS
    - VERB_SCAN_EXCLUSIONS
    - placement census
    - D2 census
    - default-deny
    - new references file
    - verb-scan
    - skills references
    - cascade touch
    - forced off-plan touch
    - QUALIFIED_HEADERS
    - ADR 0042
    - eviction destination
    - reference-link-integrity.test.mjs
    - at eviction time
    - headerRegion
    - byte-identity qualifier
    - hand-maintained registry
    - registration gap
  tags:
    - war
    - doc-guard
    - drift-guard
    - structural-test
    - cascade
    - reference-link-integrity
    - eviction
  created: 2026-09-04
  originSessionId: 1db2f526-d0af-4dc0-b9c7-311770b477a8
  modified: 2026-09-04T21:48:22.057Z
---

# A new skills/*/references/*.md file needs two registry touches, even off-plan

**Rule:** when a task creates a file under any `skills/*/references/`, register it in two
hand-maintained registries. The plan's Files list will rarely name either test file. These are
structural-test cascades, not scope choices.

## 1. doc-cli-consistency.test.mjs placement census (reds at once)

`skills/_shared/doc-cli-consistency.test.mjs`'s `'verb-scan placement census (D2)'` default-denies
every `skills/*/references/*.md` file that `referencesFiles()` finds. The scanned set must equal the
union of two arrays, `EVICTION_DESTINATIONS` and `VERB_SCAN_EXCLUSIONS`. A new, unplaced file reds
the suite with an `UNPLACED:` message naming it.

- Put the file in `EVICTION_DESTINATIONS` if its prose names a scanned module's CLI verbs or exports.
- Otherwise put it in `VERB_SCAN_EXCLUSIONS` with a reason comment.
- Grep the filename in both arrays to confirm it is in exactly one.

Instance: Task 6.1 of `2026-09-03-in-band-absorb-default` created
`skills/war/references/sweep-exclusion.md` and had to register it in `EVICTION_DESTINATIONS`.

## 2. QUALIFIED_HEADERS for an ADR 0042 eviction destination (fails open)

`skills/war/assets/reference-link-integrity.test.mjs` keeps `QUALIFIED_HEADERS`, a hand-written
array of `skills/war/references/` files whose header must carry an "at eviction time" byte-identity
qualifier. Its comment says "a new eviction destination joins it on creation", but nothing makes
that happen. A missing entry fails open: the check just never runs over that file, so nothing reds.

Instance: in phase 3 of the same plan, Task 3.1 created `gate-audit-checklist.md` and did not
register it. `gate-failure-classification.md`, from an earlier eviction, was also missing. Both were
fixed only in the phase-close polish pass.

Before closing an eviction task:
1. Grep the new filename in `QUALIFIED_HEADERS`.
2. If absent, add it, with a comment naming the owning task/ADR.
3. Confirm the file has a `## ` heading above the evicted section (`headerRegion()` fails closed on
   a heading-less document — see
   [[adding-a-headless-file-to-headerregion-scoped-check-requires-inserting-a-heading-first]]) and
   that its header sentence carries the exact "at eviction time" qualifier.

## Related

[[new-references-md-file-forces-doc-cli-consistency-placement-census-registration]] (merged into
this lesson). [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] — the
registration comment's own wording defect ("joined on creation" when it joined at a later polish
touch) shipped unfixed in that phase's terminal polish round.

> archived 2026-10-27: resolved — moved to archive
