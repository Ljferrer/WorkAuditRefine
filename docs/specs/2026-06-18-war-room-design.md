# `/war-room` — Run-Configuration Interview (Design Spec)

- **Date:** 2026-06-18
- **Status:** Approved design — ready for implementation planning
- **Repo:** WorkAuditRefine (`work-audit-refine` plugin)
- **Introduces:** v0.3.0

## Problem

WAR hardcodes agent models and reasoning effort, and the auditor count is a 1-or-3
decision made only at the in-run approval gate. Before a run there is no way to set:

- which **model** each role uses (worker / auditor / refiner / servitor),
- how much each role should **think** (e.g. a worker on `ultrathink`),
- the default **coven policy** (how many auditors, when).

Today these live as literals in `skills/war/assets/workflow-template.js` and the agent
frontmatter, with the JS literal winning — so they are effectively unconfigurable
without editing code.

## Solution overview

A new conversation-only skill **`/war-room`** interviews the user, assembles a run
configuration, and writes it to `.claude/war/config.json`. It is **fully decoupled**
from `/war`: war-room only writes; `/war` auto-discovers and consumes the file.
**Absent a config file, `/war` behaves byte-for-byte as it does today.**

## Resolved design decisions

1. **Relationship — config generator only.** war-room writes the config and stops; it
   never decomposes the plan or launches `/war`.
2. **Scope — agent tuning + run knobs.** Per-role model + effort, coven policy,
   `roundLimit`, and the `--afk` default. May *optionally* override `/war`'s
   auto-detected gate / branches / learnings-target, but defaults to letting `/war`
   detect them.
3. **Style — named presets + targeted overrides.** Offer a few profiles as starting
   points, then grill only the dimensions the user wants to change.
4. **Artifact — JSON at `.claude/war/config.json`.** Auto-discovered by `/war`;
   `/war <plan> --config <path>` selects a different file.
5. **Granularity — global per-role + a coven *policy*.** war-room runs before the plan
   is decomposed, so it cannot reference specific tasks/lenses. The policy *seeds* the
   per-task coven flags the Lead proposes at `/war`'s approval gate; it does not replace
   that gate.
6. **Naming — `covenPolicy: auto | all | solo`** (renamed from a proposed
   `covenWhen` / `never`). `solo` = each task starts with a single auditor seat.
7. **Version — v0.3.0** (new feature, not a patch).

## Config schema (`.claude/war/config.json`)

```json
{
  "version": 1,
  "profile": "thorough",
  "agents": {
    "worker":   { "model": "opus",   "effort": "max" },
    "auditor":  { "model": "opus",   "effort": "high" },
    "refiner":  { "model": "sonnet", "effort": "default" },
    "servitor": { "model": "sonnet", "effort": "default" }
  },
  "audit": {
    "covenSize": 3,
    "lenses": ["correctness", "cascading-impact", "plan-faithfulness"],
    "covenPolicy": "auto",
    "autoEscalate": true
  },
  "run": { "roundLimit": 3, "afk": false },
  "overrides": { "gate": null, "workingBranch": null, "landingBranch": null, "learningsTarget": null }
}
```

### Field reference

- **`agents.<role>.model`** ∈ `opus | sonnet | haiku | fable`. Roles: `worker`,
  `auditor`, `refiner`, `servitor`. The **fix-worker reuses `worker`'s config** (it is a
  worker variant).
- **`agents.<role>.effort`** ∈ `default | low | medium | high | xhigh | max`. The
  interview speaks human ("ultrathink" → `max`, "think hard" → `high`/`xhigh`,
  "normal" → `default`). **`default` = omit the effort opt = inherit the session**
  (today's behavior).
- **`audit.covenSize`** — integer ≥ 1; number of seats when a coven is convened.
- **`audit.lenses`** — drawn from `{correctness, cascading-impact, plan-faithfulness}`
  plus optional domain lenses (`healthcare-safety`, `security`).
- **`audit.covenPolicy`** ∈ `auto | all | solo`:
  - `auto` — the Lead's high-blast-radius judgment seeds covens per task (**today's
    behavior**).
  - `all` — every task is seeded with a coven.
  - `solo` — every task is seeded with a single auditor seat.
- **`audit.autoEscalate`** — boolean, default `true`. The runtime 1→coven escalation
  when a lone seat returns a Critical finding or `confidence: low`.
  - **NOTE:** `covenPolicy: "solo"` alone does **not** guarantee a single auditor — a
    coven can still form via auto-escalation. **To guarantee a coven is never used, set
    `covenPolicy: "solo"` *and* `autoEscalate: false`.**
- **`run.roundLimit`** — integer ≥ 1; fix-loop attempts before `audit-blocked`.
- **`run.afk`** — boolean; the default for `/war`'s `--afk` (still overridable on the
  command line).
- **`overrides.{gate,workingBranch,landingBranch,learningsTarget}`** — `null` = let
  `/war` auto-detect; a string value pins it.

### Presets

| Dimension | Balanced (= today) | Thorough | Economy |
|---|---|---|---|
| worker | sonnet / `default` | opus / `max` | sonnet / `default` (or haiku) |
| auditor | opus / `default` | opus / `high` | sonnet / `default` |
| refiner | sonnet / `default` | sonnet / `default` | sonnet / `default` |
| servitor | sonnet / `default` | sonnet / `default` | sonnet / `default` |
| covenPolicy | `all` | `all` | `solo` |
| covenSize | 3 | 3 | 3 |
| autoEscalate | `true` | `true` | `true` |
| roundLimit | 3 | 3 | 2 |

Economy gets its single auditor from `covenPolicy: "solo"`, not from `covenSize`; `covenSize` only sizes a coven if one is actually convened (e.g. by auto-escalation), so it stays at the default 3. (A `covenSize: 1` would make auto-escalation convene an incoherent "coven of one" — to pin a strictly single auditor, set `covenPolicy: "solo"` + `autoEscalate: false` instead.)

## `/war-room` skill behavior

Conversation-only — no agents, no Workflow, no plan decomposition, no launch.

1. Present the three presets; user picks a starting point.
2. Walk the **overrides** (only the dimensions the user wants to change), **validating
   each choice** against the allowed enum/range. Reject invalid values.
3. Show the **assembled JSON** and wait for a yes.
4. Write `.claude/war/config.json`, then stop with: *"Config written. Run
   `/war <plan>` to use it."*

## `/war` consumption layer (changes in the WAR repo)

1. **`skills/war/SKILL.md`** — the Setup step loads `.claude/war/config.json` if present
   (or `--config <path>`), announces *"using config from …"*, merges it over the
   built-in defaults, threads it into the Workflow `args`, and seeds per-task covens from
   `audit.covenPolicy`.
2. **`skills/war/assets/workflow-template.js`** — replace the hardcoded
   `model: 'sonnet'`/`'opus'` literals with `args.agents.<role>.model`; pass `effort`
   from `args.agents.<role>.effort` (omit when `default`); gate the 1→coven
   auto-escalation on `args.audit.autoEscalate`; use `covenSize`/`covenPolicy` when
   seeding; read `roundLimit`/`afk` from `args.run`.
3. **`skills/war/references/schemas.md`** — document the config schema and extend the
   documented Workflow `args` contract (`agents`, `audit`, `run`).
4. **`skills/war/references/design.md`** — record the `/war-room` decision + config surface.
5. **`README.md`** — document `/war-room` and the config file.
6. **`.claude-plugin/plugin.json`** — add `./skills/war-room` to `skills`; bump version.

**Precedence:** explicit `/war` CLI flags > config file > built-in defaults.

## Backward compatibility

- No config file → identical to today's behavior.
- Partial config → merged over defaults (missing keys fall back).
- `effort: "default"` → no `effort` opt passed (inherits session), matching today.

## Out of scope (YAGNI)

- Per-task / per-phase configuration (war-room runs pre-decomposition).
- A named-profile registry / `--profile` selection (single default file + `--config`
  path only).
- war-room launching `/war` (decoupled by design).

## Version bump

`0.2.2 → 0.3.0` in `plugin.json`, `marketplace.json`, and the README Status line.

## Open questions

None — design fully resolved.
