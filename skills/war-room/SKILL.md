---
name: war-room
description: Interview the user to produce a WAR run configuration at .claude/war/config.json — per-role model and reasoning effort (e.g. a worker on ultrathink), coven policy + size, round limit, and the afk default. Presents presets (balanced/thorough/economy) then grills only the overrides the user wants. Writes the config and stops; /war auto-discovers and consumes it. Use when the user runs /war-room, wants to configure a WAR run, choose which models or how much effort WAR's agents use, or set how many auditors WAR convenes.
---

# /war-room — configure a WAR run

You produce a **run config** for `/war` and nothing else: you write `.claude/war/config.json`, then stop. You never decompose a plan, spawn agents, or launch `/war`. The schema, defaults, presets, and validator are owned by [`../war/assets/war-config.mjs`](../war/assets/war-config.mjs) — that script is the source of truth; shell out to it, don't reinvent the schema. Full field reference: [`../war/references/schemas.md`](../war/references/schemas.md) (§ Run config).

## Flow
1. **Pick a starting point.** If `.claude/war/config.json` already exists, show it and offer to start from it. Otherwise present the three presets and ask which to start from:
   - **balanced** — today's defaults (sonnet workers / opus auditors, `covenPolicy: auto`, session effort).
   - **thorough** — opus workers on `max` effort (ultrathink), opus auditors on `high`, a coven on every task.
   - **economy** — sonnet workers/auditors at session effort, a single auditor per task (`solo`), `roundLimit: 2`.
   Render the concrete JSON so the user sees exactly what they start from: `node ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/war-config.mjs --preset <name>`.
2. **Offer overrides.** Ask "anything to change?" and grill **only** the dimensions the user names, one at a time. Allowed values (reject anything else — the validator will too):
   - `agents.<role>.model` ∈ `opus | sonnet | haiku | fable`. Roles: `worker` (also drives fix-workers), `auditor`, `refiner`, `servitor`.
   - `agents.<role>.effort` ∈ `default | low | medium | high | xhigh | max`. Translate words: "ultrathink" → `max`, "think hard/harder" → `high`/`xhigh`, "normal"/"leave it" → `default`.
   - `audit.covenPolicy` ∈ `auto | all | solo`; `audit.covenSize` (integer ≥ 1, seats per coven); `audit.lenses` (array); `audit.autoEscalate` (bool).
   - `run.roundLimit` (integer ≥ 1); `run.afk` (bool).
   - `overrides.gate` / `workingBranch` / `landingBranch` / `learningsTarget` — `null` lets `/war` auto-detect; a string pins it.
   When the user touches coven settings, remind them: **`covenPolicy: "solo"` alone does not guarantee one auditor** — a Critical or low-confidence finding still escalates 1→coven. To pin a single auditor, also set `audit.autoEscalate: false`.
3. **Show the assembled config** as pretty JSON and ask for explicit confirmation.
4. **Validate, then write.** Validate through the module and only write on success (write to a temp file first so a failure never truncates an existing config):
   ```bash
   mkdir -p .claude/war
   printf '%s' '<assembled-json>' \
     | node ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/war-config.mjs --stdin --fill-defaults \
     > .claude/war/config.json.tmp \
     && mv .claude/war/config.json.tmp .claude/war/config.json \
     || { echo "validation failed — config NOT written"; rm -f .claude/war/config.json.tmp; }
   ```
   If it failed, show the validator's errors, fix them with the user, and retry. Never write an invalid or unvalidated file. (`--fill-defaults` writes the complete resolved config, so the file is self-describing.)
5. **Stop.** Tell the user: *"Config written to `.claude/war/config.json` (profile: <profile>). Run `/war <plan>` to use it, or `/war <plan> --config <path>` to point at a different file."* Do not launch `/war`.

## Notes
- Conversation-only: no `Agent`, no `Workflow`, no git writes beyond the single config file.
- If a `[Fact-Forcing Gate]` (GateGuard) blocks the write, present the facts it lists, then retry the identical command.
