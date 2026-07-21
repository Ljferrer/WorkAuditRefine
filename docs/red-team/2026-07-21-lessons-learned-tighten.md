# Red Team — 2026-07-21-lessons-learned-tighten (2026-07-21)

**Verdict:** CLEARED-WITH-NOTES — round 1 BLOCKED on one unmapped spec criterion and an
underspecified floor-date source; both grilled to resolution, plan patched in place; round 2 gate
returned zero blockers, zero holes, one consistency Minor (auto-fixed post-gate). Artifact kind:
impl-plan. Source spec: `docs/specs/2026-07-21-lessons-learned-tighten-design.md`.

## Attack surface

Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders,
dependency-feasibility, intent-vs-plan. Bespoke: safe-swap-2col-survival,
live-corpus-byte-projection, query-log-usage-feasibility, floor-data-availability,
baseline-suite-and-cli-green. Executed in sandbox: executable-proof + all five bespoke (throwaway
repo copies + a Lead-staged read-only fixture of the live local memory root; the real root and repo
were never touched by probes). Lead-run checks: backstop-legitimacy (2 entries, both PASS —
concrete deferral reasons, named runner + timing, entry 2 keeps the fixture-corpus bound as its
pre-merge CI proxy); `unguarded-new-mirror` vacuous pass (no task touches
`workflow-template.js`); `default-flip-old-absent` vacuous pass with executed evidence (repo-wide
grep: the only surface carrying the old 3-col header is inside `buildProjection` itself, changed by
the same task). `ff-topology`: not triggered (no merge-topology evidence anchors in the plan; token
grep + hand read).

Fallback: none engaged — `analyzedAgentType: general-purpose` was passed explicitly (no `Explore`
agent in this harness's registry; zero dead dispatches; analyzed results stamped
`dispatchedOn: general-purpose`).

## Executed proof

- `node --test skills/_shared/war-memory.test.mjs`: 56/56 green in sandbox (node v24.17.0);
  `war-memory.mjs lint docs/learnings/` exit 0 (exactly what CI runs).
- `safe-swap.sh` verify vs a hand-written 2-column MEMORY.md (tags + `[repo]` markers + ellipsis
  truncation): PASS on the faithful fixture; FAIL when a row's corpus file is removed (slugs really
  parsed from 2-col rows); FAIL when `[repo]` markers are stripped with a populated repo root
  (repo-completeness hard-fail arm live). The extractors (first `[[slug]]` per `|`-row; `[repo]`
  grep) are column-count-agnostic — the plan's rationale for leaving `safe-swap.sh` untouched holds.
- Live-corpus byte projection (fixture copy of the real local root + `docs/learnings`): baseline
  render 20,978 B / verdict `warn`; simulated 2-col + 160 B summary-cell caps lands under the
  17,000 B advisory with zero rows removed; both hard caps (24,400 B / 200 lines) hold with margin.
- Query log (real, 479 entries / ~336 KB): every line parses; `topSlugs` present; per-entry-deduped
  per-slug hit counting implementable; cross-root twin slugs do double-appear within single entries,
  confirming the dedupe rationale.
- Floor data (106 hot lessons: 24 local + 82 repo): provenance uniform
  (4 user-confirmed / 64 code-verified / 38 agent-unverified); `inboundCiters` exists and works
  (46/106 have ≥ 2 inbound citers); date frontmatter split across `metadata.created` (71) /
  `metadata.updated` (14) / `metadata.modified` (7) / `metadata.date` (7) with 24/106 carrying no
  date key; recurrence stamps exist only as prose (8 lessons) — the evidence that drove the
  effective-date adjudication.
- Verdict boundary: a corpus tuned to exactly 17,000 B renders verdict `warn`
  (`bytes >= WARN_BYTES`) — `ok` requires strictly under.

## Findings

### Round 1 (gate: BLOCKED)

- [Major] coverage-vs-source — spec §10 criterion 1's second clause (safe-swap verify PASSes
  against the *rendered* 2-col fixture, `[repo]`-row hard-fail arm both ways) mapped to no plan
  test. Resolution: rendered-fixture cross-check added to Task 1.1's mapped tests (script invoked,
  never modified).
- [Major, needsDecision] floor-data-availability — the 14-day floor named no date source; four
  competing frontmatter keys, 24/106 hot lessons undated, `lessonRecord` surfaces only `md.date`
  (7/106). Resolution: effective-date rule (see Adjudications).
- [Major, needsDecision] floor-data-availability — recurrence stamps live only in prose, invisible
  to any frontmatter reader; concrete misses reproduced (`war-memory-archive-cross-root-dupe…`
  stamped same-day with no date key). Resolution: prose ISO dates folded into the effective date.
- [Minor ×3 across claims-vs-reality / coverage-vs-source / consistency-placeholders] — CONTEXT.md
  has no "Advisory line" entry to *sharpen*. Resolution: Task 1.3 now ADDs it as a fourth new term;
  End state 5's count corrected to "four new terms and one sharpened entry".
- [Minor] executable-proof — "≤ 17,000 B (verdict `ok`)" self-contradicts at the boundary.
  Resolution: End state 2 + Task 1.1 mapped test now assert `verdict === 'ok'` (strictly under).

### Round 2 (gate: CLEARED-WITH-NOTES)

- [Minor] consistency-placeholders — Task 1.2's preflight stop ("≤ target") diverged from the WARN
  trigger (`>= 17000`) and the verdict-ok exit at exactly 17,000 B. Auto-fixed after the gate run:
  preflight now stops on verdict `ok` (strictly under target), so trigger and done-condition
  partition cleanly.

## Resolutions applied (grill decisions)

- Unmapped criterion → operator chose **Add to Task 1.1** → rendered-fixture safe-swap cross-check
  appended to the mapped tests (PASS on faithful render; FAIL with `[repo]` markers stripped).
- Floor date source → operator chose **Newest stamp anywhere** → effective-date rule written into
  Task 1.1 with fixture cases for the undated and prose-only branches; undated ⇒ PROTECTED.

## Adjudications

- Effective date = the newest ISO date among `metadata.created` / `metadata.updated` /
  `metadata.modified` / `metadata.date` **and** any `20\d\d-\d\d-\d\d` match in the
  `phase`/`description` prose; no parseable date ⇒ protected; `lessonRecord` extended to surface it
  — supersedes "lessons created/recurrence-stamped within 14 days" (Task 1.1 floors).
- Exit / preflight bound = verdict `ok`, bytes strictly under 17,000 / under `--target` — supersedes
  "≤ 17,000 B (verdict ok)" (End state 2, Task 1.1 mapped test, Task 1.2 preflight, backstop 2).
- CONTEXT.md "Advisory line" is ADDED as a fourth new term, not sharpened — supersedes End state 5's
  "three new terms and two sharpened entries" (Task 1.3).

## Residual risk

- Usage-signal bias: the query log records WAR-seat retrievals, not operator reads — accepted spec
  §8 risk; the floors are the designed counterweight.
- Ratified backstops stand: (1) first live `/lessons-learned tighten` invocation — operator, at the
  first over-advisory occurrence post-release; (2) End state 2 on the live corpus — operator
  `render-index` after `/reload-plugins`, also surfaced by any later housekeeping Phase 0.
- The spec retains its pre-adjudication wording (§3 "created/recurrence-stamped", §6 "Sharpen
  'Advisory line'", §10 "≤ 17,000 B") — the plan is the executable artifact; the spec stays the
  dated decision record. `/war` auditors resolve toward the Adjudications above.
- Escape guard: tripped once in round 2 on ` M docs/plans/2026-07-21-lessons-learned-tighten.md` —
  adjudicated a self-confound (the Lead's own in-place plan patches, red-team's designed write
  path): the diff contained only Lead-authored hunks, zero junk sandbox refs locally or on origin.
  Clean (exit 0) after the plan+report commit; verdict finalized only then.
