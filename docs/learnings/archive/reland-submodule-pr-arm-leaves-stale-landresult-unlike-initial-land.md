---
name: reland-submodule-pr-arm-leaves-stale-landresult-unlike-initial-land
description: "RESOLVED (2026-08-02-war-engine-and-standing-doc-truth/1.2, #1245, landed 2026-08-03): both re-land arms now assign landResult = reLand inside their reLand.status === 'submodule-pr' branches, symmetric with the initial land — the asymmetry this lesson describes is fixed. Body left as-is per the repo's resolved-lesson-stamp convention (see [[resolved-lesson-stamp-freezes-body-so-it-can-contradict-the-new-description]]) — read the description, not the body, for current behavior."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: reland-submodule-pr-arm-leaves-stale-landresult-unlike-initial-land
  phase: 2026-07-26-dispatch-args-and-floor-coverage/1.1 (2026-07-26)
  keywords: 
    - landResult
    - submodule-pr
    - held:submodule-pr
    - reLand
    - asymmetric arm
    - stale result object
    - environment-proceed re-land
    - baseline-proceed re-land
    - pr_number
    - pr_remote
    - RESOLVED
    - arm-symmetry pin
  tags: 
    - workflow-template
    - land-phase
    - submodule
    - asymmetric-arms
    - result-mutation
  created: 2026-07-27
  originSessionId: 0ad881e1-4bbc-43c6-8e45-8597d9cec1cf
  modified: 2026-08-03T16:55:30.982Z
---

# A re-land's submodule-pr arm can leave the outer result stale where the initial land wouldn't

**The gap (code-verified, found at `skills/war/assets/workflow-template.js`, around the
`land:phase-<id>:environment-proceed` and `:baseline-proceed` re-land dispatches, phase
`2026-07-26-dispatch-args-and-floor-coverage/1.1`, landed tip
`0250694ea5c69e77e2fa2f0543f81c6ccf111978`; verify still present before acting):** on the
**initial** land, `landResult` *is* the dispatched-agent's `MergeResult` directly, so when it comes
back `status:'submodule-pr'`, `landResult.pr_number`/`landResult.pr_remote` are populated alongside
the pushed `escalated` entry (`escalated.push({ ..., pr_number: landResult.pr_number, ... })`,
around line 1916). On **both** re-land arms (`environment-proceed` around line 1948,
`baseline-proceed` similarly shaped), the dispatched result is captured into a *different*
variable (`reLand`), and the `reLand.status === 'submodule-pr'` branch pushes the PR fields onto
the `escalated` entry from `reLand` — but never runs `landResult = reLand`. `landResult` therefore
stays whatever the **first** (failed, `gate_failed`) land attempt returned; the PR ref exists only
on the escalated entry, not on `landResult`.

**Why it doesn't bite today:** traced every consumer — `tipSha` falls back to `lastPinned` in both
cases (identical either way), the servitor gate checks `landResult.status === 'landed'` which is
unreachable on this arm regardless, and `handoff` is not emitted on `held:submodule-pr` on either
path. `SKILL.md`'s `held:submodule-pr` runbook reads the PR number "from the ledger," not by
naming `landResult`. So this is a **live but currently-inert** asymmetry, not a bug with an
observable symptom yet.

**Why it's worth recording anyway:** a future ledger-writer, or Lead-facing prose, that reaches for
`landResult.pr_number` as "the" way to get the PR ref would work on the initial-land path and
silently return `undefined` on either re-land path — a plan/code-shape trap that's cheap to avoid
now (`landResult = reLand` in both new arms would make the paths symmetric with no other
behavioral change) but easy to reintroduce if a third re-land arm is ever added by mirroring one of
these two without noticing the missing assignment.

**Pattern to reuse:** when a code path is duplicated across an "initial attempt" / "retry attempt"
pair and one path aliases a shared outer variable to the dispatched result while the retry path
captures it under a *new* local name, check whether every field the initial path exposes via the
shared variable is also propagated to the shared variable on the retry path — not just pushed onto
a side list (`escalated`, a log entry, etc.). A field present only on the retry's *local* result
object is invisible to any consumer that reads the shared/outer name.

> archived 2026-08-15: resolved — moved to archive
