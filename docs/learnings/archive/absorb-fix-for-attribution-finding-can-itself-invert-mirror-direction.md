---
name: absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction
description: "A phase-close polish fix can carry its own defect, and with no later round it ships whether the new finding is disposed absorb or note"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - phase-close polish
    - absorb finding
    - fail-open coherence sweep
    - note disposition terminal
    - mirror direction
    - CHANGELOG.md
    - README Status blurb
    - ADR 0008
    - construct-anchored
    - doc-truth
    - p2-polish
    - dropped mechanism detail
    - polish fix reproduces same defect class
    - ordinal attribution fragile
    - wave loop placement bug
    - comment describes its own edit wrongly
    - polish-rejected
    - polish-discarded
    - entire batch orphaned by one unrelated bug in same commit
  provenance: agent-unverified
  slug: absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction
  phase: dispatch-args-and-floor-coverage/2.1+p2-polish; recurred interview-and-authoring-contract/2 p2-polish; recurred adr-doc-truth-sweep/phase-2 (Release) p2-polish
  tags: 
    - doc-honesty
    - adr
    - mirror-registry
    - phase-close
  created: 2026-08-21
  supersedes_repo_copy: docs/learnings/absorb-fix-for-attribution-finding-can-itself-invert-mirror-direction.md
  originSessionId: 7ca1efff-82f4-4b12-a4e0-5ec1e43ee937
  modified: 2026-08-21T23:19:26.715Z
---

# A phase-close polish fix can carry its own defect, and land anyway

## The rule

A polish fix carries its own defect. When a task audit finding flags a doc passage as
under-describing, mis-attributing, or mis-punctuating something, the phase-close (`p<N>-polish`)
fix is new prose. It needs the same scrutiny the original finding applied, and **no further round
is guaranteed to enforce it**. The phase-close coherence sweep is fail-open: a discard leaves the
pre-polish tip, and even on a passing polish merge, the polish SHA's own audit is not iterated to
convergence. So a new defect raised against the polish diff itself can land uncorrected. The
disposition does not matter: a `note` on a phase-close fix is just as terminal as an `absorb`,
because no round follows the terminal phase-close audit.

## Occurrences

1. **Mirror direction inverted** (dispatch-args-and-floor-coverage): the `p2-polish` Amendment note
   in `docs/adr/0037-run-scoped-staged-phase-scripts.md` cast the live template code as the mirror
   and the stager's export as canonical, the reverse of the coupling comment; its own Minor
   `absorb` finding shipped unfixed.
2. **Over-narrowing** (interview-and-authoring-contract): the `p2-polish` rewrite of CLAUDE.md's
   `## Known traps` bullet narrowed the slug-sharing clause to legacy pairs only; its own `absorb`
   finding shipped unfixed.
3. **Dropped mechanism detail, `note` disposition** (adr-doc-truth-sweep, Release phase): the
   `p2-polish` fix re-punctuated the README `## Status` ADR 0008 sentence but deleted, as
   "now-redundant", the only clause that named construct anchoring; the re-audit disposed the loss
   `note`, so it shipped in the README and its CHANGELOG.md mirror.

## Sub-shape: the fix is rejected and takes the batch with it

The polish fix can reproduce the same misattribution class, add a new control-flow bug (loop
placement), or write an incoherent comment. When the polish is rejected or discarded, the whole
batch ships unfixed, including unrelated mechanical fixes bundled in the same commit. Instance:
in-band-absorb-default `p1-polish` replaced "both fail-loud-backstopped" in a
`campaign-ledger.mjs` header comment with "the first two", which was also wrong; the result was
`polish-rejected` then `polish-discarded`, and the original wording shipped.

## How to apply

When absorbing (or auditing) a phase-close fix for a prior finding, re-read the fix's *own* diff:

- (a) Does it keep every substantive fact the original passage carried, not just fix the flagged
  defect?
- (b) Is a clause the fix calls "redundant" really redundant, or is it the only carrier of a fact
  nothing else states?
- (c) For a count or summary header over sibling bullets, re-derive the claim from each bullet's
  own text. Swapping a stale count word for a stale ordinal claim is not a fix.
- (d) For an added loop or drain block, read the enclosing scope, not just the new lines. A
  correctly targeted fix can still run at the wrong iteration boundary.

Do not read a `note` disposition as "no consequence". For a phase-close-introduced defect, `note`
and `absorb`-with-no-further-round ship the same way. If the detail matters at the End-state
level, ask for an `absorb` (or push it to a following phase's doc sweep) instead of accepting
`note`.

[[mirrored-prose-row-parenthetical-inversion]], [[adr-policy-table-entry-vs-mechanism-attribution]],
[[claude-md-adr-range-literal-recurs-stale-with-no-drift-guard]],
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]]

> archived 2026-08-30: resolved — moved to archive
