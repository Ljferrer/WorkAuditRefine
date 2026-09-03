# In-band absorb by default — squash every seat-found fixable bug inside the run

**Evidence consumed** — one row per linked artifact:
- `docs/studies/2026-09-03-followup-filing-study/` (README, `classified.json`, `closures.json`, `versions.json`) at `782af11` on `claude/issue-1476-analysis-784c44` (PR #1996) · read
- `skills/war/assets/workflow-template.js` at `acf3126`: DISPOSITION RULE + WIDENINGS prompt blocks, the two ace-side reserve gates and the batch-ace gate, the held-phase `phaseCloseQueue` drain, the sweep-raised demote arms, the file-followups dispatch and consolidation, the `ace_diff_files` clause · read
- `skills/war/references/disposition-eligibility.md`, `agents/war-auditor.md` (Latitude and disposition), ADR 0013 (rule 4 + both amendments), ADR 0012 at `acf3126` · read
- `skills/war-campaign/assets/campaign-ledger.mjs` exports at `acf3126` · read
- `skills/war/assets/prompt-surface-budgets.test.mjs` budget rows at `acf3126` · read
- issues #1492, #1431, #1547 · read
- #1547 `## Evidence artifacts`: target-repo epic phase reports (#321, #322) · unread — private target repo; duplicate-issue clusters in the target repo · unread — private target repo; the interview-review exchange under `~/Documents/WAR/1547-…` · unread — outside this checkout; the motivating run manifest `recseg-serving-uptime-2026-08-15.json` · unread — private target repo, not among this repo's manifests
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
- Two ace-side gates read `fixRounds >= roundLimit - 2`: the `aceBisect` subset-commit stop and the `aceReentry` reserve stop (verified: `workflow-template.js` at `acf3126`, two code sites). The batch ace reads a different gate, `fixRounds < roundLimit`, deliberately outside the reserve (verified: the `aceBisect` comment and `references/design.md` §18). Every ace-side commit charges the shared `fixRounds` counter that the merge-floor retry loop also draws from (verified: the three `fixRounds++` sites at `acf3126`). `roundLimit` is also read by the blocking fix loop, the segmented-land re-dispatch, and the CAS push loop (verified: same file).
- The Workflow sandbox cannot read files or run git; the orchestrator's only file refusal today is a release-slot filename string check (verified: `workflow-template.js` D4 comment at `acf3126`). The ace gate already receives a git-derived `ace_diff_files` list from a dispatched agent (verified: `ACE_DIFF_FILES_CLAUSE` at `acf3126`).
- `campaign-ledger.mjs` exports nine symbols; among the footprint helpers only `extractFiles` and `intersectFootprints` are exported, and `extractFilesFromPlanFile` is module-private (verified: `grep '^export'` at `5362295`). Each ledger entry stores a `files` array at `init` and at `sweep` (verified: `makePlanEntry` and `sweep` at `5362295`). That array holds the plan's FIRST `- Files:` block only: `collectBlock` breaks at the first anchor (verified: `campaign-ledger.mjs` `collectBlock` at `5362295`).
- Each `/war` phase is one Workflow run from a staged copy of the template (verified: `skills/war/SKILL.md` "one Workflow per phase" at `acf3126`). Anything carried to the next phase rides the handoff and the Lead re-threads it as args.
- A live doc-contract row, `D43` in `skill-doc-contracts.test.mjs`, binds three living-doc homes (`skills/war/SKILL.md` `--ace` bullet, `CONTEXT.md` **Ace bisection** row, `references/design.md` §18) to the reserve arithmetic `roundLimit − 2` and the reserve-stop demote clause (verified: `skill-doc-contracts.test.mjs` `D43` at `5362295`). Any change to the ace-side gates must re-author those three homes and re-key `D43` in the same plan.
- Byte headroom, measured at `acf3126` (D12 dated snapshot; re-measure at the task's rebased base): `agents/war-auditor.md` 27,915 B against a 28,672 B hard line (757 B free); `skills/war/SKILL.md` 72,712 B against 73,728 B (1,016 B free, measured at `5362295`) (verified: `wc -c` + `prompt-surface-budgets.test.mjs` rows).

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
| D1 | Default for an in-diff, fully specified Minor/Nit | `absorb`. `follow-up` is legal only with a barrier the seat states in a structured `barrier` field on the finding (AUDIT_VERDICT, optional enum), never as prose. The canonical enum `BARRIER_TOKENS` lives in `skills/war/assets/land-decision.mjs`: `barrier:release-slot` (release-slot file) · `barrier:underspecified` (fix not fully specified) · `barrier:rationale-comment` (the fix removes or edits a line carrying a `ponytail:` or deliberate-mirror rationale comment) · `barrier:trade-off` (behavior change with a nameable trade-off; legal only with the `ask` field, and it routes `ask`, never `follow-up`). Three follow-up barriers plus one ask-routing tag. A scope argument is not a barrier. The why-not-absorbable prose stays free text. Amends ADR 0013 rule 4 for the in-diff fully-specified case only. | (user) | PIN-1→guardrail ‡ · PIN-2→guardrail |
| D2 | Out-of-diff findings and the sweep footprint | Seat rule: a fully specified Minor/Nit whose file is outside the task diff defaults to `absorb` + `phaseClose:true`. Engine rule at sweep time: one exclusion set = `args.sweepExclude` ∪ `Files:` of every task whose status is not `merged` ∪ the release-slot filenames, both sides `aceRelPath`-normalized. A queued absorb whose file is in the set demotes to `follow-up` with a reason naming the owner (plan slug or task id). The seat never decides exclusion. | (user) | PIN-3→slice (T1.2) |
| D3a | Terminal pass | Once per phase, on the merged-sweep path only: one ace-shaped commit at the post-polish integration tip applying the terminal-born absorbs, then one read-only re-audit seat (the roster's `correctness` seat when present, else the roster's first seat with its own lens; the log names the seat). "Read-only" describes the seat, not the pass. The terminal commit goes through Refine (floors, gate, merge) like any ace commit and charges `r.task.absorbRounds` on the polish task. No sweep this phase ⇒ skip with a log line. Empty terminal queue ⇒ skip with a log line. Re-audit regression ⇒ forward-revert the terminal commit, then carry (non-final phase) or demote (final phase); never a second terminal pass. A fresh absorb raised by the terminal seat: non-final phase ⇒ rides `carriedPhaseClose`, reason "carried from phase N terminal pass"; final phase ⇒ `follow-up`, reason "raised on the terminal pass". The merged-path sweep-raised demote arm is retired and the terminal pass is its successor. The discard-path demote arm stays, reworded to name the discard; on a non-final phase its absorbs ride `carriedPhaseClose` instead of demoting. Every branch logged. | (user) | PIN-4→guardrail · PIN-9→slice (T2.1) |
| D3b | Held-phase queue | `carriedPhaseClose` is a top-level key on the phase return for every `landDecision !== 'landed'`, independent of the handoff block, and present as an empty array on `landed` so its absence is never ambiguous. A held phase writes its `phaseCloseQueue` there and demotes nothing. The Lead reads the phase return, not the handoff, and threads it into the relaunch as `args.seededPhaseClose`, which carries an entry-validation row and the #1413 own-token provenance treatment. Accepted residual: a Workflow that throws before returning has no phase return; the Lead re-derives the queue from the seats' audit verdicts in the run transcripts, and the relaunch log names the re-derivation (recorded in `resume-and-recovery.md`, Task 3.1). | (user) | PIN-5→slice (T2.1, T3.1) |
| D4 | Engine filing floor | The file-followups dispatch reads each `follow-up` finding's `barrier` field. In-diff `follow-up` with no `barrier` ⇒ reroute to `absorb`, log. Out-of-diff `follow-up` with no `barrier` ⇒ reroute to `absorb` + `phaseClose:true`, log (the D2 seat rule, engine-backed). `barrier:trade-off` with the `ask` field present ⇒ reroute to `ask`; without the `ask` field ⇒ keep `follow-up`, log "trade-off without ask fields", never a schema throw. Any other `barrier` present ⇒ file as stated. Deterministic only: file membership via `MERGE_RESULT.diff_files` (returned by the refiner's merge dispatch from `git diff --name-only`, the `ace_diff_files` shape), enum membership via `BARRIER_TOKENS`. The engine never estimates fix size. Worker `files_changed` is never the source. The floor runs before consolidation. | (user) | PIN-6→guardrail |
| D5 | Absorb budget | Knob `run.absorbRounds`: integer ≥ 1, default 6, `null` reads as unset, validated in `war-config.mjs` beside `run.roundLimit`, exposed in `/war-room`. Counter `r.task.absorbRounds`, per task, charged by batch ace, re-entry batch, bisection subset commit, and the terminal pass; none of those charges `fixRounds` any more; reverts, re-audit panels, and fix rounds never charge it. All three ace gates (the `aceBisect` subset stop, the `aceReentry` stop, and the batch ace's `fixRounds < roundLimit`) read `absorbRounds < run.absorbRounds`. `fixRounds` counts blocking fix rounds and floor retries only, so its 2-slot reserve is real again. Ace dispatch labels and the `Ace-Subset` trailer carry `absorbRounds`, not `fixRounds` (resume idempotency keys on them). A relaunch re-derives `absorbRounds` from the task branch (ace commits plus `Ace-Subset` trailers) the way `fixRounds` is re-derived. Exhaustion routes the finding to the sweep with a log line naming the counter. | (user) | PIN-7→slice (T1.1, T1.2) |
| D6 | Contention source | The Lead builds `args.sweepExclude` at launch by running the exported `extractFiles` over the plan path of every ledger entry that is not this plan and whose status is not `landed`, and unions the result. Stored ledger `files` are not trusted for this (first-block-only until Task 1.4 lands and a sweep re-stamps them); they stay the ledger's contention record. Absent ledger ⇒ no list, one log line "no campaign contention set threaded"; the in-phase and release-slot arms still run. The run manifest records `sweepExcludeCount` (null when no list was threaded). | (user) | PIN-8→slice (T1.4, T3.1) |
| D7 | Prompt surfaces | `agents/war-auditor.md`, the dispatched DISPOSITION RULE in `workflow-template.js`, and `disposition-eligibility.md` change in one commit. | (user) | PIN-12→guardrail ‡ |
| D8 | Ordering | Engine and seat prompts first. No planning-surface edits in this plan. | (user) | PIN-10→non-goal |
| D9 | Test law | Never delete or weaken tests via absorb. | (user) | PIN-11→guardrail ‡ |
| D10 | Task 1.2 size | D1, D2, D4, D5 land in one `workflow-template.js` task under same-file law. | (user; planner's call on the offered split: not taken) | slice (T1.2) |
| D11 | Ledger footprint | `extractFiles` unions every `- Files:` block in a plan, deduped, in order of first appearance. The fail-loud empty-footprint throw fires only when the union is empty, never on one empty block. | (user; red-team round 1) | PIN-13→slice (T1.4) |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|---|---|---|---|---|
| A1 | Sandbox args carry each task's `Files:` and status | (user) | D2's in-phase arm has no input | `sweep-exclude` fixture: in-phase hit demotes naming the task |
| A5 | The terminal pass skips with a log when no terminal-born absorb exists | [assumed: an empty ace dispatch is waste — if wrong: one no-op dispatch per phase] | one dispatch per phase | `terminal-pass` fixture: empty queue logs skip |
| A7 | The refiner's merge dispatch can return `diff_files` without a new dispatch kind | [assumed: the merge prompt already runs git in the task worktree — if wrong: a second refiner read] | D4 has no input on merge | `filing-floor` fixture: `diff_files` absent ⇒ skip + log |
| A8 | The D1 sentence rewrite fits the card's 757 B headroom with the body evicted to `disposition-eligibility.md` | [assumed: replace-in-place is net-neutral — if wrong: evict one more card paragraph under ADR 0042] | budget test red at land | End state 8 |

## Non-goals / deferred

- Study change 5: a plan that byte-freezes a surface must name its repair lane. Deferred.
- Any widening of Critical/Major blocking.
- Planning-surface doctrine edits (`war-strategy`, `red-team`, `plan-interview`).
- Operator-found bugs. The Purpose covers seat-found findings only.

## New domain terms · Recommended ADRs

Terms for `CONTEXT.md`: **barrier list** (`BARRIER_TOKENS`, the closed enum a seat cites in the `barrier` field to file a `follow-up` or route an `ask`) · **exclusion set** (the sweep's union of foreign-owned files and release-slot files) · **terminal pass** (the one-hop ace pass after the polish merge) · **carried queue** (a held or terminal-born absorb queue that rides the handoff into the next run).

ADRs: amend ADR 0013 with the in-diff default flip and the barrier list (Task 1.3). ADR 0012 gains one line naming the terminal pass as the successor of the merged-sweep demote arm (Task 2.2, after the pass exists).

## Commander's Intent

- **Purpose:** every fixable bug found by a seat in a run is fixed in that run. Only a seat-cited barrier tag or a logged engine demotion may file an issue. The lawful engine filers are enumerated: exclusion-set hit, final-phase terminal pass, absorb-budget exhaustion after the sweep, discard-path sweep demotion.
- **Method:** flip the in-diff default to `absorb` and route out-of-diff fixes to the sweep; give the sweep one exclusion set instead of a slice fence; add a one-hop terminal pass after the polish merge; carry a held phase's queue into the relaunch; back the seat rule with a deterministic filing floor; give absorbs their own round budget.
- **Mechanism latitude:** counter placement and log wording · exclusion-set construction order · fixture shapes and titles beyond the pinned title tokens · the carried-queue record's field names · the reroute log format · where the `sweep-exclusion.md` body sits in `references/`. Substituting any of these mechanisms while the End states and binding guardrails hold is not a plan deviation and warrants no issue.
- **Binding guardrails:**
  - the barrier list is exactly `BARRIER_TOKENS`' four members, cited in the structured `barrier` field, three of them follow-up barriers and `barrier:trade-off` an ask route; a scope argument is never a barrier (PIN-1, PIN-2);
  - the terminal pass is one hop per phase, never a second pass, and a regressed terminal commit is forward-reverted then carried or demoted; the merged-path sweep-raised demote arm is retired, the discard-path arm stays (PIN-4);
  - the filing floor is deterministic: git-derived `diff_files` and `barrier` enum membership only, never prose matching or a size estimate (PIN-6);
  - `fixRounds` counts blocking fix rounds and floor retries only; no ace-side commit charges it; its 2-slot merge-floor reserve is untouched (PIN-7);
  - release-slot files stay refused from ace, sweep, and terminal pass; never delete or weaken a test (PIN-11);
  - standing card, dispatched prompt, and eligibility doc change in one commit (PIN-12);
  - every demotion, reroute, skip, and budget block is logged;
  - no planning-surface edit (PIN-10);
  - budgeted surfaces stay under their hard lines.
- **End state:**
  1. The dispatched DISPOSITION RULE byte-mirrors the card, names the in-diff `absorb` default, and renders the four `BARRIER_TOKENS` from the mirror; a registry row binds the inline mirror, the card sentence, and the eligibility-doc list to the canonical export in `land-decision.mjs`; fixtures titled `barrier-list` · check: `test "$(grep -c 'barrier-list' skills/war/assets/workflow-template.test.mjs)" -ge 3 && node --test skills/war/assets/workflow-template.test.mjs skills/war/assets/land-decision.test.mjs` exits 0.
  2. The old absorb-never-default claim and its variants are absent from the eight living surfaces in Task 1.3's gate row, and ADR 0013 carries the amendment section; row titled `old-default-absent` · check: `test "$(grep -c 'old-default-absent' skills/war/assets/skill-doc-contracts.test.mjs)" -ge 1 && node --test skills/war/assets/skill-doc-contracts.test.mjs` exits 0.
  3. Exclusion set: a campaign hit demotes naming the plan slug, an in-phase hit demotes naming the task id, an absent list reaches the sweep, a `./`-form path still matches; fixtures titled `sweep-exclude` · check: `test "$(grep -c 'sweep-exclude' skills/war/assets/workflow-template.test.mjs)" -ge 4 && node --test skills/war/assets/workflow-template.test.mjs` exits 0.
  4. Absorb budget: a task with `fixRounds` at `roundLimit` and `absorbRounds` free still runs an ace batch; a task with `absorbRounds` spent routes to the sweep with a log naming the counter; an ace commit leaves `fixRounds` unchanged; a relaunch with three ace commits on the task branch resumes `absorbRounds` at 3; ace labels carry `absorbRounds`; `war-config.mjs` rejects `run.absorbRounds: 0` and reads `null` as unset; fixtures titled `absorb-budget` · check: `test "$(grep -c 'absorb-budget' skills/war/assets/workflow-template.test.mjs)" -ge 5 && test "$(grep -c 'absorb-budget' skills/war/assets/war-config.test.mjs)" -ge 1 && node --test skills/war/assets/workflow-template.test.mjs skills/war/assets/war-config.test.mjs` exits 0.
  5. Filing floor: an in-diff `follow-up` with no `barrier` reroutes to `absorb` with a log; an out-of-diff `follow-up` with no `barrier` reroutes to `absorb` + `phaseClose:true` with a log; a `follow-up` with `barrier:release-slot` files as stated; `barrier:trade-off` with the `ask` field reroutes to `ask`; `barrier:trade-off` without it stays `follow-up` with the "trade-off without ask fields" log; `diff_files` absent skips the in-diff arm with a log; fixtures titled `filing-floor` · check: `test "$(grep -c 'filing-floor' skills/war/assets/workflow-template.test.mjs)" -ge 6 && node --test skills/war/assets/workflow-template.test.mjs` exits 0.
  6. Terminal pass: a roster without `correctness` still convenes the pass; the pass produces exactly one terminal commit; a non-final phase emits exactly one `carriedPhaseClose` entry; a final phase files exactly one demotion with reason "raised on the terminal pass"; a re-audit regression forward-reverts the terminal commit and carries or demotes; a discarded sweep on a non-final phase carries its absorbs; no sweep or an empty terminal queue logs a skip; a spent budget logs budget-blocked and files nothing silently; the merged-path "sweep-raised absorb" demote reason is absent from `workflow-template.js`; fixtures titled `terminal-pass` · check: `test "$(grep -c 'terminal-pass' skills/war/assets/workflow-template.test.mjs)" -ge 8 && ! grep -qi 'terminal fix round; absorb has no later round' skills/war/assets/workflow-template.js && node --test skills/war/assets/workflow-template.test.mjs` exits 0.
  7. Held carry: a `held:nothing-merged` phase emits `carriedPhaseClose` on the phase return and zero demotions with reason "held phase — the phase-close sweep never dispatched"; a default-deny census asserts the key is present on every hold class in the land-decision enum and is an empty array on `landed`; a relaunch with `args.seededPhaseClose` drains the seeded entries into the sweep; fixtures titled `held-carry` · check: `test "$(grep -c 'held-carry' skills/war/assets/workflow-template.test.mjs)" -ge 3 && node --test skills/war/assets/workflow-template.test.mjs` exits 0.
  8. Every budgeted prompt surface stays under its hard line at the landed tip · gate: `node --test skills/war/assets/prompt-surface-budgets.test.mjs`.
  9. Lead relaunch threading: `resume-and-recovery.md` carries the step that threads the phase return's `carriedPhaseClose` into `args.seededPhaseClose` and the transcript re-derivation residual, and `skills/war/SKILL.md` carries the `sweep-exclusion.md` trigger pointer; rows titled `lead-carry-pin` and `sweep-exclusion-pin` in `skill-doc-contracts.test.mjs` · check: `test "$(grep -c 'lead-carry-pin' skills/war/assets/skill-doc-contracts.test.mjs)" -ge 1 && test "$(grep -c 'sweep-exclusion-pin' skills/war/assets/skill-doc-contracts.test.mjs)" -ge 1 && node --test skills/war/assets/skill-doc-contracts.test.mjs` exits 0.
  10. Telemetry rows present: `skills/war-review/SKILL.md` names `sweepExcludeCount`, the terminal-pass seat row, and `absorbRounds` · check: `test "$(grep -ci 'sweepExcludeCount' skills/war-review/SKILL.md)" -ge 1 && test "$(grep -ci 'terminal pass' skills/war-review/SKILL.md)" -ge 1 && test "$(grep -ci 'absorbRounds' skills/war-review/SKILL.md)" -ge 1` exits 0.
  11. Ledger footprint: `extractFiles` unions every `- Files:` block; fixtures titled `files-union` · check: `test "$(grep -c 'files-union' skills/war-campaign/assets/campaign-ledger.test.mjs)" -ge 4 && node --test skills/war-campaign/assets/campaign-ledger.test.mjs` exits 0.
  12. Field effect · backstop: row 1 in `## Deferred validations (backstops)`.

## Build order (for /war)

Phase 1 (knob, engine core + seat surfaces, default-flip doc sweep, ledger footprint) → Phase 2 (terminal pass + held carry) → Phase 3 (Lead surfaces) → Phase 4 (release).

## Phase 1 — Default flip, exclusion set, absorb budget, filing floor

### Task 1: absorbRounds knob
- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`, `skills/war-room/SKILL.md`
- Plan slice: add `run.absorbRounds` to `DEFAULTS.run` (6); presets inherit it (only `economy` carries a `run` block today, and it stays untouched); validate integer ≥ 1 with `null` read as unset (the conventional unset value, never a hard reject); add the `/war-room` override row beside `run.roundLimit`, stating the shape only (integer ≥ 1, `null` unset) and pointing at `war-config.mjs` `DEFAULTS.run` for the value, never restating it (de-mirror, ADR 0025) (PIN-7). Fixtures titled `absorb-budget` for the reject-0 and null-unset arms.
- Done when: `node --test skills/war/assets/war-config.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: engine core and seat prompts, one commit
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `skills/war/assets/land-decision.mjs`, `skills/war/assets/land-decision.test.mjs`, `agents/war-auditor.md`, `agents/war-refiner.md`, `skills/war/references/disposition-eligibility.md`, `skills/war/references/file-followups.md`, `skills/war/references/schemas.md`
- Plan slice: (D1) add the canonical `BARRIER_TOKENS` export to `land-decision.mjs` with its own test row, hand-mirror it in `workflow-template.js` with a mirror-registry row (rule 5), render the dispatched DISPOSITION RULE sentence from the mirror, rewrite the card sentence to the in-diff `absorb` default and the barrier list, byte-mirrored, with the body in `disposition-eligibility.md`; add the optional `barrier` enum field to AUDIT_VERDICT (schema, card, dispatched prompt, `schemas.md` row); a registry row binds the card sentence and the eligibility-doc list to the canonical export (PIN-1, PIN-2, PIN-12); clear the old absorb-never-default wording at every occurrence in the files this task owns: `agents/war-auditor.md` (the Disposition rule), `schemas.md` (the AuditVerdict disposition row, uppercase `NEVER defaulted`), and `workflow-template.js` at the dispatched sentence and the args-contract comment; the two `ask`-only sentences in `workflow-template.js` (`dispositionOf`'s ask arm and the parked-ask identity comment) stay, because `ask` remains never-defaulted; re-key the byte-mirror pin in `workflow-template.test.mjs` that quotes the old sentence (lesson `source-comment-lags-emitted-prompt-after-rewrite`); hoist `aceRelPath` out of the wave-loop block to file scope so the sweep can call it; (D2) add the out-of-diff seat rule (`absorb` + `phaseClose:true`) to both layers, and build the exclusion set at sweep time from `args.sweepExclude` ∪ `Files:` of tasks not `merged` ∪ the release-slot filenames, `aceRelPath` on both sides, demotion reason naming the owner (PIN-3); add the `sweepExclude` args entry-validation row; (D5) add `r.task.absorbRounds`, charge it at batch ace, re-entry, and subset commits, and reserve the terminal-pass charge site; remove the `fixRounds++` charge at those three sites; convert all three ace gates (the two `fixRounds >= roundLimit - 2` reserve stops and the batch ace's `fixRounds < roundLimit`) to `absorbRounds < run.absorbRounds`; carry `absorbRounds` in the ace dispatch labels and the `Ace-Subset` trailer; re-derive `absorbRounds` at relaunch from ace commits plus `Ace-Subset` trailers on the task branch, beside the existing `fixRounds` re-derivation; hand-mirror the default and land its mirror-registry row (rule 5, PIN-7); (D4) add `diff_files` to `MERGE_RESULT` with its schema pin, the refiner card clause and dispatched clause (the `ace_diff_files` shape), and the filing floor that runs before consolidation and reads the `barrier` field: no `barrier` ⇒ `absorb` (in-diff) or `absorb` + `phaseClose:true` (out-of-diff), `barrier:trade-off` ⇒ `ask` when the `ask` field is present else keep with a log, any other barrier ⇒ file as stated (PIN-6); mirror the filing-prompt change into `file-followups.md`; add `schemas.md` rows for `diff_files` and `sweepExclude`. Fixtures titled `barrier-list`, `sweep-exclude`, `absorb-budget`, `filing-floor`, each red with its arm deleted.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs skills/war/assets/land-decision.test.mjs skills/war/assets/prompt-surface-budgets.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [1]
- target repo: superproject

### Task 3: default-flip doc sweep
- Files: `CLAUDE.md`, `CONTEXT.md`, `skills/war/SKILL.md`, `skills/war/references/design.md`, `skills/war/references/gastown-design-params.md`, `docs/adr/0013-commanders-intent-and-disposition-routing.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: rewrite the old "never a default" sentence on the five living surfaces this task owns to the new rule (rule 6); append the ADR 0013 amendment (in-diff default flip + barrier list; the ratified rule-4 body stays byte-untouched); add glossary terms barrier list and exclusion set; land the `old-default-absent` gate row asserting the OLD absorb-default claim absent across the eight living surfaces: `CLAUDE.md`, `CONTEXT.md`, `agents/war-auditor.md`, `skills/war/SKILL.md`, `skills/war/assets/workflow-template.js`, `skills/war/references/design.md`, `skills/war/references/gastown-design-params.md`, `skills/war/references/schemas.md` (Task 2 authors the three it owns; this task's gate reads them after the rebase, rule 7). The assert is case-insensitive over normalized text and covers every live variant (`never defaults`, `never defaulted`, `NEVER defaulted`, `never a default`) when `absorb` sits within 40 characters before it; `ask`-only sentences are lawful and stay. ADR 0013 is exempt from the OLD-absent row (append-only law, the file's own 2026-08-20 exemption idiom): the amendment lands NEW-present with a pin that the amendment section exists. Re-author the three `D43` living-doc homes (`skills/war/SKILL.md` `--ace` bullet, `CONTEXT.md` **Ace bisection** row, `references/design.md` §18) to the `absorbRounds` boundary and re-key `D43` in the same commit, with the retired `roundLimit − 2` arithmetic as an OLD-absent assert on those three homes. Keep `skills/war/SKILL.md` under its hard line: replace in place, no net growth.
- Done when: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [2]
- target repo: superproject

### Task 4: ledger footprint union
- Files: `skills/war-campaign/assets/campaign-ledger.mjs`, `skills/war-campaign/assets/campaign-ledger.test.mjs`
- Plan slice: `extractFiles` unions every `- Files:` block in the plan, deduped, in order of first appearance; the fail-loud empty-footprint throw fires only when the union is empty, never on one empty block (D11, PIN-13). Fixtures titled `files-union`: a three-task plan yields the union; a path repeated across tasks appears once; a plan with one empty block and one full block does not throw; the old single-block fixture still passes.
- Done when: `node --test skills/war-campaign/assets/campaign-ledger.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Terminal pass and held carry

### Task 1: engine
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `skills/war/references/schemas.md`
- Plan slice: (D3a) add the terminal pass on the merged-sweep path: one ace-shaped commit at the post-polish integration tip applying the terminal-born absorbs, through Refine like any ace commit, charging `r.task.absorbRounds` on the polish task, then one re-audit seat (`correctness` when present, else the roster's first seat with its lens, logged); no sweep or an empty terminal queue ⇒ skip with a log; re-audit regression ⇒ forward-revert the terminal commit, then carry (non-final) or demote (final), never a second pass; a fresh absorb from that seat rides `carriedPhaseClose` on a non-final phase and demotes to `follow-up` with "raised on the terminal pass" on the final phase; retire the merged-path "sweep-raised absorb" demote arm and rewrite the demote-reason census comment that names it; the discard-path arm stays, reworded to name the discard, and on a non-final phase its absorbs ride `carriedPhaseClose` instead (PIN-4, PIN-9). (D3b) add `carriedPhaseClose` as a top-level key on the phase return for every `landDecision !== 'landed'`, independent of the handoff block, and as an empty array on `landed`; the held-phase arm writes `phaseCloseQueue` there instead of demoting; add `args.seededPhaseClose` with an entry-validation row and the #1413 own-token provenance treatment; seeded entries drain into the sweep (PIN-5). Add `schemas.md` rows for `carriedPhaseClose` and `seededPhaseClose`, each with a pin in `workflow-template.test.mjs` binding the row's key name to the engine's emitted and validated key (the `done_when_log_path` schema-slot pin shape). Fixtures titled `terminal-pass` and `held-carry`.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: glossary
- Files: `CONTEXT.md`, `docs/adr/0012-intra-phase-visibility-and-phase-close-sweep.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: add the terms terminal pass and carried queue; retire the sweep-raised sentence in `CONTEXT.md`; append the ADR 0012 line naming the terminal pass as the successor of the merged-sweep demote arm; pin both terms and the ADR line.
- Done when: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Lead surfaces

### Task 1: launch and relaunch prose
- Files: `skills/war/SKILL.md`, `skills/war/references/sweep-exclusion.md`, `skills/war/references/resume-and-recovery.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: new `sweep-exclusion.md` carries the Lead duty: run the exported `extractFiles` over the plan path of every ledger entry not this plan and not `landed`, union the result into `args.sweepExclude` (stored ledger `files` are the contention record, not this input), absent ledger ⇒ one log line "no campaign contention set threaded", record `sweepExcludeCount` in the run manifest (null when absent) (PIN-8); `skills/war/SKILL.md` gains one trigger pointer in the ADR 0042 shape (`when launching under a campaign, read references/sweep-exclusion.md`) and stays under its hard line; `resume-and-recovery.md` gains the relaunch step: thread the phase return's `carriedPhaseClose` into `args.seededPhaseClose`, plus the accepted residual: a Workflow that threw before returning has no phase return, so the Lead re-derives the queue from the seats' audit verdicts in the run transcripts and the relaunch log names the re-derivation. Pins for the pointer (`sweep-exclusion-pin`) and the relaunch step (`lead-carry-pin`), End state 9.
- Done when: `node --test skills/war/assets/skill-doc-contracts.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: telemetry
- Files: `skills/war-review/SKILL.md`
- Plan slice: add rows for `sweepExcludeCount` (n/a when null, 0 when empty), the terminal-pass seat and outcome per phase, and `absorbRounds` spent per task. End state 10's case-insensitive presence greps are this task's pin.
- Done when: None — prose-only telemetry rows, no war-review suite; End state 10 carries the pin
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
- Red-team round 1 withdrew the echo-back 1 rider "no re-extraction" (D6): stored ledger footprints are first-block-only until Task 1.4 lands and a sweep re-stamps them, so the Lead re-extracts at launch.
- The D4 floor sits before consolidation so a rerouted finding never reaches the issue body. Prior lesson `hygiene-arm-placed-after-existing-dirty-fail-loud-guard-is-unreachable-for-the-corruption-it-targets`: ordering decides reachability, and the `filing-floor` fixtures reach the floor's own branch.

## Open decisions

None.
