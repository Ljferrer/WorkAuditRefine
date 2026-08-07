# redteamRounds knob family — undrainable-duplicate ledger fix, loud CLI refusal, war-room discoverability, war-review telemetry anchoring

Issues: #1355, #1356, #1367, #1376, #1348

## 1. Context — the gap / problem

The p4/p5 `redteamRounds` / `run.redteamRoundLimit` knob family landed working code with a ring of
follow-up defects around it: one real correctness hole in the campaign queue, one silent-fabrication
CLI shape, a comment/prose lag family across the ledger's maintained home, two unanchored telemetry
rows, and a discoverability gap in the sole sanctioned config interview. All claims below were
re-verified against the live tree at `6fff2ee` (2026-08-06).

1. **Undrainable duplicate ledger entry** (verified: issue #1355 (2026-08-06), finding 3;
   confirmed live). `skills/war-campaign/SKILL.md` step-3 arms (b)/(c) mandate "re-entry is
   `/war-campaign add <plan>` after the regrill" — but at halt time only `stopPoint` and
   `redteamRounds` are stamped, so the entry is still `status: 'queued'`. In
   `skills/war-campaign/assets/campaign-ledger.mjs`, `sweep()` appends
   `ledger.plans.push(...newEntries.map((e) => makePlanEntry(e.plan, e.files)))` with **no dedupe**
   against existing entries; `record()` resolves its target via `ledger.plans.find((p) => p.plan
   === target)` (first match only) and `next()` via `plans.find((p) => p.status === 'queued')`. A
   re-add therefore appends a second entry for the same resolved path; every later `record` updates
   entry #1 while entry #2 stays `queued` forever; once entry #1 lands, `next()` returns entry #2
   forever, and `hooks/inject-campaign-state.sh`'s `is_active` (`.status != "landed"`) keeps the
   campaign "active" forever.
2. **Bare `--redteamRounds` fabricates `1`** (verified: issue #1367 (2026-08-06); also issue #1355
   finding 4; confirmed live). `campaign-ledger.mjs`'s hand-rolled `parseArgs` maps a valueless
   flag to boolean `true` (`const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] :
   true`), and the `record` case applies a bare `Number()`
   (`update.redteamRounds = Number(args.redteamRounds)`) — so
   `record … --redteamRounds --status landed` silently stamps `redteamRounds: 1`, a
   plausible-looking wrong round count; a non-numeric value yields `NaN`, which `JSON.stringify`
   serializes as `null`, indistinguishable from "never recorded". Both flow uncorrected into the
   wrap-up hardening row and `/war-review`'s per-plan rounds telemetry, each carrying an explicit
   never-fabricate-a-number invariant. The sibling `--pr` flag shares the same bare-`Number()`
   shape (verified: issue #1367 (2026-08-06); confirmed live). The repo has already ratified the
   stronger remedy for exactly this class: the three-way `typeof`-gated refusal in
   `skills/_shared/war-memory.mjs` (`cmdQuery`'s `--top-k`/`--budget`, `cmdTightenPlan`'s
   `--target`; #1059/#1145), and `resolveRoundInput` in `skills/red-team/assets/red-team-gate.mjs`
   already refuses non-`/^\d+$/` round inputs (both confirmed live). The lesson
   `cli-parseargs-valueless-flag-coerces-to-number-true-is-one` records the class.
3. **Sole-writer comment lag, two sites** (verified: issue #1355 (2026-08-06), findings 1–2;
   confirmed live). The top-of-file "Ledger shape:" comment in `campaign-ledger.mjs` still reads
   "recorded by the step-3 proceed arm", and the `---- redteamRounds (plan Task 5.1) ----` section
   banner in `skills/war-campaign/assets/campaign-ledger.test.mjs` still reads "recorded by
   /war-campaign's step-3 proceed arm" — both contradicting `skills/war-campaign/SKILL.md` step
   5's "every arm stamps it". The helper + its test are the ledger shape's maintained home
   (ADR 0046, stated in the helper's own header), so the canonical home currently states a false
   writer contract.
4. **Three more prose lags in `skills/war-campaign/SKILL.md`** (verified: issue #1355
   (2026-08-06), findings 5–7; all confirmed live): the wrap-up hardening-row parenthetical reads
   "(`n/a` when null — a pre-hardening or in-flight entry)" but a pre-hardening entry has the key
   *absent*, not null (the adjacent aggregateBackstops paragraph already says "null/absent"); arm
   (c)'s re-enumeration ("halt-and-hold, `stopPoint: redteam-route-upstream`, regrill command +
   agenda in CAMPAIGN-STATE.md, re-entry via `/war-campaign add`") omits the `--redteamRounds`
   stamp that step 5 asserts every arm performs; and the State & resume "Campaign ledger" bullet
   still enumerates "status/branch/PR/SHA/stop-point", lagging the entry shape by `backstops` and
   `redteamRounds`.
5. **`/war-review` rows unresolvable / unanchored** (verified: issue #1356 (2026-08-06), findings
   1+4 and 2+3 — two defects filed twice each; confirmed live). In `skills/war-review/SKILL.md`,
   the "red-team rounds — this plan" row names `$MAIN/.claude/campaigns/<id>/ledger.json` but no
   rule resolves `<id>`: the run-manifest MUST-carry contract (`skills/war/references/schemas.md`,
   § Run manifest) carries `runId`/`planPath`/`configProfile`/timestamps/`phases[]` — no campaign
   identity (confirmed live). A reviewer picking the *newest* campaign can report another plan's
   rounds while still "having a source". The sibling "trend across campaigns" row sweeps bare
   `docs/red-team/` and "prior campaign ledgers" without the `$MAIN` anchor the same polish commit
   applied one row above — the stale-worktree hazard the file's own §1 anchor discipline
   (`MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")`) exists to close.
6. **`run.redteamRoundLimit` operator-undiscoverable** (verified: issue #1376 (2026-08-06); issue
   #1348 (2026-08-06), finding 2; confirmed live). The knob is fully live in
   `skills/war/assets/war-config.mjs` — `DEFAULTS` `redteamRoundLimit: 3`, the economy preset's
   `redteamRoundLimit: 2` pin, and a `validate()` integer ≥ 1 guard — yet `skills/war-room/SKILL.md`
   step 2 ("reject anything else") whitelists only `run.roundLimit`, `run.afk`, and `run.ace`, and
   the step-1 economy blurb states `roundLimit: 2` without the matching `redteamRoundLimit` pin.
   `grep -c redteamRoundLimit skills/war-room/SKILL.md` = 0 today (snapshot 2026-08-06 at
   `6fff2ee`). Precedent is decisive: `agents.redteam.*` — likewise /red-team-only — has its own
   step-2 bullet. Nothing mechanical goes red, which is why the gap survived three audit rounds.
7. **Already fixed — no work**: issue #1348 finding 1 (schemas.md Run-config block missing
   `redteamRoundLimit`) landed in `0f12ae2` — the enumeration and comment run now carry the key
   with the suggested clause (verified: issue #1348 (2026-08-06); confirmed live at `6fff2ee`).
   The closing change for #1348 need only cite that commit for finding 1 and land finding 2.

## 2. Pivotal constraints

- **First-match semantics stay.** `record()`'s and `next()`'s `find` are load-bearing for queue
  order (ADR 0011 stack-and-plow lands plans in order); the dedupe belongs at the *append* site
  (`sweep()`), never as a rewrite of the read path.
- **`parseArgs` itself is untouched.** The lesson's durable rule places the fix at the numeric
  flag's consumer boundary — copy the ratified three-way `typeof`-gated refusal, do not redesign
  the frozen parser shape (the war-memory precedent explicitly kept `parseArgv` frozen).
- **Refusal must write nothing.** The war-memory precedent (#1145) puts the guard above the write
  path so a refused invocation leaves the ledger byte-identical; the same posture applies here —
  refuse before `record()` is called.
- **A structure test pins `skills/war-campaign/SKILL.md` tokens.** The step-3 triage test in
  `campaign-ledger.test.mjs` asserts `--redteamRounds`, `routeUpstream: true`,
  `stopPoint: redteam-route-upstream`, and `## Route upstream` present, and the retired
  one-sentence step-3 wording absent. Every prose edit here must keep those tokens; the arm-(c)
  edit *adds* a `--redteamRounds` occurrence, which the presence regex tolerates.
- **The helper + its test are the ledger shape's maintained home** (ADR 0046) — the shape-comment
  and banner corrections are canonical-home fixes, and the State & resume bullet may either
  enumerate fully or defer to that home, but must stop lagging.
- **The run manifest gains no campaign field.** Widening the MUST-carry contract in
  `skills/war/references/schemas.md` is out of scope; the `/war-review` selection rule must be
  derivable from ledger content alone. `makePlanEntry` writes both `slug`
  (basename sans extension) and `plan` (machine-local resolved absolute path); the manifest's
  `planPath` is repo-relative — so slug equality is the robust cross-checkout match, with resolved
  paths only as a tie-breaker.
- **The honesty invariant binds every telemetry resolution**: unresolvable or ambiguous → `n/a`,
  stated — never the newest campaign, never a guess.
- **The gate arithmetic backs the whitelist prose.** `routeUpstream()` in
  `skills/red-team/assets/red-team-gate.mjs` returns true when `rounds >= roundLimit` with an
  unadjudicated open finding — the step-2 bullet's one-line consequence clause must match that
  (route back upstream at the limit), not invent stronger behavior.
- **Zero engine changes.** `workflow-template.js`, the hooks' guard logic, and
  `war-config.mjs` are untouched; no version bump is implied by this spec.
- **Ordering: the `verdict-adjudication-integrity` sibling group lands first** — it shares
  `skills/war-campaign/SKILL.md`, so this group's plan must carry a roadmap `dependsOn` edge onto
  that group's plan (the survey manifest carries the machine hint).

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Duplicate-entry remedy: prose-only, `sweep()` guard, or both? | **Both.** Prose-only leaves the helper footgun for any future caller; guard-only leaves the SKILL.md mandating a pointless `add`. Qualify the re-entry sentence in arms (b)/(c) (a bare `/war-campaign resume` re-picks the still-queued entry; `add` re-drops the plan and `sweep` is idempotent for it) AND add the idempotence guard to `sweep()`. |
| `sweep()` guard shape | Skip appending any drop whose resolved plan path already has a **non-landed** ledger entry; a landed entry does not block (a genuine re-run of a landed plan is a legitimate new queue item). |
| Skipped drop's inbox file | Consumed (deleted) like any swept drop, and reported under an **additive** `skipped: [{ plan, reason }]` key in `sweep()`'s return — existing consumers of `{ added, overlaps }` are unaffected. [assumed: default — if wrong: leave the drop in the inbox and it re-reports every sweep, or drop the `skipped` key and the skip is silent] |
| Refresh the existing entry's `files` on a skipped re-add? | **Yes** — the regrill that precedes re-entry may have changed the plan's `Files:` footprints, and later contention checks read the ledger's copy; the skip arm re-stamps `files` from the fresh extraction and reports the entry under `skipped` with `reason: 'refreshed'`. [assumed: extension beyond the auditor's minimal skip — if wrong: skip without refreshing and footprints go stale after a regrill] |
| CLI validation shape for `--redteamRounds` | The ratified three-way `typeof` gate fused with the round-shape check: refuse unless `typeof args.redteamRounds === 'string'` **and** `/^\d+$/.test(...)` — covering bare-flag `true`, non-numeric, and negative/decimal in one refusal; exit non-zero with a message naming the flag and the offending token (the `resolveRoundInput` / war-memory posture). |
| Harden the sibling `--pr` the same way? | **Yes**, same diff — same class, same file, already named by #1367; refuse a non-`/^\d+$/` `--pr`. [assumed: extension — if wrong: fix only the flag the issues name and leave `--pr` on bare `Number()`] |
| Shape comment + test banner wording | Both sites: "recorded by the step-3 proceed arm" → "recorded by every arm of /war-campaign's step-3 triage" (the auditor's verbatim suggestion, matching step 5). |
| Wrap-up hardening-row parenthetical | "(`n/a` when null" → "(`n/a` when null or absent", matching the aggregateBackstops paragraph's wording. |
| Arm (c) re-enumeration | Add the stamp explicitly: "…halt-and-hold, `stopPoint: redteam-route-upstream`, stamping `--redteamRounds <n>` in the same `record` call, regrill command + agenda in CAMPAIGN-STATE.md…". |
| State & resume ledger bullet | Extend to "…status/branch/PR/SHA/stop-point/backstops/red-team rounds" and point at the helper header as the shape's maintained home. |
| `/war-review` row-1 selection rule | Name it in the cell: the ledger under `$MAIN/.claude/campaigns/*/ledger.json` whose `plans[].slug` equals the manifest `planPath`'s basename sans extension — **never the newest campaign** (no manifest field records the campaign); no match → that source is absent (`n/a`). |
| Multiple campaigns match the slug | Disambiguate by `plans[].plan` equal to the `$MAIN`-resolved manifest `planPath`; still ambiguous → `n/a` with the ambiguity stated. [assumed: default — if wrong: any multi-match renders `n/a` directly] |
| Row-2 sweep anchoring | Write the swept roots as `$MAIN/docs/red-team/` and `$MAIN/.claude/campaigns/*/ledger.json`, matching row 1's anchored siblings. |
| war-room step-2 bullet | Extend the run bullet: `run.redteamRoundLimit` (integer ≥ 1; default 3, economy preset pins 2) — /red-team's cumulative grill-round budget; at the limit with an unadjudicated root finding open, the gate routes the plan back upstream. |
| war-room economy blurb | `roundLimit: 2` gains the sibling pin in the same clause: `roundLimit: 2`, `redteamRoundLimit: 2`. |
| #1348 finding 1 | **No work** — landed in `0f12ae2`; the issue-close comment cites it. |

## 4. Mechanics

### `skills/war-campaign/assets/campaign-ledger.mjs`

- **Shape comment**: in the `redteamRounds` clause of the top-of-file "Ledger shape:" comment,
  replace "recorded by the step-3 proceed arm" with "recorded by every arm of /war-campaign's
  step-3 triage".
- **`sweep()` idempotence guard**: before the append, partition `newEntries` on whether
  `ledger.plans` already holds an entry with the same resolved `plan` path and
  `status !== 'landed'`. Duplicates are not appended; their `files` are re-stamped onto the
  existing entry; the drop file is consumed; each is reported under the additive
  `skipped: [{ plan, reason }]` return key. The contention check (`intersectFootprints`) runs
  only over genuinely-new entries, so a refreshed footprint never self-collides with its own
  prior copy.
- **CLI refusal**: in `main()`'s `case 'record'`, replace the bare
  `Number(args.redteamRounds)` with the fused guard — when the flag is present but
  `typeof args.redteamRounds !== 'string' || !/^\d+$/.test(args.redteamRounds)`, write a stderr
  line naming `--redteamRounds` and the offending token (rendering the bare-flag `true`
  explicitly) and `process.exit(1)` **before** any `record()` call. Apply the same guard shape to
  `--pr` one line above. The happy path still stamps `Number(...)`.

### `skills/war-campaign/assets/campaign-ledger.test.mjs`

- **Banner**: same one-clause correction as the shape comment ("every arm of /war-campaign's
  step-3 triage").
- **New tests**: (a) sweep-dedupe — add a plan, halt-state it (`status` still `queued`), re-drop
  the same plan, sweep, assert one entry, refreshed `files`, and the `skipped` report; a `landed`
  entry re-drop still appends. (b) CLI refusal — `record … --redteamRounds` (bare, trailing and
  mid-argv), `--redteamRounds abc`, each asserting non-zero exit, a message naming the flag, and a
  byte-identical ledger afterward; sibling cases for `--pr`. The existing happy-path tests
  (`'4'` → `4`; omitted flag preserves) stay green unmodified.

### `skills/war-campaign/SKILL.md`

- **Arm (b)**: qualify the re-entry sentence — re-entry is `/war-campaign add <plan>` after the
  regrill (the entry is still queued; `sweep` refreshes it idempotently, never duplicating —
  a bare `/war-campaign resume` equally re-picks it).
- **Arm (c)**: insert the explicit stamp into the re-enumeration (§3 wording).
- **Wrap-up hardening row**: "null" → "null or absent".
- **State & resume ledger bullet**: extend the field enumeration and name the helper header as the
  shape's maintained home.
- After these edits, run the retired-wording sweep of §10 criterion 3 **and** its mandatory
  manual survey.

### `skills/war-review/SKILL.md`

- **Row "red-team rounds — this plan"**: replace `<id>` with the slug-match selection rule
  (§3 rows 10–11), keeping the row's existing report-header-wins and both-absent → `n/a` clauses.
- **Row "red-team rounds per plan — trend across campaigns"**: anchor both swept roots with
  `$MAIN`.

### `skills/war-room/SKILL.md`

- **Step 2**: append the `run.redteamRoundLimit` clause to the run bullet (§3 wording).
- **Step 1 economy blurb**: add the `redteamRoundLimit: 2` pin beside `roundLimit: 2`.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war-campaign/assets/campaign-ledger.mjs` | Shape-comment clause; `sweep()` idempotence guard + `skipped` return key; CLI refusal for `--redteamRounds` and `--pr` |
| `skills/war-campaign/assets/campaign-ledger.test.mjs` | Banner clause; sweep-dedupe tests; CLI refusal tests |
| `skills/war-campaign/SKILL.md` | Arm (b) re-entry qualification; arm (c) stamp; wrap-up "null or absent"; State & resume bullet |
| `skills/war-review/SKILL.md` | Row-1 selection rule; row-2 `$MAIN` anchors |
| `skills/war-room/SKILL.md` | Step-2 whitelist clause; economy blurb pin |

No engine, hook, or `war-config.mjs` changes. `skills/war/references/schemas.md` is deliberately
untouched (#1348 finding 1 already landed).

## 6. New domain terms (CONTEXT.md)

None required. "Idempotent re-add" is used descriptively, not as a glossary term.

## 7. Recommended ADRs

None. Governing doctrine exists: ADR 0011 (stack-and-plow ordering — why first-match queue
semantics stay), ADR 0046 (the helper + test as the ledger shape's maintained home), and the
ratified numeric-flag refusal precedent (#1059/#1145) recorded in the
`cli-parseargs-valueless-flag-coerces-to-number-true-is-one` lesson.

## 8. Open risks / implementation notes

- **Sibling-group ordering (for /war-machine)**: the `verdict-adjudication-integrity` group also
  touches `skills/war-campaign/SKILL.md`; this group's plan carries a roadmap `dependsOn` edge
  onto that group's plan and lands after it. The survey manifest carries the machine hint.
- **Same-file carving**: all three `campaign-ledger.mjs` changes (comment, guard, refusal) are one
  task with its test file; all four `skills/war-campaign/SKILL.md` prose edits are one task —
  same file → same task, per the decomposition rule. `skills/war-review/SKILL.md` and
  `skills/war-room/SKILL.md` are each a small independent task; all tasks are file-disjoint and
  can share a phase.
- **`sweep()` return-shape widening is additive.** Existing tests destructure `{ added, overlaps }`;
  the new `skipped` key must not alter either. The skill's sweep-reporting prose in
  `skills/war-campaign/SKILL.md` (arm (b)'s qualification) is the only doc surface that needs to
  mention the skip behavior.
- **Refusal is a behavior change for garbage inputs only.** Any operator or script currently
  passing a bare `--redteamRounds` or non-numeric `--pr` was already recording wrong data; the
  refusal converts silent corruption into a loud exit. No sanctioned invocation in the repo's
  skill prose uses either flag without a value (confirmed by the §10 criterion-3 sweep's scope).
- **The structure test's presence pins** (`--redteamRounds`, `stopPoint: redteam-route-upstream`,
  `routeUpstream: true`, `## Route upstream`) tolerate every edit here; the retired-wording
  absence pin (`unresolvable → halt-and-hold`) is untouched by the arm-(b)/(c) rewording — keep
  both true at land.
- **Anchor discipline**: every edit is specified by named construct (arm letter, row name, bullet
  name, function name) — never by line number; the measured zero-count in §1 is a dated snapshot
  at `6fff2ee`.

## 9. Non-goals / deferred

- **No `parseArgs` redesign** — the frozen parser shape stays; validation lives at each numeric
  flag's consumer boundary (the lesson's rule).
- **No run-manifest schema widening** — a `campaignId` MUST-carry field would be the deeper fix
  for `/war-review`'s selection, but touches `skills/war/references/schemas.md` and `/war` Lead
  prose owned by other groups; the derived slug-match rule needs no new producer behavior.
- **No `record()`/`next()` dedupe or ledger migration** — first-match semantics are load-bearing;
  existing ledgers with an already-created duplicate are repaired by hand (delete the stray
  entry), not by code that rewrites ledgers on read.
- **No `schemas.md` edit** — #1348 finding 1 landed in `0f12ae2`; the issue-close comment cites
  it.
- **No wrap-up/hardening-row renderer change** — the rows are agent prose reading the ledger; only
  their SKILL.md wording is corrected.

## 10. Validation criteria

1. WHEN a drop is swept for a plan whose resolved path already has a non-`landed` ledger entry
   THE `sweep()` helper SHALL append no second entry, refresh the existing entry's `files`, and
   report it under `skipped` · check: `node --test
   skills/war-campaign/assets/campaign-ledger.test.mjs` (new sweep-dedupe tests, shown RED against
   the unguarded `sweep()` in a scratch copy, then green).
2. WHEN a drop is swept for a plan whose only ledger entry is `landed` THE `sweep()` helper SHALL
   append a fresh queued entry (the guard blocks non-landed duplicates only) · check: the paired
   new test in the same suite.
3. WHEN `campaign-ledger.mjs record` receives a bare `--redteamRounds`, a non-numeric
   `--redteamRounds`, or the same shapes on `--pr` THE CLI SHALL exit non-zero naming the flag and
   the offending token, leaving the ledger byte-identical · check: the new refusal tests; scratch
   mutation proof — reverting the guard flips them RED via a silently-stamped `1`.
4. WHEN the retired sole-writer wording is swept THE string `proceed arm` SHALL be absent from
   `skills/war-campaign/assets/` · check: `grep -rn 'proceed arm'
   skills/war-campaign/assets/` returns zero hits. **Grep is the floor**: after the grep,
   hand-scan `campaign-ledger.mjs`'s remaining comments and every `campaign-ledger.test.mjs` test
   title/banner in the redteamRounds and CLI sections for any other restatement of a sole-writer
   or single-arm claim, and list each straggler as a survey-derived correction.
5. WHEN arm (c) is read THE re-enumeration SHALL carry the `--redteamRounds` stamp · check:
   `grep -n 'redteamRounds' skills/war-campaign/SKILL.md` shows an occurrence on the arm-(c)
   line (three step-3 occurrences total: arms (a), (b), (c)).
6. WHEN the wrap-up hardening-row parenthetical is read THE prose SHALL say "null or absent" ·
   check: `grep -n 'when null or absent' skills/war-campaign/SKILL.md` hits, and
   `grep -nE 'when null [—-]' skills/war-campaign/SKILL.md` returns zero hits. **Grep is the
   floor**: hand-scan the wrap-up and State & resume sections for any other null-only phrasing of
   an absent-tolerant field and list stragglers as survey-derived corrections.
7. WHEN the State & resume ledger bullet is read THE enumeration SHALL include backstops and
   red-team rounds · check: `grep -n 'stop-point/backstops/red-team rounds'
   skills/war-campaign/SKILL.md`.
8. WHEN `/war-room` step 2 and the economy blurb are read THE `run.redteamRoundLimit` knob SHALL
   appear in both · check: `grep -c redteamRoundLimit skills/war-room/SKILL.md` ≥ 2 (0 at the
   `6fff2ee` base), with one hit in the step-1 economy line and one in the step-2 run bullet.
9. WHEN `/war-review`'s "red-team rounds — this plan" row is read THE cell SHALL carry the
   slug-match selection rule and the never-the-newest clause · check: `grep -n 'never the newest'
   skills/war-review/SKILL.md` and `grep -n 'plans\[\].slug' skills/war-review/SKILL.md`.
10. WHEN the trend row's sweep is read THE swept roots SHALL be `$MAIN`-anchored · check:
    `grep -n 'MAIN/docs/red-team/' skills/war-review/SKILL.md` returns two hits (rows 1 and 2)
    and the trend row names `$MAIN/.claude/campaigns/*/ledger.json`. **Grep is the floor**:
    hand-scan the full telemetry tables for any remaining bare repo-relative source path and list
    each as a survey-derived correction.
11. WHEN the full suite runs at the tip THE tests SHALL pass — including the step-3 structure
    test's presence and absence pins · check: `node --test 'skills/**/*.test.mjs'` and
    `bash hooks/inject-campaign-state.test.sh` (the `is_active` gate's own suite — the sweep
    guard must not change its all-landed-stays-silent behavior).
12. WHEN the closing change lands THE issue-close comments SHALL cite each finding's fix commit —
    including `0f12ae2` for #1348 finding 1 · check: `gh issue view <N> --comments` for each of
    #1355, #1356, #1367, #1376, #1348.
