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
  7. `skills/lessons-learned/SKILL.md`'s Preflight teaches the effective-target-aware stop across
     **all six** of its enumerated surfaces (round-1 revision: the stop instruction's "verbatim"
     mandate is re-scoped to the stop **contract**, so the two OLD readings inside it — the
     `buildProjection`'s-own-read attribution at `:62` and the "strictly under the advisory line"
     gloss at `:63` — are retired too): the retired "never a `≤ target` reading" sentence, the
     unconditional "already under the advisory line means nothing to do" description clause, that
     attribution, and that gloss are all gone, while the stop **rule** (`ok` ⇒ report "nothing to
     tighten" and stop; no later step runs) is semantically unchanged.
     `lessons-learned-doc-contract.test.mjs` carries passing locks with **every** enumerated
     surface mechanically covered — **six OLD-absent, one per SKILL.md surface (1–6)**, plus two
     NEW-present (the reworded explanatory sentence at surface 1, and the surviving stop rule) —
     each temp-break-proven. (Round-3 correction: surfaces 2 and 4 DO carry crisp retired tokens
     — `only for a different bound` and `and the trigger for the \`tighten\` mode below` — so they
     get OLD-absent locks, not NEW-present-only coverage.)
  8. The two `CONTEXT.md` surfaces (7–8) are reworded **and mechanically locked**: the
     **Advisory line** and **Tighten pass** entries no longer assert the advisory line is the sole
     trigger, proven by OLD-absent locks on the single-physical-line needles
     `triggered at the advisory line` (`:1077`) and `there is no third` (`:1071` — the full
     "there is no third threshold" sentence **wraps** `:1071→:1072`, so the needle must stop at
     `third`). This requires `lessons-learned-doc-contract.test.mjs` to **load `CONTEXT.md`**: today
     it reads only `SKILL.md` and `references/migration.md`, so without this the two surfaces would
     have zero mechanical check.
  9. The Preflight **invocation itself** threads an operator-supplied target: the fenced `bash`
     command in step 1 carries the flag (e.g. `… --repo "$REPO_ROOT" ${TARGET:+--target "$TARGET"}`),
     omitting it when none is supplied so the default path stays byte-identical. Checkable by a
     **fence-scoped** assertion — a NEW-present lock anchored on that command line inside the step-1
     ```bash block, which is red today and green only on a correct implementation. (A whole-region
     grep for `--target` is **non-discriminating** — it already passes today via the `:61`
     parenthetical; that was the round-2 defect in this condition's first draft.)
  10. `skills/_shared/doc-cli-consistency.test.mjs` is green **unmodified** (verified-unchanged
     surface — the reworded prose claims no verb absent from `VERBS`).
  11. Both origin lessons in `docs/learnings/` carry dated MITIGATED (#989) / RESOLVED (#992) notes
     with descriptions at or under their current byte length, and
     `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
  12. `node --test 'skills/**/*.test.mjs'` passes.
  13. Release lands last: all four version slots in lock-step at the next free patch above the live
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
  `grep -in 'lexicographic max\|Newest stamp anywhere\|well-formed-but-invalid' skills/_shared/war-memory.mjs`
  (**case-insensitive** — round-1 fix: the original case-sensitive `grep -n` returned zero hits
  against a re-cased copy of its own landing sites while every target clause was still present, the
  recorded sentence-case false-negative class),
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

- Files: `skills/lessons-learned/SKILL.md`, `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`, `CONTEXT.md`
- Plan slice: **six** OLD-reading surfaces in `skills/lessons-learned/SKILL.md` plus **two** in
  `CONTEXT.md` — **eight enumerated in total**, labelled surfaces 1–8. **The binding identifier is the
  parenthetical `(surface N)` label, NOT the bullet index** — the bullets below are grouped by edit
  region, so bullet order and surface number deliberately differ. (Round 1 raised the
  SKILL.md count from four to six and reversed the CONTEXT.md keep-no-edit adjudication; round 2
  caught that the first patch left the arithmetic self-contradictory and labels 4–5 dangling. This
  numbering is the binding one — read the ADJUDICATION first.)

  **ADJUDICATION (red-team round 1, blockers A+B — binding).** The original slice ordered the stop
  instruction kept **verbatim**. That was wrong: the frozen region *itself* carries two claims D6
  falsifies. "Verbatim" is hereby **re-scoped to the stop CONTRACT** — the rule `verdict: "ok"` ⇒
  report "nothing to tighten" and stop, and no later step runs, must survive semantically unchanged
  — while its *advisory gloss* is retired like any other OLD reading. Keeping the bytes would ship
  two live false statements inside the very paragraph this plan exists to correct, which End state 7
  and ADR 0025 default-flip discipline both forbid.

  1. **(surface 5, inside the formerly-frozen text) `SKILL.md:62`** — "Read the printed JSON's
     `verdict` field — `buildProjection`'s own read on the **current, live** corpus". After Task
     1.1 the printed `verdict` is `tightenPlan`'s overloaded value, **not** `buildProjection`'s own
     read, so this attribution becomes a false code fact exactly where the operator is told how to
     interpret the field. Reword to the effective verdict (the stricter of the advisory projection
     verdict and the `--target` bound).
  2. **(surface 6, inside the formerly-frozen text) `SKILL.md:63`** — the em-dash appositive
     "— strictly under the advisory line —" glosses `verdict: "ok"` **as** the advisory read. Under
     D6/D7 `ok` means `currentBytes < min(target, WARN_BYTES)`: with `--target 10000` and
     `currentBytes 12000` the corpus **is** strictly under the advisory line yet the verdict is
     `warn`, so the gloss misdescribes the stop condition precisely in the case this plan enables.
     Reword the appositive (e.g. "— strictly under the effective target —"); the stop **rule** is
     unchanged.
  3. **(surface 1) `SKILL.md:65`** — the sentence ending "never a `≤ target` reading (the two
     diverge at exactly 17,000 B, where render already warns)": replace with the target-aware
     reading — the verdict reflects the **stricter** of the advisory line and the effective
     `--target`, so a `--target` below 17,000 B makes the preflight bind at that target while a
     looser target never suppresses the advisory `warn`.
  4. **(surface 2) `SKILL.md:61`** — the step-1 parenthetical "pass `--target <bytes>` only for a
     different bound" undersells: the flag now also governs *whether the pass triggers*.
  5. **(surface 3) `SKILL.md:3`** — the frontmatter `description` clause "(already under the
     advisory line means nothing to do)" → the effective-target reading. **Correction (round 1):**
     this clause *does* carry a retired-phrase token — it is matched by the `already under the
     advisory line` alternative of this task's own sweep. The earlier "neither survey item carries a
     retired-phrase token" claim was true only of the step-1 parenthetical.
  6. **(surface 4) `SKILL.md:146`** — the Phase-0 budget bullet's "`buildProjection`'s `warn`
     verdict, and the trigger for the `tighten` mode below" equates the tighten trigger with the
     fixed projection verdict; reword to the **default** trigger. Invisible to every sweep token,
     hence enumerated explicitly rather than left to the grep.
  7. **(surfaces 7–8, `CONTEXT.md` — round-1 reversal of a keep-no-edit adjudication)** The Notes
     originally adjudicated `CONTEXT.md`'s **Advisory line** / **Tighten pass** glossary entries
     keep-no-edit. Round 1 proved that wrong: `CONTEXT.md:1070` asserts the advisory line "is both
     the **tighten trigger** … and the **exit target** …; there is no third threshold" (the sentence
     spans `:1070–:1072` and the closing clause **wraps** `:1071→:1072`, so locate it by scanning the
     block or grepping `there is no third` — never the full sentence), and
     `:1077` says the tighten pass is "triggered at the advisory line". A sub-advisory `--target` is
     exactly a second, stricter trigger threshold, so both are the *same class* of stale claim as
     the SKILL surfaces — stated more strongly, in the project's definitional glossary. Reword both
     to the effective-trigger reading. (`CONTEXT.md` is added to this task's Files.)

  **Live-flow threading (round 1 blocker B — binding).** The Purpose claims a custom `--target`
  "now actually governs whether the `/lessons-learned tighten` preflight triggers". It does not:
  the Preflight's own invocation (the fenced block at `SKILL.md:57-59` — `:57` opening fence, `:58`
  the command itself, `:59` closing fence) is
  `… tighten-plan --local "$MEM" --repo "$REPO_ROOT"` with **no** `--target`, and `--target` appears
  exactly once in the entire file (the `:61` parenthetical). With the code fix landed and every
  sentence above reworded, the live preflight would still run at the default `WARN_BYTES` unless an
  agent improvised the flag — the Purpose would be satisfied only at the CLI/contract level. So step
  1 must additionally **capture an operator-supplied target from the `/lessons-learned tighten`
  invocation and thread it into the command** (append `--target <bytes>` when supplied; omit it
  otherwise so the default path stays byte-identical). Exact prose is worker latitude; the
  obligation is that the flag reaches the invocation.

  Doc-side token sweep (**case-insensitive** — round-1 fix):
  `grep -rin '≤ target\|never a .≤ target\|already under the advisory line' skills/lessons-learned/`,
  handle every match, plus the mandatory manual same-scope survey re-confirming the surfaces above.
  Append tests to `lessons-learned-doc-contract.test.mjs` in its established style (`lineWith` +
  mid-sentence, case-tolerant, discriminating anchors — never an ordinal, never a whole-file count):
  **NEW-present** — the reworded Preflight prose names the effective-target-aware reading. **Anchor
  it on the reworded explanatory sentence (surface 1/`:65`), NOT on the stop line**: round 1 proved
  the stop instruction physically **wraps lines 63–64**, and `lineWith` is single-line-scoped, so a
  needle spanning the wrap throws — and "stricter" appears nowhere in the file today, so the
  originally-suggested anchor was unsatisfiable alongside the (now re-scoped) verbatim mandate.
  **OLD-absent — every one of the six SKILL.md surfaces gets one** (round-3 correction: the earlier
  draft claimed surfaces 2 and 4 "carry no crisp retired token" and gave them NEW-present-only
  coverage. That was **false** — `:61` carries `only for a different bound` and `:146` carries
  `and the trigger for the \`tighten\` mode below`, both crisp and both on a single physical line.
  NEW-present-only coverage there is exactly the default-flip failure mode: a worker could *append*
  a target-aware sentence and leave the false clause standing, and both locks would pass). One lock
  per retired token, each verified to sit on a single physical line:
  `never a \`≤ target\` reading` (surface 1); the frontmatter description's "already under the
  advisory line means nothing to do" clause (surface 3); `only for a different bound` (surface 2);
  `and the trigger for the \`tighten\` mode below` (surface 4);
  **`buildProjection`'s-own-read attribution** (surface 5); **the `strictly under the advisory line`
  gloss** (surface 6). **Surfaces 7–8 (`CONTEXT.md`) need the test file to LOAD `CONTEXT.md`** —
  today `lessons-learned-doc-contract.test.mjs` reads only `SKILL.md` and `references/migration.md`,
  so without that addition those two surfaces would have zero mechanical check (round-2 finding).
  Lock them OLD-absent on single-physical-line needles: `triggered at the advisory line` (`:1077`)
  and `there is no third` (`:1071`) — the full "there is no third threshold" sentence **wraps**
  `:1071→:1072`, so a needle carrying the word `threshold` can never match. Additionally lock the
  surviving **stop rule** NEW-present (round-2 finding: it is the one clause the plan promises must
  SURVIVE, and absence locks cannot catch an over-rewrite that deletes it), and — **round-3
  correction, the mechanism End state 9 names and the earlier draft never delivered** — add the
  **fence-scoped NEW-present lock** for the threaded `--target`: assert the flag appears on the
  command line **inside the step-1 ```bash fence** (`SKILL.md:57` opening fence, `:58` command,
  `:59` closing fence — scope the assertion to that block, never the whole step-1 region, which
  already contains `--target` at `:61` and would pass today). With those, all eight enumerated
  surfaces, the stop rule, and the threaded invocation each carry a mechanical check.
  Temp-break-prove **every** new assertion (revert that
  one prose site, watch it red, restore) and record each red output in the worker done-report as a
  REQUIRED probe artifact. `skills/_shared/doc-cli-consistency.test.mjs` is a verified-unchanged
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
  citing #992 (the "RESOLVED (<fix>, <date>):" convention — **round-1 correction:** follow
  `docs/learnings/archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it.md`, whose
  `description` opens `RESOLVED (lessons-learned-repo-projection-integrity/2.1): …`. The originally
  cited `war-memory-archive-cross-root-dupe-mutates-repo-root` **does not exist in this repo** —
  seven round-1 probes confirmed it absent from both `docs/learnings/` and `docs/learnings/archive/`;
  it lives only in the operator's untracked local memory root, so a worker in a task worktree cannot
  read the cited exemplar. The MITIGATED exemplar cited above *does* exist and is unchanged)
  — `tightenPlan`'s verdict is now target-aware, superseding the Status
  paragraph's out-of-scope adjudication (the paragraph's historical quote of the retired SKILL
  sentence stays — it is a provenance-dated record, not a live claim); update the description to
  lead with RESOLVED. Both rewritten descriptions stay **at or under their current byte length**
  (**round-1 precision:** the projection row renders
  `truncateToBytes(description, SUMMARY_CELL_BYTES)` with `SUMMARY_CELL_BYTES = 160`
  (`war-memory.mjs:42`, `:373`), so the row is *capped* at 160 B — the #989 description is already
  181 B (unquoted value) and therefore renders truncated either way, while the #992 one is 117 B as a
  VALUE (119 B counting the two surrounding YAML double-quotes — measure the value, not the raw
  line) and has real
  headroom to 160 B before the row grows. Keep the at-or-under-current rule as the safe bound; the
  binding constraint on row size is `SUMMARY_CELL_BYTES`, not the raw description length);
  keep `metadata` keys, provenance, and keywords intact.
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
  "No file overlap with any other survey group" — round-3 note: the second quote is §5's closing
  line; the first sits in a neighbouring section, but the substance holds). This plan's slices are
  construct-scoped to `effectiveDate`/`tightenPlan`/`cmdTightenPlan` and never touch the trailing
  run-as-CLI `main()` guard idiom.
- **IN-CAMPAIGN `CONTEXT.md` contention (red-team round 4 — a consequence of round 1's reversal).**
  The earlier claim that in-campaign overlap was "only the shared four version slots" became false
  the moment round 1 added `CONTEXT.md` to Task 1.2's Files. `CONTEXT.md` is a Files-listed surface
  of **five** campaign siblings — plans 2 (audit-adjudication-threading), 3
  (servitor-wrapup-landed-tip), 4 (merge-land-resilience), 5 (test-floor-target-repo) and 7
  (aftermath-class1-postdelete-verify) — and plan 7's own text notes `CONTEXT.md` is named by all
  nine specs. Two consequences, both recorded rather than waved away:
  1. **The roadmap under-declares this plan.** The campaign roadmap's row 6 "Files owned" column
     omits `CONTEXT.md`, and its shared-file contention row lists the `CONTEXT.md` plans as
     "2, 3, 4, 5, 7" — plan 6 is absent, so the roadmap carries no serialization rationale for this
     plan's glossary edit. That is a roadmap-side record gap, not a landing hazard by itself.
  2. **Anchor drift is one-directional here.** Plans 2–5 have already landed, so their glossary
     terms are present at this plan's base — the cited positions were re-verified at base
     `c9bfad9` and hold. Plan **7** lands *after* this one and must rebase around it. Accordingly
     the rebase-by-named-construct rule below extends to the glossary: locate the **Advisory line**
     and **Tighten pass** entries by their **bolded heading text**, never by `:1070`/`:1071`/`:1077`,
     and re-confirm the two OLD-absent needles (`there is no third`, `triggered at the advisory
     line`) against the post-rebase file before trusting them.
  Residual in-campaign overlap beyond `CONTEXT.md` is the shared four version slots in each plan's
  Release phase — that part the campaign roadmap does serialize.
- **REAL cross-plan contention, found in red-team round 3 (the round-1/2 survey missed it):** the
  contention check above looked only at the `cli-main-guard-normalization` spec. The plan
  `docs/plans/2026-07-22-lessons-learned-seed.md` edits **all three** of this plan's Task 1.2 files
  — its Task 2.2 takes `skills/lessons-learned/SKILL.md` +
  `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`, and its Task 2.3 takes
  `CONTEXT.md`. Worse, seed's Task 2.2 inserts a whole `## seed mode` section *between the `tighten`
  mode section and the sentinel below it* — i.e. immediately adjacent to every OLD-reading surface
  this plan retires — and appends to the very doc-contract test this plan adds OLD-absent locks to.
  **`lessons-learned-seed` is NOT in this campaign's queue** (verified against the campaign ledger:
  the nine plans are auditor-guard-ergonomics → audit-adjudication-threading →
  servitor-wrapup-landed-tip → merge-land-resilience → test-floor-target-repo → *this plan* →
  aftermath-class1-postdelete-verify → cli-main-guard-normalization → war-strategy-structure-lock).
  It sits on its own branch `dev/2026-07-22-lessons-learned-seed`, so **the campaign roadmap does
  NOT serialize it** and the original "roadmap serializes landing" reassurance does not cover it.
  Consequence for whichever lands second: rebase by **named construct**, never by line offset —
  every anchor in this plan (`:3`, `:61`, `:62`, `:63`, `:65`, `:146`, the fenced block at `:57-59`)
  will shift if seed's `## seed mode` section lands first. The doc-contract test file takes appends
  from both plans; appends are additive and should merge, but the OLD-absent needles must be
  re-confirmed against the post-merge SKILL.md rather than assumed.
- **`deps: [1.1]` on Tasks 1.2 and 1.3 are prose-coherence wave edges, not same-file dodges:** 1.2
  documents and 1.3 attests (MITIGATED/RESOLVED, `code-verified` referent checks) behavior that is
  real in the integration tip only after 1.1 merges. File sets are disjoint across all three tasks.
- **Wider old-reading survey ran beyond the spec's grep scope** (drafter survey + independent
  grill survey + red-team round 1): `README.md`'s `### Tidy the memory` tighten bullet
  (default-trigger prose; its shortfall wording is already target-aware), `skills/war-help/SKILL.md`,
  `CLAUDE.md`'s "crossing the advisory line is the signal" sentence (default path, byte-identical
  under D6/D7), and `skills/lessons-learned/references/migration.md` (zero token hits) — these stay
  keep-no-edit; README release history is exempt (enumerated-history exemption, release prose never
  swept). An auditor finding *these* surfaces unmodified is confirming the design.
  **REVERSED by red-team round 1 — `CONTEXT.md` is NOT keep-no-edit.** The original adjudication
  put the **Advisory line** / **Tighten pass** glossary entries in the keep-no-edit set. Round 1
  proved they carry the *same* stale claim in *stronger*, definitional form: `:1070` asserts the
  advisory line "is both the **tighten trigger** … and the **exit target** …; **there is no third
  threshold**", and `:1077` says the tighten pass is "triggered at the advisory line". A
  sub-advisory `--target` **is** a second, stricter trigger threshold, so both sentences become
  false the moment Task 1.1 lands. Both are now enumerated in Task 1.2 (surfaces 7–8) and
  `CONTEXT.md` is in that task's Files.
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
