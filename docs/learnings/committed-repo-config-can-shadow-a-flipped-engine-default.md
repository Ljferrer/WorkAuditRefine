---
name: committed-repo-config-can-shadow-a-flipped-engine-default
description: "A war-config.mjs DEFAULTS flip (e.g. run.roundLimit 3→6) lands correctly with its drift guard, but is inert for any run in a repo whose own committed .claude/war/config.json explicitly pins the old value — the committed config always wins over DEFAULTS, and the flip's practical effect starts at zero until the pin is also bumped"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: committed-repo-config-can-shadow-a-flipped-engine-default
  phase: "realized-absorb-rate/phase-1 task 1.2 (landed dev/2026-08-19-realized-absorb-rate, tip 291943e)"
  keywords: 
    - DEFAULTS.run.roundLimit
    - committed config.json shadow
    - .claude/war/config.json
    - default flip inert
    - war-config.mjs
    - config precedence
    - fallback drift guard
    - roundLimit 3 to 6
    - self-hosting repo config
  tags: 
    - war
    - engine
    - war-config
    - config-precedence
    - plan-design
  created: 2026-08-20
  originSessionId: d1c9bd01-e7da-46af-a12d-d59dbd7a69d1
  modified: 2026-08-20T08:52:30.053Z
---

# A landed engine-default flip can be silently shadowed by this repo's own committed config

**Found (code-verified — landed tip `291943e` on `dev/2026-08-19-realized-absorb-rate`, task 1.2,
verified in the phase's `_refinery` worktree):** task 1.2 flipped
`DEFAULTS.run.roundLimit` from `3` to `6` in `skills/war/assets/war-config.mjs`, with the
hand-mirrored fallback literal in `skills/war/assets/workflow-template.js`
(`const roundLimit = run.roundLimit ?? 6`) and the drift-guard test in `war-config.test.mjs`
("drift-guard: roundLimit fallback in workflow-template.js matches DEFAULTS.run.roundLimit") kept
in lock-step. But this repository's own committed `.claude/war/config.json` — the config this repo
uses to run its own `/war` phases — explicitly pins `"run": { "roundLimit": 3, ... }`. Explicit
config always wins over a code default, so **the flip has zero practical effect for any phase run
in this repo** until someone also bumps the committed pin. The flip is fully correct and tested for
every *other* repo/consumer that relies on the DEFAULTS fallback with no explicit override.

**Why this is a durable, reusable class:** any project that both (a) ships an engine/library with a
tunable default and (b) self-hosts by committing an explicit config file pinning that same knob
will have the two facts drift apart the moment the shipped default changes — a green
drift-guard test (which only checks default-vs-fallback-literal consistency) gives no signal about
this, because it never reads the committed config at all. The two are orthogonal: one guards
internal consistency of the *default*, the other is a per-repo *override* that supersedes it
silently.

**How to catch it:** whenever a plan or task changes a `DEFAULTS.*` value that has an env/repo-level
override mechanism, grep the repo's own committed config file for the same key before treating the
flip as effective locally — `grep roundLimit .claude/war/config.json` here. If the committed value
still pins the old default, either bump it in the same task (if in scope) or file a follow-up
(this phase filed one, #1564) rather than assuming End-state language like "the new default now
applies" is true for the self-hosting repo's own runs.

**Locate-cue (verify still present before acting):** `.claude/war/config.json`'s `run.roundLimit`
key (repo-relative from repo root); `skills/war/assets/war-config.mjs`'s `DEFAULTS.run.roundLimit`;
the drift-guard test `war-config.test.mjs` — none of these three currently cross-check the
committed pin against DEFAULTS.

## Related

[[new-run-config-knob-needs-war-room-whitelist-touch]] — a different but adjacent class: a new run
config knob needing a `/war-room` whitelist touch to be settable at all.
