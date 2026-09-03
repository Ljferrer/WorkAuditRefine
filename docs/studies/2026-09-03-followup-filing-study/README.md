# #1492 study: war-followup filing rate and in-band fixability

Interactive version with timeline charts: https://claude.ai/code/artifact/6055dec8-76a3-49b1-99ed-6735130ccec9 (source: `study.html` beside this file; per-issue rows in `classified.json`, closure rows in `closures.json`, per-version rows in `versions.json`).

Data as of 2026-09-03. Numerator: all 391 `war-followup` issues (203 closed, 188 open). Each issue was hand-classified by an agent from its body, with light repo lookups (rubric below). Denominator: `### Task` count in the executed plan file, attributed by the issue body's plan/epic citation. Closure mechanics come from each closed issue's GitHub timeline.

## Headline

- 85% of follow-ups (333 of 391) were fixable in-band: 157 trivial (under 10 lines, in the task's own files), 114 small (under 50 lines), 62 blocked only by a closed lane. 189 of the 333 were 5 lines or fewer.
- The #1431 mechanism-substitution class is 5% (18 of 391). It is not the main leak.
- The main leak is scope literalism: comment/doc lag (31%), in-diff defects (23%) and vacuous or missing test pins (19%), where the seat's stated reason was "the slice does not name this" rather than any mechanical barrier.
- The latitude clause did not lower the rate. Plans carrying `Mechanism latitude:` filed 3.0 follow-ups per task after 2026-08-18. The clause-free control (plan 14, adr-doc-truth-sweep) filed 1.0 per task. The before-window base rate was about 0.7 per task.

## Frequency over time

| Window | Follow-ups | Fixable in-band | #1431-class | Dominant channel |
|---|---|---|---|---|
| A: before PR #1491 (to 08-16) | 108 | 89 (82%) | 3 | Lead-filed 47, auditor follow-up 31, sweep-demoted 28 |
| B: authored half (08-17) | 9 | 8 | 2 | Lead-filed 6 |
| C: runtime arms installed (08-18 on) | 274 | 236 (86%) | 13 | auditor follow-up 226, sweep-demoted 23, Lead 21 |

Weekly filing: 5 to 15 per week through July, 40 in the week of 08-18, 172 in the week of 08-26. The jump tracks campaign volume (plans with 27 and 16 tasks) and the engine's own consolidated filing dispatch, which files every roster follow-up disposition automatically. Before that dispatch, most issues were Lead-filed and fewer.

## Per plan (window C, follow-ups per task)

| Plan | Tasks | Follow-ups | Rate | Latitude clause |
|---|---|---|---|---|
| war-strategy-mirror-guards (plan 11) | 5 | 14 | 2.8 | yes |
| references-pointer-integrity (13) | 6 | 10 | 1.7 | yes |
| gate2-publication-guard (12) | 3 | 5 | 1.7 | yes |
| adr-doc-truth-sweep (14, control) | 8 | 9 | 1.1 | no |
| realized-absorb-rate | 9 | 40 | 4.4 | yes |
| authoring-side-verification | 11 | 17 | 1.5 | yes |
| ask-disposition | 8 | 14 | 1.8 | yes |
| engine-reliability-and-filing-fidelity | 27 | 93 | 3.4 | yes |
| in-run-finding-resolution | 4 | 47 | 11.8 | yes |
| engine-concurrency-and-pin-transfer | 5 | 22 | 4.4 | yes |
| authoring-doctrine-and-lint-coherence | 10 | 2 | 0.2 | yes |
| doc-truth-and-drift-guard-debt (in flight) | 16 | 1 | 0.1 | yes |

Before-window plans ran 0.1 to 2.0 per task (median about 0.6). Plan kind confounds this: the high-rate plans are engine work on workflow-template.js with 5-seat deep rosters. The two most recent plans (0.2 and 0.1) ran after the ace re-entry machinery of 0.21.x, which is the first visible drop.

## Fixable share by plugin version

Each follow-up is assigned the plugin release current on its filing day (latest release commit on `master` at or before the timestamp). The fixable-in-band share has sat between 82% and 92% for every release band since 0.15. No release moved it. The mix inside it moved: lane-closed cases fell from 31% of filings (0.15 to 0.16) to 8% to 15% from 0.17.11 on, and trivial same-file fixes rose to 42% to 58%. The #1431 class peaked at 12% in 0.17.0 to 0.17.10 and is 0% in 0.21.x (60 issues).

| Release band | First release | n | Fixable in-band | Trivial | Small | Lane closed | Design call | Out of scope | #1431 class |
|---|---|---|---|---|---|---|---|---|---|
| ≤0.13 | 2026-07-01 | 7 | 86% | 71% | 14% | 0% | 14% | 0% | 0% |
| 0.14.x | 2026-07-10 | 48 | 75% | 33% | 17% | 25% | 8% | 17% | 4% |
| 0.15–0.16 | 2026-08-03 | 36 | 89% | 28% | 31% | 31% | 8% | 3% | 0% |
| 0.17.0–.10 | 2026-08-06 | 26 | 88% | 19% | 46% | 23% | 8% | 4% | 12% |
| 0.17.11–.13 | 2026-08-18 | 53 | 92% | 45% | 40% | 8% | 6% | 2% | 8% |
| 0.18.x | 2026-08-20 | 24 | 88% | 58% | 17% | 12% | 0% | 12% | 4% |
| 0.19.x | 2026-08-25 | 17 | 82% | 47% | 24% | 12% | 12% | 6% | 6% |
| 0.20.x | 2026-08-25 | 120 | 85% | 42% | 28% | 15% | 9% | 6% | 6% |
| 0.21.x | 2026-08-27 | 60 | 83% | 42% | 32% | 10% | 10% | 7% | 0% |

Version is inferred from filing date. A run on an older installed plugin than the latest release is misattributed one band forward.

## Classification (all 391)

| Class | n | Fixable in-band |
|---|---|---|
| comment-or-doc-lag | 121 | 119 |
| defect-in-diff | 88 | 73 |
| test-vacuity-or-pin-gap | 74 | 72 |
| duplicate-of-sibling (same root, another seat) | 26 | 26 |
| mechanism-substitution (#1431 class) | 18 | 17 |
| absorb-intended-but-lost (#1547 class) | 15 | 15 |
| other | 14 | 0 |
| pre-existing-rot-out-of-slice | 13 | 10 |
| engine-defect-out-of-ceiling | 12 | 0 |
| scope-enhancement | 10 | 1 |

Channel: 66% direct auditor follow-up disposition, 19% Lead-filed at Checkpoint, 13% absorb demoted because the sweep or ace never ran, under 1% absorb demoted by a batch revert. The #1547 batch-revert failure mode is nearly absent in this repo's data.

The 62 lane-closed cases split into: file outside the task's `Files:` set (CLAUDE.md, CONTEXT.md, ADRs, schemas.md, sibling test files), plan-frozen surfaces (byte-identity mandates, frozen lesson bodies, release slots), and findings raised on the terminal polish or gate-audit round with no further pass.

## The 18 #1431-class issues

#1016, #1212, #1349, #1475, #1480, #1535, #1560, #1575, #1584, #1621, #1655, #1694, #1736, #1750, #1774, #1813, #1829, #1866. Twelve of them were filed from plans that carried the latitude clause. The recurring shape is not a construct substitution but an extension beyond a pinned count or enumeration ("five arms" when seven exist, "2 of 4 sites", "the slice floors only the read instruction"). The clause licenses substitution, not strengthening or sibling-site completion, and seats read it that way.

## Closed issues (203)

- Median time to close 1.4 days. 87 closed within a day, 150 within a week, none open past 30 days before closing.
- 178 completed, 25 not planned. 21 of the 25 not-planned are duplicate-of-sibling closures.
- Closure vehicle: 121 by a referenced commit, 71 by hand with a verification comment, 11 by PR. 191 closed by the operator account, 12 by SQPferrer.
- 75 of the 132 closing commits are `docs:` commits. Batch sweeps dominate: one commit (c1bdb00) closed 9, another (879c62d) 5, another (5e4880f) 4. WAR runs closed few of their own follow-ups; the operator did, days later, in sweep commits.
- 129 of the 203 closures happened after #1492 was filed. 100 of the 203 closed issues were also created after it. The closed set is therefore not a stale-backlog artifact.
- Closure rate by class: duplicates 88%, absorb-lost 73%, doc lag 55%, pin gaps 50%, defect-in-diff 36%, mechanism-substitution 33%. Trivially fixable issues close in a median of 0.5 days. The cheapest issues are also the ones that get closed, which confirms they were cheap.

## Reading against #1492's boundaries

1. Authored-side half-effect (window B): 9 issues, too few to read.
2. Doctrine landed (plan 11 phase 2, release 0.17.11 on 08-18): no drop follows. The three amended plans (11 to 13) filed 1.7 to 2.8 per task.
3. Full effect: plans 12 and 13 ran under 0.17.11. Rates 1.7 each. Control plan 14 ran at 1.1 with one #1431-class issue (#1621) against 1 in plan 13 and 0 in plans 11 and 12. No contrast in the direction the thesis predicts.
4. #1431's deferred backstop (re-open on a routed issue the clause should have covered) is met by #1774 and #1813 at least: both bodies say the substitution held the End states and was filed anyway.

## Caveats

- Classification is single-pass by eight agents on issue text. 73% high confidence, 27% medium, 1 low. Treat class counts as plus or minus about 10%.
- Plan attribution failed for 12 issues (older July series without a plan slug).
- Denominator is planned tasks, not landed tasks. Held phases inflate the rate slightly for engine-reliability and in-run-finding-resolution.
- #1547's numerator warning applies: the engine's consolidated filing dispatch (from 0.19.x) files every follow-up disposition automatically. Window A counts are Lead-filtered, window C counts are not. Part of the jump is measurement, not behavior.

## Rubric

Class: mechanism-substitution, absorb-intended-but-lost, defect-in-diff, test-vacuity-or-pin-gap, comment-or-doc-lag, pre-existing-rot-out-of-slice, engine-defect-out-of-ceiling, scope-enhancement, duplicate-of-sibling, other. Fixability: yes-trivial (under 10 lines, in the task's files), yes-small (under 50), yes-lane-closed (fixable but every WAR lane closed by rule), design-call, no-out-of-scope. Per-issue rows: `classified.json`; closure rows: `closures.json`.
