---
name: js-inner-function-param-shadows-outer-const-same-name
description: "Inner-function param reusing an outer const's name is a latent rename trap, harmless today"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: js-inner-function-param-shadows-outer-const-same-name
  phase: red-team-plan-vs-state-grading-and-probe-sandboxing/t1.1
  keywords: [shadowing, param shadows const, rename trap, closure, destructured const, workflow-scaffold.js, futureWorkRule, javascript gotcha]
  tags:
    - javascript
    - gotcha
    - code-quality
    - naming
  created: 2026-07-10
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# An inner function's parameter shadowing an outer const of the same name is a latent rename trap

## The pattern
`const futureWorkRule = (technique, artifactKind) => {...}` took a parameter named `artifactKind`
that shadows a module-level destructured `const artifactKind` in the same file. The single call
site happened to pass that same module const back in, so today it's semantically a no-op — but the
duplicate name means a future edit that renames the destructure (or the param) without touching the
other silently changes what value flows through the closure, with no error and no obviously-wrong
diff. Graded Nit — harmless today, purely a future-maintenance hazard.

**Anchor (by construct):** `const futureWorkRule = (technique, artifactKind) => {...}` in
`skills/red-team/assets/workflow-scaffold.js` takes a param `artifactKind` that shadows the
module-level destructured `const artifactKind` (from the `A` destructure). The sole call site
passes that module const straight back in — `futureWorkRule(p.technique, artifactKind)` — so it is
a no-op today. Re-anchor by the `futureWorkRule` name, not a line number.

## How to apply
When reviewing a new inner function whose parameter name matches an outer (module- or
closure-scope) binding of the same name, treat it as a Nit-worthy latent trap even if the current
call site passes the same value through — either close over the outer binding directly (drop the
param) or give the param a distinct name so a future rename of either binding can't silently swap
which value is in scope.

> archived 2026-07-11: resolved — moved to archive
