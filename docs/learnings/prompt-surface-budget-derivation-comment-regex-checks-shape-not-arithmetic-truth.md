---
name: prompt-surface-budget-derivation-comment-regex-checks-shape-not-arithmetic-truth
description: "A budget-raise citation's regex guard checks shape only; hand-verify the cited blob size and recompute the multiplier math."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: prompt-surface-budget-derivation-comment-regex-checks-shape-not-arithmetic-truth
  phase: "2026-08-30-engine-concurrency-and-pin-transfer/phase-2 p2-polish (landed dev/2026-08-30-engine-concurrency-and-pin-transfer, tip ad440fc0)"
  keywords: 
    - prompt-surface-budgets.test.mjs
    - DERIVATION regex
    - MULTIPLIER regex
    - budget-raise citation
    - format-invisible defect
    - arithmetic not verified
    - git cat-file -s
    - PIN-17
    - ADR 0042
    - per-row derivation guard
    - shape-only regex
    - citation soundness
    - ceil-KB formula
  tags: 
    - war
    - test-design
    - gotcha
    - prompt-budgets
  created: 2026-08-30
  originSessionId: fddd64d3-2c2c-400e-b891-9b7b75dcd158
  modified: 2026-08-30T14:50:12.188Z
---

# A budget-derivation citation comment's guard test checks shape, not truth

**Code-verified** on `dev/2026-08-30-engine-concurrency-and-pin-transfer` and re-confirmed
against the live tree. In `skills/war/assets/prompt-surface-budgets.test.mjs`, the per-row
derivation guard is the `const DERIVATION` / `const MULTIPLIER` regex pair:

```js
const DERIVATION = /post-shrink [\d,]+ B(?: \([^)\n]*\))? @ [0-9a-f]{7}/;
const MULTIPLIER = /×1\.25|×1\.10/;
```

These are the SOLE checks a row's citation comment must satisfy. Both only assert that a
citation-**shaped** substring and a multiplier-**shaped** substring exist somewhere in the
comment. Neither confirms that the cited short sha's actual `git cat-file -s <sha>:<path>` byte
count matches the stated number, nor that applying the stated multiplier to that number
reproduces the row's actual `hard` / `advisory` value. The file has no `cat-file` call and no
size recompute anywhere.

**Demonstrated by a near-miss (the flawed row never landed).** A `p2-polish` dispatch drafted a
`CONTEXT.md` budget-raise comment reading "post-shrink 127,482 B @ deb37b5 → hard ×1.25 ceil-KB
= 128,000 B". Five independent audit seats across two rejected rounds confirmed BOTH numbers
false: the `deb37b5` blob is 126,976 B (127,482 B was the size only after the polish task's own
commit), and 127,482 × 1.25 ceil-KB is 159,744, not 128,000. The `DERIVATION` and `MULTIPLIER`
regexes would have passed either way. The polish diff was rejected then discarded, and the
`CONTEXT.md` row in `prompt-surface-budgets.test.mjs` still reads
`{ hard: 126976, advisory: 111616 }`.

**Pattern to watch for:** when authoring or reviewing a `PIN-17` / `ADR 0042` budget-raise
citation comment, hand-verify the cited sha's blob size and recompute the stated formula. The
derivation guard will not catch a plausible but false citation. Only the row's `hard` /
`advisory` NUMBER is load-bearing to the test, never its justifying prose.

**Locate-cue (verify still present before acting):**
`skills/war/assets/prompt-surface-budgets.test.mjs`, the `DERIVATION` / `MULTIPLIER` regex
definitions (search `const DERIVATION`) and the per-row assertions that reference them.
