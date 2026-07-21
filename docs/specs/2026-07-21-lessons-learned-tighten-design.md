# `/lessons-learned tighten` — bounded MEMORY.md via a restructured projection + usage-scored, operator-gated eviction

Grilled and ratified 2026-07-21 (operator interview, 7 resolved forks). Source data: live store at
24,220 B / 24,400 hard cap (99.3%) on 2026-07-21 morning; manual recovery commit `d83b90e` brought it
to 20,978 B / 104 lines (86%). Column weights measured at that state: summary cells 10,194 B, slug
cells 6,018 B, phase cells 4,063 B, table chrome ~700 B.

## 1. Context — the gap / problem

The index projection (`MEMORY.md`) is regenerated from both roots' hot sets and hard-refuses above
`HARD_BYTES = 24_400` / `HARD_LINES = 200`. On 2026-07-21 it reached 180 B below the byte cap: one more
servitor lesson would have flipped `buildProjection` to `refuse`, after which new lessons land as files
but never gain index rows — the projection silently stales against the store. A one-off manual pass
(`d83b90e`: 18 descriptions tightened, 15 inbound-checked agent-unverified lessons archived) recovered
~3.2 KB, but nothing prevents regrowth: every re-trigger appends recurrence prose to a `phase` cell,
every landed phase adds ~212 B rows, and the housekeeping pass (`/lessons-learned` bare) is deliberately
local-staging-only, so the repo-side levers have no owning mode. This spec adds one: a repeatable,
operator-gated `tighten` mode plus a structurally bounded projection format.

(Dated context statement — describes drift as of authoring; do not "correct" against later state.)

## 2. Pivotal constraints

1. **MEMORY.md must always be usable** (operator): never within one typical lesson-write of `refuse`.
   A data-only pass cannot guarantee this between runs; the bound must be structural (render-side).
2. **Deep recall may lean on the FTS query path** (operator): the projection is a router, not the
   store — terse rows are acceptable because `query` retrieves full text from files (hot + cold).
3. **All destructive actions grouped into one phase behind one operator ask** (operator-mandated shape).
4. **Knowledge is archived, never deleted** — temperature is location; eviction = `archive/` move.
5. **Repo root is human-reviewed like code** — fail-closed redaction lint; changes travel by PR.
6. Existing consumers move in lock-step or survive verbatim: `safe-swap.sh verify` extracts the first
   `[[slug]]` of each `|`-led row and detects `[repo]`-marked rows — both survive the 2-col format;
   `war-memory` format tests must be updated in the same commit as `buildProjection`.
7. Node ≥ 24 (`node:sqlite`); query-log read is best-effort/fail-open like the log's writer.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Trigger threshold | `WARN_BYTES` (17,000 B, the advisory line). Suggestion surfaces: `render-index` WARN prose gains "run `/lessons-learned tighten`", housekeeping Phase 0 budget verdict, skill docs. |
| Exit target | ≤ 17,000 B — i.e. post-run `buildProjection` verdict is `ok`, not `warn`. Hard postcondition with loud shortfall (see gate). Advisory line = trigger AND exit; no third threshold. |
| Lever set | Restructure the projection (one-time) + per-run row eviction. File-side description edits become optional editorial polish, not a byte lever. |
| Row format | 2-column table `\| [[slug]] \| <summary> [tier] [repo] \|` — `phase` column dropped from the projection only (frontmatter untouched; recurrence trail remains the housekeeping graduation signal). Summary cell render-capped (`SUMMARY_CELL_BYTES = 160`) with ellipsis. Measured effect: ~4.3 KB freed at current corpus (→ ~16.7 KB, under target with zero archiving). |
| Eviction policy | Usage-scored with hard floors. Floors (ineligible): `user-confirmed` tier; hubs (≥ 2 inbound citers via `inboundCiters`); lessons created or recurrence-stamped within 14 days. Rank eligible rows by ascending query-log hits; ties by tier rank then age. Archive from the top until ≤ target − 500 B slack. |
| Cold-start fallback | Log absent/sparse ⇒ hits are 0 for all → order degrades to today's tier+age eviction order; floors still apply. No blended weights anywhere. |
| Gate semantics | One destructive phase. The gate presents every mutation (per-slug: hits, tier, age, inbound count, bytes freed; plus any file edits) as a strike-list. Approved subset executes. If strikes leave the file > target: execute anyway, then report the shortfall in bytes plus next-best candidates — never silently accept, never re-ask in a loop. |
| Delivery | Repo side: dedicated branch (`dev/<date>-memory-tighten`), one commit, PR (redaction lint rides CI; `gh` account must be Ljferrer before push). Local side: reuse `safe-swap.sh` stage → verify → commit (backup tarball + verify gate for free). |

## 4. Mechanics

### `war-memory.mjs` (CLI)

- **`buildProjection`**: emit 2-col rows. Summary cell = description text, then provenance tag, then
  optional `[repo]` marker. Truncation order is load-bearing: truncate the *description text* to fit
  `SUMMARY_CELL_BYTES`, then append the tags — the trailing `[tier]`/`[repo]` markers must never be cut
  (the verify repo-completeness hard fail and the row classifiers key on them).
- **WARN prose**: the over-advisory warning names the remedy: `run /lessons-learned tighten`.
- **New read-only verb `tighten-plan`** (`--local`, `--repo`, `--target` default 17000): walks the
  corpus, computes the deduped projection, reads `war-memory-queries.jsonl` best-effort (absent ⇒ all
  hits 0), counts per-slug hits with **per-entry dedupe** of `topSlugs` (cross-root twins appear twice
  per entry in the wild), applies floors, and emits the ranked plan as JSON: eligible list in eviction
  order with per-slug `{hits, tier, ageDays, inbound, bytesFreed}` and the cumulative cut line. Emits
  plan only — never mutates. The skill consumes this instead of reimplementing corpus logic.
- **Cross-root dupes**: a shadowed local twin's row costs 0 bytes, so `bytesFreed` for archiving one
  copy of a dupe is **0**; removing the row requires archiving *both* copies (local copy via the
  prefer-local rule, repo copy explicitly). `tighten-plan` must report dupes as a both-or-nothing unit
  or exclude them, never claim single-copy savings (recorded incident: archiving a dupe's local copy
  frees zero projection bytes).

### `skills/lessons-learned/SKILL.md` (the mode)

`tighten` joins `migrate` / `evict` in the argument dispatch. Run shape:

1. **Preflight** (read-only): render-state check. Already ≤ target ⇒ report "nothing to tighten" and stop.
2. **Plan**: run `tighten-plan`; assemble the full mutation set (archives; optionally editorial
   description trims for cells the cap truncates mid-thought — polish, not bytes).
3. **Gate** (the single destructive phase): present the strike-list with the per-slug evidence columns
   and the projected post-run size; collect approval/strikes in one ask.
4. **Execute**: local archives + render via the staged pipeline (`safe-swap.sh stage` → mutate staging →
   `render-index --local $STAGING --repo` → `verify` → `commit`); repo archives + any repo edits on the
   dedicated branch (archive with `--repo` — the prefer-local rule makes repo-only slugs `git mv`
   within the repo root, which is exactly the committable archive) → redaction lint → commit → PR.
5. **Report**: before/after lines+bytes+% of both axes, actioned buckets, PR URL, backup/prev paths —
   and the shortfall block when the approved subset missed target.

### Explicitly unchanged

`safe-swap.sh` (extractors verified format-proof), the `archive`/`render-index`/`query` verbs' contracts,
`migrate`/`evict`, frontmatter schemas, the hooks. The housekeeping pass itself stays local-only —
`tighten` is the sole repo-side actor in this skill, and only through its gate + PR.

## 5. Surface changes

- `skills/_shared/war-memory.mjs` — 2-col `buildProjection`, `SUMMARY_CELL_BYTES`, WARN prose, `tighten-plan` verb
- `skills/_shared/war-memory.test.mjs` — format-lock updates + new coverage (§10)
- `skills/lessons-learned/SKILL.md` — `tighten` mode section, Phase-0 suggestion line, Common-mistakes rows
- `CONTEXT.md` — §6 terms (entry edits land with the implementing phase, not before)
- `CLAUDE.md` — memory-section budget sentence gains the tighten pointer
- `docs/adr/` — one ADR if accepted (§7)
- Release phase: all four version slots in lock-step (next free patch above the live base)

## 6. New domain terms (CONTEXT.md)

- **Tighten pass** — the operator-gated projection-shrink mode: triggered at the advisory line, exits
  at verdict `ok`; one destructive phase, strike-list approval, loud shortfall.
- **Cell budget** — the per-cell render cap (`SUMMARY_CELL_BYTES`). View-only truncation: lesson files
  keep full text; only the projection's rendering is bounded.
- **Usage-scored eviction** — eviction ranking by ascending query-log hits behind hard floors
  (user-confirmed, hubs, young lessons); degrades to tier+age when the log is silent.
- **Sharpen "Index projection"**: currently reads "capped by *selection* …, never by dropping
  knowledge" — after this change it is capped by selection **and per-cell budgets**; both are
  view-mechanisms, knowledge stays in files. The entry must admit the second mechanism.
- **Sharpen "Advisory line"**: not merely a warning threshold — it is the tighten trigger *and* exit
  target (the projection's normal operating ceiling).

## 7. Recommended ADRs

One: **"The index projection is a bounded two-column view"** — cell budgets + row selection are the
only cap mechanisms; the `phase`/recurrence trail lives exclusively in lesson files. Qualifies: hard to
reverse (every projection consumer and reader adapts), surprising later (why did the column vanish?),
real trade-off (three formats weighed; 2-col chosen for verbatim survival of the verify extractors).

## 8. Open risks / implementation notes

- **Marker-safe truncation** is the sharpest edge: a summary cell cut *after* tag-append would sever
  `[repo]` and trip (or worse, silently pass) the repo-completeness gate. Truncate description first,
  append tags second; test both orders.
- **Usage signal bias**: the query log records WAR prefetch/seat queries, not the operator's own
  reading of MEMORY.md — zero hits ≠ zero value. The floors (user-confirmed, hubs, young) are the
  counterweight; the gate is the final human check.
- **Log hygiene**: 479 entries / 336 KB in 13 days; unbounded growth. Rotation is deferred (§9) — the
  planner must tolerate a large log cheaply (single pass, no index).
- **Branch base**: the tighten branch cuts from the current checkout's HEAD (stack-friendly with an
  in-flight dev branch); red-team should probe the stacked-PR interaction.
- **Concurrent stores**: tighten must take the same stale-staging guard as the bare pass (`stage`
  refuses over leftovers; `recover` first).
- **`gh` account**: verify Ljferrer is active before the PR push (recorded gotcha).

## 9. Non-goals / deferred

- No query-log rotation/compaction (separate concern).
- No weighted composite scoring; no per-weight tuning surface.
- No further projection redesign (list format, column drops beyond `phase`) — 2-col is the shape.
- No auto-run: tighten is always operator-invoked; the system only *suggests* it. No cron.
- `migrate` / `evict` behavior untouched.
- Render-side row eviction stays out: selection remains explicit-slug archiving through the gate.
- Repo-side description rewrites beyond truncation polish are editorial follow-ups, not tighten's job.

## 10. Validation criteria

1. **Format**: `buildProjection` on a fixture emits 2-col rows; a summary cell at the cap ends
   `… [tier] [repo] |` with markers intact; `safe-swap.sh verify` PASSes against the rendered fixture,
   including the `[repo]`-row hard-fail arm both ways (populated root + rows present; populated root +
   rows stripped ⇒ FAIL).
2. **Bound**: rendering the 2026-07-21 corpus (98 hot facts) lands ≤ 17,000 B with zero archives — the
   restructure alone clears the advisory (measured ~16.7 KB expectation; assert ≤ 17,000, not a byte
   literal).
3. **Floors**: `tighten-plan` on a fixture never lists a `user-confirmed` lesson, a ≥ 2-inbound hub, or
   a < 14-day-old lesson; each floor has a fixture case.
4. **Hits**: a log entry with a slug duplicated in `topSlugs` counts once for that entry; two entries
   count twice.
5. **Fallback**: with the log absent, `tighten-plan` order equals the tier+age eviction order.
6. **Dupes**: a cross-root dupe never appears with single-copy `bytesFreed > 0`; the both-copy unit (or
   exclusion) is asserted.
7. **Gate**: skill dry-run on a fixture presents exactly one destructive ask; a strike producing a miss
   yields a shortfall report naming the missing bytes and next candidates (assert presence, not prose).
8. **Delivery**: run end state is a clean main tree + a PR on a dedicated branch + a swapped local
   store with backup/prev artifacts; redaction lint green.
9. **Release**: four version slots bumped in lock-step (`version-slots.test.mjs` green).
