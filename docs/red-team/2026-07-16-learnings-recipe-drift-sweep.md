# Red-team report — 2026-07-16-learnings-recipe-drift-sweep

**Verdict: CLEARED** (CLEARED-WITH-NOTES; the one Minor auto-fixed in place, no blockers).
Plan: `docs/plans/2026-07-16-learnings-recipe-drift-sweep.md`
Source spec: `docs/specs/2026-07-16-learnings-recipe-drift-sweep-design.md`
Artifact kind: `impl-plan`. Run: `--afk` (campaign 2026-07-16-engine-integrity-and-sweep-debt, plan 3/5).
**Base:** verified against the STACKED base (plans 1+2 landed, tip `f8458063`) — required since plan 3
shares `skills/war/SKILL.md` + `CONTEXT.md` with plan 1 at different named constructs.

## Attack surface

8 probes: 6 spine lenses + 2 bespoke (anchor-preconditions, baseline-repro). `ff-topology` not
derived. Drift-guard spine probes: `unguarded-new-mirror` vacuous (no new inline mirror);
`default-flip-old-absent` vacuous/not-applicable (additive clause; the one "phase-close sweep →
retired-token sweep" phrase fix at the source lesson is a scoped rename, not a cross-surface
default flip — "phase-close sweep" legitimately survives as ADR 0012's real mechanism). Backstop
legitimacy: both `## Deferred validations (backstops)` entries legitimate (first-live-firing;
dry-run-discovered load-bearing hits) — the first honestly states `/war-review` does not ingest the
record line today. Not AI-declared.

## Executed proof

2 executed probes in throwaway sandboxes, all confirmed at the stacked base:
- `war-config.test.mjs` green (doc-contract family incl. G passes), `version-slots.test.mjs` green,
  `war-memory lint docs/learnings/` exits 0.
- **Dry-run count confirmed EXACTLY 6 hot lessons** (`git grep` of the token set over `docs/learnings/`
  excluding `archive/`): the six slugs the plan names, all adjudicable exempt. Matches End state 7.
- **Provably-red precondition holds:** `retired-token` has 0 occurrences in both SKILL.md and
  CONTEXT.md at the base — the new doc-contract test is provably-red-pre-fix.
- **Spec-deviation #1 confirmed:** a flagless `war-memory query` walks an empty corpus (no hits);
  `query --repo docs/learnings` returns hits. Both flags load-bearing for the production two-root sweep.
- Named anchors present (per-phase gh-write batch paragraph, Post-servitor Gate-2 block, CONTEXT
  Phase-close coherence sweep entry, war-config doc-contract family, source lesson + "phase-close
  sweep" phrase); sibling (plan 1) SKILL.md/CONTEXT.md edits present for byte-unchanged rebase.

## Findings and resolutions applied

**One Minor (correctness, auto-fixed):** End state 7 and the Task 1.1 dry-run bullet instructed the
worker to run the **repo-only** dry-run query "fully-flagged" with `--local` "per the live CLI's
requirement". That rationale is false — `cmdQuery` calls no `requireLocal` (only
render-index/archive/consolidate/migrate do), so `--repo docs/learnings` alone already scopes a
non-empty repo-only search; adding `--local` would also walk the local corpus and risk **leaking
local slugs into the committed `Dry-run:` artifact**, contradicting the plan's own "repo root only /
nothing local enters the committed artifact" guarantee. **Resolution:** patched both spots to scope
the dry-run query `--repo docs/learnings` alone (no `--local`), with the corrected rationale. The
production-sweep both-flags requirement (Method, Task 1.1(3), End state 3) is correct and untouched
— it searches both roots.

## Adjudications

None affecting authoritative values. The plan's three self-declared spec deviations (flagged query
invocation, six-lesson worked example, count-only local routing) were verified sound.
