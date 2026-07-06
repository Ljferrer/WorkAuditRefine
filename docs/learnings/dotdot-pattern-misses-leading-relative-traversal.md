---
name: ""
metadata: 
  node_type: memory
  type: project
  keywords: [parent directory escape, case statement glob, sandbox escape, directory climbing, false negative, equivalence class]
  slug: dotdot-pattern-misses-leading-relative-traversal
  phase: 1b (F06 ..-rejection)
  severity: Nit
  tags: 
    - scope-hook
    - glob-pattern
    - path-traversal
    - coverage-gap
  related: "[[scope-hook-servitor-pattern-residuals]], [[dotdot-guard-applies-to-all-agent-types]]"
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# `*/../*|*/..` pattern does not match a leading `../` relative traversal

## What happened

The `..` rejection case uses the shell glob pattern `*/../*|*/..`.

This catches:
- Embedded traversal: `/x/docs/learnings/../../etc/foo` (matches `*/../*`)
- Trailing traversal: `/x/docs/learnings/..` (matches `*/..`)

It does NOT catch:
- Leading relative traversal: `../etc/foo` (no preceding `/` before `..`)
- Bare `..` with no path component

## Why it is harmless here (but still a gap)

For the gated branches in this hook:
- A leading-`../` servitor path fails the learnings glob and is denied anyway.
- A leading-`../` worker path is denied by the existing relative-path / ancestor-walk logic.

The plan's threat model is the absolute-path embedded-`..` escape, which IS caught.

The pattern is also correctly low-false-positive: filenames containing dots (e.g.
`foo..bar`, `..bar`) are NOT rejected because they lack the `/../` or trailing `/..`
segment structure.

## Reuse guidance

When writing a shell case pattern to reject ALL `..`-based path traversal, use the
full equivalence class:

```sh
".." | "../*" | *"/../"* | *"/.." )
```

Or equivalently in a `case` statement:
```sh
".." | ../* | */../* | */..)
```

The plan's simpler `*/../*|*/..` is correct for the absolute-path threat model but
silently omits leading-relative paths. If the scope context already denies relative
paths through another mechanism, the narrow pattern is acceptable — document why.
