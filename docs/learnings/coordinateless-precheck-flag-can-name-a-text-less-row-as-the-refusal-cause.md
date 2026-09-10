---
name: coordinateless-precheck-flag-can-name-a-text-less-row-as-the-refusal-cause
description: "A coordinate-less pre-check flag set during a scan pass, later read to name the failing record, must also require the row carried text — a flag-only find() can blame an empty record instead of the real offender"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: coordinateless-precheck-flag-can-name-a-text-less-row-as-the-refusal-cause
  phase: 2026-09-06-engine-and-audit-verdict-integrity/phase-3 (Task 3.1)
  keywords: 
    - coordinateLessName
    - coordinate-less
    - planSlug refusal
    - rows.find
    - own-token floor
    - ruledAsks intake
    - misnamed cause
    - refusal message
    - pre-check flag
  tags: 
    - engine-design
    - workflow-template
    - correctness
    - audit-findings
  created: 2026-09-07
  originSessionId: a2a576b1-d8af-4c79-ad1a-af3d3e5c5c91
  modified: 2026-09-07T17:40:07.224Z
---

# A scan-pass pre-check flag read later as "the named cause" must also require the row carried text

## What (code-verified at landed tip)

`skills/war/assets/workflow-template.js` (landed phase `2026-09-06-engine-and-audit-verdict-integrity`
Task 3.1, tip `83cd4e7cfe0619c576d4301413eccae2fc5f1be9`, read via the `_refinery` worktree whose
`gitdir` physical path names this plan's slug and whose `HEAD` equals the threaded tip). Each row's
scan step (line ~999) stamps `coordinateLessName` on any row missing its own `planSlug`, regardless
of whether the row carries any text: `{ text, exempt: false, ...(hasOwnSlug(row) ? {} :
{ coordinateLessName: ... }) }`.

The later pre-check (line 1041) is `const coordinateLess = rows.find(r => r.coordinateLessName)` —
it does not require `r.text`. A `{}`-shaped record (no text at all) contributes nothing to
`evidenceText` and cannot itself fail the own-token floor, yet if it sits earlier in `rows` than a
sibling row that DOES carry text and DOES fail the floor, `coordinateLess` binds to the text-less
row. The refusal message then reads `record "(untitled)" is missing required planSlug coordinate`,
naming a record that was never the actual failing surface.

## Why durable

This is a two-step "flag now, read later" pattern: a boolean-ish flag set unconditionally during one
pass, then `.find()`-read in a later pass as if it uniquely identifies "the row that caused the
refusal." The pattern breaks whenever the flag can be set on a row that never entered the actual
failure computation — a text-less row here has zero say in whether the own-token floor fails, but
still wins the naming race if it appears first. The correct predicate must intersect BOTH conditions:
`rows.find(r => r.coordinateLessName && r.text)`. An auditor caught this by re-reading the row-shape
functions together, not by running the fixture suite — the shipped test does not construct this
specific text-less-row-before-text-bearing-row ordering.

## How to apply

When a pre-check flag is stamped during one scan pass and later read via `.find()` to NAME the cause
of a downstream failure, confirm the find predicate requires every field the failure computation
itself depends on (here: `text`), not just the flag alone. A flag stamped "unconditionally regardless
of content" is a hint for a LATER filter to narrow, never a standalone cause-identifier.

## Related

[[new-record-signal-computed-but-dropped-by-a-pre-existing-explicit-key-projection]] — a sibling
class of same-phase-family bug (a new record field silently not reaching a read site); this lesson
is the inverse shape: a flag reaches its read site but the read site's predicate is under-specified.

## Locate-cue (verify still present before acting)

`skills/war/assets/workflow-template.js`, the `coordinateLessName` stamp (~line 999) and the
`coordinateLess` pre-check (~line 1041, `rows.find(r => r.coordinateLessName)`).
