---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [no shell sandbox, $TIP capture, angle bracket token, deferred resolution, git rev-parse, unresolved variable, prompt emits shell var]
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
  `   provision-worktrees.sh ensure-worktree ${t.worktree} ${t.branch} "$TIP"`).join('\n')
```

and the surrounding prompt tells the refiner agent (step 3) to first capture
`TIP="$(git rev-parse ${ph.integrationBranch})"` and use *that* captured tip. The `"$TIP"`
in the per-task lines is resolved by the agent at runtime, not a value the template
passes to the script.

## Why it matters / the gotcha

- This is the **intended** pattern for any value the template can't compute statically — defer to
  the agent, don't fake it. Reach for it when adding new script-invoking prompts.
- The current code threads it through a shell var (`"$TIP"`, captured in step 3) sitting next to
  fully-resolved absolute paths (`${t.worktree}`, `${t.branch}`). This works because the prompt
  explicitly tells the agent to set `TIP` first. The earlier bare-angle-bracket form
  (`<integration-tip>`) was ambiguous — a placeholder adrift among resolved values risks the agent
  passing the literal string. If you add such a deferred value, phrase the per-task line to
  reference a named, agent-captured token (a `$VAR` set in an earlier step), never a bare
  angle-bracket placeholder.
- Corollary: the per-phase **gate** is likewise a shell command run *by agents*, never by this
  script — same no-shell constraint.
