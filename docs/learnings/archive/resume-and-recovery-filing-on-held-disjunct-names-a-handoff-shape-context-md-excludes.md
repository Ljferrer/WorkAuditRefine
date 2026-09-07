---
name: resume-and-recovery-filing-on-held-disjunct-names-a-handoff-shape-context-md-excludes
description: "Two prose surfaces describing one engine emission set can disagree; grep the sibling surface before adding a doc bullet."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - resume-and-recovery.md
    - CONTEXT.md
    - Clean handoff
    - held:land-failed
    - filing-on-held
    - handoff block emission set
    - cross-surface contradiction
    - doc cascade
    - glossary row
    - unfiled-followups
  provenance: code-verified
  slug: resume-and-recovery-filing-on-held-disjunct-names-a-handoff-shape-context-md-excludes
  phase: 2026-08-25-engine-reliability-and-filing-fidelity/phase-6 (task 6.3)
  tags: 
    - war
    - doc-cascade
    - plan-faithfulness
    - gotcha
  created: 2026-08-26
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-26T20:33:19.284Z
---

# Two doctrine surfaces can disagree about which land decisions emit a `handoff` block

**Rule:** when a doc-only task adds a bullet that describes an engine emission set, grep the other
prose surfaces that enumerate the same set before landing it. Nothing mechanical forces two
independent descriptions of one code path to agree.

**The instance:** `skills/war/references/resume-and-recovery.md`'s filing-on-held bullet said that
on `held:land-failed` the filing dispatch still runs "or the `handoff` carries an explicit
unfiled-followups block". `CONTEXT.md`'s **Clean handoff** glossary row at that time said the
`handoff` block is emitted only on `landed` and `held:escalation`. The bullet was faithful to its
plan slice, yet pointed a recovering Lead at an artifact the canonical doc said never exists on
that path. Graded Minor/`follow-up`, mitigated by the bullet's own "check which shape occurred"
instruction.

**Fixed in #1983 (commit 8339bda):** `CONTEXT.md`'s Clean handoff row now names `landed`,
`held:escalation` and `held:land-failed`. The two surfaces agree. `skill-doc-contracts.test.mjs`
pins the `held:land-failed` bullet.

**How to apply:** the reconciling fix belongs to whichever surface is wrong. If `CONTEXT.md` is
the one that moves, land it in the same commit as the matching drift-guard row. See also
[[default-flip-must-audit-all-doc-surfaces]] for the general sibling-surface sweep.

**Locate-cue:** the "Segmented land (in-band marker) and filing-on-held" bullet in
`resume-and-recovery.md`; the **Clean handoff** glossary entry in `CONTEXT.md`.

> archived 2026-09-04: resolved — moved to archive
