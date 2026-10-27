---
name: hand-written-stdio-mcp-server-must-not-process-exit-on-stdin-close-and-closes-what-the-cli-leaks
description: An explicit process.exit in a stdin close handler can drop a queued reply on macOS pipes
metadata:
  node_type: memory
  type: project
  keywords:
    - stdio MCP server
    - process.exit close handler
    - readline close
    - queued reply dropped
    - macOS pipe async stdout
    - in-memory database close
    - protocolVersion echo
    - JSON-RPC
    - drain test
    - exitCode
  provenance: agent-unverified
  slug: hand-written-stdio-mcp-server-must-not-process-exit-on-stdin-close-and-closes-what-the-cli-leaks
  phase: 2026-10-27-memory-query-mcp-tool/phase-1 task 1.1
  tags:
    - war
    - mcp
    - node
    - stdio
    - testing
  created: 2026-10-27
  originSessionId: c3af584e-8b97-41a9-9abc-594c7cf1d33c
  modified: 2026-10-27T13:45:35.067Z
---

# Framing pitfalls for a hand-written stdio MCP server

*Audit findings resolved in fix rounds before land — recorded as patterns, not live instances. The protocolVersion residual below was read live at the landed tip.*

**1. No `process.exit` in the stdin close handler.** The first draft had `rl.on('close', () => process.exit(0))`. On macOS, `process.stdout` writes to a pipe are asynchronous. A client that writes a request and closes stdin at once, for example `printf ... | node server.mjs`, can lose the last queued reply. The fix deleted the handler. Once stdin ends and no handle remains, Node exits after stdout drains. A replacement `process.exitCode = 0` handler was also flagged: it does nothing, so delete it and keep the comment. The oracle is a protocol test that sends 500 requests, closes stdin, and asserts exit 0 plus every reply. Its comment records that with the handler in place only 74 of 500 replies arrived on macOS.

**2. Close what the one-shot CLI leaks.** `runMemoryQuery` builds an in-memory FTS5 `DatabaseSync` on every `tools/call`. The CLI never closes it, because the CLI exits after one query. A long-lived server would hold one database per call until garbage collection. The fix wraps the rank step in `try { … } finally { db.close() }`. Check any CLI idiom that relies on process exit before you reuse it in a server loop.

**3. Accepted residual: `initialize` echoes the requested version.** The server returns `requested ?? DEFAULT_PROTOCOL_VERSION`, so it claims any version string a client sends. MCP expects a version the server supports. The tools surface is the same across 2024-11-05, 2025-03-26 and 2025-06-18, and Claude Code works. Three audit rounds noted it and none held the task. Change it only if a client rejects the echo.

**How to apply.** A notification (a message with no `id`) gets no reply. Keep the arm that returns early for it.

**Locate-cue (verify before acting).** `skills/_shared/war-memory-mcp.mjs`, the `initialize` case in `handle`, the `finally { db.close() }` block in `runMemoryQuery`, and the closing comment about `process.exit`. `skills/_shared/war-memory-mcp.test.mjs`, search `exits 0 on its own and every reply arrives`. Seen in the fixed form at landed tip fcdc744e, read through the run's `_refinery` worktree.
