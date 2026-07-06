// Pure land/hold decision for the WAR per-phase Workflow.
// MIRRORED inline in ./workflow-template.js (the Workflow sandbox can't import) — keep in sync.
//
// Reasons that HOLD the land for the Lead (a hard escalation). gate_failed/error are
// deliberately NOT here: they leave nothing merged, surfaced as 'held:nothing-merged'.
// gate-evidence: a mapped acceptance-criteria test is provably unrun (present in the pre-merge diff
// but absent/0-count in the executed gate output). SOFT by default; HARD only when provably unrun (F04 R3).
// unrunnable-deps: a task whose deps can never be satisfied (a ghost dep), produced by the Workflow's
// post-loop sweep; a hard hold. Present in BOTH mirrors — the inline copy and this canonical export are
// identical (L1: the former scheduler-local divergence is removed).
// no-test: a requiresTest task whose diff never grew a mapped test after the bounded add-test/re-audit sub-loop exhausted budget (M2).
// unpackaged: a requiresPackaging task whose diff still trips assert-packaging-in-diff.sh (adds a file a Dockerfile's enumerated
// COPYs miss) after the combined floor-retry sub-loop exhausted the shared budget. Mirrors no-test; must land in BOTH mirrors + the drift guard.
export const HARD_ESCALATION_REASONS = ['escalate', 'audit-blocked', 'conflict', 'land_stale', 'dep-failed', 'gate-evidence', 'unrunnable-deps', 'no-test', 'unpackaged']

// The canonical landDecision known-set — the SINGLE source of truth for every phase-land outcome.
// SUPERSET of two smaller sets it must contain: decideLand's 3 in-flow outputs
// ('landed' | 'held:escalation' | 'held:nothing-merged') and the Workflow's 6 emitted values (the
// prior 3 plus 'held:submodule-pr', 'held:land-failed', and the catch block's 'held:workflow-error').
// 'held:phase-incomplete' is canonical-but-NOT-emitted by the Workflow — the Lead classifies it when a
// phase notification is non-'completed' (§4.2). The drift-guard in land-decision.test.mjs pins this array
// behaviorally (Workflow-emitted + decideLand ⊆ this) and across all 4 doc surfaces (SKILL.md ×2, schemas.md ×2 == this).
export const KNOWN_LAND_DECISIONS = ['landed', 'held:escalation', 'held:nothing-merged', 'held:land-failed', 'held:phase-incomplete', 'held:workflow-error', 'held:submodule-pr']

// landed:    array of task ids merged onto the integration branch this phase
// escalated: array of { reason, ... } for tasks that did not merge
// → 'landed' | 'held:escalation' | 'held:nothing-merged'
export function decideLand({ landed = [], escalated = [] } = {}) {
  const hard = escalated.some((e) => HARD_ESCALATION_REASONS.includes(e && e.reason))
  if (landed.length && !hard) return 'landed'
  if (hard) return 'held:escalation'
  return 'held:nothing-merged'
}
