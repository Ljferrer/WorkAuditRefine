// Pure land/hold decision for the WAR per-phase Workflow.
// MIRRORED inline in ./workflow-template.js (the Workflow sandbox can't import) — keep in sync.
//
// Reasons that HOLD the land for the Lead (a hard escalation). gate_failed/error are
// deliberately NOT here: they leave nothing merged, surfaced as 'held:nothing-merged'.
// gate-evidence: a mapped acceptance-criteria test is provably unrun (present in the pre-merge diff
// but absent/0-count in the executed gate output). SOFT by default; HARD only when provably unrun (F04 R3).
// (D8) gate-evidence is ALSO HARD when the gate-audit seat returns verdict === 'escalate' even with zero Critical/Major findings — a finding-less escalate is HARD by design (defence-in-depth); the 'gate-evidence' reason is REUSED intact, no new enum member (ADR 0005).
// unrunnable-deps: a task whose deps can never be satisfied (a ghost dep), produced by the Workflow's
// post-loop sweep; a hard hold. Present in BOTH mirrors — the inline copy and this canonical export are
// identical (L1: the former scheduler-local divergence is removed).
// no-test: a requiresTest task whose diff never grew a mapped test after the bounded add-test/re-audit sub-loop exhausted budget (M2).
// unpackaged: a requiresPackaging task whose diff still trips assert-packaging-in-diff.sh (adds a file a Dockerfile's enumerated
// COPYs miss) after the combined floor-retry sub-loop exhausted the shared budget. Mirrors no-test; must land in BOTH mirrors + the drift guard.
// done-unmet: a doneWhen-bearing task whose own `Done when:` acceptance command still exits red via assert-done-when.sh
// (exit 1 — a red command or a timeout; exit 2 git/env error never collapses here) after the bounded make-this-command-pass
// sub-loop exhausted the shared budget (precision-chain D1, Task 2.3). Mirrors no-test/unpackaged; must land in BOTH mirrors + the drift guard.
// defectClass ('plan') is escalation-record METADATA on the escalation record, orthogonal to `reason` — it is NEVER a member of this
// array nor of KNOWN_LAND_DECISIONS (ADR 0005). A worker-authored plan/spec defect is *classified*, never routed through a new reason
// enum member; the negative drift-guard in land-decision.test.mjs pins both tokens ('plan-defect'/'held:plan-defect') out of both sets
// permanently, so "completing" the sentinel feature into an enum here fails loud.
export const HARD_ESCALATION_REASONS = ['escalate', 'audit-blocked', 'conflict', 'land_stale', 'dep-failed', 'gate-evidence', 'unrunnable-deps', 'no-test', 'unpackaged', 'done-unmet']

// SOFT_ENV_REASONS (#1411): the soft env/infra family of per-task escalation reasons —
// 'env-blocked' (a run.provision step failed: the worker was never spawned) and 'env-died' (a
// post-spawn API/quota/transport death: the seat spawned, then the harness died under it — the
// observed classes: session/rate limits, quota exhaustion, 529/overloaded, connection resets).
// (Worded "env", never the full word: the #598 isolation guard pins this file free of the
// gate-failure-classification vocabulary.) MIRRORED inline in ./workflow-template.js (the Workflow
// sandbox can't import) — keep in sync; the D2 mirror-registry row in workflow-template.test.mjs is
// the drift guard. Task-level `reason` values only: NEVER members of HARD_ESCALATION_REASONS
// (ADR 0005's infra-stays-soft precedent — held:workflow-error never entered it either) and NEVER
// landDecision values. Soft means the phase LANDS minus the dead/blocked task (decideLand:
// landed.length && !hard ⇒ 'landed'), the task recorded in the return for the Recovery-relaunch
// re-run; a phase where nothing merged still reads 'held:nothing-merged'.
export const SOFT_ENV_REASONS = ['env-blocked', 'env-died']

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

// BARRIER_TOKENS (in-band-absorb-default D1, PIN-1/PIN-2): the seat's structured `barrier` enum — the
// only lawful reasons a fully specified in-diff Minor/Nit routes `follow-up` instead of the `absorb`
// default. Three follow-up barriers plus one ask-routing tag: 'barrier:release-slot' (release-slot
// file), 'barrier:underspecified' (fix not fully specified), 'barrier:rationale-comment' (the fix
// removes or edits a line carrying a `ponytail:` / deliberate-mirror rationale comment), and
// 'barrier:trade-off' (behavior change with a nameable trade-off — meant for `ask`). A scope argument
// is never a barrier. Finding-level tokens only: NEVER members of HARD_ESCALATION_REASONS,
// SOFT_ENV_REASONS, or KNOWN_LAND_DECISIONS. MIRRORED inline in ./workflow-template.js (the Workflow
// sandbox can't import) — keep in sync; the D2 mirror-registry `barrier-list` rows in
// workflow-template.test.mjs bind the inline copy, the auditor card sentence, and the
// disposition-eligibility.md list to this export.
export const BARRIER_TOKENS = ['barrier:release-slot', 'barrier:underspecified', 'barrier:rationale-comment', 'barrier:trade-off']
