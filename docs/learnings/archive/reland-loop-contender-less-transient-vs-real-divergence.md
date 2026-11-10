---
name: reland-loop-contender-less-transient-vs-real-divergence
description: "Before a final land_stale, rev-list the attempted merge SHA against fresh origin: right-count 0 earns one extra push beyond roundLimit, nonzero stops at once"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - reland loop
    - land_stale
    - rev-list left-right
    - CAS retry
    - roundLimit
    - transient vs divergence
    - contender commits
    - push-first
    - war-refiner
  provenance: agent-unverified
  slug: reland-loop-contender-less-transient-vs-real-divergence
  phase: land-path-integrity-and-status-enum-discipline/t1.2
  tags: 
    - land-path
    - refiner
    - workflow-template
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

When a push-first CAS land attempt fails on the **final** round-limit exhaustion, don't collapse straight to `status:"land_stale"` — first discriminate a contender-less transient (the push failed but nobody actually landed new commits) from a real divergence (someone else's commits are genuinely on origin now). Do it by fetching fresh and running `git rev-list --left-right --count <merge-sha>...origin/<working>`, where `<merge-sha>` is the merge commit **this attempt just tried to push** — never the local working-branch follower ref, which is exactly the ref this land flow already knows can lag (see [[land-local-follower-ref-can-lag-sync-before-next-phase]]).

- Right-count `0` (origin has nothing beyond what you tried to push) ⇒ contender-less transient ⇒ spend exactly **one** extra push-first attempt beyond `roundLimit`, then `land_stale` if that also fails.
- Right-count nonzero (real contender commits sitting on origin) ⇒ `status:"land_stale"` immediately — no wasted retry.

The discrimination, including the "+1 beyond roundLimit" budget, lives on both the standing and the dispatched land surfaces; keep them in step per [[standing-instruction-vs-dispatched-prompt-coverage-split]].

**Why:** a bare `roundLimit` exhaustion treats a lost race (someone else's merge landed first, genuine divergence) identically to a flaky push against an otherwise-quiet remote — the latter deserves one more shot before giving up, the former should stop immediately rather than burn a retry that can't succeed.

**Verification note:** sourced from this phase's Commander's Intent + gate-audit rationale (criteria 2/10); not independently re-Grep-verified in this write — my checkout was on a branch (`claude/memory-frictions-roadmap-26a40e`) that predates this phase's landed changes on `dev/2026-07-08-land-path-integrity-and-status-enum-discipline`. Absence-note: verify `git rev-list --left-right --count` is present in `skills/war/assets/workflow-template.js`'s land/reland flow and in `skills/war/references/refiner-recovery.md` before relying on this — as of Task 4.1 the card carries only a trigger pointer, so grepping `agents/war-refiner.md` for it returns nothing and is **not** evidence of a missing mirror.

Related: [[land-local-follower-ref-can-lag-sync-before-next-phase]], [[phase-land-stale-spurious-cas-recovery]], [[land-advance-push-first-cas-rejected-token]].

> archived 2026-08-30: resolved — moved to archive
