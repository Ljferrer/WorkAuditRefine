---
name: plan-land-time-numbered-placeholder-needs-an-owning-task-or-it-recurs-unresolved
description: "A merged plan that mints a new artifact at a land-time-numbered placeholder path (e.g. docs/adr/00NN-<slug>.md, 'resolved to the next free number at land time') can ship with the placeholder unresolved when no task/End-state in the plan explicitly owns the resolve-and-rename step — the gap recurred across multiple audit passes of the same phase in one observed run before finally being fixed at the terminal phase-close round, illustrating that a placeholder with no explicit owner is a recurring risk, not a one-off slip"
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
  provenance: agent-unverified
  slug: plan-land-time-numbered-placeholder-needs-an-owning-task-or-it-recurs-unresolved
  phase: 2026-08-25-engine-reliability-and-filing-fidelity/2.3
  tags: 
    - war
    - plan-authoring
    - gotcha
    - process
  created: 2026-08-26
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-26T10:20:13.580Z
---

# A plan's land-time-numbered placeholder (e.g. `docs/adr/00NN-...`) needs an explicit owning step

**Pattern only — not a live instance.** The specific finding this pattern is drawn from (a
plan's `docs/adr/00NN-budget-maintenance-authority.md` ADR, whose Files slice said "`00NN` is a
land-time-numbered placeholder, resolved to the next free number under `docs/adr/` at land time
(A5)") was raised as unresolved across at least three separate audit passes of the same phase
(task 2.3's own audit, task 2.4's gate-audit, and the phase's post-merge
`phase-2-integrated-tip` gate-audit) before finally being fixed. Re-Grepped at the landed tip
`8b1e0ea6d9db99a8042ebaf34766f8c5c7780617` (landed-tip grounding rung 2, `_refinery28` worktree
matching the plan slug with `HEAD` equal to the threaded tip): `docs/adr/0048-budget-maintenance-authority.md`
exists and `docs/adr/00NN-budget-maintenance-authority.md` does not — the placeholder WAS
resolved by land, in a fix round I could not attribute to a specific task from the audit log
alone. Per the finding-match check, this is therefore recorded as the **generic pattern**, not a
current live defect — the specific file is no longer in the unresolved state.

**The pattern:** a merged plan that instructs a worker to mint a new artifact at a
"land-time-numbered placeholder" path (common for `docs/adr/NNNN-*.md`, following this repo's
sequential-ADR-numbering convention) is relying on SOME later step to resolve that placeholder
to the real next-free number before land. If no task's `Files:`/plan slice and no End-state
explicitly names the resolve-and-rename step as deliverable, there is no forcing function —
each individual task's own audit correctly judges the placeholder as faithful-to-the-plan-literal
(not a worker deviation), so the gap can pass multiple audit rounds unflagged as a hold, and
only recurs as a `Minor`/`follow-up` or `absorb, phaseClose: true` note each time, with no task
actually resolving it until (if) a terminal phase-close/polish round happens to pick it up.

**Why it matters:** an ADR shipped at `00NN-*.md` permanently breaks the
`ls docs/adr/` sequential-numbering convention this repo's own `CLAUDE.md` names as the way a
future ADR author finds "the current head" — a real, if low-severity, doc-integrity defect if it
ships unresolved.

**Pattern to watch for (plan authoring / red-team review):** when a plan slice names a
land-time-numbered placeholder path, verify some task's `Files:`/End-state in the SAME plan (not
just prose) explicitly owns resolving it — e.g. as a checklist item on the phase's
polish/phase-close task, or as its own trailing micro-task with a `git mv` + next-free-number
check End-state. Do not rely on "it's obviously cheap, someone will notice" — this pattern's own
observed instance took three audit rounds to surface as unresolved before a fix landed, and the
sibling lesson [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]]
documents cases where an `absorb, phaseClose: true` disposition on a terminal round's own diff
has literally nowhere left to land.

**Locate-cue:** none — this is a process/plan-authoring pattern, not a live file referent. If
recurring, check `docs/adr/` for any `00NN-*` or otherwise non-sequential filename via
`ls docs/adr/` (or the plan's own Files list) before trusting a plan's placeholder-resolution
prose.
