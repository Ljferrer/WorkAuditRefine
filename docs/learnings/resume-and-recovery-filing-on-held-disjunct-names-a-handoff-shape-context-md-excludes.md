---
name: resume-and-recovery-filing-on-held-disjunct-names-a-handoff-shape-context-md-excludes
description: "skills/war/references/resume-and-recovery.md's filing-on-held bullet says on held:land-failed 'the follow-up filing dispatch still runs — or the handoff carries an explicit unfiled-followups block the Lead executes'; CONTEXT.md's canonical 'Clean handoff' glossary row states the handoff block is emitted only on landed and held:escalation — held:land-failed is not in that set, so the second disjunct points a recovering Lead at an artifact the engine (as documented) never produces on that path"
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

**Code-verified** at landed tip `513161f8083c18f4b582f139ec4162c0e95d1116` on
`dev/2026-08-25-engine-reliability-and-filing-fidelity` (landed-tip grounding rung 2 — the
`_refinery28` worktree's `HEAD` equals the threaded tip; physical gitdir path
`<repo-root>/.claude/war-worktrees/2026-08-25-engine-reliability-and-filing-fidelity-2026-08-26/_refinery/`).

Phase 6 Task 3 added a bullet to `skills/war/references/resume-and-recovery.md` (line 42)
documenting the filing-on-held behavior Task 6.1 (b) implements:

> "(2) **Filing-on-held:** on `held:land-failed`, the follow-up **filing dispatch still runs** —
> or the `handoff` carries an explicit unfiled-followups block the Lead executes — never silently
> unrun."

The second disjunct ("or the `handoff` carries…") is verbatim-faithful to Task 6.1's own plan
slice text, so it is not a worker error. But `CONTEXT.md`'s canonical **Clean handoff** glossary
row (line 877, untouched by this diff, pinned by `skill-doc-contracts.test.mjs`'s drift-guard
rows) states the `handoff` block (`{ merged, followUps, intentPresent, backstops }`) is "emitted
on `landed` and `held:escalation`" — a **two-member** set that does not include
`held:land-failed`. So the resume-and-recovery.md bullet's second disjunct points a recovering
Lead at an artifact the engine, per its own canonical doc, never produces on the path the bullet
is describing.

**Mitigated, not harmless:** the same sentence immediately instructs the Lead to "check which of
the two shapes occurred before filing anything by hand" — so the operational failure mode is a
wasted look for a nonexistent `handoff`, not a double-file. Graded Minor/`follow-up`, not a hold.

**Why this generalizes:** when a new doc bullet is added under a task whose Files list is the doc
surface alone (no code touch), and it describes an engine emission set, the doc author has no
mechanical way to cross-check it against a DIFFERENT doc's canonical enumeration of the same set
unless they specifically grep for it — CONTEXT.md's glossary row and resume-and-recovery.md's
recovery bullet are two independent prose descriptions of the same `handoff`-emission code path,
and nothing forces them to agree. The reconciling fix belongs to whichever surface is wrong (here:
either widen CONTEXT.md's emitted set to include `held:land-failed`, or drop the handoff disjunct
from the resume-and-recovery.md bullet) — and it must land in one commit with the matching
drift-guard row if CONTEXT.md is the one that moves.

**Locate-cue (verify still present before acting):** `skills/war/references/resume-and-recovery.md`
line ~42 ("Segmented land (in-band marker) and filing-on-held" bullet, second sentence);
`CONTEXT.md` line ~877 (**Clean handoff** glossary entry, "emitted on `landed` and
`held:escalation`").
