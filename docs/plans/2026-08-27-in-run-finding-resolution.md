# In-run finding resolution — mechanical findings die in-run, not as issues

Authored by `/war-strategy` (compressed operator interview, 2026-08-27 — see Notes).
Core issues: #1731, #1838, #1845, #1846 (the disposition-routing enhancement family);
folded ask-machinery defects: #1810, #1789, #1790, #1813; folded doc cascade: #1812.
One landed run of this plan retires nine open `war-followup` issues and all four
enhancement issues, and every subsequent run files structurally fewer issues — the
realized-absorb-rate program's core.

**Evidence consumed** — one row per linked artifact:
- issue #1731 body AND comments · read in full — the two operator comments (2026-08-26,
  "burn through the fix/ace→re-audit rounds until you hit the limit"; "I don't care if
  you call it a fix round or an ace round… Fix what is broken when it is identified")
  SUPERSEDE the body's one-echo sketch and carry operator provenance · read
- issues #1838, #1845, #1846 · read in full (each operator-ratified in its body; #1845
  re-verified zero comments) · read
- issues #1810, #1789, #1790, #1813 · read in full (plan-1 audit-filed, evidence blocks
  carry pinned SHAs and line sites) · read
- issue #1812 · read in full, zero comments — the four-home boundary-prose cascade this
  plan's own semantics change re-opens, hence owned here (touched-doc duty) · read
- `agents/war-auditor.md` byte measurement (26,287 B vs 28,672 B hard) and
  `skills/war/references/disposition-eligibility.md` un-budgeted status · (verified:
  `prompt-surface-budgets.test.mjs` + `wc -c` at origin/master 0.20.1, 2026-08-27) · read
- `skills/war/SKILL.md` Checkpoint `--afk` citation-arm sentence · (verified: grep at
  origin/master 0.20.1, 2026-08-27) · read
- issue #1788 · read; deliberately excluded (see Notes) · read

## Context — the gap / problem

The WAR pipeline's audits are thorough, but their thoroughness currently *manufactures
issue litter*: a mechanical, fully-specified finding born after the per-task ace batch is
spent has no in-run vehicle and demotes to a filed `war-followup` issue — the recorded
shape across four operator-ratified enhancement issues. The engine-reliability campaign
(plan 1, landed 0.20.1) filed ~90 follow-ups; the dominant class was exactly this
timing-stranded litter (verified: the 2026-08-27 categorization pass over the open
`war-followup` corpus — categories A+B ≈ 50 of 100 open issues). Specifics:

- A finding born at the post-ace re-audit has no landing round — the ladder "never opens
  for fresh findings", so a one-line comment-lag nit becomes a filed issue (verified:
  issue #1731 (2026-08-26); the live instance was #1726, folded by hand).
- A test-fidelity Minor whose fix is *adding a test* in a task-owned test file is read as
  beyond "mechanical" and routes follow-up even with fix rounds unspent (verified: issue
  #1838 (2026-08-27); live instance Sequoia-Port/AutoIndex#523).
- A fully-specified behavior fix with a nameable trade-off has no ruling vehicle under
  `--afk`: `ask` demotes on no-match, so the finding structurally outlives the run
  (verified: issue #1845 (2026-08-27); live instance Sequoia-Port/AutoIndex#522).
- A re-audit-born mechanical nit defaults to `follow-up` even though the phase-close
  sweep — its textbook vehicle — sits idle (verified: issue #1846 (2026-08-27); live
  instance Sequoia-Port/AutoIndex#524).
- The ask channel the fixes lean on carries four landed defects: `parkAsk` dedupes by
  object identity while `minorsOf` mints fresh copies per round, so a persisting ask
  parks once per round and a demoted finding can double-file (verified: issue #1810
  (2026-08-26)); the gate-audit dispatch-label suffixes `:integrated-tip`/`:end-state`
  were never carved out of the lens-extraction rule (verified: issue #1789 (2026-08-26));
  the cross-lane ask content dedup silently suppresses a gate-audit-family ask — the
  engine's only unlogged sink (verified: issue #1790 (2026-08-26)); `aceGroups()` and the
  `Ace-Subset` trailer key on raw `f.file` while the culprit compare normalizes, so
  path-form drift can split a same-file group across subsets against the D3 invariant
  (verified: issue #1813 (2026-08-26)).
- The prior reserve change (#1562, landed plan 1 phase 7) left four prose homes narrating
  the retired budget-exhaustion boundary, unguarded because no drift row ever carried the
  token (verified: issue #1812 (2026-08-26)). This plan changes that boundary AGAIN, so
  those homes are re-authored here with guard rows shipping in the same plan — the
  touched-doc duty (ADR 0025) plus the flip-ships-the-guard discipline.

## Pivotal constraints

- The floor-retry reserve is landed law: subset/absorb commits dispatch only while
  `fixRounds < roundLimit − 2` (plan-1 phase 7, D12/Open-decision-4; the roundLimit=6
  default was re-ratified at the plan-1 Checkpoint — adjudication row, 2026-08-26).
- Standing/dispatched prompt split: auditor-behavior guidance must change on BOTH layers
  (standing card/references home + the dispatched `auditPrompt` blocks) in the same
  commit (CLAUDE.md law; the recorded drift trap).
- Byte budgets: `agents/war-auditor.md` hard 28,672 B (2,385 B headroom measured at
  0.20.1); `skills/war/SKILL.md` carries a budgets row; the Budget-Raise floor refuses
  uncited ceiling raises. `disposition-eligibility.md` is un-budgeted (verified: 0.20.1).
- Pin lock-step: `skill-doc-contracts.test.mjs` D37/D38/D41/D42 read sentences this plan
  rewrites — keys move in the same commit, never loosened.
- Campaign contention: this plan's footprint collides with plan 3
  (doc-truth-and-drift-guard-debt) on `workflow-template.js`/`.test.mjs`, ADR 0013,
  `schemas.md`, `CONTEXT.md`, `skills/war/SKILL.md`, `design.md` — this plan lands FIRST;
  plan 3 is re-amended afterward (operator-accepted, 2026-08-27), retiring its #1812
  fold rows.

## Resolved design tree

| # | Decision | Resolution | Source | Pins · class |
|---|----------|------------|--------|--------------|
| D1 | Re-entry shape (#1731) | **Budget-bounded re-entry, no new round type**: the ladder re-enters for any fresh absorb born at ANY re-audit (plain, bisection-subset, later-round) as another ace-style batch on the same machinery, while `fixRounds < roundLimit − 2`; the reserve is the sole bound and converges arithmetically. Supersedes the issue body's one-echo sketch. | (user; verified: issue #1731 comments (2026-08-26)) | PIN-1 · guardrail+slice |
| D2 | Fallback ladder routing | Re-enter while budget remains ⇒ reserve-blocked or spent ⇒ `phaseClose: true` → sweep ⇒ sweep-discard ⇒ follow-up; every demotion logged, nothing silent. A forward-reverted finding demotes and never re-enters (existing semantics — the oscillation bound). | (user) | PIN-2 · guardrail |
| D3 | Re-audit-born mechanical default (#1846) | Auditor disposition guidance: a mechanical, fully-specified finding born at a re-audit defaults `absorb` (+`phaseClose: true` eligibility) — the sweep is its vehicle when re-entry is reserve-blocked; `follow-up` stays correct for unspecified, decision-shaped, or sweep-excluded (release-slot/cross-task) findings. Doctrine-only rung; it is the ladder's sweep step, load-bearing for D2. | (verified: issue #1846 (2026-08-27); user) | PIN-3 · slice+end-state |
| D4 | New-test absorb eligibility (#1838) | A fully-specified new-test (or test-harness) addition in a task-owned test file is a legitimate `absorb`/ace-batch member — "needs a new test" is not by itself a why-not-absorbable reason. Never-delete/weaken-tests law untouched (adding only). | (verified: issue #1838 (2026-08-27); user) | PIN-4 · slice |
| D5 | Specified trade-off fixes route ask (#1845 part 1) | A finding whose fix is fully specified but entails a behavior change with a nameable trade-off routes `ask` (the trade-off IS the fork), not `follow-up`. | (verified: issue #1845 (2026-08-27)) | PIN-5 · slice |
| D6 | Absorb-by-citation under `--afk` (#1845 part 2) | A parked ask matching a standing operator-ratified adjudication row resolves to an actionable `absorb` (executed via the ace/re-entry vehicle), citing the row. **Match strictness**: the row must cover the finding's NAMED trade-off, not its topic; ambiguity resolves to no-match ⇒ today's demote (the floor). **Soundness duty**: the re-audit panel is explicitly charged with verifying the cited row covers the trade-off — unsound ⇒ blocking, batch reverts, finding demotes with the mismatch named. **Record**: row-id + one-line match rationale in the durable record (commit + `aced` row); rationale format is latitude, presence is floor. `--afk` never mints a standing row (existing invariant). | (user) | PIN-6, PIN-7 · guardrail; PIN-8 · end-state |
| D7 | Citation telemetry | Citation-resolutions ride `/war-review` — which standing rows fire, how often; an over-broad row firing constantly is the measured narrowing signal. Counting is free (the `aced` record carries the citation). | (user) | PIN-9 · slice |
| D8 | Content-key property floor (#1810) | Floor the PROPERTY, not the tuple: the cross-round finding/ask identity key is stable across rounds for the same finding (survives re-minting and SHA changes) AND distinguishes distinct findings on the same task — fixtures asserting BOTH directions. Tuple choice is implementer's latitude. Under D1's multiplied rounds and D6's actionable asks, #1810 is double-EXECUTION prevention, not just double-parking. | (user) | PIN-10 · guardrail+end-state |
| D9 | Fold enumeration fence | The four machinery folds (#1810, #1789, #1790, #1813) land as named slice members with their fix sites cited, and the engine-fence clause enumerates them — folded fixes never ride unnamed. #1790's fix merges a content-dedup collision as corroboration (or at minimum logs it) — the unlogged sink closes. | (user) | PIN-11 · guardrail |
| D10 | #1812 homes owned here | The four boundary-prose homes (ADR 0013 amendment · `skills/war/SKILL.md` `--ace` bullet · CONTEXT.md **Ace bisection** glossary row · `design.md` §18) are re-authored to the NEW re-entry/reserve semantics in this plan, and `skill-doc-contracts.test.mjs` gains guard rows binding the new boundary prose — the flip ships the guard (the old drift was silent precisely because no row carried the token). | (user; verified: issue #1812 (2026-08-26)) | PIN-12 · slice |
| D11 | Campaign placement | Next in the paused 2026-08-25-survey-debt queue, cut from post-merge 0.20.1 master, BEFORE plans 2 and 3. **Plan-2 deferral ruling (recorded)**: plan 2 (authoring-doctrine) is file-disjoint and deliberately waits one run — core-fix-first per operator. Plan 3 re-amended after this lands. | (user) | PIN-13 · context |
| D12 | Cut-base re-verification duty | Every folded fix-site line citation (#1810/#1789/#1790/#1813) and each #1812 prose home was verified at the 2026-08-27 tip; the worker re-enumerates each at the actual cut base before editing (D12 staleness law). | (user) | PIN-14 · slice |
| D13 | Re-entry dispatch hygiene | Re-entry rounds inherit the existing `Ace-Subset` trailer discipline and tip-preflight idempotency verbatim — new dispatch sites, existing law, stated so a resume never duplicates a batch. | (user) | PIN-15 · guardrail |
| D14 | Release grade | MINOR — behavior-visible routing changes; the bump directive is "next free MINOR above the live integration base at land time", never a resolved literal (the patch→minor silent-flip lesson). | (user) | PIN-16 · slice |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Re-entry convergence needs no new bound beyond the reserve: a forward-reverted finding demotes and never re-enters, so oscillation cannot recur within the budget | landed forward-revert demotion semantics (plan 1 phase 7) | an oscillating batch burns budget until the reserve — bounded, logged, ugly but safe | End state 1's convergence fixture; the reserve hard-stop |
| A2 | Standing-row matching is panel judgment (prompt-charged), never engine-side NLP — the engine records and routes, the re-audit panel judges soundness | the citation arm is already prompt-side (SKILL.md Checkpoint, verified 0.20.1) | a code-side matcher would be new machinery — out of scope, re-plan | End states 4–5's fixtures exercise record/route only |
| A3 | The `war-review` telemetry row and the `skills/war/SKILL.md` edits keep `war-pipeline-structure.test.sh` and the budgets/D37/D41/D42 pins green via lock-step moves | pin inventory read at 0.20.1 | red pins at merge — coupling updates in the same commit, never loosened | each task's Done-when suite |

## Non-goals / deferred

- #1664 (escalate-boundary valve) — activation-gated on grind measurements; untouched.
- #1549 (bisection for the sweep-discard arm) — the sweep-discard ⇒ follow-up rung stays
  as-is; #1549 remains open and activation-gated.
- #1788 (collapse-key `seats` spoofing) — corroboration/filing integrity, orthogonal to
  the new arms; stays on the follow-up ladder (operator-ruled exclusion).
- Plan 3's re-amendment (retiring its #1812 fold rows) — after this plan lands.
- The behavior/coverage follow-up families outside the ask channel (args-preflight,
  provenance floor, endstate transport, #1828 guard bypass) — separate lanes.

## New domain terms · Recommended ADRs

- **Re-entry** (glossary candidate): the budget-bounded return of the ace ladder for
  fresh absorbs born at a re-audit — an ace-style batch on the same machinery, never a
  new round type. Lands in CONTEXT.md via Task 3.
- **Absorb-by-citation**: an `--afk` ask resolution whose ruling is a quoted standing
  adjudication row and whose outcome is an executed absorb. Lands in CONTEXT.md.
- ADR: a dated **amendment to ADR 0013** (the disposition-routing home) — never a new
  ADR; the routing widenings, the re-entry rule, and the citation arm are all ADR 0013
  subject matter (Task 2).

## Commander's Intent

- **Purpose:** a WAR run stops manufacturing issue litter — a mechanical, fully-specified
  finding identified during a run is fixed during that run (absorbed, re-entered, swept,
  or ruled-and-absorbed), and only genuinely unspecified, cross-cutting, or
  operator-decision work outlives the run as a filed issue. "Fix what is broken when it
  is identified."
- **Method:** widen the disposition ladder's in-run vehicles on the existing machinery:
  budget-bounded ace re-entry for re-audit-born absorbs (D1/D2); re-audit-born mechanical
  nits default absorb+phaseClose with the sweep as the reserve-blocked rung (D3);
  new-test additions in task-owned test files become ace-eligible (D4); fully-specified
  trade-off fixes route `ask` (D5) and, under `--afk`, an ask matching a strict standing
  adjudication row resolves to absorb-by-citation with panel-verified soundness (D6) and
  `/war-review` telemetry (D7); harden the ask channel the new arms lean on — the four
  named folds (D8/D9). Both prompt layers move together; the four #1812 prose homes are
  re-authored to the new boundary with guard rows shipping in the same plan (D10).
- **Mechanism latitude:** the content-key's exact field tuple (D8 floors the property,
  not the tuple); the corroboration/log record shape (#1790); the re-entry loop's
  internal code structure (no new round type is floor; its shape is free); fixture
  construction throughout; doctrine prose wording; the citation-record's rationale
  format. Substituting any of these mechanisms while the End states and binding
  guardrails hold is not a plan deviation and warrants no issue.
- **Binding guardrails:**
  - the full fallback ladder, verbatim: re-enter while `fixRounds < roundLimit − 2` ⇒
    reserve-blocked or spent ⇒ `phaseClose: true` → sweep ⇒ sweep-discard ⇒ follow-up;
    every demotion logged, nothing silent (PIN-2);
  - the reserve is the SOLE re-entry bound — no new round type, no echo cap, no
    shrinking rule (PIN-1); a forward-reverted finding never re-enters;
  - match strictness: the standing row must cover the finding's NAMED trade-off, not
    its topic; ambiguity resolves to no-match ⇒ demote — the consequence of the rule,
    never a substitute for it (PIN-6);
  - citation-soundness duty: the re-audit panel verifies the cited row covers the
    trade-off — unsound ⇒ blocking, revert, demote naming the mismatch; the durable
    record carries row-id + one-line match rationale (presence is floor, format is
    latitude) (PIN-7);
  - content-key property floor: stable across rounds for the same finding AND
    distinguishing distinct findings on the same task, fixtures asserting both
    directions (PIN-10);
  - re-entry rounds inherit the `Ace-Subset` trailer discipline and tip-preflight
    idempotency verbatim (PIN-15);
  - absorb eligibility stays "mechanical + intent-consistent" plus EXACTLY the two
    ratified widenings (new-test-in-owned-file, citation-resolved); release-slot files
    stay refused from ace and sweep; never delete or weaken tests;
  - `--afk` never mints a standing adjudication row;
  - standing and dispatched prompt surfaces change in the same commit;
  - the engine-fence clause enumerates the four folds (#1810, #1789, #1790, #1813) —
    no unnamed rider edits (PIN-11).
- **End state:** (11 rows, exact)
  1. Budget-bounded re-entry: a fresh absorb born at a plain re-audit, a bisection-subset
     re-audit, and a later-round re-audit each re-enters as an ace-style batch while
     `fixRounds < roundLimit − 2`; at the reserve the finding routes `phaseClose: true`;
     a forward-reverted finding never re-enters — fixtures titled `ace-reentry` ·
     check: grep -c 'ace-reentry' skills/war/assets/workflow-template.test.mjs prints at least 3 && node --test skills/war/assets/workflow-template.test.mjs exits 0.
  2. Re-audit-born mechanical absorb, reserve-blocked, lands in the phase-close sweep —
     not `minorsFiled` — fixture titled `reaudit-sweep` ·
     check: grep -c 'reaudit-sweep' skills/war/assets/workflow-template.test.mjs prints at least 1.
  3. A new-test addition in a task-owned test file is ace-eligible, and the eligibility
     doctrine says so on both prompt layers — fixture titled `new-test-absorb` ·
     check: grep -c 'new-test-absorb' skills/war/assets/workflow-template.test.mjs prints at least 1 && grep -qi 'new test' skills/war/references/disposition-eligibility.md && echo ELIGIBILITY-WIDENED prints ELIGIBILITY-WIDENED.
  4. A parked ask matching a standing row resolves to an executed absorb whose durable
     record carries the row-id and a match rationale; an ambiguous match demotes —
     fixtures titled `citation-resolve` ·
     check: grep -c 'citation-resolve' skills/war/assets/workflow-template.test.mjs prints at least 2.
  5. An unsound citation is caught at the re-audit panel: batch reverts, finding demotes
     with the mismatch named — fixture titled `citation-unsound` ·
     check: grep -c 'citation-unsound' skills/war/assets/workflow-template.test.mjs prints at least 1.
  6. Cross-round identity holds both directions: one park per persisting finding across
     N rounds, distinct same-task findings never collapse, and no finding lands in both
     `aced` and `minorsFiled` — fixtures titled `ask-content-key` ·
     check: grep -c 'ask-content-key' skills/war/assets/workflow-template.test.mjs prints at least 2.
  7. A cross-lane ask content collision merges as corroboration or logs — never a silent
     drop — and a seat label carrying the `:integrated-tip` or `:end-state` suffix
     yields the `execution-evidence` lens, never the suffix token, in every consuming
     record — fixtures titled `ask-collision` and `lens-suffix` ·
     check: grep -c 'ask-collision' skills/war/assets/workflow-template.test.mjs prints at least 1 && grep -c 'lens-suffix' skills/war/assets/workflow-template.test.mjs prints at least 1.
  8. `aceGroups()` and the `Ace-Subset` trailer key on normalized paths — a `./`-form
     and bare-form pair of the same file lands in one subset — fixture titled
     `ace-group-path` ·
     check: grep -c 'ace-group-path' skills/war/assets/workflow-template.test.mjs prints at least 1.
  9. The retired budget-exhaustion boundary is absent from all four #1812 homes and the
     new boundary prose is guard-bound ·
     check: ! grep -F 'demotes on budget' docs/adr/0013-commanders-intent-and-disposition-routing.md && ! grep -F 'exhaustion demotes the remainder' skills/war/SKILL.md CONTEXT.md && ! grep -F 'budget-exhausted remainder' skills/war/references/design.md && node --test skills/war/assets/skill-doc-contracts.test.mjs exits 0 && echo BOUNDARY-RETIRED prints BOUNDARY-RETIRED (each OLD needle ≥ 1 hit at 0.20.1 — re-measure at the cut base).
  10. Both prompt layers carry the widened disposition guidance — the dispatched
     `auditPrompt` DISPOSITION block and the standing `disposition-eligibility.md` home
     name re-audit-born default-absorb, new-test eligibility, and trade-off-ask routing ·
     check: grep -qi 're-audit' skills/war/references/disposition-eligibility.md && grep -qi 'trade-off' skills/war/references/disposition-eligibility.md && echo BOTH-LAYERS && node --test skills/war/assets/workflow-template.test.mjs exits 0 printing BOTH-LAYERS (the dispatched-layer half is pinned by the Task 1 prompt-literal fixtures; the worker's done report names the auditPrompt block edit).
  11. All four version slots and the CHANGELOG head carry the next free MINOR above the
     live integration base ·
     check: node --test skills/war/assets/version-slots.test.mjs exits 0 (plus the land-time differs-from-launch-base assertion; MINOR grade per D14).

## Build order (for /war)

Phase 1 (core routing — three tasks, one wave-edged chain) → Phase 2 (release).

## Phase 1 — Core routing

Three file-disjoint tasks; Tasks 2 and 3 carry `deps` edges onto Task 1 (they narrate
the engine facts Task 1 authors — rule 7). Each task re-enumerates every cited fix-site
at its rebased base before editing (PIN-14; all line citations date from the 2026-08-27
tip at 0.20.1).

### Task 1: Engine + tests + both prompt layers
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-auditor.md`, `skills/war/references/disposition-eligibility.md`
- Plan slice: (D1/D2, PIN-1/PIN-2) replace the "the ladder never opens for fresh
  findings" routing branch with budget-bounded re-entry: a fresh `absorb`-dispositioned
  finding born at ANY re-audit (plain approve-branch, bisection-subset, or a re-entry
  batch's own re-audit) dispatches another ace-style batch on the same machinery — same
  eligibility, same `Ace-Subset` trailer discipline with the existing round index, same
  tip-preflight idempotency (PIN-15), same forward-revert posture — while
  `fixRounds < roundLimit − 2`; reserve-blocked or spent routes the finding
  `phaseClose: true` (sweep), sweep-discard demotes to follow-up; every demotion logged.
  No new round type, no new status member. (D6/D7, PIN-6/7/8/9) extend the ask channel:
  the Checkpoint citation arm's outcome can be an actionable absorb — the engine
  executes it via the re-entry vehicle, stamps row-id + match rationale into the ace
  commit message and the `aced` record, and the re-audit prompt for a citation-resolved
  batch explicitly charges the panel with citation soundness (unsound ⇒ blocking ⇒
  revert ⇒ demote naming the mismatch). (D4) admit new-test additions in task-owned
  test files to the ace batch scope. Folds (D9, named fence members — re-verify each
  site at the cut base, PIN-14): (#1810) replace `parkAsk`'s object-identity dedup and
  the double-file arm with a content-keyed cross-round identity satisfying the D8
  property floor (verified: issue #1810 (2026-08-26); site `asks.some(a => a.finding === f)`,
  workflow-template.js ~:1831 at 0.20.1); (#1790) the cross-lane ask content dedup
  merges the collision as corroboration or logs it — never silent (verified: issue
  #1790 (2026-08-26); site the per-task gate-audit `parkAsk` guard ~:2536); (#1789)
  carve the `:integrated-tip`/`:end-state` suffixes out of the lens-extraction rule
  alongside `:rebut` (verified: issue #1789 (2026-08-26); site ~:2613); (#1813) apply
  `aceRelPath` at `aceGroups()` and the `Ace-Subset` trailer build so same-file findings
  never split across subsets (verified: issue #1813 (2026-08-26); site ~:1731). Prompt
  layers, same commit: the dispatched `auditPrompt` DISPOSITION block gains the
  re-audit-born default-absorb rule (D3), the new-test eligibility (D4), and the
  trade-off-ask routing (D5); the standing home `disposition-eligibility.md` gains the
  same three rules (it is un-budgeted; the auditor card's trigger pointer is verified
  live and its 2,385 B headroom is touched only if a pointer wording change proves
  necessary — no ceiling raise, the Budget-Raise floor refuses uncited raises). Tests
  in the same diff: the fixture families of End states 1–8 and 10, including the D8
  both-directions property fixtures. Byte discipline: run
  `prompt-surface-budgets.test.mjs` before push.
- Done when: node --test skills/war/assets/workflow-template.test.mjs
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: ADR 0013 amendment
- Files: `docs/adr/0013-commanders-intent-and-disposition-routing.md`
- Plan slice: one dated amendment ('Amendment (2026-08-27)') recording: the
  budget-bounded re-entry rule and its fallback ladder (D1/D2, quoting the reserve as
  the sole bound and the #1731 operator comments as provenance); the three disposition
  widenings (D3/D4/D5); the absorb-by-citation arm with the match-strictness rule, the
  panel soundness duty, and the record shape (D6); the telemetry ride (D7). In the same
  amendment, requalify the 2026-08-20 amendment's now-retired "the remainder demotes on
  budget exhaustion" narration to the reserve/re-entry boundary (#1812's ADR home —
  dated qualification note, ratified text untouched) (verified: issue #1812
  (2026-08-26)). Ratified prior text stays byte-untouched; keep
  `skill-doc-contracts.test.mjs` green (D38/D19a read this file — an additive dated
  amendment outside the pinned spans).
- Done when: None — prose amendment; Task 3's suite run guards it (its guard rows land
  there, deps-edged)
- requiresTest: false
- requiresPackaging: false
- deps: [Phase 1 Task 1]
- target repo: superproject

### Task 3: Doc mirrors + boundary guard rows + telemetry row
- Files: `skills/war/references/schemas.md`, `CONTEXT.md`, `skills/war/SKILL.md`, `skills/war/references/design.md`, `skills/war-review/SKILL.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: (D10, PIN-12 — re-verify each home at the cut base, PIN-14) re-author the
  remaining three #1812 boundary homes to the new re-entry/reserve semantics: the
  `skills/war/SKILL.md` `--ace` bullet ("exhaustion demotes the remainder" → the
  re-entry + reserve ladder, End state 9's OLD-absent needle), CONTEXT.md's
  **Ace bisection** glossary row (same retirement) plus the two new glossary terms
  (**Re-entry**, **Absorb-by-citation** — D14's New-domain-terms rows), and
  `design.md` §18's "(or a budget-exhausted remainder) demote" clause. Extend the
  `skills/war/SKILL.md` Checkpoint `--afk` posture sentence: a citation-match may carry
  an actionable absorb outcome with row-id + rationale recorded (D6) — lock-step move of
  any D37/D41 keys reading that sentence, budget suite green (the file carries a
  budgets row). schemas.md: document the citation-resolution record on the `aced` row
  and the ask-channel arms' new routing (content-key identity, corroboration-merge) —
  additive field notes, no contract fork. (D7) add the citation-resolution count to
  `skills/war-review/SKILL.md`'s telemetry enumeration (one row: citation-resolutions
  per standing row, sourced from `aced` records; `n/a` when unsourceable) — keep
  `war-pipeline-structure.test.sh` green (A3; lock-step if a key reads the block).
  (D10's guard half — the flip ships the guard) add `skill-doc-contracts.test.mjs`
  rows binding the NEW boundary prose across its homes: a next-free-D-number row with
  construct-scoped extraction (the D35 idiom) pinning the reserve/re-entry token in the
  ADR 0013 amendment (Task 2's fact — hence the deps edge), the SKILL.md `--ace`
  bullet, and CONTEXT.md's row; both-ways proof per house convention (scratch-flip one
  home, observe red, restore — trace in the done report).
- Done when: node --test skills/war/assets/skill-doc-contracts.test.mjs
- requiresTest: true
- requiresPackaging: false
- deps: [Phase 1 Task 1, Phase 1 Task 2]
- target repo: superproject

## Phase 2 — Release

### Task 1: Version bump (all four slots + CHANGELOG head)
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`
- Plan slice: bump all four slots together — `plugin.json` `version`,
  `marketplace.json` `metadata.version` AND `plugins[0].version`, the `README.md`
  `## Status` line (replace-in-place, no badge) — to the **next free MINOR above the
  live integration base at land time** (D14 — directive, never a resolved literal;
  behavior-visible routing changes ratify the minor grade). Append the CHANGELOG entry
  newest-first (head version must equal `plugin.json`'s; `version-slots.test.mjs` is
  the arbiter), relocating the superseded Status blurb per release doctrine. Blurb
  duty: state the routing widenings as auditor/engine behavior ("findings born at
  re-audit re-enter the ace ladder…"), count the retired issues accurately
  (count-before-landing lesson), and bound every categorical scope claim.
  Land-time assertion: the resolved version differs from the launch-base version and
  its MINOR component advanced.
- Done when: node --test skills/war/assets/version-slots.test.mjs
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Realized absorb rate + citation-fire telemetry in the field: the fixtures prove
  routing, not the litter-rate outcome · why deferred: needs a live campaign run's
  filing volume and `/war-review` telemetry · runner: operator via `/war-review` after
  the next landed campaign run.
- Standing-row calibration: an over-broad row firing constantly is a narrowing signal ·
  why deferred: needs accumulated citation-resolution counts across runs · runner:
  operator, on the first `/war-review` showing a row with disproportionate fire count.
- Re-entry budget pressure on real phases: the reserve bound is arithmetic, but whether
  default `roundLimit: 6` leaves useful re-entry room on busy tasks is empirical · why
  deferred: the roundLimit=6 ruling (plan-1 Checkpoint adjudication) stands until field
  data says otherwise · runner: operator, revisiting the plan-1 roundLimit adjudication
  after two campaigns' `/war-review` reports.

## Notes / conscious deviations

- **Compressed interview (operator token budget, 2026-08-27):** the four pivotal forks
  and the closing beats (latitude + two echo-backs) ran as two batched question rounds
  instead of one-question-per-turn; recommendation-first and bare-assent semantics
  preserved; every ruling recorded `(user)` in the design tree. The operator's answers
  substantially amended the recommendations — the superseding evidence rule (#1731's
  comments over its body) is itself one of the recorded corrections.
- **Wrap enumeration:** this plan retires, on landing — enhancements #1731, #1838,
  #1845, #1846 (close with the release); folds #1810, #1789, #1790, #1813, #1812
  (close at the phase-1 land). Plan 3's fold-batch-2 rows for #1812 are retired at its
  re-amendment (operator-accepted).
- **#1788 exclusion (operator-ruled):** collapse-key spoofing is corroboration/filing
  integrity, orthogonal to the new arms — stays on the ladder.
- **T1 is deliberately large** (engine + tests + both prompt layers in one diff): the
  per-task test-in-diff floor and the standing/dispatched same-commit law both force
  it; house precedent is the realized-absorb-rate plan's Task 1.1. The single worker
  sequences by construct (re-entry branch → ask arms → folds → prompts → fixtures).
- **WAIVE rows:** none.

## Open decisions

None — all forks ruled in the 2026-08-27 interview (design tree, `(user)` rows).
