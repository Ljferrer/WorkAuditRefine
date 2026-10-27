---
name: mcp-server-must-probe-node-sqlite-before-importing-war-memory-or-a-node-below-24-kills-it
description: "war-memory.mjs exits the process when node:sqlite fails to import, so the MCP server probes sqlite first and stays up"
metadata:
  node_type: memory
  type: project
  keywords:
    - node:sqlite probe
    - Node below 24
    - memory disabled
    - war-memory.mjs process.exit
    - dynamic import
    - load order
    - test seam
    - WAR_MEMORY_MCP_SQLITE_MODULE
    - fail open
    - ES4
  provenance: code-verified
  slug: mcp-server-must-probe-node-sqlite-before-importing-war-memory-or-a-node-below-24-kills-it
  phase: 2026-10-27-memory-query-mcp-tool/phase-1 task 1.1
  tags:
    - war
    - memory
    - mcp
    - node
    - testing
  created: 2026-10-27
  originSessionId: c3af584e-8b97-41a9-9abc-594c7cf1d33c
  modified: 2026-10-27T13:44:36.024Z
---

# Probe `node:sqlite` before you import `war-memory.mjs`

**The trap.** `skills/_shared/war-memory.mjs` awaits `import('node:sqlite')` at module load. On failure it writes one line to stderr and calls `process.exit(1)`. A server that imports it with a static `import` dies on Node below 24, before it can answer `initialize`.

**The load order in the server.**
1. `loadMemory()` awaits `import(SQLITE_MODULE)` in its own `try`. On failure it returns `null`.
2. Only after the probe succeeds does it `await import('./war-memory.mjs')`, in a second `try`.
3. When `mem` is `null`, `runMemoryQuery` returns a `memory disabled` text result for every call, and the process keeps serving `initialize`, `tools/list` and `tools/call`.

The disabled check runs before argument validation. A malformed call on a sqlite-less runtime gets the disabled text, not an argument error. An audit round flagged the original order as a gap against the plan wording.

**Test seam.** The env var `WAR_MEMORY_MCP_SQLITE_MODULE` names the module the probe imports. Unset or empty means `node:sqlite`. A test names a missing module and forces the disabled path on a Node that has sqlite, with no second Node install. Test `ES4` does this and then sends `tools/list` to the same process. A paired test checks that with the variable unset the server loads the real module and answers.

**Importing is safe.** The `war-memory.mjs` main guard compares the real path of `argv[1]`, so importing the module does not start its CLI.

**How to apply.** If you add another entry point that imports `war-memory.mjs`, probe sqlite first, or accept that it exits the host process on old Node.

**Locate-cue (verify still present before acting).** `skills/_shared/war-memory-mcp.mjs`, the `loadMemory` function and the `SQLITE_MODULE` const. `skills/_shared/war-memory.mjs`, the `NODE_LT_24_MSG` block near the top. `skills/_shared/war-memory-mcp.test.mjs`, search `ES4:`. Found at landed tip fcdc744e, read through the run's `_refinery` worktree (HEAD equal to the tip).
