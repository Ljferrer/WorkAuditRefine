---
name: bare-housekeeping-pass-frees-no-projection-bytes-on-a-promotion-dominated-store
description: "When the local store is dominated by merged-promotion dupes, the bare /lessons-learned pass's archives free ~zero MEMORY.md bytes — the repo twins keep their [repo] rows, and tighten's floors (hub >= 2 inbound, < 8 days, user-confirmed) can floor the ENTIRE corpus at once. Projection relief then requires repo-side archives (a reviewed PR) or repo-side description trims; local hygiene and projection shrink are different levers."
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: bare-housekeeping-pass-frees-no-projection-bytes-on-a-promotion-dominated-store
  phase: lessons-learned housekeeping pass 2026-08-17
  keywords:
    - lessons-learned
    - tighten
    - projection bytes
    - MEMORY.md budget
    - promotion dupes
    - repo-side archive
    - hub floor
    - eviction floors
    - buildProjection
    - slug dedup
    - archiveCandidates root clause
  tags:
    - memory-housekeeping
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T20:32:03.160Z
---

# Local hygiene and projection shrink are different levers

Measured on the live corpus (2026-08-17): `tighten` at 24,115 B found **0 eligible** rows —
70/112 deduped hot rows were hub-floored (≥ 2 inbound citers; the link-liberally convention
makes this the binding floor), 31 young-floored (< 8 days, active campaign), 9 user-confirmed,
2 undated-protected. The bare pass then archived **51 local copies** (50 merged-promotion
dupes + 1 zero-inbound local) and freed only **245 B** — every dupe's `[repo]` row survives
via its hot repo twin.

**Why:** `buildProjection` dedups cross-root copies to the repo copy, so local archives of
promoted lessons change nothing in `MEMORY.md`; and archiving repo copies is outside both the
bare pass (local-only mutations) and `tighten`'s local arm.

History: before the slug-dedup fix, each promoted lesson cost two `MEMORY.md` rows (about 12 KB
in the 2026-07-11 pass). `buildProjection` now dedups by bare slug, and `archiveCandidates` ties
local before repo.

**How to apply:** when `MEMORY.md` nears `HARD_BYTES` on a promotion-dominated store, go
straight to the repo-side levers: a reviewed PR archiving RESOLVED/MITIGATED repo lessons
(`git mv` into `docs/learnings/archive/`), or repo-side `description:` trims (projection rows
are built from descriptions — [[projection-byte-budget-driven-by-descriptions-not-bodies]]).
Run the bare pass for store hygiene, not byte relief. Shell note: the `archive <slug>...`
batch must reach the CLI as real argv — zsh does not word-split unquoted variables; use
xargs or a loop.

> archived 2026-08-25: resolved — moved to archive
