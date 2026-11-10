---
name: red-team-scope-word-mandate-satisfied-by-substance-not-literal-phrase-removal
description: "A red-team row's proscribed phrase can ship while its concern is fixed another way; re-derive the falsification, don't grep for the banned string"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - red-team adjudication
    - scope word
    - unscoped absolute
    - footprint sentence
    - blurb constraint
    - enumeration widening
    - literal phrase retained
    - README Status
    - adjudication row compliance
    - bound every absolute
    - proscribed phrase
    - falsification
    - disposition note
  provenance: code-verified
  slug: red-team-scope-word-mandate-satisfied-by-substance-not-literal-phrase-removal
  phase: "2026-08-06-war-strategy-mirror-guards/phase-3 (Release, task 3.1)"
  tags: 
    - war
    - release
    - readme
    - status-section
    - red-team
    - adjudication
    - prose-precision
  relates: 
    - "[[release-blurb-overstates-guard-semantics]]"
    - "[[redteam-adjudication-is-authoritative-version-source]]"
  created: 2026-08-18
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-08-18T08:49:32.687Z
---

# A red-team scope-word mandate can be satisfied in substance while its literal proscribed phrase still ships

## The rule

A red-team adjudication row can prescribe an exact anti-overclaim mechanism — e.g. "bound EVERY
absolute with its scope word (say 'the phase-1/2 code diff', never an unscoped 'the landed diff')" —
because a named absolute would otherwise be falsified by a fact the row identifies (here: the
release commit itself touches files the blurb's enumeration didn't originally cover). An author can
neutralize that exact falsification by a **different mechanism** than the one the row recommends
(widening the enumeration to include the release's own version-slot files, rather than swapping in
the row's suggested scope word) and ship the row's literally-proscribed phrase verbatim. Grepping
the landed text for the banned string therefore does not tell you whether the constraint is honored
— you have to re-derive whether the sentence is still falsifiable against the actual diff.

## Evidence

In `2026-08-06-war-strategy-mirror-guards` phase 3 (Release), the red-team row banned an unscoped
"the landed diff", because the release commit touches `plugin.json`/`marketplace.json`/`README.md`.
The landed `README.md` `## Status` footprint sentence still opens with "**The landed diff** touches
doctrine and seat-prompt prose, ... and the version slots". The task audit and the post-merge
gate-audit both flagged it and both rated it `disposition: note`: the widened enumeration ("and the
version slots") covers the release commit's own files, so the sentence is true and unfalsified.

## How to apply

- When auditing a blurb against an adjudication row that names a specific proscribed phrase, do not
  stop at a string match on the phrase. Re-derive the falsification the row is guarding against
  (here: `git diff --stat <phase-base>..<tip>` against the paragraph's own enumeration) and confirm
  whether it still holds — a proscribed phrase that ships anyway may already be neutralized by an
  independent fix.
- When *authoring* a blurb against such a row, prefer the row's own recommended scope-word form
  when practical (it is unambiguous even to a skim-reader scoped only to the branch in isolation);
  a widened enumeration is a valid but weaker fix, since it depends on the reader tracing the full
  list rather than reading one bounding phrase.
- Same family as [[release-blurb-overstates-guard-semantics]] ("bound every absolute with its scope
  word" is literally that lesson's checklist item 1), but this is the **inverse** shape: not a
  blurb that overclaims past what its own evidence supports, but one that keeps a *directive's*
  proscribed wording while its substance is independently rescued — worth distinguishing when
  triaging a finding, since the correct disposition is `note`/confirmation, not a defect.

> archived 2026-08-30: resolved — moved to archive
