# F06 — Default audit breadth: full 3-lens panel — Design

**Status:** proposed — targets **v0.6.0** (behavior change). **Severity: MEDIUM.**
**Source:** agent-architecture-audit F6. **Operator decision (2026-06-25): default to the full 3-lens panel.**

## Problem — the default merges the happy path on one lens

With the default `balanced` / `covenPolicy: 'auto'` config
([war-config.mjs:28-33](../../skills/war/assets/war-config.mjs)), a task is reviewed by **one seat through one
lens** (`correctness`); `cascading-impact` and `plan-faithfulness` run **only** after an auto-escalation triggered
by a Critical/low-confidence on that lone seat ([workflow-template.js:160-164](../../skills/war/assets/workflow-template.js),
[:246](../../skills/war/assets/workflow-template.js)). A clean correctness approval merges with **zero**
cross-impact or plan-faithfulness review — contradicting the README's "independent, unanimous, multi-lens panel."

## Decisions (operator chose the full panel)

- **D1 — Default = full multi-lens panel.** Every task is reviewed by `correctness` + `cascading-impact` +
  `plan-faithfulness`, **unanimous** approval required.
- **D2 — Implementation.** Flip `DEFAULTS.audit.covenPolicy` from `'auto'` to `'all'` in
  [war-config.mjs](../../skills/war/assets/war-config.mjs) (the Lead already "seeds `task.coven` Lead-side" from
  `covenPolicy` — `'all'` → `task.coven = true`). `covenSize` defaults to `lenses.length` (3). Keep `autoEscalate`
  so a panel can still widen / deepen on low confidence or a Critical.
- **D3 — Panel depth (Open).** Coven tasks currently run at depth `'deep'`. A full panel on *every* task at
  `'deep'` is expensive. Recommend the **default panel runs at `'neighbors'`**, escalating to `'deep'` on a coven
  trigger — surfacing depth as the cost knob rather than breadth.
- **D4 — Presets.** `economy` stays **solo** (single lens) for cost; `balanced` becomes the full panel;
  `thorough` already implies `'all'` + deep. Update the preset table + `/war-room` copy.
- **D5 — Keep the mirror honest.** `workflow-template.js` selects lenses inline
  (`!task.coven ? [baseLenses[0]] : ...`); with the default flip, the Lead-seeded `task.coven` must agree with the
  template path. Update the drift guard (F07) + tests, and update the README claim (now actually true).

## Solution shape

`war-config.mjs` DEFAULTS + PRESETS change; ensure the Lead's `covenPolicy → task.coven` seeding and the template
lens-selection agree; drift test; doc/README update.

## Schema & contract changes

- `DEFAULTS.audit.covenPolicy: 'auto' → 'all'`. No new fields. `covenSeats`/`spawn` mirrors unchanged in shape.

## Affected files

`skills/war/assets/war-config.mjs` (DEFAULTS + PRESETS) · `skills/war/assets/war-config.test.mjs` (preset + drift) ·
`skills/war/assets/workflow-template.js` (confirm default-coven path) · `README.md` (panel claim) ·
`skills/war-room/SKILL.md` + `docs/specs/2026-06-18-war-room-design.md` · `skills/war/references/schemas.md`.

## Alternatives considered (not chosen)

- **Document the single-lens default** (cheapest, no cost change).
- **2-lens default** (correctness + plan-faithfulness; cascading-impact on escalation).
- **Promote breadth to a prominent preset knob** without changing the default.

The operator selected the **full 3-lens panel** for safety / to match the advertised behavior.

## Validation criteria

- A default-config run spawns **3 audit seats** (correctness, cascading-impact, plan-faithfulness) per task,
  unanimous required; `economy` preset still solo.
- The README's "multi-lens panel" claim is now accurate.
- Drift guard asserts the template's default lens selection matches `covenSeats` under `covenPolicy: 'all'`.

## Open decisions

1. **D3 default panel depth** — `'neighbors'`-by-default + `'deep'`-on-escalation (recommended) vs `'deep'` always.
2. Cost note / budget guidance for `balanced` now that it triples auditor spawns on the happy path.
