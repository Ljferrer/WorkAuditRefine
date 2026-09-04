# Red Team — 2026-09-03-in-band-absorb-default (2026-09-03)
**Verdict:** BLOCKED — round 4 (fresh entry seeded at 3, full 12-probe run against the seven-phase plan at `164d26e`) returned 21 blockers and 15 needsDecision rows across seventeen roots; the round limit stays reached, the gate emitted `routeUpstream: true`, and the residual questions go back to the interview (block below)
**Rounds:** 4
<!-- Cumulative grill sweeps: the Step-1 seed + this run's sweeps. Strict form — the next run's seeding re-reads exactly this line; an integer, nothing else. -->

Artifact kind: `impl-plan`. Source of truth: the plan's own Part 1 (merged arm). Repo under test: a `git clone --no-hardlinks` of the plan branch at `5362295` (clean; the real worktree carried an uncommitted run-config edit). Model: opus / high from the run config. Round limit 3. Prior report: none, seed 0.

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility, intent-vs-plan. Bespoke: `default-flip-old-absent` (executed, mandatory drift-guard probe), `baseline-repro` (executed), `command-diff` (executed), `ledger-files-field` (analyzed), `anchor-check` (analyzed), `enum-mirror-guard` (analyzed). Lead-run: `unguarded-new-mirror` pass, `guard-split-deps-edge` pass, `touched-doc-fact-coverage` two gaps patched pre-run, backstop-legitimacy pass, `judge:` grading vacuous, `ff-topology` not triggered (no merge-topology anchor in the plan). Executed in sandbox: four probes. 12 of 12 probes on target, none dropped.
Fallback: none. Escape guard: exit 0 before and after every round (fresh snapshots at `cabd25b`, `e7a3505`, `164d26e`).

Round 4 (fresh entry, seven-phase plan at `164d26e`): six spine lenses plus `default-flip-old-absent`, `phase-ownership`, `gate-audit-route`, `command-diff`, `baseline-repro`, `anchor-check`. 12 of 12 on target, one pass (`claims-vs-reality`), eleven fail. `phase-ownership` found no same-file collision and no missing `deps` edge in the seven-phase shape.

Round 3 (fresh entry, plan at `e7a3505`): six spine lenses plus `default-flip-old-absent`, `baseline-repro`, `command-diff`, `floor-placement`, `enum-mirror-guard`, `anchor-check`. 12 of 12 on target, one pass (`command-diff`: every End-state check red at base, row 6 and row 13 absence clauses flip, Done-when suites green), eleven fail.

Round 2 (this run's second sweep, plan at `cabd25b`): the same six spine lenses plus six bespoke probes aimed at the round-1 additions (`default-flip-old-absent`, `baseline-repro`, `command-diff`, `extractfiles-union`, `enum-mirror-guard`, `anchor-check`). 12 of 12 on target, one pass (`command-diff`: every End-state check red at base, row 8 green, row 6 clause flips, Done-when suites green), ten fail, one warn.

## Executed proof
- `default-flip-old-absent` → the nine enumerated surfaces carry four distinct wordings of the old rule; ADR 0013 documents its own exemption from OLD-absent guards; two test files hold presence pins on the old sentence.
- `baseline-repro` → two `fixRounds >= roundLimit - 2` gates, not three; the batch ace reads `fixRounds < roundLimit`; `sweep-raised absorb` occurs three times (two arms plus a census comment); `skills/war/SKILL.md` is 72,712 B at the plan branch tip (1,016 B free); ledger `files` holds the first `- Files:` block only.
- `command-diff` (round 0) → End states 1 to 7 red at base as expected; End state 8 green at base; the End-state 6 chain was unsatisfiable when met (`grep -c` exits 1 on zero matches); End-state 4's multi-file `grep -c` printed no total.
- `command-diff` (re-verify, round 1, attempt 1) → invalid, self-confound: the Lead restored the sandbox plan to its committed text while the probe was reading it, so it graded the pre-patch draft. Recorded, discarded.
- `command-diff` (re-verify, round 1, attempt 2) → rows 1 to 7 and 9 to 11 red at base, row 8 green (19 tests), row 6's `! grep -qi` clause exits 1 at base and 0 after the merged-arm line is removed, all referenced non-deliverable files exist, four Done-when suites green at base. One Major: rows 2 and 3 still used the bare `grep -c … prints at least N` form, so row 3's floor of 4 was not enforced. Patched to the `test "$(grep -c …)" -ge N` form and stamped adjudicated (re-verify attempts exhausted).

## Findings
Round 1: 40 blockers and 29 `needsDecision` rows, twelve roots, all patched or ruled. Round 2: 29 blockers and 14 `needsDecision` rows, seven roots, five ruled at the regrill and the rest patched. Round 3: 24 blockers and 5 `needsDecision` rows, fourteen roots, four ruled at the regrill and the rest patched. Round 4: 21 blockers and 15 `needsDecision` rows, seventeen roots. Nine need a ruling and are the Route-upstream agenda; eight are enumeration misses and are patched on re-entry. The seven-phase shape itself passed the `phase-ownership` probe clean.

### Round 4 roots
- [Major, needsDecision] The gate-audit family is per-task post-merge, integrated-tip, and end-state-only. All three run after the merge queue and before the sweep. No polish gate-audit seat exists; the polish re-audit is an ordinary roster panel. D15 and D3a name a non-existent seat and a terminal-pass input that the sweep would splice away first. The three gate-audit prompts carry no disposition instruction at all. Agenda.
- [Major, needsDecision] The `--afk` no-match ask lane is Lead-side at the Checkpoint, not engine-side. Three surfaces say so, including the `demote()` header comment. Round 3 decision 3 rested on a wrong premise. Agenda.
- [Major, needsDecision] Release-slot filenames in the sweep exclusion set contradict today's lane: `routeToSweep` names the sweep as a release-slot absorb's vehicle, while the sweep prompt forbids touching slot literals. No canonical release-slot set exists. Agenda.
- [Major, needsDecision] `aceBisect` exhaustion demotes subsets to `follow-up`; `aceReentry` exhaustion routes to the sweep. D5 says "routes to the sweep" and names neither. Agenda.
- [Major, needsDecision] The Workflow has no final-phase input; D3a's non-final/final branch has no signal. Agenda.
- [Major, needsDecision] The terminal budget is unspendable by construction (polish task seeded 0, one charge per run), so End state 14's budget-blocked arm is unreachable. Agenda.
- [Major, needsDecision] The `note` disposition is a fourth lane the plan never names: a fully specified in-diff Minor/Nit disposed `note` escapes the floor. Agenda.
- [Major, needsDecision] The auditor card's 757 B is budgeted for Phase 3 only; Phase 4's gate-audit rewrite is a second unbudgeted growth. Agenda.
- [Minor, needsDecision] Never-merged tasks' rows file with no barrier and no `demote()`; the Purpose's "only" clause does not name that path. Agenda.
- [Major] End state 14's grep is blind to the wrapped comment copies; the absence proof belongs in a normalized-scan fixture. Patched.
- [Major] D12 census: `budget-raise-floor.md` has two occurrences (a line-3 provenance sentence and the line-44 link); `refiner-recovery.md` has none and names the section in prose. Patched.
- [Major] `skills/war/SKILL.md`'s `--ace` bullet Residual rule states the retired ace-off demote; Phase 4 Task 2 must own it. Patched.
- [Major] The behavioral test `disposition defaults (criterion 3)` and its sibling assert the old defaults; Task 3.1 must re-key them. Patched.
- [Major] The `economy-ace-flip` row anchored on `economy` is unsatisfiable; anchoring on `ace` with off/false within ~110 chars and `economy` within ~160 matches all five surfaces and passes the lawful rewrites. Patched.
- [Major] The `#1550 (D7)` ask order-census pins `dispositionOf` sites at exactly five; D15's producer must join it, and three #1692 comment blocks plus the `parkAsk` header census need rewording. Patched.
- [Minor] `args.sweepExclude` as a bare file list loses the owner slug; the release-slot arm has no owner. Patched: slug-attributed entries and a fixed owner string for the slot arm.
- [Minor] `[−-]` in End state 5's grep is multi-byte and locale-fragile; case-sensitive greps in End states 6 and 12. Patched.

### Round 3 roots

### Round 3 roots
- [Major, needsDecision] `DEMOTE_REASONS` census: two `demote` sites build the reason head from a runtime variable (`provDrainCause`, `sweepDrainCause`) and two route to `follow-up` through a severity ternary. A static literal census cannot read the first pair or see the second. Agenda.
- [Major, needsDecision] `run.absorbRounds: null`: the `run.roundLimit` validator hard-rejects null, and `deepMerge` copies an explicit null over the default, so "null reads as unset" resolves to null, not 6. Agenda.
- [Major, needsDecision] Two Lead-side filing lanes (the `--afk` no-match ask demotion and ruled-ask filing) carry neither a `barrier` tag nor a `DEMOTE_REASONS` prefix, so the Purpose sentence is unsatisfied by any End state. Agenda.
- [Major, needsDecision] Gate-audit-family seats sink their Minor/Nits into `auditLog` only; the Purpose's "found by a seat" reaches them and nothing routes them. Agenda.
- [Major] `D41` in `skill-doc-contracts.test.mjs` pins the retired conjunction present on `skills/war/SKILL.md`; a third pin the plan never named.
- [Major] Four emitted strings state `roundLimit − 2`, not two; `workflow-template.js` is missing from that OLD-absent row.
- [Major] `war-config.test.mjs`'s `meta-guard(F07)` pins exactly five mirror markers in `workflow-template.js` and keeps the mirror registries; Task 1.2 adds three markers and does not own the file.
- [Major] README.md states the economy-ace fact twice; the `economy-ace-flip` anchor "economy preset" misses line 140 and `war-room` line 14; `schemas.md` line 283 has no authoring slice.
- [Major] The polish task's integration-branch `absorbCharges` clause maps to no task.
- [Major] The re-entry `Ace-Subset` trailer's distinctness rides the `fixRounds` index the plan stops advancing.
- [Major] The `absorb … never a default` shape matches a lawful rewrite and hits no living surface; the normalization must strip single quotes to reach the two `workflow-template.js` comments.
- [Major] ADR 0013 states the reserve arithmetic at three sites; the arithmetic row neither includes nor exempts it and the amendment omits the supersession note.
- [Major] Five inbound references target the evicted `## Gate-failure classification` heading (three in-card anchors, `budget-raise-floor.md`, `refiner-recovery.md`).
- [Major] A floor reroute never removes the row from `minorsFiled` or its key from `filedKeys`, so the finding both absorbs and files.
- [Minor] `MIRROR_REGISTRY`'s `behavioral` mode already expresses a scalar; the barrier prompt forbids free git reads and needs an explicit allowance for the trailer read; five paths reach filed rows without a merge result; `files-union` count is 4 not 5; the ace-off terminal-pass fixture belongs to Task 2.1; `terminal pass` and `carried queue` glossary terms are double-assigned to Tasks 1.3 and 2.2; the row 6 and row 13 absence greps are case-sensitive or miss a wrapped comment copy.

### Round 2 roots

### Round 2 roots
- [Critical, needsDecision] D4 floor placement: at the file-followups dispatch every absorb vehicle has closed (`phaseCloseQueue` is spliced empty by the sweep, the ace ladder is wave-side, the land has run). A reroute to `absorb` there has no lane. Also `minorsFiled` mixes seat rows with engine `demote()` rows that carry no `barrier`. Agenda.
- [Major, needsDecision] `agents/war-refiner.md` has 113 B of hard headroom (36,751 B against 36,864 B). Task 1.2's `diff_files` clause does not fit. Evict or raise. Agenda.
- [Major, needsDecision] No `fixRounds` re-derivation from the task branch exists; `fixRounds` is seeded from the in-process round index. The sandbox cannot read git. `absorbRounds` needs a real relaunch source. The bisect subset trailer carries no round index and the batch ace carries no trailer. Agenda.
- [Major, needsDecision] The Purpose's four lawful engine filers are a closed list, but about 22 `demote(f,'follow-up',…)` arms survive the plan. Agenda.
- [Major, needsDecision] With `run.ace: false` (economy preset) a defaulted `absorb` demotes straight to `follow-up`, so the flip files more issues than today. Agenda.
- [Major] `dispositionOf`'s header comment names `absorb` and is not ask-only; three sites clear in `workflow-template.js`, one survives. "args-contract comment" is the AUDIT_VERDICT schema comment. Factual.
- [Major] Retired `roundLimit − 2` arithmetic also lives in `disposition-eligibility.md` widening 1, `schemas.md`'s re-entry row, `CONTEXT.md`'s **Re-entry** entry, seven engine comments, and two log strings. Factual: widen Task 1.2 and 1.3.
- [Major] The 40-character proximity assert false-positives on the lawful new sentence. Factual: assert the exact retired conjunction shapes.
- [Major] `extractFiles` takes lines, not a path; a path returns `[]` silently. Factual: Task 1.4 exports `extractFilesFromPlanFile`, D6 names it, empty union from a present ledger logs.
- [Major] End state 10's `terminal pass` grep misses the hyphenated form the plan itself prescribes. Factual.
- [Major] The terminal pass lacks a release-slot filter and fixture. Factual: filter through `aceEligible`.
- [Major] Hoisting `aceRelPath` breaks the `ace-group-path` extraction pin. Factual: name the re-key.
- [Minor] `D37a` requires the retiring literal present on CONTEXT.md and CLAUDE.md; two pins quote the DISPOSITION RULE sentence (4447 and 11702); the polish pseudo-task has no counter field; `held:phase-incomplete` is never emitted (census over emitted holds, both return sites); the `absorbRounds` fallback guard's home is `war-config.test.mjs`'s roundLimit idiom, not MIRROR_REGISTRY; Task 2.2 needs `deps: [1]`; D1 and D4 disagree on `barrier:trade-off` without `ask`; the `files-union` fallback composition is unpinned; two more `demote` arms are unenumerated.

### Round 1 roots (all patched or ruled)

### Critical
- [Critical, needsDecision] D3b: the handoff block emits only on `landed` and `held:escalation` → five hold classes have no vehicle for `carriedPhaseClose`. Evidence: `workflow-template.js` handoff gate vs the held-phase drain. Resolution: ruled (root 3).
- [Critical, needsDecision] D5/PIN-7: the two reserve gates are the reserve's only enforcement and ace-side commits still charge `fixRounds` → swapping the gates deletes the reserve the guardrail calls untouched. Evidence: `fixRounds++` at the subset, re-entry, and batch-ace sites. Resolution: ruled (root 1).

### Major
- Gate count: two `fixRounds >= roundLimit - 2` gates exist, the plan said three; the batch-ace gate's disposition was unstated. Patched (root 1).
- `D43` in `skill-doc-contracts.test.mjs` binds three living docs to the retired `roundLimit − 2` arithmetic. Patched into Task 1.3 (root 3 of the factual set).
- Two sweep-raised demote arms sit on exclusive branches; the discard path had no successor. Ruled (root 2).
- D3a said read-only, Task 2.1 said an ace-shaped commit. Ruled (root 2).
- A third `sweep-raised absorb` occurrence lives in a census comment. Patched.
- End state 6's `grep -c … prints 0` broke the `&&` chain and was case-sensitive. Patched to `! grep -qi`.
- ADR 0013 sat in the OLD-absent row against the append-only law and its own exemption idiom. Patched: eight surfaces, ADR NEW-present.
- The old sentence has four live variants and two `ask`-only sentences must survive. Patched: case-insensitive normalized assert scoped to the absorb half.
- Task 1.2's slice named only two of the six occurrences in its own files. Patched.
- The barrier list's trade-off item routes `ask`, so it is not a follow-up barrier, and no token vocabulary existed. Ruled (root 4).
- No canonical source or drift guard for the barrier list across card, prompt, and eligibility doc. Ruled (root 4).
- Purpose said only a barrier may file; End states 3 and 6 file on engine demotions. Ruled (root 4).
- Phase 3 had no End state. Patched: End states 9 and 10.
- Ledger `files` is first-block-only, so D6's exclusion set would fence one task per plan. Ruled (root 5).
- #1547's `## Evidence artifacts` rows were missing from the Evidence-consumed block. Patched.
- `skills/war/SKILL.md` headroom is 1,016 B, not 1,216 B. Patched.

### Minor (18, auto-noted)
`campaign-ledger.mjs` exports nine symbols, not two (patched); only the `economy` preset carries a `run` block (patched); End state 4's multi-file `grep -c` (patched); End state 8 in no Done-when (patched into Task 1.2); ADR 0012 line placed a phase before the construct exists (moved to Task 2.2); `aceRelPath` is block-scoped inside the wave loop (patched: hoist); the `schemas.md` occurrence is uppercase (covered by the case-insensitive assert); test files hold presence pins on the old sentence (covered by Task 1.2's re-key).

## Resolutions applied (grill decisions)
- Root 1, absorb budget vs `fixRounds` → ace-side commits charge `absorbRounds` only; all three ace gates read it; labels and the `Ace-Subset` trailer carry it; relaunch re-derives it from the branch → D5, PIN-7, End state 4, Task 1.2.
- Root 2, terminal pass → one ace-shaped commit then one seat; merged-sweep path only; discard arm stays reworded and carries on a non-final phase; regression forward-reverts then carries or demotes → D3a, PIN-4, End state 6, Task 2.1.
- Root 3, held carry → `carriedPhaseClose` is a top-level phase-return key on every hold, empty array on `landed`; the Lead reads the return; transcript re-derivation is the recorded residual → D3b, End state 7, Task 2.1, Task 3.1.
- Root 4, barrier tokens → `BARRIER_TOKENS` canonical in `land-decision.mjs`, mirrored with a registry row; structured `barrier` field on AUDIT_VERDICT; floor reads the field; `barrier:trade-off` routes `ask`; Purpose names the lawful engine filers → D1, D4, guardrails, End states 1 and 5, Task 1.2.
- Root 5, ledger footprint → new Task 1.4 makes `extractFiles` union every `- Files:` block; the Lead re-extracts at launch → D6, D11, End state 11, Task 1.4, Task 3.1.
- Factual roots (gate count, `D43`, census comment, check forms, ADR exemption, variants, occurrences, Phase 3 End states, evidence rows, byte headroom, minors) → patched in place.

## Adjudications
- Task 1.1's `/war-room` row states the shape only and points at `war-config.mjs` for the value (de-mirror) supersedes the row restating the default — touched-doc probe, pre-run — operator-ratified (2026-09-03)
- Task 2.1's two `schemas.md` rows carry pins in the `done_when_log_path` schema-slot shape supersedes rows without pins — touched-doc probe, pre-run — operator-ratified (2026-09-03)
- "Two `fixRounds >= roundLimit - 2` gates plus the batch ace's `fixRounds < roundLimit`" supersedes "three `fixRounds >= roundLimit - 2` gates" — Context, D5, Task 1.2 — operator-ratified (2026-09-03)
- "Ace-side commits charge `absorbRounds` only" supersedes the implicit continued `fixRounds` charge — D5, PIN-7 — operator-ratified (2026-09-03)
- "One ace-shaped commit then one seat; merged-sweep path only; discard arm stays" supersedes "read-only re-audit; both arms retired" — D3a, PIN-4, Task 2.1 — operator-ratified (2026-09-03)
- "`carriedPhaseClose` on the phase return for every hold" supersedes "handoff key" — D3b, End state 7 — operator-ratified (2026-09-03)
- "`BARRIER_TOKENS` enum in `land-decision.mjs`, structured `barrier` field, three follow-up barriers plus one ask route" supersedes "four prose barriers matched by substring" — D1, D4, End states 1 and 5 — operator-ratified (2026-09-03)
- "Only a seat-cited barrier tag or a logged engine demotion may file an issue" supersedes "only a barrier from the closed list may file" — Purpose — operator-ratified (2026-09-03)
- "The Lead re-extracts footprints with the exported `extractFiles` at launch; Task 1.4 unions every `- Files:` block" supersedes "no plan-file re-extraction, no new export" — D6, D11, Task 1.4, Task 3.1 — operator-ratified (2026-09-03)
- Eight living surfaces in the `old-default-absent` row, ADR 0013 NEW-present by amendment, supersedes nine surfaces with ADR 0013 OLD-absent — Task 1.3, End state 2 — operator-ratified (2026-09-03)
- `skills/war/SKILL.md` 72,712 B / 1,016 B free at `5362295` supersedes 72,512 B / 1,216 B — Context, A8 — AI-declared

## Route upstream
**Regrill:** `/war-strategy /Users/ljf/GitHub/WorkAuditRefine/docs/plans/2026-09-03-in-band-absorb-default.md` — run the interview on the agenda below; it patches the plan.
**Agenda (residual questions), round 4:**
- Gate-audit family reality: re-enumerate as per-task post-merge / integrated-tip / end-state-only, all before the sweep; their `phaseClose` absorbs drain in the sweep; the terminal pass's input is the polish panel's absorbs plus sweep leftovers; thread the DISPOSITION RULE and `barrier` field onto the three gate-audit prompts. Or keep D15 as written and move a seat after the polish merge.
- `--afk` no-match ask lane: (a) withdraw the `demote:ask-unruled-afk` clause and record the lane as Lead-side beside ruled-ask filing; (b) keep the prefix Lead-side, owned by Phase 6 Task 1's Checkpoint prose with a `skill-doc-contracts` pin.
- Release-slot files: (a) keep them in the sweep exclusion set (demote, owner "the release slot"), retire the `routeToSweep` release-slot comment, add a canonical `RELEASE_SLOT_FILES` export; (b) keep today's lane and drop them from the set.
- `aceBisect` exhaustion: (a) convert its `demote()` to `routeToSweep()` so both reserve stops route to the sweep; (b) keep the demote and scope D5's sentence to the other two gates.
- Phase finality: (a) add `args.finalPhase`, Lead-threaded, absent reads as final; (b) drop the branch and always carry.
- Terminal budget: (a) charge for telemetry only, drop the budget-blocked arm; (b) a real run-scoped bound.
- `note` lane: (a) the floor reroutes a `note` with an in-diff file and a fix text to `absorb` + `phaseClose:true`; (b) leave `note` alone.
- Auditor card bytes in Phase 4: (a) evict the six-bullet `execution-evidence` checklist to `references/` and fund the routing sentence; (b) a net-neutral pledge.
- Never-merged tasks: (a) the Purpose names "a logged floor-skip" as a lawful filer; (b) a barrier check on that path.

**Agenda (residual questions), round 3 (ruled at the regrill, kept for the record):**
- `DEMOTE_REASONS` enforcement: (a) runtime, `demote()` validates or prepends the prefix on every reason it writes, census asserts the boundary plus a call-site count that includes the ternary shape; (b) static, rewrite the two variable-head sites and widen the matcher to the ternary shape.
- `run.absorbRounds: null`: (a) normalize null to `DEFAULTS.run.absorbRounds` after `fillDefaults`, fixture asserts the resolved value is 6; (b) drop the null carve-out and mirror `run.roundLimit`'s hard reject.
- Lead-side ask filings: (a) narrow the Purpose to engine- and seat-filed issues and record Lead-side ask filings under Non-goals; (b) extend an End state to bind those two lanes to a prefix.
- Gate-audit-family Minor/Nits: (a) Non-goals line, the `auditLog`-only sink stays; (b) an End state and Task 1.2 arm routing that lane into the phase-close queue under the exclusion set.
- Plan shape: split Task 1.2 across sequential phases so each red-team round and each auditor roster reads one mechanism family.

**Agenda (residual questions), round 2 (ruled at the regrill, kept for the record):**
- D4 floor placement: (a) run the floor per task in the serial merge queue right after the merge dispatch returns `diff_files`, both reroutes go `phaseClose:true` to the sweep, seat rows only (engine `demote()` rows carry an `engineFiled` stamp the floor skips); (b) keep it at filing and route reroutes into `carriedPhaseClose`; (c) keep it at filing as a filing-only reroute that files nothing. The gate saw a Critical: option-less as written.
- Refiner card headroom (113 B): (a) evict a cold refiner-card block to `references/` under ADR 0042 in Task 1.2, sized for the `diff_files` clause; (b) a second operator-ratified Budget-Raise trailer.
- `absorbRounds` relaunch source: (a) every ace-side commit carries an `Ace-Charge:` trailer and the phase-start git-topology barrier dispatch returns a per-task count; (b) the Lead threads `args.absorbRoundsSeed` per task; (c) accept a per-run reset with a log. The plan's "the way `fixRounds` is re-derived" anchor does not exist.
- Lawful engine filers: (a) the Purpose names the class "logged engine demotion" and Task 1.2 lands a default-deny census over every `demote(f,'follow-up',…)` call site against a closed reason-prefix enum; (b) widen the prose list to every surviving arm.
- `run.ace: false` runs: (a) the flipped default routes `phaseClose:true` to the sweep when ace is off; (b) the flip applies only when `run.ace` is on and the Purpose says so; (c) `absorb requires --ace` becomes a named lawful filer.

**Re-entry:** `/red-team /Users/ljf/GitHub/WorkAuditRefine/docs/plans/2026-09-03-in-band-absorb-default.md` — after the regrill; the fresh run seeds its cumulative count from this report's `**Rounds:**` line.

## Residual risk
- `agents/war-auditor.md` has 757 B of hard headroom. The D1 sentence rewrite plus the `barrier` field clause must be net-neutral or evict a paragraph to `disposition-eligibility.md` (A8).
- The `filing-floor` in-diff arm depends on `MERGE_RESULT.diff_files` from the refiner's merge dispatch (A7). Absent list ⇒ the arm skips with a log.
- A Workflow that throws before returning loses `carriedPhaseClose`. The Lead re-derives from transcripts (recorded residual, Task 3.1).
- The study rerun backstop needs two live runs after the release.
- The patched End-state checks were re-verified red at base by the round-1 `command-diff` re-run; rows 2 and 3's final form and every other patched blocker are adjudicated, not re-proven.
- Round-4 gate at terminal: 12 of 12 probes on target, 21 blockers and 15 needsDecision rows unstamped, 10 minors, `routeUpstream: true` at rounds 4 of limit 3.
- Round 3 decision 3 (the `--afk` no-match lane is engine-side) was wrong on the facts; round 4 caught it. Re-ruled on the round-4 agenda.
- Pattern across three rounds: every round's new roots were enumeration misses on the surfaces the previous round's patches touched (pins, call sites, doc restatements). The plan's Task 1.2 bundles seven mechanisms in one engine diff, which is why each round finds the next layer.
