# Red Team — Variable audit roster + gate-audit auto-skip (2026-07-02)
**Verdict:** CLEARED-WITH-NOTES — one worker-facing ambiguity patched in place; the other gate item was the plan confirming its own stated precondition; full gate green at the pinned stack tip.

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source (vs `docs/specs/2026-07-02-variable-audit-roster-design.md`, D1–D10), consistency-placeholders, dependency-feasibility. Bespoke: anchor-check-config, anchor-check-template, anchor-check-docs (analyzed — ~30 construct anchors across war-config, workflow-template, and 8 doc surfaces), tests-run (executed). **Baseline pinned at `5628388`** (post-nit-sweep stack tip, not the session checkout — [[audit-baseline-must-pin-integration-branch-not-main-checkout]]). Provision: `[]` (structural).

## Executed proof
- `tests-run` → full resolved gate green at `5628388` in a throwaway copy (all `skills/**/*.test.mjs` + every discovered `*.test.sh`); the plan's warned walkFiles-prune spurious failure did not manifest in a clean copy. F07 `new Function` extract-and-compare drift-guard pattern confirmed present and passing in `war-config.test.mjs`.
- `executable-proof` → no runnable-artifact mismatches.
- Anchor probes → **all Task-1 code preconditions hold**: hardcoded trio `baseLenses` in `auditRound` (audit.roster genuinely a NEW args field), sole `auditPrompt` call site already taking `(task, lens, depth, …)`, four `auditRound` call sites, both `mergedTasksForGateAudit.push` sites with `const requiresTest` in scope, 4 mirror markers, six dying drift-guards incl. the no-covenSeats-token `#6 Nit 1` guard, four F06 doc-contract tests incl. the README one, no preset touching lenses/covenSize, `deepMerge` wholesale-array replacement.

## Findings
### needsDecision (2 — both closed)
- [needsDecision→dismissed] Marker-count test cites lines 69/93/367/368; real 70/93/624/627. → The plan **states this exact drift** and rewords the test to construct-anchored phrasing in T1 step 3 ([[redteam-claims-vs-reality-misfires-on-impl-plans]] — a confirmed precondition graded as a hole). No patch.
- [needsDecision→patched] T2's D6 catalog rewrite didn't name the fate of the current `domain` / `execution-evidence` bullets. → **Plan patched**: subsumption made explicit (`domain` → Inputs open-namespace note; `execution-evidence` → reserved-pair note; deletion deliberate). Re-verified by a fresh probe: resolved.

### Minor
- [Minor] Same stale-line-ref fact re-filed by dependency-feasibility — covered by the plan's own T1 reword step. Auto-noted.
- The docs anchor probe's 9 warn-status findings were vocabulary-not-yet-updated items (precondition-vs-deliverable confusion) and one tour-step-17 counter-claim, all refuted/downgraded by adversarial confirm — the tour's step 17 divergence claim is indeed stale at tip (mirrors identical, 8 reasons each, divergence-removal comment at `workflow-template.js` ~:612), so the plan's rewrite stands.

## Resolutions applied (grill decisions — AFK self-adjudication)
- Domain-lens ambiguity → one clarifying sentence added to T2's war-auditor.md bullet (subsumed-not-lost) → re-verified resolved.
- Stale marker line-refs → no action (already an explicit plan step).

## Residual risk
- Coverage whole: 9/9 probes on-target, 0 dropped. Gate summary: pass 5 / fail 2 / warn 2 — both fails adjudicated above.
- The plan's cross-spec stacking inventory (constructs plan 3 must re-anchor post-roster) is a forward-looking contract; plan 3's red-team must verify it against the post-T1 file, not this tip.
