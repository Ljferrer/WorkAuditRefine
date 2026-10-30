---
name: memory-query-server-writes-its-own-log-append-and-copies-the-hit-line-so-its-4kb-budget-is-approximate
description: "The server reuses four war-memory.mjs exports, writes its own log append, and copies the hit line, so the 4 KB cap is approximate"
metadata:
  node_type: memory
  type: project
  keywords:
    - appendQueryLog mkdir
    - formatLessonLine private
    - selectForBudget
    - DEFAULT_BUDGET 4096
    - topK capped
    - hit line shape test
    - readQueryHits topSlugs
    - PIN-4
    - output size
    - formatHit
  provenance: code-verified
  slug: memory-query-server-writes-its-own-log-append-and-copies-the-hit-line-so-its-4kb-budget-is-approximate
  phase: 2026-10-27-memory-query-mcp-tool/phase-1 task 1.1
  tags:
    - war
    - memory
    - mcp
    - budget
    - reuse
  created: 2026-10-27
  originSessionId: c3af584e-8b97-41a9-9abc-594c7cf1d33c
  modified: 2026-10-27T13:44:52.228Z
---

# What the server reuses from `war-memory.mjs`, and what it copies

**Reused exports.** `walkCorpus`, `buildIndex`, `rankRecords`, `selectForBudget`, plus the constants `DEFAULT_TOP_K` and `QUERY_LOG_FILE`.

**The log append is not reused.** `appendQueryLog` in `skills/_shared/war-memory.mjs` is private. It calls `fs.mkdirSync(localRoot, { recursive: true })`. Reuse would create a memory directory, which breaks PIN-4 (the server never creates one). The server has its own `appendQueryLogIfPresent`: `localPassesAnchor` (#2499), `statSync`, require a directory, then `appendFileSync`. It writes the entry shape `{ts, query, seat: 'mcp', topSlugs, scores: []}`. `readQueryHits` reads `topSlugs`, so the shape must stay.

**The hit line is a copy.** `formatLessonLine` is private. The server's `formatHit` repeats the slug, provenance, phase and description logic. It adds ` (archived)` and ` · <file path>`. A test row, `hit line shape`, builds the CLI line and compares it to the server hit. If the CLI line shape changes, that row goes red. Exporting `formatLessonLine` would remove the copy. Plan latitude allowed it, but `war-memory.mjs` was outside the task's file list.

**The budget is approximate.** `selectForBudget` sizes each record with `formatLessonLine`. The server prints the longer `formatHit` line. The gap is about 60 to 120 B per hit, and at `topK` 10 the output can pass `DEFAULT_BUDGET` (4096 B) by about 1 KB. Both figures are estimates, not measured. A `topK` above roughly 20 is silently capped by the same budget. The tool's `topK` schema text now says output is also capped near 4 KB. No test or plan clause sets a hard byte cap on the tool output.

**How to apply.**
- If a seat prompt needs a hard output cap from the tool, export `formatLessonLine` and size with the printed line. The tool has no `budget` input (schema: `query`, `local`, `repo`, `topK`, no additional properties). Only the CLI takes `--budget`.
- Never call the CLI's `appendQueryLog` from a read-only path.
- If you change the query-log entry shape in the CLI, change the server append in the same commit.

**Locate-cue (verify still present before acting).** `skills/_shared/war-memory-mcp.mjs`, the functions `appendQueryLogIfPresent`, `localPassesAnchor` and `formatHit`, and the `mem.selectForBudget(collapsed, { topK })` call. `skills/_shared/war-memory.mjs`, the private `appendQueryLog` with its `mkdirSync` and the private `formatLessonLine`. `skills/_shared/war-memory-mcp.test.mjs`, search `hit line shape`. Found at landed tip fcdc744e, read through the run's `_refinery` worktree (HEAD equal to the tip).
