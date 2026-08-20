---
name: polish-worktree-provisioning-death-drains-phase-close-queue-fail-open-lead-must-re-route-by-hand
description: "When the phase-close polish worktree's PROVISION dispatch itself dies (not the polish worker), the fail-open coherence sweep demotes every queued absorb-disposition finding to follow-up with zero fixes applied — the Lead must manually re-triage the demoted set (drop stale-by-land-time, fold same-file findings into a later phase's task slice, cluster the rest into issues/comments) rather than treat the demotion as itself resolving anything"
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
    - held:land-failed
    - env-died provisionStep
    - absorb to follow-up demotion
    - Lead manual re-triage
    - fold-in next phase task slice
    - issue clustering
    - audit-finding-stale-by-land-time
  tags: 
    - war
    - phase-close
    - process
    - audit-findings
    - land
  created: 2026-08-20
  originSessionId: d1c9bd01-e7da-46af-a12d-d59dbd7a69d1
  modified: 2026-08-20T08:53:00.173Z
---

# A dead polish-worktree PROVISION dispatch fail-opens the whole phase-close queue — the Lead, not the engine, must re-route the orphaned findings

**Found (code-verified — landed tip `291943e` on `dev/2026-08-19-realized-absorb-rate`, phase 1):**
this phase's Workflow died on a session usage limit at its final three dispatches: the
integrated-tip gate-audit, the phase-close polish-worktree PROVISION step, and land. The land
dispatch death routed to `held:land-failed` (null escalation detail) and was recovered per the
existing root-cause-(c) runbook — see
[[never-follow-resumefromrunid-hint-after-a-land-failure]] (step-0 already-landed probe found the
integration tip was NOT yet an ancestor of `origin/dev`, so the correct move was a fresh
`--no-ff` merge + gate + push-first CAS, not a resume). That recovery worked exactly as documented.

**What's new here:** the PROVISION-step death is a dispatch site the existing `env-died`
classification lesson already names as an unwrapped HARD gap (see
[[env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return]]
— `provisionStep`'s `agent()` call has no `dispatchAgent` wrapping). Because the polish worktree
never got provisioned, the phase-close coherence sweep (an intentionally **fail-open** polish of
`absorb`-disposition findings, per this repo's own architecture) drained its entire queue with zero
fix commits: **12** `absorb`-disposed findings were demoted straight to `follow-up`, unfixed. This
is not a bug in the fail-open design (fail-open is the documented, deliberate choice so a dead
polish never blocks Land) — but it means the demotion event itself carries no triage: it is a flat
dump of every queued finding into `follow-up`, indistinguishable at that point between "genuinely
deferrable," "stale by land time," and "should be folded into already-planned follow-on work."

**The re-triage pattern that worked (Lead-side, by hand, after the fact):** of 12 raw follow-up
rows, the Lead (1) dropped 1 as stale-by-land-time — re-verified per
[[audit-log-finding-can-be-stale-by-land-time]] that the finding's own claim (lock-step with
`DEFAULTS.run.roundLimit`) read false at the audit's own pin but TRUE at the actual integrated tip
once a later task (1.2) had landed; (2) folded 2 same-file engine-comment findings directly into
phase 2's already-planned task 2.1 slice, since that task already touches the same files (a
next-phase fold-in lane, cheaper than a standalone issue); (3) consolidated the rest into ONE
issue for a shared theme (README narration + tour watched-surface gap); (4) clustered 7 remaining
findings sharing one root mechanism (the unwrapped-dispatch-death classification gap, same one
named above) into 5 new issues plus a single corroborating comment on an existing issue rather than
5-7 duplicate issue rows for the same root cause. Net: 19 raw finding rows (12 from this drain +
some carried context) collapsed to 6 issues + 1 comment — a roughly 3:1 reduction driven entirely by
manual clustering-by-root-cause, not by any mechanized dedup.

**Why this is durable:** any fail-open queue-drain (by design or by infra death) produces a flat,
untriaged dump. The dedup/routing work — is a finding stale, foldable into planned work, or a
duplicate of another finding's root cause — is not something the engine does or should do; it is a
standing Lead duty whenever a polish/coherence-sweep pass empties without fixing.

**Locate-cue (verify still present before acting):** the phase-close coherence sweep description in
`skills/war/SKILL.md`/`skills/war/references/` (fail-open polish of `absorb` findings); `provisionStep`
in `skills/war/assets/workflow-template.js` (still unwrapped by `dispatchAgent` at time of writing).

## Related

[[phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings]] — the sibling
failure family (a *landed* polish gets reverted and orphans a subset of its fixes); this lesson is
the *provisioning-never-happened* variant, where nothing lands at all and 100% of the queue is
orphaned, not a subset.
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] — the general "no
further round to drain this" hazard this instance also exhibits.
