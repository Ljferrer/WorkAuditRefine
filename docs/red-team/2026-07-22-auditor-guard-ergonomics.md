# Red-team report — 2026-07-22-auditor-guard-ergonomics

- **Plan:** `docs/plans/2026-07-22-auditor-guard-ergonomics.md`
- **Source spec:** `docs/specs/2026-07-22-auditor-guard-ergonomics-design.md`
- **Artifact kind:** impl-plan (computed; per-task `Files:` under `## Build order`, tests same-diff not red-first)
- **Mode:** `--afk` (campaign 2026-07-22-run-resilience-and-hardening, plan 1/9; self-adjudicated per AFK doctrine)
- **Run:** Workflow `wf_a66cb18c-437` (initial + 1 resume), 11 probes (6 spine + 5 bespoke), redteam agents on opus/high

## Verdict

**CLEARED-WITH-NOTES** (gate: 0 blockers, 0 needsDecision, 2 minors; 11/11 on-target, 0 dropped).

## Attack surface / executed proof

- Analyzed: claims-vs-reality, coverage-vs-source, consistency-placeholders, dependency-feasibility, intent-vs-plan, anchor-snippet-fidelity, default-flip-old-absent (re-verify pass).
- Executed (throwaway sandboxes, real repo untouched): executable-proof, guard-baseline, sweep-scope, tests-baseline, default-flip-old-absent (initial empirical pass).
- Lead-run: backstop-legitimacy (3 AI-declared entries), unguarded-new-mirror (vacuous pass — no new inline mirror; `land-decision.mjs` + mirrored enums byte-untouched by design).
- `ff-topology`: not derived — the plan anchors no per-task evidence on merge-commit topology (no `^1`, `--first-parent`, or three-dot floor-base claims).
- Proven baselines: shell suite 69/69 green; JS suite 320/320 green; all new allow-cases (`git diff HEAD~1`, `--pretty=format:%H`, `ls-tree`, `branch`, `--contains=abc123`) currently DENY exit 2 with `WAR:` marker (premise holds); new deny-cases already deny; D1 tr-widening re-run in sandbox kept 69/69 and enabled the two flagship allows.

## Findings and resolutions applied

1. **[Major, needsDecision → RESOLVED by plan patch] `default-flip-old-absent` (drift-guard, ADR 0025).** Empirically proven: with new-contract tokens added to `auditPrompt()` and the old `%-format`/`reflog syntax` teach left co-present, the suite stayed 320/320 green — every mapped test anchored NEW-token presence only; the criterion-6 absence grep was un-encoded prose. **Adjudication (AFK):** promote to a RED-able assertion. **Patch:** Task 1.2 mapped test (a) now requires the D3 registry test to assert `/%-format/` and `/reflog syntax/` match NOWHERE in either surface; End state 6 updated to name the absence RED-able. Re-verified: probe passes.
2. **[Minor → RESOLVED by plan patch] `executable-proof`.** The historical-artifact enumeration missed `docs/specs/2026-07-01-auditor-pin-validity-no-fetch-design.md` (old verb set in comma form, which a slash-pattern grep misses). **Patch:** added to the `## Notes / conscious deviations` enumeration with the comma-form caveat.

## Adjudications

| Adjudicated value | Supersedes |
|---|---|
| Task 1.2's D3 registry test MUST include an old-fragment-absence assertion (`/%-format/`, `/reflog syntax/` nowhere in `auditorMd`/`auditP`) | Plan-body mapped-test list that anchored NEW tokens only |

No version/release-slot adjudications — the plan correctly keeps version literals non-authoritative (slots resolved at land).

## Residual risk (minors, noted)

- **AI-declared intent (ADR 0014):** the whole `## AI-Commander's Intent` is AI-declared, no operator echo-back; upgrade path is `/war-strategy <plan>`. Accepted for this AFK campaign run.
- **AI-declared backstops (3 entries, each justified with named runner + timing):** shell-suite-at-land (refiner gate JS-only lesson; runner: refiner gate + `/war-review`), live denial-rate telemetry (runner: operator `/war-review` post-release), JSC no-offset parse diagnostics (runner: operator at first live incident). All flagged for operator attention at the approval gate — no human has ratified these waivers.
- Escape-guard note: final `assert-no-repo-escape` exit 1 was the Lead's own in-flight plan patch (the file /red-team is authorized to write), verified via `git status` as the only dirty path — not a probe escape (self-confound gate: action-provenance ruled in).
