---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [shell variable scope, unexpanded placeholder, cross-prompt state, rev-parse capture, literal dollar variable, global guard test, ensure-worktree]
  slug: tip-capture-scope-differs-between-provision-and-refine-loop
  phase: clandiso/p2a
  tags: 
    - war
    - workflow-template
    - prompt-engineering
    - placeholder-resolution
    - pattern
  files: 
    - skills/war/assets/workflow-template.js
    - skills/war/assets/workflow-template.test.mjs
  relates: 
    - "[[template-defers-runtime-values-to-agent-via-literal-placeholder]]"
  created: 2026-06-26
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Shell-captured $TIP is only in scope inside the Provision barrier — refine-loop must use ph.integrationBranch directly

## The fix (F10 / T4)

The bare `<integration-tip>` placeholder appeared in TWO places in `workflow-template.js` and required
DIFFERENT strategies to eliminate, because the shell variable captured in one prompt cannot span to another:

1. **Provision barrier (step 3)** — the emitted prompt now instructs the refiner agent to run:
   `TIP="$(git rev-parse <integrationBranch>)"` and each per-task `ensure-worktree` line
   references `"$TIP"`. This works because all ensure-worktree invocations happen in the SAME
   shell session as the capture step.

2. **Refine-loop rebase instruction** — the merge-task prompt (dispatched SEPARATELY from Provision,
   long after the Provision barrier has concluded) cannot reference `$TIP` — it is a different agent
   call with no shared shell state. The fix here is to use `ph.integrationBranch` directly (a concrete
   ref known statically to the template at JS evaluation time), not a captured shell variable.

## Why this matters / the gotcha

When a placeholder appears in more than one prompt, **do not assume the same fix applies everywhere**.
The right strategy depends on whether the two call-sites share a shell context:

- Same agent call (same shell session) → captured variable works.
- Separate agent calls (different sessions or sequential spawns) → the template must either inline a
  statically known JS value (like `ph.integrationBranch`) or emit a fresh capture instruction in each
  affected prompt.

Attempting to reuse a `$TIP` variable across agent calls would silently pass the literal string
`"$TIP"` to git (unexpanded), producing the same class of bug as the original bare placeholder.

## The guard test pattern

A **global guard** (`assert.ok(!allPromptText.includes('<integration-tip>'))`) that concatenates ALL
emitted prompt strings into one blob is the right coverage shape when a placeholder might exist in
multiple call-sites. It is cheaper to write than per-location tests and automatically catches new
occurrences added later. Write per-location positive assertions (e.g., `TIP=` present in Provision,
`integrationBranch` ref present in merge-task) as companions to distinguish what the correct
replacement looks like.

> archived 2026-07-21: resolved — moved to archive
