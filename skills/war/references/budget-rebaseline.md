# Prompt-surface budget re-baseline — the operator-gated pass

The repeatable **operator** lever that moves the prompt-surface byte ceilings — the `hard:` /
`advisory:` constants in
[`prompt-surface-budgets.test.mjs`](../assets/prompt-surface-budgets.test.mjs) (`FILE_BUDGETS`
rows plus `WORKFLOW_LITERAL_BUDGET`). Authority split
([ADR 0048](../../../docs/adr/0048-budget-maintenance-authority.md)): **workers fund
growth within ceilings** by eviction per
[ADR 0042](../../../docs/adr/0042-prompt-surface-budgets.md) D3/D4, never by a constant raise.
**Ceiling changes are operator acts via this pass.** The Budget-Raise citation floor
(`skills/war/assets/assert-budget-raise-cited.sh`) enforces this at merge. The pass mirrors
`/lessons-learned tighten`'s shape
([`tighten.md`](../../lessons-learned/references/tighten.md)): preflight → plan → one gate →
execute → report.

**De-mirror rule (binding for this doc):** this file never restates a live constant or measured
size. For every constant value, the single source of truth is
[`prompt-surface-budgets.test.mjs`](../assets/prompt-surface-budgets.test.mjs) — each row's
value plus its derivation comment; for the formula, ADR 0042 D5. A number quoted here would be a
mirror that rots.

## The five steps (strict order)

1. **Preflight** (read-only — nothing edited yet). Measure every budgeted surface: run the budget
   suite (`node --test skills/war/assets/prompt-surface-budgets.test.mjs`) and read its
   `MEASURE prompt-surface-budgets: <label> <size> B (advisory <a>, hard <h>)` lines. The suite
   prints one per `FILE_BUDGETS` path and one for the `workflow-template.js` prompt-literal share,
   on every run, below the advisory line too. The suite's pinned extraction algorithm is the
   authority for the literal share; never re-derive it by hand. Compare each measurement against that surface's current constants as
   read from the suite. **No surface over its advisory line and no sanctioned shrink or
   growth-adjudication pending ⇒ report "nothing to re-baseline" and stop** — no later step
   runs.

2. **Plan.** For each surface to re-baseline, compute proposed new constants via the ADR 0042 D5
   formula, hard and advisory from the freshly measured size. The ADR states the multipliers and
   rounding. On any wording drift the ADR plus the suite's derivation comment win. Classify
   each row as **ratchet-down** or **raise**. A ratchet-down has no proposed value above its
   current constant, so it is a normal PR with no trailer. A raise has any value up, so it needs
   the gate and the trailer. Assemble the
   strike-list: surface · measured bytes @ measuring commit · current constants · proposed
   constants · direction · for each raise, the ADR 0042 D5 justification. The justification names
   the tier-1 doctrine that must stay inline, and why it can be neither evicted nor compressed.

3. **Gate** (the single approval point — every ceiling movement behind **one** operator ask,
   never a row-by-row negotiation). Present the full strike-list; collect the approved subset.
   An **unapproved raise never executes** — that surface's growth is funded the worker way
   instead: ADR 0042 D3/D4 eviction to `references/` behind a trigger pointer.

4. **Execute.** Edit only the gate-approved constants in
   [`prompt-surface-budgets.test.mjs`](../assets/prompt-surface-budgets.test.mjs), updating each
   touched row's derivation comment (new measured size + measuring commit) in the same edit.
   Every commit whose diff raises a `hard:`/`advisory:` value carries, per raised surface, the
   machine-checked trailer `Budget-Raise: ADR-0042 <surface> +<bytes>`. It also carries the
   ADR 0042 D5 citation in the commit body. The authoritative trailer grammar is whatever
   `assert-budget-raise-cited.sh` enforces, and on any drift the floor wins. Ratchet-downs need no trailer. The
   budget suite runs green before each commit.

5. **Report.** Per surface: before/after constants, measured size + measuring commit, direction,
   and each raise's cited justification. End with a **loud shortfall block** for any surface
   still at or above its (new) advisory line. That block signals that the next act is an
   ADR 0042 eviction, never another raise.
