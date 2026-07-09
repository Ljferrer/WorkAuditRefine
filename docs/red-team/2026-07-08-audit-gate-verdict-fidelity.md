# Red-team report — audit-gate-verdict-fidelity

**Plan:** `docs/plans/2026-07-08-audit-gate-verdict-fidelity.md`
**Source spec:** `docs/specs/2026-07-08-audit-gate-verdict-fidelity-design.md`
**Repo baseline:** `dev/2026-07-08-audit-gate-verdict-fidelity` @ `85d6ef5` (stacked on plan 1's landed content — ADR 0023 present, v0.14.15)
**Date:** 2026-07-09 · **Adjudication:** AFK self-adjudicated (campaign `2026-07-08-memory-frictions`, plan 2/9)

## Verdict: **CLEARED**

## Attack surface
10 probes round 1 — 5 spine analyzed (claims-vs-reality, coverage-vs-source, consistency-placeholders, dependency-feasibility, intent-vs-plan; executable-proof dropped — plan ships new floor scripts as deliverables) + 5 bespoke (precondition-anchors, git-diff-tree-floor-semantics [executed], verdict-hard-and-enum-baseline, adr-version-slots [executed], backstop-legitimacy). 8 pass, 1 fail, 1 warn round 1.

## Executed proof
- **git-diff-tree-floor-semantics** — built merge-commit fixtures and proved the floor/dispatch git idioms empirically (this found the blocker, below).
- **adr-version-slots** — ADR 0023 present (plan 1), 0024 free; four slots consistent at 0.14.15 → next 0.14.16.

## Findings & resolutions applied

**Blocker (Major, correctness; git-diff-tree-floor-semantics, adversarially confirmed).** Task 2.1's evidence dispatch computed a task's own changed-file set with `git diff-tree --no-commit-id --name-only -r -m --first-parent <merge>`. Empirically (git 2.50.1) this returns the **union of both parents' diffs**, not the first-parent-only set (`--first-parent` has no restricting effect combined with `-m` in `diff-tree`; fixture printed all four files t1,t2,o1,o2). A superset `--mapped` list would make `gate-pin-status.sh`'s BENIGN-ADVANCE intersection test spuriously non-empty → STALE-MISMATCH false positives → the provably-unrun HARD path permanently defused — the exact failure the plan exists to prevent.
- **Resolution:** replaced with `git diff --name-only <task-merge-commit>^1 <task-merge-commit>` (first-parent diff; `^1` = integration tip before the `--no-ff` merge, so `^1..<merge>` is exactly the task's contribution — clean for the campaign's file-disjoint tasks). Re-verify proved the corrected idiom returns exactly the task-own set and that the old idiom returns the union. Notes deviation added.

**Minor (coverage-vs-source, round 1).** Spec's D2 demotion tag `agent-unverified` was silently renamed to `pin-mismatch` in the plan — defensible (in this repo `agent-unverified` is exclusively a `war-memory` provenance tier, unrelated to findings) but unflagged, and Task 1.4's ADR-0024 wording still echoed "uses the existing provenance ladder".
- **Resolution:** added a conscious-deviation note; adjusted Task 1.4's ADR-0024 wording to state the `pin-mismatch` findings tag does **not** ride the provenance ladder.

**Minor (needsDecision, coverage-vs-source, re-verify round 1).** End-state 6 ("missing-artifact ⇒ SOFT", matching spec criterion 6 / D5 "determination against the captured file, not a prose paste") contradicted Task 2.1 line 72's "fall back to inline `mr.gate_output`, SOFT only when both absent" — the fallback reintroduced the curated-inline path for HARD determinations.
- **Adjudication (spec-resolvable):** the spec is the tiebreaker and unambiguous — the HARD provably-unrun determination is artifact-only; a missing artifact ⇒ SOFT. Task 2.1 had drifted. **Resolution:** rewrote line 72 so the HARD path is artifact-gated (missing artifact ⇒ SOFT, never a HARD hold from inline), while inline `mr.gate_output` may still be read as non-authoritative context (nothing weaker than today's inline-only reading). Aligns with End-state 6 + spec.

## Precondition anchors
All verified present on the plan-1-landed baseline: `assert-test-in-diff.sh` sibling model, `auditPrompt()`/`isHardGateEvidence`/seat-collection sites/gate-audit + end-state seats/`MERGE_RESULT`/`pinOrSentinel`/`RESERVED_LENSES` in workflow-template.js, `gate-evidence` ∈ `HARD_ESCALATION_REASONS` (both mirrors), the "Do NOT curate or excerpt" prose sites, `audit_sha`/`execution-evidence`/`test-fidelity` in war-auditor.md, the schemas.md MergeResult block. Current `isHardGateEvidence` keys on severity only (D8's before→after accurate).

## Backstop legitimacy
Three entries (D6 judgment half, D6 floor heuristic ceiling, runtime fail-open) — all justified, correctly narrowed to the remainder the Task-1.2 floor arm does not cover, runner + timing named. Pass.

## Residual risk
- Backstop D6-judgment / D6-ceiling / runtime-fail-open (see plan) — auditor `test-fidelity` duty + first live `/war` phase + /red-team.

## Re-verify trail
- R1: 10 probes → BLOCKED (git-diff-tree Major + 1 Minor). R2: `{coverage-vs-source, corrected-idiom}` → idiom pass, coverage surfaced the D5 needsDecision Minor. R3: `{coverage-vs-source}` → pass → **CLEARED** (≤2 rounds/blocker).
