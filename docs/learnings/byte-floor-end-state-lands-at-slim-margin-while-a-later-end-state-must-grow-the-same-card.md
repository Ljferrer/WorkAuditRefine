---
name: byte-floor-end-state-lands-at-slim-margin-while-a-later-end-state-must-grow-the-same-card
description: "A plan's early card-headroom End state can land at only a few bytes above its own floor while a LATER End state in the same plan mandates growing that same card — the later task inherits the full ADR-0042 eviction-funding duty, and the early End state's check re-runs at land so a late self-fund failure breaks it too"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: byte-floor-end-state-lands-at-slim-margin-while-a-later-end-state-must-grow-the-same-card
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-1 (task 1.1, gate-audit)"
  keywords: 
    - agents/war-refiner.md
    - card headroom
    - byte ceiling
    - ADR 0042 eviction
    - PIN-3
    - End state 1 re-runs at land
    - End state 8
    - run_in_background
    - rerun from scratch
    - self-funding eviction
    - prompt-surface-budgets.test.mjs
    - cross-task budget cascade
    - cross-phase budget cascade
    - slim margin
    - 27 bytes of slack
  tags: 
    - war
    - budget
    - plan-design
    - gotcha
    - forward-risk
  created: 2026-09-07
  originSessionId: a2a576b1-d8af-4c79-ad1a-af3d3e5c5c91
  modified: 2026-09-07T11:15:00.252Z
---

# A plan's early byte-floor task can leave a later, same-plan card-growth task almost no room

**Code-verified** at landed tip `5264cae3655bff1477403b561a2e38838707689b` on
`dev/2026-09-06-engine-and-audit-verdict-integrity`, read via the `_refinery46` worktree
(`gitdir` physical path contains this plan's slug; `HEAD` byte-equals the landed tip).

## What happened

Task 1.1 of this plan evicted prose out of `agents/war-refiner.md` to satisfy End state 1: the
card must sit at least 2,048 B under its 36,864 B hard ceiling. It landed at 34,789 B — 2,075 B
of headroom, only 27 B above the floor (confirmed by the phase's own post-merge gate-audit,
`auditSha` equal to the confirmed landed tip, `gateEvidence: true`, and independently re-confirmed
here by direct Read at the same tip).

The same plan's End state 8 requires this SAME card to gain `run_in_background` and
`rerun from scratch` prose, in a later phase of this plan. PIN-3 forbids a worker raising a card's
ceiling — a growing task must fund itself with its own byte-identical ADR-0042 eviction,
registered in the same task. Confirmed at this phase's landed tip: `agents/war-refiner.md`
contains neither `run_in_background` nor `rerun from scratch` yet, so End state 8 has not landed
as of phase 1 — the funding duty is still pending, live, forward-facing risk for whichever later
phase implements it.

**The trap is not just "thin margin," it is that End state 1's own check re-runs at the land
barrier.** The plan's End state 1 condition is checked again at land time (per its own wording,
"and every reference destination is qualified"), so a later phase that adds
`run_in_background`/`rerun from scratch` bytes to `agents/war-refiner.md` WITHOUT its own
same-task eviction does not just erode a margin — it REDS End state 1's re-check for the whole
plan, not only the later phase's own new End state.

## The durable rule

When a plan phase's card-headroom floor task lands with only single-digit-to-low-double-digit
bytes of slack above its own numeric floor, and a LATER End state in the same plan names that
same card as a growth target, treat the funding duty as inherited, not implicit: the later task's
plan slice or the phase's provisioning step should explicitly budget an ADR-0042 eviction
alongside the new prose, sized against the ACTUAL landed-tip byte count (not the plan's
originally-estimated arithmetic — see [[adr-0042-eviction-replacement-pointer-bytes-outrun-plan-arithmetic]]),
before the growth task is dispatched. A Lead or servitor reviewing a multi-phase plan's build
order should flag this cascade at plan-authoring time, not rediscover it when the later phase's
gate reds.

## Locate-cue (verify still present before acting)

`agents/war-refiner.md` — grep for `run_in_background` and `rerun from scratch` (both absent as
of phase 1 land); `skills/war/assets/prompt-surface-budgets.test.mjs` for the card's hard ceiling
(36,864 B) and the End-state-1 floor arithmetic; the plan's own End state 1 and End state 8 rows
in `docs/plans/2026-09-06-engine-and-audit-verdict-integrity.md`.

## Related

[[adr-0042-eviction-replacement-pointer-bytes-outrun-plan-arithmetic]] — the sibling rule that a
plan's byte arithmetic for an eviction is an estimate, not a guarantee; this lesson adds the
cross-task/cross-phase funding-duty angle on top of that estimate risk.
