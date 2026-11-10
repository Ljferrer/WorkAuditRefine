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

When an earlier task's code leaves an addressed "Doc mirror" comment that names a later doc task and
a correction, that comment binds the doc task over its plan slice literal. Audit the landed doc
against the comment, not only against the slice.

**Instance.** Task 13.1 (the engine change) implemented the D21/PIN-25 env-died classification and, in
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
`env-died` **soft**, naming the site." The plan's own Task 13.2 slice carries the identical
undifferentiated phrase. The doc task satisfied its slice literal exactly, which is why the header
comment's corrected instruction went unheeded. Three audit findings circled the same fact from
different angles, but no seat diffed the landed `schemas.md` prose against the `dispatchSite`
header's corrective instruction. Both tasks were approved.

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
just against the plan slice (which may itself be stale, as this one was).

Related: [[fix-round-adjudication-that-inverts-a-plan-end-state-literal-can-ship-unthreaded-back-into-the-plan]]
(same family — an in-run adjudication that corrects a plan literal but never gets threaded back
into the artifact that consumes the stale wording, so a later reader trusts the stale text).

> archived 2026-10-27: resolved — moved to archive
