---
name: prompt-surface-budget-derivation-comment-regex-checks-shape-not-arithmetic-truth
description: "prompt-surface-budgets.test.mjs's per-row derivation-guard only regexes for a 'post-shrink N B @ sha'-shaped substring and a '×1.25'/'×1.10'-shaped substring — it never checks that the cited sha's actual blob size or the stated arithmetic result are true, so a plausible but false citation passes the gate silently"
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

**Code-verified** at landed tip `ad440fc0b65dfbfdf797b8f8b83f44b0d4531b50` on
`dev/2026-08-30-engine-concurrency-and-pin-transfer` (landed-tip grounding rung 2: `_refinery38`
worktree, gitdir physical path containing the plan slug, `HEAD` equal to the threaded tip).
`skills/war/assets/prompt-surface-budgets.test.mjs` lines 300-301 define the per-row
derivation-guard as:

```js
const DERIVATION = /post-shrink [\d,]+ B(?: \([^)\n]*\))? @ [0-9a-f]{7}/;
const MULTIPLIER = /×1\.25|×1\.10/;
```

These are the SOLE checks a row's citation comment must satisfy (referenced at lines ~338/345).
Both only assert that a citation-**shaped** substring and a multiplier-**shaped** substring exist
somewhere in the comment — neither confirms the cited short-sha's actual `git cat-file -s
<sha>:<path>` byte count matches the stated number, nor that applying the stated multiplier to
that number reproduces the row's actual `hard`/`advisory` value.

**Demonstrated by a near-miss this same phase (not a live instance — the flawed row never
landed).** This phase's `p2-polish` drafted a `CONTEXT.md` budget-raise comment reading
"post-shrink 127,482 B @ deb37b5 → hard ×1.25 ceil-KB = 128,000 B". Across two rejected audit
rounds, five independent seats confirmed BOTH numbers false: `deb37b5`'s `CONTEXT.md` blob is
126,976 B, not 127,482 B (127,482 B was actually the size only after the polish task's own,
different commit); and 127,482 × 1.25 ceil-KB is 159,744, not 128,000. The `DERIVATION` and
`MULTIPLIER` regexes would have passed either way — both false numbers are still shape-valid.
The row never landed: `p2-polish`'s diff was `polish-rejected` then `polish-discarded`, and
`CONTEXT.md`'s entry in `prompt-surface-budgets.test.mjs` at this phase's landed tip still reads
the pre-raise `{ hard: 126976, advisory: 111616 }` — confirmed by direct Read.

**Pattern to watch for:** when authoring or reviewing a `PIN-17`/`ADR 0042`-style budget-raise
citation comment, hand-verify the cited sha's actual blob size and recompute the stated formula —
the test suite's derivation guard will not catch a plausible-looking but false citation; only its
`hard`/`advisory` NUMBER is load-bearing to the test, never its justifying prose.

**Locate-cue (verify still present before acting):**
`skills/war/assets/prompt-surface-budgets.test.mjs`, the `DERIVATION`/`MULTIPLIER` regex
definitions (search `const DERIVATION`).
