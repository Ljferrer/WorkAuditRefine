# redteamRounds knob family — sweep idempotence for the campaign queue, loud numeric-flag refusal, triage-prose truth, war-review anchoring, war-room discoverability

Converted by `/war-machine` from [docs/specs/2026-08-06-redteam-rounds-config-telemetry-design.md](../specs/2026-08-06-redteam-rounds-config-telemetry-design.md)
(Part 1 is its decision digest; every spec assumption is carried into the ledger or retired with a stated
reason; spec citations are provenance-only — this plan's Part 1 alone carries every decision, constraint,
and mechanic the run needs). Issues addressed: #1355, #1356, #1367, #1376, #1348. Issue → task mapping:
#1355 findings 1/2/4 → Task 1.1 (shape comment, test banner, CLI refusal), finding 3 → Task 1.1
(the `sweep()` idempotence guard) **and** Task 1.2 (the arm-(b) re-entry qualification — the spec's
both-remedies resolution), findings 5/6/7 → Task 1.2 (wrap-up parenthetical, arm-(c) stamp,
State & resume bullet); #1367 → Task 1.1 (the `--redteamRounds` refusal + the sibling `--pr`, A3);
#1356 findings 1+4 → Task 1.3 (row-1 selection rule), findings 2+3 → Task 1.3 (row-2 anchors);
#1376 and #1348 finding 2 → Task 1.4; #1348 finding 1 is already fixed at the live tip (landed in
`0f12ae2` — citation-only closure at the checkpoint). `/war` files its own epic + task issues regardless
(war-execution-must-file-issues); closing the five source issues is Lead checkpoint work at phase close
(war-checkpoint-must-close-task-issues), never assumed from the epic close.

**Stacked base — the honest construct analysis.** The source spec declares this group lands after the
`verdict-adjudication-integrity` sibling (plan 5), wording the coupling as "it shares
`skills/war-campaign/SKILL.md`". That wording is **wrong as stated and right in substance** (verified:
plan 5's committed `- Files:` lists, read at conversion 2026-08-11): plan 5 **never edits**
`skills/war-campaign/SKILL.md` — its Task 1.6 lands the five-surface verdict-enumeration guard (the
extended `verdict-enumeration drift guard` block in `skills/red-team/assets/workflow-scaffold.test.mjs`),
whose D9 surface **guard-reads** that file: it slices the `**(a) Proceed**` enumeration segment (after
the marker, up to the first following `(`) and asserts the three-arm partition — exactly one
`**(b) Route upstream**` line carrying `` `BLOCKED` `` as a code span, exactly one
``**(c) Persistent `INCOMPLETE`**`` line carrying `` `INCOMPLETE` ``. The real coupling is therefore
**guard-compatibility, not content**: this plan's Task 1.2 edits bytes on exactly those two partition
lines, and the edits carry an explicit duty to keep the landed guard green (constraint 8). The
`dependsOn` edge onto plan 5 **stays on the roadmap** — it encodes land-after-plan-5 with a guard-green
witness (ADR 0011 spine order; landing first would falsify the letter of plan 5's A7
"guard-read surfaces unchanged at its base" and re-litigate its Context-5 verifications) — but it is
**not** a content dependency: nothing here consumes plan 5's constructs, so the standalone fallback is
**plain re-verify** (run the scaffold suite after the edit — green whether the guard exists yet or not),
never halt-on-missing-witness (Note 1). Snapshot base for every measured claim below: the repo tip at
`6fff2ee` (2026-08-06); no committed 2026-08-06 plan touches any file this plan edits except the three
release-slot files (the sanctioned stacked release overlap — Context 7).

## Context — the gap / problem

The p4/p5 `redteamRounds` / `run.redteamRoundLimit` knob family landed working code ringed by follow-up
defects: one real correctness hole in the campaign queue, one silent-fabrication CLI shape, a
comment/prose lag family across the ledger's maintained home, two unanchored telemetry rows, and a
discoverability gap in the sole sanctioned config interview. Every claim re-verified live at `6fff2ee`.

1. **Undrainable duplicate ledger entry** (verified: issue #1355 (2026-08-06), finding 3; re-verified
   at `6fff2ee`). `skills/war-campaign/SKILL.md` step-3 arms (b)/(c) mandate "re-entry is
   `/war-campaign add <plan>` after the regrill" — but at halt time only `stopPoint` and
   `redteamRounds` are stamped, so the entry is still `status: 'queued'`. In
   `skills/war-campaign/assets/campaign-ledger.mjs`, `sweep()` appends
   `ledger.plans.push(...newEntries.map((e) => makePlanEntry(e.plan, e.files)))` with **no dedupe**
   against existing entries; `record()` resolves its target via
   `ledger.plans.find((p) => p.plan === target)` (first match only) and `next()` via
   `plans.find((p) => p.status === 'queued')`. A re-add appends a second entry for the same resolved
   path; every later `record` updates entry #1 while entry #2 stays `queued` forever; once entry #1
   lands, `next()` returns entry #2 forever, and `hooks/inject-campaign-state.sh`'s `is_active`
   (`.status != "landed"`) keeps the campaign "active" forever. Conversion re-trace confirms one more
   arm of the same class: the dedupe-less append also duplicates on a **double drop of the same plan
   within one sweep** (both drops are checked against the pre-sweep ledger, both classify fresh) — the
   guard must dedupe sequentially, against the ledger plus the entries accepted earlier in the same
   sweep (D2, Note 6).
2. **Bare `--redteamRounds` fabricates `1`** (verified: issue #1367 (2026-08-06); issue #1355
   finding 4; re-verified at `6fff2ee`). `campaign-ledger.mjs`'s hand-rolled `parseArgs` maps a
   valueless flag to boolean `true` (`const val = argv[i + 1] && !argv[i + 1].startsWith('--') ?
   argv[++i] : true`), and `main()`'s `case 'record'` applies a bare `Number()`
   (`update.redteamRounds = Number(args.redteamRounds)`) — so `record … --redteamRounds --status
   landed` silently stamps `redteamRounds: 1` (`Number(true) === 1`), a plausible-looking wrong round
   count; a non-numeric value yields `NaN`, which `JSON.stringify` serializes as `null`,
   indistinguishable from "never recorded". Both flow uncorrected into the wrap-up hardening row and
   `/war-review`'s per-plan rounds telemetry, each carrying an explicit never-fabricate-a-number
   invariant. The sibling `--pr` shares the bare-`Number()` shape one line above (verified: issue
   #1367 (2026-08-06); re-verified at `6fff2ee`). The ratified stronger remedy exists in-repo: the
   three-way `typeof`-gated refusal in `skills/_shared/war-memory.mjs` (`cmdQuery`'s
   `--top-k`/`--budget`, `cmdTightenPlan`'s `--target`; #1059/#1145 — the `typeof … === 'string'`
   test is what makes the bare-flag `true` refuse), and `resolveRoundInput` in
   `skills/red-team/assets/red-team-gate.mjs` already refuses non-`/^\d+$/` round inputs (both
   re-verified at `6fff2ee`). The lesson
   `docs/learnings/archive/cli-parseargs-valueless-flag-coerces-to-number-true-is-one.md` records the class
   and names this exact instance — stamped RESOLVED by the fixing task (A6, the batch's
   fold-into-fixing-task precedent).
3. **Sole-writer comment lag — three sites, not two** (verified: issue #1355 (2026-08-06), findings
   1–2; conversion sweep at `6fff2ee`). The top-of-file "Ledger shape:" comment in
   `campaign-ledger.mjs` still reads "recorded by the step-3 proceed arm", and the
   `---- redteamRounds (plan Task 5.1) ----` section banner in
   `skills/war-campaign/assets/campaign-ledger.test.mjs` still reads "recorded by /war-campaign's
   step-3 proceed arm" — both contradicting `skills/war-campaign/SKILL.md` step 5's "every arm stamps
   it". The helper + its test are the ledger shape's maintained home (ADR 0046, stated in the helper's
   own header), so the canonical home currently states a false writer contract. **Survey-derived third
   site** (conversion grep `grep -rn 'proceed arm' skills/war-campaign/assets/` at `6fff2ee`: three
   hits, not the spec's two): the step-3 structure test's presence-pin comment
   `// proceed arm: commit + record the round count` inside `campaign-ledger.test.mjs` (the
   `step-3 three-arm triage` block). The retirement sweep (End state 4) demands zero hits, so the
   third site is folded into Task 1.1 with sanctioned replacement wording — the
   backstop-retirement-grep lesson: a zero-hit mandate must name every survivor it retires or the
   sweep false-reds on correctly-landed work.
4. **Three more prose lags in `skills/war-campaign/SKILL.md`** (verified: issue #1355 (2026-08-06),
   findings 5–7; each re-verified at `6fff2ee`): the wrap-up hardening-row parenthetical reads
   "(`n/a` when null — a pre-hardening or in-flight entry)" but a pre-hardening entry has the key
   *absent*, not null (the adjacent aggregateBackstops paragraph already says "null/absent"); arm
   (c)'s re-enumeration ("halt-and-hold, `stopPoint: redteam-route-upstream`, regrill command + agenda
   in CAMPAIGN-STATE.md, re-entry via `/war-campaign add`") omits the `--redteamRounds` stamp that
   step 5 asserts every arm performs (step-3 `redteamRounds` occurrences at `6fff2ee`: arms (a) and
   (b) only — the arm-(c) edit makes three); and the State & resume "Campaign ledger" bullet still
   enumerates "status/branch/PR/SHA/stop-point", lagging the entry shape by `backstops` and
   `redteamRounds`.
5. **`/war-review` rows unresolvable / unanchored** (verified: issue #1356 (2026-08-06), findings 1+4
   and 2+3 — two defects filed twice each; re-verified at `6fff2ee`). In `skills/war-review/SKILL.md`
   §3's plan-scoped telemetry table, the "red-team rounds — this plan" row names
   `$MAIN/.claude/campaigns/<id>/ledger.json` but no rule resolves `<id>`: the run-manifest MUST-carry
   contract (`skills/war/references/schemas.md`, § Run manifest) carries
   `runId`/`planPath`/`configProfile`/timestamps/`phases[]` — no campaign identity (re-verified at
   `6fff2ee`). A reviewer picking the *newest* campaign can report another plan's rounds while still
   "having a source". The sibling "red-team rounds per plan — trend across campaigns" row sweeps bare
   `docs/red-team/` and "prior campaign ledgers" without the `$MAIN` anchor the same polish commit
   applied one row above — the stale-worktree hazard the file's own §1 anchor discipline
   (`MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")`, re-verified at
   `6fff2ee`) exists to close. Ledger-side match keys re-verified at `6fff2ee`: `makePlanEntry` writes
   both `slug` (basename sans extension) and `plan` (machine-local resolved absolute path); the
   manifest's `planPath` is repo-relative — slug equality is the robust cross-checkout match, resolved
   paths the tie-breaker only.
6. **`run.redteamRoundLimit` operator-undiscoverable** (verified: issue #1376 (2026-08-06); issue
   #1348 (2026-08-06), finding 2; re-verified at `6fff2ee`). The knob is fully live in
   `skills/war/assets/war-config.mjs` — `DEFAULTS` `redteamRoundLimit: 3`, the economy preset's
   `redteamRoundLimit: 2` pin, and a `validate()` integer ≥ 1 guard — yet `skills/war-room/SKILL.md`
   step 2 ("reject anything else") whitelists only `run.roundLimit`, `run.afk`, and `run.ace`, and the
   step-1 economy blurb states `roundLimit: 2` without the matching pin.
   `grep -c redteamRoundLimit skills/war-room/SKILL.md` = 0 (re-measured at `6fff2ee`, dated
   snapshot). Precedent is decisive: `agents.redteam.*` — likewise /red-team-only — has its own
   step-2 bullet. Nothing mechanical goes red, which is why the gap survived three audit rounds. The
   gate arithmetic the new bullet must state truthfully (re-verified at `6fff2ee`): `routeUpstream()`
   in `skills/red-team/assets/red-team-gate.mjs` returns true when `rounds >= roundLimit` with an
   unadjudicated open finding **or** from `rounds >= 2` with an unadjudicated `needsDecision`
   finding (chronic under-specification routes to the interview earlier than the general limit), and
   never while coverage is incomplete (the `isIncomplete` short-circuit). The lesson
   `docs/learnings/archive/new-run-config-knob-needs-war-room-whitelist-touch.md` records this exact gap —
   stamped RESOLVED by the fixing task (A6).
7. **Already fixed — no work**: issue #1348 finding 1 (schemas.md Run-config block missing
   `redteamRoundLimit`) landed in `0f12ae2` — the `run: { … }` enumeration and its comment run carry
   the key with the suggested clause (re-verified at `6fff2ee`, `skills/war/references/schemas.md`
   § Run config). The closing change for #1348 need only cite that commit for finding 1 and land
   finding 2. **Footprint census** (verified: the six committed 2026-08-06 plans' `- Files:` lines,
   read at conversion): no predecessor or sibling committed plan touches
   `skills/war-campaign/assets/*`, `skills/war-campaign/SKILL.md`, `skills/war-review/SKILL.md`,
   `skills/war-room/SKILL.md`, or this plan's two lesson files; the only shared files are the three
   release slots (every plan's trailing phase — the sanctioned stacked pattern). Sweep-consumer
   safety, re-verified at `6fff2ee`: no existing test `deepEqual`s `sweep()`'s whole return object
   (all assert `result.overlaps[0].paths` or ledger state), so the additive `skipped` key breaks
   nothing. **Downstream spine**: the sibling `handoff-schemas-contract` spec also edits
   `skills/war-review/SKILL.md` (§4 signal class + §3 wall-clock row — disjoint constructs from this
   plan's plan-scoped telemetry rows; verified in its spec text at `6fff2ee`) — a roadmap contention
   row, no dependency either way (Note 4).

## Pivotal constraints

1. **First-match semantics stay.** `record()`'s and `next()`'s `find` are load-bearing for queue order
   (ADR 0011 stack-and-plow lands plans in order); the dedupe belongs at the *append* site
   (`sweep()`), never as a rewrite of the read path.
2. **`parseArgs` itself is untouched.** The lesson's durable rule places the fix at each numeric
   flag's consumer boundary — copy the ratified three-way `typeof`-gated refusal; do not redesign the
   frozen parser shape (the war-memory precedent explicitly kept `parseArgv` frozen).
3. **Refusal must write nothing.** The war-memory precedent (#1145) puts the guard above the write
   path so a refused invocation leaves the ledger byte-identical — refuse in `main()`'s
   `case 'record'` **before** `record()` is called.
4. **The step-3 structure test pins `skills/war-campaign/SKILL.md` tokens.** The
   `step-3 three-arm triage` test in `campaign-ledger.test.mjs` asserts `--redteamRounds`,
   `routeUpstream: true`, `stopPoint: redteam-route-upstream`, and `## Route upstream` present, and
   the retired one-sentence step-3 wording (`unresolvable → halt-and-hold`, case-insensitive) absent.
   Every Task 1.2 prose edit keeps those tokens; the arm-(c) edit *adds* a `--redteamRounds`
   occurrence, which the presence regex tolerates.
5. **The helper + its test are the ledger shape's maintained home** (ADR 0046, the helper's own
   header) — the shape-comment and banner corrections are canonical-home fixes; the State & resume
   bullet may enumerate fully *and* defer to that home, but must stop lagging.
6. **The run manifest gains no campaign field.** Widening the MUST-carry contract in
   `skills/war/references/schemas.md` is out of scope; the `/war-review` selection rule must be
   derivable from ledger content alone (slug equality, resolved-path tie-breaker — Context 5).
7. **The honesty invariant binds every telemetry resolution**: unresolvable or ambiguous → `n/a`,
   stated — never the newest campaign, never a guess.
8. **Guard-compatibility duty (binding, named).** Plan 5's landed five-surface verdict-enumeration
   guard (`workflow-scaffold.test.mjs`, End-state-9 block; its D9 war-campaign surface) asserts about
   the exact lines Task 1.2 edits. The edits MUST preserve: the `**(a) Proceed**` line and its
   enumeration segment byte-untouched; exactly one `**(b) Route upstream**` line, still carrying
   `` `BLOCKED` `` as a code span; exactly one ``**(c) Persistent `INCOMPLETE`**`` line, still
   carrying `` `INCOMPLETE` ``; no new occurrence of any arm marker anywhere in the file. Each arm
   edit stays on its arm's single physical line (the file's long-line house style). Proof duty: run
   `node --test skills/red-team/assets/workflow-scaffold.test.mjs` after the edit (End state 11).
9. **The gate arithmetic backs the whitelist prose.** The step-2 bullet's consequence clause must
   match `routeUpstream()`'s full predicate — route back upstream at the limit with an unadjudicated
   open finding, or from round 2 with an unadjudicated needs-decision finding; never while coverage
   is incomplete — never invent stronger behavior (Context 6).
10. **`sweep()`'s return widening is additive.** Existing consumers destructure
    `{ added, overlaps }`; the new `skipped` key must not alter either, and both return sites (the
    empty-inbox early return and the main path) carry it for shape consistency (D3, Note 6).
11. **Zero engine changes.** `workflow-template.js`, the hooks' guard logic, and `war-config.mjs` are
    untouched. (The trailing release phase is batch doctrine, not an engine change — Note 3.)
12. **Anchor by named construct, never line number** — every anchor here is an arm letter, row name,
    bullet name, comment banner, or function name; measured counts are dated snapshots at `6fff2ee`.
13. **Platform law (BSD grep):** any check grep whose pattern contains `$`, `"`, a backslash, or
    regex-hostile brackets uses `grep -F` or correct escaping — the `plans[].slug` and
    `$MAIN/...` checks below are `-F` (the execution-proven false-red class from plan 1's
    conversion note).

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | Duplicate-entry remedy: prose-only, `sweep()` guard, or both? | **Both.** Prose-only leaves the helper footgun for any future caller; guard-only leaves the SKILL.md mandating a pointless `add`. Qualify the re-entry sentence in arms (b)/(c) (a bare `/war-campaign resume` re-picks the still-queued entry; `add` re-drops the plan and `sweep` is idempotent for it) AND add the idempotence guard to `sweep()` | spec §3; (verified: issue #1355 (2026-08-06), finding 3) |
| D2 | `sweep()` guard shape | Skip appending any drop whose resolved plan path already has a **non-landed** entry in `ledger.plans` **or** among the fresh entries accepted earlier in the same sweep (the double-drop arm, Context 1 — sequential dedupe); a landed entry does not block (a genuine re-run of a landed plan is a legitimate new queue item) | spec §3 + conversion extension (Note 6), logged for /red-team |
| D3 | Skipped drop's inbox file + report | Consumed (deleted) like any swept drop, and reported under an **additive** `skipped: [{ plan, reason }]` key in `sweep()`'s return; both return sites carry the key (`skipped: []` when none) so the shape is consistent | spec §3 (carried [assumed] row → A1) |
| D4 | Refresh the existing entry's `files` on a skipped re-add? | **Yes** — the regrill that precedes re-entry may have changed the plan's `Files:` footprints, and later contention checks read the ledger's copy; the skip arm re-stamps `files` from the fresh extraction and reports the entry under `skipped` with `reason: 'refreshed'` | spec §3 (carried [assumed] row → A2) |
| D5 | Contention-check scope under the guard | `intersectFootprints` runs only over genuinely-new entries, seeded from the post-refresh ledger footprints — a refreshed footprint never self-collides with its own prior copy | spec §4 |
| D6 | CLI validation shape for `--redteamRounds` | The ratified three-way `typeof` gate fused with the round-shape check: refuse unless `typeof args.redteamRounds === 'string'` **and** `/^\d+$/.test(args.redteamRounds)` — covering bare-flag `true`, non-numeric, and negative/decimal in one refusal; stderr names the flag and renders the offending token (the bare-flag `true` rendered explicitly); `process.exit(1)` before any `record()` call; happy path still stamps `Number(...)` | spec §3; #1059/#1145 precedent |
| D7 | Harden the sibling `--pr` the same way? | **Yes**, same diff — same class, same file, already named by #1367; refuse a non-`/^\d+$/` `--pr` with the same guard shape | spec §3 (carried [assumed] row → A3) |
| D8 | Shape comment + test banner + third comment wording | Shape comment and section banner: "recorded by the step-3 proceed arm" → "recorded by every arm of /war-campaign's step-3 triage" (the auditor's verbatim suggestion, matching step 5). The survey-derived third site (the structure test's presence-pin comment) rewords to name the every-arm contract without the retired phrase (sanctioned replacement, e.g. "round-count flag: stamped by every arm of the step-3 triage") | spec §3 + Context 3 |
| D9 | Wrap-up hardening-row parenthetical | "(`n/a` when null" → "(`n/a` when null or absent", matching the aggregateBackstops paragraph's wording | spec §3 |
| D10 | Arm (c) re-enumeration | Add the stamp explicitly: "…halt-and-hold, `stopPoint: redteam-route-upstream`, stamping `--redteamRounds <n>` in the same `record` call as `--stopPoint`, regrill command + agenda in CAMPAIGN-STATE.md…" — the "as `--stopPoint`" referent is the grill's N3 correction: arm (c)'s line names no `record` call of its own, so the spec's bare "in the same `record` call" dangled | spec §3, referent pinned |
| D11 | State & resume ledger bullet | Extend to "…status/branch/PR/SHA/stop-point/backstops/red-team rounds" and point at the helper header as the shape's maintained home | spec §3 |
| D12 | `/war-review` row-1 selection rule | Name it in the cell: the ledger under `$MAIN/.claude/campaigns/*/ledger.json` whose `plans[].slug` equals the manifest `planPath`'s basename sans extension — **never the newest campaign** (no manifest field records the campaign); no match → that source is absent (`n/a`). The row's existing report-header-wins and both-absent → `n/a` clauses stay | spec §3; (verified: issue #1356 (2026-08-06), findings 1+4) |
| D13 | Multiple campaigns match the slug | Disambiguate by `plans[].plan` equal to the `$MAIN`-resolved manifest `planPath`; still ambiguous → `n/a` with the ambiguity stated | spec §3 (carried [assumed] row → A4) |
| D14 | Row-2 sweep anchoring | Write the swept roots as `$MAIN/docs/red-team/` and `$MAIN/.claude/campaigns/*/ledger.json`, matching row 1's anchored siblings | spec §3; (verified: issue #1356 (2026-08-06), findings 2+3) |
| D15 | war-room step-2 bullet | Extend the run bullet: `run.redteamRoundLimit` (integer ≥ 1; default 3, the economy preset pins 2) — `/red-team`'s cumulative grill-round budget, read fail-open by `/red-team`, never the phase engine; at the limit with an unadjudicated root finding open — or from round 2 with an unadjudicated needs-decision finding — the gate routes the plan back upstream (never while coverage is incomplete) | spec §3 (both-arms clause per the grill's N1 correction); constraint 9 |
| D16 | war-room economy blurb | `roundLimit: 2` gains the sibling pin in the same clause: `roundLimit: 2`, `redteamRoundLimit: 2` | spec §3 |
| D17 | #1348 finding 1 | **No work** — landed in `0f12ae2`; the issue-close comment cites it | spec §3; Context 7 |
| D18 | Lesson closure | Both companion lessons stamped RESOLVED in their fixing tasks (description prefixed `RESOLVED (<task>, #<issue>): …`, body/keywords untouched — the resolved-lesson-stamp convention): `cli-parseargs-valueless-flag-coerces-to-number-true-is-one` in Task 1.1 (#1367), `new-run-config-knob-needs-war-room-whitelist-touch` in Task 1.4 (#1376) | conversion judgment (A6), the batch's fold-into-fixing-task precedent; logged for /red-team |
| D19 | Task decomposition | Four file-disjoint tasks in one wave — Task 1.1 the helper + its test + its lesson; Task 1.2 `skills/war-campaign/SKILL.md` (all four prose edits — same file, same task); Task 1.3 `skills/war-review/SKILL.md`; Task 1.4 `skills/war-room/SKILL.md` + its lesson — plus the standard trailing release phase. No intra-phase `deps`: every guard/test here lands in the same task as its fact (rules 5–7 need no edge), and Task 1.2's judge (plan 5's guard) is landed base content, not a sibling task's output | conversion judgment; war-strategy §3 |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Skipped drops are consumed (deleted) and reported under the additive `skipped` key | spec §3 (carried [assumed] row: default) | if wrong: leave the drop in the inbox and it re-reports every sweep, or drop the `skipped` key and the skip is silent | End state 1's tests; ratify in /red-team |
| A2 | A skipped re-add re-stamps the existing entry's `files` from the fresh extraction (`reason: 'refreshed'`) | spec §3 (carried [assumed] row: extension beyond the auditor's minimal skip) | if wrong: skip without refreshing and footprints go stale after a regrill | End state 1's refreshed-`files` assert; ratify in /red-team |
| A3 | The sibling `--pr` is hardened in the same diff | spec §3 (carried [assumed] row: extension — same class, same file, named by #1367) | if wrong: fix only `--redteamRounds` and leave `--pr` on bare `Number()` — drop the `--pr` refusal tests and record the narrowing in the done report | End state 3's `--pr` cases; ratify in /red-team |
| A4 | Multi-slug-match disambiguation: `plans[].plan` vs the `$MAIN`-resolved manifest `planPath`; still ambiguous → `n/a` stated | spec §3 (carried [assumed] row: default) | if wrong: any multi-match renders `n/a` directly — a one-clause narrowing of the row cell | End state 9's greps; ratify in /red-team |
| A5 | Plan 5 (`verdict-adjudication-integrity`) has LANDED before Task 1.2 dispatches — expressed as the roadmap `dependsOn` edge, and detectable at Task 1.2's base by `grep -c 'war-campaign' skills/red-team/assets/workflow-scaffold.test.mjs` ≥ 1 (0 at `6fff2ee`; plan 5's D9 surface adds the path constant) | the spec's ordering declaration (its "shares the file" wording corrected — the real coupling is guard-compat, preamble) + plan 5's committed Note 5; the 2026-08-06 survey manifest is not present in this worktree — the spec's statement of the machine hint is the source | the guard doesn't exist at the base: Task 1.2's edits are trivially safe (no content dependency); on a campaign run a zero count is an ordering anomaly to REPORT in the done report; on a standalone run it is expected — **plain re-verify, never halt** (Note 1) | Task 1.2 records the probe count + the scaffold-suite result in its done report |
| A6 | Stamping the two lessons RESOLVED is in-scope for the fixing tasks | D18; the fold-into-fixing-task precedent (plan 6 Context 10) and the resolved-lesson-stamp convention; the spec is silent on lesson closure | operator/red-team vetoes the stamp → drop the lesson file from the task's `Files:` and the mined issues still close on the code fix | End state 12's greps; ratify in /red-team |
| A7 | The third `proceed arm` site (the structure test's presence-pin comment) joins the retirement sweep | conversion grep at `6fff2ee` (Context 3): three hits under `skills/war-campaign/assets/`, spec names two | if wrong (the comment is judged sanctioned): End state 4's zero-hit grep must be re-scoped instead — never left contradicting the landed state | End state 4's grep; ratify in /red-team |

## Non-goals / deferred

- **No `parseArgs` redesign** — the frozen parser shape stays; validation lives at each numeric flag's
  consumer boundary (the lesson's rule).
- **No run-manifest schema widening** — a `campaignId` MUST-carry field would be the deeper fix for
  `/war-review`'s selection, but touches `skills/war/references/schemas.md` and `/war` Lead prose
  owned by other groups; the derived slug-match rule needs no new producer behavior.
- **No `record()`/`next()` dedupe and no ledger migration** — first-match semantics are load-bearing
  (constraint 1); existing ledgers already carrying a duplicate are repaired by hand (delete the stray
  entry), never by code that rewrites ledgers on read.
- **No `schemas.md` edit** — #1348 finding 1 landed in `0f12ae2`; the issue-close comment cites it.
- **No wrap-up/hardening-row renderer change** — the rows are agent prose reading the ledger; only
  their SKILL.md wording is corrected.
- **No edit to plan 5's guard** — if the guard reds against a Task 1.2 edit, the edit is wrong (it
  broke a partition property, constraint 8); fix the edit, never the guard's addressing.
- **No `hooks/inject-campaign-state.sh` change** — the sweep guard removes the *cause* of the
  perma-active ledger; the hook's `is_active` gate is correct as-is and its suite must stay green
  unchanged (End state 13).
- **No engine, hook-logic, or `war-config.mjs` changes** (constraint 11).

## New domain terms · Recommended ADRs

None. "Idempotent re-add" is used descriptively, not as a glossary term. Governing doctrine exists:
ADR 0011 (stack-and-plow ordering — why first-match queue semantics stay), ADR 0046 (the helper + test
as the ledger shape's maintained home), and the ratified numeric-flag refusal precedent (#1059/#1145)
recorded in the `cli-parseargs-valueless-flag-coerces-to-number-true-is-one` lesson.

## Commander's Intent

- **Purpose:** the campaign queue is drain-safe under the halt/regrill/re-add loop its own doctrine
  mandates — a re-added plan refreshes its one queued entry instead of minting an undrainable
  duplicate; the ledger CLI refuses garbage numeric input loudly instead of fabricating a
  plausible-looking round count; the ledger shape's maintained home and the campaign skill's triage
  prose state the true every-arm writer contract; `/war-review`'s rounds telemetry is resolvable and
  worktree-safe (a named selection rule, `$MAIN`-anchored sweeps, `n/a` over any guess); and the
  `run.redteamRoundLimit` knob is operator-discoverable in the one sanctioned config interview.
- **Method:** an append-site idempotence guard in `sweep()` (skip + `files` refresh + additive
  `skipped` report for any drop whose resolved path already has a non-landed entry — ledger or
  earlier-in-sweep; landed entries never block; `record()`/`next()` first-match semantics untouched),
  paired with the arm-(b)/(c) prose qualification so the doctrine and the helper agree; the ratified
  three-way `typeof` + `/^\d+$/` refusal at `--redteamRounds`'s and `--pr`'s consumer boundary in
  `case 'record'`, exiting non-zero before any write; the three sole-writer comment sites and the
  three SKILL.md lags corrected to the every-arm contract with the step-3 structure test and plan 5's
  landed five-surface verdict-enumeration guard kept green by construction (the partition lines keep
  their single-line, code-span properties); the war-review rows gain the slug-match selection rule
  (never-the-newest) and `$MAIN` anchors; the war-room step-2 whitelist and economy blurb gain the
  knob with a consequence clause that matches `routeUpstream()`'s real arithmetic; both companion
  lessons stamped RESOLVED in their fixing tasks; release rides its own trailing phase.
- **End state:**
  1. A drop swept for a plan whose resolved path already has a non-`landed` ledger entry appends no
     second entry, refreshes the existing entry's `files`, and reports it under
     `skipped: [{ plan, reason: 'refreshed' }]` — including the same-sweep double-drop arm — with the
     new sweep-dedupe tests shown RED against the unguarded `sweep()` on a scratch copy
     (backstop: row) ·
     check: `node --test skills/war-campaign/assets/campaign-ledger.test.mjs`.
  2. A drop swept for a plan whose only ledger entry is `landed` appends a fresh queued entry (the
     guard blocks non-landed duplicates only) ·
     check: the paired test in the same suite.
  3. `campaign-ledger.mjs record` refuses a bare `--redteamRounds` (trailing and mid-argv), a
     non-numeric `--redteamRounds`, and the same shapes on `--pr` — non-zero exit, stderr naming the
     flag and the offending token, ledger byte-identical — and reverting the guard on a scratch copy
     flips the refusal tests RED: the bare-flag cases via a silently-stamped `1`, the non-numeric
     cases via a clean exit and a `null` stamp (backstop: row); the existing happy-path
     tests (`'4'` → `4`; omitted flag preserves) stay green unmodified ·
     check: `node --test skills/war-campaign/assets/campaign-ledger.test.mjs`.
  4. The retired sole-writer wording is gone from the maintained home: `grep -rn 'proceed arm'
     skills/war-campaign/assets/` returns zero hits — all three sites (shape comment, section banner,
     the structure test's presence-pin comment) reworded to the every-arm contract ·
     check: the grep. **Grep is the floor:** hand-scan `campaign-ledger.mjs`'s remaining comments and
     every `campaign-ledger.test.mjs` test title/banner in the redteamRounds and CLI sections for any
     other sole-writer or single-arm restatement; list each straggler as a survey-derived correction,
     recorded even when zero.
  5. Arm (c)'s re-enumeration carries the `--redteamRounds` stamp ·
     check: `grep -n 'redteamRounds' skills/war-campaign/SKILL.md` shows an occurrence on the
     arm-(c) line (three step-3 occurrences total: arms (a), (b), (c)).
  6. The wrap-up hardening-row parenthetical reads "null or absent" and the null-only form is gone ·
     check: `grep -n 'when null or absent' skills/war-campaign/SKILL.md` hits, and
     `grep -nE 'when null [—-]' skills/war-campaign/SKILL.md` returns zero hits. **Grep is the
     floor:** hand-scan the wrap-up and State & resume sections for any other null-only phrasing of
     an absent-tolerant field; list stragglers, recorded even when zero.
  7. The State & resume ledger bullet enumerates the full entry shape and names the maintained home ·
     check: `grep -n 'stop-point/backstops/red-team rounds' skills/war-campaign/SKILL.md`.
  8. `/war-room` step 2 and the economy blurb both carry `run.redteamRoundLimit` ·
     check: `grep -c redteamRoundLimit skills/war-room/SKILL.md` ≥ 2 (0 at the `6fff2ee` base), one
     hit in the step-1 economy line and one in the step-2 run bullet.
  9. `/war-review`'s "red-team rounds — this plan" row carries the slug-match selection rule and the
     never-the-newest clause, with the report-header-wins and both-absent → `n/a` clauses intact ·
     check: `grep -F 'never the newest' skills/war-review/SKILL.md` and
     `grep -F 'plans[].slug' skills/war-review/SKILL.md` (`-F`: bracket-bearing pattern,
     constraint 13).
  10. The trend row's swept roots are `$MAIN`-anchored ·
      check: `grep -c 'MAIN/docs/red-team/' skills/war-review/SKILL.md` = 2 (rows 1 and 2) and the
      trend row names `$MAIN/.claude/campaigns/*/ledger.json` (`grep -F` for the `$`-bearing
      literal). **Grep is the floor:** hand-scan the full §3 telemetry tables for any remaining bare
      repo-relative source path; list each as a survey-derived correction, recorded even when zero.
  11. Plan 5's landed five-surface verdict-enumeration guard is green across the war-campaign
      SKILL.md edits — the arm-(a) segment untouched, the (b)/(c) partition lines keep their
      single-line code-span properties (constraint 8) — and the step-3 structure test's presence and
      absence pins hold ·
      check: `node --test skills/red-team/assets/workflow-scaffold.test.mjs` and
      `node --test skills/war-campaign/assets/campaign-ledger.test.mjs`.
  12. Both companion lessons carry the RESOLVED stamp with bodies untouched ·
      check: `grep -cF 'RESOLVED'
      docs/learnings/archive/cli-parseargs-valueless-flag-coerces-to-number-true-is-one.md` ≥ 1 and
      `grep -cF 'RESOLVED' docs/learnings/archive/new-run-config-knob-needs-war-room-whitelist-touch.md` ≥ 1.
  13. The full gates are green at the integrated tip — including `hooks/inject-campaign-state.test.sh`
      (the `is_active` gate's own suite: the sweep guard must not change its
      all-landed-stays-silent behavior) ·
      gate: the self-discovery gate (`resolveGate` in `war-config.mjs`) — `node --test
      'skills/**/*.test.mjs'`, the documented hooks/skills shell-test loop, and the redaction-lint
      wrapper all pass.
  14. Each landing commit cites its issue(s) — #1355/#1367 for Task 1.1, #1355 for Task 1.2, #1356
      for Task 1.3, #1376/#1348 for Task 1.4 ·
      HARD at audit_sha (git log between the phase base and the tip; execution-evidence seat). The
      issue-close comments — including `0f12ae2` cited for #1348 finding 1 — are Lead checkpoint
      work at phase close ·
      check: `gh issue view <N> --comments` for each of #1355, #1356, #1367, #1376, #1348.
  15. Release: all four version slots move lock-step to the next free patch above the live
      integration base at land time ·
      check: `node --test skills/war/assets/version-slots.test.mjs` (lock-step + monotonic floor; the
      bump's presence is judged at audit_sha — the suite cannot fail on a wholly absent release).

## Build order (for /war)

Phase 1 (one wave — Tasks 1.1, 1.2, 1.3, 1.4, file-disjoint, no deps) → Phase 2 (release).

No intra-phase edges: every new test/guard lands in the same task as the fact it guards (Task 1.1's
suite additions guard Task 1.1's code; §3 rules 5–7 are satisfied with no split), and Task 1.2's
external judge — plan 5's five-surface guard — is landed base content under the roadmap `dependsOn`
edge, not a sibling task's output. Task 1.1's `Done when` suite reads `skills/war-campaign/SKILL.md`
(the structure test) at the frozen phase base — green there today and green after Task 1.2's edits by
constraint 4, so no ordering is needed in either direction.

## Phase 1 — Queue idempotence, loud refusal, prose truth, telemetry anchors, discoverability

### Task 1.1: campaign-ledger sweep guard + CLI refusal + maintained-home truth (#1355 findings 1/2/3-guard/4, #1367)

- Files: `skills/war-campaign/assets/campaign-ledger.mjs`, `skills/war-campaign/assets/campaign-ledger.test.mjs`, `docs/learnings/archive/cli-parseargs-valueless-flag-coerces-to-number-true-is-one.md`
- Plan slice: **Shape comment (D8)** — in the `redteamRounds` clause of the top-of-file
  "Ledger shape:" comment, replace "recorded by the step-3 proceed arm" with "recorded by every arm
  of /war-campaign's step-3 triage". **`sweep()` idempotence guard (D2/D3/D4/D5)** — before the
  append, partition `newEntries` sequentially: a drop whose resolved plan path (`path.resolve` on the
  drop's line-1 path) matches a `status !== 'landed'` entry in `ledger.plans` — or a fresh entry
  accepted earlier in this same sweep (the double-drop arm) — is a duplicate: not appended; its
  `files` re-stamped onto the existing entry from the fresh extraction; its drop file consumed like
  any swept drop; reported under the additive `skipped: [{ plan, reason: 'refreshed' }]` return key.
  A `landed`-only match appends a fresh queued entry. The contention loop (`intersectFootprints`)
  runs only over genuinely-new entries, seeded from the post-refresh ledger footprints, so a
  refreshed footprint never self-collides with its own prior copy. Both return sites carry `skipped`
  (`[]` on the empty-inbox early return). `record()`/`next()`/`makePlanEntry` are byte-untouched
  (constraint 1). **CLI refusal (D6/D7)** — in `main()`'s `case 'record'`, replace the bare
  `Number(args.redteamRounds)` with the fused guard: when the flag is present but
  `typeof args.redteamRounds !== 'string' || !/^\d+$/.test(args.redteamRounds)`, write one stderr
  line naming `--redteamRounds` and rendering the offending token (a bare flag renders its literal
  `true`) and `process.exit(1)` **before** any `record()` call — a refused invocation leaves the
  ledger byte-identical (constraint 3). Apply the same guard shape to `--pr` (A3). The happy path
  still stamps `Number(...)`; `parseArgs` is untouched (constraint 2). **Test banner + third site
  (D8, A7)** — in `campaign-ledger.test.mjs`: the `---- redteamRounds (plan Task 5.1) ----` section
  banner gets the same every-arm clause; the step-3 structure test's presence-pin comment
  (`// proceed arm: commit + record the round count`) rewords to the every-arm contract without the
  retired phrase (e.g. "round-count flag: stamped by every arm of the step-3 triage") — the
  sanctioned replacement that keeps End state 4's zero-hit grep truthful. **New tests** — (a)
  sweep-dedupe: add a plan, halt-state it (`record` a `stopPoint`; status stays `queued`), re-drop
  the same plan, sweep → one entry, refreshed `files` (change the fixture plan's `Files:` between
  drops to prove the re-stamp), the `skipped` report, and the inbox consumed; a same-sweep double
  drop of one plan yields one entry; a `landed` entry re-drop still appends. Demonstrate the
  pre-guard RED on a scratch copy of the unguarded `sweep()` and record the trace (backstop row).
  (b) CLI refusal: `record … --redteamRounds` bare-trailing and bare-mid-argv
  (`--redteamRounds --status landed`), `--redteamRounds abc`, each asserting non-zero exit, a stderr
  message naming the flag, and a byte-identical ledger file afterward (read bytes before/after);
  sibling cases for `--pr`. Scratch mutation proof: reverting the guard flips the bare-flag cases
  RED via a silently-stamped `1` and the non-numeric cases RED via a clean exit + a `null` stamp
  (`NaN` serialized by `JSON.stringify`) (backstop row). The existing happy-path tests (`'4'` → `4`; omitted
  flag preserves; `--pr` round-trip) stay green unmodified; no existing test `deepEqual`s the whole
  `sweep()` return (Context 7), so the additive key breaks nothing. **Lesson stamp (D18/A6)** —
  prefix the lesson's `description` with `RESOLVED (redteam-rounds-config-telemetry Task 1.1,
  #1367): `, body/keywords untouched. Run End state 4's grep + mandatory hand-scan and record the
  outcome even when zero stragglers. Commits cite #1355 and #1367.
- Done when: `node --test skills/war-campaign/assets/campaign-ledger.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: war-campaign SKILL.md triage-prose truth under the landed guard (#1355 findings 3-prose/5/6/7)

- Files: `skills/war-campaign/SKILL.md`
- Plan slice: **Ordering probe first (A5)** — after the standard rebase, run
  `grep -c 'war-campaign' skills/red-team/assets/workflow-scaffold.test.mjs` and record the count in
  the done report: ≥ 1 means plan 5's five-surface guard is live at this base (the expected campaign
  state); 0 on a campaign run is an ordering anomaly to report; 0 on a standalone run is expected —
  **proceed either way** (plain re-verify; the coupling is guard-compat only, never a content
  dependency — preamble). **Arm (b) (D1)** — qualify the re-entry sentence: re-entry is
  `/war-campaign add <plan>` after the regrill (the entry is still queued; `sweep` refreshes it
  idempotently, never duplicating — a bare `/war-campaign resume` equally re-picks it). **Arm (c)
  (D10)** — insert the explicit stamp into the re-enumeration: "…halt-and-hold,
  `stopPoint: redteam-route-upstream`, stamping `--redteamRounds <n>` in the same `record` call as
  `--stopPoint`, regrill command + agenda in CAMPAIGN-STATE.md…" (the "as `--stopPoint`" referent is
  binding — arm (c)'s line names no `record` call of its own, D10). **Wrap-up hardening row (D9)** — "(`n/a` when
  null" → "(`n/a` when null or absent". **State & resume ledger bullet (D11)** — extend the
  enumeration to "…status/branch/PR/SHA/stop-point/backstops/red-team rounds" and name the helper
  header (`campaign-ledger.mjs` + its test, ADR 0046) as the shape's maintained home.
  **Guard-compatibility duty (constraint 8, binding):** the arm-(a) line and its enumeration segment
  are byte-untouched; each arm edit stays on its arm's single physical line; the `**(b) Route
  upstream**` line keeps `` `BLOCKED` `` as a code span and the ``**(c) Persistent `INCOMPLETE`**``
  line keeps `` `INCOMPLETE` ``; no new occurrence of any arm marker is introduced anywhere in the
  file. The step-3 structure test's tokens (`--redteamRounds`, `routeUpstream: true`,
  `stopPoint: redteam-route-upstream`, `## Route upstream`; retired wording absent) all survive
  (constraint 4). Prove both: run `node --test skills/red-team/assets/workflow-scaffold.test.mjs`
  and `node --test skills/war-campaign/assets/campaign-ledger.test.mjs` after the edit. Run End
  states 5/6/7's greps + the End-state-6 hand-scan and record outcomes even when zero stragglers.
  Commit cites #1355.
- Done when: `node --test skills/red-team/assets/workflow-scaffold.test.mjs skills/war-campaign/assets/campaign-ledger.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: war-review telemetry rows — selection rule + $MAIN anchors (#1356)

- Files: `skills/war-review/SKILL.md`
- Plan slice: in §3's plan-scoped telemetry table: **Row "red-team rounds — this plan" (D12/D13)** —
  replace the unresolvable `$MAIN/.claude/campaigns/<id>/ledger.json` source with the selection
  rule: the campaign ledger under `$MAIN/.claude/campaigns/*/ledger.json` whose `plans[].slug`
  equals the manifest `planPath`'s basename sans extension — never the newest campaign (no manifest
  field records the campaign); multiple slug matches disambiguate by `plans[].plan` equal to the
  `$MAIN`-resolved manifest `planPath`, still ambiguous → `n/a` with the ambiguity stated; no
  match → that source is absent. The row's existing report-header-wins and both-absent → `n/a`
  clauses stay byte-intact. **Row "red-team rounds per plan — trend across campaigns" (D14)** —
  write the swept roots as `$MAIN/docs/red-team/` and `$MAIN/.claude/campaigns/*/ledger.json`,
  matching row 1's anchored siblings; the row's trend-reading and empty-sweep → `n/a` clauses stay.
  No other row moves; the honesty invariant paragraph above the table is untouched (constraint 7).
  Run End states 9/10's `-F` greps (constraint 13) + the End-state-10 hand-scan of the full §3
  tables for bare repo-relative source paths; record outcomes even when zero stragglers. Commit
  cites #1356.
- Done when: None — prose-only telemetry-row edit; the mechanical pins are End states 9/10's greps
  (no suite reads these rows — verified at `6fff2ee`, Context 5's pin census).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: war-room discoverability — step-2 whitelist + economy blurb (#1376, #1348 finding 2)

- Files: `skills/war-room/SKILL.md`, `docs/learnings/archive/new-run-config-knob-needs-war-room-whitelist-touch.md`
- Plan slice: **Step-2 run bullet (D15)** — extend the existing bullet (`run.roundLimit` (integer
  ≥ 1); `run.afk` (bool); `run.ace` (bool …)) with: `run.redteamRoundLimit` (integer ≥ 1; default 3,
  the economy preset pins 2) — `/red-team`'s cumulative grill-round budget, read fail-open by
  `/red-team`, never the phase engine; at the limit with an unadjudicated root finding open — or
  from round 2 with an unadjudicated needs-decision finding — the gate routes the plan back
  upstream (never while coverage is incomplete). The consequence clause matches **both arms** of
  `routeUpstream()`'s real arithmetic plus its incomplete-coverage short-circuit (constraint 9,
  Context 6) — never stronger. **Step-1 economy blurb (D16)** — `roundLimit: 2` gains
  the sibling pin in the same clause: `roundLimit: 2`, `redteamRoundLimit: 2` (matches the canonical
  economy preset in `war-config.mjs`, re-verified at `6fff2ee`). No other step moves; the edits add
  none of the `commitLearnings` retired-claim phrases the `war-config.test.mjs` doc-claim sweep
  scans this file for (verified against its `RETIRED_CLAIM_SURFACES` scanners at `6fff2ee`).
  **Lesson stamp (D18/A6)** — prefix the lesson's `description` with
  `RESOLVED (redteam-rounds-config-telemetry Task 1.4, #1376): `, body/keywords untouched. Run End
  state 8's grep and record the per-surface hits. Commits cite #1376 and #1348 (finding 2; finding 1
  is citation-only — `0f12ae2` — at the checkpoint, D17).
- Done when: None — prose-only interview-doc edit; the mechanical pins are End state 8's grep plus
  the discovered gate suites (the doc-claim sweep stays green).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version slots, lock-step

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the `README.md` `## Status` blurb
  (replace-in-place, never an empty field, no badge) — to the **next free patch above the live
  integration base at land time**; never a resolved version literal (any version literal in this
  plan, the source spec, or the campaign roadmap is non-authoritative). Expected integration base:
  the tip after the roadmap's sequenced predecessors — at minimum
  `2026-08-06-verdict-adjudication-integrity`, this plan's hard upstream (A5), and its own upstreams
  — have landed their release phases (ADR 0011 stack-and-plow; N stacked unlanded releases lag main
  cumulatively, so resolve from the slots at the actual base, never from memory). Standalone
  fallback: run through plain `/war`, resolve the next free patch from the four slots themselves.
  The Status blurb names the sweep idempotence guard (refuse-and-refresh for a re-dropped non-landed
  plan), the `--redteamRounds`/`--pr` loud refusal, and the war-review/war-room doc anchoring —
  quoting only identifiers that exist in the landed diff (release-blurb lessons: count words match
  the enumeration; quoted literals byte-match landed identifiers; guard semantics stated no wider
  than the implementation — the CLI refusal guards two flags of one subcommand, not the whole CLI).
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- The sweep-dedupe fail-first RED (the new tests against a scratch copy of the unguarded `sweep()`)
  and the CLI-refusal mutation proof (guard reverted → bare-flag cases RED via a silently-stamped
  `1`; non-numeric cases RED via a clean exit + a `null` stamp) · why deferred: mutation/scratch
  runs are uncommittable by design — the committed tests are
  the standing checks · runner: Task 1.1's worker runs both on scratch copies and records the traces
  in the done report; gate-audit reads them SOFT (deliberately-uncommitted-probe class), never a
  hold.
- The manual same-scope survey halves of End states 4, 6, and 10 · why deferred: a hand-scan cannot
  be a mechanical gate member; done-report-only evidence, SOFT at gate-audit · runner: the owning
  task's worker (1.1 for End state 4, 1.2 for End state 6, 1.3 for End state 10) records each
  outcome — mandatory statement even when "zero stragglers"; the Lead re-runs all the greps at phase
  close.
- The A3 `--pr` extension, A6 lesson stamps, and A7 third-site retirement vetoes · why deferred:
  each is a conversion-time extension beyond the issues' literal ask, carried with an explicit
  fallback · runner: /red-team ratifies (or vetoes into the recorded fallback) before execution; a
  post-ratification veto is applied by the owning task and recorded in its done report.
- The A5 ordering probe on a standalone run · why deferred: a campaign run discharges the plan-5
  edge by spine order; only a plain-`/war` run can encounter the pre-plan-5 base, and the coupling
  is guard-compat only — plain re-verify, never a halt · runner: Task 1.2 runs the probe grep as its
  first post-rebase act, records the count, and proceeds; the scaffold-suite run in its `Done when`
  is the guard-green witness whenever the guard exists.

## Notes / conscious deviations

1. **The dependsOn edge is real but its stated reason was wrong — corrected here.** The spec words
   the plan-5 ordering as "it shares `skills/war-campaign/SKILL.md`"; plan 5's committed footprint
   proves it never edits that file — its five-surface guard *reads* it (D9 surface). This plan keeps
   the roadmap `dependsOn` edge (land-after-plan-5: ADR 0011 spine order, plan 5's A7 letter, and
   the guard-green witness) but records the coupling as **guard-compatibility** (constraint 8), and
   therefore sets the standalone fallback to **plain re-verify** rather than the
   halt-on-missing-witness protocol plans 5/6 use for genuine content dependencies — there is no
   construct here whose absence would make a Task 1.2 edit unsafe. Roadmap rows: dependency-spine
   edge plan 5 → this plan; contention rows for the release slots (all plans) and
   `skills/war-review/SKILL.md` (this plan's §3 telemetry rows vs `handoff-schemas-contract`'s §4
   signal class + §3 wall-clock row — disjoint constructs, no ordering edge either way; whichever
   lands second rebases trivially). Logged for /red-team ratification.
2. **Survey-derived third `proceed arm` site.** The spec's §10 criterion mandates a zero-hit
   `grep -rn 'proceed arm' skills/war-campaign/assets/` but its mechanics name only two sites; the
   conversion census found three (Context 3). The third — the structure test's presence-pin
   comment — is folded into Task 1.1 with sanctioned replacement wording (A7), so the retirement
   grep is truthfully zero-hit instead of false-redding on a comment the spec never named.
3. **Release phase despite the spec's "no version bump is implied" clause.** The spec's constraint
   scopes to engine surfaces (`workflow-template.js`, hooks, `war-config.mjs` — all untouched here),
   but `sweep()`'s guard and the CLI refusal are user-visible behavior changes to shipped plugin
   code, and the batch's stacked-release doctrine gives every plan its own trailing release phase
   (the six committed 2026-08-06 plans all carry one). The release task stays (Task 2.1); the
   deviation from the spec's letter is recorded here for /red-team ratification.
4. **Contention honesty.** Beyond Note 1's rows: `skills/war-campaign/assets/campaign-ledger.test.mjs`
   and `skills/war-campaign/SKILL.md` sit in different tasks of the SAME wave while the former's
   structure test reads the latter — safe both ways at the frozen base because Task 1.2's edits
   preserve every pinned token (constraint 4) and Task 1.1's comment reword changes no assertion;
   the phase gate re-runs both suites at the integrated tip (End state 13) as the both-landed proof.
   No committed predecessor touches any Phase-1 file (Context 7).
5. **Spec §10 criteria are carried 1:1 into the End states** with their survey notes kept (criteria
   1–12 → End states 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14), plus the house-standard additions: the
   guard-compat witness (End state 11 — the spec folded it into its constraints), the lesson stamps
   (End state 12, D18), and the release End state (15).
6. **`sweep()` conversion details beyond the spec's letter, logged for /red-team:** (i) the
   same-sweep double-drop arm (sequential dedupe — the spec's ledger-only partition would still mint
   a duplicate from two drops in one sweep, the exact defect class); (ii) `skipped: []` on the
   empty-inbox early return (shape consistency across both return sites); (iii) the contention loop
   seeds from post-refresh footprints (D5 — the spec states the intent; the ordering is made
   explicit here).
7. **Posterity survivors.** Historical artifacts keep the retired wordings and are never retro-edited
   (ADR 0046 posture): the source issues' verbatim quotes, the landed 2026-08-05 plan and its
   red-team report, and lesson bodies (the RESOLVED stamp touches descriptions only — the
   resolved-lesson-stamp convention deliberately leaves bodies present-tense). Every OLD-absent
   check here is scoped to the single live surface its End state names
   (`skills/war-campaign/assets/` for End state 4; the named rows/bullets elsewhere).
8. **Intent provenance.** Part 1 and the intent block are distilled from the ratified source spec —
   itself synthesized from the auditor-verbatim war-followups #1355/#1356/#1348 and the
   memory-mined #1367/#1376; the spec's four flagged [assumed] design calls are carried as A1–A4
   with their fallbacks intact; conversion-time judgments (D18/D19, A5–A7, Notes 1–6) are logged
   for /red-team ratification.

## Open decisions

None. The spec's design tree is fully resolved; the conversion-time extensions (A3's `--pr` arm,
A6's lesson stamps, A7's third-site retirement, Note 6's sweep details) each carry a recorded
fallback and are registered for /red-team ratification.
