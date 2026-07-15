---
name: projection-budget-now-bound-by-repo-root-rows
description: Repo rows eat 19.8KB of 24.4KB projection cap
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: 
    - projection
    - budget
    - render-index
    - repo-root
    - descriptions
    - MEMORY.md
    - housekeeping
    - hard-cap
    - scratch empty local root
    - warn is designed steady state
    - description diet
    - WARN_BYTES
  updated: 2026-07-13
  originSessionId: f19df621-be27-409f-8a11-40e9202a1c58
---

Measured at master 2026-07-13 (scratch empty local root + `--repo docs/learnings`): the 115 `docs/learnings/` rows + header cost **19,777 B** of the 24,400 B hard cap, verdict `warn` — the description-diet lever below landed (PR #881) and MET the ratified target (≤20,400 B, ≥4,000 B headroom; actual headroom 4,623 B). Pre-diet (2026-07-12 housekeeping pass) the repo rows cost 21,352 B, leaving ~3 KB for the entire local store; local-side housekeeping (archiving 16 lessons, tightening every fat description to ≤52 chars, stubbing 3 hubs) only just fit: 23,828 B, 572 B of headroom.

**Why:** `render-index` gives every hot record in both roots a row; repo-root descriptions can't be edited by the local housekeeping pass (they're git-tracked), so once repo rows near the cap, new servitor writes and future passes hit the render refusal no matter how tight the local store is.

**How to apply:** When `render-index` refuses or headroom is < ~500 B, the real lever is a reviewed PR tightening `docs/learnings/` frontmatter descriptions (and archiving repo-root candidates), not more local archiving. See [[projection-byte-budget-driven-by-descriptions-not-bodies]] and [[promoted-local-duplicate-rows-double-count-projection]].

## Lever applied — phase "projection dedup, citation hygiene, pre-flight guard, headroom remediation" (dev/2026-07-12-memory-tooling-frictions, task 1.4)

This lesson's recommended lever was executed: a reviewed `docs/learnings/` description diet + explicit-slug archives, with every dropped discriminating description term confirmed present in `metadata.keywords` (per the plan's per-lesson retrieval-check requirement). The plan's ratified target is **≤20,400 B (≥4,000 B headroom under `HARD_BYTES`=24,400 B), ≤200 lines, verdict `warn`** — `warn` (not `refuse`) is stated as the **designed steady state**, not a failed remediation: `WARN_BYTES`=17,000 and the repo corpus is large enough that cutting under it would require gutting roughly a third of the lessons. Don't chase `warn`→`ok` on the repo root; the constants are ratified with `warn` as permanent expected state for a healthy corpus.

**New measurement technique worth reusing:** measure repo-root-only headroom deterministically with a **scratch empty `--local` dir**: `node skills/_shared/war-memory.mjs render-index --local <scratch-empty-dir> --repo docs/learnings` — this isolates the repo-root byte count from whatever the operator's personal local dev-memory currently holds (which varies session to session and would otherwise make the same repo-root diet look like a different verdict depending on who measures it). The render output itself is measurement-only and discarded (no real index gets written to the scratch dir's `MEMORY.md`).

**Landed & re-confirmed:** the diet landed in PR #881; the scratch-root render on the current master tip (2026-07-13) gives the 19,777 B / 115 lines / `warn` figures above — `warn` is the designed steady state, not a residual problem.

> archived 2026-07-15: resolved — moved to archive
