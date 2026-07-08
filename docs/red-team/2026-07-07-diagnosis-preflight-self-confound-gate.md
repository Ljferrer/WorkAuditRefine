# Red-team report — Diagnosis pre-flight (self-confound gate)

**Plan:** `docs/plans/2026-07-07-diagnosis-preflight-self-confound-gate.md`
**Source spec:** `docs/specs/2026-07-07-diagnosis-preflight-self-confound-gate-design.md`
**Repo tree verified:** `dev/2026-07-07-diagnosis-preflight-self-confound-gate` @ `2ddf70e` (= plan-1 landed tip; this plan stacks on the entire sibling per ADR 0011).
**Date:** 2026-07-07 · **Mode:** campaign `/red-team` (--afk self-adjudication).

## Verdict: **CLEARED**

Coverage whole — 8/8 probes on-target, 0 off-target, 0 dropped. All probes `status:pass`, findings `[]`. No blockers, no `needsDecision`, no minors.

## Attack surface

8 probes (executable-proof dropped — this plan ships **no** runnable code blocks / commands-with-Expected; it is prose-only):

**Spine (5, analyzed):**
- `claims-vs-reality` — every concrete claim about the tree checks out. PASS.
- `coverage-vs-source` — every spec requirement maps to a plan task/step. PASS.
- `consistency-placeholders` — no TBD/TODO, no symbol drift, no contradiction. PASS.
- `dependency-feasibility` — assumed interfaces/deps exist; step order sound. PASS.
- `intent-vs-plan` — the 12 End-state conditions are individually checkable, each maps to a delivering task, collectively sufficient for the Purpose. PASS.

**Bespoke (3):**
- `anchor-fidelity` (analyzed) — the vacuous-test guard. All 11 grepped tokens confirmed **absent** from their target files pre-change (`self-confound` ×6 surfaces, `## Diagnosis pre-flight`, `sandbox reuse`, `hypothesis promotion`, `sub-agent fan-out`, `ruled out`, `evidence trail`) → no structure-test assertion is vacuous; all structural insertion anchors (`## Backstop-legitimacy check`, both `## Invariants (never violate)`, `## Stop and escalate instead of guessing`, the `confirmStage` REFUTE line, the D3 verify-duty block) confirmed **present** → every edit can land. PASS.
- `sibling-precondition` (analyzed) — the sibling-shipped state this plan depends on is present: `gate_failure_class` in `workflow-template.js` (the Lead bullet defers to its base re-run); ADR `0019-*` exists and `0020-*` absent (so "next free = 0020" is correct); CLAUDE.md's `docs/adr/` range includes 0019; `isFixWorker` in `workflow-template.test.mjs` (fix-workers are `war-worker`-seated → no dispatched-prompt mirror needed). PASS.
- `existing-tests-green` (executed, throwaway sandbox) — the pre-existing suites the plan promises stay green untouched (`workflow-scaffold.test.mjs`, `red-team-gate.test.mjs`, `workflow-template.test.mjs`, `manifest-provenance.test.sh`, `war-pipeline-structure.test.sh`) all pass at baseline. PASS.

## Executed proof

1 executed probe (`existing-tests-green`) ran the named suites in an isolated sandbox copy — all green at the `2ddf70e` baseline; no red baseline to invalidate the "stay green untouched" claim.

## Findings / resolutions applied

None. No plan patches were required.

## Conscious deviations — ratified

The plan flags four deviations for `/red-team` ratification (§Notes). All are **accepted** as sound:
1. **`workflow-scaffold.js` `confirmStage` string is the runtime confirm surface** — verified: the runtime confirm prompt is string-built in the scaffold and never loads `lenses.md`, so a one-sentence content edit to that string literal is the only edit reaching the D7 targets. String-literal-only (no control flow / schema / constant) → `workflow-scaffold.test.mjs` & `red-team-gate.test.mjs` stay green. Legitimate.
2. **`agents/war-servitor.md` operator-ratified 6th surface** — verified: the servitor is the only in-run role that writes lessons, and D3's referent-existence check cannot catch a plausible misdiagnosis (it would enter `code-verified`). The one-sentence evidence-trail line is the sole write-side defense at the incident's worst channel. Legitimate.
3. **CLAUDE.md ADR-range bump + release phase beyond spec §5's seven-surface list** — the range token prevents re-introducing the rot the sibling's Q28b just fixed; shipped plugin prose reaches marketplace-pinned users only via a release. Legitimate.
4. **Lead bullet carries the single-path half + defers to the mechanical classifier** — the incident's root act *was* double bring-up, and `gate_failure_class` (sibling-shipped, verified present) is the action-provenance evidence for merge/land gate reds. Legitimate.

## Residual risk (deferred validations — backstop-legitimacy check)

1 declared backstop (`source: plan`), **legitimate**:
- **Gate compliance in a live misdiagnosis moment** — whether a diagnosing agent actually *runs* the gate before promoting a hypothesis. Deferral justified: standing-instruction compliance is not code-enforceable (spec constraint 5) and no pre-merge fixture can exercise live diagnostic behavior; the structure test guards clause **presence** only (no cheaper pre-merge proxy over-covers it). Runner + timing named: the per-channel human backstops (memory redaction lint + `docs(learnings)` PR review, issue triage, `/red-team` on any fix plan) plus operator observation on the next live campaign; **named §9 activation trigger** (ADR 0017): the first post-land recurrence of a promoted-then-falsified self-caused diagnosis constitutes "prose proved insufficient" → operator files the write-side-hook follow-up. Recall-side residual noted honestly (the ADR 0007 ladder bounds unverifiable-referent lessons only).

Not an AI-declared section (plain `## Deferred validations (backstops)` heading) → no AI-provenance Minor.

## Bottom line

Plan is CLEARED for `/war` execution against `dev/2026-07-07-diagnosis-preflight-self-confound-gate` (base `2ddf70e`), landing to `dev/2026-07-07-target-repo-agnostic-execution`.
