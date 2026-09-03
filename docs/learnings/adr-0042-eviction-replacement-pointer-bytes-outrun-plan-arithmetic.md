---
name: adr-0042-eviction-replacement-pointer-bytes-outrun-plan-arithmetic
description: "Treat a plan's ADR-0042 eviction byte arithmetic as an estimate; measure the landed card size and budget from that."
metadata: 
  promoted: dev/2026-08-06-references-pointer-integrity@phase-1
  node_type: memory
  type: project
  provenance: code-verified
  slug: adr-0042-eviction-replacement-pointer-bytes-outrun-plan-arithmetic
  phase: "2026-08-06-references-pointer-integrity/phase-1 (task 1.2, gate-audit)"
  keywords: 
    - ADR 0042
    - byte-identical eviction
    - prompt-surface-budgets.test.mjs
    - hard budget line
    - advisory budget
    - trigger pointer bytes
    - headroom estimate optimistic
    - war-refiner.md budget
    - refiner-recovery.md
    - eviction arithmetic
  tags: 
    - war
    - prompt-surface
    - budget
    - plan-design
  created: 2026-08-18
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-08-26T20:32:01.983Z
---

# An ADR-0042 eviction's plan-projected headroom is optimistic; measure, do not trust the arithmetic

**Rule:** when a plan does byte arithmetic for a `references/` eviction (evicted bytes minus
prefixes minus new lines equals projected headroom), treat the result as an estimate to verify,
never a budget to rely on. The "new pointer line" term is the one most often underestimated. A
well-formed pointer carries the fixed-shape anchor prefix (`${CLAUDE_PLUGIN_ROOT}/...`), a
parenthetical citing the destination heading, and often a clause naming what survives elsewhere.
Each roughly doubles a naive one-sentence estimate. In the first instance the pointer ran 245 B
against a ~130 B plan figure, leaving tens of bytes of headroom instead of hundreds.

**How to apply:**
- Measure the landed size right after an eviction lands (`git cat-file -s <tip>:agents/<card>.md`)
  and plan from that, not from the plan's projection.
- Once a card lands thin, treat it as budget-frozen for the rest of the campaign. Any further prose
  addition, including a phase-close absorb-fix on the same card, reds the budget suite unless it
  pairs with another eviction.
- A shared margin that is meant to fund two later edits is consumed by the first edit to land. The
  second task must re-measure and fund its own eviction.

Recurrences: 2 (engine-reliability phases 4 and 6 spent the same `agents/war-refiner.md` margin
down to 14 B; the hard line was later raised +2,048 B under a `Budget-Raise:` trailer, and the card
sits near that line again).

**Locate-cue:** the `FILE_BUDGETS` entry for `agents/war-refiner.md` in
`skills/war/assets/prompt-surface-budgets.test.mjs` (read the current `hard` value and the raise
comment above it); the card's landed size via `git cat-file -s`.
