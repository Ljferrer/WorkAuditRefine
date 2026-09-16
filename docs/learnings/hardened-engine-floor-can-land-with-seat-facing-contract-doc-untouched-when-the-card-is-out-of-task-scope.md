---
name: hardened-engine-floor-can-land-with-seat-facing-contract-doc-untouched-when-the-card-is-out-of-task-scope
description: "A new engine refusal rule can land while every doc a seat reads still describes the old, looser contract, when PIN-1 blocks a lone-file task from touching the card."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: hardened-engine-floor-can-land-with-seat-facing-contract-doc-untouched-when-the-card-is-out-of-task-scope
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-7 task 7.1, landed 2694f617c02b8ae0a527086792355331c5cc5a79 on dev/2026-09-06-engine-and-audit-verdict-integrity"
  keywords: 
    - PIN-1
    - seat-facing contract
    - card out of scope
    - DISPOSITION WIDENINGS
    - disposition-eligibility.md
    - agents/war-auditor.md
    - citation floor
    - CITATION_MIN_LENGTH
    - deferred residual
    - card and dispatched prompt one commit
    - deliberate deferral repeated across audit rounds
  tags: 
    - war
    - workflow-template
    - prompt-surfaces
    - plan-decomposition
    - audit-finding
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-08T09:03:49.897Z
---

# A new engine refusal floor can land with its seat-facing contract doc still describing the old rule

## What happened (code-verified — landed tip `2694f617c02b8ae0a527086792355331c5cc5a79` on
`dev/2026-09-06-engine-and-audit-verdict-integrity`, phase 7 "Citations" task 7.1, read via the
run-scoped `_refinery` worktree whose `HEAD` is directly on this tip:
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/`).

Task 7.1 hardened `citationOf` in `skills/war/assets/workflow-template.js` (search
`const citationOf`): a cited `row` must now be an exact match or a directional substring of a
threaded adjudication row, **and** reach `CITATION_MIN_LENGTH` (24) characters, else the citation
is refused (fails open to a plain absorb, logged once per row per phase). This is PIN-15.

The seat-facing contract a seat actually reads before writing a `citation` field — rule 3 in
`skills/war/references/disposition-eligibility.md` (search "absorb-by-citation"), pointed to from
`agents/war-auditor.md`'s "Disposition eligibility" callout, plus the dispatched
`DISPOSITION WIDENINGS` prompt block built in `workflow-template.js` — still says only "set
`citation` with `row` + a one-line `rationale`." Confirmed absent at the landed tip: neither
`disposition-eligibility.md` nor `agents/war-auditor.md` contains "24 charact", "directional",
"contiguous substring", or `CITATION_MIN_LENGTH`.

This was not an oversight the worker missed once. At least six independent audit seats across
four different commits within this single task (`a7bec94`, `c0f88d06`, `d1a9d43`, `3f55b04`,
`20504162`, and the final `3d05c6e8` pin) each raised the identical gap and each was deliberately
routed `disposition: note` (never `absorb`), citing the same reason every time: **PIN-1** requires
the standing card and its dispatched-prompt mirror to change in the same commit with a registry
row, and Task 7.1's `Files:` list contains neither `agents/war-auditor.md` nor
`skills/war/references/disposition-eligibility.md`. D23 (the plan's card-ownership assignment)
gives that card no Phase 7 owner — it is next owned by Phases 10, 11 and 12.

## The durable rule

When a task hardens an engine-side validation floor (a new refusal condition on a value a seat
supplies), check whether the seat-facing doc describing that value's contract is inside the same
task's `Files:` list. If it is not, and PIN-1 (or an equivalent single-commit card+prompt-mirror
binding rule) applies, the gap is **structurally deferred, not a bug to chase** — expect every
subsequent audit round to re-flag it verbatim until a task that owns the card lands the sentence.
Do not try to sneak the doc sentence into the current commit alone; that would violate the binding
rule itself (the card and its dispatched mirror must move together). Record the deferral once, and
route it to the phase/task that actually owns the card.

## Practical effect (fails open, not silent data loss)

A seat that transcribes a threaded row plus its own gloss now gets a **silent refusal**: the
citation is dropped, the finding rides as a plain absorb, and the parked ask (if any) stays parked
for the operator to rule at the Checkpoint. Nothing is lost or corrupted — the seat just loses an
auto-resolution it used to get, with no doc telling it why.

## Locate-cue (verify still present before acting)

`skills/war/references/disposition-eligibility.md`, rule 3 ("Trade-off-ask routing (D5) and
absorb-by-citation (D6)"), around line 35-45. `agents/war-auditor.md`, the "Disposition
eligibility" callout pointing at that file (search "Disposition eligibility"). The dispatched
`DISPOSITION WIDENINGS` block in `skills/war/assets/workflow-template.js`. The floor itself:
`const CITATION_MIN_LENGTH = 24` in the same file.

## Related

[[in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round]] — the sibling
gotcha from the same task: several other findings from this task's own audit round shipped
unfixed for a different reason (`fixRounds: 0`, no fix round ran at all).
[[bidirectional-substring-containment-is-a-weak-membership-test-for-a-trust-boundary-floor]] —
the vulnerability this same task's engine change fixed (PIN-15).
[[standing-instruction-vs-dispatched-prompt-coverage-split]] — the general PIN-1 mirroring rule
this deferral respects.
