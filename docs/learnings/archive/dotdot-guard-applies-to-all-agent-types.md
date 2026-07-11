---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [path traversal, pre-case placement, fail-open, back-compat test, validate-worktree-scope, exit 2 deny, universal vs scoped]
  slug: dotdot-guard-applies-to-all-agent-types
  phase: 1b (F06 ..-rejection)
  severity: Minor
  tags: 
    - scope-hook
    - agent-type
    - behavior-change
    - faithful-deviation
  related: "[[scope-hook-servitor-pattern-residuals]], [[scope-guard-needs-agent-type]]"
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# A guard placed before `case "$atype"` constrains ALL agent types

## The rule

A path-safety `case` (e.g. `*/../*|*/..` rejection) placed BEFORE the `case "$atype"` dispatch in a
scope hook runs for **every** agent type — including fail-open ones (refiner, main-session). That is
a back-compat behavior change: a Write/Edit/NotebookEdit whose path contains `/../` now exits 2 (deny)
where it previously succeeded. Blast radius is small (those three tools only; Claude Code normally
emits canonical absolute paths), but the deviation is real and easy to ship by following plan wording
literally ("place it before the per-agent checks").

## How to apply

When adding a path-safety guard to a scope hook with agent-type dispatch, decide consciously:
- **Universal** (the chosen case here): add a hook-header comment stating the intent.
- **Agent-scoped**: place it INSIDE the relevant `case` branch.
- Either way, add a back-compat test asserting the previously-fail-open paths still exit 0.

Instance resolved (1b): the guard lives pre-`case` in `hooks/validate-worktree-scope.sh`; the
`INTENTIONALLY pre-case ... applies to ALL agent types` header comment named in this rule is now present.

> archived 2026-07-11: resolved — moved to archive
