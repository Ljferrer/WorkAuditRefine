# The archive is reachable, so the memory index holds only what a query cannot surface

**Status:** accepted (operator direction, 2026-10-30)

The memory rules treated eviction as a real loss. Each hard floor in `tighten-plan` assumed that a lesson without a `MEMORY.md` row was hard to reach. That stopped being true. Every seat can now call the `memory_query` tool, and it searches hot and archived lessons in both roots. The Lead's prefetch ranks both temperatures too.

The old assumption also did harm. On 2026-10-30 the projection sat over the 24,400 B hard cap, so `render-index` refused and the index froze for days. After the repair, `tighten-plan` still found no eligible lesson at 23,782 B.

Evidence from that date:

- 71 of 118 hot rows counted as hubs, but only 43 had 2 or more hot citers. Links from archived lessons kept the other 28 protected.
- Transcripts show 12 of the 118 rows cited or opened outside housekeeping. Only 17 sessions remain, and silent use leaves no trace, so this is a floor on use.
- A `hits` count only says a query returned a lesson. The most-returned lesson (321 hits) has no citation outside housekeeping.

## Decision

1. **A row costs always-loaded space, and eviction removes only the row.** The lesson stays queryable, and links to it still resolve. "Archived, never deleted" stands.
2. **The always-loaded test decides what stays hot.** A lesson deserves a row if a session needs it before it knows to query. Two classes pass:
   - a standing operator rule about how to work
   - a trap that fires at an action where no task text would surface it
   Every other lesson is task-scoped. It stays reachable by query and prefetch, and its row is a candidate for eviction.
3. **The hub floor counts hot citers only.** A cold citer cannot pin a row, because its link resolves either way. `tightenPlan` and the Phase 3 check use the same hot count, which matches the `archive` hub WARN from ADR 0028.
4. **The other floors stay.** `user-confirmed` lessons are never evicted. The 8-day young floor stays until use data can replace it.
5. **The gate stays, and the test shapes it.** `tighten` applies the always-loaded test to preselect rows. The operator can strike rows or delegate the choice.
6. **A query shows each lesson once.** The CLI query now collapses twins as the `memory_query` tool does. Otherwise a lesson archived in both roots fills two prefetch slots.

Three follow-ups shipped in the amendment below: real use, redundancy and merges.

## Consequences

- `MEMORY.md` shrinks over time toward operator rules and silent traps.
- A task-scoped lesson now depends on a query to reach a seat. If its keywords are weak, a seat can miss it. `metadata.keywords` matters more than before.
- A session that never queries sees less. Hot rows no longer serve as a general reading list.
- The test is a judgment, so two passes can differ. The gate and the report keep that judgment visible.

## Considered and rejected

- **Raise the hard cap.** The cap protects read cost, and a higher cap only delays the same freeze.
- **Drop the hub floor.** A hub with hot citers still names a shared concept for lessons in the index.
- **Drop the young floor now.** Nothing yet measures whether a new lesson gets used, so removing it trades one guess for another.

## Amendments

- **2026-10-31 — use, redundancy and merges (#2536).** The operator directed this work outside the plan pipeline.
  - **Use:** `hooks/record-lesson-use.sh` appends `kind: "use"` rows to the query log. It records each lesson file a worker or auditor opens, and each slug in a result's optional `lessonsUsed`. A hook is the writer because Workflow scripts cannot write files. `/snipe` seats return plain text, so no hook sees their field, and the main session logs it through `war-memory record-use`. The hook prefers `CLAUDE_MEMORY_LOCAL`, then the project dir of the checkout's main worktree, then the transcript's project dir. One agent counts once per slug. Main-session and housekeeping reads stay out, because a housekeeping pass reads every lesson.
  - **Redundancy:** `similarPairs` scores lesson pairs by rare words shared across slug, description and keywords. `redundancyScores` replays the newest 500 distinct queries. A lesson's score is the share of its top-K appearances that a similar lesson shares. `findNearDupes` proved unusable here, because a lesson's own twins fill its five result slots.
  - **Ranking:** `tighten-plan` compares uses, then redundancy, then hits. The keys compare in turn and nothing is summed. A log with no use rows ranks by redundancy, then hits. An empty log ranks by tier and age.
  - **Merges:** `tighten-plan` prints `mergeClusters`. Similar words prove no shared rule, so an agent reads each cluster before it keeps one. The `user-confirmed` floor holds. A merge can archive a hub or a young lesson, because its rule stays hot in the target. A cluster's members share one root, so a merge never carries a local-only rule into the repo or a shared rule out of it.
  - **Limits:** a seat can leave `lessonsUsed` empty, so `uses` is a floor on use. The young floor stays until the log holds enough use rows to judge it.
