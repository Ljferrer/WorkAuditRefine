---
name: new-doc-procedure-diverges-from-sibling-ratified-disambiguation-rule-same-lookup
description: "A new Lead procedure that resolves an ambiguous campaign-ledger match by newest mtime diverges from war-review's already-ratified rule for the identical lookup (match plans[].plan, never the newest campaign)"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: new-doc-procedure-diverges-from-sibling-ratified-disambiguation-rule-same-lookup
  phase: 2026-09-03-in-band-absorb-default/phase-6 task 6.1
  keywords: 
    - ledger disambiguation
    - multi-ledger tiebreak
    - newest by mtime
    - never the newest campaign
    - "plans[].plan match"
    - sweep-exclusion.md
    - war-review SKILL.md
    - sibling doc divergence
    - same lookup different rule
    - campaign ledger ambiguity
  tags: 
    - war
    - doc-guard
    - campaign
    - correctness
    - gotcha
  created: 2026-09-04
  originSessionId: 1db2f526-d0af-4dc0-b9c7-311770b477a8
  modified: 2026-09-04T21:48:44.949Z
---

# A new Lead procedure's ledger-disambiguation rule diverges from the ratified sibling rule for the identical lookup

**Code-verified** at landed tip `d4793b14eae512c69c55c9fe9990f89b559baed3` on
`dev/2026-09-03-2026-09-03-in-band-absorb-default`, read via the `_refinery45` worktree (`gitdir`
names this plan's slug; `HEAD` byte-equals the landed tip).

## What happened

Task 6.1 wrote a new Lead procedure, `skills/war/references/sweep-exclusion.md`, that resolves an
ambiguous campaign ledger match (more than one `.claude/campaigns/<id>/ledger.json` whose `plans[]`
carries this run's `planSlug`) by "take the newest by mtime and log the choice" (`## The ledger`
section, verbatim at the landed tip). `skills/war-review/SKILL.md` already solves the identical
lookup problem — resolving a campaign ledger for a given plan slug — for its own telemetry rows, and
states the opposite rule explicitly: "never the newest campaign" — disambiguate a multi-slug match by
the entry whose `plans[].plan` equals the resolved plan path, and render `n/a` with the ambiguity
stated if still ambiguous (confirmed verbatim at the landed tip, `skills/war-review/SKILL.md`, the
`red-team rounds` telemetry row).

This is not a live bug today — it fires only when two campaign ledgers both list the same plan slug,
an edge case the auditor flagged but did not force-fix (`disposition: note`). The choice is always
logged, so the wrong pick is never silent, but it can still select a contention set that omits a real
sibling plan's file footprint, defeating the exclusion set's own stated purpose (avoiding a rebase
conflict against a plan that IS contending).

## The durable rule

Before writing a new doc procedure that resolves the same kind of lookup an existing ratified doc
already solves (here: "which campaign ledger, given ambiguity"), grep the sibling doc for its
existing rule and reuse it rather than picking an independent tie-break. Two doc surfaces silently
disagreeing on the same disambiguation logic is a correctness risk that only manifests on the rare
ambiguous case, so review easily treats it as a Nit and defers it — fix it at the point of
authorship instead, before the sibling rule becomes separate prior art to reconcile later.

## Locate-cue (verify still present before acting)

`skills/war/references/sweep-exclusion.md`, `## The ledger` section — search "take the newest by
mtime"; `skills/war-review/SKILL.md`, the `red-team rounds` telemetry row — search "never the newest
campaign".
