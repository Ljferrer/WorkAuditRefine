# Red-team report — 2026-07-24-recovery-re-merge-dispatch-coherence

**Verdict: CLEARED-WITH-NOTES** (round 1 — single round; 0 blockers, 0 needsDecision, 11 Minors → 3 root defects, all auto-fixed in the plan).

Plan: `docs/plans/2026-07-24-recovery-re-merge-dispatch-coherence.md` (campaign plan 3/6, base `53e15d9`, plugin 0.14.59). Source spec: `docs/specs/2026-07-24-recovery-re-merge-dispatch-coherence-design.md`. artifactKind: `impl-plan` (heuristic: `docs/plans/` + per-task `Files:` under `## Build order`; End state 3's red proof is done-report evidence, not red-first shipping).

## Attack surface

Workflow `wf_fe6dde10-344` — 13 probes (6 spine + 7 bespoke: `anchor-existence`, `baseline-repro`, `threading-feasibility`, `guard-stability`, `adr-claims`, `comment-invariant-satisfiability`, `ff-topology`), model opus / effort high (config `agents.redteam`), provision `[]` (no `.war-provision.json`). Coverage whole: 13/13 on-target, 0 dropped, 0 off-target. Escape guard (`assert-no-repo-escape.sh`) rc 0. Gate summary: 8 executed / 5 analyzed · 4 pass / 8 warn / 1 fail.

**Lead-run checks (skill-mandated, run outside the Workflow):**
- **Backstop-legitimacy:** PASS — one entry (integrated-tip three-grep re-check), concrete deferral reason (two Phase-1 tasks adjudicate at their own frozen bases; End states 1/7 are integrated-tip properties), runner + timing named (the Lead at Phase-1 land, before Phase 2). Plain heading (not AI-declared) — no operator-attention Minor.
- **Drift-guard pair:** `unguarded-new-mirror` VACUOUS-PASS (the plan adds no inline mirror const — "No mirrored-constant dance" note; End state 8 pins no enum/`land-decision.mjs` edit). `default-flip-old-absent` NOT TRIGGERED (no default flip or scope narrow; the comment rewrite removes an enumeration, not a default).
- **ff-topology derivation:** no `^1` / `--first-parent` / three-dot-floor-base token in the plan; the probe was added anyway on End state 8's "phase diff" prose anchor — it verified the phase-level name-only diff surface is topology-robust.

## Executed proof (what was actually run in throwaway sandboxes)

- **`threading-feasibility` (the central mechanism):** implemented Task 1.1's three `+ submodMergeNote` appends and a sibling dispatch-capture test per the pinned shape (T4 #297 fixture, per-route stub sequencing exactly as sliced — no-test → fix-worker → re-audit → floor-retry; `gate_failed`+class stubs for the two proceed routes) — suite GREEN with the appends; removing each route's append individually REDs exactly that route's assertion. The plan's stub-sequencing description matched the engine's real control flow; no load-bearing step had to be invented.
- **`guard-stability`:** with the appends applied — `captureUses` still exactly 3; the four-literal packaging census green; the #1046 floor-site guard still finds all four sites with per-site arms byte-identical (FLOOR_SITE_RE's lazy span excludes the append point, as the plan traced).
- **`baseline-repro`:** `workflow-template.test.mjs` and `land-decision.test.mjs` green at base; `grep -c "submodMergeNote"` = **2** at base (1 definition + 1 initial-merge use — End state 1's "exactly 5" arithmetic holds: 2 + 3 appends).
- **`anchor-existence`:** every named construct exists at base **except one** (the `## Scope` heading — finding 1 below); stale `gateCaptureClause` enumeration sentence confirmed present (wrapping a line break, quoted); `captureUses` asserts exactly 3; `advisePackagingVacuous` lexical-visibility proof confirmed; ADR 0040's Relationship bullets exactly {0005, 0025, 0017, 0023, 0024}, no 0019 bullet today; ADR 0023 `## Amendment` precedent confirmed.
- **`ff-topology`:** synthetic FF fixture — the phase-level `--name-only` diff surface End state 8 checks is identical under two-dot/three-dot and merge/fast-forward task shapes; no hidden merge-commit-topology dependency.
- **`comment-invariant-satisfiability`:** all four remainder items exist in the live comment; both universal-wording counterexamples are real in source (baseline-proceed re-merge and the polish merge genuinely carry no `gateCaptureClause`); the suggested invariant wording is true of exactly the 3 clause-bearing sites; no other test pins the comment text.

## Findings and resolutions (all Minors — auto-fixed per the skill; each REPRODUCED by the Lead before patching)

1. **`## Scope` heading does not exist in ADR 0019** (9 of the 11 minors, one root — every lens tripped on it). Reproduced: `grep -n '^## '` returns exactly Decision / Considered options / Consequences / References; the Scope material is the `**Scope.**` bold-labelled paragraph at line 61 **inside** `## Decision`, restatement at line 68. The plan's "Anchor by heading names (`## Decision`, `## Scope`)" was unsatisfiable as written. **Fix:** Task 1.2 + End state 7 re-anchored on the real constructs (the `## Decision` heading + the `**Scope.**` paragraph lead-in `**Scope.** This ADR **extends** [ADR 0006]`); noted that both superseded restatements live under the single `## Decision` heading. The spec's §4.4 carries the same misnomer — adjudicated as a spec-side historical record, not edited (see Adjudications).
2. **Case-sensitive sweep greps false-negate on re-cased copies** (`executable-proof`, status fail — demonstrated: re-casing the exact #1034 phrase drops it from the as-written grep while `grep -in` finds it; the live tree already leaks a third casing "ALL three" at `workflow-template.js:2033` / `test.mjs:5248` that the enumerated set missed; the literal commands also carried no file operands). Reproduced: `grep -c` 10/61 vs `grep -ic` 11/62. **Fix:** both survey greps and the backstop's re-check description now case-insensitive with explicit file operands; the two "ALL three" hits pre-adjudicated as keeps (memory-checklist prompt line; entry-validation test title — neither is a merge-site enumeration); End state 1's `submodMergeNote` grep deliberately stays case-sensitive (JS identifier).
3. **Amendment body covered only half the exhaustion routing** (`adr-claims`). Reproduced against ADR 0040's own Decision: it states BOTH routes (merge-site exhaustion HARD via `'escalate'`; land-site exhaustion falls back to `held:land-failed`, reason `env-blocked`, retry provably spent) plus the fully-green re-run requirement (§C) — while the plan's mandated amendment body named only the merge-site half over a site-agnostic superseded sentence. **Fix:** Task 1.2's amendment body + End state 7 now carry both exhaustion routes and the fully-green (never proceed-over) clause.

**Post-patch self-check (Lead-run):** both corrected grep commands executed against the live tree with the probe-measured counts (2/4 `env-blocked`; 11/62 token hunt; base `submodMergeNote` = 2); every remaining `## Scope` mention in the plan is a no-such-heading statement.

## Residual risk

- The 8 `warn`-status probes carry confirmation notes only (per-probe outputs in the run journal, `wf_fe6dde10-344`); none survived as a defect beyond the three roots above.
- `## Amendment (2026-07-24)` heading date is the plan/spec ratification date, retained deliberately even if landing occurs later — it records the decision date, not the land date.
- The plan's two deliberately-deferred live omissions (`submodLandNote` on the re-land dispatches; polish-merge submodule-awareness) remain deferred with the Lead-filed `war-followup` vehicle at Phase-1 close — red-team confirms the omissions are real and the deferral is spec-ratified (§9), not an oversight.

## Adjudications
<!-- Machine-readable: the WAR Lead reads these rows and threads them into the auditor prompts (auditPrompt() and the gate-audit seats). Version precedence: task instruction > red-team adjudication > plan body literal. Leave empty (or omit) when no authoritative value was adjudicated — an empty block is byte-identical no-op for the auditor. -->
- ADR 0019 "Scope" anchor = the `**Scope.**` bold-labelled paragraph INSIDE `## Decision`
  (lead-in `**Scope.** This ADR **extends** [ADR 0006]`); ADR 0019 carries **no** `## Scope`
  heading — the source spec's §4.4 and issue #1033 both misname it as one, and the spec is a
  ratified historical record deliberately left unedited. The plan's construct anchors are
  authoritative; an auditor must not flag the plan-vs-spec anchor wording as drift, and a worker
  must not hunt for (or invent) a `## Scope` heading — Lead-adjudicated 2026-07-25 (red-team
  round 1, reproduced against the live ADR).
