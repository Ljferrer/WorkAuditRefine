---
name: prompt-literal-heavy-task-headroom-estimate-can-undershoot-red-team-544b-vs-actual-hard-line-raise
description: "A red-team headroom estimate for a prompt-literal-heavy task (e.g. new bisection dispatch prose) can be far more optimistic than the actual growth once landed — this phase's task needed a full WORKFLOW_LITERAL_BUDGET hard/advisory raise (62464→79872 hard, →70656 advisory) against a red-team estimate of only ~544 B headroom; the plan's compression-first-then-raise-as-fallback duty still worked (raise was lawful per ADR 0042's justification rule), but budget-headroom estimates for prompt-literal-heavy work should be treated as lower bounds, not plans"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: prompt-literal-heavy-task-headroom-estimate-can-undershoot-red-team-544b-vs-actual-hard-line-raise
  phase: "realized-absorb-rate/phase-1 task 1.1 (landed dev/2026-08-19-realized-absorb-rate, tip 291943e)"
  keywords: 
    - WORKFLOW_LITERAL_BUDGET
    - prompt-surface-budgets.test.mjs
    - hard budget raise
    - advisory budget raise
    - red-team headroom estimate
    - ADR 0042 justification fallback
    - bisection dispatch prompt literals
    - compression-first-raise-fallback
    - budget arithmetic optimism
  tags: 
    - war
    - prompt-surface
    - budget
    - plan-design
    - red-team
  created: 2026-08-20
  originSessionId: d1c9bd01-e7da-46af-a12d-d59dbd7a69d1
  modified: 2026-08-20T08:53:41.680Z
---

# A red-team's prompt-literal budget headroom estimate can undershoot actual growth by an order of magnitude

**Found (code-verified — landed tip `291943e` on `dev/2026-08-19-realized-absorb-rate`, task 1.1,
verified in the phase's `_refinery` worktree):** `skills/war/assets/prompt-surface-budgets.test.mjs`
now pins `WORKFLOW_LITERAL_BUDGET = { hard: 79872, advisory: 70656 }` (raised from a prior
`62464`/lower-advisory pair). The red-team pass that cleared this phase's plan had estimated only
~544 B of headroom would be consumed by the new ace-bisection dispatch prose in
`skills/war/assets/workflow-template.js`. The task's actual new prompt-literal surface (the
`aceBisect` bisection ladder's dispatch prompts) grew far beyond that estimate — enough to require
raising both the hard and advisory `WORKFLOW_LITERAL_BUDGET` lines, not just consuming existing
headroom.

**What worked:** the plan's own duty — compress in-task first, raise the hard/advisory ceiling only
as an ADR-0042-justified fallback when compression alone can't fit — held up under a much larger
gap than red-team projected. The raise itself was lawful (cited its ADR 0042 justification per the
family's convention) and landed clean; this is not a process failure, just a sizing-estimate one.

**Why this is durable:** this is the same *class* of estimate-optimism as
[[adr-0042-eviction-replacement-pointer-bytes-outrun-plan-arithmetic]] (that lesson: an eviction's
new-pointer-line byte estimate runs ~2x low) but a different *mechanism* — there the growth is a
small fixed-shape pointer line; here it's an entirely new multi-dispatch prompt family (bisection
ladder prose covering up to 6 dispatch sites) whose real prompt-literal footprint a red-team review
of the plan text alone badly undercounts. **General rule for future plans:** when a task adds new
*dispatch prompt prose* (not just a pointer/citation line) to a budgeted surface like
`workflow-template.js`, treat any red-team or plan-stage headroom estimate as a soft floor, not a
ceiling-safe number — expect the real number to run substantially higher, and confirm via the
landed `WORKFLOW_LITERAL_BUDGET` test numbers rather than trusting the pre-land estimate when
deciding whether a compression pass alone will suffice.

**Locate-cue (verify still present before acting):** `WORKFLOW_LITERAL_BUDGET` constant in
`skills/war/assets/prompt-surface-budgets.test.mjs` (currently `{ hard: 79872, advisory: 70656 }`);
the `aceBisect` dispatch-prompt-building code in `skills/war/assets/workflow-template.js`.

## Related

[[adr-0042-eviction-replacement-pointer-bytes-outrun-plan-arithmetic]] — the sibling budget-optimism
lesson (eviction pointer-line bytes, not new dispatch prose growth).
