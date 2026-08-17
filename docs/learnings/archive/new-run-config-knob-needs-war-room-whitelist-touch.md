---
name: new-run-config-knob-needs-war-room-whitelist-touch
description: "RESOLVED (redteam-rounds-config-telemetry Task 1.4, #1376): A new run.* config key added to war-config.mjs (DEFAULTS + PRESETS + validate()) has FOUR doc-cascade homes, not one — the canonical export, schemas.md's field reference, the consuming skill's doc, and /war-room's step-2 interview whitelist — and the last one is the surface most likely to be missed: it survived three separate audit rounds unfixed in one phase because nothing tests it and the config still validates/resolves cleanly without it"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: new-run-config-knob-needs-war-room-whitelist-touch
  phase: precision-chain-and-loop-breaker/4.3
  keywords: 
    - war-room
    - run config
    - config knob
    - whitelist
    - schemas.md
    - doc cascade
    - coherence gap
    - redteamRoundLimit
    - interview step 2
  tags: 
    - war
    - war-room
    - config
    - doc-drift
  created: 2026-08-06
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-06T21:22:57.001Z
---

# A new run.* config knob's doc cascade has four homes; /war-room's step-2 whitelist is the one that lags

## The pattern

Adding a new key to `war-config.mjs`'s `run` block (`DEFAULTS.run`, optionally a `PRESETS.*.run`
override, and a `validate()` guard) makes the key live and grillable-in-principle, but it has to
be **separately** wired into every surface that documents or offers it:

1. `skills/war/assets/war-config.mjs` — `DEFAULTS`/`PRESETS`/`validate()` (canonical, code).
2. `skills/war/references/schemas.md` — the `## Run config` field-reference table (`run: {
   roundLimit, ..., <newKey> }` plus a note-block clause).
3. The consuming skill's own doc (e.g. `skills/red-team/SKILL.md` / its `references/` file) —
   describes what the key does operationally.
4. `skills/war-room/SKILL.md` step 2's **allowed-override whitelist** ("grill ONLY the
   dimensions the user named. Allowed values (reject anything else...)") — the surface an
   operator actually interacts with to *set* the key interactively.

Case observed (verify still present before acting — checked at the phase's landed worktree,
`skills/war-room/SKILL.md` step 2's run-bullet, still reads `run.roundLimit` (integer >= 1);
`run.afk` (bool); `run.ace` (bool ...)` with no fourth key listed): `run.redteamRoundLimit`
landed in surfaces 1 and (after a phase-close absorb) 2, but surface 4 was independently flagged
Minor by **three separate audit passes in the same phase** — the task-level audit, the
phase-integrated-tip gate-audit, and the phase-close polish's own audit — and stayed unfixed
through all three, each one re-filing the same finding as a follow-up rather than closing it.

## Why it's easy to miss

The config still **works** without the fourth touch: `war-config.mjs`'s `--fill-defaults` writes
the resolved value into the config file regardless of whether `/war-room` ever offered it, so
nothing breaks and no test goes red — the gap is pure discoverability (an operator can't grill
the new dimension interactively) and it survives because it doesn't trip any mechanical check.
The economy-preset pin (`redteamRoundLimit: 2`) compounds the miss: `/war-room`'s preset
description blurbs are a second, separate place the same value needs restating.

## How to apply

When a task's plan slice adds a `run.*` (or similarly operator-facing) config key, treat
`skills/war-room/SKILL.md` step 2's whitelist as a **mandatory** fourth file even if it's outside
the task's own `Files:` list — or, if genuinely out of slice, file the follow-up immediately
rather than letting successive audit rounds re-discover the same gap. A `git log -S<keyName>`
sweep across `skills/war-room/`, `skills/war/references/schemas.md`, and the consuming skill's
doc — not just `war-config.mjs` and its test — is the cheap check that would have caught this
before the first audit round, not the third.

> archived 2026-08-15: resolved — moved to archive
