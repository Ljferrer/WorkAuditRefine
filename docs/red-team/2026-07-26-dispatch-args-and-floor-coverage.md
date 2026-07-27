# Red Team — docs/plans/2026-07-26-dispatch-args-and-floor-coverage.md (2026-07-27)
**Verdict:** CLEARED — three rounds; final round 1 probe / 0 blockers / 0 needsDecision / 0 Minors. Run under `/war-campaign` AFK self-adjudication (campaign `2026-07-26-doc-truth-and-engine-hardening`, plan 1 of 4).

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders,
dependency-feasibility, intent-vs-plan (round 0; dependency-feasibility re-run round 1). Bespoke:
baseline-and-sweep-arithmetic, anchors-and-snippets, stager-args-mechanism,
classification-guard-efficacy, routing-arms-feasibility, unguarded-new-mirror (drift-guard spine),
default-flip-old-absent (drift-guard spine), backstop-legitimacy. `ff-topology` deliberately not
derived: no merge-commit-topology evidence anchors — every floor invocation in the plan runs
pre-merge on two branch refs. artifactKind: `impl-plan`. provision: `[]` (no `.war-provision.json`;
`structuralFallback` empty). Sub-agents on opus/high (`agents.redteam`). Fallback: none — all
analyzed probes dispatched on `Explore`.

Rounds: r0 `wf_48d56909-8b6` (14 probes, coverage whole 14/14, BLOCKED — 4 blockers /
4 needsDecision / 20 minors) · r1 `wf_719ad503-b53` (6 probes, BLOCKED — 1 blocker, in the r0
patch itself, + 4 minors) · r2 `wf_2f6a8f84-ed4` (1 probe, **CLEARED**, findings:[]). Every r0
blocker was reproduced against live code by the Lead before patching (the
reproduce-before-patching discipline); the escape guard's ` M docs/plans/*` hits at r1/r2 were
diagnosed via the self-confound gate as the Lead's own sanctioned Step-5 patches (no other dirty
paths, no junk refs).

## Executed proof
- All four of the plan's source-spec-line baseline claims reproduce at `c73e9f6`:
  `submodLandNote` 2×, `assert-no-submodule-mutation` 3× (all three are dispatched-prompt sites:
  the initial merge-task, environment-proceed, baseline-proceed re-merges), `classificationClause(`
  exactly 3 call sites (`refineryPath` ×2, `refineryLandPath` ×1; the definition's ` = (` cannot
  match), `grep -cF ': (args || {})'` = 1; neither `submodule-blocked` nor `submodule-pr` in
  `HARD_ESCALATION_REASONS`.
- stager-args-mechanism (r0+r1): the full Phase-2 substitution pipeline implemented in sandbox —
  no-flag byte identity holds; the anchor-quoting + JS-meta payload (backticks, `${`, quotes,
  newlines, raw U+2028/U+2029) stages cleanly with exactly-once counts unperturbed; the
  `const EMBEDDED_ARGS = <JSON.stringify(...)>` prelude parses and round-trips under Node 24
  (ES2019 JSON-superset — U+2028/U+2029 legal in string literals); every End-state-3 invalid case
  fails as specified with no staged file written; r1 re-proof: the patched attached-form guard
  rejects `--args=f.json` while `--args f.json`, `--force`, and a real `campaignOrdinal` all
  still work.
- classification-guard-efficacy (r0): the bare call-paren guard counts 3 on the live file, goes
  RED on a synthetic 4th site passing a non-`refinery*` base (which the spec's first-arg pin
  provably misses — the blind spot the widening closes), still matches a line-wrapped argument
  list, and cannot match the definition.
- routing-arms-feasibility (r0): both routing corrections achievable with zero enum change;
  `held:submodule-pr` already in `KNOWN_LAND_DECISIONS`; the `#236` direct-return donor and the
  primary submodule-blocked escalate arm exist as described; polish `submodule-blocked` routes the
  existing fail-open DISCARD arm whose log line interpolates the returned status.
- default-flip-old-absent (r2, the closing proof): the per-medium doc-contract gate implemented
  against the real ADR 0037 + CONTEXT.md in 5 sandbox variants — GREEN on the correct amendment;
  RED when the ADR is left unamended; RED when CONTEXT.md is left unamended; the
  sentence-literal-scoped OLD-absent row does not false-positive on the ADR's untouched sentences
  nor on "two pure, independently-tested exports".

## Findings (all resolved in place)
### Major
- [r0] **End state 1 RED on arrival:** the zero-`EMBEDDED_ARGS` no-flag negative contradicted
  Task 2.1's own `workflow-template.js` coupling comment — the stager copies template bytes
  verbatim apart from the two anchor substitutions, so comment bytes ride into every staged copy.
  → negative re-scoped to substitution evidence (`const EMBEDDED_ARGS =` /
  `: (args || EMBEDDED_ARGS)` absent, `: (args || {})` still exactly-once); comment byte-run ban
  widened to all three predicates (r1 minor).
- [r0] **`--args=<file>` silent misparse:** "two-token only" was declared, never enforced — the
  attached token survives `rest.filter((a) => a !== '--force')` and binds to the 5th positional
  `campaignOrdinal`, staging an args-less script at exit 0 (the #1134 incident shape). → post-peel
  `/^--args=/` guard mandated, usage error before any write; unrelated-flag absorption recorded as
  an accepted residual.
- [r0, needsDecision] **Doc-truth cascade waived in prose:** the ADR 0037 + CONTEXT.md amendments
  were phrased out of the §4.4 sweep and read by no test (ADR 0017 forbids prose waivers).
  → block-scoped assertions added to `skill-doc-contracts.test.mjs` (its first `docs/adr/` read).
  [r1] the r0 patch over-tightened: a literal OLD-absent row on the ADR block REDs against the
  correct inline amendment (ADRs are append-only). → per-medium rule: ADR block NEW-present only
  (proven discriminating), CONTEXT.md block NEW-present + OLD-absent, all OLD-absent predicates
  sentence-literal-scoped. Proven both-ways in r2.
- [r0, needsDecision] **Polish skip-sentence count fork:** the reworded skip sentence is
  `pt`-tagged prompt text inside the already-counted `merge:p<id>-polish` dispatch — a
  filename-style reword makes a 6th hit. → descriptive naming mandated in both End state 9 and
  Task 1.1 (b); count stays exactly 5.

### Minor (defining ones; the rest are recorded in the plan's Notes adjudication block)
- ADR 0037 decision 2 carries a **second** `two`-scoped sentence (exports, not substitutions)
  that Phase 2 falsifies more directly — the amendment note now covers both.
- The floor-set prose grep was all-caps case-sensitive and false-negates on a sentence-cased
  reword of its own landing site (#1034 class) → case-insensitive on a stable mid-sentence token;
  identifier/filename sweeps stay case-sensitive.
- Backstop 2 was over-declared → narrowed to the live-transport half; the semantic half moved
  into Phase 2's suite, landing in `stage-workflow.test.mjs` with a net-new local AsyncFunction
  harness (the sibling suite's builder is module-scoped and unreachable) + the file-header
  "never execute" invariant comment carve-out in the same commit.
- The §4.5 SKILL.md paragraph must name `EMBEDDED_ARGS` exactly once (the `{}`-is-truthy caveat)
  or a fully compliant paragraph yields 3 of the sweep's 4 expected hits.
- Cross-plan truth fix: plan 4's two "sole shared non-release file" sentences were falsified by
  this plan gaining `skill-doc-contracts.test.mjs` — corrected in the same campaign pass; plan
  4's own red-team round re-verifies.
- Stale `738cf6a` master-tip literal marked illustrative (`c73e9f6` at red-team time; land-time
  next-free-patch resolve unaffected).

## Adjudications
| Adjudicated value | Supersedes (plan-body literal) |
|---|---|
| Doc-contract gate is per-medium: ADR 0037 block NEW-present only; CONTEXT.md block NEW-present + OLD-absent, sentence-literal-scoped | r0 patch's "NEW-present **and** OLD-absent … on each block" |
| `738cf6a` is illustrative-only; integration base resolves at land time | "Expected integration base: master tip (currently `738cf6a`)" read as current |

## Residual risk
- The `classificationClause` guard's comment-coupling mitigation (the rewritten header comment
  never contains the call-paren byte-run) is prose-asserted at authoring time, not itself
  test-enforced; the guard REDs loudly (at 4) if violated, so drift is caught, at the cost of a
  false alarm rather than a silent pass.
- The stager still absorbs an unrelated typo'd flag into `campaignOrdinal` (recorded residual;
  a general unknown-flag guard is out of this plan's slice).
- Backstop 1 (integrated-tip sweep re-check, Lead at Phase 3 land) and the narrowed backstop 2
  (live-transport observation, first `--args` campaign phase) stand as the plan's two deferred
  validations, riding `args.backstops` → `handoff.backstops` → the final PR.
