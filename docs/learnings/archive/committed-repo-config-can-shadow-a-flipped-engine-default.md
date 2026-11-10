---
name: committed-repo-config-can-shadow-a-flipped-engine-default
description: "A flipped DEFAULTS value has no effect in a repo whose committed config pins the old value; grep the committed config before calling the flip effective"
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

**Rule:** explicit config always wins over a code default. When a task changes a `DEFAULTS.*` value
that has a repo-level override, grep the repo's own committed config for the same key before
treating the flip as effective locally.

**Instance:** `DEFAULTS.run.roundLimit` was flipped from `3` to `6` in
`skills/war/assets/war-config.mjs` (with the `workflow-template.js` fallback literal and its
drift-guard test in lock-step), while this repo's committed `.claude/war/config.json` still pinned
`"roundLimit": 3`, so the flip had zero effect on this repo's own `/war` runs.

**Why this is a durable, reusable class:** any project that both (a) ships an engine/library with a
tunable default and (b) self-hosts by committing an explicit config file pinning that same knob
will have the two facts drift apart the moment the shipped default changes — a green
drift-guard test (which only checks default-vs-fallback-literal consistency) gives no signal about
this, because it never reads the committed config at all. The two are orthogonal: one guards
internal consistency of the *default*, the other is a per-repo *override* that supersedes it
silently.

**How to catch it:** `grep roundLimit .claude/war/config.json` here. If the committed value still
pins the old default, either bump it in the same task (if in scope) or file a follow-up, rather
than assuming End-state language like "the new default now applies" is true for the self-hosting
repo's own runs.

**Locate-cue (verify still present before acting):** `.claude/war/config.json`'s `run.roundLimit`
key (repo-relative from repo root); `skills/war/assets/war-config.mjs`'s `DEFAULTS.run.roundLimit`;
the drift-guard test `war-config.test.mjs` — none of these three currently cross-check the
committed pin against DEFAULTS.

## Related

[[new-run-config-knob-needs-war-room-whitelist-touch]] — a different but adjacent class: a new run
config knob needing a `/war-room` whitelist touch to be settable at all.

> archived 2026-08-30: resolved — moved to archive
