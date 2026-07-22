# war-strategy structure lock — two-site location-anchored lock for plan-literal-lint.mjs

**Source issues:** #991 (Single `check_f` presence lock covers two intended SKILL.md sites of
`plan-literal-lint.mjs` — either can silently regress).
**Source lesson:** `docs/learnings/structure-test-check-f-locks-presence-anywhere-not-intended-location.md`.

## 1. Context — the gap / problem

`skills/war-strategy/war-strategy-structure.test.sh` locks `skills/war-strategy/SKILL.md`'s
structure with two helpers: `check` (regex, `grep -q`) and `check_f` (fixed string, `grep -qF`).
Both are whole-file presence checks — no line-range, section, or occurrence-count constraint. A
`check_f` therefore proves "this string occurs somewhere at least once", never "this string
survives at the location the lock intended".

`SKILL.md` names `plan-literal-lint.mjs` at two structurally distinct, load-bearing sites
(verified in the live tree):

1. **§2 convention block** — the sentence beginning ``The advisory `plan-literal-lint.mjs`
   (`skills/war-strategy/assets/`) mechanically flags the cheap literals`` (under
   "Reference the live artifact, never a stack-fragile literal").
2. **§4 conversion flow** — the "Lint the authored plan" step: ``run `node
   skills/war-strategy/assets/plan-literal-lint.mjs <plan>` on every`` plan you author.

The structure test pins both with one lock — `check_f 'plan-literal-lint.mjs'`, whose own
trailing comment acknowledges the double duty ("advisory lint named in the convention + §4").
Because the lock is satisfied by either occurrence alone, deleting the §4 lint step keeps the
test green via the §2 mention, and vice versa: one of the two ratified requirements can silently
regress. Verified at spec time: the bare token matches **2** lines of `SKILL.md`; every other
`check_f` fragment in the test matches exactly **1** (this is the only multi-site single lock —
see the §4.3 survey).

Scope is deliberately one file plus one lesson: `SKILL.md` prose is correct and unchanged; only
the test's lock granularity is wrong.

## 2. Pivotal constraints

- **`SKILL.md` untouched.** The two sites are ratified prose; the fix strengthens the guard, not
  the guarded document. The test must remain green against the current `SKILL.md` byte-for-byte.
- **bash-3.2-safe, cwd-independent, no mktemp** — the test file's header contract. New checks
  must not introduce bashisms beyond what the file already uses.
- **House anchor discipline:** fixed-string fragments must not carry double quotes or bold
  markers crossing the anchor (lesson `shared-string-constant-quote-literal-byte-anchor-fragility`,
  already cited in the test's own comments), and must be single-line (`grep` is line-based).
- **Structure-test sibling precedent:** the requiresPackaging block already models the correct
  N-site pattern — two separate `check_f` calls, one per site, "Delete either … and the matching
  check fails." The fix converges the plan-literal-lint lock on that in-file pattern rather than
  inventing a new helper.
- **Repo-root lesson edit** (if taken — §3 row 5): must pass the fail-closed redaction lint
  (`node skills/_shared/war-memory.mjs lint docs/learnings/`, the only CI check), and must not
  grow the `description` — projection bytes are driven by descriptions, not bodies (lesson
  `projection-byte-budget-driven-by-descriptions-not-bodies`).
- **Cluster-wide binding constraints (1)–(4)** — none bind this group: no auditor/refiner/servitor
  behavior change (no `agents/*.md` / `workflow-template.js` prompt surface), no hand-mirrored
  enum (`KNOWN_LAND_DECISIONS` / `HARD_ESCALATION_REASONS`) is touched, no auditor-allowlist or
  G6 reversal, no `effectiveDate` logic. Stated so the absence is explicit, not overlooked.

## 3. Resolved design tree

| # | Decision | Options considered | Resolution + why |
|---|----------|--------------------|-------------------|
| 1 | Lock mechanism | (a) two `check_f` calls, each on a longer location-unique fragment; (b) occurrence-count assertion (the issue's `grep -coF` with `-ge 2`); (c) both | **(a) two location-unique fragments.** Stronger than (b): a count of 2 is satisfiable by one intended site lost while a new unrelated mention appears elsewhere — the exact presence-vs-location failure class this fix closes; fragments that extend into each site's surrounding sentence pin site *identity*. (b) is also subtly mis-specified: with `-c`, grep counts matching *lines*, not occurrences (`-o` is overridden by `-c` on both GNU and BSD grep), so the recipe is line-count in disguise. (a) reuses the existing `check_f` helper and matches the in-file requiresPackaging two-site precedent. (c) is redundant belt-and-braces. |
| 2 | Fate of the bare `check_f 'plan-literal-lint.mjs'` | (a) keep alongside the two new checks; (b) replace it | **(b) replace.** Both new fragments contain the token, so bare presence is implied; keeping the old line re-introduces a lock whose green tells you nothing the two anchored locks don't. Net diff: one line becomes two. |
| 3 | Fragment choice | criteria-driven; candidates verified at spec time | **§2 site:** ``The advisory `plan-literal-lint.mjs` (`skills/war-strategy/assets/`)``. **§4 site:** the fragment running from `run` through the closing backtick after `<plan>` (verbatim in §4.1). Each contains the full token, extends into location-unique surrounding prose, is single-line, and carries no double quotes (backticks are safe inside the test's single-quoted args). Both verified to match exactly one `SKILL.md` line in the live tree; the implementer re-verifies uniqueness at implementation time (`grep -cF` = 1 each) since prose can drift before land. |
| 4 | New helper (`check_f_at`, count helper, section-scoped grep) | (a) add one; (b) two plain `check_f` calls | **(b) plain calls.** A location-aware helper is speculative machinery for a two-line fix; the whole file's idiom is flat check lists. Rejected ceiling — revisit only if a future doc needs the same token locked at 3+ sites where fragments can't be made unique. |
| 5 | Lesson disposition | (a) leave untouched; (b) `RESOLVED` description prefix; (c) body-only instance note, description unchanged | **(c).** The lesson is a *mechanism* lesson ("check_f locks prove presence anywhere") that stays live guidance for every future structure test — prefixing `RESOLVED` would wrongly retire it from ranking. But its body's verification note records the two-site instance as *not found* (stale pre-land worktree); left uncorrected, a future reader re-derives and re-files #991. Append a short dated note: instance confirmed on the landed tree and closed by #991's two location-anchored locks. Description byte-identical → zero projection cost. |
| 6 | Sweep for sibling instances of the defect class | (a) skip — issue names one instance; (b) one-time audit of every existing anchor, recorded here, no ongoing guard | **(b), performed at spec time (§4.3).** Result: no other `check`/`check_f` anchor matches more than one `SKILL.md` line, and no other trailing comment claims multi-site duty. One-time audit, not a new meta-guard — a guard-of-the-guard is the over-engineering ceiling. |

## 4. Mechanics

### 4.1 Test change (`skills/war-strategy/war-strategy-structure.test.sh`)

In the "Reference the live artifact" check block, replace the single line

```sh
check_f 'plan-literal-lint.mjs'                              # advisory lint named in the convention + §4
```

with two location-anchored locks, one per ratified site (comments name each site so a future
red run identifies *which* mention regressed):

```sh
check_f 'The advisory `plan-literal-lint.mjs` (`skills/war-strategy/assets/`)'   # §2 convention block
check_f 'run `node skills/war-strategy/assets/plan-literal-lint.mjs <plan>`'     # §4 lint-the-authored-plan step
```

No helper changes, no new bash constructs (single-quoted fixed strings; backticks and `<`/`>`
are inert inside single quotes on bash 3.2). Anchor by the named check block, not line number —
line numbers rot across the serial merge queue.

### 4.2 Lesson note (`docs/learnings/structure-test-check-f-locks-presence-anywhere-not-intended-location.md`)

Append to the existing **Verification note** section (or directly after it) a dated closure of
the specific instance: the §2 + §4 `plan-literal-lint.mjs` two-site duplicate under a single
`check_f` *was* confirmed present on the landed tree and is now closed by two location-unique
`check_f` anchors (issue #991); the mechanism-level guidance (options (a)/(b) in "How to apply")
remains live for future structure tests, with the added caveat from §3 row 1 that `grep -c`
counts lines, not occurrences. `description`, `metadata.keywords`, and provenance are unchanged.

### 4.3 One-time sibling audit (token sweep + mandatory same-scope survey)

Sweep step (performed at spec time; the implementer re-runs it at implementation time): for
every fragment argument of `check`/`check_f` in `war-strategy-structure.test.sh`, count its
matching lines in `SKILL.md` (`grep -c` / `grep -cF`); any anchor matching more than one line is
a candidate multi-site single lock — handle every match. Result on the live tree: every anchor
matches exactly 1 line except `plan-literal-lint.mjs` (2 — the defect under fix).

**Manual same-scope survey (grep is a floor, not a ceiling)** — a count-sweep only finds anchors
whose *string* recurs; a lock can also under-cover when its intent (comments, surrounding prose)
names multiple sites in different words. Hand-scan of the test file's comments and check
groupings, performed at spec time; stragglers and dispositions:

1. Line-78's trailing comment "named in the convention + §4" — the only comment claiming one
   lock covers two sites; it is the defect itself and is replaced by the two per-site comments
   in §4.1. No other comment uses multi-site language for a single check.
2. The requiresPackaging block's "Both are fence-blind verbatim lines … Delete either … and the
   matching check fails" — "Both" spans **two separate** `check_f` calls, each with its own
   anchor; correct pattern, not a straggler.
3. The Commander's-Intent-precedes-Build-order ordering check — deliberately duplicate-aware
   (`head -n 1` plus a comment about stray earlier bare headings); its semantics are ordering,
   not site-count; not a straggler.
4. `check` regex heading anchors (`^## 1.` … `^### Roadmap template`) — `^`-anchored full
   headings, each unique in `SKILL.md` per the sweep; no straggler.

## 5. Surface changes

- `skills/war-strategy/war-strategy-structure.test.sh` — one `check_f` line becomes two
  location-anchored `check_f` lines (§4.1)
- `docs/learnings/structure-test-check-f-locks-presence-anywhere-not-intended-location.md` —
  body-only instance-closure note (§4.2)

`skills/war-strategy/SKILL.md` is read, never written. No agents/, hooks/, or
`workflow-template.js` surface. No file overlap with any other survey group.

## 6. New domain terms (CONTEXT.md)

None. "Structure test", "lock", and "anchor" are existing vocabulary; "location-unique
fragment" is descriptive, not a new term of art.

## 7. Recommended ADRs

None — a two-line test-granularity fix inside an existing guard; no decision crosses an
architectural boundary.

## 8. Open risks / implementation notes

- **Anchor brittleness is the accepted trade.** The two longer fragments break if either
  sentence is legitimately reworded — that is the point of a structure lock (fail loud, force
  the editor to re-ratify), and it is the same trade every sibling `check_f` in the file already
  makes. A reword updates the anchor in the same commit, as with any other lock.
- The §4 fragment ends at the closing backtick of the command (before " on every") so a benign
  line-wrap change downstream of the command cannot break it; the §2 fragment likewise stops at
  the closing paren of the asset path.
- If `SKILL.md` drifts before this lands (serial merge queue), the implementer re-runs the §4.3
  uniqueness counts and, if a fragment no longer matches exactly once, re-derives it under §3
  row 3's criteria — the criteria are the contract, the byte strings are the current resolution.
- Nothing in #991 is deferred.

## 9. Non-goals / deferred

- No occurrence-count helper or location-aware `check_f` variant (§3 row 4).
- No change to `SKILL.md` prose, `plan-literal-lint.mjs` itself, or any other lock in the test.
- No ongoing meta-guard asserting "every anchor matches exactly once" (§3 row 6 — one-time
  audit only; a self-testing test is the rejected ceiling).
- No `description`/keyword edits to the lesson; archiving remains `/lessons-learned`'s
  operator-gated call.

## 10. Validation criteria

1. **Green on unchanged prose:** `bash skills/war-strategy/war-strategy-structure.test.sh`
   exits 0 against the current `SKILL.md`, and both new checks print `ok -` lines.
2. **Uniqueness:** each new fragment matches exactly one line of `skills/war-strategy/SKILL.md`
   (`grep -cF '<fragment>' skills/war-strategy/SKILL.md` = 1, both fragments).
3. **Discrimination proof (the defect, closed):** with the §2 sentence naming
   `plan-literal-lint.mjs` deleted from a scratch copy of `SKILL.md`, the test fails on the §2
   anchor; independently, with the §4 "Lint the authored plan" step's command line deleted, it
   fails on the §4 anchor. Under the pre-change single lock, both mutations stayed green — that
   green-to-red flip is the RED proof (lesson
   `weak-test-assertion-passes-without-feature-being-exercised`).
4. **Old lock retired:** `grep -n "check_f 'plan-literal-lint.mjs'" war-strategy-structure.test.sh`
   finds no bare-token lock; the token appears only inside the two location-anchored fragments.
5. **Shell-suite green:** the anchored shell-test loop (`for f in $(find hooks skills -name
   '*.test.sh' | sort); do bash "$f" || exit 1; done`) passes — bash-3.2-safe, cwd-independent.
6. **Lesson integrity:** the lesson body contains the dated #991 closure note; its
   `description` line is byte-identical to before; `node skills/_shared/war-memory.mjs lint
   docs/learnings/` (the exact CI check) passes.
