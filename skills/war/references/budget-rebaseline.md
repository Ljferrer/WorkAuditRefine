# Prompt-surface budget re-baseline — the operator-gated pass

The repeatable **operator** lever that moves the prompt-surface byte ceilings — the `hard:` /
`advisory:` constants in
[`prompt-surface-budgets.test.mjs`](../assets/prompt-surface-budgets.test.mjs) (`FILE_BUDGETS`
rows plus `WORKFLOW_LITERAL_BUDGET`). Authority split (the budget-maintenance-authority ADR,
`docs/adr/`): **workers fund growth within ceilings** — eviction per
[ADR 0042](../../../docs/adr/0042-prompt-surface-budgets.md) D3/D4, never a constant raise —
while **ceiling changes are operator acts via this pass**, machine-enforced at merge by the
Budget-Raise citation floor (`skills/war/assets/assert-budget-raise-cited.sh`). The pass mirrors
`/lessons-learned tighten`'s shape
([`tighten.md`](../../lessons-learned/references/tighten.md)): preflight → plan → one gate →
execute → report.

**De-mirror rule (binding for this doc):** this file never restates a live constant or measured
size. For every constant value, the single source of truth is
[`prompt-surface-budgets.test.mjs`](../assets/prompt-surface-budgets.test.mjs) — each row's
value plus its derivation comment; for the formula, ADR 0042 D5. A number quoted here would be a
mirror that rots.

## The five steps (strict order)

1. **Preflight** (read-only — nothing edited yet). Measure every budgeted surface: `wc -c` each
   `FILE_BUDGETS` path, and for the `workflow-template.js` prompt-literal share run the budget
   suite (`node --test skills/war/assets/prompt-surface-budgets.test.mjs`) and read its logged
   measurement — the suite's pinned extraction algorithm is the authority; never re-derive the
   literal share by hand. Compare each measurement against that surface's current constants as
   read from the suite. **No surface over its advisory line and no sanctioned shrink or
   growth-adjudication pending ⇒ report "nothing to re-baseline" and stop** — no later step
   runs.

2. **Plan.** For each surface to re-baseline, compute proposed new constants via the ADR 0042 D5
   formula (hard and advisory from the freshly measured size; the ADR states the multipliers and
   rounding — on any wording drift the ADR plus the suite's derivation comment win). Classify
   each row: **ratchet-down** (no proposed value exceeds its current constant — a normal PR, no
   trailer) vs **raise** (any value up — needs the gate and the trailer). Assemble the
   strike-list: surface · measured bytes @ measuring commit · current constants · proposed
   constants · direction · for each raise, the ADR 0042 D5 justification (the tier-1 doctrine
   that must stay inline and why it can be neither evicted nor compressed).

3. **Gate** (the single approval point — every ceiling movement behind **one** operator ask,
   never a row-by-row negotiation). Present the full strike-list; collect the approved subset.
   An **unapproved raise never executes** — that surface's growth is funded the worker way
   instead: ADR 0042 D3/D4 eviction to `references/` behind a trigger pointer.

4. **Execute.** Edit only the gate-approved constants in
   [`prompt-surface-budgets.test.mjs`](../assets/prompt-surface-budgets.test.mjs), updating each
   touched row's derivation comment (new measured size + measuring commit) in the same edit.
   Every commit whose diff raises a `hard:`/`advisory:` value carries, per raised surface, the
   machine-checked trailer `Budget-Raise: ADR-0042 <surface> +<bytes>` — the authoritative
   trailer grammar is whatever `assert-budget-raise-cited.sh` enforces; on any drift the floor
   wins — plus the ADR 0042 D5 citation in the commit body. Ratchet-downs need no trailer. The
   budget suite runs green before each commit.

5. **Report.** Per surface: before/after constants, measured size + measuring commit, direction,
   and each raise's cited justification. End with a **loud shortfall block** for any surface
   still at or above its (new) advisory line — that is the signal the next act is an ADR 0042
   eviction, never another raise.
