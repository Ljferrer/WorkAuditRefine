# Red Team — 2026-08-06-red-team-gate-cli (2026-08-14)
**Verdict:** ADJUDICATED — every root finding patched in place; one executed blocker re-verified and removed by probe, the remaining seven adjudicated without re-run (analyzed-probe findings and policy calls). Coverage whole: 14/14 probes on target, none off-target, none dropped.
**Rounds:** 1
<!-- Cumulative grill sweeps: the Step-1 seed + this run's sweeps. Strict form — the next run's seeding re-reads exactly this line; an integer, nothing else. -->

Run under `/war-campaign` (campaign `2026-08-06-survey-batch`, plan 1 of 14), `--afk` — the Lead
self-adjudicated every decision below; no operator was consulted. Repo:
`/Users/ljf/GitHub/WorkAuditRefine/.claude/worktrees/survey-batch-roadmap-2026-358f8c` @ `8ac52d0`
(the plan's own snapshot base `6fff2ee` is an ancestor, and `git diff 6fff2ee HEAD` over all four
footprint files is empty — so every "measured at `6fff2ee`" claim was gradeable at the live tip).
Artifact kind: `impl-plan`. Merged arm — Part 1 is the plan's own source of truth.

## Attack surface

Spine (6): `claims-vs-reality`, `executable-proof`, `coverage-vs-source`, `consistency-placeholders`,
`dependency-feasibility`, `intent-vs-plan`.

Bespoke (8): `anchor-check-constructs`, `baseline-repro-sweep-counts`, `command-diff-template-endstates`,
`default-flip-old-absent`, `guard-split-deps-edge`, `backstop-legitimacy`, `cross-plan-edge-truth`,
`tests-run-baseline`.

Executed in sandbox (7): `executable-proof`, `baseline-repro-sweep-counts`,
`command-diff-template-endstates`, `default-flip-old-absent`, `tests-run-baseline`, plus the two
adversarial-confirm executed stages. All used `git clone --no-hardlinks` (the repo is a linked
worktree, so it is the only isolating form).

Drift-guard spine probes: `default-flip-old-absent` **ran** (non-vacuous, and it found the run's
sharpest defect); `guard-split-deps-edge` **ran** (non-vacuous — the plan splits a guard across tasks);
`unguarded-new-mirror` **vacuous** by Lead inspection — the plan introduces no inline `const` mirror of
a canonical export. `ff-topology` **not derived**: the plan anchors no per-task merge-commit topology
(no `^1`, no `--first-parent`, no three-dot floor base; End state 10's "git log between the phase base
and the tip" is a plain range), confirmed by token grep **and** a hand-read of the evidence prose.

Provision: `[]` — no `.war-provision.json` (`readManifest` → `{found:false}`), `structuralFallback` → `[]`.
Fallback: none — `Explore` present; no analyzed-agent fallback engaged. Model/effort: `opus`/`high`
from `.claude/war/config.json` `agents.redteam`. Round limit 3 (`run.redteamRoundLimit`).

Escape guard: pre-run snapshot 278 refs (exit 0); post-run `--baseline` diff **exit 0** — no
working-tree residue, no ref added/removed/moved. No containment was required.

## Executed proof

- Suite baseline: `node --test skills/red-team/assets/red-team-gate.test.mjs` → GREEN; full repo
  `node --test 'skills/**/*.test.mjs'` → 1125/1125 green. End state 7's "pre-existing rows stay green"
  premise holds.
- `version-slots.test.mjs` (End state 12's check) → GREEN at base.
- **Context item 1 reproduced**: `--stdin --rounds 3` (space-separated) exits **0**, stray tokens
  ignored, `routeUpstream` **silently absent** — the defect is real on the production path.
- **File mode is weaker than the plan claimed** (new finding, R9): the "accidental" ENOENT refusal
  fires only when the stray value precedes the path. In the CLI's own documented order
  (`red-team-gate.mjs <results.json> --rounds 3`) `args.find` binds the real path, `3` is dropped, exit
  **0**, empty stderr.
- **F4 reproduced**: mutating arm 1 to `const open = blockers` leaves the whole suite GREEN.
- **F3 partially refuted** (R2): `--stdin --rounds=0` does **not** reach `resolveRoundInput`'s key arm —
  the flag arm returns first — so the mutant `if (!key) return undefined` stays GREEN under the row D5
  nominated. Only the input-KEY zero form reds.
- **Route-upstream templates**: with Task 1.1 applied, End state 9's `sed`/`diff` is empty as claimed;
  End state 5's `grep -B1` over two operands emits filename-prefixed context lines (no visually blank
  line), so the plan's described "live shape" was misleading (R13).
- **The run's sharpest proof — End state 6's OLD-absent half had no guard at all.** A probe implemented
  Tasks 1.1+1.2 faithfully, re-introduced `refused by construction` into the suite, and the task's own
  Done-when gate stayed **GREEN**. Nothing in the repo would red if the retired wording came back.
- **Re-verified after patch** (the one re-run this round owed): with D8b's guard row implemented, gate
  GREEN 109/109; all three mutations red — 3a suite `refused by construction` RED, 3b module
  `refused by construction` RED, 3c suite `positional scan picks it as the results path` RED; End
  state 6's own two-token grep returns **zero hits** with the guard present (no self-match); and both
  fail-closed arms (broken NEW-present anchor, broken extraction banner) red rather than vacuously
  passing. **Hole closed — finding removed, not adjudicated.**
- Sentence-case false-negative reproduced (R14): a re-positioned, sentence-initial
  "Refused by construction:" survives the case-sensitive `grep -n`; `grep -in` catches it.
- Sweep counts re-measured at `8ac52d0`: `grep -rn 'space-separated' skills/` = 15, `-i` form also 15
  (no case-variant carriers today); narrowed `skills/red-team/ docs/adr/` hits exactly the two group
  files — End state 8 is reachable with no unscheduled edit.

## Findings

### Major (all patched)

- **[Major, R1]** A1 nominates End state 1's `--stdin --rounds 3` row as the check for the stdin
  bare-token arm → that row cannot discriminate it: `--rounds` is itself a `--`-prefixed token outside
  the accepted set, so the `--`-token arm refuses first and shadows the bare arm entirely. The row stays
  green with the bare-token arm deleted from `main()`. Evidence: accepted-set analysis against
  `flagValue` / the positional scan at `red-team-gate.mjs`. Resolution: patch applied.
- **[Major, R2]** D5's "one row closes both gaps" is code-traceably false. Evidence:
  `resolveRoundInput` returns from its flag arm (`return Number(flagRaw)`) before the key arm
  (`if (key === undefined || key === null) return undefined`); executed mutant proof — `if (!key)`
  leaves `--stdin --rounds=0` byte-identical, while the input-key form goes silent. Resolution: patched
  to two rows.
- **[Major, needsDecision, R3]** The Commander's Intent Purpose claims no invocation can silently
  suppress the loop-breaker "on any path", but the gate has **two** documented input channels and
  D2/D3's check covers only argv. Evidence: the module's own CLI doc block ("arrive as top-level input
  keys or as `=`-attached flags") + `main()` reading `parsed.rounds`/`parsed.roundLimit` unvalidated.
  Resolution: Purpose scoped to argv + explicit Non-goal (see Adjudications).
- **[Major, needsDecision, R4]** End state 6's OLD-absent half had no mechanical guard — proven by an
  executed probe leaving the gate GREEN with the retired phrase restored. Resolution: new design-tree
  row **D8b** mandating a fail-closed retired-wording doc-guard row with runtime-split needles;
  **re-verified by probe and removed from the finding set.**
- **[Minor→structural, R5]** Backstop entry 1 was over-broad: it deferred the survey half of End state 6
  while the *known* straggler (the suite row title) was invisible to the single-token grep. Resolution:
  straggler promoted into both the two-token grep and the D8b guard; deferral narrowed to unknown
  wording only.
- **[Minor, needsDecision, R6]** End state 10 was commandable-but-judged with no stated reason.
  Resolution: justification added (the `<phase-base>..<tip>` range does not exist at any task's
  pre-merge gate, so no gate member can run it; the execution-evidence seat reads it post-merge).
- **[Minor, needsDecision, R7]** #1366's guard-row work lands on Task 1.2, but neither Task 1.2's commit
  directive nor End state 10 cited #1366 there. Resolution: #1366 added to both.
- **[Minor, needsDecision, R8]** End state 12's `check:` tag seated only one of its two undecidable
  halves. Resolution: both seated (bump presence **and** next-free-patch identity judged at audit_sha).

### Minor (auto-fixed, prose truth)

- **[R9]** Context item 1 overstated file mode's accidental net — it is order-dependent and absent in
  the documented argument order. Patched, and it widens the gap the plan closes.
- **[R10]** "The two blocks are byte-for-byte duplicates" was false at the section level (lenses.md
  carries a guidance comment under the heading; loop-budget.md's sits in a fence). Narrowed to the
  shared `Regrill:`→`Re-entry:` lines, which is what End state 9 already measures.
- **[R11]** The Task-5.5 doc-guard family has **four** rows, not the two the plan named. Corrected; the
  conclusion (none inspects blank-line structure) is unchanged, and 5.5(d) is now cited as D8b's
  fail-closed precedent.
- **[R12]** D3 called `die` "`resolveRoundInput`'s" — it is a `const` closure declared inside `main()`
  *below* the check's insertion point and passed in as the 4th parameter. Corrected with an explicit
  worker instruction not to assume `die` is in scope where the check lands.
- **[R13]** End state 5's stated live shape misdescribed multi-operand `grep -B1` output. Corrected,
  with a single-operand alternative given.
- **[R14]** Both retirement sweeps were case-sensitive — the recorded sentence-case false-negative class,
  reproduced. `-i`/`-rin` now mandatory on End states 6 and 8 and on D8b's needles.

## Resolutions applied (grill decisions)

- R1 → add the discriminating bare-token row → End state 1(b), A1 check column, Task 1.2 slice.
- R2 → pin both zero forms → D5 (rewritten), End state 3(a)/(b), Task 1.2 slice.
- R3 → scope the Purpose to argv; record the key channel as an explicit Non-goal → Commander's Intent
  Purpose, Non-goals (new row).
- R4 → mandate the retired-wording guard → new design-tree row **D8b**, End state 6 (`and gate:` clause),
  Task 1.2 slice (fragment-splitting mandate + fail-closed shape). **Probe-re-verified.**
- R5 → promote the known straggler into the mechanical check; narrow the deferral → End state 6 check,
  Deferred validations bullet 1.
- R6 → add the "why judged" justification → End state 10.
- R7 → cite #1366 on Task 1.2 → End state 10, Task 1.2 "Commits cite …".
- R8 → seat both undecidable halves → End state 12.
- R9–R14 → prose-truth corrections → Context items 1 and 3, D3, End states 5/6/8, Note 1.

## Adjudications

<!-- Machine-readable: the WAR Lead reads these rows and threads them into the auditor prompts. Version precedence: task instruction > red-team adjudication > plan body literal. -->
- **Purpose scope = the argv channel only** supersedes the plan-body Purpose literal "on any path" —
  Commander's Intent + new Non-goal row; the top-level input-KEY channel keeps today's silent-drop
  because the payload's key space is open by construction and a near-miss diagnostic is new design
  beyond this plan's "`main()`-side argument hygiene" constraint — **AI-declared**
- **D5 requires TWO rows (flag form + input-key form)** supersedes the plan-body literal "one row closes
  both gaps" — D5 / End state 3 / Task 1.2 — **AI-declared**
- **D8b retired-wording doc-guard row is REQUIRED, with runtime-split needles and a fail-closed
  NEW-present anchor** — added where the plan previously had no mechanical OLD-absent guard; probe-proven
  to red on all three needle×file mutations without self-matching — **AI-declared**
- **End state 6 and End state 8 greps are case-INSENSITIVE (`-in` / `-rin`)** supersedes the plan-body
  case-sensitive forms — reproduced sentence-case false-negative — **AI-declared**
- **Task 1.2's commits cite #1378, #1347 AND #1366** supersedes the plan-body literal "Commits cite
  #1378 and #1347" — End state 10 + Task 1.2 — **AI-declared**
- **No version literal is adjudicated.** Task 2.1 resolves the next free patch above the live
  integration base at land time from the four slots themselves; every version literal in the plan and
  the campaign roadmap remains non-authoritative.

## Residual risk

- **The input-KEY channel stays silently lossy** (R3, accepted by decision). A typo'd top-level
  `round`-shaped key still resolves `undefined` and omits `routeUpstream`. Recorded as a Non-goal; a
  field recurrence files an issue. This is the one accepted hole of the run.
- **File-mode surplus positionals stay ignored** (A3, pre-existing non-goal, re-confirmed).
- Both End state 6/8 **manual survey halves** remain done-report-only evidence — gate-audit reads them
  SOFT, never a hold. Now narrowed to genuinely unknown wording (R5).
- The **arm-1 blockers-only mutation trace** (End state 4) remains uncommittable by design; the committed
  union assertion is the standing guard. Reproduced by this run's `tests-run-baseline` probe.
- End states 10 and 12 remain judged at audit_sha; both now state why.
- `guard-split-deps-edge` passed: Task 1.2's `deps: [1.1]` correctly edges the doc-guard rows onto the
  task authoring the blank lines, and Build order places 1.2 in a later wave (not merely the same wave).
  The D8b row added this round reads `red-team-gate.mjs` and the suite — **both Task 1.2's own files** —
  so it introduces no new cross-task edge.
- `cross-plan-edge-truth` confirmed A4: `verdict-adjudication-integrity` declares
  `dependsOn: red-team-gate-cli`; `escape-guard-exit-contract` declares no edge; nothing must land
  before this plan; the roadmap carries the 1 → 5 spine edge and the `lenses.md` contention row.
