---
name: adr-0042-eviction-replacement-pointer-bytes-outrun-plan-arithmetic
description: "A plan's byte arithmetic for an ADR-0042 byte-identical references/ eviction (evicted bytes…"
metadata: 
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
  modified: 2026-08-18T16:33:21.435Z
---

# An ADR-0042 eviction's plan-projected headroom is routinely optimistic — measure, don't trust the arithmetic

**Found (code-verified via gate-audit fallback — landed tip
`d712424133e66952e780acba6dbd45c737a6afd5` on `dev/2026-08-06-references-pointer-integrity`; my
own checkout had no live worktree matching this plan's slug, so this is grounded on the pinned
`auditSha 44089b3f9dc70a14a7ad8a3e730c6c297026363d` gate-audit verdict's ES16 attestation,
`gateEvidence: true`, which directly measures the landed blob size):** Task 1.2's mandatory (h2)
`ADR 0042` eviction moved >= 400 B of card prose (`agents/war-refiner.md`) into
`skills/war/references/refiner-recovery.md`, replacing it with a fixed-shape trigger pointer line.
The plan's own net-headroom arithmetic projected roughly 56 B headroom + >= 400 B evicted - 66 B
anchor prefixes - ~200 B for the standing D3 resolution line - ~130 B for the replacement pointer
line, i.e. a healthy margin under the 34,816 B hard line in
`skills/war/assets/prompt-surface-budgets.test.mjs`. The actual landed replacement pointer line ran
**245 B, not ~130 B** — nearly double the estimate, because it had to carry both the fixed-shape
anchor form and a parenthetical citation of the moved block's destination heading. Net result: the
card landed at 34,773-34,782 B (readings varied slightly by exact commit inside the task; both
gate-audit passes independently confirmed the number against the hard line), leaving only
**~34-43 B of headroom** — an order of magnitude thinner than the plan projected, though the hard
line itself was never crossed (End state 16 held) and the guardrail requiring an ADR 0042 citation
on the advisory trip was honored.

## The durable rule

When a plan's Pivotal constraints or task slice does byte arithmetic for a references/ eviction
(`evicted bytes - prefixes - new lines = projected headroom`), treat the projection as an
**estimate to verify, not a budget to rely on** — specifically, the "new pointer line" term is the
one most likely to be underestimated, because a well-formed pointer typically needs:
- the fixed-shape anchor prefix (`${CLAUDE_PLUGIN_ROOT}/...`),
- a parenthetical citing the destination section's exact heading (needed for the family's own
  heading-citation convention), and
- often a trailing clause describing what survives elsewhere (dispatched-prompt mirror, etc.).

Each of those roughly doubles a naive "one short sentence" estimate. **Consequence for downstream
work:** once an eviction lands with thin headroom, treat that card as **budget-frozen** for the
rest of the campaign — any further prose addition (including a phase-close absorb-fix landing on
the same shared/slot-adjacent surface) reds the budget suite at its own merge unless paired with a
further eviction. Verify the actual landed byte count (`git cat-file -s` / `git ls-tree -l`)
immediately after an eviction lands, rather than trusting the plan's projected headroom for
subsequent planning.

**Locate-cue (verify still present before acting):**
`skills/war/assets/prompt-surface-budgets.test.mjs`'s `FILE_BUDGETS` hard-line entry for
`agents/war-refiner.md` (34,816 B); the card's landed size via `git cat-file -s <tip>:agents/war-refiner.md`.
