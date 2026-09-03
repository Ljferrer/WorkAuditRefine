---
name: plan-land-time-numbered-placeholder-needs-an-owning-task-or-it-recurs-unresolved
description: "A plan's land-time-numbered placeholder path needs an owning task, and the artifact file must be verified to exist at land."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - 00NN placeholder
    - land-time-numbered
    - ADR resolve
    - docs/adr
    - plan authoring
    - next free number
    - git mv
    - unowned cascade
    - phase-close polish
    - A5
    - owning task never ran
    - engine bug blocks placeholder resolution
    - artifact entirely missing not just misnamed
  provenance: agent-unverified
  slug: plan-land-time-numbered-placeholder-needs-an-owning-task-or-it-recurs-unresolved
  phase: "2026-08-25-engine-reliability-and-filing-fidelity/2.3; addendum 2026-08-30-engine-concurrency-and-pin-transfer/phase-2 task 2.2"
  tags: 
    - war
    - plan-authoring
    - gotcha
    - process
  created: 2026-08-26
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-30T14:50:40.048Z
---

# A plan's land-time-numbered placeholder (e.g. `docs/adr/00NN-...`) needs an owning task, and the file must be checked at land

**Status:** both observed instances are closed. `docs/adr/0048-budget-maintenance-authority.md`
and `docs/adr/0049-pin-transfer-and-proportional-re-audit.md` exist; no `00NN-*` file remains.
Recurrences: 1 (a sharper sub-mode, below).

**The pattern:** a merged plan that tells a worker to mint an artifact at a land-time-numbered
placeholder path (this repo's sequential `docs/adr/NNNN-*.md` convention) relies on some later
step to resolve the placeholder to the next free number. If no task's `Files:` slice or End
state names the resolve-and-rename step, there is no forcing function. Each task's audit judges
the placeholder as faithful to the plan literal, so the gap passes audit rounds as a Minor,
`follow-up`, or `absorb, phaseClose: true` note, and nothing resolves it until a terminal
phase-close round happens to pick it up. The first instance surfaced as unresolved in three
audit passes of one phase before a fix landed.

**Sharper sub-mode (recurrence):** the second plan did name an explicit owning task, as this
lesson recommends, and it was still not enough. That task's branch never received a commit
because an unrelated engine bug (the `preMerged` derive-and-skip vacuous-ancestor defect, see
[[zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged]])
marked the never-dispatched task as pre-merged. No placeholder file existed to rename at all.

**Why it matters:** an ADR shipped at `00NN-*.md` breaks the `ls docs/adr/` sequential-numbering
convention `CLAUDE.md` names as how a future author finds the current head.

**How to apply:**
- Plan authoring and red-team review: when a slice names a land-time-numbered placeholder path,
  make sure some task's `Files:` or End state in the same plan owns resolving it, either as a
  checklist item on the phase-close task or as a trailing micro-task with a `git mv` plus
  next-free-number End state.
- Naming an owner is necessary but not sufficient. A servitor or Lead verifying an ADR
  placeholder End state must confirm the artifact FILE exists, not just that a task owned it.
- If recurring, run `ls docs/adr/` and look for any `00NN-*` or non-sequential filename before
  trusting the plan's placeholder-resolution prose.

Related: [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] (an
`absorb, phaseClose: true` finding on a terminal round's own diff has nowhere left to land).
