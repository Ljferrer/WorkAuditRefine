---
name: audit-round-loop-checks-seat-death-before-escalate-a-co-occurring-escalate-defers-to-the-next-relaunch
description: "The audit round loop checks a dead seat before an escalating seat, so one dead seat masks a co-occurring escalate into SOFT env-died for that round"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: audit-round-loop-checks-seat-death-before-escalate-a-co-occurring-escalate-defers-to-the-next-relaunch
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-13 (Every dispatch classified, D21), task 13.1"
  keywords: 
    - env-died
    - escalate
    - audit round loop
    - auditRound
    - wave loop ordering
    - dead seat masks escalate
    - Recovery relaunch
    - dispatchAgent
    - PIN-25
    - D21
  tags: 
    - audit-pipeline
    - engine
    - concurrency
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-09T02:58:00.801Z
---

# A dead audit seat checked before the escalate check can mask a co-occurring escalate into SOFT `env-died`

**Context (code-verified at landed tip `891bbc7a5da617332d404d6088f2bcf80c9fded5`,
`dev/2026-09-06-engine-and-audit-verdict-integrity`, `skills/war/assets/workflow-template.js`
around line 3724-3731, read via the `_refinery` worktree whose HEAD equals that tip):** the
audit round loop reads in this order:

```js
if (died) { verdict = 'env-died'; blocked = died; break }
if (seats.length < expected) { verdict = 'audit-blocked'; break }
if (seats.some(s => s.verdict === 'escalate')) { escalateReason = escalateReasonOf(seats); verdict = 'escalate'; break }
if (allApprove(seats, expected)) { verdict = 'approve'; break }
```

`died` (D21/PIN-25's per-seat dispatch death classification) is checked **first**, ahead of the
escalate check. If one seat in a round dies post-spawn (harness/API death) while a **different**
seat in the same round independently returned `verdict: 'escalate'`, the round breaks on the
`died` branch — the task classifies `env-died` SOFT for that round, and the phase lands minus the
task. The surviving seat's escalate is not lost (its finding rides the `auditLog` row under
`verdict: 'env-died'`), but it does not surface as an `escalate` outcome until the task is
retried via the Recovery relaunch.

**Why this is intentional, not a bug:** the plan slice requires "a dead seat never reads as
audit-blocked" (and, by the same logic, never as any other HARD content verdict) — checking
`died` first is what makes that guarantee unconditional. The pre-change code already had the
shortfall check ahead of the escalate check, so a dead seat already masked an escalate into HARD
`audit-blocked` before this phase; this phase changed the outcome class (SOFT `env-died` instead
of HARD `audit-blocked`) without changing the ordering hazard itself.

**How to apply:** when auditing or extending the wave audit round loop, remember that `died` is
checked before every content-verdict branch. A round with one dead seat and one otherwise-blocking
seat (Major/Critical/escalate) always classifies by the death, not the content — the content
verdict only surfaces on a clean re-run. Do not assume a `env-died` classification means "no other
seat had anything to say" — check the `auditLog` row's surviving-seat findings before treating the
task as a clean retry candidate.
