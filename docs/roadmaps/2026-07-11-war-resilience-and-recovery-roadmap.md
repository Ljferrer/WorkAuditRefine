# WAR resilience & recovery campaign — 4 plans

Source survey: `.claude/aot/2026-07-11-survey.json`. All plans authored by `/war-machine`
(interactive, operator-ratified intents) on 2026-07-11, grounded on master `bbaa68a`
(v0.14.23, post-#729/#730 merges). Stack order is operator-ratified per ADR 0011
(stack-and-plow): plan N bases on plan N−1's tip; **plan 1 cuts from fresh
`origin/master` (≥ `bbaa68a`), never a prior campaign tip** (lesson
`war-branch-base-off-latest-master-not-prior-tip`).

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [red-team-resilience](../plans/2026-07-11-red-team-resilience.md) | `skills/red-team/assets/workflow-scaffold.js` + `.test.mjs`, `skills/red-team/SKILL.md`, `skills/red-team/references/lenses.md`, `CONTEXT.md`, release slots | next-free @ land | — (position 1 operational, see spine) |
| 2 | [drift-guard-tightening](../plans/2026-07-11-drift-guard-tightening.md) | **Test-only, no release phase:** `skills/war/assets/workflow-template.test.mjs`, `gate-pin-status.test.sh`, `assert-guard-specificity-in-diff.test.sh`, `assert-test-in-diff.test.sh` | — (no release) | base ≥ `bbaa68a` (hard precondition, see notes) |
| 3 | [servitor-redaction-at-source](../plans/2026-07-11-servitor-redaction-at-source.md) | `agents/war-servitor.md`, `skills/war/assets/workflow-template.js` (D3 `pt` line) + `workflow-template.test.mjs` (new D3 registry row), release slots | next-free @ land | **2 (hard — shared `workflow-template.test.mjs`; REGISTRY floor rule)** |
| 4 | [partial-phase-recovery-and-branch-hygiene](../plans/2026-07-11-partial-phase-recovery-and-branch-hygiene.md) | `skills/war/assets/provision-worktrees.sh` + `.test.sh`, `workflow-template.js` + `.test.mjs`, `agents/war-worker.md`, `land-decision.mjs` + `.test.mjs`, `skills/war/SKILL.md`, `skills/war/references/schemas.md`, `CONTEXT.md`, `docs/adr/0035-*`, release slots | next-free @ land | **2, 3 (hard — workflow-template pair); 1 (contention — CONTEXT.md + release slots)** |

Ver entries are directive, not literals: each release phase resolves the **next free patch
above the live integration base at land time** across the four slots (`plugin.json`,
`marketplace.json` ×2, `README.md ## Status`) — never a pre-resolved semver (lesson
`stacked-release-plan-version-literal-lags-operator-target`). Plan 2 is test-only and
ships no release phase.

## Issue → spec → plan chain

| Issue | Spec | Plan | Disposition |
|-------|------|------|-------------|
| #727 | [red-team-resilience-design](../specs/2026-07-11-red-team-resilience-design.md) | 1 | Closed whole at aftermath |
| #650 (red-team half) | [red-team-resilience-design](../specs/2026-07-11-red-team-resilience-design.md) | 1 | **Not closed by plan 1** — scoping comment naming the ff-topology half that landed |
| #693 | [drift-guard-tightening-design](../specs/2026-07-11-drift-guard-tightening-design.md) | 2 | `Closes #693` in phase-end PR |
| #732 | [drift-guard-tightening-design](../specs/2026-07-11-drift-guard-tightening-design.md) | 2 | `Closes #732` + comment recording the survey-derived `assert-guard-specificity-in-diff.sh` addition outside the issue's file list |
| #726 | [servitor-redaction-at-source-design](../specs/2026-07-11-servitor-redaction-at-source-design.md) | 3 | `Closes #726` |
| #725 | [partial-phase-recovery-and-branch-hygiene-design](../specs/2026-07-11-partial-phase-recovery-and-branch-hygiene-design.md) | 4 | Closed |
| #728 | [partial-phase-recovery-and-branch-hygiene-design](../specs/2026-07-11-partial-phase-recovery-and-branch-hygiene-design.md) | 4 | Closed |
| #731 (residual) | [partial-phase-recovery-and-branch-hygiene-design](../specs/2026-07-11-partial-phase-recovery-and-branch-hygiene-design.md) | 4 | Closed |
| #650 (engine half) | [partial-phase-recovery-and-branch-hygiene-design](../specs/2026-07-11-partial-phase-recovery-and-branch-hygiene-design.md) | 4 | Closed (survey manifest assigns #650 here) |

## Dependency spine (strict landing order)

```
1 → 2 → 3 → 4
```

Content edges: **3 → 2** (shared `workflow-template.test.mjs` — plan 3's D3 registry
row is written against plan 2's landed qualifier-lock content) and **4 → {2, 3}**
(plan 4 touches the whole `workflow-template.js`/`.test.mjs` pair, which 2 and 3 edit
before it, plus `CONTEXT.md` and release slots that 1 touches). Plan 1 has **no content
edge** into 2/3/4 — its position 1 is operational, not textual: `/war-campaign` red-teams
every subsequent plan with `/red-team` itself, and #727's analyzed-agent fallback must be
landed in the live scaffold before those runs, or a harness missing the built-in `Explore`
agent silently collapses 11 of 13 probes on the campaign's own verification passes.
Landing 1 first also front-loads the only red-team-family plan, leaving 2 → 3 → 4 a pure
`skills/war/` + `agents/` progression. Plan 2 lands before 3 and 4 both for the shared
test file and because its per-rule qualifier lock then guards 3's and 4's own
prompt-surface edits as they land. Plan 4 stacks last: it is the widest footprint and
collides with everything (2 + 3 on the workflow-template pair, 1 on `CONTEXT.md` and the
release slots).

**Operator-ratified base rules:**

- **Plan 1 base:** fresh `origin/master`, which must be at or beyond `bbaa68a`
  (v0.14.23) — never the previous campaign's tip.
- **Plan 2 hard precondition:** its frozen phase base MUST descend from `origin/master`
  `bbaa68a` — every construct it edits (`CALIBRATION_RULE_ANCHORS`, Case 10a–10e, the
  floors' `match_sh_suite`/`match_default` copies) lands in #729/#730 and is **absent at
  older bases**; a stacked predecessor tip qualifies only if it carries those merges
  (plan 1's tip does, given the plan-1 base rule). **Lead preflight before Provision:**
  `git grep -c CALIBRATION_RULE_ANCHORS <base> -- skills/war/assets/workflow-template.test.mjs` ≥ 1
  and `git grep -c 'case 10e' <base> -- skills/war/assets/assert-test-in-diff.test.sh` ≥ 1;
  a miss halts before any worker spawns (listed as the plan's first backstop).

## Shared-file contention

| File | Plans | Risk |
|------|-------|------|
| `skills/war/assets/workflow-template.test.mjs` | 2, 3, 4 | **Hottest file.** 2: `CALIBRATION_RULE_ANCHORS` per-rule qualifier lock; 3: new D3 both-surfaces registry row; 4: engine-mechanic tests. Distinct constructs; spine serializes — each successor rebases onto the prior plan's landed content. See the REGISTRY-floor rule below. |
| `skills/war/assets/workflow-template.js` | 3, 4 | 3: one `pt` line in the servitor Wrap-up `agent(...)` dispatch (D3); 4: four engine mechanics elsewhere in the Workflow. Disjoint constructs; 4 → 3 edge serializes. |
| `CONTEXT.md` | 1, 4 | Term additions in different sections (1: red-team terms; 4: four recovery terms). Append-only; spine serializes. |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` | 1, 3, 4 | Trailing release phases touch the four version slots (plan 2 has none). Strict serial; each resolves next-free patch from the slots at land time; `version-slots.test.mjs` enforces the four-slot lockstep. |

No other file is touched by two plans: plan 1's `skills/red-team/` family, plan 2's three
floor-test `.sh` files, plan 3's `agents/war-servitor.md`, and plan 4's
`provision-worktrees.*` / `land-decision.*` / `war-worker.md` / `skills/war/SKILL.md` /
`schemas.md` / ADR 0035 families are each single-owner.

**Campaign notes:**

- **REGISTRY-floor rederive-at-rebase (standing rule):** any `REGISTRY.length`-style
  count floor in `workflow-template.test.mjs` is **re-derived from the live array at
  rebase time**, never carried from a plan literal — a git auto-merge of two independent
  floor bumps composes textually but leaves the floor one short of the true count,
  yielding silent slack (the #693 gap this campaign closes). Plan 3's new D3 row is the
  first row added under this rule; its floor is set to the true post-rebase count.
- Every plan is red-teamed by `/war-campaign` before execution (reports at
  `docs/red-team/2026-07-11-<plan-slug>.md`); plan 1 lands first so those runs use the
  fixed scaffold.
- ADR numbers float — plan 4's ADR 0035 re-resolves against `docs/adr/` at land.
- The roadmap is authoring input + a committable snapshot; the live queue is the
  campaign ledger (`/war-campaign`'s `assets/campaign-ledger.mjs`).
