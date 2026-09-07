---
name: fix-round-adds-directive-sentence-without-folding-superseded-clause-on-budget-surface
description: "A fix round that adds one new sentence a plan slice asked for can leave the older clause stating the same rule in place, wasting bytes on a byte-budgeted, drift-guarded surface"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: fix-round-adds-directive-sentence-without-folding-superseded-clause-on-budget-surface
  phase: 2026-09-03-in-band-absorb-default/phase-6 task 6.1
  keywords: 
    - duplicate clause
    - unfolded prose
    - budget headroom
    - drift-guarded surface
    - SKILL.md byte budget
    - Checkpoint ask ruling gate
    - demote:ask-unruled-afk
    - question preserved
    - fix round leftover
    - superseded wording
  tags: 
    - war
    - prompt-surface
    - budget
    - review
    - gotcha
  created: 2026-09-04
  originSessionId: 1db2f526-d0af-4dc0-b9c7-311770b477a8
  modified: 2026-09-04T21:48:34.580Z
---

# A fix round satisfying a plan directive can leave the superseded clause in place, wasting bytes on a budget-critical surface

**Code-verified** at landed tip `d4793b14eae512c69c55c9fe9990f89b559baed3` on
`dev/2026-09-03-2026-09-03-in-band-absorb-default`, read via the `_refinery45` worktree (`gitdir`
names this plan's slug; `HEAD` byte-equals the landed tip).

## What happened

The plan slice for Task 6.1 asked for the Checkpoint `--afk` posture to gain one new sentence: an
unmatched ask now files as `follow-up` with `demote:ask-unruled-afk` on the body prefix line (D13).
The worker added that sentence but kept the older clause stating the same routing in different words.
`skills/war/SKILL.md`'s `## Checkpoint` "Ask ruling gate" bullet reads, verbatim, at the landed tip:
"a no-match demotes to follow-up with the question preserved in the issue body — visibly not
loss-free, flagged in the phase report; the unmatched ask files as a `follow-up` with
`demote:ask-unruled-afk` on the body prefix line, question preserved (D13)". Both clauses assert the
same no-match routing, and both say "question preserved". At least three separate audit seats
(`correctness-deep`, `correctness`, `plan-faithfulness`) independently flagged the duplication across
different fix-round commits, and it survived unfolded through every round to land.

Every seat routed the finding `disposition: note`, not `absorb` — each cited the same reason:
`skills/war/SKILL.md` is a drift-guarded, byte-critical surface (multiple seats independently
measured about 290 B of headroom left against its hard line at this tip), and folding two clauses is
a prose judgment call no seat could confirm from the read-only guard grammar would not break another
mirror pinning the older wording. The duplication was correctly left unfixed rather than risk
breaking a drift guard.

## The durable rule

When a fix round satisfies a plan directive by adding a new sentence to an existing bullet, check
whether an older clause in that same bullet already states the rule the new sentence adds detail to.
If so, either fold them in the same commit or explicitly flag the leftover duplication as a
phase-close note — never leave both silently, especially on a surface with narrow byte headroom. An
auditor correctly declining to fold prose it cannot confirm is drift-guard-safe is not itself a
defect, but the resulting duplicate prose is real waste on a budget-critical card and deserves an
explicit, tracked note rather than being absorbed into "faithful to the slice."

## Locate-cue (verify still present before acting)

`skills/war/SKILL.md`, `## Checkpoint` section, the "Ask ruling gate" bullet — search
`demote:ask-unruled-afk` — the two "question preserved" clauses sit in the same sentence.

## Related

[[adr-0042-eviction-replacement-pointer-bytes-outrun-plan-arithmetic]] (archived) — the general rule
that a budgeted surface's plan-projected headroom is optimistic; this instance shows fix-round prose
additions, not just eviction pointer lines, are another way headroom gets consumed faster than a
plan's arithmetic assumes.
