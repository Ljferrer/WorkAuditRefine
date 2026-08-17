---
name: delimiter-truncation-before-empty-result-carve-out-widens-false-negative-surface
description: "Truncating at the closing delimiter before the bare-mention carve-out silently widens the scanner's false-negative surface"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: delimiter-truncation-before-empty-result-carve-out-widens-false-negative-surface
  phase: 2026-08-06-doc-cli-consistency-corpus/phase-1
  keywords: 
    - specCitations
    - carve-out ordering
    - delimiter truncation
    - bare-directory mention
    - false negative
    - regex escape guard
    - composite emphasis
    - markdown link text vs target
    - doc-cli-consistency
  tags: 
    - regex
    - escape-guard
    - audit-calibration
    - doc-cascade
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T05:52:52.175Z
---

# Truncating at the first delimiter before the empty-result carve-out check can eat a real citation

## What happened (code-verified at the landed tip)

`specCitations()` in `skills/_shared/doc-cli-consistency.test.mjs` (verify still present before
acting — found at the landed tip `c809b77fee45630b19b195bf80f13743168a7857`, read via the
`_refinery` worktree whose `gitdir` physical path contains this plan's slug) was changed by
phase 1 of `2026-08-06-doc-cli-consistency-corpus` (Task 1.1, D5 / constraint 7) to fix
composite-emphasis escapes (`**bold`, `` **`code-span`** ``, bold-link composites) that were
previously smuggling markdown metacharacters past the carve-out tests. The mandated fix order —
trim → **truncate the captured run at the first backtick / `]` / `)` delimiter** → conditional
paired-emphasis peel → glob/placeholder carve-out tests — runs the truncation step *before* the
pre-existing `if (rest === '') continue // bare output-directory mention` check:

```js
const cut = rest.search(/[`\])]/)
if (cut >= 0) rest = rest.slice(0, cut)
// ... conditional paired-emphasis peel ...
if (rest === '') continue          // bare output-directory mention (survey-corps)
```

For a citation shaped `` [`docs/specs/`](docs/specs/2026-01-01-x-design.md) ``, the scanner's
`matchAll(/docs\/specs\/(\S*)/gi)` greedily consumes the WHOLE run (link text + `](` seam +
link target) as one match, since there is no whitespace inside it. The trailing-punctuation trim
leaves `` `](docs/specs/2026-01-01-x-design.md ``; the new truncation step finds the first
delimiter (the backtick right after the bare `docs/specs/` link text) at index 0, so `rest`
truncates to `''` — and the pre-existing bare-directory carve-out fires, silently discarding a
citation whose **target** is a real, concrete spec file. Before this fix, the same input would
have been correctly flagged (no truncation step existed to zero out `rest`).

This is a genuine (narrow) widening of the escape surface, but it is exactly the operation order
the plan's D5 / constraint 7 mandated and red-team adjudicated — not a worker deviation. No live
surface in this repo carries such a citation shape at the landed tip (`agents/*.md` never
contained `docs/specs` in any commit; every `references/*.md` hit is `skills/war/references/
design.md`, already scanned), so it is dormant risk, not a live false negative.

## Durable rule

When a fix inserts a "truncate the captured run at the first delimiter" step ahead of an
existing "empty result ⇒ carve out as a bare mention" check, the empty result can now mean
either of two different things: (a) the run was **genuinely** just a bare directory mention with
nothing after it, or (b) the run was truncated to empty by the delimiter cut even though a real
path continues **past** that delimiter (e.g. a markdown link's `](target)` seam). Order two
carve-out-adjacent transformations carefully: prefer re-scanning the truncated-away tail for its
own citation before treating a zero-length prefix as conclusive, or make the path-capture regex
non-swallowing across known seams (like `` `](  ``) so the truncation point and the "is this
truly bare" check operate on the same, correctly-scoped span.

## Related

No prior lesson in this store covers carve-out step ordering specifically; if a future plan
revisits `specCitations`, re-scan the tail after the delimiter or make the capture regex
non-swallowing across `](` seams rather than treating a zero-length prefix as conclusive.
