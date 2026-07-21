# The index projection is a bounded two-column view

**Status:** accepted (design ratified 2026-07-21; implementation tracked by the spec and plan below)

The local `MEMORY.md` projection ([ADR 0015](0015-files-canonical-memory-with-derived-index.md)) is
regenerated from both roots' hot sets and hard-refuses above its byte/line caps. ADR 0015 bounded it by
a single lever — *selection* (archive the coldest rows on overflow) — and rendered three columns per
row: `[[slug]]`, a `phase`/recurrence trail, and a summary. By 2026-07-21 the store sat ~180 B below the
hard cap: one more servitor lesson would flip the render to `refuse`, after which new lessons land as
files but never gain index rows and the projection silently stales against the store. The `phase` column
had grown to ~4 KB — every re-trigger appends recurrence prose to a cell that only routes, while that
same trail already lives in the lesson file's frontmatter and body. A future reader will ask why the
projection dropped a column whose data still exists in the files, and why terse, truncated rows are
acceptable; this records it. Full mechanics:
[the design spec](../specs/2026-07-21-lessons-learned-tighten-design.md) §3–§4, §6, §10, and
[the plan](../plans/2026-07-21-lessons-learned-tighten.md) Task 1.1 (format + `tighten-plan`) and
Task 1.3 (this ADR + glossary + pointer).

## Decision

**The index projection is a two-column view — `| [[slug]] | <summary> [tier] [repo] |` — bounded by
exactly two view-mechanisms and nothing else: row *selection* (which lessons get a row) and a per-cell
*cell budget* (`SUMMARY_CELL_BYTES`, the summary-cell render cap). The `phase`/recurrence trail is
dropped from the projection and lives exclusively in the lesson files (frontmatter + body), which remain
the canonical store; depth of recall is the `query` path, not the projection.**

Both caps are strictly *view-side*: neither deletes nor rewrites a lesson. Selection moves a cold lesson
to `archive/` (still FTS-indexed and retrievable forever —
[ADR 0015](0015-files-canonical-memory-with-derived-index.md)); the cell budget truncates a row's
*rendering* while the file keeps its full text. Truncation order is load-bearing: the summary text is cut
to fit first, then the trailing provenance-tier and `[repo]` markers are appended — the markers are never
severed, because the safe-swap consumers key on them.

## Considered options

- **Keep three columns, truncate to fit (rejected).** The `phase` column is pure duplication — the
  recurrence trail is already in the file's frontmatter and body, so the projection spent ~4 KB
  re-rendering prose that `query` retrieves in full. A three-column truncated row also risks severing the
  trailing `[repo]` marker whenever a cell is cut *after* the marker is appended, which would silently
  corrupt the consumers below rather than fail loudly.
- **Flat list, one line per lesson, no table (rejected).** Cheapest on bytes, but it breaks the
  `safe-swap.sh verify` extractors outright: they select `|`-led rows (`grep -E '^\|'`), take the first
  `[[slug]]` per row, and detect and count `[repo]`-marked rows for the repo-completeness hard fail. A
  non-`|` list matches none of these — the wholesale-`[repo]`-drop guard would go dark.
- **Two-column table (chosen).** Rows stay `|`-led with a leading `[[slug]]` and a `[repo]` marker that
  survives truncation, so all three extractors keep working byte-for-byte with no edit to
  `safe-swap.sh`. Verbatim survival of those extractors is why the two-column shape won and why the
  format change ships without touching that script.

## Consequences

- The projection is structurally bounded, not merely curated: the cell budget caps each row regardless
  of how verbose a description grows, so the store no longer drifts toward `refuse` one lesson at a time.
  On the 2026-07-21 corpus the restructure alone clears the advisory line with zero archiving.
- The `phase`/recurrence trail becomes projection-invisible but is not lost: it stays in lesson files and
  remains the `/lessons-learned` graduation signal; a reader who wants it uses `query`, which returns the
  full lesson text (hot and cold).
- `safe-swap.sh` is deliberately unchanged — an auditor finding it untouched is confirming the
  compatibility contract, not catching an omission. Its verify extractors (first `[[slug]]` per `|`-row;
  `[repo]`-marker detection and count) are the reason the two-column shape was chosen over the
  alternatives.
- Selection stays the only *content* lever: the projection never trims knowledge to meet a budget — that
  invariant is [ADR 0015](0015-files-canonical-memory-with-derived-index.md)'s and is preserved (the cell
  budget is a view-only render cap, not a knowledge cut). When selection is needed to clear the advisory
  line, the operator-gated tighten pass owns it, behind a single strike-list ask with a loud shortfall.

## References

- Design spec: [`docs/specs/2026-07-21-lessons-learned-tighten-design.md`](../specs/2026-07-21-lessons-learned-tighten-design.md)
  — §3 resolved tree (row format, cell budget), §4 mechanics, §6 domain terms, §10 validation criteria.
- Implementation plan: [`docs/plans/2026-07-21-lessons-learned-tighten.md`](../plans/2026-07-21-lessons-learned-tighten.md)
  — Task 1.1 (`buildProjection` two-column format + `SUMMARY_CELL_BYTES` + the `tighten-plan` verb),
  Task 1.3 (this ADR, the CONTEXT.md terms, the CLAUDE.md pointer).
- [ADR-0015](0015-files-canonical-memory-with-derived-index.md) — files-canonical memory with a derived,
  disposable index; temperature is location. This ADR adds the *cell budget* as the projection's second
  cap alongside 0015's *selection* and records the column drop; 0015's "never trim knowledge to meet a
  budget" invariant is untouched.
- [ADR-0028](0028-memory-store-integrity-tool-enforced.md) — memory-store integrity is tool-enforced,
  making `safe-swap verify` the sole authority on row/link adjudication; its extractors are the consumers
  the two-column format preserves.
