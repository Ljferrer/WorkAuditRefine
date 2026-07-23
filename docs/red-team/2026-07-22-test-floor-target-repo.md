# Red-team report — 2026-07-22-test-floor-target-repo

**Verdict: CLEARED-WITH-NOTES** (one round: 0 blockers, 0 needsDecision, 2 Minors — 1 auto-fixed,
1 auto-noted)

- **Plan:** `docs/plans/2026-07-22-test-floor-target-repo.md`
- **Source spec:** `docs/specs/2026-07-22-test-floor-target-repo-design.md`
- **artifactKind:** impl-plan
- **Baseline:** plan-5 base tip `04edae0` (stacked on merge-land-resilience v0.14.52), read-only
  worktree
- **Run:** `wf_81536387-cdb` — 13 probes (6 spine + 7 bespoke incl. both mandatory drift guards),
  13/13 on-target, 12 pass / 0 fail / 1 warn. Analyzed probes on `Explore`; model opus / effort
  high. `ff-topology` deliberately not derived: zero merge-topology tokens in the plan (`^1`,
  `--first-parent`, three-dot floor base, per-task "merge commit") and a hand-read of the
  floor-invocation prose confirms all evidence anchors are template-source discovery, never
  topology. Escape guard: exit 0 (clean — the only working-tree delta was this red-team's own
  plan patch, applied after the guard ran).

## Attack surface

Bespoke probes: `four-site-enumeration`, `exhaustion-detail-contract`,
`floor-script-behavior` (executed), `validation6-extension-feasibility`,
`skillmd-config-anchors`, `default-flip-old-absent` (executed, mandated),
`unguarded-new-mirror` (mandated). Executed proof: 3 probes ran real commands in throwaway
sandboxes (full shell suite; fixture-repo exit-path runs; sweep-leftover simulation).

The probe set was aimed at **stack-fresh drift** — this plan was authored 2026-07-22 before
plans 1–4 of its own campaign landed, and plan 4's two round-2 blockers were exactly that class.
Result: the plan survived its stack. Its riskiest forward assumption — that the tree would carry
**four** dispatched `${testPatternArg}` sites after merge-land-resilience added
environment-proceed — holds exactly at `04edae0` (initial `merge:<taskId>`, floor-retry,
baseline-proceed, environment-proceed; the `requiresTest:false` skip arms carry the script token
*without* `${testPatternArg}`, so the extended drift-guard's co-occurrence discovery cleanly
excludes them). The schemas.md "at both merge-task invocation sites" claim the plan calls stale
is confirmed stale. Every Task 1.3/1.4 anchor is present and un-reworded at base, and **no
plan-mandated grep criterion anchors on a line-wrapping phrase** (the vacuous-guard class plan 4
existed to fix — audited explicitly because two *nearby* phrases the plan edits, war-config's
"ONE Setup / decision" and schemas.md's "at both / merge-task invocation sites", do wrap).

## Findings and resolutions

### Round 1 — 1 auto-fixed Minor

- **`floor-script-behavior` (Minor, patched):** Task 1.1 said "All pre-existing cases (1–10 …)"
  but `assert-test-in-diff.test.sh` has **eleven** case families — case 11
  ("FAIL-CLOSED FLOOR CLASSIFICATION (#732)", 29 checks all green in-sandbox) landed after the
  plan was authored. **Patch applied:** the literal now reads 1–11, names case 11, and binds the
  worker to append new near-miss cases *after* case 11 rather than treating case 10 as the last
  existing family.

Probes that specifically tried to break the plan and failed: the string-valued
`detail: floorMr.floor_diagnostic` on the exhaustion pair is legal (the neighboring merge-failure
route already pushes an object-valued `detail: floorMr`; no schema or consumer constrains the
shape); the `runNoTestLoop` driver can reach the exhaustion site; the MERGE_RESULT status enum
matches the plan's byte-unchanged list; the declined doc-contract row survived an executed
leftover-surface simulation (see Adjudications).

## Backstop-legitimacy (4 AI-declared entries)

All four legitimate: each names a concrete not-fixture-able reason (live-Lead prose re-check;
model prompt-following; heuristic adequacy against unseen repos; the D7-accepted
scaffolding-phase residual), a runner, and timing; the correctness-critical halves are CI-covered
in 1.1/1.2 and no cheaper pre-merge proxy is over-deferred. Each carries the ADR 0014
**AI-declared** marker; noted for operator attention, non-blocking under AFK.

## Residual risk / notes

- **Minor (auto-noted):** the intent block is `## AI-Commander's Intent` (AI-drafted under
  `/war-machine --afk`, ADR 0014), not operator-confirmed. Well-formed — 12 checkable End-state
  conditions, each mapped to a delivering task (1→1.1, 2→1.1, 3–6→1.2, 7→1.3, 8→1.4,
  9→sweep across 1.1–1.4, 10→1.4, 11→1.1/1.2, 12→2.1). Human upgrade path:
  `/war-strategy <plan>`. Under the campaign's AFK posture the intent stays AI-declared and its
  backstops keep their marker.

## Adjudications

Red-team rulings + ratified self-adjudications, threaded into the `/war` run as
`args.adjudications` so audit seats confirm rather than re-litigate:

| # | delta | ruling | route |
|---|-------|--------|-------|
| 1 | Plan's pre-existing-case literal "1–10" vs the live test file. | Cases are **1–11**; case 11 (FAIL-CLOSED FLOOR CLASSIFICATION, #732) is preserved and new near-miss cases append after it. | red-team round 1; patched |
| 2 | Task 1.2's "expected four at this plan's base … enumerate from the live tree". | Confirmed at `04edae0`: exactly four dispatched sites (initial / floor-retry / baseline-proceed / environment-proceed), labels as named; skip arms excluded by `${testPatternArg}` co-occurrence. The extended drift-guard's ≥ 3 non-vacuity floor should discover 4. | red-team probe; confirmed |
| 3 | New string-valued `detail` on the exhaustion `escalated`/auditLog pair vs the neighboring object-valued `detail: floorMr` route. | Legal — `detail` is already shape-heterogeneous per route and no schema/consumer constrains it. An auditor must not flag mixed-type `detail` as a contract violation. | red-team probe; confirmed |
| 4 | Notes' declined assert-OLD-absent doc-contract row. | Sound recorded adjudication, not a gap: qualification (not a default flip — no config default changes, ADR 0019 null intact), the correctness-critical capture directive is mechanically guarded by Task 1.2's extended validation-6 drift-guard, revisit trigger recorded. Residual = audit-time greps + mandatory manual survey, accepted. | red-team executed probe; ratified |
| 5 | Mirror discipline. | No new inline mirror (schema property + prompt text only; enum blocks byte-untouched); the default pattern set stays at exactly two statements (the `pattern_mjs`/`pattern_sh` variables + the header) — the plan's print-from-variables rule adds no third; near-miss-set multi-surface statements are fail-open advisory. | red-team probes; ratified |
| 6 | Version literals in the plan (Task 2.1). | Non-authoritative; `version-slots.test.mjs` is the arbiter — resolve the next free patch from the four slots at land time (campaign expectation: v0.14.53). | plan Notes; ratified (standing) |
| 7 | `## AI-Commander's Intent` + AI-declared backstops heading (ADR 0014). | Standing AFK provenance — intent is the ceiling, plan slice the floor; backstop entries render their AI-declared marker at every land and in the campaign wrap-up. | auto-noted; ratified |
