# In-band absorb by default — squash every seat-found fixable bug inside the run

**Evidence consumed** — one row per linked artifact:
- `docs/studies/2026-09-03-followup-filing-study/` (README, `classified.json`, `closures.json`, `versions.json`) at `782af11` on `claude/issue-1476-analysis-784c44` (PR #1996) · read
- `skills/war/assets/workflow-template.js` at `acf3126`: DISPOSITION RULE + WIDENINGS prompt blocks, the three ace-side reserve gates, the held-phase `phaseCloseQueue` drain, the sweep-raised demote arms, the file-followups dispatch and consolidation, the `ace_diff_files` clause · read
- `skills/war/references/disposition-eligibility.md`, `agents/war-auditor.md` (Latitude and disposition), ADR 0013 (rule 4 + both amendments), ADR 0012 at `acf3126` · read
- `skills/war-campaign/assets/campaign-ledger.mjs` exports at `acf3126` · read
- `skills/war/assets/prompt-surface-budgets.test.mjs` budget rows at `acf3126` · read
- issues #1492, #1431, #1547 · read
- `.claude/war/runs/*.json` · read for the study denominator only

## Context — the gap / problem

- 85% of the 391 `war-followup` issues were fixable in-band; 189 of them in five lines or fewer (verified: the study at `782af11`).
- The fixable share is flat at 82% to 92% across every plugin release band since 0.15. No release moved it (verified: the study, `versions.json`).
- The dominant why-not-absorbable is a scope argument ("the slice does not name this file"), not a mechanical barrier (verified: the study, class rows and agent notes).
- The #1431 mechanism-substitution class is 5% of filings; the #1547 batch-revert demotion class is under 1% (verified: the study).
- Lane-closed filings (fixable, but every WAR lane shut by rule) are 8% to 15% of filings from 0.17.11 on (verified: the study, `versions.json`).
- 52 absorb-disposed findings demoted because the phase-close sweep never ran (verified: the study, channel rows). The held-phase arm demotes the whole `phaseCloseQueue` with "held phase — the phase-close sweep never dispatched" (verified: `workflow-template.js` held-phase drain at `acf3126`).
- A sweep-raised absorb demotes because the sweep is the phase's terminal fix round (verified: `workflow-template.js`, the "sweep-raised absorb" demote reasons at `acf3126`; prior lesson `terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it`).
- Today `absorb` is never a default; an omitted Minor disposition becomes `follow-up` (verified: ADR 0013 rule 4, `agents/war-auditor.md` Disposition rule, dispatched DISPOSITION RULE at `acf3126`).
- The ace-side gates (bisection ladder, re-entry, subset commits) read `fixRounds >= roundLimit - 2`, a reserve shared with the merge-floor retry loop (verified: `workflow-template.js` at `acf3126`). `roundLimit` is also read by the blocking fix loop, the segmented-land re-dispatch, and the CAS push loop (verified: same file).
- The Workflow sandbox cannot read files or run git; the orchestrator's only file refusal today is a release-slot filename string check (verified: `workflow-template.js` D4 comment at `acf3126`). The ace gate already receives a git-derived `ace_diff_files` list from a dispatched agent (verified: `ACE_DIFF_FILES_CLAUSE` at `acf3126`).
- `campaign-ledger.mjs` exports only `extractFiles` and `intersectFootprints`; each ledger entry stores its plan's `files` at `init` and at `sweep` (user).
- Each `/war` phase is one Workflow run from a staged copy of the template (verified: `skills/war/SKILL.md` "one Workflow per phase" at `acf3126`). Anything carried to the next phase rides the handoff and the Lead re-threads it as args.
- Byte headroom, measured at `acf3126` (D12 dated snapshot; re-measure at the task's rebased base): `agents/war-auditor.md` 27,915 B against a 28,672 B hard line (757 B free); `skills/war/SKILL.md` 72,512 B against 73,728 B (1,216 B free) (verified: `wc -c` + `prompt-surface-budgets.test.mjs` rows).

## Pivotal constraints

- Standing card and dispatched prompt change in the same commit (the standing/dispatched split law).
- Engine and seat-prompt behavior land before any planning-surface change. No `war-strategy`, `red-team`, or `plan-interview` doctrine edit in this plan.
- Never delete or weaken a test via absorb. Release-slot files stay refused from ace and sweep. Critical/Major blocking is untouched.
- Every demotion, reroute, skip, and budget block is logged. Nothing is silent.
- Budgeted surfaces stay under their hard lines: the card keeps a one-sentence rule plus a trigger pointer; doctrine bodies live in `references/` (ADR 0042).
- `fixRounds` and its 2-slot merge-floor reserve are untouched.

## Resolved design tree

| # | Decision | Resolution | Source | Landing class |
|---|---|---|---|---|
| D1 | Default for an in-diff, fully specified Minor/Nit | `absorb`. `follow-up` is legal only with one barrier from the closed list: release-slot file · fix not fully specified · behavior change with a nameable trade-off (routes `ask`, not `follow-up`) · the fix removes or edits a line carrying a `ponytail:` or deliberate-mirror rationale comment. A scope argument is not a barrier. Amends ADR 0013 rule 4 for the in-diff fully-specified case only. | (user) | PIN-1→guardrail ‡ · PIN-2→guardrail |
| D2 | Out-of-diff findings and the sweep footprint | Seat rule: a fully specified Minor/Nit whose file is outside the task diff defaults to `absorb` + `phaseClose:true`. Engine rule at sweep time: one exclusion set = `args.sweepExclude` ∪ `Files:` of every task whose status is not `merged` ∪ the release-slot filenames, both sides `aceRelPath`-normalized. A queued absorb whose file is in the set demotes to `follow-up` with a reason naming the owner (plan slug or task id). The seat never decides exclusion. | (user) | PIN-3→slice (T1.2) |
| D3a | Terminal pass | Once per phase, after the polish merge and before land, at the terminal-pass SHA, read-only re-audit by one seat: the roster's `correctness` seat when present, else the roster's first seat with its own lens; the log names the seat. Charges `r.task.absorbRounds` on the polish task. Empty queue ⇒ skip with a log line. A fresh absorb raised by the terminal seat: non-final phase ⇒ rides the handoff to the next phase's queue, reason "carried from phase N terminal pass"; final phase ⇒ `follow-up`, reason "raised on the terminal pass". One hop per phase, never a second terminal pass. The sweep-raised demote arm is retired; the terminal pass is its sole successor. | (user) | PIN-4→guardrail · PIN-9→slice (T2.1) |
| D3b | Held-phase queue | A held phase writes its `phaseCloseQueue` to the handoff key `carriedPhaseClose` and demotes nothing. The Lead threads it into the relaunch as `args.seededPhaseClose`, which carries an entry-validation row and the #1413 own-token provenance treatment. | (user) | PIN-5→slice (T2.1, T3.1) |
| D4 | Engine filing floor | The file-followups dispatch refuses a `follow-up` whose `file` is in the task's git-derived diff and whose why-not-absorbable carries no barrier token from D1's list. It reroutes the finding to `absorb` and logs the reroute. Deterministic only: file membership via `MERGE_RESULT.diff_files` (returned by the refiner's merge dispatch from `git diff --name-only`, the `ace_diff_files` shape), token presence via string match. The engine never estimates fix size. Worker `files_changed` is never the source. The floor runs before consolidation. | (user) | PIN-6→guardrail |
| D5 | Absorb budget | Knob `run.absorbRounds`: integer ≥ 1, default 6, `null` reads as unset, validated in `war-config.mjs` beside `run.roundLimit`, exposed in `/war-room`. Counter `r.task.absorbRounds`, per task, charged by batch ace, re-entry batch, bisection subset commit, and the terminal pass; never by reverts, re-audit panels, or fix rounds. Every ace-side gate that reads `fixRounds >= roundLimit - 2` reads `absorbRounds < run.absorbRounds` instead. Exhaustion routes the finding to the sweep with a log line naming the counter. | (user) | PIN-7→slice (T1.1, T1.2) |
| D6 | Contention source | The Lead builds `args.sweepExclude` at launch from the campaign ledger JSON: the `files` of every entry that is not this plan and whose status is not `landed`. No plan-file re-extraction, no new export. Absent ledger ⇒ no list, one log line "no campaign contention set threaded"; the in-phase and release-slot arms still run. The run manifest records `sweepExcludeCount` (null when no list was threaded). | (user) | PIN-8→slice (T3.1) |
| D7 | Prompt surfaces | `agents/war-auditor.md`, the dispatched DISPOSITION RULE in `workflow-template.js`, and `disposition-eligibility.md` change in one commit. | (user) | PIN-12→guardrail ‡ |
| D8 | Ordering | Engine and seat prompts first. No planning-surface edits in this plan. | (user) | PIN-10→non-goal |
| D9 | Test law | Never delete or weaken tests via absorb. | (user) | PIN-11→guardrail ‡ |
| D10 | Task 1.2 size | D1, D2, D4, D5 land in one `workflow-template.js` task under same-file law. | (user; planner's call on the offered split: not taken) | slice (T1.2) |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|---|---|---|---|---|
| A1 | Sandbox args carry each task's `Files:` and status | (user) | D2's in-phase arm has no input | `sweep-exclude` fixture: in-phase hit demotes naming the task |
| A2 | Ledger entries carry `files` at `init` and at `sweep` | (user) | D6 needs a re-extraction path | Task 3.1 prose cites the ledger field; red-team probe reads a fixture ledger |
| A5 | The terminal pass skips with a log when no terminal-born absorb exists | [assumed: an empty ace dispatch is waste — if wrong: one no-op dispatch per phase] | one dispatch per phase | `terminal-pass` fixture: empty queue logs skip |
| A7 | The refiner's merge dispatch can return `diff_files` without a new dispatch kind | [assumed: the merge prompt already runs git in the task worktree — if wrong: a second refiner read] | D4 has no input on merge | `filing-floor` fixture: `diff_files` absent ⇒ skip + log |
| A8 | The D1 sentence rewrite fits the card's 757 B headroom with the body evicted to `disposition-eligibility.md` | [assumed: replace-in-place is net-neutral — if wrong: evict one more card paragraph under ADR 0042] | budget test red at land | End state 8 |

## Non-goals / deferred

- Study change 5: a plan that byte-freezes a surface must name its repair lane. Deferred.
- Any widening of Critical/Major blocking.
- Planning-surface doctrine edits (`war-strategy`, `red-team`, `plan-interview`).
- Operator-found bugs. The Purpose covers seat-found findings only.

## New domain terms · Recommended ADRs

Terms for `CONTEXT.md`: **barrier list** (the closed set of lawful `follow-up` reasons) · **exclusion set** (the sweep's union of foreign-owned files and release-slot files) · **terminal pass** (the one-hop ace pass after the polish merge) · **carried queue** (a held or terminal-born absorb queue that rides the handoff into the next run).

ADRs: amend ADR 0013 with the in-diff default flip and the barrier list (Task 1.3). ADR 0012 gains one line naming the terminal pass as the sweep's successor for sweep-raised absorbs (Task 1.3).

## Commander's Intent

- **Purpose:** every fixable bug found by a seat in a run is fixed in that run. Only a barrier from the closed list may file an issue.
- **Method:** flip the in-diff default to `absorb` and route out-of-diff fixes to the sweep; give the sweep one exclusion set instead of a slice fence; add a one-hop terminal pass after the polish merge; carry a held phase's queue into the relaunch; back the seat rule with a deterministic filing floor; give absorbs their own round budget.
- **Mechanism latitude:** counter placement and log wording · exclusion-set construction order · fixture shapes and titles beyond the pinned title tokens · the carried-queue record's field names · the reroute log format · where the `sweep-exclusion.md` body sits in `references/`. Substituting any of these mechanisms while the End states and binding guardrails hold is not a plan deviation and warrants no issue.
- **Binding guardrails:**
  - the barrier list is exactly D1's four items; a scope argument is never a barrier (PIN-1, PIN-2);
  - the terminal pass is one hop per phase, never a second pass; the sweep-raised demote arm is retired (PIN-4);
  - the filing floor is deterministic: git-derived `diff_files` and token match only, never a size estimate (PIN-6);
  - `fixRounds` and its 2-slot merge-floor reserve are untouched (PIN-7);
  - release-slot files stay refused from ace, sweep, and terminal pass; never delete or weaken a test (PIN-11);
  - standing card, dispatched prompt, and eligibility doc change in one commit (PIN-12);
  - every demotion, reroute, skip, and budget block is logged;
  - no planning-surface edit (PIN-10);
  - budgeted surfaces stay under their hard lines.
- **End state:**
  1. The dispatched DISPOSITION RULE byte-mirrors the card, names the in-diff `absorb` default, and carries the four barrier tokens; fixtures titled `barrier-list` · check: `grep -c 'barrier-list' skills/war/assets/workflow-template.test.mjs` prints at least 3 && `node --test skills/war/assets/workflow-template.test.mjs` exits 0.
  2. The old sentence "absorb and ask are never defaults" and its variants are absent from all nine surfaces in Task 1.3's gate row; row titled `old-default-absent` · check: `grep -c 'old-default-absent' skills/war/assets/skill-doc-contracts.test.mjs` prints at least 1 && `node --test skills/war/assets/skill-doc-contracts.test.mjs` exits 0.
  3. Exclusion set: a campaign hit demotes naming the plan slug, an in-phase hit demotes naming the task id, an absent list reaches the sweep, a `./`-form path still matches; fixtures titled `sweep-exclude` · check: `grep -c 'sweep-exclude' skills/war/assets/workflow-template.test.mjs` prints at least 4 && `node --test skills/war/assets/workflow-template.test.mjs` exits 0.
  4. Absorb budget: a task with `fixRounds` at the reserve still runs an ace batch; a task with `absorbRounds` spent routes to the sweep with a log naming the counter; `war-config.mjs` rejects `run.absorbRounds: 0` and reads `null` as unset; fixtures titled `absorb-budget` · check: `grep -c 'absorb-budget' skills/war/assets/workflow-template.test.mjs skills/war/assets/war-config.test.mjs` prints at least 3 total && `node --test skills/war/assets/workflow-template.test.mjs skills/war/assets/war-config.test.mjs` exits 0.
  5. Filing floor: a `follow-up` with an in-diff file and a scope-only reason reroutes to `absorb` with a log; the same finding with a barrier token stays `follow-up`; `diff_files` absent skips the floor with a log; fixtures titled `filing-floor` · check: `grep -c 'filing-floor' skills/war/assets/workflow-template.test.mjs` prints at least 3 && `node --test skills/war/assets/workflow-template.test.mjs` exits 0.
  6. Terminal pass: a roster without `correctness` still convenes the pass; a non-final phase emits exactly one `carriedPhaseClose` entry; a final phase files exactly one demotion with reason "raised on the terminal pass"; a spent budget logs budget-blocked and files nothing silently; the old "sweep-raised absorb" demote reasons are absent from `workflow-template.js`; fixtures titled `terminal-pass` · check: `grep -c 'terminal-pass' skills/war/assets/workflow-template.test.mjs` prints at least 5 && `grep -c 'sweep-raised absorb' skills/war/assets/workflow-template.js` prints 0 && `node --test skills/war/assets/workflow-template.test.mjs` exits 0.
  7. Held carry: a held phase emits `carriedPhaseClose` and zero demotions with reason "held phase — the phase-close sweep never dispatched"; a relaunch with `args.seededPhaseClose` drains the seeded entries into the sweep; fixtures titled `held-carry` · check: `grep -c 'held-carry' skills/war/assets/workflow-template.test.mjs` prints at least 2 && `node --test skills/war/assets/workflow-template.test.mjs` exits 0.
  8. Every budgeted prompt surface stays under its hard line at the landed tip · gate: `node --test skills/war/assets/prompt-surface-budgets.test.mjs`.
  9. Field effect · backstop: row 1 in `## Deferred validations (backstops)`.

## Build order (for /war)

Phase 1 (knob, engine core + seat surfaces, default-flip doc sweep) → Phase 2 (terminal pass + held carry) → Phase 3 (Lead surfaces) → Phase 4 (release).

## Phase 1 — Default flip, exclusion set, absorb budget, filing floor

### Task 1: absorbRounds knob
- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`, `skills/war-room/SKILL.md`
- Plan slice: add `run.absorbRounds` to `DEFAULTS.run` (6) and every preset; validate integer ≥ 1 with `null` read as unset (the conventional unset value, never a hard reject); add the `/war-room` override row beside `run.roundLimit` (PIN-7). Fixtures titled `absorb-budget` for the reject-0 and null-unset arms.
- Done when: `node --test skills/war/assets/war-config.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: engine core and seat prompts, one commit
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-auditor.md`, `agents/war-refiner.md`, `skills/war/references/disposition-eligibility.md`, `skills/war/references/file-followups.md`, `skills/war/references/schemas.md`
- Plan slice: (D1) rewrite the DISPOSITION RULE sentence in the card and the dispatched prompt to the in-diff `absorb` default and the four-item barrier list, byte-mirrored, with the body in `disposition-eligibility.md` (PIN-1, PIN-2, PIN-12); (D2) add the out-of-diff seat rule (`absorb` + `phaseClose:true`) to both layers, and build the exclusion set at sweep time from `args.sweepExclude` ∪ `Files:` of tasks not `merged` ∪ the release-slot filenames, `aceRelPath` on both sides, demotion reason naming the owner (PIN-3); add the `sweepExclude` args entry-validation row; (D5) add `r.task.absorbRounds`, charge it at batch ace, re-entry, subset commits, and reserve the terminal-pass charge site; replace the three `fixRounds >= roundLimit - 2` ace-side gates with `absorbRounds < run.absorbRounds`; hand-mirror the default and land its mirror-registry row (rule 5, PIN-7); (D4) add `diff_files` to `MERGE_RESULT` with its schema pin, the refiner card clause and dispatched clause (the `ace_diff_files` shape), and the filing floor that runs before consolidation and reroutes a scope-only in-diff `follow-up` to `absorb` with a log (PIN-6); mirror the filing-prompt change into `file-followups.md`; add `schemas.md` rows for `diff_files` and `sweepExclude`. Fixtures titled `barrier-list`, `sweep-exclude`, `absorb-budget`, `filing-floor`, each red with its arm deleted.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [1]
- target repo: superproject

### Task 3: default-flip doc sweep
- Files: `CLAUDE.md`, `CONTEXT.md`, `skills/war/SKILL.md`, `skills/war/references/design.md`, `skills/war/references/gastown-design-params.md`, `docs/adr/0013-commanders-intent-and-disposition-routing.md`, `docs/adr/0012-intra-phase-visibility-and-phase-close-sweep.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: rewrite the old "never a default" sentence on the six surfaces this task owns to the new rule (rule 6); add the ADR 0013 amendment (in-diff default flip + barrier list) and the ADR 0012 line (terminal pass succeeds the sweep-raised arm); add glossary terms barrier list and exclusion set; land the `old-default-absent` gate row asserting the OLD sentence absent across all nine surfaces: `CLAUDE.md`, `CONTEXT.md`, `agents/war-auditor.md`, `docs/adr/0013-commanders-intent-and-disposition-routing.md`, `skills/war/SKILL.md`, `skills/war/assets/workflow-template.js`, `skills/war/references/design.md`, `skills/war/references/gastown-design-params.md`, `skills/war/references/schemas.md` (Task 2 authors the three it owns; this task's gate reads them after the rebase, rule 7). Keep `skills/war/SKILL.md` under its hard line: replace in place, no net growth.
- Done when: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [2]
- target repo: superproject

## Phase 2 — Terminal pass and held carry

### Task 1: engine
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `skills/war/references/schemas.md`
- Plan slice: (D3a) add the terminal pass after the polish merge and before land: apply the terminal-born absorbs as one ace-shaped commit, charge `r.task.absorbRounds` on the polish task, convene one seat (`correctness` when present, else the roster's first seat with its lens, logged), skip with a log on an empty queue; a fresh absorb from that seat rides `carriedPhaseClose` on a non-final phase and demotes to `follow-up` with "raised on the terminal pass" on the final phase; retire both "sweep-raised absorb" demote arms (PIN-4, PIN-9). (D3b) the held-phase arm writes `phaseCloseQueue` to handoff key `carriedPhaseClose` instead of demoting; add `args.seededPhaseClose` with an entry-validation row and the #1413 own-token provenance treatment; seeded entries drain into the sweep (PIN-5). Add `schemas.md` rows for `carriedPhaseClose` and `seededPhaseClose`. Fixtures titled `terminal-pass` and `held-carry`.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: glossary
- Files: `CONTEXT.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: add the terms terminal pass and carried queue; retire the sweep-raised sentence in `CONTEXT.md`; pin both terms.
- Done when: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Lead surfaces

### Task 1: launch and relaunch prose
- Files: `skills/war/SKILL.md`, `skills/war/references/sweep-exclusion.md`, `skills/war/references/resume-and-recovery.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: new `sweep-exclusion.md` carries the Lead duty: build `args.sweepExclude` from the campaign ledger JSON (`files` of entries not this plan and not `landed`), absent ledger ⇒ one log line "no campaign contention set threaded", record `sweepExcludeCount` in the run manifest (null when absent) (PIN-8); `skills/war/SKILL.md` gains one trigger pointer in the ADR 0042 shape (`when launching under a campaign, read references/sweep-exclusion.md`) and stays under its hard line; `resume-and-recovery.md` gains the relaunch step: thread the handoff's `carriedPhaseClose` into `args.seededPhaseClose`. Pins for the pointer and the relaunch step.
- Done when: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: telemetry
- Files: `skills/war-review/SKILL.md`
- Plan slice: add rows for `sweepExcludeCount` (n/a when null, 0 when empty), the terminal-pass seat and outcome per phase, and `absorbRounds` spent per task.
- Done when: None — prose-only telemetry rows, no war-review suite
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 4 — Release

### Task 1: version bump
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`
- Plan slice: bump all four slots in lock-step to the next free patch above the live base; replace the `## Status` blurb in place; add the CHANGELOG head entry naming the default flip, the exclusion set, the terminal pass, the held carry, the filing floor, and `run.absorbRounds`.
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: true
- requiresPackaging: true
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Field effect: rerun the study rubric on the next two plans executed after this release. Targets: follow-ups per task under 1.0, and filed follow-ups classified yes-trivial or yes-small under 25% (today 69%) · why deferred: needs two live runs · runner: operator, with the README rubric in `docs/studies/2026-09-03-followup-filing-study/README.md`, at the close of the second plan.

## Notes / conscious deviations

- Task 1.2 carries D1, D2, D4, and D5 in one `workflow-template.js` diff under same-file law (D10). The offered three-phase split was not taken; `absorbRounds` decouples the ace ladder from the fix budget, so a long roster round on this diff no longer starves absorbs.
- The D4 floor sits before consolidation so a rerouted finding never reaches the issue body. Prior lesson `hygiene-arm-placed-after-existing-dirty-fail-loud-guard-is-unreachable-for-the-corruption-it-targets`: ordering decides reachability, and the `filing-floor` fixtures reach the floor's own branch.

## Open decisions

None.
