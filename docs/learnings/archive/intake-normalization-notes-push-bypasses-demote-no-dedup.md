---
name: intake-normalization-notes-push-bypasses-demote-no-dedup
description: "normalizeSeat's empty-content demotion hand-rolls notes.push and its own ASK REFUSAL check instead of routing through demote(), and the push carries no content-key dedup"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - normalizeSeat
    - notes.push
    - demote
    - askShaped
    - ASK REFUSAL
    - intake normalization
    - PIN-6
    - dedup
    - filedKeys
    - remintKey
  provenance: code-verified
  slug: intake-normalization-notes-push-bypasses-demote-no-dedup
  phase: 2026-09-06-engine-and-audit-verdict-integrity/phase-2 (Task 2.1)
  tags: 
    - engine-design
    - workflow-template
    - audit-findings
    - architecture-debt
  created: 2026-09-07
  originSessionId: a2a576b1-d8af-4c79-ad1a-af3d3e5c5c91
  modified: 2026-09-07T14:41:24.713Z
---

# Intake demotion's notes.push bypasses demote() and carries no dedup

## What

`skills/war/assets/workflow-template.js`'s `normalizeSeat` (PIN-6, D2, verdict-integrity — landed
phase `2026-09-06-engine-and-audit-verdict-integrity` Task 2.1, tip
`1a30b56ecda78e7ccf829e947c54df95b3128f7c`) demotes an empty-content finding (no title, no
`contentTextOf` content, not ask-shaped, no `scopeBreach`, no `plan_ref`) straight into `notes` at
intake, once per finding per audit round:

```
notes.push({ ...f, task: taskId, seat: seat.seat, title: '(untitled: empty-content finding demoted at intake)', originalSeverity: f.severity, severity: 'Nit', demoteReason: 'intake:empty-content' })
```

Verified live at the landed tip (`skills/war/assets/workflow-template.js`, `normalizeSeat`, the
`notes.push` call inside its findings loop — 2026-09-07).

Two design choices, both deliberate, both flagged (Nit, disposition `note`, no fix) by four
different auditor lenses on the same task:

1. **No content-key dedup.** `filedKeys`/`queuedKeys` dedup follow-up and absorb rows via
   `remintKey`; this push does not. Neither does `demote(f, 'note', ...)`: its registry consult
   sits inside `if (to !== 'note')`, so note rows get no dedup on either path. `normalizeSeat` runs at `auditRound`'s collection site,
   which fires every round (initial panel, rebuttal, every re-audit/fix round, `run.roundLimit` = 6). A
   seat repeating the same empty-content finding across rounds accrues one duplicate note per
   round — up to 7 identical `{ task, title }` rows in the handoff `notes` projection and the
   servitor feed. Nothing routes on `notes`, so no fate is decided wrongly; the cost is report
   noise only.
2. **Bypasses `demote()`.** `demote()` declares itself the one terminal-disposition ladder into
   `notes`/`minorsFiled`, including its own unconditional ASK REFUSAL (`f.disposition === 'ask'`
   → `parkAsk`, never demoted). `normalizeSeat` instead hand-rolls a second, narrower predicate,
   `askShaped = f => (f.severity === 'Minor' || f.severity === 'Nit') && f.disposition === 'ask'`,
   to decide the same "this is really an ask, don't demote it" question. One invariant now has two
   enforcement sites with different scope (severity-restricted vs unconditional). Routing through `demote()`
   instead would change behavior on a blocking-severity row carrying only `disposition: 'ask'` (`demote()` parks it; the current arm demotes it by
   design, per the PIN-6 block comment).

## Why durable

Both properties are load-bearing design choices documented in the surrounding block comment, not
oversights — but a future worker adding a new intake-adjacent routing sink, or extending
`demote()`'s reason namespace, needs to know `notes.push` here is an intentional exception to the
single-ladder-through-`demote()` convention, not a bug to "fix" in isolation.

## How to apply

Do not assume every `notes` write goes through `demote()` or is deduped by `remintKey`. No note
row is deduped. `judgeHeldRow` and the routers' `d === 'note'` arms push a row already judged a
note straight onto `notes`. `normalizeSeat`'s notes arm is the one site that demotes a row into
`notes` outside `demote()`. If duplicate note rows across rounds ever become a real problem (not
just report noise), key the push on a `Set` of `taskId + '\u0000' + remintKey(f)` and skip a repeat, per the
audit finding's own suggested fix, while keeping the per-round log line unchanged.

## Related

[[dedup-registry-must-cover-every-queue-producer-and-every-resolver-consumer]] — a sibling class
of dedup-registry incompleteness in the same file, different registry (`queuedKeys`).

[[intake-normalization-plan-ref-spare-is-global-roster-residual]] — another documented PIN-6
residual landed in the same task.

> archived 2026-10-30: resolved — moved to archive
