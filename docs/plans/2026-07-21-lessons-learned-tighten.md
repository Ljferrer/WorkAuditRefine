# `/lessons-learned tighten` — bounded projection + usage-scored, operator-gated eviction

Source spec: `docs/specs/2026-07-21-lessons-learned-tighten-design.md` (grilled + ratified 2026-07-21).

## Commander's Intent

*(operator-authored; confirmed 2026-07-21 — intent is the ceiling, the plan slice is the floor)*

- **Purpose:** MEMORY.md is always usable — never again within one lesson-write of render-refuse; depth
  of recall moves to the FTS query path while the projection stays a bounded router.
- **Method:** one-time structural bound (2-column projection, marker-safe 160 B summary-cell caps) plus a
  repeatable, operator-gated `tighten` mode — usage-scored eviction behind hard floors (user-confirmed,
  ≥2-inbound hubs, <14-day lessons), a single destructive strike-list gate with loud shortfall, repo
  changes by PR, local changes by staged swap.
- **End state:**
  1. `buildProjection` emits the 2-col capped format; `[tier]`/`[repo]` markers survive truncation;
     format tests updated in the same commit, suite green.
  2. Rendering the live corpus post-restructure yields verdict `ok` — strictly under the 17,000 B
     advisory — with zero archives.
  3. `war-memory tighten-plan` exists, read-only: floors enforced, per-entry-deduped hit ranking,
     cross-root dupes as both-or-nothing units — each with test coverage.
  4. `/lessons-learned tighten` is documented with the preflight → plan → gate → execute → report shape,
     single-gate + shortfall semantics; Phase 0 and the render WARN both suggest it.
  5. `CONTEXT.md` carries the four new terms and one sharpened entry; `CLAUDE.md`'s budget sentence
     points at tighten.
  6. The ADR ("the index projection is a bounded two-column view") is recorded in `docs/adr/`.
  7. README.md's `### Tidy the memory` section documents the tighten mode alongside `migrate`/`evict`,
     and the `/war-help` orientation card's command row reflects it — both consistent with the SKILL.md
     prose.
  8. Release lands last: all four version slots in lock-step at the next free patch.

## Build order (for /war)

1. **Phase 1 — CLI bound + mode + docs** (waves: 1.1 ∥ 1.3 → 1.2 → 1.4)
2. **Phase 2 — Release** (trailing, own phase)

## Phase 1 — CLI bound + mode + docs

### Task 1.1: 2-col capped projection + `tighten-plan` verb (+ lock-step tests)

- Files: `skills/_shared/war-memory.mjs`, `skills/_shared/war-memory.test.mjs`
- Plan slice: In `buildProjection`: emit 2-column rows `| [[slug]] | <summary> |` where the summary cell
  is the description text, then the provenance tag, then the optional `[repo]` marker; drop the phase
  column from the projection only (frontmatter untouched). Export a `SUMMARY_CELL_BYTES` constant
  (value 160) and truncate **description text first, append tags second** with an ellipsis — the
  trailing `[tier]`/`[repo]` markers must never be cut (the safe-swap repo-completeness gate and row
  classifiers key on them). Extend the over-advisory WARN prose to name the remedy: run
  `/lessons-learned tighten`. Add the read-only verb `tighten-plan` (`--local`, `--repo`, `--target`
  default 17000): walk the corpus, compute the deduped projection, read the query log named by the
  `QUERY_LOG_FILE` constant best-effort (absent ⇒ all hits 0), count per-slug hits with per-entry
  dedupe of `topSlugs`, apply the eligibility floors (never `user-confirmed`; never ≥2-inbound via
  `inboundCiters`; never lessons whose **effective date** is within 14 days — effective date = the
  newest ISO date among the frontmatter keys `metadata.created` / `metadata.updated` /
  `metadata.modified` / `metadata.date` and any `20\d\d-\d\d-\d\d` match in the `phase`/`description`
  prose, because recurrence stamps live only in prose; a lesson with no parseable date anywhere is
  PROTECTED, treated as within-window; `lessonRecord` is extended to surface the effective date), rank
  eligible rows by ascending hits with ties by tier rank then age (age from the same effective date),
  and emit a JSON plan — eligible list in eviction order with per-slug
  `{hits, tier, ageDays, inbound, bytesFreed}` plus the cumulative cut line to
  target − 500 B slack. Cross-root dupes: a shadowed twin row's single-copy `bytesFreed` is 0; report
  dupes as a both-copies-or-nothing unit, never single-copy savings. Mapped tests (spec §10 criteria
  1–6): 2-col format lock; cap truncation with markers intact (both truncation orders exercised — the
  wrong order must fail); floors fixtures (one per floor, plus the effective-date branches: undated ⇒
  protected, prose-only recurrence date honored); per-entry hit dedupe; log-absent fallback ordering
  equals tier+age; dupe both-or-nothing assertion; fixture-corpus bound asserted via
  `verdict === 'ok'` (never a byte literal for the rendered size); rendered-fixture safe-swap
  cross-check — buildProjection's 2-col output written into a staging fixture and
  `skills/lessons-learned/assets/safe-swap.sh` verify run against it, asserting PASS on the faithful
  render and FAIL once the `[repo]` markers are stripped while the repo root stays populated (spec
  §10 criterion 1, second clause; the script is invoked, never modified).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: the `tighten` mode in the housekeeping skill

- Files: `skills/lessons-learned/SKILL.md`
- Plan slice: Add the `tighten` mode alongside `migrate`/`evict` in the argument dispatch, documenting
  the five-step run shape: **preflight** (read-only render-state check; verdict `ok` — strictly under
  target — ⇒ "nothing to tighten", stop; at or above target the pass proceeds, matching the WARN
  trigger exactly) → **plan** (consume the `tighten-plan` verb's JSON — the verb is the corpus authority, the skill
  never reimplements scoring) → **gate** (the single destructive phase: one strike-list ask presenting
  every mutation with per-slug hits/tier/age/inbound/bytes and the projected post-run size) →
  **execute** (local archives + render via the staged `safe-swap.sh` pipeline; repo archives on a
  dedicated `dev/<date>-memory-tighten` branch — archive with `--repo`, redaction lint, one commit,
  PR; check the `gh` account is Ljferrer before push; take the same stale-staging guard as the bare
  pass) → **report** (before/after both axes, actioned buckets, PR URL, backup/prev paths, and the
  loud-shortfall block — bytes missing + next candidates — whenever strikes leave the file above
  target; never silent, never a re-ask loop). Add the Phase-0 budget-verdict suggestion line (> advisory
  ⇒ suggest `tighten`) and Common-mistakes rows (single-copy dupe savings; truncation-order edge).
- requiresTest: false
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

### Task 1.3: glossary, ADR, and the CLAUDE.md pointer

- Files: `CONTEXT.md`, `CLAUDE.md`, `docs/adr/` (new ADR at the next free number above the live set)
- Plan slice: In `CONTEXT.md`: add **Tighten pass**, **Cell budget**, **Usage-scored eviction**, and
  **Advisory line** (spec §6 wording basis; no advisory-line entry exists today, so it is ADDED — not
  sharpened — and defined as the tighten trigger **and** exit target); sharpen **Index projection**
  (capped by selection **and per-cell budgets**, both view-mechanisms — knowledge stays in files). Author the ADR "the index projection is a bounded two-column view" — cell budgets
  + row selection as the only cap mechanisms; `phase`/recurrence trail lives exclusively in lesson
  files; alternatives weighed (3-col truncated, flat list) and why 2-col won (verbatim survival of the
  safe-swap extractors). In `CLAUDE.md`: the memory-section budget sentence gains the tighten pointer.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: user-facing surfaces — README + orientation card

- Files: `README.md`, `skills/war-help/SKILL.md`
- Plan slice: In README's `### Tidy the memory (/lessons-learned)` section: document the `tighten` mode
  as a bullet alongside the `migrate`/`evict` bullets — trigger (advisory line), the single strike-list
  gate, usage-scored eviction with floors, delivery (PR + staged swap), and the always-usable bound the
  restructured projection provides. In the `/war-help` card: the `/lessons-learned` command-row blurb
  reflects the mode (tidy **and tighten** captured memory). Both consistent with the SKILL.md prose
  merged in Task 1.2 (this task's worker rebases onto the integrated tip and reads it). Do not touch
  the README `## Status` slot (release-owned) or the Releasing prose (undersell-guarded).
- requiresTest: false
- requiresPackaging: false
- deps: [1.2]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: version bump, all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump to the next free patch above the live base across all four slots in lock-step —
  `plugin.json` version, `marketplace.json` `metadata.version` and `plugins[0].version`, and the README
  `## Status` line (replace-in-place, no badge). `version-slots.test.mjs` is the arbiter. Release blurb
  describes the tighten mode additively (no rename; no absence-guard interactions expected).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- First real `/lessons-learned tighten` invocation — gate UX (one ask, strike-list), PR delivery,
  `gh` auth, shortfall path · why deferred: needs live operator approval and a live `gh` session;
  not fixture-able in CI · runner: operator, at the first over-advisory occurrence post-release.
- End state 2 on the **live** corpus (verdict `ok`, strictly under 17,000 B, zero archives) · why deferred: depends
  on the operator's local store contents, not repo fixtures — CI asserts the same bound on the fixture
  corpus in Task 1.1 · runner: operator `render-index --local --repo` after `/reload-plugins`; also
  surfaced by Phase 0 of any subsequent housekeeping pass.

## Notes / conscious deviations

- `README.md` is touched by Phase 1 (Task 1.4 docs section) **and** Phase 2 (the `## Status` slot) —
  cross-phase same-file is legal (phases land serially); noted so no auditor reads it as a
  file-disjointness violation.
- The `tighten-plan` JSON shape is defined-but-not-yet-emitted relative to Task 1.2's prose — produced
  in Task 1.1; 1.2 rides a dep wave and documents the merged contract, never a guess.
- The projection format change deliberately preserves the safe-swap extractors (first `[[slug]]` per
  `|`-row; `[repo]`-marker detection) — `safe-swap.sh` is intentionally absent from every Files list;
  an auditor finding it unmodified is confirming the design, not catching an omission. Task 1.1's
  rendered-fixture cross-check invokes the script read-only; it never edits it.

## Open decisions

None — all forks resolved in the 2026-07-21 grilling interview and conversion (7 AskUserQuestion
resolutions recorded in the spec's design tree; intent confirmed with amendment).
