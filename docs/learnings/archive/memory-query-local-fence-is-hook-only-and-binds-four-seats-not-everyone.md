---
name: memory-query-local-fence-is-hook-only-and-binds-four-seats-not-everyone
description: "SUPERSEDED at phase 2: the memory_query server now checks the local anchor itself, so every caller is fenced"
metadata:
  promoted: dev/2026-10-27-memory-query-mcp-tool@phase-2
  node_type: memory
  type: project
  keywords:
    - memory_query
    - local fence
    - memory_fence
    - LOCAL_ANCHOR
    - localPassesAnchor
    - query log append
    - war-memory-mcp
    - unhooked caller
    - main session
    - PIN-4
    - server-side anchor
    - superseded
    - memory root overclaim
    - string glob anchor
    - symlink not resolved
    - release blurb scope word
  provenance: code-verified
  slug: memory-query-local-fence-is-hook-only-and-binds-four-seats-not-everyone
  phase: "2026-10-27-memory-query-mcp-tool/phase-1 tasks 1.1, 1.2, 1.4; superseded at phase-2 task 2.1"
  tags:
    - war
    - hooks
    - mcp
    - memory
    - guard
    - superseded
  created: 2026-10-27
  originSessionId: c3af584e-8b97-41a9-9abc-594c7cf1d33c
  modified: 2026-10-29T05:59:22.815Z
---

# The `local` fence for `memory_query` now lives in the hook AND the server

**Supersession (phase 2, code-verified, wins over the phase-1 text).** Phase 1 recorded the fence as hook-only. An operator ruling on 2026-10-28 reversed plan decision D4, and phase 2 task 2.1 added the anchor to the server. The slug still says "hook-only" because the slug is the promotion key; read it as history. Now `appendQueryLogIfPresent` in `skills/_shared/war-memory-mcp.mjs` calls `localPassesAnchor` first. The rule matches the hook's `memory_fence`: `local` is absolute, has no `..` segment, and matches `*/.claude/projects/*/memory` with one trailing `/` tolerated (the `LOCAL_ANCHOR` regex, with the `s` flag so `.` spans line terminators like the bash glob `*`). So the main session and non-WAR agents, which the hook's `*) exit 0` arm still passes, cannot append the query log outside a path of that shape. A refused append never fails the query, and the server still never creates a directory (PIN-4).

**Two homes for one rule.** The hook and the server each hold the pattern, so they can drift. The first server regex lacked the `s` flag and refused a newline path that the hook allowed (fail-safe; a fix round closed it). If you edit one copy, edit the other and the `RA1` test row in the same commit.

**Live residual.** The `TOOL.description` string in the server still says the log line is appended "only when `local` names an existing directory". It omits the anchor. The text is true as a necessary condition, and no test reads it. It is model-visible through `tools/list`.

**Doc trap (still valid).**
- The `CLAUDE.md` Guard architecture clause says the hook denies a bad `local` for the four memory-tool seats. A `..` segment is the part that binds everyone.
- The refiner gets no prefetch block and no memory tool.
- Describe the fence as a value that **matches** the memory-root glob, not one that sits **under** it. The hook denies a path beneath the memory dir unless its last segment is again `memory`.

**Scope word: "of that shape", not "a memory root".** Both anchors are string matches. A memory-shaped path under any root passes, for example `/tmp/x/.claude/projects/s/memory`. Neither anchor resolves a symlink. The phase-3 Release audit flagged the README `## Status` blurb and the CHANGELOG 0.21.20 entry for saying "cannot log outside a memory root", and both were fixed to "a path of that shape" before land. The fix did not reach two sibling surfaces: `docs/adr/0002-scope-by-agent-type.md` (the memory-query amendment, "No-seat-write rule" bullet) still says "cannot log outside a memory root", and `TOOL.description` still omits the anchor. Fix a scope-word overclaim on every surface that restates the guard. ADR 0002 is append-only, so a correction there needs a dated amendment note.

**How to apply.**
- Do not describe the fence as hook-only.
- When you write a doc clause about this fence, name the four seats for the hook and "every caller" for the server append.
- Same family: [[release-blurb-overstates-guard-semantics]]. See also [[an-early-exit-guard-added-under-existing-tests-hollows-their-negative-assertions]].

**Locate-cue (verify still present before acting).** `skills/_shared/war-memory-mcp.mjs`: the `LOCAL_ANCHOR` constant, `localPassesAnchor`, and the `appendQueryLogIfPresent` function. `hooks/validate-evidence-auditor-mcp.sh`: the `memory_fence` function. `skills/_shared/war-memory-mcp.test.mjs`: the `RA1:` row.

Related: [[bash-case-glob-path-fence-needs-an-absolute-prefix-arm-and-its-star-spans-slash]], [[evidence-mcp-hook-checks-tool-names-only-so-foreign-server-suffix-and-output-directory-writes-pass]].

> archived 2026-11-10: resolved — moved to archive
