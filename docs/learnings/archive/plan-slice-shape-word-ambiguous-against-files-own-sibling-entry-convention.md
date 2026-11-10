---
name: plan-slice-shape-word-ambiguous-against-files-own-sibling-entry-convention
description: "A plan slice's shape word ('in the short shape') for a new entry is ambiguous when the file already has a sibling-entry shape; name the sibling to match or state the divergence"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - CHANGELOG.md
    - plan slice wording
    - short shape
    - near-verbatim relocation
    - sibling entry convention
    - release blurb
    - D17
    - D10
    - phase-close backfill
    - shape ambiguity
    - Status blurb
  provenance: agent-unverified
  slug: plan-slice-shape-word-ambiguous-against-files-own-sibling-entry-convention
  phase: "adr-doc-truth-sweep/phase-2 (Release), task 2.1 + p2-polish"
  tags: 
    - doc-honesty
    - release
    - plan-authoring
    - phase-close
  created: 2026-08-21
  originSessionId: 7ca1efff-82f4-4b12-a4e0-5ec1e43ee937
  modified: 2026-08-21T23:19:58.370Z
---

# A plan slice's shape word for a new entry can be ambiguous against the file's own established sibling shape

## The rule

When a plan slice directs a worker to add a new entry to a file "matching \<some existing
content\>'s content in the short shape", and that file already contains multiple live sibling
entries in a *specific*, non-trivial shape, "short shape" is genuinely ambiguous: does it mean
"paragraph only", or "the file's own established short-but-not-bare shape" (which may include
bullets)? A worker resolving the narrower reading produces a syntactically complete but
substantively incomplete entry. The audit finding recurs, needs a phase-close backfill, and even
after the backfill a new Nit can ask which reading was intended, because the plan never said.

## What happened here

Plan `adr-doc-truth-sweep`, Task 2.1's slice for the CHANGELOG head entry read: "append this
release's own `## <semver> — <date>` section at the top, **matching the Status blurb's content in
the short shape**" (D17), against a Context decision (D10) that "0.17.0+ short blurbs [are]
relocated near-verbatim". The worker wrote the 0.18.1 head entry as the headline paragraph only,
but every other 0.17.0+ sibling entry carries the paragraph **plus** the release's bullet list.
Two audit seats raised this independently as a Minor `absorb` finding. The `p2-polish` task
backfilled the bullets, and its re-audit then raised a Nit that the entry was now a full
relocation, arguably not the "short shape" the slice asked for. The plan's Deferred validations
section had accepted CHANGELOG head-entry freshness as a residual, so no further action was
demanded, but the shape question was never settled.

## How to apply

When authoring a plan slice that directs "match \<X\>'s content in the short/compressed/summary
shape" for a target file that already has multiple live entries in an established shape:
either (a) name the *sibling entry* to match ("match the shape of the most recent existing
`## <semver>` entry"), or (b) if a genuinely shorter shape is intended, say so explicitly and
record in the plan's Deferred-validations section that this is a deliberate divergence from the
file's own convention. Don't leave "short shape" to carry both meanings at once. This is the same
word-choice-ambiguity class as
[[red-team-scope-word-mandate-satisfied-by-substance-not-literal-phrase-removal]] and
[[plan-mandated-test-comment-uniqueness-claim-can-be-code-traceably-false]] — a plan clause read in
isolation can be locally correct while conflicting with the file's own established convention.

[[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]],
[[release-status-is-replace-slot-not-empty-field]],
[[release-bump-slots-canonical-no-badge]],
[[absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction]]

> archived 2026-08-30: resolved — moved to archive
