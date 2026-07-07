# Issue #422 nit sweep — ledger CLI parity + true doc claims

**Goal:** close [#422](https://github.com/Ljferrer/WorkAuditRefine/issues/422) (phase-1 residual Minor/Nit
findings, companion skills). Two file-disjoint tasks + a trailing patch release. Plan 1 of the clean-audit
series (see `docs/roadmaps/2026-07-02-clean-audit-series-roadmap.md`) — lands FIRST, before roster and clean-handoff.

Memory hooks: [[cli-wrapper-lags-core-api-field-coverage]] (this plan IS that finding's fix),
[[audit-log-finding-can-be-stale-by-land-time]] (items 5+7 verified already-fixed — re-Grep before touching),
[[weak-test-assertion-passes-without-feature-being-exercised]] (unique-token discipline on new CLI tests),
[[release-bump-slots-canonical-no-badge]] + [[version-slots-no-cross-slot-consistency-test]] (T3),
[[dont-leave-work-on-the-table]] (§7.1 example crash absorbed into T2).

## Commander's Intent

- **Purpose:** close #422 with the campaign-ledger CLI at parity with the core API and every
  companion-skill doc claim true at the current tip.
- **Method:** thread `--stopPoint` through the CLI and build the update object conditionally; make the
  lifecycle example runnable verbatim; add the two missing README deep links; one-word `--afk --ace` fix;
  close the issue citing the documented won't-fixes.
- **End state:** (1) `record --stopPoint` round-trips through the CLI and no update stamps
  `pr: undefined`; (2) the §7.1 example runs without crashing; (3) war-help's table links every companion
  skill's README section and the roles bullet points at the README lineage section; (4) README's campaign
  paragraph names the real flags; (5) #422 closed — five findings fixed, two acknowledged as already fixed,
  two won't-fix with rationale.

## Build order (for /war)

- **Phase 1:** T1 ∥ T2 — file-disjoint (T1 = war-help card + README prose; T2 = war-campaign tree only).
- **Phase 2:** T3 release — cross-phase same-file with T1 on `README.md` (sections vs `## Status`),
  serialized by the phase edge.
- **Version:** +patch over the land-time base. The operator is the version authority — resolve the four
  canonical slots at land time; no version literal in this plan is authoritative.
- Runs under the v0.9.0 template — task audit annotations use the old schema (`coven: false` for solo).
- The PR closes #422 citing all nine dispositions (see Notes).

## Phase 1 — fix the live findings (2 parallel, file-disjoint tasks)

### Task 1 — docs nits: deep links + real flags

**Files:** `skills/war-help/SKILL.md`, `README.md`

**Plan slice:**
- [ ] **Command-table links (#422 item 1).** In the war-help command table, the `/war-strategy` and
  `/war-campaign` rows (currently at ~:18 and ~:22) gain README anchor links matching the sibling-row
  pattern (`../../README.md#author-a-plan-war-strategy`, `../../README.md#run-a-campaign-war-campaign`).
  Both target sections and anchors verified live — the issue's "after T4 lands" precondition is satisfied.
- [ ] **Roles bullet (#422 item 2).** In the `**3. Roles**` bullet (currently at ~:26), REPLACE the
  `design.md` deep-link with a link to README `## Roles → Gas Town lineage`
  (`../../README.md#roles--gas-town-lineage`). design.md stays linked twice elsewhere in the same card.
- [ ] **Campaign flags (#422 item 9).** README `## Run a campaign` paragraph: `(`/war … --afk`)` →
  `(`/war … --afk --ace`)`, matching the spec-§7 default and war-campaign SKILL.md.
- [ ] Grep-verify anchors resolve; full self-discovering gate → green. Commit —
  `docs(war-help,readme): anchor companion-skill links, real campaign flags (#422)`.

**requiresTest:** false — prose/link edits; grep-verify. **coven:** false. **deps:** none.
**target repo:** superproject.

### Task 2 — ledger CLI parity: conditional update + `--stopPoint`

**Files:** `skills/war-campaign/assets/campaign-ledger.mjs`,
`skills/war-campaign/assets/campaign-ledger.test.mjs`, `skills/war-campaign/SKILL.md`

**Plan slice:**
- [ ] **TDD first (RED), CLI path (#422 items 4+6).** New tests drive the CLI `record` case, not the
  exported `record()` (which is already correct): (a) `--stopPoint <token>` round-trips into the persisted
  entry; (b) omitted `--pr` leaves the existing `pr` value UNCHANGED — today the unconditional key +
  `hasOwnProperty` gating + `JSON.stringify` dropping `undefined` silently DELETES it. Unique tokens per
  assertion.
- [ ] **Fix the CLI `record` case (GREEN)** (currently at ~:303–316): build the update object
  CONDITIONALLY — include `status`/`branch`/`pr`/`sha`/`stopPoint` keys only when the flag was passed,
  matching core `record()`'s `hasOwnProperty` gating. Add `--stopPoint` using the file's existing
  `parseArgs` pattern (`--key value`, camelCase preserved — `args.stopPoint` needs no parser change).
- [ ] **§7.1 lifecycle example (survey-found crash, absorbed).** The record example lives in the §7.1
  lifecycle list (currently at ~:31), NOT §7.3 as the issue said — complete its flag set: add the missing
  `--plan <path>` (run verbatim it crashes at `path.resolve(undefined)`) and `--campaign <dir>` (explicit
  over its `.claude/campaigns/default` default), plus `--stopPoint`.
- [ ] Full self-discovering gate → green (the `.test.mjs` is already in the `node --test` glob — no gate
  edits). Commit — `fix(campaign-ledger): CLI record conditional update + --stopPoint parity (#422)`.

**requiresTest:** true. **deps:** none. **target repo:** superproject.

## Phase 2 — release

### Task 3 — patch bump, four canonical slots

**Files:** `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (×2 slots), `README.md`
`## Status` (REPLACE-in-place, no badge).

**Plan slice:**
- [ ] +patch over the land-time base across all four slots: `plugin.json` `version`, `marketplace.json`
  `metadata.version` + `plugins[0].version`, README `## Status`. Verify all four by hand. Status copy:
  *#422 nit sweep — campaign-ledger CLI at core-API parity (`--stopPoint`, conditional update), runnable
  lifecycle example, war-help deep links.*
- [ ] Full gate → green. Commit — `chore(release): #422 nit sweep`.

**requiresTest:** false. **deps:** Phase 1. **target repo:** superproject.

## Notes / conscious deviations (ratify in /red-team)

- **#422 items 5+7 already fixed pre-plan** (commit 6207d43, landed ca78c51 — the temp-break-proof
  tautology was replaced with an honest pointer-comment + a real unit test). Acknowledge in the close
  comment; do NOT re-fix.
- **Won't-fix item 3** (structure test guards 3 of 5 sections): the clean-handoff plan's war-strategy task
  owns that test and widens it there — fixing it here would collide with plan 3 of the series.
- **Won't-fix item 8** (interrupt test simulates crash weakly): honestly commented, covers the
  untouched-until-rename invariant; #422's own fix note says leave as-is.
- **Issue-body correction:** item 4's "mirror in §7.3" targets a nonexistent example — the only record
  example is §7.1; T2 fixes that one and completes its flag set (crash found by survey, not the issue).
- Close comment enumerates all nine dispositions: 1/2/4/6/9 fixed, 5/7 already fixed, 3/8 won't-fix.

## Open decisions (resolved by /red-team)

- **Roles link: replace or alongside?** RESOLVED: replace. design.md is already linked twice elsewhere in
  the same card — a third link is noise; README's lineage table is the fresher mapping.
- **Item 9: fix or intentional brevity?** RESOLVED: fix (`--afk --ace`). One word buys a true claim in a
  section that names flags.
- **Item 3: widen the structure test here?** RESOLVED: no. The clean-handoff plan restructures
  war-strategy SKILL.md and owns its test — widening belongs to the task that owns the file.
- **§7.1 example scope creep?** RESOLVED: absorb. `--plan` omission makes the documented command a
  guaranteed crash; the task already owns the file ([[dont-leave-work-on-the-table]]).
- **Version literal?** RESOLVED: none. +patch over land-time base; operator is the version authority.
