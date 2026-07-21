---
name: spec-context-band-statement-of-drift-survives-code-changes-uncorrected
description: "A design spec's dated Context/gap statement records drift as of authoring time — doc-truth sweeps leave it uncorrected even when later code makes it read stale"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: spec-context-band-statement-of-drift-survives-code-changes-uncorrected
  phase: gate-evidence-and-prose-truth/2.1 (2026-07-15)
  keywords:
    - design spec
    - Context band
    - problem statement
    - statement of drift
    - doc-truth sweep
    - decision record
    - stale-reading prose
    - per-hit adjudication
    - verified-correct disposition
    - reasonable auditors could differ
  tags:
    - doc-truth-sweep
    - spec-authoring
    - audit-calibration
    - plan-fidelity
  created: 2026-07-15
  relates:
    - "[[plan-rescope-note-supersedes-stale-spec-surgery-list]]"
    - "[[tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it]]"
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
---

# A spec's dated problem statement is a statement OF drift, not a live claim — leave it uncorrected when code later makes it read stale

**What happened (code-verified):** the phase's `#887` docs/specs sweep (task 2.1) found that
`docs/specs/2026-07-08-war-execution-engine-input-and-lifecycle-hardening-design.md`'s friction-3
problem statement (its "Context — the gap/problem" band, line 51) lists `plan.gate` among
interpolated fields that "silently ship `undefined`". Post-`#894` (this same plan's Phase 1), a
null `plan.gate` now composes safely to the discovery-only clause, so the `plan.gate` example in
that older spec reads stale against current behavior. Confirmed present, byte-matching the finding,
at `docs/specs/2026-07-08-war-execution-engine-input-and-lifecycle-hardening-design.md` (the
friction-3 bullet naming `plan.gate` among fields with "no general guard").

The worker adjudicated this **verified-correct, no change** — deliberately leaving the stale-reading
sentence untouched — because it sits in that spec's dated "Context — the gap/problem" band: a
statement describing the drift/gap *as it existed at authoring time*, not a live standing
current-behavior claim. Rewriting a decision record's problem statement to match new behavior would
erase the rationale the record exists to preserve (the same principle this very plan's own
Commander's Intent invokes for its own source spec: "a spec's statement OF a drift is not an
instance of it and must survive untouched"). Both auditor seats reviewing the finding **concurred**
this was the one per-hit disposition where reasonable auditors could differ, and recorded it as an
informational note rather than a defect — no block, no correction requested.

**Why durable:** a doc-truth / prose-drift sweep (`grep`-driven or otherwise) that mechanically
"corrects" every code-fact claim it finds stale will, if applied uncritically to a design spec's
Context/problem band, destroy the historical rationale those bands exist to record — a design spec
is a decision record, and its problem statement is supposed to describe *the world at the time the
decision was made*, not track the code forever after. This generalizes beyond this one plan: any
future doc-truth sweep touching `docs/specs/*.md` should distinguish "the spec makes a **standing**
current-behavior claim I should fix" from "the spec **states a problem that existed then**, which a
later fix resolved — leave it as history."

**How to apply:**
- Before "correcting" a spec passage a sweep flags as stale, check which band it lives in: a
  Context/gap/problem/friction band describing the world *before* the design's own fix is a
  statement of drift (leave it); a Mechanics/Surface-changes/current-behavior band making a live
  claim about what the system does *today* is not (fix it).
- Record the disposition explicitly in the sweep's `Survey:` block even when no edit is made — a
  silent skip looks identical to an oversight; a recorded "reviewed and concurred, no action" makes
  the calibration call auditable.
- This is the generalization of the narrower rule already used for a plan's own source-spec ("a
  plan's own source spec pairs the old term with the new one while describing the defect — a
  spec's statement of a drift is not an instance of it") — apply it to *any* design spec's dated
  problem statement, not just the plan's own immediate source spec.

## Related

[[plan-rescope-note-supersedes-stale-spec-surgery-list]] — a different spec/plan staleness
resolution (rescope notes outrank a stale surgery list), same family of "which artifact wins when
two disagree" judgment calls.
[[tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it]] — the
counter-case: a doc making a **live** code-fact claim that a sweep correctly *should* fix, useful as
the contrast case when distinguishing bands.
