---
name: each-commit-cites-its-issue-endstates-are-judged-over-the-full-phase-range-not-gated-per-commit
description: "A plan End state phrased 'each landing commit cites its issue(s)' cannot be a gate: member (the <phase-base>..<tip> range it needs doesn't exist at any task's pre-merge gate — it first exists post-merge) and is judged by the post-merge execution-evidence seat via a range-level `git log --grep=<issue>` over the whole phase, not a per-commit literal check. A phase-close/polish commit that cites no issue at all is therefore still condition-compliant as long as some commit in the range cites it — do not read the End state as a per-commit mandate."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: each-commit-cites-its-issue-endstates-are-judged-over-the-full-phase-range-not-gated-per-commit
  phase: "red-team-gate-cli/1 (End state 10, red-team round 1 R6), landed dev/2026-08-06-red-team-gate-cli @ 765d00f378fc6a6bc04f23ec5b747ab11062aee7"
  keywords: 
    - end state
    - judged not gate
    - issue citation
    - git log --grep
    - phase range
    - execution-evidence seat
    - gate-audit
    - phase-close commit
    - per-commit vs range-level
  tags: 
    - war
    - gate-audit
    - plan-authoring
    - process-pattern
  created: 2026-08-14
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-15T00:54:16.974Z
---

# "Each commit cites its issue(s)" End states are judged over the whole phase range, not gated per commit

## The pattern

A merged plan's End-state clause like "each landing commit cites its issue(s)" reads like a
per-commit rule, but it cannot be evaluated by any *gate:*-tagged check — the `<phase-base>..<tip>`
range the condition needs does not exist at the moment any individual task is gated (a task's gate
runs at its own pinned SHA, before the serial merge that produces the range). The condition first
becomes observable **post-merge**, which is exactly where the post-merge gate-audit's
execution-evidence seat reads it: via a `git log --grep=<issue>` (or equivalent) over the full
`<phase-base>..<tip>` range, checking that *some* commit in the range carries each required issue
number — not that *every* commit does.

## Consequence: a phase-close/absorb/polish commit need not itself cite an issue

Concretely, in red-team-gate-cli/phase-1 the phase-close polish commit `062386e` ("test(red-team-gate):
pin D3's before-the-read placement with a nonexistent-path arm") cites no issue at all, while its
siblings in the same range (`17eb083`, `e5ce8a2`, `e0fd31c`) each cite the plan's tracked issues
(#1366, and #1378 + #1347 + #1366 respectively). End state 10 ("each landing commit cites its
issue(s) — #1366 for Task 1.1; #1378 + #1347 + #1366 for Task 1.2") enumerates only the two plan
*tasks*, not the phase-close commit, and a range-level `git log --grep` over the whole phase still
finds every required issue — so the condition is met as worded, and the polish commit's silence is
not a defect.

## How to apply

- When authoring or auditing a plan's "commits cite issue(s)" End state, check whether the
  condition is `check:`/`gate:`-tagged (decidable at a single pinned SHA) or must be `judged`
  (needs a range that only exists post-merge). A range comparing two commits/branches almost always
  belongs to the judged/execution-evidence seat, never a per-task gate member.
- When writing a phase-close/absorb/polish commit, do not feel obligated to append a `Refs #NNNN`
  unless the plan's End state explicitly enumerates that commit (or "every commit in the phase") as
  a citation target — re-read the condition's literal scope before adding or flagging a citation.
- When auditing, resolve a "does this commit cite its issue" concern by running the range-level
  `git log --grep` yourself before flagging a missing per-commit citation as a defect.

Related: [[verify-stacked-plan-facts-at-campaign-base-not-lead-worktree]] (a different range/base
mismatch class — verifying facts at the wrong base rather than the wrong grain).
