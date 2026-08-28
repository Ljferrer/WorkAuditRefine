# In-run finding resolution — mechanical findings die in-run, not as issues

Authored by `/war-strategy` (compressed operator interview, 2026-08-27 — see Notes).
Core issues: #1731, #1838, #1845, #1846 (the disposition-routing enhancement family);
folded ask-machinery defects: #1810, #1789, #1790, #1813; folded doc cascade: #1812.
One landed run of this plan retires five open `war-followup` issues and all four
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
- #1731-cited artifacts (red-team round 1 completion): issue #1563 (loud demotion
  routing — the arm this plan's re-entry replaces) · read; issue #1547 (roundLimit 3→6
  rationale D1's reserve arithmetic leans on) · read; issue #1726 (the live folded
  instance) · read; issues #1562/#1549/#1664/#1550 · read (each already cited in
  Context/Non-goals); the phase-1 workflow-journal demotion log (run
  `2026-08-25-engine-reliability-and-filing-fidelity-2026-08-26`) · unread — the
  demotion text is quoted verbatim in #1731's body and re-verified against the live
  engine's routing branch, so the journal adds no decision-relevant signal · unread-with-reason

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

- The floor-retry reserve is landed law for bisection SUBSET commits only: they dispatch
  while `fixRounds < roundLimit − 2` (plan-1 phase 7, D12/Open-decision-4); the batch ace
  keeps its own `< roundLimit` gate (workflow-template.js ~:1774-1779, :1882 at 0.20.1 —
  re-measure at the cut base). Task 1's re-entry dispatch adds a NEW `< roundLimit − 2`
  gate for re-entry batches; the existing batch-ace gate is deliberately left at
  `< roundLimit` (red-team round 1, operator-ratified). The roundLimit=6 default was
  re-ratified at the plan-1 Checkpoint (adjudication row, 2026-08-26).
- Standing/dispatched prompt split: auditor-behavior guidance must change on BOTH layers
  (standing card/references home + the dispatched `auditPrompt` blocks) in the same
  commit (CLAUDE.md law; the recorded drift trap).
- Byte budgets: `agents/war-auditor.md` hard 28,672 B (2,385 B headroom measured at
  0.20.1); `skills/war/SKILL.md` carries a budgets row; **`CONTEXT.md` hard 126,976 B
  with only 632 B of headroom at 0.20.1 — the tightest surface in this footprint,
  ratchet-down-only per its budgets-row comment** (Task 3 funds its additions by
  in-task eviction, never a raise); the `workflow-template.js` prompt-literal share
  measures 74,513 B against 79,872 B hard (5,359 B headroom) — Task 1's new prompt
  blocks fit within it or evict. The Budget-Raise floor refuses uncited ceiling raises.
  `disposition-eligibility.md` is un-budgeted (verified: red-team round 1 probe
  measurements at 20407a0).
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
| D9 | Fold enumeration fence | The four machinery folds (#1810, #1789, #1790, #1813) land as named slice members with their fix sites cited, and the engine-fence clause enumerates them — folded fixes never ride unnamed. #1790's fix covers all THREE structurally identical unlogged ask-drop guards (red-team round 1 measured three, not one — ~:2610, :2686, :2729 at 20407a0): each merges a content-dedup collision as corroboration (or at minimum logs it), proven by ONE parametrized fixture over the three sites plus a no-silent-discard negative control — never three hand-copied tests. | (user; red-team round 1) | PIN-11 · guardrail |
| D10 | #1812 homes owned here | The four boundary-prose homes (ADR 0013 amendment · `skills/war/SKILL.md` `--ace` bullet · CONTEXT.md **Ace bisection** glossary row · `design.md` §18) are re-authored to the NEW re-entry/reserve semantics in this plan, and `skill-doc-contracts.test.mjs` gains guard rows binding the new boundary prose — the flip ships the guard (the old drift was silent precisely because no row carried the token). | (user; verified: issue #1812 (2026-08-26)) | PIN-12 · slice |
| D11 | Campaign placement | Next in the paused 2026-08-25-survey-debt queue, cut from post-merge 0.20.1 master, BEFORE plans 2 and 3. **Plan-2 deferral ruling (recorded)**: plan 2 (authoring-doctrine) is file-disjoint and deliberately waits one run — core-fix-first per operator. Plan 3 re-amended after this lands. | (user) | PIN-13 · context |
| D12 | Cut-base re-verification duty | Every folded fix-site line citation (#1810/#1789/#1790/#1813) and each #1812 prose home was verified at the 2026-08-27 tip; the worker re-enumerates each at the actual cut base before editing (D12 staleness law). | (user) | PIN-14 · slice |
| D13 | Re-entry dispatch hygiene | Re-entry rounds inherit the existing `Ace-Subset` trailer discipline and tip-preflight idempotency verbatim — new dispatch sites, existing law, stated so a resume never duplicates a batch. | (user) | PIN-15 · guardrail |
| D14 | Release grade | MINOR — behavior-visible routing changes; the bump directive is "next free MINOR above the live integration base at land time", never a resolved literal (the patch→minor silent-flip lesson). | (user) | PIN-16 · slice |
| D15 | Interactive ruled-ask execution (red-team round 1, operator-ratified) | An interactively-ruled ask whose fix is fully specified executes in-run — but NOT via the intra-task re-entry ladder (asks are ruled at the post-land Checkpoint, after the ladder closes). Vehicles: **(a) next phase exists** ⇒ the Lead injects the ruled ask into that phase's decompose as a small first-class task carrying the ruling, the finding, and the `suggested_fix` as its slice (all existing machinery — worker, floors, panel, that phase's budget; the proven fold-forward pattern); **(b) final phase** ⇒ one polish-style post-land dispatch (fresh worktree at the working tip, one ace-eligibility commit, full panel, existing merge/land primitives), bounded at one round by construction. Filing parity becomes filing-on-non-execution: an issue is filed ONLY on cannot-execute (no vehicle, cross-task, budget) or execution-failure (regression ⇒ revert), the ruling recorded in the issue either way — nothing silent. The ruled-ask adjudication row is written in **standing-row format**, so today's interactive ruling becomes tomorrow's `--afk` citation source (#1845's two arms feeding each other). | (user) | PIN-17 · guardrail; PIN-18 · end-state |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Re-entry convergence needs no new bound beyond the reserve: a forward-reverted finding demotes and never re-enters, so oscillation cannot recur within the budget | landed forward-revert demotion semantics (plan 1 phase 7) | an oscillating batch burns budget until the reserve — bounded, logged, ugly but safe | End state 1's convergence fixture; the reserve hard-stop |
| A2 | Standing-row matching is panel judgment (prompt-charged), never engine-side NLP — the engine records and routes, the re-audit panel judges soundness | the citation arm is already prompt-side (SKILL.md Checkpoint, verified 0.20.1) | a code-side matcher would be new machinery — out of scope, re-plan | End states 4–5's fixtures exercise record/route only |
| A3 | The `war-review` telemetry row and the `skills/war/SKILL.md` edits keep `war-pipeline-structure.test.sh` and the budgets/D37/D41/D42 pins green via lock-step moves | pin inventory read at 0.20.1 | red pins at merge — coupling updates in the same commit, never loosened | Task 3's widened Done-when runs `war-pipeline-structure.test.sh` directly; Task 1's runs `reference-link-integrity.test.mjs` (red-team round 1 closed the discharge gap) |

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
  `/war-review` telemetry (D7); interactively, a ruled ask with a fully-specified fix
  executes in-run via decompose-injection or a bounded post-land polish dispatch, filing
  only on non-execution (D15); harden the ask channel the new arms lean on — the four
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
  - a ruled ask files an issue ONLY on cannot-execute or execution-failure, with the
    ruling recorded in it — never silently, never as default litter (PIN-17);
  - standing and dispatched prompt surfaces change in the same commit;
  - the engine-fence clause enumerates the four folds (#1810, #1789, #1790, #1813) —
    no unnamed rider edits (PIN-11), and #1790's treatment covers all three measured
    sink sites with one parametrized fixture.
- **End state:** (12 rows, exact)
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
  7. Every measured ask-drop sink (the three structurally identical guards) merges a
     content collision as corroboration or logs it — one parametrized fixture over the
     three sites plus a no-silent-discard negative control — and the lens-extraction
     rule keys on the FAMILY PREFIX: any seat label whose first segment is `gate-audit`
     yields the `execution-evidence` lens (otherwise trailing-segment extraction with
     the `:rebut` dispatch-label strip), with the wrong-yield negative control asserting
     `phase-1` is never produced as a lens from a phase-level label — fixtures titled
     `ask-collision` and `lens-suffix` ·
     check: grep -c 'ask-collision' skills/war/assets/workflow-template.test.mjs prints at least 1 && grep -c 'lens-suffix' skills/war/assets/workflow-template.test.mjs prints at least 1.
  8. `aceGroups()` and the `Ace-Subset` trailer key on normalized paths — a `./`-form
     and bare-form pair of the same file lands in one subset — fixture titled
     `ace-group-path` ·
     check: grep -c 'ace-group-path' skills/war/assets/workflow-template.test.mjs prints at least 1.
  9. The retired budget-exhaustion boundary is absent from the three LIVING-DOC #1812
     homes, the ADR home carries the dated supersession note (append-only law — the
     historical 2026-08-20 clause deliberately survives; red-team round 1, operator
     pin), and the new boundary prose is guard-bound ·
     check: ! grep -F 'exhaustion demotes the remainder' skills/war/SKILL.md CONTEXT.md && ! grep -F 'budget-exhausted remainder' skills/war/references/design.md && grep -F 'floor-retry reserve' docs/adr/0013-commanders-intent-and-disposition-routing.md && node --test skills/war/assets/skill-doc-contracts.test.mjs exits 0 && echo BOUNDARY-RETIRED prints BOUNDARY-RETIRED (living-doc OLD needles ≥ 1 hit and the ADR NEW needle 'floor-retry reserve' ZERO hits at 20407a0, so all conjuncts are decisive — re-measure at the cut base).
  10. Both prompt layers carry the widened disposition guidance — the dispatched
     `auditPrompt` DISPOSITION block and the standing `disposition-eligibility.md` home
     name re-audit-born default-absorb, new-test eligibility, and trade-off-ask routing ·
     check: grep -qi 'born at a re-audit' skills/war/references/disposition-eligibility.md && grep -qi 'trade-off' skills/war/references/disposition-eligibility.md && grep -c 'disposition-prompt-widened' skills/war/assets/workflow-template.test.mjs && node --test skills/war/assets/workflow-template.test.mjs exits 0 && echo BOTH-LAYERS prints BOTH-LAYERS ('born at a re-audit' and 'disposition-prompt-widened' are ZERO-hit at 20407a0 — red-team round 1 proved the prior 're-audit' needle vacuous (a pre-existing hit) — so both conjuncts are decisive; the dispatched-layer half is the named prompt-literal fixture, not the generic suite run).
  11. All four version slots and the CHANGELOG head carry the next free MINOR above the
     live integration base ·
     check: node --test skills/war/assets/version-slots.test.mjs exits 0 (plus the land-time differs-from-launch-base assertion; MINOR grade per D14).
  12. An interactively-ruled ask with a fully-specified fix executes in-run: the
     final-phase polish-style dispatch arm is fixture-proven, and the Checkpoint
     doctrine names both vehicles and the filing-on-non-execution rule — fixture titled
     `ruled-ask-absorb`; the decompose-injection arm is Lead doctrine, pinned by grep ·
     check: grep -c 'ruled-ask-absorb' skills/war/assets/workflow-template.test.mjs prints at least 1 && grep -qi 'cannot-execute' skills/war/SKILL.md && echo RULED-ASK-EXECUTES prints RULED-ASK-EXECUTES (both needles ZERO-hit at 20407a0 — decisive).

## Build order (for /war)

Phase 1 (core routing — three tasks, one wave-edged chain) → Phase 2 (release).

## Phase 1 — Core routing

Three file-disjoint tasks; Tasks 2 and 3 carry `deps` edges onto Task 1 (they narrate
the engine facts Task 1 authors — rule 7). Each task re-enumerates every cited fix-site
at its rebased base before editing (PIN-14; all line citations date from the 2026-08-27
tip at 0.20.1).

### Task 1: Engine + tests + both prompt layers
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-auditor.md`, `skills/war/references/disposition-eligibility.md`, `skills/war/references/file-followups.md`
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
  test files to the ace batch scope. Re-entry gating (red-team round 1): the re-entry
  dispatch adds a NEW `< roundLimit − 2` gate; the existing batch-ace `< roundLimit`
  gate (~:1774-1779, :1882) is deliberately untouched. (D15, both halves this task can
  reach) the final-phase polish-style ruled-ask dispatch arm — fresh worktree at the
  working tip, one ace-eligibility commit, full panel, existing merge/land primitives,
  bounded one round — with its `ruled-ask-absorb` fixture (End state 12); the
  decompose-injection arm is Lead doctrine and rides Task 3's SKILL.md edit. Folds
  (D9, named fence members — re-verify each site at the cut base, PIN-14; line cites
  corrected by red-team round 1 at 20407a0): (#1810) replace `parkAsk`'s
  object-identity dedup and the double-file arm with a content-keyed cross-round
  identity satisfying the D8 property floor (verified: issue #1810 (2026-08-26); site
  `asks.some(a => a.finding === f)` at workflow-template.js:893 inside `const parkAsk`
  at :892 — the ~:1824/:1837 lines are call sites, not the dedup); (#1790) ALL THREE
  structurally identical unlogged ask-drop guards (~:2610, :2686, :2729) merge the
  collision as corroboration or log it — never silent — proven by one parametrized
  fixture over the three sites plus a no-silent-discard negative control (verified:
  issue #1790 (2026-08-26); red-team round 1 measured three sinks, not one); (#1789)
  replace the suffix enumeration with the FAMILY-PREFIX rule — any seat label whose
  first segment is `gate-audit` extracts lens `execution-evidence`; otherwise
  trailing-segment extraction with the `:rebut` dispatch-label strip — on BOTH mirror
  surfaces in the same commit: the dispatched filing clause (workflow-template.js
  ~:3340, NOT ~:2613 — that is #1790's code) and its standing mirror
  `skills/war/references/file-followups.md` (~:9), whose existing
  workflow-template.test.mjs ~:5918 pin moves lock-step; fixture includes the
  wrong-yield negative control (`phase-1` never produced as a lens) (verified: issue
  #1789 (2026-08-26); red-team round 1 re-anchored the site); (#1813) apply
  `aceRelPath` at `aceGroups()` and the `Ace-Subset` trailer build so same-file findings
  never split across subsets (verified: issue #1813 (2026-08-26); site ~:1731). Prompt
  layers, same commit: the dispatched `auditPrompt` DISPOSITION block gains the
  re-audit-born default-absorb rule (D3), the new-test eligibility (D4), and the
  trade-off-ask routing (D5) — the dispatched block's edit pinned by a fixture titled
  `disposition-prompt-widened` (End state 10's dispatched-layer predicate); the
  standing home `disposition-eligibility.md` gains the same three rules, the
  re-audit-born rule carrying the literal phrase 'born at a re-audit' (End state 10's
  standing needle — the file's pre-existing 're-audit' mention makes any looser needle
  vacuous, red-team round 1) (it is un-budgeted; the auditor card's trigger pointer is
  verified live and its 2,385 B headroom is touched only if a pointer wording change
  proves necessary — no ceiling raise, the Budget-Raise floor refuses uncited raises).
  Tests in the same diff: the fixture families of End states 1–8, 10, and 12, including
  the D8 both-directions property fixtures. Byte discipline: run
  `prompt-surface-budgets.test.mjs` before push (the workflow-template.js
  prompt-literal share has 5,359 B headroom — new prompt blocks fit within it or evict).
- Done when: node --test skills/war/assets/workflow-template.test.mjs && node --test skills/war/assets/reference-link-integrity.test.mjs
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
  amendment, supersede the 2026-08-20 amendment's now-retired "the remainder demotes on
  budget exhaustion" narration (#1812's ADR home — dated note, ratified text untouched,
  append-only law; #1850's living-ADR direction is ratified but explicitly deferred
  until after this plan lands) with EXPLICIT supersession language so the dual-literal
  state self-disambiguates for a cold reader — the note names its predecessor, in the
  shape: "As of <date>: the ladder's stop condition is the floor-retry reserve
  (fixRounds < roundLimit − 2) with budget-bounded re-entry; the 2026-08-20 clause
  above describes the pre-#1562 boundary and is historical." (red-team round 1,
  operator pins; the note's 'floor-retry reserve' literal is End state 9's ADR
  NEW-present needle) (verified: issue #1812 (2026-08-26)). Ratified prior text stays
  byte-untouched; keep `skill-doc-contracts.test.mjs` green (D38/D19a read this file —
  an additive dated amendment outside the pinned spans).
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
  (**Re-entry**, **Absorb-by-citation** — the `## New domain terms` section's rows), and
  `design.md` §18's "(or a budget-exhausted remainder) demote" clause. CONTEXT.md BYTE
  FUNDING (red-team round 1, operator pins — the file has 632 B of hard headroom, the
  tightest surface in this footprint): fund the two new terms + the Ace-bisection
  re-authoring by an in-task ADR-0042 byte-identical eviction of cold CONTEXT.md
  entries to `skills/war/references/glossary-cold.md`, coldness criterion stated
  (retired-mechanism terms, or terms fully narrated in their own reference file where
  a pointer suffices), each evicted entry leaving the hot trigger-pointer line and its
  `skill-doc-contracts` guard rows RE-ANCHORED to the cold file in the same commit
  (lock-step — a guard still grepping CONTEXT.md for an evicted entry is an instant
  red or a vacuous pin); size the eviction to leave ~1 KB of slack beyond the
  additions, measured by `wc -c` iteration (the plan-4 pattern); never a ceiling
  raise. Extend the `skills/war/SKILL.md` Checkpoint doctrine (both D6 and D15):
  a citation-match may carry an actionable absorb outcome with row-id + rationale
  recorded; an interactively-ruled ask with a fully-specified fix executes in-run —
  next-phase decompose-injection as a first-class task, or the final-phase
  polish-style dispatch — with filing ONLY on cannot-execute or execution-failure
  (the ruling recorded in the filed issue either way), and ruled-ask adjudication
  rows written in standing-row format (the literal 'cannot-execute' is End state 12's
  SKILL needle) — lock-step move of any D37/D41 keys reading these sentences, budget
  suite green (the file carries a budgets row), and the dispatched-prompt mirror of
  the Checkpoint filing change rides Task 1's same-commit law. schemas.md: document
  the citation-resolution record on the `aced` row and the ask-channel arms' new
  routing (content-key identity, corroboration-merge) — additive field notes, no
  contract fork (de-mirror posture: each row cites the engine construct as canonical,
  never restating values a guard would have to pin). (D7) add the citation-resolution
  count to `skills/war-review/SKILL.md`'s telemetry enumeration (one row:
  citation-resolutions per standing row, sourced from `aced` records; `n/a` when
  unsourceable) — keep `war-pipeline-structure.test.sh` green (A3; lock-step if a key
  reads the block). (D10's guard half — the flip ships the guard) add
  `skill-doc-contracts.test.mjs` rows binding the NEW boundary prose: a
  next-free-D-number row with construct-scoped extraction (the D35 idiom) pinning the
  reserve/re-entry token in the THREE living-doc homes — the SKILL.md `--ace` bullet,
  CONTEXT.md's row, and design.md §18 — with the ADR 0013 home DELIBERATELY EXEMPT,
  the exemption stated in the row comment as append-only-law-derived (the historical
  2026-08-20 literal survives by design, #1850 deferred; never oversight), and the
  guard demonstrably firing on a living-doc regression so the carve-out cannot hollow
  it (both-ways proof: scratch-flip one living-doc home, observe red, restore — trace
  in the done report). The ADR note's presence is End state 9's separate NEW-present
  conjunct (Task 2's fact — hence the deps edge).
- Done when: node --test skills/war/assets/skill-doc-contracts.test.mjs && bash skills/war-machine/war-pipeline-structure.test.sh
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
- **Red-team round 1 (2026-08-27, interactive):** 8/8 probes on-target; the grill ruled
  four decisions (ADR append-only wins with supersession language — #1850's living-ADR
  direction deferred until after this plan; the lens fix is the family-prefix rule, not
  a suffix enumeration; interactively-ruled asks execute in-run via decompose-injection
  or the final-phase polish dispatch, filing only on non-execution; the CONTEXT.md
  additions are eviction-funded and #1790's fix covers all three measured sinks) and
  seven mechanical patch families (fold line cites re-anchored — :893, :3340,
  :2607-2611; vacuous End-state needles replaced; the file-followups.md standing leg
  added; byte-budget rows completed; Done-whens widened; Evidence-consumed rows
  completed; the reserve law rescoped to subset-commits-only with re-entry's new gate
  stated).

## Open decisions

None — all forks ruled in the 2026-08-27 interview (design tree, `(user)` rows).
