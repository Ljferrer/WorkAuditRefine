---
name: template-defers-runtime-values-to-agent-via-literal-placeholder
description: "workflow-template.js has no shell — emit agent-resolved $VAR placeholders"
metadata: 
  node_type: memory
  type: project
  keywords: [no shell sandbox, $TIP capture, angle bracket token, deferred resolution, git rev-parse, unresolved variable, prompt emits shell var]
  provenance: code-verified
  slug: template-defers-runtime-values-to-agent-via-literal-placeholder
  phase: 3
  tags: 
    - war
    - workflow-template
    - prompt-engineering
    - pattern
    - no-shell
  files: 
    - skills/war/assets/workflow-template.js
  relates: 
    - "[[provision-barrier-refiner-owned-not-worker-self-create]]"
  created: 2026-06-25
  originSessionId: 53421d17-5351-48da-baf8-7d315d56c7b5
---

# The Workflow template has no shell/fs — runtime values are passed as literal placeholders for the AGENT to resolve

## The pattern

`workflow-template.js` runs in a sandbox with **no shell and no filesystem**. When a prompt needs a
value that can only be computed at runtime (e.g. the integration branch tip), the template does NOT
try to compute it — it emits a literal token and instructs the spawned agent to resolve it.

Concrete case (Provision barrier): the per-task ensure-worktree lines (the `ensures`
map in the Provision barrier) pass a shell var the agent captures, not a value the
template computes:

```js
const ensures = tasks.map(t =>
  `   provision-worktrees.sh ensure-worktree ${t.worktree} ${t.branch} "$TIP"${reclaimFlag}`).join('\n')
```

and the surrounding prompt tells the refiner agent (step 3) to first capture
`TIP="$(git rev-parse ${ph.integrationBranch})"` and use *that* captured tip. The `"$TIP"`
in the per-task lines is resolved by the agent at runtime, not a value the template
passes to the script.

## Why it matters / the gotcha

- This is the intended pattern for any value the template cannot compute statically: defer to
  the agent, never fake it. Never use a bare angle-bracket placeholder (`<integration-tip>`) among
  resolved values; the agent can pass the literal string.
- Caveat: an agent shell does not carry a variable across Bash calls (#2038, the comment above
  `ABSORB_CHARGE_READ`). An unset `$TIP` can resolve to a plausible wrong value. Prefer an inline
  `$(git ... rev-parse ...)` in the command itself, as `tipWorktreeProvision` does, or one bash call
  that sets and uses the variable. Name the integration branch literally.
- Corollary: the per-phase gate is likewise a shell command run by agents, never by this script.

Locate-cue: `const ensures` in the Provision barrier and `const tipWorktreeProvision` in
`skills/war/assets/workflow-template.js`.
