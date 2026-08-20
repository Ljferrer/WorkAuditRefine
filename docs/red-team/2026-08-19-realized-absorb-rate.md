# Red Team — docs/plans/2026-08-19-realized-absorb-rate.md (2026-08-19)
**Verdict:** ADJUDICATED — every blocker and needsDecision was patched in place and Lead-stamped in one grill sweep; no probe re-proof was run on the patches (ADR 0043).
**Rounds:** 1
<!-- Cumulative grill sweeps: the Step-1 seed + this run's sweeps. Strict form — the next run's seeding re-reads exactly this line; an integer, nothing else. -->

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source (merged Part-1→Part-2 arm; the plan is its own source of truth), consistency-placeholders, dependency-feasibility, intent-vs-plan.
Bespoke: anchor-check (analyzed), baseline-repro (executed), endstate-vacuity (executed), default-flip-old-absent (executed), revert-at-tip-fixture (executed).
Lead-run: backstop-legitimacy (3 rows — all justified, runner+timing named, no `judge:` tags), unguarded-new-mirror, guard-split-deps-edge (both clean: the fallback↔DEFAULTS guard and the count-word guards all carry `deps` edges onto their fact-authoring tasks).
`ff-topology`: not triggered — no plan clause anchors per-task evidence on merge topology (token grep + hand read).
Executed in sandbox: all five executed probes in `git clone --no-hardlinks` throwaways; revert-at-tip-fixture in a fresh synthetic `git init` repo.
Fallback: none — no analyzed-agent fallback engaged; artifactKind `impl-plan`; probes ran on the configured `opus`/`high` tier.
Coverage: 11/11 expected probes on-target; none dropped. Escape guard: pre-run snapshot clean after committing the freshly-authored plan (`f22686b`); post-run `--baseline` diff exit 0 — no probe-authored residue.

## Executed proof
- revert-at-tip-fixture → all four git-mechanism claims **proved**: tip-revert applies clean; a non-tip revert conflicts (constructed); the serial commit→revert-at-tip→commit protocol stays clean on overlapping regions; the `Ace-Subset:` trailer is greppable via `%B`, `--grep`, and `interpret-trailers`.
- endstate-vacuity → all 8 suite check commands green at base; all 4 new-content greps red at base (no vacuous End state).
- baseline-repro → confirmed no existing guard binds the `?? 3` fallback to `DEFAULTS.run.roundLimit`; `prompt-surface-budgets.test.mjs` green at base; plan byte snapshots matched `wc -c`.
- default-flip-old-absent → enumerated the real roundLimit-literal census (see Findings); scratch OLD-absent check demonstrated red on a deliberately-stale surface (assert design adequate once correctly scoped).

## Findings
49 gate findings (32 blockers + 17 needsDecision, heavily cross-probe duplicated) deduplicated to 12 root causes; all patched and adjudicated:

### Critical
- [Critical] Plan's byte census omitted `WORKFLOW_LITERAL_BUDGET` — the prompt-literal share of `workflow-template.js` is 61,920 B against a 62,464 B HARD ceiling (**544 B headroom**) while T1.1/T2.1 both add prompt literals → Pivotal constraints rewritten (suite as live arbiter), byte duties added to T1.1/T2.1 (compression-funded; ADR 0042-cited raise as lawful fallback), A5 rewritten.

### Major
- [Major] roundLimit census wrong in both directions: 4 of 6 named surfaces carry no literal (`skills/war/SKILL.md` has zero `roundLimit` tokens; `war-auditor.md` zero; war-room SKILL and schemas.md carry only the sibling `redteamRoundLimit` default 3), while `CONTEXT.md` (Retry budget term) and `gastown-design-params.md` (**two** literals in one row) do and were unowned → T1.2 Files+slice rewritten to the verified census.
- [Major] `redteamRoundLimit` sibling collision: shares the DEFAULTS line and contains `roundLimit` as substring; its default 3 stays → word-boundary/exclusion rule pinned in T1.2; sibling literals declared out of scope.
- [Major] `agents/war-refiner.md` at 43 B under its HARD ceiling, edited by T1.2+T1.3 → net-non-increasing duty on T1.3; census correction.
- [Major] Worst-case arithmetic: both-halves-regress ladder costs 8 slots, not 6 → keep 6; D5/A4 rewritten (single-failing-branch funded; double-regression exhausts and demotes by design; 6→8 raise data-priced in backstop row 1).
- [Major] `run.roundLimit` bounds four loops, not one → D5 enumerates all four with per-loop rationale; phase-resume pinned transient-cleared-only.
- [Major] End states 8/9 couldn't falsify the pointer/file pair (link-integrity sweeps links, never existence) → ES9 re-anchored: filename pinned (`touched-doc-accuracy.md`), check greps the file's own trichotomy content.
- [Major] Doc tasks T1.3/T2.2 had zero validation (the plan's own rule-8 "silence" arm) → Done-when greps added (NEW-present + OLD-absent paired where a retired literal exists), de-mirror duty + plan-faithfulness-seat responsibility in the slices; backstops kept genuinely-deferred-only.
- [Major] Two distinct three→four count flips conflated; ES7 pointed at the wrong guard; the authoring-rule flip had no OLD-absent owner; a third rule-count mirror (`plan-interview.md`'s "rules 5–7") was unnamed → ES6/ES7 split by flip; T3.1/T3.2 slices name all three mirrors and both guard homes (`workflow-scaffold.test.mjs` count pins; `war-pipeline-structure.test.sh` retired-count arms).
- [Major] Intent sufficiency: the phase-close sweep's whole-queue discard carries the same fragility and no End state touches it → declared out with honest rationale (bounded-by-construction queue; the motivating sweep losses were infra deaths), Method scoped "on the per-task ace path", tracked as #1549.
- [Major] Mid-bisection reverts invalidate the deferred merge-dispatch revert clause (double-revert exits 1) → T1.1/D1 rework: bisection loop owns in-loop reverts; the merge clause fires only for a final unreverted failed tip; no sha reverted twice.
- [Major] Tip-only trailer preflight fails the commit→revert→death window (re-commits a failed subset) → D6/guardrail/T1.1: preflight scans the bisection range, never the tip alone.

### Minor (17 — auto-noted; the non-duplicates)
- Filing-prompt rows render title/task/rationale only — no `file`/`line` for the agent to cluster on → T2.1 slice extends the rendered rows.
- `schemas.md` has no existing `FOLLOWUP_FILING_RESULT` row → T2.2 says **add**, not update.
- Two Phase-1 domain terms had no CONTEXT.md landing task → T1.3 adds both glossary rows.
- Phantom decision ids "(D12)"/"(D31)" → reworded to "the war-strategy D12 staleness rule" / "the `skill-doc-contracts.test.mjs` D31 pin".
- ES6 "4th spine probe" wording could read as a `SPINE`-array edit → qualified "drift-guard spine probe — Lead-run, never a `SPINE` array member".
- ES10's hosting-suite latitude made its check non-discriminating → hosting pinned to `skill-doc-contracts.test.mjs`; latitude entry removed.
- T1.3's "these are budgeted surfaces" over-claimed (3 of 7 Files unbudgeted) → byte duty scoped to the four budgeted Files.
- Preflight command shape absent from the latitude list → added (range-scan is the floor).

## Resolutions applied (grill decisions)
- Byte funding (Critical) → compression-funded additions with semantic-diff review discipline; ADR 0042-cited raise as lawful fallback; T2.1 inherits T1.1's headroom (fallback anticipated, not an escalation); census de-mirrored to the suite → Pivotal constraints, T1.1/T2.1/T1.3 slices, A5, guardrails, Notes.
- Worst-case arithmetic → keep 6, fix the justification wording; raise 6→8 data-priced on `/war-review` trailer evidence → D5, A4, backstop row 1.
- Four-loop side effect → accept-and-document with per-loop rationale; clamp and knob-split rejected (covert second constant / config cascade) → D5.
- Doc-task validation → Done-when floor commands + relocated seat duty (backstop row would render "unexecuted" each land — mislabeled) → T1.3, T2.2.
- Sweep scope → declare-out composed with issue filing: #1549 (sweep-discard bisection), #1550 (item-5 ask disposition; survives #1547's closure) → Non-goals, Method.

## Adjudications
- `run.roundLimit` default lands at **6**; the both-halves-regress ladder (8 slots) exhausts and demotes by design — supersedes "worst case … = 6 slots / fully fundable" as justification — D5/A4 — operator-ratified (2026-08-19)
- T1.2 roundLimit census = `war-config.mjs` DEFAULTS, `workflow-template.js` `?? 3` (T1.1), `CLAUDE.md` execution-architecture sentence, `agents/war-refiner.md` roundLimit bullet, `CONTEXT.md` **Retry budget** term, `gastown-design-params.md` **round_limit** row (two literals) — supersedes the war-SKILL/war-room/schemas/war-auditor enumeration — operator-ratified (2026-08-19)
- `run.redteamRoundLimit` default 3 is out of scope and stays 3; OLD-absent regex anchors a word boundary before `roundLimit` — Task 1.2 — operator-ratified (2026-08-19)
- Prompt-literal and card additions are compression-funded within the HARD ceilings; a budget raise is lawful only via ADR 0042's justification rule in the commit body and is not a floor violation; `agents/war-refiner.md` is net-non-increasing — supersedes A5's "fits without evictions" — operator-ratified (2026-08-19)
- The trichotomy references file is `skills/war/references/touched-doc-accuracy.md` (name pinned; End state 9 greps its content) — supersedes the name-latitude + link-integrity check — operator-ratified (2026-08-19)
- The presence guard is hosted in `skill-doc-contracts.test.mjs` — supersedes the hosting-suite latitude — operator-ratified (2026-08-19)
- The bisection loop owns in-loop forward-reverts; the merge dispatch's revert clause fires only for a final failed tip not yet reverted; no sha is reverted twice — supersedes the unqualified deferred-revert reading — operator-ratified (2026-08-19)
- The subset preflight scans the bisection range (never the tip alone) — supersedes the tip preflight — operator-ratified (2026-08-19)
- Sweep-discard bisection deferred → #1549; item-5 `ask` disposition deferred → #1550 — supersedes the untracked non-goal rows — operator-ratified (2026-08-19)

## Residual risk
- A1 residual stands: a death between a subset commit and its journal write can still duplicate one commit; panel + forward-revert bound it (backstop row 1 watches via the trailer).
- End state 2 proves the prompts **mandate** the preflight, not that a live agent executes it — accepted; the trailer-format floor plus `/war-review` observability cover the runtime half.
- The 17 auto-noted Minors above; A2/A3/A5 as tagged in the ledger.
- Pre-run escape-guard dirt (the untracked freshly-authored plan) was resolved by committing it as `f22686b` before the snapshot — recorded here for provenance; post-run guard exit 0.
