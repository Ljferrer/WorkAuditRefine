---
name: js-inner-function-param-shadows-outer-const-same-name
description: "An inner arrow function's parameter reusing an outer module-scope const's name is a latent rename trap, even when harmless today"
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

**Referent not verified in this checkout** @ phase red-team-plan-vs-state-grading-and-probe-sandboxing
(worktree predates that branch's merge — `futureWorkRule` does not exist in this checkout's
`workflow-scaffold.js`) — verify `skills/red-team/assets/workflow-scaffold.js` before citing the
exact line/shape.

## How to apply
When reviewing a new inner function whose parameter name matches an outer (module- or
closure-scope) binding of the same name, treat it as a Nit-worthy latent trap even if the current
call site passes the same value through — either close over the outer binding directly (drop the
param) or give the param a distinct name so a future rename of either binding can't silently swap
which value is in scope.
