---
name: housekeeping-must-not-edit-a-cross-root-dupe-in-the-local-root
description: "Local housekeeping edits to a lesson that also lives hot in docs/learnings/ fork it; leave dupes to tighten or a repo PR"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  keywords:
    - lessons-learned
    - cross-root dupe
    - docs/learnings
    - staging edit
    - promoted stamp
    - fork
    - keep-compress
    - fix-anchor
    - tighten
  created: 2026-09-03
---

**Rule:** in a `/lessons-learned` housekeeping pass, skip `keep-compress` and `fix-anchor` edits for
any local lesson whose slug is also hot in `docs/learnings/`. The repo copy is the human-reviewed
canonical record; editing only the local twin forks the two bodies while the projection keeps one
collapsed row, so the edit buys no projection bytes and creates two divergent truths for retrieval.

**Why:** on 2026-09-03 the pass found 70 local hot lessons, of which 46 were cross-root dupes that
differed from the repo copy only by a `metadata.promoted:` stamp (and sometimes a truncated
`description`). The verifier flagged 34 of them for compression or re-anchoring. Applying those
edits locally would have left the repo copies stale and the local copies unreviewed.

**How to apply:** compress or re-anchor local-only lessons in staging as usual. For a dupe, either
archive both copies together via `/lessons-learned tighten`, or fix the repo copy in a reviewed PR
and let the local twin ride. Record repo-side anchor drift in the pass report as operator debt. See
[[retiring-a-resolved-memory-must-check-inbound-links-hubs-stay]] and
[[projection-byte-budget-driven-by-descriptions-not-bodies]].

> archived 2026-10-27: resolved — moved to archive
