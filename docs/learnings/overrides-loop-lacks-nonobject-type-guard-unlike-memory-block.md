---
name: overrides-loop-lacks-nonobject-type-guard-unlike-memory-block
description: "war-config.mjs validate()'s overrides loop has no isObj guard, unlike the memory.* block right above it — a hand-edited overrides: null crashes with an uncaught TypeError instead of a clean validation error"
metadata:
  type: project
  provenance: code-verified
  slug: overrides-loop-lacks-nonobject-type-guard-unlike-memory-block
  phase: target-repo-agnostic-execution/p1t1
  keywords:
    - war-config.mjs
    - validate
    - overrides
    - TypeError
    - isObj guard
    - non-object guard
    - Object.keys(null)
    - hand-edited config
    - testPattern hardening
    - pre-existing gap
  tags:
    - war-config
    - validation
    - defensive-coding
  created: 2026-07-07
---

# `validate()`'s overrides loop can throw instead of returning a clean error

**Confirmed at `skills/war/assets/war-config.mjs`** (verified in the p1t1 task worktree,
`.claude/teams/2026-07-07-target-repo-agnostic-execution/worktrees/2026-07-07-target-repo-agnostic-execution/p1t1/skills/war/assets/war-config.mjs:161`
— verify still present before acting): the overrides validation loop

```js
for (const k of Object.keys(c.overrides)) { ... }
```

has no object-type guard. The `memory.*` block immediately above it (`if (!isObj(mem)) { errors.push(...) }`)
guards exactly this case. `deepMerge` preserves an explicit `overrides: null` from a hand-edited
config, so `Object.keys(null)` throws an uncaught `TypeError` instead of returning
`{valid:false, errors}`. `validate()`'s only caller, the CLI `main()`, does not wrap the call in
try/catch, so `node war-config.mjs badconfig.json` crashes with a raw stack trace rather than a
clean "invalid config" message.

**Status:** pre-existing (not introduced by p1t1's `overrides.testPattern` hardening, which added
the `KNOWN_OVERRIDES` courtesy-error check and the glob-safe charset check for `testPattern`,
both correct) and out of that task's plan slice. Routed `note`/Minor by the p1t1 audit — flagged
because the task touches this exact loop and claims to mirror the `memory.*` precedent, whose most
prominent feature is the guard this loop lacks.

**How to apply:** in a future hardening pass, add `if (!isObj(c.overrides)) { errors.push('overrides must be an object'); }`
before the loop, mirroring the `memory` block, plus a `validate({overrides: null})` regression case
(and ideally `validate({overrides: 'x'})`).
