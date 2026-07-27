# war-memory CLI correctness & lint completeness — close the CLI's last silent-degradation flags, lint the committed archive, and true-up the counters and lesson prose that describe them

**Issues addressed:** #1145, #1135, #1154, #1147 (theme: memory-tooling).
All claims below re-verified against the live tree at spec time (2026-07-26); construct
anchors are named symbols, line numbers are approximate and qualified against the current tip.

## 1. Context — the gap / problem

Four residual defects in the memory tooling family, all code-verified live:

- **#1145 — `cmdQuery` kept the truthy-ternary shape `--target` retired.** In
  `skills/_shared/war-memory.mjs`, `cmdQuery` resolves both flags via
  `argv['top-k'] ? Number(argv['top-k']) : DEFAULT_TOP_K` and
  `argv.budget ? Number(argv.budget) : DEFAULT_BUDGET` (approx. lines 703–704 at tip) — the
  exact silent-degradation shape #1059/#1088 closed for `tighten-plan --target`, whose fixed
  `typeof`-gated three-way resolution sits a few functions below in `cmdTightenPlan`. A bare
  `--top-k` becomes `Number(true) === 1` (silently retrieves one lesson); `--top-k abc`
  becomes `NaN`, so `selectForBudget`'s `slice(0, NaN)` returns empty and the seat prefetch
  block is silently blank. Failure direction is the opposite of `--target`'s: silently
  *inert* retrieval, not over-selection. Blast radius is operator-interactive only — a
  repo-wide check confirms no in-repo caller threads either flag (the Lead prefetch goes
  through `query --queries` JSONL, a different boundary), which is why the
  memory-tooling-hardening plan's own Method fence deliberately deferred this.
- **#1135 — the redaction lint never walks `docs/learnings/archive/`.** `cmdLint`'s
  directory branch is a one-level `fs.readdirSync(t).filter((f) => f.endsWith('.md'))`
  (approx. line 786) — no recursion. Both enforcement surfaces exec the identical
  invocation `lint docs/learnings/`: CI (`.github/workflows/memory-audit.yml`) and the
  gate-discovered wrapper (`skills/_shared/war-memory-lint.test.sh`, whose `exec` line
  passes the directory through untouched). So the committed archive subtree — **113 files
  at tip**, grown from the issue's ~104 — is unlinted on every surface. Worse, CI's
  trigger is `docs/learnings/**`, so an archive-only PR *fires the workflow and reports
  green vacuously*. A per-file lint sweep over all 113 archived lessons at spec time
  reports clean — no live violation is hiding there today, so closing the gap cannot red
  CI at land.
- **#1154 — `archive`'s concept-hub WARN disagrees with every sibling hub counter.** In
  `cmdArchive`, the advisory WARN counts `inboundCiters(records, slug, { hotOnly: true }).length`
  — a **per-record** count, so a citer whose slug is hot in *both* roots (a cross-root
  dupe) counts twice. The other two hub surfaces are slug-deduped: the `inbound` verb
  (`[...new Set(inboundCiters(...).map((r) => r.slug))]` in `cmdInbound`) and
  `tightenPlan`'s Floor 2 (`new Set(inboundCiters(...).map((c) => c.slug)).size`). The
  hub-downgrade WARN can therefore fire on one duplicated citer — observed live
  2026-07-27: warned 2, slug-deduped truth 1.
- **#1147 — the RESOLVED tighten lesson still misstates the zsh mechanism.** Of the three
  staleness items the issue originally carried, a Gate-2 servitor rewrite (commit
  `e3e0766`) already closed items 1 and 2 — verified at tip: the harmful-fix paragraph is
  marked **SUPERSEDED** and the `## RESOLVED` section records `TIGHTEN_TARGET` as retired
  doc-wide. What remains is item 3 only: the failure-mode-3 mechanism sentence in
  `docs/learnings/tighten-target-flag-has-three-independent-silent-degradation-paths.md`
  still says "under zsh the same line collapses to one argv token and the flag is dropped
  entirely", and the file has zero "fuses" hits. Red-team measured the true mechanism
  (`docs/red-team/2026-07-24-memory-tooling-hardening.md`, Minors, "Purpose, zsh
  threading"): zsh does not word-split unquoted parameter expansions, so the expansion
  yields **one fused argv word** (`--target 2000`), which `parseArgv` keys as
  `{"target 2000": true}`, leaving `argv.target === undefined` — the observable outcome
  coincides with "dropped", but the mechanism is fusion, not loss.

One coupling the issues do not name but the live tree forces: fixing #1145 stales two
committed lesson surfaces in the same file family — the sibling lesson
`docs/learnings/cmdquery-topk-budget-share-tighten-targets-pre-fix-truthy-ternary-shape.md`
(present-tense description of the defect this spec closes) and the tighten lesson's own
closing "**Not yet extended to siblings**" paragraph. Leaving either uncorrected recreates
the exact stale-RESOLVED-lesson shape #1147 exists to fix.

## 2. Pivotal constraints

1. **`parseArgv` is frozen.** It is shared by every verb and its bare-flag→`true` mapping
   is load-bearing (`archive --candidates`). Every flag guard binds at the owning verb's
   argv boundary — the memory-tooling-hardening Method fence ("bind each fix at its own
   boundary, never a shared one") still binds.
2. **One shared lint invocation.** CI and the gate wrapper both exec the identical
   `lint docs/learnings/`; archive completeness must land **inside `cmdLint`** so both
   surfaces inherit it with zero divergence and zero workflow/wrapper edits.
3. **Refusal idiom is ratified.** Supplied-but-invalid flag ⇒ exit 1, stderr names the
   flag and the received token (the `requireLocal` / `--target` precedent). The wrapper's
   exit 2 (absent target) stays distinct.
4. **Hub semantics are slug-deduped.** Two of the three hub surfaces already dedupe by
   slug; the archive WARN is the outlier and must converge, not the reverse.
5. **Node ≥ 24 floor** (repo-wide): `fs.readdirSync(dir, { recursive: true })` is
   available; no dependency or manual walker needed.
6. **Lead prefetch untouched.** `cmdQueriesBatch` (`query --queries` JSONL, `spec.topK ??
   DEFAULT_TOP_K`) is a typed programmatic boundary with no truthy-ternary defect; `/war`'s
   prefetch must remain byte-identical.
7. **Repo lessons are worker-editable; the local root is not.** `docs/learnings/` edits
   are ordinary reviewed diffs guarded by the redaction lint; the untracked local memory
   root is outside any worker's write scope and routes through `/lessons-learned`.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| D1 | Fix shape for `--top-k`/`--budget` (#1145) | Extend the landed `--target` resolution verbatim in shape: default on absent flag; `typeof === 'string'`-gated `Number()`; `Number.isFinite(t) && t > 0` binds; else loud exit 1 naming flag + received token. One block per flag, inside `cmdQuery` only. |
| D2 | Where the #1145 guard fires | At the top of `cmdQuery`, **before** the corpus walk — a refused invocation writes nothing (no `appendQueryLog` line, no stdout block). |
| D3 | Accept non-integer `--top-k`? | Mirror `--target`'s predicate exactly (any finite positive number). No integer check — `slice(0, 3.5)` truncates harmlessly, and symmetry with the ratified guard beats a bespoke stricter rule. |
| D4 | Should `archive/` be linted? (#1135's open question) | **Yes.** Archived lessons are committed, published, queryable-forever content; "temperature is location" is not a redaction boundary. The vacuous-green CI shape on archive-only PRs decides it. |
| D5 | Recursion mechanism | `fs.readdirSync(t, { recursive: true })` in `cmdLint`'s directory branch, keeping the `.endsWith('.md')` filter (correct on the subdir-prefixed relative paths recursion returns). CI workflow and wrapper: **no edit** — the shared invocation inherits it. |
| D6 | Lint scope side effect on the local root | Accepted: the no-arg default target (local root) now lints its own `archive/` too. Local hits are operator-interactive information, never a CI/gate surface — consistent, not collateral. |
| D7 | Hub WARN count (#1154) | Slug-dedupe at the WARN site: `new Set(hotInbound.map((r) => r.slug)).size` drives both the `>= 2` predicate and the count printed in the WARN message. `hotOnly: true` stays (the WARN counts lost hot index rows; a cross-root dupe citer is one slug, one row of meaning). |
| D8 | #1147 remaining scope | Two-sentence mechanism correction in the repo-root tighten lesson's failure-mode-3 item: replace the collapse/"dropped entirely" claim with the red-team-measured fuse mechanism (one fused argv word; `parseArgv` keys `{"target 2000": true}`; `argv.target` stays `undefined`; outcome *coincides* with dropped). Corrected wording sourced from the red-team report and the plan Purpose, not re-derived. |
| D9 | Lesson-truth coupling of #1145 | Same change set stamps the sibling `cmdquery-topk-…-truthy-ternary-shape` lesson RESOLVED (description prefix + appended `## RESOLVED` section naming the fix, mirroring the tighten lesson's landed shape) and rewrites the tighten lesson's "Not yet extended to siblings" paragraph to past tense pointing at this fix. |
| D10 | `--top-k=5` / `--budget=4096` (`=`-attached) | Stays silently ignored — the documented CLI-wide `parseArgv` residual (`--target=2000` precedent), explicitly frozen. Not reopened. |

## 4. Mechanics

### `cmdQuery` flag guards (#1145)

At `cmdQuery` entry, replace the two truthy ternaries with two instances of the ratified
three-way resolution (the `cmdTightenPlan` block is the reference implementation — copy its
shape, not a shared helper; two sites in one file do not earn an abstraction):

- flag absent (`undefined`) → `DEFAULT_TOP_K` (10) / `DEFAULT_BUDGET` (4096), byte-identical
  to today's flagless path;
- `typeof === 'string'` and `Number.isFinite(t) && t > 0` → the value binds;
- anything else (bare flag → boolean `true`; non-numeric; zero; negative) →
  `war-memory query: --top-k requires a positive count (got '<token>')` (resp. `--budget
  requires a positive byte count`) on stderr, exit 1, **before** `walkCorpus` — no query-log
  append, no output block.

**Retirement sweep (completeness floor, not a ceiling):** after the change, grep
`skills/_shared/war-memory.mjs` for the truthy-ternary numeric-flag shape (`? Number(` on
an `argv` read) and handle every match — expected surviving matches: exactly the one
`typeof`-gated `--target` line (its `Number()` sits in the *guarded* arm, a sanctioned
substring — do not false-red on it). Then, per the mandatory survey rule, **hand-scan the
same scope** — `cmdQuery`/`cmdQueriesBatch`'s comments, the tests that name these flags in
`war-memory.test.mjs`, and the sibling verbs' flag reads — and list each straggler
(a comment or test title still describing the pre-fix behavior) as a survey-derived
correction. The `spec.topK ?? DEFAULT` JSONL reads in `cmdQueriesBatch` are out of scope
by D6/constraint 6.

### `cmdLint` recursive walk (#1135)

In `cmdLint`'s directory branch, swap the one-level `readdirSync(t)` for
`readdirSync(t, { recursive: true })`; filter and `path.join` unchanged. Everything else
is inherited: CI (`memory-audit.yml`) and the wrapper (`war-memory-lint.test.sh`) keep
their byte-identical invocations; the wrapper's exit-2 existence guard and exit-code
propagation are untouched. The `catch { continue }` fail-open on an unreadable target is
deliberately preserved (the wrapper is the loud surface for that).

### `cmdArchive` hub WARN dedupe (#1154)

In `cmdArchive`'s advisory concept-hub WARN, compute
`const hubCiters = new Set(hotInbound.map((r) => r.slug)).size` and use it for both the
`>= 2` predicate and the printed count. Update the adjacent comment to say the count is
slug-deduped to match the `inbound` verb and `tightenPlan` Floor 2 (the three surfaces
must not fork again).

### Lesson prose corrections (#1147 + D9)

In `docs/learnings/tighten-target-flag-has-three-independent-silent-degradation-paths.md`,
failure-mode-3 item: replace the "collapses to one argv token and the flag is dropped
entirely" sentence pair with the fuse mechanism (zsh, lacking `SH_WORD_SPLIT`, does not
word-split the unquoted `${TIGHTEN_TARGET:+…}` expansion → one fused argv word
`--target 2000` → `parseArgv` keys `{"target 2000": true}` → `argv.target` stays
`undefined`; the observable end state coincides with never setting the variable). Keep the
"same silent outcome" clause — it was the accurate part.

**Stale-wording sweep (completeness floor, not a ceiling):** grep the lesson file for
`dropped` and `collapses` and handle every match — a *mechanism-position* claim (the flag
is lost) is a defect; a negated/coincides-with mention in the corrected wording is exempt.
Then, per the mandatory survey rule, **hand-scan the same scope** — the file's full body
(frontmatter description, all three failure-mode items, "Why this matters", `## RESOLVED`,
the residual paragraphs) plus the sibling lesson
`cmdquery-topk-budget-share-tighten-targets-pre-fix-truthy-ternary-shape.md` — for
paraphrase stragglers that describe the zsh failure as flag loss without the literal
tokens, listing each as a survey-derived correction. (Spec-time survey result: the sibling
lesson carries no zsh claim; the local-root recurrence copy *does* carry the stale
"silently dropping the flag" wording — deferred, see §9.)

Per D9, in the same change set: stamp the sibling cmdquery lesson RESOLVED (description
prefix + appended `## RESOLVED` section citing this spec's fix and its tests) and rewrite
the tighten lesson's closing "Not yet extended to siblings" paragraph to record that the
extension has now landed.

## 5. Surface changes

| File | Change |
|------|--------|
| `skills/_shared/war-memory.mjs` | `cmdQuery`: guarded `--top-k`/`--budget` resolution before the corpus walk. `cmdLint`: recursive directory walk. `cmdArchive`: slug-deduped hub WARN count + comment. |
| `skills/_shared/war-memory.test.mjs` | Spawn-the-CLI refusal regressions for both `cmdQuery` flags mirroring the `--target` `refusal (#1059)` family (bare, non-numeric, zero, negative × both flags), unchanged-path cases (flagless defaults byte-identical; valid value binds), no-query-log-on-refusal assertion. Lint fixtures with an `archive/`-nested violation (CLI case red pre-fix) and a clean nested case; wrapper meta-test extended to the nested-violation fixture. Archive hub-WARN dedupe regression (cross-root-dupe citer ⇒ no WARN; two distinct citers ⇒ WARN counting 2). |
| `skills/_shared/war-memory-lint.test.sh` | **No edit** (verified: its `exec … lint "$TARGET"` inherits recursion). |
| `.github/workflows/memory-audit.yml` | **No edit** (decision recorded — the shared invocation is the point; the vacuous-green archive-only-PR shape closes inside `cmdLint`). |
| `docs/learnings/tighten-target-flag-has-three-independent-silent-degradation-paths.md` | Failure-mode-3 fuse-mechanism correction; "Not yet extended to siblings" paragraph updated. |
| `docs/learnings/cmdquery-topk-budget-share-tighten-targets-pre-fix-truthy-ternary-shape.md` | RESOLVED stamp (description prefix + `## RESOLVED` section). |

## 6. New domain terms (CONTEXT.md)

None.

## 7. Recommended ADRs

None — every decision here converges an outlier onto an already-ratified convention
(the `--target` refusal idiom, the shared-invocation lint gate, slug-deduped hub counting);
no new binding precedent is set.

## 8. Open risks / implementation notes

- **Recursion widens the linted set on the local root too** (D6): a pre-existing personal
  archive with a redaction hit will start failing interactive bare `lint` runs. That is
  the lint doing its job; it never reaches CI or the gate. Worth one line in the change
  description, nothing more.
- **Ordering inside the change set matters for the lessons:** the D9 RESOLVED stamp must
  land with (or after) the `cmdQuery` fix, never before — a RESOLVED-stamped lesson over a
  live defect is the exact inversion #1147 documents.
- **The archive-clean claim is time-of-spec:** re-run
  `node skills/_shared/war-memory.mjs lint docs/learnings/` with the recursive walk in
  place before landing; if the archive has picked up a violation since, it must be
  redacted in the same change (fail-closed — never waived in prose, per ADR 0017).
- The `refusal (#1059)` test block's comment prose describes `--target` history; the new
  cases should get their own banner rather than editing that block's narrative (avoids the
  banner-count / stale-comment trap recorded in the learnings).
- `appendQueryLog` currently runs after selection; the D2 guard placement makes the
  no-log-on-refusal property hold for free — assert it anyway (delete-the-guard must red
  the test).

## 9. Non-goals / deferred

- **No `parseArgv` change** of any kind; the `=`-attached-flag residual
  (`--top-k=5`, `--budget=4096`, `--target=2000`) stays frozen (D10).
- **No `cmdQueriesBatch` guard** — typed JSONL authored programmatically by the Lead;
  different boundary, no observed defect.
- **No integer-only restriction on `--top-k`** (D3).
- **No CI workflow or wrapper edits** — inheritance via the shared invocation is the design.
- **Local-root recurrence copy of the tighten lesson** (same slug, same stale "silently
  dropping the flag" wording): outside any worker's write scope; deferred to the next
  `/lessons-learned` pass / Gate-2 servitor cycle, which overwrites the repo copy from the
  local one — so that pass must carry the fuse wording forward, not regress it. Record
  this in the change description.
- **No hub-WARN message redesign** — count semantics only.

## 10. Validation criteria (concrete, testable)

1. **#1145 refusals (red pre-fix):** `node skills/_shared/war-memory.mjs query x --local
   <fixture> --top-k` (bare), `--top-k abc`, `--top-k 0`, `--top-k -3` → exit 1, empty
   stdout, stderr naming the flag and the received token; same four for `--budget`.
   (Today: bare `--top-k` exits 0 retrieving one lesson; `--top-k abc` exits 0 with an
   empty block.)
2. **#1145 unchanged paths:** flagless `query` output byte-identical to today
   (`DEFAULT_TOP_K` 10 / `DEFAULT_BUDGET` 4096); `--top-k 3` yields ≤ 3 lessons; a valid
   `--budget` still caps the block.
3. **#1145 no side effects on refusal:** a refused invocation appends no line to the
   query log (assert log absent/unchanged on the fixture local root).
4. **Truthy-ternary retirement sweep:** the §4 grep over `war-memory.mjs` finds no
   `argv`-read truthy ternary feeding `Number()` outside guarded arms — **plus** the
   mandated same-scope hand-scan of comments/tests, each straggler listed as a
   survey-derived correction (zero-straggler result stated explicitly).
5. **#1135 (red pre-fix):** a fixture dir with a credential-shaped violation nested under
   `<dir>/archive/` → `lint <dir>` exits 1 naming file + pattern (today: `lint: clean`,
   exit 0). Clean nested fixture → exit 0. Wrapper meta-test: `war-memory-lint.test.sh
   <fixture>` propagates exit 1 for the nested violation.
6. **#1135 live tree:** `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0
   with the recursive walk (113 archived files verified clean at spec time; re-verified at
   land per §8).
7. **#1135 no-divergence check:** `.github/workflows/memory-audit.yml` and
   `war-memory-lint.test.sh` are byte-unchanged by the change set.
8. **#1154 (red pre-fix):** fixture where one citer slug exists hot in both roots citing a
   hub → `archive <hub>` emits **no** WARN (deduped count 1); two distinct hot citers →
   WARN printing count 2. Existing `inboundCiters` hotOnly tests stay green.
9. **#1147:** the tighten lesson's failure-mode-3 item states the fuse mechanism (one
   fused argv word, `parseArgv` keys `{"target 2000": true}`, `argv.target` undefined) and
   a grep for `dropped`/`collapses` in the file finds zero mechanism-position claims —
   any surviving negated/coincides-with mention listed via the §4 survey. The
   "Not yet extended to siblings" paragraph is past-tense and cites the landed fix.
10. **D9:** the cmdquery sibling lesson's description is RESOLVED-prefixed and its body
    carries a `## RESOLVED` section; the redaction lint passes on both edited lessons.
11. **Suite:** `node --test 'skills/**/*.test.mjs'` fully green.
