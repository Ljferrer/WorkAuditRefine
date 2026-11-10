---
name: env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return
description: "RESOLVED: #1411's env-died soft class once wrapped only the thrown impl and fix-round dispatches; workflow-template.js now classifies env-died SOFT at every dispatch site (D21, PIN-25), worker-site null returns included (#2555 D11), except that a land dispatch death holds held:land-failed and a TARGET_LOST/TARGET_LATE merge snapshot holds the task (#2309)"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return
  phase: 2026-08-06-handoff-schemas-contract/2.1
  keywords: 
    - env-died
    - dispatchAgent
    - dispatchSite
    - infraDeathCause
    - SOFT_ENV_REASONS
    - null agent return
    - worker returned no result
    - nullDied
    - provisionStep
    - audit-seat dispatch
    - landDied
    - held:land-failed
    - TARGET_LOST
    - TARGET_LATE
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

# RESOLVED: `env-died` is now classified at every dispatch site

`#1411` added `env-died` as a soft, retryable escalation reason (`SOFT_ENV_REASONS`, canonical in
`skills/war/assets/land-decision.mjs`, hand-mirrored in `skills/war/assets/workflow-template.js`)
for a post-spawn API/quota/transport death. The first version (`dispatchAgent` tags a caught throw
with `err.warDispatchDeath = true`, `infraDeathCause` reads it) wrapped only two sites: the wave
thunk's `impl` dispatch and its `fix`-round dispatch. Three shapes still classified HARD: a null
(non-throwing) `agent()` return (the shape of #1411's own motivating incident, `blocked: "worker
returned no result"`), `provisionStep`'s dispatch, and audit-seat deaths routed through `parallel`.

**Now (live code):**

- `dispatchAgent` tags a throw at every dispatch site (verdict-integrity D21, PIN-25), including
  `provisionStep`'s provision-run and every `dispatchSite` caller (audit seats, ace workers and
  re-audits, merge, gate-audit, land, wrap-up, filing and the rest).
- A worker-site null return is labeled env-died by `nullDied` (#2555 D11), never "worker returned
  no result".
- A wave audit-round seat death classifies env-died SOFT before the shortfall check and breaks the
  round loop. Only an ace or re-audit seat death demotes the current subset.

**Exceptions that do not land soft:**

- A land dispatch death (`landDied`) records `env-died` naming the site, then sets
  `held:land-failed`. There is nothing left to land without it, so it cannot be soft the way a
  merge or audit death is. A plan's "every other site classifies env-died soft" is not exhaustive
  for this site.
- A merge snapshot that returns `TARGET_LOST` or `TARGET_LATE` holds the task, never as env-died
  (#2309): a soft env-died would let a sibling land over an out-of-sync target.

**How to apply:** when a phase with an apparent infra death still hard-escalates or holds, check
which site died and read that site's own death arm in `workflow-template.js` (the header comments
above `dispatchAgent`, `dispatchSite` and `nullDied`) before assuming env-died should have fired.

**Related:** [[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]] (the `parallel`/null
mechanics this residual rode on); [[shared-status-enum-widening-silently-widens-land-path]] (the
general hazard class of a shared status enum gaining a new value with uneven call-site coverage).

> archived 2026-08-30: resolved — moved to archive
