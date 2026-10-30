---
name: slug-collapse-must-judge-copies-over-the-whole-corpus-not-only-the-query-matched-rows
description: Picking the shown copy and the archived tag from matched rows alone shows an archived twin though a hot copy exists
metadata:
  node_type: memory
  type: project
  keywords:
    - collapseBySlug
    - archived tag
    - hot beats archived
    - repo beats local
    - drifted twins
    - rankRecords MATCH
    - fixture shares keywords
    - ES2
    - copy preference
    - FTS5 matched rows
  provenance: agent-unverified
  slug: slug-collapse-must-judge-copies-over-the-whole-corpus-not-only-the-query-matched-rows
  phase: 2026-10-27-memory-query-mcp-tool/phase-1 task 1.1
  tags:
    - war
    - memory
    - mcp
    - testing
    - fixture
  created: 2026-10-27
  originSessionId: c3af584e-8b97-41a9-9abc-594c7cf1d33c
  modified: 2026-10-27T13:44:59.017Z
---

# Collapse copies over every copy, not only the matched ones

*Audit finding resolved in a fix round before land — recorded as pattern, not live instance.*

**The pattern.** A lesson slug can have several file copies: repo and local roots, hot and `archive/`. `rankRecords` returns only the rows the FTS5 `MATCH` hit. Twins drift apart. A tighten pass can shorten a hot copy's description while its archived twin keeps the long text. Then the hot copy misses the query terms and the archived twin matches. A collapse that reads only the matched rows sees one archived copy. It tags the hit `(archived)` and points at the archived file, though a hot copy exists. That breaks the rule: a hot copy beats an archived copy, the repo copy beats the local copy at the same state, and `(archived)` appears only when every copy is archived.

**The fix shape.** Build a slug-to-copies map from the full walked corpus. Keep first-ranked order from the matched rows. Pick the shown copy and the archived flag from every copy in the map. The server does this: `collapseBySlug(ranked, records)`. The shown description and file can now come from an unmatched copy.

**The fixture trap.** The first `ES2` fixture gave every copy the same keywords, so every copy always matched. No test could reach the case. The fix added a drifted-twins test where the hot copy lacks the query terms. When you test per-copy selection, make the twins differ in the field the query matches.

**How to apply.** Any place that picks one copy per slug from a ranked list must see the unranked copies too. Check the hand-off between the ranker and the collapse.

**Locate-cue (verify the fixed form is still present before acting).** `skills/_shared/war-memory-mcp.mjs`, the `collapseBySlug` function and its call in `runMemoryQuery`. `skills/_shared/war-memory-mcp.test.mjs`, search `collapse over drifted twins`. Seen in the fixed form at landed tip fcdc744e, read through the run's `_refinery` worktree.

Related: [[memory-query-server-writes-its-own-log-append-and-copies-the-hit-line-so-its-4kb-budget-is-approximate]], [[negative-assert-on-a-fixture-that-cannot-carry-the-offender-is-vacuous-and-a-label-count-a-fix-round-also-satisfies]].
