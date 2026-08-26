---
name: undefined-check-config-validator-rejects-null-despite-null-equals-absent-convention
description: "war-config.mjs's overrides.* block treats explicit null as the conventional unset value, but a new run.* key validated via `!== undefined` hard-rejects `null` — plan prose naming 'absent/null' as equivalent can silently diverge from the actual validator"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - war-config.mjs
    - validate
    - run.maxParallel
    - null vs undefined
    - config validation
    - overrides convention
    - explicit unset
    - Pivotal constraints
  provenance: code-verified
  slug: undefined-check-config-validator-rejects-null-despite-null-equals-absent-convention
  phase: 2026-08-25-engine-reliability-and-filing-fidelity/Phase 1 (task 1.2)
  tags: 
    - war
    - war-config
    - validation
    - plan-design
  created: 2026-08-25
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-26T06:35:24.371Z
---

# A new `run.*` key's `!== undefined` guard can reject the `null` the plan's own prose calls equivalent to absent

**Found (code-verified at landed tip `6cfe09a2a475755010c98446389e706171f36c65` on
`dev/2026-08-25-engine-reliability-and-filing-fidelity`, worktree
`.claude/war-worktrees/2026-08-25-engine-reliability-and-filing-fidelity-2026-08-26/_refinery`):**
`skills/war/assets/war-config.mjs:217` validates the new `run.maxParallel` key with
`c.run.maxParallel !== undefined && (!Number.isInteger(...) || ... < 1)` — so
`{ run: { maxParallel: null } }` produces a hard validation error (`null` is not `undefined`, and
`Number.isInteger(null)` is `false`). This is a **faithful** implementation of the task's own slice
literal ("when present, integer >= 1, else an error naming the key"), so it is not a defect in that
task. But this plan's Pivotal constraints and the sibling engine-side task's slice both phrase the
knob's off-state as **"absent/null"** interchangeably, and `war-config.mjs`'s own `overrides.*`
block (`gate`/`workingBranch`/`landingBranch`/`learningsTarget`/`testPattern`) uses explicit `null`
as the established convention for "operator explicitly left this unset". A hand-written or
future-tooling-written config using `null` for `run.maxParallel` — matching that sibling
convention — hard-fails validation instead of meaning unthrottled.

## The durable rule

When plan prose (Pivotal constraints, task slices) describes a new config key's off-state as
**"absent/null"**, don't assume the validator accepts both — check whether the guard is
`!== undefined` (accepts only true absence) or `!= null` (accepts both `undefined` and explicit
`null`). This codebase has **two live conventions in the same file** (`war-config.mjs`):
`overrides.*` keys treat `null` as the conventional explicit-unset value; a newly-added `run.*`
scalar key guarded by `!== undefined` does not. Before shipping a new optional numeric/scalar
`run.*` key, decide explicitly which convention it should follow and say so in the plan slice —
otherwise a downstream consumer (a `/war-room` question, a hand-edited config, or a future
override-authoring tool) can silently pick the wrong one and get a hard validation failure instead
of the intended pass-through-as-unset behavior. In this repo the guardrail (`run.maxParallel`
absent ⇒ byte-identical fan-out) is fully held regardless — the gap is only in `null` handling,
which no test row and no doc surface currently commits to either way.

**Locate-cue (verify still present before acting):** the guard at
`skills/war/assets/war-config.mjs:217` (search `run.maxParallel must be an integer`); the
`overrides.*` null-as-unset convention documented in `skills/war-room/SKILL.md`'s override bullets
(`gate` / `workingBranch` / `landingBranch` / `learningsTarget` / `testPattern`).
