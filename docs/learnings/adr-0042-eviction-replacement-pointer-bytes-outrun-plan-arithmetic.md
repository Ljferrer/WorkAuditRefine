---
name: adr-0042-eviction-replacement-pointer-bytes-outrun-plan-arithmetic
description: "A plan's byte arithmetic for an ADR-0042 byte-identical references/ eviction (evicted bytes…"
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

## Confirming instance — Phase 4 of `2026-08-25-engine-reliability-and-filing-fidelity` (2026-08-26)

The "budget-frozen for the rest of the campaign" consequence predicted above materialized exactly as
described, on the SAME `agents/war-refiner.md` surface this lesson already names. Phase 2 Task 2 of
this plan sized an eviction "WITH margin for the Phase 4 AND Phase 6 card edits" — Phase 4 Task 1's
endstate-check transport rework then consumed 735 of that ~899 B margin (gate-audit-measured,
`gateEvidence: true`, `auditSha 609820f443bdc92da65a7bce0c53bdb2b4c53ef1`), landing the card at 164 B
under its 34,816 B hard ceiling — green, but a thin remainder for Phase 6 Task 1's still-owed edit to
the SAME card. Independently confirms the rule: **a shared eviction margin funding two later card
edits should be treated as consumable by the FIRST edit to land, not a stable pool** — the second
task should re-measure and budget its own eviction rather than assume the plan's original margin
survives intact.

## Second confirming instance — Phase 6 of the SAME plan, margin fully spent (2026-08-26)

Phase 6 Task 1 was the predicted "still-owed edit" named above. Code-verified via landed-tip
grounding rung 2 (the `_refinery28` worktree's `HEAD` equals the threaded landed tip
`513161f8083c18f4b582f139ec4162c0e95d1116`; gate-audit fallback also confirms this measurement
independently — `auditSha 166b6ae9d1c602ece8b402606f6dec8f5b2dcee2`, `gateEvidence: true`, End
state 4 attestation): the task consumed 150 of the remaining 164 B, funding itself with **two of
its own unplanned ADR-0042 evictions** into `skills/war/references/refiner-recovery.md` (not in
the task's `Files:` list — the plan's assumed byte funding was insufficient even after the eviction).
Final landed measurement at `skills/war/assets/prompt-surface-budgets.test.mjs`'s hard line
(34,816 B): `agents/war-refiner.md` = 34,802 B — **14 B of headroom**, gate-audit-confirmed and
unchanged through the phase's terminal `p6-polish` pass (which never touches this file). Third
independent confirmation of the same rule on the same card, now down to single-digit-percent
headroom (0.04%): **the campaign-wide eviction margin this card was originally over-provisioned
with is now exhausted** — any future phase touching `agents/war-refiner.md` (including a
phase-close absorb-fix) needs a fresh eviction, not an assumption of remaining slack.
