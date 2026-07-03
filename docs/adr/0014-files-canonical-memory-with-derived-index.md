# Memory is files-canonical with a derived, disposable index; temperature is location

**Status:** accepted (design ratified 2026-07-03; implementation tracked by the spec below)

The 2026-07-03 compaction failure showed the flat `MEMORY.md` index failing on three axes at ~133
lessons: a hand-maintained shared file raced by concurrent writers, a byte budget met only by deleting
durable lessons, and no retrieval beyond what fits in the auto-loaded index. The external P0
recommendation was to fix this with an **SQLite-canonical** store (servitor writes rows; markdown
becomes a projection). We adopted SQLite — but inverted which side is canonical. A future reader will
ask why the database everyone queries is in `.gitignore` while "the real data" is markdown, and why
"archived" is a directory rather than a status field; this records it. Full mechanics:
[the design spec](../specs/2026-07-03-memory-sqlite-substrate-design.md).

## Decision

Three sub-decisions, one principle: **commit text, derive binaries.**

1. **Lesson files are canonical; SQLite is a derived, disposable, gitignored index.** The servitor
   keeps writing one-file-per-lesson markdown through its existing Write/Edit path, so both PreToolUse
   enforcement hooks (path scope, provenance frontmatter) survive byte-identical — an SQLite-canonical
   store would need a Bash/CLI write path that both hooks are structurally blind to
   ([[scope-hook-blind-to-bash-write-path]]), forcing the confinement model to be rebuilt in the CLI.
   The index (builtin `node:sqlite` + FTS5, zero dependencies) is built **in memory, per CLI
   invocation**, from the text alone — no derived state outlives a process, so there is nothing to
   gitignore, back up, corrupt, or heal.

2. **Everything committed is plain text, one fact per file — and no generated file is committed.**
   Cold lessons move to an `archive/` directory of ordinary `.md` files rather than a gzip bundle;
   no database and no rendered index enter the repo. Git cannot merge two rewrites of a binary blob —
   and two regenerations of a shared rendered table conflict just as surely — so a shared archive
   blob, committed DB, or committed projection would make the multi-user goal (learnings transfer
   between machines/users through git) self-defeating, losing one side's work silently or noisily on
   every concurrent curation. Per-file text makes disjoint adds/moves merge automatically, and git's
   packfiles already provide the compression the gzip was reaching for.

3. **Temperature is location, not a field.** Hot = in the root (indexed into the `MEMORY.md`
   projection, one row each); cold = in `archive/` (no projection row, still FTS-indexed and
   retrievable forever). Archiving is a file move plus an appended body note — never a deletion, so
   the corpus compounds without bound while the projection stays under its byte budget by *selection*.
   What drives temperature: the `retire`/`merge` **recommendations** produced by `/lessons-learned`
   verdicts (verdicts inform, recommendations act — the hub-link downgrade still applies first) and,
   on budget overflow, a salience tiebreak of provenance tier + recency. A `status:` frontmatter field
   was rejected because a path cannot lie about which side of the split a lesson is on, while a field
   can drift from reality.

## Considered options

- **SQLite-canonical, markdown as projection (the P0 recommendation — rejected).** Cleaner on paper,
  but it rebuilds everything that already works (both hooks, the staging/atomic-swap curation
  pipeline, backup discipline) to gain nothing the failure report asked for, and it makes a binary
  file the single source of truth for accumulated knowledge.
- **Gzip archive + committed DB (operator's initial proposal — rejected).** Satisfies "unbounded +
  transferable" until two writers exist; then binary merge conflicts silently drop knowledge. The
  text-only form preserves both goals and the mergeability.
- **Status field for temperature (rejected).** Queryable, but duplicates what the path already states
  and can desynchronize from it; the projection invariant (hot ≡ indexed) becomes unverifiable by
  inspection.
- **TTL / stored salience columns (rejected).** A worse curator running in parallel with
  `/lessons-learned`, which already owns lifecycle judgment with repo-verified evidence.

## Consequences

- The index race is structurally impossible: `MEMORY.md` is generated-only (atomic whole-file render),
  writers touch distinct lesson files, and the servitor's D4 index-editing duty is deleted.
- Knowledge is never destroyed to meet a budget: overflow produces ranked archive *candidates*;
  `archive` moves files; queries keep seeing them.
- Any machine reproduces the index from a clone (plus its private local root); there is no DB file at
  all, hence no backup, migration, or corruption story — the index is rebuilt in memory on every use.
- Vectors, if retrieval quality ever proves lexical misses matter, cannot ride an index that never
  outlives a process — they will need a persistent embedding cache keyed by content hash. Recorded as
  the declared upgrade path; the "reserved embedding column" was dropped for this reason.
- One projection exists — the local union `MEMORY.md` (session auto-load) — and the repo root carries
  only per-lesson files, so multi-user merges never touch a generated file, and publication remains
  gated fail-closed (lint → PR → CI).

## References

- Design spec: [`docs/specs/2026-07-03-memory-sqlite-substrate-design.md`](../specs/2026-07-03-memory-sqlite-substrate-design.md)
  — store layout, CLI verbs, retrieval, gates, migration, validation criteria.
- [ADR-0007](0007-memory-provenance.md) — the provenance ladder this design leaves untouched (and
  whose write-gate is a reason files stay canonical).
- [ADR-0002](0002-scope-by-agent-type.md) — the `agent_type` scope-hook confinement this design
  deliberately avoids widening.
- The 2026-07-03 compaction failure report (operator-supplied) — the originating defect.
