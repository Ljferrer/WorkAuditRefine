# Interview & authoring contract — one interview, one artifact

Source of truth: this plan's own decision record below (Part 1), distilled from
[docs/specs/2026-08-04-interview-and-authoring-contract-design.md](../specs/2026-08-04-interview-and-authoring-contract-design.md)
(interviewed + approved 2026-08-04). **This is the first merged-shape plan** — the shape it
exhibits is the shape Task 1 ratifies. Expected integration base: `master` @ `382dba1`
(0.15.1); release resolves the next free patch from the live slots at land time.

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
`plan-literal-lint.mjs` stays report-only · **engine untouched** (no `workflow-template.js`,
hooks, floors, schemas, `/war` intake) · structure-test lock-step, presence + old-absent.

## Resolved design tree

The spec's §3 table governs (D1–D19); load-bearing rows: D2 self-sufficient entry (Grill Me →
recommended) (user) · D4 tag syntax `(user)/(verified: <src> at <base>)/[assumed: — if wrong:]`
(user) · D5 done-when law + closed End-state tag set (user) · D6 enforcement: required sections
with explicit `None`, advisory lint, legacy grandfathered (user) · D15 one interview → one
merged artifact (user) · D16 uniform reach — war-machine emits the merged shape too (user) ·
D17 plan = merged artifact, spec = input shape [assumed] · D18 criteria unify into tagged End
states [assumed].

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | `/war` extraction tolerates leading Part-1 H2 sections | extraction greps named headings | intake misparse of merged plans | End state 7's sandbox probe, pre-land |
| A2 | ADR 0044 is the next free number | `ls docs/adr/` 2026-08-04 | rename at land | re-`ls` at Task 8 start |
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
placement reversal (Task 8).

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
     mutated copy during development ·
     check: `bash skills/war-strategy/war-strategy-structure.test.sh` &&
     `bash skills/war-machine/war-pipeline-structure.test.sh`.
  3. The lint reports every new-rule violation on fixtures (untagged End state,
     `requiresTest: true` without `Done when:`, missing ledger, vague-trigger vocabulary) and
     still exits 0 without `--strict` ·
     check: `node --test skills/war-strategy/assets/plan-literal-lint.test.mjs`.
  4. `/war-machine` conversion emits the merged shape (Part 1 decision digest citing the source
     spec) and its grill charter references `plan-interview.md`; the "full question tree
     grill-with-docs would have asked" wording is absent ·
     check: `bash skills/war-machine/war-pipeline-structure.test.sh` plus
     `grep -c 'question tree' skills/war-machine/SKILL.md` = 0.
  5. The gospel is swept — new wording present AND retired wording absent on each of
     `README.md`, `CLAUDE.md`, `skills/war-help/SKILL.md`, `CONTEXT.md`,
     `skills/war-strategy/SKILL.md`: no current-doctrine "A spec is not a plan", no "Required
     Auxiliary Plugin" framing, no "`/grill-with-docs` authors the spec" ·
     check: per-surface grep both ways (patterns enumerated in Task 6).
  6. `/red-team` invoked on a merged plan with no `--spec` treats the plan's Part 1 as the
     source of truth ·
     check: `grep -n 'source of truth' skills/red-team/SKILL.md` shows the merged arm.
  7. The merged template's example document passes the existing `/war` extraction surfaces
     unchanged (intent — both ADR 0014 headings, phases, tasks, `Files:`, backstops) ·
     HARD at audit_sha — analyzed sandbox probe; observable: every extraction grep finds its
     target in the example doc; judge: red-team executed probe pre-land, gate-audit seat
     post-merge.
  8. Release lands as its own trailing phase with all four slots bumped lock-step to the next
     free patch · check: `node --test skills/war/assets/version-slots.test.mjs`.

## Build order (for /war)

Phase 1 (doctrine + primary surfaces, waves: [1,2,4,5] then [3]) → Phase 2 (doc cascade + ADR)
→ Phase 3 (release).

## Phase 1 — Doctrine, merged template, primary skill surfaces

### Task 1: Interview doctrine + merged plan template + pins
- Files: `skills/war-strategy/references/plan-interview.md`, `skills/war-strategy/SKILL.md`,
  `skills/war-strategy/war-strategy-structure.test.sh`
- Plan slice: author `plan-interview.md` per spec §4a (stages 0–5, question contract, WAR
  falsifier list, decisive-slots table, two echo-backs, provenance + executor gates, 1:N →
  roadmap rule, terminal merged-plan state); rewrite SKILL.md §1 (dependency check →
  recommendation), §2 (merged plan template per spec §4b — flat H2s, Part 2 headings
  byte-identical to today's; spec template relabeled input shape with D4 tags + §10 check
  form; D12 staleness sentence in the conventions), §4 (ADR 0042 pointer line, bare-invoke
  runs the interview, widened HANDOFF DIRECTIVE, with-artifact converts into the merged shape,
  D9 contract on gap interviews); extend the structure test with presence pins for every
  ratified internal and old-absent pins for the retired wording.
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
  D11); grill charter replaces the training-memory question-tree wording with
  `plan-interview.md`'s falsifier probes + provenance scan; sandbox-execution duty for
  behavioral claims; `--afk` per-row `AI-declared` markers; pins for all three directives,
  new-present + old-absent.
- Done when: `bash skills/war-machine/war-pipeline-structure.test.sh`
- requiresTest: true · requiresPackaging: false · deps: [1] (points at the Task-1 file; rebase
  makes it real) · target repo: superproject

### Task 4: survey-corps claim tagging
- Files: `skills/survey-corps/SKILL.md`
- Plan slice: one directive — synthesized specs tag every claim per D4/D11
  (`(verified: issue #N (<date>))` for issue-derived facts, `[assumed: — if wrong:]` for
  inventions).
- Done when: None — prose directive; graded by red-team and swept by End state 5's grep family.
- requiresTest: false · requiresPackaging: false · deps: [] · target repo: superproject

### Task 5: red-team self-sourced merged arm
- Files: `skills/red-team/SKILL.md`
- Plan slice: Step 1 gains the merged arm — a plan whose Part 1 carries the decision record is
  its own source of truth; `--spec` defaults to the plan; plan-vs-spec probes become
  Part-2-vs-Part-1 coherence probes. No other step text changes.
- Done when: None — single prose arm; End state 6's grep is the land-time check.
- requiresTest: false · requiresPackaging: false · deps: [] · target repo: superproject

## Phase 2 — Doc cascade + ADR

### Task 6: Gospel sweep — README, CLAUDE.md, war-help
- Files: `README.md`, `CLAUDE.md`, `skills/war-help/SKILL.md`
- Plan slice: README §Required→§Recommended Auxiliary Plugin (WAR owns the doctrine; shells
  optional; drift rationale retired) + usage prose; CLAUDE.md pipeline section rewritten to the
  merged-artifact doctrine (retire current-doctrine "A spec is not a plan" and
  "`/grill-with-docs` authors the spec"); war-help command-table rows updated. Old-absent
  patterns swept with comment-leader stripping before normalization: "A spec is not a plan",
  "Required Auxiliary Plugin", "grill-with-docs` authors", "Why it's required", "Why WAR
  doesn't ship its own".
- Done when: None — End state 5's per-surface both-ways grep is the check at land.
- requiresTest: false · requiresPackaging: false · deps: [] · target repo: superproject

### Task 7: CONTEXT.md vocabulary
- Files: `CONTEXT.md`
- Plan slice: redefine **Plan** (merged, self-contained) and **Spec** (input shape) at their
  existing entries (lines ~15/27 by construct, the pipeline paragraph); add Evidence tag (with
  ADR 0007 ladder mapping; _Avoid_: memory/training as a `(verified:)` source), Assumptions
  ledger, Done-when, Decisive slot, Executor gate (authoring).
- Done when: None — glossary prose; End state 5 sweep covers the retired pipeline sentence.
- requiresTest: false · requiresPackaging: false · deps: [] · target repo: superproject

### Task 8: ADR 0044
- Files: `docs/adr/0044-authoring-contract-and-merged-artifact.md`
- Plan slice: ratify the authoring output contract (D4–D6, D18–D19), the collapse + uniform
  reach (D15–D16, with the 99/116 evidence and the extraction-compatibility constraint), and
  the placement reversal (D2, superseding the README stance); Status current; house ADR format.
- Done when: None — decision record; red-team's coherence probes grade it.
- requiresTest: false · requiresPackaging: false · deps: [] · target repo: superproject

## Phase 3 — Release

### Task 9: Version bump, four slots lock-step
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
  deferred: same · runner: same.

## Notes / conscious deviations

- Self-hosting: this plan is authored in the merged shape one phase before Task 1 ratifies that
  shape — deliberate first field trial; red-team should treat shape deviations it finds here as
  findings against Task 1's template draft too.
- README is touched in Phase 2 (Task 6) and Phase 3 (Task 9) — different phases, sanctioned by
  the phase-edge rule; within each phase it is single-tasked.

## Open decisions

None.
