---
name: registry-carveout-rationale-cannot-justify-retaining-a-card-span-inline
description: "A prompt-surface-shrink plan's adjudication carve-out for registry/literal rows ('runtime prompt strings, no file re-anchor exists') does not transfer to a standing-doc card span, which always has a file re-anchor available — citing that carve-out to justify NOT evicting a branch-gated card section is a scope-confused rationale, even when the retention itself is independently defensible on tier grounds"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: registry-carveout-rationale-cannot-justify-retaining-a-card-span-inline
  phase: prompt-surface-simplification/4.1
  keywords: 
    - adjudication G
    - registry carve-out
    - card span retention
    - branch-gated candidate
    - literal shrink vs card shrink
    - eviction rationale
    - tier-1 doctrine
    - done-report rationale
    - prompt-surface-budgets
  tags: 
    - war
    - plan-faithfulness
    - prompt-surface
    - process-rationale
  created: 2026-07-29
  originSessionId: a505c140-d6ba-4279-a944-c3fcab124655
  modified: 2026-07-29T16:17:43.000Z
---

# A registry/literal carve-out's rationale does not transfer to a retained card span

**Found (code-verified — landed tip `cce668634ff6d566d1370e9502c08d317fea4e3c`, read via the
`_refinery` worktree at `.claude/war-worktrees/2026-07-28-prompt-surface-simplification-2026-07-28/_refinery/`,
`agents/war-refiner.md` lines 23-31, the `## provision` section):** the prompt-surface-simplification
plan's slice named three branch-gated eviction candidates for Task 4.1 ("provision-failure
taxonomies, re-land loops, and submodule escalation arms"). The worker evicted two (re-land loop,
2A/2B submodule arms) and kept the whole `## provision` section (the env-outcome failure shape +
`STALE_REMOTE` classify-and-continue carve-out, ~3.5-5.5 KB) inline, with a commit rationale citing
adjudication G's registry carve-out ("both-surfaces-pinned").

**Why that citation is scope-confused:** adjudication G's carve-out exists because a
`workflow-template.test.mjs` registry row pins a **runtime dispatched prompt string** — for those,
"no file re-anchor exists" is literally true (the string is emitted inline, not read from a file).
That reasoning does not transfer to a **standing-doc card span**: a card section always has a file
re-anchor available (the same task proved this by relocating the `p<phase>-<taskId>` presence key
into `refiner-recovery.md`), so "no re-anchor exists" is simply false for card prose.

**Not a hold, because the retention is independently defensible on a different ground:** the kept
section is plausibly tier-1 (a provision-barrier dispatch runs every phase, so every window pays
for it regardless), the plan says "candidates" not "must move", and the landed card size (27,109 B)
sits well under its placeholder advisory. The defect is purely that the **stated rationale** reached
for the wrong adjudication row, not that the outcome was wrong.

**How to apply:** when a plan-named branch-gated candidate is retained inline instead of
evicted, justify it on **tier** (every-invocation doctrine) or an **ADR-0025 mirror-site**
argument — never on a registry/literal carve-out, which scopes to the workflow-template.js literal
shrink only, not to card-span eviction decisions.
