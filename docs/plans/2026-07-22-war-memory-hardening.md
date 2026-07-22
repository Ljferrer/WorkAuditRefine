# war-memory tighten hardening — validated `effectiveDate` + `--target`-governed preflight verdict

Source spec: `docs/specs/2026-07-22-war-memory-hardening-design.md` (Survey Corps 2026-07-22, from
issues #989, #992; converted `--afk` by /war-machine).

## AI-Commander's Intent

*(AI-declared — drafted `--afk` from the ratified spec per ADR 0014; no operator confirmation ran;
intent is the ceiling, the plan slice is the floor)*

- **Purpose:** close the two code-verified holes in the `tighten` eviction ladder — a stray
  future/invalid date-shaped prose token can no longer permanently protect a lesson from eviction
  (#989), and a custom `--target` below the advisory line now actually governs whether the
  `/lessons-learned tighten` preflight triggers (#992) — while the default path stays byte-identical
  and the fail-safe doctrine (over-protect, never false-evict) is preserved.
- **Method:** root-cause validation inside `effectiveDate` itself (UTC round-trip rejects
  invalid-shaped tokens; a 48 h `FUTURE_SKEW_MS` bound discards future tokens; survivors max, none ⇒
  `null` ⇒ the existing undated-protected path), via an additive `{ now }` options argument — prose
  date sources unchanged; overload only `tightenPlan`'s returned `verdict` to the
  effective-target-aware severity (`refuse` from the projection; `warn` on projection-warn **or**
  `currentBytes >= target`; else `ok`), leaving `buildProjection` byte-untouched; keep the Floor 3
  NaN guard as a backstop; retire the ratified fixed-advisory SKILL prose with default-flip
  discipline (every OLD-reading surface enumerated, doc-contract locks OLD-absent, not just
  new-present); amend both origin lessons in place, never delete.
- **End state:**
  1. `effectiveDate(['2026-01-01', 'note 2026-13-45'])` returns `'2026-01-01'`, and an
     all-invalid-token input returns `null` — both asserted in `skills/_shared/war-memory.test.mjs`.
  2. Under an injected `now`, a `2099-01-01` prose token is discarded and an older valid stamp wins;
     a token within `FUTURE_SKEW_MS` of `now` is kept, one beyond it is dropped; an
     only-future-tokens input returns `null`.
  3. The #989 end-to-end regression is in place: a `lessonRecord`-built fixture citing `2099-01-01`
     in its `description` with `metadata.created` older than `TIGHTEN_YOUNG_DAYS` appears in
     `tightenPlan(...).eligible` — and the test is red against the pre-fix `effectiveDate`.
  4. The existing test `floor: a prose-only recurrence date is honoured both ways (old ⇒ eligible,
     recent ⇒ floored)` passes **unmodified** (prose sources preserved).
  5. `tightenPlan` verdict is target-aware: projection-`ok` fixture + `target` below `currentBytes`
     ⇒ `verdict: 'warn'`; same fixture, default target ⇒ `'ok'`; projection-`warn` fixture + target
     above `currentBytes` ⇒ still `'warn'` (the advisory floor is never suppressed).
  6. `buildProjection` is byte-untouched — signature carries no new parameter, and the existing
     render-verdict tests (`render: verdict ok below advisory budget` and its warn/refuse siblings)
     pass unmodified.
  7. `skills/lessons-learned/SKILL.md`'s Preflight teaches the effective-target-aware stop; the
     retired "never a `≤ target` reading" sentence and the unconditional "already under the
     advisory line means nothing to do" description clause are gone;
     `lessons-learned-doc-contract.test.mjs` carries passing NEW-present + OLD-absent locks, each
     temp-break-proven.
  8. `skills/_shared/doc-cli-consistency.test.mjs` is green **unmodified** (verified-unchanged
     surface — the reworded prose claims no verb absent from `VERBS`).
  9. Both origin lessons in `docs/learnings/` carry dated MITIGATED (#989) / RESOLVED (#992) notes
     with descriptions at or under their current byte length, and
     `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
  10. `node --test 'skills/**/*.test.mjs'` passes.
  11. Release lands last: all four version slots in lock-step at the next free patch above the live
      integration base.

## Build order (for /war)

1. **Phase 1 — Hardening + doc retire + lesson amendments** (waves: 1.1 → 1.2 ∥ 1.3)
2. **Phase 2 — Release** (trailing, own phase)

## Phase 1 — Hardening + doc retire + lesson amendments

### Task 1.1: `effectiveDate` validation + `tightenPlan` target-aware verdict (+ tests)

- Files: `skills/_shared/war-memory.mjs`, `skills/_shared/war-memory.test.mjs`
- Plan slice: In `effectiveDate`: change the signature to
  `effectiveDate(sources = [], { now = new Date() } = {})` (D4 — additive options; `lessonRecord`'s
  call site stays sources-only); after collecting regex matches, keep a token iff
  `Date.parse(token + 'T00:00:00Z')` is not `NaN` (D2 — the engine's ISO parse IS the month/day
  range check; the `2026-02-31` rollover residual is accepted per spec §8) **and** its parse does
  not exceed `now + FUTURE_SKEW_MS` (D3); take the max over survivors, none surviving ⇒ `null`
  (routes to the existing undated-protected path). Add `FUTURE_SKEW_MS` (48 h) as a named,
  **non-exported** module constant next to `TIGHTEN_YOUNG_DAYS` (D4 — module-private; the boundary
  is testable via injected `now`). In `tightenPlan`: derive the returned `verdict` per D6/D7 —
  `refuse` if `buildProjection` says refuse; `warn` if `buildProjection` says warn **or**
  `currentBytes >= target`; else `ok` (equivalently: trigger at
  `currentBytes >= min(target, WARN_BYTES)`; a target above the advisory never suppresses the
  projection `warn`; with the default `target = WARN_BYTES` this is provably byte-identical to
  today). Everything else in `tightenPlan` (`cutGoalBytes`, `cutIndex`, floors, ranking,
  `shortfallBytes`) unchanged; **keep** the `Number.isNaN(effMs)` Floor 3 guard, rewording its
  inline comment from behavior-claim to defense-in-depth backstop (D8 — `tightenPlan` is exported
  and takes caller-built records). `buildProjection` byte-untouched. Comment rewrites (spec §4):
  the banner above `export function effectiveDate` states the validated contract (newest *valid,
  non-future* date, else null — no longer the unconditional "any match … lexicographic max"
  claim); `lessonRecord`'s inline comment ("Newest stamp anywhere …") gains the validated
  qualifier; the `tighten-plan` section banner and the `cmdTightenPlan` comment block gain the
  target-aware-verdict sentence (`cmdTightenPlan` code unchanged — it already threads
  `argv.target`). Code-side token sweep:
  `grep -n 'lexicographic max\|Newest stamp anywhere\|well-formed-but-invalid' skills/_shared/war-memory.mjs`,
  handle every match, then the **mandatory manual same-scope survey** (grep is a floor) with the
  spec's known stragglers re-confirmed: the `lessonRecord` inline comment, the `tighten-plan`
  section banner, the `cmdTightenPlan` comment block (spec §4 survey items 3–5). Mapped tests
  (spec §10 criteria 1–6): extend the `effectiveDate` block — invalid token loses to an older
  valid token; all-invalid ⇒ `null`; future token discarded under injected `now` (both the
  `2099-01-01` prose shape and the skew boundary: within kept, beyond dropped); only-future ⇒
  `null`. One end-to-end #989 regression per End state 3 (must be red against the pre-fix
  `effectiveDate` — the worker runs it against the pre-fix code and records that red output in its
  done-report as a REQUIRED probe artifact; `tightenPlan` gets an injected `now`, `lessonRecord`
  builds with the wall-clock default — its `2099-01-01` token is future against any real clock,
  per spec §8). New additive
  `tightenPlan` verdict tests per End state 5. Existing tests that must pass unmodified: the
  prose-only recurrence floor test (End state 4), the render-verdict trio (End state 6), and the
  cut-line `target: 2000` test (asserts the cut-line fields, never `verdict` — verified at plan
  time).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: SKILL.md Preflight retire + doc-contract locks

- Files: `skills/lessons-learned/SKILL.md`, `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`
- Plan slice: In the `tighten` mode's Preflight (step 1): keep the stop instruction
  (`verdict: "ok"` ⇒ report "nothing to tighten" and stop; no later step runs) **verbatim**;
  replace the retired fixed-advisory explanation — the sentence ending
  "never a `≤ target` reading (the two diverge at exactly 17,000 B, where render already warns)" —
  with the target-aware one: the verdict now reflects the **stricter** of the advisory line and the
  effective `--target`, so a `--target` below 17,000 B makes the preflight bind at that target,
  while a looser target never suppresses the advisory `warn`. Reword the step-1 parenthetical
  ("pass `--target <bytes>` only for a different bound" — undersells: the flag now also governs
  whether the pass triggers) and the frontmatter `description`'s clause "(already under the
  advisory line means nothing to do)" to the effective-target reading (survey items 1–2 — neither
  carries a retired-phrase token; the worker owns exact phrasing, the doc-contract locks semantics,
  not bytes). Sixth OLD-reading surface (grill-survey-derived straggler, absent from the spec's
  5-item list and invisible to every sweep token): the Phase-0 budget bullet's sentence
  "`buildProjection`'s `warn` verdict, and the trigger for the `tighten` mode below" equates the
  tighten trigger with the fixed projection verdict — reword it to the **default** trigger (or
  equivalent), since the effective trigger is now the stricter of the advisory and `--target`.
  Doc-side token sweep:
  `grep -rn '≤ target\|never a .≤ target\|already under the advisory line' skills/lessons-learned/`,
  handle every match, plus the mandatory manual same-scope survey re-confirming the two stragglers
  above. Append tests to `lessons-learned-doc-contract.test.mjs` in its established style
  (`lineWith` + mid-sentence, case-tolerant, discriminating anchors — never an ordinal, never a
  whole-file count): NEW-present — the Preflight stop-condition prose names the
  effective-target-aware reading (anchors on the stop line's own tokens, e.g. "stricter" +
  `--target`); OLD-absent — the phrase `never a \`≤ target\` reading` no longer appears in
  SKILL.md, and the frontmatter description no longer carries the unconditional "already under the
  advisory line means nothing to do" clause. Temp-break-prove each new assertion (revert the prose,
  watch it red, restore) and record each red output in the worker done-report as a REQUIRED probe
  artifact. `skills/_shared/doc-cli-consistency.test.mjs` is a verified-unchanged
  surface: no edit, must stay green (the reworded prose introduces no new verb claim).
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

### Task 1.3: origin-lesson amendments (MITIGATED / RESOLVED)

- Files: `docs/learnings/effective-date-lex-max-over-all-date-shaped-prose-tokens-overprotects.md`, `docs/learnings/tighten-plan-target-flag-does-not-lower-fixed-warn-bytes-preflight-stop.md`
- Plan slice: Amend in place, never delete (temperature-is-location; D9).
  `effective-date-lex-max…`: add a dated MITIGATED note citing #989 (the
  `shared-string-constant-quote-literal-byte-anchor-fragility` "MITIGATED (#…, date)" convention)
  — `effectiveDate` now validates via UTC round-trip + the `FUTURE_SKEW_MS` future bound, so the
  "if ever tightened, validate…" paragraph's advice is implemented; update the frontmatter
  `description` to lead with MITIGATED. `tighten-plan-target-flag…`: add a dated RESOLVED note
  citing #992 (the `war-memory-archive-cross-root-dupe-mutates-repo-root` "RESOLVED (<fix>,
  <date>):" convention) — `tightenPlan`'s verdict is now target-aware, superseding the Status
  paragraph's out-of-scope adjudication (the paragraph's historical quote of the retired SKILL
  sentence stays — it is a provenance-dated record, not a live claim); update the description to
  lead with RESOLVED. Both rewritten descriptions stay **at or under their current byte length**
  (projection rows are description-driven); keep `metadata` keys, provenance, and keywords intact.
  The worker verifies the amended claims against its rebased tree (the 1.1 mechanism is in the
  integration tip via the dep wave) and runs
  `node skills/_shared/war-memory.mjs lint docs/learnings/` (fail-closed; the only thing CI runs)
  before done-report.
- requiresTest: false
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: version bump, all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump all four slots to the next free patch above the live integration base at land
  time — `plugin.json` `version`, `marketplace.json` `metadata.version` and `plugins[0].version`,
  and the README `## Status` line (replace-in-place, no badge). `version-slots.test.mjs` is the
  arbiter — never a resolved v-literal from this plan (version literals in plans are
  non-authoritative). Expected integration base: branch `claude/work-audit-specs-plans-4304cd` — a
  stacked campaign base that will have advanced by land time; resolve the patch from the four slots
  as they stand at land. Standalone fallback: a run through plain `/war` (outside the campaign)
  resolves the next free patch from the four slots itself. Release blurb describes the hardening
  additively and precisely — `effectiveDate` now rejects invalid-shaped and beyond-skew future
  date tokens (fail-safe direction preserved: none surviving ⇒ undated-protected), and
  `tighten-plan`'s `verdict` is now the stricter of the advisory line and the effective
  `--target`; say "the preflight can now bind at a stricter `--target`", never "the advisory
  changed" (`buildProjection`, `render-index`, and `archive --candidates` semantics are
  untouched). All prior release prose — including the historical lessons-learned-tighten blurb —
  stays untouched (release prose is exempt from absence sweeps). No rename; no absence-guard
  interactions expected.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- End-to-end #992 fix on the **live** corpus and flow — an operator-run
  `/lessons-learned tighten` with a sub-advisory `--target` proceeding past the preflight when the
  live store sits between the target and 17,000 B · why deferred: needs a live operator, a live
  corpus in that byte range, and the interactive strike-list gate; CI covers the verdict contract
  on fixtures (End state 5) · runner: operator, at the first custom-target tighten invocation
  post-release.
- `FUTURE_SKEW_MS` (48 h) vs real UTC-midnight-vs-local-date skew — no legitimately today-stamped
  lesson ever reads undated/older on a real machine near a date boundary (spec D3 reasons 48 h ≫
  the ~26 h worst case; the live confirmation is inherently environmental) · why deferred: needs a
  real local-timezone wall clock at a date boundary; tests inject `now` · runner: operator
  observation across routine `tighten-plan`/render runs; any hit re-opens D3's constant choice.

## Notes / conscious deviations

- **AFK provenance headings (ADR 0014):** this plan uses `## AI-Commander's Intent` and
  `## Deferred validations (backstops — AI-declared)`. The format exemplars
  (`2026-07-21-lessons-learned-tighten.md`, `2026-07-22-lessons-learned-seed.md`) are
  operator-authored with the plain headings — the heading divergence from them is the deliberate
  `--afk` provenance marker, not drift.
- **Anticipated cross-plan `war-memory.mjs` contention is absent — verified at plan time:** the
  sibling spec `docs/specs/2026-07-22-cli-main-guard-normalization-design.md` §5 lists **no**
  `war-memory.mjs` edit ("No edits to the three already-normalized guards (`war-memory.mjs`, …)";
  "No file overlap with any other survey group"). This plan's slices are construct-scoped to
  `effectiveDate`/`tightenPlan`/`cmdTightenPlan` and never touch the trailing run-as-CLI `main()`
  guard idiom. Residual overlap is only the shared four version slots in each plan's Release phase
  — the campaign roadmap serializes landing.
- **`deps: [1.1]` on Tasks 1.2 and 1.3 are prose-coherence wave edges, not same-file dodges:** 1.2
  documents and 1.3 attests (MITIGATED/RESOLVED, `code-verified` referent checks) behavior that is
  real in the integration tip only after 1.1 merges. File sets are disjoint across all three tasks.
- **Wider old-reading survey ran beyond the spec's grep scope** (drafter survey + independent
  grill survey, adjudications recorded): `CONTEXT.md` (the **Advisory line** / **Tighten pass**
  entries), `README.md`'s `### Tidy the memory` tighten bullet (default-trigger prose; its
  shortfall wording is already target-aware), `skills/war-help/SKILL.md`, `CLAUDE.md`'s "crossing
  the advisory line is the signal" sentence (default path, byte-identical under D6/D7), and
  `skills/lessons-learned/references/migration.md` (zero token hits) — all keep-no-edit;
  README release history is exempt (enumerated-history exemption, release prose never swept). The
  one genuine straggler the surveys found — the Phase-0 budget bullet's trigger sentence — is
  enumerated in Task 1.2. An auditor finding the keep-no-edit surfaces unmodified is confirming
  the design.
- **Process-evidence proofs are done-report artifacts, deliberately uncommitted:** the criterion-3
  red-against-pre-fix run (Task 1.1) and the criterion-7 temp-break reds (Task 1.2) are REQUIRED
  worker done-report artifacts that leave no committed trace by design; gate-audit treats their
  absence as a SOFT cannot-confirm, never a hold
  ([[deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold]]).
- **The #992 lesson's Status paragraph quotes the retired SKILL sentence** — that quote survives
  Task 1.3 as a provenance-dated historical record; the OLD-absent doc-contract lock is scoped to
  `SKILL.md`'s own text, so the quote cannot trip it.
- **Spec imprecision noted, no plan impact:** spec §4 says the cut-line `target: 2000` fixture
  "asserts `cutGoalBytes` only" — it also asserts `slack`/`cutIndex`/`shortfallBytes`/
  `projectedBytes`; the load-bearing claim (it never pins `verdict`) is verified true, so it stays
  green under D6.
- **`requiresPackaging: false` throughout** — no packaging surface in this repo (the packaging
  floor is Dockerfile-gated and would no-op regardless).
- **No new inline mirror, no registry row:** nothing is hand-copied into `workflow-template.js`;
  `agents/*.md`, hooks, and the mirrored enums are byte-untouched (spec pivotal constraint,
  checked).

## Open decisions

None — the spec's design tree (D1–D9) resolved every fork. Self-adjudicated during conversion
(recorded here, not stalled on): 1.2 ∥ 1.3 share wave 2 behind 1.1 (file-disjoint, both
prose-coherence edges); `FUTURE_SKEW_MS` placement follows the spec's directive ("next to
`TIGHTEN_YOUNG_DAYS`", non-exported) with exact position as worker latitude; the release blurb's
framing sentence above is drafter-supplied under the intent ceiling.
