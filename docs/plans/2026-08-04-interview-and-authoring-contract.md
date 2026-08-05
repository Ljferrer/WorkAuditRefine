# Interview & authoring contract — one interview, one artifact

Source of truth: this plan's own decision record below (Part 1), distilled from
[docs/specs/2026-08-04-interview-and-authoring-contract-design.md](../specs/2026-08-04-interview-and-authoring-contract-design.md)
(interviewed + approved 2026-08-04). **This is the first merged-shape plan** — the shape it
exhibits is the shape Task 1 ratifies. Expected integration base: `master` @ `94ee5b3`
(0.15.1); the working branch additionally carries the red-team report + run-config commits
(`e223a23`, `7b9224d`), which touch no plan-named surface. Release resolves the next free
patch from the live slots at land time.

## Context — the gap / problem

The pipeline's front door has no ratified discipline: `/grill-with-docs` is a 7-line stub
(verified: `~/.claude/skills/grill-with-docs/SKILL.md`, 2026-08-04), `/war-machine`'s grill
agent cites a question tree defined nowhere (verified: `skills/war-machine/SKILL.md` §2), and
the spec→plan conversion seam is a measured defect source (~40% of red-team findings are false
repo facts, ~35% under-specification; 2026-08-04 fan-out classification). Spec→plan pairing is
1:1 in 100 of 116 `*-design.md` slugs (verified: slug join at `94ee5b3`, 2026-08-05; a dated
snapshot per D12 — supersedes the spec's 99/116, measured 2026-08-04 pre-landing) — the
two-file split taxes the user twice and models nothing the roadmap layer doesn't already own.

## Pivotal constraints

Extraction compatibility (Part 2 keeps today's exact H2 headings; Part 1/Part 2 is prose
framing, never nesting) · ADR 0042 hot/cold + budgets · ADR 0017 required-sections vehicle ·
ADR 0013/0014 intent provenance + `AI-declared` rows · ADR 0007 ladder mapping ·
`plan-literal-lint.mjs` stays report-only · **/war engine untouched** (no
`workflow-template.js`, hooks, floors, schemas, `/war` intake; red-team's own scaffold +
lenses + references are in Task 5's scope by 2026-08-05 adjudication) · structure-test
lock-step — every ratified sentence lands with its pin **in the same task, or in a guard task
carrying a `deps` edge onto the fact-authoring task (same phase) / a later-phase pin where
file-disjointness forces it (ADR 0025)** · presence + old-absent, case-insensitive anchors.

## Resolved design tree

The spec's §3 table governs (D1–D19); load-bearing rows: D2 self-sufficient entry (Grill Me →
recommended) (user) · D4 tag syntax `(user)/(verified: <src> at <base>)/[assumed: — if wrong:]`
(user) · D5 done-when law — `Done when:` required iff `requiresTest: true`, permitted (not
required) elsewhere — + closed End-state tag set (user) · D6 enforcement: required sections
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
     two-template/required-Grill-Me wording returning ·
     check: `bash skills/war-strategy/war-strategy-structure.test.sh` &&
     `bash skills/war-machine/war-pipeline-structure.test.sh`. Additionally (SOFT, not part of
     the committed check): each new pin is proven red once against a mutated copy during
     development, recorded in the task's done report as deliberately-uncommitted evidence
     (repo precedent) and judged by the gate-audit seat.
  3. The lint reports every new-rule violation on fixtures (untagged End state,
     `requiresTest: true` without `Done when:`, missing ledger, untagged factual claim shape
     in `## Context`, vague-trigger vocabulary — all five §4f rules) and still exits 0
     without `--strict` ·
     check: `node --test skills/war-strategy/assets/plan-literal-lint.test.mjs`.
  4. `/war-machine` conversion emits the merged shape (Part 1 decision digest citing the source
     spec) and its grill charter references `plan-interview.md`; the training-memory
     grill-charter sentence (the one invoking the question tree `` `grill-with-docs` `` would
     have asked) is absent in any casing ·
     check: `bash skills/war-machine/war-pipeline-structure.test.sh` (gains the
     case-insensitive old-absent mirror pin, Task 3) plus
     `grep -ci 'question tree' skills/war-machine/SKILL.md` = 0.
  5. The gospel is swept — new wording present AND retired wording absent on each of
     `README.md`, `CLAUDE.md`, `skills/war-help/SKILL.md`, `CONTEXT.md`,
     `skills/war-strategy/SKILL.md`, per Task 6's authoritative per-surface pattern table
     (case-insensitive, both directions; war-help carries nothing to retire — new-present
     only; war-strategy's old-absent set is enforced by its own suite via Task 1's pins, its
     new-present by the merged-template heading pin) ·
     check: `bash skills/war-machine/war-pipeline-structure.test.sh` (Task 8's committed
     old-absent pins for all five surfaces + new-present pins for README/CLAUDE.md/war-help/
     CONTEXT.md) && `bash skills/war-strategy/war-strategy-structure.test.sh` (the
     war-strategy surface, both directions) — plus the same per-surface both-ways grep run at
     land.
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
     (A2), its title line contains `authoring contract` (Task 9 mandates it, making this check
     satisfiable by construction), and it carries the house `**Status:** accepted` line ·
     check: `grep -il 'authoring contract' docs/adr/00*.md` non-empty and the matched file
     contains `**Status:** accepted`.
  10. `/survey-corps`' spec-synthesis step carries the D4/D11 claim-tagging directive ·
     check: `bash skills/war-machine/war-pipeline-structure.test.sh` (Task 3's committed
     new-present pin for the directive). *(AI-declared: End state added at round-2
     adjudication — derives from ratified D16 uniform reach + D11 (user); closes the
     unclaimed-Task-4 sufficiency gap.)*

## Build order (for /war)

Phase 1 (doctrine + primary surfaces, waves: [1,2,4,5] then [3]) → Phase 2 (doc cascade +
committed pins + ADR, waves: [6,7,9] then [8]) → Phase 3 (release).

## Phase 1 — Doctrine, merged template, primary skill surfaces

### Task 1: Interview doctrine + merged plan template + pins
- Files: `skills/war-strategy/references/plan-interview.md`, `skills/war-strategy/SKILL.md`,
  `skills/war-strategy/war-strategy-structure.test.sh`
- Plan slice: author `plan-interview.md` per spec §4a (stages 0–5, question contract, WAR
  falsifier list — explicitly including the delete-the-feature probe in the pre-mortem, the
  spec-§8 mitigation for tag box-ticking — decisive-slots table, two echo-backs, provenance +
  executor gates, 1:N → roadmap rule, terminal merged-plan state; stage-0's recon query is the
  repo-correct fail-open invocation `node skills/_shared/war-memory.mjs query '<slug>
  plan-authoring' --repo docs/learnings`, correcting spec §4a's abbreviated form); rewrite
  SKILL.md §1 (dependency check → recommendation), §2 (merged plan template per spec §4b —
  flat H2s, Part 2 headings byte-identical to today's, under two adjudicated shape rulings:
  the tail stays TWO separate H2s (`## Notes / conscious deviations`, `## Open decisions`)
  and per-task fields are SEPARATE `- ` bullets (ratified as template law AND an extraction
  requirement — executed proof, round 3: `extractFiles` ingests ONLY the separate-bullet
  form; the compact one-line rendering over-widens the footprint with Plan-slice paths, and
  yields `[]` → `unparseable footprint` when the Files paths are bare); TWO example docs,
  operator-form and AFK-form, per End state 7; spec template
  relabeled input shape with D4 tags + §10 check form; D12 staleness sentence in the
  conventions), §4 (ADR 0042 pointer line, bare-invoke runs the interview, widened HANDOFF
  DIRECTIVE, with-artifact converts into the merged shape — its gap review gaining the four
  new rows from spec §4b: untagged factual claims · missing/implicit Assumptions ledger ·
  untagged End states · `requiresTest: true` without `Done when:` — and the D9 contract on
  gap interviews); rewrite the out-of-section doctrine carriers too — the frontmatter
  `description:`, the "Bare invoke — primer + handoff" bullet, and the "Honest boundary …
  never authors a spec from scratch" sentence (pre-§1, by construct) — to the
  self-sufficient-entry doctrine; extend the structure test with presence pins for every
  ratified internal and case-insensitive mid-sentence old-absent pins for the retired wording
  (incl. `never authors a spec from scratch`, `hands off to the installed authoring skills`,
  `primer + handoff`).
- Done when: `bash skills/war-strategy/war-strategy-structure.test.sh`
- requiresTest: true
- requiresPackaging: true
- deps: []
- target repo: superproject

### Task 2: Advisory lint rules + fixtures
- Files: `skills/war-strategy/assets/plan-literal-lint.mjs`,
  `skills/war-strategy/assets/plan-literal-lint.test.mjs`
- Plan slice: add the five advisory rules (spec §4f) with one fixture test case per rule;
  exit-0-without-`--strict` preserved; rule text names the merged-template slot it checks.
- Done when: `node --test skills/war-strategy/assets/plan-literal-lint.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: war-machine merged output + grill charter + AFK provenance + survey-corps pin
- Files: `skills/war-machine/SKILL.md`, `skills/war-machine/war-pipeline-structure.test.sh`,
  `skills/war-machine/references/afk-conversion.md`
- Plan slice: conversion emits the merged shape (Part 1 digest citing source spec + issues per
  D11; carries the `## Assumptions ledger` rows forward or retires each with stated reason,
  D19); grill charter replaces the training-memory question-tree wording with
  `plan-interview.md`'s falsifier probes + provenance scan; sandbox-execution duty for
  behavioral claims; `--afk` per-row `AI-declared` markers; pins for all three directives,
  new-present + old-absent, case-insensitive mid-sentence anchors — incl. End state 4's
  mirror pin: no `question tree` in any casing in SKILL.md. Also lands the committed
  new-present pin for Task 4's survey-corps claim-tagging directive (End state 10) — the
  ADR 0025 guard-split shape: this task owns the pin file and carries the `deps` edge onto
  the fact-authoring task.
- Done when: `bash skills/war-machine/war-pipeline-structure.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: [1, 4] (Task 1: the referenced doctrine file; Task 4: the survey-corps directive this
  task's pin guards — rebase makes both real)
- target repo: superproject

### Task 4: survey-corps claim tagging
- Files: `skills/survey-corps/SKILL.md`
- Plan slice: one directive — synthesized specs tag every claim per D4/D11
  (`(verified: issue #N (<date>))` for issue-derived facts, `[assumed: — if wrong:]` for
  inventions).
- Done when: None — prose directive; Task 3 pins it new-present in
  `war-pipeline-structure.test.sh` via its `deps` edge onto this task (its land-time check,
  End state 10); graded by red-team.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 5: red-team self-sourced merged arm
- Files: `skills/red-team/SKILL.md`, `skills/red-team/references/lenses.md`,
  `skills/red-team/references/backstop-legitimacy.md`,
  `skills/red-team/assets/workflow-scaffold.js`,
  `skills/red-team/assets/workflow-scaffold.test.mjs`
- Plan slice: Step 1 gains the merged arm — a plan whose Part 1 carries the decision record is
  its own source of truth (ratified new-present anchor: `its own source of truth`); `--spec`
  defaults to the plan. Adjudicated scope widening (2026-08-05): the plan-vs-spec probe is a
  code literal, not SKILL prose, so the coverage-vs-source lens gains the merged arm in BOTH
  its homes — the `lenses.md` spine entry and the scaffold's `SPINE` prompt read Part-1→Part-2
  coverage when the source IS the plan — with the scaffold-test pins extended in the same
  diff. Guard note (corrected at round 2): the ff-topology presence-pair guard lives in
  `workflow-scaffold.test.mjs`; the D7 two-contract guard lives in
  `skills/red-team/assets/red-team-gate.test.mjs` and reads both edited surfaces — the
  Done-when runs both suites so a rewrite cannot silently red it. Additionally (round-2
  adjudication, AI-declared): extend `references/backstop-legitimacy.md` with the `judge:`-tag
  grading rule — for each `judge:`/`HARD at audit_sha` End state or backstop entry, grade
  "could this have been a `check:` command?"; commandable-but-judged → `needsDecision` — the
  spec-§8 box-ticking mitigation gains its owner. The /war engine stays untouched.
- Done when: `node --test skills/red-team/assets/workflow-scaffold.test.mjs && node --test
  skills/red-team/assets/red-team-gate.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Doc cascade + committed pins + ADR

### Task 6: Gospel sweep — README, CLAUDE.md, war-help
- Files: `README.md`, `CLAUDE.md`, `skills/war-help/SKILL.md`
- Plan slice: README §Required→§Recommended Auxiliary Plugin (WAR owns the doctrine; shells
  optional; drift rationale retired) — updating the in-page anchor link
  `(#required-auxiliary-plugin)` at the `## Usage` reference in the same edit (the heading
  rename changes the GitHub slug) — + usage prose + the two same-meaning siblings outside
  that section — `## Why WAR`'s "interview a spec into a plan" and the `## Note from Author`
  Grill Me blockquote ("author the input plan …"), both by construct; CLAUDE.md pipeline
  section rewritten to the merged-artifact doctrine (retire current-doctrine "A spec is not a
  plan", "`/grill-with-docs` authors the spec", and the "never authors a spec from scratch"
  clause); war-help command-table rows updated (new-present only — war-help carries no
  retired wording). This task owns the AUTHORITATIVE per-surface pattern table: one list,
  cited by Task 7, Task 8, and End state 5; every pattern case-insensitive, swept with
  comment-leader stripping before normalization (anchors sit mid-sentence where the surface
  allows; three sit on heading/bold-lead lines, which line-based grep matches identically).
  Old-absent anchors: `spec is not a plan` · `spec ≠ plan` (README's own gospel headline) ·
  `required auxiliary plugin` · `required-auxiliary-plugin` (the hyphenated in-page fragment,
  README only) · ``grill-with-docs` authors`` (slash-less — matches both CLAUDE.md and
  CONTEXT.md occurrences) · `never authors` (covers CLAUDE.md's "never authors a spec from
  scratch" and README's "never authors one from scratch") · `authored by interview`
  (CONTEXT.md's Design-spec entry framing) · `converts spec → plan` · `convert a spec into a
  plan` (the README usage-section two-file framings) · `why it's required` · `why war doesn't
  ship its own` · `interview a spec into a plan` · `author the input plan`. Deliberate
  NON-anchor (recorded so a future sweep doesn't add it blindly): `cannot execute one` — that
  clause stays TRUE of input-shape specs and may legitimately appear in the rewritten
  glossary/README; the retired framing around it is covered by `spec ≠ plan`,
  `authored by interview`, and `spec is not a plan` instead. New-present anchors,
  one per surface: README `recommended auxiliary plugin` · CLAUDE.md `one interview, one
  merged artifact` · war-help the updated command-table row wording · CONTEXT.md `input
  shape` (Task 7's entry) · war-strategy the §2 merged-template heading (Task 1's suite).
- Done when: None — Task 8's committed pins + End state 5's per-surface both-ways grep at
  land.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 7: CONTEXT.md vocabulary
- Files: `CONTEXT.md`
- Plan slice: redefine **Plan** (merged, self-contained) and **Spec** (input shape) at their
  existing entries — the **Design spec** and **Implementation plan** glossary entries and the
  pipeline paragraph that follows them, by construct, not line number; add Evidence tag (with
  ADR 0007 ladder mapping; _Avoid_: memory/training as a `(verified:)` source), Assumptions
  ledger, Done-when, Decisive slot, Executor gate (authoring).
- Done when: None — glossary prose; Task 8's CONTEXT.md pins + End state 5 sweep cover the
  retired pipeline sentence.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 8: Gospel pins — committed both-ways enforcement for the doc surfaces
- Files: `skills/war-machine/war-pipeline-structure.test.sh`
- Plan slice: adjudicated 2026-08-05 (the five-surface sweep may not ride a hand-run grep
  alone — ADR 0017): first add a **case-insensitive absence helper `lacks_i()`** whose body
  mirrors `lacks()` exactly except for the `-i` flag — `strip_prose < "$1" | grep -qiF -e
  "$2"` — inheriting `strip_prose`'s `## Status`/`## Changelog` section drop (load-bearing:
  Task 10's Status blurb describes this very rename, the recorded
  release-blurb-trips-its-own-guard class; comment-leader stripping belongs to the hand-run
  land-time sweep, not this helper — the existing `lacks()` is case-SENSITIVE and the suite
  has no insensitive absence arm; `has_i()` is the style precedent) plus a CLAUDE.md
  handle beside the suite's existing README / CONTEXT / war-help / war-strategy handles; then
  land committed `lacks_i()` old-absent pins for every Task-6 retired anchor across all five
  End-state-5 surfaces, AND committed new-present pins for README (`recommended auxiliary
  plugin`), CLAUDE.md (`one interview, one merged artifact`), war-help (the updated
  command-table row), and CONTEXT.md (`input shape`) — making the committed sweep both-ways
  on every surface the suite owns (war-strategy's both-ways enforcement lives in its own
  suite, Task 1). Pin scope stays the five doc surfaces — the suite never greps its own
  source, docs/plans/, docs/red-team/, or docs/adr/ (which legitimately quote the anchors).
- Done when: `bash skills/war-machine/war-pipeline-structure.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: [6, 7]
- target repo: superproject

### Task 9: ADR 0044
- Files: `docs/adr/0044-authoring-contract-and-merged-artifact.md`
- Plan slice: ratify the authoring output contract (D4–D6, D18–D19), the collapse + uniform
  reach (D15–D16, with the corrected 100/116-at-`94ee5b3` evidence and the
  extraction-compatibility constraint), and the placement reversal (D2, superseding the README
  stance); the title line contains `authoring contract` (End state 9's check pattern);
  `**Status:** accepted` per the house format; house ADR structure.
- Done when: None — decision record; red-team's coherence probes grade it.
- requiresTest: false
- requiresPackaging: false (docs/-only addition — the plugin package ships `skills/`, not
  `docs/`)
- deps: []
- target repo: superproject

## Phase 3 — Release

### Task 10: Version bump, four slots lock-step
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump to the next free patch above the live base (A3; non-authoritative literal —
  resolve at land); README `## Status` replace-in-place blurb summarizing: WAR owns its front
  door — one interview, one merged artifact, uniform on every path.
- Done when: `node --test skills/war/assets/version-slots.test.mjs` (carried voluntarily —
  permitted under D5 for a `requiresTest: false` task)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

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
  findings against Task 1's template draft too. Round-2 consequence applied: every task block
  now renders each field on its own `- ` bullet, the exact layout Task 1 ratifies.
- README is touched in Phase 2 (Task 6) and Phase 3 (Task 10) — different phases, sanctioned
  by the phase-edge rule; within each phase it is single-tasked. Likewise
  `war-pipeline-structure.test.sh` in Phase 1 (Task 3) and Phase 2 (Task 8).
- `requiresPackaging` is true only where the diff adds plugin-shipped files (Task 1's
  `references/` doctrine file); Task 9's `docs/` ADR is not packaged.
- Red-team adjudications (2026-08-05, rounds 1–2) supersede spec §4b's compact renderings and
  spec §1's 99/116 literal: the Part-2 tail is TWO separate H2s; per-task fields are SEPARATE
  `- ` bullets (an extraction requirement — round-3 executed proof: `extractFiles` ingests
  ONLY the bullet form; a round-2 analyzed claim to the contrary was refuted); Task 5 widens
  into
  red-team's own scaffold/lenses/references, re-scoping "engine untouched" to the /war
  engine; the pairing figure is 100/116 at `94ee5b3`. Full record:
  `docs/red-team/2026-08-05-interview-and-authoring-contract.md`.

## Open decisions

None.
