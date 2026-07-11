---
name: curried-inline-mirror-needs-adapter-shim-in-registry-row
description: "Mirror-registry row for a curried inline fn must adapt its call shape to canonical signature"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: curried-inline-mirror-needs-adapter-shim-in-registry-row
  phase: drift-guards-for-mirrored-and-asserted-facts/t1.5
  keywords: 
    - curried function
    - mirror registry
    - spawnOpts
    - closure
    - adapter shim
    - behavioral equivalence test
    - workflow-template
    - inline sandbox
  tags: 
    - war
    - drift-guard
    - test-design
    - workflow-template
  files: 
    - skills/war/assets/workflow-template.test.mjs
  relates: 
    - "[[mirror-registry-verification-mode-by-construct-kind]]"
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# A curried inline mirror needs its registry row to adapt the call, not just re-invoke both sides identically

**Found (code-verified — `skills/war/assets/workflow-template.test.mjs`, MIRROR_REGISTRY row
`'spawnOpts (inline curried spawn=role=>…)'`, ~line 5151; verify still present before acting):**
the Workflow sandbox's inline `spawn` is a **curried** `role => { … }` closing over the sandbox's
own `agents` free variable (it can't import `spawnOpts` from `war-config.mjs`, so it hand-copies
the logic and closes over local state instead of taking `agents` as a parameter). The canonical
export, `spawnOpts(config, role)`, takes `{ agents }` as an explicit first argument — a **different
signature shape** for the same behavior.

A naive registry row (`inline: (args) => inline.spawn(...args), canonical: (args) =>
spawnOpts(...args)`) would either not compile (arity mismatch) or silently compare the wrong
things. The actual row instead defines two lambdas with **matching test-fixture args but
diverging call shapes**:
```js
inline: ([agents, role]) => inlineHelpers(agents).spawn(role),      // curried: agents to the factory, role to the call
canonical: ([agents, role]) => spawnOpts({ agents }, role),          // canonical: agents wrapped into config, both at once
```
Both are driven off the *same* `[agents, role]` fixture tuple (`AGENTS_FIXTURES.flatMap(a =>
ROLES.map(r => [a, r]))`), so the registry's uniform `assert.deepEqual(row.inline(args),
row.canonical(args), …)` loop still works — the adaptation lives entirely in the two per-row
lambdas, not in the loop.

**Why this matters:** when a sandbox mirror is curried or closure-shaped for a reason the
canonical export isn't (the sandbox has no module scope to hold shared state, so it closes over
locals instead of taking them as params), a registry row that assumes "same function shape on
both sides" either fails to build or asserts nothing meaningful. The fix is always at the row
level: write a small adapter lambda per side that reshapes the SAME fixture input into each
side's actual call convention, then compare outputs.

**How to apply:** before adding a behavioral-mode registry row for an inline mirror, read both call
sites first — the inline sandbox factory signature AND the canonical export signature — and note
where they diverge (currying, argument wrapping, extra closed-over free variables). Write the two
adapter lambdas to bridge that divergence explicitly; don't assume a shared fixture tuple can be
spread identically into both calls.
