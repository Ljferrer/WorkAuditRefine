# Red Team — 2026-08-25-doc-truth-and-drift-guard-debt (2026-09-03)
**Verdict:** ADJUDICATED — 58 blockers (13 root defects) patched in place and Lead-stamped under `--afk` (campaign plan 4, no operator at the keyboard); no probe re-proof was run.
**Rounds:** 1
<!-- Cumulative grill sweeps: the Step-1 seed + this run's sweeps. Strict form — the next run's seeding re-reads exactly this line; an integer, nothing else. -->

Run header: `artifactKind: impl-plan` (merged arm — Part 1 carries the decision record; `--spec` = the plan). Agents on `opus`/`high` from `agents.redteam`; round limit 3; single pipeline. Provision `[]`. Base: `dev/2026-08-25-doc-truth-and-drift-guard-debt` @ `c8c22e5` (cut from plan 3's tip `a8a9391`, release 0.21.8; the 2026-09-03 #1812 re-amendment already applied). The plan was authored and last refreshed at `5aeb8b3` (0.20.0); three campaign plans and eight patch releases landed in between, which is the origin of nearly every finding.

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source (merged arm), consistency-placeholders, dependency-feasibility, intent-vs-plan. Bespoke: snippet-fidelity (analyzed), baseline-repro (executed — every End-state `check:` literal run at base), default-flip-old-absent (executed; drift-guard probe 2). `ff-topology`: not triggered. Lead-run drift-guard probes: unguarded-new-mirror — vacuous (`workflow-template.js` comment-only); guard-split-deps-edge — pass (Phase 1 Task 1 → Task 2 README guard carries its deps edge; Phase 2 guards are phase-later); touched-doc-fact-coverage — pass (README roundLimit/ace facts guarded by Task 2's rows and End state 4; CLAUDE.md, tour, ADR prose explicitly deferred). Backstop-legitimacy: four rows, each with why-deferred + runner + timing; no `judge:` tags.
Fallback: none — all analyzed probes ran on `Explore`.
Coverage: 9/9 expected, 9 on-target, 0 dropped.

## Executed proof
- All ten Done-when suites green at base. Escape guard: snapshot exit 0, post-run exit 0.
- Vacuous-at-base checks proven by execution: End state 20 (`ruled ask Lead-side …` 0 hits — the sentence was reworded by the 2026-08-27 ruled-ask rewrite while the routing defect survived), End state 23 first needle (`absent = unthrottled fan-out` 0 hits — row reworded by the 0.21.7 semaphore plan), End state 25 (`six-site`, `plus the seven` 0 hits), End state 8 (lint green regardless).
- `QUALIFIED_HEADERS` has nine members at base including `refiner-recovery.md`, whose header carries "at eviction time" line-wrapped — the plan's recorded evidence-conflict resolution was a line-scoped-grep artifact.
- Tour: 12 step-level `"line"` keys; the other two are step 17's `selection` coordinates.
- `docs/learnings/prepush-condemnation-check-…md` moved to `archive/` (commit 37e2ee0); `git fetch` still absent from it.
- ADR 0046 never names CHANGELOG; its Consequences exclude historical-record surfaces from the posterity corpus; CHANGELOG carries zero would-be violations.
- default-flip-old-absent: the README `--ace` flip had no OLD-absent or NEW-present floor anywhere; the roundLimit pair reds both ways (verified).

## Findings
### Critical / Major / Minor
- [Critical+Major ×7] End state 20 vacuous at base → check re-derived to the live phrase (2 hits → 0, case-insensitive); Task 8's target sentences re-quoted from base. Adjudicated.
- [Major ×9] `QUALIFIED_HEADERS` count/membership stale; evidence-conflict resolved backwards → Task 2.1 adds only `setup.md`/`docker-gate.md` (11), two header edits, `refiner-recovery.md` dropped from Files, Notes paragraph reversed. Adjudicated.
- [Major ×6, needsDecision] Task 6's prepush lesson archived → Files repointed to `archive/`; ruling: frozen-body convention, #1522 lands as an appended dated Correction section, both lessons stay archived; End state 8 gains content needles. AI-declared.
- [Major ×7, needsDecision] End state 23 / #1802 → first needle re-derived to `unthrottled` (1 hit), #1802 re-scoped to the 0.21.7 semantics (the ratified design.md form ships nowhere). AI-declared.
- [Major ×6] End state 25 / #1814/#1817 already fixed → retired as verified-fixed; End state 25 reduced to the one live needle. Adjudicated.
- [Major ×3, needsDecision] `agents/war-refiner.md` held by Tasks 3 and 9 → dropped from Task 3's reservation; Task 9 sole owner under the ceiling. AI-declared.
- [Major ×2] End state 21 counts step 17's `selection` coordinates → check scoped to step-level keys via `node -e`, count 12. Adjudicated.
- [Major ×2, needsDecision] Task 9 and folded issues without an End state → End state 27 added (three decisive needles); Intent Method names ten tasks and the done-report proof path for #1772/#1804/#1801/#1842. AI-declared.
- [Major, needsDecision] #1620 CHANGELOG corpus widening not ratified by ADR 0046 → retired; Task 2.4 keeps the #1687 seam fix only; the Open-decisions row marked moot. AI-declared (scope-narrowing, not expanding).
- [Major] Six retirement greps not case-insensitive → `-i` added everywhere. Adjudicated.
- [Major] Task 2's tour patterns vs same-phase sibling rewrites → binding guardrail: derive patterns from sibling-free byte runs. Adjudicated.
- [Major ×2] #1738 already documented, #1832 lives in `hooks/validate-auditor-git.sh` and is already fixed → both retired as verified-fixed. Adjudicated.
- [Major, needsDecision] README `--ace` flip had no floor → End state 4 gains `! grep -qiF 'the ace commit is reverted'` + `grep -qi 'bisect'` (1/0 at base). AI-declared.
- [Minor ×26] "SECOND entry" → locate by heading; "four-lens quartet" → five-seat roster; `case` drift 24–30 lines; refiner headroom 110 B; A5 124,912 B; D-ceiling D43+D37a; End state 9 construct-scoped awk; Intent "eight" → "ten"; Pivotal constraint's in-phase-pair exception; base-version refs → 0.21.8/0.21.9; README defaults paragraph model/effort claims flagged for Task 1's survey. All auto-fixed.

## Resolutions applied (grill decisions)
- Self-adjudicated under `--afk`; the loop-budget advisory (≥ 3 needsDecision in round 1) was noted, but every decision was a factual re-derivation or a scope narrowing with one house-convention answer, so no route-upstream was taken.

## Adjudications
<!-- Machine-readable: the WAR Lead reads these rows and threads them into the auditor prompts. -->
- Integration base `a8a9391` (0.21.8, plan B's tip), expected release 0.21.9 (resolve from the slots at land time) supersedes "≥ 0.20.0 … above plan B's release, itself above plan A's" — Phase 3 Task 1 — AI-declared
- `QUALIFIED_HEADERS` widened 9 → 11 with `setup.md` and `docker-gate.md` only; two header edits; `refiner-recovery.md` already a qualified member (line-wrapped phrase) supersedes "six entries … widened to nine … three header edits" — Phase 2 Task 1, End state 11, Notes — AI-declared
- #1620 retired (ADR 0046 excludes CHANGELOG from the posterity corpus); Phase 2 Task 4 = #1687 only, `CHANGELOG.md` dropped from its Files supersedes the CHANGELOG `posterityCorpus()` widening — AI-declared
- #1814, #1817, #1738, #1832 retired as verified-fixed at `c8c22e5` (close on the done-report record) supersedes their Task 4/7/10 slices — AI-declared
- Task 6: both lessons archived; #1522 = appended dated `## Correction` section + description touch, frozen body, stays in `archive/` supersedes "amend the prepush lesson's Fix/Pattern text" — AI-declared
- #1802 re-scoped to requalify "absent = unthrottled dispatch" to the 0.21.7 global-semaphore semantics supersedes the retired `fan-out` literal and the design.md byte-consistency clause — AI-declared
- `agents/war-refiner.md` owned by Phase 1 Task 9 alone (dropped from Task 3's reservation) supersedes the double reservation — AI-declared
- End state 27 (Task 9 needles) added; End states 4, 8, 20, 21, 23, 25 checks re-derived at `c8c22e5`, all retirement greps case-insensitive — AI-declared

## Residual risk
- No probe re-proof after the patch; the Lead sanity-ran each rewritten check at base (all red where they must be red; End state 24 green by design).
- The plan still carries `5aeb8b3`-era prose in places the probes did not name; every task's slice already mandates re-measure-at-the-rebased-base.
- README's defaults paragraph carries model/effort claims (opus/max workers, opus/xhigh auditors) that lag `DEFAULTS`; folded into Task 1's survey duty rather than a new End state.
- Backstops unchanged (four rows).
