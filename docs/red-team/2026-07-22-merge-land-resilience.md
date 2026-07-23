# Red-team report — 2026-07-22-merge-land-resilience

**Verdict: CLEARED-WITH-NOTES** (three rounds: round 1 BLOCKED → 6 patches → round 2 BLOCKED on two
new Majors → 6 patches → round 3 CLEARED-WITH-NOTES + 1 auto-fixed Minor)

- **Plan:** `docs/plans/2026-07-22-merge-land-resilience.md`
- **Source spec:** `docs/specs/2026-07-22-merge-land-resilience-design.md`
- **artifactKind:** impl-plan
- **Baseline:** plan-4 base tip `b696501` (stacked on servitor-wrapup-landed-tip v0.14.51), read-only worktree
- **Runs:** round 1 `wf_73e0388c-98c` (13 probes) → round 2 `wf_7e6f4dd9-377` (9 probes, fresh launch —
  never `resumeFromRunId`, per the recorded replay hazard) → round 3 `wf_4958d0c3-f9c` (8 probes, fresh).
  Analyzed probes on `Explore`; model opus / effort high. Escape guard after each round: the only
  working-tree delta was the red-team's own plan patch (self-confound per the Diagnosis pre-flight —
  action-provenance ruled out probe escape each time); no stray refs, no sandbox leakage.

## Attack surface

- **Round 1:** 13 probes (6 spine + 7 bespoke incl. both mandatory drift guards), 13/13 on-target,
  7 pass / 3 fail / 3 warn → **BLOCKED**.
- **Round 2:** 9 probes (6 spine + 3 patch-verify bespoke), 9/9 on-target, 5 pass / 2 fail / 2 warn
  → **BLOCKED** (two *new* Majors; all round-1 patches confirmed fixed).
- **Round 3:** 8 probes (6 spine + 2 blocker-verify bespoke, executed), 8/8 on-target,
  7 pass / 0 fail / 1 warn → **CLEARED-WITH-NOTES**.

## Findings and resolutions

### Round 1 — one root defect class: absence guards that could never fire (5 findings, all patched)

The End-state-9 doctrine-retirement greps and the End-state-8 doc-contract absence key were
**provably vacuous** — each returned zero hits on the *unmodified* tree, so each would have passed
whether or not the rewrite happened:

- `"an environmental failure passes on retry"` wraps a comment line break in `workflow-template.js`
  (`… (an` / `// environmental failure passes on retry …`) — a line-based grep can never match it.
- `"env-blocked doctrine applied at gate time"` is markdown-interleaved in SKILL.md
  (`the **\`env-blocked\` doctrine applied at gate time**`) — the plain-space phrase matches nothing.

**Patches (verified mechanically, each anchor shown to HIT exactly once at base):** End state 9
rebuilt on three case-insensitive line-local anchors + a binding red-then-green requirement; End
state 8 + the Task 1.3 doc-contract row keyed on a markup-tolerant regex, red-then-green; Task 1.1's
`escalated.push` quote corrected to the live byte-exact form (leading `task: r.task.id,`);
`/fresh TMPDIR/i` dropped as a D3 row anchor (pre-existing at base on both surfaces —
non-discriminating); Task 1.3 given the `grep -rin` sweep + straggler-ownership adjudication.
Round 2's three patch-verify probes confirmed all five fixed (RED/GREEN proven both directions).

### Round 2 — two new Majors (not round-1 survivors; each patched, round 3 confirmed)

1. **`unachievable-end-state` (CONFIRMED, executed):** End state 3's "servitor wrap-up dispatch
   fires" was unreachable through the fixture the plan names — the wrap-up gate is
   `landed && memoryLocalRoot` (moved off `learningsTarget` *by plan 3 of this very stack*,
   stack-fresh drift) while `CLS_ARGS` supplies only `learningsTarget`. Probe proved 0 servitor
   dispatches on a fully correct implementation; green after one fixture line. **Patch:** binding
   fixture requirement in Task 1.1 (+ End-state-3 parenthetical): thread
   `memoryLocalRoot: '/abs/mem',` into `CLS_ARGS`. Round 3 re-executed the instruction and ran the
   **full** `workflow-template.test.mjs` suite green.
2. **`coverage-gap`:** both new environment-proceed dispatches are gate-bearing (each mirrors its
   baseline-proceed sibling's `Run the gate (${plan.gate}) with a fresh TMPDIR` step), obligating
   the ADR-0036 `GATE_SITE_CAPTURES` census — an exact closed list of nine whose own doctrine is
   "a site an existing fixture cannot reach is ADDED, never skipped" — which the plan and spec
   never mentioned. **Patch:** census paragraph in Task 1.1 — append two rows (both flavors,
   `clsImpl` environment-class driven), bump the count assertion + enumerating message 9 → 11
   (live-count wording), and (round-3 minor, auto-fixed) rewrite all four `NINE`/`nine` count-words
   in the doctrine header comment, row-list comment, and test title.

**Round-2 minors (patched):** the suggested compound D3 anchor was itself born-vacuous
(token order — reversed to `/environment-proceed[\s\S]{0,120}fresh TMPDIR/i`); End state 9
contradicted Task 1.3's straggler-ownership adjudication (ownership carve-out added); the Notes'
cross-plan contention misattributed `agents/war-refiner.md` to plans 1–3 (its real co-editor in
this survey is `2026-07-22-test-floor-target-repo.md` — corrected, relevant to the roadmap's
serialization edge).

## Backstop-legitimacy (4 AI-declared entries)

All four entries are legitimate: each names a concrete not-fixture-able reason (a genuine
nondeterministic environment flake; a mid-push origin race; a live `--afk` behavior shift; the
`REL_GUARD_PRECONDITION_FAILED` weaker-prior residual), a runner, and timing. No cheaper pre-merge
proxy covers them. Each carries the ADR 0014 **AI-declared** marker; noted for operator attention,
non-blocking under AFK.

## Residual risk / notes

- **Minor (auto-noted, all three rounds):** the intent block is `## AI-Commander's Intent`
  (AI-drafted under `/war-machine --afk`, ADR 0014), not operator-confirmed. Well-formed — 11
  checkable End-state conditions, each mapped to a delivering task (1.1: E1–6; 1.2: E7; 1.3: E8–9;
  1.4: E10; 2.1: E11). Human upgrade path: `/war-strategy <plan>`. Under the campaign's AFK posture
  the intent stays AI-declared and its backstops keep their marker.
- The three-round arc is itself evidence for the campaign wrap-up: two of the five round-1 defects
  and blocker A were **only findable by executing** the plan's own guards against the real tree —
  prose review would have passed all of them.

## Adjudications

Red-team rulings + ratified self-adjudications, threaded into the `/war` run as
`args.adjudications` so audit seats confirm rather than re-litigate:

| # | delta | ruling | route |
|---|-------|--------|-------|
| 1 | Spec §4.5 prescribes literal case-sensitive `grep -rn` full-phrase sweeps; two of the three phrases are unmatchable at line granularity (line-wrap / markdown interleave). | End state 9's three **case-insensitive line-local** anchors (each verified single-hit at base) + binding red-then-green supersede the spec's literal form. Recorded in Task 1.3; spec text stays uncorrected per convention. | red-team round 1; patched |
| 2 | End-8/Task-1.3 doc-contract absence key: plain-space phrase vs live markdown. | Markup-tolerant regex (`/env-blocked[\s*\`]{0,6}doctrine applied at gate time/i` or bare `/doctrine applied at gate time/i`), red-then-green mandatory. | red-team round 1; patched |
| 3 | Plan quoted the merge-site environment arm without the leading `task: r.task.id,` field. | Byte-exact live-line quote restored; worker anchors on the corrected form. | red-team round 1; patched |
| 4 | `/fresh TMPDIR/i` proposed as a D3 registry-row anchor. | Rejected — pre-existing at base on both surfaces (non-discriminating). Anchor on `/environment-proceed/i` + new-clause-unique anchors; compound form must read `/environment-proceed[\s\S]{0,120}fresh TMPDIR/i` (both prescribed surfaces put `environment-proceed` first). Every anchor reds on a per-surface temp-revert. | red-team rounds 1+2; patched |
| 5 | Spec §4.5's "every straggler corrected" vs cross-plan shared-file contention. | Ownership carve-out (named partial deferral): Task 1.3 corrects stragglers in its own three files; a straggler in the 1.1-owned files is REPORTED (`war-followup`), never edited by 1.3; the three greps' zero-hit obligation rests on Task 1.1. End state 9 carries the matching carve-out. | red-team rounds 1+2; patched |
| 6 | End state 3's servitor half vs the post-plan-3 wrap-up gate (`memoryLocalRoot`, not `learningsTarget`). | The recovered-land test must thread `memoryLocalRoot` (fixture line in `CLS_ARGS` beside `learningsTarget`) — proven green on the full suite in-sandbox. An auditor seeing the fixture add should read it as plan-directed, not scope creep. | red-team rounds 2+3; patched |
| 7 | Plan omitted the ADR-0036 gate-site census obligation. | Two new census rows + count 9 → 11 (assertion, message, and all four `nine` prose sites), live-count wording — same exact-count/no-slack discipline as the D3 `REGISTRY.length` floor. | red-team rounds 2+3; patched |
| 8 | D3 `REGISTRY.length` floor and new-ADR number are worded live ("new exact row count", "next free above the live set"), never the spec's frozen literals. | Directive form binds — resolve both against the rebased integration tip at implementation time (campaign expectation: registry 12 → 13; ADR next free ≥ 0039). | plan Notes (self-adjudicated); ratified |
| 9 | Version literals in the plan (Task 2.1) are non-authoritative. | `version-slots.test.mjs` is the arbiter; resolve the next free patch from the four slots at land time (campaign expectation: v0.14.52). | plan Notes; ratified |
| 10 | T2.5's expected exit necessarily changes 3 → `EX_WRONG_BRANCH` (6), diverging from spec §5's "existing cases unchanged". | T2.5's scenario *is* the precheck's target — repurpose it into the criterion-7 wrong-HEAD case (or supersede with the readback comment preserved); worker latitude per Open decision 3. | plan Notes; ratified |
| 11 | `## AI-Commander's Intent` + AI-declared backstops heading (ADR 0014). | Standing AFK provenance — intent is the ceiling, plan slice the floor; backstop entries render their AI-declared marker at every land and in the campaign wrap-up. | auto-noted every round; ratified |
