---
name: bash-case-glob-path-fence-needs-an-absolute-prefix-arm-and-its-star-spans-slash
description: "A bash case glob like */.claude/projects/*/memory admits a relative x/.claude/... path and a nested memory/archive/memory path"
metadata:
  node_type: memory
  type: project
  keywords:
    - bash case glob
    - path fence
    - relative path bypass
    - star spans slash
    - memory_fence
    - absolute path arm
    - dot-dot segment
    - jq has presence
    - hook test label
  provenance: code-verified
  slug: bash-case-glob-path-fence-needs-an-absolute-prefix-arm-and-its-star-spans-slash
  phase: 2026-10-27-memory-query-mcp-tool/phase-1 task 1.2
  tags:
    - war
    - hooks
    - bash
    - guard
    - testing
  created: 2026-10-27
  originSessionId: c3af584e-8b97-41a9-9abc-594c7cf1d33c
  modified: 2026-10-27T13:44:21.805Z
---

# A `case` glob is not a path anchor

**Two traps in `*/.claude/projects/*/memory`.**
1. The leading `*` matches any prefix, a relative one too. The value `x/.claude/projects/s/memory` passes the glob. A server that stats and appends against its own cwd then writes in a cwd-relative directory.
2. In a bash `case` pattern, `*` also matches `/`. The value `/a/.claude/projects/s/memory/archive/memory` passes, because its last segment is again `memory`. A comment that says "a path beneath the memory dir is denied" overclaims. The true rule is "denied unless the last segment is `memory` again".

**What the hook does about it.** `memory_fence` runs three checks in order before the glob:
- A `..` check on the value wrapped in `/`, so `case "/$val/" in *"/../"*` sees a leading or trailing `..` as a segment.
- An absolute-path arm, `/*) ;;` with a deny on anything else.
- Only then the glob, with one trailing `/` tolerated.

The key is read by presence, `has("local")` plus a `type` check, never by `jq -r '.x // empty'`. A present empty, `null`, `false`, number, array or object `local` is denied. See [[jq-empty-fallback-folds-false-null-and-empty-so-a-presence-gate-needs-has-and-a-type-check]].

**Test-label trap.** The first test row named "relative local denied" used `.claude/projects/s/memory`. That value has no leading component, so it never reached the bypass. A fix round added rows for `x/.claude/projects/s/memory` (auditor and worker) and for the nested case. When you pin a fence, put the bypass shape in the row, not just the word in the label.

**How to apply.**
- If you add a glob-based path fence in a hook, add an explicit absolute-prefix arm and a `..` segment check before it.
- Test each of: relative with a leading component, nested path ending in the anchor segment, trailing slash, `..` at the start, middle and end.
- Describe the rule as "matches", not "is under".

**Locate-cue (verify still present before acting).** `hooks/validate-evidence-auditor-mcp.sh`, the `memory_fence` function. `hooks/validate-evidence-auditor-mcp.test.sh`, search `relative local with a leading component denied` and `beneath the memory root denied`. Found at landed tip fcdc744e, read through the run's `_refinery` worktree (HEAD equal to the tip).

Related: [[memory-query-local-fence-is-hook-only-and-binds-four-seats-not-everyone]].
