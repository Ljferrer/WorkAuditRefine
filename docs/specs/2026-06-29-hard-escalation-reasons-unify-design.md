# Unify HARD_ESCALATION_REASONS — remove the `unrunnable-deps` mirror divergence

**Status:** proposed (design) — from the 2026-06-29 agent-architecture audit (finding L1), resolved by grilling

`HARD_ESCALATION_REASONS` is hand-mirrored across the no-import sandbox boundary: [`land-decision.mjs:8`](../../skills/war/assets/land-decision.mjs#L8) lists **6** reasons; [`workflow-template.js:409`](../../skills/war/assets/workflow-template.js#L409) lists **7**, adding `unrunnable-deps`. The divergence was deliberate (a "scheduler-local addition", [`workflow-template.js:394`](../../skills/war/assets/workflow-template.js#L394)), but it is annotated only on the producer side; `land-decision.mjs` — the named source of truth — has no reciprocal note, and the pure `decideLand` returns the wrong answer (`held:nothing-merged`) for an `unrunnable-deps` escalation (audit finding L1).

This spec **removes the divergence** by adding `unrunnable-deps` to the canonical set so the two mirrors are identical.

## 1. Grounding (why this is zero-risk)

- **`decideLand` is not live-called.** It appears only in `land-decision.test.mjs`, the `war-config.test.mjs` drift-guards, and `design.md`. The *live* land decision is the Workflow's own inline copy, which already includes `unrunnable-deps` and already returns `held:escalation` for it ([`workflow-template.test.mjs:1478`](../../skills/war/assets/workflow-template.test.mjs#L1478)). So unifying changes **no live behavior** — only the pure `decideLand`'s answer for one input it is never live-fed, plus the guard/comments.
- **The divergence is already drift-guarded** with superset semantics ([`war-config.test.mjs:360-374`](../../skills/war/assets/war-config.test.mjs#L360), [`:883-896`](../../skills/war/assets/war-config.test.mjs#L883)): "inline = canonical **+ exactly** `['unrunnable-deps']`". Unifying flips this to a plain equality.
- **No existing test asserts the old `decideLand` answer** for `unrunnable-deps` (the 6 canonical reasons are tested; `unrunnable-deps` is not) — so there is nothing to break, only a new assertion to add.

## 2. Decision

Add `unrunnable-deps` to `land-decision.mjs`'s `HARD_ESCALATION_REASONS`, making both mirrors the **identical 7-entry set**. The pure `decideLand` now correctly returns `held:escalation` for an `unrunnable-deps` escalation, and the mirror relationship simplifies from "superset + one documented exception" to "exact identity."

**Why unify over documenting the divergence (the audit's minimal rec):**
- `decideLand` is the *pure* land/hold decision; `unrunnable-deps` *is* semantically a hard hold (a ghost-dep task can never run, so the phase cannot cleanly land). Excluding it made the pure function wrong for a valid input.
- A single identical set is simpler to reason about and to guard (identity, not superset-with-an-exception) than a documented divergence.
- The "scheduler-local" framing described *where the reason is produced* (the post-loop sweep, [`:399`](../../skills/war/assets/workflow-template.js#L399)), not whether it is a hard hold — so it never justified excluding it from the *decision* set.

## 3. Forced cascade (surface changes)

Changing a mirrored constant forces every mirror site + guard + comment to move together (memory: `plan-file-list-incomplete-when-drift-guard-forces-cascade`).

| File | Change |
|---|---|
| [`skills/war/assets/land-decision.mjs`](../../skills/war/assets/land-decision.mjs) | Add `'unrunnable-deps'` to `HARD_ESCALATION_REASONS` (→ 7 entries, identical to the inline copy). |
| [`skills/war/assets/land-decision.test.mjs`](../../skills/war/assets/land-decision.test.mjs) | Add an assertion: `decideLand({ escalated: [{ reason: 'unrunnable-deps' }] }) === 'held:escalation'`. |
| [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) | Update the `:394` comment — it is no longer a divergence; `unrunnable-deps` is now in `land-decision.mjs` too. The inline array (`:409`) is unchanged (already 7 entries). |
| [`skills/war/assets/war-config.test.mjs`](../../skills/war/assets/war-config.test.mjs) | Flip both drift-guards from **superset** ("only extra is `unrunnable-deps`") to **equality** (inline `HARD_ESCALATION_REASONS` deep-equals canonical); update the explanatory comments (`:360-374`, `:883-896`) that describe the divergence. |
| [`skills/war/references/design.md`](../../skills/war/references/design.md) | If §110's mirror note implies the divergence, align it to "identical mirror"; otherwise no change. |

No new CONTEXT.md terms (this *removes* a concept — the scheduler-local divergence — rather than adding vocabulary).

## 4. No ADR

This does **not** warrant an ADR. After unifying, the end state is unremarkable (two identical mirrors — the expected default), the change is trivially reversible (one array element), and there is no surprising trade-off left for a future reader to wonder about. The *reason* for the prior divergence and its removal is captured here and in the commit message; that is sufficient. (Per the domain-modeling ADR bar: not hard-to-reverse, not surprising-in-result.)

## 5. Validation criteria

1. **Mirrors are identical.** `land-decision.mjs`'s `HARD_ESCALATION_REASONS` deep-equals the `workflow-template.js:409` inline literal (7 entries each).
2. **`decideLand` is now correct.** `decideLand({ escalated: [{ reason: 'unrunnable-deps' }] })` returns `held:escalation` (new test).
3. **Drift-guard is equality.** The `war-config.test.mjs` guards assert exact equality, not superset; they fail if the two sets diverge by *any* entry (in either direction).
4. **Live behavior unchanged.** The `#115` post-loop-sweep tests still pass — a ghost-dep phase still yields `landDecision: held:escalation`.
5. **Full gate green.** All `*.test.mjs` + `*.test.sh` runners pass after the cascade.
