# The ask disposition — park the finding, rule at the Checkpoint (+ the grind backstop)

## Context — the gap / problem

Decision-shaped Minor/Nit findings have no lawful channel: the disposition ladder routes work
(`absorb`), debt (`follow-up`), or observations (`note`), and the auditor card's own eligibility
clause ends "Only the accompanying policy question routes as an issue" — a question filed as an
issue is a decision made by whoever closes the backlog, not by the operator at the moment the
context is live (verified: `agents/war-auditor.md` eligibility blockquote at `a60221a`). The class
is real and current: the authoring-side-verification campaign filed #1650 self-described as "a
deliberate contract decision," #1651 (a budget policy call), and #1662 (a release-scope ruling) as
follow-up issues for want of a mid-phase channel (verified: epic phase reports on #1630–#1633
(2026-08-25)). #1550 commits the channel; #1547 item 5 and its ratification comment are the
substance (verified: issue #1547 (2026-08-19); issue #1550 (2026-08-20)). #1550 predates the
Evidence-artifacts duty and carries no `## Evidence artifacts` section — a named gap, recorded in
the Evidence consumed block below, never a blocker.

**The Major-decision gap, in plain sight (PIN-5):** the `ask` disposition is Minor/Nit-only by
construction — `dispositionOf` is reachable only through the severity filter; Critical/Major
findings route via `blockingOf` and never carry a disposition (verified:
`skills/war/assets/workflow-template.js` `minorsOf`/`blockingOf` at `a60221a`). It is NOT the
stuck-task valve #1547's ratification comment premised the `roundLimit` 3→6 flip on: `escalate`
already exits the fix loop at round 1, and the rounds that grind are `request_changes` rounds,
assigned "by construction, however severe" (verified: `agents/war-auditor.md` +
`workflow-template.js` fix-round loop at `a60221a`). Decision-shaped blockers remain
escalate/request_changes territory pending the measured follow-on (#1664) — so the
`roundLimit`=6 ceiling's justification is now **backstop-dependent** (PIN-3; backstop row 1).

This plan was authored under the 0.19.0 authoring-side-verification doctrine, and its interview is
part of its own evidence: 9 verifier dispatches, 7 refutations — including two fictional evidence
sources caught only by the machinery (PIN-4's advisor-ratified per-round `auditLog` rows, and the
interviewer's round-token label fix — labels never persist to any transcript; verified: a live
run's `journal.jsonl` carries `{agentId, key, result, type}` only, zero label fields — verified at the
war-strategy-mirror-guards run's transcriptDir (2026-08-17 manifest)).

**Evidence consumed** (the recon lane's record — read / unread-with-reason):
- issue #1550 body — read (no `## Evidence artifacts` section: pre-duty issue, named gap).
- issue #1547 item 5 + the 2026-08-19 ratification comment — read.
- Run manifests: `authoring-side-verification-2026-08-24.json` — read;
  `realized-absorb-rate-2026-08-19{,-r2}.json` — read (phase-1 demotion incident);
  `adr-doc-truth-sweep-2026-08-20{,-r5}.json` — unread (predates the 0.19.0 machinery; the asv
  campaign is the freshest doctrine-relevant run and was read in full).
- Epic phase reports #1630–#1633 — read (the #1650/#1651/#1662 decision-shaped exemplars).
- war-followup corpus (83 open at `a60221a`) — titles swept; #1650/#1651/#1662/#1331 bodies read.
- issue #1492 comment thread — read (the classification-window study this plan's telemetry feeds).
- Memory prefetch (batched JSONL, six areas) — read; engine recon map + one live transcriptDir —
  read (the journal row-shape verification above).

## Pivotal constraints

- The Workflow is a background process: no in-process ask primitive exists (no fs, no operator
  channel beyond the return, `log()`, and delegated dispatches) — asks park in the artifact and
  are ruled at the Checkpoint, never mid-run.
- Engine fence: `workflow-template.js` + `workflow-template.test.mjs` are the only engine files,
  with `land-decision.test.mjs` as read-only-collateral guard owner; **literal-class fence** — no
  new `landDecision`-shaped literal inside the scrape slice (the `// landDecision mirrors` block
  through the workflow-error literal), no new `status:'…'` literal inside the land-dispatch block.
- Asks never touch `landDecision`, `HARD_ESCALATION_REASONS`, or `KNOWN_LAND_DECISIONS` (the
  defectClass fence precedent; negative-guarded in `land-decision.test.mjs`).
- OLD-absent asserts cite existing literals verified present at task base (PIN-8's law — never a
  count word on a never-present value).
- The demotion invariant holds on every exit path: nothing drops silently; `demote()` refuses an
  ask loudly.
- All tasks superproject; no packaging; fail-open posture throughout.

## Resolved design tree

Duty/fence-class rows marked ‡ (read twice at echo-back reconciliation).

| # | Decision | Resolution | Source | Landing class |
|---|----------|------------|--------|---------------|
| D1 ‡ | The ask channel | fourth Minor/Nit disposition member; mandatory question+fork field (the decision needed + the two branches); explicit arm at every `dispositionOf` site with the ask arm preceding the absorb chain; `demote()` refuses ask; asks[] rides the top-level return + a ninth (lossy) handoff key; unruled asks are excluded from in-phase consolidation/filing — **never filed unruled**; ruled asks file Lead-side with filing parity (Evidence-artifacts + dedup against engine-filed rows) | (user) · PIN-1 | guardrail + slice (T1.1, T2.1) |
| D2 | The valve is not this plan | channel 2 (blocking-class round-grinding valve) dropped: `escalate` exits at round 1, the grinding rounds are `request_changes` by construction, and the real lever is that boundary — deferred to #1664 with the measured trigger | (user) · PIN-2, PIN-3 | non-goal + backstop |
| D3 ‡ | Grind measurement sources | terminal `fixRounds` (manifest `phases[].dispatches.fixRounds`), the filing site's audit-round field, and `minorsFiled` rationales — round-level attribution does not exist and the coarseness is named; the **failure-routing asymmetry is the load-bearing property**: ambiguity routes to #1664's instrumentation-first refinement, never to silent "no grinding" | (user) · PIN-4, PIN-11 | backstop + slice (T2.5) |
| D4 ‡ | Checkpoint ruling | ONE strike-list gate rules all parked asks in a single pass (the tighten/red-team one-gate precedent); the advance floor is **absolute** — never advance the DAG over an unruled ask — and binds interactively (stated; under `--afk`: a standing-adjudication match resolves by citation, a no-match demotes to follow-up with the question preserved — visibly not loss-free — and a suppression row is minted only from an operator ruling, provenance-marked) | (user) · PIN-14, PIN-1 | guardrail + slice (T2.1) |
| D5 | Decision record | dated ADR 0013 amendment (byte-discipline) + the ADR 0012 one-line cross-ref (its line-90 style); producer set widens two → three (Checkpoint ask rulings) on all five prose homes, both edit sites where two exist, plus the auditor consumer bullet; OLD-absent on the existing two-producer literals | (user) · PIN-6 | slice (T2.4, T2.1, T2.2, T2.3, T1.1) |
| D6 ‡ | The sweep law | CLASS-1 enum widening (schema enum, `dispositionOf`, DISPOSITION RULE + byte mirror, the two pins) · CLASS-2 closed-shape widening keyed on enumerated order-bearing mirrors that exist (schemas.md handoff rows, the SKILL.md render list, the return line) — count-word absence asserts banned by name; the disposition-home census is discovered at task base (grep surface paths across `**/*.test.mjs`, `**/*.test.sh`, `.tours/`), four-sentence floor, never a ceiling | (user) · PIN-6, PIN-8 | guardrail + slice (T1.1, T2.2, T2.3) |
| D7 ‡ | Census domains | order-census domain = the six `dispositionOf` sites PLUS the `pinMismatch` strip (a non-dispositionOf sink, named in its comment + its own census row); discovered-guard census domain = guards anchored on each touched passage at task base | (user) · PIN-13 | guardrail + slice (T1.1) |
| D8 | Guard homes own their tripwires | T1.1 carries every lock-step guard home it trips: the contracts suite's absorb-block guard (evict-and-re-anchor to the destination file), `QUALIFIED_HEADERS` join, the D2 references census placement (`VERB_SCAN_EXCLUSIONS` + stated reason), the land-path negative rows | (user) · PIN-6, PIN-13 | slice (T1.1) |
| D9 ‡ | Done-when law | a task's Done-when enumerates ALL its touched guard suites — T1.1's names five; a touched suite outside the Done-when is a red discovered at the refiner gate after the worker is spent | (user) · PIN-9 | guardrail + slice (T1.1) |
| D10 ‡ | Tour re-anchor base | T2.5 re-anchors the tour's raw line anchors and adds pattern keys, computed against the integration base already carrying T1.1's insertions — anchoring from any earlier reference reproduces the rot being closed | (user) · PIN-10 | slice (T2.5) |
| D11 | Filing-parity owners | `skills/war/references/file-followups.md` carries the canonical parity text; the refiner card's closed-set predicate widens within its 194 B hard headroom or takes a named #1475-style eviction — never silence | (user) · PIN-7 | slice (T2.2) |
| D12 | Budget oracle | every touched budgeted surface stays within its hard ceiling (both the auditor card and SKILL.md are already over advisory — acknowledged, warn-only); the card arithmetic: additions net of the 1,540 B eligibility eviction against 1,682 B headroom; SKILL.md's Checkpoint block against 6,359 B | (user) · PIN-13 | end-state + slice (T1.1, T2.1) |
| D13 | Servitor directive | capture the vacuous-OLD-absent lesson (five specimens, the fifth advisor-ratified — the leak class doesn't respect authority; only the homeless-pin sweep forced verification) and the unvalidated-join-executor pattern; the authoring-doctrine one-liner is out of scope — the next survey promotes it | (user) · PIN-8, PIN-12 | non-goal |
| D14 | Interview provenance | bare-invoke `/war-strategy` in-skill (2026-08-25); 9 verifier dispatches, 7 refutations; zero WAIVE rows; backstop row 2 of the asv plan discharged (first armed beat fired, corpus full) | (user) | context |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Asks per phase stay strike-list-tractable | the asv campaign's decision-shaped rate: 3 of ~14 follow-ups | Checkpoint friction; the one-gate stays one gate either way | backstop row 2 |
| A2 | The coarse grind proxy is decision-sensitive enough | terminal findings + rationales carry the fork language | #1664 activates late — routed by the named asymmetry, never silent | backstop row 1 |
| A3 | 194 B suffices for the refiner predicate widening | measured at `a60221a` | the named #1475-style eviction (D11) | End state 13's budget gate |
| A4 | The filing-parity text names no scanned-module CLI | D2's exclusion reason for `file-followups.md` stays valid | `doc-cli-consistency` reds on rotted-reason with the suite unowned in phase 2 | T2.2 slice constraint + End state 4 |

## Non-goals / deferred

- **Channel 2 — the blocking-class valve — is #1664, not this plan** (D2): the premise was
  falsified in mechanical form (escalate exits at round 1; the grinding rounds are
  `request_changes`); the boundary move is deferred behind the grind measurement, and the
  `roundLimit`=6 justification is backstop-dependent until then (PIN-3). A prose Non-goal without
  the tracked issue is the evaporation class — #1664 is the tracked issue.
- No change to Critical/Major routing, the never-rewrite discipline, the forward-revert contract,
  or any land-path enum.
- No new ADR number; no fail-closed lint; no `--afk` interactive pause (structurally impossible
  and rejected).
- The servitor lesson's authoring-doctrine one-liner (D13) — next survey promotes it.

## New domain terms · Recommended ADRs

Terms for CONTEXT.md (Task 2.3): **ask disposition** · **ruled / unruled ask** · **asks[] channel**
· **never-filed-unruled** · **strike-list ruling gate** · **grind measurement** ·
**failure-routing asymmetry**. Recommended ADRs: none new — the dated ADR 0013 amendment + the
ADR 0012 cross-ref (D5).

## Commander's Intent

- **Purpose:** a decision-shaped Minor/Nit finding reaches the operator as a question with its fork
  intact — ruled once, at one gate, with the ruling traveling into the record — instead of dying as
  a decision-free issue or a silent downstream choice.
- **Method:** widen the disposition ladder by one member with explicit arms everywhere and a loud
  refusal in the demotion router; park unruled asks in the artifact (return + handoff) and exclude
  them from in-phase filing; rule them at one Checkpoint strike-list gate behind an absolute
  advance floor; file ruled asks Lead-side with filing parity; record the contract as an ADR 0013
  amendment both consumers read; measure the deferred valve's premise with the grind backstop
  (#1664). The channel's live behavior is proven by backstop row 2, not by any End state — the
  End states prove doctrine, pins, and shape.
- **Mechanism latitude:** the eligibility file's prose and length · the order-census
  implementation idiom · the asks[] record's field names beyond the floored
  question + fork (+ task/seat/sha) · the handoff projection's lossy shape · the strike-list
  presentation format · the war-review row wording · tour pattern-key syntax · the D2
  exclusion-reason sentence placement · ADR amendment prose — substituting any of these mechanisms
  while the End states and binding guardrails hold is not a plan deviation and warrants no issue.
- **Binding guardrails:** the four-member enum literal + its Minor/Nit-only scope (PIN-1 · PIN-5)
  · the ask-arm-precedes-absorb-chain order + the order-census over its floored domain — the six
  `dispositionOf` sites plus the `pinMismatch` strip (PIN-13) · `demote()` refuses ask (PIN-1) ·
  never-filed-unruled + ruled-ask Lead-side filing parity (PIN-1) · the absolute advance floor +
  the one strike-list gate + the `--afk` posture (PIN-14) · the land-path fence and its
  literal-class form, negative-guarded in `land-decision.test.mjs` (PIN-13) · the mandatory
  question+fork field (PIN-1) · producer widening on all five homes, both edit sites where two
  exist (PIN-6) · the 0012↔0013 cross-ref (PIN-6) · the OLD-absent-cites-existing-literal law
  (PIN-8) · the discovered-guard census at task base with the four-sentence floor (PIN-6) ·
  T1.1's five-suite Done-when (PIN-9) · T2.5's re-anchor base (PIN-10) · the grind backstop's
  named coarseness + failure-routing asymmetry (PIN-11) · the ninth handoff key stays additive —
  no exact-key validator introduced (PIN-13) · the engine fence: `workflow-template.js` +
  `workflow-template.test.mjs` + `land-decision.test.mjs` (collateral guard only) (PIN-13) ·
  every floored duty sentence lands lock-step with its own presence pin (standing 0.19.0 law).
- **End state:**
  1. `AUDIT_VERDICT` disposition enum is `['absorb','follow-up','note','ask']`; every
     `dispositionOf` site carries an explicit ask arm preceding the absorb chain, default-deny
     order-census over the floored domain; `demote()` refuses ask loudly ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  2. asks[] rides the top-level return beside `minorsFiled`; the handoff carries the ninth (lossy)
     key; unruled asks are excluded from consolidation and the file-followups dispatch; the
     `pinMismatch` strip is comment-named and census-rowed ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`
  3. The auditor card's DISPOSITION RULE byte-mirror carries the fourth member + the question+fork
     duty; the eligibility blockquotes are evicted to
     `skills/war/references/disposition-eligibility.md` with the trigger pointer, and the contracts
     suite's absorb-block guard reads the destination file ·
     check: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
  4. The new references file is placed: `QUALIFIED_HEADERS` joined and the D2 census carries it in
     `VERB_SCAN_EXCLUSIONS` with a stated, non-rotting reason ·
     check: `node --test skills/war/assets/reference-link-integrity.test.mjs && node --test skills/_shared/doc-cli-consistency.test.mjs`
  5. The SKILL.md Checkpoint carries the strike-list ruling gate (one gate, all parked asks), the
     absolute advance floor with its interactive binding stated, ruled-ask filing parity, the
     `--afk` posture, and its producer + disposition-triple sentences ·
     check: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
  6. The references mirrors carry the widened shapes — schemas.md's enum lines and handoff rows,
     design.md and the exhaustiveness sentences gaining ask clauses with the closed phrasing
     retired, `file-followups.md` parity text, the refiner predicate (D11) ·
     check: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
  7. Producer widening lands on all five homes, both edit sites where two exist, the consumer
     bullet updated; verified by the adjudications second-producer scoped-absence test (construct
     locator) and contracts rows ·
     check: `node --test skills/war/assets/workflow-template.test.mjs && node --test skills/war/assets/skill-doc-contracts.test.mjs`
  8. The ADR 0013 dated amendment and the ADR 0012 cross-ref are present, D23-style pinned ·
     check: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
  9. The seven glossary terms are present and guarded in CONTEXT.md; the CLAUDE.md gospel line is
     current ·
     check: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
  10. Tour step 8 is retyped to the disposition world; the raw line anchors are re-based per D10
      with pattern keys; the tour arm is pinned ·
      check: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
  11. war-review carries both rows — the asks tally and the grind-measurement row naming its
      terminal-fixRounds sources — pinned in the pipeline suite ·
      check: `bash skills/war-machine/war-pipeline-structure.test.sh`
  12. Asks appear in NO land-path enum: negative rows in `land-decision.test.mjs`, and the
      literal-class fence held (no new `landDecision`-shaped or land-dispatch `status:` literal) ·
      check: `node --test skills/war/assets/land-decision.test.mjs`
  13. Every touched budgeted surface is within its hard ceiling (PIN-13) ·
      gate: `node --test skills/war/assets/prompt-surface-budgets.test.mjs`
  14. Release: all four slots + CHANGELOG at the next free **minor** above the live base (expected
      0.20.0 at base `a60221a` — dated snapshot, re-resolved at land) ·
      check: `node --test skills/war/assets/version-slots.test.mjs`
  15. At land, #1550 closes citing this plan and #1664 as the deferral tracker ·
      gate: the issue-lifecycle floor at land (Lead bookkeeping — not runnable pre-land)

## Build order (for /war)

Phase 1 (engine + auditor surface + every guard home it trips) → Phase 2 (Lead-side + mirrors) →
Phase 3 (release).

## Phase 1 — Engine, auditor surface, lock-step guards

### Task 1.1: The ask channel and its guard homes
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-auditor.md`, `skills/war/references/disposition-eligibility.md`, `skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war/assets/reference-link-integrity.test.mjs`, `skills/_shared/doc-cli-consistency.test.mjs`, `skills/war/assets/land-decision.test.mjs`
- Plan slice: land End states 1–4, 12, and the engine halves of 7 (D1 · PIN-1 · D6 · PIN-6 · D7 ·
  PIN-13 · D8 · PIN-8 · D9 · PIN-9 · D12).
  Enum + DISPOSITION RULE byte-mirror + deepEqual pin update; ask arms at the six `dispositionOf`
  sites (order: ask precedes the absorb chain) + the default-deny order-census over the floored
  domain incl. the `pinMismatch` strip row; `demote()` ask-refusal; asks[] return + ninth handoff
  key + unruled exclusion from consolidation/filing; the question+fork schema field; the
  producer-count comment + the adjudications second-producer scoped-absence test updated; the
  eligibility eviction (new file with at-eviction-time header) with the contracts-suite guard
  re-anchored to the destination in the same commit; `QUALIFIED_HEADERS` join; D2 census placement
  with stated reason; land-path negative rows; the literal-class fence honored (no new
  `landDecision`-shaped or land-dispatch `status:` literal). Card arithmetic per D12.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs && node --test skills/war/assets/skill-doc-contracts.test.mjs && node --test skills/war/assets/reference-link-integrity.test.mjs && node --test skills/_shared/doc-cli-consistency.test.mjs && node --test skills/war/assets/land-decision.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Lead-side + doc mirrors

### Task 2.1: The Checkpoint ruling gate
- Files: `skills/war/SKILL.md`
- Plan slice: the Checkpoint gains the strike-list ruling gate — one gate rules all parked asks in
  a single pass (D4 · PIN-14 · PIN-1), behind the absolute advance floor with its interactive
  binding stated; the producer sentence per D5 (PIN-6); the
  ruled-ask filing parity duties (Evidence-artifacts section + dedup against engine-filed rows);
  the `--afk` posture (match-cites · no-match-demotes-with-question · suppression rows minted only
  from operator rulings, provenance-marked); its producer sentence (both edit sites) and its
  disposition-triple sentence gain the widened forms; the Checkpoint block sized against D12's
  6,359 B hard headroom (PIN-13; the advisory breach is acknowledged, warn-only).
- Done when: None — prose pins ride Task 2.3 (deps-edged, rule 7)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.2: References mirrors + the refiner predicate
- Files: `skills/war/references/schemas.md`, `skills/war/references/design.md`, `skills/war/references/gastown-design-params.md`, `skills/war/references/file-followups.md`, `agents/war-refiner.md`
- Plan slice: the CLASS-2 sweep on the references (D6 · PIN-6 · PIN-8; producer home per D5 ·
  PIN-6; predicate per D11 · PIN-7) — schemas.md's enum lines and handoff rows
  gain the ask member and ninth key; the exhaustiveness sentences gain ask clauses with the closed
  phrasing retired (OLD-absent citing the existing literals); `file-followups.md` gains the
  canonical ruled-ask parity text; the refiner card's closed-set predicate widens within 194 B or
  takes the named #1475-style eviction (D11). Constraint (A4): the parity text names no
  scanned-module CLI command, keeping D2's exclusion reason valid.
- Done when: None — pins ride Task 2.3 (deps-edged, rule 7)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.4: The decision record
- Files: `docs/adr/0013-commanders-intent-and-disposition-routing.md`, `docs/adr/0012-intra-phase-visibility-and-phase-close-sweep.md`
- Plan slice: the dated ADR 0013 amendment (D5 · PIN-6; byte-discipline — pre-existing body text untouched):
  the fourth member and its Minor/Nit-only scope in plain sight (PIN-5), never-filed-unruled, the
  strike-list gate + absolute floor, the `--afk` posture, the producer widening two → three, and
  the channel-2 deferral citing #1664 with the backstop-dependent `roundLimit` justification
  stated; ADR 0012 gains the one-line cross-ref in its line-90 style.
- Done when: None — the D23-style pin rides Task 2.3 (deps-edged, rule 7)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.5: Tour + war-review telemetry
- Files: `.tours/architect-war-system.tour`, `skills/war-review/SKILL.md`
- Plan slice: retype tour step 8 to the disposition world (asks included); re-anchor the raw line
  anchors and add pattern keys, computed against the integration base already carrying Task 1.1's
  insertions (D10 · PIN-10 — anchoring from any earlier reference reproduces the rot being closed);
  war-review gains both rows — the asks tally, and the grind-measurement row naming its sources
  (manifest `phases[].dispatches.fixRounds` + the filing site's audit-round field + `minorsFiled`
  rationales) with the coarseness and failure-routing asymmetry stated (D3 · PIN-4 · PIN-11).
- Done when: None — pins ride Task 2.3 (tour arm) and Task 2.6 (war-review rows), deps-edged
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.3: Glossary + the contracts suite
- Files: `CONTEXT.md`, `CLAUDE.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: the seven glossary terms with guard rows; the CLAUDE.md gospel line; its producer
  sentence; the D23-style ADR 0013 amendment pin; the tour arm; schemas.md enum-line pins; prose
  pins over Task 2.1's Checkpoint duties and Task 2.2's references sentences (rule-7 edges); the
  discovered-guard census run at this task's base (D6 · PIN-6 · PIN-8) with survey-derived
  stragglers listed.
- Done when: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [2.1, 2.2, 2.4, 2.5]
- target repo: superproject

### Task 2.6: Pipeline-suite pins
- Files: `skills/war-machine/war-pipeline-structure.test.sh`
- Plan slice: `WAR_REVIEW` presence pins over Task 2.5's two telemetry rows (the PIN-24 precedent
  in-file).
- Done when: `bash skills/war-machine/war-pipeline-structure.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: [2.5]
- target repo: superproject

## Phase 3 — Release

### Task 3.1: Version bump + changelog
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`
- Plan slice: bump all four slots in lock-step to the next free **minor** above the live
  integration base (expected 0.20.0 at `a60221a`; re-resolve at land — the version-slots monotonic
  floor is the arbiter); replace the README `## Status` blurb in place; append the CHANGELOG
  entry. Land-time bookkeeping (Lead): close #1550 citing this plan and #1664.
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Grind measurement (D3): terminal `fixRounds` distribution + decision-shaped language in terminal
  findings and `minorsFiled` rationales, per run — **coarseness named**: round-level attribution
  does not exist; the failure-routing asymmetry is load-bearing — an ambiguous reading routes to
  #1664's instrumentation-first refinement task (a per-round `auditLog` row), never to a silent
  "no grinding" (PIN-4 · PIN-11) · why deferred: cross-run field data by construction; the
  ceiling's justification waits on it (PIN-2 · PIN-3) · runner: `/war-review`, each pass over runs
  under a release carrying this plan.
- Ask-channel field trial: the first `/war` phase under a carrying release that raises an ask
  exercises the strike-list gate and the absolute advance floor, recorded in that phase report ·
  why deferred: live-channel behavior is unobservable at the integrated tip (the asv
  doctrinal-counterweight pattern) · runner: that run's Lead at the Checkpoint.

## Notes / conscious deviations

- Servitor directive (D13): capture the vacuous-OLD-absent lesson — an OLD-absent assert must cite
  an existing literal verified present at task base; count-word absence on never-present values is
  vacuous by construction — five specimens this interview pair, the fifth **advisor-ratified**
  (PIN-4's fictional per-round source): the leak class doesn't respect authority, and only the
  homeless-pin sweep forced verification. The authoring-doctrine one-liner is deliberately out of
  scope; the next survey promotes it.
- Zero `WAIVE-<n>` rows: every armed beat dispatched (9 dispatches, 7 refutations, two beats
  resolved under the fork rule).
- The 0.20.0 literal is an expected resolution, never authoritative — the directive form governs;
  red-team adjudication outranks it.
- The reinforced-roster decompose note is deliberately NOT plan text (operator ruling): it rides
  the `/war` launch handoff.

## Open decisions

None.
