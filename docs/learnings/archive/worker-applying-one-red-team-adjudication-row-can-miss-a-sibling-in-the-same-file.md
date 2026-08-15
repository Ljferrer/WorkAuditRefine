---
name: worker-applying-one-red-team-adjudication-row-can-miss-a-sibling-in-the-same-file
description: "A worker converting red-team adjudication into a doc/ADR can correctly apply one threaded adjudication row and still miss a sibling row's correction in the same file — audits must check each adjudication row against the artifact individually, not read the document once for overall coherence"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: worker-applying-one-red-team-adjudication-row-can-miss-a-sibling-in-the-same-file
  phase: "prompt-surface-simplification/phase-1 (Governance), landed dev/2026-07-28-prompt-surface-simplification @ fca6160f88a40ff141a91d10edcb9305e54e1cc5, 2026-07-28"
  keywords: 
    - red-team adjudication
    - per-row check-off
    - ADR 0042
    - adjudication D
    - adjudication F
    - partial application
    - document-level vibes
    - audit lens
    - drift
  tags: 
    - war-execution
    - audit
    - red-team
    - adr
  created: 2026-07-28
  originSessionId: 15ea107f-a540-466b-bb69-7ce45fb6e5a4
  modified: 2026-07-28T23:44:57.269Z
---

# Applying one red-team adjudication row correctly is no evidence the sibling row landed too

**The pattern.** When a worker converts a red-team report's adjudicated corrections into a single
target document (an ADR's resolved design tree, a spec section), each numbered/lettered
adjudication is an independent edit against a specific row of that document — applying one
correctly says nothing about whether sibling rows were applied at all. A worker can get the row it
focused on right and silently leave a stale row untouched, because the whole document still *reads*
coherently at a skim: each row is individually well-formed prose, and only a row-by-row diff
against the adjudication list catches the omission.

**This phase's instance (code-verified at the landed tip, `fca6160`).** `docs/adr/0042-prompt-surface-budgets.md`
threads multiple red-team adjudications into its D1–D6 design tree. The worker applied one
adjudication correctly to the **D5** row (the budget formula: `hard = post-shrink × 1.25 rounded up
to the KB`, `advisory = post-shrink × 1.10 rounded up to the KB`, with the parenthetical "red-team
adjudication superseded the spec's original advisory = 80%-of-hard, whose product pinned the
advisory line *at* the measured size with zero headroom") but initially missed a sibling
adjudication on the **D1** row, which had reproduced the spec's original literal ("README
pointers") that red-team had actually dropped. All three independent audit seats caught the D1 gap
before land; one fix round corrected it. The landed D1 row now reads "`README.md` is out of scope
too — a human release surface (red-team adjudication dropped the spec's README-pointers arm; the
trailing release-slot bump is its only touch)." Both rows now correctly reflect their respective
adjudications.

**How to apply (audit side):** when auditing a worker's conversion of a red-team-adjudicated report
into a target document, do not read the document once for overall coherence — walk the red-team
report's adjudication list row by row and confirm each one's specific correction landed in the
specific document location it targets. A document that reads smoothly is not evidence every row
landed; each row needs its own check-off.

**How to apply (worker side):** when a report threads N adjudications into one target file,
enumerate them explicitly before editing (a literal checklist) rather than editing while reading
the report prose linearly — a single read-through is exactly the failure mode that drops a row.

Related: [[plan-mandated-test-comment-uniqueness-claim-can-be-code-traceably-false]] (same family:
a claim that reads fine on skim but is falsifiable by construct-level trace).

> archived 2026-08-15: resolved — moved to archive
