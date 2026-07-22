# war-memory tighten hardening — validated `effectiveDate` (invalid/future token rejection) + `--target`-governed preflight verdict

Date: 2026-07-22
Status: draft (Survey Corps) — awaiting /war-machine conversion

## 1. Context — the gap / problem

Source issues: **#989**, **#992**

Two code-verified hardening gaps in the `tighten` path of `skills/_shared/war-memory.mjs`, both
re-verified against the live tree:

**#989 — `effectiveDate` accepts any date-shaped token.** The tighten-eviction young-window floor
(Floor 3 in `tightenPlan`) is driven by `effectiveDate()`, which regex-matches every
`/20\d\d-\d\d-\d\d/g` token across the four frontmatter date keys (`created`/`updated`/`modified`/
`date`) **and** the free-text `phase`/`description` prose, returning the lexicographic max with no
semantic validation. Two failure shapes (both recorded in the code-verified repo lesson
`docs/learnings/effective-date-lex-max-over-all-date-shaped-prose-tokens-overprotects.md`):

- A **future** valid date anywhere in prose (`2099-01-01`) wins the max, yields a negative
  `ageDays`, and the lesson is **permanently** within the 14-day young window — never eligible for
  tighten eviction.
- An **invalid-shaped** token (`2026-13-45`) also wins the lex-max; `tightenPlan`'s
  `Date.parse(r.effectiveDate + 'T00:00:00Z')` yields `NaN` and the NaN guard protects — same
  permanent-protection outcome.

The failure direction is deliberately fail-safe (red-team adjudicated 2026-07-21: over-protects,
never false-evicts), so this is hardening, not a correctness bug — but "permanently ineligible" is
a real hole in the eviction ladder, and the field is a trap for any future consumer that trusts it
as a genuine calendar date (the sibling spec `2026-07-22-lessons-learned-seed-design.md` already
plans to import `effectiveDate` for seed-pack eviction ranking).

**#992 — `--target` never governs whether tighten triggers.** `buildProjection` computes its
`verdict` (`ok`/`warn`/`refuse`) purely against the module constants `WARN_BYTES` (17,000 B) and
`HARD_BYTES`; `tightenPlan` passes that verdict through untouched. The `/lessons-learned tighten`
Preflight (step 1 of the `tighten` mode in `skills/lessons-learned/SKILL.md`) stops the whole pass
on `verdict: "ok"`. So a custom `--target` below 17,000 B, with the live corpus sitting between
the target and the advisory line, reports "nothing to tighten" and never reaches the plan step
where `--target` actually shifts `cutGoalBytes` — `--target` governs only *how much* a triggered
plan strikes, never *whether* the preflight triggers (recorded in
`docs/learnings/tighten-plan-target-flag-does-not-lower-fixed-warn-bytes-preflight-stop.md`).
A stricter operator or CI budget can therefore never bind. The default path (`--target` unset) is
correct today and must stay byte-identical.

Both items live in the same source file (`skills/_shared/war-memory.mjs`) and the same test file
(`skills/_shared/war-memory.test.mjs`), hence one spec.

## 2. Pivotal constraints

- **Prose date sources are load-bearing (binding constraint on #989).** Recurrence stamps live
  ONLY in `phase`/`description` prose (the `/lessons-learned` Phase-2 recurrence-trail read is
  prose-only by design), and the test
  `floor: a prose-only recurrence date is honoured both ways (old ⇒ eligible, recent ⇒ floored)`
  in `war-memory.test.mjs` locks that both ways. Restricting `effectiveDate`'s sources to
  frontmatter keys is **incompatible with the design** — the viable shape is range validation plus
  an explicit future-date decision.
- **Ratified-prose reversal (binding constraint on #992).** The SKILL.md Preflight sentence
  "never a `≤ target` reading (the two diverge at exactly 17,000 B, where render already warns)"
  *ratifies* the fixed-advisory reading this spec retires. The reversal is resolved explicitly in
  the design tree (D6/D7), never silently.
- **`buildProjection`'s render semantics are ratified and shared.** `render-index` (WARN/REFUSE
  messaging) and `archive --candidates` both key off `buildProjection`'s verdict against the fixed
  advisory (ADR 0038's bounded-projection contract). The target-aware reading must not leak into
  them: `buildProjection` keeps its signature and behavior byte-identical.
- **Fail-safe eviction doctrine.** The floors only ever over-protect; no change here may create a
  false-evict of a genuinely young lesson. Eviction remains operator-gated behind the strike-list
  ask regardless.
- **Drift-guard discipline (ADR 0025).** The retired fixed-advisory reading is a default-flip-class
  doc change: every doc surface carrying the OLD reading is enumerated in §5, and the doc-contract
  gains OLD-absent locks, not just new-present locks. Doc-contract anchors are mid-sentence,
  case-tolerant, discriminating tokens — never ordinals or whole-file greps
  ([[marker-completeness-check-needs-row-scoped-grep-not-whole-file-grep-c]]).
- **Both-prompt-surface split rule does not bind** (checked, not assumed): no auditor/refiner/
  servitor behavior changes — `agents/*.md` and `workflow-template.js` are untouched, and no
  hand-mirrored enum (`KNOWN_LAND_DECISIONS`/`HARD_ESCALATION_REASONS`) is touched.
- **Projection byte budget** ([[projection-byte-budget-driven-by-descriptions-not-bodies]]): the
  two amended lesson files' frontmatter `description` lines drive MEMORY.md bytes — rewritten
  descriptions must not grow materially.
- **Repo-learning amendments must keep CI green**: `node skills/_shared/war-memory.mjs lint
  docs/learnings/` is the only thing CI runs and is fail-closed.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| D1 — where #989's validation lives | Inside `effectiveDate()` itself, not in `tightenPlan` Floor 3. Root cause over symptom: `effectiveDate` is the exported construct whose contract says "newest date"; validating at the floor would leave every record carrying a bogus `effectiveDate` any future consumer (seed-pack ranking, per its spec) might trust — the lesson's exact standing warning. Rejected: floor-side validation (leaves the field lying); a second sanitizing wrapper (two constructs for one fact). |
| D2 — validation mechanism | UTC round-trip: a token survives iff `Date.parse(token + 'T00:00:00Z')` is not `NaN`. Verified on Node 24: `2026-13-45`, `2026-00-10`, `2026-12-00` → NaN (this IS the month 01–12 / day 01–31 range check #989 asks for); `2026-02-31` rolls over to a valid early-March timestamp — a benign residual (still a past date that ages normally; see §9). Rejected: a hand-rolled month/day comparator (duplicates what the engine's ISO parser already enforces, catches nothing extra). |
| D3 — future-dated valid tokens | **Discard beyond a skew tolerance**: a token is also rejected when its parse exceeds `now + FUTURE_SKEW_MS` (new module constant, 48 h — comfortably above the ≤ ~26 h worst-case UTC-midnight-vs-local-date skew, far below any real abuse horizon). The max is taken over surviving tokens; none surviving ⇒ `null` ⇒ the existing undated-protected path. This closes the permanent-protection hole (the stray `2099-01-01` is discarded and the lesson's genuine `created` stamp governs) while never false-evicting: a genuinely young lesson's real recent stamp always survives and floors it. Rejected: **keep-fail-safe** (leaves #989's headline defect open — "permanently ineligible" contradicts the eviction ladder; the `archive <slug>` escape hatch exists but is manual and undiscoverable); **clamp-to-now** (a non-fix: `ageDays` reads 0 at every future run ⇒ recreates permanent protection AND poisons the field for calendar-trusting consumers). |
| D4 — `effectiveDate` signature | `effectiveDate(sources = [], { now = new Date() } = {})` — additive options argument; `lessonRecord` keeps calling it with sources only (wall clock is correct at corpus-walk time); tests inject `now` for determinism. `FUTURE_SKEW_MS` stays module-private (the boundary is testable via injected `now`; exporting it is speculative surface). Rejected: threading `now` from `walkCorpus`/`lessonRecord` (plumbing through three layers for a value only tests override). |
| D5 — sources kept as-is | Frontmatter keys + `phase` + `description` prose, unchanged (pivotal constraint; the prose-only floor test is the lock). Rejected explicitly: frontmatter-key-only restriction. |
| D6 — #992 shape | Overload `tightenPlan`'s **returned `verdict`** to the effective-target-aware severity: `refuse` if `buildProjection` says refuse; `warn` if `buildProjection` says warn **or** `currentBytes >= target`; else `ok`. With the default `target = WARN_BYTES` this is provably byte-identical to today (`bytes >= WARN_BYTES` ⟺ projection warn), so the default path is untouched. The SKILL's stop instruction ("`verdict: "ok"` ⇒ stop") survives verbatim — only the field's derivation and the explanatory prose change. Rejected: a new sibling field (`targetExceeded` etc. — two truths in one JSON, prose must teach both, and the existing stop contract already reads `verdict`); threading a warn-bytes parameter into `buildProjection` (mutates a ratified shared construct that render-index/archive also consume). |
| D7 — direction of target influence | `--target` only ever **tightens** the trigger (effective trigger: `currentBytes >= min(target, WARN_BYTES)`); a target *above* the advisory never suppresses the projection `warn` — the advisory is a floor render-index shouts about regardless, and letting a loose target silence it would fork the two surfaces' verdicts. Boundary stays `>=` at the effective bound, mirroring render's own `bytes >= WARN_BYTES` trigger. This is the explicit reversal of the ratified "never a `≤ target` reading" sentence (pivotal constraint 2): the sentence is retired and replaced, and the doc-contract locks OLD-absent. |
| D8 — Floor 3 NaN guard | **Keep** the `Number.isNaN(effMs)` guard in `tightenPlan` as a defense-in-depth backstop. Post-D2 it is unreachable from a real corpus walk (every surviving token round-trips), but `tightenPlan` is exported and takes caller-built records (the test helper `rec()` injects arbitrary `effectiveDate` strings); deleting a one-line guard widens the blast radius of any future `effectiveDate` regression. Its inline comment is reworded from behavior-claim to backstop (§4). |
| D9 — lesson amendments | Both source lessons are amended in the same change, never deleted (temperature-is-location doctrine): `effective-date-lex-max…` gains a MITIGATED note + description update (the `#811`-style convention); `tighten-plan-target-flag…` gains a RESOLVED note + description update (the `war-memory-archive-cross-root-dupe` convention). Descriptions stay within their current byte footprint. |

## 4. Mechanics

### `skills/_shared/war-memory.mjs`

- **`effectiveDate(sources, { now })`**: after collecting regex matches, filter each token through
  the D2 round-trip and the D3 future-skew bound before taking the max; return `null` when no
  token survives. Add `FUTURE_SKEW_MS` as a named module constant next to `TIGHTEN_YOUNG_DAYS`.
  Rewrite the banner comment above `export function effectiveDate` (it currently claims "any
  `20\d\d-\d\d-\d\d` match … lexicographic max" unconditionally) to state the validated contract:
  newest *valid, non-future* date, else null.
- **`lessonRecord`**: call site unchanged (sources-only). Its inline comment ("Newest stamp
  anywhere … null ⇒ undated") gains the validated qualifier.
- **`tightenPlan`**: derive the returned `verdict` per D6 from `buildProjection`'s verdict +
  `currentBytes` + `target`; everything else (`cutGoalBytes`, `cutIndex`, floors, ranking,
  `shortfallBytes`) unchanged. Reword the Floor 3 inline comment per D8 and the `tighten-plan`
  section banner where it describes the verdict as `buildProjection`'s own read.
- **`cmdTightenPlan`**: unchanged (already threads `argv.target` into `tightenPlan`); its comment
  block gains the target-aware-verdict sentence.
- **`buildProjection`**: byte-untouched.

### `skills/_shared/war-memory.test.mjs`

- Extend the `effectiveDate` block: invalid token loses to an older valid token; all-invalid ⇒
  `null`; future token discarded under injected `now` (both the `2099-01-01` prose shape and the
  boundary: a token within the skew tolerance is kept, one beyond it is dropped).
- One end-to-end #989 regression: a `lessonRecord`-built fixture whose `description` cites
  `2099-01-01` and whose `metadata.created` is older than `TIGHTEN_YOUNG_DAYS` appears in
  `tightenPlan(...).eligible` (red on the pre-fix code).
- New `tightenPlan` verdict tests per D6/D7: projection-`ok` fixture + `target` below
  `currentBytes` ⇒ `verdict: 'warn'`; same fixture, default target ⇒ `'ok'`; projection-`warn`
  fixture + target above `currentBytes` ⇒ still `'warn'`. (No existing test pins
  `tightenPlan(...).verdict` — these are additive; the cut-line test's `target: 2000` fixture
  asserts `cutGoalBytes` only and stays green.)

### `skills/lessons-learned/SKILL.md`

- **Preflight (tighten step 1)**: keep the stop instruction (`verdict: "ok"` ⇒ report "nothing to
  tighten" and stop) verbatim; replace the retired fixed-advisory explanation with the
  target-aware one — the verdict now reflects the **stricter** of the advisory line and the
  effective `--target`, so a `--target` below 17,000 B makes the preflight bind at that target,
  while a looser target never suppresses the advisory `warn`. Reword the step-1 parenthetical
  ("pass `--target <bytes>` only for a different bound" undersells — the flag now also governs
  whether the pass triggers).
- **Frontmatter `description`**: the clause "preflight the render-state (already under the
  advisory line means nothing to do)" is a same-meaning sibling of the retired reading (no
  `target` token — a grep for `≤ target` never finds it); reword to "under the effective target"
  or equivalent.
- Worker owns exact phrasing; the doc-contract locks semantics, not bytes.

### `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`

Append tests in the file's established style (`lineWith` + mid-sentence anchors):

- NEW-present: the Preflight stop-condition prose names the effective-target-aware reading
  (discriminating anchors on the stop line, e.g. "stricter" + `--target`; never an ordinal).
- OLD-absent: the phrase `never a \`≤ target\` reading` is gone from SKILL.md, and the frontmatter
  description no longer carries the unconditional "already under the advisory line means nothing
  to do" clause.

### `docs/learnings/` (two amendments, per D9)

- `effective-date-lex-max-over-all-date-shaped-prose-tokens-overprotects.md`: MITIGATED note
  (dated, citing #989) — validation + future-skew filter landed; the "if ever tightened, validate…"
  paragraph's advice is now implemented; description updated to say MITIGATED.
- `tighten-plan-target-flag-does-not-lower-fixed-warn-bytes-preflight-stop.md`: RESOLVED note
  (dated, citing #992) — the verdict is now target-aware; the "Status:" paragraph's
  out-of-scope adjudication is superseded; description updated to say RESOLVED.

### Token sweep (implementation step)

Grep the retired/stale claims and handle every match:
`grep -rn '≤ target\|never a .≤ target\|already under the advisory line' skills/lessons-learned/ docs/learnings/`
and `grep -n 'lexicographic max\|Newest stamp anywhere\|well-formed-but-invalid' skills/_shared/war-memory.mjs`.

**Mandatory manual same-scope survey (grep is a floor, not a ceiling):** after the greps, hand-scan
the target files' same-scope prose/comments/tests for same-meaning siblings that encode the concept
in different words and survive the sweep silently, and list each straggler as a survey-derived
correction. Stragglers already found by this spec's own survey — the implementation must re-run the
survey and confirm the list is complete:

1. `skills/lessons-learned/SKILL.md` frontmatter `description` — "(already under the advisory line
   means nothing to do)": same-meaning sibling with no `target` token.
2. `skills/lessons-learned/SKILL.md` tighten step 1 parenthetical — "pass `--target <bytes>` only
   for a different bound": undersells the flag's new preflight role; no retired-phrase token.
3. `skills/_shared/war-memory.mjs` `lessonRecord` inline comment — "Newest stamp anywhere …" (does
   not contain "lexicographic").
4. `skills/_shared/war-memory.mjs` `tighten-plan` section banner — "a lesson whose EFFECTIVE date
   is within TIGHTEN_YOUNG_DAYS" block describes the pre-validation contract in its own words.
5. `skills/_shared/war-memory.mjs` `cmdTightenPlan` comment block — describes the JSON without the
   target-aware verdict.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/_shared/war-memory.mjs` | `effectiveDate` validation + future-skew filter (+ `FUTURE_SKEW_MS`); `tightenPlan` target-aware verdict; comment rewrites (§4) |
| `skills/_shared/war-memory.test.mjs` | New/extended `effectiveDate`, #989 regression, and `tightenPlan` verdict tests |
| `skills/lessons-learned/SKILL.md` | Preflight prose + step-1 parenthetical + frontmatter description clause (OLD reading retired) |
| `skills/lessons-learned/lessons-learned-doc-contract.test.mjs` | NEW-present + OLD-absent locks on the Preflight prose |
| `skills/_shared/doc-cli-consistency.test.mjs` | **No edit expected** — must stay green (its `jsVerbsObject` extraction re-reads the live `VERBS`; the reworded prose introduces no new verb claim). Listed as a verified-unchanged surface, not a change |
| `docs/learnings/effective-date-lex-max-over-all-date-shaped-prose-tokens-overprotects.md` | MITIGATED note + description update |
| `docs/learnings/tighten-plan-target-flag-does-not-lower-fixed-warn-bytes-preflight-stop.md` | RESOLVED note + description update |

## 6. New domain terms (CONTEXT.md)

None. "Effective target" is used descriptively in prose; it does not warrant a glossary entry.

## 7. Recommended ADRs

None. No architectural decision is created or reversed at ADR grain: ADR 0038's bounded-projection
contract is untouched (`buildProjection` byte-identical), and the ratified-prose reversal (D7) is a
SKILL-level contract change carried by the doc-contract test, not an ADR.

## 8. Open risks / implementation notes

- **`effectiveDate` becomes wall-clock-dependent** (via the default `now`): a lesson whose only
  stamp is future-dated parses as undated today and as dated once the clock passes it — benign
  (protection either way until the stamp ages), but tests must always inject `now`, and fixture
  dates in existing tests are all past-dated against any real clock (verified: the prose-only
  floor test uses 2026-01/2026-07 stamps), so no existing test rots as time advances.
- **Sibling-spec compatibility**: `2026-07-22-lessons-learned-seed-design.md` plans to import
  `effectiveDate` from `war-memory.mjs`. The additive options argument is source-compatible, and
  validated output strictly improves its planned oldest-first ranking. No coordination needed
  beyond normal landing order.
- **The `2026-02-31` rollover residual** (D2): tokens with a day valid at format level but invalid
  for the month parse to a rolled-over nearby date. Deliberately accepted — the error is bounded
  to ~3 days on a past date and cannot re-create permanent protection.
- **Doc-contract anchor hygiene**: new locks must pick tokens that appear exactly once in the
  gripped line ([[structure-test-check-f-locks-presence-anywhere-not-intended-location]]); the
  worker should temp-break each new assertion (revert the prose, watch it red) per the repo's
  weak-assertion lesson.
- The two lesson amendments change MEMORY.md projection rows via their descriptions — keep the
  rewritten descriptions at or under their current length; run
  `node skills/_shared/war-memory.mjs lint docs/learnings/` locally before landing.

## 9. Non-goals / deferred

- **Restricting `effectiveDate` sources to frontmatter keys** — incompatible with the design
  (prose recurrence stamps are load-bearing and test-locked); explicitly rejected, not deferred.
- **Exact calendar validation** (rejecting `2026-02-31` outright) — deferred with no trigger; the
  rollover residual is bounded and harmless (D2, §8).
- **Changing `render-index`/`archive` advisory semantics or `buildProjection`'s signature** —
  out of scope by pivotal constraint; the fixed advisory remains the render-side contract.
- **A `--target` that loosens the trigger** (suppressing the advisory `warn`) — rejected (D7).
- **A CI budget-check feature consuming the target-aware verdict** (the future feature the #992
  lesson warns about) — deferred until someone wants it; this spec only makes it *possible*.
- **`/lessons-learned tighten` flow changes beyond the Preflight prose** — the Plan/Gate/Execute/
  Report steps are untouched; `cutGoalBytes` already honored `--target`.

## 10. Validation criteria

1. **Invalid-token rejection**: in `skills/_shared/war-memory.test.mjs`,
   `effectiveDate(['2026-01-01', 'note 2026-13-45'])` returns `'2026-01-01'`, and an
   all-invalid-token input returns `null` (routing to the undated-protected floor).
2. **Future-token rejection**: with an injected `now`, a `2099-01-01` prose token is discarded and
   an older valid stamp wins; a token within `FUTURE_SKEW_MS` of `now` is kept; only-future-tokens
   input returns `null`.
3. **#989 end-to-end regression**: a `lessonRecord` fixture citing `2099-01-01` in its
   `description` with `metadata.created` older than `TIGHTEN_YOUNG_DAYS` appears in
   `tightenPlan(...).eligible`; the test is red against the pre-fix `effectiveDate`.
4. **Prose sources preserved**: the existing test
   `floor: a prose-only recurrence date is honoured both ways (old ⇒ eligible, recent ⇒ floored)`
   passes **unmodified**.
5. **Target-aware verdict**: `tightenPlan` on a projection-`ok` fixture with `target` below
   `currentBytes` returns `verdict: 'warn'`; the same fixture with the default target returns
   `'ok'`; a projection-`warn` fixture with `target` above `currentBytes` still returns `'warn'`
   (the advisory floor is never suppressed).
6. **Default path byte-identical / `buildProjection` untouched**: the existing render-verdict
   tests (`render: verdict ok below advisory budget` and its warn/refuse siblings) pass
   unmodified, and `buildProjection`'s signature carries no new parameter.
7. **Doc-contract locks**: `lessons-learned-doc-contract.test.mjs` gains passing tests asserting
   (a) the Preflight stop prose names the effective-target-aware reading and (b) OLD-absent — the
   retired "never a `≤ target` reading" phrase and the unconditional "already under the advisory
   line means nothing to do" description clause are gone; each new assertion is temp-break-proven.
8. **`doc-cli-consistency.test.mjs` green unmodified** — the reworded SKILL prose claims no verb
   absent from `war-memory.mjs`'s `VERBS`.
9. **Redaction lint clean**: `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0
   after both lesson amendments.
10. **Full suite green**: `node --test 'skills/**/*.test.mjs'` passes.
