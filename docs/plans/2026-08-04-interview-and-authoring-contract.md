# Interview & authoring contract — one interview, one artifact

Source of truth: this plan's own decision record below (Part 1), distilled from
[docs/specs/2026-08-04-interview-and-authoring-contract-design.md](../specs/2026-08-04-interview-and-authoring-contract-design.md)
(interviewed + approved 2026-08-04). **This is the first merged-shape plan** — the shape it
exhibits is the shape Task 1 ratifies. Expected integration base: `master` @ `94ee5b3`
(0.15.1; re-measured 2026-08-05 — the only commits past `382dba1` are this plan + spec
landing); release resolves the next free patch from the live slots at land time.

## Context — the gap / problem

The pipeline's front door has no ratified discipline: `/grill-with-docs` is a 7-line stub
(verified: `~/.claude/skills/grill-with-docs/SKILL.md`, 2026-08-04), `/war-machine`'s grill
agent cites a question tree defined nowhere (verified: `skills/war-machine/SKILL.md` §2), and
the spec→plan conversion seam is a measured defect source (~40% of red-team findings are false
repo facts, ~35% under-specification; 2026-08-04 fan-out classification). Spec→plan pairing is
1:1 in 99/116 slugs (verified: slug join, 2026-08-04) — the two-file split taxes the user twice
and models nothing the roadmap layer doesn't already own.

## Pivotal constraints

Extraction compatibility (Part 2 keeps today's exact H2 headings; Part 1/Part 2 is prose
framing, never nesting) · ADR 0042 hot/cold + budgets · ADR 0017 required-sections vehicle ·
ADR 0013/0014 intent provenance + `AI-declared` rows · ADR 0007 ladder mapping ·
`plan-literal-lint.mjs` stays report-only · **/war engine untouched** (no
`workflow-template.js`, hooks, floors, schemas, `/war` intake; red-team's own scaffold +
lenses are in Task 5's scope by 2026-08-05 adjudication) · structure-test lock-step,
presence + old-absent, case-insensitive mid-sentence anchors.

## Resolved design tree

The spec's §3 table governs (D1–D19); load-bearing rows: D2 self-sufficient entry (Grill Me →
recommended) (user) · D4 tag syntax `(user)/(verified: <src> at <base>)/[assumed: — if wrong:]`
(user) · D5 done-when law + closed End-state tag set (user) · D6 enforcement: required sections
with explicit `None`, advisory lint, legacy grandfathered (user) · D15 one interview → one
merged artifact (user) · D16 uniform reach — war-machine emits the merged shape too (user) ·
D17 plan = merged artifact, spec = input shape [assumed] · D18 criteria unify into tagged End
states [assumed]. Also carried (cited by task slices, restated so Part 1 stays self-contained):
D9 gap-review interviews bound by the same question contract [assumed] · D11 issue-derived
claims use the `(verified: issue #N (<date>))` source form [assumed] · D12 staleness rule —
literals are dated snapshots at a stated base, re-measured at the task's rebased base
[assumed] · D19 one `## Assumptions ledger` (Part 1); conversion/AFK carries rows forward or
retires each with stated reason [assumed].

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | `/war` extraction tolerates leading Part-1 H2 sections | extraction greps named headings | intake misparse of merged plans | End state 7's sandbox probe, pre-land |
| A2 | ADR 0044 is the next free number | `ls docs/adr/` 2026-08-04 | rename at land | re-`ls` at Task 9 start |
| A3 | Next free patch ≈ 0.15.2 | live slots at 0.15.1 | none — resolved at land per slots law | `version-slots.test.mjs` |
| A4 | `war-pipeline-structure.test.sh` is the pin home for war-machine directives | 0.15.1 precedent (guard-split pins) | pins move to a sibling suite | Task 3 worker verifies at rebase |
| A5 | No in-flight campaign owns these files | 2026-08-02 campaign landed @ `382dba1` | serial-merge rebase conflicts | ledger check at `/war` launch |

## Non-goals / deferred

Engine/floor/schema slot consumption → the **precision-chain** spec · red-team round budget /
route-upstream → the **loop-breaker** spec · `/war-review` telemetry → with the loop-breaker ·
survey-corps emitting merged docs (total collapse) — rejected · track playbooks · a new
interview slash command · upstream Grill Me PRs · `/war` intake changes.

## New domain terms · Recommended ADRs

CONTEXT.md: Plan (merged) · Spec (input shape) · Evidence tag · Assumptions ledger · Done-when
· Decisive slot · Executor gate (authoring). One ADR (0044) ratifies contract + collapse +
placement reversal (Task 9).

## Commander's Intent

- **Purpose:** one interview to completion produces one self-contained artifact — decision
  record and decomposed phases in a single plan — and WAR owns the interview doctrine every
  downstream stage depends on; `/red-team` and `/war` face exactly one artifact shape on every
  path.
- **Method:** land the doctrine file, the merged template, and their structure-test pins
  lock-step first; rewrite every gospel surface new-present/old-absent second; ratify by ADR;
  release trails. Engine untouched — Part 2 headings stay byte-compatible with extraction.
  Guardrails: lint stays advisory; legacy artifacts grandfathered; ADR 0042 justification in
  the commit body if a budget line trips.
- **End state:**
  1. Bare `/war-strategy` with no Grill Me family installed proceeds into the interview per
     `references/plan-interview.md` and terminates only on a merged plan file ·
     check: `bash skills/war-strategy/war-strategy-structure.test.sh` (pointer + recommendation
     wording pins green).
  2. Both structure suites fail on any ratified template internal absent or retired
     two-template/required-Grill-Me wording returning; each new pin proven red once against a
     mutated copy during development, the mutation-red run recorded in the task's done report
     (soft evidence by repo precedent — deliberately uncommitted) ·
     check: `bash skills/war-strategy/war-strategy-structure.test.sh` &&
     `bash skills/war-machine/war-pipeline-structure.test.sh`.
  3. The lint reports every new-rule violation on fixtures (untagged End state,
     `requiresTest: true` without `Done when:`, missing ledger, untagged factual claim shape
     in `## Context`, vague-trigger vocabulary — all five §4f rules) and still exits 0
     without `--strict` ·
     check: `node --test skills/war-strategy/assets/plan-literal-lint.test.mjs`.
  4. `/war-machine` conversion emits the merged shape (Part 1 decision digest citing the source
     spec) and its grill charter references `plan-interview.md`; the "full question tree
     grill-with-docs would have asked" wording is absent in any casing ·
     check: `bash skills/war-machine/war-pipeline-structure.test.sh` (gains the
     case-insensitive old-absent mirror pin, Task 3) plus
     `grep -ci 'question tree' skills/war-machine/SKILL.md` = 0.
  5. The gospel is swept — new wording present AND retired wording absent on each of
     `README.md`, `CLAUDE.md`, `skills/war-help/SKILL.md`, `CONTEXT.md`,
     `skills/war-strategy/SKILL.md`, per Task 6's authoritative per-surface pattern table
     (case-insensitive mid-sentence anchors, both directions; war-help is new-present-only —
     it carries nothing to retire) ·
     check: `bash skills/war-machine/war-pipeline-structure.test.sh` (Task 8's committed
     five-surface pins) plus the same per-surface both-ways grep run at land.
  6. `/red-team` invoked on a merged plan with no `--spec` treats the plan's Part 1 as the
     source of truth ·
     check: in `skills/red-team/SKILL.md`, case-insensitive new-present `its own source of
     truth` ≥ 1 AND old-absent ``becomes `--spec` if not given`` = 0; plus
     `node --test skills/red-team/assets/workflow-scaffold.test.mjs` green (Task 5).
  7. The merged template's TWO example documents — operator-form (`## Commander's Intent` +
     `## Deferred validations (backstops)`) and AFK-form (`## AI-Commander's Intent` + the
     AI-declared backstops variant; the ADR 0014 heading pairs are either/or alternatives,
     one per doc) — each pass the existing `/war` extraction surfaces unchanged (intent,
     phases, tasks, `Files:`, backstops) ·
     HARD at audit_sha — analyzed sandbox probe; observable: every extraction grep finds its
     target in each example doc; judge: red-team executed probe pre-land, gate-audit seat
     post-merge.
  8. Release lands as its own trailing phase with all four slots bumped lock-step to the next
     free patch · check: `node --test skills/war/assets/version-slots.test.mjs` AND the landed
     `.claude-plugin/plugin.json` version differs from the recorded `0.15.1` base (lock-step
     alone is green pre-bump).
  9. The ADR ratifying contract + collapse + placement reversal exists at the next free number
     (A2) with a current Status ·
     check: `grep -il 'authoring contract' docs/adr/00*.md` non-empty and the matched file's
     `Status` line reads current.

## Build order (for /war)

Phase 1 (doctrine + primary surfaces, waves: [1,2,4,5] then [3]) → Phase 2 (doc cascade +
committed pins + ADR, waves: [6,7,9] then [8]) → Phase 3 (release).

## Phase 1 — Doctrine, merged template, primary skill surfaces

### Task 1: Interview doctrine + merged plan template + pins
- Files: `skills/war-strategy/references/plan-interview.md`, `skills/war-strategy/SKILL.md`,
  `skills/war-strategy/war-strategy-structure.test.sh`
- Plan slice: author `plan-interview.md` per spec §4a (stages 0–5, question contract, WAR
  falsifier list, decisive-slots table, two echo-backs, provenance + executor gates, 1:N →
  roadmap rule, terminal merged-plan state); rewrite SKILL.md §1 (dependency check →
  recommendation), §2 (merged plan template per spec §4b — flat H2s, Part 2 headings
  byte-identical to today's, under two adjudicated shape rulings: the tail stays TWO separate
  H2s (`## Notes / conscious deviations`, `## Open decisions`) and per-task fields stay
  SEPARATE `- ` bullets — spec §4b's one-line renderings are shorthand, not the ratified
  layout, since `extractFiles` ingests only the bullet form; TWO example docs, operator-form
  and AFK-form, per End state 7; spec template relabeled input shape with D4 tags + §10 check
  form; D12 staleness sentence in the conventions), §4 (ADR 0042 pointer line, bare-invoke
  runs the interview, widened HANDOFF DIRECTIVE, with-artifact converts into the merged shape,
  D9 contract on gap interviews); rewrite the out-of-section doctrine carriers too — the
  frontmatter `description:`, the "Bare invoke — primer + handoff" bullet, and the "Honest
  boundary … never authors a spec from scratch" sentence (pre-§1, by construct) — to the
  self-sufficient-entry doctrine; extend the structure test with presence pins for every
  ratified internal and case-insensitive mid-sentence old-absent pins for the retired wording
  (incl. `never authors a spec from scratch`, `hands off to the installed authoring skills`,
  `primer + handoff`).
- Done when: `bash skills/war-strategy/war-strategy-structure.test.sh`
- requiresTest: true · requiresPackaging: true · deps: [] · target repo: superproject

### Task 2: Advisory lint rules + fixtures
- Files: `skills/war-strategy/assets/plan-literal-lint.mjs`,
  `skills/war-strategy/assets/plan-literal-lint.test.mjs`
- Plan slice: add the five advisory rules (spec §4f) with one fixture test case per rule;
  exit-0-without-`--strict` preserved; rule text names the merged-template slot it checks.
- Done when: `node --test skills/war-strategy/assets/plan-literal-lint.test.mjs`
- requiresTest: true · requiresPackaging: false · deps: [] · target repo: superproject

### Task 3: war-machine merged output + grill charter + AFK provenance
- Files: `skills/war-machine/SKILL.md`, `skills/war-machine/war-pipeline-structure.test.sh`,
  `skills/war-machine/references/afk-conversion.md`
- Plan slice: conversion emits the merged shape (Part 1 digest citing source spec + issues per
  D11; carries the `## Assumptions ledger` rows forward or retires each with stated reason,
  D19); grill charter replaces the training-memory question-tree wording with
  `plan-interview.md`'s falsifier probes + provenance scan; sandbox-execution duty for
  behavioral claims; `--afk` per-row `AI-declared` markers; pins for all three directives,
  new-present + old-absent, case-insensitive mid-sentence anchors — incl. End state 4's
  mirror pin: no `question tree` in any casing in SKILL.md.
- Done when: `bash skills/war-machine/war-pipeline-structure.test.sh`
- requiresTest: true · requiresPackaging: false · deps: [1] (points at the Task-1 file; rebase
  makes it real) · target repo: superproject

### Task 4: survey-corps claim tagging
- Files: `skills/survey-corps/SKILL.md`
- Plan slice: one directive — synthesized specs tag every claim per D4/D11
  (`(verified: issue #N (<date>))` for issue-derived facts, `[assumed: — if wrong:]` for
  inventions).
- Done when: None — prose directive; Task 8 pins the tagging directive new-present in
  `war-pipeline-structure.test.sh` (its land-time check); graded by red-team.
- requiresTest: false · requiresPackaging: false · deps: [] · target repo: superproject

### Task 5: red-team self-sourced merged arm
- Files: `skills/red-team/SKILL.md`, `skills/red-team/references/lenses.md`,
  `skills/red-team/assets/workflow-scaffold.js`,
  `skills/red-team/assets/workflow-scaffold.test.mjs`
- Plan slice: Step 1 gains the merged arm — a plan whose Part 1 carries the decision record is
  its own source of truth (ratified new-present anchor: `its own source of truth`); `--spec`
  defaults to the plan. Adjudicated scope widening (2026-08-05): the plan-vs-spec probe is a
  code literal, not SKILL prose, so the coverage-vs-source lens gains the merged arm in BOTH
  its homes — the `lenses.md` spine entry and the scaffold's `SPINE` prompt read Part-1→Part-2
  coverage when the source IS the plan — with the scaffold-test pins extended in the same diff
  (the D7 two-contract guard and the ff-topology presence-pair guard stay green). The /war
  engine stays untouched.
- Done when: `node --test skills/red-team/assets/workflow-scaffold.test.mjs`
- requiresTest: true · requiresPackaging: false · deps: [] · target repo: superproject

## Phase 2 — Doc cascade + committed pins + ADR

### Task 6: Gospel sweep — README, CLAUDE.md, war-help
- Files: `README.md`, `CLAUDE.md`, `skills/war-help/SKILL.md`
- Plan slice: README §Required→§Recommended Auxiliary Plugin (WAR owns the doctrine; shells
  optional; drift rationale retired) + usage prose + the two same-meaning siblings outside
  that section — `## Why WAR`'s "interview a spec into a plan" and the `## Note from Author`
  Grill Me blockquote ("author the input plan …"), both by construct; CLAUDE.md pipeline
  section rewritten to the merged-artifact doctrine (retire current-doctrine "A spec is not a
  plan" and "`/grill-with-docs` authors the spec"); war-help command-table rows updated
  (new-present only — war-help carries no retired wording). This task owns the AUTHORITATIVE
  per-surface pattern table: one list, cited by Task 7, Task 8, and End state 5; every
  pattern case-insensitive on a mid-sentence anchor, swept with comment-leader stripping
  before normalization. Old-absent anchors: `spec is not a plan` · `required auxiliary
  plugin` · ``grill-with-docs` authors`` (slash-less — matches both CLAUDE.md and CONTEXT.md
  occurrences) · `why it's required` · `why war doesn't ship its own` · `interview a spec
  into a plan` · `author the input plan`. New-present anchors, one per surface: README
  `recommended auxiliary plugin` · CLAUDE.md `one interview, one merged artifact` · war-help
  the updated command-table row wording · CONTEXT.md `input shape` (Task 7's entry) ·
  war-strategy the §2 merged-template heading (Task 1).
- Done when: None — Task 8's committed pins + End state 5's per-surface both-ways grep at
  land.
- requiresTest: false · requiresPackaging: false · deps: [] · target repo: superproject

### Task 7: CONTEXT.md vocabulary
- Files: `CONTEXT.md`
- Plan slice: redefine **Plan** (merged, self-contained) and **Spec** (input shape) at their
  existing entries — the **Design spec** and **Implementation plan** glossary entries and the
  pipeline paragraph that follows them, by construct, not line number; add Evidence tag (with
  ADR 0007 ladder mapping; _Avoid_: memory/training as a `(verified:)` source), Assumptions
  ledger, Done-when, Decisive slot, Executor gate (authoring).
- Done when: None — glossary prose; Task 8's CONTEXT.md pin + End state 5 sweep cover the
  retired pipeline sentence.
- requiresTest: false · requiresPackaging: false · deps: [] · target repo: superproject

### Task 8: Gospel old-absent pins — committed enforcement for the doc surfaces
- Files: `skills/war-machine/war-pipeline-structure.test.sh`
- Plan slice: adjudicated 2026-08-05 (the five-surface sweep may not ride a hand-run grep
  alone — ADR 0017): add a CLAUDE.md handle beside the suite's existing README / CONTEXT /
  war-help / war-strategy handles, then land committed old-absent pins for every Task-6
  retired anchor across all five End-state-5 surfaces (case-insensitive, mid-sentence,
  `lacks()`-style), plus two new-present pins: the survey-corps D4/D11 claim-tagging
  directive (Task 4's land-time check) and the war-help updated command-table row.
- Done when: `bash skills/war-machine/war-pipeline-structure.test.sh`
- requiresTest: true · requiresPackaging: false · deps: [6, 7] · target repo: superproject

### Task 9: ADR 0044
- Files: `docs/adr/0044-authoring-contract-and-merged-artifact.md`
- Plan slice: ratify the authoring output contract (D4–D6, D18–D19), the collapse + uniform
  reach (D15–D16, with the 99/116 evidence and the extraction-compatibility constraint), and
  the placement reversal (D2, superseding the README stance); Status current; house ADR format.
- Done when: None — decision record; red-team's coherence probes grade it.
- requiresTest: false · requiresPackaging: false · deps: [] · target repo: superproject

## Phase 3 — Release

### Task 10: Version bump, four slots lock-step
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump to the next free patch above the live base (A3; non-authoritative literal —
  resolve at land); README `## Status` replace-in-place blurb summarizing: WAR owns its front
  door — one interview, one merged artifact, uniform on every path.
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false · requiresPackaging: false · deps: [] · target repo: superproject

## Deferred validations (backstops)

- Adoption telemetry — red-team rounds per plan trend down over the next campaign · why
  deferred: needs a campaign of field data · runner: `/war-review` rows at the next campaign
  wrap-up (ratify in the loop-breaker spec).
- Interview-length telemetry — questions per merged plan vs the old two-interview total · why
  deferred: needs a campaign of field data · runner: `/war-review` rows at the next campaign
  wrap-up (ratify in the loop-breaker spec).

## Notes / conscious deviations

- Self-hosting: this plan is authored in the merged shape one phase before Task 1 ratifies that
  shape — deliberate first field trial; red-team should treat shape deviations it finds here as
  findings against Task 1's template draft too.
- README is touched in Phase 2 (Task 6) and Phase 3 (Task 10) — different phases, sanctioned
  by the phase-edge rule; within each phase it is single-tasked. Likewise
  `war-pipeline-structure.test.sh` in Phase 1 (Task 3) and Phase 2 (Task 8).
- Red-team adjudications (2026-08-05) supersede spec §4b's compact renderings: the Part-2 tail
  is TWO separate H2s and per-task fields are SEPARATE `- ` bullets; Task 5's widening into
  red-team's own scaffold/lenses re-scopes "engine untouched" to the /war engine. Full record:
  `docs/red-team/2026-08-05-interview-and-authoring-contract.md`.

## Open decisions

None.
