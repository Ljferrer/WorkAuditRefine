// Pure land/hold decision for the WAR per-phase Workflow.
// MIRRORED inline in ./workflow-template.js (the Workflow sandbox can't import) — keep in sync.
//
// Reasons that HOLD the land for the Lead (a hard escalation). gate_failed/error are
// deliberately NOT here: they leave nothing merged, surfaced as 'held:nothing-merged'.
// gate-evidence: a mapped acceptance-criteria test is provably unrun (present in the pre-merge diff
// but absent/0-count in the executed gate output). SOFT by default; HARD only when provably unrun (F04 R3).
export const HARD_ESCALATION_REASONS = ['escalate', 'audit-blocked', 'conflict', 'land_stale', 'dep-failed', 'gate-evidence']

// landed:    array of task ids merged onto the integration branch this phase
// escalated: array of { reason, ... } for tasks that did not merge
// → 'landed' | 'held:escalation' | 'held:nothing-merged'
export function decideLand({ landed = [], escalated = [] } = {}) {
  const hard = escalated.some((e) => HARD_ESCALATION_REASONS.includes(e && e.reason))
  if (landed.length && !hard) return 'landed'
  if (hard) return 'held:escalation'
  return 'held:nothing-merged'
}
