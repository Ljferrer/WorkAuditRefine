---
name: plan-slice-literal-and-code-header-comment-can-disagree-in-the-same-phase-doc-task-copies-the-slice
description: "A doc task can copy a plan slice's literal wording verbatim even when the same phase's own engine task left an inline comment warning against exactly that wording"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: plan-slice-literal-and-code-header-comment-can-disagree-in-the-same-phase-doc-task-copies-the-slice
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-13 (Every dispatch classified, D21), tasks 13.1+13.2"
  keywords: 
    - plan slice verbatim
    - doc mirror instruction
    - header comment ignored
    - env-died
    - audit/ace/re-audit
    - dispatchAgent
    - dispatchSite
    - schemas.md
    - cross-task instruction
    - undifferentiated wording
    - audit-blind spot
    - doc-code mismatch survives audit
  tags: 
    - audit-pipeline
    - plan-faithfulness
    - documentation
    - engine
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-09T02:57:19.316Z
---

# A doc task can restate a plan slice's stale literal even when a sibling task's own code comment names the correction

**Context (code-verified at landed tip `891bbc7a5da617332d404d6088f2bcf80c9fded5`, `dev/2026-09-06-engine-and-audit-verdict-integrity`, read via the `_refinery` worktree whose HEAD equals that tip — gitdir physical path containing the plan slug: `<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/`).**

Task 13.1 (the engine change) implemented the D21/PIN-25 env-died classification and, in
`skills/war/assets/workflow-template.js` at the `dispatchSite` header comment, split the
behavior into two classes: only an **ace or re-audit** seat death demotes the current subset;
a **wave audit-round** seat death has no subset to demote, so it classifies `env-died` **SOFT**
and breaks the round loop instead. The header comment says this explicitly and addresses the
doc task by name:

> Doc mirror (schemas.md's two-sentence env-died rule, Task 13.2): the first sentence names the
> ace/re-audit arms only (a seat death demotes the current subset); the second sentence covers
> the wave roster seat death as an env-died-soft site, matching this header — never the slice
> literal's undifferentiated 'audit/ace/re-audit' wording.

Task 13.2 (the doc task, landed in the same phase, `verdict: approve`) wrote
`skills/war/references/schemas.md`'s `env-died` section anyway using the plan slice's original,
undifferentiated wording almost verbatim: "An audit/ace/re-audit seat death demotes the current
subset with the existing abandon reason and falls through; every other dispatch site classifies
`env-died` **soft**, naming the site." (`schemas.md` line 50, D3-confirmed present at the landed
tip.) The plan's own Task 13.2 slice (`docs/plans/2026-09-06-engine-and-audit-verdict-integrity.md`
line 429) carries the identical undifferentiated phrase — the doc task satisfied its plan slice
literal exactly, which is precisely why the header comment's more specific, corrected
instruction went unheeded.

**Why the audit missed it:** three separate audit findings on this phase circled the same
underlying fact from different angles — one noted the wave-seat-vs-ace-seat split as a
plan/End-state gap (task 13.1's audit), one noted the schemas.md section's sentence count
(task 13.2's audit), one noted an ordering-of-landing concern (task 13.2's audit) — but no seat
diffed the landed `schemas.md` prose word-for-word against the `dispatchSite` header's own
corrective instruction. The verdict on both tasks was `approve`.

**The pattern:** when task N's plan slice literal is stale (superseded by an adjudication made
during task N-1's implementation, e.g. a header comment that names the doc task and states the
correction), a later doc task can satisfy its own slice to the letter and still ship prose that
contradicts the very code it documents — because "match the plan slice" and "match the code" are
not the same check, and neither the doc task's own audit nor a sibling task's audit is guaranteed
to run that specific diff. A grep-token End-state check (`grep -cF 'env-died: dead audit seat'`)
also cannot catch this: the fixture name existing is orthogonal to the doc's prose being accurate.

**How to apply:** when an earlier task's implementation leaves an inline "Doc mirror" or similar
addressed comment naming a later doc task and a specific correction, treat that comment as the
binding source over the plan slice literal for that doc task — and at Checkpoint, or during that
doc task's own audit, diff the landed doc's prose against the named code comment directly, not
just against the plan slice (which may itself be stale, as this plan slice was: line 429's
"audit/ace/re-audit ... demotes the current subset" is exactly the wording the header comment
calls out as wrong).

**A third class the same End-state prose omits entirely.** Plan End state 19 reads "an
audit/ace/re-audit seat death demotes the current subset ... every other site classifies
`env-died` soft naming the site." Code-verified: a land dispatch death (`landDied`,
`skills/war/assets/workflow-template.js` around line 5510) records reason `env-died` naming the
site, matching the second half — but then sets `landDecision = 'held:land-failed'` instead of
letting the phase land minus the task. A land dispatch death cannot be "soft" the way a merge or
audit death can, because there is nothing left to land without it. Task 13.2's own slice
(`docs/plans/...` line 429) never claims to cover the land site, so the doc task is not at fault
here — but a future reader trusting End state 19's "every other site" as exhaustive would
mis-predict this one site's outcome.

Related: [[fix-round-adjudication-that-inverts-a-plan-end-state-literal-can-ship-unthreaded-back-into-the-plan]]
(same family — an in-run adjudication that corrects a plan literal but never gets threaded back
into the artifact that consumes the stale wording, so a later reader trusts the stale text).
