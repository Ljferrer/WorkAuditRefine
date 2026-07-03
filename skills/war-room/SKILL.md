---
name: war-room
description: Interview the user to produce a WAR run configuration at .claude/war/config.json — per-role model and reasoning effort (e.g. a worker on ultrathink), the audit roster (1–5 distinct-lens seats, per-seat depth) + roster policy, round limit, and the afk default. Presents presets (balanced/thorough/economy) then grills only the overrides the user wants. Writes the config and stops; /war auto-discovers and consumes it. Use when the user runs /war-room, wants to configure a WAR run, choose which models or how much effort WAR's agents use, or shape the audit roster WAR convenes.
---

# /war-room — configure a WAR run

You produce a **run config** for `/war` and nothing else: you write `.claude/war/config.json`, then stop. You never decompose a plan, spawn agents, or launch `/war`. The schema, defaults, presets, and validator are owned by [`../war/assets/war-config.mjs`](../war/assets/war-config.mjs) — that script is the source of truth; shell out to it, don't reinvent the schema. Full field reference: [`../war/references/schemas.md`](../war/references/schemas.md) (§ Run config).

## Flow
1. **Pick a starting point.** If `.claude/war/config.json` already exists, show it and offer to start from it. Otherwise present the three presets and ask which to start from:
   - **balanced** — default profile: opus workers on `max` effort (ultrathink), opus auditors on `xhigh`, sonnet refiner, sonnet servitor on `high`. Roster pool: the trio (`correctness`, `cascading-impact`, `plan-faithfulness`) at `deep`, seeded per task by `rosterPolicy: auto` — the Lead composes 1–5 seats per task from the lens catalog, each with an explicit per-seat depth and a one-line rationale (leaf tasks get one `neighbors` seat); `run.ace` on.
   - **thorough** — fable workers on `max`, opus auditors on `max`, opus servitor. Five-lens pool (trio + `security` + `test-fidelity`) under `rosterPolicy: auto` — the Lead composes 1–5 seats per task from the catalog, each at its own depth with a one-line rationale; `run.ace` on.
   - **economy** — sonnet workers/auditors/servitor at session effort, a single auditor per task (`rosterPolicy: solo`), `roundLimit: 2`, `run.ace` off. Use for cost-sensitive runs.
   Render the concrete JSON so the user sees exactly what they start from: `node ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/war-config.mjs --preset <name>`.
2. **Offer overrides.** Ask "anything to change?" and grill **only** the dimensions the user names, one at a time. Allowed values (reject anything else — the validator will too):
   - `agents.<role>.model` ∈ `opus | sonnet | haiku | fable`. Roles: `worker` (also drives fix-workers), `auditor`, `refiner`, `servitor`.
   - `agents.<role>.effort` ∈ `default | low | medium | high | xhigh | max`. Translate words: "ultrathink" → `max`, "think hard/harder" → `high`/`xhigh`, "normal"/"leave it" → `default`.
   - `audit.roster` — an array of 1–5 seat objects `{ lens, depth? }` (lenses distinct; `depth` ∈ `neighbors | deep`, omitted → `deep`). Present it as a **seat list** — one lens + depth per seat. `audit.rosterPolicy` ∈ `auto | all | solo`; `audit.autoEscalate` (bool). Legacy `covenSize`/`lenses`/`covenPolicy` keys fail validation (removed/renamed) — never write them.
   - `run.roundLimit` (integer ≥ 1); `run.afk` (bool); `run.ace` (bool — pre-merge auto-fix of auditor-flagged nits; default `true`, the economy preset pins `false`).
   - `overrides.gate` / `workingBranch` / `landingBranch` / `learningsTarget` — `null` lets `/war` auto-detect; a string pins it.
   When the user touches roster settings, remind them: **`rosterPolicy: "solo"` alone does not pin one auditor** — a Critical or low-confidence finding on a lone seat still widens the roster, toward the auditor's `widen` nomination when it supplies a valid one, else the default roster's lenses. To pin a single auditor, also set `audit.autoEscalate: false`.
3. **Resolve provisioning** (`run.provision` — the commands that make a fresh worker worktree gate-ready). Ask the module what to do rather than deciding yourself — pass the assembled-so-far config to `resolveProvision` (exported by `war-config.mjs`); it returns `{ provision, source, scout }`:
   - **`scout: false` with a non-empty `provision`** — the operator pinned an explicit list (or it was carried from an existing config). Honor it **verbatim**; do **not** run the scout. Leave `run.provision` and `run.provisionSource` exactly as they are.
   - **`scout: false` with an empty `provision`** — `provisionAuto` is off. Leave `run.provision: []` / `run.provisionSource: "none"`; no scout, no steps.
   - **`scout: true`** — `provisionAuto` is on and no explicit list exists. Run the read-only setup-scout (`agents/war-setup-scout.md`) against the target repo via `Agent`. Present its **proposed `provision` list + `source` + `rationale`** to the operator and ask them to confirm or edit. Write the **CONFIRMED** list into `run.provision` and the scout's `source` into `run.provisionSource`. If the operator declines all steps, write `run.provision: []` / `run.provisionSource: "none"`.
   - **`--refresh-provision`** — when invoked with this flag, first **clear** any existing `run.provision` (set it to `[]` and `run.provisionSource: "none"`) so `resolveProvision` reports `scout: true`, then re-scout as above. This is the only way to re-derive a list that is already pinned (a non-empty list otherwise short-circuits the scout).
4. **Submodule overlap check.** Before showing the final config, inspect the plan file (if provided) for task target paths. If any plan target path overlaps with a `.gitmodules` submodule path in the repo (i.e. any target is under a declared submodule prefix), surface a **setup warning** for each overlap before proceeding:
   > ⚠ task `<task-id>` targets `<path>` inside submodule `<submodule-path>`; WAR is single-repo as of v0.7.8 — do that change by hand, or wait for Increment 2.
   If no `.gitmodules` exists, or no overlaps are found, continue silently. This warning does not block config writing — it is informational so the operator can decide before investing a full run.
5. **Show the assembled config** as pretty JSON and ask for explicit confirmation.
6. **Validate, then write.** Validate through the module and only write on success (write to a temp file first so a failure never truncates an existing config):
   ```bash
   mkdir -p .claude/war
   printf '%s' '<assembled-json>' \
     | node ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/war-config.mjs --stdin --fill-defaults \
     > .claude/war/config.json.tmp \
     && mv .claude/war/config.json.tmp .claude/war/config.json \
     || { echo "validation failed — config NOT written"; rm -f .claude/war/config.json.tmp; }
   ```
   If it failed, show the validator's errors, fix them with the user, and retry. Never write an invalid or unvalidated file. (`--fill-defaults` writes the complete resolved config, so the file is self-describing.)
7. **Stop.** Tell the user: *"Config written to `.claude/war/config.json` (profile: <profile>). Run `/war <plan>` to use it, or `/war <plan> --config <path>` to point at a different file."* Do not launch `/war`.

## Notes
- Conversation-only: no `Workflow`, no git writes beyond the single config file. The **only** `Agent` you may spawn is the read-only setup-scout (step 3), and only when `resolveProvision` reports `scout: true` (or `--refresh-provision` was passed); it is `Read/Grep/Glob`-only and changes nothing.
- **`--refresh-provision`** clears a pinned `run.provision` and re-runs the setup-scout. Without it, a non-empty `run.provision` short-circuits scouting and is honored verbatim (explicit operator intent).
- If a `[Fact-Forcing Gate]` (GateGuard) blocks the write, present the facts it lists, then retry the identical command.
