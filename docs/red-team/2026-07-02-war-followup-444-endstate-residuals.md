# Red-team — war-followup #444 endState plan_ref binding + structure-test robustness

**Plan:** `docs/plans/2026-07-02-war-followup-444-endstate-residuals.md`
**Date:** 2026-07-02 · **Verdict:** **CLEARED** (after one patch) · **Mode:** campaign AFK self-adjudication

## Attack surface
8 probes (5 spine + 3 bespoke), each adversarially confirmed. Coverage whole: 8/8 on-target, 0 off-target, 0 dropped. Executed: 3 · Analyzed: 5.

## Executed proof
- **`baseline-repro-f1-latent-bug` (executed) — PASS.** Reproduced the latent bug in a sandbox: the current `f.plan_ref === condition` exact match leaves a whitespace/case-drifted Critical finding's condition silently `met`; the plan's proposed normalizer (`trim().replace(/\s+/g,' ').toLowerCase()` both sides) resolves it to `unmet`, and a genuinely non-matching `plan_ref` still stays `met` (no over-binding). Plan premise + fix both validated.
- **`f3-structure-test-baseline` (executed) — PASS.** `war-strategy-structure.test.sh` currently passes (emits the `ok - Commander's Intent precedes ## Build order` line, exits 0); the `check_f`-guarded verbatim template lines the fix anchors to exist and are unique.
- **`executable-proof` (spine, executed) — WARN.** Surfaced the `plugin.json` path Minor (below).

## Findings & resolutions applied
1. **[Major → resolved] `plugin.json` path imprecision.** Phase 2 listed the bump target as bare `plugin.json` (repo root), but the manifest lives at `.claude-plugin/plugin.json` (root has none). A worker following the literal list would edit a nonexistent file.
   - **Fix applied (plan patched):** corrected all three references — the Phase 2 Files list, the Phase 2 prose, and End-state condition 5 — to `.claude-plugin/plugin.json`. Re-verified: plan references the real path; `.claude-plugin/plugin.json` exists; no root `plugin.json`. The other three slots (`.claude-plugin/marketplace.json` ×2, README `## Status`) were already correct at `0.11.0`.

## Residual risk (non-blocking)
- The normalizer narrows the near-miss binding gap to whitespace + case only; paraphrase/reordered `plan_ref`s still rely on the auditor VERBATIM prompt directive (the known env-gap in memory `handoff-endstate-met-default-hinges-on-verbatim-planref-match`). The plan explicitly scopes this out and does not claim to close it. Accepted.
- F4 is a conscious no-change (already pinned by the `check_f` verbatim guard); confirmed no code references it.

## Verdict
**CLEARED.** Spine + bespoke probes confirm the plan's premise, anchors, and fix behavior; the one Major (path) is patched and re-verified. Cleared for `/war`.
