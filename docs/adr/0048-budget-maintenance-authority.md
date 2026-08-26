# Budget-maintenance authority

**Status:** accepted (ratified by
[the plan](../plans/2026-08-25-engine-reliability-and-filing-fidelity.md), Phase 2 Task 3,
assumption A5; originating incident: issue #1586)

[ADR 0042](0042-prompt-surface-budgets.md) gave every prompt-bearing prose surface a standing
advisory/hard byte budget with ratchet-down semantics, but left implicit *who* may move a
ceiling. The gap bit: a worker needing headroom on a budgeted surface re-baselined that
surface's hard ceiling by +9,216 B to fund a +232 B addition — caught only by audit luck,
because the raise carried no citation (issue #1586). An uncited raise is indistinguishable in
review from a sanctioned re-baseline unless authority is explicit and machine-checked.

## Decision

**Workers fund growth within ceilings; ceiling changes are operator acts, performed via the
re-baseline pass and machine-enforced by the Budget-Raise floor.**

1. **Worker lane — within-ceiling funding only.** An agent (worker, fix-worker, polish pass —
   any in-run writer) needing headroom on a budgeted surface funds it under the existing
   constants: ADR 0042 D3/D4 eviction — a byte-identical move to `references/` behind a
   trigger pointer — or provable cross-surface compression. It never raises a `hard:` or
   `advisory:` constant.
2. **Operator lane — the re-baseline pass.** Ceilings move only through the operator-gated
   re-baseline pass
   ([`skills/war/references/budget-rebaseline.md`](../../skills/war/references/budget-rebaseline.md)):
   preflight (measure every budgeted surface) → plan (proposed constants via the ADR 0042 D5
   formula) → one operator gate → execute → report. Only its gate-approved rows may raise a
   constant.
3. **Machine enforcement — the Budget-Raise floor.** The merge-path floor
   `skills/war/assets/assert-budget-raise-cited.sh` refuses any merge diff that raises a
   `hard:`/`advisory:` ceiling value in `skills/war/assets/prompt-surface-budgets.test.mjs`
   without a `Budget-Raise: ADR-0042 <surface> +<bytes>` commit trailer in the range (the
   no-test-style fix-worker route). Ratchet-down — lowering a constant — stays a normal PR
   needing no trailer (ADR 0042 D5, unchanged).
4. **De-mirror.** This ADR states authority only. Live constants exist solely in
   `prompt-surface-budgets.test.mjs` (each row beside its derivation comment); the formula is
   ADR 0042 D5. Neither is restated here or in the re-baseline doc — a quoted number would be
   a mirror that rots.

## Considered options

- **Fold the rule into ADR 0042's surface (rejected — A5's fallback).** ADR 0042 records the
  budget *design* (scope, formula, hot/cold law); who may move a ceiling is a distinct standing
  authority rule that the floor script and the re-baseline pass each cite independently — a
  one-page ADR keeps the citation target stable while 0042 evolves.
- **Prose-only authority, no floor (rejected).** The motivating incident was caught by audit
  luck; an unenforced rule re-opens exactly that hole. The trailer makes every raise carry its
  own operator-citable evidence at merge time.

## Relationship to prior ADRs

- [ADR 0042](0042-prompt-surface-budgets.md) — the budget design this ADR assigns authority
  over; its D5 ratchet-down/justification semantics are unchanged, now machine-enforced on the
  raise side.
