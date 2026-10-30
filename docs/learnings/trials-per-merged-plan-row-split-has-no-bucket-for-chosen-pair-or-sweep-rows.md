---
name: trials-per-merged-plan-row-split-has-no-bucket-for-chosen-pair-or-sweep-rows
description: "war-review's settled, inconclusive, infra-failed, declined split omits chosen pair rows and sweep rows"
metadata:
  node_type: memory
  type: project
  keywords:
    - trials per merged plan
    - war-review
    - TRIAL row
    - settled inconclusive infra-failed declined
    - pair beat chosen
    - sweep row
    - outcome split
    - ask finding
    - unruled
  provenance: code-verified
  slug: trials-per-merged-plan-row-split-has-no-bucket-for-chosen-pair-or-sweep-rows
  phase: 2026-10-26-interview-fork-trials-and-pair-beats/phase-1 (task 1.5)
  tags:
    - war
    - war-review
    - fork-trials
    - plan-mismatch
    - telemetry
  created: 2026-10-26
  originSessionId: a0630eb5-4cbe-4285-9e36-47dec6a15717
  modified: 2026-10-27T02:35:41.122Z
---

# The `trials per merged plan` row has no bucket for a chosen pair row or a sweep row

**Live gap at the landed tip.** `skills/war-review/SKILL.md`, in the plan-scoped telemetry table, has
a row `trials per merged plan`. It reports the `TRIAL-<n>` row count and a split: settled, inconclusive,
infra-failed, declined. A pair row that records `pair declined:` counts as declined.

**Why the split leaks.** `skills/war-strategy/references/fork-trials.md` gives the outcomes settled,
inconclusive and infra-failed to fact trials only. A pair row carries `chosen:`, `rejected:` and
`grafts:`. A sweep row carries per-check red or green results. The doctrine's own reporting line splits
by kind: `trials: <n> (fact <a> / pair <b> / sweep <c>)`.

**The consequence.** A pair beat the operator chose, and every `TRIAL-<n> · sweep` row, land in no
bucket. The sweep row is part of every interview (Stage 4 of `plan-interview.md`). The row count
therefore differs from the sum of its split on any plan that ran the doctrine. The table head forbids
fabricated numbers, so a reviewer cannot invent a bucket.

**Where the plan went wrong.** The plan slice for task 1.5 fixed the four-way split as a literal. It
assumed every trial row ends in one of four outcomes. The audit at the 1.5 pin raised the gap as
`ask` (Minor). No default exists for `ask`, so it stayed unruled at land. It was then filed as open issue #2452
(`demote:ask-unruled-afk`), which awaits an operator ruling.

**The two options the auditor named.**

- Fold a chosen pair row into settled and add a separate sweep bucket. The split grows past the plan's
  four literals.
- Keep the four-way split over fact and pair rows, and report the sweep count beside it.

**How to apply.** Before you edit the row, look for an operator ruling on #2452. If there
is none, ask. Do not pick a bucket on your own. Keep the label `trials per merged plan` and the literal
`**Trials run**`, because the pipeline pins grep them.

**Locate-cue (verify still present before acting).** `skills/war-review/SKILL.md`, search
`| trials per merged plan |`. `skills/war-strategy/references/fork-trials.md`, search `## The sweep row`
and `## Grandfather and reporting`. Grounded at the phase-1 integration tip via the run-scoped
`_refinery` worktree (rung 2).
