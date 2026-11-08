# Engine comment and duplication tidy — fix false comments and fold small copies in workflow-template.js

Converted by the `/war-machine` drafter from `docs/specs/2026-11-08-engine-comment-and-duplication-tidy-design.md`
(Part 1 is its decision digest; every spec ledger row is carried forward or retired with a stated reason).
Campaign position: sixth of nine. It stacks on `docs/plans/2026-11-08-model-routing-and-prompt-byte-budgets.md`
and comes before `docs/plans/2026-11-08-doc-truth-drift-and-adr-hygiene.md`.
Issues claimed (19): #2140, #2145, #2146, #2180, #2198, #2199, #2200, #2202, #2203, #2223, #2227, #2240,
#2246, #2271, #2313, #2316, #2317, #2552, #2553. All 19 were open on 2026-11-08.

**Evidence consumed** — one row per linked evidence artifact:
- `docs/specs/2026-11-08-engine-comment-and-duplication-tidy-design.md` §1–§10 at `365f3da2` · read
- issues #2140, #2145, #2146 artifacts: pinned sha `abbc7262`, `skills/war/assets/workflow-template.js` · read (the `parkAsk` header and the collision ternary are present at the pin; constructs re-read by name at `35aa4144`)
- issue #2180 artifacts: pinned sha `f78656e7`, `skills/war/assets/workflow-template.js` (rows 22 and 40) · read (`gateLogPath=` present at the pin)
- issues #2198, #2199, #2200, #2202, #2203 artifacts: pinned sha `ba779437`, `skills/war/assets/workflow-template.js` · read (`deliberately adjudications-only`, `const scanText`, `const PLAN_ID_RE`, `const ownPlanStem` present at the pin)
- issues #2223, #2227 artifacts: pinned sha `3d05c6e8`, `skills/war/assets/workflow-template.js` · read (the `#1873-class` comment and `#3f55b04` present at the pin); commits `3f55b04c` and `c0f88d06` · read by `git log --oneline -1`
- issues #2240, #2246 artifacts: pinned sha `55afc1c8`, `skills/war/assets/workflow-template.js` (four header lines; the `drainCauseOf` header) · read
- issue #2271 artifacts: pinned sha `01bd9df8`, `skills/war/assets/workflow-template.js` · read
- issue #2313 artifacts: pinned sha `cc4e3842`, `skills/war/assets/workflow-template.js` · read
- issues #2316, #2317 artifacts: pinned sha `d3f131bd`, `skills/war/assets/workflow-template.js` and `skills/war/references/backward-chain-worker.md` · read
- issues #2552, #2553 · no `## Evidence artifacts` section · vacuously satisfied (bodies read in full)
- `docs/plans/2026-11-08-args-floor-and-launch-preflight.md` T1.1, PIN-12, A20 and OD-1 · read by the finalize seat on 2026-11-08 (the `FLOOR_BINDINGS` export, the `provenance mirror: the shipped slice is self-contained` test, and the ruling that this plan's T1.1 adds the binding line)
- DocTrail WorkAuditRefine/reports/2026-11-06-discarded-polish-refs · read `patches/2026-09-03-in-band-absorb-default__p2-polish.patch` (the 14-item finding list of the phase-2 close sweep, items 6, 7, 8 and 10) by the evidence fold seat on 2026-11-08
- DocTrail WorkAuditRefine/reports/2026-11-06-session-worktree-leftovers · read `war-fable-opus-audit-loops-0592b7/files/.claude/teams/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/ledger.json` (phase 3 `notes_lead` Gate-2 promotion line) by the evidence fold seat on 2026-11-08, WAR 0.21.12

**Trials run** — one row per trial:
bounds: wall 600 s · cmd 120 s · excerpt 20 · config: .claude/war/config.json (section present) · overrides: none · trial tier: drafter session (no subagent)
tokens: n/a · wall: 4 min (source: n/a)
escape-guard: unsettled
- TRIAL-1 · fact · does building `stripSupersedes`'s regex and `isValueRow`'s bare-citation arm from `PLAN_ID_RE.source` keep the engine tests green in plain and in staged form? · settles: D6 / A6 · if A (both runs fail 0): build both from the source · if B (any red): keep the literals and add a source-compare test · bound: wall 600 s · cmd 120 s · base: 365f3da2 · sandbox: <scratchpad>/trial-1 · guard: snapshot 0 / baseline 1, foreign (an untracked `docs/plans/2026-11-08-args-floor-and-launch-preflight.md` written by a sibling drafter session inside the window; this trial wrote nothing in the checkout) · cap: unenforced (the session's command checker refused the cap wrapper; the wall cap bounded the run) · result: settled — A · removed: <scratchpad>/trial-1 · wall: 2 min
    ```
    command: node --test skills/war/assets/workflow-template.engine-1.test.mjs ; WAR_TEMPLATE_STRIPPED=1 node --test skills/war/assets/workflow-template.engine-1.test.mjs
    edit before the run: the two inline literals replaced by new RegExp('supersedes[\\s:]*(?:plan literal:\\s*)?' + PLAN_ID_RE.source, 'gi') and new RegExp('^\\S{1,64} supersedes:? ' + PLAN_ID_RE.source + '\\s*$'); the grep -cF count of the class then printed 1
    observed (plain): ℹ tests 1163 · ℹ pass 1163 · ℹ fail 0
    observed (staged): ℹ tests 1163 · ℹ pass 1163 · ℹ fail 0
    ```
- TRIAL-2 · sweep · End-state checks red at base · result: infra-failed — dirty tree (the same foreign untracked sibling plan sat in the shared checkout, so the guard refused the snapshot and no clone ran; not retried, because the tree stays dirty while sibling drafters run)
- TRIAL-3 · pair · D1 phase split · brief: nineteen items on one file, ten of them comment-only; two Phase 2 comments (`parkAsk`'s header for #2140, the `phaseDiffFiles` comment for #2553) sit beside Phase 1 code edits (#2145, #2180); criteria: the comment describes landed code · one owner per phase · audit passes · rebase churn · candidates: (a) two serial engine phases (code first, comments second) · (b) one engine task in one phase · scores: (a) describes landed code 2, one owner 2, audit passes 1, churn 2 = 7 · (b) 1, 2, 2, 2 = 7, tie broken on the first criterion (the plan's purpose) · chosen: (a) · AI-declared (revise seat, no operator in the loop) · rejected: (b), a comment written in the same diff as the code it names is audited against a moving target · graft: none · if wrong: one extra audit pass on a comment-only diff · caught by: the Phase 2 audit record reads approve in one round with every construct unchanged since the Phase 1 land; the Lead may then merge the two tasks at decompose (A1) · base: 35aa4144 · sandbox: none (a pair beat runs no code) · wall: 0 min

Each End state below records red-at-base from read-only greps run in the checkout at `365f3da2`
instead. Those reads are authoring measurements, not trial rows.

**Critical path** — one line per End state:
- End states 1–12 ← T1.1 (bottleneck: T1.1, because every Phase 2 comment must describe Phase 1's final code).
- End states 15–19 ← T2.1 ← (phase edge) T1.1 landed.
- End states 13, 14 and 20 are guardrail End states with no single owning task; every task serves them.
- End state 21 ← T3.1 (release). End state 22 ← backstop row 1.
- The Region C chain (provenance floor), the #2317 chain (worker surfaces) and the #2552 chain (segment wrapper) share no link. They join at one file, `workflow-template.js`, so they fold into one task.

## Context — the gap / problem

Nineteen open follow-ups name one file: the per-phase Workflow engine `skills/war/assets/workflow-template.js`.
Most are comments that state something the code does not do. The class recurs in run evidence: one phase-2
close sweep of the 2026-09-03 in-band-absorb-default run queued 14 findings, and at least four were comment or
message lag in this file (a re-entry comment that still claimed replay stability, an assertion message naming a
retired label scheme, a `dispositionOf` site count, and a `$TIP` rationale comment) (verified: DocTrail
WorkAuditRefine/reports/2026-11-06-discarded-polish-refs/patches/2026-09-03-in-band-absorb-default__p2-polish.patch).
A few are small copies of one rule with
nothing binding them. Two change dispatched prompt bytes, #2180 and #2317 (verified: the `evItems` row builder
and `BACKWARD_CHAIN_WORKER_RULES` at `35aa4144`); a third, #2198, edits a prompt-feeding builder (`adjRow`)
byte-stably. Issue line numbers
are stale; every item is anchored by construct name. The worktree base `365f3da2` carries the engine
bytes of `35aa4144`. `master` has since moved to `279a0d4a` (#2622 and #2624), and that diff touches none of the
constructs below (verified: grep of `git diff 35aa4144 279a0d4a -- skills/war/assets/workflow-template.js` for
every construct name at `279a0d4a`; `parkAsk` gains one new caller, `parkFixless`, and its header and collision
log are unchanged; `aceRelSet` moved to module level, and no task here edits it).

**Region A — parked asks and the queued-key registry.**
- The `parkAsk` header says one seat on a second file survives the merge, then says the own-raiser skip
  means "the handoff row counts distinct seats". The dedup predicate `same` reads seat, file and title, so
  one seat on two files lands two entries (verified: issue #2140 (2026-09-07)). The clause repeats in the
  own-raiser fixture comment in `workflow-template.engine-1.test.mjs` (verified: grep `counts distinct seats` at `35aa4144`).
  The same header was already recorded as wrong from its own landing commit: the 2026-09-06 run's phase 3
  servitor promoted a `parkask-header-comment-miscounts-its-own-dedup-predicates-effect` lesson (verified: DocTrail
  WorkAuditRefine/reports/2026-11-06-session-worktree-leftovers/war-fable-opus-audit-loops-0592b7/files/.claude/teams/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/ledger.json,
  WAR 0.21.12).
- The collision `log()` in `parkAsk` holds a ternary of two prose clauses (verified: issue #2145 (2026-09-07)).
  Tests match only `merged as corroboration` and `on docs/y.md`; no test pins the two clauses
  (verified: grep of `skills/war/assets/*.test.mjs` at `35aa4144`).
- The comment above `queuedKeys` lists its producers by hand; its sibling `filedKeys` and the `aceRelPath`
  comment say "a new caller joins by …" instead (verified: issue #2146 (2026-09-07)).

**Region B — the evidence dispatch.** The `EVIDENCE DISPATCH` prompt renders a `gateLogPath` column in its
header and in every `evItems` row. No step and no return field reads it (verified: issue #2180 (2026-09-08)).
`agents/war-refiner.md` never names it (verified: `grep -c gateLogPath agents/war-refiner.md` prints 0 at
`35aa4144`). Two tests pin it: the fallback test asserts `evP.includes('gateLogPath=' + absent)`, and the
#2182 test asserts `!/gateLogPath=[^\n]*gate-t1\.log/.test(ev)` (verified: `workflow-template.engine-1.test.mjs` at `35aa4144`).
Two harness constructs read it too: `preMergeTipOf` anchors its regex on the trailing ` · gateLogPath=` text,
and `BARE_INTERPOLATION_CENSUS` lists `e.gateLogPath` with a comment clause (verified:
`workflow-template.test-harness.mjs` at `35aa4144`). Dropping the column without those two edits reds the
#806 and #2485 rows and the census row (verified: the grill's sandbox run at `35aa4144`, 7 fails).

**Region C — the own-token provenance floor.**
- `adjRow` renders `<value> (supersedes plan literal: <x>)`. `isValueRow`'s string arm restates that suffix
  as a regex, with nothing binding them; an earlier equality assert was reverted whole by the ace ladder
  (verified: issue #2198 (2026-09-08)). `adjRow` feeds `adjudicationClause`, which rides auditor prompts
  (verified: the `adjudications.map` row builder of `adjudicationClause` at `35aa4144`). The literal appears
  twice in code, `adjRow` and `isValueRow` (verified: `grep -v '^\s*//' | grep -c 'supersedes plan literal'`
  prints 2 at `35aa4144`). `BARE_INTERPOLATION_CENSUS` lists `r.supersedes`, so the `adjRow` rewrite must keep
  that interpolation bare or move the census (verified: the harness census and the grill's sandbox at `35aa4144`:
  only `" (" + SUPERSEDES_LITERAL + pt`${r.supersedes})`` left the census unchanged).
- `ownPlanStem` and `ownPlanBase` repeat one guard and one basename step (verified: issue #2199 (2026-09-08)).
  Both consumers of `ownPlanStem` lowercase it, and the #1767 fallback log prints `ownTokens[0]`, which is
  already lowercased (verified: the `if (!ownTokens.length && ownPlanStem)` arm at `35aa4144`).
- The comment above `ruledAskRowText` says the #1751 strip is "deliberately adjudications-only", but
  `provenanceSurfaces` maps `rowText` over `backstops` too (verified: issue #2200 (2026-09-08)).
- `scanText` is joined but only its truthiness is read, in `ownTokenMiss` (verified: issue #2202 (2026-09-08)).
- `PLAN_ID_RE` hoists the plan-id class, but `stripSupersedes` and `isValueRow`'s bare-citation arm write it
  out again: three copies (verified: issue #2203 (2026-09-08); `grep -cF` prints 3 at `35aa4144`).

**Region D — ace, terminal-pass and chain-digest comments.**
- The terminal-pass merged arm's `#1873-class` comment omits that the arm has no touched-file gate, so it
  inherits the ruled residual stated only at the ace batch site (verified: issue #2223 (2026-09-08)).
- The `queuedFindingRow` header cites `#3f55b04` as an issue and as the drift; `3f55b04c` is the fix and
  `c0f88d06` the drift (verified: issue #2227 (2026-09-08); `git log --oneline -1` of each at `35aa4144`).
- The `aceReaudit` comment says the re-audit "reads one more than the fixer it judges" without the zero-sum
  caveat the canonical `correctiveRoundOf` comment carries (verified: issue #2313 (2026-09-12)).
- The `throughRound` comment above `chainDigest` says "chainRecordFix runs before the absorbRounds charge".
  At all three ace sites `r.task.absorbRounds++` runs first; the real reason is that `chainRound` is
  captured by `correctiveRoundOf('ace', r.task)` before the charge (verified: issue #2316 (2026-09-13)).

**Region E — carry, filing and gate-audit comments.**
- The `carryPhaseClose` header and the `carriedPhaseClose` declaration comment say a discarded sweep's
  absorbs carry "except the approve trail". That holds for queued rows only (verified: issue #2271 (2026-09-08)).
- The `drainCauseOf` header says both readers sit outside any local try; the filing-prompt row builder sits
  inside the file-followups `try` (verified: issue #2246 (2026-09-08)).
- The comment above `let phaseDiffFiles = null` says the note arm "then skips with a log"; #2058 retired that
  skip (verified: issue #2553 (2026-10-31); `const phaseDiff = phaseDiffFiles === null ? new Set() : phaseDiffFiles` at `35aa4144`).
- Four header blocks run past their ~100-column wrap: `routeGateAuditRows`, `carriedPhaseClose`,
  `carryPhaseClose` and the demote ladder (verified: issue #2240 (2026-09-08)).

**Region F — two-surface and duplicated wrappers.**
- Worker rule 1 in `BACKWARD_CHAIN_WORKER_RULES` (byte-equal to `skills/war/references/backward-chain-worker.md`)
  says "the prepended `DEPS ALREADY MERGED:` dispatch clause"; `agents/war-worker.md` keys the same trigger on
  the longer literal plus a parenthetical. One trigger, two discriminators (verified: issue #2317 (2026-09-13)).
  `depClause(task)` opens every deps-bearing work prompt (verified: `w2.prompt.startsWith('DEPS ALREADY MERGED')`
  in `workflow-template.engine-1.test.mjs` at `35aa4144`).
- `segmentedMerge` and `segmentedLand` each repeat the re-dispatch log, continuation wrapper and exhaustion
  log around `segmentLoop` (verified: issue #2552 (2026-10-31)). Tests pin `segmented-gate budget exhausted`
  and `segmented-land budget exhausted` (verified: `workflow-template.engine-1.test.mjs` at `35aa4144`).

## Pivotal constraints

1. Every item lands after the engine behavior plans, so each comment describes final code. Each construct is
   re-read by name at the rebased tip before it is edited (spec §2 constraint 1; the chain order is A12).
2. Comment-only items change no behavior and no dispatched prompt byte. Code items (#2145, #2199, #2202,
   #2203, #2552) keep every log string and prompt byte a test pins.
3. Both-surfaces rule: a dispatched worker or refiner prompt change lands with its `agents/*.md` card in the
   same commit (#2317 worker; #2180 refiner, whose card needs no edit).
4. `workflow-template.js` has one owner per phase. Same file means same task.
5. Test edits go in `workflow-template.engine-1.test.mjs`, `backward-chain.test.mjs` and, for the two
   `gateLogPath` readers, `workflow-template.test-harness.mjs` (the `preMergeTipOf` regex and the
   `BARE_INTERPOLATION_CENSUS` entry `e.gateLogPath` with its comment clause). No new test file and no new
   harness export, so the export lists and the `runForm` census do not move (verified:
   `workflow-template.test-harness.mjs` header and `preMergeTipOf` at `35aa4144`).
6. The repo gate never sets `WAR_TEMPLATE_STRIPPED=1`, so each code task runs the staged form itself
   (verified: `stage-workflow.test.mjs` sets the flag only inside its own runs at `35aa4144`).
7. A negative assertion re-aimed by a removal must still be able to fail.
8. `agents/war-worker.md` is 13,215 B against a 13,312 B hard line: 97 B of headroom (verified: `wc -c` and
   `prompt-surface-budgets.test.mjs` at `35aa4144`). Its edit here must not grow it.
9. This plan also touches `skills/war/assets/assert-args-complete.mjs`, which the args-floor plan
   (`docs/plans/2026-11-08-args-floor-and-launch-preflight.md`) owns earlier in the chain. That plan's T1.1
   exports `FLOOR_BINDINGS`, the list of template binding lines the launch preflight copies before it runs
   the provenance-floor slice (the text between the `provenanceProblems` markers) in `new Function`. Its
   PIN-12 rule: every name the slice reads is defined inside the slice or bound in `FLOOR_BINDINGS`; a
   module-level const read inside the slice but bound nowhere throws `ReferenceError` at launch. PIN-3's
   `SUPERSEDES_LITERAL` is read by `isValueRow`, inside the slice, so T1.1 appends its binding line to
   `FLOOR_BINDINGS` in the same commit as the hoist (the one edit this plan makes to that file). Contention
   note: the args-floor plan lands first, so this plan's T1.1 edits that file at the rebased tip and
   changes nothing else in it.

## Resolved design tree

| # | Decision | Resolution | Source | Landing class |
|---|----------|------------|--------|---------------|
| D1 | Phase split | Phase 1 code and prompt items, Phase 2 comment-only items, Phase 3 release (PIN-1) | spec D1 · PIN-1 · AI-declared [assumed: picked on the frozen criteria, TRIAL-3 — if wrong: one engine task in one phase] | PIN-1→context |
| D2 | `gateLogPath` column (#2180) | Drop it from `evItems`, the header and the row builder; the per-task seat keeps its own `gateArtifactLine` read. Both pinned tests assert the column absent (PIN-2) | spec D2 [assumed: no refiner reads the column — if wrong: keep it and add a consumer sentence plus a `deliberately-unwired:` marker] | PIN-2→slice (T1.1) |
| D3 | `adjRow` and `isValueRow` (#2198) | One module-level `SUPERSEDES_LITERAL` feeds both; `adjRow` renders it as `" (" + SUPERSEDES_LITERAL + pt`${r.supersedes})`` so the bare-interpolation census is unchanged, or any other form that updates the census with a reason; plus a round-trip fixture: the auditor-prompt render of a token-free object row, relaunched as the only adjudication, launches; the same commit appends the `const SUPERSEDES_LITERAL = …` binding line to `FLOOR_BINDINGS` in `assert-args-complete.mjs`, because `isValueRow` sits inside the preflight's floor slice (constraint 9; operator ruling 2026-11-08) (PIN-3) | spec D3 [assumed: a shared literal plus behavior beats a source-extraction assert, which the ladder reverted — if wrong: add the extraction-and-equality row only] | PIN-3→slice (T1.1) |
| D4 | Plan-file basename (#2199) | Hoist `baseOf`; derive `ownPlanBase` once; `ownPlanStem` strips `.md` from it. `slugAnchorOf` stays (PIN-4) | spec D4; the lowercase risk retired (A4) | PIN-4→slice (T1.1) |
| D5 | `scanText` (#2202) | Replace with a boolean, `hasScanRows`, read by `ownTokenMiss`; keep the surface definition in the comment (PIN-5) | spec D5 [assumed: the name — if wrong: rename; no behavior rides it] | PIN-5→slice (T1.1) |
| D6 | Plan-id class (#2203) | Build the `stripSupersedes` regex and the bare-citation arm from `PLAN_ID_RE.source`, each with its own flags (PIN-6) | (verified: TRIAL-1 at 365f3da2) | PIN-6→slice (T1.1) |
| D7 | Strip-scope comment (#2200) | The strip rides `rowText` (string rows of `backstops` and `adjudications`) and never applies to `ruledAsks`, `seededPhaseClose` or `seededTasks` (PIN-7) | spec D7 | PIN-7→slice (T1.1) |
| D8 | Rule 1 discriminator (#2317) | Both surfaces key on position: the clause the prompt opens with. Rule 1 keeps the short `DEPS ALREADY MERGED:` literal; the card keeps its locator prefix. A new test binds the card's quoted literal to the rendered clause (PIN-8) | spec D8 [assumed: `depClause` is always first — if wrong: both surfaces quote the longer literal and the negatives key on a new clause-only token] | PIN-8→slice (T1.1) ‡ |
| D9 | Segmented wrapper (#2552) | One helper beside `segmentLoop` owns the re-dispatch log, continuation dispatch and exhaustion log; `segmentedMerge` and `segmentedLand` call it with their current literals. The two copies differ in exactly four points the helper parameterizes (name and shape are latitude): the segment field (`gate_segment` / `land_segment`) read by `isSegment`, the noun pair (`segmented gate` / `segmented land` in the re-dispatch log; `segmented-gate` / `segmented-land` in the exhaustion log), the continuation header (a builder of `(result, segment, opts)` that returns the text prepended to `body`), and the exhaustion tail (`(error).` / `.`). After the fold neither `segmentedMerge` nor `segmentedLand` calls `segmentLoop` directly. `aceSegments` is out of scope (PIN-9) | spec D9 [assumed: a helper beats a parity test because the copies differ in pinned words — if wrong: a masked source-compare test] | PIN-9→slice (T1.1) |
| D10 | `parkAsk` log (#2145) | Hoist the outcome clause to a const; the log concatenates values only; text byte-stable (PIN-10) | spec D10 | PIN-10→slice (T1.1) |
| D11 | `queuedKeys` list (#2146) | "no list here — a new caller joins by stamping queuedKeys"; keep the `seededPhaseClose` construct-time sentence (PIN-11) | spec D11 [assumed: that sentence is the only part worth keeping — if wrong: the auditor names what else] | PIN-11→slice (T2.1) |
| D12 | Rewrap (#2240) | Rewrap the four named blocks to ~100 columns, no line over 110 (PIN-12) | spec D12 [assumed: cheap because #2271 rewrites two of the four — if wrong: close #2240 won't-fix at the Checkpoint] | PIN-12→slice (T2.1) |
| D13 | Remaining comments | #2140, #2223, #2227, #2246, #2271, #2313, #2316, #2553 each say the true thing (PIN-13) | spec D13 | PIN-13→slice (T2.1) |
| D14 | Phase 2 scope | Every changed line of `workflow-template.js` in Phase 2 is a comment (PIN-14) | spec §4 | PIN-14→guardrail |
| D15 | Pinned bytes | Every test-pinned log string and prompt byte stays, except the dropped column and rule 1's wording (PIN-15) | spec §2 constraint 2 | PIN-15→guardrail ‡ |
| D16 | Card bytes | `agents/war-worker.md` and `agents/war-refiner.md` do not grow; no budget raise (PIN-16) | (verified: `wc -c` at 35aa4144) | PIN-16→guardrail |
| D17 | Release | Trailing release phase in the directive form (PIN-17) | spec §4 Phase 3 | PIN-17→slice (T3.1) |
| D18 | Live evidence dispatch | A real refiner run of the column-free evidence dispatch is read at the next land (PIN-18) | drafter [assumed: fixtures stub the refiner — if wrong: drop the row] | PIN-18→backstop |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Two serial phases on one file are worth the extra audit pass (spec D1) | spec D1; TRIAL-3 pair row; the `parkAsk` header was wrong from the commit that landed it, so a comment written beside its code is not audited against settled code (verified: DocTrail WorkAuditRefine/reports/2026-11-06-session-worktree-leftovers/war-fable-opus-audit-loops-0592b7/files/.claude/teams/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/ledger.json, WAR 0.21.12) | one wasted audit pass | TRIAL-3's `caught by` line; Lead judgment at decompose, merge into one task if the phases look trivial |
| A2 | No refiner reads `gateLogPath` (spec D2) | `grep -c gateLogPath agents/war-refiner.md` prints 0; steps 1–3 and the return shape do not name it | a refiner loses a hint it used | End state 1, and backstop row 1 |
| A3 | A shared literal plus a round-trip fixture binds `adjRow` to `isValueRow` (spec D3) | the ladder reverted a source-extraction assert (issue #2198) | wording drifts again | End state 3's test, proven red by a mutation of `adjRow`'s wording |
| A4 | RETIRED — a lowercased stem is safe (spec D4) | both consumers lowercase; the #1767 log prints `ownTokens[0]`, already lowercased | — | retired: verified at `35aa4144` (the fallback arm) |
| A5 | `hasScanRows` is the name (spec D5) | spec D5 | none; no behavior rides the name | none needed |
| A6 | RETIRED — `new RegExp(... + PLAN_ID_RE.source ...)` survives the staged form (spec D6, spec §8 risk 3) | — | — | retired: settled by TRIAL-1 |
| A7 | `depClause` is always the first text of a deps-bearing work prompt (spec D8) | `w2.prompt.startsWith('DEPS ALREADY MERGED')` passes at `35aa4144` | the positional discriminator misleads | the existing `startsWith` assertion stays; End state 10 |
| A8 | A helper beats a parity test for the segment wrapper (spec D9) | the copies differ in pinned words | a helper that cannot keep both strings | End states 11 and 13 |
| A9 | The `seededPhaseClose` sentence is the only part of the `queuedKeys` list worth keeping (spec D11) | issue #2146's straggler note | lost rationale | HARD at audit_sha (End state 19) |
| A10 | Rewrap is cheap (spec D12) | #2271 rewrites two of the four blocks | a ragged diff | End state 17 |
| A11 | This plan carries its own release (spec Phase 3) | spec §4 | `/war-campaign` folds it into a campaign release | the roadmap |
| A12 | The survey's chain order holds (spec §5) | the 2026-11-08 roadmap order | a comment describes code a later plan moves | constraint 1: re-read each construct at the rebased tip |
| A13 | No ADR is needed (spec §7) | comment truth and copy folding bind no new decision | D8's positional rule needs an ADR | `/red-team` |
| A14 | A sibling plan may already fix an item (spec §8 risk 1) | args-floor-and-launch-preflight edits Region C; engine-findings-ace-and-late-fix edits `parkAsk` and `drainCauseOf` | a double edit | the worker records it as already-fixed in `notes` and moves on |
| A15 | The ace ladder reverted earlier fixes for #2198, #2202 and #2203 (spec §8 risk 2) | (verified: issues #2198, #2202, #2203 (2026-09-08)) | a regressed round drops them again | they are task work in T1.1's slice, never absorbs |
| A16 | The segment helper never reads phase-local values (spec §8 risk 4) | `segmentedLand` reads `submodLandTask` and `refineryLandPath` in its `reconciledMerge` context, outside the loop | a module-level helper reads an unbound value | End state 13's staged run and the segmented-land fixtures |
| A17 | The refiner card's step 3 ("absent ⇒ that arm skips") is the same retired behavior as #2553 (spec §8 risk 5) | (verified: `agents/war-refiner.md` `## Post-merge evidence dispatch` at `35aa4144`) | a stale card line survives | owned by doc-truth-drift-and-adr-hygiene; T2.1's commit body names it |
| A18 | Node 24's test runner prints its summary as `ℹ fail 0` | TRIAL-1 observed `ℹ fail 0` | a check token never matches | every check here matches the substring `fail 0` |
| A20 | With `--test-isolation=none`, a `--test-name-pattern` that matches no test prints `tests 0` / `pass 0`; the default isolation counts the file itself as one passing test | (verified: `node --test --test-name-pattern='zzqqnomatch' workflow-template.engine-1.test.mjs` prints `pass 1` and the same run with `--test-isolation=none` prints `pass 0` at `35aa4144`; `#2182` under `--test-isolation=none` prints `pass 6`) | End states 3 and 10 pass with no fixture | both checks run with `--test-isolation=none` |
| A19 | The predecessor's prompt-size census pins fix-prompt classes, not the work or evidence prompts | `docs/plans/2026-11-08-model-routing-and-prompt-byte-budgets.md` Task 2.1 lists fix-prompt classes | a shrunk prompt reds an exact census figure | the worker updates the figure in T1.1 only if the census file names it, and records it |

## Non-goals / deferred

- `aceSegments`, the third `segmentLoop` caller: different log shape, no exhaustion log.
- `slugAnchorOf`: it takes any input, so it stays.
- The refiner card's note-arm line (A17) stays with doc-truth-drift-and-adr-hygiene.
- Shell-floor comment nits (#1836) stay with shell-floors-tests-and-lint.
- No issue in the group is declined.

## New domain terms · Recommended ADRs

None. D9's helper is an internal name. No ADR [assumed: see A13].

## Commander's Intent

- **Purpose:** every comment in the engine says what the code does, and each small rule the engine
  copies lives in one place, so the next reader is not misled and the copies cannot drift.
- **Method:** land the code and prompt items first (Phase 1), then fix the comments on code that has stopped
  moving (Phase 2), then release. Keep every pinned log string and prompt byte. Re-read each construct by
  name at the rebased tip. Route the three items the ace ladder once reverted as task work.
- **Mechanism latitude:** the segment helper's name and parameter shape; the outcome const's name in
  `parkAsk`; the boolean's name in place of `scanText`; how `ownPlanBase` gets its guarded input; how
  `SUPERSEDES_LITERAL` enters `adjRow` (the concatenated form `" (" + SUPERSEDES_LITERAL + pt`${r.supersedes})``
  leaves the bare-interpolation census unchanged; any other form updates the census with a reason); the exact
  wording of each corrected comment; how the #2198 fixture captures the render. Substituting any of these
  mechanisms while the End states and binding guardrails hold is not a plan deviation and warrants no issue.
- **Binding guardrails:**
  - Phase 2 changes comments only in `workflow-template.js` (PIN-14).
  - Every test-pinned log string and prompt byte stays, except the dropped `gateLogPath` column and rule 1's
    wording (PIN-15 ‡).
  - `agents/war-worker.md` does not grow, `agents/war-refiner.md` is not edited, and no budget is raised (PIN-16).
  - The literal `DEPS ALREADY MERGED: this task declares deps` never appears in the rules block.
  - Test edits stay in `workflow-template.engine-1.test.mjs`, `backward-chain.test.mjs` and, for the
    `preMergeTipOf` regex and the `BARE_INTERPOLATION_CENSUS` rows the `gateLogPath` drop and the `adjRow`
    form touch, `workflow-template.test-harness.mjs`; no new test file, no new harness export.
  - `aceSegments` is not touched.
- **End state:**
  1. The evidence dispatch carries no `gateLogPath` column · check: `grep -c 'gateLogPath=' skills/war/assets/workflow-template.js`
     prints `0` and `grep -cF '· gateLogPath)' skills/war/assets/workflow-template.js` prints `0` · red at base: 1 and 1.
  2. Both pinned tests assert the column absent, not a vacuous negative · check:
     `grep -cE "!(ev|evP)\.includes\('gateLogPath='\)" skills/war/assets/workflow-template.engine-1.test.mjs`
     prints `2`, and `grep -c "includes('gateLogPath=' + absent)" skills/war/assets/workflow-template.engine-1.test.mjs`
     prints `0` · red at base: 0 and 1 · mutation proof (recorded in the commit body): the column put back in
     the row builder alone turns both tests red.
  3. A launch whose only adjudication is `adjRow`'s own render of a token-free value launches · check:
     `node --test --test-isolation=none --test-name-pattern='#2198' skills/war/assets/workflow-template.engine-1.test.mjs`
     prints `pass ` with a number of 1 or more, and `fail 0` · red at base: `tests 0` / `pass 0` (A20: without
     `--test-isolation=none` the file itself counts as one passing test and the check is vacuous).
  4. The `supersedes plan literal: ` wording is spelled once in code · check:
     `grep -v '^\s*//' skills/war/assets/workflow-template.js | grep -c 'supersedes plan literal'` prints `1`
     (the `SUPERSEDES_LITERAL` declaration alone), and `grep -c 'SUPERSEDES_LITERAL' skills/war/assets/workflow-template.js`
     prints 3 or more · red at base: 2 and 0.
  5. The plan-id class is written once · check: `grep -cF 'docs\/plans\/[A-Za-z0-9._/-]+\.md' skills/war/assets/workflow-template.js`
     prints `1` · red at base: 3.
  6. The plan-file basename is derived once · check: `grep -c 'plan\.file\.replace' skills/war/assets/workflow-template.js`
     prints `0` · red at base: 2.
  7. The dead join is gone · check: `grep -c 'scanText' skills/war/assets/workflow-template.js` prints `0` · red at base: 3.
  8. The strip-scope comment names `rowText`'s two surfaces · check:
     `grep -c 'deliberately adjudications-only' skills/war/assets/workflow-template.js` prints `0` · red at base: 1.
  9. Both worker surfaces key rule 1 on the clause the prompt opens with · check:
     `grep -c 'opens with' agents/war-worker.md skills/war/references/backward-chain-worker.md` prints `:1` or more
     for each file, and `cat agents/war-worker.md skills/war/references/backward-chain-worker.md skills/war/assets/workflow-template.js skills/war/assets/backward-chain.test.mjs | grep -cE 'carries the prepended|prepended dispatch clause'`
     prints `0` · red at base: `:0` for each file, and 4.
  10. A test binds the card's quoted clause literal to the clause a deps-bearing work prompt opens with · check:
      `node --test --test-isolation=none --test-name-pattern='#2317' skills/war/assets/workflow-template.engine-1.test.mjs`
      prints `pass ` with 1 or more, and `fail 0` · red at base: `tests 0` / `pass 0` (A20).
  11. The segmented wrapper lives in one helper · check:
      `grep -v '^\s*//' skills/war/assets/workflow-template.js | grep -c 'segmentLoop('` prints `2`
      (the helper and `aceSegments`; neither `segmentedMerge` nor `segmentedLand` calls `segmentLoop` directly,
      judged by the correctness seat at audit_sha) · red at base: 3.
  12. `parkAsk`'s collision log holds no prose ternary and keeps both clauses · check:
      `grep -c "(recorded ? 'the re-raise" skills/war/assets/workflow-template.js` prints `0`, and
      `grep -o 'the re-raise recorded on its corroborators list\|already a corroborator, not recorded again' skills/war/assets/workflow-template.js | wc -l`
      prints `2` · red at base: 1 (first part).
  13. The touched suites stay green · check: `node --test skills/war/assets/workflow-template.engine-1.test.mjs skills/war/assets/workflow-template.submodule-1.test.mjs skills/war/assets/backward-chain.test.mjs skills/war/assets/prompt-surface-budgets.test.mjs`
      prints `fail 0` · green at base: regression guard paired with End states 1–12.
  14. The staged form stays green · check: `WAR_TEMPLATE_STRIPPED=1 node --test 'skills/war/assets/workflow-template.*.test.mjs'`
      prints `fail 0` · green at base: regression guard, run in every engine phase.
  15. The false or stale comments are gone · check:
      `cat skills/war/assets/workflow-template.js skills/war/assets/workflow-template.engine-1.test.mjs | grep -cE 'counts distinct seats|#3f55b04|chainRecordFix runs before the absorbRounds|that note arm then skips|both sit outside any local try|routeToSweep, the round-1 approve arm|absorbs \(except the approve trail|non-final phase EXCEPT the approve trail'`
      prints `0` · red at base: 9.
  16. The corrected comments say the new thing, each anchored to its construct · check:
      `sed -n '/const aceReaudit = async/,/const chainRound = correctiveRoundOf/p' skills/war/assets/workflow-template.js | grep -c 'zero sum'` prints 1 or more;
      `sed -n '/^const filedKeys = new Set/,/^const queuedKeys = new Set/p' skills/war/assets/workflow-template.js | grep -c 'a new caller joins by'` prints 1 or more;
      `sed -n '/^const citationStamp = /,/^const queuedFindingRow = /p' skills/war/assets/workflow-template.js | grep -c 'c0f88d0'` prints 1 or more, and the same
      range piped to `grep -c '3f55b04'` prints 1 or more;
      `grep -A6 "sweepDebtLog('terminal pass merge:p' + ph.id + '-terminal', tmr)" skills/war/assets/workflow-template.js | grep -c 'no touched-file gate'` prints 1 or more
      · red at base: 0, 0, 0 (and 1 for the bare `3f55b04`), 0. A whole-file count would read baseline+1 and
      pass on any upstream comment that happens to carry the phrase, so no whole-file count is used.
  17. The four rewrapped blocks hold no line over 110 columns · check:
      `node -e 'const L=require("fs").readFileSync("skills/war/assets/workflow-template.js","utf8").split("\n");const c=l=>/^\s*\/\//.test(l);let over=0;for(const a of ["const routeGateAuditRows = ","const carriedPhaseClose = ","const carryPhaseClose = ","// Terminal-disposition demotion ladder"]){let i=L.findIndex(l=>l.startsWith(a));if(i<0){console.log("missing:"+a);process.exit(1)}if(!c(L[i]))i--;let s=i,e=i;while(s>0&&c(L[s-1]))s--;while(e<L.length-1&&c(L[e+1]))e++;for(let k=s;k<=e;k++)if(L[k].length>110)over++}console.log("over:"+over)'`
      prints `over:0` · red at base: `over:2`.
  18. Phase 2's engine diff is comment-only · HARD at audit_sha (observable: every added or removed non-blank
      line of `skills/war/assets/workflow-template.js` in the task diff starts with `//` after its indent;
      judge: the correctness seat).
  19. Each rewritten comment matches the code it names (#2140, #2146, #2223, #2227, #2246, #2271, #2313, #2316,
      #2553) · HARD at audit_sha (observable: each comment read against its named construct at the pin;
      judge: the correctness seat).
  20. The repository gate passes · gate: `node skills/war/assets/repo-gate.mjs` (the self-discovered suites of
      `resolveGate` in `war-config.mjs`).
  21. The four version slots agree · check: `node --test skills/war/assets/version-slots.test.mjs` prints `fail 0`.
  22. A live evidence dispatch without the column still returns its contract · backstop: row 1.

## Build order (for /war)

Phase 1 (code and prompt items, one task) → Phase 2 (comment truth, one task) → Phase 3 (release).
Each phase has one `workflow-template.js` owner. Phase 2 needs Phase 1 landed, so its comments describe
final code.

## Phase 1 — Code dedup and prompt-surface items

### Task 1.1: Fold the copies, drop the dead column, align the worker trigger
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.engine-1.test.mjs`, `skills/war/assets/workflow-template.test-harness.mjs`, `skills/war/references/backward-chain-worker.md`, `agents/war-worker.md`, `skills/war/assets/backward-chain.test.mjs`, `skills/war/assets/assert-args-complete.mjs`
- Plan slice: Serves End states 1–14. Re-read every construct by name at the rebased tip first; record any
  item a sibling plan already fixed as already-fixed in `notes` (A14). These are task work, never absorbs (A15).
  - (PIN-2, #2180) Drop `gateLogPath` from `evItems`, the `For EACH merged task below (...)` header and the row
    builder. Leave the per-task seat's `gateArtifactLine` read of `mergedTasksForGateAudit` alone. Re-aim the
    fallback test to `!evP.includes('gateLogPath=')` and the #2182 test to `!ev.includes('gateLogPath=')`, each
    with its existing `ev &&` / `evP &&` presence guard and seat-side check. Prove both red by putting the
    column back in the row builder alone, and record the two failing assertion messages in the commit body
    (End state 2). In `workflow-template.test-harness.mjs`, re-anchor `preMergeTipOf`'s regex on the row's new
    tail (the ` · gateLogPath=` text is gone; anchor on end of line or the field that now closes the row) and
    remove the `'e.gateLogPath'` entry from `BARE_INTERPOLATION_CENSUS` with its comment clause ("`e.gateLogPath`
    carries an explicit || conventional-path fallback at evItems"); add no export. Read `agents/war-refiner.md`
    `## Post-merge evidence dispatch` and state in the commit body that it names no column (both-surfaces rule).
  - (PIN-3, #2198) Add a module-level `SUPERSEDES_LITERAL = 'supersedes plan literal: '` above `adjRow`. Feed it
    to `adjRow`'s render and to `isValueRow`'s string arm (a `new RegExp` built from it), so the only
    non-comment spelling of the words is the declaration (End state 4). In `adjRow` use
    `" (" + SUPERSEDES_LITERAL + pt`${r.supersedes})`` — the form that keeps `r.supersedes` a bare interpolation
    and leaves `BARE_INTERPOLATION_CENSUS` unchanged; any other form moves the census (`r.supersedes` drops out
    or `SUPERSEDES_LITERAL` joins), and then the census edit rides this task with a one-line reason comment.
    Rendered bytes stay the same. Add a test whose name carries `#2198`: run a phase with one object adjudication of a
    token-free value (for example `{ adjudicated: '0.21.13', supersedes: '0.21.12' }`), take the `- <row>` line
    the auditor prompt carries, relaunch with that string as the only adjudication, and assert the launch is
    not refused by the own-token floor. Prove it red: reword `adjRow`'s suffix alone and the test fails.
    In the same commit, append the `const SUPERSEDES_LITERAL = 'supersedes plan literal: '` line to the
    exported `FLOOR_BINDINGS` list in `skills/war/assets/assert-args-complete.mjs` (constraint 9; operator
    ruling 2026-11-08). The launch preflight slices the template between the `provenanceProblems` markers and
    runs it in `new Function` after copies of the lines in `FLOOR_BINDINGS`; `isValueRow` sits inside that
    slice, so a module-level `SUPERSEDES_LITERAL` bound nowhere throws `ReferenceError` at every launch. The
    entry's text must equal the template's declaration line with leading whitespace stripped (the lookup
    ignores leading whitespace per physical line, as the staged form strips it), so the binding is one physical
    line. Prove it red: with the hoist in place and no new entry, the args-floor plan's
    `provenance mirror: the shipped slice is self-contained` test fails; with the entry it passes. Change no other
    byte of that file.
  - (PIN-4, #2199) Hoist `baseOf` above `ownPlanStem`. Derive `ownPlanBase` once from the guarded `plan.file`;
    `ownPlanStem` strips `.md` from `ownPlanBase`. No `plan.file.replace` remains.
  - (PIN-5, #2202) Replace `scanText` with a boolean `hasScanRows = rows.some(r => !r.exempt && !r.value && r.text)`
    read by `ownTokenMiss`. Keep the comment's surface definition under the new name.
  - (PIN-6, #2203) Build the `stripSupersedes` regex and `isValueRow`'s bare-citation arm from `PLAN_ID_RE.source`,
    each with its own flags (settled by TRIAL-1).
  - (PIN-7, #2200) Reword the comment above `ruledAskRowText`: the strip rides `rowText` (string rows of
    `backstops` and `adjudications`) and never applies to `ruledAsks`, `seededPhaseClose` or `seededTasks`.
  - Grep `docs\/plans\/` and `supersedes plan literal` in `workflow-template.js` and handle every match.
    Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and
    comments for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
  - (PIN-8 ‡, #2317) Rule 1, in `BACKWARD_CHAIN_WORKER_RULES` and `backward-chain-worker.md` together (the
    byte-equal test binds them): "When the prompt opens with the `DEPS ALREADY MERGED:` dispatch clause, …".
    Keep the short literal; the longer clause literal never enters the rules block. In `agents/war-worker.md`
    keep the line's `If your spawn prompt carries a \`DEPS ALREADY MERGED` prefix and change the parenthetical
    to "(the clause the prompt opens with, not the mention in the backward-chain worker rules)" or any wording
    no longer than today's: the card must not grow (PIN-16). Update the `backward-chain.test.mjs` mutation row
    "rule 1 loses the DEPS ALREADY MERGED sub-clause" to the new sentence. Add a test whose name carries
    `#2317`: take the text a deps-bearing work prompt opens with, up to and including `declares deps`, and
    assert the card line found by its prefix includes it (guard for the card's quoted literal, rule 8).
    Grep `DEPS ALREADY MERGED` across `skills/` and `agents/` and handle every match. Manual same-scope
    survey required: after the grep, hand-scan the target file's same-scope tests and comments for
    same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
  - (PIN-9, #2552) Add one helper beside `segmentLoop` that owns the re-dispatch log, the continuation
    dispatch and the exhaustion log, and is the only non-`aceSegments` code site that spells `segmentLoop(`
    (End state 11). It parameterizes the four points where the copies differ (D9): the segment field, the
    noun pair, the continuation header builder and the exhaustion tail. `segmentedMerge` and `segmentedLand`
    call it with their current literals, byte for byte; log lines stay concatenation-built. The helper takes
    the dispatch body and options only, never `submodLandTask` or `refineryLandPath` (A16). Leave `aceSegments`
    as it is.
  - (PIN-10, #2145) Hoist the collision outcome clause in `parkAsk` to a const; the `log()` concatenates values
    only. The logged text stays byte-identical.
  - Run the template tests twice: plain, and with `WAR_TEMPLATE_STRIPPED=1`.
- Done when: `node --test skills/war/assets/workflow-template.engine-1.test.mjs skills/war/assets/workflow-template.submodule-1.test.mjs skills/war/assets/backward-chain.test.mjs skills/war/assets/prompt-surface-budgets.test.mjs` prints `fail 0`, and `WAR_TEMPLATE_STRIPPED=1 node --test 'skills/war/assets/workflow-template.*.test.mjs'` prints `fail 0`, and `grep -c 'scanText' skills/war/assets/workflow-template.js` prints `0`, and `out=$(node --test --test-reporter=tap --test-name-pattern='^provenance mirror' skills/war/assets/assert-args-complete.test.mjs) && printf '%s\n' "$out" | grep -qE '^ *ok [0-9]+ - provenance mirror: the shipped slice is self-contained' && echo PASS-SELF-CONTAINED` prints `PASS-SELF-CONTAINED` (the args-floor plan's T1.1 test; it exists at this plan's rebased tip because that plan lands earlier in the chain)
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Comment truth (no code change)

### Task 2.1: Make each named comment true and rewrap the four blocks
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.engine-1.test.mjs`
- Plan slice: Serves End states 15–19. Comments only (PIN-14); the engine-1 edit is the one `parkAsk`
  own-raiser test comment. Re-read each construct by name at the rebased tip (PIN-13):
  - #2140: drop the "counts distinct seats" clause from the `parkAsk` header and from the own-raiser test comment.
  - (PIN-11) #2146: replace the `queuedKeys` producer list with "no list here — a new caller joins by stamping
    queuedKeys", and keep the `seededPhaseClose` construct-time sentence as its own line.
  - #2223: the terminal-pass merged arm's `#1873-class` comment says the arm has no touched-file gate, so it
    inherits the ruled residual stated at the ace batch site.
  - #2227: the `queuedFindingRow` header cites `3f55b04` with no `#` as the fix and `c0f88d0` as the drift.
  - #2246: the `drainCauseOf` header names only the handoff `followUps` projection as outside any try.
  - #2271: the `carryPhaseClose` header and the `carriedPhaseClose` declaration comment scope the approve-trail
    exception to queued `phaseCloseQueue` rows.
  - #2313: the `aceReaudit` comment carries the zero-sum caveat of `correctiveRoundOf`.
  - #2316: the `throughRound` comment names the cause: `chainRound` is captured by
    `correctiveRoundOf('ace', r.task)` before the `absorbRounds` charge.
  - #2553: the `phaseDiffFiles` comment says an absent diff reads as an empty Set and the note arm keeps every
    note, logged.
  - (PIN-12) #2240: rewrap the `routeGateAuditRows`, `carriedPhaseClose`, `carryPhaseClose` and demote-ladder
    header blocks to ~100 columns, no line over 110, no short orphan lines.
  - For #2553, grep `skips with a log` and `note arm` in the template and handle every match. Matches read at
    `35aa4144` and the ruling on each: the `phaseDiffFiles` block's "that note arm then skips with a log" is the
    target; the "self-skips with a logged line" comment above the unanchored-target dispatch guard is a
    different construct and stays; every other `note arm` line stays because it is already true under the
    empty-Set rule — the `phaseBase` diff comment, the oscillation-bound comment, the evidence prompt's step 3
    text and the two pinned logs "the note arm matches nothing" (the evidence-return log and the gate-audit
    floor pass log), and the `routeGateAuditRows` comments that already say "reads as an empty Set". Manual
    same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments
    for same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
  - For #2140 and #2313, grep `distinct seats` and `one more than the fixer` in the template and its tests and
    handle every match. Matches read at `35aa4144` and the ruling on each: in the template, the `parkAsk`
    header is the #2140 target and the `aceReaudit` comment is the #2313 target; the canonical
    `correctiveRoundOf` comment already carries the zero-sum caveat and stays. In `workflow-template.engine-1.test.mjs`
    the only edit is the own-raiser fixture comment ("parkAsk's dup arm skips it and the handoff row counts
    distinct seats"); the three `N distinct seats` assertion messages and the "With distinct seats
    throughout" fixture comment describe roster sizes, are true, and stay. Manual same-scope survey required:
    after the grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded
    differently, and list each straggler as a survey-derived correction.
  - The commit body names the refiner card's `## Post-merge evidence dispatch` step 3 line ("absent ⇒ that
    arm skips") as the same retired behavior, for doc-truth-drift-and-adr-hygiene to fix (A17).
- Done when: None — comment-only (requiresTest false); End states 15–17 are its checks and End state 18 is the audit's HARD judgment.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Release

### Task 3.1: Version bump
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`
- Plan slice: (PIN-17) bump all four slots to the next free patch above the live integration base at land time,
  per the `/war-strategy` §2 next-free-patch convention (`plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the README `## Status` line). The expected integration base is
  the landed tip of `docs/plans/2026-11-08-model-routing-and-prompt-byte-budgets.md`. Standalone fallback: a
  run of this plan through plain `/war` resolves the next free patch from the four slots itself. Replace the
  README `## Status` blurb in place and keep it a byte twin of the new CHANGELOG lead entry. The entry names
  the dropped evidence column, the shared supersedes literal and plan-id source, the worker trigger, the
  segment helper and the comment fixes, and counts nothing it does not enumerate.
- Done when: `node --test skills/war/assets/version-slots.test.mjs` prints `fail 0`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- (PIN-18) A live evidence dispatch without the `gateLogPath` column returns `{ perTask, phase_diff_files }` and
  the post-merge gate audit runs · why deferred: fixtures stub the refiner, so only a real dispatch shows it ·
  runner: the Lead reads the next campaign plan's first phase-land `handoff` (its evidence step and
  `phase_diff_files`), at that land.

## Notes / conscious deviations

- Check tokens read `fail 0`, not the spec's `# fail 0`: Node 24 prints its summary as `ℹ fail 0` (TRIAL-1, A18).
- End state 6 tightens the spec's "0 or 1" to `0`: D4 leaves no `plan.file.replace`.
- End state 2 counts the re-aimed `includes('gateLogPath=')` form the slice prescribes, in place of the spec's
  alternation grep, which is the same token.
- End states 10 and 12 are added: rule 8 asks for a guard over the card's quoted literal, and the spec's
  End state for #2145 did not check that the two clauses survive.
- The spec's Phase 2 "comment-only" diff check needs the phase base, which the plan cannot name; it is the
  HARD End state 18 instead.
- The sweep trial could not run (TRIAL-2, dirty shared checkout from a sibling drafter). Red-at-base was read
  by grep in the checkout at `365f3da2`.
- The drafter is write-scoped to this file, so the fork-trials usage comment on #2436 is left for the Lead.
- No issue was unreachable.
- Revise pass (grill answers; each decided here, for `/red-team` to ratify):
  - P11 (blocker) → End states 3 and 10 run with `--test-isolation=none` (A20): the default isolation counts the
    file itself as one passing test, so the old check passed with no fixture.
  - P20 (blocker) → `workflow-template.test-harness.mjs` joins T1.1's Files for the `preMergeTipOf` regex and the
    `e.gateLogPath` census entry; Constraint 5 and the test-edits guardrail name it; the `adjRow` form that keeps
    the census unchanged is the default and a census edit with a reason is the fallback.
  - P02 (major) → End state 2 counts the negated `!(ev|evP).includes('gateLogPath=')` form and the absence of the
    old positive `+ absent` assert, with a put-the-column-back mutation proof in the commit body.
  - P24 (major) → End state 4 also requires the non-comment count of `supersedes plan literal` to read 1.
  - P05 (open) → End state 11 is a construct check (non-comment `segmentLoop(` sites = 2) instead of an exact call
    spelling; D9 names the four points the helper parameterizes while its name and shape stay latitude.
  - P07 (minor) → End state 16 anchors each phrase to its construct with a `sed` range or `grep -A`; no whole-file
    baseline+1 count remains.
  - P10 (minor) → T2.1 lists every non-target match of the four sweep greps as left alone with its reason.
  - P18 (minor) → the two spec-sourced `verified:` tags are retagged (Context's prompt-byte sentence now cites an
    executed read; Constraint 1 cites spec §2 without a `verified:` tag). The issue-dated rows keep their
    `(verified: issue #N (<date>))` form: that is the D4/D11 tag for issue-derived facts in
    `skills/war-strategy/references/plan-interview.md`, so the grill is wrong on those.
  - P23 (minor) → TRIAL-3 is an AI-declared pair row for D1 naming the losing candidate, `if wrong` and
    `caught by`; D1's Source cell and A1 cite it.
  - None of the above is hard to reverse, surprising without context or a genuine trade-off, so no question is
    raised to the operator.
- Operator ruling 2026-11-08: on the args-floor plan's OD-1 (its A20 / P24), the operator chose to amend this
  plan rather than the args-floor plan. T1.1 now also owns `skills/war/assets/assert-args-complete.mjs` and,
  in the same commit as the PIN-3 `SUPERSEDES_LITERAL` hoist, appends that declaration's binding line to the
  exported `FLOOR_BINDINGS` list, so the preflight's floor slice stays self-contained (PIN-12 there). The
  args-floor plan's `provenance mirror: the shipped slice is self-contained` test is T1.1's Done when check for
  it. Constraint 9 and D3 record the cross-plan file touch. Phase 1 has one task, so the new file collides with
  no same-phase task. The `## Commander's Intent` section is unchanged: the new check rides T1.1's Done when,
  not a new End state.

## Open decisions

None. The one question that named this plan, the args-floor plan's OD-1, was raised in that plan and is
resolved by the operator ruling recorded in `## Notes / conscious deviations`.
