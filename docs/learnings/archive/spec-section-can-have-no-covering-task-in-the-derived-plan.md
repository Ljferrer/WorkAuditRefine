---
name: spec-section-can-have-no-covering-task-in-the-derived-plan
description: "A spec section can have no covering task in the derived plan while the plan stays consistent with its own intent, so check spec-to-plan coverage at conversion or red-team"
metadata:
  type: project
  provenance: agent-unverified
  slug: spec-section-can-have-no-covering-task-in-the-derived-plan
  phase: survey-corps-memory-mining/t1
  keywords:
    - spec coverage gap
    - CONTEXT.md glossary
    - ubiquitous language
    - design spec section
    - war-strategy conversion
    - plan slice omission
    - Commander's Intent End state
    - spec section 6
  tags:
    - war
    - plan-faithfulness
    - spec-to-plan
    - red-team
  created: 2026-07-12
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# A whole spec section can have no covering task at all — internally-consistent-with-intent doesn't mean spec-complete

**Instance:** a design spec's §6 listed two new ubiquitous-language terms (`Memory mining`,
`memory-mined`) to add to `CONTEXT.md` (the repo glossary per `CLAUDE.md`). No task in the derived
plan touched `CONTEXT.md` at all. The plan was internally consistent with its own Commander's Intent,
which never mentioned `CONTEXT.md`, so the auditor ruled it not a task defect (`note`). The gap is
between the **spec** and the **plan**, not between the plan and any one task.

**Why this gap is structurally invisible to the plan's own faithfulness machinery:** a plan-vs-code
faithfulness check (an auditor, a drift guard, `/red-team`'s claims-vs-reality pass) verifies the
plan's own `Files:`/`Plan slice:` promises against delivered code — it has no reason to re-open the
*source spec* and diff its section list against the plan's task list, because the plan is the thing
being graded, not the spec. A spec section can therefore be silently dropped during the spec→plan
conversion (`/war-strategy`'s job) and every downstream check — worker, auditor, gate-audit — passes
cleanly, because each one is checking the plan against itself or against the code, never the plan
against the spec it claims to implement.

**The generalizable pattern:** when a design spec enumerates concrete deliverables in a section
that reads like a checklist (a glossary/`CONTEXT.md` addition list, a "surface changes" table, a
migration checklist), verify during `/war-strategy` conversion — or during `/red-team` review, which
already greps the plan's source-spec line per `CLAUDE.md`'s "Known traps" — that every such
line item maps to at least one task, not just that every task maps back to *some* spec content.
Coverage checking in the spec→plan direction is a distinct pass from checking task-faithfulness in
the plan→code direction, and only the latter is what most of the pipeline's automated gates
actually run.

Related: [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]].

> archived 2026-07-12: resolved — moved to archive
