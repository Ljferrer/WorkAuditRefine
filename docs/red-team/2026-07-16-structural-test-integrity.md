# Red-team report — 2026-07-16-structural-test-integrity

**Verdict: CLEARED** (no grill round needed — all probes passed first pass).
Plan: `docs/plans/2026-07-16-structural-test-integrity.md`
Source spec: `docs/specs/2026-07-16-structural-test-integrity-design.md`
Artifact kind: `impl-plan`. Run: `--afk` (campaign 2026-07-16-engine-integrity-and-sweep-debt, plan 2/5).
**Base:** verified against the STACKED base (plan-1 land-failure-recovery landed, tip `e017c4fd`) — required since plan 2 shares `workflow-template.js/.test.mjs` with plan 1.

## Attack surface

9 probes: 6 spine lenses + 3 bespoke (anchor-preconditions, baseline-repro, default-flip-old-absent
drift-guard). `ff-topology` not derived (no per-task merge-topology evidence). Drift-guard spine
probes: `unguarded-new-mirror` vacuous (the new censuses are test helpers, not canonical-export
mirrors); `default-flip-old-absent` run as a bespoke executed probe (plan 2 narrows the block-strip
sites — the scope-narrow class). Backstop-legitimacy: both `## Deferred validations (backstops)`
entries legitimate (live prompt-render observation; out-of-footprint strip-idiom stragglers) — not
AI-declared.

## Executed proof

3 executed probes in throwaway sandboxes. All green, all claims confirmed at the stacked base:
- Baseline suites green: `workflow-template.test.mjs` 312/312, `workflow-scaffold.test.mjs` 64/64,
  `land-decision.test.mjs`, `version-slots.test.mjs` all pass.
- **Core premise confirmed exact:** the naive two-step strip on the live `workflow-template.js`
  yields exactly 3 spans `[18, 18, 42804]` bytes (42840 total), spans 0/1 byte-identical, the giant
  span ending at `/* the single ace commit */` — matching the plan verbatim.
- String-aware census confirms 224 `pt`-tagged literals and 4 quoted-string backticks exactly as
  claimed; the untagged head count reads higher than the authoring-base 129 (the sibling's landing
  added entrants) — consistent with the plan's explicit non-authoritative-counts clause, not a
  defect.
- Scaffold: exactly 2 real block comments (`dead dispatch`, `both types dead`), 2 positive
  "survives comment stripping" asserts, zero `/*`-bearing string literals — the keep-two-step
  rationale holds.
- The proposed fail-closed scanner (throw on unclosed quoted string at EOL) would NOT false-throw:
  0 EOL-unclosed quoted strings on live source.
- `default-flip-old-absent` drift guard: PASS — End-state-1's path-anchored grep genuinely asserts
  the OLD block-strip idiom is absent from the narrowed sites (hits only the census helper), so a
  straggler that left the block pass on one site would go red. Non-vacuous.
- Sibling preservation (End state 11) anchored: plan-1's terminal-else arm + `held:land-failed`
  routing and its two behavioral land tests + line-scoped pin are present at this base.

## Findings and resolutions applied

None. No blockers, no `needsDecision`, no minors survived. Plan unchanged.

## Adjudications

None (no version/authoritative literal changed). The plan's own "spec deviation notice"
(scanTemplateLiterals default-deny registry vs the spec's unimplementable zero-backtick census) was
verified sound at the real scale by the executable-proof probe.
