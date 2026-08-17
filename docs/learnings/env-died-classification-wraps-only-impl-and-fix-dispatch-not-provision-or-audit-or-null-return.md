---
name: env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return
description: "env-died soft class (#1411) wraps only thrown impl/fix dispatches; provision, audit-seat, null return stay HARD"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return
  phase: 2026-08-06-handoff-schemas-contract/2.1
  keywords: 
    - env-died
    - dispatchAgent
    - infraDeathCause
    - SOFT_ENV_REASONS
    - null agent return
    - worker returned no result
    - provisionStep
    - audit-seat dispatch
    - HARD_ESCALATION_REASONS
    - workflow-template.js wave thunk
  tags: 
    - war
    - engine
    - workflow-template
    - escalation
    - infra-death
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T15:23:31.970Z
---

# `env-died` classification currently wraps only two of several dispatch sites

**Code-verified via gate-audit evidence, pinned `auditSha`/`gateHeadSha`
`71ddc088fb558add6d92aab1ec4ec773b9881cd8` on `dev/2026-08-06-handoff-schemas-contract` phase 2
(`gateEvidence: true`); the same residual was recorded identically by both the task-2.1 worker
audit and its post-merge gate-audit, i.e. it survived unfixed to land.** `#1411` added `env-died`
as a soft, retryable escalation reason (`SOFT_ENV_REASONS`, canonical in
`skills/war/assets/land-decision.mjs`, hand-mirrored in `skills/war/assets/workflow-template.js`)
for a post-spawn API/quota/transport death, so a phase whose only unmerged tasks are infra deaths
surfaces retryable under `--afk` instead of hard-escalating. The mechanism (`dispatchAgent`, tagging
a caught throw with `err.warDispatchDeath = true`, consumed by `infraDeathCause`) was traced end to
end inside the wave thunk and found to wrap **exactly two call sites**: the `impl` worker dispatch
and the `fix`-round dispatch.

**Three residual HARD-classification gaps, all fail-safe (louder class, no lost task) but narrowing
the practical benefit End state 29 describes:**

1. **A null (non-throwing) `agent()` return stays HARD.** The status-quo shape #1411's own cited
   incident actually had — `reason: 'escalate'` with `blocked: "worker returned no result"` — is
   produced by `blockedReason(null)`, the null-return path, which the new classification cannot
   reach at all (the code's own comment says so honestly). So the literal motivating incident this
   feature was built for still classifies HARD.
2. **`provisionStep`'s `agent()` call is unwrapped.** This is the FIRST dispatch of every task and
   the most likely one to meet a session limit, yet has no `dispatchAgent` wrapping.
3. **Audit-seat deaths go through `parallel`**, which NULLs the thunk into a dropped seat, which
   routes to `audit-blocked` (HARD) regardless of cause.

**Why this matters for future engine work:** anyone extending soft-env classification (or
debugging why a phase with an apparent infra death still hard-escalated) should check which of
these three shapes actually occurred before assuming `env-died` should have fired. The plan itself
scoped the work with the hedge "when the thunk-catch can see it" (i.e. this is a known, accepted
scope residual, not a regression) — but it is easy to mistake the current narrow coverage for the
full "post-spawn API/quota/transport death" wording in End state 29.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js` —
`dispatchAgent` (the `warDispatchDeath` tag) and `infraDeathCause`; the two wrap sites are the wave
thunk's `impl` dispatch and its fix-round dispatch. `blockedReason` is the null-return path that
`dispatchAgent` cannot reach.

**Related:** [[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]] (the `parallel`/null
mechanics this residual rides on); [[shared-status-enum-widening-silently-widens-land-path]] (the
general hazard class of a shared status enum gaining a new value with uneven call-site coverage).
