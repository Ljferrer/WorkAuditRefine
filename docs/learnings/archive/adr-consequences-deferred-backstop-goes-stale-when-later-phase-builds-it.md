---
name: adr-consequences-deferred-backstop-goes-stale-when-later-phase-builds-it
description: "An ADR's Consequences bullet naming a mechanism as a 'declared backstop, built only if X slips' goes stale the instant a later phase discharges X and builds it — the ADR does not self-update and is usually out of the building task's footprint"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: adr-consequences-deferred-backstop-goes-stale-when-later-phase-builds-it
  phase: 2026-08-02-redteam-doctrine-and-guards/1.2
  keywords: 
    - ADR consequences
    - declared backstop
    - deferred upgrade path
    - doc-cascade sweep blind spot
    - ADR attribution rot
    - tense mismatch
    - follow-up finding
    - out-of-footprint straggler
    - ADR 0033
  tags: 
    - doc-honesty
    - adr
    - doc-cascade
  created: 2026-08-03
  related: "[[adr-policy-table-entry-vs-mechanism-attribution]], [[canonical-doc-precedent-mapping-subsection-can-contradict-the-same-docs-own-consequences-bullet]]"
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-03T08:24:04.853Z
---

# An ADR's "deferred backstop" prose can go stale the moment a later phase actually builds it

## The gotcha

An ADR's Consequences section can name a mechanism as a **declared, deferred backstop** — "built only
if condition X later fires" — as a deliberate, honest statement of a not-yet-built upgrade path. When
a later, separate task or phase later builds exactly that upgrade (because X did fire), the ADR's own
prose transitions from true to false, but nothing about the change is visible to a token-presence grep
sweep: every word the ADR uses (the mechanism's name, the script it lives in, "backstop") is still
spelled correctly and still true in isolation — only the **tense/status** is wrong (still describing a
maybe-future thing that is now a landed fact).

This differs from the more general [[adr-policy-table-entry-vs-mechanism-attribution]] pattern (where
mechanism attribution is restructured *within the same task* and the ADR's policy row lags a change
made elsewhere in that same task). Here the ADR's own forward-looking clause is invalidated by a
**separate, later** unit of work that has no obligation — and often no plan-sanctioned footprint — to
touch the ADR at all.

## Concrete instance (code-verified, live and unfixed at 2026-08-02-redteam-doctrine-and-guards land)

`docs/adr/0033-executed-probes-behind-escape-guard.md`'s Consequences bullet reads: "a full ref-diff
snapshot is the named upgrade path, built only if a second escape slips the [junk-ref name] pattern (a
declared backstop...)". Task 1.2 of this phase built exactly that upgrade
(`assert-no-repo-escape.sh`'s `--snapshot`/`--baseline` exact pre/post ref-diff), triggered by the very
condition the ADR named (issue #1244 — a second escape that slipped the name-heuristic pattern). The
plan correctly forbade editing ADR 0033 in-task ("ADR 0033 is never edited — an out-of-footprint
ambiguity routes as a follow-up finding"), and a follow-up finding was filed at both the task
gate-audit and the phase-close polish pass — but at the phase's landed tip (4bba660) the ADR's
Consequences bullet is unchanged: it still reads as if the ref-diff is a maybe-future backstop, with
no dated amendment recording it was actually built.

Locate cue: verify still present before acting — found at
`docs/adr/0033-executed-probes-behind-escape-guard.md`, the Consequences section's `ponytail:` clause
("a full ref-diff snapshot is the named upgrade path, built only if...").

## The durable rule

When a plan task builds a mechanism that an *existing* ADR's Consequences section names as "a declared
backstop, built only if `<condition>`" — and that condition just fired — check whether the ADR needs a
dated, append-only amendment recording the backstop was discharged, **even when the plan forbids
editing that ADR in-task**. File the follow-up immediately rather than trusting the next doc-cascade
token-sweep to catch it: a token-presence grep cannot see a tense mismatch, only a missing/wrong token.

> archived 2026-08-15: resolved — moved to archive
