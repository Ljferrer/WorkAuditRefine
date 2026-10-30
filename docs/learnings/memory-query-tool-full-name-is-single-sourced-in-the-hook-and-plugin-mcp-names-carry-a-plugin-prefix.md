---
name: memory-query-tool-full-name-is-single-sourced-in-the-hook-and-plugin-mcp-names-carry-a-plugin-prefix
description: "The hook's MEMORY_TOOL line owns the full memory_query name, and the cards, the template and one test copy it"
metadata:
  node_type: memory
  type: project
  keywords:
    - MEMORY_TOOL
    - memory_query tool name
    - plugin MCP prefix
    - mcp__plugin_
    - memory-tool-name test
    - tools line
    - war-worker no tools line
    - single source
    - PIN-8
    - rename
  provenance: code-verified
  slug: memory-query-tool-full-name-is-single-sourced-in-the-hook-and-plugin-mcp-names-carry-a-plugin-prefix
  phase: "2026-10-27-memory-query-mcp-tool/phase-1 tasks 1.1, 1.2, 1.3"
  tags:
    - war
    - hooks
    - mcp
    - plugin
    - drift-guard
  created: 2026-10-27
  originSessionId: c3af584e-8b97-41a9-9abc-594c7cf1d33c
  modified: 2026-10-27T13:44:29.066Z
---

# One home for the `memory_query` tool name

**Name shape.** A server registered inline under `mcpServers` in `.claude-plugin/plugin.json` appears to seats as `mcp__plugin_<plugin>_<server>__<tool>`. For this plugin the full name is `mcp__plugin_work-audit-refine_war-memory__memory_query`. It is not `mcp__war-memory__memory_query`. The task 1.1 commit body records a live `claude --plugin-dir .` listing with that name. That is a worker report, so it is soft evidence, and no auditor re-ran it.

**One owner.** The hook `hooks/validate-evidence-auditor-mcp.sh` owns the literal on one single-quoted line, `MEMORY_TOOL='…'`. Every other surface copies it:
- the `tools:` line of the auditor, evidence auditor and servitor cards;
- the Prior-lessons sentence of the worker card (the worker card has no `tools:` line and inherits plugin MCP tools);
- the `MEMORY_TOOL` const in `skills/war/assets/workflow-template.js`.

`skills/war/assets/memory-tool-name.test.mjs` extracts the hook literal with `^MEMORY_TOOL='([^'$]+)'$`. It fails closed on zero or two such lines and asserts each copy. `skills/war/assets/workflow-template.test-harness.mjs` carries its own copy of that extractor, in `MEMORY_TOOL_LITERAL`. The two extractors once differed on `$`. Keep them in step.

**Hook behavior with that name.** The server segment is `plugin_work-audit-refine_war-memory`, which is not `rea`. The memory compare is an exact match and runs before the REA suffix path. So no canary line prints for it.

**How to apply.**
- To rename the plugin or the server, edit the hook line first, then run `memory-tool-name.test.mjs` and the hook test.
- The first 1.2 hook header cited the name test before it existed. Task 1.3 produced it. A forward reference across tasks in one phase is fine if the file exists at the landed tip.

**Locate-cue (verify still present before acting).** `hooks/validate-evidence-auditor-mcp.sh`, the `MEMORY_TOOL=` line. `.claude-plugin/plugin.json`, the `mcpServers` key `war-memory`. `skills/war/assets/memory-tool-name.test.mjs`, search `ES6`. Found at landed tip fcdc744e, read through the run's `_refinery` worktree (HEAD equal to the tip).

Related: [[standing-instruction-vs-dispatched-prompt-coverage-split]].
