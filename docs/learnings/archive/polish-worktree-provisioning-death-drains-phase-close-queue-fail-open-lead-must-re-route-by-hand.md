---
name: polish-worktree-provisioning-death-drains-phase-close-queue-fail-open-lead-must-re-route-by-hand
description: "When the phase-close polish dies (provision step, worker, or never convened), the fail-open sweep dumps the whole absorb queue unfixed, and the Lead must re-triage it by hand"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: polish-worktree-provisioning-death-drains-phase-close-queue-fail-open-lead-must-re-route-by-hand
  phase: "realized-absorb-rate/phase-1 (landed dev/2026-08-19-realized-absorb-rate, tip 291943e)"
  keywords: 
    - polish-worktree provisioning
    - phase-close coherence sweep
    - fail-open absorb demotion
    - env-died provisionStep
    - absorb to follow-up demotion
    - Lead manual re-triage
    - fold-in next phase task slice
    - issue clustering
    - audit-finding-stale-by-land-time
    - session usage limit
    - polish worker dispatch death
    - recurrence phase 2
    - worker returned no result
    - entire phase absorb backlog orphaned
    - no dedicated polish task in build order
    - final post-merge gate-audit finding unfixed
  tags: 
    - war
    - phase-close
    - process
    - audit-findings
    - land
  created: 2026-08-20
  originSessionId: d1c9bd01-e7da-46af-a12d-d59dbd7a69d1
  modified: 2026-08-20T13:50:01.360Z
---

# A dead polish-worktree PROVISION dispatch fail-opens the whole phase-close queue — the Lead, not the engine, must re-route the orphaned findings

**The fact:** when the phase-close polish never runs, the fail-open coherence sweep drains its
whole queue with zero fix commits. Every queued `absorb` finding is demoted to `follow-up`,
unfixed, in one flat, untriaged dump. Sorting that dump is a Lead duty.

**Found (code-verified, realized-absorb-rate phase 1):** the Workflow died on a session usage
limit at its final dispatches, including the phase-close polish-worktree PROVISION step. That
dispatch site is an unwrapped HARD gap (see
[[env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return]]
— `provisionStep`'s `agent()` call has no `dispatchAgent` wrapping). Because the polish worktree
never got provisioned, the sweep (an intentionally **fail-open** polish of `absorb`-disposition
findings) demoted all **12** queued `absorb` findings straight to `follow-up`. Fail-open is the
deliberate design, so a dead polish never blocks Land. But the demotion carries no triage: at that
point "genuinely deferrable", "stale by land time", and "should fold into planned follow-on work"
look the same.

**Recurrence (phase 2 of the same plan):** the sweep died on the usage limit again, this time at
the polish *worker* dispatches, after the worktree was provisioned. Same class, different dispatch
site. A death anywhere in the phase-close polish sequence drains fail-open. Treat this as a
standing risk for any phase-close pass near a session's usage ceiling: budget its dispatches with
headroom, or expect to re-triage.

## Sub-shape: the polish never convenes

The terminal polish worker can return no result, or no polish task exists at all, so the final
gate-audit's `phaseClose: true` finding has no drain. Either way the whole absorb backlog ships
unfixed, not just the polish diff's own findings. Both instances come from the audit log:

- references-pointer-integrity phase 1: the `p1-polish` entry reads `verdict: polish-discarded`,
  `blocked: "worker returned no result"`. Over a dozen `absorb, phaseClose: true` findings from
  tasks 1.1, 1.2, and 1.5 never had a chance to land. Treat this `blocked` value as worse than a
  benign `sweepWhy` like "no findings queued".
- realized-absorb-rate phase 3: the build order had no `*-polish` task. The
  `phase-3-integrated-tip` gate-audit raised a Minor `absorb, phaseClose: true` finding on ADR
  0025's Status line, and it shipped unfixed. A phase with no `*-polish` task is itself a signal
  to check every `phaseClose: true` finding by hand.

## How to apply: re-triage by hand

The pattern that worked, done by the Lead after the fact:

1. Drop findings that are stale by land time. Re-verify each claim at the actual integrated tip,
   per [[audit-log-finding-can-be-stale-by-land-time]]: one claim read false at the audit's own pin
   but true once a later task had landed.
2. Fold same-file findings into the next phase's already-planned task slice when that task touches
   the same files. This is cheaper than a standalone issue.
3. Consolidate findings that share a theme into one issue.
4. Cluster findings that share one root mechanism into a few issues, plus a corroborating comment
   on an existing issue, instead of one issue per finding.

This dedup and routing is not something the engine does or should do. It is a standing Lead duty
whenever a polish or coherence-sweep pass empties without fixing.

**Locate-cue (verify still present before acting):** the phase-close coherence sweep description
in `skills/war/SKILL.md`/`skills/war/references/` (fail-open polish of `absorb` findings);
`provisionStep` in `skills/war/assets/workflow-template.js` (still unwrapped by `dispatchAgent` at
time of writing).

## Related

[[phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings]] — the sibling
failure family (a *landed* polish gets reverted and orphans a subset of its fixes); this lesson is
the *provisioning-never-happened* variant, where nothing lands at all and 100% of the queue is
orphaned, not a subset.
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] — the general "no
further round to drain this" hazard this instance also exhibits.
[[never-follow-resumefromrunid-hint-after-a-land-failure]] — how to recover the land dispatch when
the same usage-limit death also hits Land.

> archived 2026-08-30: resolved — moved to archive
