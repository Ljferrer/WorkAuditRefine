# 2026-08-06 survey batch — 14 plans

Campaign roadmap, 2026-08-06 batch, authored by `/war-machine` from the 2026-08-06 survey manifest
(`.claude/aot/2026-08-06-survey.json`, uncommitted): 63 swept issues (17 memory-mined) plus the two
operator-directed folds #1380 and #1381 — 65 issues total, 63 claimed across fourteen specs, two
explicitly deferred (chain table, last rows). Plans 1–8 are operator-ratified conversions; plans 9–14
were converted `--afk` — their intent heading is `## AI-Commander's Intent` and their backstops are
AI-declared (ADR 0014), so the per-plan `/red-team` pass is where their self-adjudicated deviations get
ratified. Mode: `stack` (stack-and-plow, ADR 0011) — each plan cuts from its predecessor's landed tip.
This roadmap is authoring input + an on-demand committable snapshot of the campaign — it is **never**
the live queue; the live queue is the campaign ledger (`/war-campaign`'s `assets/campaign-ledger.mjs`).
`/war-campaign` runs `/red-team` per plan before executing it. Every plan carries its own trailing
release phase; version literals are non-authoritative — each release resolves the next free patch from
the live slots at land time (live base at authoring: 0.17.0).

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [2026-08-06-red-team-gate-cli](../plans/2026-08-06-red-team-gate-cli.md) | red-team gate CLI family — `skills/red-team/assets/red-team-gate.mjs` + `.test.mjs`, `skills/red-team/references/lenses.md` (Route-upstream template region), `skills/red-team/references/loop-budget.md`; release slots | next free | — |
| 2 | [2026-08-06-escape-guard-exit-contract](../plans/2026-08-06-escape-guard-exit-contract.md) | escape-guard family — `skills/red-team/assets/assert-no-repo-escape.sh` + `.test.sh`, `skills/red-team/SKILL.md` (Step-4 triage), `skills/red-team/references/lenses.md` (escape-guard bullet), `docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md`, 1 learning; release slots | next free | — (contention rows only) |
| 3 | [2026-08-06-done-when-floor-wiring](../plans/2026-08-06-done-when-floor-wiring.md) | done-when floor family — `skills/war/assets/assert-done-when.sh` + `.test.sh`, `skills/war/assets/workflow-template.js` + `.test.mjs`, `agents/war-refiner.md`, `skills/war/references/schemas.md`, `skills/war/assets/assert-test-in-diff.test.sh`, `CLAUDE.md`; release slots | next free | — |
| 4 | [2026-08-06-shell-pin-helpers](../plans/2026-08-06-shell-pin-helpers.md) | `skills/war-machine/war-pipeline-structure.test.sh` (campaign-primary owner), 1 learning; release slots | next free | — |
| 5 | [2026-08-06-verdict-adjudication-integrity](../plans/2026-08-06-verdict-adjudication-integrity.md) | verdict-cascade family — `CONTEXT.md` (glossary rewrite + shrink; new `skills/war/references/glossary-cold.md`), `skills/war/assets/war-config.test.mjs`, `docs/adr/0045-red-team-loop-budget-and-route-upstream.md`, `CLAUDE.md`, `skills/red-team/assets/red-team-gate.mjs` + `.test.mjs` (test file added by the 2026-08-15 amendment, #1386), `skills/red-team/SKILL.md`, `skills/red-team/assets/workflow-scaffold.js` + `.test.mjs`; release slots | next free | 1, 3 (pref: after 6) |
| 6 | [2026-08-06-gate-audit-finding-routing](../plans/2026-08-06-gate-audit-finding-routing.md) | gate-audit family — `skills/war/assets/workflow-template.js` + `.test.mjs`, `agents/war-auditor.md`, `skills/war/assets/war-config.mjs` + `.test.mjs`, `skills/war/references/setup.md`, `CONTEXT.md` (two additive rows), 2 learnings; 2026-08-15 amendment (#1410/#1412): + `skills/war/references/schemas.md` (one AuditVerdict row), `hooks/validate-auditor-git.sh` + `.test.sh`; release slots | next free | 3 |
| 7 | [2026-08-06-redteam-rounds-config-telemetry](../plans/2026-08-06-redteam-rounds-config-telemetry.md) | campaign/config family — `skills/war-campaign/assets/campaign-ledger.mjs` + `.test.mjs`, `skills/war-campaign/SKILL.md`, `skills/war-review/SKILL.md`, `skills/war-room/SKILL.md`, 2 learnings; release slots | next free | 5 |
| 8 | [2026-08-06-doc-cli-consistency-corpus](../plans/2026-08-06-doc-cli-consistency-corpus.md) | `skills/_shared/doc-cli-consistency.test.mjs`, `CONTEXT.md` (Spec-truth guard entry + two terms), `docs/adr/0046-specs-are-posterity-skills-cite-maintained-surfaces.md`, 1 learning; release slots | next free | 5 |
| 9 | [2026-08-06-handoff-schemas-contract](../plans/2026-08-06-handoff-schemas-contract.md) | engine handoff family — `skills/war/assets/workflow-template.js` + `.test.mjs`, `agents/war-refiner.md`, `agents/war-worker.md`, `skills/war/assets/provision-worktrees.sh` + `.test.sh`, `skills/war/references/resume-and-recovery.md`, `skills/war/references/schemas.md`, `skills/war/SKILL.md`, `skills/war-review/SKILL.md`; 2026-08-15 amendment (#1395/#1408/#1411/#1413): + `skills/war/assets/land-decision.mjs`, `skills/_shared/war-memory.mjs` + `.test.mjs`; release slots | next free | 3, 6 |
| 10 | [2026-08-06-structural-pin-extractors](../plans/2026-08-06-structural-pin-extractors.md) | pin-suite family — `skills/war/assets/workflow-template.test.mjs`, `skills/war/assets/skill-doc-contracts.test.mjs` (D31 family + Task 2.1 banner), `skills/war/SKILL.md` (Done-when intake sub-bullet), 1 learning; release slots | next free | 3, 6 |
| 11 | [2026-08-06-war-strategy-mirror-guards](../plans/2026-08-06-war-strategy-mirror-guards.md) | authoring-surface family — `skills/war-strategy/SKILL.md`, `skills/war-strategy/references/plan-interview.md`, `skills/war-strategy/war-strategy-structure.test.sh`, `skills/war-machine/SKILL.md`; release slots | next free | 4 (order-only) |
| 12 | [2026-08-06-gate2-publication-guard](../plans/2026-08-06-gate2-publication-guard.md) | `skills/war/SKILL.md` (Gate-2 publication region), `skills/war/assets/skill-doc-contracts.test.mjs` (D22 block), 1 learning; release slots | next free | 9, 10 (order-only, witnessed) |
| 13 | [2026-08-06-references-pointer-integrity](../plans/2026-08-06-references-pointer-integrity.md) | agent-card family — `agents/war-auditor.md`, `agents/war-worker.md`, `agents/war-refiner.md`, `agents/war-servitor.md`, `agents/war-setup-scout.md`, new `skills/war/assets/reference-link-integrity.test.mjs`, `skills/war/assets/workflow-template.test.mjs`, `skills/war/SKILL.md`, `skills/war/references/worker-servitor-edges.md`, new `docs/adr/0047-agent-card-pointer-skeleton-plugin-root-anchored.md`, `CONTEXT.md`, 1 learning; release slots | next free | 10, 12 |
| 14 | [2026-08-06-adr-doc-truth-sweep](../plans/2026-08-06-adr-doc-truth-sweep.md) | ADR/doc-truth family — `docs/adr/0008`/`0025`/`0030`/`0033`, `.tours/architect-war-system.tour`, `skills/war/assets/stage-workflow.mjs`, `hooks/validate-auditor-git.test.sh`, new `CHANGELOG.md`, `README.md` (structural: Releasing checklist + Status link), `skills/war-machine/war-pipeline-structure.test.sh` (one comment), `skills/war/assets/version-slots.test.mjs`, 3 learnings (third added by the 2026-08-15 amendment, #1399); release slots | next free | 4, 11, 12 (terminal) |

## Dependency spine (strict landing order)

```
1 → 2 → 3 → 4 → 6 → 5 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14
```

Stack-and-plow serializes every plan; the chain above is the launch sequence. The links that are
content-forced (each recorded in the named plan's own committed Part 1) versus mere checkpoint order:

- **1 → 5** (hard; plan 1's A4): plan 5 declares `dependsOn: red-team-gate-cli` and rewrites
  `red-team-gate.mjs`'s header-comment block that plan 1's fix touches — sequenced sibling-first the
  two rewrites conflict. Plan 1's A4 explicitly retires the spec's "wholly owned footprint" claim and
  mandates this spine edge.
- **3 → 5, 3 → 6, 3 → 10** (hard; plan 3's A6 downstream set): plan 5 shares `CLAUDE.md`; plan 6
  stacks directly on plan 3's `workflow-template.js` + suite rewrites (its A5 requires plan 3 LANDED
  before any Task 1.1 dispatch); plan 10 declares a **binding** lands-after on plans 3 and 6. A6 also
  names `handoff-schemas-contract` as transitively downstream — covered here by 3 → 6 → 9.
- **6 → 9, 6 → 10** (hard; plan 6's Context 9 verified quotes + plan 9's own stacked-base
  declaration): plan 9 stacks on plans 3 and 6 (both rewrite `workflow-template.js` regions its
  Task 1.1 edits); plan 10's binding lands-after names plan 6.
- **6 before 5 — PREFERENCE, never a hard edge** (plan 6's Note 6, grill-ratified, backed by its A7):
  sequencing plan 6 first keeps its two ≤ ~450 B `CONTEXT.md` glossary rows inside plan 5's
  re-measured shrink base, so the batch does not immediately re-arm the advisory shrink signal plan 5
  pays to clear. Landed the other way the batch still holds — the advisory line is warning-only and
  plan 5's `wc -c` Done-when is a one-shot merge check at its own land, not a standing test.
- **5 → 7, 5 → 8** (hard, order-only-with-witness; plans 7 and 8's stacked-base analyses + plan 5's
  Note 5): plan 7's Task 1.2 edits the exact `war-campaign/SKILL.md` partition lines plan 5's D9
  guard slices (guard-compatibility, not content — its standalone fallback is plain re-verify);
  plan 8's one real content coupling is plan 5's creation of `glossary-cold.md`, which its
  directory-scanned census picks up (standalone fallback: plain re-census at the rebased base).
- **9 → 12, 10 → 12** (hard, order-only with G12 witnesses; plan 12's Context 6): the spec's "all
  three touch `skill-doc-contracts.test.mjs`" rationale is corrected there — that file is shared with
  plan 10 only — but both edges stay, witnessed non-vacuously (`clock read`, `backticks`,
  `D31_ARMS_COLLIDED` present-after-predecessor probes).
- **10 → 13, 12 → 13** (hard; plan 13's declared upstream edges): its expected integration base is
  the tip after `structural-pin-extractors` and `gate2-publication-guard`.
- **4 → 11** (hard spine edge, order-only; plan 11's A7): validation-order determinism — plan 11
  validates its reworded machine-SKILL prose against the pin suite as landed by plan 4's refactor;
  zero file overlap, no correctness loss if inverted, one re-validation risk.
- **4 → 14, 11 → 14, 12 → 14** (hard; plan 14's Note 3 mandates the roadmap carry all three): plan 14
  adds a comment to the suite plan 4 refactors (witnessed in its Task 1.6), reads plan 11's pinned
  war-strategy §2 block and plan 12's Gate-2 bullet, and — the batch's only real release-surface
  contention — its structural `README.md` edits (Releasing checklist, Status link line, CHANGELOG
  introduction) must land **last**, after every predecessor's replace-in-place Status-blurb rewrite,
  or a later blurb replacement could silently drop the un-pinned link line. **Plan 14 is terminal.**
- **2 has no spine edges** (plan 1's A4: "escape-guard-exit-contract declares no edge"): its
  `lenses.md` and `skills/red-team/SKILL.md` overlaps are contention rows only, serialized by the
  stack at checkpoint position 2.
- All other adjacencies in the chain (1 → 2, 3 → 4, 7 → 8, 10 → 11) are checkpoint order, not
  content-forced.

## Issue → spec → plan chain

65 issues: 63 swept by the 2026-08-06 survey (17 memory-mined, #1362–#1378) + the two operator-directed
folds #1380/#1381 into plan 9's spec. 63 are claimed below; the last two rows record the survey's
explicit deferrals (manifest `deferred` records; the manifest is uncommitted, per doctrine).

**Amendment (2026-08-15, operator-directed).** Nine campaign-era issues — filed during plans 1–3's
execution, after this roadmap was authored — are folded into the not-yet-launched plans whose file
family they land in: #1386 → plan 5; #1410, #1412 → plan 6; #1395, #1408, #1411, #1413 → plan 9;
#1398, #1399 → plan 14 (each plan carries a dated amendment note; new same-family-file work rides
new phases, never same-file parallel tasks). **Deliberately not folded:** #1396 and #1397 — the
escape-guard family's owner (plan 2) already landed; #1396 carries unsettled design questions
(residue allowlist vs denylist, exit routing) that need their own `/war-strategy` interview, and
#1397 is its mechanical sibling in the same suite — they stay open as the seed of a future
escape-guard round.

| Issues | Spec | Plan |
|--------|------|------|
| #1378, #1347, #1366 | [red-team-gate-cli](../specs/2026-08-06-red-team-gate-cli-design.md) | plan 1 |
| #1263, #1369, #1268 | [escape-guard-exit-contract](../specs/2026-08-06-escape-guard-exit-contract-design.md) | plan 2 |
| #1365, #1338, #1370, #1340, #1360, #1339 | [done-when-floor-wiring](../specs/2026-08-06-done-when-floor-wiring-design.md) | plan 3 |
| #1362, #1310, #1374, #1371 | [shell-pin-helpers](../specs/2026-08-06-shell-pin-helpers-design.md) | plan 4 |
| #1264, #1265, #1267, #1357, + #1386 (folded 2026-08-15) | [verdict-adjudication-integrity](../specs/2026-08-06-verdict-adjudication-integrity-design.md) | plan 5 |
| #1377, #1372, #1343, + #1410, #1412 (folded 2026-08-15) | [gate-audit-finding-routing](../specs/2026-08-06-gate-audit-finding-routing-design.md) | plan 6 |
| #1355, #1356, #1367, #1376, #1348 | [redteam-rounds-config-telemetry](../specs/2026-08-06-redteam-rounds-config-telemetry-design.md) | plan 7 |
| #1368, #1306, #1358 | [doc-cli-consistency-corpus](../specs/2026-08-06-doc-cli-consistency-corpus-design.md) | plan 8 |
| #1331, #1333, #1289, #1380, #1381, + #1395, #1408, #1411, #1413 (folded 2026-08-15) | [handoff-schemas-contract](../specs/2026-08-06-handoff-schemas-contract-design.md) (#1380 and #1381 folded by operator direction, 2026-08-12) | plan 9 |
| #1373, #1286, #1334, #1375, #1332, #1252 | [structural-pin-extractors](../specs/2026-08-06-structural-pin-extractors-design.md) | plan 10 |
| #1307, #1308, #1309 | [war-strategy-mirror-guards](../specs/2026-08-06-war-strategy-mirror-guards-design.md) | plan 11 |
| #1288, #1287, #1293 | [gate2-publication-guard](../specs/2026-08-06-gate2-publication-guard-design.md) | plan 12 |
| #1364, #1278, #1279, #1277, #1275, #1276 | [references-pointer-integrity](../specs/2026-08-06-references-pointer-integrity-design.md) | plan 13 |
| #1363, #1305, #1266, #1290, #1291, #1292, #1253, #1330, #1317, + #1398, #1399 (folded 2026-08-15) | [adr-doc-truth-sweep](../specs/2026-08-06-adr-doc-truth-sweep-design.md) | plan 14 |
| #1349 | deferred by the survey — verified stale: both loop-doctrine findings landed in the 2026-08-05 phase-4 close polish `0f12ae2`; nothing left to spec | — |
| #1179 | deferred by the survey — process-debt measurement backstop, not plannable code work: closes via `/war-review` guard-denial-rate measurement on the next completed multi-seat run, against the #1138 baseline | — |

## Shared-file contention

| File | Plans | Risk & mitigation |
|------|-------|-------------------|
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` (Status slot) | all 14 | The sanctioned stacked-release pattern, not contention: every plan's trailing release phase re-reads the four slots at its own land tip and resolves the next free patch; `version-slots.test.mjs`'s lock-step + monotonic floor is the arbiter. |
| `README.md` — structural edits | 14 (vs. every sibling's blurb rewrite) | The batch's only real release-surface contention (plan 14 Note 3): Task 1.6's Releasing-checklist insertion, Status link line, and CHANGELOG introduction are structural, not slot-bump. Landed earlier, a later predecessor's replace-in-place Status blurb could silently drop the un-pinned link line. Resolved by ordering — plan 14 lands last, terminal. |
| `skills/war/assets/workflow-template.test.mjs` | 3, 6, 9, 10, 13 | Hottest suite in the batch. Spine-serialized 3 → 6 → 9 → 10 → 13; constructs disjoint per plan 10's Note 1 construct census and plan 13's additive card-pointer guard rows; each downstream worker rebases onto the landed suite. |
| `skills/war/SKILL.md` | 9, 10, 12, 13 | Region-disjoint per plan 12's Context 6 heading-map verification: 9's regions (Setup step 2, Decompose step 1, § Run manifest, § Per phase, § Checkpoint; the 2026-08-15 amendment adds the Prefetch-paragraph JSONL sentence and a launch-paragraph provenance-floor sentence — both inside 9's existing per-phase/run region) and 10's (Decompose step 3's Done-when intake sub-bullet) all sit outside 12's Gate-2 extraction region; 13 adds an Invariants trigger-pointer bullet. Order-only edges 9/10 → 12 carry G12 witnesses; neither 9 nor 10 introduces an `ensure-origin` token (12's four-token census re-measured regardless). |
| `CONTEXT.md` | 5, 6, 8, 13 | Construct-disjoint per plan 8's stacked-base construct map (5: entry rewrites + cold-home eviction; 6: two additive rows; 8: Spec-truth guard entry + two new terms; 13: ADR 0047 cross-reference). Budget interplay: the 6-before-5 preference keeps 6's rows inside 5's re-measured shrink base; the suite's advisory line is warning-only, hard line not approachable. |
| `skills/war/assets/workflow-template.js` | 3, 6, 9 | Spine-serialized 3 → 6 → 9; each plan rewrites regions the next stacks on (`doneWhenFloorClause` → sweep routing → handoff/followUp dispatch); measured-at-base + expected-post-predecessor tagging in plans 6 and 9. |
| `skills/red-team/references/lenses.md` | 1, 2; 5 guard-reads | Three disjoint constructs (plan 5 Note 4, verified): 1 edits the `## Route upstream` template region, 2 the escape-guard bullet, and 5's D10 surface is the `INCOMPLETE` verdict spine bullet — which 5 only guard-reads (its A7 pins the guard-read surfaces unchanged at its base). Serialized 1 → 2 → 5 by the chain. |
| `agents/war-refiner.md` | 3, 9, 13 | 3's step-7 floor sentence, 9's dispatch/return-contract additions, 13's pointer re-anchor — prose/enumeration additions, no links, per plan 13's A4 slice verification; spine-serialized. |
| `skills/war-machine/SKILL.md` | 4 (read-side pins), 11 | Read-side, not a write collision: plan 4 holds `has_i`/`has_i_stripped` + `lacks_i` pins over this file's prose (incl. the D6 twin `author the merged plan`); plan 11 rewords it. Serialized by the 4 → 11 order-only spine edge, so plan 11 revalidates against the landed helper semantics (plan 4 A6 / Note 5). |
| `skills/war/references/schemas.md` | 6 (amendment), 9 | Added by the 2026-08-15 amendment: plan 6's Task 2.1 adds one AuditVerdict row (`escalate_reason` required-when-escalate); plan 9's Task 1.3 truth pass and Task 2.1 doc rows land later and rebase onto it — spine-serialized 6 → 9, row-disjoint. |
| `hooks/validate-auditor-git.test.sh` | 6 (amendment), 14 | Added by the 2026-08-15 amendment: plan 6's Task 2.2 adds a denial-message-content case; plan 14's Task 1.5 edits C11/H5 rationale comments only — spine-serialized 6 → 14, construct-disjoint (plan 14's Note 2 re-census records it). |
| `skills/war/assets/skill-doc-contracts.test.mjs` | 10, 12 | Plan 12 Context 6: 10 owns the D31 block (file tail) + the Task 2.1 doc-cascade banner; 12 owns the D22 ordered-span block — construct-disjoint though adjacent at the banner boundary. Order-only edge 10 → 12 with the `D31_ARMS_COLLIDED` witness. |
| `skills/war/references/schemas.md` | 3, 9 | 3 adds the done-when rows; 9's Task 1.3 is the return-contract truth rewrite — downstream of the 3 → 6 → 9 spine, rebases onto 3's rows. |
| `skills/red-team/assets/red-team-gate.mjs` | 1, 5 | The coupling that forced the 1 → 5 spine edge (plan 1's A4): 1's CLI refusal fix and 5's header-comment rewrite would conflict sequenced sibling-first. |
| `skills/red-team/SKILL.md` | 2, 5 | 2's Step-4 exit-2 arm vs. 5's ADJUDICATED-cascade rows — no declared edge either way (plan 5 Note 4's contention row); serialized by chain position. |
| `CLAUDE.md` | 3, 5 | 3's floor-enumeration additions (D10) vs. 5's #1265 item-1 fix; one of the two couplings behind plan 5's `dependsOn: done-when-floor-wiring`. |
| `skills/war/assets/war-config.test.mjs` | 5, 6 | Plan 6 Context 8: 5 edits the enumerated `sweptSurfaces` lists, 6 the banner test — different constructs, no dependency either way; contention row only. |
| `skills/war-campaign/SKILL.md` | 7; 5 guard-reads | Plan 7's stacked-base analysis: 5's Task 1.6 D9 guard slices the three-arm triage partition; 7's Task 1.2 edits bytes on exactly those two partition lines under an explicit guard-green duty (its constraint 8) — the substance of the 5 → 7 edge (guard-compatibility, not content). |
| `skills/war-review/SKILL.md` | 7, 9 | Plan 9 Context 11: 7 edits §3's plan-scoped telemetry table; 9 edits §3's metric-table wall-clock row + the §4 signal catalogue — construct-disjoint; contention only, no dependency either way. |
| `agents/war-auditor.md` | 6, 13 | 6's seat-prompt/truncation additions vs. 13's pointer re-anchor; prose additions, no links (plan 13 A4); spine-serialized 6 → … → 13. |
| `agents/war-worker.md` | 9, 13 | 9's card additions vs. 13's pointer re-anchor; same A4 verification; spine-serialized 9 → … → 13. |
| `skills/war-machine/war-pipeline-structure.test.sh` | 4, 14 | 4 owns the helper refactor; 14 adds one comment sentence after the refactor lands (witnessed in its Task 1.6) — the 4 → 14 edge (plan 14 Note 2/3). |

All remaining footprint files are owned by exactly one plan and carry no cross-plan risk. Read-side
couplings (no edit overlap, recorded in plan 14's Note 2): plan 11 pins the war-strategy SKILL §2
block byte-unchanged (the subject of 14's ADR 0030 note); plans 12/13 edit `skills/war/SKILL.md`
around — but at clause granularity not touching — the invariant clause ADR 0008's repaired pointer
anchors on; plan 2's escape-guard header edits leave both phrases ADR 0033's note cites byte-intact.
Plan 14's Task 1.2 witness re-verifies at the rebased base regardless.

## Execution

```
/war-campaign docs/roadmaps/2026-08-06-survey-batch-roadmap.md
```

Each plan is red-teamed at its selection (the campaign runs `/red-team` per plan before executing it).
Plans 9–14 were authored `--afk`: intents are `## AI-Commander's Intent` and backstops are AI-declared
(ADR 0014) — the red-team pass is where their self-adjudicated deviations get ratified; any
heading-extraction surface must recognize both intent headings. Anyone running a plan through
standalone `/war` must red-team it manually, and a standalone run resolves its release as the next free
patch from the four slots itself. The 6-before-5 preference is a sequencing hint, not a gate — a
campaign resuming with plan 5 already landed proceeds without re-ordering.
