---
name: plan-slice-shape-word-ambiguous-against-files-own-sibling-entry-convention
description: "A plan slice's shape word ('in the short shape') for a new CHANGELOG/release entry can be…"
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
entries in a *specific*, non-trivial shape (not just a compressed paragraph), "short shape" is
genuinely ambiguous: does it mean "paragraph only" (short relative to what a full write-up could
be) or "the file's own established short-but-not-bare shape" (which may include structured
sub-elements like bullets)? A worker resolving the narrower reading produces a syntactically
complete but substantively incomplete entry — an audit finding that recurs (independently, at two
different auditor seats) and needs a phase-close backfill to close, and even after the backfill a
new Nit can surface asking which reading was actually intended, because the plan text never
disambiguated it.

## What happened here

Plan `adr-doc-truth-sweep`, Task 2.1's plan slice for the CHANGELOG head entry read: "append this
release's own `## <semver> — <date>` section at the top, **matching the Status blurb's content in
the short shape**" (D17), against a Context decision (D10) that "0.17.0+ short blurbs [are]
relocated near-verbatim". At land, the worker wrote the 0.18.1 head entry as the headline
paragraph only — but every other 0.17.0+ sibling entry already in `CHANGELOG.md` (0.18.0, 0.17.13,
0.17.1, 0.17.0) carries the paragraph **plus** the release's bullet list; only the pre-0.17.0
entries are genuinely paragraph-only. Task 2.1's audit raised this as a Minor, `absorb`,
`phaseClose: true` finding (independently, twice, from different rationale angles — both citing
D17's "matching... content" clause and D10's "near-verbatim" framing against the file's own
sibling shape). The `p2-polish` task backfilled the three README `## Status` bullets into the
CHANGELOG entry to close it — but `p2-polish`'s own re-audit then raised a fresh Nit: the backfill
makes the entry a *full* near-verbatim relocation, which is arguably **not** the "short shape" the
slice literally asked for, just correct relative to the file's own convention. That residual was
explicitly named in the plan's own `## Deferred validations` section as an accepted gap ("CHANGELOG.md
head-entry freshness after this plan (A2/D13/D17) ... deliberately not a fifth version slot ...
accepted residual") — so no further action was demanded, but the shape question itself was never
actually settled, only shipped one way and noted as such.

Could not verify the current byte-state of `CHANGELOG.md`/`README.md` against the threaded landed
tip this run: cwd HEAD (`067b7b538350044c283f2f7e14f5b85c6677d882` on branch
`claude/work-audit-refine-red-team-4de4e6`) is an unrelated plan/session; no live worktree was
found under `.git/worktrees/*` matching the `adr-doc-truth-sweep` slug (the phase's task worktree
had already been reaped); the landed branch ref exists with no live worktree, a dead end for Read
with no Bash available. This lesson is recorded from the phase's audit-log input (two independent
Task-2.1 findings plus five independent p2-polish findings converging on the same shape-ambiguity
class), not from a live Read of the shipped files. Verify still present before citing as a live
instance: `CHANGELOG.md`'s `## 0.18.1` head entry vs its `## 0.18.0`/`## 0.17.13` siblings;
`docs/plans/2026-08-06-adr-doc-truth-sweep.md`'s Task 2.1 plan slice (D17) and `## Deferred
validations` section.

## How to apply

When authoring a plan slice that directs "match \<X\>'s content in the short/compressed/summary
shape" for a target file that already has multiple live entries in an established shape:
either (a) name the *sibling entry* to match byte-for-byte-in-spirit ("match the shape of the most
recent existing `## <semver>` entry"), or (b) if a genuinely shorter shape is intended, say so
explicitly and record in the plan's Deferred-validations section that this is a deliberate
divergence from the file's own convention — don't leave "short shape" to carry both meanings at
once. This is a plan-authoring-precision instance of the same word-choice-ambiguity class as
[[red-team-scope-word-mandate-satisfied-by-substance-not-literal-phrase-removal]] and
[[plan-mandated-test-comment-uniqueness-claim-can-be-code-traceably-false]] — a plan clause read in
isolation can be locally correct while conflicting with the file's own established local
convention.

[[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]],
[[release-status-is-replace-slot-not-empty-field]],
[[release-bump-slots-canonical-no-badge]],
[[absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction]]
